// ===== 全局状态与存储 =====
const D = window.PHYS_DATA;
const Store = {
  key: "physics_lab_v1",
  data: null,
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.key)) || null; } catch (e) { this.data = null; }
    if (!this.data) this.data = { answered: {}, mistakes: [], quizCount: 0, papers: [] };
    return this.data;
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} }
};
Store.load();

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 归一化答案（填空/计算比对用）
function normAns(s) {
  return String(s).trim().toLowerCase()
    .replace(/\s+/g, "").replace(/×/g, "*").replace(/x/g, "*")
    .replace(/，/g, ",").replace(/。/g, "").replace(/j$/g, "");
}
function isRight(question, userVal) {
  const arr = Array.isArray(userVal) ? userVal : [userVal];
  const expect = question.ans;
  return expect.every((e, i) => normAns(arr[i] || "") === normAns(e));
}
function diffName(d) { return ["", "基础", "进阶", "挑战"][d] || "基础"; }
function chName(id) { const c = D.chapters.find(c => c.id === id); return c ? c.name : ""; }
function typeName(t) { return { choice: "选择题", fill: "填空题", calc: "计算题" }[t] || t; }
function qById(id) { return D.questions.find(q => q.id === id); }

// 记录作答（用于进度与错题本）
function recordAnswer(question, right) {
  const st = Store.data;
  const prev = st.answered[question.id] || { n: 0, r: 0 };
  st.answered[question.id] = { n: prev.n + 1, r: prev.r + (right ? 1 : 0) };
  const mi = st.mistakes.indexOf(question.id);
  if (!right && mi < 0) st.mistakes.push(question.id);
  if (right && mi >= 0) st.mistakes.splice(mi, 1);
  Store.save();
}

// ===== 视图切换 =====
function showView(name) {
  $$(".view").forEach(v => v.classList.remove("active"));
  const v = $("#view-" + name);
  if (v) v.classList.add("active");
  $$("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (name === "home") renderHome();
  if (name === "progress") renderProgress();
  if (name === "paper") renderPaperList();
  window.scrollTo({ top: 0 });
}
document.addEventListener("click", e => {
  const nav = e.target.closest("#nav button");
  if (nav) showView(nav.dataset.view);
  const go = e.target.closest("[data-go]");
  if (go) showView(go.dataset.go);
});

// ===== 首页统计 =====
function renderHome() {
  const st = Store.data;
  const ids = Object.keys(st.answered);
  let n = 0, r = 0;
  ids.forEach(id => { n += st.answered[id].n; r += st.answered[id].r; });
  const rate = n ? Math.round(r / n * 100) : 0;
  $("#home-stats").innerHTML = `
    <div class="stat"><div class="num">${D.chapters.length}</div><div class="lab">知识章节</div></div>
    <div class="stat"><div class="num">${D.questions.length}</div><div class="lab">题库总量</div></div>
    <div class="stat"><div class="num">${n}</div><div class="lab">累计答题</div></div>
    <div class="stat"><div class="num">${rate}%</div><div class="lab">总正确率</div></div>
    <div class="stat"><div class="num">${st.mistakes.length}</div><div class="lab">待复习错题</div></div>
    <div class="stat"><div class="num">${st.papers.length}</div><div class="lab">完成试卷</div></div>`;
}

// ===== 知识点 =====
function renderKnowledge(chip) {
  $("#ch-chips").innerHTML = D.chapters.map(c =>
    `<button class="chip ${c.id === chip ? "active" : ""}" data-ch="${c.id}">${c.name.replace(/ .*$/, "")}</button>`).join("");
  const c = D.chapters.find(x => x.id === chip) || D.chapters[0];
  $("#ch-detail").innerHTML = `
    <h3 class="sec-title">${c.name}</h3>` +
    c.points.map(p => `<div class="know-item"><h4>${esc(p.t)}</h4><p>${esc(p.d)}</p></div>`).join("") +
    `<button class="btn primary" data-quiz-ch="${c.id}">练习本章题目 →</button>`;
}
$("#ch-chips") && document.addEventListener("click", e => {
  const chip = e.target.closest(".chip[data-ch]");
  if (chip) renderKnowledge(chip.dataset.ch);
  const qc = e.target.closest("[data-quiz-ch]");
  if (qc) { showView("quiz"); $("#q-chapter").value = qc.dataset.quizCh; startQuiz(false); }
});

// ===== 公式 =====
function renderFormulas() {
  $("#formula-cards").innerHTML = D.formulas.map(f => `
    <div class="card" style="cursor:default">
      <h3>${esc(f.g)}</h3>
      ${f.items.map(i => `<p style="font-family:monospace;color:#7dd3fc;margin-top:6px">${esc(i)}</p>`).join("")}
    </div>`).join("");
}

// ===== 实验 =====
function renderLabs() {
  $("#lab-list").innerHTML = D.experiments.map((x, i) => `
    <div class="lab-card">
      <h3>实验 ${i + 1} · ${esc(x.t)}</h3>
      <p><b>步骤：</b>${esc(x.p)}</p>
      <p class="k"><b>结论 / 易错：</b>${esc(x.k)}</p>
    </div>`).join("");
}

// ===== 学习进度 =====
function renderProgress() {
  const st = Store.data;
  let n = 0, r = 0;
  Object.values(st.answered).forEach(v => { n += v.n; r += v.r; });
  const rate = n ? Math.round(r / n * 100) : 0;
  $("#prog-stats").innerHTML = `
    <div class="stat"><div class="num">${n}</div><div class="lab">答题总数</div></div>
    <div class="stat"><div class="num">${r}</div><div class="lab">答对题数</div></div>
    <div class="stat"><div class="num">${rate}%</div><div class="lab">总正确率</div></div>
    <div class="stat"><div class="num">${st.papers.length}</div><div class="lab">完成试卷</div></div>`;

  $("#prog-chapters").innerHTML = D.chapters.map(c => {
    const qs = D.questions.filter(q => q.ch === c.id);
    let cn = 0, cr = 0;
    qs.forEach(q => { const a = st.answered[q.id]; if (a) { cn += a.n; cr += a.r; } });
    const pct = cn ? Math.round(cr / cn * 100) : 0;
    return `<div class="bar-row"><span class="name">${esc(c.name)}</span>
      <span class="bar"><i style="width:${cn ? pct : 0}%"></i></span>
      <span class="pct">${cn ? pct + "%" : "未练"}</span></div>`;
  }).join("");

  if (!st.mistakes.length) {
    $("#mistake-list").innerHTML = `<div class="empty">🎉 错题本是空的，继续保持！</div>`;
  } else {
    $("#mistake-list").innerHTML = st.mistakes.map(id => {
      const q = qById(id); if (!q) return "";
      return `<div class="mistake"><div class="meta">${typeName(q.type)} · ${chName(q.ch)} · ${diffName(q.diff)}</div>
        ${esc(q.q)}<div class="mini">${esc(q.exp)}</div></div>`;
    }).join("");
  }
}
$("#clear-mistakes") && $("#clear-mistakes").addEventListener("click", () => {
  Store.data.mistakes = []; Store.save(); renderProgress();
});

// ===== 初始化 =====
renderKnowledge("ch13");
renderFormulas();
renderLabs();
renderHome();
$$(".tag-diff");