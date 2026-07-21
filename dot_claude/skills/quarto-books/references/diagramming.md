# Diagram selection and engineering schematics

Choose the lowest-complexity representation that preserves the relationship.

| Need | Default |
|---|---|
| flow, sequence, state, simple causal chain | Quarto `{mermaid}` |
| DAG, architecture, dependency graph, many-node topology | Quarto `{dot}` / Graphviz |
| physical geometry, mechanism, dimensions, free-body diagram | executable Python/Matplotlib emitting SVG |
| symbol-heavy schematic needing TeX placement | TikZ extension, only when justified |
| one-off custom artwork | committed SVG plus editable source |

Do not use a graph-layout language for physical geometry: its layout engine is
trying to optimize topology, not mechanics.

## Reproducible free-body diagrams

Build these with Python/Matplotlib:

1. Represent body geometry, application points, force vectors, moments, labels,
   and semantic roles as data.
2. Draw geometry with `Polygon`/`PathPatch`, forces with `FancyArrowPatch`, and
   moments with curved arrows.
3. Use fixed data coordinates, equal aspect, fixed limits across related views,
   hidden axes, and a transparent or document-matched background.
4. Scale arrows quantitatively and state the scale, or normalize them and label
   magnitudes; never imply arbitrary magnitude silently.
5. Pull numerical values from the same model/data that drives the document.
6. Emit SVG for sharp browser rendering.

## Format cautions

- TikZ adds TeX and conversion dependencies. Earn that complexity.
- Add concise alt text to every diagram.
- Test the actual delivery format; HTML, browser print, and LaTeX PDF can handle
  SVG and multiline labels differently.

## Primary documentation

- Quarto diagrams: <https://quarto.org/docs/authoring/diagrams.html>
- Quarto figures and alt text: <https://quarto.org/docs/authoring/figures-and-layout.html>
- Matplotlib arrows: <https://matplotlib.org/stable/api/_as_gen/matplotlib.patches.FancyArrowPatch.html>
- Focused Quarto TikZ extension: <https://github.com/danmackinlay/quarto_tikz>
