#!/bin/bash
set -euo pipefail

# Resolve this script's directory so the check works regardless of CWD.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "${SCRIPT_DIR}")"

echo "==> hello-portable invoked via: ${SKILL_DIR}"
echo "==> resolved to:               $(cd "${SKILL_DIR}" && pwd -P)"
echo "==> chezmoi round-trip verified."
