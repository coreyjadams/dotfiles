import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** /skill-new <name> [description]: scaffold a portable skill in the chezmoi source and deploy it. */
export default function (pi: ExtensionAPI) {
	async function chezmoi(args: string[]): Promise<string> {
		const r = await pi.exec("chezmoi", args, { timeout: 60_000 });
		if (r.code !== 0) throw new Error(`chezmoi ${args.join(" ")} failed: ${r.stderr.trim() || r.stdout.trim()}`);
		return r.stdout.trim();
	}

	async function run(rawArgs: string, ctx: ExtensionCommandContext) {
		const trimmed = rawArgs.trim();
		const space = trimmed.indexOf(" ");
		const name = space === -1 ? trimmed : trimmed.slice(0, space);
		let description = space === -1 ? "" : trimmed.slice(space + 1).trim();

		if (!NAME_RE.test(name) || name.length > 64) {
			ctx.ui.notify("Usage: /skill-new <name> [description]  (name: lowercase, digits, single hyphens)", "error");
			return;
		}

		const home = homedir();
		const agentsTarget = join(home, ".agents", "skills", name);
		const claudeTarget = join(home, ".claude", "skills", name);
		for (const t of [agentsTarget, claudeTarget]) {
			if (existsSync(t)) {
				ctx.ui.notify(`${t} already exists; pick another name`, "error");
				return;
			}
		}

		if (!description && ctx.hasUI) {
			description =
				(await ctx.ui.input("Skill description", "What it does and when to use it (this drives routing)"))?.trim() ?? "";
		}
		if (!description) {
			ctx.ui.notify("A description is required; skills without one are not loaded", "error");
			return;
		}

		const agentsSrc = await chezmoi(["source-path", join(home, ".agents", "skills")]);
		const claudeSrc = await chezmoi(["source-path", join(home, ".claude", "skills")]);
		const skillSrc = join(agentsSrc, name);

		await mkdir(join(skillSrc, "scripts"), { recursive: true });
		await mkdir(join(skillSrc, "references"), { recursive: true });
		await writeFile(join(skillSrc, "scripts", ".gitkeep"), "");
		await writeFile(join(skillSrc, "references", ".gitkeep"), "");
		await writeFile(
			join(skillSrc, "SKILL.md"),
			`---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n# ${name}\n\nTODO: direct instructions. Refer to bundled files by paths relative to this directory\n(e.g. \`scripts/foo.sh\`, \`references/notes.md\`). Prefix executable scripts with\n\`executable_\` in the chezmoi source.\n`,
		);
		await writeFile(join(claudeSrc, `symlink_${name}`), `../../.agents/skills/${name}\n`);

		await chezmoi(["apply", agentsTarget, claudeTarget]);

		ctx.ui.notify(
			`Created ${name}\n  edit:   ${join(skillSrc, "SKILL.md")}\n  deploy: chezmoi apply, then /reload\n  commit: cd ${await chezmoi(["source-path"])} && git add -A && git commit`,
			"info",
		);
		await ctx.reload();
	}

	pi.registerCommand("skill-new", {
		description: "Scaffold a portable skill in chezmoi (~/.agents/skills + ~/.claude/skills symlink)",
		handler: async (args, ctx) => {
			try {
				await run(args, ctx);
			} catch (err) {
				ctx.ui.notify(err instanceof Error ? err.message : String(err), "error");
			}
		},
	});
}
