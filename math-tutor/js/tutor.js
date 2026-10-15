// ===== 苏格拉底启发式培优导师 =====
const MD = window.MT_DATA;
const T = {
  mod: "quad",          // 当前模块
  mode: "sync",         // sync | sprint
  queue: [],            // 本轮题队
  idx: 0,
  round: 5,             // 每轮题数
  phase: "answer",      // answer | graded
  cur: null,
  hinted: false,
  attempts: 0,
  streak: 0,            // 连续压轴完整数（难度自适应）
  easyStreak: 0         // 连续卡壳数
};

// ---- 渲染工具 ----
function md(s) {
  // 轻量 LaTeX/Markdown：$$..$ -> serif；\frac、\sqrt 简单美化
  return String(s)
    .replace(/\n/g, "<br>")
    .replace(/\$(.+?)\$/g, '<span class="katex-fallback">$$$1</span>')
    .replace(/\\sqrt\{([^}]+)\}/g, '√<span style="border-top:1px solid">$1</span>')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span style="display:inline-block;text-align:center;vertical-align:middle"><span style="display:block;border-bottom:1px solid;padding:0 3px">$1</span><span style="display:block;padding:0 3px">$2</span></span>')
    .replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\ge/g, '≥').replace(/\\le/g, '≤')
    .replace(/\\Rightarrow/g, '⇒').replace(/\\perp/g, '⊥').replace(/\\parallel/g, '∥')
    .replace(/\\angle/g, '∠').replace(/\\triangle/g, '△').replace(/\\cong/g, '≌').replace(/\\sim/g, '∽')
    .replace(/\\circ/g, '°').replace(/\\pi/g, 'π').replace(/\\mathbb R/g, 'R').replace(/\\in/g, '∈')
    .replace(/\\dfrac/g, '\\frac').replace(/\\;/g, ' ').replace(/\\,/g, ' ')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
function toast(m) { const t = document.getElementById("toast"); t.textContent = m; t.style.display = "block"; clearTimeout(t._x); t._x = setTimeout(() => t.style.display = "none", 2300); }
function pushMsg(who, html) {
  const chat = document.getElementById("chat");
  const d = document.createElement("div");
  d.className = "msg " + (who === "t" ? "t" : "u");
  d.innerHTML = `<div class="av">${who === "t" ? "📐" : "我"}</div><div class="bub">${html}</div>`;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}

// ---- 模块导航 ----
function renderModNav() {
  const sprint = T.mode === "sprint";
  document.getElementById("mod-nav").innerHTML = MD.modules.map(m => `
    <button class="mod-btn ${m.k === T.mod ? "active" : ""}" data-mod="${m.k}">
      <span class="mi">${m.icon}</span>
      <span>${m.name}<small>${sprint ? "压轴专项" : m.focus.slice(0, 10) + "…"}</small></span>
    </button>`).join("");
}
document.getElementById("mod-nav").addEventListener("click", e => {
  const b = e.target.closest("[data-mod]");
  if (b) { T.mod = b.dataset.mod; startRound(); }
});

// 模式切换
document.getElementById("mode-sw").addEventListener("click", e => {
  const b = e.target.closest("[data-mode]");
  if (!b) return;
  T.mode = b.dataset.mode;
  document.querySelectorAll("#mode-sw button").forEach(x => x.classList.toggle("active", x.dataset.mode === T.mode));
  renderModNav(); startRound();
  toast(T.mode === "sprint" ? "已切换：压轴专项冲刺（只出压轴）" : "已切换：新课同步培优");
});

// ---- 出题队列 ----
function pickQuestions() {
  const sprint = T.mode === "sprint";
  let pool = MD.questions.filter(q => q.mod === T.mod);
  if (sprint) pool = pool.filter(q => q.layer === "ax");
  // 难度自适应：连续卡壳则插入中档
  if (T.easyStreak >= 2) pool = pool.filter(q => q.layer === "mid").concat(pool.filter(q => q.layer === "ax").slice(0, 1));
  if (!pool.length) pool = MD.questions.filter(q => sprint ? q.layer === "ax" : true);
  // 洗牌
  pool = pool.slice().sort(() => Math.random() - 0.5);
  const n = Math.min(T.round, pool.length);
  return pool.slice(0, n);
}

