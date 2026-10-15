// ===== 交互层 =====
window.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function toast(m) { const t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(t._x); t._x = setTimeout(() => t.style.display = "none", 2400); }
window.toast = toast;

let scene = "teacher";
let level = "中等生";
let sess = null;
let lastOut = null; // {html, text, title}

// 场景切换
$$(".scene-sw button").forEach(b => b.onclick = () => {
  $$(".scene-sw button").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  scene = b.dataset.s;
  $("#pane-teacher").style.display = scene === "teacher" ? "block" : "none";
  $("#pane-student").style.display = scene === "student" ? "block" : "none";
  $("#out-title").textContent = scene === "teacher" ? "分层材料预览" : "一对一答疑（启发式）";
  $("#warn-strip").innerHTML = scene === "teacher"
    ? '📌 材料 <b>AI仅辅助</b>：供老师审核后使用；练习答案置末尾，请学生独立完成后再看。'
    : '📌 答疑 <b>AI只引导不给答案</b>：分层提问、多次卡住才分步提示；疑问点自动记录供老师查阅。';
  if (scene === "student" && !sess) initSess();
});

// 层次切换（老师端）
$("#seg-level").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#seg-level button").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); level = b.dataset.l; showLevelMeta();
});
function showLevelMeta() {
  const L = PT_DATA.levels[level];
  $("#level-meta").innerHTML = `<b>${L.icon} ${level}</b>：${L.traits}<br>输出要求：${L.reqs.slice(0, 3).join("；")}…`;
}
showLevelMeta();

// 知识点下拉
function fillTopics() {
  const sel = $("#sel-topic");
  let h = "";
  PT_DATA.topics.forEach(t => {
    h += `<optgroup label="${window.esc(t.k)}">`;
    t.sub.forEach(s => h += `<option value="${window.esc(s)}">${window.esc(t.k)} · ${window.esc(s)}</option>`);
    h += `</optgroup>`;
  });
  sel.innerHTML = h;
}
fillTopics();

// ===== 老师端：生成材料 =====
$("#btn-gen").onclick = () => {
  const topic = $("#sel-topic").value;
  const opts = {
    micro: $("#ck-micro").checked, prac: $("#ck-prac").checked,
    tpl: $("#ck-tpl").checked, task: $("#ck-task").checked, check: $("#ck-check").checked
  };
  if (!opts.micro && !opts.prac && !opts.tpl && !opts.task && !opts.check) { toast("至少勾选一种材料类型"); return; }
  const note = $("#in-note").value.trim();
  const out = PTE.genMaterial(level, topic, opts, note);
  lastOut = { ...out, title: `分层材料_${level}_${topic}` };
  $("#out-title").textContent = `分层材料：${topic}（${level}）`;
  $("#output").innerHTML = out.html;
  saveHist("material", `${level}·${topic}`, out.text);
  toast(`✅ 已生成【${level}】分层材料`);
  $("#output").scrollIntoView({ behavior: "smooth", block: "start" });
};

// ===== 学生端：答疑 =====
function initSess() {
  const lv = $("#seg-slevel button.active").dataset.l;
  sess = PTE.newSession(lv, "");
  renderChat();
}
$("#seg-slevel").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#seg-slevel button").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  if (sess) { sess.level = b.dataset.l; }
  else initSess();
  updateSMeta();
});
function updateSMeta() {
  if (!sess) return;
  $("#s-meta").innerHTML = `当前层次：${sess.level} ｜ 阶段：${sess.stage >= 3 ? "深度引导" : "第" + sess.stage + "阶"} ｜ 薄弱点初判：<b>${sess.weak || "待归类"}</b>`;
}

$("#btn-ask").onclick = () => {
  const q = $("#in-q").value.trim();
  if (!q) { toast("先写下你的问题"); return; }
  if (!sess || !sess.question) {
    sess = PTE.newSession($("#seg-slevel button.active").dataset.l, q);
    PTE.ask(sess);
    $("#in-q").value = "";
  } else {
    // 追问：视为新疑问记录
    sess.log.push({ who: "u", text: q });
    PTE.moreHint(sess);
    $("#in-q").value = "";
  }
  renderChat(); updateSMeta(); saveHist("qa", sess.weak || "答疑", PTE.exportLog(sess));
  $("#output").scrollTop = $("#output").scrollHeight;
};

