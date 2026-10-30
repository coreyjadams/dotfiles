// pi sessions on every machine, grouped by project (the Herdr space name; same-named
// spaces on different machines share one heading) or by machine. Each row is one pi
// session (its session name), with its cost and running subagents. Data comes from labels
// the pi-ext `herdr-report` extension sets (pi.task, pi.cwd, pi.subagents, pi.cost) and
// pi's own OSC 7501 status. Double-click a project heading to rename all its spaces.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { agents, terminals, spaces, run, theme, props, openOverlay, closeOverlay } from "herdr";

const RANK = { blocked: 4, error: 4, done: 3, working: 2, idle: 1 };
const UNNAMED = "(unnamed)";
const NO_SPACE = "(no space)";

const word = (s) => (typeof s === "string" ? s : s?.state) ?? "idle";
const machineOf = (addr) => (addr.includes("/") ? addr.split("/")[0] : "local");
const base = (p) => (p ? p.replace(/\/+$/, "").split("/").pop() || "/" : "");

function age(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "<1m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

function subagentsOf(t) {
  try {
    return JSON.parse(t.labels?.["pi.subagents"] || "[]");
  } catch {
    return [];
  }
}

// Every live terminal that runs pi: it labelled itself, or reports app=pi.
// `spaceList` is spaces(); remote space ids carry a "machine/" prefix, labels don't.
export function piSessions(all, shown, spaceList = []) {
  const spaceById = new Map(spaceList.map((s) => [s.id, s]));
  return all
    .filter((t) => t.state === "live")
    .filter((t) => t.labels?.["pi.task"] !== undefined || (t.report?.app ?? t.status?.app) === "pi")
    .map((t) => {
      const machine = machineOf(t.address);
      const sid = t.labels?.["herdr.space"];
      const space = sid ? spaceById.get(machine === "local" ? sid : `${machine}/${sid}`) : undefined;
      return {
        address: t.address,
        machine,
        task: t.labels?.["pi.task"] || t.report?.msg || UNNAMED,
        cwd: t.labels?.["pi.cwd"] || t.cwd,
        status: shown.get(t.address) ?? word(t.status),
        subs: subagentsOf(t),
        cost: Number(t.labels?.["pi.cost"]) || 0,
        spaceId: space?.id,
        spaceName: space?.name ?? NO_SPACE,
      };
    });
}

// Groups by project (space name, case-insensitive, across machines) or by machine.
// Most urgent group first, then by name; the catch-all group goes last.
export function groupSessions(sessions, mode) {
  const groups = new Map();
  for (const s of sessions) {
    const label = mode === "machine" ? s.machine : s.spaceName;
    const key = label.toLowerCase();
    const g = groups.get(key) ?? { key, label, list: [], spaceIds: new Set() };
    g.list.push(s);
    if (s.spaceId) g.spaceIds.add(s.spaceId);
    groups.set(key, g);
  }
  const top = (list) => Math.max(...list.map((s) => RANK[s.status] ?? 0));
  const last = (g) => g.label === NO_SPACE;
  return [...groups.values()]
    .map((g) => ({ ...g, spaceIds: [...g.spaceIds], rank: top(g.list), cost: g.list.reduce((n, s) => n + s.cost, 0) }))
    .sort((a, b) => b.rank - a.rank || last(a) - last(b) || a.label.localeCompare(b.label));
}

const money = (c) => `$${c.toFixed(2)}`;

export default class PiBoard extends View {
  init(_props, cx) {
    if (props()?.rename) return this.initRename(cx);
    // Remembered across restarts (localStorage is per mod copy).
    this.folded = new Set(JSON.parse(localStorage.getItem("pi-board.folded") ?? "[]"));
    this.mode = localStorage.getItem("pi-board.mode") ?? "project";
    cx.timer.every(30000, (cx) => cx.notify()); // ages only
  }

  // --- rename dialog (this mod opened as an overlay with props.rename) ---

  initRename(cx) {
    const { name } = props().rename;
    this.input = InputState.new({ value: name });
    this.input.set_selected_range({ start: 0, end: name.length });
    this.input.on("submit", () => this.submitRename());
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }

  submitRename() {
    const p = props();
    const name = this.input.value().trim();
    closeOverlay(p.overlay);
    if (name) for (const id of p.rename.ids) run("space.rename", { id, name });
  }

  renderRename() {
    const t = theme();
    const p = props();
    const n = p.rename.ids.length;
    const button = (id, text, primary, action) => h_flex().id(id).h(32).px(14).items_center().rounded(8)
      .border_1().border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
      .text_color(primary ? t.solid_foreground : t.foreground).text_size(12.5).font_medium().cursor_pointer()
      .hover((s) => s.opacity(0.88)).on_click(action).child(text);
    return v_flex().id("pi-rename").track_focus(this.handle)
      .on_key_down((e, cx) => { if (e.key === "escape") { closeOverlay(p.overlay); cx.stop_propagation(); } })
      .w_full().min_h(0).p(18).bg(t.popover).text_color(t.foreground)
      .child(div().text_size(15).font_semibold().child("Rename project"))
      .child(div().pt(6).pb(10).text_size(11.5).text_color(t.dim).child(n === 1 ? "Renames its space." : `Renames its ${n} spaces on every machine.`))
      .child(Input.new(this.input).h(36).px(10).rounded(9).border_1().border_color(t.accent).bg(t.background).text_size(12.8).text_color(t.foreground))
      .child(h_flex().pt(20).gap(8).justify_end()
        .child(button("pr-cancel", "Cancel", false, () => closeOverlay(p.overlay)))
        .child(button("pr-save", "Save", true, () => this.submitRename())));
  }

  // --- board ---

  rename(g) {
    if (g.spaceIds.length === 0) return;
    openOverlay({ mod: "pi-board", kind: "dialog", width: 380, props: { rename: { name: g.label, ids: g.spaceIds } } });
  }

  dot(t, status) {
    if (status === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900);
    const color = t[status === "error" ? "blocked" : status] ?? t.dim;
    if (status === "idle") return div().size(8).flex_none().rounded(4).border(1.5).border_color(color);
    return div().size(8).flex_none().rounded(4).bg(color);
  }

  open(s) {
    const a = agents().find((x) => x.address === s.address);
    if (a) run("pane.focus", { pane: a.pane });
    else run("terminal.peek", { terminal: s.address });
  }

  render(cx) {
    if (props()?.rename) return this.renderRename();
    const t = theme();
    const shown = new Map(agents().map((a) => [a.address, a.status]));
    const byMachine = this.mode === "machine";
    const groups = groupSessions(piSessions(terminals(), shown, spaces()), this.mode);
    const now = Date.now();
    const spend = groups.reduce((n, g) => n + g.cost, 0);
    const small = (text, color) => div().flex_none().text_size(10.5).text_color(color).child(text);

    const sessionRow = (s) =>
      h_flex()
        .id(`pi-${s.address}`)
        .h(26).px(8).pl(22).gap(8).flex_none().items_center().rounded(6)
        .cursor_pointer()
        .hover((el) => el.bg(t.hover))
        .on_click(() => this.open(s))
        .child(this.dot(t, s.status))
        .child(div().flex_1().min_w(0).truncate().text_color(s.task === UNNAMED ? t.muted : t.foreground).child(s.task === UNNAMED ? base(s.cwd) || s.address : s.task))
        .when(s.cost > 0, (el) => el.child(small(money(s.cost), t.muted)))
        .child(small(byMachine ? s.spaceName : s.machine, t.dim));

    const subRow = (s, c, i) =>
      h_flex()
        .id(`pi-${s.address}-sub-${i}`)
        .h(22).px(8).pl(40).gap(6).flex_none().items_center()
        .text_size(11.5)
        .child(svg("mods/workspace-chrome/spinner.svg").size(10).flex_none().text_color(t.working).spin(900))
        .child(div().flex_none().text_color(t.muted).child(c.agent))
        .child(div().flex_1().min_w(0).truncate().text_color(t.dim).child(c.task))
        .child(small(age(now - c.started), t.dim));

    const groupBlock = (g) => {
      const id = `${this.mode}:${g.key}`;
      const open = !this.folded.has(id);
      const subs = g.list.reduce((n, s) => n + s.subs.length, 0);
      const header = h_flex()
        .id(`grp-${id}`)
        .h(28).px(6).gap(6).flex_none().items_center().rounded(6)
        .cursor_pointer()
        .hover((el) => el.bg(t.hover))
        .on_click((e, cx) => {
          if (e.click_count === 2) {
            if (!byMachine) this.rename(g);
            return; // the first click of the pair already folded/unfolded
          }
          open ? this.folded.add(id) : this.folded.delete(id);
          localStorage.setItem("pi-board.folded", JSON.stringify([...this.folded]));
          cx.notify();
        })
        .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(11).flex_none().text_color(t.dim))
        .child(div().flex_1().min_w(0).truncate().font_semibold().text_color(g.label === NO_SPACE ? t.muted : t.foreground).child(g.label))
        .when(subs > 0, (el) => el.child(small(`${subs} sub`, t.working)))
        .when(g.cost > 0, (el) => el.child(small(money(g.cost), t.muted)))
        .child(small(String(g.list.length), t.dim));
      if (!open) return [header];
      return [header, ...g.list.flatMap((s) => [sessionRow(s), ...s.subs.map((c, i) => subRow(s, c, i))])];
    };

    const modeTab = (mode, text) =>
      div().id(`mode-${mode}`).px(6).py(1).rounded(4).cursor_pointer()
        .text_color(this.mode === mode ? t.foreground : t.dim)
        .when(this.mode === mode, (el) => el.bg(t.hover))
        .on_click((_e, cx) => { this.mode = mode; localStorage.setItem("pi-board.mode", mode); cx.notify(); })
        .child(text);

    return v_flex()
      .size_full().bg(t.chrome).p(6).gap(1).text_size(12.5)
      .overflow_y_scrollbar()
      .child(h_flex().px(6).pb(6).gap(2).items_center().text_size(11)
        .child(div().flex_1().text_color(t.dim).child("pi tasks"))
        .when(spend > 0, (el) => el.child(div().mr(4).text_color(t.muted).child(money(spend))))
        .child(modeTab("project", "project"))
        .child(modeTab("machine", "machine")))
      .when(groups.length === 0, (el) => el.child(div().px(6).text_color(t.muted).child("No pi sessions")))
      .children(groups.flatMap(groupBlock));
  }
}
