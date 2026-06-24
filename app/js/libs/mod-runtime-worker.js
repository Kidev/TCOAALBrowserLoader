/*
 * TCOAAL Browser Player
 * Copyright (C) 2026 kidev
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. This program is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 * General Public License for more details: <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/*
 * mod-runtime-worker.js - runs the heavy ModRuntime operations (createProject /
 * packProject / buildShare / applyTcoaalmod) off the main thread so the modding
 * UI never goes "page unresponsive". The page talks to it via postMessage:
 *
 *   page -> worker : { id, method, args }
 *   worker -> page : { id, ok:true, result }            (success)
 *                    { id, ok:false, error }            (the op threw)
 *                    { type: "progress", text }         (a tool phase line)
 *                    { type: "ready" } / { type:"fatal", error }  (startup)
 *
 * The tools (extract-project / pack-project / share-project) report progress by
 * writing phase lines to stdout; mod-runtime's ensureStdio() routes those to
 * console.log when there is no real stdout (the worker case), so capturing
 * console here forwards every progress line to drive the page's progress bar.
 */
"use strict";

// Map a tool's raw stdout line to a short, generic phase label - or null to
// drop it. The tools print precise lines (file counts, absolute paths, "Play it
// with: node server.js <path>", "Project ready: <path>"); we must NEVER surface
// those. Only a handful of friendly phases reach the UI; everything else (paths,
// run hints, completion lines) is dropped.
function cleanProgress(raw) {
  var s = String(raw || "").trim();
  if (!s) return null;
  var l = s.toLowerCase();
  // Phase keywords -> generic label. Order matters (earliest phase first).
  if (/\bextract|baseline|reading\b/.test(l)) return "Reading the game...";
  if (/\bdiff|compar|variant\b/.test(l)) return "Comparing versions...";
  if (/\bre-?pack|packing|packed\b/.test(l)) return "Packing...";
  if (/\bbak|placeholder|dialogue|language|text\b/.test(l)) return "Processing text...";
  if (/\bmap|parallax|background|name|asset\b/.test(l)) return "Processing assets...";
  // Anything else (paths, "play it with", "project ready", "done", "wrote ...")
  // is intentionally dropped so no path/name/run-hint ever shows.
  return null;
}

function postProgress(raw) {
  var text = cleanProgress(raw);
  if (!text) return;
  try {
    self.postMessage({ type: "progress", text: text });
  } catch (e) {}
}

// Forward the bundle's progress writes (console.log/console.warn) to the page,
// sanitized. Keep the native call too so full detail still shows in devtools.
var _log = console.log ? console.log.bind(console) : function () {};
console.log = function () {
  postProgress(Array.prototype.join.call(arguments, " "));
  _log.apply(null, arguments);
};
console.warn = console.log;
console.info = console.log;

var RT = null;
try {
  // Defines self.ModRuntime (esbuild IIFE, globalName "ModRuntime").
  importScripts("mod-runtime.js");
  RT = self.ModRuntime;
  if (!RT) throw new Error("mod-runtime.js loaded but ModRuntime is undefined");
  self.postMessage({ type: "ready" });
} catch (e) {
  // Startup failure: tell the page so it can fall back to a main-thread run.
  self.postMessage({ type: "fatal", error: (e && e.message) || String(e) });
}

self.onmessage = async function (e) {
  var msg = e.data || {};
  var id = msg.id;
  var method = msg.method;
  var args = msg.args || [];
  if (id == null) return;
  if (!RT || typeof RT[method] !== "function") {
    self.postMessage({
      id: id,
      ok: false,
      error: "Mod runtime method unavailable: " + method,
    });
    return;
  }
  try {
    var result = await RT[method].apply(RT, args);
    self.postMessage({ id: id, ok: true, result: result });
  } catch (err) {
    self.postMessage({
      id: id,
      ok: false,
      error: (err && err.message) || String(err),
    });
  }
};