$("#btn-hint").onclick = () => {
  if (!sess || !sess.question) { toast("先提交你的问题"); return; }
  PTE.moreHint(sess); renderChat(); updateSMeta();
};
$("#btn-stuck").onclick = () => {
  if (!sess || !sess.question) { toast("先提交你的问题"); return; }
  sess.tries = 3; PTE.moreHint(sess); renderChat(); updateSMeta();
  toast("已进入‘多次卡住’模式：指出误区方向，仍不直接给答案");
};
$("#btn-concept").onclick = () => {
  if (!sess) { toast("先提交你的问题"); return; }
  PTE.concept(sess); renderChat(); updateSMeta();
};
$("#btn-reset").onclick = () => {
  sess = PTE.reset(sess, $("#seg-slevel button.active").dataset.l);
  renderChat(); updateSMeta(); toast("已换题，等你贴新问题");
};
$("#btn-outscope").onclick = () => {
  if (!sess) { toast("先提交你的问题"); return; }
  PTE.outOfScope(sess); renderChat();
};
$("#btn-show-answers").onclick = () => {
  if (scene === "teacher") { toast("老师端请在材料末尾的‘参考答案’区查看"); return; }
  if (!sess || !sess.question) { toast("先提交你的问题"); return; }
  sess.log.push({ who: "ai", stage: "答案", text: "你已主动请求核对。为遵守‘不直接给完整答案’规则，完整解答请对照：①微课/模板对应步骤 ②请老师在课堂讲评核对。我先给你最后一小步自检清单：公式用对了吗？单位带了吗？结论有前提吗？（如需完整答案，请老师在答疑记录里查看标准解法）" });
  renderChat();
  toast("答案核对请求已记录，供老师讲评");
};

function renderChat() {
  if (!sess) return;
  let h = `<div class="chatbox">`;
  sess.log.forEach(m => {
    if (m.who === "u") h += `<div class="msg u"><div class="av">我</div><div class="bub">${window.esc(m.text)}</div></div>`;
    else {
      const stag = m.stage === 1 ? '<span class="stag">引导·阶段1</span>'
        : m.stage === 2 ? '<span class="stag s2">一小步提示·阶段2</span>'
        : m.stage === 3 ? '<span class="stag s3">误区辨析·阶段3</span>'
        : `<span class="stag ${m.oos ? "oos" : "s2"}">${window.esc(String(m.stage))}</span>`;
      h += `<div class="msg ai"><div class="av">🔭</div><div class="bub">${stag}<div>${window.esc(m.text)}</div>`
        + (m.concept ? `<div class="concep">🤔 ${window.esc(m.concept)}</div>` : "")
        + (m.note ? `<div class="warn-note">${window.esc(m.note)}</div>` : "")
        + `</div></div>`;
    }
  });
  // 疑问点面板
  if (sess.question) {
    h += `<div class="qlog"><h5>📝 疑问点记录（自动·供老师查看）</h5>
      <ul><li>问题：${window.esc(sess.question.slice(0, 120))}</li>
      <li>涉及知识点：${window.esc(sess.topic || "待归类")}</li>
      <li>错因初判：${window.esc(sess.weak || "待归类")}</li>
      <li>当前阶段：${sess.stage >= 3 ? "多次卡住，建议老师介入" : "引导中（第" + sess.stage + "阶）"}</li></ul></div>`;
  }
  h += `</div>`;
  $("#output").innerHTML = h;
  updateSMeta();
}

