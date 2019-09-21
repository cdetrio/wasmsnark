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
        const pG1gen = bn128.pG1gen;
        const pG2gen = bn128.pG2gen;
        /*
        let preP = ['19701616998046022080031461533081683349349922508001225829429012682476945246503', '4352758313510687066057119517114580848942993880722958718643736130532801935422'] // proof A
        let G2s= [["15771427421120862986294000212419350237883255916169077454872740902908345027224", "1678675047549670880963791769225832602838608436817213884204913291250317772076"],
 ["7444893162152145494570035985825645193382869031140049547391326164069968393793", "1528292178025870369960381247712364755513316922130874453557341293710701266878"]] // vk A
        */

        //const proof_a = ['3899884854253260798287194420681390195129018418001849829799377663377613160511', '17587230345392365712430620877997915478595991565328899965814307903212716007332']

        const proof_a = [bigInt("089f41b0e239736338dbacf5893756a5a97ccbacb0f6ba326767b161018a803f", 16), bigInt("26e20505b4f4a99859be674e5fc17025a6b81236302e6c21a59f95e0873b9fa4", 16)]

        const pProofA = bn128.alloc(SIZE_F * 3);

        bn128.setG1(pProofA, proof_a) // same as setG1Affine
        bn128.instance.exports.g1m_toMontgomery(pProofA, pProofA)
        console.log("G1 / pProofA is: ");
        for (let i = 0; i < 3; i++) {
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pProofA + i * 32, SIZE_F)));
        }


       /*
       const vk_a = [["10158637525057481760056375716221076310331756939873412782566291572681344016716", "16548728159780093650905724596480242950527136765259244416289285297574698562603"],
 ["12031064823122150770091404076492969192448060276855277898032078516074409935901", "17060574385764455113052073757045274655042048873252862760623781185577070940947"]];
 */

        /*
        const vk_a = [['72845808812592855736508517959950295400388085950499134060650391241680795014710', '78100026775956249164162204243472275528800871643742955729366952509822072757435'], ['76475013071130644230541689872427101644031042132633025313035776555027131176700', '30658591281525740283719694118570154825985583194697552416269170562378337253327']]
        */

        /*
        const vk_a = [
                      [bigInt("2c191ae34b6b9b4a8598a7b98c851636a10d4444fea44189f22d894dffae6794",16), bigInt("0a6cdc207a41c5e07072ef58074f9cbbacab0c74dcbf2e8594f90db9874e9782", 16)],
                      [bigInt("25382aec8d64292e5ab5b95741fe96fca91352d092c983007f7932bb7e79e30c",16), bigInt("2ebdd522ff0a7bffbb1e26764cea77cf43c825d18749d421006c7d91da93d25e",16)]
                     ]
        */

        // these coods are in normal form
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
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pVKA + i * 32, SIZE_F)));
        }

        console.log("vk_a is ");
        printFq2(bn128, pVKA);



        //const pProofA = bn128.alloc(SIZE_F * 3);
        //const pVKA = bn128.alloc(SIZE_F * 6);
        const pCoef = bn128.alloc(SIZE_F * 6 +  SIZE_F * 6 * 103);


        /*
        const neg_proof_a_p = [bigInt('0c0e329b4d73cd52c231f9e064460a7a9f77c7c8752c26efc52e6c7f37d02193', 16), bigInt('25f5bae6cf6720e4519b0c6d5b4d6950c116c773a7869909ea0ef64fc73d9ad1', 16)];

        const pNegAP = bn128.alloc(SIZE_F * 3);
        bn128.setG1(pNegAP, neg_proof_a_p);
        bn128.instance.exports.g1m_toMontgomery(pNegAP, pNegAP);

        console.log("negated point AP is");
        //console.log(buf2hex(bn128.getBin(pVKA, SIZE_F)));
        printFq1(bn128, pNegAP);


        const p2 = [[bigInt('19573841af96503bfbb8264797811adfdceb1935497b01728e83b5d102bc2026', 16), bigInt('14fef0833aea7b6b09e950fc52a02f866043dd5a5802d8c4afb4737da84c6140', 16)], [bigInt('0da4a0e693fd648255f935be33351076dc57f922327d3cbb64095b56c71856ee', 16), bigInt('28fd7eebae9e4206ff9e1a62231b7dfefe7fd297f59e9b78619dfa9d886be9f6', 16)]];
        const pP2 = bn128.alloc(SIZE_F * 6);

        bn128.setG2Affine(pP2, p2);
        bn128.instance.exports.f2m_one(pP2 + SIZE_F * 4);
        bn128.instance.exports.g2m_toMontgomery(pP2, pP2);

        console.log("point 2 is");
        printFq2(bn128, pP2);
        */


        // second G1 point. these coords are in normal form
        const proof_a_p = [bigInt("2034a6f7e573a3b1d2c16934721c754bc50fc8c232a4e83c8a7dfa8770311ddf", 16), bigInt("23630f23dda7cbc29e510ee9b92e16e16277736a32b01c670bbc77f4c6978fd", 16)]

        const pProof_a_p = bn128.alloc(SIZE_F * 3);
        const pProof_a_p_neg = bn128.alloc(SIZE_F * 3);

        bn128.setG1(pProof_a_p, proof_a_p) // same as setG1Affine
        console.log("second G1 / pProof_a_p in normal form: ");
        for (let i = 0; i < 3; i++) {
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pProof_a_p + i * 32, SIZE_F)));
        }

        bn128.instance.exports.g1m_neg(pProof_a_p, pProof_a_p_neg)
        console.log("neg of second G1 / pProof_a_p_neg: ");
        for (let i = 0; i < 3; i++) {
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pProof_a_p_neg + i * 32, SIZE_F)));
        }

        bn128.instance.exports.g1m_toMontgomery(pProof_a_p_neg, pProof_a_p_neg)
        console.log("pProof_a_p_neg in montgomery form: ");
        for (let i = 0; i < 3; i++) {
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pProof_a_p_neg + i * 32, SIZE_F)));
        }



        // these coords are in normal form
        // p2 is the second G2 point
        const P2 = [
                    [bigInt("1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed",16), bigInt("198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2", 16)],
                    [bigInt("12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa",16), bigInt("090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b",16)]
                   ]

       /*
       const P2_try1 = {
         x: {
           a: ,
           b: ,
           c: 
           
         },
         y: {
           a: ,
           b: ,
           c: 
         }
       }
       */


        const pP2 = bn128.alloc(SIZE_F * 6);
        bn128.setG2Affine(pP2, P2);

        console.log("P2 / second G2 point in normal form:");
        for (let i = 0; i < 6; i++) {
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pP2 + i * 32, SIZE_F)));
        }

        bn128.instance.exports.g2m_toMontgomery(pP2, pP2);

        console.log("P2 in montgomery form:");
        printFq2(bn128, pP2);


        /*
        bn128.setG1(pProofA, proof_a) // same as setG1Affine
        //bn128.instance.exports.f1m_one(pProofA + SIZE_F * 2);
        bn128.instance.exports.g1m_toMontgomery(pProofA, pProofA)
        */

        /*
        // I think pVKA is already in montgomery form?
        bn128.setG2Affine(pVKA, vk_a);
        //bn128.instance.exports.g2m_toMontgomery(pVKA, pVKA)
        */


        const pPreP = bn128.alloc(SIZE_F * 3);
        const pPreQ = bn128.alloc(SIZE_F*2*3 + SIZE_F*2*3*103);
        bn128.instance.exports.bn128_prepareG1(pProofA, pPreP);

        bn128.instance.exports.bn128_prepareG2(pVKA, pPreQ);

        /*
        console.log("first pairing G2 precompute coefficients are: ");
        for (let i = 0; i < 104 * 6; i++) {
            //console.log(pb.get(pPreQ + i * 32));
            console.log(buf2hex(bn128.getBin(pPreQ + i * 32, SIZE_F)));
        }
        */

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



        const pPreP2 = bn128.alloc(SIZE_F * 3);
        const pPreQ2 = bn128.alloc(SIZE_F*2*3 + SIZE_F*2*3*103);
        bn128.instance.exports.bn128_prepareG1(pProof_a_p_neg, pPreP2);
        bn128.instance.exports.bn128_prepareG2(pP2, pPreQ2);

        /*
        console.log("second pairing G2 precompute coefficients are: ");
        for (let i = 0; i < 104 * 6; i++) {
            console.log(buf2hex(bn128.getBin(pPreQ2 + i * 32, SIZE_F)));
        }
        */

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

        console.log("fq12 mul result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pFq12MulRes + i * 32, SIZE_F)));
        }



        let pFq12One = bn128.alloc(SIZE_F * 12);
        bn128.instance.exports.ftm_one(pFq12One);

        const pairingEq2_result = bn128.instance.exports.bn128_pairingEq2(pProofA, pVKA, pProof_a_p_neg, pP2, pFq12One);

        console.log("bn128_pairingEq2 result is:", pairingEq2_result);
        //printFq12(bn128, pPairingEq2Res);

    }
    zk.verify();
});
