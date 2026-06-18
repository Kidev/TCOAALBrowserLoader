#!/usr/bin/env node
/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Bundles tools/mod-runtime.js into app/js/libs/mod-runtime.js for the browser,
 * running the Node mod tools (extract-project -> patch -> pack-project) over an
 * in-memory memfs file system. Node built-ins are polyfilled with
 * node-stdlib-browser; `fs` is overridden to memfs and `@napi-rs/canvas` to a
 * throwing stub (-> canvas() returns null, image features skipped).
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

// Override the stdlib map: real in-memory fs, and a stub for the native canvas.
const stdlib = Object.assign({}, stdLibBrowser, {
  fs: path.join(root, "tools", "_fs-browser.js"),
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
    plugins: [nodeModulesPolyfillPlugin(stdlib)],
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
