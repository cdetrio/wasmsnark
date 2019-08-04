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

/* globals WebAssembly, Blob, Worker, navigator, Promise, window */
const bigInt = require("big-integer");
const secp256k1_wasm = require("../build/secp256k1_wasm.js");
const assert = require("assert");
const utils = require("./utils");

const SIZEF1 = 32;
const inBrowser = (typeof window !== "undefined");
let NodeWorker;
let NodeCrypto;
if (!inBrowser) {
    NodeWorker = require("worker_threads").Worker;
    NodeCrypto = require("crypto");
}


class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject)=> {
            this.reject = reject;
            this.resolve = resolve;
        });
    }
}

/*
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
*/

function thread(self) {
    let instance;
    let memory;
    let i32;

    async function init(data) {
        const code = new Uint8Array(data.code);
        const wasmModule = await WebAssembly.compile(code);
        memory = new WebAssembly.Memory({initial:data.init});
        i32 = new Uint32Array(memory.buffer);

        instance = await WebAssembly.instantiate(wasmModule, {
            env: {
                "memory": memory
            }
        });
    }

    function alloc(length) {
        while (i32[0] & 3) i32[0]++;  // Return always aligned pointers
        const res = i32[0];
        i32[0] += length;
        while (i32[0] > memory.buffer.byteLength) {
            memory.grow(100);
        }
        i32 = new Uint32Array(memory.buffer);
        return res;
    }

    function putBin(b) {
        const p = alloc(b.byteLength);
        const s32 = new Uint32Array(b);
        i32.set(s32, p/4);
        return p;
    }

    function getBin(p, l) {
        return memory.buffer.slice(p, p+l);
    }

    self.onmessage = function(e) {
        let data;
        if (e.data) {
            data = e.data;
        } else {
            data = e;
        }

        if (data.command == "INIT") {
            init(data).then(function() {
                self.postMessage(data.result);
            });
        } else if (data.command == "TERMINATE") {
            process.exit();
        }
    };
}

async function build() {

    const secp256k1 = new Secp256k1();

    secp256k1.q = bigInt("115792089237316195423570985008687907853269984665640564039457584007908834671663");
    secp256k1.r = bigInt("115792089237316195423570985008687907852837564279074904382605163141518161494337");
    secp256k1.n64 = Math.floor((secp256k1.q.minus(1).bitLength() - 1)/64) +1;
    secp256k1.n32 = secp256k1.n64*2;
    secp256k1.n8 = secp256k1.n64*8;

    secp256k1.memory = new WebAssembly.Memory({initial:5000});
    secp256k1.i32 = new Uint32Array(secp256k1.memory.buffer);

    const wasmModule = await WebAssembly.compile(secp256k1_wasm.code);

    secp256k1.instance = await WebAssembly.instantiate(wasmModule, {
        env: {
            "memory": secp256k1.memory
        }
    });

    secp256k1.pq = secp256k1_wasm.pq;
    secp256k1.pr = secp256k1_wasm.pr;
    secp256k1.pG1gen = secp256k1_wasm.pG1gen;
    secp256k1.pG1zero = secp256k1_wasm.pG1zero;
    secp256k1.pG2gen = secp256k1_wasm.pG2gen;
    secp256k1.pG2zero = secp256k1_wasm.pG2zero;
    secp256k1.pOneT = secp256k1_wasm.pOneT;

    secp256k1.pr0 = secp256k1.alloc(192);
    secp256k1.pr1 = secp256k1.alloc(192);

    secp256k1.workers = [];
    secp256k1.pendingDeferreds = [];
    secp256k1.working = [];

    let concurrency;

    if ((typeof(navigator) === "object") && navigator.hardwareConcurrency) {
        concurrency = navigator.hardwareConcurrency;
    } else {
        concurrency = 8;
    }

    function getOnMsg(i) {
        return function(e) {
            let data;
            if ((e)&&(e.data)) {
                data = e.data;
            } else {
                data = e;
            }

            secp256k1.working[i]=false;
            secp256k1.pendingDeferreds[i].resolve(data);
            secp256k1.processWorks();
        };
    }

    for (let i = 0; i<concurrency; i++) {

        if (inBrowser) {
            const blob = new Blob(["(", thread.toString(), ")(self);"], { type: "text/javascript" });
            const url = URL.createObjectURL(blob);

            secp256k1.workers[i] = new Worker(url);

            secp256k1.workers[i].onmessage = getOnMsg(i);

        } else {
            secp256k1.workers[i] = new NodeWorker("(" + thread.toString()+ ")(require('worker_threads').parentPort);", {eval: true});

            secp256k1.workers[i].on("message", getOnMsg(i));
        }

        secp256k1.working[i]=false;
    }

    const initPromises = [];
    for (let i=0; i<secp256k1.workers.length;i++) {
        const copyCode = secp256k1_wasm.code.buffer.slice(0);
        initPromises.push(secp256k1.postAction(i, {
            command: "INIT",
            init: 5000,
            code: copyCode

        }, [copyCode]));
    }

    await Promise.all(initPromises);

    return secp256k1;
}

