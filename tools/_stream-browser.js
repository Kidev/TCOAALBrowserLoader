/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser `stream` for the bundled mod runtime. memfs eagerly
 * require("node:stream") (via @jsonjoy.com/fs-node-builtins) only to back its
 * createReadStream / createWriteStream - which the tools never call, using
 * exclusively the sync fs API. node-stdlib-browser would otherwise pull the full
 * `readable-stream` impl (~82 KB) plus string_decoder. The build aliases
 * stream / readable-stream / string_decoder to this module (see
 * scripts/build-mod-runtime.js): benign no-op classes that satisfy the eager
 * require and any subclassing, never instantiated for real I/O. Verified: a full
 * extract-project run over memfs (2151 files) produces a byte-identical project
 * with this stub and with the real readable-stream.
 */
"use strict";

class Stream {
  on() {
    return this;
  }
  once() {
    return this;
  }
  removeListener() {
    return this;
  }
  emit() {
    return false;
  }
  pipe(dest) {
    return dest;
  }
  write() {
    return true;
  }
  end() {}
  destroy() {}
}
class Readable extends Stream {
  read() {
    return null;
  }
  push() {
    return false;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
}
class Writable extends Stream {}
class Duplex extends Readable {}
class Transform extends Duplex {}
class PassThrough extends Transform {}

class StringDecoder {
  write(buf) {
    return typeof Buffer !== "undefined" ? Buffer.from(buf).toString() : String(buf);
  }
  end() {
    return "";
  }
}

module.exports = {
  Stream,
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
  StringDecoder,
  pipeline: (...a) => {
    const cb = a[a.length - 1];
    if (typeof cb === "function") cb();
  },
  finished: (s, cb) => {
    if (typeof cb === "function") cb();
  },
};
module.exports.default = module.exports;
