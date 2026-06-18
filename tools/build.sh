#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Build the TCOAAL desktop apps (Tauri v2) and drop their binaries + installers
# into tools/bin/. Runs the same steps as the CI workflow, locally:
#   - npm install (@tauri-apps/cli) per app
#   - generate icons from app/img/icon-512.png
#   - stage a Node runtime into src-tauri/runtime/ (this machine's node)
#   - tauri build
#   - copy the executable + any installers into tools/bin/
#
# Usage:
#   ./build.sh            # build both apps (creator + user)
#   ./build.sh creator    # build only the creator app
#   ./build.sh user       # build only the installer app
set -euo pipefail

# This script lives in tools/; TOOLS is tools/, ROOT is the repo root.
TOOLS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$TOOLS")"
DESKTOP="$TOOLS/desktop"
BIN="$TOOLS/bin"
ICON_SRC="$ROOT/app/img/icon-512.png"

# linuxdeploy / appimagetool are themselves AppImages and need FUSE; in sandboxes
# and CI there is no FUSE, so tell them to extract-and-run instead.
export APPIMAGE_EXTRACT_AND_RUN=1
export NO_STRIP=true

# node.exe on Windows (git-bash / msys), node elsewhere.
case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) NODE_NAME="node.exe"; EXE_EXT=".exe" ;;
  *) NODE_NAME="node"; EXE_EXT="" ;;
esac

need() { command -v "$1" >/dev/null 2>&1 || { echo "error: '$1' not found in PATH" >&2; exit 1; }; }
need node
need npm
need cargo

NODE_BIN="$(command -v node)"

# build_app <app-dir-name> <cargo-bin-name>
build_app() {
  local app="$1" binname="$2"
  local appdir="$DESKTOP/$app"
  echo
  echo "==> Building '$app' ($binname)"
  [ -d "$appdir" ] || { echo "error: no such app: $appdir" >&2; exit 1; }
  cd "$appdir"

  # Tauri CLI (local devDependency).
  if [ ! -x "node_modules/.bin/tauri" ]; then
    echo "    npm install..."
    npm install --no-audit --no-fund >/dev/null
  fi

  # Icons (Tauri build needs them present).
  if [ ! -f "src-tauri/icons/icon.ico" ]; then
    echo "    generating icons..."
    npx --yes @tauri-apps/cli icon "$ICON_SRC" >/dev/null
  fi

  # Bundle a Node runtime for the app to shell out to.
  echo "    staging node runtime..."
  mkdir -p "src-tauri/runtime"
  cp "$NODE_BIN" "src-tauri/runtime/$NODE_NAME"
  chmod +x "src-tauri/runtime/$NODE_NAME" 2>/dev/null || true

  echo "    tauri build (first run compiles the crate graph; be patient)..."
  npx --yes @tauri-apps/cli build

  # Collect outputs into tools/bin/.
  mkdir -p "$BIN"
  local rel="$DESKTOP/target/release"
  if [ -f "$rel/$binname$EXE_EXT" ]; then
    cp "$rel/$binname$EXE_EXT" "$BIN/"
    echo "    -> $BIN/$binname$EXE_EXT"
  fi
  # Installers (AppImage/deb/rpm/dmg/msi/exe), if produced.
  if [ -d "$rel/bundle" ]; then
    while IFS= read -r f; do
      cp "$f" "$BIN/"
      echo "    -> $BIN/$(basename "$f")"
    done < <(find "$rel/bundle" -type f \
      \( -name '*.AppImage' -o -name '*.deb' -o -name '*.rpm' \
         -o -name '*.dmg' -o -name '*.msi' -o -name '*.exe' \))
  fi
}

target="${1:-all}"
case "$target" in
  creator) build_app creator tcoaal-mod-creator ;;
  user)    build_app user tcoaal-mod-installer ;;
  all)
    build_app creator tcoaal-mod-creator
    build_app user tcoaal-mod-installer
    ;;
  *) echo "usage: $0 [creator|user|all]" >&2; exit 1 ;;
esac

echo
echo "Done. Binaries and installers are in: $BIN"
