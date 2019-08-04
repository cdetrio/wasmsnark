const bigInt = require("big-integer");
const utils = require("../utils");

const buildF1m =require("../build_f1m.js");
const buildF1 =require("../build_f1.js");
const buildCurve =require("./build_curve.js");

module.exports = function buildSecp256k1(module, _prefix) {

    const prefix = _prefix || "secp256k1";

    if (module.modules[prefix]) return prefix;  // already builded

    // q is the field modulus
    // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f == 115792089237316195423570985008687907853269984665640564039457584007908834671663
    const q = bigInt("115792089237316195423570985008687907853269984665640564039457584007908834671663");
    // r is the curve order
    // 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141 == 115792089237316195423570985008687907852837564279074904382605163141518161494337
    const r = bigInt("115792089237316195423570985008687907852837564279074904382605163141518161494337");


    const n64 = Math.floor((q.minus(1).bitLength() - 1)/64) +1;
    const n8 = n64*8;
    const frsize = n8;
    const f1size = n8;
    const f2size = f1size * 2;
    const f6size = f1size * 6;
    const ftsize = f1size * 12;

    const pr = module.alloc(utils.bigInt2BytesLE( r, frsize ));

    const f1mPrefix = buildF1m(module, q, "f1m");
    buildF1(module, r, "fr", "frm");
    const g1mPrefix = buildCurve(module, "g1m", "f1m");



    function toMontgomery(a) {
        return bigInt(a).times( bigInt.one.shiftLeft(f1size*8)).mod(q);
    }

    // base point G
    // g = (0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798,
    // 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8)
    const G1gen = [
        bigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
        bigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
        bigInt.one
    ];

    /*
    const G1gen = [
        bigInt("1"),
        bigInt("2"),
        bigInt.one
    ];
    */

    const pG1gen = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[2]), f1size ),
        ]
    );

    const G1zero = [
        bigInt.zero,
        bigInt.one,
        bigInt.zero
    ];

    const pG1zero = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[2]), f1size )
        ]
    );


    module.modules[prefix] = {
        n64: n64,
        pG1gen: pG1gen,
        pG1zero: pG1zero,
        pq: module.modules["f1m"].pq,
        pr: pr
    };

};

