#!/usr/bin/env python3
"""Remove red bars / red text from an image.

1. Strict red detection: r >= 100, r - g >= 55, r - b >= 55 (bar #FE000C + text).
2. 3x3 closing to connect text strokes.
3. BFS nearest-valid fill (nearest unmasked pixel colour).
   Rows fully covered by mask get horizontal interpolation; if a row has no
   unmasked pixel at all (full-width red bar), replicate the nearest row that does.
4. Second pass over the result with a fringe rule (r-dominant, r-g/r-b >= 25)
   to remove anti-aliased red edges created in pass 1; fringe pixels are
   re-filled from their non-red neighbour (source stays untouched).
"""
import sys
import numpy as np
from PIL import Image

SRC = "/ws/source.png"
DST = "/ws/red-cleanup/clean.png"


def red_mask(rgb):
    r = rgb[..., 0].astype(np.int16)
    g = rgb[..., 1].astype(np.int16)
    b = rgb[..., 2].astype(np.int16)
    return (r >= 100) & (r - g >= 55) & (r - b >= 55)


def fringe_mask(rgb):
    r = rgb[..., 0].astype(np.int16)
    g = rgb[..., 1].astype(np.int16)
    b = rgb[..., 2].astype(np.int16)
    return (r >= 100) & (r - g >= 25) & (r - b >= 25) & (r > g) & (r > b)


def close_mask(mask, size=3):
    m = mask.copy()
    for dy in range(-size // 2, size // 2 + 1):
        for dx in range(-size // 2, size // 2 + 1):
            m |= np.roll(np.roll(mask, dy, 0), dx, 1)
    e = m.copy()
    for dy in range(-size // 2, size // 2 + 1):
        for dx in range(-size // 2, size // 2 + 1):
            e &= np.roll(np.roll(m, dy, 0), dx, 1)
    return e


def fill_bfs(img, valid):
    from collections import deque
    h, w = valid.shape[:2]
    out = img.copy()
    filled = valid.copy()
    q = deque(zip(*np.where(valid)))
    while q:
        y, x = q.popleft()
        c = out[y, x]
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not filled[ny, nx]:
                filled[ny, nx] = True
                out[ny, nx] = c
                q.append((ny, nx))
    return out, filled


def fill_rows_horiz(img, mask):
    """Per row: interpolate colours horizontally across masked pixels from the
    nearest unmasked pixel on the same row; rows fully masked copy the nearest
    partially-masked row's interpolated result."""
    h, w = mask.shape
    row_cache = {}
    for y in range(h):
        m = mask[y]
        if not m.any():
            continue
        idx = np.where(~m)[0]
        xs = np.arange(w)
        if idx.size == 0:
            continue  # handle later
        for c in range(img.shape[2]):
            img[y, m, c] = np.interp(xs[m], idx, img[y, idx, c])
        row_cache[y] = True
    # fully-masked rows: copy nearest filled row
    for y in range(h):
        if mask[y].all():
            # find nearest row with partial content
            for d in range(1, h):
                if 0 <= y - d and not mask[y - d].all():
                    img[y] = img[y - d]
                    break
                if y + d < h and not mask[y + d].all():
                    img[y] = img[y + d]
                    break
    return img


def inpaint(img, mask):
    """Fill masked region: BFS from valid pixels; fully-masked rows use
    horizontal interpolation first."""
    valid = ~mask
    if valid.any():
        filled_row = ~mask.all(axis=1)
        img = fill_rows_horiz(img, mask & valid.any())
        img, done = fill_bfs(img, ~mask)
        still = mask & ~done
        if still.any():
            img = fill_rows_horiz(img, still)
    return img


def main():
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    rgb0 = arr[..., :3]
    alpha0 = arr[..., 3]

    red0 = red_mask(rgb0) & (alpha0 > 0)
    before_pct = 100.0 * red0.sum() / red0.size
    total_mask = red0.copy()

    rgb = rgb0.copy()

    # Pass 1: strict red
    red = close_mask(red_mask(rgb) | (alpha0 == 0), 3)
    total_mask |= red
    rgb = inpaint(rgb, red)

    # Pass 2: fringe / anti-aliased red on the RESULT only
    fringe = fringe_mask(rgb) | red_mask(rgb)
    if fringe.any():
        fringe = close_mask(fringe, 3)
        total_mask |= fringe
        rgb = inpaint(rgb, fringe)

    # Pass 3: safety net
    fringe = fringe_mask(rgb) | red_mask(rgb)
    if fringe.any():
        total_mask |= fringe
        rgb = inpaint(rgb, fringe)

    out = np.dstack([rgb, np.full(rgb.shape[:2], 255, np.uint8)])
    red_after = red_mask(out[..., :3]) | fringe_mask(out[..., :3])
    after_pct = 100.0 * red_mask(out[..., :3]).sum() / red_after.size

    Image.fromarray(out, "RGBA").save(DST)

    keep = ~total_mask
    diff = np.abs(out[..., :3].astype(np.int16) - arr[..., :3].astype(np.int16))[keep]
    maxdiff = int(diff.max()) if diff.size else 0
    changed = int((diff > 2).sum())

    print(f"source            : {SRC}")
    print(f"output            : {DST}")
    print(f"size              : {im.size[0]}x{im.size[1]}")
    print(f"red before        : {before_pct:.4f}% ({int(red0.sum())} px)")
    print(f"red after         : {after_pct:.4f}% ({int(red_mask(out[..., :3]).sum())} px)")
    print(f"non-red max diff  : {maxdiff}")
    print(f"non-red changed>2 : {changed} px")
    ok = after_pct < 0.1 and maxdiff == 0
    print("VERDICT           :", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())