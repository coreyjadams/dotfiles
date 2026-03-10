# Agent Instructions

Instructions for LLM agents working on this chezmoi dotfiles repository.

## Repository overview

This is a [chezmoi](https://www.chezmoi.io/) dotfiles repo. chezmoi manages config files and runs setup scripts across macOS and Linux machines.

### Key directories and files

- `dot_*` files/dirs map to `~/.*` in the home directory (chezmoi naming convention)
- `.chezmoiscripts/` contains scripts that run during `chezmoi apply`
- `.chezmoi.toml.tmpl` is the chezmoi config template (prompts for machine-specific data)
- `dot_config/aquaproj-aqua/aqua.yaml` declares CLI tools managed by aqua

### Script execution order

chezmoi runs scripts in this order:
1. `run_*_before_*` scripts (before file deployment)
2. File deployment (dot_* files are copied/templated to ~/)
3. `run_*_after_*` scripts (after file deployment)

Within each phase, scripts run alphabetically. Use numeric prefixes (01-, 02-) to control order.

Script prefixes:
- `run_once_` -- runs once per unique content hash (good for one-time setup)
- `run_onchange_` -- re-runs when script content changes (good for declarative installs)
- `.tmpl` suffix -- processed as a Go template before execution

## Constraints

1. **No package managers.** Do not use brew, apt, yum, snap, or any system package manager. All tools must be installed as user-space binaries.
2. **Cross-platform.** Everything must work on both macOS and Linux (amd64 and arm64). Use `uname` or chezmoi template variables for platform detection.
3. **User-space only.** No `sudo`. Install to `~/.local/bin/` or let aqua manage the install location.
4. **Idempotent scripts.** All install scripts must be safe to re-run. Check if a tool exists before installing.

## Adding a new CLI tool

### If the tool is in aqua's standard registry (~2500+ tools)

1. Search: `aqua g` (interactive) or check https://github.com/aquaproj/aqua-registry
2. Add a line to `dot_config/aquaproj-aqua/aqua.yaml` under `packages:`
   ```yaml
   packages:
     - name: owner/repo@vX.Y.Z
   ```
3. That's it. The `run_onchange_after_01-install-aqua-tools.sh.tmpl` script will detect the config change and run `aqua i -a` on next `chezmoi apply`.

### If the tool is NOT in aqua's registry

1. Create a new script in `.chezmoiscripts/`:
   - Name: `run_once_after_NN-install-<toolname>.sh` (increment NN)
   - Use `run_once_after_` for tools with their own installer scripts
   - Use `run_onchange_after_` with a `.tmpl` suffix if you want re-runs on content change
2. The script must:
   - Start with `#!/bin/bash` and `set -euo pipefail`
   - Check if the tool is already installed before doing anything
   - Use `curl` to download the binary/installer
   - Install to `~/.local/bin/` (already in PATH)

Example:
```bash
#!/bin/bash
set -euo pipefail

if command -v mytool &>/dev/null; then
    echo "==> mytool is already installed"
    exit 0
fi

echo "==> Installing mytool..."
curl -LsSf https://example.com/install.sh | bash
echo "==> mytool installed successfully"
```

## Adding a new config file

Use chezmoi naming conventions:
- `dot_foo` deploys to `~/.foo`
- `dot_config/bar/baz.toml` deploys to `~/.config/bar/baz.toml`
- Add `.tmpl` suffix for files that need Go template processing (platform-specific content)

## Testing changes

```bash
chezmoi diff    # preview what chezmoi apply would change
chezmoi apply   # apply changes
```
