---
name: quarto-books
description: >-
  Build an excellent Quarto book or technical write-up: reproducible, honest,
  and tuned to its one reader (Peter Sharpe). Covers the templates/ scaffold,
  Tufte-inspired visualization craft, and live-computed numbers with provenance.
  Use when creating or editing a Quarto book or notebook; making figures, plots,
  diagrams, or tables; writing documentation, a report, a design study, or a
  book about an existing codebase; deciding how to explain something technical;
  or styling scientific graphics. For original research, pair with the
  autoresearch skill. Trigger keywords - quarto, book, notebook, figure, plot,
  chart, diagram, table, data visualization, matplotlib, write up, report,
  documentation, explain, audience, technical writing, render.
---

# Quarto books & technical communication

This skill governs document craft; for original research, pair it with **autoresearch**, which governs problem choice, hypotheses, experiments, and lab-notebook discipline.

## Book structure

Numbered chapters, short and dense, sequenced so nothing is used before it's defined. State the reading order up front; open with the money result plus a "how to read this" note pre-empting the obvious misreading.

- `index.qmd` is the hook: the thesis paragraph (write it first), "the whole thing in one picture", what's different, and the reading order. Architect the reader's journey — where they start, where you take them — don't dump data.
- Cross-reference with `{#sec-…}` / `@sec-…` so every claim links to the section or artifact that supports it.
- For research books, follow the arc in the autoresearch skill (motivation → mechanism → evidence → honesty → open directions) and keep the raw dated lab notebook as the `99-` appendix.
- **Lab-notebook entry format:** each entry's `##` title is a *short one-line headline* — date plus a concise outcome, ~15 words / under ~130 characters, never an abstract. Every detail — numbers, tables, figures, multi-clause verdicts — goes in the body below the header. The body follows *Write for the uninitiated expert* below.

## Write for the uninitiated expert

The measuring stick for any entry, section, or report: **a domain expert who has never seen this project can read it cold and follow what was tried, what was seen, and why it matters.** "Raw" describes provenance — dated, complete, honest about dead ends — never prose quality. Telegraphic clause-chains of unexplained project shorthand are write-only; they cost more reader-hours than they save writer-minutes.

Structure each substantial entry or report as a narrative arc, in prose:

1. **The setting** — two or three sentences of context an outsider needs: what system, what method, what state of play. Written fresh each time (entries get read in isolation; a pointer to a definitions section is fine for the third-plus use of a term, but the first sentence must still orient).
2. **The symptom or question** — what observation or gap motivated this work, stated physically/mechanistically, with the key quantities named in plain terms before any project label is attached to them.
3. **What was tested** — the hypotheses or candidate explanations, each with its pre-registered discriminating prediction.
4. **The instruments** — what was actually run, described so the reader could imagine reproducing it (a designed test case, a solver variant, a sweep), not just tool names.
5. **What we saw** — the measurements, in complete sentences with the numbers in readable positions. Bold the few load-bearing claims, not every phrase.
6. **Why it matters** — the mechanism or interpretation in plain language ("solution identity is set by where descent stagnates on a nearly flat landscape"), and what it changes about the program's picture.
7. **What's next** — the follow-on, with its acceptance criterion.

Rules that make this work: define every term and acronym at first use in each entry — after introducing it, shorthand is fine *within* that entry; expand every project code-name into what it physically represents at least once; numbers stay precise and load-bearing but live inside sentences, not clause-fragments; superseded interpretations are marked as superseded where they're mentioned. Short status-only entries (a job completed, a round interrupted) may skip the arc but not the prose discipline.

## Communication craft

