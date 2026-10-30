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

### Omnistation (github.com blocked)

Omnistations reach only allow-listed GitHub repos, so `get.chezmoi.io` and
this repo's GitHub URL fail. A private mirror lives on NVIDIA GitLab (`git
push` updates both). With a GitLab SSH key on the station:

```bash
sudo snap install chezmoi --classic
chezmoi init --apply ssh://git@gitlab-master.nvidia.com:12051/coreya/dotfiles.git
```

`chezmoi init` probes GitHub and stores `github = false`. Then only the agent
setup is deployed (skills, `AGENTS.md`, pi settings, pi-ext): no aqua
tools or ble.sh, and the machine keeps its own shell and git config (see
`.chezmoiignore`). ponytail comes from a codeload.github.com tarball instead of
a `git:` package. Re-run `chezmoi init` if GitHub access changes.


This single command:
1. Installs chezmoi
2. Clones this repo
3. Installs aqua (declarative CLI version manager)
4. Deploys all config files (zshrc, micro, aqua.yaml, etc.)
5. Installs all tools declared in aqua.yaml (gh, micro, etc.)
6. Installs standalone tools not in aqua's registry (hf, Claude Code, pi, Herdr)
7. Deploys personal agent skills to `~/.agents/skills/` (symlinked into `~/.claude/skills/`) and registers the personal pi package

## How it works

```
chezmoi apply
    |
    |-- run_once_before:  install aqua binary (first run only)
    |-- deploy files:     zshrc, micro config, aqua.yaml, etc.
    |-- run_onchange_after: aqua i -a (re-runs when aqua.yaml changes)
    |-- run_onchange_after: install hf CLI via uv (re-runs when aqua.yaml changes; installs/upgrades to the pinned minimum)
    |-- run_once_after:   install Claude Code (first run only)
    |-- run_once_after:   install pi agent harness (first run only, non-interactive; needs Node >= 22.19)
    |-- run_after:        npm ci for pi-ext extensions with a package-lock.json (every apply; only when the lock changed)
    |-- run_once_after:   install Herdr: the app on macOS, headless herdr-core (`hc`) on Linux (first run only)
```

Herdr shows every terminal and agent on every machine in one sidebar. Where
`releases.herdr.dev` is blocked (Omnistations), the Linux install fails
harmlessly; add the machine from the Mac instead, which copies `hc` over ssh:
`hc machine add <ssh-host> --name <name> --install`. Update a remote one with
`hc machine update <name>`.

`sync-logins [machine...]` (run on the Mac, after pushing this repo and pi-ext)
updates every Herdr machine: `chezmoi update`, `pi update --all` and
`hc machine update`, in parallel, with a summary table and logs in
`~/.local/state/sync-logins/`.
`login-health` (on every machine) prints one JSON line: chezmoi and pi-ext
behind/ahead/dirty against their own git remotes, and pi against npm's latest.
No machine is the source of truth. The Herdr `my-spaces` mod runs it on each
machine every 30 minutes and shows a `!` on a machine only when something is
stale; clicking it runs `sync-logins <machine>` (or `local`) in a tab.

`herd` starts ready-made pi agents in Herdr tabs: `herd review <machine|local> <pr>` (pi-ext
`/review`, never posts), `herd talk <folder> <brief>` (Quarto revealjs via the
quarto-books skill), `herd code <machine|local> <task>` (a coding agent; on a cluster it
refuses machines without pi-ext's slurm-guard). In Herdr: cmd-shift-a or "+ agent" in pi tasks opens the same as a form (mod `herd-launcher`).

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

### Portable agent skills and pi customizations

Personal skills follow the [Agent Skills](https://agentskills.io) spec and live
once, in `private_dot_agents/private_skills/`, deploying to `~/.agents/skills/`
where pi reads them. Claude Code gets a chezmoi-managed symlink per skill
in `~/.claude/skills/`. Inside pi, `/skill-new <name>` scaffolds all of this.

pi-only customizations (extensions, prompt templates, themes) live in `pi/`, a
local pi package loaded directly from the chezmoi source dir: edit, `/reload`,
commit. `~/.pi/agent/settings.json` is managed with a chezmoi modify-template that
owns only specific keys, so pi's own writes to that file are preserved.

chezmoi only manages the entries it knows about, so skills deployed by other
tooling and all agent runtime state are left untouched. Keep secrets out; use a
`.tmpl` suffix with chezmoi data for per-cluster values. See `AGENT.md` for the
full workflow.

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
