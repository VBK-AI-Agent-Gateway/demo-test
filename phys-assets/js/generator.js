// ===== 素材生成引擎 =====
const PA = window.PA_DATA;

window.PAG = {
  // 匹配课题对应知识点包
  resolve(topic) {
    for (const [re, kp] of PA.kpMap) if (re.test(topic)) return kp;
    return { kp: topic, life: "身边常见现象（请老师按班级情况补充1例）", demo: null, story: topic + "的生活场景", hist: null };
  },
  getHist(kp) {
    const map = { "大气压强": "atm", "浮力": "buoy", "凸透镜成像": "lens", "简单机械": "lever", "欧姆定律": "ohm", "电与磁": "magnet", "速度": "speed", "内能与热机": "heat" };
    for (const k in map) if (kp.includes(k) || k.includes(kp)) return PA.histories[map[k]];
    return null;
  },

  // 主生成：返回 {idea, blocks:[{key,title,icon,lv,html,text}]}
  gen(topic, kind, level, types, plan) {
    const kp = this.resolve(topic);
    const lvKey = level === "学困生" ? "low" : level === "优等生" ? "high" : "mid";
    const lvPill = level === "学困生" ? '<span class="pill low">🌱 学困适配</span>' : level === "优等生" ? '<span class="pill high">🚀 优等适配</span>' : '<span class="pill mid">⚡ 中等适配</span>';
    const align = plan ? `已对齐你粘贴的教学目标/重难点，紧扣${kp.kp}。` : `基于课题『${topic}』生成通用素材，可再粘贴教案以精确对齐重难点。`;
    const idea = `设计思路：面向${kind}，围绕『${kp.kp}』选用 ${types.length} 类素材服务开课引疑→概念建构→规律理解→课堂梳理各环节；${align}`;

    const blocks = [];

    // 1 导入故事/生活实例
    if (types.includes("story")) {
      const s = this.story(kp, level, lvKey);
      blocks.push({ key: "story", icon: "📖", title: "课堂导入故事 / 生活化实例", lv: lvPill, html: `<div class="story">${s.html}</div>`, text: s.text });
    }
    // 2 趣味演示
    if (types.includes("demo")) {
      const d = this.demo(kp, level, lvPill);
      if (d) blocks.push({ key: "demo", icon: "🧪", title: "科学趣味演示说明", lv: lvPill, html: d.html, text: d.text });
    }
    // 3 物理学史
    if (types.includes("history")) {
      const h = this.history(kp, level, lvPill);
      if (h) blocks.push({ key: "history", icon: "📜", title: "物理学史小故事（真实）", lv: lvPill, html: h.html, text: h.text });
    }
    // 4 板书
    if (types.includes("board")) {
      const b = this.board(topic, kp, kind);
      blocks.push({ key: "board", icon: "✒️", title: "板书文字（精简版）", lv: lvPill, html: b.html, text: b.text });
    }
    // 5 思维导图
    if (types.includes("mind")) {
      const m = this.mind(topic, kp, kind);
      blocks.push({ key: "mind", icon: "🧠", title: "思维导图框架（Markdown）", lv: lvPill, html: m.html, text: m.text });
    }
    // 6 问题链
    if (types.includes("chain")) {
      const c = this.chain(kp, level, lvPill);
      blocks.push({ key: "chain", icon: "🔗", title: "课堂讨论问题链", lv: lvPill, html: c.html, text: c.text });
    }
    // 7 长文本压缩
    if (types.includes("compress")) {
      const cm = this.compress(kp, topic);
      blocks.push({ key: "compress", icon: "📄", title: PA.compressTpl.title, lv: lvPill, html: cm.html, text: cm.text });
    }

    const html = `
      <div class="idea"><b>💡 设计思路：</b>${idea}</div>
      <div class="warn-strip" style="margin-top:12px">📌 ${PA.banner} ${PA.levelNote[lvKey]}</div>
      ${blocks.map(b => `<div class="mat"><div class="mat-h"><span>${b.icon} ${b.title}</span>${b.lv}</div><div class="mat-b">${b.html}
        <div class="copy-b"><button onclick="copyBlock('${b.key}')">📋 复制本模块</button></div></div></div>`).join("")}`;

    const text = [idea, "", "【" + PA.banner + "】", ""]
      .concat(blocks.flatMap(b => ["【" + b.title + "】", b.text, ""]))
      .join("\n");
    return { idea, html, text, blocks, title: `素材_${topic}_${kind}` };
  },

  story(kp, level, lvKey) {
    const idea = `<div class="sec-t">开课引疑（100–300字，适配${level}）</div>`;
    let body;
    if (lvKey === "low") {
      body = `<p>上课啦！老师先讲个小场景：${kp.life}——同学们肯定见过。可你想过没有：为什么${kp.kp}会这样？是‘看不见的手’在起作用吗？今天我们就用身边的小实验，把这个‘为什么’一层层揭开。（约150字，语言通俗，先唤醒生活经验再抛出疑问）</p>`;
    } else if (lvKey === "high") {
      body = `<p>开课情境：围绕『${kp.life}』，先呈现一个反常识现象，让学生预测结果并说明依据，制造认知冲突。追问：如果条件改变（如换环境/换对象），结论还成立吗？带着论证意识进入本课${kp.kp}的探究。（约180字，激发深度思考）</p>`;
    } else {
      body = `<p>同学们，${kp.life}——这些场景每天都发生，但你能不能说清楚背后的道理？先猜一猜，再带着疑问进入今天的课题『${kp.kp}』，看谁能用刚学的规律解释生活现象。（约150字，制造疑问，衔接课题）</p>`;
    }
    const text = `开课引疑（${level}）：${body.replace(/<[^>]+>/g, "")}`;
    return { html: idea + body, text };
  },

  demo(kp, level, lvPill) {
    if (!kp.demo || !PA.demos[kp.demo]) return null;
    const d = PA.demos[kp.demo];
    const idea = `<div class="sec-t">课堂小演示（安全、器材随手可得）</div>`;
    const html = idea + `<table class="demo-tbl">
      <tr><td>器材</td><td>${d.器材}</td></tr>
      <tr><td>步骤</td><td>${d.步骤}</td></tr>
      <tr><td>现象</td><td>${d.现象}</td></tr>
      <tr><td>原理</td><td>${d.原理}</td></tr>
      <tr><td>课堂提问</td><td>${d.提问}</td></tr>
    </table><div class="safe">✅ ${d.safe}</div>`;
    const text = `演示：${d.title}\n器材：${d.器材}\n步骤：${d.步骤}\n现象：${d.现象}\n原理：${d.原理}\n课堂提问：${d.提问}\n${d.safe}`;
    return { html, text };
  },

  history(kp, level, lvPill) {
    const h = this.getHist(kp.kp);
    if (!h) return null;
    const idea = `<div class="sec-t">科学史话（突出探究过程，非人物传记）</div>`;
    const html = idea + `<div class="hist">${h}</div><div class="safe">⚠️ 史实已核对，未编造；如需拓展请教师另查权威资料。</div>`;
    const text = `物理学史：${h}`;
    return { html, text };
  },

  board(topic, kp, kind) {
    const idea = `<div class="sec-t">板书（黑板手写版，分条目、直接抄）</div>`;
    const b = `【${topic}】（${kind}）
一、核心概念：${kp.kp}——定义/公式
二、关键条件：成立的前提
三、生活联系：${kp.life}
四、易错提醒：条件·单位·表述
五、小结：一句话归纳`;
    const html = idea + `<div class="board"><span class="bt">${topic}</span>${window.esc(b)}</div>`;
    const text = `板书（${topic}）：\n${b}`;
    return { html, text };
  },

  mind(topic, kp, kind) {
    const idea = `<div class="sec-t">思维导图（关键词层级，复习课梳理用）</div>`;
    const m = `# ${topic}
## 一、概念
- ${kp.kp}的定义
- 单位/符号
## 二、规律/公式
- 核心关系
- 成立条件
## 三、实验
- 方法：控制变量
- 关键操作
## 四、应用
- ${kp.life.split("、")[0] || "生活实例"}
- 易错点`;
    const html = idea + `<div class="mind">${window.esc(m)}</div>`;
    const text = `思维导图：\n${m}`;
    return { html, text };
  },

  chain(kp, level, lvPill) {
    const idea = `<div class="sec-t">递进问题链（小组讨论，由浅入深）</div>`;
    const items = PA.chainTpl.map(t =>
      `<div class="chain-i"><span class="clv">${t.lv}</span><div class="cq">${t.q.replace(/\{kp\}/g, "<b>" + kp.kp + "</b>")}</div></div>`).join("");
    const html = idea + items;
    const text = "问题链：" + PA.chainTpl.map((t, i) => `${i + 1}.[${t.lv}] ${t.q.replace(/\{kp\}/g, kp.kp)}`).join("\n");
    return { html, text };
  },

  compress(kp, topic) {
    const idea = `<div class="sec-t">阅读摘要（科普材料压缩，初中难度）</div>`;
    const body = `<div class="compress">
      <div><b>【一句话导读】</b>围绕${kp.kp}，用${kp.life}等身边现象读懂核心道理。</div>
      <div><b>【核心3点】</b>① ${kp.kp}是什么；② 它成立的条件；③ 生活中怎么用。</div>
      <div><b>【关键词】</b>${kp.kp}、条件、应用、易错点</div>
      <div><b>【读后一问】</b>你能用一句话把${kp.kp}讲给同桌听懂吗？</div>
    </div>`;
    const text = `${PA.compressTpl.title}\n【一句话导读】围绕${kp.kp}，用身边现象读懂核心道理。\n【核心3点】①定义 ②条件 ③应用\n【关键词】${kp.kp}、条件、应用\n【读后一问】一句话讲给同桌听懂。`;
    return { html: idea + body, text };
  }
};

window.copyBlock = key => {
  const b = (window.__lastGen?.blocks || []).find(x => x.key === key);
  if (!b) return;
  navigator.clipboard?.writeText(b.text).then(() => window.toast("📋 已复制：" + b.title)).catch(() => window.toast("复制失败，请手动选择"));
};