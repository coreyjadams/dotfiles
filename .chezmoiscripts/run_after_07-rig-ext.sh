#!/bin/bash
set -euo pipefail

# Lists the private rig plugins (the rig-ext repo, cloned by
# .chezmoiexternal.toml to ~/.local/share/rig-ext) in ~/.rig/plugins.toml.
# Without access to NVIDIA GitLab the clone is absent and this does nothing.
# Every apply: the repo's install.sh only adds what is missing, and keeps
# entries turned off with `rig plugin disable` off.

export PATH="$HOME/.cargo/bin:$PATH"
ext="$HOME/.local/share/rig-ext"

if [ ! -x "$ext/install.sh" ]; then
    echo "==> rig-ext not cloned (no GitLab access?); skipping private rig plugins"
    exit 0
fi
if ! command -v rig &>/dev/null; then
    echo "==> rig not installed; skipping rig-ext"
    exit 0
fi

if "$ext/install.sh"; then
    echo "==> rig-ext plugins listed; the next 'rig' (or /reload) builds them"
else
    echo "WARNING: rig-ext install.sh failed (exit $?); see the message above." >&2
fi
