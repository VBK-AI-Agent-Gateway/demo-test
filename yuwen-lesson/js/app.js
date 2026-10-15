// ===== 交互层 =====
window.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function toast(m) { const t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(t._x); t._x = setTimeout(() => t.style.display = "none", 2400); }
window.toast = toast;

// 分段选择
function segBind(sel, cb) {
  $(sel).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$(sel + " button").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); cb(b);
  });
}
let curType = "新授课", curBook = "上册";

function fillTargets() {
  const sel = $("#sel-target");
  if (curBook === "__topic__") {
    sel.innerHTML = YW_DATA.topics.map(t => `<option value="${window.esc(t.name)}">${window.esc(t.cat)} · ${window.esc(t.name)}</option>`).join("");
    $("#row-text").querySelector("label").innerHTML = '中考专题 <span class="req">（从库中选，避免编造）</span>';
    $("#target-meta").textContent = "复习课建议：先考点精讲，再真题演练，最后错因复盘。";
  } else {
    const list = YW_DATA.texts[curBook] || [];
    sel.innerHTML = list.map(t => `<option value="${window.esc(t.name)}">${window.esc(t.name)}（${t.type}）</option>`).join("");
    $("#row-text").querySelector("label").innerHTML = `课文 <span class="req">（部编版九年级${curBook}，从库中选）</span>`;
    const info = list[0];
    $("#target-meta").textContent = info ? `首篇：${info.name}（${info.type}·${info.author}）` : "";
  }
  syncMeta();
}
function syncMeta() {
  if (curBook === "__topic__") {
    const t = YW_DATA.topics.find(x => x.name === $("#sel-target").value);
    if (t) $("#target-meta").textContent = t.focus;
  } else {
    const info = (YW_DATA.texts[curBook] || []).find(x => x.name === $("#sel-target").value);
    if (info) $("#target-meta").textContent = `${info.type} · ${info.author} ｜ 建议课型：${info.type === "文言文" ? "文言新授课(2课时)" : "新授课"}`;
  }
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
    withChain: $("#ck-chain").checked,
    withExam: $("#ck-exam").checked,
    withDrill: $("#ck-drill").checked,
    withLayer: $("#ck-layer").checked,
    withFw: $("#ck-fy").checked,
    withXd: $("#ck-xd").checked,
    withZw: $("#ck-zw").checked
  };
}

let last = null;
$("#btn-gen").onclick = () => {
  const cfg = readCfg();
  if (!cfg.target) { toast("请选择课文或专题"); return; }
  const out = YWGen.gen(cfg);
  last = { cfg, out };
  $("#out-title").textContent = `教案预览：《${out.title}》`;
  $("#lesson").innerHTML = `<div class="idea" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:9px;padding:11px 15px;margin-bottom:16px;font-size:14.6px"><b style="color:var(--brand2)">💡 设计思路（一句话）：</b>${window.esc(out.idea)}</div>` + out.html;
  saveHistory(cfg, out);
  toast("✅ 教案已生成（11 板块完整）");
  $("#lesson").scrollIntoView({ behavior: "smooth", block: "start" });
};

