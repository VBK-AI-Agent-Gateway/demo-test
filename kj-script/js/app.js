// ===== 交互层 =====
window.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function toast(m) { const t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(t._x); t._x = setTimeout(() => t.style.display = "none", 2400); }
window.toast = toast;

let curType = "新授课", curBook = "上册";

function segBind(sel, cb) {
  $(sel).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$(sel + " button").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); cb(b);
  });
}

function fillTargets() {
  const sel = $("#sel-target");
  if (curBook === "__topic__") {
    // 中考专题列表（与教案生成器一致的13个）
    const topics = ["现代文阅读·记叙文","现代文阅读·说明文","现代文阅读·议论文","文言文阅读·课内对比","文言文阅读·课外浅易","古诗词鉴赏","名著阅读","语言积累与运用","作文·审题立意","作文·结构与素材","作文·记叙文写作","非连续性文本阅读","综合实践与探究"];
    sel.innerHTML = topics.map(t => `<option value="${window.esc(t)}">${window.esc(t)}</option>`).join("");
    $("#lb-target").innerHTML = '中考专题 <span class="req">（从库中选，避免编造）</span>';
    $("#target-meta").textContent = "复习课建议结构：考情分析→考点精讲→方法总结→变式演练（已自动加入）。";
  } else {
    const list = KJ_DATA.texts[curBook] || [];
    sel.innerHTML = list.map(t => `<option value="${window.esc(t.name)}">${window.esc(t.name)}（${t.type}）</option>`).join("");
    $("#lb-target").innerHTML = `课文 <span class="req">（部编版九年级${curBook}，从库中选）</span>`;
    syncMeta();
  }
}
function syncMeta() {
  if (curBook === "__topic__") { $("#target-meta").textContent = "复习课结构自动含考情分析与方法总结。"; return; }
  const info = (KJ_DATA.texts[curBook] || []).find(x => x.name === $("#sel-target").value);
  if (info) $("#target-meta").textContent = `${info.type} · ${info.author} ｜ 结构：通用框架${info.type === "文言文" ? "＋字词积累" : ""}`;
}

segBind("#seg-type", b => { curType = b.dataset.t; toast("课型：" + curType); });
segBind("#seg-book", b => { curBook = b.dataset.b; fillTargets(); });
$("#sel-target").addEventListener("change", syncMeta);

function readCfg() {
  const total = Math.max(1, +$("#in-total").value || 1);
  const cur = Math.min(total, Math.max(1, +$("#in-cur").value || 1));
  return {
    lessonType: curType,
    kind: curBook === "__topic__" ? "topic" : "text",
    book: curBook === "__topic__" ? "上册" : curBook,
    target: $("#sel-target").value,
    total, cur,
    note: $("#in-note").value,
    withVideo: $("#ck-video").checked,
    withGame: $("#ck-game").checked,
    withTask: $("#ck-task").checked
  };
}

let last = null;
$("#btn-gen").onclick = () => {
  const cfg = readCfg();
  if (!cfg.target) { toast("请选择课文或专题"); return; }
  const out = KJGen.gen(cfg);
  last = { cfg, out };
  $("#out-title").textContent = `脚本预览：《${out.title}》`;
  $("#idea-line").style.display = "block";
  $("#idea-line").innerHTML = `<b>💡 整体设计思路：</b>${out.idea}`;
  $("#script").innerHTML = out.html;
  saveHistory(cfg, out);
  toast(`✅ 已生成 ${out.pages.length} 页脚本${out.mods.length ? "＋" + out.mods.length + "个附加模块" : ""}`);
  $("#script").scrollIntoView({ behavior: "smooth", block: "start" });
};

