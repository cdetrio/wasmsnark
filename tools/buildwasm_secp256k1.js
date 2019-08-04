const bigInt = require("big-integer");
const ModuleBuilder = require("wasmbuilder").ModuleBuilder;
const buildSecp256k1 = require("../src/secp256k1/build_secp256k1.js");
const fs = require("fs");
const path = require("path");

function buildWasm() {
    const moduleBuilder = new ModuleBuilder();
    moduleBuilder.setMemory(1000);
    buildSecp256k1(moduleBuilder);

    const code = moduleBuilder.build();

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "secp256k1_wasm.js"),
        `
            exports.code = Buffer.from("${Buffer.from(code).toString("base64")}", "base64");
            exports.pq = ${moduleBuilder.modules.f1m.pq};
            exports.pr = ${moduleBuilder.modules.frm.pq};
            exports.pG1gen = ${moduleBuilder.modules.secp256k1.pG1gen};
            exports.pG1zero = ${moduleBuilder.modules.secp256k1.pG1zero};
        `
    );
}

buildWasm();
