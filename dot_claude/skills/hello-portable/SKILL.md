---
name: hello-portable
description: A trivial test skill to verify chezmoi-managed personal skills load in Claude Code. Use only when the user explicitly asks to test the portable skills setup.
---

# Hello Portable

Confirms chezmoi-deployed personal skills are discovered by Claude Code.

## Usage

Run the bundled check script to confirm the skill and its supporting files
deployed correctly:

```bash
~/.claude/skills/hello-portable/scripts/check.sh
```

A successful run prints the resolved skill directory and exits 0.
