// ===== 课件脚本组装器 =====
const KD = window.KJ_DATA;

window.KJGen = {
  // 课型/课文 → 课型归类，驱动文案差异
  classify(cfg) {
    if (cfg.kind === "topic") {
      const map = { "文言文阅读·课内对比": "文言", "文言文阅读·课外浅易": "文言", "古诗词鉴赏": "诗歌",
        "作文·审题立意": "作文", "作文·结构与素材": "作文", "作文·记叙文写作": "作文",
        "现代文阅读·说明文": "说明文", "现代文阅读·议论文": "议论文" };
      return map[cfg.target] || "记叙文";
    }
    const info = (KD.texts[cfg.book] || []).find(x => x.name === cfg.target);
    if (!info) return "记叙文";
    if (info.type === "文言文") return "文言";
    if (["古诗词", "诗词", "现代诗", "散文诗"].includes(info.type)) return "诗歌";
    if (["议论文", "议论性散文"].includes(info.type)) return "议论文";
    return "记叙文";
  },

  // 组装板块结构：课型骨架 + 文言文补字词积累
  buildStructure(cfg, cat) {
    let st = (KD.structure[cfg.lessonType] || KD.structure["新授课"]).slice();
    if (cat === "文言") {
      // 文言文在“文本精讲”前插入“字词积累”
      const i = st.indexOf("文本/考点精讲");
      st.splice(i < 0 ? 4 : i, 0, "字词积累");
    }
    return st;
  },

  // 按课题定制关键页面文案
  customize(page, cfg, cat) {
    const t = cfg.target;
    const info = cfg.kind === "text" ? (KD.texts[cfg.book] || []).find(x => x.name === t) : null;
    const base = KD.pages[page];
    if (!base) return { copy: "", pic: "无", anim: "文字上浮出现（点击触发）", note: "" };
    let copy = base.copy(t);

    if (page === "封面") copy = `《${t}》\n部编版九年级${cfg.kind === "topic" ? "· 中考专题" : cfg.book} 语文\n第${cfg.cur}课时 · ${cfg.lessonType}`;
    else if (page === "情境导入") {
      if (cfg.lessonType === "试卷讲评课") copy = `数据导入\n· 本类题得分率：__%\n· 核心问题：这次错在哪里？怎么改？`;
      else if (cat === "文言") copy = `情境导入\n· 一则与作者/背景相关的故事切入\n· 核心问题：古人因何写下此文？`;
      else copy = `情境导入\n· 一则中考真题导入语 / 真实生活情境\n· 核心问题：本课要解决什么？`;
    }
    else if (page === "预习检查") {
      copy = cat === "文言"
        ? `预习检查\n· 字词认读：开火车正音\n· 通译互查：标记疑难句\n· 文脉：一句话概括`
        : `预习检查\n· 字词/常识 快问快答\n· 文脉梳理：一句话概括\n· 疑难点：小组反馈`;
    }
    else if (page === "文本/考点精讲") {
      if (cfg.lessonType === "试卷讲评课") copy = `精讲订正\n· 典型错例：________\n· 错因诊断：________\n· 规范答案：分点表述`;
      else if (cat === "文言") copy = `文本研读 / 考点精讲\n· 关键句翻译：留删补换调\n· 主旨句圈画：________\n· 启示类答题：观点＋依据`;
      else if (cat === "作文") copy = `考点精讲\n· 审题：抓题眼/限制\n· 结构：起—承—转—合\n· 细节：动作/心理/环境`;
      else copy = `文本研读 / 考点精讲\n· 关键句：手法＋内容＋情感\n· 答题范式分点示范\n· 中考真题1题带入`;
    }
    else if (page === "探究活动") {
      copy = cat === "作文"
        ? `课堂活动（4分钟）\n· 同桌互评审题卡：切题？典型？\n· 展示：2组立意PK\n· 追问：谁更有深度？`
        : `小组探究（4分钟）\n· 任务：围绕核心问题形成观点\n· 要求：结合文本依据，分点表达\n· 展示：两组展示，他组追问`;
    }
    else if (page === "当堂练习") {
      copy = cfg.lessonType === "试卷讲评课"
        ? `变式演练\n· 同类题再练1—2题（方法迁移）\n· 独立→互批→讲评\n【答案】点击后出示`
        : `当堂练习（中考题型·2—4题）\n1. ${cat === "文言" ? "实词解释/翻译" : cat === "作文" ? "审题立意/片段修改" : "阅读规范答题"} 1题\n2. 同类变式 1—2题\n【答案】学生作答后点击出示`;
    }
    else if (page === "学习目标") {
      copy = `学习目标\n1. ${cat === "文言" ? "积累重点实词虚词，疏通文意" : cat === "作文" ? "掌握审题立意与结构构思" : "梳理文脉，把握文本核心"}\n2. 掌握1—2个中考考点答题方法\n3. 当堂训练达标（正确率≥80%）`;
    }
    else if (page === "考情分析" && info) copy = `中考考情分析（${info.type}类）\n· 分值占比：阅读题__分\n· 高频考点：________\n· 我班失分：________`;
    else if (page === "封底") copy = `谢谢聆听\n· 今日任务：完成【基础必做】\n· 下节课：${cfg.kind === "topic" ? "下一专题" : "下一篇课文"}`;
    else if (page === "课堂小结") {
      copy = `课堂小结\n· 知识：${cat === "文言" ? "实词虚词＋翻译五字法" : cat === "作文" ? "审题准＋结构清＋细节实" : "内容＋手法＋情感"}\n· 方法：分点规范，术语＋文本\n· 易错：踩分点勿遗漏`;
    }
    return { ...base, copy };
  },

  gen(cfg) {
    const cat = this.classify(cfg);
    const st = this.buildStructure(cfg, cat);
    const isTopic = cfg.kind === "topic";
    const info = isTopic ? null : (KD.texts[cfg.book] || []).find(x => x.name === cfg.target);
    const note = (cfg.note || "").trim();

    // 一句话设计思路
    let idea;
    if (cfg.lessonType === "中考专题复习课")
      idea = `复习课按“考情分析→考点精讲→方法总结→变式演练”推进，每页文字精简、模板高亮，突出答题规范落地。`;
    else if (cfg.lessonType === "试卷讲评课")
      idea = `讲评课以数据诊断开场，错例→错因→规范答案三步呈现，动画“先出题再点答案”，保证学生先动脑。`;
    else if (cat === "文言")
      idea = `文言新授课在通用框架中前置“字词积累”页，精讲页只放关键句与翻译五字法，其余靠口头与任务单展开。`;
    else
      idea = `通用十段框架，每页只保留大标题＋3条要点，配图与动画从简，备注页单独承载教师口头提示。`;

    // 组装页面
    const pages = st.map((s, i) => {
      const c = this.customize(s, cfg, cat);
      return { no: i + 1, sec: s, copy: c.copy, pic: c.pic, anim: c.anim, note: c.note };
    });

    // 追加模块
    const mods = [];
    if (cfg.withVideo) {
      const frames = KD.video.frames.map(f => ({
        ...f,
        img: f.img.replace(/《?课题》?/g, `《${cfg.target}》`),
        line: f.line.replace(/《?课题》?/g, `《${cfg.target}》`).replace("________？", "本课最易丢分的是什么？")
      }));
      mods.push({ key: "video", title: "🎥 附加模块一：课堂短视频脚本（约2分半 · 课前导入/重难点突破）", type: "video", frames });
    }
    if (cfg.withGame) {
      mods.push({ key: "game", title: "🎮 附加模块二：课堂小游戏（≤5分钟 · 紧扣本课考点）", type: "game", games: KD.games });
    }
    if (cfg.withTask) {
      mods.push({ key: "task", title: "📄 附加模块三：小组任务单（可直接打印）", type: "task", sheet: KD.taskSheet });
    }

    const subtitle = `${cfg.lessonType} ｜ 部编版九年级${isTopic ? "·中考专题" : cfg.book} ｜ 第${cfg.cur}课时（共${cfg.total}课时）`;
    const html = this.render(pages, mods, note);
    const text = this.toText(cfg, { idea, subtitle, pages, mods, note });

    return { title: cfg.target, subtitle, cat, idea, pages, mods, html, text };
  },

  render(pages, mods, note) {
    const esc = window.esc;
    let h = pages.map(p => `
      <div class="pg">
        <div class="pg-h"><span class="no">P${p.no}</span><span class="ti">${esc(p.sec)}</span></div>
        <div class="pg-b">
          <div class="fd copy"><span class="lb">页面文案</span><div class="val">${esc(p.copy)}</div></div>
          <div class="fd pic"><span class="lb">配图建议</span><div class="val">${esc(p.pic)}</div></div>
          <div class="fd anim"><span class="lb">动画提示</span><div class="val">${esc(p.anim)}</div></div>
          <div class="fd note"><span class="lb">备注（不上PPT·给老师）</span><div class="val">${esc(p.note)}</div></div>
        </div>
      </div>`).join("");

    mods.forEach(m => {
      if (m.type === "video") {
        h += `<div class="mod-sec"><div class="mod-h">${esc(m.title)}</div><div class="mod-b">
          <table class="vt"><tr><th>镜号</th><th>时长</th><th>画面内容</th><th>台词/字幕</th><th>拍摄建议</th></tr>
          ${m.frames.map(f => `<tr><td>${f.s}</td><td>${f.d}</td><td>${esc(f.img)}</td><td>${esc(f.line)}</td><td>${esc(f.tip)}</td></tr>`).join("")}
          </table></div></div>`;
      } else if (m.type === "game") {
        h += `<div class="mod-sec"><div class="mod-h">${esc(m.title)}</div><div class="mod-b">
          ${m.games.map(g => `<div class="game-card"><h4>🎲 ${esc(g.name)}<span style="float:right;font-size:12px;color:var(--muted);font-weight:400">${g.time}</span></h4>
            <p><b>规则：</b>${esc(g.rules)}</p>
            <p><b>步骤：</b>${esc(g.steps)}</p>
            <p><b>评价：</b>${esc(g.eval)}</p>
            <p><b>知识点：</b>${esc(g.knowledge)}</p></div>`).join("")}
          </div></div>`;
      } else if (m.type === "task") {
        const s = m.sheet;
        h += `<div class="mod-sec"><div class="mod-h">${esc(m.title)}</div><div class="mod-b">
          <div class="sheet"><div class="sh">小组任务单</div>
          <div class="meta">${esc(s.meta)}</div>
          ${s.tasks.map(t => `<div class="st"><b>${esc(t.n)}</b>：${esc(t.q)}<div class="rec">${esc(t.rec)}</div></div>`).join("")}
          <div class="dsc">${esc(s.display)}<br>${esc(s.eval)}</div></div></div></div>`;
      }
    });

    if (note) h = `<div class="idea-line"><b>📌 教师补充说明：</b>${window.esc(note)}</div>` + h;
    return h;
  },

  toText(c, o) {
    const L = [];
    L.push(`《${c.target}》课件脚本（PPT逐页）`);
    L.push(o.subtitle);
    L.push(`设计思路：${o.idea}`);
    L.push("");
    o.pages.forEach(p => {
      L.push(`【页码】第${p.no}页 ｜ ${p.sec}`);
      L.push(`页面文案：${p.copy.split("\n").join(" / ")}`);
      L.push(`配图建议：${p.pic}`);
      L.push(`动画提示：${p.anim}`);
      L.push(`备注：${p.note}`);
      L.push("");
    });
    o.mods.forEach(m => {
      L.push("==== " + m.title.replace(/[🎥🎮📄]\s*/, "") + " ====");
      if (m.type === "video") {
        L.push("镜号｜时长｜画面内容｜台词/字幕｜拍摄建议");
        m.frames.forEach(f => L.push(`${f.s}｜${f.d}｜${f.img}｜${f.line}｜${f.tip}`));
      } else if (m.type === "game") {
        m.games.forEach(g => { L.push(`■ ${g.name}（${g.time}）`); L.push(`  规则：${g.rules}`); L.push(`  步骤：${g.steps}`); L.push(`  评价：${g.eval}`); L.push(`  知识点：${g.knowledge}`); L.push(""); });
      } else if (m.type === "task") {
        const s = m.sheet;
        L.push(s.meta);
        s.tasks.forEach(t => { L.push(`■ ${t.n}：${t.q}`); L.push(t.rec); });
        L.push(s.display); L.push(s.eval);
      }
      L.push("");
    });
    if (o.note) L.push(`【教师补充】${o.note}`);
    return L.join("\n");
  }
};