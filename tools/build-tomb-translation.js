#!/usr/bin/env node
/**
 * build-tomb-translation.js: package a Tomb-format translation mod into a
 * translations.tcoaal.app-ready folder for one language.
 *
 * A translation is deployed not as a self-contained game but as a *translation
 * overlay* the player's Service Worker layers on top of an active overhaul:
 * base CLD -> overhaul lang data -> translation lang data (translation wins).
 * `tryModOverlay` also serves the translation's own asset overrides, so a
 * translation may replace images too.
 *
 * The runtime (sw.js loadModLangData / lang-shim extractModLangData) consumes a
 * translation's language as one `langFile`:
 *   - ".loc" / ".json"  parsed as a *plain JSON* CLD (linesLUT/labelLUT/...)
 *   - ".csv" / ".txt"   the TCOAAL translator dialogue formats
 * Tomb translation mods already ship their text as "languages/<lang>.json"
 * (CLD-shaped: sysLabel/labelLUT/linesLUT), so we emit that directly as a plain
 * JSON "dialogue.loc". A dialogue.csv/.txt, if present instead, is passed
 * through unchanged.
 *
 * This tool also renders any CanopyImageBuilder image whose input the
 * translation overrides (e.g. a re-translated "*_patch.bin.gz"), so the
 * translated image ships at its real logical path, and copies the translation's
 * direct asset overrides (e.g. img/pictures/_canopy_postit.png).
 *
 * Output layout (drop into translations/<MOD>_translations/<lang>/ on the host):
 *   dialogue.loc | dialogue.csv | dialogue.txt   the langFile
 *   icon.png                                     mod-list icon
 *   img/.../*.png                             asset overrides
 *   manifest.json                                { name, version, langFile, files }
 *
 * Usage:
 *   node tools/build-tomb-translation.js --translation <dir> --out <dir> \
 *        [--mod <overhaulModDir>] [--base <baseGameDir>] \
 *        [--lang <name>] [--icon <img>] [--name <str>] [--id <MODCODE>]
 *
 *   --translation <dir>  The translation mod folder (mod.json + languages/...).
 *   --out         <dir>  Output folder (the <lang>/ contents are written here).
 *   --mod         <dir>  The overhaul mod being translated (for CanopyImageBuilder
 *                        instructions). Required only if the translation
 *                        overrides CanopyImageBuilder inputs.
 *   --base        <dir>  Base game for CanopyImageBuilder sources (e.g. old_game).
 *                        Required with --mod.
 *   --lang        <name> Language slug (default: inferred from languages/<lang>.json).
 *   --icon        <img>  Icon image (default: <translation>/icon.png if present).
 *   --name        <str>  Display name for manifest.json (default: titlecased lang).
 *   --id          <code> Overhaul mod code this translates (for the printed hints).
 *   -h, --help           Show this help.
 *
 * CanopyImageBuilder overrides + image work need: npm install @napi-rs/canvas
 */

"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const tomb = require("./build-tomb-mod.js");

const {
  canvas,
  isDir,
  isFile,
  contentRoot,
  walk,
  writeOut,
  buildCanopyImage,
  loadCanopySource,
  loadLocalImageData,
} = tomb;

// Roots whose files are treated as direct asset overrides to carry through.
const ASSET_ROOTS = ["img", "audio", "data", "js", "fonts", "movies", "se"];

/** Infer the language slug from a translation's languages/<lang>.json. */
function detectLang(root) {
  const dir = path.join(root, "languages");
  if (isDir(dir)) {
    const j = fs.readdirSync(dir).find((f) => /\.json$/i.test(f));
    if (j) return j.replace(/\.json$/i, "");
  }
  return null;
}

