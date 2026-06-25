/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser `crypto` for the bundled mod runtime. The tools use exactly one
 * crypto API - crypto.createHash("sha256") -> update() -> digest("hex") - yet
 * node's `require("crypto")` resolves (via crypto-browserify) to the full
 * asymmetric stack (elliptic, asn1.js, diffie-hellman, public-encrypt,
 * create-ecdh, browserify-sign, bn.js x7, ...) - ~1.5 MB of code nothing here
 * calls. esbuild aliases the Node `crypto` import to this module (see
 * scripts/build-mod-runtime.js), trimming the bundle to a tiny pure-JS SHA-256.
 *
 * Implements only what the tools need: createHash("sha256") with streaming
 * update(string|Buffer|Uint8Array, [encoding]) and digest("hex"|"base64"). A
 * WebCrypto-backed randomBytes is provided defensively for any stray caller.
 */
"use strict";

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (x, n) => (x >>> n) | (x << (32 - n));

let _te = null;
function utf8Bytes(str) {
  if (typeof TextEncoder !== "undefined") {
    if (!_te) _te = new TextEncoder();
    return _te.encode(str);
  }
  // Fallback (no TextEncoder): manual UTF-8 encode.
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c <= 0xdbff) {
      c = 0x10000 + ((c & 0x3ff) << 10) + (str.charCodeAt(++i) & 0x3ff);
      out.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f)
      );
    } else
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return Uint8Array.from(out);
}

function toBytes(data, encoding) {
  if (typeof data === "string") {
    if (encoding === "hex") {
      const a = new Uint8Array(data.length >> 1);
      for (let i = 0; i < a.length; i++)
        a[i] = parseInt(data.substr(i * 2, 2), 16);
      return a;
    }
    if (encoding === "base64") {
      const bin =
        typeof atob === "function"
          ? atob(data)
          : Buffer.from(data, "base64").toString("binary");
      const a = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      return a;
    }
    return utf8Bytes(data); // utf8 / latin1-ish default; tools only use utf8
  }
  if (data instanceof Uint8Array) return data; // Buffer is a Uint8Array subclass
  if (ArrayBuffer.isView(data))
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (Array.isArray(data)) return Uint8Array.from(data);
  throw new TypeError("createHash.update: unsupported input type");
}

class Sha256 {
  constructor() {
    this.h = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
      0x1f83d9ab, 0x5be0cd19,
    ]);
    this.block = new Uint8Array(64);
    this.blockLen = 0;
    this.bytes = 0;
    this.w = new Uint32Array(64);
    this.done = false;
  }

  _compress(p, off) {
    const w = this.w;
    for (let t = 0; t < 16; t++) {
      const i = off + t * 4;
      w[t] = ((p[i] << 24) | (p[i + 1] << 16) | (p[i + 2] << 8) | p[i + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t++) {
      const x = w[t - 15];
      const y = w[t - 2];
      const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
      const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let a = this.h[0],
      b = this.h[1],
      c = this.h[2],
      d = this.h[3],
      e = this.h[4],
      f = this.h[5],
      g = this.h[6],
      h = this.h[7];
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    this.h[0] = (this.h[0] + a) | 0;
    this.h[1] = (this.h[1] + b) | 0;
    this.h[2] = (this.h[2] + c) | 0;
    this.h[3] = (this.h[3] + d) | 0;
    this.h[4] = (this.h[4] + e) | 0;
    this.h[5] = (this.h[5] + f) | 0;
    this.h[6] = (this.h[6] + g) | 0;
    this.h[7] = (this.h[7] + h) | 0;
  }

  update(data, encoding) {
    if (this.done) throw new Error("digest already called");
    const bytes = toBytes(data, encoding);
    this.bytes += bytes.length;
    let i = 0;
    if (this.blockLen > 0) {
      while (i < bytes.length && this.blockLen < 64)
        this.block[this.blockLen++] = bytes[i++];
      if (this.blockLen === 64) {
        this._compress(this.block, 0);
        this.blockLen = 0;
      }
    }
    while (i + 64 <= bytes.length) {
      this._compress(bytes, i);
      i += 64;
    }
    while (i < bytes.length) this.block[this.blockLen++] = bytes[i++];
    return this;
  }

  digest(encoding) {
    if (this.done) throw new Error("digest already called");
    const totalBits = this.bytes * 8; // exact: bytes < 2^53, fits in a double
    // Pad: 0x80, then zeros, then 64-bit big-endian bit length.
    this.block[this.blockLen++] = 0x80;
    if (this.blockLen > 56) {
      while (this.blockLen < 64) this.block[this.blockLen++] = 0;
      this._compress(this.block, 0);
      this.blockLen = 0;
    }
    while (this.blockLen < 56) this.block[this.blockLen++] = 0;
    const hi = Math.floor(totalBits / 0x100000000);
    const lo = totalBits >>> 0;
    this.block[56] = (hi >>> 24) & 0xff;
    this.block[57] = (hi >>> 16) & 0xff;
    this.block[58] = (hi >>> 8) & 0xff;
    this.block[59] = hi & 0xff;
    this.block[60] = (lo >>> 24) & 0xff;
    this.block[61] = (lo >>> 16) & 0xff;
    this.block[62] = (lo >>> 8) & 0xff;
    this.block[63] = lo & 0xff;
    this._compress(this.block, 0);
    this.done = true;

    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i++) {
      out[i * 4] = (this.h[i] >>> 24) & 0xff;
      out[i * 4 + 1] = (this.h[i] >>> 16) & 0xff;
      out[i * 4 + 2] = (this.h[i] >>> 8) & 0xff;
      out[i * 4 + 3] = this.h[i] & 0xff;
    }
    if (encoding === "base64") {
      let bin = "";
      for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]);
      return typeof btoa === "function"
        ? btoa(bin)
        : Buffer.from(out).toString("base64");
    }
    if (!encoding || encoding === "hex") {
      let hex = "";
      for (let i = 0; i < out.length; i++)
        hex += out[i].toString(16).padStart(2, "0");
      return hex;
    }
    // No encoding given on node returns a Buffer; the tools always pass "hex".
    throw new Error('createHash.digest: only "hex"/"base64" supported');
  }
}

function createHash(algorithm) {
  const a = String(algorithm).toLowerCase();
  if (a !== "sha256" && a !== "sha-256")
    throw new Error(
      "_crypto-browser: only sha256 is supported (got " + algorithm + ")"
    );
  return new Sha256();
}

function randomBytes(n) {
  const out = new Uint8Array(n);
  const g =
    (typeof globalThis !== "undefined" && globalThis.crypto) ||
    (typeof self !== "undefined" && self.crypto);
  if (g && typeof g.getRandomValues === "function") {
    // getRandomValues caps at 65536 bytes per call.
    for (let i = 0; i < n; i += 65536)
      g.getRandomValues(out.subarray(i, Math.min(i + 65536, n)));
  } else {
    for (let i = 0; i < n; i++) out[i] = (Math.random() * 256) | 0;
  }
  return typeof Buffer !== "undefined" ? Buffer.from(out) : out;
}

module.exports = { createHash, randomBytes };
module.exports.default = module.exports;
