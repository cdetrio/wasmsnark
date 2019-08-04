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

const buildSecp256k1 = require("./src/secp256k1.js");


async function runBench() {
  try {
    const secp256k1 = await buildSecp256k1();
    const n8 = secp256k1.n8;

    // reproducing the result from https://repl.it/repls/GaseousSomeParentheses

    // r2 is (x, -y)
    const r2_coords = [
                 refBigInt("9917651955718262520041009585820222035587173505620519252887011035044030238820"),
                 refBigInt("4280010722287889799249109121574574456516862395353170927302685009606632262449")
               ];

    const r2 = secp256k1.alloc(n8*3);
    secp256k1.setG1Affine(r2, r2_coords);
    secp256k1.instance.exports.g1m_toMontgomery(r2, r2);

    // s = 0x173d84e53ad0bb8bbbd2f48703c59697ca33bf9077524d9df154bc944f8f6516
    const s = secp256k1.alloc(n8);
    secp256k1.setF1(s, "10511890398906152036901360541848487139021500646367336956504897166638853350678");

    const s_times_r2_result = secp256k1.alloc(n8*3);

    console.time('g1m_timesScalar');
    secp256k1.instance.exports.g1m_timesScalar(r2, s, n8, s_times_r2_result);
    console.timeEnd('g1m_timesScalar');

    const s_times_r2_result_affine = secp256k1.alloc(n8*3);
    secp256k1.instance.exports.g1m_affine(s_times_r2_result, s_times_r2_result_affine);

    // getG1 converts with f1m_fromMontgomery before returning
    console.log('s_times_r2_result_normal:', secp256k1.getG1(s_times_r2_result_affine));


    const p_gen = secp256k1.pG1gen;

    // e is the hash of the message to sign
    const minus_e_mod_n = secp256k1.alloc(n8);
    secp256k1.setF1(minus_e_mod_n, "54663349441491225292864315432199812783939449645372701154110084112118232030981");

    const p_e_times_gen = secp256k1.alloc(n8*3);

    console.time('g1m_timesScalar_minus_e');
    secp256k1.instance.exports.g1m_timesScalar(p_gen, minus_e_mod_n, n8, p_e_times_gen);
    console.timeEnd('g1m_timesScalar_minus_e');

    const p_e_times_gen_affine = secp256k1.alloc(n8*3);
    secp256k1.instance.exports.g1m_affine(p_e_times_gen, p_e_times_gen_affine);

    // getG1 converts with f1m_fromMontgomery before returning
    const e_times_gen_normal = secp256k1.getG1(p_e_times_gen_affine);
    console.log('e_times_gen_normal:', e_times_gen_normal);

    const muls_added = secp256k1.alloc(n8*3);
    secp256k1.instance.exports.g1m_add(s_times_r2_result, p_e_times_gen, muls_added);

    const muls_added_affine = secp256k1.alloc(n8*3);
    secp256k1.instance.exports.g1m_affine(muls_added, muls_added_affine);
    console.log('muls_added:', secp256k1.getG1(muls_added_affine));

    // r = 0x15ed312c5863d1e3ff253e8c9077c460233f62bc73d69c5364e0f2de0f7cd064
    const r = secp256k1.alloc(n8);
    secp256k1.setF1(r, "9917651955718262520041009585820222035587173505620519252887011035044030238820");

    const r_inverse = secp256k1.alloc(n8);
    secp256k1.instance.exports.fr_inverse(r, r_inverse);
    //console.log('r_inverse:', secp256k1.getF1(r_inverse));
    console.log('r_inverse:', secp256k1.bin2int(secp256k1.getBin(r_inverse, 32)));


    const q2 = secp256k1.alloc(n8*3);
    secp256k1.instance.exports.g1m_timesScalar(muls_added, r_inverse, n8, q2);

    const q2_affine = secp256k1.alloc(n8*3);
    secp256k1.instance.exports.g1m_affine(q2, q2_affine);
    console.log('q2:', secp256k1.getG1(q2_affine));




    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

runBench();
