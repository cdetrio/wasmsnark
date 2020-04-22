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


async function runBench() {
  try {
    const bls12 = await buildBls12();
    const n8 = bls12.n8;
    console.log('n8:', n8);

    /*
    # Generator for curve over FQ
    G1 = (FQ(1), FQ(2))
    // why aren't these (1, 2)?

    const p1_coords_affine = [
                 refBigInt("1624070059937464756887933993293429854168590106605707304006200119738501412969"),
                 refBigInt("3269329550605213075043232856820720631601935657990457502777101397807070461336")
               ];
    */


    const p1_coords_affine = [
                 refBigInt("3685416753713387016781088315183077757961620795782546409894578378688607592378376318836054947676345821548104185464507"),
                 refBigInt("1339506544944476473020471379941921221584933875938349620426543736416511423956333506472724655353366534992391756441569")
               ];

    const p1 = bls12.alloc(n8*3);
    bls12.setG1Affine(p1, p1_coords_affine);
    ///console.log('p1 before g1_toMontgomery:', bls12.getG1(p1));
    bls12.instance.exports.g1m_toMontgomery(p1, p1);
    console.log('p1 (in normal form):', bls12.getG1(p1));

    const p_result = bls12.alloc(n8*3);

    // scalar from the bn128mul_cdetrio11 test vector
    // 0xffff.. mod the bn128 modulus
    // 0xe0a77c19a07df2f666ea36f7879462e36fc76959f60cd29ac96341c4ffffffa
    const s_reduced = bls12.alloc(n8);
    //bls12.setInt(s_reduced, "6350874878119819312338956282401532410528162663560392320966563075034087161850");
    bls12.setF1(s_reduced, "42");

    console.time('g1m_timesScalar');
    bls12.instance.exports.g1m_timesScalar(p1, s_reduced, n8, p_result);
    console.timeEnd('g1m_timesScalar');

    const p_result_jacobian = bls12.getG1(p_result);
    console.log('p_result_jacobian:', p_result_jacobian);


    const p_result_affine = bls12.alloc(n8*3);
    bls12.instance.exports.g1m_affine(p_result, p_result_affine);
    const g1_result_affine = bls12.getG1(p_result_affine);
    console.log('g1_result_affine:', g1_result_affine);
    /*

    // the correct result (matches py_ecc)

    getF1 r: 1
    g1_result_normal: [
      '1983873765974394053638442523375087470331748000736383567808854590447652054859907830989243032669007682302800810318920',
      '84294790897768358280729139558542294020936903043834301551634579903689511426257434283606999889280642652447788957105',
      '1'
    ]
    */



    /*
    const p_result_affine = bls12.alloc(n8*3);
    bls12.instance.exports.g1m_affine(p_result, p_result_affine);

    // getG1 converts with f1m_fromMontgomery before returning
    const g1_result_normal = bls12.getG1(p_result_affine);
    console.log('g1_result_normal:', g1_result_normal);

    const p_result_normal = bls12.alloc(n8*3);
    bls12.instance.exports.g1m_fromMontgomery(p_result_affine, p_result_normal);
    console.log('bin2g1:', bls12.bin2g1(bls12.getBin(p_result_normal, 96)));
    */



    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

runBench();
