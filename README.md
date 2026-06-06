# kidev's TCOAAL Browser Loader

**Requires to own the game to work.**  

A browser tool to play [_The Coffin of Andy and Leyley_](https://store.steampowered.com/app/2378900/The_Coffin_of_Andy_and_Leyley/) (by _Nemlei_) from the browser. Allows you to play the base game and mods without installing anything. Save files are kept between sessions, and are saved in a per-mod basis.  

## Additional tools

Maintenance and modding scripts live in `tools/` and are run from the project root.

### Modding round-trip

Recover an editable RPG Maker MV project from a shipped game, edit it, then pack it back:

```bash
# Extract an editable project (baked dialogue + recovered names + map backgrounds)
node tools/extract-project.js --www <wwwGameDir> --out <projectDir>

# Run the extracted project in true browser mode straight from the shell
node tools/play.js <projectDir>

# Pack the edited project back into a shipped TCOAAL www/
node tools/pack-project.js --project <projectDir> --out <wwwModedGameDir>

# Then play it offline after importing <wwwModedGameDir> in browser
node server.js 
```

### Building mods

```bash
# Flatten a Tomb-format overhaul into a self-contained, importable www/
node tools/build-tomb-mod.js --diff <modDir> --base <v2_0_14_gameDir> --out <outDir>

# Prune a mod's files that are byte-identical to the base game (--dry-run to preview)
node tools/dedup-mods.js <modFolder>
```

### Inspection

```bash
# Decrypt a single logical file from any game version
node tools/decode.js <gameDir> <filePath>

# Dump the MapInfos id->name table
node tools/decode.js <gameDir> --names

# Extract a CLD into the translator layout (img/, font/, dialogue.csv)
node tools/extract-cld.js <input.cld> <outDir>
```

## Credits

Created by Kidev as a fan tool for the community. 

Some assets, theme and inspiration by **Nemlei**

Faustina font by Google.

[pako](https://github.com/nodeca/pako) by nodeca.

