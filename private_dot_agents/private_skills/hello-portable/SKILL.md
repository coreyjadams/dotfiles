---
name: hello-portable
description: A trivial test skill to verify chezmoi-managed personal skills load in pi, Codex, and Claude Code. Use only when the user explicitly asks to test the portable skills setup.
---

# Hello Portable

Confirms chezmoi-deployed personal skills are discovered by the current agent harness.

## Usage

Run the bundled check script (path relative to this skill directory):

```bash
scripts/check.sh
```

A successful run prints the resolved skill directory and exits 0.
