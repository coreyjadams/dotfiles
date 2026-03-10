#!/bin/bash
set -euo pipefail

export PATH="${AQUA_ROOT_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/aquaproj-aqua}/bin:$PATH"

if command -v hf &>/dev/null; then
    echo "==> hf CLI is already installed"
    exit 0
fi

echo "==> Installing Hugging Face CLI via uv..."
uv tool install huggingface-hub[cli]
echo "==> hf CLI installed successfully"
