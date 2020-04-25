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
    console.log('bls12 pairing1 result:', bls12.getF12(pairing1_result));


    const pairing1_result_squared = bls12.alloc(n8*12);
    bls12.instance.exports.ftm_mul(pairing1_result, pairing1_result, pairing1_result_squared);

    console.log('bls12 pairing1 result squared:', bls12.getF12(pairing1_result_squared));


    const pairing2_result = bls12.alloc(n8*12);

    //bls12.instance.exports.bls12_pairing(g2_times_2, bls12.pG1gen, pairing2_result);
    bls12.instance.exports.bls12_pairing(bls12.pG1gen, g2_times_2_affine, pairing2_result);
    console.log('bls12 pairing2 result:', bls12.getF12(pairing2_result));

    console.log('bls12 pairing2 result in hex:', bls12.getF12hex(pairing2_result));


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