- **Words → picture → symbols.** Describe the phenomenon physically, point to a figure, *then* write the math. Never lead with the equation.
- **Prose and dense equations are the last resort.** Reach first for a figure, worked example, diagram, comparison table, or analogy. Where math *is* the point, sandwich each equation between a symbol table (tie symbols to code identifiers) and a sentence on what it physically means.
- **Concrete before abstract.** Open with the motivating case, not the definition; aim for "you could have invented this." Ground every abstract object in a concrete use the moment it appears.
- **Lead with the message.** The first sentence of a section states the conclusion and why it matters; payoff before derivation.
- **Notation discipline.** Define every symbol at first use; encode meaning in typography (case = scope, accent = operation); use ≡ for definitions.
- **Show the data honestly.** Data-carrying marks get prominence; lie factor ≈ 1 (bars from zero, area ∝ value, full range not a cherry-picked slice).
- **Maximize data-ink; gray is for context.** Kill chartjunk (heavy gridlines, borders, 3-D, gradients); put grids/baselines/secondary series in gray; spend saturated color only where the eye should land.
- **Make color semantic.** The same concept keeps the same hue across prose, diagrams, and plots. Use same-hue lightness variants for related states; introduce a new hue only when it encodes a real distinction. Never rely on red–green or color alone when the distinction matters—add direct labels, marker shapes, or line styles.
- **One visual channel encodes one variable per figure.** Color meaning "category" in one region and "value" in another reads as false structure; give the second variable its own channel (marker shape, an offset band) and key it in the caption.
- **Use opacity as hierarchy.** Keep the claim/data of interest nearly opaque, uncertainty and ranges intermediate, and raw/contextual data translucent. Never make essential thin marks faint enough to disappear on a projector.
- **Integrate graphics with text.** Figure next to the point it supports; **direct-label** lines instead of a legend; annotate events on the plot; prefer **small multiples** over one overplotted chart.
- **Give direct labels a quiet halo** in the background color so they remain legible without a legend box. Match reference-line annotations to the mark they describe.
- **For a scalar function of two variables, start with a contour field:** translucent filled contours for gestalt, thin isolines for structure, inline values for exact reading, and a labeled colorbar. Mask unsupported regions rather than visually inventing interpolation across gaps. Use a perceptually monotonic sequential map (`viridis`/`cividis`) or a semantically correct diverging map; never a rainbow map by default.
- **Keep observations visible.** If you smooth or fit sampled data, retain the raw markers and distinguish observations from interpolation. Show uncertainty as a lower-opacity layer in the same hue as the estimate.
- **Make axes effortless to parse.** Prefer a horizontal, wrapped y-axis label when space permits; use a few readable 1–2–5 ticks; avoid offset notation that forces mental arithmetic.
- **Make browser SVGs deterministic.** Mixed prose/math labels can become many live `<tspan>` elements whose fallback fonts differ across browsers. For presentation-grade SVG, prefer `svg.fonttype: path` plus `mathtext.fontset: dejavusans`, or avoid mixed mathtext in one label. Preserve accessibility with concise alt text.
- **Guard the hero figure:** a "how to read this" note stating what it does *not* say, and a scope caveat on every cross-baseline claim.
- **Lay out for a book's proportions:** multi-panel figures stack **vertically** (no dual y-axis — two stacked panels sharing an x-axis).
- **Label every axis with quantity + unit in brackets** (`Distance from origin [m]`, `Speed [m/s]`). An unlabeled or unit-less axis is a defect.
- **Use 3-D only when three-dimensional structure is the message.** Default to orthographic projection, equal aspect, and a named reproducible viewpoint; otherwise use small multiples or contours.
- **Choose the diagram language by the relationship.** Use Mermaid for flows/sequences, Graphviz for topology and automatic graph layout, executable Python/SVG for physical geometry and free-body diagrams, and TikZ only when its mathematical typesetting or precise declarative placement earns the extra toolchain.
- **Where a claim hinges on a parameter, make it explorable** (Quarto OJS/Plotly widget) rather than one precomputed number.
- **State assumptions and scope; keep an honest "what this does not solve."** Candor is itself a contribution.
- **Reverse-outline your draft:** summarize each paragraph in <10 words; if one resists, it has no single point — split or cut; if the summaries don't tell a coherent story, the structure is broken.

