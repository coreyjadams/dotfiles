# Agent Instructions

Instructions for LLM agents working on this chezmoi dotfiles repository.

## Repository overview

This is a [chezmoi](https://www.chezmoi.io/) dotfiles repo. chezmoi manages config files and runs setup scripts across macOS and Linux machines.

### Key directories and files

- `dot_*` files/dirs map to `~/.*` in the home directory (chezmoi naming convention)
- `.chezmoiscripts/` contains scripts that run during `chezmoi apply`
- `.chezmoi.toml.tmpl` is the chezmoi config template (prompts for machine-specific data)
- `.chezmoiexternal.toml` declares archives/files to download from URLs (e.g., ble.sh)
- `pi/` is a local pi package (extensions, prompts, themes) loaded in place, not deployed
- `dot_config/aquaproj-aqua/aqua.yaml` declares CLI tools managed by aqua; `aqua-checksums.json` beside it pins the SHA256 of every asset

### Shell support

- **macOS**: zsh (`dot_zshrc`)
- **Linux**: bash (`dot_bashrc`) -- designed for remote servers/clusters
- Both shells set up aqua PATH and AQUA_GLOBAL_CONFIG

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

### If the tool is a Python CLI (not in aqua)

Use `uv tool install` (uv is managed by aqua). See `run_onchange_after_02-install-hf.sh.tmpl` for an example.

### If the tool is a non-binary archive (scripts, etc.)

Use `.chezmoiexternal.toml` to download and extract it. Example (ble.sh):
```toml
[".local/share/blesh"]
    type = "archive"
    url = "https://github.com/akinomyoga/ble.sh/releases/download/v0.4.0-devel3/ble-0.4.0-devel3.tar.xz"
    exact = true
    stripComponents = 1
```

### Rust toolchain

Rust (rustc, cargo, clippy, rustfmt) is installed via [rustup](https://rustup.rs/), not aqua. The `run_once_before_install-rustup.sh` script handles initial installation with `--no-modify-path` (PATH is managed in bashrc/zshrc). To add Rust components, use `rustup component add <name>`.

### If the tool needs a custom install script

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

## Agent harnesses (pi, Claude Code, Codex)

Three harnesses are installed: Claude Code (`run_once_after_03`), Codex
(`run_after_04`), and pi (`run_once_after_05`). Customizations are split by
portability:

| What | Source | Deployed to | Read by |
|---|---|---|---|
| Skills (Agent Skills spec) | `private_dot_agents/private_skills/<name>/` | `~/.agents/skills/<name>/` | pi, Codex |
| Claude view of the same skills | `dot_claude/skills/symlink_<name>` | `~/.claude/skills/<name>` -> `../../.agents/skills/<name>` | Claude Code |
| pi extensions, prompt templates, themes | `pi/` (a local pi package) | not deployed; loaded in place | pi |
| pi settings (managed keys only) | `dot_pi/agent/modify_settings.json` | `~/.pi/agent/settings.json` | pi |

### Adding a skill

Preferred: run `/skill-new <name> [description]` inside pi. It scaffolds the
skill in the source dir, writes the Claude symlink, runs `chezmoi apply` for
both targets, and reloads pi. Then edit `SKILL.md` and commit.

Manually:

1. Create `private_dot_agents/private_skills/<name>/SKILL.md`:
   ```markdown
   ---
   name: <name>
   description: <what it does and when to use it; this drives routing>
   ---
   ```
   `name` must match the directory: lowercase letters, digits, single hyphens, <= 64 chars.
2. Create `dot_claude/skills/symlink_<name>` containing `../../.agents/skills/<name>`.
3. Helper scripts go in `scripts/` with the `executable_` source prefix. Refer to
   bundled files by paths relative to the skill directory, never `~/.claude/...`
   or `~/.agents/...`, so the skill works from either location.
4. `chezmoi apply`, then `/reload` in pi.

Editing an existing skill: edit under `private_dot_agents/...` (or
`chezmoi edit ~/.agents/skills/<name>/SKILL.md`) and `chezmoi apply`. Edits made
directly in `~/.agents/skills/` are overwritten on the next apply.

### Adding a pi extension, prompt template, or theme

`pi/` is a [pi package](https://pi.dev) that pi loads straight from the chezmoi
source dir (`.chezmoiignore` keeps chezmoi from deploying it;
`modify_settings.json` registers its absolute path under `packages`).

- Extensions: `pi/extensions/<name>.ts` or `pi/extensions/<name>/index.ts`.
  Default-export `function (pi: ExtensionAPI)`. TypeScript loads directly; no build.
- Prompt templates: `pi/prompts/<command>.md`.
- Themes: `pi/themes/<theme>.json`.

Dev loop: edit in the source dir, `/reload` in pi, commit. No `chezmoi apply`
needed. To try an extension in isolation: `pi -e <path-to-file>`.

pi supplies `@earendil-works/pi-ai`, `pi-agent-core`, `pi-coding-agent`,
`pi-tui`, and `typebox`; keep them in `peerDependencies` only. pi does not run
`npm install` for local packages; if an extension needs a third-party npm
dependency, add it to `pi/package.json` and add a `run_onchange_after_` script
that hashes `pi/package.json` and runs `npm ci` in `{{ .chezmoi.sourceDir }}/pi`.

### pi settings

pi rewrites `~/.pi/agent/settings.json` itself (`deviceId`,
`lastChangelogVersion`, `/settings`, `pi install`). `modify_settings.json` is a
chezmoi modify-template: it reads the live file and overwrites only the keys in
its `$managed` dict, passing everything else through. To pin a setting across
machines, add it to `$managed`. Third-party pi packages must be listed in
`$managed.packages` too; anything added with `pi install` is reverted on the
next apply (`chezmoi diff` shows it).

### Rules for agent dirs

- **Never use the `exact_` prefix** on `dot_claude`, `dot_claude/skills`,
  `private_dot_agents`, `private_skills`, `dot_pi`, or `dot_pi/agent`. Other
  tooling deploys skills there (`nvinfo-cli`, `managing-omnistation`,
  `kernel-factory`), and these dirs hold runtime state.
- **Never manage** `~/.pi/agent/{auth.json,models-store.json,sessions,install,bin}`
  or any Claude/Codex credentials or session state.
- **Keep secrets out.** Everything here syncs to every machine. Use a `.tmpl`
  suffix and chezmoi data for per-cluster values (see `dot_env_lustre.tmpl`).
- Plain (non-`.tmpl`) files are safe even if they contain `{{ }}`.
- Pick distinctive skill names; collisions keep the first discovered skill.
- `~/.agents` and `~/.agents/skills` use the `private_` prefix (mode 700) to
  avoid loosening the 750 mode other tooling created them with.

## Refreshing pinned versions

Bump every aqua-managed tool and the registry ref in one step, from the chezmoi source dir:

```bash
aqua -c dot_config/aquaproj-aqua/aqua.yaml update
```

Then review the diff (versions must match the upstream git tag exactly, including any `v` prefix),
regenerate checksums, and run `chezmoi apply`:

```bash
aqua -c dot_config/aquaproj-aqua/aqua.yaml update-checksum -prune
```

Checksum verification is mandatory (`checksum.require_checksum: true`): any package added or
bumped in `aqua.yaml` without a matching entry in `aqua-checksums.json` will fail to install.
Commit both files together. The `run_onchange_` install scripts hash both files, so either
change triggers a reinstall. Never bump a package without also bumping the registry `ref`; asset
naming rules live in the registry. The aqua binary pin lives in
`run_once_before_install-aqua.sh` (`AQUA_VERSION` and the aqua-installer URL).

## Testing changes

```bash
chezmoi diff    # preview what chezmoi apply would change
chezmoi apply   # apply changes
```
