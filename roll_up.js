const fs = require('fs');
const buildProtoboard = require("wasmbuilder").buildProtoboard;
const buildBn128 = require("./src/bn128.js");
const bigInt = require('big-integer')
const SIZE_F = 32
let zk = {};

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer).reverse(), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function printFq12(bn128, p) {
    const SIZE_F = 32;

    for (let i = 0; i < 12; i++) {
        console.log(buf2hex(bn128.getBin(p + SIZE_F * i, SIZE_F)));
    }
}

function printFq2(bn128, pG2) {
    const SIZE_F = 32;

    for (let i = 0; i < 6; i++) {
        console.log(buf2hex(bn128.getBin(pG2 + SIZE_F * i, SIZE_F)));
    }
}

function printFq1(bn128, pG1) {
    const SIZE_F = 32;

    for (let i = 0; i < 3; i++) {
        console.log(buf2hex(bn128.getBin(pG1 + SIZE_F * i, SIZE_F)));
    }
}

buildBn128().then( (bn128) => {
    zk.bn128 = bn128;

    zk.verify = function () {
        const SIZE_F = 32;
        // const pG1gen = bn128.pG1gen;
        // const pG2gen = bn128.pG2gen;

        /***
        * load test vector
        * TODO: document where the test vector comes from
        *
        * all input coordinates (G1 points and G2 points) are in normal form
        * websnark expects inputs to be in montgomery form. To convert them,
        * use g1m_toMontgomery and g2m_toMontgomery
        */

        const proof_a = [bigInt("089f41b0e239736338dbacf5893756a5a97ccbacb0f6ba326767b161018a803f", 16), bigInt("26e20505b4f4a99859be674e5fc17025a6b81236302e6c21a59f95e0873b9fa4", 16)]

        const pProofA = bn128.alloc(SIZE_F * 3);

        bn128.setG1(pProofA, proof_a) // same as setG1Affine
        bn128.instance.exports.g1m_toMontgomery(pProofA, pProofA)
        console.log("G1 / pProofA is: ");
        for (let i = 0; i < 3; i++) {
           console.log(buf2hex(bn128.getBin(pProofA + i * 32, SIZE_F)));
        }


        // vk_a is a G2 point
        const vk_a = [
                    [bigInt("24963f8ac35ad1fa13d850fb61eb3c1d2766572452248b14c8e392591b14342b",16), bigInt("167595c7e7cd0c935e3a275f254340f7c5a28f5edfa92963a1627e04398fe14c", 16)],
                    [bigInt("25b7f1627599cac3ac91731ff8653662c70afe283da733cd885e12b2be54d313",16), bigInt("1a995764699581e0c41626103f9b9a675a503148f4d0b67cbaf1f7ef0b1cc41d",16)]
                   ]

        const pVKA = bn128.alloc(SIZE_F * 6);
        bn128.setG2Affine(pVKA, vk_a);
        bn128.instance.exports.g2m_toMontgomery(pVKA, pVKA);

        console.log("G2 / pVKA is: ");
        for (let i = 0; i < 6; i++) {
           console.log(buf2hex(bn128.getBin(pVKA + i * 32, SIZE_F)));
        }

        console.log("vk_a is ");
        printFq2(bn128, pVKA);


        // second G1 point
        const proof_a_p = [bigInt("2034a6f7e573a3b1d2c16934721c754bc50fc8c232a4e83c8a7dfa8770311ddf", 16), bigInt("23630f23dda7cbc29e510ee9b92e16e16277736a32b01c670bbc77f4c6978fd", 16)]
        const pProof_a_p = bn128.alloc(SIZE_F * 3);
        const pProof_a_p_neg = bn128.alloc(SIZE_F * 3);

        bn128.setG1(pProof_a_p, proof_a_p) // same as setG1Affine
        console.log("second G1 / pProof_a_p in normal form: ");
        for (let i = 0; i < 3; i++) {
           console.log(buf2hex(bn128.getBin(pProof_a_p + i * 32, SIZE_F)));
        }

        bn128.instance.exports.g1m_neg(pProof_a_p, pProof_a_p_neg)
        console.log("neg of second G1 / pProof_a_p_neg: ");
        for (let i = 0; i < 3; i++) {
           console.log(buf2hex(bn128.getBin(pProof_a_p_neg + i * 32, SIZE_F)));
        }

        bn128.instance.exports.g1m_toMontgomery(pProof_a_p_neg, pProof_a_p_neg)
        console.log("pProof_a_p_neg in montgomery form: ");
        for (let i = 0; i < 3; i++) {
           console.log(buf2hex(bn128.getBin(pProof_a_p_neg + i * 32, SIZE_F)));
        }


        // p2 is the second G2 point
        const P2 = [
                    [bigInt("1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed",16), bigInt("198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2", 16)],
                    [bigInt("12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa",16), bigInt("090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b",16)]
                   ]

        const pP2 = bn128.alloc(SIZE_F * 6);
        bn128.setG2Affine(pP2, P2);

        console.log("P2 / second G2 point in normal form:");
        for (let i = 0; i < 6; i++) {
           console.log(buf2hex(bn128.getBin(pP2 + i * 32, SIZE_F)));
        }

        bn128.instance.exports.g2m_toMontgomery(pP2, pP2);

        console.log("P2 in montgomery form:");
        printFq2(bn128, pP2);


        /****
        * do the pairing check step by step using bn128_prepareG1, bn128_prepareG2,
        * bn128_millerLoop, bn128_finalExponentiation, and ftm_mul
        */

        // do first pairing operation

        const pPreP = bn128.alloc(SIZE_F * 3);
        const pPreQ = bn128.alloc(SIZE_F*2*3 + SIZE_F*2*3*103);
        bn128.instance.exports.bn128_prepareG1(pProofA, pPreP);
        bn128.instance.exports.bn128_prepareG2(pVKA, pPreQ);

        const pMillerRes1 = bn128.alloc(SIZE_F*12);
        const pRes1 = bn128.alloc(SIZE_F*12);

        console.log('doing miller loop...')
        bn128.instance.exports.bn128_millerLoop(pPreP, pPreQ, pMillerRes1);
        console.log("miller loop result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pMillerRes1 + i * 32, SIZE_F)));
        }

        console.log('doing final exponentiaion...')
        bn128.instance.exports.bn128_finalExponentiation(pMillerRes1, pRes1);

        console.log("first pairing result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pRes1 + i * 32, SIZE_F)));
        }


        // do second pairing operation

        const pPreP2 = bn128.alloc(SIZE_F * 3);
        const pPreQ2 = bn128.alloc(SIZE_F*2*3 + SIZE_F*2*3*103);
        bn128.instance.exports.bn128_prepareG1(pProof_a_p_neg, pPreP2);
        bn128.instance.exports.bn128_prepareG2(pP2, pPreQ2);

        const pMillerRes2 = bn128.alloc(SIZE_F*12);
        const pRes2 = bn128.alloc(SIZE_F*12);

        console.log('doing second miller loop...')
        bn128.instance.exports.bn128_millerLoop(pPreP2, pPreQ2, pMillerRes2);
        console.log("second miller loop result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pMillerRes2 + i * 32, SIZE_F)));
        }

        console.log('doing second final exponentiaion...')
        bn128.instance.exports.bn128_finalExponentiation(pMillerRes2, pRes2);

        console.log("second pairing result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pRes2 + i * 32, SIZE_F)));
        }


        const pFq12MulRes = bn128.alloc(SIZE_F*12);
        bn128.instance.exports.ftm_mul(pRes1, pRes2, pFq12MulRes);
        bn128.instance.exports.ftm_fromMontgomery(pFq12MulRes, pFq12MulRes);

        // the two pairing results multiplied should be equal to 1
        console.log("fq12 mul result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pFq12MulRes + i * 32, SIZE_F)));
        }


        /****
        * do the pairing check using bn128_pairingEq2
        */
        let pFq12One = bn128.alloc(SIZE_F * 12);
        bn128.instance.exports.ftm_one(pFq12One);

        const pairingEq2_result = bn128.instance.exports.bn128_pairingEq2(pProofA, pVKA, pProof_a_p_neg, pP2, pFq12One);
        console.log("bn128_pairingEq2 result should be 1:", pairingEq2_result);

        bn128.terminate();
    }
    zk.verify();
});
