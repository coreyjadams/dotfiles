---
name: todo
description: Read or update Corey's to-do list (~/todo/todo.md, shown in Herdr's right-hand "to do" panel). Use when he asks what's on his list or what's due, to add a to-do, to link this session to a to-do ("this is for q7"), or when work you did matches an open item.
---

# To-do list

The list is `~/todo/todo.md` on the computer running Herdr. Herdr's "to do" panel
shows it live, so edit the file and the panel follows.

```markdown
## QMC
- [ ] rerun the 10k chain ^q7 due:2026-11-05
  - pi lhr2 "Rerun 10k chain" /home/coreya/.pi/agent/sessions/…/x.jsonl
- [x] fix the sampler NaN ^b3
```

- `## <project>` sections, named after the Herdr space they belong to (QMC,
  physicsnemo, ...); `Inbox` for anything else.
- Items: `- [ ] text ^id due:YYYY-MM-DD`. `^id` is 2 lowercase letters/digits,
  unique in the file; `due:` is optional. Done is `- [x]`.
- Indented `- pi <machine> "<name>" <session file>` lines under an item are the
  pi sessions linked to it. The panel writes these; don't edit them by hand.

## Rules

- Add: append `- [ ] text ^id` under the project's section (a fresh unique id;
  a `due:` date only if he gave one), creating the section at the end if needed.
- Link this session to an item: run `/todo link <id>` is for him; you link by
  telling him "run `/todo link <id>`", or if he asked you to, run
  `hc label $HC_TERMINAL_ID pi.todo=<id>`. The panel records it within seconds.
- **Never tick an item off.** Only Corey ticks items. When your work finishes an
  item, say which one (`^id`) so he can tick it.
- Never delete or reword items or sections, and never change his due dates
  unless asked.
- Edit with exact text replacement, not a full rewrite: the panel writes the
  same file.
- On a cluster there is no list: tell him the item to add instead.