$("#btn-copy").onclick = async () => {
  if (!last) { toast("请先生成脚本"); return; }
  try { await navigator.clipboard.writeText(last.out.text); toast("📋 已复制纯文本，可粘贴进 Word"); }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = last.out.text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove(); toast("📋 已复制（兼容模式）");
  }
};
$("#btn-md").onclick = () => {
  if (!last) { toast("请先生成脚本"); return; }
  const md = "# 《" + last.out.title + "》课件脚本\n\n" + last.out.text.replace(/^《.+》课件脚本（PPT逐页）$/m, "");
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `课件脚本_${last.out.title}.md`;
  a.click(); URL.revokeObjectURL(a.href);
  toast("⬇ Markdown 已导出");
};
$("#btn-print").onclick = () => {
  if (!last) { toast("请先生成脚本"); return; }
  const w = window.open("", "_blank");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${last.out.title} 课件脚本</title>
    <style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.8;padding:30px;max-width:900px;margin:auto;font-size:14px}
    .pg{border:1px solid #ccc;border-radius:8px;margin-bottom:14px;overflow:hidden;page-break-inside:avoid}
    .pg-h{background:#1d4ed8;color:#fff;padding:8px 14px;font-weight:bold}
    .pg-b{padding:12px 16px}.fd{margin-bottom:8px}
    .fd .lb{font-weight:bold;color:#1d4ed8}.fd.note .val{background:#fffbeb;padding:6px 10px;display:block}
    .mod-sec{border:1px solid #999;margin-bottom:14px;page-break-inside:avoid}
    .mod-h{background:#7c3aed;color:#fff;padding:8px 14px;font-weight:bold}
    .mod-b{padding:12px 16px}table.vt{width:100%;border-collapse:collapse;font-size:12.5px}
    table.vt td,table.vt th{border:1px solid #bbb;padding:6px;text-align:left}
    .sheet{border:2px dashed #1d4ed8;padding:14px}.sheet .sh{text-align:center;font-weight:bold}
    .rec{border:1px solid #ccc;padding:8px;min-height:44px;color:#999}</style>
    <body>${last.out.html}</body>`);
  w.document.close(); w.focus();
  setTimeout(() => w.print(), 300);
  toast("🖨 已打开打印窗口");
};

// 历史
function histLoad() { try { return JSON.parse(localStorage.getItem("kj_hist_v1")) || []; } catch (e) { return []; } }
function saveHistory(cfg, out) {
  const h = histLoad();
  h.unshift({ title: out.title, subtitle: out.subtitle, time: Date.now(), cfg, text: out.text, html: out.html, idea: out.idea });
  try { localStorage.setItem("kj_hist_v1", JSON.stringify(h.slice(0, 30))); } catch (e) {}
}
$("#btn-history").onclick = () => {
  const h = histLoad();
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>🕘 历史脚本（${h.length}）</h3>
    ${h.length ? h.map((x, i) => `<div class="hist-i" onclick="loadHist(${i})"><div class="ht">《${window.esc(x.title)}》</div><div class="hm">${window.esc(x.subtitle)} ｜ ${new Date(x.time).toLocaleString("zh-CN")}</div></div>`).join("") : '<div style="padding:30px;text-align:center;color:var(--muted)">暂无历史</div>'}`;
  $("#mask").style.display = "flex";
};
window.loadHist = i => {
  const x = histLoad()[i]; if (!x) return;
  last = { cfg: x.cfg, out: { title: x.title, subtitle: x.subtitle, text: x.text, html: x.html, idea: x.idea, pages: [], mods: [] } };
  $("#out-title").textContent = `脚本预览：《${x.title}》`;
  $("#idea-line").style.display = "block";
  $("#idea-line").innerHTML = `<b>💡 整体设计思路：</b>${x.idea}`;
  $("#script").innerHTML = x.html;
  $("#mask").style.display = "none";
  toast("已载入历史脚本");
};

$("#btn-help").onclick = () => {
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>❓ 使用说明</h3>
    <div class="help-li">① 输入：选课型（新授/复习/讲评）＋学期＋课文或专题（内置库防编造），填课时。</div>
    <div class="help-li">② PPT结构自动生成：通用十段框架（封面→…→封底），复习课自动加【考情分析】【方法总结】，试卷讲评课用诊断订正版，文言文自动加【字词积累】。</div>
    <div class="help-li">③ 每页固定四要素：页面文案（精简大标题＋要点）、配图建议（AI绘图/搜图关键词，标注可选）、动画提示（简单出现/擦除，标点击触发）、备注（教师口头提示，不上PPT）。</div>
    <div class="help-li">④ 附加模块按需勾选：🎥课堂短视频脚本（镜号/时长/画面/台词/拍摄）、🎮课堂小游戏（规则/步骤/评价，≤5分钟）、📄小组任务单（可打印）。</div>
    <div class="help-li">⑤ 「复制到 Word」出纯文本；「导出 Markdown」出 .md；「打印」出打印版。历史保存在本机。</div>
    <div class="help-li">⑥ 禁止项已内置：不整篇课文粘贴、动画只用简单三类、不超纲、活动务实不花哨。</div>
    <div style="text-align:right;margin-top:14px"><button class="btn primary" onclick="document.getElementById('mask').style.display='none'">知道了</button></div>`;
  $("#mask").style.display = "flex";
};
$("#mask").addEventListener("click", e => { if (e.target.id === "mask") e.target.style.display = "none"; });

// 初始化
fillTargets();