## Know your reader: Peter Sharpe

Tailoring is not optional — the same content lands differently depending on what you assume known. Detail in `references/audience-peter.md`.

**Assume expert (don't over-explain; use as reference points):** PDEs and their numerics; optimization (gradient/second-order, IPOPT, KKT, MDO at thousands of variables); automatic differentiation and differentiable programming; aerodynamics and aircraft flight physics; physics-informed / scientific ML (neural operators, PINNs, GNNs, neural fields, inductive biases, equivariance, hard constraints); large-scale GPU/HPC; Python scientific stack, JAX (Equinox/Diffrax), PyTorch, CasADi. He builds custom solvers and runs fleets of coding agents. Draw analogies from optimization, differentiable physics, aircraft.

**Motivate and connect (adjacent, not core — he learns fast, so "motivate," never "he can't follow"):** LLM/NLP internals as a research subject; reinforcement learning; formal/theoretical ML (bounds, learning theory); rigorous functional-analysis PDE theory; deep Bayesian machinery (MCMC/VI); non-physical domains (bio, chem, econ). Frame heavy theory around the practical payoff.

**Match his register:** quantitative and precise — lead with magnitudes and ratios, not adjectives ("100–600× lower MSE"). Fair comparison — always state the controlled variable ("faster *at equal accuracy*"). First-principles, mechanism-driven. Engineering pragmatism — theory that pays off in a real artifact. Open-source by default. Honest about limits. Respects the empirical loop.

## Operating in a session

**Scaffold.** Copy `templates/` into `docs/<book>/`. Python via **`uv`**; render with the **`quarto`** CLI (install if missing). Layout:
```
docs/<book>/
  _quarto.yml          # HTML, cosmo, freeze:auto, code-fold
  _common.py           # shared palette + matplotlib house style + demo helper
  index.qmd            # hook, thesis paragraph, "in one picture", reading order
  01-*.qmd 02-*.qmd …  # polished chapters
  99-lab-notebook.qmd  # dated raw record (research books; see autoresearch)
  data/                # dated files for expensive precomputed results
  .gitignore           # ignores _book/, .quarto/, .venv/, __pycache__/; _freeze/ stays committed
```

**Render.** `quarto preview` while writing; `quarto render` to build. `freeze: auto` re-executes a cell only when its `.qmd` changes; after changing imported modules or external data, temporarily render with `freeze: false` (or otherwise invalidate the dependent cells) and confirm the output is fresh.

**Reproducibility.**
- **Never hand-type a number** into prose or a table — compute it live, emit with `#| output: asis`, and generate tables from the data structure. Hand-transcription drifts and contradicts itself.
- **Tag every quantitative claim with its provenance** (the exact artifact its numbers come from); keep a "Provenance and caveats" section separating reproduced results from one-off session artifacts.
- **Timing numbers require a quiet machine.** Gate benchmark runs on sustained idleness and record load snapshots as provenance — repeats and minimums do not rescue a saturated machine.
- **The figure is always plotted by a live inline cell — never a precomputed image.** Precompute the expensive *computation* (a sweep or GPU run → a dated data file); the inline cell reads it and plots. Cheap computation just runs live. Offload heavy runs via the `hpc-resources` skill.
- **Default to `code-fold: true`** (code collapsed, expandable) over hiding it; keep one shared style imported by every figure cell.

## Templates & reference

- `templates/` — copy-paste Quarto scaffold (`_quarto.yml`, `_common.py`, `index.qmd`, `chapter.qmd`, `99-lab-notebook.qmd`, `.gitignore`). Start here.
- `references/audience-peter.md` — the detailed reader profile.
- `references/diagramming.md` — representation choice and reproducible engineering-schematic workflow; read it when making a diagram.