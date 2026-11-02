// To-do list on the right of the window. The list is a plain markdown file,
// ~/todo/todo.md, so pi agents (the `todo` skill) and editors can read and edit it:
//
//   ## QMC                  <- a project; matches a Herdr space name
//   - [ ] rerun the 10k chain
//   - [x] fix the sampler NaN
//
// Click a box to tick it, type in the box at the top to add (to the shown space's
// project, or "project: text"), the eye hides done items. Other lines are kept as is.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { home, readTextFile, writeTextFile, watchFolder, spaces, theme, exec } from "herdr";

const ITEM = /^(\s*[-*] \[)([ xX])(\] )(.*)$/;
const HEAD = /^##\s+(.*?)\s*$/;
const INBOX = "Inbox";

// Lines -> [{ project, items: [{ line, done, text }] }], in file order.
export function parse(text) {
  const groups = [];
  let cur = null;
  (text ?? "").split("\n").forEach((l, line) => {
    const h = l.match(HEAD);
    if (h) { cur = { project: h[1], items: [] }; groups.push(cur); return; }
    const m = l.match(ITEM);
    if (!m) return;
    if (!cur) { cur = { project: INBOX, items: [] }; groups.push(cur); }
    cur.items.push({ line, done: m[2] !== " ", text: m[4] });
  });
  return groups;
}

export function toggle(text, line) {
  const lines = text.split("\n");
  lines[line] = lines[line].replace(ITEM, (_, a, x, b, rest) => `${a}${x === " " ? "x" : " "}${b}${rest}`);
  return lines.join("\n");
}

// Adds "- [ ] item" at the end of the project's section (case-insensitive), or a new section.
export function add(text, project, item) {
  const lines = (text ?? "").replace(/\n+$/, "").split("\n").filter((l, i, a) => a.length > 1 || l);
  let start = lines.findIndex((l) => l.match(HEAD)?.[1].toLowerCase() === project.toLowerCase());
  if (start < 0) {
    if (lines.length) lines.push("");
    lines.push(`## ${project}`, `- [ ] ${item}`);
  } else {
    let end = start + 1;
    while (end < lines.length && !HEAD.test(lines[end])) end++;
    while (end > start + 1 && !lines[end - 1].trim()) end--; // before trailing blank lines
    lines.splice(end, 0, `- [ ] ${item}`);
  }
  return lines.join("\n") + "\n";
}

// "QMC: rerun chain" -> ["QMC", "rerun chain"]; plain text goes to the fallback project.
export function splitEntry(entry, fallback) {
  const m = entry.match(/^([^:\s][^:]{0,40}):\s+(.+)$/);
  return m ? [m[1].trim(), m[2].trim()] : [fallback, entry.trim()];
}

export default class Todo extends View {
  init(_props, cx) {
    this.dir = `${home()}/todo`;
    this.path = `${this.dir}/todo.md`;
    this.text = null;
    this.error = null;
    this.hideDone = localStorage.getItem("todo.hideDone") !== "false";
    this.folded = new Set(JSON.parse(localStorage.getItem("todo.folded") ?? "[]"));
    this.input = InputState.new({ placeholder: "add a to-do (project: text)" });
    this.input.on("submit", (_e, cx) => this.addEntry(cx));
    cx.spawn(async (cx) => {
      await this.load();
      cx.notify();
      for (;;) { await watchFolder(this.dir); await this.load(); cx.notify(); }
    });
  }

  async load() {
    this.text = (await readTextFile(this.path).catch(() => null)) ?? "";
  }

  // Read-modify-write against what's on disk; a stale write (an agent edited it) retries once.
  write(change, cx) {
    cx.spawn(async (cx) => {
      for (let i = 0; i < 2; i++) {
        const before = await readTextFile(this.path).catch(() => null);
        try {
          await writeTextFile(this.path, change(before ?? ""), before);
          this.error = null;
          break;
        } catch (e) { this.error = String(e); }
      }
      await this.load();
      cx.notify();
    });
  }

  addEntry(cx) {
    const entry = this.input.value().trim();
    if (!entry) return;
    const shown = spaces().find((s) => s.active);
    const [project, item] = splitEntry(entry, shown?.named ? shown.name : INBOX);
    this.input.set_value("");
    this.write((t) => add(t, project, item), cx);
  }

  render(cx) {
    const t = theme();
    const groups = parse(this.text);
    const open = groups.reduce((n, g) => n + g.items.filter((i) => !i.done).length, 0);
    const shownSpace = spaces().find((s) => s.active)?.name?.toLowerCase();

    const box = (it) => div().id(`box-${it.line}`).size(13).flex_none().mt(2).rounded(3).border_1()
      .border_color(it.done ? t.dim : t.muted).bg(it.done ? t.dim : t.chrome).cursor_pointer()
      .hover((s) => s.border_color(t.accent))
      .on_click((_e, cx) => this.write((txt) => toggle(txt, it.line), cx));

    const item = (it) => h_flex().id(`it-${it.line}`).px(8).py(3).gap(8).items_start().flex_none()
      .child(box(it))
      .child(div().flex_1().min_w(0).text_color(it.done ? t.dim : t.foreground).when(it.done, (el) => el.line_through())
        .child(it.text));

    const group = (g) => {
      const items = this.hideDone ? g.items.filter((i) => !i.done) : g.items;
      if (!items.length) return [];
      const key = g.project.toLowerCase();
      const isOpen = !this.folded.has(key);
      const head = h_flex().id(`g-${key}`).h(26).px(6).gap(6).flex_none().items_center().rounded(6).cursor_pointer()
        .hover((el) => el.bg(t.hover))
        .on_click((_e, cx) => {
          isOpen ? this.folded.add(key) : this.folded.delete(key);
          localStorage.setItem("todo.folded", JSON.stringify([...this.folded]));
          cx.notify();
        })
        .child(svg(`mods/workspace-chrome/chevron-${isOpen ? "down" : "right"}.svg`).size(11).flex_none().text_color(t.dim))
        .child(div().flex_1().truncate().font_semibold().text_color(key === shownSpace ? t.accent : t.foreground).child(g.project))
        .child(div().text_size(10.5).text_color(t.dim).child(String(g.items.filter((i) => !i.done).length)));
      return isOpen ? [head, ...items.map(item)] : [head];
    };

    const tool = (id, text, tip, action) => div().id(id).px(5).rounded(4).cursor_pointer().text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip(tip).on_click(action).child(text);

    return v_flex().size_full().bg(t.chrome).p(6).gap(1).text_size(12.5)
      .child(h_flex().px(6).pb(6).gap(4).items_center().text_size(11)
        .child(div().flex_1().text_color(t.dim).child(`to do · ${open}`))
        .child(tool("hide", this.hideDone ? "show done" : "hide done", "done items", (_e, cx) => {
          this.hideDone = !this.hideDone;
          localStorage.setItem("todo.hideDone", String(this.hideDone));
          cx.notify();
        }))
        .child(tool("edit", "edit", this.path, () => exec("open", ["-t", this.path]).catch(() => exec("xdg-open", [this.path])))))
      .child(Input.new(this.input).h(30).px(8).mb(6).rounded(7).border_1().border_color(t.input).bg(t.background).text_size(12.5))
      .when(Boolean(this.error), (el) => el.child(div().px(6).text_size(11).text_color(t.blocked ?? t.accent).child(this.error)))
      .child(v_flex().flex_1().min_h(0).overflow_y_scrollbar().gap(1)
        .when(this.text !== null && open === 0, (el) => el.child(div().px(6).text_color(t.muted).child("Nothing to do.")))
        .children(groups.flatMap(group)));
  }
}