function startRound() {
  T.queue = pickQuestions(); T.idx = 0; T.phase = "answer"; T.streak = 0; T.easyStreak = 0;
  document.getElementById("four-opts").style.display = "none";
  document.getElementById("chat").innerHTML = "";
  const m = MD.modules.find(x => x.k === T.mod);
  document.getElementById("cur-mod").textContent = m.name;
  document.getElementById("cur-layer").textContent = T.mode === "sprint" ? "压轴冲刺" : "中档培优";
  document.getElementById("cur-layer").className = "tag" + (T.mode === "sprint" ? " ax" : "");
  nextQuestion(true);
}

function nextQuestion(first) {
  if (T.idx >= T.queue.length) return endRound();
  T.cur = T.queue[T.idx]; T.phase = "answer"; T.hinted = false; T.attempts = 0;
  document.getElementById("cur-type").textContent = T.cur.type;
  document.getElementById("session-info").textContent = `本轮进度 ${T.idx + 1}/${T.queue.length}`;
  document.getElementById("answer-input").value = "";
  document.getElementById("answer-input").disabled = false;
  if (first) {
    pushMsg("t", `<div class="qstem">${md(T.cur.stem)}</div>`);
  } else {
    pushMsg("t", `<div class="qstem">${md(T.cur.stem)}</div>`);
  }
  pushMsg("t", `<span style="color:var(--muted);font-size:13.5px">📌 请独立作答（写出分类/关键步骤）。卡壳可点「💡 要提示」，我只给方向不给答案。</span>`);
}

// ---- 要提示 ----
document.getElementById("btn-hint").onclick = () => {
  if (!T.cur || T.phase !== "answer") return;
  T.hinted = true;
  pushMsg("t", `<div class="hint">💡 ${md(T.cur.hint)}</div>`);
};

// ---- 提交作答并批改 ----
document.getElementById("btn-submit").onclick = submitAnswer;
document.getElementById("answer-input").addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitAnswer(); }
});
document.getElementById("btn-skip").onclick = () => {
  if (!T.cur) return;
  T.idx++; nextQuestion();
};

function submitAnswer() {
  const box = document.getElementById("answer-input");
  const ans = box.value.trim();
  if (T.phase !== "answer") return;
  if (!ans) { toast("先写下你的作答再提交"); return; }
  T.attempts++;
  pushMsg("u", md(ans));
  box.disabled = true;
  gradeAnswer(ans);
}

