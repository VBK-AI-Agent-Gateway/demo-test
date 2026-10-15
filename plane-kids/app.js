/* 小小飞机总动员 - 拼装 + 飞行模拟（儿童科普） */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var KEY = "planekids-v1";

  /* ---------- 零件定义（SVG 视图坐标系 640x420） ---------- */
  var PARTS = [
    { id: "body", name: "机身", hint: "飞机的主体", ic: "🛩️",
      fact: "机身是飞机的“身体”，乘客和货物都坐在里面。",
      slot: { x: 170, y: 175, w: 300, h: 70, r: 35 },
      svg: '<rect x="170" y="175" width="300" height="70" rx="35" fill="#b7e6ff" stroke="#5aa9dd" stroke-width="5"/><circle cx="400" cy="200" r="9" fill="#fff" stroke="#5aa9dd" stroke-width="4"/><circle cx="370" cy="200" r="9" fill="#fff" stroke="#5aa9dd" stroke-width="4"/><circle cx="340" cy="200" r="9" fill="#fff" stroke="#5aa9dd" stroke-width="4"/>' },
    { id: "wingR", name: "机翼（右侧）", hint: "让飞机飞起来", ic: "🪽",
      fact: "机翼上下有弧度，空气流过产生升力，把飞机托上天。",
      slot: { x: 300, y: 95, w: 100, h: 80, r: 10 },
      svg: '<path d="M300 175 L340 95 L400 95 L390 175 Z" fill="#9ad9ff" stroke="#5aa9dd" stroke-width="5"/>' },
    { id: "wingL", name: "主机翼（左侧）", hint: "和右边一起托起飞机", ic: "🛫",
      fact: "左右机翼一起工作，才能让飞机稳稳地飞在空中。",
      slot: { x: 60, y: 195, w: 110, h: 65, r: 10 },
      svg: '<path d="M170 195 L60 235 L60 260 L170 245 Z" fill="#9ad9ff" stroke="#5aa9dd" stroke-width="5"/>' },
    { id: "hTail", name: "水平尾翼", hint: "保持平衡的小尾巴", ic: "(balance)",
      fact: "水平尾翼像小鸟的尾巴，帮助飞机保持平衡、不乱晃。",
      slot: { x: 470, y: 175, w: 90, h: 70, r: 10 },
      svg: '<path d="M470 210 L560 175 L585 175 L560 215 Z" fill="#cfc3f2" stroke="#9a86e0" stroke-width="5"/><path d="M470 210 L560 245 L585 245 L560 205 Z" fill="#cfc3f2" stroke="#9a86e0" stroke-width="5"/>' },
    { id: "vTail", name: "垂直尾翼", hint: "控制方向的立牌", ic: "directions",
      fact: "垂直尾翼帮飞机“转弯”，向左还是向右都听它的。",
      slot: { x: 470, y: 110, w: 46, h: 90, r: 10 },
      svg: '<path d="M470 200 L478 110 L516 110 L512 200 Z" fill="#ffd66b" stroke="#e0a93c" stroke-width="5"/>' },
    { id: "engine", name: "发动机", hint: "飞机的动力", ic: "⚙️",
      fact: "发动机是飞机的“心脏”，转动螺旋桨产生向前的推力。",
      slot: { x: 120, y: 188, w: 60, h: 46, r: 18 },
      svg: '<rect x="120" y="188" width="60" height="46" rx="18" fill="#ffd66b" stroke="#e0a93c" stroke-width="5"/><ellipse cx="124" cy="211" rx="8" ry="20" fill="#fff" stroke="#e0a93c" stroke-width="4"/>' }
  ];

  var fitted = {};   // id -> true
  var soundOn = true;
  try { var st = JSON.parse(localStorage.getItem(KEY)); if (st) { fitted = st.fitted || {}; soundOn = st.soundOn !== false; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ fitted: fitted, soundOn: soundOn })); } catch (e) {} }

  /* ---------- 音效（WebAudio 合成，无外部文件） ---------- */
  var AC = null, engOsc = null, engGain = null, engStarted = false;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
  function beep(freq, dur, type, vol) {
    if (!soundOn) return; var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.value = vol || 0.12;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (dur || 0.25));
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + (dur || 0.25));
  }
  function sndGood() { beep(660, .18, "sine", .14); setTimeout(function () { beep(880, .22, "sine", .14); }, 130); }
  function sndBad() { beep(220, .25, "triangle", .12); }
  function sndClick() { beep(520, .1, "square", .07); }
  function sndWin() { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, .3, "sine", .13); }, i * 150); }); }
  function engStart() {
    if (!soundOn || engStarted) return; var c = ac(); if (!c) return;
    if (c.state === "suspended") c.resume();
    engOsc = c.createOscillator(); engGain = c.createGain();
    engOsc.type = "sawtooth"; engOsc.frequency.value = 70;
    engGain.gain.value = 0.05;
    var f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
    engOsc.connect(f); f.connect(engGain); engGain.connect(c.destination);
    engOsc.start(); engStarted = true;
  }
  function engStop() { if (engOsc) { try { engOsc.stop(); } catch (e) {} engOsc = null; engStarted = false; } }
  function engPitch(v) { if (engOsc && AC) engOsc.frequency.setTargetAtTime(60 + Math.abs(v) * 60, AC.currentTime, .2); }

  var soundBtn = $("#soundBtn");
  function renderSound() {
    soundBtn.textContent = soundOn ? "🔊 音效开" : "🔇 音效关";
    soundBtn.classList.toggle("on", soundOn);
  }
  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn; save(); renderSound();
    if (!soundOn) engStop(); else if (inFly) engStart();
    sndClick();
  });
  renderSound();

  /* ---------- 渲染零件栏与卡槽 ---------- */
  function renderParts() {
    var box = $("#parts");
    box.innerHTML = PARTS.filter(function (p) { return !fitted[p.id]; }).map(function (p) {
      return '<div class="part-card" data-id="' + p.id + '" draggable="false">' +
        '<svg viewBox="0 0 640 420" aria-hidden="true">' + p.svg + '</svg>' +
        '<div><div class="part-name">' + p.ic.replace(/[^\u{1F300}-\u{1FAFF}]/gu, "") + " " + p.name + '</div><div class="part-hint">' + p.hint + "</div></div></div>";
    }).join("");
    if (!box.children.length) box.innerHTML = '<div class="part-hint" style="text-align:center;padding:12px">全部装好啦 🎉</div>';
    Array.prototype.forEach.call(box.querySelectorAll(".part-card"), bindDrag);
    renderProgress();
  }
  function renderSlots() {
    var g = $("#slots"), fg = $("#fitted");
    g.innerHTML = ""; fg.innerHTML = "";
    PARTS.forEach(function (p) {
      if (fitted[p.id]) return;
      var el = document.createElementNS("http://www.w3.org/2000/svg", "g");
      el.setAttribute("class", "slot"); el.setAttribute("data-id", p.id);
      var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("class", "slot-bg");
      rect.setAttribute("x", p.slot.x); rect.setAttribute("y", p.slot.y);
      rect.setAttribute("width", p.slot.w); rect.setAttribute("height", p.slot.h);
      rect.setAttribute("rx", p.slot.r);
      el.appendChild(rect);
      g.appendChild(el);
    });
    PARTS.forEach(function (p) {
      if (!fitted[p.id]) return;
      var el = document.createElementNS("http://www.w3.org/2000/svg", "g");
      el.setAttribute("class", "fitted-part");
      el.innerHTML = p.svg;
      fg.appendChild(el);
    });
  }
  function renderProgress() {
    var n = PARTS.filter(function (p) { return fitted[p.id]; }).length;
    $("#progLabel").textContent = "进度 " + n + "/" + PARTS.length;
    $("#progFill").style.width = (n / PARTS.length) * 100 + "%";
    return n;
  }

  /* ---------- 拖拽（Pointer Events，鼠标+触屏） ---------- */
  var drag = null;
  function bindDrag(el) {
    el.addEventListener("pointerdown", onDown);
  }
  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    var card = e.currentTarget, id = card.getAttribute("data-id");
    var part = PARTS.filter(function (p) { return p.id === id; })[0];
    if (!part || fitted[id]) return;
    e.preventDefault();
    card.setPointerCapture && card.setPointerCapture(e.pointerId);
    var ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.style.width = card.offsetWidth + "px";
    ghost.innerHTML = '<div class="part-card" style="cursor:grabbing"><svg viewBox="0 0 640 420">' + part.svg +
      '</svg><div><div class="part-name">' + part.name + '</div><div class="part-hint">' + part.hint + "</div></div></div>";
    document.body.appendChild(ghost);
    card.classList.add("dragging");
    drag = { id: id, part: part, ghost: ghost, card: card, moved: false };
    moveGhost(e.clientX, e.clientY);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }
  function moveGhost(x, y) {
    if (!drag) return;
    drag.ghost.style.left = (x - drag.ghost.offsetWidth / 2) + "px";
    drag.ghost.style.top = (y - drag.ghost.offsetHeight / 2) + "px";
    // 命中检测
    var svg = $("#planeSvg"), r = svg.getBoundingClientRect();
    var vb = { w: 640, h: 420 };
    var vx = (x - r.left) / r.width * vb.w;
    var vy = (y - r.top) / r.height * vb.h;
    var s = drag.part.slot;
    var over = vx >= s.x - 14 && vx <= s.x + s.w + 14 && vy >= s.y - 14 && vy <= s.y + s.h + 14;
    var slotEl = document.querySelector('.slot[data-id="' + drag.id + '"]');
    Array.prototype.forEach.call(document.querySelectorAll(".slot"), function (el) { el.classList.remove("over"); });
    // 允许“大致对到该区域”，也允许拖到任何空槽位但只对本件生效
    if (over && slotEl) slotEl.classList.add("over");
    drag.over = over;
  }
  function onMove(e) { if (drag) { drag.moved = true; moveGhost(e.clientX, e.clientY); } }
  function onUp(e) {
    if (!drag) return;
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    var d = drag; drag = null;
    d.ghost.remove();
    d.card.classList.remove("dragging");
    Array.prototype.forEach.call(document.querySelectorAll(".slot"), function (el) { el.classList.remove("over"); });
    if (d.over) fitPart(d.part);
    else if (d.moved) { sndBad(); toast("放回零件栏啦，再试试对应的位置～"); }
  }

  function fitPart(p) {
    fitted[p.id] = true; save();
    sndGood();
    renderSlots(); renderParts();
    showFact(p);
    var n = renderProgress();
    if (n >= PARTS.length) {
      setTimeout(function () { sndWin(); $("#doneModal").classList.add("open"); }, 500);
    }
  }

  /* ---------- 科普卡片 ---------- */
  var factCb = null;
  function showFact(p) {
    $("#factIc").textContent = p.ic.length <= 3 ? p.ic : "🔧";
    $("#factName").textContent = p.name;
    $("#factText").textContent = p.fact;
    $("#factModal").classList.add("open");
    factCb = null;
  }
  function hideFact() { $("#factModal").classList.remove("open"); if (factCb) factCb(); }
  $("#factClose").addEventListener("click", hideFact);
  $("#factOk").addEventListener("click", hideFact);
  $("#factModal").addEventListener("click", function (e) { if (e.target === e.currentTarget) hideFact(); });

  /* ---------- 完成 → 飞行 ---------- */
  $("#startFly").addEventListener("click", function () {
    $("#doneModal").classList.remove("open");
    enterFly();
  });

  /* ---------- toast ---------- */
  var tt;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove("show"); }, 1700);
  }

  /* ---------- 初始化拼装页 ---------- */
  renderSlots(); renderParts();

  // 若上次已拼完，仍从拼装页开始（用户可点零件栏提示）
  window.PK = { enterFly: enterFly, reset: resetAll, PARTS: PARTS };
  function resetAll() {
    fitted = {}; save();
    inFly = false;
    $("#flyStage").style.display = "none";
    $("#buildStage").style.display = "flex";
    $("#stageTip").textContent = "把左边的零件拖到飞机身上，拼好就能飞啦！";
    renderSlots(); renderParts();
    engStop();
  }
  function noop() {}
  var inFly = false;

  /* 以下为飞行模拟（第二阶段），见 fly 段 */
  // eslint-disable-next-line no-undef
  if (typeof window !== "undefined") initFly();

  function initFly() {
    var joy = $("#joy"), knob = $("#joyKnob"), planeFly = $("#planeFly");
    var jx = 0, jy = 0, dragging = false, raf = null;
    var alt = 200, spd = 60, pitch = 0, roll = 0, yaw = 0;
    var clouds = [];

    // 生成云朵
    function makeClouds() {
      var box = $("#clouds"); box.innerHTML = ""; clouds = [];
      for (var i = 0; i < 6; i++) {
        var c = document.createElement("div");
        c.className = "cloud";
        c.style.left = (Math.random() * 110 - 5) + "%";
        c.style.top = (8 + Math.random() * 55) + "%";
        c.style.transform = "scale(" + (0.7 + Math.random() * 0.9) + ")";
        c.innerHTML = '<svg width="150" height="70" viewBox="0 0 150 70"><g fill="#ffffff">' +
          '<ellipse cx="45" cy="46" rx="42" ry="22"/><ellipse cx="85" cy="38" rx="46" ry="26"/><ellipse cx="120" cy="48" rx="30" ry="18"/></g></svg>';
        box.appendChild(c);
        clouds.push({ el: c, sp: 0.02 + Math.random() * 0.04 });
      }
    }
    makeClouds();

    function loop() {
      // 云缓慢移动（受左右杆影响产生视差）
      clouds.forEach(function (c) {
        var cur = parseFloat(c.el.dataset.x || c.el.style.left) || 0;
        var x = parseFloat(c.el.dataset.px || c.el.style.left);
        if (isNaN(x)) x = parseFloat(c.el.style.left);
        x += c.sp - jx * 0.12;
        if (x > 115) x = -20; if (x < -20) x = 115;
        c.el.dataset.px = x; c.el.style.left = x + "%";
      });
      // 姿态
      var targetPitch = -jy * 26;    // 推杆(下)=低头
      var targetRoll = jx * 34;      // 右=右倾
      pitch += (targetPitch - pitch) * 0.12;
      roll += (targetRoll - roll) * 0.12;
      yaw += jx * 0.35;
      alt = Math.max(50, Math.min(2000, alt - jy * 6 + 0.4));
      spd = Math.max(30, Math.min(220, 70 + Math.abs(jy) * 40 + (pitch < 0 ? 15 : 0)));
      planeFly.style.transform = "translate(-50%,-50%) translateY(" + (-pitch * 1.4) + "px) rotate(" + roll + "deg) scale(" + (1 + pitch / 400) + ")";
      $("#altShow").textContent = "高度 ✈ " + Math.round(alt) + " m";
      $("#spdShow").textContent = "速度 🚀 " + Math.round(spd) + " km/h";
      engPitch(jy);
      raf = requestAnimationFrame(loop);
    }

    function setKnob(dx, dy) {
      var max = joy.offsetWidth / 2 - 40;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = "translate(" + dx + "px," + dy + "px)";
      jx = dx / max; jy = dy / max;
    }
    function centerKnob() { knob.style.transform = "translate(0,0)"; jx = 0; jy = 0; }

    joy.addEventListener("pointerdown", function (e) {
      dragging = true; joy.setPointerCapture && joy.setPointerCapture(e.pointerId);
      sndClick(); update(e);
    });
    joy.addEventListener("pointermove", function (e) { if (dragging) update(e); });
    joy.addEventListener("pointerup", function () { dragging = false; centerKnob(); });
    joy.addEventListener("pointercancel", function () { dragging = false; centerKnob(); });
    function update(e) {
      var r = joy.getBoundingClientRect();
      setKnob(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    }

    window.PK.enterFly = function () {
      inFly = true;
      $("#buildStage").style.display = "none";
      $("#flyStage").style.display = "block";
      makeClouds(); centerKnob(); alt = 200; spd = 60; pitch = 0; roll = 0;
      if (raf) cancelAnimationFrame(raf);
      engStart(); loop();
      toast("用右边摇杆驾驶飞机吧！");
    };
    window.PK.reset = function () {
      inFly = false;
      if (raf) cancelAnimationFrame(raf); raf = null;
      engStop(); centerKnob();
      fitted = {}; save();
      $("#flyStage").style.display = "none";
      $("#buildStage").style.display = "flex";
      $("#stageTip").textContent = "重新拼一次吧！拖动零件到正确位置～";
      renderSlots(); renderParts();
      toast("已回到拼装页 🧰");
    };
    $("#resetBtn").addEventListener("click", function () { sndClick(); window.PK.reset(); });
  }

  function enterFly() { window.PK.enterFly(); }
})();