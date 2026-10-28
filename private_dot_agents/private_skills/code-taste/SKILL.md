---
name: code-taste
description: >-
  Keep code changes simple, repository-aware, and surgical. Use whenever
  writing, modifying, debugging, reviewing, refactoring, testing, or deleting
  code—including scripts, configuration, build files, APIs, and
  infrastructure-as-code. Prefer existing scaffolding over invention, fix root
  causes, resist speculative features and abstractions, minimize the diff, and
  verify proportionally. Trigger for virtually any coding or code-review task.
---

# Code Taste

Apply this discipline to every code change:

1. Understand the request. Surface an assumption only when it materially changes the result.
2. Search the repository and callers before inventing anything. Prefer, in order: no change; an existing helper or pattern; the standard library or platform; an existing dependency; then the smallest clear new code.
3. Fix the root cause at the narrowest shared seam. Reuse or consolidate within scope; do not start adjacent refactors.
4. Add only requested behavior. Do not add speculative features, configurability, dependencies, abstractions, or defensive branches for states guaranteed impossible by existing invariants.
5. Keep the diff surgical. Make every changed line serve the request, match local style, preserve unfamiliar code and comments, and remove only orphans the change creates.
6. Prefer deletion and boring clarity. If a deliberate shortcut has a relevant ceiling, name the ceiling and likely upgrade path.
7. For non-trivial work, define success before editing. Verify with the smallest check that could expose failure; reproduce a bug before fixing it when practical.

Never economize on understanding, correctness, security, trust-boundary validation, data safety, accessibility, or explicitly required behavior.
