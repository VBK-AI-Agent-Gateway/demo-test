// ===== 交互层 =====
window.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function toast(m) { const t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(t._x); t._x = setTimeout(() => t.style.display = "none", 2400); }
window.toast = toast;

let mode = "single";

// 模式切换
$("#seg-mode").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#seg-mode button").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  mode = b.dataset.m;
  $("#row-batch").style.display = mode === "batch" ? "block" : "none";
  $("#row-stu").style.display = mode === "single" ? "block" : "none";
});

// 示例
$("#btn-demo").onclick = () => {
  $("#in-answer").value = PG_DATA.demo.answer;
  $("#in-student").value = PG_DATA.demo.student;
  $("#in-stu").value = "示例：九(3)班 21号";
  toast("已填入示例（含标准答案与典型错答）");
};
$("#btn-clear-ans").onclick = () => { $("#in-answer").value = ""; $("#crit-box").style.display = "none"; };

// 生成分项评分标准
$("#btn-criteria").onclick = () => {
  const D = PG_DATA.defaultCriteria;
  const txt = PG_DATA.disclaimer + "\n【生成的中考评分标准（无官方细则时的初评依据）】\n"
    + "一、客观题\n" + D.客观题.map((x, i) => `  ${i + 1}. ${x}`).join("\n")
    + "\n二、简答题\n" + D.简答题.map((x, i) => `  ${i + 1}. ${x}`).join("\n")
    + "\n三、实验探究题\n" + D.实验探究题.map((x, i) => `  ${i + 1}. ${x}`).join("\n")
    + "\n四、计算题\n" + D.计算题.map((x, i) => `  ${i + 1}. ${x}`).join("\n")
    + "\n（正式评分请以当地官方细则为准）";
  $("#crit-box").style.display = "block";
  $("#crit-box").textContent = txt;
  toast("✅ 已生成中考规范分项标准");
};

// 批量解析
$("#btn-parse-batch").onclick = () => {
  const raw = $("#in-batch").value;
  const parts = raw.split(/^\s*===\s*(.+?)\s*===\s*$/m);
  const list = [];
  for (let i = 1; i < parts.length; i += 2) list.push({ name: parts[i], body: parts[i + 1] || "" });
  $("#batch-meta").textContent = list.length ? `识别到 ${list.length} 位学生：${list.map(x => x.name).join("、")}` : "未识别到分隔行，请用 === 学生名 === 格式";
  return list;
};

// ===== 批改 =====
let last = null;

function gradeOne(name, stuText, ansItems, withObj, withSub) {
  const stuItems = PG.split(stuText);
  const objRows = [];
  const subs = [];
  const obj = withObj ? PG.gradeObjective(ansItems, stuItems) : { rows: [], total: 0, right: 0, rate: 0, wrongList: [] };

  if (withSub) {
    const ansMap = {}; ansItems.forEach(a => { if (!ansMap[a.n]) ansMap[a.n] = a.text; });
    stuItems.forEach(s => {
      const txt = s.text || "";
      if (PG.isSubjective(txt)) subs.push(PG.gradeSubjective(s.n, ansMap[s.n] || "", txt));
    });
    // 若客观题误判的长题已归主观题，从客观表剔除主观题号
    const subNums = new Set(subs.map(s => s.n));
    obj.rows = obj.rows.filter(r => !subNums.has(r.n));
    obj.total = obj.rows.filter(r => r.ok !== null).length;
    obj.right = obj.rows.filter(r => r.ok === true).length;
    obj.rate = obj.total ? Math.round(obj.right / obj.total * 100) : 0;
    obj.wrongList = obj.rows.filter(r => r.ok === false).map(r => r.n);
  } else {
    obj.rows = obj.rows; // 全部按客观题
  }

  const sum = PG.summarize(obj, subs, {});
  const totalScore = (obj.right) + subs.reduce((a, s) => a + s.score, 0);
  const totalMax = obj.total + subs.reduce((a, s) => a + s.max, 0);

  return { name, obj, subs, sum, totalScore, totalMax, stuText };
}

