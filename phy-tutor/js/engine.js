// ===== 引擎：分层材料生成 + 启发式答疑状态机 =====
const PT = window.PT_DATA;

window.PTE = {
  // 类比库（学困生通俗化，按主题关键词）
  analogy(topic) {
    const map = [
      [/压强|压力/, "用手指戳气球，笔尖那头是不是更容易戳进去？同样力气，受力面积越小，作用越集中——这就是压强"],
      [/浮力/, "人在泳池里会觉得身体变轻，托着你的水的力就是浮力"],
      [/欧姆|电流|电压|电阻/, "水流有高低落差才会流，水道越窄水流越小——电压像落差，电阻像水道宽窄"],
      [/功率|电功率/, "两个同学搬砖，同样的砖数，谁用的时间短谁‘功率大’"],
      [/惯性|牛顿|运动/, "公交车急刹车你身体会前倾——保持原来运动状态的本领就是惯性"],
      [/物态|熔化|汽化/, "冰棍在嘴里化成水、水烧开变气，都是物质换了个‘衣服’"],
      [/杠杆|滑轮/, "撬棍撬石头，支点离重物越近越省力"],
      [/凸透|成像/, "放大镜靠近报纸字变大，离远了又变小——焦距在管这事"],
      [/密度/, "同大小的铁球和木球，铁球沉木球浮——‘体质’不同，这就是密度"]
    ];
    for (const [re, s] of map) if (re.test(topic)) return s;
    return "联系生活里常见的现象，先找‘看得见摸得着’的例子";
  },
  formula(topic) {
    const map = [
      [/压强/, ["p=F/S", "压强=压力÷受力面积"]],
      [/浮力|阿基米德/, ["F浮=G排=ρ液gV排", "浮力=排开液体的重"]],
      [/欧姆/, ["I=U/R", "电流=电压除电阻"]],
      [/电功率/, ["P=UI", "功率=电压乘电流"]],
      [/功[^率]/, ["W=Fs", "功=力乘距离"]],
      [/功率/, ["P=W/t", "功率=功除时间"]],
      [/密度/, ["ρ=m/V", "密度=质量除体积"]],
      [/速度/, ["v=s/t", "速度=路程除时间"]],
      [/热量|比热/, ["Q=cmΔt", "热量=比热×质量×温差"]],
      [/重力/, ["G=mg", "重力=质量乘小g"]],
      [/杠杆/, ["F1L1=F2L2", "动力×动力臂=阻力×阻力臂"]],
      [/机械效率/, ["η=W有/W总", "效率=有用功除总功"]]
    ];
    for (const [re, v] of map) if (re.test(topic)) return v;
    return ["（请老师指定具体公式）", "先回到课本该节公式"];
  },

  // ===== 老师端：生成分层材料 =====
  genMaterial(level, topic, opts, note) {
    const L = PT.levels[level];
    const dep = L.depth;
    const blocks = [];
    const esc = window.esc;

    // 微课文案
    if (opts.micro) {
      const tpl = PT.materials["微课文案"][dep];
      const [f, mn] = this.formula(topic);
      const an = this.analogy(topic);
      const body = tpl.map(t => t.replace(/\{topic\}/g, topic).replace(/\{analogy\}/g, an).replace(/\{formula\}/g, f).replace(/\{mnemonic\}/g, mn)
        .replace(/\{core\}/g, "在初中框架内理解其定义、公式与适用条件").replace(/\{exam\}/g, "计算规范与实验表述")
        .replace(/\{essence\}/g, "守恒与因果关系"));
      blocks.push({ t: "🎬 分层知识点讲解（微课文案）", html: `<ol>${body.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` });
    }

    // 阶梯练习（答案置末尾）
    const answers = [];
    if (opts.prac) {
      const key = dep; // basic/standard/challenge
      const qs = PT.materials["阶梯练习"][key];
      const items = qs.map((q, i) => {
        q = q.q.replace(/\{topic\}/g, topic);
        const hint = q.includes("已知") ? "（题干数据由老师按班级情况补充）" : "";
        // 答案放末尾
        const ansMap = {
          basic: ["回到定义逐字比对即可（答案由老师批改或见教材例题）", `参考：${this.formula(topic)[0]}（字母含义见微课）`, "（代入老师给定数值，注意单位）", "（先变形公式再代入）"],
          standard: ["辨析题：圈出每个选项的前提条件再判断", "审题：状态词+条件词+所求量（三类都要圈）", "（按模板写：解→公式→代入带单位→结果→答）", "（在___一定时，___随___变化）"],
          challenge: ["（分阶段列式联立，见教材综合题范式）", "（多次测量取平均、选合适量程等）", "（写清自变量/因变量/控制量与步骤）", "（极端法/等效替代，初中框架内巧解）"]
        };
        answers.push(`${i + 1}. ${ansMap[key][i] || "见思路提示，答案由老师确认"}`);
        return `<div class="prac"><div class="pq">${esc(q)}</div><div class="ph">💡 ${esc(hint || q.hint || "")}</div></div>`;
      }).join("");
      blocks.push({ t: "📝 分层练习（难度：" + (dep === "basic" ? "基础阶梯" : dep === "standard" ? "中档查漏" : "拔高挑战") + "）", html: items + `<div class="ans-box"><b>📌 参考答案与思路提示（做完再看）</b><ol>${answers.map(a => `<li>${esc(a)}</li>`).join("")}</ol></div>` });
    }

    // 答题模板
    if (opts.tpl) {
      const T = PT.materials.templates;
      blocks.push({ t: "📐 中考标准答题模板", html: `
        <div class="sec-t">计算题规范模板</div><div class="tpl">${T.calc.map(x => `<div>${esc(x.replace("{公式}", this.formula(topic)[0]))}</div>`).join("")}</div>
        <div class="sec-t">实验探究答题话术</div><div class="tpl">${T.exp.map(x => `<div>${esc(x)}</div>`).join("")}</div>
        <div class="sec-t">简答题三步法</div><div class="tpl">${T.brief.map(x => `<div>${esc(x)}</div>`).join("")}</div>` });
    }

    // 探究任务单/开放思考题
    if (opts.task) {
      const sheet = PT.materials.taskSheet.map(x => x.replace(/\{topic\}/g, topic));
      blocks.push({ t: "🔬 探究任务单 / 开放思考题", html: `
        <div class="sheet">${sheet.map(x => `<div>${esc(x)}</div>`).join("")}</div>
        <div class="sec-t">开放性思考（选做）</div>
        <ul>
          <li>${dep === "challenge" ? "同一现象用两种规律解释（如受力与能量），结论一致吗？论证你的观点。" : "生活中还有哪些地方用到了『' + window.esc(topic) + '』？举两例并说明道理。"}</li>
          <li>${dep === "challenge" ? "评估：某同学的实验方案只测一次，误差来源？如何改进？" : "如果条件变化（如换更重的物体/更大电压），结果会怎样？猜一猜再验证。"}</li>
          <li>${dep === "basic" ? "把公式与字母含义默写一遍，自评掌握度。" : "设计一个简单实验验证你的猜想，写清控制的变量。"}</li>
        </ul>` });
    }

    // 自查清单
    if (opts.check) {
      const cl = PT.materials.checklist[dep];
      blocks.push({ t: "✅ 知识点自查清单", html: `<ul class="check-l">${cl.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` });
    }

    const noteHtml = note ? `<div class="warn-strip">📌 老师补充要求：${esc(note)}</div>` : "";
    const head = `<div class="mat"><div class="mat-h" style="background:linear-gradient(90,${L.color},${L.color}cc)">
      <span>${L.icon} 分层材料：${window.esc(topic)}</span><span class="lv">${level} · ${L.traits}</span></div>
      <div class="mat-b">${noteHtml}
      <p>本材料按【${level}】层次定制：${L.reqs.map(x => `·${x}`).join("；")}。</p>
      <p style="color:var(--muted);font-size:13.5px">⚠️ ${PT.banner}</p></div></div>`;

    const html = head + blocks.map(b => `<div class="mat"><div class="mat-h" style="background:#334155"><span>${b.t}</span><span class="lv">${level}</span></div><div class="mat-b">${b.html}</div></div>`).join("");

    // 纯文本
    const L2 = [];
    L2.push(`分层材料：${topic}（${level}）`);
    L2.push(`层次要求：${L.reqs.join("；")}`);
    blocks.forEach(b => {
      L2.push("");
      L2.push("【" + b.t + "】");
      const tmp = document.createElement("div");
      tmp.innerHTML = b.html;
      L2.push(tmp.textContent.replace(/\n{3,}/g, "\n\n").trim());
    });
    L2.push("");
    L2.push(PT.banner);
    return { html, text: L2.join("\n"), answers };
  },

  // ===== 学生端：启发式答疑状态机 =====
  // session: {level, topic, stage(1..3), tries, log[], question}
  newSession(level, question) {
    const kp = this.guessWeak(question);
    return { level, question, topic: kp.topic, stage: 1, tries: 0, log: [{ who: "u", text: question }], weak: kp.tag, done: false };
  },
  guessWeak(txt) {
    for (const [re, tag] of PT.weakKp) if (re.test(txt)) {
      const topic = txt.match(/浮力|压强|欧姆|电功率|杠杆|凸透|物态|惯性|平衡|密度|速度|功|热/) ;
      return { tag, topic: topic ? topic[0] : tag };
    }
    return { tag: "待归类（请老师补充）", topic: "综合" };
  },

  // 学生提交 → 第一阶段引导（不给答案）
  ask(session) {
    const lvKey = session.level === "学困生" ? "low" : session.level === "优等生" ? "high" : "mid";
    const pool = PT.socratic.open[lvKey];
    const q = pool[session.tries % pool.length];
    session.tries = 1;
    session.log.push({ who: "ai", stage: 1, text: q });
    return session;
  },
  // 追加提示（升级阶段，每次一小步）
  moreHint(session) {
    session.stage = Math.min(3, session.stage + 1);
    const lvKey = session.level === "学困生" ? "low" : session.level === "优等生" ? "high" : "mid";
    if (session.tries >= 3) {
      const pool = PT.socratic.stuck[lvKey];
      const q = pool[session.stage % pool.length];
      session.log.push({ who: "ai", stage: 3, text: q, note: "多次尝试仍卡住——指出误区方向，仍不直接给完整答案。" });
    } else {
      const pool = PT.socratic["step" + Math.min(2, session.stage)][lvKey];
      const q = pool[session.tries % pool.length];
      session.log.push({ who: "ai", stage: session.stage, text: q });
    }
    session.tries++;
    return session;
  },
  // 概念疑问 → 温和指出误区再引导辨析
  concept(session) {
    const lvKey = session.level === "学困生" ? "low" : session.level === "优等生" ? "high" : "mid";
    const q = PT.socratic.misconcept[lvKey][0].replace(/___/g, "（请对照课本定义填入正确表述）");
    session.log.push({ who: "ai", stage: "概念辨析", text: "我先温和指出一个可能的误区：", concept: q, note: "不直接否定，先对比再引导辨析。" });
    return session;
  },
  // 超纲/争议
  outOfScope(session) {
    session.log.push({ who: "ai", stage: "超纲", text: PT.outOfScope, oos: true });
    return session;
  },
  // 换题重置
  reset(session, level) {
    return { level, question: "", topic: "", stage: 1, tries: 0, log: [{ who: "ai", text: "好的，换一题。把新问题贴进来，我继续用引导的方式陪你推导。" }], weak: "", done: false };
  },

  // 导出答疑记录（供老师查看疑问点）
  exportLog(session) {
    const L = [];
    L.push("【学生答疑记录（供老师查阅）】");
    L.push(`层次：${session.level}　薄弱点初判：${session.weak || "待归类"}`);
    L.push("");
    session.log.forEach(m => {
      if (m.who === "u") L.push(`学生：${m.text}`);
      else {
        L.push(`AI引导（阶段${m.stage}）：${m.text}`);
        if (m.concept) L.push(`　概念辨析：${m.concept}`);
        if (m.oos) L.push(`　${PT.outOfScope}`);
      }
    });
    L.push("");
    L.push("【疑问点提炼】");
    L.push(`1. 学生卡点阶段：${session.stage >= 3 ? "多次卡住，需老师介入讲解" : session.stage === 2 ? "已给一步提示，可再观察" : "初步引导中"}`);
    L.push(`2. 涉及知识点：${session.topic || "待归类"}`);
    L.push(`3. 错因初判：${session.weak || "请老师补充"}`);
    L.push("");
    L.push("【情绪提示】" + PT.emotionNote);
    L.push(PT.banner);
    return L.join("\n");
  }
};