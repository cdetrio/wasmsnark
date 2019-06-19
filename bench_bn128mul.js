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
const refBn128 = require("snarkjs").bn128;
const refBigInt = require("snarkjs").bigInt;

const buildBn128 = require("./index.js").buildBn128;


buildBn128().then( (bn128) => {
    //const refD = refBn128.G1.mulScalar(refBn128.g1, 55);

    // refBn128.g1 is [1n, 2n, 1n]
    //this.g1 = [ bigInt(1), bigInt(2), bigInt(1)];
    //const p1 = bn128.g1_allocPoint(refBn128.g1);

    /*
    // the coords below are from this precompile test case
    {
      "name": "bn128_mul-cdetrio11",
      "input": "039730ea8dff1254c0fee9c0ea777d29a9c710b7e616683f194f18c43b43b869073a5ffcc6fc7a28c30723d6e58ce577356982d65b833a5a5c15bf9024b43d98ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      "expected": "00a1a234d08efaa2616607e31eca1980128b00b415c845ff25bba3afcb81dc00242077290ed33906aeb8e42fd98c41bcb9057ba03421af3f2d08cfc441186024"
    },
    */

    const p1_coords = [
                 refBigInt("1624070059937464756887933993293429854168590106605707304006200119738501412969"),
                 refBigInt("3269329550605213075043232856820720631601935657990457502777101397807070461336"),
                 refBigInt(1)
               ];

    const p1 = bn128.g1_allocPoint(p1_coords);
    // p1 is a memory position

    console.log('doing g1_toMontgomery...');
    bn128.g1_toMontgomery(p1, p1);
    console.log('g1_toMontgomery succeeded.');

    //const s = bn128.allocInt(55);
    // allocInt passes the argument to putInt() which passes it to bigInt(_a)
    //const scalar = refBigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")
    //const s = bn128.allocInt(scalar)
    const s = bn128.allocInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")


    //const s = bn128.allocInt(55);

    /*
    const pNonResidueF2 =  moduleBuilder.alloc(
        utils.bigInt2BytesLE(
            bigInt("15537367993719455909907449462855742678907882278146377936676643359958227611562"), // -1 in montgomery
            bn128.n8
        )
    );
    */
    //const bigScalar = 
    
    console.time('g1_timesScalar');
    bn128.g1_timesScalar(p1, s, 32, p1);
    console.timeEnd('g1_timesScalar');

    console.time('g1_affine');
    bn128.g1_affine(p1, p1);
    console.timeEnd('g1_affine');

    console.time('g1_fromMontgomery');
    bn128.g1_fromMontgomery(p1, p1);
    console.timeEnd('g1_fromMontgomery');
    const d = bn128.g1_getPoint(p1);

    for (let i=0; i<3; i++) {
        d[i] = refBigInt(d[i].toString());
    }

    //assert(refBn128.G1.equals(d, refD));
    console.log('got result:', d);
});

