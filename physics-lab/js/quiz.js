// ===== 章节练习 =====
let quizState = { list: [], idx: 0, score: 0, total: 0, mode: "normal", selected: null, inputs: [] };

// 填充章节下拉
(function initChapterSelect() {
  const sel = $("#q-chapter");
  D.chapters.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id; o.textContent = c.name;
    sel.appendChild(o);
  });
})();

function pickQuestions(chapter, type, mistakeOnly) {
  let list = D.questions.slice();
  if (mistakeOnly) list = list.filter(q => Store.data.mistakes.includes(q.id));
  if (chapter && chapter !== "all") list = list.filter(q => q.ch === chapter);
  if (type && type !== "all") list = list.filter(q => q.type === type);
  // 洗牌
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, 20);
}

function startQuiz(mistakeOnly) {
  const list = pickQuestions($("#q-chapter").value, $("#q-type").value, mistakeOnly);
  if (!list.length) {
    $("#quiz-area").innerHTML = `<div class="empty">没有符合条件的题目，换个筛选再试试～</div>`;
    return;
  }
  quizState = { list, idx: 0, score: 0, total: list.length, mode: mistakeOnly ? "mistake" : "normal", selected: null };
  renderQuestion();
}

function renderQuestion() {
  const s = quizState;
  if (s.idx >= s.list.length) return renderQuizResult();
  const q = s.list[s.idx];
  s.selected = null;
  s.submitted = false;
  let body = "";
  if (q.type === "choice") {
    body = `<div class="opts">` + q.options.map((o, i) =>
      `<div class="opt" data-opt="${i}"><input type="radio" name="opt" ${i === 0 ? "checked" : ""}>${String.fromCharCode(65 + i)}. ${esc(o)}</div>`).join("") + `</div>`;
  } else if (q.type === "fill") {
    body = q.ans.map((_, i) => `<div class="fill-row"><span>第 ${i + 1} 空：</span><input class="fill-input" data-fill="${i}" type="text" placeholder="输入答案"></div>`).join("");
  } else {
    body = q.ans.map((_, i) => `<div class="fill-row"><span>第 ${i + 1} 问：</span><input class="fill-input" data-fill="${i}" type="text" placeholder="输入结果"></div>`).join("") +
      (q.steps ? `<div class="mini" style="margin-top:8px">提示：本题共 ${q.steps.length} 问</div>` : "");
  }
  $("#quiz-area").innerHTML = `
    <div class="progress-line"><i style="width:${s.idx / s.list.length * 100}%"></i></div>
    <div class="q-card">
      <div class="q-head">
        <div>
          <span class="tag">${typeName(q.type)}</span>
          <span class="tag">${esc(chName(q.ch).replace(/ .*$/, ""))}</span>
          <span class="tag diff${q.diff}">${diffName(q.diff)}</span>
        </div>
        <span class="mini">第 ${s.idx + 1} / ${s.list.length} 题 · 已对 ${s.score}</span>
      </div>
      <div class="q-text">${esc(q.q)}</div>
      ${body}
      <div id="q-feedback"></div>
      <div style="margin-top:16px;display:flex;gap:10px">
        <button class="btn primary" id="q-submit">提交答案</button>
        <button class="btn" id="q-next" style="display:none">下一题 →</button>
        <button class="btn danger" id="q-quit">结束练习</button>
      </div>
    </div>`;

  $("#q-submit").onclick = submitQuestion;
  $("#q-next").onclick = () => { quizState.idx++; renderQuestion(); };
  $("#q-quit").onclick = renderQuizResult;
}

function submitQuestion() {
  const s = quizState;
  if (s.submitted) return;
  const q = s.list[s.idx];
  let right = false, userDisp = "";

  if (q.type === "choice") {
    const sel = $(".opt.selected") || $(".opt input:checked")?.closest(".opt");
    if (!sel) { $("#q-feedback").innerHTML = `<div class="explain">请先选择一个选项。</div>`; return; }
    const i = +sel.dataset.opt;
    right = i === q.ans;
    userDisp = String.fromCharCode(65 + i);
    $$(".opt").forEach(o => {
      const oi = +o.dataset.opt;
      o.classList.remove("selected");
      if (oi === q.ans) o.classList.add("correct");
      else if (o === sel && !right) o.classList.add("wrong");
    });
  } else {
    const inputs = $$("[data-fill]");
    const vals = inputs.map(i => i.value.trim());
    if (vals.some(v => !v)) { $("#q-feedback").innerHTML = `<div class="explain">请填完所有空再提交。</div>`; return; }
    right = isRight(q, vals);
    userDisp = vals.join(" / ");
    inputs.forEach((inp, i) => inp.classList.add(normAns(vals[i]) === normAns(q.ans[i]) ? "ok" : "bad"));
  }

  recordAnswer(q, right);
  if (right) s.score++;

  const correctDisp = q.type === "choice"
    ? String.fromCharCode(65 + q.ans) + ". " + q.options[q.ans]
    : q.ans.join(" / ");
  $("#q-feedback").innerHTML = `
    <div class="explain">
      <b>${right ? "✅ 回答正确！" : "❌ 回答错误"}</b><br>
      正确答案：<b>${esc(correctDisp)}</b>${right ? "" : `<br>你的答案：${esc(userDisp)}`}<br>
      ${q.steps ? "解析步骤：<br>· " + q.steps.map(esc).join("<br>· ") + "<br>" : ""}
      ${esc(q.exp)}
    </div>`;
  $("#q-submit").style.display = "none";
  $("#q-next").style.display = "";
  $("#q-next").textContent = s.idx === s.list.length - 1 ? "查看结果 →" : "下一题 →";
  s.submitted = true;
}

function renderQuizResult() {
  const s = quizState;
  if (!s.total) { $("#quiz-area").innerHTML = `<div class="empty">尚未开始练习。</div>`; return; }
  const pct = Math.round(s.score / s.total * 100);
  $("#quiz-area").innerHTML = `
    <div class="result-banner">
      <div class="big">${pct} 分</div>
      <div>答对 ${s.score} / ${s.total} 题</div>
      <div class="progress-line" style="max-width:340px;margin:14px auto"><i style="width:${pct}%"></i></div>
      <button class="btn primary" id="q-again">再来一组</button>
      <button class="btn" data-go="progress">查看错题本</button>
    </div>`;
  Store.data.quizCount++; Store.save();
  $("#q-again").onclick = () => startQuiz(false);
}

// 选项点击（事件委托）
document.addEventListener("click", e => {
  const opt = e.target.closest(".opt");
  if (opt && quizState.list.length && !quizState.submitted) {
    $$(".opt").forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    const r = opt.querySelector("input"); if (r) r.checked = true;
  }
});
$("#q-start").onclick = () => startQuiz(false);
$("#q-mistakes").onclick = () => startQuiz(true);