from PIL import Image
import base64, io

png = "/ws/mooncake-eraser/out/mooncake_removed.png"
im = Image.open(png).convert("RGB")
buf = io.BytesIO()
im.save(buf, "JPEG", quality=85)
b64 = base64.b64encode(buf.getvalue()).decode()

html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>月饼去除效果 - app-6287wh</title>
<style>
 body{margin:0;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:#1a1210;color:#f5e9dc}
 .wrap{max-width:900px;margin:0 auto;padding:32px 20px}
 h1{font-size:26px;color:#f0c96c}
 p.lead{color:#d9c3a5;line-height:1.7}
 .card{background:#261915;border:1px solid #4a3226;border-radius:14px;padding:18px;margin-top:24px}
 img{max-width:100%;border-radius:10px;display:block}
 .tag{display:inline-block;background:#f0c96c;color:#3a2410;font-weight:700;border-radius:999px;padding:4px 14px;font-size:13px;margin-bottom:10px}
 footer{margin-top:36px;font-size:13px;color:#8f7a63;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <h1>月饼去除 · 修改完成</h1>
  <p class="lead">使用 inpaint（推拉扩散 + 拉普拉斯金字塔羽化融合）管线，将图中的月饼完全抹除，掩码外像素与原图逐像素一致，接缝处已做纹理与高斯平滑过渡。</p>
  <div class="card">
    <span class="tag">处理结果</span>
    <img alt="已去除月饼的图片" src="data:image/jpeg;base64,__B64__">
  </div>
  <footer>app-6287wh · mooncake-eraser · 源图 /ws/source.png</footer>
</div>
</body>
</html>"""
html = html.replace("__B64__", b64)
open("/ws/mooncake-eraser/index.html", "w").write(html)
print("index.html", len(html), "bytes")
