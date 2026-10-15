/* LingoTree - 以中文为底层语言的日语/英语学习应用（含语音朗读） */
(function () {
  "use strict";
  var KEY = "lingotree-v1", MAX_H = 5, HEART_MS = 30 * 60 * 1000, DAILY_GOAL = 30;
  function $(s) { return document.querySelector(s); }

  var S = load();
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!s) s = {};
    if (s.xp == null) s.xp = 0;
    if (s.hearts == null) s.hearts = MAX_H;
    if (!s.heartsAt) s.heartsAt = Date.now();
    if (!s.done) s.done = {};
    if (s.streak == null) s.streak = 0;
    if (!s.lastDay) s.lastDay = "";
    if (s.todayXp == null) s.todayXp = 0;
    if (s.todayLessons == null) s.todayLessons = 0;
    if (s.course == null) s.course = "ja";
    if (s.tab == null) s.tab = "ja";
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------- 语音（Web Speech API） ---------- */
  var voiceReady = false, preferredVoices = [];
  function initVoices() {
    if (!("speechSynthesis" in window)) return;
    var vs = speechSynthesis.getVoices() || [];
    if (!vs.length) return;
    function score(v) {
      var n = (v.lang || "").replace("_", "-");
      var sc = 0;
      if (/^ja/i.test(n)) sc += (/JP|Japan/.test(n) ? 10 : 6);
      if (/^en/i.test(n)) sc += (/US/.test(n) ? 5 : (/GB/.test(n) ? 4 : 3));
      if (/local|google/i.test(v.name.toLowerCase())) sc += 1;
      return sc;
    }
    preferredVoices = vs.slice().sort(function (a, b) { return score(b) - score(a); });
    voiceReady = preferredVoices.some(function (v) { return /^(ja|en)/i.test(v.lang || ""); });
    if (voiceReady) {
      var hint = $("#voiceHint");
      if (hint) hint.classList.add("ready");
    }
  }
  if ("speechSynthesis" in window) {
    initVoices();
    speechSynthesis.onvoiceschanged = initVoices;
  }
  function pickVoice(lang) {
    var want = (lang || "en").toLowerCase().slice(0, 2);
    for (var i = 0; i < preferredVoices.length; i++) {
      if ((preferredVoices[i].lang || "").toLowerCase().replace("_", "-").indexOf(want) === 0) return preferredVoices[i];
    }
    return preferredVoices[0] || null;
  }
  function speak(text, lang, rate, onend) {
    if (!text || !("speechSynthesis" in window)) { if (onend) onend(); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang === "ja" ? "ja-JP" : "en-US";
      var v = pickVoice(u.lang);
      if (v) u.voice = v;
      u.rate = rate == null ? 0.9 : rate;
      if (onend) u.onend = onend;
      speechSynthesis.speak(u);
    } catch (e) { if (onend) onend(); }
  }
  // 中文语音（用于界面提示语朗读，可选）
  function speakZh(text) { speak(text, "zh", 1); }

  function hasVoice() { return "speechSynthesis" in window; }

  function rollDay() {
    var d = today();
    if (S.lastDay === d) return;
    var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (S.lastDay === y && S.todayXp > 0) S.streak++;
    else if (S.lastDay && S.lastDay !== y) S.streak = 1;
    else if (!S.lastDay) S.streak = Math.max(S.streak, 1);
    S.lastDay = d; S.todayXp = 0; S.todayLessons = 0;
    save();
  }

  function totalLessons() {
    var n = 0;
    Object.keys(DATA.units).forEach(function (ck) {
      DATA.units[ck].forEach(function (u) { n += u.lessons.length; });
    });
    return n;
  }
  function doneCount() {
    var n = 0;
    Object.keys(S.done).forEach(function (k) { if (S.done[k]) n++; });
    return n;
  }

  function renderStats() {
    $("#xpN").textContent = S.xp;
    $("#heartN").textContent = S.hearts;
    var st = $("#streakN"); if (st) st.textContent = S.streak;
    var total = totalLessons(), done = doneCount();
    var bar = $("#totalBar"); if (bar) bar.style.width = (total ? (done / total) * 100 : 0) + "%";
    var bx = $("#dayXp"); if (bx) bx.textContent = S.todayXp;
    var bg = $("#dayGoal"); if (bg) bg.textContent = DAILY_GOAL;
    var bl = $("#dayLessons"); if (bl) bl.textContent = S.todayLessons;
    var ds = $("#dayStreak"); if (ds) ds.textContent = "🔥 " + S.streak;
  }

  function kindName(k) {
    return { pick: "选择题", match: "配对", build: "拼句", listen: "听力" }[k] || "练习";
  }

  function renderPath() {
    var box = $("#pathBox"), units = DATA.units[S.course] || [];
    var ok = true, html = "";
    units.forEach(function (u) {
      html += '<section class="unit"><div class="unit-head" style="background:' + (u.color || "#58cc02") + '">' +
        "<div><h2>" + u.title + "</h2><small>" + u.subtitle + "</small></div>" +
        "<small>" + u.lessons.filter(function (l) { return S.done[l.id]; }).length + "/" + u.lessons.length + "</small>" +
        '</div><div class="path">';
      u.lessons.forEach(function (l) {
        var stars = S.done[l.id], locked = !ok;
        html += '<div class="lesson-row">' +
          '<button class="node ' + (stars ? "done " : "") + (locked ? "locked" : "") + '" data-lid="' + l.id + '"' + (locked ? " disabled" : "") + ">" +
          (locked ? "🔒" : l.icon) + (stars ? '<span class="star">' + repeat("⭐", stars) + "</span>" : "") +
          '</button><div class="lesson-meta"><b>' + l.title + "</b><span>" + kindName(l.kind) +
          (locked ? " · 需先完成上一课" : "") + "</span></div></div>";
        if (!locked && stars) ok = true;
        else if (!locked) ok = false;
      });
      html += "</div></section>";
    });
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll(".node:not(.locked)"), function (b) {
      b.addEventListener("click", function () { startLesson(b.getAttribute("data-lid")); });
    });
  }
  function repeat(s, n) { var a = ""; for (var i = 0; i < n; i++) a += s; return a; }

  function renderStatsPage() {
    var sb = $("#statsBox");
    if (!sb) return;
    var total = totalLessons(), done = doneCount();
    var pct = total ? Math.round((done / total) * 100) : 0;
    var unitsHtml = "";
    ["ja", "en"].forEach(function (ck) {
      var us = DATA.units[ck] || [];
      var d = 0, t = 0;
      us.forEach(function (u) { u.lessons.forEach(function (l) { t++; if (S.done[l.id]) d++; }); });
      var name = ck === "ja" ? "🇯🇵 日语" : "🇬🇧 英语";
      unitsHtml += '<div class="st-course"><div class="st-row"><b>' + name + '</b><span>' + d + "/" + t + " 课</span></div>" +
        '<div class="sbar"><i style="width:' + (t ? (d / t) * 100 : 0) + '%"></i></div></div>';
    });
    sb.innerHTML = '<div class="unit"><div class="unit-head" style="background:#1cb0f6"><div><h2>学习统计</h2><small>数据保存在本机浏览器</small></div></div>' +
      '<div style="padding:18px 20px">' +
      '<div class="st-grid">' +
      '<div class="st-cell"><b>' + S.xp + "</b><span>总经验 ⚡</span></div>" +
      '<div class="st-cell"><b>' + S.streak + '</b><span>连续天数 🔥</span></div>' +
      '<div class="st-cell"><b>' + done + "/" + total + '</b><span>完成课时 📚</span></div>' +
      '<div class="st-cell"><b>' + pct + '%</b><span>总进度</span></div>' +
      "</div>" + unitsHtml +
      '<div style="margin-top:18px"><button class="ghost-btn danger" id="resetBtn">清空所有进度（重置）</button></div>' +
      "</div></div>";
    var rb = $("#resetBtn");
    if (rb) rb.addEventListener("click", function () {
      if (!confirm("确定清空全部进度？此操作不可恢复。")) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
      location.reload();
    });
  }

  /* ---------- 练习 ---------- */
  var ses = null;
  function findLesson(lid) {
    var r = null;
    Object.keys(DATA.units).forEach(function (ck) {
      DATA.units[ck].forEach(function (u) {
        u.lessons.forEach(function (l) { if (l.id === lid) r = l; });
      });
    });
    return r;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function startLesson(lid) {
    regenHearts();
    if (S.hearts <= 0) { $("#heartsModal").classList.add("open"); return; }
    var l = findLesson(lid);
    if (!l) return;
    var steps = [];
    if (l.kind === "match") {
      steps.push({ type: "match", left: l.pairs.map(function (p) { return p[0]; }),
        right: shuffle(l.pairs.map(function (p) { return p[1]; })), pairs: l.pairs, matched: 0, lang: l.lang });
    } else if (l.kind === "build") {
      l.items.forEach(function (it) {
        steps.push({ type: "build", q: it.q, a: it.a, tip: it.tip, read: it.read, lang: l.lang, pool: shuffle(it.words.slice()) });
      });
    } else if (l.kind === "listen") {
      l.items.forEach(function (it) {
        steps.push({ type: "pick", listen: true, say: it.say, q: it.q, opts: it.opts, a: it.a, tip: it.tip, lang: l.lang });
      });
    } else {
      l.items.forEach(function (it) {
        steps.push({ type: "pick", q: it.q, read: it.read, opts: it.opts, a: it.a, tip: it.tip, lang: l.lang });
      });
    }
    ses = { lesson: l, steps: steps, i: 0, wrong: 0, picks: [] };
    $("#overlay").classList.add("open");
    $("#resultBox").classList.remove("show");
    renderStep();
  }

  function renderStep() {
    var st = ses.steps[ses.i];
    ses.picks = [];
    ses.answered = false;
    $("#qBar").style.width = (ses.i / ses.steps.length) * 100 + "%";
    $("#qHearts").textContent = S.hearts;
    $("#qFoot").style.display = "none";
    $("#qFoot").className = "q-foot";
    $("#resultBox").classList.remove("show");
    var b = $("#qBody");
    b.style.display = "block";

    if (st.type === "pick") {
      var h = "";
      if (st.listen) {
        h += '<button class="speak-btn big" id="speakBtn" aria-label="播放发音">🔊</button>';
      } else if (st.read && st.lang) {
        h += '<button class="speak-btn" id="speakBtn" aria-label="朗读">🔊 朗读</button>';
      }
      h += '<div class="q-prompt">' + st.q + '</div><div class="q-sub">' +
        (st.listen ? "点 🔊 再听一次，然后选择你听到的词" : (st.read ? "点 🔊 可以听发音" : "选择正确答案")) +
        '</div><div class="opts" id="optsBox">';
      st.opts.forEach(function (o, i) { h += '<button class="opt" data-i="' + i + '">' + o + "</button>"; });
      b.innerHTML = h;
      Array.prototype.forEach.call(b.querySelectorAll(".opt"), function (el) {
        el.addEventListener("click", function () { onPick(el, +el.getAttribute("data-i")); });
      });
      var sp = $("#speakBtn");
      if (sp) {
        var sayText = st.listen ? st.say : st.read;
        var sayLang = st.lang || "en";
        sp.addEventListener("click", function () { speak(sayText, sayLang); });
        setTimeout(function () { if (hasVoice()) speak(sayText, sayLang); }, 220);
      }
    } else if (st.type === "match") {
      b.innerHTML = '<div class="q-prompt">配对连接</div><div class="q-sub">先点左边的项，再点右边对应的项；配对成功会朗读发音</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
        '<div style="display:flex;flex-direction:column;gap:10px" id="colL">' +
        st.left.map(function (t, i) { return '<button class="tile" data-col="l" data-i="' + i + '">' + t + "</button>"; }).join("") +
        '</div><div style="display:flex;flex-direction:column;gap:10px" id="colR">' +
        st.right.map(function (t, i) { return '<button class="tile" data-col="r" data-i="' + i + '">' + t + "</button>"; }).join("") +
        "</div></div>";
      Array.prototype.forEach.call(b.querySelectorAll(".tile"), function (el) {
        el.addEventListener("click", function () { onMatchTile(el, st); });
      });
    } else if (st.type === "build") {
      b.innerHTML = '<button class="speak-btn" id="speakBtn" aria-label="朗读整句">🔊 听整句</button>' +
        '<div class="q-prompt">' + st.q + '</div><div class="q-sub">点 🔊 听整句，然后按顺序点词块拼出句子</div>' +
        '<div class="ans-slots" id="slots"></div><div class="cards" id="poolBox">' +
        st.pool.map(function (w, i) {
          return '<button class="tile" data-i="' + i + '" style="aspect-ratio:auto;min-height:56px;font-size:17px">' + w + "</button>";
        }).join("") + "</div>";
      $("#slots").innerHTML = '<span style="color:#bbb;font-weight:700">点击下方词块…</span>';
      Array.prototype.forEach.call(b.querySelectorAll("#poolBox .tile"), function (el) {
        el.addEventListener("click", function () { onPoolClick(el, st); });
      });
      var sp2 = $("#speakBtn");
      if (sp2) sp2.addEventListener("click", function () { speak(st.read, st.lang || "en"); });
    }
  }

  function onPick(el, i) {
    if (ses.answered) return;
    var st = ses.steps[ses.i];
    ses.answered = true;
    var good = i === st.a;
    Array.prototype.forEach.call(document.querySelectorAll("#optsBox .opt"), function (o, idx) {
      o.disabled = true;
      if (idx === st.a) o.classList.add("good");
      if (idx === i && !good) o.classList.add("bad");
    });
    finishQuestion(good, st.tip, good && st.read ? { text: st.read, lang: st.lang } : null);
  }

  function onMatchTile(el, st) {
    if (el.classList.contains("ok")) return;
    if (el.getAttribute("data-col") === "l") {
      Array.prototype.forEach.call(document.querySelectorAll("#colL .tile"), function (t) { t.classList.remove("on"); });
      el.classList.add("on");
      speak(st.left[+el.getAttribute("data-i")], st.lang || "en");
      return;
    }
    var L = document.querySelector("#colL .tile.on");
    if (!L) { toast("请先点击左边的项"); return; }
    var lt = st.left[+L.getAttribute("data-i")];
    var rt = st.right[+el.getAttribute("data-i")];
    var pair = st.pairs.filter(function (p) { return p[0] === lt && p[1] === rt; })[0];
    if (pair) {
      L.classList.add("ok"); L.classList.remove("on");
      el.classList.add("ok");
      st.matched++;
      speak(pair[0], st.lang || "en");
      if (st.matched >= st.pairs.length) finishQuestion(true, "全部配对成功，跟读一遍发音吧！", { text: pair[0], lang: st.lang });
    } else {
      el.classList.add("no"); L.classList.remove("on");
      ses.wrong++;
      loseHeart();
      toast("不匹配 ❌");
      setTimeout(function () { el.classList.remove("no"); }, 350);
      if (S.hearts <= 0) finishQuestion(false, "正确示范：" + st.pairs[0][0] + " = " + st.pairs[0][1]);
    }
  }

  function onPoolClick(el, st) {
    if (el.classList.contains("ok") || el.disabled) return;
    el.classList.add("on"); el.disabled = true;
    ses.picks.push({ w: st.pool[+el.getAttribute("data-i")], src: el });
    renderSlots(st);
  }
  function renderSlots(st) {
    var slots = $("#slots");
    if (!ses.picks.length) {
      slots.innerHTML = '<span style="color:#bbb;font-weight:700">点击下方词块…</span>';
      return;
    }
    slots.innerHTML = ses.picks.map(function (p, i) { return '<button class="chip" data-i="' + i + '">' + p.w + "</button>"; }).join("");
    Array.prototype.forEach.call(slots.querySelectorAll(".chip"), function (c) {
      c.addEventListener("click", function () {
        if (ses.answered) return;
        var p = ses.picks.splice(+c.getAttribute("data-i"), 1)[0];
        p.src.classList.remove("on"); p.src.disabled = false;
        renderSlots(st);
      });
    });
    if (ses.picks.length === st.a.length && !ses.answered) {
      var good = ses.picks.every(function (p, i) { return p.w === st.a[i]; });
      ses.answered = true;
      Array.prototype.forEach.call(document.querySelectorAll("#poolBox .tile"), function (t) { t.disabled = true; });
      finishQuestion(good, st.tip, { text: st.read, lang: st.lang });
    }
  }

  function finishQuestion(good, tip, speakRef) {
    ses.answered = true;
    if (good) { ses.right = (ses.right || 0) + 1; }
    else { ses.wrong++; loseHeart(); }
    var foot = $("#qFoot");
    foot.style.display = "block";
    foot.className = "q-foot " + (good ? "correct" : "wrong");
    $("#fbTitle").textContent = good ? randomPraise() : "答错了，看看提示";
    $("#fbTip").innerHTML = (tip || "") +
      (good && speakRef && speakRef.text
        ? ' <button class="mini-speak" id="againBtn">🔊 再听一遍</button>' : "");
    var ab = $("#againBtn");
    if (ab && speakRef) ab.addEventListener("click", function () { speak(speakRef.text, speakRef.lang); });
    $("#checkBtn").textContent = (ses.i + 1 >= ses.steps.length) ? "查看结果" : "继续";
    $("#checkBtn").onclick = nextStep;
    $("#qBar").style.width = ((ses.i + 1) / ses.steps.length) * 100 + "%";
    if (good && speakRef && speakRef.text) speak(speakRef.text, speakRef.lang, 0.85);
    save(); renderStats();
  }

  function nextStep() {
    if (S.hearts <= 0) { toast("红心用完啦，休息一下吧"); closeLesson(); return; }
    ses.answered = false;
    ses.i++;
    if (ses.i >= ses.steps.length) showResult();
    else renderStep();
  }

  function loseHeart() {
    regenHearts();
    if (S.hearts > 0) { S.hearts--; S.heartsAt = Date.now(); }
    save();
    $("#qHearts").textContent = S.hearts;
    renderStats();
  }

  function showResult() {
    var perfect = ses.wrong === 0;
    var gain = 10 + (perfect ? 5 : 0);
    S.xp += gain; S.todayXp += gain; S.todayLessons = (S.todayLessons || 0) + 1;
    var prev = S.done[ses.lesson.id] || 0;
    var stars = perfect ? 3 : (ses.wrong <= 1 ? 2 : 1);
    S.done[ses.lesson.id] = Math.max(prev, stars);
    save(); renderStats(); renderPath();
    $("#qBody").style.display = "none";
    $("#qFoot").style.display = "none";
    $("#resultBox").classList.add("show");
    $("#resIcon").textContent = perfect ? "🏆" : "🎉";
    $("#resTitle").textContent = perfect ? "全对！太棒了" : "课程完成！";
    $("#resGain").innerHTML = "+" + gain + " 经验 " + repeat("⭐", stars) +
      '<br><span style="color:#888;font-weight:700">' + (perfect ? "全对奖励 +5 经验" : "错了 " + ses.wrong + " 题") + "</span>";
    $("#resBtn").onclick = closeLesson;
    $("#qBar").style.width = "100%";
    toast("+" + gain + " 经验 ⚡");
  }

  function closeLesson() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    $("#overlay").classList.remove("open");
    ses = null;
    renderStats(); renderPath();
  }

  $("#closeBtn").addEventListener("click", function () {
    if (ses && ses.i > 0 && !confirm("退出本课？当前进度不保存。")) return;
    closeLesson();
  });

  $("#tabs").addEventListener("click", function (e) {
    var t = e.target.closest(".tab"); if (!t) return;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.classList.remove("active"); });
    t.classList.add("active");
    var c = t.getAttribute("data-course");
    S.tab = c; save();
    if (c === "stats") {
      $("#pathBox").style.display = "none";
      $("#statsBox").style.display = "block";
      renderStatsPage();
    } else {
      $("#pathBox").style.display = "block";
      $("#statsBox").style.display = "none";
      S.course = c; save();
      renderPath();
    }
  });

  var vt = $("#voiceTest");
  if (vt) vt.addEventListener("click", function () {
    if (!hasVoice()) { toast("此浏览器不支持朗读"); return; }
    speak("こんにちは。Hello! 你好。", "ja", 0.9, function () {
      setTimeout(function () { speak("Hello! 你好，发音正常。", "en"); }, 350);
    });
  });

  function randomPraise() {
    return ["太棒了！", "完全正确！", "Excellent!", "すごい！", "Perfect!"][(Math.random() * 5) | 0];
  }
  var toastT;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove("show"); }, 1800);
  }

  /* 红心耗尽弹窗 */
  $("#refillBtn").addEventListener("click", function () {
    S.hearts = MAX_H; S.heartsAt = Date.now(); save();
    $("#heartsModal").classList.remove("open");
    renderStats(); toast("❤️ 红心已补满");
  });
  $("#waitBtn").addEventListener("click", function () {
    $("#heartsModal").classList.remove("open");
  });

  rollDay(); regenHearts();
  renderStats(); renderPath();
  if (S.tab && S.tab !== "ja") {
    var t = document.querySelector('.tab[data-course="' + S.tab + '"]');
    if (t) t.click();
  }
  setInterval(function () { regenHearts(); renderStats(); }, 60000);
})();