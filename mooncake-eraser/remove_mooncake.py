#!/usr/bin/env python3
"""Remove the mooncake held in the hand from /ws/source.png (PIL + numpy only).

Pipeline (memory-safe: float32, bbox-limited):
1. Auto-locate mooncake: warm/golden color score on 1/4-scale proxy + sliding disc.
2. Mask = disc dilated 35% radius (covers gripping fingers).
3. Push-pull neighborhood diffusion inpaint inside the bbox.
4. 4-level Laplacian pyramid blend, feathered weight -> seamless seam.
5. Every pixel outside the mask stays identical to the source.
"""
import os
import numpy as np
from PIL import Image, ImageFilter

SRC = "/ws/source.png"
DST = "/ws/mooncake-eraser/out/mooncake_removed.png"

img = Image.open(SRC).convert("RGB")
W, H = img.size
a = np.asarray(img).astype(np.float32)

# ------------------------------------------------- 1) locate mooncake (proxy)
small = img.resize((W // 4, H // 4), Image.BILINEAR)
sa = np.asarray(small).astype(np.float32)
sh, sw = sa.shape[:2]
warm = np.clip((sa[..., 0] - sa[..., 2]) / 60.0, 0, 1)
bright = np.clip((sa.mean(axis=2) - 60) / 120.0, 0, 1)
score_map = warm * (0.4 + 0.6 * bright)


def box_mean(m, rad):
    ii = np.pad(m, 1, mode="edge").cumsum(0).cumsum(1)
    h, w = m.shape
    y0 = np.clip(np.arange(h) - rad, 0, h)
    y1 = np.clip(np.arange(h) + rad + 1, 0, h)
    x0 = np.clip(np.arange(w) - rad, 0, w)
    x1 = np.clip(np.arange(w) + rad + 1, 0, w)
    S = ii[np.ix_(y1, x1)] - ii[np.ix_(y0, x1)] - ii[np.ix_(y1, x0)] + ii[np.ix_(y0, x0)]
    cnt = ((y1 - y0)[:, None] * (x1 - x0)[None, :]).astype(np.float32)
    return S / cnt


best = None
for rad4 in (max(3, sw * 10 // 100), max(4, sw * 14 // 100),
             max(5, sw * 18 // 100), max(6, sw * 22 // 100)):
    cand = box_mean(score_map, rad4)
    step = max(2, rad4 // 6)
    for cy4 in range(rad4, sh - rad4, step):
        row = cand[cy4, rad4:sw - rad4:step]
        if row.size == 0:
            continue
        i = int(row.argmax())
        s = float(row[i])
        cx4 = rad4 + i * step
        if best is None or s > best[0]:
            best = (s, cx4, cy4, rad4)

assert best is not None, "no candidate region found"
_, cx4, cy4, rad4 = best
cx, cy = cx4 * 4, cy4 * 4
rad = max(8, int(rad4 * 4 * 1.15))

# ------------------------------------------------------------- 2) masks (bbox)
dil_r = int(rad * 0.35)
pad = dil_r + 8
bx0, bx1 = max(0, cx - rad - pad), min(W, cx + rad + pad)
by0, by1 = max(0, cy - rad - pad), min(H, cy + rad + pad)
bw, bh = bx1 - bx0, by1 - by0

yy, xx = np.mgrid[0:bh, 0:bw]
lx, ly = xx + bx0 - cx, yy + by0 - cy          # local coords rel. center
dist2 = lx * lx + ly * ly
core = dist2 <= rad * rad
mask = dist2 <= (rad + dil_r) ** 2
del yy, xx, lx, ly, dist2

crop = a[by0:by1, bx0:bx1].copy()
crop_c = crop.copy()                            # pristine crop for outside-restore

# ------------------------------------------------------- 3) push-pull inpaint
def inpaint_pushpull(rgb, m):
    vals = rgb.copy()
    wgt = (~m).astype(np.float32)
    vals[m] = 0.0

    def down(v, wt):
        h2, w2 = v.shape[0] // 2, v.shape[1] // 2
        if h2 < 1 or w2 < 1:
            return v, wt
        v = v[: h2 * 2, : w2 * 2].reshape(h2, 2, w2, 2, 3)
        wt = wt[: h2 * 2, : w2 * 2].reshape(h2, 2, w2, 2)
        wsum = wt.sum((1, 3))
        vn = (v * wt[..., None]).sum((1, 3)) / np.maximum(wsum, 1e-9)[..., None]
        return vn, wsum

    def up(v, wt, shape):
        Hs, Ws = shape[0], shape[1]
        vi = np.repeat(np.repeat(v, 2, 0), 2, 1)
        wi = np.repeat(np.repeat(wt, 2, 0), 2, 1)
        if vi.shape[0] < Hs:
            vi = np.pad(vi, ((0, Hs - vi.shape[0]), (0, 0), (0, 0)), mode="edge")
            wi = np.pad(wi, ((0, Hs - wi.shape[0]), (0, 0)), mode="edge")
        if vi.shape[1] < Ws:
            vi = np.pad(vi, ((0, 0), (0, Ws - vi.shape[1]), (0, 0)), mode="edge")
            wi = np.pad(wi, ((0, 0), (0, Ws - wi.shape[1])), mode="edge")
        return vi[:Hs, :Ws], wi[:Hs, :Ws]

    V, Wt = [vals], [wgt]
    v, wt = vals, wgt
    while min(v.shape[0], v.shape[1]) > 2:
        v, wt = down(v, wt)
        V.append(v)
        Wt.append(wt)

    cv, cw = V[-1], Wt[-1]
    for i in range(len(V) - 2, -1, -1):
        uv, uw = up(cv, cw, V[i].shape)
        known = Wt[i][..., None]
        cv = V[i] * known + uv * (1 - known)
        cw = Wt[i]
        miss = Wt[i] == 0
        if miss.any():
            blur = np.asarray(
                Image.fromarray(np.clip(cv, 0, 255).astype(np.uint8))
                .filter(ImageFilter.GaussianBlur(3))
            ).astype(np.float32)
            cv = np.where(miss[..., None], blur, cv)
    return cv


inpainted = inpaint_pushpull(crop, mask)

# ------------------------------------------------- 4) pyramid blend (in bbox)
def gaussian_pyr(im_np, levels):
    p = [im_np]
    for _ in range(levels - 1):
        h, w = p[-1].shape[:2]
        h2, w2 = max(1, h // 2), max(1, w // 2)
        im = Image.fromarray(np.clip(p[-1], 0, 255).astype(np.uint8)).resize(
            (w2, h2), Image.BILINEAR
        )
        p.append(np.asarray(im).astype(np.float32))
    return p


def laplacian_pyr(im_np, levels):
    gp = gaussian_pyr(im_np, levels)
    lp = []
    for i in range(levels - 1):
        h, w = gp[i].shape[:2]
        up = np.asarray(
            Image.fromarray(np.clip(gp[i + 1], 0, 255).astype(np.uint8)).resize(
                (w, h), Image.BILINEAR
            )
        ).astype(np.float32)
        lp.append(gp[i] - up)
    lp.append(gp[-1])
    return lp


def collapse(lp):
    cur = lp[-1]
    for i in range(len(lp) - 2, -1, -1):
        h, w = lp[i].shape[:2]
        up = np.asarray(
            Image.fromarray(np.clip(cur, 0, 255).astype(np.uint8)).resize(
                (w, h), Image.BILINEAR
            )
        ).astype(np.float32)
        cur = lp[i] + up
    return cur


LEVELS = 4

# feathered weight: fully repaired inside core, soft falloff across the ring
core_w = Image.fromarray((core.astype(np.float32) * 255).astype(np.uint8)).filter(
    ImageFilter.GaussianBlur(rad * 0.30)
)
m_soft = np.asarray(core_w).astype(np.float32)[..., None] / 255.0

la = laplacian_pyr(crop_c, LEVELS)
lb = laplacian_pyr(inpainted, LEVELS)

wm = [m_soft]
for _ in range(LEVELS - 1):
    h, w = wm[-1].shape[:2]
    im = Image.fromarray(np.clip(wm[-1][..., 0] * 255, 0, 255).astype(np.uint8)).resize(
        (max(1, w // 2), max(1, h // 2)), Image.BILINEAR
    )
    wm.append(np.asarray(im).astype(np.float32)[..., None] / 255.0)

blended = []
for i in range(LEVELS):
    wi = wm[i]
    if wi.shape[:2] != la[i].shape[:2]:
        im = Image.fromarray(np.clip(wi[..., 0] * 255, 0, 255).astype(np.uint8)).resize(
            (la[i].shape[1], la[i].shape[0]), Image.BILINEAR
        )
        wi = np.asarray(im).astype(np.float32)[..., None] / 255.0
    blended.append(la[i] * (1 - wi) + lb[i] * wi)

result = collapse(blended)

# ------------------------------------- 5) seam smoothing + outside unchanged
# gentle high-frequency detail into the transition ring (avoids plastic look)
tex = np.asarray(
    Image.fromarray(np.clip(crop_c, 0, 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(6)
    )
).astype(np.float32)
detail = np.clip(crop_c - tex, -30, 30)
ring = np.clip(mask.astype(np.float32) - core.astype(np.float32), 0, 1)
result = result + detail * ring[..., None] * 0.35

# smooth just around the mask boundary
edge = (mask & (~core)).astype(np.uint8)
if edge.any():
    e_img = Image.fromarray(edge * 255).filter(ImageFilter.MaxFilter(5)).filter(
        ImageFilter.GaussianBlur(4)
    )
    e_w = np.asarray(e_img).astype(np.float32)[..., None] / 255.0
    smooth = np.asarray(
        Image.fromarray(np.clip(result, 0, 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(3)
        )
    ).astype(np.float32)
    result = result * (1 - e_w * 0.7) + smooth * (e_w * 0.7)

# outside the mask: pixel-identical to the source crop
outside = ~mask
result[outside] = crop_c[outside]

# ------------------------------------------------------------- compose image
out_a = a.copy()
out_a[by0:by1, bx0:bx1] = result
out = Image.fromarray(np.clip(out_a, 0, 255).astype(np.uint8), "RGB")
os.makedirs(os.path.dirname(DST), exist_ok=True)
out.save(DST)
print("candidate center=(%d,%d) radius=%d bbox=(%d,%d,%d,%d)" % (cx, cy, rad, bx0, by0, bx1, by1))
print("saved out/mooncake_removed.png %s" % (out.size,))