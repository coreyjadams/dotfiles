#!/bin/bash
set -euo pipefail

# Herdr: one view of every terminal and agent across machines (herdr.dev).
# macOS gets the app (which installs herdr-core and keeps it current);
# Linux (clusters, stations) gets only herdr-core, the headless `hc` server
# the Mac's app reaches over ssh. Update a remote one from the Mac with
# `hc machine update <name>`; terminals keep running.

case "$(uname -s)" in
    Darwin) what=app; installed="$HOME/Applications/Herdr.app" ;;
    *) what=core; installed="$HOME/.local/bin/herdr-core" ;;
esac

if [ -e "$installed" ]; then
    echo "==> Herdr $what is already installed"
    exit 0
fi

echo "==> Installing Herdr ($what)..."
if curl -fsSL "https://releases.herdr.dev/$what/install.sh" | sh; then
    echo "==> Herdr $what installed"
else
    echo "WARNING: Herdr $what install failed (exit $?). Re-run 'chezmoi apply' to retry, or from the Mac: hc machine add <host> --install" >&2
fi
