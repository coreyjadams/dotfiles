# dotfiles

Cross-platform dotfiles managed by [chezmoi](https://www.chezmoi.io/), with CLI tools installed via [aqua](https://aquaproj.github.io/).

## Bootstrap (fresh machine)

Prerequisites: `curl`, `git`

```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply coreyjadams
```

or

```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply --ssh coreyjadams
```




This single command:
1. Installs chezmoi
2. Clones this repo
3. Installs aqua (declarative CLI version manager)
4. Installs rustup (Rust toolchain manager)
5. Deploys all config files (zshrc, micro, aqua.yaml, etc.)
6. Installs all tools declared in aqua.yaml (gh, micro, etc.)
7. Installs standalone tools not in aqua's registry (hf)

## How it works

```
chezmoi apply
    |
    |-- run_once_before:  install aqua binary (first run only)
    |-- run_once_before:  install rustup + stable Rust toolchain (first run only)
    |-- deploy files:     zshrc, micro config, aqua.yaml, etc.
    |-- run_onchange_after: aqua i -a (re-runs when aqua.yaml changes)
    |-- run_once_after:   install hf CLI (first run only)
```

### Tool management with aqua

Tools are declared in `dot_config/aquaproj-aqua/aqua.yaml` (deployed to `~/.config/aquaproj-aqua/aqua.yaml`). aqua downloads pre-built binaries from GitHub releases -- no package managers, no sudo.

### Adding a new tool

1. Search the aqua registry: `aqua g` (interactive fuzzy search)
2. Add the tool to `dot_config/aquaproj-aqua/aqua.yaml`:
   ```yaml
   packages:
     - name: cli/cli@v2.87.3
     - name: zyedidia/micro@v2.0.13
     - name: junegunn/fzf@v0.60.3      # <-- new tool
   ```
3. Run `chezmoi apply` (or `aqua i -a` directly for immediate install)

The `run_onchange_` script detects the config change and re-runs `aqua i -a` automatically.

### Tools not in aqua's registry

For tools without aqua registry support (like hf), add a script in `.chezmoiscripts/`:

```bash
# .chezmoiscripts/run_once_after_03-install-mytool.sh
#!/bin/bash
set -euo pipefail

if command -v mytool &>/dev/null; then
    echo "==> mytool is already installed"
    exit 0
fi

echo "==> Installing mytool..."
curl -sSfL https://example.com/install.sh | bash
```

## Updating

```bash
chezmoi update    # pull latest changes and apply
```

## Platform support

- macOS (arm64, amd64)
- Linux (arm64, amd64)

No package managers (brew, apt, etc.) are used for tool installation. Everything is user-space.

### GitHub API rate limit

The aqua binary is installed from a **pinned version** (see `run_once_before_install-aqua.sh`) so the installer never calls GitHub's "latest release" API, avoiding 403 rate limits when unauthenticated. If you see "API rate limit exceeded" when installing *tools* (`aqua i -a`), set `GITHUB_TOKEN` or `AQUA_GITHUB_TOKEN` (e.g. a [fine-grained PAT](https://github.com/settings/tokens) with no scopes) for a higher limit; the install script passes it through when set.