// 复制纯文本（可直接进 Word）
$("#btn-copy").onclick = async () => {
  if (!last) { toast("请先生成教案"); return; }
  try {
    await navigator.clipboard.writeText(last.out.text);
    toast("📋 已复制纯文本，可直接粘贴进 Word");
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = last.out.text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    toast("📋 已复制（兼容模式）");
  }
};
// 导出 Markdown
$("#btn-md").onclick = () => {
  if (!last) { toast("请先生成教案"); return; }
  const mdText = "# " + last.out.text.replace(/^《(.+)》教案/m, "# 《$1》教案");
  const blob = new Blob([mdText], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `教案_${last.out.title}.md`;
  a.click(); URL.revokeObjectURL(a.href);
  toast("⬇ Markdown 已导出");
};
$("#btn-print").onclick = () => {
  if (!last) { toast("请先生成教案"); return; }
  const w = window.open("", "_blank");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${last.out.title} 教案</title>
    <style>body{font-family:"SimSun",serif;line-height:1.9;padding:30px;max-width:860px;margin:auto;font-size:15px}
    .sec{margin:18px 0}.sec>.h{font-weight:bold;font-size:16px;display:block;margin-bottom:8px;color:#9a3412}
    .goal,.rd,.env,.exam-map,.paradigm,.reflect,.drill,.ans-box,.translate,.vocab .vi{border:1px solid #ddd;border-radius:6px;padding:8px 12px;margin-bottom:8px}
    .board{background:#111;color:#eee;padding:16px;font-family:sans-serif;white-space:pre-wrap}
    .time{color:#0f766e;font-size:12px}.kv{display:grid;grid-template-columns:90px 1fr;gap:4px 10px}
    h1{text-align:center}.subtitle{text-align:center;color:#888}</style>
    <body>${last.out.html}</body>`);
  w.document.close(); w.focus();
  setTimeout(() => w.print(), 300);
  toast("🖨 已打开打印窗口");
};

// 历史（localStorage）
function histLoad() { try { return JSON.parse(localStorage.getItem("yw_hist_v1")) || []; } catch (e) { return []; } }
function saveHistory(cfg, out) {
  const h = histLoad();
  h.unshift({ title: out.title, subtitle: out.subtitle, time: Date.now(), cfg, text: out.text, html: out.html, idea: out.idea });
  try { localStorage.setItem("yw_hist_v1", JSON.stringify(h.slice(0, 30))); } catch (e) {}
}
$("#btn-history").onclick = () => {
  const h = histLoad();
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>🕘 历史教案（${h.length}）</h3>
    ${h.length ? h.map((x, i) => `<div class="hist-i" onclick="loadHist(${i})"><div class="ht">《${window.esc(x.title)}》</div><div class="hm">${window.esc(x.subtitle)} ｜ ${new Date(x.time).toLocaleString("zh-CN")}</div></div>`).join("") : '<div class="empty" style="padding:30px">暂无历史，生成后自动保存。</div>'}`;
  $("#mask").style.display = "flex";
};
window.loadHist = i => {
  const x = histLoad()[i]; if (!x) return;
  last = { cfg: x.cfg, out: { title: x.title, subtitle: x.subtitle, text: x.text, html: x.html, idea: x.idea, cat: "记叙文" } };
  $("#out-title").textContent = `教案预览：《${x.title}》`;
  $("#lesson").innerHTML = `<div class="idea" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:9px;padding:11px 15px;margin-bottom:16px;font-size:14.6px"><b style="color:var(--brand2)">💡 设计思路：</b>${window.esc(x.idea)}</div>` + x.html;
  $("#mask").style.display = "none";
  toast("已载入历史教案");
};

$("#btn-help").onclick = () => {
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>❓ 使用说明（备课组长）</h3>
    <div class="help-li">① 选课型（新授/复习/讲评）＋ 学期（九上/九下/中考专题）＋ 课文或专题，从内置库中选，避免编造课文。</div>
    <div class="help-li">② 填课时数（共X课时/本课第X课时），可勾选附件：提问链、中考考点、当堂小练、分层作业、文言实虚词、现代文范式、作文专项。</div>
    <div class="help-li">③ 点「生成完整教案」，输出固定 11 板块：课题/课时/课型/四素养目标/重难点/学情/准备/七环节教学过程（含时间与小练答案）/板书/反思预设/配套附件。</div>
    <div class="help-li">④ 「复制到 Word」复制纯文本直接粘贴；「导出 Markdown」生成 .md；「打印」生成打印版。历史教案保存在本机。</div>
    <div class="help-li">⑤ 约束：不超纲、务实落地、分层设计（学困生抓基础 / 中等生练规范 / 优等生深探究），全程中考导向。</div>
    <div style="text-align:right;margin-top:14px"><button class="btn primary" onclick="document.getElementById('mask').style.display='none'">知道了</button></div>`;
  $("#mask").style.display = "flex";
};
$("#mask").addEventListener("click", e => { if (e.target.id === "mask") e.target.style.display = "none"; });

// 初始化
fillTargets();
syncMeta();