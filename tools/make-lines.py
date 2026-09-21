#!/usr/bin/env python3
"""
Lift Leonardo's lines off the scan, in two weights.

Reads public/vitruvian-man.webp (white ink on a black card) and writes two
files, both the same 1400 x 797 box, white pixels with an alpha channel:

    public/vitruvian-lines.webp        the two horizontal arms and the chest
    public/vitruvian-lines-faint.webp  everything else

The app paints the first at full strength and the second faded back, so the
arms — which are the timeline — carry the drawing, and the raised arms, the
square and the circle stay in the background. Both are used as CSS masks, so
the lines take whatever colour the theme is wearing, and because they are the
same pixels as the scan they land on it exactly.

Three steps do the work:

  * a wide median is the local "no ink here" level, so subtracting it flattens
    the paper grain and the vignette away;
  * a top-hat keeps only what is narrower than its kernel, which throws out the
    puddles — the hair, the shaded hollows, the heaviest hatching;
  * a region drawn round the arms and the chest splits what is left in two,
    with a soft edge so no line changes weight abruptly.

Needs numpy, scipy and pillow. Re-run it after replacing the scan:

    python3 tools/make-lines.py
"""

import pathlib

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import (binary_dilation, gaussian_filter, label,
                           median_filter, uniform_filter, white_tophat)

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'vitruvian-man.webp'
OUT_STRONG = ROOT / 'public' / 'vitruvian-lines.webp'
OUT_FAINT = ROOT / 'public' / 'vitruvian-lines-faint.webp'

FLATTEN = 41        # median window for the "no ink" level, in pixels
WIDTH = 9           # anything wider than this is a puddle, not a line
LO, HI = 70, 120    # ink strength: fades in from nothing to fully opaque
MIN_BLOB = 200      # drop anything smaller than this, in pixels
PUDDLE = 0.62       # reject where more than this share of a 15px box is ink
GROW = 9            # how far the strong region reaches past the outline
FEATHER = 22        # and how softly it hands over to the faint layer

# The arms and the chest, in source pixels. Only a region, never drawn, so it
# only has to enclose the ink — see readme, "The lines".
ARM_L = [(508, 314), (470, 316), (400, 316), (330, 315), (268, 317), (255, 318),
         (240, 308), (210, 299), (180, 293), (148, 286), (145, 313), (148, 340),
         (180, 352), (210, 354), (241, 360), (285, 365), (320, 366), (360, 370),
         (400, 370), (440, 366), (480, 365), (520, 366), (560, 372), (584, 377)]
ARM_R = [(886, 313), (920, 316), (1000, 317), (1080, 313), (1134, 306),
         (1166, 297), (1211, 295), (1245, 299), (1248, 320), (1240, 339),
         (1196, 352), (1166, 358), (1130, 356), (1060, 367), (1020, 373),
         (980, 370), (940, 366), (900, 366), (860, 368), (810, 381)]
CHEST = [(508, 314), (560, 292), (600, 274), (700, 266), (796, 274), (840, 292),
         (886, 313), (810, 381), (798, 398), (740, 416), (690, 414), (610, 406),
         (584, 377)]


def ink_alpha() -> np.ndarray:
    """The scan reduced to line ink, 0..1."""
    ink = np.asarray(Image.open(SRC).convert('L')).astype(np.float32)
    flat = np.clip(ink - median_filter(ink, size=FLATTEN), 0, None)
    alpha = np.clip((white_tophat(flat, size=WIDTH) - LO) / (HI - LO), 0, 1)

    # anything still sitting in a solid patch is a puddle the top-hat missed
    alpha = np.where(uniform_filter(alpha, size=15) > PUDDLE, 0, alpha)

    blobs, count = label(alpha > 0.35)
    if count:
        sizes = np.bincount(blobs.ravel())
        keep = np.zeros(sizes.shape, bool)
        keep[1:] = sizes[1:] >= MIN_BLOB
        alpha = np.where(keep[blobs], alpha, 0)
    return alpha


def arm_region(shape: tuple[int, int]) -> np.ndarray:
    """1 over the arms and the chest, 0 away from them, soft in between."""
    canvas = Image.new('L', (shape[1], shape[0]), 0)
    draw = ImageDraw.Draw(canvas)
    for poly in (ARM_L, ARM_R, CHEST):
        draw.polygon(poly, fill=255)
    grown = binary_dilation(np.asarray(canvas) > 127, iterations=GROW)
    return np.clip(gaussian_filter(grown.astype(np.float32), FEATHER / 2) * 1.6, 0, 1)


def save(alpha: np.ndarray, path: pathlib.Path) -> None:
    white = np.full(alpha.shape, 255, np.uint8)
    rgba = np.dstack([white, white, white, (alpha * 255).astype(np.uint8)])
    Image.fromarray(rgba, 'RGBA').save(path, lossless=True, quality=100)
    print(f'{path.relative_to(ROOT)}  {path.stat().st_size // 1024} kB, '
          f'{(alpha > 0.2).mean() * 100:.1f}% ink')


def main() -> None:
    alpha = ink_alpha()
    region = arm_region(alpha.shape)
    save(alpha * region, OUT_STRONG)
    save(alpha * (1 - region), OUT_FAINT)


if __name__ == '__main__':
    main()
