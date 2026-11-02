---
name: todo
description: Read or update Corey's to-do list (~/todo/todo.md, shown in Herdr's right-hand "to do" panel). Use when he asks what's on his list, to add a to-do, to tick one off, or when a task you were given matches an open item and you finish it.
---

# To-do list

The list is `~/todo/todo.md` on the computer running Herdr. Herdr's "to do" panel
shows it live, so edit the file and the panel follows.

```markdown
## QMC
- [ ] rerun the 10k chain
- [x] fix the sampler NaN

## Talks
- [ ] outline SC26 talk
```

- `## <project>` sections. Name projects after the Herdr space they belong to
  (QMC, physicsnemo, ...) so the panel highlights them; `Inbox` for anything else.
- Items are `- [ ] text`; done is `- [x] text`. One line each, plain words.
- Add: append under the project's section, creating the section at the end if
  it's missing. Don't reorder or reword his items.
- Tick an item off only when you finished that exact work in this session, or he
  asked you to. Say which items you ticked.
- Never delete items or sections; he clears done items himself.
- Edit with exact text replacement, not a full rewrite: the panel may be writing
  to the same file.
- On a cluster there is no list: tell him the item to add instead.
