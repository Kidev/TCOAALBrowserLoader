#!/usr/bin/env node
/*
 * play.js: run an extracted project in true browser mode (correct TCOAAL VN
 * rendering), straight from Linux: no RPG Maker MV editor, no NW.js, no Wine.
 *
 * It serves the project's already-decrypted files plus the BrowserPlayer
 * browser shim (pako + browser-shim.js, from app/js/libs), with the shim
 * injected into a bootstrap so the DRM payload runs in-browser. The CLD is
 * served at /lang-data.json; mods are stripped. Then it opens your browser.
 *
 * Usage:
 *   node tools/play.js <projectDir> [--port <n>] [--no-open]
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { loadCLD, createUnbaker } = require("./lang-roundtrip.js");

const ROOT = path.join(__dirname, "..");
const LIBS = path.join(ROOT, "app", "js", "libs");

const MIME = {
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
const mimeFor = (p) =>
  MIME[path.extname(p).toLowerCase()] || "application/octet-stream";

function parseArgs(argv) {
  const o = { project: null, port: 35791, open: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port") o.port = parseInt(argv[++i], 10) || o.port;
    else if (a === "--no-open") o.open = false;
    else if (a === "--help" || a === "-h") {
      console.log("Usage: node tools/play.js <projectDir> [--port <n>] [--no-open]");
      process.exit(0);
    } else if (!o.project) o.project = a;
  }
  return o;
}

/** Project index.html with pako + browser-shim injected right after rpg_core.js,
 *  so the DRM payload runs in-browser (require/zlib via pako) and Utils.isNwjs()
 *  is forced false.
 *
 *  Position matters: browser-shim's top-level IIFE bails early ("Utils is not
 *  defined") unless `Utils` already exists, and the bail skips the lines that
 *  lock Utils.isNwjs() to false and patch Bitmap.drawText. Yet the shim defines
 *  `require`/`process` before that point: so if it runs *before* rpg_core.js,
 *  the engine's Utils.isNwjs() (require fn + process obj) ends up TRUE and the
 *  game takes NW.js paths the shim doesn't cover (CLD format error, broken VN
 *  text layout). The shim must run AFTER rpg_core.js (Utils/Bitmap defined) but
 *  BEFORE plugins.js (where the DRM payload decompresses via the shim). This
 *  mirrors the canonical BrowserPlayer order:
 *    rpg_core.js -> pako -> browser-shim.js -> rpg_managers.js -> ... -> plugins.js
 */
function bootHtml(project) {
  let html = fs.readFileSync(path.join(project, "index.html"), "utf8");
  const inject =
    '<script type="text/javascript" src="/_play/pako_inflate.min.js"></script>\n' +
    '<script type="text/javascript" src="/_play/browser-shim.js"></script>\n';
  const coreTag = /(<script[^>]*\bsrc=["'][^"']*rpg_core\.js["'][^>]*>\s*<\/script>)/i;
  if (coreTag.test(html)) return html.replace(coreTag, "$1\n" + inject);
  // Fallbacks: no rpg_core.js tag found (custom index): best effort.
  return /<body[^>]*>/i.test(html)
    ? html.replace(/(<body[^>]*>)/i, "$1\n" + inject)
    : inject + html;
}

/** Build the localization layer: load the base CLD, un-bake every data/*.json
 *  (restoring (label)/(lines) placeholders the live command101 needs, minting
 *  fresh CLD keys for edited / newly authored dialogue), and return both the
 *  un-baked data buffers and the augmented CLD JSON for /lang-data.json.
 *
 *  Extract --playable bakes readable text into the editor; the live VN engine
 *  needs placeholders, so this reverses the bake at serve time without touching
 *  the editable project. A no-bake project (placeholders already present) passes
 *  through unchanged. If there is no CLD, data is served verbatim from disk. */
