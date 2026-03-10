#!/bin/bash
set -euo pipefail

AQUA_BIN="${AQUA_ROOT_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/aquaproj-aqua}/bin"

if [ -x "${AQUA_BIN}/aqua" ]; then
    echo "==> aqua is already installed"
    exit 0
fi

echo "==> Installing aqua CLI version manager..."
curl -sSfL https://raw.githubusercontent.com/aquaproj/aqua-installer/v4.0.2/aqua-installer | bash
echo "==> aqua installed successfully"
