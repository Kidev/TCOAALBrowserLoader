/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser `url` for the bundled mod runtime. The only consumer is memfs
 * (@jsonjoy.com/fs-core + fs-node), which uses `require('url').URL` solely for a
 * `path instanceof URL` guard / file:// path parsing - and the tools always pass
 * plain string paths, so that branch is never taken. node-stdlib-browser
 * otherwise maps `url` to a full legacy url.parse proxy that drags in
 * qs + object-inspect + get-intrinsic (~70 KB) for an API nothing here calls.
 * esbuild aliases `url` to this module (see scripts/build-mod-runtime.js): the
 * browser's global URL/URLSearchParams plus the two file:// helpers.
 */
"use strict";

const g = typeof globalThis !== "undefined" ? globalThis : self;
const URL = g.URL;
const URLSearchParams = g.URLSearchParams;

function fileURLToPath(u) {
  const url = typeof u === "string" ? new URL(u) : u;
  if (url.protocol !== "file:")
    throw new TypeError("The URL must be of scheme file");
  return decodeURIComponent(url.pathname);
}

function pathToFileURL(p) {
  return new URL("file://" + encodeURI(String(p).replace(/\\/g, "/")));
}

module.exports = { URL, URLSearchParams, fileURLToPath, pathToFileURL };
module.exports.default = module.exports;
