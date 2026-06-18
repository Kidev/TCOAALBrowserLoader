/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser `fs` for the bundled mod runtime: the in-memory memfs file system.
 * esbuild aliases the Node `fs` import to this module (see scripts/build-mod-
 * runtime.js), so every fs.*Sync call the tools make hits the same memfs volume
 * the runtime (mod-runtime.js, via `require('memfs').vol`) populates and reads.
 */
"use strict";
module.exports = require("memfs").fs;
