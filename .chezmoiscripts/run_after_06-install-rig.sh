#!/bin/bash
set -euo pipefail

# Installs the rig agent launcher (`cargo install rig`), and on every apply
# moves it to the newest stable release, within the series that
# ~/.local/share/rig-ext/RIG_VERSION names when that file exists (such as
# `0.45`): rig is pre-1.0, so a new minor release breaks plugins until
# rig-ext is ported to it. Bump RIG_VERSION in rig-ext to move on.
#
# One request to the crates.io index per apply; offline (a cluster's compute
# node) it says so and keeps what is installed. A launcher installed from a
# checkout (`cargo install --path ~/rig`) is a dev build and is left alone
# unless RIG_FORCE_STABLE=1. The agent itself is built by `rig` on its first
# start after an update (several minutes the first time).

export PATH="$HOME/.cargo/bin:$PATH"

if ! command -v cargo &>/dev/null; then
    echo "WARNING: cargo not found; skipping rig. Re-run 'chezmoi apply' once rustup has installed Rust." >&2
    exit 0
fi

series=""
pin="$HOME/.local/share/rig-ext/RIG_VERSION"
if [ -f "$pin" ]; then
    series=$(tr -d '[:space:]' < "$pin")
fi

# `rig v0.45.0:` from crates.io, `rig v0.45.0 (/path):` from a checkout.
listed=$(cargo install --list 2>/dev/null | grep -E '^rig v' || true)
installed=$(printf '%s' "$listed" | sed -nE 's/^rig v([^ :]+).*/\1/p')
if [[ "$listed" == *"("* && "${RIG_FORCE_STABLE:-0}" != 1 ]]; then
    echo "==> rig $installed is a dev install from $(printf "%s" "$listed" | sed -nE "s/.*\((.*)\).*/\1/p"); leaving it (RIG_FORCE_STABLE=1 replaces it)"
    exit 0
fi

# Stable, unyanked releases from the sparse index, newest last.
index=$(curl -fsSL --max-time 20 https://index.crates.io/3/r/rig 2>/dev/null || true)
if [ -z "$index" ]; then
    if [ -n "$installed" ]; then
        echo "==> rig $installed is installed; crates.io is unreachable, so not checking for updates"
        exit 0
    fi
    echo "WARNING: crates.io is unreachable; rig not installed. Re-run 'chezmoi apply' with network." >&2
    exit 0
fi
latest=$(printf '%s\n' "$index" \
    | grep '"yanked":false' \
    | sed -nE 's/.*"vers":"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' \
    | { if [ -n "$series" ]; then grep -E "^${series//./\\.}(\.|$)" || true; else cat; fi; } \
    | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)

if [ -z "$latest" ]; then
    echo "WARNING: no stable rig release matches RIG_VERSION=$series; keeping ${installed:-none}" >&2
    exit 0
fi
if [ "$installed" = "$latest" ]; then
    echo "==> rig $installed is up to date${series:+ (series $series)}"
    exit 0
fi

echo "==> Installing rig $latest${installed:+ (was $installed)}..."
if cargo install rig --version "=$latest" --locked; then
    echo "==> rig $latest installed; the next 'rig' rebuilds the agent"
else
    echo "WARNING: rig install failed (exit $?). Re-run 'chezmoi apply' to retry." >&2
fi