function renderOne(r) {
  const esc = window.esc;
  let h = `<div class="card">
    <div class="card-h"><span class="who">📄 ${esc(r.name || "学生作业")}</span>
      <span class="sc">AI初评：${r.totalScore} / ${r.totalMax} 分${r.obj.total ? ` ｜ 客观正确率 ${r.obj.rate}%` : ""}</span></div>
    <div class="card-b">`;

  // 客观题表
  if (r.obj.rows.length) {
    h += `<table class="ot"><tr><th>题号</th><th>参考答案</th><th>学生作答</th><th>判定</th><th>错因归类</th><th>知识点</th></tr>`;
    r.obj.rows.forEach(row => {
      const jd = row.ok === null ? '<span class="pill warn">无参考</span>'
        : row.ok ? '<span class="tag-ok">✅ 正确</span>' : '<span class="tag-no">❌ 错误</span>';
      h += `<tr><td>${row.n}</td><td>${esc(row.ans)}</td><td class="${row.ok === false ? "miss" : ""}">${esc(row.stu)}</td><td>${jd}</td><td>${row.err ? `<span class="pill err">${esc(row.err)}</span>` : "—"}</td><td>${esc(row.kp || "—")}</td></tr>`;
    });
    h += `</table>`;
    if (r.obj.wrongList.length) h += `<p style="margin-top:9px;font-size:13.8px">错题题号：<span class="pill err">${r.obj.wrongList.join("、")}</span></p>`;
  } else {
    h += `<p style="color:var(--muted);font-size:14px">客观题：本次未含或未识别。</p>`;
  }

  // 主观题分项
  r.subs.forEach(s => {
    h += `<div class="sub-q">
      <div class="qh"><span>第 ${s.n} 题（主观题·分项采分）</span><span class="score">① 得分 ${s.score} / ${s.max}（参考分）</span></div>
      <div class="blk good"><span class="bl">② ✨ 亮点</span><ul>${s.goods.map(g => `<li>${esc(g)}</li>`).join("")}</ul></div>
      <div class="blk bad"><span class="bl">③ ⚠️ 存在问题</span><ul>${s.issues.map(i => `<li><b>${esc(i.t)}：</b>${esc(i.d)}</li>`).join("")}</ul></div>
      <div class="blk tip"><span class="bl">④ 💡 评语与改进建议</span><div>${esc(s.tip)}</div></div>
      ${s.dispute ? '<div class="dispute">【答案有争议，请老师人工复核】该作答存在多种理解或表述模糊，AI 未强行判定。</div>' : ""}
    </div>`;
  });

  h += `</div></div>`;

  // 汇总
  const S = r.sum;
  h += `<div class="summary"><div class="sh">📊 学情汇总报告（初评）</div><div class="sb">
    <div class="kpis">
      <div class="kpi"><b>${S.objRate == null ? "—" : S.objRate + "%"}</b><span>客观题正确率</span></div>
      <div class="kpi"><b>${r.subs.length}</b><span>主观题数</span></div>
      <div class="kpi"><b>${r.totalScore}/${r.totalMax}</b><span>AI初评总分</span></div>
      <div class="kpi"><b>${r.obj.wrongList.length}</b><span>客观错题数</span></div>
    </div>`;
  S.parts.forEach(p => {
    h += `<div class="sum-sec"><h5>${p.h}</h5>`;
    if (p.p) p.p.forEach(t => h += `<p>${t}</p>`);
    if (p.ul) h += `<ul>${p.ul.map(x => `<li>${x}</li>`).join("")}</ul>`;
    h += `</div>`;
  });
  h += `<div class="tip-box">📌 ${PG_DATA.disclaimer} 分数仅供教师参考，主观大题请按官方细则人工终审；本工具不存储学生个人信息。</div>`;
  h += `</div></div>`;
  return h;
}

