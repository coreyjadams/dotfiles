#!/bin/bash
set -euo pipefail

if command -v pi &>/dev/null || [ -x "$HOME/.pi/agent/bin/pi" ]; then
    echo "==> pi is already installed"
    exit 0
fi

echo "==> Installing pi (agent harness)..."
# The installer needs Node.js >= 22.19 + npm. Its prompts all read /dev/tty and
# fall back to the defaults ("continuing without confirmation") when there is
# none, so detach from the controlling terminal with setsid to auto-accept.
# (macOS has no setsid binary; perl's POSIX::setsid is on both platforms.)
if curl -fsSL https://pi.dev/install.sh | perl -MPOSIX -e 'POSIX::setsid(); exec "sh"'; then
    echo "==> pi installed successfully"
else
    echo "WARNING: pi install failed (exit $?). Needs Node.js >= 22.19 and npm; re-run 'chezmoi apply' to retry." >&2
fi
