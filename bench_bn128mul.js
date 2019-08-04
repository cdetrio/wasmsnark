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
