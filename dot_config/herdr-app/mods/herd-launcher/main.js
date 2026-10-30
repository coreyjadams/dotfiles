// New agent: a form over the `herd` launcher (~/.local/bin/herd, from chezmoi).
// review a PR or start a coding agent (here or on a cluster); build a Quarto talk (here).
// Opened as a dialog: `mod.open herd-launcher` (cmd-shift-a, pi tasks' "+ agent").

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { hc, exec, home, spaces, theme, props, closeOverlay, pickFolder } from "herdr";

const KINDS = ["review", "talk", "code"];
const FIELDS = {
  review: [["pr", "PR number or URL"], ["flags", "/review flags (optional): --repo x --focus \"…\""]],
  talk: [["folder", "folder for the talk"], ["brief", "what the talk is about, for whom"]],
  code: [["cwd", "folder on the machine (optional; default home)"], ["task", "what to do"]],
};

// "--repo x --focus \"a b\"" -> ["--repo", "x", "--focus", "a b"]
export function splitArgs(s) {
  return [...(s ?? "").matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

export function herdArgs(kind, v, machine, space) {
  const pre = space ? ["--space", space] : [];
  if (kind === "review") return [...pre, "review", machine, v.pr.trim(), ...splitArgs(v.flags)];
  if (kind === "talk") return [...pre, "talk", v.folder.trim(), v.brief.trim()];
  return [...pre, "code", machine, ...(v.cwd.trim() ? ["--cwd", v.cwd.trim()] : []), v.task.trim()];
}

export function missing(kind, v, machine) {
  const need = { review: ["pr"], talk: ["folder", "brief"], code: ["task"] }[kind];
  const gaps = need.filter((k) => !v[k]?.trim());
  if (kind !== "talk" && !machine) gaps.push("machine");
  return gaps;
}

export default class HerdLauncher extends View {
  init(_props, cx) {
    this.kind = "review";
    this.values = { pr: "", flags: "", folder: "", brief: "", cwd: "", task: "" };
    this.inputs = {};
    for (const fields of Object.values(FIELDS))
      for (const [key, placeholder] of fields) {
        const input = InputState.new({ placeholder });
        input.on("change", (_e, cx) => { this.values[key] = input.value(); cx.notify(); });
        input.on("submit", (_e, cx) => this.start(cx));
        this.inputs[key] = input;
      }
    this.machines = [];   // connected remote machines
    this.guarded = {};    // machine -> has slurm-guard (true/false), undefined while checking
    this.machine = "local"; // review and code: "local" or a Herdr machine
    this.space = null;    // space name, null: herd's default
    this.error = null;
    this.busy = false;
    this.handle = cx.focus_handle();
    this.focusFirst(cx);
    cx.spawn(async (cx) => {
      const r = await hc(["machine", "ls", "--json"]).catch(() => null);
      try { this.machines = JSON.parse(r.stdout).machines.filter((m) => !m.temporary && m.state === "connected").map((m) => m.name).sort(); } catch {}
      cx.notify();
      await Promise.all(this.machines.map(async (m) => {
        const g = await exec("sh", ["-c", 'test -d "$HOME/.local/share/pi-ext/extensions/slurm-guard"'], { on: m }).catch(() => null);
        this.guarded[m] = g?.code === 0;
        cx.notify();
      }));
    });
  }

  focusFirst(cx) {
    const first = this.inputs[FIELDS[this.kind][this.kind === "code" ? 1 : 0][0]];
    first.focus();
    cx.timer.after(300, () => first.focus());
  }

  setKind(k, cx) {
    if (this.kind === k) return;
    this.kind = k;
    this.error = null;
    this.space = null;
    this.focusFirst(cx); // this click's cx, not the render's
    cx.notify();
  }

  start(cx) {
    const gaps = missing(this.kind, this.values, this.machine);
    if (gaps.length) { this.error = `needs: ${gaps.join(", ")}`; cx.notify(); return; }
    this.busy = true;
    this.error = null;
    cx.notify();
    const args = herdArgs(this.kind, this.values, this.machine, this.space);
    cx.spawn(async (cx) => {
      // A login shell, so herd finds herdr-app, hc and python3 on the user's PATH.
      const r = await exec("bash", ["-lc", 'exec "$HOME/.local/bin/herd" "$@"', "herd", ...args])
        .catch((e) => ({ code: 1, stderr: String(e), stdout: "" }));
      this.busy = false;
      if (r.code === 0 && !/"error"/.test(r.stdout)) return closeOverlay(props().overlay);
      this.error = (r.stderr || r.stdout || "herd failed").trim().split("\n").pop();
      cx.notify();
    });
  }

  render(cx) {
    const t = theme();
    const p = props() ?? {};
    const label = (text) => div().pt(12).pb(5).text_size(11.5).text_color(t.dim).child(text);
    const chip = (id, text, on, enabled, action, tip) =>
      div().id(id).px(9).py(4).rounded(6).border_1().text_size(12)
        .border_color(on ? t.accent : t.input).bg(on ? t.selected ?? t.hover : t.raised)
        .text_color(enabled ? t.foreground : t.dim)
        .when(enabled, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => { action(); cx.notify(); }))
        .when(Boolean(tip), (el) => el.tooltip(tip))
        .child(text);
    const field = (key) => Input.new(this.inputs[key]).h(34).px(10).rounded(8).border_1().border_color(t.input)
      .bg(t.background).text_size(12.8).text_color(t.foreground);
    const button = (id, text, primary, action) => h_flex().id(id).h(32).px(14).items_center().rounded(8)
      .border_1().border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
      .text_color(primary ? t.solid_foreground : t.foreground).text_size(12.5).font_medium().cursor_pointer()
      .hover((s) => s.opacity(0.88)).on_click(action).child(text);

    const where = this.kind === "talk" || this.machine === "local" ? null : this.machine;
    const spaceNames = [...new Set(spaces().filter((s) => (s.machine ?? null) === where).map((s) => s.name))];

    const body = v_flex();
    if (this.kind !== "talk") {
      body.child(label("Machine"))
        .child(h_flex().flex_wrap().gap(6)
          .child(chip("m-local", "this computer", this.machine === "local", true, () => { this.machine = "local"; this.space = null; }))
          .children(this.machines.map((m) => {
          const g = this.guarded[m];
          return chip(`m-${m}`, m, this.machine === m, g === true, () => { this.machine = m; this.space = null; },
            g === false ? "no pi-ext here yet (slurm-guard, /review): sync it first" : g === undefined ? "checking…" : null);
        })));
    } else {
      body.child(div().pt(10).text_size(11.5).text_color(t.dim).child("Talks are built on this computer."));
    }
    for (const [key] of FIELDS[this.kind]) {
      const name = { pr: "Pull request", flags: "Review options", folder: "Folder", brief: "Brief", cwd: "Folder", task: "Task" }[key];
      const row = h_flex().gap(6).items_center().child(div().flex_1().child(field(key)));
      if (key === "folder")
        row.child(button("pick", "Choose…", false, (_e, cx) => cx.spawn(async (cx) => {
          const f = await pickFolder({ prompt: "Folder for the talk" });
          if (f) { this.values.folder = f; this.inputs.folder.set_value(f); }
          cx.notify();
        })));
      body.child(label(name)).child(row);
    }
    body.child(label("Space"))
      .child(h_flex().flex_wrap().gap(6)
        .child(chip("s-default", "default", this.space === null, true, () => { this.space = null; }, "first space on that machine, or a new one"))
        .children(spaceNames.map((n) => chip(`s-${n}`, n, this.space === n, true, () => { this.space = n; }))));

    return v_flex().id("herd-launcher").track_focus(this.handle)
      .on_key_down((e, cx) => { if (e.key === "escape") { closeOverlay(p.overlay); cx.stop_propagation(); } })
      .w_full().min_h(0).p(18).bg(t.popover).text_color(t.foreground)
      .child(h_flex().items_center().gap(8)
        .child(div().flex_1().text_size(15).font_semibold().child("New agent"))
        // Segmented control: whole segments are the hit targets.
        .child(h_flex().p(2).gap(2).rounded(8).bg(t.raised).border_1().border_color(t.input)
          .children(KINDS.map((k) => div().id(`k-${k}`).w(72).h(26).flex().items_center().justify_center()
            .rounded(6).text_size(12.5).cursor_pointer()
            .bg(this.kind === k ? t.solid : t.raised)
            .text_color(this.kind === k ? t.solid_foreground : t.foreground)
            .when(this.kind !== k, (el) => el.hover((s) => s.bg(t.hover)))
            .on_mouse_down("left", (_e, cx) => { cx.stop_propagation(); this.setKind(k, cx); })
            .child(k)))))
      .child(body)
      .when(Boolean(this.error), (el) => el.child(div().pt(10).text_size(12).text_color(t.blocked ?? t.accent).child(this.error)))
      .child(h_flex().pt(18).gap(8).items_center()
        .child(div().flex_1().text_size(11).text_color(t.dim).child("runs: herd " + herdArgs(this.kind, this.values, this.machine ?? "<machine>", this.space).join(" ").slice(0, 70)))
        .child(button("cancel", "Cancel", false, () => closeOverlay(p.overlay)))
        .child(button("start", this.busy ? "Starting…" : "Start", true, (_e, cx) => this.busy || this.start(cx))));
  }
}
