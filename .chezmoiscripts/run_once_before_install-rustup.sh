#!/bin/bash
set -euo pipefail

if command -v rustup &>/dev/null; then
    echo "==> rustup is already installed"
    exit 0
fi

echo "==> Installing rustup (Rust toolchain manager)..."
# -y: accept defaults (stable toolchain)
# --no-modify-path: we manage PATH ourselves in bashrc/zshrc
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
echo "==> rustup installed successfully"
