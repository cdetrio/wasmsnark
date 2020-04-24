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

const buildBn128 = require("./src/bn128.js");


async function runBench() {
  try {
    const bn128 = await buildBn128();
    const n8 = bn128.n8;

    const p1_coords_affine = [
                 refBigInt("1624070059937464756887933993293429854168590106605707304006200119738501412969"),
                 refBigInt("3269329550605213075043232856820720631601935657990457502777101397807070461336")
               ];

    const p1 = bn128.alloc(n8*3);
    bn128.setG1Affine(p1, p1_coords_affine);
    bn128.instance.exports.g1m_toMontgomery(p1, p1);

    const p_result = bn128.alloc(n8*3);

    // scalar from the bn128mul_cdetrio11 test vector
    // 0xffff.. mod the bn128 modulus
    // 0xe0a77c19a07df2f666ea36f7879462e36fc76959f60cd29ac96341c4ffffffa
    const s_reduced = bn128.alloc(n8);
    //bn128.setInt(s_reduced, "6350874878119819312338956282401532410528162663560392320966563075034087161850");
    bn128.setF1(s_reduced, "6350874878119819312338956282401532410528162663560392320966563075034087161850");

    console.time('g1m_timesScalar');
    bn128.instance.exports.g1m_timesScalar(p1, s_reduced, n8, p_result);
    console.timeEnd('g1m_timesScalar');

    const p_result_affine = bn128.alloc(n8*3);
    bn128.instance.exports.g1m_affine(p_result, p_result_affine);

    // getG1 converts with f1m_fromMontgomery before returning
    const g1_result_normal = bn128.getG1(p_result_affine);
    console.log('g1_result_normal:', g1_result_normal);



    /***  test G2 scalar mul  ***/

    console.log('bn128.pG2gen:', bn128.getG2(bn128.pG2gen));
    const g2_times_2 = bn128.alloc(n8*6);

    const scalar_two = bn128.alloc(n8);
    bn128.setF1(scalar_two, "2");

    bn128.instance.exports.g2m_timesScalar(bn128.pG2gen, scalar_two, n8, g2_times_2);
    //console.log('bls12 g2 times 2 result:', bls12.getG2(g2_times_2));

    const g2_times_2_affine = bn128.alloc(n8*3);
    bn128.instance.exports.g2m_affine(g2_times_2, g2_times_2_affine);
    console.log('g2_times_2_affine:', bn128.getG2(g2_times_2_affine));


    /*** try pairing test ***/
    // try test like https://github.com/ethereum/py_ecc/blob/master/tests/test_bn128_and_bls12_381.py#L315-L319

    const pairing1_result = bn128.alloc(n8*12);

    bn128.instance.exports.bn128_pairing(bn128.pG1gen, bn128.pG2gen, pairing1_result);
    console.log('bn128 pairing1 result:', bn128.getF12(pairing1_result));

    const pairing1_result_squared = bn128.alloc(n8*12);
    bn128.instance.exports.ftm_mul(pairing1_result, pairing1_result, pairing1_result_squared);
     console.log('bn128 pairing1 result squared:', bn128.getF12(pairing1_result_squared));

    const pairing2_result = bn128.alloc(n8*12);

    bn128.instance.exports.bn128_pairing(bn128.pG1gen, g2_times_2, pairing2_result);
    //bn128.instance.exports.bn128_pairing(g2_times_2_affine, bn128.pG1gen, pairing2_result);
    console.log('bn128 pairing2 result:', bn128.getF12(pairing2_result));



    //bn128.pOneT
    const g2_times_27 = bn128.alloc(n8*6);
    const g1_times_37 = bn128.alloc(n8*3);
    const g1_times_999 = bn128.alloc(n8*3);

    const scalar_27 = bn128.alloc(n8);
    bn128.setF1(scalar_27, "27");
    const scalar_37 = bn128.alloc(n8);
    bn128.setF1(scalar_37, "37");
    const scalar_999 = bn128.alloc(n8);
    bn128.setF1(scalar_999, "999");

    bn128.instance.exports.g1m_timesScalar(bn128.pG1gen, scalar_37, n8, g1_times_37);
    bn128.instance.exports.g1m_timesScalar(bn128.pG1gen, scalar_999, n8, g1_times_999);
    bn128.instance.exports.g2m_timesScalar(bn128.pG2gen, scalar_27, n8, g2_times_27);

    bn128.instance.exports.g1m_affine(g1_times_37, g1_times_37);
    bn128.instance.exports.g1m_affine(g1_times_999, g1_times_999);
    bn128.instance.exports.g2m_affine(g2_times_27, g2_times_27);

    const g1_times_999_neg = bn128.alloc(n8*3);
    bn128.instance.exports.g1m_neg(g1_times_999, g1_times_999_neg);

    console.log('bn128.pOneT:', bn128.getF12(bn128.pOneT));

    const composit1_result = bn128.alloc(n8*12);
    bn128.instance.exports.bn128_pairing(g1_times_37, g2_times_27, composit1_result);
    console.log('composit1_result:', bn128.getF12(composit1_result));

    const composit2_result = bn128.alloc(n8*12);
    bn128.instance.exports.bn128_pairing(g1_times_999, bn128.pG2gen, composit2_result);
    console.log('composit2_result:', bn128.getF12(composit2_result));


    let pairingEq2_result = bn128.instance.exports.bn128_pairingEq2(g1_times_37, g2_times_27, g1_times_999_neg, bn128.pG2gen, bn128.pOneT);
    console.log('pairingEq2_result:', pairingEq2_result);
    // if pairing check works, then pairingEq2_result == 1







    /*
    const p_result_normal = bn128.alloc(n8*3);
    bn128.instance.exports.g1m_fromMontgomery(p_result_affine, p_result_normal);
    console.log('bin2g1:', bn128.bin2g1(bn128.getBin(p_result_normal, 96)));
    */


    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

runBench();
