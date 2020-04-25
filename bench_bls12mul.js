/*
    Copyright 2019 0KIMS association.

    This file is part of websnark (Web Assembly zkSnark Prover).

    websnark is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    websnark is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with websnark. If not, see <https://www.gnu.org/licenses/>.
*/
const assert = require("assert");
const refBigInt = require("snarkjs").bigInt;

const buildBls12 = require("./src/bls12.js");
/*
function buf2hex(buffer) { // buffer is an ArrayBuffer
  //return Array.prototype.map.call(new Uint8Array(buffer).reverse(), x => ('00' + x.toString(16)).slice(-2)).join('');
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
*/


async function runBench() {
  try {
    const bls12 = await buildBls12();
    const n8 = bls12.n8;
    console.log('n8:', n8);


    /*** test G1 scalar mul ***/

    // this is G1 for BLS12-381
    const p1_coords_affine = [
                 refBigInt("3685416753713387016781088315183077757961620795782546409894578378688607592378376318836054947676345821548104185464507"),
                 refBigInt("1339506544944476473020471379941921221584933875938349620426543736416511423956333506472724655353366534992391756441569")
               ];

    // note: could just use bls12.pG1gen instead
    //console.log('bls12.pG1gen:', bls12.getG1(bls12.pG1gen));

    const p1 = bls12.alloc(n8*3);
    bls12.setG1Affine(p1, p1_coords_affine);
    bls12.instance.exports.g1m_toMontgomery(p1, p1);
    console.log('p1 (in normal form):', bls12.getG1(p1));

    const g1_mul_result = bls12.alloc(n8*3);

    // scalar from the bn128mul_cdetrio11 test vector
    // 0xffff.. mod the bn128 modulus
    // 0xe0a77c19a07df2f666ea36f7879462e36fc76959f60cd29ac96341c4ffffffa
    const s_reduced = bls12.alloc(n8);
    //bls12.setInt(s_reduced, "6350874878119819312338956282401532410528162663560392320966563075034087161850");
    bls12.setF1(s_reduced, "42");

    console.time('g1m_timesScalar');
    bls12.instance.exports.g1m_timesScalar(p1, s_reduced, n8, g1_mul_result);
    console.timeEnd('g1m_timesScalar');

    const g1_mul_result_jacobian = bls12.getG1(g1_mul_result);
    //console.log('g1_mul_result_jacobian:', g1_mul_result_jacobian);

    const g1_mul_result_affine = bls12.alloc(n8*3);
    bls12.instance.exports.g1m_affine(g1_mul_result, g1_mul_result_affine);
    console.log('g1_result_affine:', bls12.getG1(g1_mul_result_affine));

    /*
    // correct result (matches result from using py_ecc)
    g1_result_affine: [
      '1983873765974394053638442523375087470331748000736383567808854590447652054859907830989243032669007682302800810318920',
      '84294790897768358280729139558542294020936903043834301551634579903689511426257434283606999889280642652447788957105',
      '1'
    ]
    */


    /***  test G2 scalar mul  ***/

    //console.log('bls12.pG2gen:', bls12.getG2(bls12.pG2gen));
    const g2_times_2 = bls12.alloc(n8*6);

    const scalar_two = bls12.alloc(n8);
    bls12.setF1(scalar_two, "2");

    bls12.instance.exports.g2m_timesScalar(bls12.pG2gen, scalar_two, n8, g2_times_2);
    //console.log('bls12 g2 times 2 result:', bls12.getG2(g2_times_2));

    const g2_times_2_affine = bls12.alloc(n8*3);
    bls12.instance.exports.g2m_affine(g2_times_2, g2_times_2_affine);
    console.log('g2_times_2_affine:', bls12.getG2(g2_times_2_affine));
    /*
    // correct result from py_ecc
    normalize(multiply(G2, 2))
    ((3419974069068927546093595533691935972093267703063689549934039433172037728172434967174817854768758291501458544631891,
    1586560233067062236092888871453626466803933380746149805590083683748120990227823365075019078675272292060187343402359),
    (678774053046495337979740195232911687527971909891867263302465188023833943429943242788645503130663197220262587963545,
    2374407843478705782611042739236452317510200146460567463070514850492917978226342495167066333366894448569891658583283))
    */



    /*** try pairing test ***/
    // try test like https://github.com/ethereum/py_ecc/blob/master/tests/test_bn128_and_bls12_381.py#L315-L319

    const pairing1_result = bls12.alloc(n8*12);
    bls12.instance.exports.bls12_pairing(bls12.pG1gen, bls12.pG2gen, pairing1_result);
    console.log('bls12 pairing1 result:', bls12.getF12hex(pairing1_result));


    const pairing1_result_squared = bls12.alloc(n8*12);
    bls12.instance.exports.ftm_mul(pairing1_result, pairing1_result, pairing1_result_squared);

    console.log('bls12 pairing1 result squared:', bls12.getF12hex(pairing1_result_squared));


    const pairing2_result = bls12.alloc(n8*12);

    //bls12.instance.exports.bls12_pairing(g2_times_2, bls12.pG1gen, pairing2_result);
    bls12.instance.exports.bls12_pairing(bls12.pG1gen, g2_times_2_affine, pairing2_result);
    console.log('bls12 pairing2 result:', bls12.getF12hex(pairing2_result));

    //console.log('bls12 pairing2 result in hex:', bls12.getF12hex(pairing2_result));






    /*** test mulBy024 ***/


    /* ---- original mulBy024 input from websnark test case ---- */
    /*
    const pf12 = bls12.alloc(n8*12);

    // sets pf to [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    for (let i=0; i<12; i++) {
        bls12.setF1(pf12 + i*n8, i);
    }
    bls12.instance.exports.ftm_toMontgomery(pf12,pf12);

    // sets pEll0 to [1, 2]
    const pEll0 = bls12.alloc(n8*2);
    bls12.setF1(pEll0, 1);
    bls12.setF1(pEll0 + n8, 2);
    bls12.instance.exports.f2m_toMontgomery(pEll0,pEll0);

    // sets pVW to [3, 4]
    const pVW = bls12.alloc(n8*2);
    bls12.setF1(pVW, 3);
    bls12.setF1(pVW + n8, 4);
    bls12.instance.exports.f2m_toMontgomery(pVW, pVW);

    // sets pVV to [5, 6]
    const pVV = bls12.alloc(n8*2);
    bls12.setF1(pVV, 5);
    bls12.setF1(pVV + n8, 6);
    bls12.instance.exports.f2m_toMontgomery(pVV, pVV);

    bls12.instance.exports.bls12__mulBy024(pEll0, pVW, pVV, pf12);
    console.log('bls12 mulBy024 result:', bls12.getF12hex(pf12));
    */
    /* -------- */



    /* ---- trying the mul_by_014 extracted case on mulBy024 ---- */
    /*
    const pf12 = bls12.alloc(n8*12);

    // sets pf to [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    //for (let i=0; i<12; i++) {
    //    bls12.setF1(pf12 + i*n8, i);
    //}
    bls12.setF1(pf12, 1);
    bls12.instance.exports.ftm_toMontgomery(pf12,pf12);


    // sets pEll0 to
    // Fq2(0x044bfdd057dbcdea6da612e36a2d73e1ade1b4a8c83a5c43081a2faa102d9a0fdcd419484a87fe00f7fb863d52a58f97 +
    // 0x0c253d9f18af8cee7a0bb79525a7abd34fceaf38c6d9cfb409e352ac344351cf6645648a6db0795fa5dedd099ce9c589 * u)
    const pEll0 = bls12.alloc(n8*2);
    bls12.setF1(pEll0, "661344457020705403819041421354580101951432978990714484546136067154448644677901242780333553114603085908603014844311");
    bls12.setF1(pEll0 + n8, "1869359156447330187194973525617682829138118838905952662761966676861719131442862459958035727125876960615931717469577");
    bls12.instance.exports.f2m_toMontgomery(pEll0,pEll0);

    // sets pVW to
    //fp12_as_2_over3_over_2 mul_by_014 input c1:
    //Fq2(0x0d5f2306933f1974d7f31dca02ec8368bbdd142b25409d7876c64411ff398363756d822c2396cf09b57278b16af7df6e +
    //0x0f323baca1e95243a536076bf20399408bc36450605b11f07f8e4d83d07bdd2ef8b5fa78f63c31881c8f544e49b7ffca * u)
    const pVW = bls12.alloc(n8*2);
    bls12.setF1(pVW, "2058081942084793187943375402308066038877299345066154555313186673646756001246555176303680639677075724715647905029998");
    bls12.setF1(pVW + n8, "2338912793371169260778554541980750343874635399138037296233780945644164355980965971881602411571287752347904156106698");
    bls12.instance.exports.f2m_toMontgomery(pVW, pVW);

    // sets pVV to
    //fp12_as_2_over3_over_2 mul_by_014 input c4:
    //Fq2(0x08e4538d9097e4edff1eea0ffeaf2701e025c59353dad2c938775f5c1207ef0ee9f04248d0aab86ee1bd465e86b760b9 +
    //0x03dde9e2b63848c3fce143c24bddddb05a4141ea0a5f45cff63fa49c1989a8f1b18e0038b694c8706b7b8cf979e5b782 * u)
    const pVV = bls12.alloc(n8*2);
    bls12.setF1(pVV, "1368588654857894878418275568728522126509225138946700730641519125678837625943210272426023428152507345261242478977209");
    bls12.setF1(pVV + n8, "595162695551560935096575469966673100066956936968872996017557172004618803176589747013153322457437226437701984958338");
    bls12.instance.exports.f2m_toMontgomery(pVV, pVV);

    bls12.instance.exports.bls12__mulBy024(pEll0, pVW, pVV, pf12);
    //bls12.instance.exports.bls12__mulBy024Old(pEll0, pVW, pVV, pf12);
    console.log('bls12 mulBy024 result:', bls12.getF12hex(pf12));
    */
    /* -------- */






    /* ---- trying the mul_by_014 extracted case on mulby014 ---- */

    const pf12_test1 = bls12.alloc(n8*12);

    // sets pf to [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    //for (let i=0; i<12; i++) {
    //    bls12.setF1(pf12 + i*n8, i);
    //}
    bls12.setF1(pf12_test1, 1);
    bls12.instance.exports.ftm_toMontgomery(pf12_test1, pf12_test1);


    // sets pEll0 to
    // Fq2(0x044bfdd057dbcdea6da612e36a2d73e1ade1b4a8c83a5c43081a2faa102d9a0fdcd419484a87fe00f7fb863d52a58f97 +
    // 0x0c253d9f18af8cee7a0bb79525a7abd34fceaf38c6d9cfb409e352ac344351cf6645648a6db0795fa5dedd099ce9c589 * u)
    const pEll0_test1 = bls12.alloc(n8*2);
    bls12.setF1(pEll0_test1, "661344457020705403819041421354580101951432978990714484546136067154448644677901242780333553114603085908603014844311");
    bls12.setF1(pEll0_test1 + n8, "1869359156447330187194973525617682829138118838905952662761966676861719131442862459958035727125876960615931717469577");
    bls12.instance.exports.f2m_toMontgomery(pEll0_test1, pEll0_test1);

    // set pVV to
    //fp12_as_2_over3_over_2 mul_by_014 input c1:
    //Fq2(0x0d5f2306933f1974d7f31dca02ec8368bbdd142b25409d7876c64411ff398363756d822c2396cf09b57278b16af7df6e +
    //0x0f323baca1e95243a536076bf20399408bc36450605b11f07f8e4d83d07bdd2ef8b5fa78f63c31881c8f544e49b7ffca * u)
    const pVV_test1 = bls12.alloc(n8*2);
    bls12.setF1(pVV_test1, "2058081942084793187943375402308066038877299345066154555313186673646756001246555176303680639677075724715647905029998");
    bls12.setF1(pVV_test1 + n8, "2338912793371169260778554541980750343874635399138037296233780945644164355980965971881602411571287752347904156106698");
    bls12.instance.exports.f2m_toMontgomery(pVV_test1, pVV_test1);

    // sets pVW to
    //fp12_as_2_over3_over_2 mul_by_014 input c4:
    //Fq2(0x08e4538d9097e4edff1eea0ffeaf2701e025c59353dad2c938775f5c1207ef0ee9f04248d0aab86ee1bd465e86b760b9 +
    //0x03dde9e2b63848c3fce143c24bddddb05a4141ea0a5f45cff63fa49c1989a8f1b18e0038b694c8706b7b8cf979e5b782 * u)
    const pVW_test1 = bls12.alloc(n8*2);
    bls12.setF1(pVW_test1, "1368588654857894878418275568728522126509225138946700730641519125678837625943210272426023428152507345261242478977209");
    bls12.setF1(pVW_test1 + n8, "595162695551560935096575469966673100066956936968872996017557172004618803176589747013153322457437226437701984958338");
    bls12.instance.exports.f2m_toMontgomery(pVW_test1, pVW_test1);

    //bls12.instance.exports.bls12__mulBy014(pEll0_test1, pVV_test1, pVV_test1, pf12_test1);
    bls12.instance.exports.bls12__mulBy014(pEll0_test1, pVW_test1, pVV_test1, pf12_test1);
    //bls12.instance.exports.bls12__mulBy024Old(pEll0, pVW, pVV, pf12);
    console.log('bls12 mulBy014 test1 result:', bls12.getF12hex(pf12_test1));







    /* ---- trying another extracted mul_by_014 case on mulby014 ---- */


    // sets pf to [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    //for (let i=0; i<12; i++) {
    //    bls12.setF1(pf12 + i*n8, i);
    //}
    //bls12.setF1(pf12, 1);
    //bls12.instance.exports.ftm_toMontgomery(pf12,pf12);

    const pf12 = bls12.alloc(n8*12);

    //Fq2(0x044bfdd057dbcdea6da612e36a2d73e1ade1b4a8c83a5c43081a2faa102d9a0fdcd419484a87fe00f7fb863d52a58f97 +
    //  0x0c253d9f18af8cee7a0bb79525a7abd34fceaf38c6d9cfb409e352ac344351cf6645648a6db0795fa5dedd099ce9c589 * u) +
    bls12.setF1(pf12 + n8*0, "661344457020705403819041421354580101951432978990714484546136067154448644677901242780333553114603085908603014844311");
    bls12.setF1(pf12 + n8*1, "1869359156447330187194973525617682829138118838905952662761966676861719131442862459958035727125876960615931717469577");

    // Fq2(0x0d5f2306933f1974d7f31dca02ec8368bbdd142b25409d7876c64411ff398363756d822c2396cf09b57278b16af7df6e +
    // 0x0f323baca1e95243a536076bf20399408bc36450605b11f07f8e4d83d07bdd2ef8b5fa78f63c31881c8f544e49b7ffca * u) * v +
    bls12.setF1(pf12 + n8*2, "2058081942084793187943375402308066038877299345066154555313186673646756001246555176303680639677075724715647905029998");
    bls12.setF1(pf12 + n8*3, "2338912793371169260778554541980750343874635399138037296233780945644164355980965971881602411571287752347904156106698");

    // (0,0)
    bls12.setF1(pf12 + n8*4, "0");
    bls12.setF1(pf12 + n8*5, "0");

    // (0,0)
    bls12.setF1(pf12 + n8*6, "0");
    bls12.setF1(pf12 + n8*7, "0");

    //Fq2(0x08e4538d9097e4edff1eea0ffeaf2701e025c59353dad2c938775f5c1207ef0ee9f04248d0aab86ee1bd465e86b760b9 +
    //  0x03dde9e2b63848c3fce143c24bddddb05a4141ea0a5f45cff63fa49c1989a8f1b18e0038b694c8706b7b8cf979e5b782 * u) * v +
    bls12.setF1(pf12 + n8*8, "1368588654857894878418275568728522126509225138946700730641519125678837625943210272426023428152507345261242478977209");
    bls12.setF1(pf12 + n8*9, "595162695551560935096575469966673100066956936968872996017557172004618803176589747013153322457437226437701984958338");

    // (0,0)
    bls12.setF1(pf12 + n8*10, "0");
    bls12.setF1(pf12 + n8*11, "0");

    bls12.instance.exports.ftm_toMontgomery(pf12,pf12);


    // TwistType::M => {
    //   (i, j_by_three, h)
    //   // i            == c0 == ELL_0 (websnark)
    //   // j_by_three   == c1 == ELL_VV
    //   // h            == c2 == ELL_VW
    // },

    // sets pEll0 to
    // fp12_as_2_over3_over_2 mul_by_014 input c0:
    // Fq2(0x10266d9384fdcbceeea3ec5bd05a41fba2d8475ceb8f9edcfeee8ad1ef1ca8966a832257cfbac1f5d2126758b55e0ad7 +
    // 0x08b61e1935180cd88111641285215e738acb324b96edfbd39c96c2bcb14b7fc223bed1b43439b7d55a7fd0638e8905c4 * u)
    const pEll0 = bls12.alloc(n8*2);
    bls12.setF1(pEll0, "2485729354004455654586201942617502473200617632395416612368298004001247711670119227310385195533242093217669187504855");
    bls12.setF1(pEll0 + n8, "1340806677183940909823857345206370671646152762412094373932797411726178254910026861105791551267167917383941377033668");
    bls12.instance.exports.f2m_toMontgomery(pEll0,pEll0);

    // set pVV to
    // fp12_as_2_over3_over_2 mul_by_014 input c1:
    // Fq2(0x14114543a879fd58f36e47ac62fda6ed69a64f0235f49fc70accd4e5af7743412577ba307fa5d478cbb7ab1dfca1d25c +
    // 0x019f6fe14a668d5ead1012520862ef036a7658c8b4f0998abe6449696cac6a8b276450642c87b9ae319e34e2e23f1ba6 * u)
    const pVV = bls12.alloc(n8*2);
    bls12.setF1(pVV, "3088665261546901360691936814757622859842679786970711146686483884419454218153160095579742367163090882824005325279836");
    bls12.setF1(pVV + n8, "249771919035547778968352068356785805691662679350449018843357624394438358582079477030429991165095205861247462349734");
    bls12.instance.exports.f2m_toMontgomery(pVV, pVV);

    // sets pVW to
    //fp12_as_2_over3_over_2 mul_by_014 input c2: 
    //q2(0x024cbbf9815b49277bb7c251b1543bbc8ce3582ecb6006e0759fd5da966cd9efae22d8be36790d0c97e1dc71a0db5502 +
    //0x124242085df829831336cc45fc0213c76d8f30948ccd703996a75af68ca97cd6a3105496678d612ab656e73eafba426d * u)
    const pVW = bls12.alloc(n8*2);
    bls12.setF1(pVW, "353962884322991498790198677636654931753423308310555259684086764045969483504644484748192818875377074689802321483010");
    bls12.setF1(pVW + n8, "2810289616732431209665995404474295253100801864885472391957772033342893282524391183513482677737355767235227334361709");
    bls12.instance.exports.f2m_toMontgomery(pVW, pVW);

    // bls12.instance.exports.bls12__mulBy014(pEll0, pVW, pVV, pf12);
    // f.addParam("pEll0", "i32");
    // f.addParam("pEllVV", "i32");
    // f.addParam("pEllVW", "i32");
    //bls12.instance.exports.bls12__mulBy014(pEll0, pVV, pVW, pf12);

    bls12.instance.exports.bls12__mulBy014(pEll0, pVW, pVV, pf12); // VV and VW are reversed here, but it gives better results
    //bls12.instance.exports.bls12__mulBy024Old(pEll0, pVW, pVV, pf12);
    console.log('bls12 mulBy014 test2 result:', bls12.getF12hex(pf12));

    /* -------- */








    /***** do pairingEq2 test ****/
    const g2_times_27 = bls12.alloc(n8*6);
    const g1_times_37 = bls12.alloc(n8*3);
    const g1_times_999 = bls12.alloc(n8*3);

    const scalar_27 = bls12.alloc(n8);
    bls12.setF1(scalar_27, "27");
    const scalar_37 = bls12.alloc(n8);
    bls12.setF1(scalar_37, "37");
    const scalar_999 = bls12.alloc(n8);
    bls12.setF1(scalar_999, "999");

    bls12.instance.exports.g1m_timesScalar(bls12.pG1gen, scalar_37, n8, g1_times_37);
    bls12.instance.exports.g1m_timesScalar(bls12.pG1gen, scalar_999, n8, g1_times_999);
    bls12.instance.exports.g2m_timesScalar(bls12.pG2gen, scalar_27, n8, g2_times_27);

    bls12.instance.exports.g1m_affine(g1_times_37, g1_times_37);
    bls12.instance.exports.g1m_affine(g1_times_999, g1_times_999);
    bls12.instance.exports.g2m_affine(g2_times_27, g2_times_27);

    const g1_times_999_neg = bls12.alloc(n8*3);
    bls12.instance.exports.g1m_neg(g1_times_999, g1_times_999_neg);

    console.log('bls12.pOneT:', bls12.getF12(bls12.pOneT));

    /*
    const composit1_result = bls12.alloc(n8*12);
    bls12.instance.exports.bls12_pairing(g1_times_37, g2_times_27, composit1_result);
    console.log('composit1_result:', bls12.getF12(composit1_result));

    const composit2_result = bls12.alloc(n8*12);
    bls12.instance.exports.bl12_pairing(g1_times_999, bn128.pG2gen, composit2_result);
    console.log('composit2_result:', bls12.getF12(composit2_result));
    */


    let pairingEq2_result = bls12.instance.exports.bls12_pairingEq2(g1_times_37, g2_times_27, g1_times_999_neg, bls12.pG2gen, bls12.pOneT);
    console.log('pairingEq2_result:', pairingEq2_result);

    /* -------- */





    //let pairingEq2_result = bls12.instance.exports.bls12_pairingEq2(bls12.pG2gen, bls12.pG1gen, g2_times_2_affine, bls12.pG1gen);
    //console.log('pairingEq2_result:', pairingEq2_result);
    // if pairing check works, then pairingEq2_result == 1

    /*
    const pPreP = bls12.alloc(48*3);
    const pPreQ = bls12.alloc(48*2*3 + 48*2*3*67); // 68 total

    //bls12.instance.exports.bn128_prepareG1(bls12.pG1gen, pPreP);
    //console.log('bls12 prepareG2 result:', bls12.getF12hex(pPreQ));

    bls12.instance.exports.bls12_prepareG2(bls12.pG2gen, pPreQ);
    //console.log('bls12 prepareG2 result:', bls12.getF12hex(pPreQ));

    const fq12len = (48*2*3)*1;

    console.log('bls12 prepareG2 result[0]:', bls12.getF6hex(pPreQ));
    console.log('bls12 prepareG2 result[1]:', bls12.getF6hex(pPreQ + fq12len*1));
    console.log('bls12 prepareG2 result[2]:', bls12.getF6hex(pPreQ + fq12len*2));
    console.log('bls12 prepareG2 result[3]:', bls12.getF6hex(pPreQ + fq12len*3));
    console.log('bls12 prepareG2 result[4]:', bls12.getF6hex(pPreQ + fq12len*4));
    console.log('bls12 prepareG2 result[5]:', bls12.getF6hex(pPreQ + fq12len*5));

    console.log('bls12 pTwoInv:', bls12.getF1(bls12.pTwoInv));
    //console.log('bls12 pAltBn128Twist:', bls12.getF2hexMont(bls12.pAltBn128Twist));
    console.log('bls12 pAltBn128Twist:', bls12.getF2hex(bls12.pAltBn128Twist));
    */


    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

runBench();
