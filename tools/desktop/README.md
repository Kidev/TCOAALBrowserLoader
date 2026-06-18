# TCOAAL desktop apps

Two small cross-platform desktop apps (Tauri v2) that wrap the repo's `tools/`.
They do not reimplement anything: each bundles a Node runtime plus the `tools/`
scripts and `app/js/libs/`, and shells out to Node to run the same scripts the
CLI uses.

- **creator** (`TCOAAL Mod Creator`) - create a project from a game folder
  (`extract-project.js`), run it in the browser during development
  (`play.js`), re-pack it (`pack-project.js`), and build a shareable
  `.tcoaalmod` diff for one or more base game versions (`share-project.js`).
- **user** (`TCOAAL Mod Installer`) - install a `.tcoaalmod` onto a game folder
  in place and uninstall it (restore), one mod at a time
  (`share-project.js --apply` / `--rollback`).

## Layout

```
tools/
  build.sh              one-shot builder -> tools/bin/ (gitignored)
  desktop/
    Cargo.toml          workspace (core + both src-tauri crates)
    core/               shared Rust: locate the bundled Node + run a tool
    creator/
      package.json      @tauri-apps/cli
      ui/index.html     frontend (loader.html-styled, static)
      src-tauri/        Tauri app (Cargo.toml, tauri.conf.json, src/main.rs)
    user/               same shape
```

## Easiest: build everything

From the repo root:

```bash
tools/build.sh            # both apps -> tools/bin/
# or: tools/build.sh creator   |   tools/build.sh user
```

`build.sh` installs the Tauri CLI, generates icons, stages this machine's Node
into each app's `src-tauri/runtime/`, runs `tauri build`, and copies the
executable + installers (AppImage/deb/rpm/dmg/msi/exe) into `tools/bin/`. It
exports `APPIMAGE_EXTRACT_AND_RUN=1` / `NO_STRIP=true` so the AppImage step
works without FUSE.

## Build prerequisites

- Rust (stable) and the platform's Tauri deps (on Arch:
  `webkit2gtk-4.1 base-devel librsvg libappindicator-gtk3`; on Debian/Ubuntu:
  `libwebkit2gtk-4.1-dev librsvg2-dev libgtk-3-dev patchelf`).
- Node.js (for `@tauri-apps/cli`).

## By hand (one app)

```bash
cd tools/desktop/creator        # or tools/desktop/user
npm install                     # @tauri-apps/cli (once)
npx @tauri-apps/cli icon ../../../app/img/icon-512.png   # once
mkdir -p src-tauri/runtime && cp "$(command -v node)" src-tauri/runtime/node
export APPIMAGE_EXTRACT_AND_RUN=1 NO_STRIP=true
npx @tauri-apps/cli build       # outputs under tools/desktop/target/release/
```

## Fast iteration with `tauri dev`

In dev mode the bundled resources are not next to the dev binary, so point the
app at the repo and your own Node with two env vars (the apps honor
`TCOAAL_RES_DIR` and `TCOAAL_NODE`):

```bash
cd tools/desktop/creator
TCOAAL_RES_DIR="$(git -C ../../.. rev-parse --show-toplevel)" \
TCOAAL_NODE="$(command -v node)" \
  npm run dev
```

`TCOAAL_RES_DIR` is the repo root (it has the `tools/` scripts + `app/js/libs/`);
`TCOAAL_NODE` is the Node that runs them. No `runtime/` copy needed in dev.

## CI

`.github/workflows/desktop.yml` builds both apps for Windows/macOS/Linux on tag
`v*` (or manual dispatch): it copies the runner's Node into `runtime/`, generates
icons, runs `tauri build`, and uploads the installers as artifacts.

## How the bundling works

`tauri.conf.json` ships these resources into the app bundle: the `tools/`
scripts (`../../../*.js`, `../../../*.json`, `../../../playerbundle/*` -> `tools`)
plus `../../../../app/js/libs/* -> app/js/libs` and `runtime -> runtime`. At
runtime `core::run_tool` resolves the app's resource dir, runs
`runtime/node tools/<script> ...` with the resource dir as the working directory
(so the tools find their sibling data files and `app/js/libs` exactly as in the
repo), and returns stdout/stderr to the webview. `tools/bin/` (the build output)
is deliberately not bundled.
