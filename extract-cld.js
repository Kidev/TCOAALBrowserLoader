#!/usr/bin/env node
// Extracts a CLD (Compiled Language Data) file into the TCOAAL translator
// layout: img/, font/, dialogue.csv (canonical sectioned CSV).
//
// CLD format: "LANGDATA" (8 bytes) + UTF-8 JSON. Top-level fields:
//   langVers, langName, langInfo, fontFace, fontSize  (metadata)
//   fontFile   base64 font (TTF/OTF)
//   imgFiles   { "img/<path>": base64 PNG }
//   sysLabel   { "English label": "translation" }
//   sysMenus   { "English menu": "translation" }
//   labelLUT   { "<hash>": "translation" }
//   linesLUT   { "<hash>": array (or JSON-encoded array) of translated lines }
//
// If the input is TCOAAL-encrypted (starts with "TCOAAL"), decrypt it first.
// When a base-game English CLD is available (default:
// base-game/www/data/9c7050ae76645487, override with --english <path>),
// its strings fill the "English" column of the emitted CSV.
//
// Usage:  node extract-cld.js <input.cld> [outDir] [--english <path>]

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CLD_KEY_BYTE = 0xff; // matches server.js CLD_KEY for data/9c7050ae76645487

function fileMaskFromName(name) {
  let m = 0;
  const up = name.toUpperCase();
  for (let i = 0; i < up.length; i++) m = (m << 1) ^ up.charCodeAt(i);
  return (m + 1) & 0xff;
}

function dekit(buf, startingMask) {
  // TCOAAL(6) + keyByte(1) + payload
  const key = buf[6];
  const payload = buf.slice(7);
  const out = Buffer.alloc(payload.length);
  let mask = startingMask;
  const end = key === 0 ? payload.length : Math.min(key, payload.length);
  for (let i = 0; i < end; i++) {
    const b = payload[i];
    out[i] = b ^ mask;
    mask = ((mask << 1) ^ b) & 0xff;
  }
  if (key !== 0) payload.copy(out, end, end);
  return out;
}

function detectImageExt(b64) {
  const head = Buffer.from(b64.slice(0, 16), "base64");
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  )
    return ".png";
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return ".jpg";
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return ".gif";
  if (
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[8] === 0x57
  )
    return ".webp";
  return ".bin";
}

function detectFontExt(b64) {
  const head = Buffer.from(b64.slice(0, 8), "base64");
  // OTF: "OTTO", TTF: 0x00010000, WOFF: "wOFF", WOFF2: "wOF2"
  const sig4 = head.slice(0, 4).toString("binary");
  if (sig4 === "OTTO") return ".otf";
  if (sig4 === "wOFF") return ".woff";
  if (sig4 === "wOF2") return ".woff2";
  if (
    head[0] === 0x00 &&
    head[1] === 0x01 &&
    head[2] === 0x00 &&
    head[3] === 0x00
  )
    return ".ttf";
  return ".ttf";
}

function csvEscape(s) {
  if (s == null) return "";
  const str = String(s);
  if (/[",\r\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

// linesLUT values are stored inconsistently across CLDs: the base-game
// English CLD holds arrays directly, while some community CLDs (e.g. the
// Russian one) store the same shape JSON-encoded as a string. Normalize both
// to a plain string array.
function normalizeLines(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    if (v.length && v.charAt(0) === "[") {
      try {
        const p = JSON.parse(v);
        if (Array.isArray(p)) return p.map(String);
      } catch {}
    }
    return [v];
  }
  return [String(v)];
}

function readCLD(p) {
  let buf = fs.readFileSync(p);
  if (buf.slice(0, 6).toString() === "TCOAAL") {
    const hashedName = path.basename(p).split(".")[0];
    buf = dekit(buf, fileMaskFromName(hashedName));
  }
  const sig = buf.slice(0, 8).toString();
  if (sig !== "LANGDATA") {
    throw new Error(`not a CLD (bad magic ${JSON.stringify(sig)}): ${p}`);
  }
  return JSON.parse(buf.slice(8).toString("utf8"));
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { english: null };
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--english" || a === "-e") {
      opts.english = args[++i];
    } else {
      positional.push(a);
    }
  }
  opts.input = positional[0];
  opts.outDir = positional[1];
  return opts;
}

