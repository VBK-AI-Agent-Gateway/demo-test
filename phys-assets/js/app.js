// ===== 交互层 =====
window.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function toast(m) { const t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(t._x); t._x = setTimeout(() => t.style.display = "none", 2400); }
window.toast = toast;

let kind = "新授课", level = "中等生";

// 课型
$("#seg-kind").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#seg-kind button").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); kind = b.dataset.k;
});
// 层次
$("#seg-level").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#seg-level button").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); level = b.dataset.l; showLevelMeta();
});
function showLevelMeta() {
  $("#level-meta").innerHTML = PA_DATA.levelNote[level === "学困生" ? "low" : level === "优等生" ? "high" : "mid"];
}
showLevelMeta();

// 课题下拉
function fillTopics() {
  const sel = $("#sel-topic");
  let h = "";
  PA_DATA.topics.forEach(t => {
    h += `<optgroup label="${window.esc(t.k)}">`;
    t.sub.forEach(s => h += `<option value="${window.esc(s)}">${window.esc(t.k)} · ${window.esc(s)}</option>`);
    h += `</optgroup>`;
  });
  sel.innerHTML = h;
}
fillTopics();

// 7类素材勾选
function fillTypes() {
  $("#ck-types").innerHTML = PA_DATA.types.map(t =>
    `<label><input type="checkbox" value="${t.k}" ${["story", "demo", "chain"].includes(t.k) ? "checked" : ""}>
      <span>${t.icon} <b>${t.name}</b><span class="ckd">${t.desc}</span></span></label>`).join("");
}
fillTypes();

// 生成
let lastGen = null;
$("#btn-gen").onclick = () => {
  const topic = $("#in-custom").value.trim() || $("#sel-topic").value;
  const types = $$("#ck-types input:checked").map(x => x.value);
  if (!topic) { toast("请选择或输入课题"); return; }
  if (!types.length) { toast("至少勾选1类素材"); return; }
  const plan = $("#in-plan").value.trim();
  const out = PAG.gen(topic, kind, level, types, plan);
  lastGen = out;
  window.__lastGen = out;
  $("#out-title").textContent = `课堂素材：${topic}（${kind}·${level}）`;
  $("#output").innerHTML = out.html;
  saveHist("素材", `${topic}·${kind}·${level}`, out.text);
  toast(`✅ 已生成 ${types.length} 类课堂素材`);
  $("#output").scrollIntoView({ behavior: "smooth", block: "start" });
};

// 复制全部
$("#btn-copy").onclick = async () => {
  if (!lastGen) { toast("请先生成素材"); return; }
  try { await navigator.clipboard.writeText(lastGen.text); toast("📋 已复制全部素材，可粘贴进PPT/学案"); }
  catch (e) { const ta = document.createElement("textarea"); ta.value = lastGen.text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast("📋 已复制"); }
};
// 导出
$("#btn-md").onclick = () => {
  if (!lastGen) { toast("请先生成素材"); return; }
  const blob = new Blob([lastGen.text], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = lastGen.title + ".md";
  a.click(); URL.revokeObjectURL(a.href);
  toast("⬇ 已导出 Markdown");
};
// 打印
$("#btn-print").onclick = () => {
  const w = window.open("", "_blank");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>课堂素材</title>
    <style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.8;padding:26px;max-width:900px;margin:auto;font-size:14px}
    .mat{border:1px solid #999;margin-bottom:14px;page-break-inside:avoid}.mat-h{background:#b45309;color:#fff;padding:8px 14px;font-weight:bold}
    .story,.hist,.compress,.chain-i,.demo-tbl{border:1px solid #bbb;padding:9px 13px;margin:8px 0}
    .demo-tbl{border-collapse:collapse;width:100%}.demo-tbl td{border:1px solid #999;padding:7px 10px}
    .board{background:#222;color:#eee;padding:14px;white-space:pre-wrap}.mind{border:1px solid #ccc;padding:10px;white-space:pre-wrap}
    .idea{background:#fff7ed;border:1px solid #fed7aa;padding:9px 13px}.safe{background:#f0fdf4;border:1px solid #bbf7d0;padding:7px 11px}</style>
    <body>${$("#output").innerHTML}</body>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  toast("🖨 已打开打印窗口");
};

// 历史
function histLoad() { try { return JSON.parse(localStorage.getItem("pa_hist_v1")) || []; } catch (e) { return []; } }
function saveHist(kind, title, text) {
  const h = histLoad();
  h.unshift({ title, time: Date.now(), text, kind: "素材" });
  try { localStorage.setItem("pa_hist_v1", JSON.stringify(h.slice(0, 30))); } catch (e) {}
}
$("#btn-history").onclick = () => {
  const h = histLoad();
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>🕘 生成历史（${h.length}）</h3>
    ${h.length ? h.map((x, i) => `<div class="hist-i" onclick="loadHist(${i})">
      <div class="ht">🧰 ${window.esc(x.title)}</div>
      <div class="hm">${new Date(x.time).toLocaleString("zh-CN")} · 点击查看</div>
      <div id="hb-${i}" style="display:none;margin-top:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px;font-size:13.3px;white-space:pre-wrap;max-height:260px;overflow:auto">${window.esc(x.text)}</div></div>`).join("") : '<div style="padding:30px;text-align:center;color:var(--muted)">暂无历史记录</div>'}`;
  $("#mask").style.display = "flex";
};
window.loadHist = i => { const el = document.getElementById("hb-" + i); if (el) el.style.display = el.style.display === "none" ? "block" : "none"; };

// 帮助
$("#btn-help").onclick = () => {
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>❓ 使用说明</h3>
    <div class="help-li">① 7类素材按需勾选：导入故事、趣味演示、物理学史、板书、思维导图、问题链、长文本压缩；只指定课题未选素材时可先勾选。</div>
    <div class="help-li">② 每个模块开头一句话说明设计思路（适配哪个教学环节）；导入故事100–300字；素材分模块可单块复制。</div>
    <div class="help-li">③ 粘贴教案/重难点后，素材对齐教学目标；不超纲、演示安全（无高温高压易燃）、物理学史不编造。</div>
    <div class="help-li">④ 素材标注学困/中等/优等适配层次，可选课型（新授/复习/实验）。</div>
    <div class="help-li">⑤ AI仅辅助：<b>所有素材由教师审核科学性与课堂适配性后使用</b>。</div>
    <div style="text-align:right;margin-top:14px"><button class="btn primary" onclick="document.getElementById('mask').style.display='none'">知道了</button></div>`;
  $("#mask").style.display = "flex";
};
$("#mask").addEventListener("click", e => { if (e.target.id === "mask") e.target.style.display = "none"; });