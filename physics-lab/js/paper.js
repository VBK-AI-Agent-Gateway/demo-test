// ===== 模拟试卷 =====
let paperState = null; // {paper, timer, endAt}

function renderPaperList() {
  $("#paper-area").innerHTML = "";
  if (paperState) { renderPaperRun(); return; }
  $("#paper-list").innerHTML = D.papers.map(p => `
    <div class="paper-item">
      <div>
        <h3>📝 ${esc(p.name)}</h3>
        <div class="meta">满分 ${p.total} 分 · 限时 ${p.minutes} 分钟 · ${p.parts.reduce((a, x) => a + x.ids.length, 0)} 题</div>
      </div>
      <button class="btn primary" data-paper="${p.id}">开始考试</button>
    </div>`).join("");
}

function startPaper(id) {
  const p = D.papers.find(x => x.id === id);
  if (!p) return;
  paperState = { paper: p, endAt: Date.now() + p.minutes * 60000, submitted: false, answers: {} };
  $("#paper-list").innerHTML = "";
  renderPaperRun();
}

function timeLeft() {
  const ms = paperState.endAt - Date.now();
  if (ms <= 0) { finishPaper(true); return null; }
  const t = Math.floor(ms / 1000);
  return { m: String(Math.floor(t / 60)).padStart(2, "0"), s: String(t % 60).padStart(2, "0"), low: ms < 5 * 60000 };
}

function renderPaperRun() {
  const p = paperState.paper;
  let html = `
    <div class="toolbar">
      <strong>${esc(p.name)}</strong>
      <span class="timer" id="p-timer">--:--</span>
      <button class="btn primary" id="p-finish">交卷</button>
      <span class="mini">作答内容实时保存，到点自动交卷</span>
    </div>`;
  p.parts.forEach((part, pi) => {
    html += `<div class="part-title">${esc(part.title)}</div>`;
    part.ids.forEach((qid, qi) => {
      const q = qById(qid); if (!q) return;
      const key = pi + "_" + qi;
      html += `<div class="q-card" data-key="${key}">
        <div class="q-text"><b>${pi + 1}.${qi + 1}</b> ${esc(q.q)}</div>`;
      if (q.type === "choice") {
        html += `<div class="opts">` + q.options.map((o, i) =>
          `<div class="opt p-opt" data-k="${key}" data-v="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</div>`).join("") + `</div>`;
      } else {
        html += `<div class="fill-row"><span>答案：</span><input class="fill-input p-input" data-k="${key}" type="text" placeholder="输入答案"></div>`;
      }
      html += `</div>`;
    });
  });
  $("#paper-area").innerHTML = html;

  $("#p-finish").onclick = () => finishPaper(false);
  $$(".p-opt").forEach(o => o.onclick = () => {
    const k = o.dataset.k;
    paperState.answers[k] = o.dataset.v;
    $$(`.p-opt[data-k="${k}"]`).forEach(x => x.classList.remove("selected"));
    o.classList.add("selected");
  });
  $$(".p-input").forEach(i => i.oninput = () => { paperState.answers[i.dataset.k] = i.value; });

  clearInterval(paperState.timer);
  paperState.timer = setInterval(() => {
    const t = timeLeft();
    if (!t) return;
    const el = $("#p-timer");
    if (el) { el.textContent = t.m + ":" + t.s; el.classList.toggle("low", t.low); }
  }, 500);
  const t0 = timeLeft();
  if (t0) { $("#p-timer").textContent = t0.m + ":" + t0.s; $("#p-timer").classList.toggle("low", t0.low); }
}

function finishPaper(auto) {
  if (!paperState || paperState.submitted) return;
  paperState.submitted = true;
  clearInterval(paperState.timer);
  const p = paperState.paper;
  let totalScore = 0, got = 0, rightCount = 0, totalCount = 0;

  let html = `<div class="toolbar"><strong>${esc(p.name)} · 成绩</strong>
    <button class="btn" id="p-back">返回试卷列表</button></div>`;

  p.parts.forEach((part, pi) => {
    const ptsEach = { "一、选择题（每题 5 分）": 5, "二、填空题（每空 5 分）": 5 }[part.title] || 15;
    // 计算题按 15 分、填空按空数×5
    html += `<div class="part-title">${esc(part.title)}</div>`;
    part.ids.forEach((qid, qi) => {
      const q = qById(qid); if (!q) return;
      const key = pi + "_" + qi;
      const av = paperState.answers[key];
      let right = false, userDisp = "未作答";
      if (q.type === "choice") {
        if (av !== undefined) {
          const i = +av;
          userDisp = String.fromCharCode(65 + i) + ". " + q.options[i];
          right = i === q.ans;
        }
      } else {
        if (av !== undefined && String(av).trim()) {
          userDisp = String(av).trim();
          right = isRight(q, String(av).trim().split(/[\/,，]/).map(x => x.trim()));
        }
      }
      const blankCount = q.type === "fill" ? q.ans.length : 1;
      const score = ptsEach === 15 ? 15 : 5 * blankCount;
      totalScore += score;
      if (right) { got += score; rightCount++; }
      totalCount++;
      const correctDisp = q.type === "choice"
        ? String.fromCharCode(65 + q.ans) + ". " + q.options[q.ans]
        : q.ans.join(" / ");
      html += `<div class="q-card" style="border-left:3px solid ${right ? "var(--ok)" : "var(--bad)"}">
        <div class="q-text">${esc(q.q)}</div>
        <div class="mini">你的答案：${esc(userDisp)}</div>
        <div class="mini" style="color:${right ? "var(--ok)" : "var(--bad)"}">正确答案：${esc(correctDisp)} · 得 ${right ? score : 0}/${score} 分</div>
        <div class="explain">${esc(q.exp)}</div>
      </div>`;
      // 记录到学习进度
      recordAnswer(q, right);
    });
  });

  const pct = Math.round(got / totalScore * 100);
  html = `<div class="result-banner">
      <div class="big">${got} / ${totalScore} 分（${pct} 分制）</div>
      <div>${auto ? "⏰ 时间到，自动交卷 · " : ""}答对 ${rightCount}/${totalCount} 题</div>
    </div>` + html;

  $("#paper-area").innerHTML = html;
  $("#p-back").onclick = () => { paperState = null; renderPaperList(); };

  Store.data.papers.push({ id: p.id, score: got, total: totalScore, at: Date.now() });
  Store.save();
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-paper]");
  if (b) startPaper(b.dataset.paper);
});