/** Title-case a slug: "portuguese-brazil" -> "Portuguese Brazil". */
function titleCase(slug) {
  return slug
    .split(/[_\s-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** First existing path under root matching one of the relative candidates. */
function firstExisting(root, candidates) {
  for (const c of candidates) {
    const abs = path.join(root, c);
    if (isFile(abs)) return { abs, rel: c };
  }
  return null;
}

async function packageTranslation(opts) {
  const tRoot = contentRoot(opts.translation);
  const lang =
    opts.lang || detectLang(tRoot) || path.basename(opts.translation);
  // The deploy slug (folder name + langs.txt + mods.json key) may differ from
  // the CLD source filename, e.g. languages/portuguese.json -> "portuguese-brazil".
  const slug = opts.slug || lang;
  const out = opts.out;
  const files = []; // manifest file list (relative to out)
  const warnings = [];

  fs.mkdirSync(out, { recursive: true });

  // 1. Language file (the langFile).
  let langFile = null;
  const csvTxt = firstExisting(tRoot, [
    "dialogue.csv",
    "dialogue.txt",
    `${lang}/dialogue.csv`,
    `${lang}/dialogue.txt`,
    `languages/${lang}/dialogue.csv`,
    `languages/${lang}/dialogue.txt`,
  ]);
  if (csvTxt) {
    // Translator format: pass through unchanged, the runtime parses it.
    langFile = path.basename(csvTxt.rel);
    fs.writeFileSync(path.join(out, langFile), fs.readFileSync(csvTxt.abs));
    files.push(langFile);
  } else {
    const jsonAbs = path.join(tRoot, "languages", lang + ".json");
    if (!isFile(jsonAbs)) {
      throw new Error(
        `no language source found: expected languages/${lang}.json or a ` +
          `dialogue.csv/.txt under ${tRoot}`,
      );
    }
    // CLD-shaped delta -> emit as a plain-JSON dialogue.loc.
    const cld = JSON.parse(fs.readFileSync(jsonAbs, "utf8"));
    if (!cld.linesLUT && !cld.labelLUT && !cld.sysMenus) {
      warnings.push(
        `languages/${lang}.json has no linesLUT/labelLUT/sysMenus; the runtime ` +
          `may ignore it`,
      );
    }
    langFile = "dialogue.loc";
    fs.writeFileSync(path.join(out, langFile), JSON.stringify(cld));
    files.push(langFile);
  }

  // 2. Direct asset overrides (images, etc. the translation replaces).
  for (const rel of walk(tRoot)) {
    const top = rel.split("/")[0];
    if (!ASSET_ROOTS.includes(top)) continue;
    if (/(^|\/)backup\//i.test(rel)) continue;
    writeOut(out, rel, fs.readFileSync(path.join(tRoot, rel)));
    if (!files.includes(rel)) files.push(rel);
  }

  // 3. CanopyImageBuilder overrides (re-render with the translation's
  //        patches/masks so the translated image ships at its logical path).
  const tCanopy = path.join(tRoot, "canopyimagebuilder", "input");
  if (isDir(tCanopy)) {
    if (!opts.mod || !opts.base) {
      warnings.push(
        `${path.relative(".", tCanopy)} present but --mod/--base not given; ` +
          `CanopyImageBuilder overrides were NOT rendered`,
      );
    } else if (!canvas()) {
      warnings.push(
        `CanopyImageBuilder overrides skipped: install @napi-rs/canvas`,
      );
    } else {
      const n = await renderCanopyOverrides(
        tCanopy,
        opts,
        out,
        files,
        warnings,
      );
      if (n === 0) {
        warnings.push(
          `canopyimagebuilder/input present but no overridden instruction was ` +
            `matched against --mod`,
        );
      }
    }
  }

  // 4. Icon.
  const iconSrc =
    (opts.icon && isFile(opts.icon) && opts.icon) ||
    (isFile(path.join(tRoot, "icon.png")) && path.join(tRoot, "icon.png")) ||
    (opts.mod &&
      isFile(path.join(contentRoot(opts.mod), "img/titles1/title.png")) &&
      path.join(contentRoot(opts.mod), "img/titles1/title.png")) ||
    null;
  if (iconSrc) {
    fs.copyFileSync(iconSrc, path.join(out, "icon.png"));
    files.push("icon.png");
  } else {
    warnings.push("no icon found; supply --icon or add icon.png");
  }

  // 5. manifest.json.
  let modJson = {};
  const modJsonPath = isFile(path.join(opts.translation, "mod.json"))
    ? path.join(opts.translation, "mod.json")
    : isFile(path.join(tRoot, "mod.json"))
      ? path.join(tRoot, "mod.json")
      : null;
  if (modJsonPath) {
    try {
      modJson = JSON.parse(fs.readFileSync(modJsonPath, "utf8"));
    } catch {}
  }
  const manifest = {
    name: opts.name || titleCase(lang),
    author: (modJson.authors && modJson.authors.join(", ")) || "",
    description: modJson.description || "",
    version: modJson.version || new Date().toISOString().substring(0, 10),
    langFile,
    files,
  };
  fs.writeFileSync(
    path.join(out, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  // Report + deployment hints.
  console.log(
    `Translation "${manifest.name}" (${lang}) written to ${out}\n` +
      `  langFile: ${langFile}\n` +
      `  files: ${files.length}\n` +
      (warnings.length
        ? "\nWarnings:\n" + warnings.map((w) => "  ! " + w).join("\n") + "\n"
        : ""),
  );
  printDeploymentHints(opts, slug, manifest);
}

/**
 * Re-render the overhaul's CanopyImageBuilder instructions whose inputs the
 * translation overrides, writing the translated PNGs to `out` at their logical
 * output path. Returns the count rendered.
 */
async function renderCanopyOverrides(tCanopy, opts, out, files, warnings) {
  const baseRoot = contentRoot(opts.base);
  // The overhaul's instruction dir: <mod>/canopyimagebuilder/input.
  const modCanopyInput = isDir(
    path.join(opts.mod, "canopyimagebuilder", "input"),
  )
    ? path.join(opts.mod, "canopyimagebuilder", "input")
    : path.join(contentRoot(opts.mod), "canopyimagebuilder", "input");
  if (!isDir(modCanopyInput)) {
    warnings.push(
      "--mod has no canopyimagebuilder/input; cannot render overrides",
    );
    return 0;
  }

  // Files the translation overrides (patches/masks).
  const overridden = new Set(fs.readdirSync(tCanopy));
  const resolveInput = (name) =>
    isFile(path.join(tCanopy, name))
      ? path.join(tCanopy, name)
      : isFile(path.join(modCanopyInput, name))
        ? path.join(modCanopyInput, name)
        : null;

  const sourceCache = new Map();
  const getSource = async (srcPath) => {
    if (!sourceCache.has(srcPath)) {
      sourceCache.set(srcPath, await loadCanopySource(baseRoot, srcPath));
    }
    return sourceCache.get(srcPath);
  };

  let count = 0;
  for (const fileName of fs.readdirSync(modCanopyInput)) {
    if (!fileName.endsWith(".json") || fileName === "!_managedImages.json")
      continue;
    let instr;
    try {
      instr = JSON.parse(
        fs.readFileSync(path.join(modCanopyInput, fileName), "utf8"),
      );
    } catch {
      continue;
    }
    // Does the translation override any input this instruction uses?
    const usedInputs = [];
    if (instr.patch && instr.patch.patchFileName)
      usedInputs.push(instr.patch.patchFileName);
    for (const k of Object.keys(instr.masks || {}))
      usedInputs.push(instr.masks[k]);
    if (!usedInputs.some((f) => overridden.has(f))) continue;

    try {
      const sources = new Map();
      for (const key of Object.keys(instr.sourceImages || {})) {
        sources.set(key, await getSource(instr.sourceImages[key]));
      }
      const masks = new Map();
      for (const key of Object.keys(instr.masks || {})) {
        const abs = resolveInput(instr.masks[key]);
        if (!abs) throw new Error("mask not found: " + instr.masks[key]);
        masks.set(key, await loadLocalImageData(abs));
      }
      let patchBytes = null;
      if (instr.patch && instr.patch.patchFileName) {
        const abs = resolveInput(instr.patch.patchFileName);
        if (abs)
          patchBytes = new Uint8Array(zlib.gunzipSync(fs.readFileSync(abs)));
      }
      const png = buildCanopyImage(instr, sources, masks, patchBytes);
      const name = path.parse(fileName).name;
      const dest =
        (instr.outputDestination || "/img/pictures/").replace(/^\//, "") +
        name +
        ".png";
      writeOut(out, dest, png);
      if (!files.includes(dest)) files.push(dest);
      count++;
    } catch (e) {
      warnings.push(`canopy override ${fileName} failed: ${e.message}`);
    }
  }
  return count;
}

function printDeploymentHints(opts, slug, manifest) {
  const code = opts.id || "<MOD>";
  const lang = slug;
  console.log(
    "Deploy to translations.tcoaal.app:\n" +
      `  1. Upload this folder's contents to\n` +
      `       translations/${code}_translations/${lang}/\n` +
      `  2. Ensure  translations/mods.txt  contains a line: ${code}_translations\n` +
      `  3. Ensure  translations/${code}_translations/langs.txt  contains: ${lang}\n` +
      `  4. Run  node tools/generate-manifests.js  to add the\n` +
      `       "translation_${code}_${lang}" entry to mods.json (mod: "${code}").\n` +
      `     The overhaul it overlays must be keyed "${code}" in mods.json.`,
  );
}

// CLI

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--translation":
        opts.translation = argv[++i];
        break;
      case "--out":
        opts.out = argv[++i];
        break;
      case "--mod":
        opts.mod = argv[++i];
        break;
      case "--base":
        opts.base = argv[++i];
        break;
      case "--lang":
        opts.lang = argv[++i];
        break;
      case "--slug":
        opts.slug = argv[++i];
        break;
      case "--icon":
        opts.icon = argv[++i];
        break;
      case "--name":
        opts.name = argv[++i];
        break;
      case "--id":
        opts.id = argv[++i];
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      default:
        throw new Error("unknown argument: " + a);
    }
  }
  return opts;
}

const HELP = `build-tomb-translation.js: package a Tomb translation for translations.tcoaal.app

Usage:
  node tools/build-tomb-translation.js --translation <dir> --out <dir> [options]

  --translation <dir>  Translation mod folder (mod.json + languages/<lang>.json
                       or a dialogue.csv/.txt)
  --out         <dir>  Output folder (write the <lang>/ contents here)
  --mod         <dir>  Overhaul mod being translated (only needed if the
                       translation overrides CanopyImageBuilder inputs)
  --base        <dir>  Base game for CanopyImageBuilder sources (with --mod)
  --lang        <name> Language slug for the source file (default: inferred)
  --slug        <name> Deploy folder/langs.txt slug (default: --lang). Use when
                       it differs, e.g. languages/portuguese.json -> portuguese-brazil
  --icon        <img>  Icon image (default: <translation>/icon.png)
  --name        <str>  Display name for manifest.json
  --id          <code> Overhaul mod code (for the printed deployment hints)
  -h, --help           Show this help

Emits dialogue.loc/.csv/.txt + icon.png + asset overrides + manifest.json.
CanopyImageBuilder overrides need: npm install @napi-rs/canvas
`;

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error("Error: " + e.message + "\n");
    process.stderr.write(HELP);
    process.exit(2);
  }
  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }
  if (!opts.translation || !opts.out) {
    console.error("Error: --translation and --out are required.\n");
    process.stderr.write(HELP);
    process.exit(2);
  }
  if (!isDir(opts.translation)) {
    console.error("Error: not a directory: " + opts.translation);
    process.exit(2);
  }
  if (opts.mod && !opts.base) {
    console.error("Error: --mod requires --base (CanopyImageBuilder sources).");
    process.exit(2);
  }
  await packageTranslation(opts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
