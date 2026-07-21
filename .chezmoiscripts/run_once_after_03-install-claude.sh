#!/bin/bash
set -euo pipefail

if command -v claude &>/dev/null; then
    echo "==> claude is already installed"
    exit 0
fi

echo "==> Installing Claude Code (native installer)..."
# Native installs auto-update in the background; pinning here only affects the first install.
# Append a version/channel if desired, e.g. `| bash -s stable`.
if curl -fsSL https://claude.ai/install.sh | bash; then
    echo "==> claude installed successfully"
else
    echo "WARNING: claude install failed (exit $?). Re-run 'chezmoi apply' to retry." >&2
fi
