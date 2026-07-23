#!/bin/bash
set -euo pipefail

if command -v codex &>/dev/null; then
    echo "==> codex is already installed"
    exit 0
fi

echo "==> Installing Codex CLI (native installer)..."
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=true sh
command -v codex &>/dev/null
echo "==> codex installed successfully"
