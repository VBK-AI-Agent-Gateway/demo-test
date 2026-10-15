// ===== 批改引擎：客观题判定 + 主观题分项采分 + 学情汇总 =====
const PD = window.PG_DATA;

window.PG = {
  // 题号切分：把文本切成 {n, text} 数组
  split(text) {
    const lines = String(text || "").split(/\n+/).map(s => s.trim()).filter(Boolean);
    const items = [];
    let cur = null;
    const isNum = /^\s*(\d{1,2})\s*[.、．)]?\s*/;
    const sectionRe = /^[一二三四五六七八九十]+[、.．]/;
    for (const ln of lines) {
      if (sectionRe.test(ln)) continue; // 跳过大题标题
      const m = ln.match(isNum);
      if (m) {
        const n = parseInt(m[1]);
        const body = ln.replace(isNum, "").trim();
        if (cur) items.push(cur);
        cur = { n, text: body };
      } else if (cur) {
        cur.text += " " + ln;
      } else {
        cur = { n: items.length + 1, text: ln };
      }
    }
    if (cur) items.push(cur);
    return items;
  },

  // 主观题识别：含“解：/答：/实验/因为/所以/步骤”或文本较长
  isSubjective(t) {
    return /解[:：]|答[:：]|实验|因为|所以|步骤|现象|结论|计算|画出|分析/.test(t) || t.length > 24;
  },

  // 归一化答案便于比对
  norm(s) {
    return String(s).toLowerCase().replace(/\s+/g, "").replace(/[，。、；;]/g, "")
      .replace(/[()（）]/g, "").replace(/\\|[$]/g, "");
  },

  // ===== 客观题批改 =====
  gradeObjective(answers, students) {
    const rows = [];
    const amap = {}, smap = {};
    answers.forEach(a => { if (!amap[a.n]) amap[a.n] = a.text; });
    students.forEach(s => { if (!smap[s.n]) smap[s.n] = s.text; });
    const nums = Array.from(new Set([...Object.keys(amap).map(Number), ...Object.keys(smap).map(Number)])).sort((a, b) => a - b);

    let right = 0;
    for (const n of nums) {
      const ans = amap[n] || "";
      const stu = smap[n];
      let ok = false, hasAns = !!ans;
      if (stu == null || stu === "") {
        rows.push({ n, ans, stu: "（未作答）", ok: false, err: "未作答", kp: "" });
        continue;
      }
      if (ans) {
        // 判定：学生答案包含参考答案核心（单字符选项精确比对；填空同义近似）
        const na = this.norm(ans), ns = this.norm(stu);
        if (ans.trim().length <= 3 && ans.trim().match(/^[A-Da-d×√✗✓]$/i)) {
          ok = ns === na;
        } else if (ans.includes("；") || ans.includes(";")) {
          // 填空多空：逐空比对，单位要求严格
          const aps = ans.split(/[；;]/).map(x => x.trim()).filter(Boolean);
          const sps = stu.split(/[；;、,，]/).map(x => x.trim()).filter(Boolean);
          ok = aps.every((ap, i) => sps[i] && (this.norm(sps[i]).includes(this.norm(ap)) || this.norm(ap).includes(this.norm(sps[i]))));
          // 单位漏写检测（答案带单位而学生没带）
          if (ok) {
            const needUnit = aps.filter(x => /[A-Za-z%°]/.test(x));
            const stuUnits = stu.match(/[A-Za-z%°]+/g) || [];
            if (needUnit.length > stuUnits.length) ok = false;
          }
        } else {
          ok = ns === na || ns.includes(na) || na.includes(ns);
        }
        // 错误归因启发
        if (!ok) {
          let err = "概念混淆";
          if (/^\d/.test(ans) && /\d/.test(stu) && !ok) err = "计算错误";
          if (/[A-Za-z]/.test(ans) && !new RegExp(stu.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(ans)) err = "公式记错";
          if (!stu.match(/[A-Za-z%°]/) && ans.match(/[A-Za-z%°]/)) err = "单位遗忘";
          if (/错|漏|没|未/.test(stu)) err = "审题失误";
          rows.push({ n, ans, stu, ok, err, kp: this.guessKP(ans + stu) });
        } else {
          right++;
          rows.push({ n, ans, stu, ok, err: "", kp: this.guessKP(ans) });
        }
      } else {
        rows.push({ n, ans: "（无参考）", stu, ok: null, err: "", kp: "" });
      }
    }
    const judged = rows.filter(r => r.ok !== null).length;
    const rightN = rows.filter(r => r.ok === true).length;
    return { rows, total: judged, right: rightN, rate: judged ? Math.round(rightN / judged * 100) : 0, wrongList: rows.filter(r => r.ok === false).map(r => r.n) };
  },

  // 知识点猜测（基于答案/学生文本关键词，初中范围内）
  guessKP(txt) {
    const rules = [
      [/重力|g=|G=mg/, "重力与质量"], [/摩擦|二力平衡|平衡力/, "二力平衡"],
      [/浮力|排开|阿基米德/, "浮力与阿基米德原理"], [/压强|p=|帕/, "压强"],
      [/速度|v=|s\/t/, "速度计算"], [/密度|ρ|m\/V/, "密度计算"],
      [/欧姆|I=|U\/R/, "欧姆定律"], [/电功率|P=|W=|千瓦时/, "电功率"],
      [/焦耳|Q=I|热量|比热/, "焦耳定律/热量"], [/串|并联|电阻/, "串并联电路"],
      [/杠杆|滑轮|机械效率/, "简单机械/机械效率"], [/功|功率|W=Fs/, "功与功率"],
      [/凸透|成像|焦距/, "凸透镜成像"], [/反射|折射|平面镜/, "光现象"],
      [/声|音调|响度/, "声现象"], [/内能|温度|物态|熔化/, "物态变化/内能"]
    ];
    for (const [re, kp] of rules) if (re.test(txt)) return kp;
    return "综合（请老师归类）";
  },

  // ===== 主观题分项批改 =====
  gradeSubjective(n, ans, stu) {
    const issues = [], goods = [];
    let points = 0, max = 0;

    if (!stu || !stu.trim()) {
      return { n, score: 0, max: 10, goods: [], issues: [{ t: "审题错误", d: "本题未作答" }], tip: "该题空缺，请学生补做；当面讲解采分点。", dispute: false };
    }

    // 满分按题型估算（有细则文本时可由外部传入 max）
    max = 6;
    const isCalc = /解[:：]|=\s*\d/.test(stu) && /=/.test(stu);

    // 亮点检测
    if (/解[:：]/.test(stu)) goods.push("有‘解：’起笔，解题格式规范");
    if (/=/.test(stu) && /[0-9]/.test(stu) && /[A-Za-z]/.test(stu)) goods.push("公式书写并代入数值，过程较完整");
    if (/(N|kg|V|A|Ω|W|Pa|m\/s|℃|J)/.test(stu)) goods.push("物理量带单位，符合中考规范");
    if (/因为.*所以|由.*可知|根据/.test(stu)) goods.push("因果表述完整，逻辑清晰");
    if (/一定(要)?控制|保持.*不变|其他(条件|因素)相同/.test(stu)) goods.push("控制变量表述准确");
    if (goods.length === 0) goods.push("有作答，方向基本正确（建议进一步规范表达）");

    // 问题检测（分项）
    // 规范：单位/公式
    if (isCalc && !/解[:：]/.test(stu)) issues.push({ t: "规范问题", d: "缺‘解：’字样，计算题应规范起笔" });
    if (isCalc && /=/.test(stu) && !/（|\(|[0-9]\s*(N|kg|V|A|Ω|W|Pa|m\/s|℃|J|s|h)/.test(stu.match(/=[^=\n]+/g)?.join("") || "")) {
      // 代入过程单位检查粗判
      const eq = (stu.match(/=[^=\n]+/g) || []).join("");
      if (/=\s*[\d.]+\s*$|=\s*[\d.]+\s*[，。]/.test(eq) || (/\d\s*[×x*]\s*\d/.test(eq) && !/[A-Za-z]/.test(eq))) {
        issues.push({ t: "规范问题", d: "代入过程未带单位，中考物理计算必须数值+单位同带" });
      }
    }
    // 表述：控制变量
    if (/成正比|成反比|越大.*越大|越小.*越小/.test(stu) && !/一定|控制|不变|其他/.test(stu)) {
      issues.push({ t: "表述问题", d: "比例/关系结论缺少‘电压一定’等控制变量前提，结论不严谨" });
    }
    if (/一定|都|所有/.test(stu) && /实验|结论|可知/.test(stu) && !/普遍|多次|避免偶然/.test(stu)) {
      issues.push({ t: "表述问题", d: "结论有绝对化倾向，实验结论应基于多次实验、避免偶然" });
    }
    // 概念
    if (/因为是平衡的|因为平衡/.test(stu) && !/二力平衡|一对平衡/.test(stu)) {
      issues.push({ t: "概念错误", d: "未准确使用‘二力平衡’概念表述" });
    }
    if (issues.length === 0) {
      issues.push({ t: "表述问题", d: "基本正确，建议对照标准答案补全关键踩分点表述" });
    }

    // 得分（启发式）：无大错给多数分，有概念/规范错扣
    let deduct = 0;
    issues.forEach(i => {
      if (i.t === "概念错误") deduct += 2;
      else if (i.t === "规范问题") deduct += 1;
      else deduct += 1;
    });
    if (/未作答/.test(issues[0]?.d || "")) deduct = max;
    points = Math.max(0, max - deduct);

    // 争议标记
    const dispute = /模糊|可能|好像|大概|也许/.test(stu) || issues.length >= 3;

    const tipMap = {
      "概念错误": "回归课本概念，把‘二力平衡/欧姆定律’等定义抄一遍并复述条件。",
      "规范问题": "记住：公式先写、代入带单位、结果带单位，按步骤不跳步。",
      "表述问题": "结论前先写前提条件（如‘电压一定时’），避免绝对化词语。",
      "计算错误": "重新按公式代入算一遍，注意单位换算。",
      "审题错误": "先圈题干关键词（‘一定’‘变化’）再动笔。"
    };
    const mainIssue = issues[0].t;
    const tip = `建议：${tipMap[mainIssue] || "对照采分点逐条补全。"}（AI初评分供参考，请老师终审）`;

    return { n, score: points, max, goods, issues, tip, dispute };
  },

  // ===== 学情汇总 =====
  summarize(obj, subs, opts) {
    const objRate = obj && obj.total ? obj.rate : null;
    const wrongKps = {};
    if (obj) obj.rows.filter(r => r.ok === false && r.kp).forEach(r => { wrongKps[r.kp] = (wrongKps[r.kp] || 0) + 1; });

    const subAvg = subs.length ? (subs.reduce((a, s) => a + s.score, 0) / subs.length) : null;
    const issueCount = {};
    subs.forEach(s => s.issues.forEach(i => { issueCount[i.t] = (issueCount[i.t] || 0) + 1; }));

    const parts = [];
    parts.push({ h: "1. 本次作业整体情况", p: [
      obj && obj.total ? `客观题：共 ${obj.total} 题，答对 ${obj.right} 题，正确率 **${obj.rate}%**${obj.wrongList.length ? `；错题题号：**${obj.wrongList.join("、")}**` : "；无错题，保持！"}。` : "（本次未含客观题）",
      subs.length ? `主观题：${subs.length} 题，初评得分合计约 ${subs.reduce((a, s) => a + s.score, 0)} / ${subs.reduce((a, s) => a + s.max, 0)} 分（按采分点估算，须老师终审）。` : "（本次未含主观题）"
    ] });

    const kpArr = Object.entries(wrongKps).sort((a, b) => b[1] - a[1]);
    parts.push({ h: "2. 高频错题与薄弱知识点", ul: kpArr.length
      ? kpArr.map(([k, v]) => `<b>${k}</b>（错 ${v} 题）`)
      : ["客观题无明显知识漏洞，可挑战综合题"] });

    const ic = Object.entries(issueCount).sort((a, b) => b[1] - a[1]);
    parts.push({ h: "3. 主观题共性问题", ul: ic.length
      ? ic.map(([k, v]) => `${k}：${v} 次${k === "规范问题" ? "（**公式/单位是重灾区**）" : ""}`)
      : ["作答规范较好，继续强化踩分点完整性"] });

    const teach = [];
    if ((obj && obj.rate < 80)) teach.push("讲评客观题错题，按错因归类逐题回扣概念。");
    if ((issueCount["规范问题"] || 0) > 0) teach.push("重点讲计算题书写规范：解→公式→代入带单位→结果带单位。");
    if ((issueCount["表述问题"] || 0) > 0) teach.push("重点讲实验/简答表述：控制变量前提与结论不绝对化。");
    if ((issueCount["概念错误"] || 0) > 0) teach.push("概念辨析微专题训练（5题限时）。");
    if (!teach.length) teach.push("整体良好，可布置一道变式综合题保持手感。");
    parts.push({ h: "4. 教学提示（本节课重点讲评）", p: [teach.map((t, i) => `${i + 1}. ${t}`).join("<br>")] });

    return { parts, objRate, kpArr, ic };
  }
};