// 批改：对照中考阅卷标准，抓分类/踩分点/边界
function gradeAnswer(userAns) {
  const q = T.cur;
  const norm = s => String(s).toLowerCase().replace(/\s+/g, "").replace(/\\|[$]/g, "").replace(/[（）()]/g, "");
  const correct = norm(q.answer).split(/\/|或/).some(v => v && norm(userAns).includes(norm(v))) ||
                  norm(q.answer) === norm(userAns) ||
                  norm(userAns) === norm(q.answer);

  const errs = [];
  // 启发式错因检测（分类讨论/边界/踩分）
  const hasClass = /分[类种]|情况|当.*时|①|②|1[）.、]|（1）|两种|两解|或/.test(userAns);
  const multiSolution = /或|两解|两种|±|√10/.test(q.answer) || (q.pitfalls || []).some(p => p.includes("漏") || p.includes("分类"));
  const lenOk = userAns.replace(/\s/g, "").length > 12;
  const hasBoundary = /Δ|判别|范围|<|>|≤|≥|定义域|端点/.test(userAns);

  if (!correct) {
    if (multiSolution && !hasClass) errs.push("分类讨论不全");
    if (!hasBoundary && /判别|Δ|范围|最值|取值/.test(q.model + q.stem)) errs.push("隐含条件遗漏");
    if (!lenOk && q.type.includes("综合")) errs.push("答题缺踩分点");
    if (!hasClass && !errs.length) errs.push("模型不会迁移");
    if (!errs.length) errs.push(q.pitfalls && q.pitfalls[0] && MD.errTags.includes(q.pitfalls[0]) ? q.pitfalls[0] : "答题缺踩分点");
  } else {
    if (multiSolution && !hasClass) { errs.push("分类讨论不全"); }
    if (q.type.includes("综合") && !lenOk) errs.push("答题缺踩分点");
  }

  const finalOk = correct && errs.length === 0;
  const layer = q.layer === "ax" ? "压轴" : "中档";

  // 中考阅卷式逐步批改反馈
  let html = `<div class="grade">`;
  html += `<div class="g-line"><b class="${correct ? "ok" : "no"}">${correct ? "✅ 结果正确" : "❌ 结果有误"}</b> · 题型 ${q.type} · ${layer}层`
        + `${T.hinted ? " · 已用提示" : ""}</div>`;
  if (errs.length) {
    html += `<div class="g-line">错因归因：${errs.map(t => `<span class="pill err">${t}</span>`).join("")}</div>`;
  } else if (finalOk) {
    html += `<div class="g-line"><span class="pill good">过程完整·踩分点齐全</span><span class="pill model">${q.model}</span></div>`;
  } else if (correct) {
    html += `<div class="g-line">结果对，但 <span class="pill err">${errs.join("、")}</span> —— 中考按步给分，务必补全。</div>`;
  }
  html += `</div>`;

  // 解题步骤（批改后再给，符合“未作答不给答案”）
  if (!correct || !finalOk) {
    html += `<div class="grade"><div class="g-line" style="color:var(--brand2)"><b>📖 参考步骤（中考规范）：</b></div><div class="steps">`
          + q.solution.map(s => `<div>${md(s)}</div>`).join("") + `</div>`;
    html += `<div class="g-line"><b>标准答案：</b>${md(q.answer)}　<span class="pill model">${q.model}</span></div></div>`;
  }
  // 变式 / 追加设问
  if (finalOk && q.variants && q.variants.length) {
    html += `<div class="ext">🎯 你已完整做对，来道同模型变式抗变形：<br>${md(q.variants[0].stem)}</div>`;
  } else if (finalOk) {
    html += `<div class="ext">🎯 追加设问：${md(MD.extensionQuestions[Math.floor(Math.random() * MD.extensionQuestions.length)])}</div>`;
  }
  pushMsg("t", html);

  // 记录
  recordAttempt(q, correct, errs, layer);

  // 难度自适应
  if (q.layer === "ax" && correct && !errs.length) { T.streak++; T.easyStreak = 0; }
  else if (!correct) { T.easyStreak++; T.streak = 0; }
  if (T.streak >= 2) { toast("连续 2 道压轴完整 → 已提升复杂度"); T.streak = 0; }
  if (T.easyStreak >= 3) { toast("连续卡壳 → 临时下调至中档，定位思维卡点"); T.easyStreak = 0; }

  T.phase = "graded";
  T.idx++;
  setTimeout(() => { T.idx >= T.queue.length ? endRound() : nextQuestion(); }, 1400);
}

function recordAttempt(q, correct, errs, layer) {
  const st = window.MTStore.data;
  st.total++; if (correct) st.correct++;
  if (q.layer === "ax" && correct) st.axDone++;
  st.byMod[q.mod] = st.byMod[q.mod] || { n: 0, r: 0 };
  st.byMod[q.mod].n++; if (correct) st.byMod[q.mod].r++;
  if (!correct || errs.length) {
    errs.forEach(t => { st.errCount[t] = (st.errCount[t] || 0) + 1; });
    // 入库（错题或有瑕疵）
    if (!correct) window.WB.add(q, errs, layer);
  }
  MTStore.save();
  window.ST.refresh();
}

// ---- 一轮结束 → 4 选项 ----
function endRound() {
  pushMsg("t", `<div class="qstem">✅ 本轮专题训练结束。你完成了 ${T.queue.length} 道${T.mode === "sprint" ? "压轴" : "培优"}题。</div>
    <div style="color:var(--muted);font-size:13.5px;margin-top:6px">请选择下一步：</div>`);
  document.getElementById("answer-input").disabled = true;
  document.getElementById("four-opts").style.display = "grid";
}
document.getElementById("four-opts").addEventListener("click", e => {
  const b = e.target.closest("[data-opt]"); if (!b) return;
  const o = b.dataset.opt;
  if (o === "continue") startRound();
  else if (o === "next") {
    const i = MD.modules.findIndex(m => m.k === T.mod);
    T.mod = MD.modules[(i + 1) % MD.modules.length].k;
    renderModNav(); startRound();
    toast("已切换到专题：" + MD.modules.find(m => m.k === T.mod).name);
  }
  else if (o === "wrong") window.WB.open();
  else if (o === "quiz") { T.mode = "sprint"; document.querySelector('#mode-sw [data-mode="sprint"]').click(); }
  document.getElementById("four-opts").style.display = "none";
});

// 启动
renderModNav();
startRound();