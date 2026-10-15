/* LexAI 交互逻辑 */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.style.opacity = "1";
    t.style.transform = "translate(-50%, 0)";
    clearTimeout(t._t);
    t._t = setTimeout(function () {
      t.style.opacity = "0";
      t.style.transform = "translate(-50%, 16px)";
    }, 1800);
  }

  /* ---------- 汉堡菜单 / 抽屉 ---------- */
  var side = $("#sidebar"), scrim = $("#scrim");
  function openSide() { side.classList.remove("-translate-x-full"); scrim.classList.remove("hidden"); }
  function closeSide() { side.classList.add("-translate-x-full"); scrim.classList.add("hidden"); }
  $("#openSide").addEventListener("click", openSide);
  $("#closeSide").addEventListener("click", closeSide);
  scrim.addEventListener("click", closeSide);

  /* ---------- 模式切换 ---------- */
  $$(".mode-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".mode-btn").forEach(function (x) {
        var on = x === b;
        x.classList.toggle("bg-brand", on);
        x.classList.toggle("text-white", on);
        x.classList.toggle("shadow-glow", on);
        x.classList.toggle("text-slate-400", !on);
      });
      var m = b.getAttribute("data-mode");
      $("#mode-contract").classList.toggle("hidden", m !== "contract");
      $("#mode-ai").classList.toggle("hidden", m !== "ai");
      $("#pageTitle").textContent = m === "contract" ? "合同审查 · 双栏对照" : "AI 治理 · AIA 仪表盘";
      if (window.innerWidth < 768) { closeSide(); window.scrollTo({ top: 0, behavior: "smooth" }); }
      if (m === "ai") animateAia();
      toast(m === "contract" ? "已切换到合同审查" : "已切换到 AI 治理");
    });
  });

  /* ---------- 侧栏导航 ---------- */
  $$(".nav-item").forEach(function (n) {
    n.addEventListener("click", function () {
      $$(".nav-item").forEach(function (x) { x.classList.toggle("active", x === n); });
      var k = n.getAttribute("data-nav");
      var mode = (k === "aia") ? "ai" : "contract";
      var btn = document.querySelector('.mode-btn[data-mode="' + mode + '"]');
      if (btn && !btn.classList.contains("bg-brand")) btn.click();
      if (window.innerWidth < 768) {
        closeSide();
        if (k === "doc" || k === "redline") switchPane("doc");
        else if (k === "risk") switchPane("risk");
      }
      if (k === "redline") {
        var el = $("#paneRisk");
        var rl = $$(".rounded-2xl", el).find ? null : null;
        var cards = $$("#paneRisk .rounded-2xl");
        if (cards[1]) cards[1].scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (k === "aia") animateAia();
    });
  });

  /* ---------- 移动端双栏 → Tabs ---------- */
  var paneDoc = $("#paneDoc"), paneRisk = $("#paneRisk");
  var tabDocBtn = $("#tabDoc"), tabRiskBtn = $("#tabRisk");
  function switchPane(which) {
    var isMobile = window.innerWidth < 1024;
    var showDoc = which === "doc";
    if (isMobile) {
      paneDoc.classList.toggle("hidden", !showDoc);
      paneRisk.classList.toggle("hidden", showDoc);
      paneRisk.classList.toggle("lg:flex", true);
    } else {
      paneDoc.classList.remove("hidden");
      paneRisk.classList.remove("hidden");
      paneRisk.classList.add("lg:flex");
    }
    tabDocBtn.classList.toggle("active", showDoc);
    tabRiskBtn.classList.toggle("active", !showDoc);
    setBarTabs(which);
  }
  tabDocBtn.addEventListener("click", function () { switchPane("doc"); });
  tabRiskBtn.addEventListener("click", function () { switchPane("risk"); });

  /* 吸底栏 tab 同步 */
  function setBarTabs(which) {
    var a = $("#barTabA"), b = $("#barTabB");
    [a, b].forEach(function (x) {
      x.classList.remove("bg-brand", "text-white", "border-brand/50");
      x.classList.add("bg-ink3", "border-white/15", "text-slate-300");
    });
    var cur = which === "doc" ? a : b;
    cur.classList.remove("bg-ink3", "border-white/15", "text-slate-300");
    cur.classList.add("bg-brand", "text-white", "border-brand/50");
  }
  $("#barTabA").addEventListener("click", function () { switchPane("doc"); });
  $("#barTabB").addEventListener("click", function () { switchPane("risk"); });
  $("#barGo").addEventListener("click", function () { runDemo(); });
  $("#demoBtn").addEventListener("click", function () { runDemo(); });

  function runDemo() {
    switchPane("risk");
    animateAia();
    toast("示例审查完成：🔴 2 高风险 / 🟡 3 中风险");
    if (window.innerWidth >= 1024) $("#paneRisk").scrollIntoView({ behavior: "smooth", block: "nearest" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- 高亮 ↔ 风险卡联动 ---------- */
  $$(".hl-red, .hl-amber").forEach(function (h) {
    h.addEventListener("click", function () {
      if (window.innerWidth < 1024) switchPane("risk");
      var key = h.getAttribute("data-risk");
      var row = document.querySelector('.risk-row[data-target="' + key + '"]');
      if (row) {
        row.classList.add("flash");
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function () { row.classList.remove("flash"); }, 1200);
      }
    });
  });
  $$(".risk-row").forEach(function (r) {
    r.addEventListener("click", function () {
      var key = r.getAttribute("data-target");
      if (window.innerWidth < 1024) switchPane("doc");
      var hl = document.querySelector('.hl-red[data-risk="' + key + '"], .hl-amber[data-risk="' + key + '"]');
      if (hl) {
        hl.classList.add("flash");
        hl.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function () { hl.classList.remove("flash"); }, 1200);
      }
    });
  });

  /* ---------- AIA 进度条动画 ---------- */
  var aiaDone = false;
  function animateAia() {
    $$(".aia").forEach(function (a, i) {
      var bar = a.querySelector(".aia-bar i");
      var pct = a.getAttribute("data-pct");
      bar.style.width = "0%";
      setTimeout(function () { bar.style.width = pct + "%"; }, 120 * i + 100);
    });
    aiaDone = true;
  }

  /* ---------- 断点自适应 ---------- */
  function onResize() {
    if (window.innerWidth >= 768) { closeSide(); }
    if (window.innerWidth >= 1024) {
      paneDoc.classList.remove("hidden");
      paneRisk.classList.remove("hidden");
      paneRisk.classList.add("lg:flex");
    } else {
      switchPane(tabDocBtn.classList.contains("active") ? "doc" : "risk");
    }
    if (window.innerWidth >= 768) $("#scrim").classList.add("hidden");
  }
  window.addEventListener("resize", onResize);
  onResize();
  setBarTabs("doc");
  if (!aiaDone) animateAia();
})();