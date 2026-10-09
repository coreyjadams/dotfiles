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
7. Installs standalone tools not in aqua's registry (hf, Claude Code, Codex CLI, pi)
8. Deploys personal Claude Code skills to `~/.claude/skills/`

## How it works

```
chezmoi apply
    |
    |-- run_once_before:  install aqua binary (first run only)
    |-- run_once_before:  install rustup + stable Rust toolchain (first run only)
    |-- deploy files:     zshrc, micro config, aqua.yaml, etc.
    |-- run_onchange_after: aqua i -a (re-runs when aqua.yaml changes)
    |-- run_onchange_after: install hf CLI via uv (re-runs when aqua.yaml changes; no-op if hf exists)
    |-- run_once_after:   install Claude Code (first run only)
    |-- run_after:        install Codex CLI (every apply; no-op if codex exists)
    |-- run_once_after:   install pi agent harness (first run only, non-interactive; needs Node >= 22.19)
```

### Tool management with aqua

Tools are declared in `dot_config/aquaproj-aqua/aqua.yaml` (deployed to `~/.config/aquaproj-aqua/aqua.yaml`). aqua downloads pre-built binaries from GitHub releases -- no package managers, no sudo.

### Adding a new tool

1. Search the aqua registry: `aqua g` (interactive fuzzy search)
2. Add the tool to `dot_config/aquaproj-aqua/aqua.yaml`:
   ```yaml
   packages:
     - name: cli/cli@v2.100.0
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

### Portable Claude Code skills

Personal Claude Code skills are managed under `dot_claude/skills/` and deploy to
`~/.claude/skills/<name>/`, so they're version-controlled and portable across
clusters. Each skill is a directory with a `SKILL.md`; executable helper scripts
use the `executable_` source prefix.

chezmoi only manages the skills it knows about, so skills deployed by other
tooling in `~/.claude/skills/` and all Claude runtime state are left untouched.
Keep secrets out of skills; use a `.tmpl` suffix with chezmoi data for any
per-cluster values. See `AGENT.md` for the full workflow.

## Updating

```bash
chezmoi update    # pull latest changes and apply
```

### Refreshing pinned tool versions

All tools are pinned in `aqua.yaml`, so they only move when the pins move. To bump everything to
the latest upstream release, run aqua's updater against the chezmoi *source* file, review the
diff, then apply:

```bash
cd ~/.local/share/chezmoi
aqua -c dot_config/aquaproj-aqua/aqua.yaml update                 # bumps registry ref + every package
git diff dot_config/aquaproj-aqua/aqua.yaml                       # sanity-check versions (tags should keep their `v` prefix)
aqua -c dot_config/aquaproj-aqua/aqua.yaml update-checksum -prune  # refresh aqua-checksums.json for the new versions
chezmoi apply                                                     # run_onchange script re-runs `aqua i -a`
```

### Checksum verification

`aqua.yaml` sets `checksum.enabled` and `checksum.require_checksum`, so aqua refuses to install any
asset whose SHA256 isn't recorded in `dot_config/aquaproj-aqua/aqua-checksums.json` (deployed next
to `aqua.yaml`). The file covers linux/macOS on amd64/arm64, so it's generated once here and
verified on every machine. If you bump a version and forget to regenerate it, `aqua i -a` fails
with a "checksum not found" error rather than installing an unverified binary; run the
`update-checksum -prune` command above and re-apply.

Always bump the registry `ref` together with packages: the registry carries per-version asset
naming rules, so a new tool release can fail to download against an old registry ref (zellij
0.45 needs a registry newer than the one that knew 0.43, for example). `aqua update` does both.

The aqua binary itself is pinned in `run_once_before_install-aqua.sh` for fresh machines; on an
existing machine run `aqua update-aqua` to upgrade it in place, and bump the pin in the script
so new machines match.

## Platform support

- macOS (arm64, amd64)
- Linux (arm64, amd64)

No package managers (brew, apt, etc.) are used for tool installation. Everything is user-space.

### GitHub API rate limit

The aqua binary is installed from a **pinned version** (see `run_once_before_install-aqua.sh`) so the installer never calls GitHub's "latest release" API, avoiding 403 rate limits when unauthenticated. If you see "API rate limit exceeded" when installing *tools* (`aqua i -a`), set `GITHUB_TOKEN` or `AQUA_GITHUB_TOKEN` (e.g. a [fine-grained PAT](https://github.com/settings/tokens) with no scopes) for a higher limit; the install script passes it through when set.