function toText(r) {
  const L = [];
  L.push(PG_DATA.disclaimer);
  L.push(`学生：${r.name || "（未填）"}`);
  L.push(`AI初评总分：${r.totalScore} / ${r.totalMax}（参考）`);
  if (r.obj.rows.length) {
    L.push("");
    L.push("【客观题】");
    r.obj.rows.forEach(row => L.push(`  第${row.n}题：参考【${row.ans}】 学生【${row.stu}】 ${row.ok === true ? "✅" : row.ok === false ? "❌" : "—"}${row.err ? " 归因：" + row.err : ""}${row.kp ? " 知识点：" + row.kp : ""}`));
    if (r.obj.wrongList.length) L.push(`  错题：${r.obj.wrongList.join("、")}`);
  }
  r.subs.forEach(s => {
    L.push("");
    L.push(`【第${s.n}题·主观题分项】①得分 ${s.score}/${s.max}（参考）`);
    L.push(`②亮点：${s.goods.join("；")}`);
    L.push(`③问题：${s.issues.map(i => i.t + "：" + i.d).join("；")}`);
    L.push(`④评语：${s.tip}`);
    if (s.dispute) L.push("【答案有争议，请老师人工复核】");
  });
  L.push("");
  L.push("【学情汇总】");
  r.sum.parts.forEach(p => {
    L.push(p.h);
    if (p.p) p.p.forEach(t => L.push("  " + t.replace(/<[^>]+>/g, "")));
    if (p.ul) p.ul.forEach(x => L.push("  - " + x.replace(/<[^>]+>/g, "")));
  });
  L.push("");
  L.push(PG_DATA.disclaimer);
  return L.join("\n");
}

$("#btn-grade").onclick = () => {
  const ansRaw = $("#in-answer").value.trim();
  const stuRaw = mode === "single" ? $("#in-student").value.trim() : $("#in-batch").value.trim();
  if (!stuRaw) { toast("请粘贴学生作答内容"); return; }
  if (!ansRaw) { toast("请粘贴参考答案，或点「生成分项评分标准」"); return; }
  const ansItems = PG.split(ansRaw);
  const withObj = $("#ck-obj").checked, withSub = $("#ck-sub").checked;

  const results = [];
  if (mode === "single" || !withObj && !withSub) {
    const nm = $("#in-stu").value.trim() || "学生作业";
    results.push(gradeOne(nm, stuRaw, ansItems, withObj, withSub));
  } else {
    // 批量
    const raw = $("#in-batch").value;
    const parts = raw.split(/^\s*===\s*(.+?)\s*===\s*$/m);
    if (parts.length < 3) { toast("批量格式不对，请用 === 学生名 === 分隔"); return; }
    for (let i = 1; i < parts.length; i += 2) results.push(gradeOne(parts[i], parts[i + 1] || "", ansItems, withObj, withSub));
  }

  last = results;
  $("#out-title").textContent = mode === "single" ? "批改结果（AI初评）" : `批量批改（${results.length} 人·AI初评）`;
  $("#result").innerHTML = results.map(renderOne).join(
    mode === "batch" ? batchTable(results) : ""
  );
  saveHist(results);
  toast(`✅ 批改完成（${results.length} 份），AI初评供参考`);
  $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
};

function batchTable(rs) {
  let h = `<div class="summary"><div class="sh">👥 全班批量汇总统计表（AI初评）</div><div class="sb">
    <table class="bt"><tr><th>学生</th><th>客观正确率</th><th>初评总分</th><th>主观主要问题</th><th>建议</th></tr>`;
  rs.forEach(r => {
    const ic = r.sum.ic.slice(0, 2).map(x => x[0]).join("、") || "规范较好";
    h += `<tr><td>${window.esc(r.name)}</td><td>${r.obj.rate}%</td><td>${r.totalScore}/${r.totalMax}</td><td>${window.esc(ic)}</td><td>${r.obj.rate >= 80 ? "保持，挑战综合题" : "重点回扣错题概念"}</td></tr>`;
  });
  const avg = Math.round(rs.reduce((a, r) => a + r.obj.rate, 0) / rs.length);
  h += `<tr><td><b>全班</b></td><td><b>${avg}%</b></td><td colspan="3">共性问题见下方汇总（供教师讲评参考）</td></tr>`;
  h += `</table><div class="tip-box" style="margin-top:12px">📌 ${PG_DATA.disclaimer} 批量结果用于定位共性问题，个别学生主观题请抽查复核。</div></div></div>`;
  return h;
}

