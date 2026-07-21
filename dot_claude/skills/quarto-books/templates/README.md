# Quarto book scaffold

Copy these files — including the `.gitignore` dotfile — into your project's
docs folder (e.g. `docs/<book-name>/`) and
start writing on day one — before the first experiment. See the parent
`SKILL.md` for the communication craft, and the `autoresearch` skill for the
research methodology; this is just the mechanics.

## Files

| File | Purpose |
|---|---|
| `_quarto.yml` | Book config: HTML, `cosmo` theme, `freeze: auto`, `code-fold`. Edit the title and chapter list. |
| `_common.py` | Shared palette + Matplotlib house style + `demo_case()`. Imported first in every figure cell so the whole book looks like one thing. |
| `index.qmd` | The hook: thesis paragraph (write this first), "the whole thing in one picture", what's different, reading order. |
| `chapter.qmd` | A worked chapter template — rename to `01-*.qmd`, `02-*.qmd`, … Demonstrates words→picture→symbols, live-computed numbers, a sandwiched equation, cross-refs, callouts. |
| `99-lab-notebook.qmd` | The raw, dated record (kept as an appendix). Forward-chronological like a real notebook — append each new entry at the bottom. Keep dead-ends and refutations. |
| `.gitignore` | Ignores rendered output (`_book/`, `.quarto/`) and Python/venv artifacts. Deliberately does *not* ignore `_freeze/` — commit it (see below). |

## Setup & build

Environment is Python via [`uv`](https://docs.astral.sh/uv/); the book renders
with the [`quarto`](https://quarto.org) CLI (a standalone binary — install it if
missing).

```sh
# one-time: a project venv with your package + plotting deps
uv sync                       # or: uv add matplotlib numpy pandas <your-package>

# write with live reload
quarto preview                # rebuilds on save, opens a browser

# build the site (outputs to _book/)
quarto render
```

`freeze: auto` caches executed cell outputs under `_freeze/` and re-runs a cell
only when its `.qmd` changes — commit `_freeze/` so re-renders are cheap and
reproducible.

## Two rules that keep the book honest

1. **Never hand-type a number** into prose or a table. Compute it in a cell and
   emit it with `#| output: asis` (see `chapter.qmd`), so the text can't drift
   from the data.
2. **Cheap computations run live at render; expensive sweeps get precomputed**
   to dated `data/*.csv` by a `scripts/generate_*.py`, and figure cells just
   read and plot. Regenerate after any change to the underlying method. (Offload
   heavy/GPU runs with the `hpc-resources` skill.)