"""Shared setup for every figure cell in the book.

Import this first in every ``{python}`` code cell:

    #| echo: false
    import _common

It gives the whole book one visual identity (a single palette + Matplotlib
house style) and one place to put shared constants and the canonical demo case,
so multiple chapters can replot the *same* result from different angles.

Design follows Tufte and the visual grammar encoded by AeroSandbox's
``pretty_plots``: a quiet background, faint grids, no chartjunk, direct labels,
semantic color, and opacity used to separate the claim from its context.
"""

from __future__ import annotations

import matplotlib as mpl
import matplotlib.patheffects as path_effects
import matplotlib.pyplot as plt
import numpy as np  # noqa: F401  (re-exported for convenience in cells)
from cycler import cycler

# If the project uses JAX and you want deterministic float64 CPU renders, enable:
# import os
# os.environ.setdefault("JAX_PLATFORMS", "cpu")
# import jax
# jax.config.update("jax_enable_x64", True)

# --- Palette -----------------------------------------------------------------
# A projection-safe qualitative line palette derived from Paul Tol's schemes.
# Every member exceeds 3:1 against the document background. Slot order is a
# semantic CONVENTION reused across chapters. Color is never the only cue:
# direct labels, line styles, or markers carry the distinction too.
SERIES = [
    "#4477AA",  # blue
    "#228833",  # green
    "#AA3377",  # purple
    "#CC3311",  # vermilion
    "#7A5200",  # dark amber
    "#332288",  # indigo
    "#687076",  # gray
]

# Quiet chrome lets color mean "look here." PRIMARY is for structural emphasis,
# not a mandatory data-series color.
BACKGROUND = "#FFFFFF"
TEXT_PRIMARY = "#23373B"
TEXT_SECONDARY = "#687076"
PRIMARY = "#225555"
GRID = "#DCE1E4"

# --- House style -------------------------------------------------------------
mpl.rcParams.update(
    {
        "figure.facecolor": BACKGROUND,
        "axes.facecolor": BACKGROUND,
        "axes.prop_cycle": cycler(color=SERIES),
        "axes.edgecolor": TEXT_SECONDARY,
        "axes.linewidth": 0.8,
        "axes.grid": True,
        "axes.axisbelow": True,          # gridlines behind the data
        "grid.color": GRID,
        "grid.linewidth": 0.6,
        "axes.spines.top": False,        # despine: kill the box
        "axes.spines.right": False,
        "axes.titlesize": 11,
        "axes.titleweight": "bold",
        "axes.titlelocation": "left",    # left-aligned titles read as topic sentences
        "axes.labelsize": 10,
        "axes.labelcolor": TEXT_PRIMARY,
        "xtick.color": TEXT_SECONDARY,
        "ytick.color": TEXT_SECONDARY,
        "text.color": TEXT_PRIMARY,
        "axes.formatter.useoffset": False,
        "lines.linewidth": 2.0,
        "lines.solid_capstyle": "round",
        "legend.frameon": False,         # prefer direct labels over a legend box
        "font.size": 10,
        "figure.dpi": 150,
        "savefig.bbox": "tight",
        "savefig.facecolor": BACKGROUND,
        # Browser-independent font metrics matter more than selectable SVG text
        # in a reproducible technical artifact.
        "svg.fonttype": "path",
        "mathtext.fontset": "dejavusans",
    }
)


def label_line(ax, x, y, text, color, dx=0.0, dy=0.0, **kwargs):
    """Direct-label a line at its end (Tufte) instead of using a legend.

    Place near the last plotted point so the eye never trips to a key.
    """
    ax.annotate(
        text,
        xy=(x, y),
        xytext=(x + dx, y + dy),
        color=color,
        va="center",
        fontweight="bold",
        fontsize=9,
        path_effects=[
            path_effects.withStroke(linewidth=3, foreground=BACKGROUND),
        ],
        **kwargs,
    )


def annotate_event(ax, x, text, color=TEXT_SECONDARY):
    """Draw a labelled vertical reference line so a figure carries its own story."""
    ax.axvline(x, color=color, linewidth=0.8, linestyle="--", zorder=0)
    ax.text(
        x, ax.get_ylim()[1], f" {text}",
        color=color, va="top", ha="left", fontsize=8, rotation=0,
    )


# --- Shared demo case --------------------------------------------------------
# Solve ONE canonical case here and reuse it across chapters. Replace this stub
# with your project's real setup; assert the property that must hold so a broken
# pipeline fails the render loudly rather than plotting garbage.
def demo_case():
    """Return the canonical result object every chapter plots from."""
    # result = my_package.solve(canonical_input)
    # assert result.converged, "demo_case did not converge — figures would be wrong"
    # return result
    raise NotImplementedError("Wire demo_case() to your project's canonical run.")