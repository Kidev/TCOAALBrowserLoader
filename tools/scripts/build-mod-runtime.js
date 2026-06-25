#!/usr/bin/env node
/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Bundles tools/mod-runtime.js into app/js/libs/mod-runtime.js for the browser,
 * running the Node mod tools (extract-project -> patch -> pack-project) over an
 * in-memory memfs file system. Node built-ins are polyfilled with
 * node-stdlib-browser; `fs` is overridden to memfs and `@napi-rs/canvas` to a
 * throwing stub (-> canvas() returns null, image features skipped). `crypto` is
 * overridden to a tiny SHA-256-only shim (the tools only use createHash), so the
 * ~1.5 MB browserify asymmetric-crypto stack is not bundled, and `zlib` to a
 * pako-backed sync-only shim (the tools only use the sync one-shot functions),
 * dropping browserify-zlib + its assert dependency. `stream` / `readable-stream`
 * / `string_decoder` are stubbed to no-op classes (memfs eagerly requires
 * node:stream only for createReadStream/WriteStream, which the tools never use),
 * dropping the ~82 KB readable-stream impl.
 *
 *   npm run build:mod-runtime
 */
"use strict";

const path = require("path");
const esbuild = require("esbuild");
const stdLibBrowser = require("node-stdlib-browser");
const nodeModulesPolyfillPlugin = require("node-stdlib-browser/helpers/esbuild/plugin");

// repo root: this script lives at tools/scripts/, so go up two.
const root = path.join(__dirname, "..", "..");

// Stub the node stream stack. memfs require("node:stream") eagerly via
// @jsonjoy.com/fs-node-builtins to back createReadStream/createWriteStream, which
// the tools never call (sync fs only). An onResolve catches the bare specifiers
// (incl. the `node:` prefix, which the stdlib map below does not intercept).
const streamStub = {
  name: "stream-stub",
  setup(build) {
    const stub = path.join(root, "tools", "_stream-browser.js");
    build.onResolve(
      { filter: /^(node:)?(stream|readable-stream|string_decoder)$/ },
      () => ({ path: stub })
    );
  },
};

// Override the stdlib map: real in-memory fs, and a SHA-256-only crypto shim in
// place of the heavy browserify crypto polyfill (the native canvas is stubbed
// via esbuild `alias` below).
const stdlib = Object.assign({}, stdLibBrowser, {
  fs: path.join(root, "tools", "_fs-browser.js"),
  crypto: path.join(root, "tools", "_crypto-browser.js"),
  zlib: path.join(root, "tools", "_zlib-browser.js"),
  // memfs only needs require('url').URL (= global URL); avoid the legacy
  // url.parse proxy that pulls qs + object-inspect + get-intrinsic.
  url: path.join(root, "tools", "_url-browser.js"),
});

esbuild
  .build({
    entryPoints: [path.join(root, "tools", "mod-runtime.js")],
    bundle: true,
    outfile: path.join(root, "app", "js", "libs", "mod-runtime.js"),
    format: "iife",
    globalName: "ModRuntime",
    platform: "browser",
    target: ["es2020"],
    define: {
      global: "globalThis",
      "process.browser": "true",
    },
    inject: [require.resolve("node-stdlib-browser/helpers/esbuild/shim")],
    alias: {
      "@napi-rs/canvas": path.join(root, "tools", "_canvas-browser.js"),
    },
    plugins: [streamStub, nodeModulesPolyfillPlugin(stdlib)],
    legalComments: "none",
    logLevel: "info",
  })
  .then(() => {
    console.log("Built app/js/libs/mod-runtime.js");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