function buildLang(project) {
  const dataDir = path.join(project, "data");
  const dataCache = new Map(); // "data/<name>.json" -> un-baked Buffer
  const cldInfo = loadCLD(dataDir);
  if (!cldInfo) return { dataCache, langJson: "{}" };

  const { unbakeDoc } = createUnbaker(cldInfo.cld);
  let names = [];
  try {
    names = fs.readdirSync(dataDir);
  } catch (e) {
    /* none */
  }
  for (const n of names) {
    if (!/\.json$/i.test(n)) continue;
    const abs = path.join(dataDir, n);
    let obj;
    try {
      if (!fs.statSync(abs).isFile()) continue;
      obj = JSON.parse(fs.readFileSync(abs, "utf8"));
    } catch (e) {
      continue;
    }
    unbakeDoc(obj);
    dataCache.set("data/" + n, Buffer.from(JSON.stringify(obj)));
  }
  // Serialize after the walk so every minted key is included.
  return { dataCache, langJson: JSON.stringify(cldInfo.cld) };
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

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.project) {
    console.error("Usage: node tools/play.js <projectDir> [--port <n>] [--no-open]");
    process.exit(1);
  }
  const project = fs.existsSync(path.join(opts.project, "www"))
    ? path.join(opts.project, "www")
    : opts.project;
  if (!fs.existsSync(path.join(project, "index.html"))) {
    console.error(`No index.html under: ${opts.project}`);
    process.exit(1);
  }

  const lang = buildLang(project);

  const server = http.createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(url.parse(req.url).pathname || "/");
    } catch (e) {
      return send(res, 400, "text/plain", "bad url");
    }
    // The DRM resolves files against App.rootPath() = "." with Windows-style
    // separators, so requests arrive as ".\data\<hash>". A real BrowserPlayer
    // run normalizes these in the Service Worker; here we do it inline.
    rel = rel.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^(\.\/)+/, "");
    if (rel.split("/").includes("..")) return send(res, 403, "text/plain", "no");

    // BrowserPlayer's themed loading image (browser-shim requests /img/loading.png).
    if (rel === "img/loading.png") {
      if (serveFile(res, path.join(ROOT, "app", "img", "loading.png"), "image/png"))
        return;
    }

    if (rel === "" || rel === "index.html")
      return send(res, 200, MIME[".html"], bootHtml(project));
    if (rel === "lang-data.json")
      return send(res, 200, MIME[".json"], lang.langJson);
    if (rel === "mods.json") return send(res, 200, MIME[".json"], "{}");
    if (rel === "sw.js") return send(res, 200, MIME[".js"], "/* no-op */");

    // Un-baked data documents (placeholders + minted CLD keys restored).
    if (lang.dataCache.has(rel)) {
      return send(res, 200, MIME[".json"], lang.dataCache.get(rel));
    }

    // BrowserPlayer shim (served from the repo, not the project).
    if (rel.startsWith("_play/")) {
      if (serveFile(res, path.join(LIBS, path.basename(rel)), mimeFor(rel))) return;
      return send(res, 404, "text/plain", "missing shim: " + rel);
    }

    // Project files. Engine asset requests carry the extension we added; if a
    // bare hashed path is requested, retry the common media extensions.
    const abs = path.join(project, rel);
    if (serveFile(res, abs, mimeFor(rel))) return;
    if (!path.extname(rel)) {
      for (const e of [".png", ".ogg", ".webm", ".mp4"]) {
        if (serveFile(res, abs + e, mimeFor("x" + e))) return;
      }
    }
    send(res, 404, "text/plain", "not found: " + rel);
  });

  server.on("error", (e) => {
    console.error("Server error:", e.message);
    process.exit(1);
  });
  server.listen(opts.port, "127.0.0.1", () => {
    const u = `http://127.0.0.1:${opts.port}/`;
    console.log(`TCOAAL (browser mode) at  ${u}`);
    console.log("Ctrl+C to stop.\n");
    if (opts.open) {
      const open =
        { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] ||
        "xdg-open";
      try {
        require("child_process")
          .spawn(open, [u], { detached: true, stdio: "ignore" })
          .unref();
      } catch (e) {
        /* just print the URL */
      }
    }
  });
}

main();
