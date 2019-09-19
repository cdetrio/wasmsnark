const fs = require('fs');
const buildProtoboard = require("wasmbuilder").buildProtoboard;
const buildBn128 = require("./src/bn128.js");
const bigInt = require('big-integer')
const SIZE_F = 32
let zk = {};

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer).reverse(), x => ('00' + x.toString(16)).slice(-2)).join('');
}

/*
async function do_all() {
    bn128 = {}
    pb = await buildProtoboard((module) => {
        buildBn128(module);
    }, 32); 
}
*/
/*
function getFieldElementF12(bn128, pR) {
    debugger
    return [
        [
            [
                bn128.instance.get(pR),
                pb.get(pR+32),
            ],[
                pb.get(pR+32*2),
                pb.get(pR+32*3),
            ],[
                pb.get(pR+32*4),
                pb.get(pR+32*5),
            ]
        ],[
            [
                pb.get(pR+32*6),
                pb.get(pR+32*7),
            ],[
                pb.get(pR+32*8),
                pb.get(pR+32*9),
            ],[
                pb.get(pR+32*10),
                pb.get(pR+32*11),
            ]
        ]
    ];
}
*/

buildBn128().then( (bn128) => {
    zk.bn128 = bn128;

    zk.verify = function () {
        const SIZE_F = 32;
        const pG1gen = bn128.pG1gen;
        const pG2gen = bn128.pG2gen;

//let preP = ['19701616998046022080031461533081683349349922508001225829429012682476945246503', ''] // proof A

// let preP = [bigInt("2b8eb85579f573dd65921b780484e7a6dbfe9be4a04e88737b3740b91ce58927", 16), bigInt("99f92eb16dc2248b266b97cbfb32a99463faf7f43bcd1a4938ab1f266e6783e", 16)] // proof A



       // let G2s= [["15771427421120862986294000212419350237883255916169077454872740902908345027224", "1678675047549670880963791769225832602838608436817213884204913291250317772076"],
 //["7444893162152145494570035985825645193382869031140049547391326164069968393793", "1528292178025870369960381247712364755513316922130874453557341293710701266878"]] // vk A


        //const proof_a = ['3899884854253260798287194420681390195129018418001849829799377663377613160511', '17587230345392365712430620877997915478595991565328899965814307903212716007332']
        const proof_a = [bigInt("089f41b0e239736338dbacf5893756a5a97ccbacb0f6ba326767b161018a803f", 16), bigInt("26e20505b4f4a99859be674e5fc17025a6b81236302e6c21a59f95e0873b9fa4", 16)]
       /*
       const vk_a = [["10158637525057481760056375716221076310331756939873412782566291572681344016716", "16548728159780093650905724596480242950527136765259244416289285297574698562603"],
 ["12031064823122150770091404076492969192448060276855277898032078516074409935901", "17060574385764455113052073757045274655042048873252862760623781185577070940947"]];
 */
        //const proof_a_p = ['14567039575197480528119959961327714497845927467213154926371421015062300663263', '1000373253310235159656639300753059983014930924649970939079246556995097557245']
        const proof_a_p = [bigInt("2034a6f7e573a3b1d2c16934721c754bc50fc8c232a4e83c8a7dfa8770311ddf", 16), bigInt("23630f23dda7cbc29e510ee9b92e16e16277736a32b01c670bbc77f4c6978fd", 16)]
        const p2 = [/*TODO*/]	 

        /*
        const vk_a = [['72845808812592855736508517959950295400388085950499134060650391241680795014710', '78100026775956249164162204243472275528800871643742955729366952509822072757435'], ['76475013071130644230541689872427101644031042132633025313035776555027131176700', '30658591281525740283719694118570154825985583194697552416269170562378337253327']]
        */

        /*
        // these coords aare in montgomery form
        const vk_a = [
                      [bigInt("2c191ae34b6b9b4a8598a7b98c851636a10d4444fea44189f22d894dffae6794",16), bigInt("0a6cdc207a41c5e07072ef58074f9cbbacab0c74dcbf2e8594f90db9874e9782", 16)],
                      [bigInt("25382aec8d64292e5ab5b95741fe96fca91352d092c983007f7932bb7e79e30c",16), bigInt("2ebdd522ff0a7bffbb1e26764cea77cf43c825d18749d421006c7d91da93d25e",16)]
                     ]

       const pVKA = bn128.alloc(SIZE_F * 6);
       bn128.setG2Affine(pVKA, vk_a)

       console.log("G2 / pVKA is: ");
       for (let i = 0; i < 6; i++) {
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pVKA + i * 32, SIZE_F)));
       }

        // G2 / pVKA is:
        // 2c191ae34b6b9b4a8598a7b98c851636a10d4444fea44189f22d894dffae6794
        // 0a6cdc207a41c5e07072ef58074f9cbbacab0c74dcbf2e8594f90db9874e9782
        // 25382aec8d64292e5ab5b95741fe96fca91352d092c983007f7932bb7e79e30c
        // 2ebdd522ff0a7bffbb1e26764cea77cf43c825d18749d421006c7d91da93d25e
        // 0000000000000000000000000000000000000000000000000000000000000001
        // 0000000000000000000000000000000000000000000000000000000000000000
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



        const pCoef = bn128.alloc(SIZE_F * 6 +  SIZE_F * 6 * 103);

        //const pProofAP = bn128.alloc(SIZE_F * 3);
        /*
        const pPreP = bn128.alloc(SIZE_F * 3);
        const pG2s = bn128.alloc(SIZE_F * 6);
        const pPreQ = bn128.alloc(SIZE_F*2*3 + SIZE_F*2*3*103);
        */


        const pProofA = bn128.alloc(SIZE_F * 3);

        bn128.setG1(pProofA, proof_a) // same as setG1Affine
        bn128.instance.exports.g1m_toMontgomery(pProofA, pProofA)
        console.log("G1 / pProofA is: ");
        for (let i = 0; i < 3; i++) {
           //console.log(pb.get(pG2s + i * 32));
           console.log(buf2hex(bn128.getBin(pProofA + i * 32, SIZE_F)));
        }

        //bn128.instance.exports.f1m_one(pProofA + SIZE_F * 2);

        //bn128.instance.exports.g1m_toMontgomery(pProofA, pProofA)
        
        // TODO: convert to montgomery?
        //bn128.instance.exports.g2m_toMontgomery(pVKA, pVKA)

        /*
        console.log("vk_a is ");
        console.log(buf2hex(bn128.getBin(pVKA, SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 2 , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 3 , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 4 , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 5 , SIZE_F)));
        */

        

        /*
        bn128.instance.exports.f2m_one(pVKA + SIZE_F * 4);
        console.log("vk_a after 'f2m_one' is ");
        console.log(buf2hex(bn128.getBin(pVKA, SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 2 , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 3 , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 4 , SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 5 , SIZE_F)));
        */

        

        /*
        let pAux = bn128.alloc(SIZE_F * 12);
        let pAux2 = bn128.alloc(SIZE_F * 12);
        let pAux3 = bn128.alloc(SIZE_F * 12);
        bn128.instance.exports.ftm_one(pAux);
        */

        /*
        pb.bn128_prepareG1(pG1s, pPreP);
        pb.bn128_prepareG2(pG2gen, pPreQ);
        pb.bn128_millerLoop(pPreP, pPreQ, pRes1);
        pb.bn128_finalExponentiation(pRes1, pRes2);
        */

        const pPreP = bn128.alloc(SIZE_F * 3);
        const pPreQ = bn128.alloc(SIZE_F*2*3 + SIZE_F*2*3*103);
        bn128.instance.exports.bn128_prepareG1(pProofA, pPreP);



        bn128.instance.exports.bn128_prepareG2(pVKA, pPreQ);


        console.log("coefficients are: ");
        for (let i = 0; i < 104 * 6; i++) {
            //console.log(pb.get(pPreQ + i * 32));
            console.log(buf2hex(bn128.getBin(pPreQ + i * 32, SIZE_F)));
        }


        const pRes1 = bn128.alloc(SIZE_F*12);
        const pRes2 = bn128.alloc(SIZE_F*12);


        console.log('doing miller loop...')
        bn128.instance.exports.bn128_millerLoop(pPreP, pPreQ, pRes1);
        console.log("miller loop result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pRes1 + i * 32, SIZE_F)));
        }
        
        console.log('doing final exponentiaion...')
        bn128.instance.exports.bn128_finalExponentiation(pRes1, pRes2);


        console.log("first pairing result is: ");
        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pRes2 + i * 32, SIZE_F)));
        }

        /*
        console.log("G1");
        console.log(buf2hex(bn128.getBin(pProofA, SIZE_F * 3)));
        */

        //bn128.instance.exports.g2m_toMontgomery(pVKA, pVKA)

        /*
        console.log("g2");
        console.log(buf2hex(bn128.getBin(pVKA, SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F, SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 2, SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 3, SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 4, SIZE_F)));
        console.log(buf2hex(bn128.getBin(pVKA + SIZE_F * 5, SIZE_F)));
        */

        //bn128.instance.exports.bn128_prepareG2(pVKA, pCoef);

        /*
        console.log("pcoef");
        for (let i = 0; i < 6*104; i++) {
            console.log(buf2hex(bn128.getBin(pCoef+SIZE_F*i, SIZE_F)));
        }
        */

        //bn128.instance.exports.bn128_millerLoop(pProofA, pCoef, pAux2);
        //bn128.instance.exports.bn128_finalExponentiation(pAux2, pAux3);


        //let f = getFieldElementF12(bn128, pAux3);
        //console.log(f)

        /*
        console.log("pairing result");

        for (let i = 0; i < 12; i++) {
            console.log(buf2hex(bn128.getBin(pAux3+SIZE_F*i, SIZE_F)));
        }
        */

        /*
        for (let i = 0; i < 6*104; i++) {
            console.log(buf2hex(bn128.getBin(pAux3+SIZE_F*i, SIZE_F )));
        }
        */
    }
    zk.verify();
});
