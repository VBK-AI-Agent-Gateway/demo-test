/* LingoTree - Duolingo-style JA/EN learning SPA */
(function () {
  "use strict";
  var KEY = "lingotree-v1", MAX_H = 5, HEART_MS = 30 * 60 * 1000;
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
    if (s.course == null) s.course = "ja";
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function today() { return new Date().toISOString().slice(0, 10); }

  function regenHearts() {
    if (S.hearts >= MAX_H) return;
    var now = Date.now();
    if (now - S.heartsAt >= HEART_MS) {
      var gain = Math.floor((now - S.heartsAt) / HEART_MS);
      S.hearts = Math.min(MAX_H, S.hearts + gain);
      S.heartsAt = S.hearts >= MAX_H ? now : S.heartsAt + gain * HEART_MS;
      save();
    }
  }
  function rollDay() {
    var d = today();
    if (S.lastDay === d) return;
    var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (S.lastDay === y && S.todayXp > 0) S.streak++;
    else if (S.lastDay && S.lastDay !== y) S.streak = 1;
    else if (!S.lastDay) S.streak = Math.max(S.streak, 1);
    S.lastDay = d; S.todayXp = 0;
    save();
  }

  function allLessons() {
    var out = [];
    Object.keys(DATA.units).forEach(function (ck) {
      DATA.units[ck].forEach(function (u) { u.lessons.forEach(function (l) { out.push(l); }); });
    });
    return out;
  }

  function renderStats() {
    $("#xpN").textContent = S.xp;
    $("#heartN").textContent = S.hearts;
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
    if (S.hearts <= 0) { toast("红心用完啦，30 分钟后恢复"); return; }
    var l = findLesson(lid);
    if (!l) return;
    var steps = [];
    if (l.kind === "match") {
      steps.push({ type: "match", left: l.pairs.map(function (p) { return p[0]; }),
        right: shuffle(l.pairs.map(function (p) { return p[1]; })), pairs: l.pairs, matched: 0 });
    } else if (l.kind === "build") {
      l.items.forEach(function (it) {
        steps.push({ type: "build", q: it.q, a: it.a, tip: it.tip, pool: shuffle(it.words.slice()) });
      });
    } else if (l.kind === "listen") {
      l.items.forEach(function (it) {
        steps.push({ type: "pick", listen: true, say: it.say, q: it.q, opts: it.opts, a: it.a, tip: it.tip });
      });
    } else {
      l.items.forEach(function (it) {
        steps.push({ type: "pick", q: it.q, opts: it.opts, a: it.a, tip: it.tip });
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
    $("#qBar").style.width = (ses.i / ses.steps.length) * 100 + "%";
    $("#qHearts").textContent = S.hearts;
    $("#qFoot").style.display = "none";
    $("#qFoot").className = "q-foot";
    $("#resultBox").classList.remove("show");
    var b = $("#qBody");
    b.style.display = "block";

    if (st.type === "pick") {
      var h = "";
      if (st.listen) h += '<button class="tile" id="speakBtn" style="width:96px;height:96px;font-size:40px;margin-bottom:18px;aspect-ratio:1">🔊</button>';
      h += '<div class="q-prompt">' + st.q + '</div><div class="q-sub">' +
        (st.listen ? "点击 🔊 再听一次" : "选择正确答案") + '</div><div class="opts" id="optsBox">';
      st.opts.forEach(function (o, i) { h += '<button class="opt" data-i="' + i + '">' + o + "</button>"; });
      b.innerHTML = h;
      Array.prototype.forEach.call(b.querySelectorAll(".opt"), function (el) {
        el.addEventListener("click", function () { onPick(el, +el.getAttribute("data-i")); });
      });
      if (st.listen) {
        $("#speakBtn").addEventListener("click", function () { speak(st.say); });
        setTimeout(function () { speak(st.say); }, 250);
      }
    } else if (st.type === "match") {
      b.innerHTML = '<div class="q-prompt">配对连接</div><div class="q-sub">点击左右两栏中对应的项</div>' +
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
      b.innerHTML = '<div class="q-prompt">' + st.q + '</div><div class="q-sub">点击词块按顺序组成句子</div>' +
        '<div class="ans-slots" id="slots"></div><div class="cards" id="poolBox">' +
        st.pool.map(function (w, i) {
          return '<button class="tile" data-i="' + i + '" style="aspect-ratio:auto;min-height:56px;font-size:17px">' + w + "</button>";
        }).join("") + "</div>";
      $("#slots").innerHTML = '<span style="color:#bbb;font-weight:700">点击下方词块…</span>';
      Array.prototype.forEach.call(b.querySelectorAll("#poolBox .tile"), function (el) {
        el.addEventListener("click", function () { onPoolClick(el, st); });
      });
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
    finishQuestion(good, st.tip);
  }

  function onMatchTile(el, st) {
    if (el.classList.contains("ok")) return;
    if (el.getAttribute("data-col") === "l") {
      Array.prototype.forEach.call(document.querySelectorAll("#colL .tile"), function (t) { t.classList.remove("on"); });
      el.classList.add("on");
      return;
    }
    var L = document.querySelector("#colL .tile.on");
    if (!L) { toast("先点左边的项"); return; }
    var lt = st.left[+L.getAttribute("data-i")];
    var rt = st.right[+el.getAttribute("data-i")];
    var isPair = st.pairs.some(function (p) { return (p[0] === lt && p[1] === rt) || (p[0] === rt && p[1] === lt); });
    if (isPair) {
      L.classList.add("ok"); L.classList.remove("on");
      el.classList.add("ok");
      st.matched++;
      if (st.matched >= st.pairs.length) finishQuestion(true, "全部配对成功！");
    } else {
      el.classList.add("no"); L.classList.remove("on");
      ses.wrong++;
      loseHeart();
      toast("不匹配 ❌");
      setTimeout(function () { el.classList.remove("no"); }, 350);
      if (S.hearts <= 0) finishQuestion(false, st.pairs[0][0] + " = " + st.pairs[0][1]);
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
      finishQuestion(good, st.tip);
    }
  }

  function finishQuestion(good, tip) {
    ses.answered = true;
    if (good) { ses.right = (ses.right || 0) + 1; }
    else { ses.wrong++; loseHeart(); }
    var foot = $("#qFoot");
    foot.style.display = "block";
    foot.className = "q-foot " + (good ? "correct" : "wrong");
    $("#fbTitle").textContent = good ? randomPraise() : "答错了";
    $("#fbTip").textContent = tip || "";
    $("#checkBtn").textContent = (ses.i + 1 >= ses.steps.length) ? "查看结果" : "继续";
    $("#checkBtn").onclick = nextStep;
    $("#qBar").style.width = ((ses.i + 1) / ses.steps.length) * 100 + "%";
    save(); renderStats();
  }

  function nextStep() {
    if (S.hearts <= 0) { toast("红心用完啦，休息下吧"); closeLesson(); return; }
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
    S.xp += gain; S.todayXp += gain;
    var prev = S.done[ses.lesson.id] || 0;
    var stars = perfect ? 3 : (ses.wrong <= 1 ? 2 : 1);
    S.done[ses.lesson.id] = Math.max(prev, stars);
    save(); renderStats(); renderPath();
    $("#qBody").style.display = "none";
    $("#qFoot").style.display = "none";
    $("#resultBox").classList.add("show");
    $("#resGain").innerHTML = "+" + gain + " XP " + repeat("⭐", stars) +
      '<br><span style="color:#888;font-weight:700">' + (perfect ? "全对奖励 +5 XP" : "错了 " + ses.wrong + " 题") + "</span>";
    $("#resBtn").onclick = closeLesson;
    $("#qBar").style.width = "100%";
    toast("+" + gain + " XP");
  }

  function closeLesson() {
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
    S.course = t.getAttribute("data-course"); save();
    renderPath();
  });

  function speak(text) {
    if (!("speechSynthesis" in window)) { toast("此浏览器不支持朗读"); return; }
    var isJa = /[\u3040-\u30ff]/.test(text);
    var u = new SpeechSynthesisUtterance(text);
    u.lang = isJa ? "ja-JP" : "en-US";
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  function randomPraise() {
    return ["太棒了！", "正确！", "Excellent!", "すごい！", "Perfect!"][(Math.random() * 5) | 0];
  }
  var toastT;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove("show"); }, 1800);
  }

  rollDay(); regenHearts();
  renderStats(); renderPath();
  setInterval(function () { regenHearts(); renderStats(); }, 60000);
})();