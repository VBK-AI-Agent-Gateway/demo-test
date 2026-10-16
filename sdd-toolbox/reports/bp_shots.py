#!/usr/bin/env python3
"""三档断点"截图式"报告：375/768/1280 下按 CSS 断点推演布局，输出可视化 SVG。"""
import re, sys, html

src = open(sys.argv[1], encoding="utf-8").read()
css = "\n".join(re.findall(r"<style>(.*?)</style>", src, re.S))
medias = {}
for m in re.finditer(r"@media([^{]+)\{(.*?)\n\}", css, re.S):
    cond, body = m.group(1), m.group(2)
    medias.setdefault(cond.strip(), []).append(body)

def cols_for(w):
    # 基础：auto-fit/minmax(300px,1fr) → 可容纳列数；媒体查询覆写
    base = max(1, w // 318)
    for cond in medias:
        nums = [int(x) for x in re.findall(r"(\d+)px", cond)]
        lo = nums[0] if nums else 0
        hi = nums[1] if len(nums) > 1 else 10**9
        if lo <= w <= hi:
            for body in medias[cond]:
                n = re.search(r"repeat\((\d+),1fr\)", body)
                if n:
                    return int(n.group(1))
                if "1fr 1fr" in body:
                    return 2
                if "grid-template-columns:1fr" in body and "1fr 1fr" not in body:
                    return 1
    return min(base, 3)

def card(x, y, w, h, title, body):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#fff" stroke="#dfe5ee"/>'
            f'<text x="{x+12}" y="{y+24}" font-size="13" font-weight="700" fill="#1b2430">{title}</text>'
            f'<text x="{x+12}" y="{y+44}" font-size="11" fill="#5b6675">{body}</text>')

views = []
for w, h in [(375, 640), (768, 520), (1280, 480)]:
    scale = 0.62 if w == 1280 else (0.72 if w == 768 else 1.0)
    sw, sh = int(w * scale), int(h * scale)
    n = cols_for(w)
    inner = sw - 36
    cw = (inner - (n - 1) * 14) // n
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{sw}" height="{sh}" viewBox="0 0 {sw} {sh}" role="img" aria-label="{w}px 断点渲染推演">',
        f'<rect width="{sw}" height="{sh}" fill="#f5f7fb"/>',
        f'<rect width="{sw}" height="40" fill="#1f6feb"/>',
        f'<text x="14" y="26" font-size="13" fill="#fff" font-weight="700">◈ 响应式示例站</text>',
        f'<text x="{sw-14}" y="26" font-size="11" fill="#dbeafe" text-anchor="end">首页 · 产品 · 关于</text>',
        f'<text x="14" y="70" font-size="17" font-weight="700" fill="#1b2430">一屏三断点 — {w}×{h}</text>',
        f'<text x="14" y="90" font-size="11" fill="#6b7686">推演卡片列数: {n} 列</text>',
    ]
    titles = [("快速", "零依赖静态页"), ("可达", "语义+焦点可见"), ("自适应", "网格随宽重排")]
    for i in range(n):
        t, b = titles[i % 3]
        parts.append(card(14 + i * (cw + 14), 104, cw, 84, t, b))
    parts.append("</svg>")
    views.append((w, "".join(parts)))

svgs = "\n".join(f'<figure style="margin:0"><figcaption style="font:14px sans-serif;margin:6px 0">📱 {w}px 断点</figcaption>{s}</figure>'
                 for w, s in views)
page = f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SDD 工具台 · 三档断点截图报告</title>
<style>body{{background:#0d1117;color:#e6edf3;font:15px/1.6 -apple-system,'Segoe UI',sans-serif;margin:0;padding:28px 20px}}
h1{{font-size:22px}} .row{{display:flex;gap:18px;flex-wrap:wrap}}
figure{{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:12px;flex:1 1 300px}}
figcaption{{color:#9aa7b4}} svg{{max-width:100%;height:auto;display:block;border-radius:6px}}
a{{color:#58a6ff}}</style></head><body>
<h1>三档断点渲染报告（375 / 768 / 1280）</h1>
<p style="color:#9aa7b4">沙箱内无浏览器，采用 CSS 断点静态推演生成的可视化截图（axe 报告见同目录 axe-report.json）。</p>
<div class="row">{svgs}</div>
<p style="margin-top:18px"><a href="./index.html">← 返回 SDD 工具台</a></p>
</body></html>"""
open(sys.argv[2], "w", encoding="utf-8").write(page)
for w, s in views:
    open(sys.argv[2].replace(".html", f"-{w}.svg"), "w", encoding="utf-8").write(s)
print("wrote", sys.argv[2], "and 3 svgs")