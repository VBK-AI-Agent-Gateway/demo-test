/* 全能行政文员助手 - 纯前端生成逻辑 */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var val = function (s) { return ($(s).value || "").trim(); };

  /* ---------- 标签切换 ---------- */
  $("#tabs").addEventListener("click", function (e) {
    var t = e.target.closest(".tab"); if (!t) return;
    var id = t.getAttribute("data-tab");
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.classList.toggle("active", x === t); });
    Array.prototype.forEach.call(document.querySelectorAll(".panel"), function (p) {
      p.classList.toggle("open", p.id === "panel-" + id);
    });
  });

  /* ---------- 通用 ---------- */
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("show"); }, 1600);
  }
  function ph(v, def) { return (v && v.trim()) ? v.trim() : def; }
  function showOut(id, text) {
    var box = $("#" + id);
    box.hidden = false;
    box.querySelector("pre").textContent = text;
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-copy]");
    if (c) {
      var text = $("#" + c.getAttribute("data-copy")).querySelector("pre").textContent;
      navigator.clipboard && navigator.clipboard.writeText(text).then(
        function () { toast("已复制到剪贴板 ✓"); },
        function () { fallbackCopy(text); }
      ) || fallbackCopy(text);
      return;
    }
    var d = e.target.closest("[data-md]");
    if (d) {
      var md = $("#" + d.getAttribute("data-md")).querySelector("pre").textContent;
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
      a.download = "office-ea-output.md";
      a.click();
      toast("已下载 .md 文件");
    }
  });
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("已复制到剪贴板 ✓"); } catch (e) { toast("复制失败，请手动选择复制"); }
    ta.remove();
  }

  /* ---------- 1. 公文写作 ---------- */
  $("#docGo").addEventListener("click", function () {
    var type = $("#docType").value;
    var org = ph(val("#docOrg"), "[XX 单位]");
    var title = ph(val("#docTitle"), "关于……的" + type);
    var to = ph(val("#docTo"), "各有关单位");
    var date = ph(val("#docDate"), "[2026年X月X日]");
    var copy = val("#docCopy");
    var lines = val("#docBody") ? val("#docBody").split(/\n+/).filter(Boolean) : ["[正文第一条]", "[正文第二条]"];
    var body = lines.map(function (l, i) { return "　　" + (i + 1) + "、" + l.trim(); }).join("\n");

    var s = "";
    s += org + "\n";
    s += "————————————————————\n\n";
    s += title + "\n\n";
    s += to + "：\n\n";
    s += body + "\n\n";
    s += "　　特此" + (type === "通知" ? "通知" : type === "请示" ? "请示" : type === "报告" ? "报告" : type === "函" ? "函告" : "说明") + "。\n\n\n";
    s += "　　　　　　　　　　　　　　" + org + "\n";
    s += "　　　　　　　　　　　　　　" + date + "\n\n";
    if (copy) s += "抄送：" + copy + "\n";
    s += "（本模板为演示生成，请按《党政机关公文处理工作条例》核定格式后印发）";
    showOut("docOut", s);
    toast("公文已生成");
  });

  /* ---------- 2. 润色纠错 ---------- */
  $("#polGo").addEventListener("click", function () {
    var raw = val("#polText");
    if (!raw) { toast("请先粘贴原文"); return; }
    var aud = $("#polAud").value;
    var genre = $("#polGenre").value;
    // 问题检测
    var issues = [];
    if (/那个|这个|咱|呗|啦|吧|咋|瞅|弄|整/.test(raw)) issues.push("含口语化词汇（那个/咱/整 等）→ 替换为书面表达");
    if (/你看下行不行|行不行|好不好/.test(raw)) issues.push("疑问式征询过于随意 → 改为“妥否，请批示/如无异议”类句式");
    if (/催了|赶紧|马上给我|快点/.test(raw)) issues.push("催促语气易引起不适 → 改为“烦请/恳请于××前协助”");
    if (!/[。！？；]/.test(raw)) issues.push("缺少标点断句 → 已按语义补充分号与句号");
    if (raw.length > 120 && !/\d/.test(raw)) issues.push("长段未分条 → 已拆分为编号条目");
    if (!issues.length) issues.push("未发现明显语病，已按目标文体统一措辞");

    // 改写（规则化演示，保持原意）
    var t = raw
      .replace(/那个/g, "相关").replace(/这个/g, "该").replace(/咱(们)?/g, "我方")
      .replace(/整好/g, "整理完毕").replace(/弄好/g, "处理完毕")
      .replace(/你看下行不行/g, "是否妥当").replace(/行不行/g, "是否可行")
      .replace(/快点|赶紧/g, "烦请尽快").replace(/催了多次/g, "已多次提示");
    // 分句
    var parts = t.split(/[。；;！？\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length > 1) t = parts.join("；") + "。";
    t = t.charAt(0).toUpperCase() + t.slice(1);

    var open = "", close = "";
    if (aud === "leader") { open = "尊敬的领导：\n\n　　"; close = "\n\n　　妥否，请批示。"; }
    else if (aud === "client") { open = "尊敬的客户，您好：\n\n　　"; close = "\n\n　　如任何细节需要调整，请随时告知，我们将第一时间配合处理。顺颂商祺。"; }
    else { open = "各位同事：\n\n　　"; close = "\n\n　　如有疑问，请随时沟通，谢谢配合。"; }
    if (genre === "微信通知") { open = ""; close = "\n\n【本条为演示改写，发送前请核对人名与时间】"; }
    if (genre === "商务邮件") { open = "您好：\n\n　　" + (aud === "leader" ? "关于相关事项，现将情况汇报如下：\n\n　　" : ""); }

    var s = "【识别问题】\n" + issues.map(function (x, i) { return (i + 1) + ". " + x; }).join("\n");
    s += "\n\n【润色后文本】（文体：" + genre + " / 对象：" + ({ leader: "领导", peer: "平级", client: "外部客户" })[aud] + "）\n\n";
    s += open + "　　" + t + close;
    s += "\n\n（自动生成为演示用途，重要函件请人工复核）";
    showOut("polOut", s);
    toast("润色完成");
  });

  /* ---------- 3. 长文提炼 ---------- */
  $("#brGo").addEventListener("click", function () {
    var raw = val("#brText");
    if (!raw) { toast("请先粘贴长文"); return; }
    var sents = raw.split(/(?<=[。；;！？\n])/).map(function (x) { return x.trim(); }).filter(Boolean);
    var rights = [], dues = [], risks = [];
    sents.forEach(function (s) {
      var tags = [];
      if (/应当|须|必须|有权|不得|负责|义务|承诺/.test(s)) { tags.push("权责"); rights.push(s); }
      if (/\d{4}年|\d+月|\d+个工作日|前|期限|之前|截止/.test(s)) { tags.push("期限"); dues.push(s); }
      if (/元|万|%|费用|金额|付款|违约金|报价/.test(s)) { tags.push("金额"); }
      if (/违约|赔偿|中止|终止|争议|风险|否则|追究|担保/.test(s)) { tags.push("风险"); risks.push(s); }
      if (!tags.length) tags.push("背景");
    });

    var out = "【核心要点】（共 " + sents.length + " 句，关键词标注）\n\n";
    sents.forEach(function (s, i) {
      var tg = [];
      if (/应当|须|必须|有权|不得|负责|义务|承诺/.test(s)) tg.push("权责");
      if (/\d{4}年|\d+月|\d+个工作日|之前|截止/.test(s)) tg.push("期限");
      if (/元|万|%|费用|金额|付款|违约金/.test(s)) tg.push("金额");
      if (/违约|赔偿|中止|终止|争议|风险|否则|追究/.test(s)) tg.push("风险");
      out += (i + 1) + ". [" + tg.join("·") + "] " + s + "\n";
    });
    out += "\n【权责方要点】\n" + (rights.length ? rights.map(function (x) { return "· " + x; }).join("\n") : "· （未识别，可补充原文）");
    out += "\n\n【关键期限】\n" + (dues.length ? dues.map(function (x) { return "· " + x; }).join("\n") : "· （未识别到明确期限）");
    out += "\n\n【风险提示】\n" + (risks.length ? risks.map(function (x) { return "⚠ " + x; }).join("\n") : "· （未识别到显著风险条款）");
    out += "\n\n（提炼结果由规则引擎生成，签约前请法务复核）";
    showOut("brOut", out);
    toast("要点已提炼");
  });

  /* ---------- 4. 会议纪要 ---------- */
  $("#mnGo").addEventListener("click", function () {
    var raw = val("#mnText");
    if (!raw) { toast("请粘贴转写文本"); return; }
    var topic = ph(val("#mnTopic"), "[会议主题]");
    var time = ph(val("#mnTime"), "[2026年X月X日]");
    var place = ph(val("#mnPlace"), "[会议地点]");
    var host = ph(val("#mnHost"), "[主持人/记录人]");
    var hostAry = host.split("/");
    var lines = raw.split(/\n+|(?<=。)/).map(function (x) { return x.trim(); }).filter(Boolean);
    // 也按 | 切
    var segs = [];
    lines.forEach(function (l) { l.split("|").forEach(function (x) { if (x.trim()) segs.push(x.trim()); }); });

    var decisions = [], todos = [];
    segs.forEach(function (seg) {
      var isTodo = /负责|跟进|前完成|之前完成|截止|落实到|由.*完成|本周|下周|本月/.test(seg);
      if (isTodo) {
        var owner = "待定", node = "待定";
        var om = seg.match(/([一-龥]{2,4})(?:负责|牵头|跟进)/);
        if (om) owner = om[1];
        else { var sm = seg.match(/^([一-龥]{2,4})[：:]/); if (sm) owner = sm[1]; }
        var dm = seg.match(/(\d+\s*月\s*\d+\s*日|\d+日|下周[一二三四五六日]?|本周[一二三四五六日]?|本月\d+日|下周五|本周五|\d+个?工作日前?)/);
        if (dm) node = dm[1].replace(/\s/g, "");
        todos.push({ t: seg.replace(/^[一-龥]{2,4}[：:]/, ""), o: owner, d: node });
      } else {
        decisions.push(seg.replace(/^[一-龥]{2,4}[：:]/, function (m) { return "**" + m.replace(/[：:]/, "") + "**："; }));
      }
    });
    if (!decisions.length) decisions = ["[决议一：待补充]"];
    if (!todos.length) todos = [{ t: "[待办事项：请在转写中补充含“负责/完成”关键词的句子]", o: "待定", d: "待定" }];

    var s = "# 会议纪要\n\n";
    s += "## 一、会议主题与时间地点\n\n";
    s += "| 项目 | 内容 |\n|---|---|\n";
    s += "| 会议主题 | " + topic + " |\n| 时间 | " + time + " |\n| 地点 | " + place + " |\n";
    s += "| 主持人 | " + (hostAry[0] || "[待补]").trim() + " |\n| 记录人 | " + (hostAry[1] || "[待补]").trim() + " |\n\n";
    s += "## 二、核心议题与决议事项\n\n";
    decisions.forEach(function (d, i) { s += (i + 1) + ". " + d + "\n"; });
    s += "\n## 三、待办事项清单\n\n";
    s += "| 待办任务 | 责任人 | 完成节点 |\n|---|---|---|\n";
    todos.forEach(function (t) { s += "| " + t.t.replace(/^[一-龥]{2,4}[：:]/, "").slice(0, 60) + " | " + t.o + " | " + t.d + " |\n"; });
    s += "\n---\n_整理：Office EA · 请与会人员会后 24 小时内核对补充_";
    showOut("mnOut", s);
    toast("纪要已结构化");
  });

  /* ---------- 5. Excel 公式 ---------- */
  var EX_MAP = [
    { re: /查找|匹配|工号|查到|返回.*姓名|VLOOKUP|XLOOKUP/i,
      f: '=XLOOKUP(A2, Sheet2!A:A, Sheet2!B:B, "未找到", 0)',
      u: "在 Sheet2 的 A 列精确查找 A2 的值，返回对应 B 列内容。旧版 Excel 可用：\n=VLOOKUP(A2, Sheet2!A:B, 2, FALSE)\n多条件版本：\n=XLOOKUP(1, (Sheet2!A:A=X2)*(Sheet2!B:B=Y2), Sheet2!C:C)" },
    { re: /两个条件|多条件.*求和|部门.*月份.*合计/i,
      f: '=SUMIFS(C:C, A:A, "销售部", B:B, "一月")',
      u: "C 列求和，同时满足 A 列=\"销售部\" 且 B 列=\"一月\"。\n数组写法：=SUM((A2:A100=\"销售部\")*(B2:B100=\"一月\")*C2:C100)\n注意：条件里的文字要加英文双引号。" },
    { re: /提取|中间|文本|截取|第.个字/i,
      f: '=MID(A2, 3, 4)',
      u: "从 A2 第 3 个字符开始取 4 个字符。\n取左边：=LEFT(A2, 2)\n取右边：=RIGHT(A2, 4)\n按分隔符取第 N 段：=TEXTBEFORE(TEXTAFTER(A2, "-", 1), "-")" },
    { re: /不重复|去重|唯一|distinct|统计非空/i,
      f: '=SUMPRODUCT((A2:A100<>"")/COUNTIF(A2:A100, A2:A100&""))',
      u: "统计 A2:A100 非空且不重复的个数（经典防除零写法）。\nExcel 365 可直接：=COUNTA(UNIQUE(FILTER(A2:A100, A2:A100<>\"\")))" },
    { re: /最后一天|月末|月份.*最后|EOMONTH/i,
      f: '=EOMONTH(TODAY(), 0)',
      u: "返回今天所在月份的最后一天（需设置日期格式）。\n指定月份：=EOMONTH(DATE(2026,3,1), 0)\n下月最后一天：=EOMONTH(TODAY(), 1)" },
    { re: /等级|提成|比例|区间|IF.*嵌套/i,
      f: '=IFS(A2>=100000, 0.08, A2>=50000, 0.05, A2>=20000, 0.03, TRUE, 0.01)',
      u: "按区间返回对应比例（IFS 避免多层嵌套 IF）。\n兼容旧版：=IF(A2>=100000,8%,IF(A2>=50000,5%,IF(A2>=20000,3%,1%)))\n也可用查找表：=LOOKUP(A2, {0,20000,50000,100000}, {1%,3%,5%,8%})" }
  ];
  Array.prototype.forEach.call($("#exChips").querySelectorAll(".chip"), function (c) {
    c.addEventListener("click", function () { $("#exText").value = c.textContent; $("#exText").focus(); });
  });
  $("#exGo").addEventListener("click", function () {
    var q = val("#exText");
    if (!q) { toast("请先描述需求或点选场景"); return; }
    var hit = null;
    for (var i = 0; i < EX_MAP.length; i++) if (EX_MAP[i].re.test(q)) { hit = EX_MAP[i]; break; }
    if (!hit) {
      showOut("exOut", "未匹配到内置场景，已给出通用建议：\n\n1) 跨表按条件找值 → 首选 XLOOKUP：\n   =XLOOKUP(查找值, 查找列, 返回列, \"未找到\", 0)\n2) 多条件统计 → SUMIFS / COUNTIFS\n3) 日期月份计算 → EOMONTH / DATE\n4) 区间映射 → IFS 或 LOOKUP 数组常量\n\n请把需求描述得更具体（如“按 A 列工号在 Sheet2 查姓名”），即可命中精确公式。");
      return;
    }
    showOut("exOut", "【公式】\n" + hit.f + "\n\n【用法说明】\n" + hit.u + "\n\n（生成基于常见场景规则，套用前请核对列号与区域）");
    toast("公式已生成");
  });

  /* ---------- 6. 数据转表格 ---------- */
  var tbFmt = "md";
  $("#tbFmt").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    tbFmt = c.getAttribute("data-fmt");
    Array.prototype.forEach.call($("#tbFmt").querySelectorAll(".chip"), function (x) { x.classList.toggle("on", x === c); });
  });
  $("#tbGo").addEventListener("click", function () {
    var raw = val("#tbText");
    if (!raw) { toast("请粘贴数据"); return; }
    var mode = $("#tbMode").value;
    var rows = raw.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (line) {
      if (mode === "csv") return line.split(",");
      if (mode === "pipe") return line.split("|");
      if (line.indexOf("\t") >= 0) return line.split("\t");
      if (line.indexOf("|") >= 0) return line.split("|");
      if (line.indexOf(",") >= 0) return line.split(",");
      return line.split(/\s{2,}/);
    }).map(function (r) { return r.map(function (c) { return c.trim(); }); });
    if (!rows.length) return;

    var head = val("#tbHead") ? val("#tbHead").split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean) : null;
    if (!head) head = rows[0];
    var body = head === rows[0] ? rows.slice(1) : rows;
    if (!body.length) body = [head.map(function () { return "—"; })];
    var width = Math.max(head.length, Math.max.apply(null, body.map(function (r) { return r.length; })));
    function pad(r) { var x = r.slice(); while (x.length < width) x.push(""); return x; }
    head = pad(head); body = body.map(pad);

    var out = "", tbl = "";
    if (tbFmt === "md") {
      out += "| " + head.join(" | ") + " |\n";
      out += "|" + head.map(function () { return "---"; }).join("|") + "|\n";
      body.forEach(function (r) { out += "| " + r.join(" | ") + " |\n"; });
      tbl = "<table><thead><tr>" + head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        body.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
    } else if (tbFmt === "csv") {
      out = [head].concat(body).map(function (r) {
        return r.map(function (c) { return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(",");
      }).join("\n");
    } else {
      out = [head].concat(body).map(function (r) { return r.join("\t"); }).join("\n");
    }
    showOut("tbOut", (tbFmt === "md" ? "" : "（" + (tbFmt === "csv" ? "CSV" : "TSV，可直接粘进 Excel") + "）\n\n") + out);
    $("#tbTable").innerHTML = tbl;
    $("#tbTable").hidden = !tbl;
    toast("表格已生成（" + body.length + " 行）");
  });
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- 7. 活动策划 ---------- */
  $("#evGo").addEventListener("click", function () {
    var name = ph(val("#evName"), "[2026 年度 ×× 活动]");
    var type = $("#evType").value;
    var time = ph(val("#evTime"), "[2026年X月X日]");
    var place = ph(val("#evPlace"), "[XX 酒店宴会厅]");
    var budget = val("#evBudget") ? +val("#evBudget") : null;
    var count = val("#evCount") ? +val("#evCount") : 50;
    var note = val("#evNote") || "[无特殊要求]";
    if (!budget) { budget = null; }

    var ratios = [["场地与布置", 0.30], ["餐饮茶歇", 0.28], ["物料印刷", 0.14], ["设备与执行人员", 0.16], ["机动备用金", 0.12]];
    var base = budget || 30000;

    var s = "# 活动策划案：" + name + "\n\n";
    s += "**类型**：" + type + "　|　**时间**：" + time + "　|　**地点**：" + place + "\n";
    s += "**规模**：约 " + count + " 人　|　**总预算**：" + (budget ? budget + " 元" : "[总预算待定，下表按 30,000 元占位，请替换]") + "\n";
    s += "**特殊要求**：" + note + "\n\n";

    s += "## 一、活动流程表\n\n| 时间 | 环节 | 内容要点 | 负责人 |\n|---|---|---|---|\n";
    s += "| 08:30-09:00 | 签到接待 | 来宾登记、发放资料、引导入座 | [接待组] |\n";
    s += "| 09:00-09:10 | 开场 | 主持人开场、介绍嘉宾 | [主持人] |\n";
    s += "| 09:10-09:40 | 主题环节 | " + (type.indexOf("答谢") >= 0 ? "领导致辞、回顾合作" : type.indexOf("团建") >= 0 ? "破冰游戏、团队分组" : "主题演讲/产品发布") + " | [主讲人] |\n";
    s += "| 09:40-10:30 | 互动环节 | 交流研讨 / 体验互动 | [会务组] |\n";
    s += "| 10:30-10:45 | 茶歇 | 茶点补充、自由交流 | [后勤组] |\n";
    s += "| 10:45-11:30 | 主体议程 | " + (type.indexOf("答谢") >= 0 ? "合作分享与签约仪式" : "分组讨论与成果汇报") + + " | [议程组] |\n";
    s += "| 11:30-11:45 | 合影收尾 | 集体合影、伴手礼发放 | [宣传组] |\n\n";

    s += "## 二、预算分配表\n\n| 科目 | 占比 | 金额（元） | 说明 |\n|---|---|---|---|\n";
    ratios.forEach(function (r) {
      s += "| " + r[0] + " | " + Math.round(r[1] * 100) + "% | " + Math.round(base * r[1]).toLocaleString() + " | " +
        (r[0] === "机动备用金" ? "应对临时增项，用后冲回" : "按实际发生结算") + " |\n";
    });
    s += "| **合计** | **100%** | **" + base.toLocaleString() + "** | " + (budget ? "已锁定总额" : "占位金额，请替换为真实预算") + " |\n\n";

    s += "## 三、人员分工表\n\n| 组别 | 职责 | 负责人 | 人数 |\n|---|---|---|---|\n";
    s += "| 统筹组 | 总协调、进度把控、应急决策 | [总负责人] | 1 |\n";
    s += "| 接待组 | 签到、引导、嘉宾陪同 | [××] | 2 |\n";
    s += "| 会务组 | 物料、设备、流程执行 | [××] | 3 |\n";
    s += "| 后勤组 | 餐饮、场地、交通 | [××] | 2 |\n";
    s += "| 宣传组 | 摄影摄像、新闻稿、合影 | [××] | 1-2 |\n\n";

    s += "## 四、备用防范方案\n\n| 风险场景 | 预防措施 | 应急处置 |\n|---|---|---|\n";
    s += "| 设备故障（投影/音响） | 提前 1 小时联调、备 U 盘与无线麦 | 切换备用设备，主持人串场过渡 |\n";
    s += "| 主讲人临时缺席 | 确认替补人选与讲稿 | 调整议程顺序，播放预录视频 |\n";
    s += "| 人数超预期/临时减少 | 按 110% 备席位与餐食 | 现场加座 / 退订结余餐食 |\n";
    s += "| 天气/交通影响 | 提前推送路线与停车指引 | 备网约车预算，调整签到时间 |\n";
    s += "| 突发医疗状况 | 备急救箱、确认最近医院路线 | 派车送医，专人对接家属 |\n";
    s += "| 预算超支 | 预留 12% 机动金、单笔超 2,000 元事前审批 | 压缩非刚性物料，优先保障主议程 |\n\n";
    s += "---\n_由 Office EA 生成 · [ ] 内为占位符，请替换为实际信息后执行_";
    showOut("evOut", s);
    toast("策划案已生成");
  });
})();