#!/usr/bin/env python3
"""生成一张全中文的图片（竖版唐诗海报：静夜思）。

字体策略（按优先级）：
1. fonts/NotoSansSC-Regular.otf（若已下载）
2. 系统任意中文字体（fc-list 扫描）
3. 内置矢量汉字笔画引擎（strokefont.py）—— 纯几何绘制，保证不出现豆腐块
所有文字均为中文字符，不出现英文字母。
"""
import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "pl"))

W, H = 900, 1273  # A4 比例竖版
BG = (247, 243, 235)       # 米白
INK = (40, 40, 44)         # 墨色
INK_LIGHT = (90, 90, 96)
RED = (176, 32, 32)        # 印章朱红

TITLE = "静夜思"
POEM = ["床前明月光", "疑是地上霜", "举头望明月", "低头思故乡"]
AUTHOR = "唐 · 李白"


def pick_font(size):
    """返回 (kind, obj)。kind: 'ttf' 或 'vec'。"""
    # 1) 本地 OTF/TTF
    for p in [
        os.path.join(HERE, "fonts", "NotoSansSC-Regular.otf"),
        os.path.join(HERE, "fonts", "NotoSansSC-Bold.otf"),
    ]:
        if os.path.exists(p):
            try:
                return "ttf", ImageFont.truetype(p, size)
            except Exception:
                pass
    # 2) 系统中文字体
    import glob
    for pat in ["/usr/share/fonts/**/*CJK*.ttc", "/usr/share/fonts/**/*wqy*.ttc",
                "/usr/share/fonts/**/*Noto*SC*.otf", "/usr/share/fonts/**/*wqy*.ttf",
                "/usr/share/fonts/**/*Droid*Fallback*.ttf"]:
        for p in glob.glob(pat, recursive=True):
            try:
                f = ImageFont.truetype(p, size)
                # 快速验证「静」可渲染
                if f.getbbox("静")[2] > 0:
                    return "ttf", f
            except Exception:
                continue
    # 3) 矢量笔画引擎
    from strokefont import StrokeFont
    return "vec", StrokeFont(size)


def draw_text(draw, xy, text, font, fill, anchor="la"):
    kind = "ttf" if isinstance(font, ImageFont.FreeTypeFont) else "vec"
    if kind == "ttf":
        draw.text(xy, text, font=font, fill=fill, anchor=anchor)
    else:
        font.draw(draw, xy, text, fill, anchor)


def text_size(font, text):
    if isinstance(font, ImageFont.FreeTypeFont):
        b = font.getbbox(text)
        return b[2] - b[0], b[3] - b[1]
    b = font.getbbox(text)  # (x0,y0,x1,y1)
    return b[2] - b[0], b[3] - b[1]


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # 外框双线
    d.rectangle([40, 40, W - 40, H - 40], outline=INK_LIGHT, width=2)
    d.rectangle([52, 52, W - 52, H - 52], outline=(210, 200, 186), width=1)

    kind_t, f_title = pick_font(112)
    kind_a, f_author = pick_font(44)
    kind_p, f_poem = pick_font(64)
    kind_c, f_small = pick_font(28)

    # 标题（居中）
    tw, _ = text_size(f_title, TITLE)
    draw_text(d, ((W - tw) / 2, 150), TITLE, f_title, INK)

    # 分隔线
    d.line([(W // 2 - 120, 310), (W // 2 + 120, 310)], fill=(200, 190, 175), width=2)

    # 诗句（四行，居中）
    y = 370
    for line in POEM:
        lw, _ = text_size(f_poem, line)
        draw_text(d, ((W - lw) / 2, y), line, f_poem, INK)
        y += 110

    # 落款
    aw, _ = text_size(f_author, AUTHOR)
    draw_text(d, (W - aw - 130, y + 60), AUTHOR, f_author, INK_LIGHT)

    # 朱红方印（含「诗」字）
    sx, sy, s = W - 190, y + 140, 96
    d.rounded_rectangle([sx, sy, sx + s, sy + s], radius=8, fill=RED)
    f_seal = pick_font(64)[1]
    ow, oh = text_size(f_seal, "诗")
    draw_text(d, (sx + (s - ow) / 2, sy + (s - oh) / 2 - 4), "诗", f_seal, (255, 245, 240))

    # 底部小字
    note = "床前明月光，疑是地上霜。举头望明月，低头思故乡。"
    nw, _ = text_size(f_small, note)
    draw_text(d, ((W - nw) / 2, H - 150), note, f_small, (140, 132, 120))

    out = os.path.join(HERE, "chinese.png")
    img.save(out)
    print("saved:", out, img.size)
    print("font kinds:", kind_t, kind_a, kind_p, kind_c)


if __name__ == "__main__":
    main()