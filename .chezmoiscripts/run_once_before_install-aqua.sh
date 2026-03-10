#!/bin/bash
set -euo pipefail

AQUA_BIN="${AQUA_ROOT_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/aquaproj-aqua}/bin"

if [ -x "${AQUA_BIN}/aqua" ]; then
    echo "==> aqua is already installed"
    exit 0
fi

# Pin version to avoid "get latest" GitHub API call (403 rate limit when unauthenticated).
# Bump this when you want a newer aqua; see https://github.com/aquaproj/aqua/releases
AQUA_VERSION="${AQUA_VERSION:-v2.53.3}"

echo "==> Installing aqua CLI version manager (${AQUA_VERSION})..."
curl -sSfL https://raw.githubusercontent.com/aquaproj/aqua-installer/v4.0.2/aqua-installer | bash -s -- -v "${AQUA_VERSION}"
echo "==> aqua installed successfully"
