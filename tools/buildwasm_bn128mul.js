const bigInt = require("big-integer");
const ModuleBuilder = require("wasmbuilder");
const buildF1m = require("../src/build_f1m.js");
const buildF2m = require("../src/build_f2m.js");
const buildF1 = require("../src/build_f1.js");
const buildCurve = require("../src/build_curve.js");
const buildTest = require("../src/build_testg1");
const buildFFT = require("../src/build_fft");
const buildMultiexp = require("../src/build_multiexp");
const buildPol = require("../src/build_pol");
const utils = require("../src/utils");
const fs = require("fs");
const path = require("path");

function buildWasm() {

    const q = bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
    const r = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    
    /*
    it("It should timesScalar G1", async () => {
        const bn128 = await buildBn128();
        const refD = refBn128.G1.mulScalar(refBn128.g1, 55);

        const p1 = bn128.g1_allocPoint(refBn128.g1);
        bn128.g1_toMontgomery(p1, p1);

        const s = bn128.allocInt(55);
        bn128.g1_timesScalar(p1, s, 32, p1);

        bn128.g1_fromMontgomery(p1, p1);
        const d = bn128.g1_getPoint(p1);

        for (let i=0; i<3; i++) {
            d[i] = refBigInt(d[i].toString());
        }

        assert(refBn128.G1.equals(d, refD));
    });
    */

/*

async function build() {
    const bn128 = new Bn128();

    bn128.q = bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
    bn128.r = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    bn128.n64 = Math.floor((bn128.q.minus(1).bitLength() - 1)/64) +1;
    bn128.n32 = bn128.n64*2;
    bn128.n8 = bn128.n64*8;

    bn128.memory = new WebAssembly.Memory({initial:10000});
    bn128.i32 = new Uint32Array(bn128.memory.buffer);

    const moduleBuilder = new ModuleBuilder();
    moduleBuilder.setMemory(10000);
    buildF1m(moduleBuilder, bn128.q, "f1m");
    buildF1(moduleBuilder, bn128.r, "fr", "frm");
    buildCurve(moduleBuilder, "g1", "f1m");
    buildMultiexp(moduleBuilder, "g1", "g1", "f1m", "fr");
    buildFFT(moduleBuilder, "fft", "frm");
    buildPol(moduleBuilder, "pol", "frm");

    const pNonResidueF2 =  moduleBuilder.alloc(
        utils.bigInt2BytesLE(
            bigInt("15537367993719455909907449462855742678907882278146377936676643359958227611562"), // -1 in montgomery
            bn128.n8
        )
    );

    buildF2m(moduleBuilder, pNonResidueF2, "f2m", "f1m");
    buildCurve(moduleBuilder, "g2", "f2m");
    buildMultiexp(moduleBuilder, "g2", "g2", "f2m", "fr");

    buildTest(moduleBuilder);

    const code = moduleBuilder.build();

    const wasmModule = await WebAssembly.compile(code);

    bn128.instance = await WebAssembly.instantiate(wasmModule, {
        env: {
            "memory": bn128.memory
        }
    });

    bn128.pq = moduleBuilder.modules.f1m.pq;
    bn128.pr = moduleBuilder.modules.frm.pq;

    bn128.pg1 = bn128.g1_allocPoint([bigInt(1), bigInt(2), bigInt(1)]);

    Object.assign(bn128, bn128.instance.exports);

    return bn128;
}
*/



    const moduleBuilder = new ModuleBuilder();
    moduleBuilder.setMemory(1000);
    buildF1m(moduleBuilder, q, "f1m");
    buildF1(moduleBuilder, r, "fr", "frm");
    buildCurve(moduleBuilder, "g1", "f1m");

    /*
    const pNonResidueF2 =  moduleBuilder.alloc(
        utils.bigInt2BytesLE(
            bigInt("15537367993719455909907449462855742678907882278146377936676643359958227611562"), // -1 in montgomery
            32
        )
    );

    buildF2m(moduleBuilder, pNonResidueF2, "f2m", "f1m");
    buildCurve(moduleBuilder, "g2", "f2m");
    buildMultiexp(moduleBuilder, "g2", "g2", "f2m", "fr");

    buildTest(moduleBuilder);
    */

    const code = moduleBuilder.build();

    console.log('built code:', code);

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "bn128mul.wasm"),
        code
    );

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "bn128mul_wasm.js"),
        `
            exports.code = new Buffer("${Buffer.from(code).toString("base64")}", "base64");
            exports.pq = ${moduleBuilder.modules.f1m.pq};
            exports.pr = ${moduleBuilder.modules.frm.pq};
        `
    );
}

buildWasm();
