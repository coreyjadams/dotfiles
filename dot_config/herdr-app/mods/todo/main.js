// To-do list on the right of the window, over ~/todo/todo.md (pi agents edit the
// same file through the `todo` skill):
//
//   ## QMC                                          <- project = a Herdr space name
//   - [ ] rerun the 10k chain ^q7 due:2026-11-05    <- ^id, optional due date
//     - pi lhr2 "Rerun 10k chain" /home/…/x.jsonl   <- a linked pi session
//
// Add in the top box ("project: text due:fri"); click a box to tick (only you tick);
// right-click an item to attach a running pi. A pi labelled pi.todo=<id> (via
// `/todo link`, `herd --todo`, or Attach) is recorded under its item here, with its
// pi.file, so the link outlives the terminal. Live sessions show status and cost and
// focus on click; finished ones reopen with `pi --session` on their machine.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { home, readTextFile, writeTextFile, watchFolder, spaces, agents, terminals, run, hc, theme, exec, props, openOverlay, closeOverlay } from "herdr";

const ITEM = /^(\s*[-*] \[)([ xX])(\] )(.*)$/;
const HEAD = /^##\s+(.*?)\s*$/;
const LINK = /^\s+- pi (\S+) "(.*)" (\S+)\s*$/;
const ID = /(?:^|\s)\^([a-z0-9]{1,8})\b/;
const DUE = /(?:^|\s)due:(\d{4}-\d{2}-\d{2})\b/;
const INBOX = "Inbox";
const DAY = 86400000;

const machineOf = (addr) => (addr.includes("/") ? addr.split("/")[0] : "local");
const word = (s) => (typeof s === "string" ? s : s?.state) ?? "idle";
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Lines -> [{ project, items: [{ line, done, text, id, due, links: [{ line, machine, name, file }] }] }].
export function parse(text) {
  const groups = [];
  let cur = null;
  let last = null;
  (text ?? "").split("\n").forEach((l, line) => {
    const h = l.match(HEAD);
    if (h) { cur = { project: h[1], items: [] }; groups.push(cur); last = null; return; }
    const k = l.match(LINK);
    if (k && last) { last.links.push({ line, machine: k[1], name: k[2], file: k[3] }); return; }
    const m = l.match(ITEM);
    if (!m) { if (l.trim() && !/^\s/.test(l)) last = null; return; }
    if (!cur) { cur = { project: INBOX, items: [] }; groups.push(cur); }
    const body = m[4];
    last = {
      line, done: m[2] !== " ",
      id: body.match(ID)?.[1] ?? null,
      due: body.match(DUE)?.[1] ?? null,
      text: body.replace(ID, "").replace(DUE, "").trim(),
      links: [],
    };
    cur.items.push(last);
  });
  return groups;
}

export function toggle(text, line) {
  const lines = text.split("\n");
  lines[line] = lines[line].replace(ITEM, (_, a, x, b, rest) => `${a}${x === " " ? "x" : " "}${b}${rest}`);
  return lines.join("\n");
}

// "due:fri", "due:tomorrow", "due:+3d", "due:11-14", "due:2026-11-14" -> "due:YYYY-MM-DD".
export function normalizeDue(entry, now = new Date()) {
  return entry.replace(/(^|\s)due:(\S+)/, (all, sp, v) => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plus = (n) => new Date(today.getTime() + n * DAY);
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    let d = null;
    v = v.toLowerCase();
    if (v === "today") d = today;
    else if (v === "tomorrow" || v === "tmr") d = plus(1);
    else if (/^\+\d+d$/.test(v)) d = plus(Number(v.slice(1, -1)));
    else if (/^\+\d+w$/.test(v)) d = plus(7 * Number(v.slice(1, -1)));
    else if (days.includes(v.slice(0, 3))) d = plus(((days.indexOf(v.slice(0, 3)) - today.getDay() + 7) % 7) || 7);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return all;
    else if (/^\d{1,2}-\d{1,2}$/.test(v)) {
      const [mo, da] = v.split("-").map(Number);
      d = new Date(today.getFullYear(), mo - 1, da);
      if (d < today) d = new Date(today.getFullYear() + 1, mo - 1, da);
    }
    return d ? `${sp}due:${iso(d)}` : all;
  });
}