// 复制/导出/打印
function flatText() {
  if (!last) return "";
  const parts = last.map(toText);
  return mode === "batch" ? parts.map((p, i) => `===== 第${i + 1}份 =====\n${p}`).join("\n\n") : parts[0];
}
$("#btn-copy").onclick = async () => {
  if (!last) { toast("请先批改"); return; }
  try { await navigator.clipboard.writeText(flatText()); toast("📋 已复制，可粘贴进 Word"); }
  catch (e) { const ta = document.createElement("textarea"); ta.value = flatText(); document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast("📋 已复制"); }
};
$("#btn-md").onclick = () => {
  if (!last) { toast("请先批改"); return; }
  const blob = new Blob([flatText()], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `物理批改_${new Date().toISOString().slice(0, 10)}.md`;
  a.click(); URL.revokeObjectURL(a.href);
  toast("⬇ 已导出");
};
$("#btn-print").onclick = () => {
  if (!last) { toast("请先批改"); return; }
  const w = window.open("", "_blank");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>物理批改</title>
    <style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.75;padding:26px;max-width:900px;margin:auto;font-size:13.5px}
    .card{border:1px solid #bbb;margin-bottom:16px;page-break-inside:avoid}.card-h{background:#0f172a;color:#fff;padding:8px 14px}
    table{width:100%;border-collapse:collapse;font-size:12.5px}td,th{border:1px solid #999;padding:5px}
    .blk,.tip-box,.summary{border:1px solid #999;padding:8px 12px;margin:8px 0}
    .summary{border:2px solid #0369a1}.sh{background:#0369a1;color:#fff;padding:8px 14px;font-weight:bold}
    .dispute{border:1px dashed #7c3aed;padding:6px 10px}</style>
    <body>${$("#result").innerHTML}</body>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  toast("🖨 已打开打印窗口");
};

// 历史
function histLoad() { try { return JSON.parse(localStorage.getItem("pg_hist_v1")) || []; } catch (e) { return []; } }
function saveHist(rs) {
  const h = histLoad();
  h.unshift({ time: Date.now(), mode, count: rs.length, names: rs.map(r => r.name).slice(0, 6), text: flatText() });
  try { localStorage.setItem("pg_hist_v1", JSON.stringify(h.slice(0, 20))); } catch (e) {}
}
$("#btn-history").onclick = () => {
  const h = histLoad();
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>🕘 批改历史（${h.length}）</h3>
    ${h.length ? h.map((x, i) => {
      const kind = x.mode === "batch" ? "批量" : "单份";
      const nm = window.esc((x.names || []).join("\u3001"));
      const tm = new Date(x.time).toLocaleString("zh-CN");
      return `<div class="hist-i" onclick="showHist(${i})"><div class="ht">${kind}\u6279\u6539 \u00b7 ${x.count} \u4efd</div><div class="hm">${nm} \uff5c ${tm}</div></div>`;
    }).join("") : '<div style="padding:30px;text-align:center;color:var(--muted)">\u6682\u65e0\u5386\u53f2</div>'}`;
  $("#mask").style.display = "flex";
};
window.showHist = i => {
  const x = histLoad()[i]; if (!x) return;
  $("#out-title").textContent = "历史批改记录";
  $("#result").innerHTML = `<div class="text-block">${window.esc(x.text).replace(/\n/g, "<br>")}</div>`;
  $("#mask").style.display = "none";
  toast("已载入历史记录");
};

// 帮助
$("#btn-help").onclick = () => {
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>❓ 使用说明</h3>
    <div class="help-li">① 输入：粘贴<b>参考答案+评分细则</b>（没有细则可点「生成分项评分标准」）＋<b>学生作答</b>；单份或批量（批量用 === 学生名 === 分隔）。</div>
    <div class="help-li">② 客观题：逐题 ✅/❌，统计正确率、错题题号，错因归类（概念混淆/审题/计算/单位/公式），并归类薄弱知识点。</div>
    <div class="help-li">③ 主观题：严格按采分点<b>分项</b>输出——①得分/满分（参考）②✨亮点 ③⚠️问题（概念/规范/表述/计算/审题分类）④💡简洁评语；计算题按<b>步骤给分</b>，公式代入对也给步骤分。</div>
    <div class="help-li">④ 汇总：正确率、高频错题、共性错误、教学提示自动生成；批量模式附全班统计表。</div>
    <div class="help-li">⑤ 硬约束：所有分数均为 <b>AI初评仅供教师参考</b>，主观大题务必老师终审；争议答案标【请老师人工复核】；不编造答案、不超纲、不存学生个人信息。</div>
    <div style="text-align:right;margin-top:14px"><button class="btn primary" onclick="document.getElementById('mask').style.display='none'">知道了</button></div>`;
  $("#mask").style.display = "flex";
};
$("#mask").addEventListener("click", e => { if (e.target.id === "mask") e.target.style.display = "none"; });