function resolveEnglishCld(explicit) {
  if (explicit) return path.resolve(explicit);
  const defaults = [
    path.resolve("base-game/www/data/9c7050ae76645487"),
    path.resolve("www/data/9c7050ae76645487"),
  ];
  for (const p of defaults) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// The CLD preserves only flat labelLUT / linesLUT: the canonical translator
// CSV's Speakers / Items / Descriptions split and per-map Section grouping
// aren't recoverable from the CLD alone. We emit a single "Items" section
// for all labelLUT entries and a single "Section,lines.json,," block for all
// linesLUT entries; lang-shim.js's parseDialogueCsv routes both back into
// labelLUT / linesLUT on re-import, so the CSV round-trips to the same CLD.
function emitDialogueCsv(cld, english, outPath) {
  const rows = [];
  const blank = ["", "", "", ""];

  rows.push(["Version", "", "", ""]);
  rows.push([cld.langVers || "", "", "", ""]);
  rows.push(blank);

  rows.push(["Language", "Font File", "Font Size", ""]);
  rows.push([
    cld.langName || "",
    cld.fontFace || "",
    cld.fontSize != null ? String(cld.fontSize) : "",
    "",
  ]);
  rows.push(blank);

  const info = cld.langInfo || [];
  rows.push(["Credit 1", "Credit 2", "Credit 3", ""]);
  rows.push([info[0] || "", info[1] || "", info[2] || "", ""]);
  rows.push(blank);

  // Labels (sysLabel): key is the English label, value is the translation.
  // The base-game CLD's sysLabel[key] may expand the key into a fuller
  // English string (e.g. "Game" -> "The Coffin of Andy and Leyley").
  if (cld.sysLabel) {
    rows.push(["Labels", "English", "Translation", ""]);
    for (const [k, v] of Object.entries(cld.sysLabel)) {
      const en = (english && english.sysLabel && english.sysLabel[k]) || k;
      rows.push([k, en, v, ""]);
    }
    rows.push(blank);
  }

  // Menus (sysMenus): translation-only column per the canonical format.
  if (cld.sysMenus) {
    rows.push(["Menus", "Translation", "", ""]);
    for (const [k, v] of Object.entries(cld.sysMenus)) {
      rows.push([k, v, "", ""]);
    }
    rows.push(blank);
  }

  // labelLUT: hashed keys for item names, speaker names, etc. Dumped under
  // "Items" (lang-shim.js routes both "Speakers" and "Items" to labelLUT).
  if (cld.labelLUT) {
    rows.push(["Items", "English", "Translation", ""]);
    for (const [k, v] of Object.entries(cld.labelLUT)) {
      const en = (english && english.labelLUT && english.labelLUT[k]) || "";
      rows.push([k, en, v, ""]);
    }
    rows.push(blank);
  }

  // linesLUT: one row per line, key repeated when the array has multiple
  // elements (matches the canonical format). Source column is left empty:
  // speaker attribution lives in the original Map*.json events, which the
  // CLD does not preserve.
  if (cld.linesLUT) {
    rows.push(["Section", "lines.json", "", ""]);
    rows.push(["ID", "Source", "English", "Translation"]);
    for (const [k, v] of Object.entries(cld.linesLUT)) {
      const tr = normalizeLines(v);
      const en =
        english && english.linesLUT ? normalizeLines(english.linesLUT[k]) : [];
      const n = Math.max(tr.length, en.length);
      for (let i = 0; i < n; i++) {
        rows.push([k, "", en[i] || "", tr[i] || ""]);
      }
    }
  }

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
  fs.writeFileSync(outPath, csv);
  return rows.length;
}

function main() {
  const opts = parseArgs(process.argv);
  if (!opts.input) {
    console.error(
      "Usage: node extract-cld.js <input.cld> [outDir] [--english <path>]",
    );
    process.exit(1);
  }
  const inFile = path.resolve(opts.input);
  const outDir = path.resolve(opts.outDir || inFile + ".extracted");

  const cld = readCLD(inFile);

  let english = null;
  const engPath = resolveEnglishCld(opts.english);
  if (engPath) {
    try {
      english = readCLD(engPath);
      console.log(`[english] ${path.relative(process.cwd(), engPath)}`);
    } catch (e) {
      console.warn(`[english] failed to load ${engPath}: ${e.message}`);
    }
  } else {
    console.log("[english] none found: English column will be empty");
  }

  fs.mkdirSync(outDir, { recursive: true });
  console.log(`[out] ${outDir}`);

  if (cld.fontFile) {
    const ext = detectFontExt(cld.fontFile);
    const fontDir = path.join(outDir, "font");
    fs.mkdirSync(fontDir, { recursive: true });
    const fontPath = path.join(fontDir, (cld.fontFace || "font") + ext);
    fs.writeFileSync(fontPath, Buffer.from(cld.fontFile, "base64"));
    console.log(
      `  font/${path.basename(fontPath)}  (${fs.statSync(fontPath).size} bytes)`,
    );
  }

  if (cld.imgFiles) {
    let n = 0,
      bytes = 0;
    for (const [relPath, b64] of Object.entries(cld.imgFiles)) {
      const ext = detectImageExt(b64);
      const dest = path.join(outDir, relPath + ext);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const data = Buffer.from(b64, "base64");
      fs.writeFileSync(dest, data);
      bytes += data.length;
      n++;
    }
    console.log(
      `  img/       (${n} files, ${(bytes / 1024 / 1024).toFixed(1)} MB)`,
    );
  }

  const nRows = emitDialogueCsv(
    cld,
    english,
    path.join(outDir, "dialogue.csv"),
  );
  console.log(
    `  dialogue.csv  (${nRows} rows: ${cld.langName} / ${cld.langVers})`,
  );

  console.log("[done]");
}

main();
