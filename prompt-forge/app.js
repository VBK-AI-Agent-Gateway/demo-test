/* Prompt Forge - 提示词生成器逻辑 */
(function () {
  "use strict";
  var KEY = "promptforge-v1";
  function $(s) { return document.querySelector(s); }
  var S = { scene: "article", history: [], variant: 0 };

  try { var raw = JSON.parse(localStorage.getItem(KEY)); if (raw && raw.history) S = raw; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function sceneById(id) {
    for (var i = 0; i < PF.scenes.length; i++) if (PF.scenes[i].id === id) return PF.scenes[i];
    return PF.scenes[0];
  }
  function fmtName(id) {
    for (var i = 0; i < PF.formats.length; i++) if (PF.formats[i].id === id) return PF.formats[i].name;
    return "Markdown";
  }

  /* ---- 初始化控件 ---- */
  function fillSelect(sel, arr, keep) {
    var v = keep ? sel.value : null;
    sel.innerHTML = arr.map(function (x) { return "<option>" + x + "</option>"; }).join("");
    if (v) sel.value = v;
  }
  fillSelect($("#fStyle"), PF.styles);
  fillSelect($("#fLength"), PF.lengths);
  $("#fFormat").innerHTML = PF.formats.map(function (f) { return '<option value="' + f.id + '">' + f.name + "</option>"; }).join("");

  function renderSceneChips() {
    $("#sceneChips").innerHTML = PF.scenes.map(function (s) {
      return '<button class="chip-scene' + (s.id === S.scene ? " on" : "") + '" data-id="' + s.id + '">' + s.name + "</button>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".chip-scene"), function (b) {
      b.addEventListener("click", function () {
        S.scene = b.getAttribute("data-id");
        renderSceneChips();
        applySceneDefaults();
      });
    });
  }
  function applySceneDefaults() {
    var sc = sceneById(S.scene);
    if (!$("#fGoal").value.trim()) $("#fGoal").placeholder = sc.goal;
    $("#fFormat").value = sc.format;
    if (!$("#fConstraints").value.trim() && sc.constraints.length) {
      $("#fConstraints").placeholder = sc.constraints.join("\n");
    }
  }

  function splitLines(t) {
    return t.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  var VARIANTS = [
    function (goal) { return goal; },
    function (goal) { return goal + "，请一步步完成"; },
    function (goal) { return "请先理解需求，再" + goal; },
    function (goal) { return "围绕以下目标展开：" + goal; }
  ];

  /* ---- 生成 ---- */
  function build() {
    var sc = sceneById(S.scene);
    var goal = $("#fGoal").value.trim() || sc.goal.replace("「主题」", $("#fTopic").value.trim() || "你的主题");
    var topic = $("#fTopic").value.trim();
    var style = $("#fStyle").value;
    var audience = $("#fAudience").value.trim();
    var length = $("#fLength").value;
    var format = $("#fFormat").value;
    var details = splitLines($("#fDetails").value);
    var cons = splitLines($("#fConstraints").value);
    if (!details.length) details = sc.details;
    if (!cons.length && $("#fConstraints").placeholder === sc.constraints.join("\n")) cons = sc.constraints;

    var needRole = $("#oRole").checked, needSteps = $("#oSteps").checked,
        needShot = $("#oFewshot").checked, needReask = $("#oReask").checked;

    var L = [];
    if (needRole) L.push("# 角色", sc.role, "");
    L.push("# 任务", VARIANTS[S.variant % VARIANTS.length](goal) + "。", "");
    if (topic) L.push("# 主题 / 对象", topic, "");
    L.push("# 要求");
    L.push("- 语气风格：" + style);
    if (audience) L.push("- 目标受众：" + audience);
    L.push("- 篇幅：" + length);
    L.push("- 输出格式：" + fmtName(format));
    if (details.length) {
      L.push("- 必须包含：");
      details.forEach(function (d) { L.push("  * " + d); });
    }
    if (needSteps) {
      L.push("- 过程：先用 3-5 条列出你的提纲/思路，然后再输出正式内容；正式内容单独给出。");
    }
    if (needShot) {
      L.push("- 示例：先给出 1 个符合要求的简短样例（≤60 字），再输出正式内容。");
    }
    if (cons.length) {
      L.push("", "# 约束");
      cons.forEach(function (c) { L.push("- " + c); });
    }
    L.push("- 输出语言：简体中文（除非任务本身是外语）。", "");
    if (needReask) {
      L.push("# 输出前自检", "在正式回答前，先用一行检查是否满足：角色、任务、全部要点、格式、约束；有缺先补齐再输出正式内容。");
    }
    return L.join("\n");
  }

  function generate(advance) {
    if (advance) S.variant++;
    else if (!$("#output").dataset.filled) S.variant = 0;
    var text = build();
    $("#output").textContent = text;
    $("#output").dataset.filled = "1";
    save();
  }

  /* ---- 事件 ---- */
  $("#genBtn").addEventListener("click", function () { generate(true); });
  $("#regenBtn").addEventListener("click", function () { generate(true); toast("已换一种表达方式 🔄"); });
  $("#clearBtn").addEventListener("click", function () {
    $("#fGoal").value = ""; $("#fTopic").value = ""; $("#fAudience").value = "";
    $("#fDetails").value = ""; $("#fConstraints").value = "";
    delete $("#output").dataset.filled;
    $("#output").textContent = "已清空，重新填写要素即可。";
    S.variant = 0;
  });

  $("#copyBtn").addEventListener("click", function () {
    var t = $("#output").textContent;
    if (!t || !$("#output").dataset.filled) { toast("还没有生成内容"); return; }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = t; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("已复制到剪贴板 📋"); }
      catch (e) { toast("复制失败，请手动选择复制"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { toast("已复制到剪贴板 📋"); }, fallback);
    } else fallback();
  });

  $("#saveBtn").addEventListener("click", function () {
    var t = $("#output").textContent;
    if (!t || !$("#output").dataset.filled) { toast("先生成再保存"); return; }
    S.history.unshift({ t: t, at: new Date().toLocaleString("zh-CN"), goal: $("#fGoal").value.trim() });
    S.history = S.history.slice(0, 50);
    save(); renderHistCount();
    toast("已存入历史 💾");
  });

  function renderHistCount() { $("#histN").textContent = S.history.length; }

  $("#histBtn").addEventListener("click", function () {
    $("#histModal").classList.add("open");
    var list = $("#histList");
    if (!S.history.length) { list.innerHTML = '<p class="empty">暂无历史，生成后点「存入历史」。</p>'; return; }
    list.innerHTML = S.history.map(function (h, i) {
      return '<div class="hist-item"><div class="hist-meta"><b>' + (h.goal || "未命名") + "</b><span>" + h.at + "</span></div>" +
        '<div class="hist-txt">' + escapeHtml(h.t.slice(0, 90)) + "…</div>" +
        '<div class="hist-ops"><button class="mini" data-op="load" data-i="' + i + '">载入</button>' +
        '<button class="mini" data-op="copy" data-i="' + i + '">复制</button></div></div>';
    }).join("");
    Array.prototype.forEach.call(list.querySelectorAll(".mini"), function (b) {
      b.addEventListener("click", function () {
        var h = S.history[+b.getAttribute("data-i")];
        if (b.getAttribute("data-op") === "copy") {
          if (navigator.clipboard) navigator.clipboard.writeText(h.t);
          toast("已复制 📋");
        } else {
          $("#output").textContent = h.t;
          $("#output").dataset.filled = "1";
          $("#histModal").classList.remove("open");
          toast("已载入到预览区");
        }
      });
    });
  });
  $("#closeHist").addEventListener("click", function () { $("#histModal").classList.remove("open"); });
  $("#clearHist").addEventListener("click", function () {
    if (!S.history.length) return;
    if (!confirm("清空全部历史？")) return;
    S.history = []; save(); renderHistCount(); $("#histBtn").click();
  });

  function escapeHtml(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  /* ---- 视图切换 ---- */
  $("#tabs").addEventListener("click", function (e) {
    var t = e.target.closest(".tab"); if (!t) return;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.classList.remove("active"); });
    t.classList.add("active");
    var v = t.getAttribute("data-view");
    ["builder", "lib", "guide"].forEach(function (k) {
      $("#view-" + k).style.display = k === v ? "block" : "none";
    });
  });

  /* ---- 模板库 ---- */
  function renderLib() {
    $("#libGrid").innerHTML = PF.lib.map(function (t, i) {
      return '<div class="lib-card"><div class="lib-name">' + t.name + "</div>" +
        '<div class="lib-desc">' + escapeHtml(t.topic) + "</div>" +
        '<button class="mini" data-i="' + i + '">用这个模板 ⚡</button></div>';
    }).join("");
    Array.prototype.forEach.call($("#libGrid").querySelectorAll(".mini"), function (b) {
      b.addEventListener("click", function () {
        var t = PF.lib[+b.getAttribute("data-i")];
        S.scene = t.scene;
        $("#fGoal").value = sceneById(t.scene).goal.replace("「主题」", t.topic);
        $("#fTopic").value = t.topic;
        $("#fAudience").value = t.audience || "";
        $("#fDetails").value = t.details || "";
        $("#fConstraints").value = t.constraints || "";
        applySceneDefaults(); renderSceneChips();
        document.querySelector('.tab[data-view="builder"]').click();
        generate(false);
        toast("已套用模板，可再修改 ⚡");
      });
    });
  }

  /* ---- toast ---- */
  var tt;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove("show"); }, 1600);
  }

  renderSceneChips(); applySceneDefaults(); renderLib(); renderHistCount();
})();