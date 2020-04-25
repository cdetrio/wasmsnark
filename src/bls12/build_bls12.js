const bigInt = require("big-integer");
const utils = require("../utils");

const buildF1m =require("../build_f1m.js");
const buildF1 =require("../build_f1.js");
const buildF2m =require("../build_f2m.js");
const buildF3m =require("../build_f3m.js");
const buildCurve =require("./build_curve.js");
const buildFFT = require("../build_fft");
const buildMultiexp = require("../build_multiexp");
const buildPol = require("../build_pol");

module.exports = function buildBLS12(module, _prefix) {

    const prefix = _prefix || "bls12";

    if (module.modules[prefix]) return prefix;  // already builded

    const q = bigInt("4002409555221667393417789825735904156556882819939007885332058136124031650490837864442687629129015664037894272559787"); // field modulus
    //const q = bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
    const r = bigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513"); // curve order


    const n64 = Math.floor((q.minus(1).bitLength() - 1)/64) +1;
    console.log('n64:', n64) // n64 = 6.  number of 64-bit limbs (6 * 64 = 384)
    const n8 = n64*8;
    const frsize = n8;
    const f1size = n8;
    const f2size = f1size * 2;
    const f6size = f1size * 6;
    const ftsize = f1size * 12;

    const pr = module.alloc(utils.bigInt2BytesLE( r, frsize ));

    const f1mPrefix = buildF1m(module, q, "f1m");
    buildF1(module, r, "fr", "frm");
    const g1mPrefix = buildCurve(module, "g1m", "f1m");
    buildMultiexp(module, "g1m", "g1m", "f1m", "fr");
    buildFFT(module, "fft", "frm");
    buildPol(module, "pol", "frm");

    const f2mPrefix = buildF2m(module, "f1m_neg", "f2m", "f1m");
    const g2mPrefix = buildCurve(module, "g2m", "f2m");
    buildMultiexp(module, "g2m", "g2m", "f2m", "fr");




    function toMontgomery(a) {
        return bigInt(a).times( bigInt.one.shiftLeft(f1size*8)).mod(q);
    }

    const G1gen = [
        bigInt("3685416753713387016781088315183077757961620795782546409894578378688607592378376318836054947676345821548104185464507"),
        bigInt("1339506544944476473020471379941921221584933875938349620426543736416511423956333506472724655353366534992391756441569"),
        bigInt.one
    ];

    const pG1gen = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[2]), f1size ),
        ]
    );

    const G1zero = [
        bigInt.zero,
        bigInt.one,
        bigInt.zero
    ];

    const pG1zero = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[2]), f1size )
        ]
    );

    const G2gen = [
        [
            bigInt("352701069587466618187139116011060144890029952792775240219908644239793785735715026873347600343865175952761926303160"),
            bigInt("3059144344244213709971259814753781636986470325476647558659373206291635324768958432433509563104347017837885763365758"),
        ],[
            bigInt("1985150602287291935568054521177171638300868978215655730859378665066344726373823718423869104263333984641494340347905"),
            bigInt("927553665492332455747201965776037880757740193453592970025027978793976877002675564980949289727957565575433344219582"),
        ],[
            bigInt.one,
            bigInt.zero,
        ]
    ];

    const pG2gen = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[0][0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[0][1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[1][0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[1][1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[2][0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[2][1]), f1size ),
        ]
    );

    const G2zero = [
        [
            bigInt.zero,
            bigInt.zero,
        ],[
            bigInt.one,
            bigInt.zero,
        ],[
            bigInt.zero,
            bigInt.zero,
        ]
    ];

    const pG2zero = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[0][0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[0][1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[1][0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[1][1]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[2][0]), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[2][1]), f1size ),
        ]
    );

    const pOneT = module.alloc([
        ...utils.bigInt2BytesLE( toMontgomery(1), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(0), f1size ),
    ]);

    const pNonResidueF6 = module.alloc([
    //    ...utils.bigInt2BytesLE( toMontgomery(9), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery(9), f1size ), // using 0 here produces some correct results
        ...utils.bigInt2BytesLE( toMontgomery(1), f1size ), // using 1 here produces some correct results
    ]);
    const pAltBn128Twist = pNonResidueF6;



    const pTwoInv = module.alloc([
        ...utils.bigInt2BytesLE( toMontgomery(  bigInt(2).modInv(q)), f1size ),
        ...utils.bigInt2BytesLE( bigInt(0), f1size )
    ]);
    //console.log('pTwoInv:', )


    // taken from `BLS12_381_B_FOR_G2_C0_REPR` https://github.com/matter-labs/eip1962/blob/master/src/engines/bls12_381.rs#L166-L167
    // matches up with https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/fq.rs#L71-L78
    //const pTwistCoefB = module.alloc([
    //    ...utils.bigInt2BytesLE( toMontgomery("1514052131932888505822357196874193114600527104240479143842906308145652716846165732392247483508051665748635331395571"), f1size ),
    //    ...utils.bigInt2BytesLE( toMontgomery("1514052131932888505822357196874193114600527104240479143842906308145652716846165732392247483508051665748635331395571"), f1size ),
    //]);
    const pTwistCoefB = module.alloc([
        ...utils.bigInt2BytesLE( toMontgomery("4"), f1size ),
        ...utils.bigInt2BytesLE( toMontgomery("4"), f1size ),
    ]);



    function build_mulNR6() {
        const f = module.addFunction(prefix + "_mulNR6");
        f.addParam("x", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.call(
                f2mPrefix + "_mul",
                c.i32_const(pNonResidueF6),
                c.getLocal("x"),
                c.getLocal("pr")
            )
        );
    }
    build_mulNR6();

    const f6mPrefix = buildF3m(module, prefix+"_mulNR6", "f6m", "f2m");

    function build_mulNR12() {
        const f = module.addFunction(prefix + "_mulNR12");
        f.addParam("x", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.call(
                f2mPrefix + "_mul",
                c.i32_const(pNonResidueF6),
                c.i32_add(c.getLocal("x"), c.i32_const(n8*4)),
                c.getLocal("pr")
            ),
            c.call(
                f2mPrefix + "_copy",
                c.getLocal("x"),
                c.i32_add(c.getLocal("pr"), c.i32_const(n8*2)),
            ),
            c.call(
                f2mPrefix + "_copy",
                c.i32_add(c.getLocal("x"), c.i32_const(n8*2)),
                c.i32_add(c.getLocal("pr"), c.i32_const(n8*4)),
            )
        );
    }
    build_mulNR12();

    const ftmPrefix = buildF2m(module, prefix+"_mulNR12", "ftm", f6mPrefix);

    module.modules[prefix] = {
        n64: n64,
        pG1gen: pG1gen,
        pG1zero: pG1zero,
        pG2gen: pG2gen,
        pG2zero: pG2zero,
        pq: module.modules["f1m"].pq,
        pr: pr,
        pOneT: pOneT,
        pTwoInv: pTwoInv,
        pAltBn128Twist: pAltBn128Twist
        
    };

    // ateLoopCount matches up with BLS_X https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L24
    const ateLoopCount = bigInt("15132376222941642752");
    const ateLoopBitBytes = bits(ateLoopCount);
    const pAteLoopBitBytes = module.alloc(ateLoopBitBytes);
    const isLoopNegative = true; // taken from https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L25

    const ateCoefSize = 3 * f2size;
    const ateNDblCoefs = ateLoopBitBytes.length-1;
    console.log('ateNDblCoefs:', ateNDblCoefs);
    const ateNAddCoefs = ateLoopBitBytes.reduce((acc, b) =>  acc + ( b!=0 ? 1 : 0)   ,0);
    console.log('ateNAddCoefs:', ateNAddCoefs);
    const ateNCoefs = ateNAddCoefs + ateNDblCoefs + 1;
    const prePSize = 3*2*n8;
    const preQSize = 3*n8*2 + ateNCoefs*ateCoefSize;

    // TODO: use correct finalExpZ ???  Haven't noticed a corresponding param in a BLS implementation

    // here is the BN parameter https://github.com/zcash-hackworks/bn/blob/f7116294867fab32137cb9cca9b94c661f3ee4e6/src/fields/fq12.rs#L99
    // this is BN_PARAM_U (see https://github.com/ethereum/py_ecc/pull/3)
    //const finalExpZ = bigInt("4965661367192848881");

    // finalExpZ is BN_PARAM_U, which for BLS is -0xd201000000010000
    const finalExpZ = bigInt("15132376222941642752");
    const finalExpIsNegative = true; // in BLS, BN_PARAM_U is negative

    function naf(n) {
        let E = n;
        const res = [];
        while (E.gt(bigInt.zero)) {
            if (E.isOdd()) {
                const z = 2 - E.mod(4).toJSNumber();
                res.push( z );
                E = E.minus(z);
            } else {
                res.push( 0 );
            }
            E = E.shiftRight(1);
        }
        return res;
    }

    function bits(n) {
        let E = n;
        const res = [];
        while (E.gt(bigInt.zero)) {
            if (E.isOdd()) {
                res.push( 1 );
            } else {
                res.push( 0 );
            }
            E = E.shiftRight(1);
        }
        return res;
    }

    function buildPrepareG1() {
        const f = module.addFunction(prefix+ "_prepareG1");
        f.addParam("pP", "i32");
        f.addParam("ppreP", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.call(g1mPrefix + "_affine", c.getLocal("pP"), c.getLocal("ppreP")),  // TODO Remove if already in affine
        );
    }

    function buildPrepAddStep() {
        const f = module.addFunction(prefix+ "_prepAddStep");
        f.addParam("pQ", "i32");
        f.addParam("pR", "i32");
        f.addParam("pCoef", "i32");

        const c = f.getCodeBuilder();

        const X2  = c.getLocal("pQ");
        const Y2  = c.i32_add(c.getLocal("pQ"), c.i32_const(f2size));

        const X1  = c.getLocal("pR");
        const Y1  = c.i32_add(c.getLocal("pR"), c.i32_const(f2size));
        const Z1  = c.i32_add(c.getLocal("pR"), c.i32_const(2*f2size));

        const ELL_0  = c.getLocal("pCoef");
        const ELL_VW = c.i32_add(c.getLocal("pCoef"), c.i32_const(f2size));
        const ELL_VV  = c.i32_add(c.getLocal("pCoef"), c.i32_const(2*f2size));

        const D = ELL_VW;
        const E = c.i32_const(module.alloc(f2size));
        const F = c.i32_const(module.alloc(f2size));
        const G = c.i32_const(module.alloc(f2size));
        const H = c.i32_const(module.alloc(f2size));
        const I = c.i32_const(module.alloc(f2size));
        const J = c.i32_const(module.alloc(f2size));
        const AUX = c.i32_const(module.alloc(f2size));

        f.addCode(
            // D = X1 - X2*Z1
            c.call(f2mPrefix + "_mul", X2, Z1, D),
            c.call(f2mPrefix + "_sub", X1, D, D),

            // E = Y1 - Y2*Z1
            c.call(f2mPrefix + "_mul", Y2, Z1, E),
            c.call(f2mPrefix + "_sub", Y1, E, E),

            // F = D^2
            c.call(f2mPrefix + "_square", D, F),

            // G = E^2
            c.call(f2mPrefix + "_square", E, G),

            // H = D*F
            c.call(f2mPrefix + "_mul", D, F, H),

            // I = X1 * F
            c.call(f2mPrefix + "_mul", X1, F, I),

            // J = H + Z1*G - (I+I)
            c.call(f2mPrefix + "_add", I, I, AUX),
            c.call(f2mPrefix + "_mul", Z1, G, J),
            c.call(f2mPrefix + "_add", H, J, J),
            c.call(f2mPrefix + "_sub", J, AUX, J),


            // X3 (X1) = D*J
            c.call(f2mPrefix + "_mul", D, J, X1),

            // Y3 (Y1) = E*(I-J)-(H*Y1)
            c.call(f2mPrefix + "_mul", H, Y1, Y1),
            c.call(f2mPrefix + "_sub", I, J, AUX),
            c.call(f2mPrefix + "_mul", E, AUX, AUX),
            c.call(f2mPrefix + "_sub", AUX, Y1, Y1),

            // Z3 (Z1) = Z1*H
            c.call(f2mPrefix + "_mul", Z1, H, Z1),

            // ell_0 = xi * (E * X2 - D * Y2)
            c.call(f2mPrefix + "_mul", D, Y2, AUX),
            c.call(f2mPrefix + "_mul", E, X2, ELL_0),
            c.call(f2mPrefix + "_sub", ELL_0, AUX, ELL_0),


            //c.call(f2mPrefix + "_mul", ELL_0, c.i32_const(pAltBn128Twist), ELL_0),
            // this is commented out `j.mul_by_nonresidue(self.fp6_extension);` in eip1962 for bn128

            // ell_VV = - E (later: * xP)
            c.call(f2mPrefix + "_neg", E, ELL_VV),

            // ell_VW = D (later: * yP    )
            // Already assigned

        );
    }



    function buildPrepDoubleStep() {
        const f = module.addFunction(prefix+ "_prepDblStep");
        f.addParam("pR", "i32");
        f.addParam("pCoef", "i32");

        const c = f.getCodeBuilder();

        const X1  = c.getLocal("pR");
        const Y1  = c.i32_add(c.getLocal("pR"), c.i32_const(f2size));
        const Z1  = c.i32_add(c.getLocal("pR"), c.i32_const(2*f2size));

        const ELL_0  = c.getLocal("pCoef");
        const ELL_VW = c.i32_add(c.getLocal("pCoef"), c.i32_const(f2size));
        const ELL_VV  = c.i32_add(c.getLocal("pCoef"), c.i32_const(2*f2size));

        const A = c.i32_const(module.alloc(f2size));
        const B = c.i32_const(module.alloc(f2size));
        const C = c.i32_const(module.alloc(f2size));
        const D = c.i32_const(module.alloc(f2size));
        const E = c.i32_const(module.alloc(f2size));
        const F = c.i32_const(module.alloc(f2size));
        const G = c.i32_const(module.alloc(f2size));
        const H = c.i32_const(module.alloc(f2size));
        const I = c.i32_const(module.alloc(f2size));
        const J = c.i32_const(module.alloc(f2size));
        const E2 = c.i32_const(module.alloc(f2size));
        const AUX = c.i32_const(module.alloc(f2size));

        f.addCode(

            // pTwoInv = 0xd0088f51cbff34d258dd3db21a5d66bb23ba5c279c2895fb39869507b587b120f55ffff58a9ffffdcff7fffffffd556

            // A = X1 * Y1 / 2
            c.call(f2mPrefix + "_mul", Y1, c.i32_const(pTwoInv), A),
            c.call(f2mPrefix + "_mul", X1, A, A),

            // B = Y1^2
            c.call(f2mPrefix + "_square", Y1, B),

            // C = Z1^2
            c.call(f2mPrefix + "_square", Z1, C), // c.square();

            // D = 3 * C
            c.call(f2mPrefix + "_add", C, C, D), // t0.double();
            c.call(f2mPrefix + "_add", D, C, D),  // t0.add_assign(&c);

            // E = twist_b * D
            c.call(f2mPrefix + "_mul", c.i32_const(pTwistCoefB), D, E), // e.mul_assign(&t0);
            // (4, 4)

            // F = 3 * E
            c.call(f2mPrefix + "_add", E, E, F), // f.double();
            c.call(f2mPrefix + "_add", E, F, F), // f.add_assign(&e);

            // G = (B+F)/2
            c.call(f2mPrefix + "_add", B, F, G), // g.add_assign(&f);
            c.call(f2mPrefix + "_mul", G, c.i32_const(pTwoInv), G), // g.mul_by_fp(two_inv)

            // H = (Y1+Z1)^2-(B+C)
            c.call(f2mPrefix + "_add", B, C, AUX), // t1.add_assign(&c);
            c.call(f2mPrefix + "_add", Y1, Z1, H), // h.add_assign(&r.z);
            c.call(f2mPrefix + "_square", H, H),  //  h.square();
            c.call(f2mPrefix + "_sub", H, AUX, H), // h.sub_assign(&t1);

            // I = E-B
            //c.call(f2mPrefix + "_sub", E, B, I),
            c.call(f2mPrefix + "_sub", E, B, ELL_0),

            // J = X1^2
            c.call(f2mPrefix + "_square", X1, J),

            // E_squared = E^2
            c.call(f2mPrefix + "_square", E, E2),

            // X3 (X1) = A * (B-F)
            c.call(f2mPrefix + "_sub", B, F, AUX),
            c.call(f2mPrefix + "_mul", A, AUX, X1),

            // Y3 (Y1) = G^2 - 3*E^2
            c.call(f2mPrefix + "_add", E2, E2, AUX),
            c.call(f2mPrefix + "_add", E2, AUX, AUX),
            c.call(f2mPrefix + "_square", G, Y1),
            c.call(f2mPrefix + "_sub", Y1, AUX, Y1),

            // Z3 (Z1) = B * H
            c.call(f2mPrefix + "_mul", B, H, Z1),

            // ell_0 = xi * I
            //c.call(f2mPrefix + "_mul", c.i32_const(pAltBn128Twist), I, ELL_0),
            // this is commented out `i.mul_by_nonresidue(self.fp6_extension);` in eip1962 for bn128

            // ell_VW = - H (later: * yP)
            c.call(f2mPrefix + "_neg", H, ELL_VW),

            // ell_VV = 3*J (later: * xP)
            c.call(f2mPrefix + "_add", J, J, ELL_VV),
            c.call(f2mPrefix + "_add", J, ELL_VV, ELL_VV),

        );
    }

    /*
    function buildMulByQ() {
        const f = module.addFunction(prefix + "_mulByQ");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(f2size));
        const z = c.i32_add(c.getLocal("p1"), c.i32_const(f2size*2));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(f2size));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(f2size*2));

        // TODO: use correct MulByQX ???
        // are these the MulByQX and MulByQY params for BN?? https://github.com/zcash-hackworks/bn/blob/master/src/groups/mod.rs#L456-L470
        const MulByQX = c.i32_const(module.alloc([
            ...utils.bigInt2BytesLE( toMontgomery("21575463638280843010398324269430826099269044274347216827212613867836435027261"), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery("10307601595873709700152284273816112264069230130616436755625194854815875713954"), f1size ),
        ]));

        // TODO: use correct MulByQY ???
        const MulByQY = c.i32_const(module.alloc([
            ...utils.bigInt2BytesLE( toMontgomery("2821565182194536844548159561693502659359617185244120367078079554186484126554"), f1size ),
            ...utils.bigInt2BytesLE( toMontgomery("3505843767911556378687030309984248845540243509899259641013678093033130930403"), f1size ),
        ]));

        f.addCode(
            // The frobeniusMap(1) in this field, is the conjugate
            c.call(f2mPrefix + "_conjugate", x, x3),
            c.call(f2mPrefix + "_mul", MulByQX, x3, x3),
            c.call(f2mPrefix + "_conjugate", y, y3),
            c.call(f2mPrefix + "_mul", MulByQY, y3, y3),
            c.call(f2mPrefix + "_conjugate", z, z3),
        );
    }
    */


    function buildPrepareG2() {
        //buildMulByQ();
        const f = module.addFunction(prefix+ "_prepareG2");
        f.addParam("pQ", "i32");
        f.addParam("ppreQ", "i32");
        f.addLocal("pCoef", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const QX = c.getLocal("pQ");
        const QY = c.i32_add( c.getLocal("pQ"), c.i32_const(f2size));
        const QZ = c.i32_add( c.getLocal("pQ"), c.i32_const(f2size*2));

        const pR = module.alloc(f2size*3);
        const R = c.i32_const(pR);
        const RX = c.i32_const(pR);
        const RY = c.i32_const(pR+f2size);
        const RZ = c.i32_const(pR+2*f2size);

        const cQX = c.i32_add( c.getLocal("ppreQ"), c.i32_const(0));
        const cQY = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f2size));
        const cQZ = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f2size*2));

        const pQ1 = module.alloc(f2size*3);
        const Q1 = c.i32_const(pQ1);

        const pQ2 = module.alloc(f2size*3);
        const Q2 = c.i32_const(pQ2);
        const Q2X = c.i32_const(pQ2);
        const Q2Y = c.i32_const(pQ2 + f2size);
        const Q2Z = c.i32_const(pQ2 + f2size*2);

        f.addCode(
            c.call(g2mPrefix + "_affine", QX, cQX),  // TODO Remove if already in affine
            c.call(f2mPrefix + "_copy", cQX, RX),
            c.call(f2mPrefix + "_copy", cQY, RY),
            c.call(f2mPrefix + "_one", RZ),
        );

        f.addCode(
            c.setLocal("pCoef", c.i32_add( c.getLocal("ppreQ"), c.i32_const(f2size*3))),
            c.setLocal("i", c.i32_const(ateLoopBitBytes.length-2)),
            c.block(c.loop(

                c.call(prefix + "_prepDblStep", R, c.getLocal("pCoef")),
                c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),

                c.if(
                    c.i32_load8_s(c.getLocal("i"), pAteLoopBitBytes),
                    [
                        ...c.call(prefix + "_prepAddStep", cQX, R, c.getLocal("pCoef")),
                        ...c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),
                    ]
                ),
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );

        // I think the _mulByQ is here in BN  https://github.com/matter-labs/eip1962/blob/master/src/pairings/bn/mod.rs#L368-L372
        // or here for BN https://github.com/zcash-hackworks/bn/blob/master/src/groups/mod.rs#L578-L579
        // TODO: I don't see the _mulByQ in a BLS implementation https://github.com/matter-labs/eip1962/blob/master/src/pairings/bls12/mod.rs#L285-L308
        // nor https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L163-L359
        /*
        f.addCode(
            c.call(prefix + "_mulByQ", cQX, Q1),
            c.call(prefix + "_mulByQ", Q1, Q2)
        );
        */


        // this corresponds to BN https://github.com/matter-labs/eip1962/blob/master/src/pairings/bn/mod.rs#L362
        // TODO: I don't see this check for isLoopNegative in a `prepare` function of a BLS implementation https://github.com/matter-labs/eip1962/blob/master/src/pairings/bls12/mod.rs#L285-L308
        // nor https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L163-L359
        /*
        if (isLoopNegative) {
            f.addCode(
                c.call(f2mPrefix + "_neg", RY, RY),
            );
        }

        f.addCode(
            c.call(f2mPrefix + "_neg", Q2Y, Q2Y),

            c.call(prefix + "_prepAddStep", Q1, R, c.getLocal("pCoef")),
            c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),

            c.call(prefix + "_prepAddStep", Q2, R, c.getLocal("pCoef")),
            c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),
        );
        */
    }


    function buildMulBy014() {
        const f = module.addFunction(prefix+ "__mulBy014");
        f.addParam("pEll0", "i32");
        f.addParam("pEllVW", "i32");
        f.addParam("pEllVV", "i32");
        f.addParam("pR", "i32");            // Result in F12

        const c = f.getCodeBuilder();

        /*
        // for mulBy024
        const x0  = c.getLocal("pEll0");
        const x2  = c.getLocal("pEllVV");
        const x4  = c.getLocal("pEllVW");
        */

        // for mulBy014
        const x0  = c.getLocal("pEll0");
        const x4  = c.getLocal("pEllVW");
        const x1  = c.getLocal("pEllVV");

        const z0  = c.getLocal("pR"); // self

        const pAUX12 = module.alloc(ftsize);
        const AUX12 = c.i32_const(pAUX12);
        const AUX12_0 = c.i32_const(pAUX12); // position 0
        const AUX12_2 = c.i32_const(pAUX12+f2size); // position 1
        const AUX12_4 = c.i32_const(pAUX12+f2size*2); // position 2
        const AUX12_6 = c.i32_const(pAUX12+f2size*3); // position 3
        const AUX12_8 = c.i32_const(pAUX12+f2size*4); // position 4
        const AUX12_10 = c.i32_const(pAUX12+f2size*5); // position 5

        // for mul024, positions 0, 2, and 4 are non-zero
        // for mul014, positions 0, 1, and 4 are non-zero

        f.addCode(

            /*
            // for mulby024
            c.call(f2mPrefix + "_copy", x0, AUX12_0), // position 0
            c.call(f2mPrefix + "_zero", AUX12_2),
            c.call(f2mPrefix + "_copy", x2, AUX12_4), // position 2
            c.call(f2mPrefix + "_zero", AUX12_6),
            c.call(f2mPrefix + "_copy", x4, AUX12_8), // position 4
            c.call(f2mPrefix + "_zero", AUX12_10),
            c.call(ftmPrefix + "_mul", AUX12, z0, z0),
            */

            c.call(f2mPrefix + "_copy", x0, AUX12_0), // position 0
            c.call(f2mPrefix + "_copy", x1, AUX12_2), // position 1
            c.call(f2mPrefix + "_zero", AUX12_4),
            c.call(f2mPrefix + "_zero", AUX12_6),
            c.call(f2mPrefix + "_copy", x4, AUX12_8), // position 4
            c.call(f2mPrefix + "_zero", AUX12_10),
            c.call(ftmPrefix + "_mul", AUX12, z0, z0),
        );
    }



    function buildMulBy024Old() {
        const f = module.addFunction(prefix+ "__mulBy024Old");
        f.addParam("pEll0", "i32");
        f.addParam("pEllVW", "i32");
        f.addParam("pEllVV", "i32");
        f.addParam("pR", "i32");            // Result in F12

        const c = f.getCodeBuilder();

        const x0  = c.getLocal("pEll0"); //
        const x2  = c.getLocal("pEllVV");
        const x4  = c.getLocal("pEllVW");

        const z0  = c.getLocal("pR"); // self

        const pAUX12 = module.alloc(ftsize);
        const AUX12 = c.i32_const(pAUX12);
        const AUX12_0 = c.i32_const(pAUX12);
        const AUX12_2 = c.i32_const(pAUX12+f2size);
        const AUX12_4 = c.i32_const(pAUX12+f2size*2);
        const AUX12_6 = c.i32_const(pAUX12+f2size*3);
        const AUX12_8 = c.i32_const(pAUX12+f2size*4);
        const AUX12_10 = c.i32_const(pAUX12+f2size*5);

        f.addCode(

            c.call(f2mPrefix + "_copy", x0, AUX12_0),
            c.call(f2mPrefix + "_zero", AUX12_2),
            c.call(f2mPrefix + "_copy", x2, AUX12_4),
            c.call(f2mPrefix + "_zero", AUX12_6),
            c.call(f2mPrefix + "_copy", x4, AUX12_8),
            c.call(f2mPrefix + "_zero", AUX12_10),
            c.call(ftmPrefix + "_mul", AUX12, z0, z0),
        );
    }

    function buildMulBy024() {
        const f = module.addFunction(prefix+ "__mulBy024");
        f.addParam("pEll0", "i32");
        f.addParam("pEllVW", "i32");
        f.addParam("pEllVV", "i32");
        f.addParam("pR", "i32");            // Result in F12

        const c = f.getCodeBuilder();

        const x0  = c.getLocal("pEll0");
        const x2  = c.getLocal("pEllVV");
        const x4  = c.getLocal("pEllVW");

        const z0  = c.getLocal("pR");
        const z1  = c.i32_add(c.getLocal("pR"), c.i32_const(2*n8));
        const z2  = c.i32_add(c.getLocal("pR"), c.i32_const(4*n8));
        const z3  = c.i32_add(c.getLocal("pR"), c.i32_const(6*n8));
        const z4  = c.i32_add(c.getLocal("pR"), c.i32_const(8*n8));
        const z5  = c.i32_add(c.getLocal("pR"), c.i32_const(10*n8));

        const t0 = c.i32_const(module.alloc(f2size));
        const t1 = c.i32_const(module.alloc(f2size));
        const t2 = c.i32_const(module.alloc(f2size));
        const s0 = c.i32_const(module.alloc(f2size));
        const T3 = c.i32_const(module.alloc(f2size));
        const T4 = c.i32_const(module.alloc(f2size));
        const D0 = c.i32_const(module.alloc(f2size));
        const D2 = c.i32_const(module.alloc(f2size));
        const D4 = c.i32_const(module.alloc(f2size));
        const S1 = c.i32_const(module.alloc(f2size));
        const AUX = c.i32_const(module.alloc(f2size));

        f.addCode(

            // D0 = z0 * x0;
            c.call(f2mPrefix + "_mul", z0, x0, D0),
            // D2 = z2 * x2;
            c.call(f2mPrefix + "_mul", z2, x2, D2),
            // D4 = z4 * x4;
            c.call(f2mPrefix + "_mul", z4, x4, D4),
            // t2 = z0 + z4;
            c.call(f2mPrefix + "_add", z0, z4, t2),
            // t1 = z0 + z2;
            c.call(f2mPrefix + "_add", z0, z2, t1),
            // s0 = z1 + z3 + z5;
            c.call(f2mPrefix + "_add", z1, z3, s0),
            c.call(f2mPrefix + "_add", s0, z5, s0),


            // For z.a_.a_ = z0.
            // S1 = z1 * x2;
            c.call(f2mPrefix + "_mul", z1, x2, S1),
            // T3 = S1 + D4;
            c.call(f2mPrefix + "_add", S1, D4, T3),
            // T4 = my_Fp6::non_residue * T3 + D0;
            c.call(f2mPrefix + "_mul", c.i32_const(pNonResidueF6), T3, T4),
            c.call(f2mPrefix + "_add", T4, D0, z0),
            // z0 = T4;

            // For z.a_.b_ = z1
            // T3 = z5 * x4;
            c.call(f2mPrefix + "_mul", z5, x4, T3),
            // S1 = S1 + T3;
            c.call(f2mPrefix + "_add", S1, T3, S1),
            // T3 = T3 + D2;
            c.call(f2mPrefix + "_add", T3, D2, T3),
            // T4 = my_Fp6::non_residue * T3;
            c.call(f2mPrefix + "_mul", c.i32_const(pNonResidueF6), T3, T4),
            // T3 = z1 * x0;
            c.call(f2mPrefix + "_mul", z1, x0, T3),
            // S1 = S1 + T3;
            c.call(f2mPrefix + "_add", S1, T3, S1),
            // T4 = T4 + T3;
            c.call(f2mPrefix + "_add", T4, T3, z1),
            // z1 = T4;



            // For z.a_.c_ = z2
            // t0 = x0 + x2;
            c.call(f2mPrefix + "_add", x0, x2, t0),
            // T3 = t1 * t0 - D0 - D2;
            c.call(f2mPrefix + "_mul", t1, t0, T3),
            c.call(f2mPrefix + "_add", D0, D2, AUX),
            c.call(f2mPrefix + "_sub", T3, AUX, T3),
            // T4 = z3 * x4;
            c.call(f2mPrefix + "_mul", z3, x4, T4),
            // S1 = S1 + T4;
            c.call(f2mPrefix + "_add", S1, T4, S1),


            // For z.b_.a_ = z3 (z3 needs z2)
            // t0 = z2 + z4;
            c.call(f2mPrefix + "_add", z2, z4, t0),
            // T3 = T3 + T4;
            // z2 = T3;
            c.call(f2mPrefix + "_add", T3, T4, z2),
            // t1 = x2 + x4;
            c.call(f2mPrefix + "_add", x2, x4, t1),
            // T3 = t0 * t1 - D2 - D4;
            c.call(f2mPrefix + "_mul", t1, t0, T3),
            c.call(f2mPrefix + "_add", D2, D4, AUX),
            c.call(f2mPrefix + "_sub", T3, AUX, T3),
            // T4 = my_Fp6::non_residue * T3;
            c.call(f2mPrefix + "_mul", c.i32_const(pNonResidueF6), T3, T4),
            // T3 = z3 * x0;
            c.call(f2mPrefix + "_mul", z3, x0, T3),
            // S1 = S1 + T3;
            c.call(f2mPrefix + "_add", S1, T3, S1),
            // T4 = T4 + T3;
            c.call(f2mPrefix + "_add", T4, T3, z3),
            // z3 = T4;

            // For z.b_.b_ = z4
            // T3 = z5 * x2;
            c.call(f2mPrefix + "_mul", z5, x2, T3),
            // S1 = S1 + T3;
            c.call(f2mPrefix + "_add", S1, T3, S1),
            // T4 = my_Fp6::non_residue * T3;
            c.call(f2mPrefix + "_mul", c.i32_const(pNonResidueF6), T3, T4),
            // t0 = x0 + x4;
            c.call(f2mPrefix + "_add", x0, x4, t0),
            // T3 = t2 * t0 - D0 - D4;
            c.call(f2mPrefix + "_mul", t2, t0, T3),
            c.call(f2mPrefix + "_add", D0, D4, AUX),
            c.call(f2mPrefix + "_sub", T3, AUX, T3),
            // T4 = T4 + T3;
            c.call(f2mPrefix + "_add", T4, T3, z4),
            // z4 = T4;

            // For z.b_.c_ = z5.
            // t0 = x0 + x2 + x4;
            c.call(f2mPrefix + "_add", x0, x2, t0),
            c.call(f2mPrefix + "_add", t0, x4, t0),
            // T3 = s0 * t0 - S1;
            c.call(f2mPrefix + "_mul", s0, t0, T3),
            c.call(f2mPrefix + "_sub", T3, S1, z5),
            // z5 = T3;

        );
    }


    function buildMillerLoop() {
        const f = module.addFunction(prefix+ "_millerLoop");
        f.addParam("ppreP", "i32");
        f.addParam("ppreQ", "i32");
        f.addParam("r", "i32");
        f.addLocal("pCoef", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const preP_PX = c.getLocal("ppreP");
        const preP_PY = c.i32_add(c.getLocal("ppreP"), c.i32_const(f1size));

        const ELL_0  = c.getLocal("pCoef"); // c0 (coeffs.0)
        const ELL_VW = c.i32_add(c.getLocal("pCoef"), c.i32_const(f2size)); // c1 (coeffs.1) ??
        const ELL_VV  = c.i32_add(c.getLocal("pCoef"), c.i32_const(2*f2size)); // c2 (coeffs.2) ??


        const pVW = module.alloc(f2size);
        const VW = c.i32_const(pVW);
        const pVV = module.alloc(f2size);
        const VV = c.i32_const(pVV);

        const F = c.getLocal("r");


        f.addCode(
            c.call(ftmPrefix + "_one", F),

            c.setLocal("pCoef", c.i32_add( c.getLocal("ppreQ"), c.i32_const(f2size*3))),

            c.setLocal("i", c.i32_const(ateLoopBitBytes.length-2)),
            c.block(c.loop(


                c.call(ftmPrefix + "_square", F, F),

                c.call(f2mPrefix + "_mul1", ELL_VW, preP_PY, VW), // c2.mul_by_fp(&p.y) in eip1962 (c2 == ELL_VW)
                c.call(f2mPrefix + "_mul1", ELL_VV, preP_PX, VV), // c1.mul_by_fp(&p.x) in eip1962 (c1 == ELL_VV)

                // mulBy024 corresponds to this in BN https://github.com/zcash-hackworks/bn/blob/master/src/groups/mod.rs#L502
                // or mul_by_014 and mul_by_034 in BN https://github.com/matter-labs/eip1962/blob/master/src/pairings/bn/mod.rs#L135
                // TODO: I see mul_by_014 in BLS  https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L68
                // also in this BLS implementation https://github.com/matter-labs/eip1962/blob/master/src/pairings/bls12/mod.rs#L129
                //c.call(prefix + "__mulBy024", ELL_0, VW, VV, F),
                c.call(prefix + "__mulBy014", ELL_0, VW, VV, F),
                c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),

                c.if(
                    c.i32_load8_s(c.getLocal("i"), pAteLoopBitBytes),
                    [
                        ...c.call(f2mPrefix + "_mul1", ELL_VW, preP_PY, VW),
                        ...c.call(f2mPrefix + "_mul1", ELL_VV, preP_PX, VV),

                        // TODO: like _mulBy024 above
                        //...c.call(prefix + "__mulBy024", ELL_0, VW, VV, F),
                        ...c.call(prefix + "__mulBy014", ELL_0, VW, VV, F),
                        
                        ...c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),

                    ]
                ),
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))

        );

        if (isLoopNegative) {
            f.addCode(
                c.call(ftmPrefix + "_inverse", F, F),
            );
        }

        // corresponds to this in BN??  https://github.com/matter-labs/eip1962/blob/master/src/pairings/bn/mod.rs#L493-L499
        // TODO: no correspondence in BLS  https://github.com/matter-labs/eip1962/blob/master/src/pairings/bls12/mod.rs#L446-L450
        // https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L97-L101

        /*
        f.addCode(
            c.call(f2mPrefix + "_mul1", ELL_VW, preP_PY, VW),
            c.call(f2mPrefix + "_mul1", ELL_VV, preP_PX, VV),
            c.call(prefix + "__mulBy024", ELL_0, VW, VV, F),
            c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),

            c.call(f2mPrefix + "_mul1", ELL_VW, preP_PY, VW),
            c.call(f2mPrefix + "_mul1", ELL_VV, preP_PX, VV),
            c.call(prefix + "__mulBy024", ELL_0, VW, VV, F),
            c.setLocal("pCoef", c.i32_add(c.getLocal("pCoef"), c.i32_const(ateCoefSize))),
        );
        */


    }


    function buildFrobeniusMap(n) {
        const F12 = [
            [
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
            ],
            // TODO: check which version of Frobenius coefficients to use
            // LayerXcom vesion: https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/fq.rs#L313
            // matter-labs version: https://github.com/matter-labs/eip1962/blob/master/src/engines/bls12_381.rs#L348-L430
            // copied matter-labs version for now
            [
                /*
                const BLS12_381_FP12_FROB_C1_0: decl_fp2!(U384Repr) = repr_into_fp2!(
                    repr_into_fp!(
                        // 3380320199399472671518931668520476396067793891014375699959770179129436917079669831430077592723774664465579537268733L
                        U384Repr([0x760900000002fffd,0xebf4000bc40c0002,0x5f48985753c758ba,0x77ce585370525745,0x5c071a97a256ec6d,0x15f65ec3fa80e493]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ), 
                    repr_into_fp!(
                        U384Repr([0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ),
                    U384Repr,
                    BLS12_381_EXTENSION_2_FIELD
                );
                */
                [bigInt("3380320199399472671518931668520476396067793891014375699959770179129436917079669831430077592723774664465579537268733"), bigInt("0")],
                /*
                const BLS12_381_FP12_FROB_C1_1: decl_fp2!(U384Repr) = repr_into_fp2!(
                    repr_into_fp!(
                        // 1376889598125376727959055341295674356654925039980005395128828212993454708588385020118431646457834669954221389501541L
                        U384Repr([0x07089552b319d465,0xc6695f92b50a8313,0x97e83cccd117228f,0xa35baecab2dc29ee,0x1ce393ea5daace4d,0x08f2220fb0fb66eb]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ), 
                    repr_into_fp!(
                        // 2625519957096290665458734484440229799901957779959002490203229923130576941902452844324255982671180994083672883058246L
                        U384Repr([0xb2f66aad4ce5d646,0x5842a06bfc497cec,0xcf4895d42599d394,0xc11b9cba40a8e8d0,0x2e3813cbe5a0de89,0x110eefda88847faf]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ),
                    U384Repr,
                    BLS12_381_EXTENSION_2_FIELD
                );
                */
                [bigInt("1376889598125376727959055341295674356654925039980005395128828212993454708588385020118431646457834669954221389501541"), bigInt("2625519957096290665458734484440229799901957779959002490203229923130576941902452844324255982671180994083672883058246")],
                // BLS12_381_FP12_FROB_C1_2
                [bigInt("164100935063821718429441571564228692714892661155712396182489711759724172863571642402656826152716487580899414489658"), bigInt("0")],
                // BLS12_381_FP12_FROB_C1_3
                [bigInt("1821461487266245992767491788684378228087062278322214693001359809350238716280406307949636812899085786271837335624401"), bigInt("2180948067955421400650298037051525928469820541616793192330698326773792934210431556493050816229929877766056936935386")],
                // BLS12_381_FP12_FROB_C1_4
                [bigInt("0"), bigInt("0")],
                // BLS12_381_FP12_FROB_C1_5
                [bigInt("0"), bigInt("0")],
                // BLS12_381_FP12_FROB_C1_6
                [bigInt("622089355822194721898858157215427760489088928924632185372287956994594733411168033012610036405240999572314735291054"), bigInt("0")],
                // and so on to BLS12_381_FP12_FROB_C1_11
                [bigInt("0"), bigInt("0")],
                [bigInt("0"), bigInt("0")],
                [bigInt("0"), bigInt("0")],
                [bigInt("0"), bigInt("0")],
                [bigInt("0"), bigInt("0")],
            ]
        ];

        // TODO: check which version of Frobenius coefficients to use
        // LayerXcom vesion: https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/fq.rs#L162
        // matter-labs version: https://github.com/matter-labs/eip1962/blob/master/src/engines/bls12_381.rs#L212-L273
        // copied matter-labs version for now
        const F6 = [
            [
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
                [bigInt("1"), bigInt("0")],
            ],
            [
                /*
                const BLS12_381_FP6_FROB_C1_0: decl_fp2!(U384Repr) = repr_into_fp2!(
                    repr_into_fp!(
                        // 3380320199399472671518931668520476396067793891014375699959770179129436917079669831430077592723774664465579537268733L
                        U384Repr([0x760900000002fffd,0xebf4000bc40c0002,0x5f48985753c758ba,0x77ce585370525745,0x5c071a97a256ec6d,0x15f65ec3fa80e493]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ), 
                    repr_into_fp!(
                        U384Repr([0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ),
                    U384Repr,
                    BLS12_381_EXTENSION_2_FIELD
                );
                */
                [bigInt("3380320199399472671518931668520476396067793891014375699959770179129436917079669831430077592723774664465579537268733"), bigInt("0")],
                /*
                const BLS12_381_FP6_FROB_C1_1: decl_fp2!(U384Repr) = repr_into_fp2!(
                    repr_into_fp!(
                        U384Repr([0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ), 
                    repr_into_fp!(
                        // 3838308620157845674988348254171675463841990158783295489149568424364307477627266222040030802976299176456994858070129L
                        U384Repr([0xcd03c9e48671f071,0x5dab22461fcda5d2,0x587042afd3851b95,0x8eb60ebe01bacb9e,0x03f97d6e83d050d2,0x18f0206554638741]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ),
                    U384Repr,
                    BLS12_381_EXTENSION_2_FIELD
                );
                */
                [bigInt("0"), bigInt("3838308620157845674988348254171675463841990158783295489149568424364307477627266222040030802976299176456994858070129")],
                // BLS12_381_FP6_FROB_C1_2
                [bigInt("786190290886016440328299728779656453203981590080344581554777668754318906274739675415266862557957487153214149780712"), bigInt("0")],
                // BLS12_381_FP6_FROB_C1_3
                [bigInt("0"), bigInt("3380320199399472671518931668520476396067793891014375699959770179129436917079669831430077592723774664465579537268733")],
                // BLS12_381_FP6_FROB_C1_4
                [bigInt("0"), bigInt("0")],
                // BLS12_381_FP6_FROB_C1_5
                [bigInt("0"), bigInt("0")],
            ],
            [
                /*
                const BLS12_381_FP6_FROB_C2_0: decl_fp2!(U384Repr) = repr_into_fp2!(
                    repr_into_fp!(
                        // 3380320199399472671518931668520476396067793891014375699959770179129436917079669831430077592723774664465579537268733L
                        U384Repr([0x760900000002fffd,0xebf4000bc40c0002,0x5f48985753c758ba,0x77ce585370525745,0x5c071a97a256ec6d,0x15f65ec3fa80e493]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ), 
                    repr_into_fp!(
                        U384Repr([0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ),
                    U384Repr,
                    BLS12_381_EXTENSION_2_FIELD
                );
                */
                [bigInt("3380320199399472671518931668520476396067793891014375699959770179129436917079669831430077592723774664465579537268733"), bigInt("0")],
                /*
                const BLS12_381_FP6_FROB_C2_1: decl_fp2!(U384Repr) = repr_into_fp2!(
                    repr_into_fp!(
                        // 3216219264335650953089490096956247703352901229858663303777280467369712744216098189027420766571058176884680122779075L
                        U384Repr([0x890dc9e4867545c3,0x2af322533285a5d5,0x50880866309b7e2c,0xa20d1b8c7e881024,0x14e4f04fe2db9068,0x14e56d3f1564853a]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ), 
                    repr_into_fp!(
                        U384Repr([0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000,0x0000000000000000]), 
                        U384Repr,
                        BLS12_381_FIELD
                    ),
                    U384Repr,
                    BLS12_381_EXTENSION_2_FIELD
                );
                */
                [bigInt("3216219264335650953089490096956247703352901229858663303777280467369712744216098189027420766571058176884680122779075"), bigInt("0")],
                // BLS12_381_FP6_FROB_C2_2
                [bigInt("3838308620157845674988348254171675463841990158783295489149568424364307477627266222040030802976299176456994858070129"), bigInt("0")],
                // BLS12_381_FP6_FROB_C2_3
                [bigInt("622089355822194721898858157215427760489088928924632185372287956994594733411168033012610036405240999572314735291054"), bigInt("0")],
                // BLS12_381_FP6_FROB_C2_4
                [bigInt("0"), bigInt("0")],
                // BLS12_381_FP6_FROB_C2_5
                [bigInt("0"), bigInt("0")],
            ]
        ];

        const f = module.addFunction(prefix+ "__frobeniusMap"+n);
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<6; i++) {
            const X = (i==0) ? c.getLocal("x") : c.i32_add(c.getLocal("x"), c.i32_const(i*f2size));
            const Xc0 = X;
            const Xc1 = c.i32_add(c.getLocal("x"), c.i32_const(i*f2size + f1size));
            const R = (i==0) ? c.getLocal("r") : c.i32_add(c.getLocal("r"), c.i32_const(i*f2size));
            const Rc0 = R;
            const Rc1 = c.i32_add(c.getLocal("r"), c.i32_const(i*f2size + f1size));
            const coef = mul2(F12[Math.floor(i/3)][n%12] , F6[i%3][n%6]);
            const pCoef = module.alloc([
                ...utils.bigInt2BytesLE(toMontgomery(coef[0]), 32),
                ...utils.bigInt2BytesLE(toMontgomery(coef[1]), 32),
            ]);
            if (n%2 == 1) {
                f.addCode(
                    c.call(f1mPrefix + "_copy", Xc0, Rc0),
                    c.call(f1mPrefix + "_neg", Xc1, Rc1),
                    c.call(f2mPrefix + "_mul", R, c.i32_const(pCoef), R),
                );
            } else {
                f.addCode(c.call(f2mPrefix + "_mul", X, c.i32_const(pCoef), R));
            }
        }

        function mul2(a, b) {
            const ac0 = bigInt(a[0]);
            const ac1 = bigInt(a[1]);
            const bc0 = bigInt(b[0]);
            const bc1 = bigInt(b[1]);
            const res = [
                ac0.times(bc0).minus(  ac1.times(bc1)  ).mod(q),
                ac0.times(bc1).add(  ac1.times(bc0)  ).mod(q),
            ];
            if (res[0].isNegative()) res[0] = res[0].add(q);
            return res;
        }

    }



    function buildFinalExponentiationFirstChunk() {

        const f = module.addFunction(prefix+ "__finalExponentiationFirstChunk");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const elt = c.getLocal("x");
        const eltC0 = elt;
        const eltC1 = c.i32_add(elt, c.i32_const(n8*6));
        const r = c.getLocal("r");
        const pA = module.alloc(ftsize);
        const A = c.i32_const(pA);
        const Ac0 = A;
        const Ac1 = c.i32_const(pA + n8*6);
        const B = c.i32_const(module.alloc(ftsize));
        const C = c.i32_const(module.alloc(ftsize));
        const D = c.i32_const(module.alloc(ftsize));

        f.addCode(
            // const alt_bn128_Fq12 A = alt_bn128_Fq12(elt.c0,-elt.c1);
            c.call(f6mPrefix + "_copy", eltC0, Ac0),
            c.call(f6mPrefix + "_neg", eltC1, Ac1),

            // const alt_bn128_Fq12 B = elt.inverse();
            c.call(ftmPrefix + "_inverse", elt, B),

            // const alt_bn128_Fq12 C = A * B;
            c.call(ftmPrefix + "_mul", A, B, C),
            // const alt_bn128_Fq12 D = C.Frobenius_map(2);
            c.call(prefix + "__frobeniusMap2", C, D),
            // const alt_bn128_Fq12 result = D * C;
            c.call(ftmPrefix + "_mul", C, D, r),
        );
    }

    function buildCyclotomicSquare() {
        const f = module.addFunction(prefix+ "__cyclotomicSquare");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const x0 = c.getLocal("x");
        const x4 = c.i32_add(c.getLocal("x"), c.i32_const(f2size));
        const x3 = c.i32_add(c.getLocal("x"), c.i32_const(2*f2size));
        const x2 = c.i32_add(c.getLocal("x"), c.i32_const(3*f2size));
        const x1 = c.i32_add(c.getLocal("x"), c.i32_const(4*f2size));
        const x5 = c.i32_add(c.getLocal("x"), c.i32_const(5*f2size));

        const r0 = c.getLocal("r");
        const r4 = c.i32_add(c.getLocal("r"), c.i32_const(f2size));
        const r3 = c.i32_add(c.getLocal("r"), c.i32_const(2*f2size));
        const r2 = c.i32_add(c.getLocal("r"), c.i32_const(3*f2size));
        const r1 = c.i32_add(c.getLocal("r"), c.i32_const(4*f2size));
        const r5 = c.i32_add(c.getLocal("r"), c.i32_const(5*f2size));

        const t0 = c.i32_const(module.alloc(f2size));
        const t1 = c.i32_const(module.alloc(f2size));
        const t2 = c.i32_const(module.alloc(f2size));
        const t3 = c.i32_const(module.alloc(f2size));
        const t4 = c.i32_const(module.alloc(f2size));
        const t5 = c.i32_const(module.alloc(f2size));
        const tmp = c.i32_const(module.alloc(f2size));
        const AUX = c.i32_const(module.alloc(f2size));


        f.addCode(

//            c.call(ftmPrefix + "_square", x0, r0),

            //    // t0 + t1*y = (z0 + z1*y)^2 = a^2
            //    tmp = z0 * z1;
            //    t0 = (z0 + z1) * (z0 + my_Fp6::non_residue * z1) - tmp - my_Fp6::non_residue * tmp;
            //    t1 = tmp + tmp;
            c.call(f2mPrefix + "_mul", x0, x1, tmp),
            c.call(f2mPrefix + "_mul", x1, c.i32_const(pNonResidueF6), t0),
            c.call(f2mPrefix + "_add", x0, t0, t0),
            c.call(f2mPrefix + "_add", x0, x1, AUX),
            c.call(f2mPrefix + "_mul", AUX, t0, t0),
            c.call(f2mPrefix + "_mul", c.i32_const(pNonResidueF6), tmp, AUX),
            c.call(f2mPrefix + "_add", tmp, AUX, AUX),
            c.call(f2mPrefix + "_sub", t0, AUX, t0),
            c.call(f2mPrefix + "_add", tmp, tmp, t1),

            //  // t2 + t3*y = (z2 + z3*y)^2 = b^2
            //  tmp = z2 * z3;
            //  t2 = (z2 + z3) * (z2 + my_Fp6::non_residue * z3) - tmp - my_Fp6::non_residue * tmp;
            //  t3 = tmp + tmp;
            c.call(f2mPrefix + "_mul", x2, x3, tmp),
            c.call(f2mPrefix + "_mul", x3, c.i32_const(pNonResidueF6), t2),
            c.call(f2mPrefix + "_add", x2, t2, t2),
            c.call(f2mPrefix + "_add", x2, x3, AUX),
            c.call(f2mPrefix + "_mul", AUX, t2, t2),
            c.call(f2mPrefix + "_mul", c.i32_const(pNonResidueF6), tmp, AUX),
            c.call(f2mPrefix + "_add", tmp, AUX, AUX),
            c.call(f2mPrefix + "_sub", t2, AUX, t2),
            c.call(f2mPrefix + "_add", tmp, tmp, t3),

            //  // t4 + t5*y = (z4 + z5*y)^2 = c^2
            //  tmp = z4 * z5;
            //  t4 = (z4 + z5) * (z4 + my_Fp6::non_residue * z5) - tmp - my_Fp6::non_residue * tmp;
            //  t5 = tmp + tmp;
            c.call(f2mPrefix + "_mul", x4, x5, tmp),
            c.call(f2mPrefix + "_mul", x5, c.i32_const(pNonResidueF6), t4),
            c.call(f2mPrefix + "_add", x4, t4, t4),
            c.call(f2mPrefix + "_add", x4, x5, AUX),
            c.call(f2mPrefix + "_mul", AUX, t4, t4),
            c.call(f2mPrefix + "_mul", c.i32_const(pNonResidueF6), tmp, AUX),
            c.call(f2mPrefix + "_add", tmp, AUX, AUX),
            c.call(f2mPrefix + "_sub", t4, AUX, t4),
            c.call(f2mPrefix + "_add", tmp, tmp, t5),

            // For A
            // z0 = 3 * t0 - 2 * z0
            c.call(f2mPrefix + "_sub", t0, x0, r0),
            c.call(f2mPrefix + "_add", r0, r0, r0),
            c.call(f2mPrefix + "_add", t0, r0, r0),
            // z1 = 3 * t1 + 2 * z1
            c.call(f2mPrefix + "_add", t1, x1, r1),
            c.call(f2mPrefix + "_add", r1, r1, r1),
            c.call(f2mPrefix + "_add", t1, r1, r1),

            // For B
            // z2 = 3 * (xi * t5) + 2 * z2
            c.call(f2mPrefix + "_mul", t5, c.i32_const(pAltBn128Twist), AUX),
            c.call(f2mPrefix + "_add", AUX, x2, r2),
            c.call(f2mPrefix + "_add", r2, r2, r2),
            c.call(f2mPrefix + "_add", AUX, r2, r2),
            // z3 = 3 * t4 - 2 * z3
            c.call(f2mPrefix + "_sub", t4, x3, r3),
            c.call(f2mPrefix + "_add", r3, r3, r3),
            c.call(f2mPrefix + "_add", t4, r3, r3),

            // For C
            // z4 = 3 * t2 - 2 * z4
            c.call(f2mPrefix + "_sub", t2, x4, r4),
            c.call(f2mPrefix + "_add", r4, r4, r4),
            c.call(f2mPrefix + "_add", t2, r4, r4),
            // z5 = 3 * t3 + 2 * z5
            c.call(f2mPrefix + "_add", t3, x5, r5),
            c.call(f2mPrefix + "_add", r5, r5, r5),
            c.call(f2mPrefix + "_add", t3, r5, r5),

        );
    }


    function buildCyclotomicExp(exponent, fnName) {
        const exponentNafBytes = naf(exponent).map( (b) => (b==-1 ? 0xFF: b) );
        const pExponentNafBytes = module.alloc(exponentNafBytes);
        const pExponent = module.alloc(utils.bigInt2BytesLE(exponent, 32));

        const f = module.addFunction(prefix+ "__cyclotomicExp_"+fnName);
        f.addParam("x", "i32");
        f.addParam("r", "i32");
        f.addLocal("bit", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("x");

        const res = c.getLocal("r");

        const inverse = c.i32_const(module.alloc(ftsize));


        // I think this __cyclotomicExp_ for BN corresponds to his BN implementation https://github.com/zcash-hackworks/bn/blob/f7116294867fab32137cb9cca9b94c661f3ee4e6/src/fields/fq12.rs#L97-L101
        // It might be following this paper "It can be shown that exponentiation by our choice of the z parameter requires..."
        // > For the parameter selection z = -2^107 + 2^105 + 2^93 + 2^5...

        // here is an implementation used for both BN and BLS https://github.com/matter-labs/eip1962/blob/master/src/extension_towers/fp12_as_2_over3_over_2.rs#L225-L243
        // the eip1962 implementation doesn't use the `finalExpZ` parameter used here (passed in as `exponent`).

        // here is a BLS implementation https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L116-L121
        // and the `pow` function https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/lib.rs#L325-L343

        // TODO: adapt to the implementation used for both BN and BLS, then check correctness


        f.addCode(
//            c.call(ftmPrefix + "_exp", x, c.i32_const(pExponent), c.i32_const(32), res),

            // for BLS conjugate is done here https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L119
            // for BLS conjugage is done here https://github.com/matter-labs/eip1962/blob/master/src/pairings/bls12/mod.rs#L142
            // for BN conjugate is done here https://github.com/matter-labs/eip1962/blob/master/src/pairings/bn/mod.rs#L148
            // for BN conjugate is done here https://github.com/zcash-hackworks/bn/blob/f7116294867fab32137cb9cca9b94c661f3ee4e6/src/fields/fq12.rs#L100

            c.call(ftmPrefix + "_conjugate", x, inverse),
            c.call(ftmPrefix + "_one", res),

            c.if(
                c.teeLocal("bit", c.i32_load8_s(c.i32_const(exponentNafBytes.length-1), pExponentNafBytes)),
                c.if(
                    c.i32_eq(
                        c.getLocal("bit"),
                        c.i32_const(1)
                    ),
                    c.call(ftmPrefix + "_mul", res, x, res),
                    c.call(ftmPrefix + "_mul", res, inverse, res),
                )
            ),

            c.setLocal("i", c.i32_const(exponentNafBytes.length-2)),
            c.block(c.loop(
//                c.call(ftmPrefix + "_square", res, res),
                c.call(prefix + "__cyclotomicSquare", res, res),
                c.if(
                    c.teeLocal("bit", c.i32_load8_s(c.getLocal("i"), pExponentNafBytes)),
                    c.if(
                        c.i32_eq(
                            c.getLocal("bit"),
                            c.i32_const(1)
                        ),
                        c.call(ftmPrefix + "_mul", res, x, res),
                        c.call(ftmPrefix + "_mul", res, inverse, res),
                    )
                ),
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }



    function buildFinalExponentiationLastChunk() {
        buildCyclotomicSquare();
        buildCyclotomicExp(finalExpZ, "w0");

        // TODO: final exponentation in BLS  https://github.com/LayerXcom/bellman-substrate/blob/master/pairing/src/bls12_381/mod.rs#L116-L133
        // corresponds to final_exponentiation_last_chunk in BN  https://github.com/zcash-hackworks/bn/blob/f7116294867fab32137cb9cca9b94c661f3ee4e6/src/fields/fq12.rs#L54-L84
        // https://github.com/matter-labs/eip1962/blob/master/src/pairings/bn/mod.rs#L573

        const f = module.addFunction(prefix+ "__finalExponentiationLastChunk");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const elt = c.getLocal("x");
        const result = c.getLocal("r");
        const A = c.i32_const(module.alloc(ftsize));
        const B = c.i32_const(module.alloc(ftsize));
        const C = c.i32_const(module.alloc(ftsize));
        const D = c.i32_const(module.alloc(ftsize));
        const E = c.i32_const(module.alloc(ftsize));
        const F = c.i32_const(module.alloc(ftsize));
        const G = c.i32_const(module.alloc(ftsize));
        const H = c.i32_const(module.alloc(ftsize));
        const I = c.i32_const(module.alloc(ftsize));
        const J = c.i32_const(module.alloc(ftsize));
        const K = c.i32_const(module.alloc(ftsize));
        const L = c.i32_const(module.alloc(ftsize));
        const M = c.i32_const(module.alloc(ftsize));
        const N = c.i32_const(module.alloc(ftsize));
        const O = c.i32_const(module.alloc(ftsize));
        const P = c.i32_const(module.alloc(ftsize));
        const Q = c.i32_const(module.alloc(ftsize));
        const R = c.i32_const(module.alloc(ftsize));
        const S = c.i32_const(module.alloc(ftsize));
        const T = c.i32_const(module.alloc(ftsize));
        const U = c.i32_const(module.alloc(ftsize));

        f.addCode(


            // A = exp_by_neg_z(elt)  // = elt^(-z)
            c.call(prefix + "__cyclotomicExp_w0", elt, A),
            finalExpIsNegative ? [] : c.call(ftmPrefix + "_conjugate", A, A),
            // B = A^2                // = elt^(-2*z)
            c.call(prefix + "__cyclotomicSquare", A, B),
            // C = B^2                // = elt^(-4*z)
            c.call(prefix + "__cyclotomicSquare", B, C),
            // D = C * B              // = elt^(-6*z)
            c.call(ftmPrefix + "_mul", C, B, D),
            // E = exp_by_neg_z(D)    // = elt^(6*z^2)
            c.call(prefix + "__cyclotomicExp_w0", D, E),
            finalExpIsNegative ? [] : c.call(ftmPrefix + "_conjugate", E, E),
            // F = E^2                // = elt^(12*z^2)
            c.call(prefix + "__cyclotomicSquare", E, F),
            // G = epx_by_neg_z(F)    // = elt^(-12*z^3)
            c.call(prefix + "__cyclotomicExp_w0", F, G),
            finalExpIsNegative ? [] : c.call(ftmPrefix + "_conjugate", G, G),
            // H = conj(D)            // = elt^(6*z)
            c.call(ftmPrefix + "_conjugate", D, H),
            // I = conj(G)            // = elt^(12*z^3)
            c.call(ftmPrefix + "_conjugate", G, I),
            // J = I * E              // = elt^(12*z^3 + 6*z^2)
            c.call(ftmPrefix + "_mul", I, E, J),
            // K = J * H              // = elt^(12*z^3 + 6*z^2 + 6*z)
            c.call(ftmPrefix + "_mul", J, H, K),
            // L = K * B              // = elt^(12*z^3 + 6*z^2 + 4*z)
            c.call(ftmPrefix + "_mul", K, B, L),
            // M = K * E              // = elt^(12*z^3 + 12*z^2 + 6*z)
            c.call(ftmPrefix + "_mul", K, E, M),

            // N = M * elt            // = elt^(12*z^3 + 12*z^2 + 6*z + 1)
            c.call(ftmPrefix + "_mul", M, elt, N),

            // O = L.Frobenius_map(1) // = elt^(q*(12*z^3 + 6*z^2 + 4*z))
            c.call(prefix + "__frobeniusMap1", L, O),
            // P = O * N              // = elt^(q*(12*z^3 + 6*z^2 + 4*z) * (12*z^3 + 12*z^2 + 6*z + 1))
            c.call(ftmPrefix + "_mul", O, N, P),
            // Q = K.Frobenius_map(2) // = elt^(q^2 * (12*z^3 + 6*z^2 + 6*z))
            c.call(prefix + "__frobeniusMap2", K, Q),
            // R = Q * P              // = elt^(q^2 * (12*z^3 + 6*z^2 + 6*z) + q*(12*z^3 + 6*z^2 + 4*z) * (12*z^3 + 12*z^2 + 6*z + 1))
            c.call(ftmPrefix + "_mul", Q, P, R),
            // S = conj(elt)          // = elt^(-1)
            c.call(ftmPrefix + "_conjugate", elt, S),
            // T = S * L              // = elt^(12*z^3 + 6*z^2 + 4*z - 1)
            c.call(ftmPrefix + "_mul", S, L, T),
            // U = T.Frobenius_map(3) // = elt^(q^3(12*z^3 + 6*z^2 + 4*z - 1))
            c.call(prefix + "__frobeniusMap3", T, U),
            // V = U * R              // = elt^(q^3(12*z^3 + 6*z^2 + 4*z - 1) + q^2 * (12*z^3 + 6*z^2 + 6*z) + q*(12*z^3 + 6*z^2 + 4*z) * (12*z^3 + 12*z^2 + 6*z + 1))
            c.call(ftmPrefix + "_mul", U, R, result),
            // result = V
        );
    }


    function buildFinalExponentiation() {
        buildFinalExponentiationFirstChunk();
        buildFinalExponentiationLastChunk();
        const f = module.addFunction(prefix+ "_finalExponentiation");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const elt = c.getLocal("x");
        const result = c.getLocal("r");
        const eltToFirstChunk = c.i32_const(module.alloc(ftsize));

        f.addCode(
            c.call(prefix + "__finalExponentiationFirstChunk", elt, eltToFirstChunk ),
            c.call(prefix + "__finalExponentiationLastChunk", eltToFirstChunk, result )
        );
    }


    function buildFinalExponentiationOld() {
        const f = module.addFunction(prefix+ "_finalExponentiationOld");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const exponent = bigInt("322277361516934140462891564586510139908379969514828494218366688025288661041104682794998680497580008899973249814104447692778988208376779573819485263026159588510513834876303014016798809919343532899164848730280942609956670917565618115867287399623286813270357901731510188149934363360381614501334086825442271920079363289954510565375378443704372994881406797882676971082200626541916413184642520269678897559532260949334760604962086348898118982248842634379637598665468817769075878555493752214492790122785850202957575200176084204422751485957336465472324810982833638490904279282696134323072515220044451592646885410572234451732790590013479358343841220074174848221722017083597872017638514103174122784843925578370430843522959600095676285723737049438346544753168912974976791528535276317256904336520179281145394686565050419250614107803233314658825463117900250701199181529205942363159325765991819433914303908860460720581408201373164047773794825411011922305820065611121544561808414055302212057471395719432072209245600258134364584636810093520285711072578721435517884103526483832733289802426157301542744476740008494780363354305116978805620671467071400711358839553375340724899735460480144599782014906586543813292157922220645089192130209334926661588737007768565838519456601560804957985667880395221049249803753582637708560");

        const pExponent = module.alloc(utils.bigInt2BytesLE( exponent, 352 ));

        const c = f.getCodeBuilder();

        f.addCode(
            c.call(ftmPrefix + "_exp", c.getLocal("x"), c.i32_const(pExponent), c.i32_const(352), c.getLocal("r")),
        );
    }




    const pPreP = module.alloc(prePSize);
    const pPreQ = module.alloc(preQSize);

    function buildPairingEquation(nPairings) {

        const f = module.addFunction(prefix+ "_pairingEq"+nPairings);
        for (let i=0; i<nPairings; i++) {
            f.addParam("p_"+i, "i32");
            f.addParam("q_"+i, "i32");
        }
        f.addParam("c", "i32");
        f.setReturnType("i32");


        const c = f.getCodeBuilder();

        const resT = c.i32_const(module.alloc(ftsize));
        const auxT = c.i32_const(module.alloc(ftsize));

        f.addCode(c.call(ftmPrefix + "_one", resT ));

        for (let i=0; i<nPairings; i++) {

            f.addCode(c.call(prefix + "_prepareG1", c.getLocal("p_"+i), c.i32_const(pPreP) ));
            f.addCode(c.call(prefix + "_prepareG2", c.getLocal("q_"+i), c.i32_const(pPreQ) ));
            f.addCode(c.call(prefix + "_millerLoop", c.i32_const(pPreP), c.i32_const(pPreQ), auxT ));

            f.addCode(c.call(ftmPrefix + "_mul", resT, auxT, resT ));
        }

        //f.addCode(c.call(prefix + "_finalExponentiation", resT, resT ));
        f.addCode(c.call(prefix + "_finalExponentiationOld", resT, resT ));

        f.addCode(c.call(ftmPrefix + "_eq", resT, c.getLocal("c")));
    }


    function buildPairing() {

        const f = module.addFunction(prefix+ "_pairing");
        f.addParam("p", "i32");
        f.addParam("q", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const resT = c.i32_const(module.alloc(ftsize));

        f.addCode(c.call(prefix + "_prepareG1", c.getLocal("p"), c.i32_const(pPreP) ));
        f.addCode(c.call(prefix + "_prepareG2", c.getLocal("q"), c.i32_const(pPreQ) ));
        f.addCode(c.call(prefix + "_millerLoop", c.i32_const(pPreP), c.i32_const(pPreQ), resT ));
        f.addCode(c.call(prefix + "_finalExponentiationOld", resT, c.getLocal("r") ));
    }


    buildPrepAddStep();
    buildPrepDoubleStep();

    buildPrepareG1();
    buildPrepareG2();

    buildMulBy014();

    buildMulBy024();
    buildMulBy024Old();
    buildMillerLoop();


    for (let i=0; i<10; i++) {
        buildFrobeniusMap(i);
        module.exportFunction(prefix + "__frobeniusMap"+i);
    }

    buildFinalExponentiationOld();
    buildFinalExponentiation();

    for (let i=1; i<=5; i++) {
        buildPairingEquation(i);
        module.exportFunction(prefix + "_pairingEq"+i);
    }

    buildPairing();

    module.exportFunction(prefix + "_pairing");

    module.exportFunction(prefix + "_prepareG1");
    module.exportFunction(prefix + "_prepareG2");
    module.exportFunction(prefix + "_millerLoop");
    module.exportFunction(prefix + "_finalExponentiation");
    module.exportFunction(prefix + "_finalExponentiationOld");
    module.exportFunction(prefix + "__mulBy014");
    module.exportFunction(prefix + "__mulBy024");
    module.exportFunction(prefix + "__mulBy024Old");
    module.exportFunction(prefix + "__cyclotomicSquare");
    module.exportFunction(prefix + "__cyclotomicExp_w0");


};