class Secp256k1 {
    constructor() {
        this.actionQueue = [];
    }

    postAction(workerId, e, transfers, _deferred) {
        assert(this.working[workerId] == false);
        this.working[workerId] = true;

        this.pendingDeferreds[workerId] = _deferred ? _deferred : new Deferred();
        this.workers[workerId].postMessage(e, transfers);

        return this.pendingDeferreds[workerId].promise;
    }

    processWorks() {
        for (let i=0; (i<this.workers.length)&&(this.actionQueue.length > 0); i++) {
            if (this.working[i] == false) {
                const work = this.actionQueue.shift();
                this.postAction(i, work.data, work.transfers, work.deferred);
            }
        }
    }

    queueAction(actionData, transfers) {
        const d = new Deferred();
        this.actionQueue.push({
            data: actionData,
            transfers: transfers,
            deferred: d
        });
        this.processWorks();
        return d.promise;
    }

    alloc(length) {
        while (this.i32[0] & 3) this.i32[0]++;  // Return always aligned pointers
        const res = this.i32[0];
        this.i32[0] += length;
        return res;
    }


    putBin(p, b) {
        const s32 = new Uint32Array(b);
        this.i32.set(s32, p/4);
    }

    getBin(p, l) {
        return this.memory.buffer.slice(p, p+l);
    }

    bin2int(b) {
        const i32 = new Uint32Array(b);
        let acc = bigInt(i32[7]);
        for (let i=6; i>=0; i--) {
            acc = acc.shiftLeft(32);
            acc = acc.add(i32[i]);
        }
        return acc.toString();
    }

    bin2g1(b) {
        return [
            this.bin2int(b.slice(0,32)),
            this.bin2int(b.slice(32,64)),
            this.bin2int(b.slice(64,96)),
        ];
    }

    bin2g2(b) {
        return [
            [
                this.bin2int(b.slice(0,32)),
                this.bin2int(b.slice(32,64))
            ],
            [
                this.bin2int(b.slice(64,96)),
                this.bin2int(b.slice(96,128))
            ],
            [
                this.bin2int(b.slice(128,160)),
                this.bin2int(b.slice(160,192))
            ],
        ];
    }

    g1_affine(p) {
        this.putBin(this.pr0, p);
        this.instance.exports.g1m_affine(this.pr0, this.pr0);
        return this.getBin(this.pr0, 96);
    }

    g1_fromMontgomery(p) {
        this.putBin(this.pr0, p);
        this.instance.exports.g1m_fromMontgomery(this.pr0, this.pr0);
        return this.getBin(this.pr0, 96);
    }

    loadPoint1(b) {
        const p = this.alloc(96);
        this.putBin(p, b);
        this.instance.exports.f1m_one(p+64);
        return p;
    }

    setInt(pos, _a, _size) {
        const n32 = _size ? (((_size - 1)>>2)+1) : SIZEF1 >> 2;
        const a = bigInt(_a);
        if (pos & 0x7) throw new Error("Pointer must be aligned");
        for (let i=0; i<n32; i++) {
            this.i32[(pos>>2)+i] = a.shiftRight(i*32).and(0xFFFFFFFF).toJSNumber();
        }
    }

    setF1(p, e) {
        const n32 = (SIZEF1 >> 2);
        let arr;
        if (Array.isArray(e)) {
            if (e.length == n32 ) {
                arr = e;
            } else if (e.length == 3) {
                arr = e[2].slice(0);
                // Remove
                while (arr[arr.length-1] <0) arr.pop();
                // Fill it with zeros
                const filledElements = arr.length;
                arr.length = n32;
                arr.fill(0, filledElements, n32);
            } else {
                throw new Error("Invalid format");
            }
            this.i32.set(Uint32Array.from(arr), p >> 2);
        } else {
            this.setInt(p, e);
        }
    }

    setG1Affine(p, e) {
        this.setF1(p, e[0]);
        this.setF1(p + SIZEF1, e[1]);
        this.setF1(p + 2*SIZEF1, 1);
    }

    getF1(p) {
        this.instance.exports.f1m_fromMontgomery(p, p);
        const r = this.bin2int(this.i32.slice(p>>2, (p+SIZEF1)>>2)).toString();
        this.instance.exports.f1m_toMontgomery(p, p);
        return r;
    }

    getG1(p) {
        return [
            this.getF1(p),
            this.getF1(p+SIZEF1),
            this.getF1(p+2*SIZEF1)
        ];
    }

    terminate() {
        for (let i=0; i<this.workers.length; i++) {
            this.workers[i].postMessage({command: "TERMINATE"});
        }
    }

}

module.exports = build;