// Adds "- [ ] item" at the end of the project's section (case-insensitive), or a new section.
export function add(text, project, item) {
  const lines = (text ?? "").replace(/\n+$/, "").split("\n").filter((l, i, a) => a.length > 1 || l);
  const start = lines.findIndex((l) => l.match(HEAD)?.[1].toLowerCase() === project.toLowerCase());
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

export function newId(text) {
  const used = new Set([...(text ?? "").matchAll(/\^([a-z0-9]{1,8})\b/g)].map((m) => m[1]));
  for (;;) {
    const id = Math.random().toString(36).slice(2, 4);
    if (/^[a-z]/.test(id) && !used.has(id)) return id;
  }
}

// Links a session under the item with this id, unless that file is already there.
export function link(text, id, machine, name, file) {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => ITEM.test(l) && l.match(ID)?.[1] === id);
  if (at < 0) return text;
  let end = at + 1;
  while (end < lines.length && LINK.test(lines[end])) {
    if (lines[end].match(LINK)[3] === file) return text;
    end++;
  }
  const indent = lines[at].match(/^\s*/)[0] + "  ";
  lines.splice(end, 0, `${indent}- pi ${machine} "${name.replace(/"/g, "'")}" ${file}`);
  return lines.join("\n");
}

export function removeLine(text, line) {
  const lines = text.split("\n");
  lines.splice(line, 1);
  return lines.join("\n");
}

// "QMC: rerun chain" -> ["QMC", "rerun chain"]; plain text goes to the fallback project.
export function splitEntry(entry, fallback) {
  const m = entry.match(/^([^:\s][^:]{0,40}):\s+(.+)$/);
  return m ? [m[1].trim(), m[2].trim()] : [fallback, entry.trim()];
}

// Days until due (negative: late), today at local midnight.
export function daysLeft(due, now = new Date()) {
  const [y, m, d] = due.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / DAY);
}

// Live pi terminals: { address, machine, task, file, todo, status, cost }.
function liveSessions() {
  const shown = new Map(agents().map((a) => [a.address, a.status]));
  return terminals()
    .filter((t) => t.state === "live" && t.labels?.["pi.file"])
    .map((t) => ({
      address: t.address,
      machine: machineOf(t.address),
      task: t.labels["pi.task"] || "pi",
      file: t.labels["pi.file"],
      todo: t.labels["pi.todo"] || null,
      status: shown.get(t.address) ?? word(t.status),
      cost: Number(t.labels["pi.cost"]) || 0,
    }));
}

export default class Todo extends View {
  init(_props, cx) {
    this.dir = `${home()}/todo`;
    this.path = `${this.dir}/todo.md`;
    if (props()?.attach) return; // the Attach popup: nothing to load
    this.text = null;
    this.error = null;
    this.hideDone = localStorage.getItem("todo.hideDone") !== "false";
    this.folded = new Set(JSON.parse(localStorage.getItem("todo.folded") ?? "[]"));
    this.input = InputState.new({ placeholder: "add: project: text due:fri" });
    this.input.on("submit", (_e, cx) => this.addEntry(cx));
    cx.spawn(async (cx) => {
      await this.load();
      cx.notify();
      for (;;) { await watchFolder(this.dir); await this.load(); cx.notify(); }
    });
    cx.timer.every(5000, (cx) => this.record(cx));
    cx.timer.every(60000, (cx) => cx.notify()); // due dates roll over
  }

  async load() {
    this.text = (await readTextFile(this.path).catch(() => null)) ?? "";
  }

  // Read-modify-write against what's on disk; a stale write (an agent edited it) retries once.
  write(change, cx) {
    cx.spawn(async (cx) => {
      for (let i = 0; i < 2; i++) {
        const before = (await readTextFile(this.path).catch(() => null)) ?? null;
        const after = change(before ?? "");
        if (after === (before ?? "")) break;
        try {
          await writeTextFile(this.path, after, before);
          this.error = null;
          break;
        } catch (e) { this.error = String(e); }
      }
      await this.load();
      cx.notify();
    });
  }

