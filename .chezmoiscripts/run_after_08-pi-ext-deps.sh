#!/bin/bash
set -euo pipefail

# pi does not run `npm install` for local packages. Installs the npm deps of
# pi-ext extensions that ship a package-lock.json (e.g. microscope's
# tree-sitter wasm), and reinstalls when the lock changes after a pull.
# Without access to NVIDIA GitLab the clone is absent and this does nothing.

export PATH="${AQUA_ROOT_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/aquaproj-aqua}/bin:$PATH"
ext="$HOME/.local/share/pi-ext/extensions"

[ -d "$ext" ] || { echo "==> pi-ext not cloned; skipping its npm deps"; exit 0; }
if ! command -v npm &>/dev/null; then
    echo "WARNING: npm not found; skipping pi-ext npm deps." >&2
    exit 0
fi

for lock in "$ext"/*/package-lock.json; do
    [ -f "$lock" ] || continue
    dir="$(dirname "$lock")"
    stamp="$dir/node_modules/.chezmoi-lock-copy"
    cmp -s "$lock" "$stamp" && continue
    echo "==> npm ci in $dir"
    (cd "$dir" && npm ci --omit=dev --no-audit --no-fund && cp package-lock.json "$stamp") \
        || echo "WARNING: npm ci failed in $dir; re-run 'chezmoi apply' to retry." >&2
done
