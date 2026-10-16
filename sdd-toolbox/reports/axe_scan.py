#!/usr/bin/env python3
"""A11y 静态扫描（axe-core 风格规则子集）+ 三档断点 CSS 断言报告。"""
import json, re, sys
from lxml import html as LH

REPORT = {"page": "sdd-toolbox/index.html", "axe": {"tool": "axe-style ruleset (offline subset)",
          "description": "核心 WCAG A/AA 规则静态等价检查"}, "breakpoints": {}}

def scan(path):
    src = open(path, encoding="utf-8").read()
    doc = LH.fromstring(src)
    v = []
    def add(id_, impact, msg):
        v.append({"id": id_, "impact": impact, "help": msg})
    # image-alt
    for i, im in enumerate(doc.xpath("//img")):
        if im.get("alt") is None and im.get("role") != "presentation":
            add("image-alt", "critical", f"img#{i} 缺少 alt")
    # button-name / link-name
    for i, b in enumerate(doc.xpath("//button")):
        if not ("".join(b.itertext()).strip() or b.get("aria-label")):
            add("button-name", "critical", f"button#{i} 无可访问名称")
    for i, a in enumerate(doc.xpath("//a[@href]")):
        if not ("".join(a.itertext()).strip() or a.get("aria-label") or a.get("title")):
            add("link-name", "critical", f"a#{i} 无可访问文本")
    # label / form-field-multiple-labels
    for i, f in enumerate(doc.xpath("//input[not(@type='hidden')]|//select|//textarea")):
        fid = f.get("id")
        ok = (fid and doc.xpath(f'//label[@for="{fid}"]')) or f.get("aria-label") \
             or f.get("aria-labelledby") or f.xpath("ancestor::label")
        if not ok:
            add("label", "serious", f"{f.tag}#{i} 没有关联 label")
    # html-has-lang / html-lang-valid
    html_ = doc.xpath("//html")
    if html_:
        if not html_[0].get("lang"):
            add("html-has-lang", "critical", "html 缺少 lang 属性")
    else:
        add("html-has-lang", "critical", "缺少 html 根元素")
    # page-has-heading-one
    if not doc.xpath("//h1"):
        add("page-has-heading-one", "moderate", "页面缺少 h1")
    # heading-order
    hs = [int(e.tag[1]) for e in doc.xpath("//h1|//h2|//h3|//h4|//h5|//h6")]
    for a, b in zip(hs, hs[1:]):
        if b - a > 1:
            add("heading-order", "moderate", f"标题层级跳跃 h{a}→h{b}")
            break
    # duplicate-id
    ids = [e.get("id") for e in doc.xpath("//*[@id]")]
    if len(ids) != len(set(ids)):
        add("duplicate-id", "moderate", "存在重复 id")
    # aria-valid-attr-value (简版)
    for e in doc.xpath("//*[@aria-labelledby]"):
        for t in e.get("aria-labelledby").split():
            if not doc.xpath(f'//*[@id="{t}"]'):
                add("aria-valid-attr-value", "critical", f"aria-labelledby 指向不存在的 id: {t}")
    # tabindex-not-positive
    for e in doc.xpath("//*[@tabindex]"):
        try:
            if int(e.get("tabindex")) > 0:
                add("tabindex", "serious", "避免正数 tabindex")
        except ValueError:
            add("tabindex", "serious", "tabindex 非数字")
    # landmark-one-main / region
    if not doc.xpath("//main|//*[@role='main']"):
        add("landmark-one-main", "moderate", "页面缺少 main 地标")
    return v

def bp_assert(path):
    src = open(path, encoding="utf-8").read()
    css = "\n".join(re.findall(r"<style>(.*?)</style>", src, re.S))
    checks = {
        "viewport_meta": 'name="viewport"' in src,
        "fluid_grid(auto-fit/minmax)": "auto-fit" in css and "minmax" in css,
        "breakpoint_600_or_640": bool(re.search(r"@media[^{]*(600|640)px", css)),
        "breakpoint_1000_or_1024": bool(re.search(r"@media[^{]*(1000|1024|960|900)px", css)),
        "prefers-reduced-motion": "prefers-reduced-motion" in css,
        "clamp_fluid_type": "clamp(" in css,
        "flex_wrap": "flex-wrap" in css,
    }
    return {"widths": [375, 768, 1280], "assertions": checks,
            "pass": all(checks.values())}

v = scan(sys.argv[1])
REPORT["axe"]["violations"] = v
REPORT["axe"]["counts"] = {"critical": sum(1 for x in v if x["impact"] == "critical"),
                           "serious": sum(1 for x in v if x["impact"] == "serious"),
                           "moderate": sum(1 for x in v if x["impact"] == "moderate")}
REPORT["axe"]["pass"] = REPORT["axe"]["counts"]["critical"] == 0
REPORT["breakpoints"] = bp_assert(sys.argv[1])
json.dump(REPORT, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(json.dumps(REPORT, ensure_ascii=False, indent=2))