  // Sessions labelled with a to-do id that isn't recorded under it yet.
  record(cx) {
    if (this.text === null) return;
    const groups = parse(this.text);
    const items = new Map(groups.flatMap((g) => g.items).filter((i) => i.id).map((i) => [i.id, i]));
    const todo = liveSessions().filter((s) => s.todo && items.get(s.todo) && !items.get(s.todo).links.some((l) => l.file === s.file));
    if (!todo.length) return;
    this.write((t) => todo.reduce((acc, s) => link(acc, s.todo, s.machine, s.task, s.file), t), cx);
  }

  addEntry(cx) {
    const entry = this.input.value().trim();
    if (!entry) return;
    const shown = spaces().find((s) => s.active);
    const [project, item] = splitEntry(normalizeDue(entry), shown?.named ? shown.name : INBOX);
    this.input.set_value("");
    this.write((t) => {
      const id = newId(t);
      const due = item.match(DUE);
      const body = item.replace(DUE, "").trim();
      return add(t, project, `${body} ^${id}${due ? ` due:${due[1]}` : ""}`);
    }, cx);
  }

  openSession(l, live) {
    if (live) {
      const a = agents().find((x) => x.address === live.address);
      return a ? run("pane.focus", { pane: a.pane }) : run("terminal.peek", { terminal: live.address });
    }
    const machine = l.machine === "local" ? null : l.machine;
    const argv = ["bash", "-lc", 'export PATH=$HOME/bin:$HOME/.local/bin:$HOME/.npm-global/bin:$PATH; exec pi --session "$1"', "pi", l.file];
    const space = spaces().find((s) => (s.machine ?? null) === machine);
    if (space) run("tab.new", { space: space.id, name: l.name.slice(0, 24), argv });
    else run("space.new", { ...(machine ? { machine } : {}), tab: l.name.slice(0, 24), argv });
  }

  // --- Attach popup (this mod opened with props.attach = { id, text }) ---