// 复制/导出/打印
function flatText() {
  if (!lastOut) return "";
  return lastOut.text;
}
$("#btn-copy").onclick = async () => {
  if (scene === "student") {
    if (!sess || !sess.question) { toast("暂无可复制的答疑记录"); return; }
    const t = PTE.exportLog(sess);
    try { await navigator.clipboard.writeText(t); toast("📋 答疑记录已复制（供老师查阅）"); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast("📋 已复制"); }
    return;
  }
  if (!lastOut) { toast("请先生成材料"); return; }
  try { await navigator.clipboard.writeText(lastOut.text); toast("📋 已复制，可粘贴进 Word"); }
  catch (e) { const ta = document.createElement("textarea"); ta.value = lastOut.text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast("📋 已复制"); }
};
$("#btn-md").onclick = () => {
  const t = scene === "student" ? (sess && sess.question ? PTE.exportLog(sess) : "") : (lastOut ? lastOut.text : "");
  if (!t) { toast("暂无可导出内容"); return; }
  const blob = new Blob([t], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (scene === "student" ? "答疑记录" : lastOut.title) + ".md";
  a.click(); URL.revokeObjectURL(a.href);
  toast("⬇ 已导出");
};
$("#btn-print").onclick = () => {
  const w = window.open("", "_blank");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>物理辅导</title>
    <style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.8;padding:26px;max-width:900px;margin:auto;font-size:14px}
    .mat{border:1px solid #999;margin-bottom:14px;page-break-inside:avoid}.mat-h{background:#0e7490;color:#fff;padding:8px 14px;font-weight:bold}
    .prac,.tpl,.ans-box,.sheet,.qlog{border:1px solid #bbb;padding:9px 13px;margin:8px 0}
    .bub{border:1px solid #ccc;padding:8px 12px;margin:6px 0}.check-l li{list-style:none}</style>
    <body>${$("#output").innerHTML}</body>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  toast("🖨 已打开打印窗口");
};

// 历史
function histLoad() { try { return JSON.parse(localStorage.getItem("pt_hist_v1")) || []; } catch (e) { return []; } }
function saveHist(kind, title, text) {
  const h = histLoad();
  h.unshift({ kind, title, time: Date.now(), text });
  try { localStorage.setItem("pt_hist_v1", JSON.stringify(h.slice(0, 30))); } catch (e) {}
}
$("#btn-log").onclick = () => {
  const h = histLoad();
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>📝 历史记录（材料/答疑·${h.length}）</h3>
    ${h.length ? h.map((x, i) => `<div class="log-i"><div class="lt">${x.kind === "qa" ? "🧑‍🎓 答疑" : "👩‍🏫 材料"}：${window.esc(x.title)}</div>
      <div class="lm">${new Date(x.time).toLocaleString("zh-CN")}</div>
      <div style="display:flex;gap:8px;margin-top:7px"><button class="btn small" onclick="showLog(${i})">查看</button></div>
      <div id="logbody-${i}" style="display:none;margin-top:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px;font-size:13.4px;white-space:pre-wrap;max-height:280px;overflow:auto">${window.esc(x.text)}</div></div>`).join("") : '<div style="padding:30px;text-align:center;color:var(--muted)">暂无记录</div>'}`;
  $("#mask").style.display = "flex";
};
window.showLog = i => { const el = document.getElementById("logbody-" + i); if (el) el.style.display = el.style.display === "none" ? "block" : "none"; };

// 帮助
$("#btn-help").onclick = () => {
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>❓ 使用说明</h3>
    <div class="help-li">① 双场景：<b>老师端</b>选层次（学困/中等/优等）+知识点+材料类型，生成分层微课/阶梯练习/答题模板/探究任务单/自查清单，答案置末尾。</div>
    <div class="help-li">② <b>学生端</b>：贴出问题后AI<b>只引导不给答案</b>——阶段1方向提问（考哪个公式/已知量），阶段2给一小步线索，阶段3（多次卡住）才指出误区方向，仍不给完整答案。</div>
    <div class="help-li">③ 概念疑问：温和指出误区→引导对比课本定义辨析；超纲/争议自动标注【建议物理老师线下讲解】；情绪问题提示联系班主任/老师，不做心理诊断。</div>
    <div class="help-li">④ 自动记录【疑问点】（问题/知识点/错因/阶段），在对话下方与「答疑记录」中供老师查阅。</div>
    <div class="help-li">⑤ 硬约束：不超纲（不引入高中公式）、不直接给完整答案、AI仅辅助教师把关。</div>
    <div style="text-align:right;margin-top:14px"><button class="btn primary" onclick="document.getElementById('mask').style.display='none'">知道了</button></div>`;
  $("#mask").style.display = "flex";
};
$("#mask").addEventListener("click", e => { if (e.target.id === "mask") e.target.style.display = "none"; });

// 初始化老师端
showLevelMeta();