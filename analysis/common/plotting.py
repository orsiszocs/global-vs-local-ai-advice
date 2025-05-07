"""
Defines plotting utilities for experiment visualizations.
- plot_colours: maps roles to colours and provides a distinct palette
- set_matplotlib_latex: enables LaTeX rendering with Times New Roman and math support
- set_axes_length: adjusts the current axes to a specified width and height
"""


import matplotlib.pyplot as plt

plot_colours = {
    "local": "#f58231",  # orange
    "global": "#4363d8",  # blue
    "ai": "#9400d3",  # violet
    "participant": "#014d4e",  # teal
    "distinctColours": ["#4363d8", "#f58231", "#800000", "#a9a9a9", "#ffe119", "#dcbeff", "#000075", "#000000"]
}


def set_matplotlib_latex():
    plt.rcParams.update({
        "text.usetex": True,
        "font.family": "Times New Roman",
        "font.size": 8,
        "text.latex.preamble": r"\usepackage{amsmath}"
    })


def set_axes_length(width, height):
    ax = plt.gca()
    left = ax.figure.subplotpars.left
    right = ax.figure.subplotpars.right
    top = ax.figure.subplotpars.top
    bottom = ax.figure.subplotpars.bottom
    fig_width = float(width) / (right - left)
    fig_height = float(height) / (top - bottom)
    ax.figure.set_size_inches(fig_width, fig_height)
