/* 零压语言课 - 无 XP/红心/排名，只有学习进度 + 间隔重复 + 错题本 */
(function () {
  "use strict";
  var KEY = "barelingo-v1";
  function $(s) { return document.querySelector(s); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var S = load();
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!s) s = {};
    if (!s.done) s.done = {};                 // 小节完成状态
    if (!s.cards) s.cards = {};                // SRS 卡片: {key:{ef,iv,due,rep,lang}}
    if (!s.wrong) s.wrong = {};               // 错题本: {key:{q,opts,a,exp,n,lang}}
    if (!s.mastered) s.mastered = {};          // 已掌握: {key:1}
    if (s.lang == null) s.lang = "ja";
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------- SRS（简化 SM-2） ---------- */
  var DAY = 86400000;
  function card(item, lang) {
    var k = (lang + ":" + (item.key || item.q));
    if (!S.cards[k]) S.cards[k] = { ef: 2.5, iv: 0, due: Date.now(), rep: 0, lang: lang };
    return S.cards[k];
  }
  function srsUpdate(k, correct) {
    var c = S.cards[k];
    if (!c) return;
    if (correct) {
      c.rep++;
      if (c.rep === 1) c.iv = 1;
      else if (c.rep === 2) c.iv = 3;
      else c.iv = Math.round(c.iv * c.ef);
      c.ef = Math.max(1.3, c.ef + (0.1 - (5 - 5) * (0.08 + (5 - 5) * 0.02)));
      c.due = Date.now() + Math.min(c.iv, 30) * DAY;
      if (c.iv >= 14) S.mastered[k] = 1;      // 判定掌握
    } else {
      c.rep = 0; c.iv = 0; c.due = Date.now() + 10 * 60 * 1000;  // 10 分钟后重来
    }
    save();
  }
  function dueCards() {
    var now = Date.now(), out = [];
    Object.keys(S.cards).forEach(function (k) {
      var c = S.cards[k];
      if (c.due <= now && !S.mastered[k]) out.push({ k: k, c: c });
    });
    return out;
  }

  /* ---------- 视图切换 ---------- */
  $("#tabs").addEventListener("click", function (e) {
    var t = e.target.closest(".tab"); if (!t) return;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.classList.remove("active"); });
    t.classList.add("active");
    var v = t.getAttribute("data-view");
    ["home", "review", "wrong", "words"].forEach(function (k) {
      $("#view-" + k).style.display = k === v ? "block" : "none";
    });
    if (v === "review") renderReview();
    if (v === "wrong") renderWrong();
    if (v === "words") renderWords();
  });

  $("#langSwitch").addEventListener("click", function (e) {
    var b = e.target.closest(".lang-btn"); if (!b) return;
    Array.prototype.forEach.call(document.querySelectorAll(".lang-btn"), function (x) { x.classList.remove("active"); });
    b.classList.add("active");
    S.lang = b.getAttribute("data-lang"); save();
    renderUnits();
  });

  /* ---------- 课程渲染 ---------- */
  function lessons() { return BDATA[S.lang] || []; }
  function renderUnits() {
    var ls = lessons(), box = $("#unitBox"), ok = true, html = "";
    ls.forEach(function (u, i) {
      var done = !!S.done[u.id];
      var locked = !ok;
      html += '<section class="unit"><div class="unit-head' + (done ? " done" : "") + '">' +
        '<div class="u-ic">' + (locked ? "🔒" : (done ? "✅" : "📘")) + "</div>" +
        '<div class="u-txt"><h3>' + u.title + "</h3><p>" + u.desc + " · " + u.items.length + " 题</p></div>" +
        '<button class="u-go" data-id="' + u.id + '"' + (locked ? " disabled" : "") + ">" +
        (locked ? "未解锁" : (done ? "再练一遍" : "开始闯关")) + "</button></div></section>";
      if (!locked && done) ok = true; else if (!locked) ok = false;
    });
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll(".u-go:not([disabled])"), function (b) {
      b.addEventListener("click", function () { startLesson(b.getAttribute("data-id"), false); });
    });
    var total = ls.length, doneN = ls.filter(function (u) { return S.done[u.id]; }).length;
    $("#progText").textContent = "已学 " + doneN + "/" + total + " 个小节";
    $("#progBar").style.width = (total ? (doneN / total) * 100 : 0) + "%";
    var activeLang = document.querySelector('.lang-btn[data-lang="' + S.lang + '"]');
    if (activeLang) {
      Array.prototype.forEach.call(document.querySelectorAll(".lang-btn"), function (x) { x.classList.remove("active"); });
      activeLang.classList.add("active");
    }
  }

  /* ---------- 复习/错题 ---------- */
  function renderReview() {
    var due = dueCards();
    $("#dueStat").textContent = "到期 " + due.length + " 张卡片";
    var btn = $("#reviewBtn");
    if (due.length) {
      btn.disabled = false; btn.classList.remove("off");
      $("#reviewHint").textContent = "到期卡片会以选择题形式出现，答对则延长间隔。";
      btn.onclick = function () { startReview(due); };
    } else {
      btn.disabled = true; btn.classList.add("off");
      $("#reviewHint").textContent = due.length ? "" : "暂时没有到期卡片，先去课程里学点新内容吧。";
    }
  }
  function renderWrong() {
    var keys = Object.keys(S.wrong), box = $("#wrongList");
    if (!keys.length) { box.innerHTML = '<p class="empty">错题本是空的，很棒！ 🌟</p>'; return; }
    box.innerHTML = keys.map(function (k) {
      var w = S.wrong[k];
      return '<div class="list-item"><div class="li-main"><b>' + escapeHtml(w.q) + "</b>" +
        '<span class="li-exp">✔ ' + escapeHtml(w.exp) + " · 错 " + w.n + " 次</span></div>" +
        '<button class="mini" data-k="' + escapeHtml(k) + '">重做</button></div>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".mini"), function (b) {
      b.addEventListener("click", function () { redoWrong(b.getAttribute("data-k")); });
    });
  }
  function renderWords() {
    var keys = Object.keys(S.mastered), box = $("#wordList");
    if (!keys.length) { box.innerHTML = '<p class="empty">还没有达到「已掌握」的词，继续学习就会出现。</p>'; return; }
    box.innerHTML = keys.map(function (k) {
      var parts = k.split(":");
      var w = k.slice(parts[0].length + 1);
      return '<div class="list-item"><div class="li-main"><b>' + escapeHtml(w) + '</b><span class="li-exp">' +
        (parts[0] === "ja" ? "🇯🇵 日语" : "🇬🇧 英语") + "</span></div>" +
        '<button class="mini" data-w="' + escapeHtml(w) + '" data-l="' + parts[0] + '">🔊</button></div>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".mini"), function (b) {
      b.addEventListener("click", function () { speak(b.getAttribute("data-w"), b.getAttribute("data-l")); });
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* ---------- 练习流程 ---------- */
  var ses = null;
  function toQuestion(item, lang) {
    var opts = item.opts.slice();
    var ai = item.a;
    return { item: item, lang: lang, q: item.q, show: item.show, ruby: item.ruby, sent: item.sent,
      say: item.say, opts: opts, a: ai, exp: item.exp, t: item.t };
  }
  function startLesson(id, isReview) {
    var ls = lessons(), unit = null;
    ls.forEach(function (u) { if (u.id === id) unit = u; });
    if (!unit) return;
    var qs = shuffle(unit.items.slice()).slice(0, 8).map(function (it) { return toQuestion(it, S.lang); });
    beginSession(qs, { mode: "lesson", id: id, lang: S.lang });
  }
  function startReview(due) {
    var qs = due.slice(0, 8).map(function (d) {
      var raw = JSON.parse(JSON.stringify(findRaw(d.k) || {}));
      var lang = d.c.lang || "ja";
      var it = findRaw(d.k);
      if (it) return toQuestion(it, lang);
      return null;
    }).filter(Boolean);
    if (!qs.length) { toast("没有可复习的题目"); return; }
    beginSession(shuffle(qs), { mode: "review", lang: null });
  }
  function findRaw(k) {
    var parts = k.split(":"), lang = parts[0], key = k.slice(parts[0].length + 1);
    var found = null;
    (BDATA[lang] || []).forEach(function (u) {
      u.items.forEach(function (it) { if ((lang + ":" + (it.key || it.q)) === k) found = it; });
    });
    return found ? { item: found, lang: lang } : null;
  }
  function redoWrong(k) {
    var raw = findRaw(k);
    if (!raw) { toast("原题数据缺失"); return; }
    beginSession([toQuestion(raw.item, raw.lang)], { mode: "redo", lang: raw.lang, key: k });
  }

  function beginSession(qs, meta) {
    ses = { qs: qs, i: 0, meta: meta, wrongN: 0 };
    $("#overlay").classList.add("open");
    $("#resultBox").classList.remove("show");
    renderQ();
  }
  function renderQ() {
    var q = ses.qs[ses.i];
    ses.answered = false;
    $("#qBar").style.width = (ses.i / ses.qs.length) * 100 + "%";
    $("#qCount").textContent = (ses.i + 1) + "/" + ses.qs.length;
    $("#qFoot").style.display = "none";
    $("#qFoot").className = "q-foot";
    $("#resultBox").classList.remove("show");
    var b = $("#qBody");
    b.style.display = "block";
    var h = "";
    if (q.t === "listen") h += '<button class="speak-btn big" id="speakBtn" aria-label="播放">🔊</button>';
    else if (q.show) h += '<div class="show-word">' + (q.ruby ? '<span class="ruby">' + q.ruby + "</span>" : "") +
      "<span>" + escapeHtml(q.show) + '</span><button class="mini" id="speakBtn">🔊 读一读</button></div>';
    else h += '<div class="speak-row"><button class="mini" id="speakBtn">🔊 读一读</button></div>';
    if (q.sent) h += '<div class="q-sent">' + escapeHtml(q.sent) + "</div>";
    h += '<div class="q-prompt">' + escapeHtml(q.q) + "</div>";
    h += '<div class="q-sub">' + (q.t === "listen" ? "点 🔊 重听，选择正确答案" :
      q.t === "fill" ? "选择正确选项填入空格" : q.t === "tran" ? "选择正确译文" : "选择正确答案") + "</div>";
    h += '<div class="opts" id="optsBox">';
    q.opts.forEach(function (o, i) { h += '<button class="opt" data-i="' + i + '">' + escapeHtml(o) + "</button>"; });
    h += "</div>";
    b.innerHTML = h;
    Array.prototype.forEach.call(b.querySelectorAll(".opt"), function (el) {
      el.addEventListener("click", function () { onPick(el, +el.getAttribute("data-i")); });
    });
    var sp = $("#speakBtn");
    if (sp) {
      var sayT = q.t === "listen" ? q.say : (q.show || q.sent || q.q);
      sp.addEventListener("click", function () { speak(sayT, q.lang); });
      if (q.t === "listen") setTimeout(function () { speak(q.say, q.lang); }, 200);
    }
  }
  function onPick(el, i) {
    if (ses.answered) return;
    var q = ses.qs[ses.i];
    ses.answered = true;
    var good = i === q.a;
    Array.prototype.forEach.call(document.querySelectorAll("#optsBox .opt"), function (o, idx) {
      o.disabled = true;
      if (idx === q.a) o.classList.add("good");
      if (idx === i && !good) o.classList.add("bad");
    });
    if (!good) ses.wrongN++;
    // SRS + 错题本
    var ck = (q.lang + ":" + (q.item.key || q.item.q));
    srsUpdate(ck, good);
    if (good && S.wrong[ck]) {
      S.wrong[ck].n2 = (S.wrong[ck].n2 || 0) + 1;
      if (S.wrong[ck].n2 >= 2) delete S.wrong[ck];
    } else if (!good) {
      if (S.wrong[ck]) { S.wrong[ck].n++; S.wrong[ck].n2 = 0; }
      else S.wrong[ck] = { q: q.show || q.sent || q.q, exp: q.exp, n: 1, lang: q.lang };
    }
    save();
    var foot = $("#qFoot");
    foot.style.display = "block";
    foot.className = "q-foot " + (good ? "correct" : "wrong");
    $("#fbTitle").textContent = good ? "答对了 ✓" : "再记一下";
    $("#fbTip").textContent = q.exp || "";
    $("#checkBtn").textContent = (ses.i + 1 >= ses.qs.length) ? "查看结果" : "继续";
    $("#checkBtn").onclick = nextQ;
    $("#qBar").style.width = ((ses.i + 1) / ses.qs.length) * 100 + "%";
  }
  function nextQ() {
    ses.i++;
    if (ses.i >= ses.qs.length) finishSession();
    else renderQ();
  }
  function finishSession() {
    var m = ses.meta;
    if (m.mode === "lesson" && m.id) { S.done[m.id] = true; save(); }
    $("#qBody").style.display = "none";
    $("#qFoot").style.display = "none";
    $("#resultBox").classList.add("show");
    var right = ses.qs.length - ses.wrongN;
    $("#resGain").innerHTML = "本节 " + right + "/" + ses.qs.length + " 题正确" +
      (ses.wrongN ? "，错题已收录错题本" : "，全部掌握 🌟");
    $("#resBtn").onclick = function () { closeOverlay(); renderUnits(); };
    $("#qBar").style.width = "100%";
  }
  function closeOverlay() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    $("#overlay").classList.remove("open");
    ses = null;
    renderUnits();
  }
  $("#closeBtn").addEventListener("click", function () {
    if (ses && ses.i > 0 && !confirm("退出本节？本节进度不保存。")) return;
    closeOverlay();
  });

  $("#reviewBtn").addEventListener("click", function () {}); // 由 renderReview 绑定

  /* ---------- 语音 ---------- */
  function speak(text, lang) {
    if (!text || !("speechSynthesis" in window)) { toast("此浏览器不支持朗读"); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang === "ja" ? "ja-JP" : "en-US";
      u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  var tt;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove("show"); }, 1600);
  }

  renderUnits(); renderReview();
  setInterval(renderReview, 60000);
})();