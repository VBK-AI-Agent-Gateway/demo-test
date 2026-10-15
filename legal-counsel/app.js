/* 法务与 AI 合规总监 - 纯前端规则引擎 */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var val = function (s) { return ($(s).value || "").trim(); };

  /* ---------- 通用 ---------- */
  var TAB_TITLE = { contract: "合同审查与风险防控", ai: "AI 系统治理与合规评估", aiproc: "AI 采购/合作合同专项审查" };
  $("#menu").addEventListener("click", function (e) {
    var t = e.target.closest(".m-item"); if (!t) return;
    var id = t.getAttribute("data-tab");
    Array.prototype.forEach.call(document.querySelectorAll(".m-item"), function (x) { x.classList.toggle("active", x === t); });
    Array.prototype.forEach.call(document.querySelectorAll(".panel"), function (p) { p.classList.toggle("open", p.id === "panel-" + id); });
    var h = $("#tbTitle");
    if (h && TAB_TITLE[id]) h.textContent = TAB_TITLE[id];
    if (window.innerWidth <= 980) document.querySelector(".content").scrollIntoView({ behavior: "smooth" });
  });
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
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("已复制到剪贴板 ✓"); } catch (e) { toast("复制失败，请手动选择复制"); }
    ta.remove();
  }
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-copy]");
    if (c) {
      var text = $("#" + c.getAttribute("data-copy")).querySelector("pre").textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast("已复制到剪贴板 ✓"); }, function () { fallbackCopy(text); });
      } else fallbackCopy(text);
      return;
    }
    var d = e.target.closest("[data-md]");
    if (d) {
      var md = $("#" + d.getAttribute("data-md")).querySelector("pre").textContent;
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
      a.download = "legal-opinion.md";
      a.click();
      toast("已下载 .md 文件");
    }
  });

  /* =========================================================
     模块一：合同审查与风险防控
     ========================================================= */
  var RULES = [
    { lvl: "red", key: /无限赔偿|无限责任|无上限.{0,6}赔偿|承担一切(损失|责任)|任何损失.*赔偿/,
      name: "单方无上限赔偿责任",
      fix: "任一方的累计赔偿责任以本合同项下已付/应付金额的【100%】为限；任何一方均不对间接损失、利润损失、数据丢失承担赔偿责任，但故意或重大过失除外。" },
    { lvl: "red", key: /保密义务.{0,8}(永久|无限期|永远)|永久保密|保密期限.{0,6}(无|不设)/,
      name: "无限期保密义务",
      fix: "保密期限自本协议终止之日起【3】年；构成商业秘密的信息保密义务持续至该信息依法不再构成商业秘密之日止。" },
    { lvl: "red", key: /(仅|只能|统一适用).{0,10}(甲方|供方|采购方)所在地.{0,6}(法院|仲裁)|争议.{0,20}(甲方|供方)所在地/,
      name: "不平等争议管辖",
      fix: "因本合同引起的争议，双方友好协商解决；协商不成的，提交【被告所在地/合同签订地】有管辖权的人民法院诉讼解决，或提交【××仲裁委员会】按其现行规则仲裁。" },
    { lvl: "red", key: /(成果|知识产权|专利|著作权|源代码).{0,16}(归|属于).{0,6}(甲方|供方|采购方)独有|全部.{0,6}知识产权.{0,8}(归|属于)/,
      name: "知识产权过度剥夺（成果单方独有）",
      fix: "各方在履约前已拥有的知识产权仍归各自所有；履约中新产生的知识产权按【各方分别所有/共同所有，另有约定除外】确定，接收方获得为使用目的所必需的不可转让许可。" },
    { lvl: "red", key: /(单方|甲方|供方)可?.{0,8}(随时|无需理由).{0,6}(解除|终止)/,
      name: "单方任意解除权",
      fix: "任一方需提前【30】日书面通知方可解除本合同；一方严重违约且经催告【15】日内未纠正的，守约方有权解除并追究违约责任。" },
    { lvl: "amber", key: /验收标准.{0,10}(由.{0,4}(甲方|需方).{0,6}(认定|另行|单方)|另行)/,
      name: "验收标准模糊（单方认定）",
      fix: "验收以本合同附件《技术/服务规格书》所列可量化指标为准；需方应于交付后【7】个工作日内完成验收，逾期未提出书面异议视为验收通过。" },
    { lvl: "amber", key: /账期.{0,10}(\d{2,}|六十|九十|九十天)|付款.{0,12}(验收后|交付后)\s*\d{2,}\s*天/,
      name: "账期过长（超过 60 天）",
      fix: "需方应于验收合格并收到合规发票后【30】日内支付对应款项；逾期付款按日万分之【三】计付违约金。" },
    { lvl: "amber", key: /违约金.{0,10}(\d{2,}%|每日\s*\d+%)|每日.{0,6}违约金.{0,8}(\d{2,}%|千分)/,
      name: "违约金比例偏高（>日 0.05% 或总额 >30%）",
      fix: "违约金按应付未付金额每日【0.03%】计取，且累计不超过合同总金额的【30%】；超出部分违约方可请求人民法院或仲裁机构予以调减。" },
    { lvl: "amber", key: /(排他|独家).{0,10}(采购|供应|合作)|不得与.{0,8}(第三方|任何第三方)/,
      name: "排他性限制未设期限/对价",
      fix: "在需方年度采购额达到【××】万元的前提下，本合同项下采购在【12】个月内享有非独家优先权；未达标的，供应方有权自由对外销售。" },
    { lvl: "amber", key: /自动续(期|订)|到期.{0,6}自动.{0,6}顺延/,
      name: "自动续期未设退出机制",
      fix: "合同期满前【30】日任一方书面通知不续期的，到期终止；未通知的按原条件续期【1】次，续期届满即终止。" }
  ];

  function extractElements(t) {
    var g = function (re, def) { var m = t.match(re); return m ? m[0].replace(/\s+/g, " ") : def; };
    return [
      ["合同主体（甲方）", g(/甲方[：:]\s*[^\n，。；]{2,40}/, "【未识别，请补充】")],
      ["合同主体（乙方）", g(/乙方[：:]\s*[^\n，。；]{2,40}|丙方[：:].{0,30}/, "【未识别，请补充】")],
      ["合同金额", g(/(合同金额|总价|价款|报酬)[：:]\s*[^\n，。]{2,40}|人民币\s*[0-9,\.]+\s*[万亿元元]/, "【未识别，请补充】")],
      ["履约期限", g(/(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日[^，。\n]{0,15}(前|起|至))|(自.{0,12}起.{0,10}年)|(有效期.{0,12})/, "【未识别，请补充】")],
      ["知识产权归属", g(/知识产权[^。\n]{0,50}|(成果|专利|著作权)[^。\n]{0,8}(归|属于)[^。\n]{0,20}/, "【未识别，建议明确约定】")],
      ["违约赔偿上限", g(/赔偿[^。\n]{0,10}(上限|限额)[^。\n]{0,30}|以.{0,8}为限[^。\n]{0,15}|不超过[^。\n]{0,10}(合同|总)[^。\n]{0,8}金额/, "【未识别，高风险：赔偿无上限】")],
      ["争议管辖地", g(/争议[^。\n]{0,10}(由|在)[^。\n]{0,30}(法院|仲裁)[^\n]{0,20}|提交[^。\n]{0,20}(仲裁委员会|人民法院)/, "【未识别，建议明确约定】")]
    ];
  }

  $("#ctGo").addEventListener("click", function () {
    var raw = val("#ctText");
    if (!raw) { toast("请先粘贴合同文本"); return; }
    var type = $("#ctType").value;
    var hits = [];
    RULES.forEach(function (r) { if (r.key.test(raw)) hits.push(r); });
    var reds = hits.filter(function (x) { return x.lvl === "red"; });
    var ambers = hits.filter(function (x) { return x.lvl === "amber"; });
    var level = reds.length ? "🔴 高风险（不建议按原文签署）" : (ambers.length ? "🟡 中风险（修改后可签）" : "🟢 低风险（未命中内置风险规则，仍建议人工通读）");

    var s = "";
    s += "# 合同审查法律意见书\n\n";
    s += "> 审查对象：" + type + "　|　字数：" + raw.length + "　|　规则库命中：" + hits.length + " 项\n\n";
    s += "## 一、结论与风险等级\n\n**" + level + "**\n\n";
    s += "| 等级 | 数量 | 摘要 |\n|---|---|---|\n";
    s += "| 🔴 高风险 | " + reds.length + " | " + (reds.length ? reds.map(function (x) { return x.name; }).join("、") : "无") + " |\n";
    s += "| 🟡 中风险 | " + ambers.length + " | " + (ambers.length ? ambers.map(function (x) { return x.name; }).join("、") : "无") + " |\n\n";

    s += "## 二、要素提取\n\n| 要素 | 内容 |\n|---|---|\n";
    extractElements(raw).forEach(function (r) { s += "| " + r[0] + " | " + r[1] + " |\n"; });
    s += "\n";

    s += "## 三、详细分析与 Redline（风险标注 + 建议修改后文本）\n\n";
    if (!hits.length) {
      s += "未命中「单方无上限赔偿 / 无限期保密 / 不平等管辖 / IP 过度剥夺 / 单方任意解除 / 验收模糊 / 账期过长 / 违约金偏高 / 排他无对价 / 自动续期无退出」等高危模式。";
      s += "以下为合同审查常规关注点，供逐条核对：\n\n";
      ["付款节点与发票条件是否对等", "交付物清单是否作为附件固定", "数据安全与个人信息处理条款是否齐备",
       "合同变更是否要求书面形式", "通知送达条款（邮箱/地址）是否明确", "不可抗力与情势变更条款是否覆盖"].forEach(function (x, i) {
        s += (i + 1) + ". " + x + "\n";
      });
      s += "\n";
    }
    hits.forEach(function (h, i) {
      s += "### " + (i + 1) + ". " + (h.lvl === "red" ? "🔴" : "🟡") + " " + h.name + "\n\n";
      s += "**风险分析**：原文命中风险模式，" + (h.lvl === "red"
        ? "属高风险条款，可能致使本方承担不对等、不可控的法律后果，谈判中应作为必争条款。"
        : "属中风险条款，实务中易引发履约争议，建议按下列文本调整。") + "\n\n";
      s += "**建议修改后文本（可直接粘贴）**：\n\n> " + h.fix + "\n\n";
    });

    s += "## 四、建议行动\n\n";
    s += "| 优先级 | 行动 |\n|---|---|\n";
    if (reds.length) s += "| P0 | 就 " + reds.length + " 项 🔴 高风险条款发出修改稿，未获让步不建议用印 |\n";
    if (ambers.length) s += "| P1 | 就 " + ambers.length + " 项 🟡 中风险条款提出 Redline，争取文本落地 |\n";
    s += "| P1 | 核对要素表中标注【未识别】项，补齐金额/期限/管辖三要素 |\n";
    s += "| P2 | 附件固化交付标准与验收清单；核对签约主体资信与授权文件 |\n\n";
    s += "---\n_由 Legal & AI Compliance Counsel 规则引擎生成，供内部初审参考，重大交易请由执业律师复核。_";
    showOut("ctOut", s);
    toast("审查完成：" + reds.length + " 高风险 / " + ambers.length + " 中风险");
  });

  /* =========================================================
     模块二：AI 系统治理与合规评估
     ========================================================= */
  // 风险定级矩阵（EU AI Act Art.5/6/50 + 中国办法对应义务）
  var SCENES = {
    biometric: { name: "生物识别/情绪识别", tier: 1, art: "Art.5 禁止类需先排查（如情绪识别在工作/教育场景被禁止，Art.5(1)(f)）；其余按 Art.6 高风险（Art.6(2)(a)）", cn: "涉生物识别信息须单独同意（《个保法》29条）；深度合成/生成服务须显著标识（《标识办法》）" },
    critical: { name: "关键基础设施安全组件", tier: 1, art: "Art.6(2)(b) 高风险：作为关键基础设施安全组件的 AI", cn: "属《办法》重点行业应用，需安全评估与算法备案（《办法》第17条）" },
    education: { name: "教育录取/考试评分", tier: 1, art: "Art.6(2)(d) 高风险：教育领域的入学录取、评估评分", cn: "涉及未成年人个人信息须监护人同意（《个保法》31条）；录取类自动化决策须说明并可拒绝（《个保法》24条）" },
    employment: { name: "招聘筛选/员工评估", tier: 1, art: "Art.6(2)(4) 高风险：招聘、筛选、绩效评估中的算法管理", cn: "人力资源自动化决策须保证透明与人工介入（《个保法》24条）" },
    credit: { name: "信用评分/保险定价", tier: 1, art: "Art.6(2)(b)(c) 高风险：信用评估、保险定价", cn: "金融领域算法备案；自动化决策须可解释、可人工干预" },
    law: { name: "执法/司法辅助", tier: 1, art: "Art.6(2)(e) 高风险：司法与执法场景的辅助量刑/风险评估", cn: "司法辅助类应用须人工最终把关，禁止自动化终局决策" },
    chat: { name: "客服对话/内容生成", tier: 2, art: "Art.5 无禁令；Art.6(3) 一般不属高风险（纯聊天/文本生成）；Art.50 透明度义务：与 AI 交互须告知、AI 生成内容须机器可读标识（Art.50(2)/(4)）", cn: "《生成式AI服务管理暂行办法》第4/9/12条：显著标识生成内容、备案、语料合规；提供者责任" },
    internal: { name: "内部办公提效（低风险）", tier: 3, art: "Art.6(3) 排除于高风险；无 Art.50 对公众义务（除非对外提供）。仍受 Art.4 AI 素养要求（AI Literacy）", cn: "内部使用一般不触发对外备案，但《个保法》处理员工个人信息仍适用；建议内控留痕" }
  };
  var TIERS = {
    1: "🔴 高风险（High-risk, Art.6）——投放市场前须完成：风险管理体系 Art.9、数据治理 Art.10、技术文档 Art.11、日志 Art.12、人工监督 Art.14、准确性/稳健性/网络安全 Art.15；按 Art.43 进行合格评定并加贴 CE 标志",
    2: "🟠 特定透明度风险（Art.50）——须履行：明确告知用户正在与 AI 交互（Art.50(2)）、对合成内容作机器可读标识（Art.50(4)）、深度伪造披露（Art.50(4)）；聊天/生成类同时适用国内《生成式AI服务管理暂行办法》第9/12条标识与备案义务",
    3: "🟢 低风险/有限风险——无强制条款级义务，但应落实《AI Act》Art.4 AI 素养培训与内部治理（AI Governance Framework），保留人工复核与日志",
    0: "⛔ 不可接受风险（Art.5 禁止类）——相关实践应在 EU 市场禁止开展，须立即停止并改造方案"
  };

  function aiaScores(scene, sensitive, desc, role, law) {
    // 五维度 0-10 打分（越高风险越大）
    var base = SCENES[scene].tier;
    var d = (desc || "");
    var s = [
      { dim: "数据合法性（Lawfulness of data）", sc: base === 1 ? 7 : 4, why: base === 1 ? "高风险场景对训练/输入数据质量与代表性要求高（Art.10(2)-(5)）" : "普通文本场景，仍需核查语料来源授权", fix: "建立数据清单与来源授权台账；特殊类别数据取得单独同意（GDPR Art.9 / 《个保法》29条）" },
      { dim: "偏见与歧视（Bias & discrimination）", sc: base === 1 ? 8 : 4, why: base === 1 ? "涉及人员筛选/评分的系统须按 Art.10(2)(f)-(g) 排查偏差并减小可识别偏见" : "输出偏见主要影响内容质量", fix: "上线前做分组准确率/均等性测试；保留测试报告备查（Art.10 技术文档）" },
      { dim: "隐私与数据泄露（Privacy leakage）", sc: sensitive === "yes" ? 9 : 5, why: sensitive === "yes" ? "处理特殊类别数据 + 模型记忆风险，GDPR Art.5(1)(c)(f) 与 Art.32 安全措施直接适用" : "通用数据，存在提示词泄露风险", fix: "输入侧脱敏/最小化、输出侧过滤、传输与存储加密；与供应商签署 DPA（GDPR Art.28）" },
      { dim: "人机协同 Human-in-the-loop", sc: role === "provider" ? 5 : 6, why: "高风险系统 Art.14 要求有效的人工监督；部署者 Art.26 须指定具备能力的监督人员", fix: "关键决策设置人工复核关卡并留痕；监督人员完成 Art.4 AI 素养培训" },
      { dim: "透明度与可解释性（Transparency）", sc: base === 2 ? 7 : 4, why: base === 2 ? "Art.50(2) 用户知情 + Art.50(4) 内容标识为硬性义务" : "低风险场景以内部说明为主", fix: "对外交互界面明示「您正在与 AI 交互」；生成内容嵌入机器可读标记与人工可读水印" }
    ];
    if (/gpt|llm|大模型|api|生成/.test(d.toLowerCase())) s[2].sc = Math.max(s[2].sc, 6);
    if (/自动(化)?.{0,4}(决策|投放)|无人工|全自动/.test(d)) s[3].sc = 9;
    return s;
  }

  $("#aiGo").addEventListener("click", function () {
    var scene = $("#aiScene").value;
    var role = $("#aiRole").value;
    var sensitive = $("#aiSensitive").value;
    var inEU = $("#aiEU").value;
    var law = $("#aiLaw").value;
    var desc = val("#aiDesc");
    var S = SCENES[scene];
    var tierKey = (inEU === "no" && law !== "eu" && S.tier === 2) ? 3 : S.tier; // 非 EU 的纯透明度场景对国内按低风险提示
    var roleName = role === "provider" ? "Provider 提供者" : role === "deployer" ? "Deployer 部署者" : "Provider + Deployer 双重角色";
    var scores = aiaScores(scene, sensitive, desc, role, law);

    var avg = Math.round(scores.reduce(function (a, x) { return a + x.sc; }, 0) / scores.length * 10) / 10;
    var overall = avg >= 7.5 ? "🔴 高风险" : avg >= 5.5 ? "🟠 中高风险" : avg >= 3.5 ? "🟡 中风险" : "🟢 低风险";

    var s = "";
    s += "# AI 系统合规评估报告\n\n";
    s += "> 场景：" + S.name + "　|　角色：" + roleName + "　|　适用框架：" + ({ eu: "EU AI Act + GDPR", cn: "中国《生成式AI办法》+《个保法》", both: "双轨 EU + 中国" })[law] + "　|　EU 关联：" + (inEU === "yes" ? "是" : "否") + "\n\n";

    s += "## 一、结论与风险等级\n\n";
    s += "**综合评级：" + overall + "**（AIA 五维均分 " + avg + "/10）\n\n";
    s += "**AI Act 定级**：\n\n" + TIERS[tierKey] + "\n\n";
    s += "**角色义务定位**：\n\n";
    if (role !== "deployer") {
      s += "- **Provider 义务**：质量管理体系 Art.17、技术文档 Art.11、上市后监测 Art.72、授权代表（非 EU 设立时 Art.22）\n";
      s += "- **罚则**：违反禁令类最高 **3500 万欧元或全球营业额 7%**；高风险义务违反最高 1500 万欧元或 3%（Art.99）\n";
    }
    if (role !== "provider") {
      s += "- **Deployer 义务**：按 Art.26 使用范围与说明书、指定人工监督人员、对高风险系统输出做人工复核、员工 AI 素养（Art.4）；就业场景须告知劳动者（Art.26(7)）\n";
      s += "- **罚则**：不履行 Deployer 义务最高 1500 万欧元或 3%（Art.99(4)）\n";
    }
    if (law !== "eu") {
      s += "- **中国法下**：提供者承担内容生产者责任（《办法》第4条），履行安全评估与算法/大模型**备案**（第17条），生成内容**显著标识**（第12条）；处理个人信息依《个保法》履行告知-同意、单独同意、自动化决策说明义务（第24条）\n";
    }
    s += "\n";

    s += "## 二、详细分析\n\n### 2.1 场景与法条依据\n\n| 项 | 内容 |\n|---|---|\n";
    s += "| 系统场景 | " + S.name + " |\n";
    s += "| EU AI Act 依据 | *" + (law === "cn" ? "参照 " + S.art : S.art) + "* |\n";
    s += "| 中国法依据 | *" + S.cn + "* |\n";
    if (sensitive === "yes") s += "| 特殊类别数据 | **是**——GDPR Art.9 原则禁止，需明确法律依据；《个保法》29条单独同意 |\n";
    s += "| 系统描述 | " + (desc ? desc.replace(/\n/g, " ") : "【未填写——评估基于场景推定，建议补充后复测】") + " |\n\n";

    s += "### 2.2 生成式 AI 影响评估（AIA）五维度\n\n| 维度 | 分值(0-10) | 风险分析 | 应对策略 |\n|---|---|---|---|\n";
    scores.forEach(function (x) {
      s += "| " + x.dim + " | **" + x.sc + "** | " + x.why + " | " + x.fix + " |\n";
    });
    s += "\n";

    s += "## 三、建议行动\n\n| 优先级 | 行动项 | 依据 |\n|---|---|---|\n";
    if (tierKey === 1) {
      s += "| P0 | 立即建立技术文档与风险管理档案，完成合格评定路径确认 | Art.8/43/Annex IV |\n";
      s += "| P0 | 配置人工监督流程与日志记录（至少 6 个月） | Art.12/14 |\n";
      s += "| P1 | 数据治理：训练/输入数据质量、偏差检测与缓解 | Art.10 |\n";
    }
    if (tierKey <= 2 && inEU === "yes") {
      s += "| P0 | 交互界面告知「正在与 AI 交互」；生成内容加机器可读标识 | Art.50(2)(4) |\n";
    }
    if (law !== "eu") {
      s += "| P0 | 完成算法备案/大模型上线备案与安全评估 | 《生成式AI办法》17条、《网安法》第24条相关规定 |\n";
      s += "| P0 | 生成内容显著标识（文字/音频/图片/视频） | 《办法》第12条 |\n";
    }
    s += "| P1 | 组织全员 AI 素养培训并留存记录 | Art.4 / 内控要求 |\n";
    s += "| P1 | 与模型供应商签署 DPA + AI 附加条款（转下一模块专项审查） | GDPR Art.28 |\n";
    s += "| P2 | 每半年复评一次，场景变更触发重评估 | Art.72 上市后监测 |\n\n";
    s += "---\n_由 Legal & AI Compliance Counsel 规则引擎生成，附法条依据供内部合规初审；正式投放市场前请由外部律师复核。_";
    showOut("aiOut", s);
    toast("评估完成：" + overall);
  });

  /* =========================================================
     模块三：AI 采购/合作合同专项审查
     ========================================================= */
  var AP_RULES = [
    { cat: "数据训练授权", lvl: "red",
      key: /(可|有权|授权).{0,12}(将|使用|利用).{0,10}(输入|输入数据|客户数据|甲方数据).{0,10}(用于|作为|训练)|训练.{0,6}授权.{0,8}(不受限|永久|独家)/,
      sample: "乙方可将甲方输入数据及输出结果用于模型训练",
      analysis: "将客户业务数据直接用于模型训练，存在数据合规（个保法/GDPR）与商业秘密外泄双重风险；若无范围、期限与退出机制，属🔴高风险。",
      fix: "**未经甲方书面单独同意，乙方不得将甲方输入数据、输出数据及衍生数据用于模型训练、效果改进或对外提供。经甲方单独同意用于训练的，应：(1) 不含甲方商业秘密与个人信息；(2) 训练用途限于为甲方服务之目的；(3) 甲方有权随时撤回同意并要求删除由此产生的模型参数影响（或采取遗忘机制）。**" },
    { cat: "生成内容知识产权归属", lvl: "red",
      key: /(生成|输出|产出).{0,10}(内容|成果|物).{0,10}(知识产权|著作权|权利).{0,6}(归|属于).{0,8}(乙方|供应商|提供方)|(全部|所有).{0,6}(知识产权|著作权).{0,8}(归|属于).{0,6}(乙方|供方)/,
      sample: "模型生成内容的知识产权归乙方所有",
      analysis: "采购方付费取得的却是使用权甚至无权利，与采购目的相悖；且底层训练数据可能存在第三方权利瑕疵（Art.3 责任划分敏感）。属🔴高风险。",
      fix: "**甲方支付服务费后，模型针对甲方需求生成的内容知识产权归【甲方】所有；乙方背景知识产权仍归乙方，乙方授予甲方永久、不可撤销、免许可费的使用许可。乙方保证训练数据与模型不侵犯第三方知识产权，因此引发的第三方索赔由乙方承担并使甲方免责。**" },
    { cat: "AI 幻觉/输出责任划分", lvl: "red",
      key: /(不作任何保证|不承担|恕不负责).{0,15}(准确性|正确性|完整性|输出|后果)|输出.{0,10}(仅供参考|不构成|由此.{0,6}后果.{0,6}(乙方|供方)不)/,
      sample: "乙方对模型输出内容的准确性不作任何保证，亦不承担责任",
      analysis: "以「AI 固有局限」为由完全免责，采购方将独自承担全部业务风险；欧盟产品责任指令修订后 AI 输出仍可能追责，此条款实操中也可能因格式条款无效（民法典497条）。属🔴高风险。",
      fix: "**乙方保证其服务在正常状态下达到本合同附件《服务水平协议(SLA)》约定的准确性/可用性指标；因模型输出错误、幻觉直接导致甲方损失的，乙方应承担赔偿责任，累计不超过【合同总金额的 100%】，因乙方故意或重大过失造成的不受此限。甲方对 AI 输出负有合理审核义务的，相应减轻乙方责任。**" },
    { cat: "数据隐私与算法合规承诺", lvl: "amber",
      key: /(个人信息|隐私).{0,15}(另行约定|不作承诺|视情况)|合规.{0,6}(责任|义务).{0,6}(由|在).{0,6}(甲方|采购方)|数据.{0,10}安全.{0,6}责任.{0,8}(甲方|采购方)/,
      sample: "个人信息保护责任由甲乙双方另行协商确定",
      analysis: "数据处理者角色划分不清，一旦发生数据事件将互相推诿；个保法下受托人义务（59条）与 GDPR Art.28 DPA 均为法定要求，不可回避。属🟡中风险。",
      fix: "**双方确认各自为《个人信息保护法》下独立的个人信息处理者/受托人，具体角色见附件《数据处理协议(DPA)》。乙方作为受托人应：(1) 按甲方指示处理并采取加密、去标识化等安全措施；(2) 发生泄露 24 小时内通知甲方；(3) 不得转委托未经甲方认可的第三方；(4) 合作终止后删除或返还全部数据。双方配合完成个人信息保护影响评估(PIA)。**" },
    { cat: "模型变更告知", lvl: "amber",
      key: /(模型|版本|算法).{0,10}(可?.{0,6}(随时|自行|不另行).{0,4}(升级|更新|调整)|无需.{0,6}通知)/,
      sample: "乙方可随时升级模型版本，无需另行通知甲方",
      analysis: "未经告知的模型变更会导致甲方业务输出行为漂移，验收基线失效。属🟡中风险。",
      fix: "**乙方对模型版本的重大变更（影响输出格式、语义行为或准确率超过±5%）应提前【15】日书面通知甲方，甲方有权在【30】日内以原条款终止或要求回归测试；乙方应对甲方指定的基准测试集保持至少【12】个月的向后兼容。**" }
  ];

  $("#apGo").addEventListener("click", function () {
    var raw = val("#apText");
    var kind = $("#apKind").value;
    var demoMode = !raw;
    var effective = raw || AP_RULES.map(function (r) { return r.sample; }).join("。\n");
    var hits = [];
    AP_RULES.forEach(function (r) { if (r.key.test(effective)) hits.push(r); });
    if (!hits.length && demoMode) hits = AP_RULES.slice(0, 3);
    var reds = hits.filter(function (x) { return x.lvl === "red"; });
    var ambers = hits.filter(function (x) { return x.lvl === "amber"; });
    var level = reds.length ? "🔴 高风险（关键 AI 条款须修改后方可签署）" : (ambers.length ? "🟡 中风险（Redline 后可推进）" : "🟢 未命中内置高风险 AI 条款模式，建议人工核查四类条款");

    var s = "# AI 采购/合作合同专项审查意见\n\n";
    s += "> 标的：" + kind + "　|　模式：" + (demoMode ? "**未提供原文——以下为内置高风险范本演示**" : "基于您粘贴的条款") + "\n\n";
    s += "## 一、结论与风险等级\n\n**" + level + "**（🔴 " + reds.length + " / 🟡 " + ambers.length + "）\n\n";
    s += "## 二、四类 AI 特定条款核查表\n\n| 条款类别 | 结论 | 风险等级 |\n|---|---|---|\n";
    AP_RULES.forEach(function (r) {
      var hit = hits.indexOf(r) >= 0;
      s += "| " + r.cat + " | " + (hit ? "❌ 存在问题，需修改" : (demoMode ? "—（未提供）" : "✅ 未命中风险模式")) + " | " +
        (hit ? (r.lvl === "red" ? "🔴" : "🟡") : "—") + " |\n";
    });
    s += "\n## 三、详细分析与 Redline\n\n";
    hits.forEach(function (h, i) {
      s += "### " + (i + 1) + ". " + (h.lvl === "red" ? "🔴" : "🟡") + " " + h.cat + "\n\n";
      s += "**问题原文**：\n> " + h.sample + "\n\n";
      s += "**风险分析**：" + h.analysis + "\n\n";
      s += "**建议修改后文本（可直接粘贴）**：\n\n" + h.fix + "\n\n";
    });
    s += "## 四、建议行动\n\n| 优先级 | 行动 |\n|---|---|\n";
    s += "| P0 | 四类 AI 条款按上表 Redline 回签，训练授权与幻觉责任为必争条款 |\n";
    s += "| P1 | 签署附件《DPA 数据处理协议》与《SLA 服务水平协议》 |\n";
    s += "| P1 | 要求供应商提供模型卡(Model Card)、训练数据来源声明与安全测试报告 |\n";
    s += "| P2 | 约定年度合规复审权与现场审计权（涉高风险场景适用 Art.25 责任不因协议转移） |\n\n";
    s += "---\n_由 Legal & AI Compliance Counsel 规则引擎生成，供商务谈判初审使用，正式签署前请执业律师复核。_";
    showOut("apOut", s);
    toast("专项审查完成：" + reds.length + " 高风险 / " + ambers.length + " 中风险");
  });
})();