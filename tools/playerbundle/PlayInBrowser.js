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
/*:
 * @plugindesc Adds a "Play in Browser" launcher that runs this project through
 * the BrowserPlayer locally (correct VN rendering), instead of the editor's
 * native playtest. Installed by `extract-project.js --playable`.
 * @author BrowserPlayer / extract-project
 *
 * @help
 * TCOAAL's dialogue layout, busts, CGs and title are provided by an obfuscated
 * DRM payload that only renders correctly in a browser context. The RPG Maker
 * MV editor playtest runs it in NW.js where that layer is incomplete.
 *
 * This plugin spins up a tiny local HTTP server (Node, via NW.js) that serves
 * this project's already-decrypted files plus the BrowserPlayer browser shim
 * (pako + browser-shim.js, bundled under _play/), then points the window at it
 * so the game runs in true browser mode: exactly how the BrowserPlayer plays
 * it. No mods, no re-encryption, no IndexedDB import.
 *
 * Trigger it from the title menu entry "Play in Browser", or press F9 at any
 * time during the editor playtest.
 *
 * Inert outside NW.js (i.e. it does nothing when already running in a browser),
 * so it is safe to leave installed.
 */

(function () {
  "use strict";

  // Only meaningful inside real NW.js (the editor playtest / packaged runtime).
  // Note: the BrowserPlayer's browser-shim provides require()/process stubs, so
  // checking those is not enough: gate on process.versions.nw (set only by
  // NW.js) and on a real require('http').createServer. Otherwise this is a
  // no-op (e.g. when already running in a browser via tools/play.js).
  if (
    typeof process !== "object" ||
    !process.versions ||
    !process.versions.nw ||
    typeof require !== "function"
  ) {
    return;
  }

  var http, fs, path;
  try {
    http = require("http");
    fs = require("fs");
    path = require("path");
  } catch (e) {
    return;
  }
  if (!http || typeof http.createServer !== "function") return;
  if (window.__playInBrowserStarted) return;

  // Project root (folder that holds index.html / data / js / _play).
  var ROOT =
    typeof nw !== "undefined" && nw.__dirname ? nw.__dirname : process.cwd();

  var PORT = 35791;
  var server = null;

  var MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
  };
  function mimeFor(p) {
    return MIME[path.extname(p).toLowerCase()] || "application/octet-stream";
  }

  // Build the browser-mode bootstrap: the project's index.html with pako +
  // browser-shim injected before the engine scripts (so the DRM payload's
  // require('zlib')/inflate works in-browser and Utils.isNwjs() is forced
  // false). The existing window.onload overrides are kept.
  function bootHtml() {
    var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    var inject =
      '<script type="text/javascript" src="_play/pako_inflate.min.js"></script>\n' +
      '<script type="text/javascript" src="_play/browser-shim.js"></script>\n';
    // Insert right after <body ...> so the shim runs before pixi/rpg_core.
    if (/<body[^>]*>/i.test(html)) {
      html = html.replace(/(<body[^>]*>)/i, "$1\n" + inject);
    } else {
      html = inject + html;
    }
    return html;
  }

  // Localization layer, built once and cached. Loads the base CLD and un-bakes
  // every data/*.json (extract --playable bakes readable text for the editor;
  // the live command101 needs (label)/(lines) placeholders to lay out dialogue
  // with speaker + paging). Unchanged dialogue is restored to its original CLD
  // key; edited / newly authored dialogue mints a fresh key. The un-baker is the
  // shared tools/lang-roundtrip.js, bundled into _play/ by extract-project.
  //   _lang.data["data/<n>.json"] -> un-baked JSON string
  //   _lang.langJson              -> augmented CLD for /lang-data.json
  var _lang = null;
  function getLang() {
    if (_lang) return _lang;
    _lang = { data: {}, langJson: "{}" };
    try {
      var rt = require(path.join(ROOT, "_play", "lang-roundtrip.js"));
      var dir = path.join(ROOT, "data");
      var cldInfo = rt.loadCLD(dir);
      if (cldInfo) {
        var ub = rt.createUnbaker(cldInfo.cld);
        var names = fs.readdirSync(dir);
        for (var i = 0; i < names.length; i++) {
          var n = names[i];
          if (!/\.json$/i.test(n)) continue;
          var abs = path.join(dir, n);
          var obj;
          try {
            if (!fs.statSync(abs).isFile()) continue;
            obj = JSON.parse(fs.readFileSync(abs, "utf8"));
          } catch (e) {
            continue;
          }
          ub.unbakeDoc(obj);
          _lang.data["data/" + n] = JSON.stringify(obj);
        }
        _lang.langJson = JSON.stringify(cldInfo.cld);
      }
    } catch (e) {
      console.error("[PlayInBrowser] lang un-bake failed:", e);
    }
    return _lang;
  }

  function send(res, code, type, body) {
    res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-cache" });
    res.end(body);
  }

  function serveFile(res, abs, mime) {
    try {
      if (!fs.statSync(abs).isFile()) return false;
    } catch (e) {
      return false;
    }
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-cache" });
    fs.createReadStream(abs).pipe(res);
    return true;
  }

  function handler(req, res) {
    var rel;
    try {
      rel = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch (e) {
      return send(res, 400, "text/plain", "bad url");
    }
    // The DRM resolves files against App.rootPath() with Windows separators, so
    // requests arrive as ".\data\<hash>": normalize to forward-slash relative.
    rel = rel
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/^(\.\/)+/, "");
    if (rel.split("/").indexOf("..") !== -1)
      return send(res, 403, "text/plain", "no");

    if (rel === "" || rel === "index.html") {
      return send(res, 200, MIME[".html"], bootHtml());
    }
    if (rel === "lang-data.json") {
      return send(res, 200, MIME[".json"], getLang().langJson);
    }
    if (rel === "mods.json") return send(res, 200, MIME[".json"], "{}");

    // Un-baked data documents (placeholders + minted CLD keys restored).
    var unbaked = getLang().data[rel];
    if (unbaked !== undefined) {
      return send(res, 200, MIME[".json"], unbaked);
    }

    // Disable the Service Worker for this local play session: serve an empty
    // SW so registration succeeds but nothing is intercepted (our server
    // already serves decrypted files at the requested paths).
    if (rel === "sw.js") return send(res, 200, MIME[".js"], "/* no-op */");

    // Everything else: a project file at the requested path. Engine asset
    // requests carry an extension we already added (img/x/<hash>.png); if a
    // bare hashed path is requested, try the common media extensions.
    var abs = path.join(ROOT, rel);
    if (serveFile(res, abs, mimeFor(rel))) return;
    if (!path.extname(rel)) {
      var exts = [".png", ".ogg", ".webm", ".mp4"];
      for (var i = 0; i < exts.length; i++) {
        if (serveFile(res, abs + exts[i], mimeFor("x" + exts[i]))) return;
      }
    }
    send(res, 404, "text/plain", "not found: " + rel);
  }

  function launch() {
    if (window.__playInBrowserStarted) return;
    window.__playInBrowserStarted = true;
    try {
      server = http.createServer(handler);
      server.on("error", function (e) {
        console.error("[PlayInBrowser] server error:", e.message);
        window.__playInBrowserStarted = false;
      });
      server.listen(PORT, "127.0.0.1", function () {
        var u = "http://127.0.0.1:" + PORT + "/";
        console.log("[PlayInBrowser] serving at " + u);
        // Do NOT navigate this window: an NW.js window keeps `require`/`process`
        // defined, so the browser shim can't take over cleanly. Open the URL in
        // a real browser instead (and always surface it so the user can copy it).
        try {
          if (typeof nw !== "undefined" && nw.Shell && nw.Shell.openExternal) {
            nw.Shell.openExternal(u);
          }
        } catch (e) {}
        try {
          alert(
            "Play-in-Browser server started.\n\n" +
              "Open this URL in your web browser:\n" +
              u +
              "\n\n(Keep this playtest window open: it is the server.)",
          );
        } catch (e) {}
      });
    } catch (e) {
      console.error("[PlayInBrowser] failed to launch:", e);
      window.__playInBrowserStarted = false;
    }
  }

  // F9 hotkey (works even when the title screen is disabled).
  window.addEventListener("keydown", function (e) {
    if (e.key === "F9") launch();
  });

  // Title menu entry, if a title scene exists.
  if (typeof Window_TitleCommand !== "undefined") {
    var _make = Window_TitleCommand.prototype.makeCommandList;
    Window_TitleCommand.prototype.makeCommandList = function () {
      _make.call(this);
      this.addCommand("Play in Browser", "playInBrowser");
    };
  }
  if (typeof Scene_Title !== "undefined") {
    var _create = Scene_Title.prototype.createCommandWindow;
    Scene_Title.prototype.createCommandWindow = function () {
      _create.call(this);
      if (this._commandWindow) {
        this._commandWindow.setHandler("playInBrowser", launch.bind(this));
      }
    };
  }
})();
