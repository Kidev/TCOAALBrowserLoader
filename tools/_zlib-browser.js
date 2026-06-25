/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser `zlib` for the bundled mod runtime. The tools use only the *sync*
 * one-shot zlib functions (inflateSync / inflateRawSync / deflateRawSync /
 * gunzipSync) plus zlib.crc32 - but node's `require("zlib")` resolves (via
 * node-stdlib-browser) to `browserify-zlib`, which exists to provide the
 * streaming Gzip/Inflate Transform classes and therefore drags in
 * `readable-stream` (~82 KB) + `assert` (~71 KB) + util/string_decoder/events -
 * none of which any tool calls. esbuild aliases the Node `zlib` import to this
 * module (see scripts/build-mod-runtime.js), backing the sync functions with the
 * pako pure-JS zlib (already bundled) and dropping that whole chain.
 */
"use strict";

const pako = require("pako");

const toBuf = (u8) => (typeof Buffer !== "undefined" ? Buffer.from(u8) : u8);
// pako accepts Buffer/Uint8Array directly; normalize away the Buffer subclass
// quirks just in case, and forward only the options pako understands (level).
function input(data) {
  if (data instanceof Uint8Array) return data;
  if (ArrayBuffer.isView(data))
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data === "string")
    return typeof Buffer !== "undefined"
      ? Buffer.from(data)
      : new TextEncoder().encode(data);
  throw new TypeError("zlib: unsupported input type");
}
const opts = (o) => (o && typeof o.level === "number" ? { level: o.level } : {});

function inflateSync(data, o) {
  return toBuf(pako.inflate(input(data), opts(o)));
}
function deflateSync(data, o) {
  return toBuf(pako.deflate(input(data), opts(o)));
}
function inflateRawSync(data, o) {
  return toBuf(pako.inflateRaw(input(data), opts(o)));
}
function deflateRawSync(data, o) {
  return toBuf(pako.deflateRaw(input(data), opts(o)));
}
function gzipSync(data, o) {
  return toBuf(pako.gzip(input(data), opts(o)));
}
function gunzipSync(data) {
  return toBuf(pako.ungzip(input(data)));
}
// node's unzipSync auto-detects zlib vs gzip; pako.inflate handles both headers.
function unzipSync(data) {
  return toBuf(pako.inflate(input(data)));
}

// CRC-32 (IEEE 802.3), matches Node's zlib.crc32(data[, value]). Lazily built
// table; returns an unsigned 32-bit number.
let CRC_TABLE = null;
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (CRC_TABLE = t);
}
function crc32(data, value) {
  const buf = input(data);
  const t = crcTable();
  let c = (value === undefined ? 0 : value >>> 0) ^ 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

module.exports = {
  inflateSync,
  deflateSync,
  inflateRawSync,
  deflateRawSync,
  gzipSync,
  gunzipSync,
  unzipSync,
  crc32,
  constants: pako, // Z_* flags live on pako; rarely needed, cheap to expose
};
module.exports.default = module.exports;
