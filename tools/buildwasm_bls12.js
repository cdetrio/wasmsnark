const bigInt = require("big-integer");
const ModuleBuilder = require("wasmbuilder").ModuleBuilder;
const buildBn128 = require("../src/bls12/build_bls12.js");
const fs = require("fs");
const path = require("path");

function buildWasm() {
    const moduleBuilder = new ModuleBuilder();

    console.log('ModuleBuilder prototype:', ModuleBuilder.prototype);
    moduleBuilder.setMemory(1000);
    debugFunc = moduleBuilder.addIimportFunction("debug_log32", "env", "log32");
    debugFunc.addParam("c1", "i32");

    debugFunc = moduleBuilder.addIimportFunction("debug_mark", "env", "logmark");
    debugFunc.addParam("i", "i32");

    buildBn128(moduleBuilder);

    const code = moduleBuilder.build();

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "bls12.wasm"),
        code
    )

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "bls12_wasm.js"),
        `
            exports.code = Buffer.from("${Buffer.from(code).toString("base64")}", "base64");
            exports.pq = ${moduleBuilder.modules.f1m.pq};
            exports.pr = ${moduleBuilder.modules.frm.pq};
            exports.pG1gen = ${moduleBuilder.modules.bls12.pG1gen};
            exports.pG1zero = ${moduleBuilder.modules.bls12.pG1zero};
            exports.pG2gen = ${moduleBuilder.modules.bls12.pG2gen};
            exports.pG2zero = ${moduleBuilder.modules.bls12.pG2zero};
            exports.pOneT = ${moduleBuilder.modules.bls12.pOneT};
            exports.pTwoInv = ${moduleBuilder.modules.bls12.pTwoInv};
            exports.pAltBn128Twist = ${moduleBuilder.modules.bls12.pAltBn128Twist};
            exports.prePSize = ${moduleBuilder.modules.bls12.prePSize};
            exports.preQSize = ${moduleBuilder.modules.bls12.preQSize};
        `
    );
}

buildWasm();
