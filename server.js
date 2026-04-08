#!/usr/bin/env node
/**
 * TCOAAL Browser Server
 *
 * Minimal static file server for the app/ directory and mod assets.
 * Game files are imported by the user via loader.html into IndexedDB;
 * the Service Worker (sw.js) handles decryption in the browser.
 *
 * Usage:
 *   node server.js              # http://localhost:8080
 *   PORT=3000 node server.js    # custom port
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = parseInt(process.env.PORT, 10) || 8080;
const APP_DIR = path.join(__dirname, "app");

// MIME types

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".loc": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function mimeFor(filePath) {
  return (
    MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream"
  );
}

// Serve a static file. Returns true if found and served.

function serveFile(req, res, absPath, mime) {
  let stat;
  try {
    stat = fs.statSync(absPath);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;

  const etag = `"${stat.mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;
  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304);
    res.end();
    return true;
  }

  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Length": stat.size,
    ETag: etag,
    "Cache-Control": "no-cache",
  });
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  fs.createReadStream(absPath).pipe(res);
  return true;
}

// Request handler

function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }

  let reqPath;
  try {
    reqPath = decodeURIComponent(url.parse(req.url).pathname || "/");
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  const logicalRel = reqPath.replace(/^\/+/, "") || "index.html";
  if (logicalRel.includes("..")) {
    res.writeHead(403);
    res.end();
    return;
  }

  const mime = mimeFor(logicalRel);

  // Mods manifest
  if (logicalRel === "mods.json") {
    const modsPath = path.join(__dirname, "mods.json");
    if (serveFile(req, res, modsPath, "application/json; charset=utf-8"))
      return;
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": 2,
      "Cache-Control": "no-cache",
    });
    res.end("{}");
    return;
  }

  // Mod assets (from mods/ directory at repo root)
  if (logicalRel.startsWith("mods/")) {
    const modFilePath = path.join(__dirname, logicalRel);
    if (serveFile(req, res, modFilePath, mime)) return;
  }

  // App files (index.html, loader.html, sw.js, shims, etc.)
  if (serveFile(req, res, path.join(APP_DIR, logicalRel), mime)) return;

  // Not found
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end(`Not found: ${logicalRel}`);
}

// Start

const server = http.createServer(handler);
server.listen(PORT, "127.0.0.1", () => {
  const gameUrl = `http://localhost:${PORT}`;
  console.log(`TCOAAL running at  ${gameUrl}`);
  console.log("Press Ctrl+C to stop.\n");

  const open =
    { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] ||
    "xdg-open";
  require("child_process")
    .spawn(open, [gameUrl], { detached: true, stdio: "ignore" })
    .unref();
});

server.on("error", (err) => {
  console.error("Server error:", err.message);
  process.exit(1);
});
