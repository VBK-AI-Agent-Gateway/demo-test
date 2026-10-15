// ===== 教案组装器：严格 11 板块 =====
const YD = window.YW_DATA;

window.YWGen = {
  // 根据输入确定课型归类（文言/记叙文/说明文/议论文/作文/诗歌），驱动小练与提问链
  classify(cfg) {
    if (cfg.kind === "topic") {
      const t = YD.topics.find(x => x.name === cfg.target);
      if (!t) return "记叙文";
      if (t.cat === "文言") return "文言";
      if (t.cat === "古诗文") return "诗歌";
      if (t.cat === "作文") return "作文";
      if (t.name.includes("说明")) return "说明文";
      if (t.name.includes("议论")) return "议论文";
      return "记叙文";
    }
    const book = YD.texts[cfg.book] || [];
    const info = book.find(x => x.name === cfg.target) || {};
    if (info.type === "文言文") return "文言";
    if (info.type === "古诗词" || info.type === "诗词" || info.type === "现代诗" || info.type === "散文诗") return "诗歌";
    if (info.type === "议论文" || info.type === "议论性散文") return "议论文";
    if (info.type === "说明文") return "说明文";
    if (cfg.lessonType === "试卷讲评课" || cfg.lessonType === "中考专题复习课") return "记叙文";
    return "记叙文";
  },

  gen(cfg) {
    const cat = this.classify(cfg);
    const isTopic = cfg.kind === "topic";
    const info = isTopic ? null : (YD.texts[cfg.book] || []).find(x => x.name === cfg.target);
    const topic = isTopic ? YD.topics.find(x => x.name === cfg.target) : null;
    const title = cfg.target;
    const note = (cfg.note || "").trim();

    // —— 一句话设计思路 ——
    let idea = "";
    if (cfg.lessonType === "中考专题复习课")
      idea = `以【${title}】专题为载体，遵循“考点透视—范式精讲—真题演练—错因复盘”闭环，聚焦答题规范与踩分点，落实分层达标。`;
    else if (cfg.lessonType === "试卷讲评课")
      idea = `以考定教，围绕【${title}】高频失分点进行数据化讲评，重思路纠偏与答题范式迁移，一题带一类。`;
    else
      idea = `以中考导向重构【${title}】${info ? `（${info.type}·${info.author}）` : ""}教学，读写结合、考点落地，兼顾文本细读与应试能力双线推进。`;

    // —— 教学目标（新课标四素养）——
    const goals = [
      ["语言运用", YD.literacy["语言运用"].replace("本课重点字词/句式/论证语言",
        cat === "文言" ? "重点实词、虚词与文言语句" : cat === "作文" ? "审题立意与叙事描写语言" : "关键词句与文本语言")],
      ["思维能力", cat === "文言" ? "借助注释与语境推断文意，梳理文脉，比较探究，形成文言阅读的推断与概括能力。"
        : cat === "作文" ? "通过审题立意与结构构思训练，发展逆向、发散与逻辑编排思维，提升构思立意能力。"
        : YD.literacy["思维能力"]],
      ["审美创造", cat === "诗歌" ? "品味意象与炼字，感受诗歌意境与情感之美，能进行个性化朗诵与诗意表达。"
        : cat === "作文" ? "在范文片段赏析中感受细节与真情之美，能修改完善自己的习作，提升表达感染力。"
        : YD.literacy["审美创造"]],
      ["文化自信", info && info.author ? `通过知人论世，理解${info.author}作品的人文情怀与时代价值，增强文化认同与家国情怀。`
        : YD.literacy["文化自信"]]
    ];

    // —— 重难点 ——
    const keyMap = {
      文言: ["重点实词虚词的准确理解、关键句翻译与内容启示的规范表述（中考文言阅读核心）", "在语境中推断词义、把省略句/倒装句译通顺，并完整归纳人物形象或启示"],
      记叙文: ["梳理文脉，掌握词句赏析、标题含义、句段作用等答题范式的分点规范表达", "深层主旨与情感的准确把握，作用题“结构+内容+情感”多角度不遗漏"],
      说明文: ["说明对象特征、说明方法作用、说明文语言准确性的答题模板规范运用", "“能否删去”类题的严密逻辑表述，说明顺序与结构的准确判断"],
      议论文: ["中心论点的准确提取、论证方法作用与论证思路的规范化表述", "论证过程的分层梳与补写论据与观点的精准匹配"],
      作文: ["审题立意准确、结构完整、素材典型，掌握考场记叙文快速成篇方法", "以小见大与细节描写，避免假大空，写出真情实感与思考深度"],
      诗歌: ["意象画面描绘、炼字赏析与情感把握的规范答题", "结合背景准确体会复杂情感，表现手法的准确判断与分析"]
    };
    const [keyPt, hardPt] = keyMap[cat];
    if (note) { /* 班情并入学情 */ }

    // —— 学情分析 ——
    const baseXueqing = {
      文言: "初三学生已有一定文言积累，但实词积累碎片化、一词多义易混，翻译常漏关键词、以今律古；启示类概括易空泛。",
      记叙文: "学生能读懂文本浅层内容，但答题缺分点意识，赏析“手法+内容+情感”三要素不全，主旨探究停留表面。",
      说明文: "学生对说明方法判断基本无误，但作用表述套话化、不结合文本；“准确性”题答不全“删后后果”。",
      议论文: "学生能找出观点句，但论点论题混淆、论证思路表述混乱、补写论据与观点脱节。",
      作文: "学生审题易忽略关键词与隐含要求，叙事空泛、细节缺失，结尾喊口号，缺少真实素材与思考。",
      诗歌: "学生能背诵诗句，但炼字答不全“释义+手法+情感”，画面描绘成翻译，情感把握脱离背景。"
    }[cat];
    const xueqing = baseXueqing + (note ? `【班情补充】${note}。` : "");

    // —— 教学过程七环节 ——
    const T = YD.timings;
    const env = [];
    // ① 导入
    let intro = "";
    if (cfg.lessonType === "中考专题复习课")
      intro = `呈现近期测试【${title}】类题目得分数据，指出共性失分，明确本课“拿满分、规范答”的目标，直入考点。`;
    else if (cfg.lessonType === "试卷讲评课")
      intro = `展示本次考试【${title}】相关小题得分率与典型错卷（匿名），学生自查失分，锁定讲评重点。`;
    else if (cat === "文言")
      intro = `由“${info ? info.author : "古人"}”一则与本文相关的故事或名句切入，唤起学生对文本背景的兴趣，引出课题。`;
    else if (cat === "作文")
      intro = `投影两段学生习作片段（一具体一空泛），学生比较优劣，明确“细节与真情”是提分关键，引出本课训练点。`;
    else
      intro = `创设与文本主题相关的真实情境（中考真题导入语），激活学生已有体验，引出课题与核心问题。`;
    env.push({ n: "① 课堂导入", t: T.导入, items: [intro, "明确本课学习目标与中考对接点（PPT 目标页）。"] });

    // ② 预习检查
    const prep = cat === "文言"
      ? ["PPT 出示重点字词（加点），开火车认读并释义，正音正形。", "同桌互查预习任务单：通译全文，标记疑难句。", "教师抽查 2—3 句翻译，暴露共性问题，记录板书。"]
      : ["检查预习任务单：字词积累、文脉梳理、核心问题作答情况（投影反馈）。", "快速问答：用一句话概括内容/明确文体与观点（针对课型）。", "梳理学生疑难点，生成本课核心研读问题。"];
    env.push({ n: "② 预习检查", t: T.预习检查, items: prep });

    // ③ 文本研读/考点精讲
    const readItems = cat === "文言"
      ? ["活动一·通文意：小组合作逐段疏通，重点落实实词（板书词条）、虚词用法与特殊句式。", "活动二·析主旨：圈画体现作者情感/态度的关键句，结合背景探究主旨与启示。", "考点精讲：翻译“留删补换调”五字法示范一句，归纳人物形象/内容理解答题步骤。"]
      : cat === "作文"
      ? ["审题示范：拆解题目关键词、明确限制与写作范围，现场列 2 个立意角度。", "结构精讲：以“起承转合”或“一线串珠”搭建议场提纲，明确详略。", "细节突破：从事件中选“一帧画面”，示范动作/心理/环境描写的具体写法。"]
      : ["活动一·整体感知：学生速读，圈画关键句，完成文脉/观点/对象梳理（任务单）。", "活动二·重点研读：聚焦核心段落，品味关键词句，提炼答题所需“文本依据”。", "考点精讲：结合中考真题，归纳本类题“答题范式”（分点模板），当堂仿写一句。"];
    env.push({ n: "③ 文本研读 / 考点精讲", t: T.研读, items: readItems });

    // ④ 课堂活动
    const actItems = cat === "作文"
      ? ["小组活动：交换审题卡，互评立意是否切题、素材是否典型，推选全班展示。", "思辨探究：同一题目，两种立意，谁更有深度？师生共评。"]
      : ["小组讨论：围绕核心问题（出示讨论提纲），4 分钟组内形成观点并批注文本依据。", "展示交锋：两组展示，他组追问补充，教师点拨纠偏（控制在 4 分钟内）。", "答题训练：将讨论结果转化为规范答案，投影 1 份现场修改。"];
    env.push({ n: "④ 课堂活动", t: T.活动, items: actItems });

    // ⑤ 当堂小练
    const drills = (YD.drills[cat] || YD.drills["记叙文"]).slice(0, cfg.lessonType === "试卷讲评课" ? 4 : 4);
    const drillHtml = cfg.withDrill ? `
      <div class="env">
        <div class="eh"><b>⑤ 当堂小练</b><span class="time">约 ${T.小练} 分钟 · 2–4 题 · 中考题型</span></div>
        <div class="bd">${drills.map((d, i) => `
          <div class="drill">
            <div class="q">${i + 1}. ${d.q}</div>
            <div class="a">【参考答案】${d.a}</div>
            <div class="e">【简析】${d.e}</div>
          </div>`).join("")}
        </div>
      </div>` : "";

    // ⑥ 小结
    const summary = cat === "文言"
      ? "师生共同回顾：本课重点实词虚词、翻译方法与主旨启示的答题步骤；强调“语境推断+关键词落实”。"
      : cat === "作文"
      ? "回扣本课写作点：审题准、结构清、细节实；学生用一句话自评本课收获。"
      : "用思维导图回顾本课“文本内容—答题范式—易错点”，学生完善笔记并标注中考对接题型。";

    // ⑦ 分层作业
    const hwBase = {
      文言: "① 背默本文并巩固重点实词虚词；② 完成课后“文言积累”练习（基础必做）。",
      记叙文: "① 完成课后“基础积累”字词与内容题；② 整理本课答题范式卡片（基础必做）。",
      说明文: "① 完成课后字词与说明方法判断题；② 抄写并背诵“准确性”答题模板（基础必做）。",
      议论文: "① 梳理本文论点论据表格；② 抄写论证思路答题模板（基础必做）。",
      作文: "① 完成审题训练单；② 列出本文素材三个备选并写 100 字梗概（基础必做）。",
      诗歌: "① 背默本诗；② 整理“炼字/画面/情感”答题步骤（基础必做）。"
    }[cat];
    const hwUp = {
      文言: "① 拓展：完成一篇课外浅易文言对比阅读（1 篇），落实实词迁移与翻译。",
      记叙文: "① 完成一篇同类文本阅读（中考真题 1 篇），用范式规范作答并自评踩分点。",
      说明文: "① 完成说明文真题 1 篇，重点练“准确性”与“说明方法”两题。",
      议论文: "① 完成议论文真题 1 篇，重点练“论证思路”与“补写论据”。",
      作文: "① 按课堂提纲完成作文初稿（600 字以上），用红笔自改细节两处。",
      诗歌: "① 完成课外古诗对比鉴赏 1 题，规范书写答题步骤。"
    }[cat];
    const hwHard = {
      文言: "挑战：用本文实词虚词自拟 2 道考题并附答案，或写 150 字“作者其人其文”微评论。",
      记叙文: "挑战：变换叙述视角或删改一处关键情节，探究对主旨表达的影响，写 150 字探究小文。",
      说明文: "挑战：为本文换一种说明顺序重写一段，并说明理由。",
      议论文: "挑战：针对文中观点写一段 200 字驳论或补写事实+道理论据各一。",
      作文: "挑战：换一个立意角度重写开头与结尾各一段，比较两稿高下并说明理由。",
      诗歌: "挑战：比较本诗与同题材另一首诗的情感异同，写 150 字比较鉴赏。"
    }[cat];
    const hw = cfg.withLayer ? `
      <div class="env"><div class="eh"><b>分层作业</b><span class="time">基础必做 / 提升选做 / 拓展挑战</span></div><div class="bd">
        <div class="rd"><b>【基础·必做】</b>${hwBase}</div>
        <div class="rd"><b>【提升·选做】</b>${hwUp}</div>
        <div class="rd"><b>【拓展·挑战】</b>${hwHard}</div>
      </div></div>` : "";

    // —— 板书设计 ——
    const boardTxt = {
      文言: `课题：${title}\n实词：___＝___（语境义）　虚词：之/而/以\n翻译：留 删 补 换 调\n内容 → 情感/启示（结合关键词）`,
      记叙文: `课题：${title}\n内容：谁→做→果\n赏析＝手法＋内容＋情感\n标题＝表层＋深层\n作用＝结构＋内容＋情感\n主旨：通过……表达……`,
      说明文: `课题：${title}\n对象＋特征\n说明方法→特征→效果\n准确性＝解词＋带入＋删后\n顺序：逻辑/时间/空间`,
      议论文: `课题：${title}\n论点（判断句）\n论据：事实＋道理\n方法→内容→观点→效果\n思路：提出→分析→结论`,
      作文: `题目：${title}\n题眼 → 立意（2 选 1）\n结构：起—承—转—合\n细节：动作/心理/环境\n真情：以小见大`,
      诗歌: `课题：${title}\n意象 → 画面 → 情感\n炼字＝释义＋手法＋情感\n手法：借景抒情/对比/用典\n名句＝内容＋哲理/情感`
    }[cat];
    const board = `<div class="board"><span class="bt">板 书 设 计</span>${window.esc(boardTxt)}</div>`;

    // —— 反思预设 ——
    const reflect = [
      cat === "文言" ? "预判：学生翻译易“以今律古”、漏关键词。对策：投影“五字法”逐句核对，同桌互译互改。"
        : "预判：学生答题易套话、缺文本依据。对策：示范“回到原文圈依据”，投影典型答案现场改。",
      cfg.lessonType === "中考专题复习课" ? "预判：优等生“吃不饱”。对策：追问变式与一题多解，布置挑战题。" : "预判：小组讨论流于形式。对策：出示讨论提限定句式，教师巡组点拨。",
      note ? `预判（班情）：${note}。对策：当堂增加 1 次个别反馈，分层任务单重点关注学困生达标。`
        : "预判：时间紧张导致小练仓促。对策：研读环节严格控时，小练优先保证第 1—2 题完整讲评。",
      "改进方向：下节课前用 5 分钟滚动检测本课核心考点，未达标学生面批。"
    ];

    // —— 附件① 提问链 ——
    const chain = cfg.withChain ? `
      <div class="sec attach"><div class="h">附件① 课堂提问链（递进式）</div><div class="bd">
        <ol class="chain">${YD.questionChains[cat].map(q => `<li>${q}</li>`).join("")}</ol>
      </div></div>` : "";

    // —— 附件② 中考对接 ——
    const exam = cfg.withExam ? `
      <div class="sec"><div class="h">附件② 本课中考对接考点说明</div><div class="bd">
        <div class="exam-map">${YD.examMap[cat]}<br><b>对应题型：</b>${topic ? topic.focus : (info ? info.type + "类文本阅读与积累运用" : "")}。本课“当堂小练”即按该题型命制，训练分点规范作答。</div>
      </div></div>` : "";

    // —— 文言专项附件 ——
    const wenyanAttach = (cat === "文言" && cfg.withFw) ? `
      <div class="sec"><div class="h">附件③ 文言重点实词虚词清单 & 关键句翻译</div><div class="bd">
        <div class="vocab">
          <div class="vi"><b>① 意</b>：情趣（醉翁之意不在酒）</div>
          <div class="vi"><b>② 归</b>：归向、聚拢（吾谁与归）</div>
          <div class="vi"><b>③ 徽</b>：如果没有（微斯人）</div>
          <div class="vi"><b>④ 陈</b>：陈列、摆开（杂然而前陈者）</div>
          <div class="vi"><b>虚词 之</b>：结构助词“的”/主谓间取消独立/代词</div>
          <div class="vi"><b>虚词 而</b>：表承接/转折/修饰，需结合语境</div>
          <div class="vi"><b>虚词 以</b>：表凭借“用、把”/因为/来</div>
          <div class="vi"><b>虚词 其</b>：代词“他(们)的”/语气词/其中的</div>
        </div>
        <div class="translate"><b>关键句翻译（直译为主）：</b><br>
        ① 醉翁之意不在酒，在乎山水之间也。——醉翁的情趣不在于酒，而在于山水之间的乐趣。<br>
        ② 先天下之忧而忧，后天下之乐而乐。——在天下人忧愁之前先忧愁，在天下人快乐之后才快乐。<br>
        ③ 野芳发而幽香，佳木秀而繁阴。——野花开放有一股清幽的香气，好的树木枝叶繁茂形成浓密的绿荫。</div>
      </div></div>` : "";

    // —— 现代文答题范式 ——
    const paradigm = (["记叙文", "说明文", "议论文"].includes(cat) && cfg.withXd) ? `
      <div class="sec"><div class="h">附件③ 现代文阅读答题范式</div><div class="bd">
        ${cat === "记叙文" ? `
        <div class="paradigm"><b>词句赏析：</b>手法（修辞/描写/炼字）＋ 写出了……内容 ＋ 表现了……情感/形象。</div>
        <div class="paradigm"><b>标题含义：</b>表层义（字面/事件）＋ 深层义（象征/主旨/情感/线索）。</div>
        <div class="paradigm"><b>句段作用：</b>内容上（写出了……，表现了……）＋ 结构上（承上启下/铺垫/照应/线索）＋ 读者效果。</div>
        <div class="paradigm"><b>概括内容：</b>谁（对象）＋ 在什么情况下 ＋ 做了什么 ＋ 结果如何（谁+做+果）。</div>`
        : cat === "说明文" ? `
        <div class="paradigm"><b>说明方法作用：</b>说明方法 ＋ 具体说明了……的特征 ＋ 使说明更准确/通俗/有说服力。</div>
        <div class="paradigm"><b>语言准确性：</b>“××”词表……（估计/限制/程度），说明了……，体现了说明文语言的准确严密；若删则……，与事实不符，不能删。</div>
        <div class="paradigm"><b>说明对象特征：</b>中心句＋段首句＋关键词，分点概括（①②③）。</div>`
        : `
        <div class="paradigm"><b>论证方法作用：</b>举例/对比/比喻论证 ＋ 概括内容 ＋ 具体有力地论证了……观点 ＋ 增强说服力。</div>
        <div class="paradigm"><b>论证思路：</b>首先提出……观点 ＋ 然后用……（方法+内容）加以论证 ＋ 最后得出……结论。</div>
        <div class="paradigm"><b>补写论据：</b>紧扣观点 ＋ 人物+事件+结果（事实）/ 名言+阐释（道理），事实论据要典型简洁。</div>`}
      </div></div>` : "";

    // —— 作文专项附件 ——
    const zuowenAttach = (cat === "作文" && cfg.withZw) ? `
      <div class="sec"><div class="h">附件③ 作文专项：审题训练 · 范文片段 · 修改任务</div><div class="bd">
        <div class="rd"><b>【审题训练】</b>任选其一完成审题卡：①《这才是该有的样子》——抓题眼“这才”，暗含对比与转变，需写出“过去/现在”或“表面/真正”；② 材料作文——提炼材料核心矛盾，多角度立意选其一，忌复述材料。</div>
        <div class="rd"><b>【范文片段】</b>“台灯下，笔尖在草稿纸上沙沙游走，汗珠顺着额角滑落，草稿纸上的函数图像一遍遍重画。那一刻我忽然懂得：所谓成长，就是与难题死磕到底的样子。”<br><span style="color:var(--muted);font-size:13px">——点评：以具体画面代替空泛抒情，动作+细节，结尾点题。</span></div>
        <div class="rd"><b>【修改任务】</b>从自己的习作中划出 2 处“空话/口号句”，改为有动作、有心理的细节描写（每处 40 字以上），同桌互评后誊写。</div>
      </div></div>` : "";

    // —— 组装 HTML ——
    const subtitle = `${cfg.lessonType} ｜ 部编版九年级${cfg.kind === "topic" ? "·中考专题" : cfg.book} ｜ 共 ${cfg.total} 课时，本课为第 ${cfg.cur} 课时`;
    const html = `
      <h1>${window.esc(title)}</h1>
      <div class="subtitle">${subtitle}</div>

      <div class="sec"><div class="h">【课型】与设计思路</div><div class="bd">
        <div class="kv">
          <span class="k">课型</span><span>${cfg.lessonType}</span>
          <span class="k">课时</span><span>共 ${cfg.total} 课时，本课为第 ${cfg.cur} 课时</span>
          <span class="k">设计思路</span><span>${idea}</span>
        </div>
      </div></div>

      <div class="sec"><div class="h">【教学目标】（新课标四核心素养）</div><div class="bd">
        ${goals.map(g => `<div class="goal"><b>${g[0]}：</b>${g[1]}</div>`).join("")}
      </div></div>

      <div class="sec"><div class="h">【教学重难点】</div><div class="bd">
        <div class="rd"><b>重点：</b>${keyPt}</div>
        <div class="rd bad"><b>难点：</b>${hardPt}</div>
      </div></div>

      <div class="sec"><div class="h">【学情分析】</div><div class="bd"><p>${xueqing}</p></div></div>

      <div class="sec"><div class="h">【教学准备】</div><div class="bd"><p>PPT 课件（含考点页与真题页）、预习任务单（${cat === "文言" ? "字词疏通+通译+疑难标记" : "文脉梳理+核心问题"}）、课堂练习（当堂小练题卷）、板书预设（见板书设计）。</p></div></div>

      <div class="sec"><div class="h">【教学过程】</div><div class="bd">
        ${env.map(e => `<div class="env"><div class="eh"><b>${e.n}</b><span class="time">约 ${e.t} 分钟</span></div>
          <ol>${e.items.map(i => `<li>${i}</li>`).join("")}</ol></div>`).join("")}
        ${drillHtml}
        <div class="env"><div class="eh"><b>⑥ 课堂小结</b><span class="time">约 ${T.小结} 分钟</span></div>
          <ol><li>${summary}</li></ol></div>
        ${hw}
      </div></div>

      <div class="sec"><div class="h">【板书设计】</div><div class="bd">${board}</div></div>

      <div class="sec"><div class="h">【教学反思预设】</div><div class="bd">
        <div class="reflect"><ul>${reflect.map(r => `<li>${r}</li>`).join("")}</ul></div>
      </div></div>

      <div class="sec"><div class="h">【配套附件】</div><div class="bd">
        ${chain}${exam}${wenyanAttach}${paradigm}${zuowenAttach}
        ${!chain && !exam && !wenyanAttach && !paradigm && !zuowenAttach ? '<p class="empty">（未勾选附件项）</p>' : ""}
      </div></div>`;

    // —— 纯文本版（供复制/导出）——
    const text = this.toText(cfg, { idea, goals, keyPt, hardPt, xueqing, env, drills, summary, hwBase, hwUp, hwHard, boardTxt, reflect, cat, title, subtitle, withDrill: cfg.withDrill, withLayer: cfg.withLayer, withChain: cfg.withChain, withExam: cfg.withExam });

    return { title, subtitle, cat, idea, html, text };
  },

  toText(c, o) {
    const L = [];
    L.push(`《${o.title}》教案`);
    L.push(`${o.subtitle}`);
    L.push(`【课型】${c.lessonType}`);
    L.push("");
    L.push("【教学目标】（新课标四核心素养）");
    o.goals.forEach(g => L.push(`  ${g[0]}：${g[1]}`));
    L.push("");
    L.push("【教学重难点】");
    L.push(`  重点：${o.keyPt}`);
    L.push(`  难点：${o.hardPt}`);
    L.push("");
    L.push("【学情分析】");
    L.push(`  ${o.xueqing}`);
    L.push("");
    L.push("【教学准备】");
    L.push("  PPT课件、预习任务单、课堂练习、板书预设。");
    L.push("");
    L.push("【教学过程】");
    o.env.forEach(e => {
      L.push(`  ${e.n}（约${e.t}分钟）：`);
      e.items.forEach((i, idx) => L.push(`    ${idx + 1}. ${i}`));
    });
    if (o.withDrill) {
      L.push(`  ⑤ 当堂小练（约7分钟，附答案）：`);
      o.drills.forEach((d, i) => { L.push(`    ${i + 1}. ${d.q}`); L.push(`       【答案】${d.a}`); L.push(`       【简析】${d.e}`); });
    }
    L.push(`  ⑥ 课堂小结（约3分钟）：${o.summary}`);
    if (o.withLayer) {
      L.push("  ⑦ 分层作业：");
      L.push(`    【基础必做】${o.hwBase}`);
      L.push(`    【提升选做】${o.hwUp}`);
      L.push(`    【拓展挑战】${o.hwHard}`);
    }
    L.push("");
    L.push("【板书设计】");
    L.push(o.boardTxt.split("\n").map(x => "  " + x).join("\n"));
    L.push("");
    L.push("【教学反思预设】");
    o.reflect.forEach(r => L.push("  · " + r));
    if (o.withChain) { L.push(""); L.push("【附件① 课堂提问链】"); YD.questionChains[o.cat].forEach((q, i) => L.push(`  ${i + 1}. ${q}`)); }
    if (o.withExam) { L.push(""); L.push("【附件② 中考对接考点】"); L.push("  " + YD.examMap[o.cat]); }
    return L.join("\n");
  }
};