/* LexAI 全能企业法务与 AI 合规总监 - 六大功能规则引擎 */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var v = function (s) { var e = $(s); return e ? (e.value || "").trim() : ""; };
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.style.opacity = "1"; t.style.transform = "translate(-50%,0)";
    clearTimeout(t._t); t._t = setTimeout(function () { t.style.opacity = "0"; t.style.transform = "translate(-50%,16px)"; }, 1800);
  }

  /* ============ 导航与抽屉 ============ */
  var side = $("#sidebar"), scrim = $("#scrim");
  function openSide() { side.classList.remove("-translate-x-full"); scrim.classList.remove("hidden"); }
  function closeSide() { side.classList.add("-translate-x-full"); scrim.classList.add("hidden"); }
  $("#openSide").addEventListener("click", openSide);
  $("#closeSide").addEventListener("click", closeSide);
  scrim.addEventListener("click", closeSide);

  var TITLES = {
    contract: "📜 合同审查与 Redline 替换", ai: "🤖 AI 系统合规与 AIA 评估",
    procure: "🛒 第三方 AI/SaaS 采购条款审查", data: "🛡️ 数据合规与出境评估",
    search: "🔍 法规与判例检索建议", alert: "📅 履约与节点预警提示"
  };
  var RUNNERS = {}; // 由下方各模块注册

  var current = "contract";
  $$(".nav-item").forEach(function (n) {
    n.addEventListener("click", function () {
      $$(".nav-item").forEach(function (x) { x.classList.toggle("active", x === n); });
      current = n.getAttribute("data-nav");
      $$(".pane[data-pane]").forEach(function (p) { p.classList.toggle("hidden", p.getAttribute("data-pane") !== current); });
      $("#pageTitle").textContent = TITLES[current];
      if (window.innerWidth < 768) { closeSide(); window.scrollTo({ top: 0, behavior: "smooth" }); switchSide("input"); }
      if (RUNNERS[current]) RUNNERS[current]();
    });
  });

  /* ============ 移动端输入/结果 Tabs ============ */
  function switchSide(which) {
    var isMobile = window.innerWidth < 1024;
    var pane = document.querySelector('.pane[data-pane="' + current + '"]');
    if (!pane) return;
    var sides = pane.querySelectorAll(".pane-side");
    if (isMobile) {
      sides[0].classList.toggle("hidden", which !== "input");
      sides[1].classList.toggle("hidden", which === "input");
    } else { sides[0].classList.remove("hidden"); sides[1].classList.remove("hidden"); }
    pane.querySelectorAll(".pane-tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-side") === which); });
    $$(".bar-side").forEach(function (b) {
      var on = b.getAttribute("data-side") === which;
      b.classList.toggle("bg-brand", on); b.classList.toggle("text-white", on);
      b.classList.toggle("bg-ink3", !on); b.classList.toggle("border", !on);
      b.classList.toggle("border-white/15", !on); b.classList.toggle("text-slate-300", !on);
    });
    if (isMobile && which === "result") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".pane-tab, .bar-side");
    if (t) switchSide(t.getAttribute("data-side"));
  });
  function runCurrent() {
    if (RUNNERS[current]) RUNNERS[current]();
    switchSide("result");
  }
  $("#runBtn").addEventListener("click", runCurrent);
  $("#barGo").addEventListener("click", runCurrent);

  /* ============ 通用卡片渲染器 ============ */
  function lvlColor(l) { return l === "red" ? "risk" : l === "amber" ? "warn" : "ok"; }
  function lvlEmoji(l) { return l === "red" ? "🔴" : l === "amber" ? "🟡" : "🟢"; }

  function execCard(moduleName, conclusion, conclusionLvl, lawBasis) {
    var c = lvlColor(conclusionLvl);
    return '<blockquote class="exec-card"><div class="exec-t">📌 综合评估卡片 (Executive Summary)</div>' +
      '<p><b>服务模块：</b>' + moduleName + '</p>' +
      '<p><b>风控结论：</b><span class="lvl-pill t-' + c + '">' + lvlEmoji(conclusionLvl) + ' ' + conclusion + '</span></p>' +
      '<p><b>核心法规依据：</b>' + lawBasis + '</p></blockquote>';
  }
  function redlineCard(idx, name, lvl, orig, analysis, fix) {
    var c = lvlColor(lvl);
    return '<article class="rl-card" id="rl' + idx + '">' +
      '<header class="rl-head t-' + c + '">' + lvlEmoji(lvl) + ' 风险项 ' + String(idx).padStart(2, "0") + '：' + name + ' <span class="rl-lvl">（' + (lvl === "red" ? "高风险" : lvl === "amber" ? "中风险" : "合规") + '）</span></header>' +
      '<div class="rl-body">' +
      '<p class="rl-label">原条款：</p><p class="rl-orig">“' + esc(orig) + '”</p>' +
      '<p class="rl-label">⚖️ 风控分析：</p><p>' + analysis + '</p>' +
      '<p class="rl-label">📝 建议修改 (Redline)：</p><blockquote class="rl-fix">' + esc(fix) + '</blockquote>' +
      '</div></article>';
  }
  function actionTable(rows) { // rows: [ [维度, 状态emoji, 建议], ... ]
    var h = '<div class="tbl-wrap"><table class="act-tbl"><thead><tr><th>合规维度</th><th>状态评估</th><th>📱 建议行动</th></tr></thead><tbody>';
    rows.forEach(function (r) { h += "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; });
    return h + "</tbody></table></div>";
  }
  function noteBox(title, html) {
    return '<div class="note-box"><b>' + title + "</b><br>" + html + "</div>";
  }

  /* ============ 功能 1：合同审查 ============ */
  var CT_RULES = [
    { lvl: "red", key: /无限赔偿|无限责任|任何损失.{0,10}赔偿|不设.{0,4}上限/,
      name: "数据隐私与责任无限风险", orig: "乙方对因本合同产生的任何损失承担无限赔偿责任，不设任何上限。",
      analysis: "单方无上限赔偿使本方承担不可控责任，且与合同对价严重失衡；实务中易引发天价索赔争议。",
      fix: "任一方的累计赔偿责任以本合同已付/应付金额的 100% 为限；任何一方均不对间接损失、利润损失承担赔偿责任，故意或重大过失除外。" },
    { lvl: "red", key: /保密义务.{0,8}(永久|无限期|永远)|永久有效/,
      name: "无限期保密义务", orig: "双方保密义务永久有效，不因合同终止而解除。",
      analysis: "无期限保密义务违反合同法公平原则，且将商业秘密与普通信息混同，维权举证困难。",
      fix: "保密期限自本协议终止之日起 3 年；构成商业秘密的信息，保密义务持续至该信息依法不再构成商业秘密之日止。" },
    { lvl: "amber", key: /验收标准.{0,10}(由|在).{0,6}(甲方|需方).{0,6}(另行|单方|认定)/,
      name: "验收标准模糊（单方认定）", orig: "验收标准由甲方另行认定，乙方应无条件配合。",
      analysis: "验收标准不明确将导致付款条件形同虚设，履约争议高发，属实务中最常见的中风险条款。",
      fix: "验收以附件《技术规格书》所列可量化指标为准；需方应于交付后 7 个工作日内完成验收，逾期未提出书面异议视为验收通过。" },
    { lvl: "amber", key: /(甲方|供方)所在地.{0,6}(法院|仲裁)|争议.{0,20}(甲方|供方)所在地/,
      name: "管辖地单方倾向", orig: "争议由甲方所在地人民法院管辖。",
      analysis: "单方所在地管辖增加本方异地维权成本，属程序性不平等条款。",
      fix: "因本合同引起的争议，协商不成的，提交被告所在地/合同签订地有管辖权的人民法院诉讼解决，或提交××仲裁委员会仲裁。" },
    { lvl: "amber", key: /(验收合格|交付|收到发票).{0,20}\d{2,}\s*日/,
      name: "账期过长（超过 60 天）", orig: "甲方应于验收合格后 90 日内支付全部货款。",
      analysis: "90 天账期显著长于行业 30-60 天惯例，占用本方现金流，需评估资金成本。",
      fix: "需方应于验收合格并收到合规发票后 30 日内支付对应款项；逾期付款按日万分之三计付违约金。" }
  ];
  RUNNERS.contract = function () {
    var raw = v("#ctText");
    if (!raw) { $("#ctOut").innerHTML = '<p class="empty">请粘贴合同文本后点击「运行审查」</p>'; return; }
    var hits = CT_RULES.filter(function (r) { return r.key.test(raw); });
    var reds = hits.filter(function (x) { return x.lvl === "red"; }).length;
    var ambers = hits.filter(function (x) { return x.lvl === "amber"; }).length;
    var lvl = reds ? "red" : ambers ? "amber" : "ok";
    var concl = reds ? "🔴 暂缓签署" : ambers ? "🟡 需修改条款后签署" : "🟢 放行";
    var html = execCard("📜 合同审查（" + v("#ctType") + "）", concl, lvl,
      "《民法典》合同编 / EU AI Act 相关义务" + "（命中 " + hits.length + " 项）");
    if (hits.length) {
      html += '<div class="sub-h">🔍 核心风险项与 Redline</div>';
      hits.forEach(function (h, i) { html += redlineCard(i + 1, h.name, h.lvl, h.orig, h.analysis, h.fix); });
    } else {
      html += noteBox("🟢 未命中内置高风险模式", "请人工核对：付款节点与交付标准是否对等、通知送达条款、变更是否书面化、附件清单是否齐备。");
    }
    html += '<div class="sub-h">🛡️ 数据合规与行动清单</div>';
    html += actionTable([
      ["数据授权", ambers ? "🟡 需补充" : "🟢 已具备", "核对个人信息处理告知同意文本"],
      ["算法/模型条款", reds ? "🔴 高风险" : "🟢 无异常", "涉 AI 条款转「采购风控」模块细审"],
      ["违约与赔付", reds ? "🔴 未封顶" : "🟡 建议封顶", "补充赔偿责任上限与间接损失排除"]
    ]);
    $("#ctOut").innerHTML = html;
    toast("审查完成：" + reds + " 高风险 / " + ambers + " 中风险");
  };

  /* ============ 功能 2：AI 治理 AIA ============ */
  var SCENES = {
    biometric: { n: "生物识别/情绪识别", t: "red", art: "EU AI Act Art.5 禁止类排查 + Art.6 高风险", cn: "《个保法》29条单独同意；深度合成标识" },
    employment: { n: "招聘筛选/员工评估", t: "red", art: "Art.6(2)(4) 高风险：算法管理", cn: "《个保法》24条自动化决策须人工介入" },
    education: { n: "教育录取/考试评分", t: "red", art: "Art.6(2)(d) 高风险", cn: "未成年人信息监护人同意（31条）" },
    chat: { n: "客服对话/内容生成", t: "amber", art: "Art.50 透明度义务", cn: "《生成式AI办法》第9/12条标识与备案" },
    internal: { n: "内部办公提效", t: "ok", art: "Art.6(3) 排除高风险；Art.4 AI 素养", cn: "内部使用一般不触发对外备案" }
  };
  var TIER_TXT = { red: "🔴 高风险 (Art.6)", amber: "🟠 透明度风险 (Art.50)", ok: "🟢 低风险 (Art.6(3))" };
  RUNNERS.ai = function () {
    var s = SCENES[v("#aiScene")], role = v("#aiRole"), sens = v("#dpSens") === "" ? v("#aiSensitive") : v("#aiSensitive"), law = v("#aiLaw");
    var lvl = s.t;
    var concl = lvl === "red" ? "🔴 暂缓投放，先完成合格评定" : lvl === "amber" ? "🟡 补齐透明度义务后上线" : "🟢 放行（保留内部治理）";
    var lawBasis = (law !== "cn" ? "EU AI Act" : "") + (law === "both" ? " + " : "") + (law !== "eu" ? "中国《生成式AI办法》/PIPL" : "");
    var html = execCard("🤖 AI 治理与 AIA（" + s.n + "）", concl, lvl, lawBasis || "EU AI Act");
    html += '<div class="exec-card"><div class="exec-t">🧭 角色与定级</div>' +
      '<p><b>企业角色：</b>' + ({ deployer: "Deployer 部署者", provider: "Provider 提供者", both: "Provider + Deployer 双重" })[role] + '</p>' +
      '<p><b>AI Act 定级：</b><span class="lvl-pill t-' + lvlColor(lvl) + '">' + TIER_TXT[lvl] + '</span></p>' +
      '<p><b>依据：</b>' + s.art + (law !== "eu" ? "；" + s.cn : "") + '</p></div>';
    if (role !== "deployer") html += noteBox("Provider 义务", "质量管理体系 Art.17、技术文档 Art.11、上市后监测 Art.72；罚则最高 3500 万欧元或全球营业额 7%（Art.99）。");
    if (role !== "provider") html += noteBox("Deployer 义务", "指定人工监督人员、输出人工复核、员工 AI 素养培训（Art.4/26）；罚则最高 1500 万欧元或 3%。");
    html += '<div class="sub-h">📊 AI 影响评估清单 (AIA)</div>';
    html += actionTable([
      ["数据合法性", sens === "yes" ? "🔴 需专项评估" : "🟡 需台账", "建立数据来源授权台账（Art.10）"],
      ["偏见与歧视", lvl === "red" ? "🔴 必测" : "🟡 抽测", "分组准确率测试并留存报告"],
      ["隐私与泄露", sens === "yes" ? "🔴 单独同意" : "🟡 脱敏", "签署 DPA、输入脱敏与输出过滤"],
      ["人机协同", role === "provider" ? "🟡 监督人" : "🔴 必须", "设置人工复核关卡并留痕"],
      ["透明度标识", lvl === "ok" ? "🟢 内部告知" : "🔴 对外告知", "界面明示「正在与 AI 交互」"]
    ]);
    $("#aiOut").innerHTML = html;
    toast("AIA 评估完成：" + concl);
  };

  /* ============ 功能 3：采购风控 ============ */
  var AP_RULES = [
    { lvl: "red", name: "用户数据用于模型训练",
      key: /(可|有权|授权).{0,12}(将|使用|利用).{0,10}(输入|客户|甲方).{0,6}数据.{0,10}训练|用于模型训练/,
      orig: "乙方可将甲方输入数据及输出结果用于模型训练。",
      analysis: "客户业务数据直接入模存在个保法/GDPR 双重合规风险与商业秘密外泄，且无范围、期限、退出机制。",
      fix: "未经甲方书面单独同意，乙方不得将甲方输入数据、输出数据及衍生数据用于模型训练或效果改进；同意后亦须去除个人信息与商业秘密，并支持甲方随时撤回并执行遗忘机制。" },
    { lvl: "red", name: "输出内容版权归属错位",
      key: /(生成|输出|产出).{0,10}(内容|成果).{0,10}(知识产权|著作权|版权).{0,6}(归|属于).{0,8}(乙方|供应商)|版权.{0,6}归.{0,6}(乙方|供应商)/,
      orig: "模型生成内容的知识产权归乙方所有。",
      analysis: "采购方付费却无法取得输出内容权利，与采购目的相悖；且底层训练数据可能存在第三方权利瑕疵。",
      fix: "甲方支付服务费后，模型针对甲方需求生成的内容知识产权归甲方所有；乙方背景知识产权仍归乙方并授予甲方永久免费使用许可；乙方保证不侵犯第三方知识产权，第三方索赔由乙方承担。" },
    { lvl: "red", name: "AI 幻觉/输出错误免责",
      key: /(不作任何保证|不承担).{0,15}(准确性|正确性|输出|后果)|仅供参考|不构成.{0,8}(承诺|保证)/,
      orig: "乙方对模型输出内容的准确性不作任何保证，亦不承担责任。",
      analysis: "以 AI 固有局限为由完全免责，采购方独自承担全部业务风险；格式条款也可能因民法典497条无效。",
      fix: "乙方保证服务达到附件 SLA 约定的准确性与可用性指标；因模型输出错误、幻觉直接导致甲方损失的，乙方承担赔偿责任，累计不超过合同总金额的 100%，故意或重大过失除外。" },
    { lvl: "amber", name: "服务中断赔付缺失",
      key: /(服务中断|宕机|停服).{0,15}(不承担|不赔付|不负责|概不)|无.{0,6}赔付|赔付.{0,6}(不作|不予)/,
      orig: "乙方在服务中断时不承担任何赔付责任。",
      analysis: "API 类采购核心风险即可用性，无 SLA 赔付将使业务中断损失无处追偿。",
      fix: "SLA 承诺月度可用率 ≥99.9%；每低 0.1% 赔付月服务费 5%，连续 7 日不可用甲方有权解约并要求退还未履行部分费用。" }
  ];
  RUNNERS.procure = function () {
    var raw = v("#apText");
    if (!raw) { $("#apOut").innerHTML = '<p class="empty">请粘贴采购条款后运行</p>'; return; }
    var hits = AP_RULES.filter(function (r) { return r.key.test(raw); });
    var reds = hits.filter(function (x) { return x.lvl === "red"; }).length;
    var lvl = reds ? "red" : hits.length ? "amber" : "ok";
    var concl = reds ? "🔴 暂缓签署" : hits.length ? "🟡 需修改条款后签署" : "🟢 放行";
    var html = execCard("🛒 AI 工具采购审查（" + v("#apKind") + "）", concl, lvl, "EU AI Act / PIPL / 《生成式AI办法》");
    html += '<div class="sub-h">🔍 核心风险项与 Redline</div>';
    if (hits.length) hits.forEach(function (h, i) { html += redlineCard(i + 1, h.name, h.lvl, h.orig, h.analysis, h.fix); });
    else html += noteBox("🟢 未命中高危 AI 采购模式", "仍建议核查四类条款：数据训练授权、输出版权归属、幻觉责任、SLA 赔付。");
    html += '<div class="sub-h">🛡️ 采购风控行动清单</div>';
    html += actionTable([
      ["数据训练授权", hits.some(function (h) { return h.name.indexOf("训练") >= 0; }) ? "🔴 必改" : "🟡 建议书面确认", "补签「不用于训练」承诺函"],
      ["输出版权归属", reds ? "🔴 归属错位" : "🟢 待人工确认", "合同附件明确生成内容权属"],
      ["服务中断赔付", hits.some(function (h) { return h.name.indexOf("中断") >= 0; }) ? "🔴 缺失" : "🟡 核对 SLA", "补充可用率承诺与阶梯赔付"],
      ["算法备案", "🟡 提示", "确认供应商已完成算法/大模型备案"]
    ]);
    $("#apOut").innerHTML = html;
    toast("采购风控完成：" + concl);
  };

  /* ============ 功能 4：数据合规出境 ============ */
  RUNNERS.data = function () {
    var sens = v("#dpSens"), cross = v("#dpCross"), minor = v("#dpMinor"), law = v("#dpLaw");
    var lvl = (sens === "yes" && cross === "standard") ? "red" : (sens === "yes" || cross === "standard" || minor === "yes") ? "amber" : "ok";
    var concl = lvl === "red" ? "🔴 暂缓处理，先完成出境合规路径" : lvl === "amber" ? "🟡 补充授权与告知后进行" : "🟢 放行";
    var lawBasis = law === "both" ? "GDPR + PIPL《个保法》/《数据安全法》" : law === "pipl" ? "PIPL《个保法》/《数据安全法》" : "GDPR";
    var html = execCard("🛡️ 数据合规与出境评估", concl, lvl, lawBasis);
    if (cross === "standard") html += noteBox("🔴 数据出境路径提示", "适用标准合同须向省级网信部门备案，并完成个人信息保护影响评估(PIA)；重要数据出境须走安全评估（《数据出境安全评估办法》第4条）。");
    if (sens === "yes") html += noteBox("🛡️ 敏感个人信息", "须单独同意 + 特定目的与充分必要性告知（PIPL 29条）；GDPR 下需 Art.9 明确法律依据。");
    if (minor === "yes") html += noteBox("🧑‍🤝‍🧑 未成年人", "处理不满 14 周岁未成年人信息须取得监护人同意，并制定专门处理规则（PIPL 31条）。");
    html += '<div class="sub-h">📋 数据合规行动清单</div>';
    html += actionTable([
      ["数据授权", sens === "yes" ? "🔴 单独同意" : "🟡 需补充", "补签用户授权同意书 (Consent Form)"],
      ["出境路径", cross === "no" ? "🟢 不出境" : cross === "cert" ? "🟢 已认证" : "🔴 标准合同", cross === "standard" ? "签署并备案标准合同" : "留存认证/评估证明"],
      ["算法备案", law !== "gdpr" ? "🔴 未完成" : "🟡 提示", "上线前完成深度合成/大模型算法备案"],
      ["隐私政策", "🟡 更新", "更新隐私政策披露出境主体、目的、范围"],
      ["影响评估", "🟡 待做", "完成 PIA/PIA 并留存 3 年"]
    ]);
    $("#dpOut").innerHTML = html;
    toast("数据合规评估：" + concl);
  };

  /* ============ 功能 5：法规检索 ============ */
  var LS_RULES = [
    { key: /人脸|换脸|生物识别|虹膜|指纹/, tag: "生物识别与深度合成",
      laws: ["《个保法》第29条：处理敏感个人信息须取得单独同意", "《生成式AI服务管理暂行办法》第12条：生成内容显著标识", "《互联网信息服务深度合成管理规定》第14/17条：显著标识与备案"],
      guide: "立即停止未取得单独同意的人脸收集；完成深度合成算法备案；上线生成内容双重标识（显式+隐式）。" },
    { key: /出境|境外|海外服务器|跨境|同步到.{0,6}(新加坡|美国|欧盟)/, tag: "数据出境",
      laws: ["《数据出境安全评估办法》第4条：重要数据/关键信息基础设施运营者出境须申报安全评估", "《个人信息出境标准合同办法》第4条：一般主体可签标准合同并备案", "GDPR Chapter V 第44-49条：充分性认定/SCCs/BCRs"],
      guide: "梳理出境数据清单与规模；按量级选择安全评估/标准合同/认证路径；同步完成 PIA。" },
    { key: /生成内容|AI 生成|版权|著作权|侵权/, tag: "AI 生成内容权属与侵权",
      laws: ["《著作权法》第3条：独创性与智力成果要件", "《民法典》第1019条：不得利用信息技术伪造他人肖像", "EU AI Act Art.50(4)：合成内容机器可读标识"],
      guide: "区分「AI 单独生成」与「人机协作」保留创作过程证据；对高风险内容加水印；在用户协议中约定权属与责任分配。" },
    { key: /大模型|采购|API|SaaS|合同条款/, tag: "AI 采购合同",
      laws: ["《民法典》第496-497条：格式条款提示说明义务与无效情形", "《生成式AI办法》第9条：提供者责任", "GDPR Art.28：数据处理者 DPA 义务"],
      guide: "重点审查四类条款：数据训练授权、输出版权、幻觉责任、SLA 赔付；随合同签署 DPA。" },
    { key: /员工|内部共享|人力资源/, tag: "员工个人信息",
      laws: ["《个保法》第13条第2项：人力资源管理所必需", "《个保法》第24条：自动化决策透明与拒绝权", "GDPR Art.88：雇佣场景成员国特别规则"],
      guide: "以「人力资源管理所必需」为处理依据并告知；跨部门共享遵循最小必要；涉及绩效算法须提供人工复核通道。" },
    { key: /隐私|个人信息|泄露|安全事件/, tag: "个人信息保护与事件响应",
      laws: ["《个保法》第57条：泄露须及时通知履行部门并告知个人", "《数据安全法》第29/30条：风险监测与补救义务", "GDPR Art.33/34：72 小时内通知监管机构"],
      guide: "制定事件响应 SOP：发现→遏制→评估→通知（72h）→复盘；建立台账与演练机制。" }
  ];
  RUNNERS.search = function () {
    var q = v("#lsQ");
    if (!q) { $("#lsOut").innerHTML = '<p class="empty">请输入法务问题或点选示例</p>'; return; }
    var hit = LS_RULES.filter(function (r) { return r.key.test(q); });
    if (!hit.length) hit = [LS_RULES[4], LS_RULES[3]]; // 兜底
    var lvl = hit[0].tag.indexOf("出境") >= 0 || hit[0].tag.indexOf("生物") >= 0 ? "red" : "amber";
    var html = execCard("🔍 法规与判例检索建议", (lvl === "red" ? "🔴 需重点合规整改" : "🟡 需补充合规动作") + " · 涉 " + hit.length + " 个主题", lvl, hit.map(function (h) { return h.tag; }).join(" / "));
    hit.forEach(function (h, i) {
      html += redlineCard(i + 1, h.tag, i === 0 ? lvl : "amber", "问题原文：" + q.slice(0, 60) + (q.length > 60 ? "…" : ""),
        "命中主题「" + h.tag + "」，对应法规与司法规则如下，建议按优先级推进。", h.guide);
      html += noteBox("📖 引用法条（" + h.tag + "）", h.laws.join("<br>"));
    });
    html += '<div class="sub-h">📱 行动指南</div>';
    html += actionTable(hit.map(function (h, i) {
      return [h.tag, i === 0 ? (lvl === "red" ? "🔴 紧急" : "🟡 重要") : "🟡 关注", h.guide.slice(0, 40) + (h.guide.length > 40 ? "…" : "")];
    }));
    $("#lsOut").innerHTML = html;
    toast("检索完成：命中 " + hit.length + " 个法规主题");
  };
  $("#lsChips").addEventListener("click", function (e) {
    var c = e.target.closest(".chipbtn"); if (!c) return;
    $("#lsQ").value = c.getAttribute("data-q");
    RUNNERS.search(); switchSide("result");
  });

  /* ============ 功能 6：履约预警 ============ */
  function dstr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function initDates() {
    var now = new Date();
    var d1 = new Date(now.getTime() + 12 * 864e5), d2 = new Date(now.getTime() + 30 * 864e5),
        d3 = new Date(now.getTime() + 180 * 864e5), d4 = new Date(now.getTime() + 365 * 864e5);
    $("#alDeliver").value = dstr(d1); $("#alPay").value = dstr(d2);
    $("#alRenew").value = dstr(d3); $("#alWar").value = dstr(d4);
  }
  RUNNERS.alert = function () {
    var name = v("#alName") || "未命名合同";
    var items = [
      { k: "交付节点", el: "#alDeliver", act: "组织到货验收并出具书面验收单", warn: "到期前 3 日提醒" },
      { k: "付款节点", el: "#alPay", act: "核对发票与验收单，完成付款审批", warn: "逾期将产生违约金" },
      { k: "续约/解约窗口", el: "#alRenew", act: "评估是否续约，窗口期内书面通知对方", warn: "窗口期一般 30 日，逾期视为续约" },
      { k: "质保截止", el: "#alWar", act: "排查未闭环质量事项，到期前完成索赔", warn: "过期丧失质保索赔权" }
    ];
    var lvl = "amber";
    var html = execCard("📅 履约与节点预警（" + name + "）", "🟡 共 4 个节点待跟进", "amber", "《民法典》第509/563条 履行与解除规则");
    html += '<div class="sub-h">✅ 履约待办清单</div>';
    var rows = "";
    items.forEach(function (it, i) {
      var raw = $(it.el).value;
      var days = raw ? Math.ceil((new Date(raw) - new Date(new Date().toDateString())) / 864e5) : null;
      var urgent = days !== null && days <= 7;
      var st = urgent ? "🔴 " + days + " 天内" : days < 0 ? "🔴 已逾期" : "🟡 " + days + " 天";
      rows += '<div class="todo' + (urgent ? " todo-hot" : "") + '">' +
        '<span class="todo-n">' + (i + 1) + '</span>' +
        '<div class="todo-b"><b>' + it.k + '</b><span>' + (raw || "未设置") + " · " + it.act + '</span><i>' + it.warn + '</i></div>' +
        '<span class="lvl-pill ' + (urgent ? "t-risk" : "t-warn") + '">' + st + "</span></div>";
    });
    html += rows;
    html += '<div class="sub-h">📱 节点提醒建议</div>';
    html += actionTable([
      ["日历同步", "🟡 建议", "将 4 个节点录入企业日历并设多重提醒"],
      ["证据留存", "🟢 关键", "交付/付款均以书面单据与邮件回执留痕"],
      ["解约窗口", "🔴 易错过", "窗口期前完成内部决策与书面通知"],
      ["续签约谈", "🟡 提前", "续约前 60 日启动价格与条款复盘"]
    ]);
    $("#alOut").innerHTML = html;
    toast("履约清单已生成");
  };
  $("#alGo").addEventListener("click", function () { RUNNERS.alert(); switchSide("result"); });

  /* ============ 启动 ============ */
  initDates();
  RUNNERS.contract();
  RUNNERS.ai();
  RUNNERS.procure();
  RUNNERS.data();
  RUNNERS.search();
  RUNNERS.alert();
  switchSide("input");
})();