  renderAttach() {
    const t = theme();
    const p = props();
    const sessions = liveSessions();
    const row = (s) => h_flex().id(`at-${s.address}`).h(28).px(9).gap(8).items_center().rounded(6).cursor_pointer()
      .hover((el) => el.bg(t.selected ?? t.hover))
      .on_click(() => {
        closeOverlay(p.overlay);
        hc(["label", s.address, `pi.todo=${p.attach.id}`]); // the panel records it within 5 s
      })
      .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).child(s.task))
      .when(s.todo === p.attach.id, (el) => el.child(div().text_size(10.5).text_color(t.accent).child("linked")))
      .child(div().text_size(10.5).text_color(t.dim).child(s.machine));
    return v_flex().w_full().p(6).bg(t.popover).text_size(12.5)
      .child(div().px(9).pt(4).pb(6).text_size(11).text_color(t.dim).truncate().child(`Attach to: ${p.attach.text}`))
      .when(sessions.length === 0, (el) => el.child(div().px(9).py(6).text_color(t.muted).child("No running pi sessions")))
      .children(sessions.map(row));
  }

  // --- panel ---

  render(cx) {
    if (props()?.attach) return this.renderAttach();
    const t = theme();
    const groups = parse(this.text);
    const live = liveSessions();
    const now = new Date();
    const all = groups.flatMap((g) => g.items).filter((i) => !i.done);
    const open = all.length;
    const late = all.filter((i) => i.due && daysLeft(i.due, now) <= 0).length;
    const shownSpace = spaces().find((s) => s.active)?.name?.toLowerCase();

    const dueTag = (it) => {
      if (!it.due || it.done) return null;
      const n = daysLeft(it.due, now);
      const text = n < 0 ? `${-n}d late` : n === 0 ? "today" : n <= 30 ? `${n}d` : it.due.slice(5);
      const color = n < 0 ? (t.error ?? t.blocked ?? t.accent) : n <= 2 ? (t.blocked ?? t.accent) : t.dim;
      return div().flex_none().text_size(10.5).text_color(color).tooltip(`due ${it.due}`).child(text);
    };

    const box = (it) => div().id(`box-${it.line}`).size(13).flex_none().mt(2).rounded(3).border_1()
      .border_color(it.done ? t.dim : t.muted).bg(it.done ? t.dim : t.chrome).cursor_pointer()
      .hover((s) => s.border_color(t.accent))
      .on_click((_e, cx) => this.write((txt) => toggle(txt, it.line), cx));

    const sessionRow = (it, l) => {
      const s = live.find((x) => x.file === l.file);
      const dot = s?.status === "working"
        ? svg("mods/workspace-chrome/spinner.svg").size(10).flex_none().text_color(t.working).spin(900)
        : div().size(6).flex_none().rounded(3).bg(s ? (t[s.status] ?? t.dim) : t.input);
      return h_flex().id(`ln-${l.line}`).h(20).pl(29).pr(8).gap(6).items_center().flex_none().text_size(11.5).cursor_pointer()
        .hover((el) => el.bg(t.hover))
        .tooltip(s ? `${s.status} · click to show` : `finished · click to reopen on ${l.machine}`)
        .on_click(() => this.openSession(l, s))
        .child(dot)
        .child(div().flex_1().min_w(0).truncate().text_color(s ? t.muted : t.dim).child(s?.task ?? l.name))
        .when(Boolean(s?.cost), (el) => el.child(div().text_size(10.5).text_color(t.dim).child(`$${s.cost.toFixed(2)}`)))
        .child(div().text_size(10.5).text_color(t.dim).child(l.machine))
        .child(div().id(`rm-${l.line}`).px(3).rounded(3).text_color(t.dim).hover((el) => el.bg(t.raised).text_color(t.foreground))
          .tooltip("remove this link")
          .on_click((_e, cx) => { cx.stop_propagation(); this.write((txt) => removeLine(txt, l.line), cx); })
          .child("×"));
    };

    const item = (it) => {
      const row = h_flex().id(`it-${it.line}`).px(8).py(3).gap(8).items_start().flex_none().rounded(6)
        .hover((el) => el.bg(t.hover))
        .on_mouse_down("right", () => it.id && openOverlay({ mod: "todo", kind: "popup", width: 280, props: { attach: { id: it.id, text: it.text } } }))
        .child(box(it))
        .child(div().flex_1().min_w(0).text_color(it.done ? t.dim : t.foreground).when(it.done, (el) => el.line_through()).child(it.text))
        .when(Boolean(dueTag(it)), (el) => el.child(dueTag(it)))
        .when(Boolean(it.id), (el) => el.child(div().id(`id-${it.line}`).flex_none().px(2).rounded(3).text_size(10).text_color(t.dim)
          .cursor_pointer().hover((s) => s.bg(t.raised).text_color(t.foreground))
          .tooltip(`start an agent for this (in pi: /todo link ${it.id}; right-click to attach a running one)`)
          .on_click((_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "herd-launcher", kind: "dialog", width: 560, props: { todo: it.id } }); })
          .child(`^${it.id}`)));
      return [row, ...(it.done ? [] : it.links.map((l) => sessionRow(it, l)))];
    };

    const group = (g) => {
      let items = this.hideDone ? g.items.filter((i) => !i.done) : g.items;
      if (!items.length) return [];
      // Due dates first (soonest first), the rest in file order.
      items = [...items].sort((a, b) => (a.due ? 0 : 1) - (b.due ? 0 : 1) || (a.due && b.due ? a.due.localeCompare(b.due) : a.line - b.line));
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
      return isOpen ? [head, ...items.flatMap(item)] : [head];
    };

    const tool = (id, text, tip, action) => div().id(id).px(5).rounded(4).cursor_pointer().text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip(tip).on_click(action).child(text);

    return v_flex().size_full().bg(t.chrome).p(6).gap(1).text_size(12.5)
      .child(h_flex().px(6).pb(6).gap(4).items_center().text_size(11)
        .child(div().text_color(t.dim).child(`to do · ${open}`))
        .when(late > 0, (el) => el.child(div().text_color(t.blocked ?? t.accent).child(`· ${late} due`)))
        .child(div().flex_1())
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
