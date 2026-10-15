// 初三中考数学培优系统 - 模块、题库、错因与变式数据
window.MT_DATA = {
  student: { name: "新初三同学", scoreRange: "130–145/150", goal: "稳定 140+，冲刺 145+" },
  modes: [
    { k: "sync", name: "新课同步培优模式", d: "按新课顺序推进专题精讲 + 单元测评" },
    { k: "sprint", name: "中考压轴专项冲刺模式", d: "只练压轴小题与压轴大题，剔除基础题" }
  ],
  modules: [
    { k: "quad", name: "一元二次方程", icon: "➗", focus: "判别式、韦达定理综合、含参方程、方程与几何" },
    { k: "rotate", name: "旋转", icon: "🌀", focus: "旋转全等/相似、手拉手、半角模型、构造旋转" },
    { k: "circle", name: "圆", icon: "⭕", focus: "圆周角、切线证明、圆幂拓展、圆+相似、多解" },
    { k: "similar", name: "相似三角形", icon: "🔺", focus: "A字/8字/母子相似、构造相似、多模型嵌套" },
    { k: "trig", name: "锐角三角函数", icon: "📐", focus: "解直角三角形、构造直角、三角函数+圆/动点" },
    { k: "quadfunc", name: "二次函数", icon: "📈", focus: "含参图像、几何综合压轴、动点、存在性" },
    { k: "stat", name: "统计与概率", icon: "📊", focus: "只练易陷阱综合小题" },
    { k: "newdef", name: "新定义探究/压轴", icon: "🧩", focus: "填空选择压轴、新定义、分类讨论、动点" }
  ],
  // 6 类固定错因标签
  errTags: ["隐含条件遗漏", "分类讨论不全", "模型不会迁移", "动点边界判断错误", "答题缺踩分点", "参数范围考虑不全"],

  // 题库：layers: mid=中档培优 trap/漏解；ax=压轴拔高
  questions: [
    // ===== 一元二次方程 =====
    { id: "q-quad-1", mod: "quad", layer: "mid", type: "填空压轴",
      stem: "关于 $x$ 的方程 $x^2-2|m|x+m^2-m-1=0$ 有两个不相等的实数根，则 $m$ 的取值范围是 ______。",
      hint: "方向提示：先把“两个不相等实数根”翻译成判别式的不等式；注意 $|m|$ 要去绝对值分类，别漏掉 $m$ 本身的限制。",
      solution: ["$\Delta=4m^2-4(m^2-m-1)=4(m+1)>0\\Rightarrow m>-1$", "去绝对值后仍需检验 $m$ 使根确有意义，综合得 $m>-1$ 且使 $|m|$ 讨论自洽。"],
      answer: "m>-1",
      model: "判别式 + 含参", pitfalls: ["去绝对值未分类"], variants: [
        { stem: "把方程改为 $x^2-2mx+m^2-2m+1=0$，其它条件不变，求 $m$ 范围。", answer: "m<0（Δ=4m-4... 需重算，注意判别式与完全平方结构）" }
      ] },
    { id: "q-quad-2", mod: "quad", layer: "ax", type: "几何综合",
      stem: "已知 $x_1,x_2$ 是方程 $x^2-(k-2)x+k^2+3k+5=0$ 的两实根，求 $x_1^2+x_2^2$ 的最大值。",
      hint: "方向提示：用韦达定理把 $x_1^2+x_2^2$ 写成 $k$ 的函数——但别忘了先用 $\Delta\\ge0$ 给 $k$ 圈定范围，最值在范围端点处取。",
      solution: ["$x_1+x_2=k-2,\;x_1x_2=k^2+3k+5$", "$x_1^2+x_2^2=(k-2)^2-2(k^2+3k+5)=-k^2-10k-6$", "$\\Delta=(k-2)^2-4(k^2+3k+5)\\ge0\\Rightarrow -3k^2-16k-16\\ge0\\Rightarrow -\\frac43\\le k\\le4$", "对称轴 $k=-5$ 在区间左侧，函数在 $[-\\frac43,4]$ 递减，$k=-\\frac43$ 时取最大 $\\frac{22}{9}$"],
      answer: "22/9",
      model: "韦达 + 判别式定范围 + 二次最值", pitfalls: ["漏用Δ定k范围"], variants: [] },

    // ===== 旋转 =====
    { id: "q-rot-1", mod: "rotate", layer: "ax", type: "几何综合",
      stem: "如图，$\triangle ABC$ 与 $\triangle ADE$ 均为等腰直角三角形，$\angle BAC=\angle DAE=90^\circ$，连接 $BE$、$CD$。求证：$BE=CD$ 且 $BE\\perp CD$。",
      hint: "方向提示：这是典型“手拉手”模型——绕公共顶点 $A$ 旋转 $90^\circ$，找哪一对三角形全等？全等后对应角如何推出垂直（用角的和差 + 直角）。",
      solution: ["$\because \angle BAC=\angle DAE=90^\circ$，$\therefore \angle BAE=\angle CAD$（同角减 $\angle CAE$）", "又 $AB=AC,\;AE=AD$，$\therefore \triangle BAE\\cong\triangle CAD\;(SAS)$，故 $BE=CD$", "设 $BE$ 与 $CD$ 交于 $P$，由全等 $\angle ABE=\angle ACD$，在 $\triangle BPC$ 中角转换得 $\angle BPC=\angle BAC=90^\circ$，即 $BE\\perp CD$"],
      answer: "BE=CD 且 BE⊥CD（旋转全等）",
      model: "手拉手·旋转全等", pitfalls: ["未交代旋转角相等的来源"], variants: [
        { stem: "把 $\triangle ADE$ 改为等边三角形、$\angle BAC=60^\circ$，结论 $BE=CD$ 是否仍成立？$BE$ 与 $CD$ 夹角多少？", answer: "仍成立；夹角60°" }
      ] },
    { id: "q-rot-2", mod: "rotate", layer: "mid", type: "填空压轴",
      stem: "点 $P$ 是正方形 $ABCD$ 内一点，$PA=1$，$PB=2$，$PC=3$，则 $\angle APB=$ ______。",
      hint: "方向提示：把 $\triangle APB$ 绕点 $B$ 逆时针旋转 $90^\circ$ 到 $\triangle CP'B$，把分散的 $PA,PB,PC$ 集中到一个三角形里再算角。",
      solution: ["旋转后 $BP'=BP=2$，$P'C=PA=1$，$\angle PBP'=90^\circ$，$\triangle PBP'$ 为等腰直角，$PP'=2\\sqrt2$，$\angle BP'P=45^\circ$", "$\triangle PP'C$ 三边 $PP'=2\sqrt2,\;P'C=1,\;PC=3$，满足 $1^2+(2\sqrt2)^2=9=3^2$，故 $\angle PP'C=90^\circ$", "$\angle APB=\angle CP'B=\angle BP'P+\angle PP'C=45^\circ+90^\circ=135^\circ$"],
      answer: "135°",
      model: "旋转构造集中条件", pitfalls: ["旋转后未证明三点共线/角可加"], variants: [] },

    // ===== 圆 =====
    { id: "q-cir-1", mod: "circle", layer: "ax", type: "几何综合",
      stem: "$AB$ 是 $\odot O$ 的直径，$C$ 为圆上一点，$CD\\perp AB$ 于 $D$，$CF$ 平分 $\angle ACD$ 交 $AD$ 于 $F$。求证：$AC^2=AF\\cdot AB$。",
      hint: "方向提示：结论形如 $AC^2=AF\\cdot AB$，优先想相似——找哪两个三角形相似？其中 $AB$ 是直径可得一个直角，别浪费。",
      solution: ["$AB$ 为直径 $\Rightarrow\angle ACB=90^\circ$；$CD\\perp AB\Rightarrow\angle ADC=90^\circ$", "证 $\triangle ACF\\sim\triangle ABC$：$\angle CAF=\angle BAC$（公共），且 $\angle ACF=\angle ABC$（$CF$ 平分 $\angle ACD$，$\angle ACD=\angle ABC$ 同弧 $AD$）", "由相似 $\dfrac{AC}{AB}=\dfrac{AF}{AC}\Rightarrow AC^2=AF\\cdot AB$"],
      answer: "AC²=AF·AB（△ACF∽△ABC）",
      model: "直径直角 + 角平分线转移角 + 母子相似", pitfalls: ["角平分线带来的角相等没搭桥到同弧圆周角"], variants: [
        { stem: "若去掉 $CF$ 平分线，改为 $\angle ACF=\angle ABC$ 直接给定，结论是否仍可证？", answer: "可证，且相似条件更直接" }
      ] },
    { id: "q-cir-2", mod: "circle", layer: "mid", type: "新定义",
      stem: "圆内接四边形 $ABCD$ 中，$\angle A=70^\circ$，$\angle C$ 的邻补角为 ______（若把 $CD$ 延长，$\angle CDE=$ ______）。",
      hint: "方向提示：圆内接四边形对角互补是基本性质；延长一边后用外角等于内对角，注意问的是哪个角、几解？",
      solution: ["圆内接四边形 $\angle A+\angle C=180^\circ\Rightarrow\angle C=110^\circ$", "$\angle CDE$ 为 $\angle C$ 的外角 $=\angle A=70^\circ$（内对角）"],
      answer: "110°, 70°",
      model: "圆内接四边形性质", pitfalls: ["对角/外角混淆"], variants: [] },

    // ===== 相似 =====
    { id: "q-sim-1", mod: "similar", layer: "ax", type: "几何综合",
      stem: "在 $\triangle ABC$ 中，$D$ 在 $AB$ 上，$E$ 在 $AC$ 上，$DE$ 与 $BC$ 不平行。若 $\triangle ADE$ 与 $\triangle ACB$ 相似，求所有可能的对应关系，并写出相应比例式。",
      hint: "方向提示：题干没说对应点——$\angle A$ 公共，但 $D,E$ 分别对 $AB,AC$ 还是 $AC,AB$？分类讨论是本题唯一得分关键。",
      solution: ["情形一：$\triangle ADE\\sim\triangle ACB$，$\dfrac{AD}{AC}=\dfrac{AE}{AB}=\dfrac{DE}{CB$", "情形二：$\triangle ADE\\sim\triangle ABC$，$\dfrac{AD}{AB}=\dfrac{AE}{AC}=\dfrac{DE}{BC}$（此时 $DE\\parallel BC$，与题设不平行矛盾，舍去）", "故有效对应为情形一（注意排除平行解）"],
      answer: "△ADE∽△ACB（唯一有效解）",
      model: "共角相似·分类讨论", pitfalls: ["未检验'DE不平行'的隐含排除"], variants: [
        { stem: "若删去“$DE$ 与 $BC$ 不平行”，答案变几种？", answer: "2种" }
      ] },
    { id: "q-sim-2", mod: "similar", layer: "mid", type: "填空压轴",
      stem: "如图，$\angle ACB=90^\circ$，$CD\\perp AB$ 于 $D$，$AD=4$，$BD=9$，则 $CD=$______，$AC=$______。",
      hint: "方向提示：射影定理/母子相似的直接应用，但请你把相似过程写完整以拿步骤分。",
      solution: ["母子相似：$CD^2=AD\\cdot BD=36\Rightarrow CD=6$", "$AC^2=AD\\cdot AB=4\\times13=52\Rightarrow AC=2\\sqrt{13}$"],
      answer: "6, 2√13",
      model: "射影定理(母子相似)", pitfalls: ["开方后漏负根判断"], variants: [] },

    // ===== 三角函数 =====
    { id: "q-trig-1", mod: "trig", layer: "ax", type: "几何综合",
      stem: "如图，$AB$ 垂直于地面，$D$ 在 $AB$ 延长线上，$CD$ 为斜坡，$\angle CDB=30^\circ$，在 $A$ 测得 $C$ 仰角 $60^\circ$，$AB=30$ m，$BC$ 水平。求 $CD$ 长（结果保留根号）。",
      hint: "方向提示：把 $30^\circ$、$60^\circ$ 放进两个直角三角形里，用“水平距离相等”列方程，别分别硬算边长。",
      solution: ["设 $BD=x$，在 $Rt\triangle BCD$ 中 $CD=2x,\;BC=\\sqrt3x$", "在 $A$ 处仰角 $60^\circ$：$\tan60^\circ=\dfrac{AC\text{竖直}}{BC}=\dfrac{30+h}{BC}$……（按图列式）综合得 $CD=40\\sqrt3$ m"],
      answer: "40√3 m",
      model: "双直角三角形+公共水平边列方程", pitfalls: ["仰角对应边找错"], variants: [] },
    { id: "q-trig-2", mod: "trig", layer: "mid", type: "新定义",
      stem: "在 $\triangle ABC$ 中，$\sin A=\dfrac35$，$AB=5$，$AC=4$，则 $BC=$______。",
      hint: "方向提示：已知两边及其中一边的对角——SSA 可能几解？先用正弦/高线判断钝角锐角，别只算一个。",
      solution: ["作 $BD\\perp AC$，$BD=AB\\sin A=3$，$AD=AB\\cos A$，$\cos A=\\pm\\frac45$", "$\cos A=\frac45\Rightarrow BC=\\sqrt{(4-\\frac{25}{4})^2+3^2}$ 类讨论；关键在 $A$ 可锐可钝", "$\cos A=-\\frac45\Rightarrow BC=\\sqrt{(4+\\frac{25}{4})^2+3^2}$…… 故两解：$\\sqrt{10}$ 或 $\\sqrt{85}$"],
      answer: "√10 或 √85（两解）",
      model: "SSA 两解讨论", pitfalls: ["漏钝角解"], variants: [
        { stem: "把 $AC$ 改为 $6$，还两解吗？", answer: "需重算Δ与高，通常变一解" }
      ] },

    // ===== 二次函数 =====
    { id: "q-qf-1", mod: "quadfunc", layer: "ax", type: "二次函数压轴",
      stem: "抛物线 $y=-x^2+2x+3$ 与 $x$ 轴交于 $A,B$，与 $y$ 轴交于 $C$。点 $P$ 在抛物线上且在 $A,B$ 之间运动，是否存在点 $P$ 使 $\triangle PBC$ 面积最大？若存在，求 $P$ 坐标并说明理由。",
      hint: "方向提示：把 $\triangle PBC$ 以 $BC$ 为底不方便——换成“铅垂高 × 水平宽”模型，设 $P(t,\,-t^2+2t+3)$，用 $t$ 表示面积再求顶点。",
      solution: ["$A(-1,0),\;B(3,0),\;C(0,3)$，直线 $BC: y=-x+3$", "设 $P(t,-t^2+2t+3)$，铅垂高 $h=(-t^2+2t+3)-(-t+3)=-t^2+3t$，$S=\frac12\\cdot|AB|\cdot h$ 按水平宽公式 $S=\frac12\\cdot3\\cdot(-t^2+3t)$（以 $x=0..3$ 为水平宽）", "$S=-\\frac32(t^2-3t)$ 在 $t=\\frac32$ 最大，$P(\\frac32,\\frac{15}{4})$"],
      answer: "P(3/2, 15/4)",
      model: "铅垂高法求三角形面积最值", pitfalls: ["动点范围 0<t<3 未标"], variants: [
        { stem: "若 $P$ 在抛物线 $A,B$ 之外运动，面积是否还有最大值？", answer: "开口向下且x→±∞时y→-∞，面积无上界，需限定范围" }
      ] },
    { id: "q-qf-2", mod: "quadfunc", layer: "mid", type: "填空压轴",
      stem: "抛物线 $y=ax^2+bx+c$ 经过 $(-1,0)$、$(3,0)$，且与 $y$ 轴交点在 $x$ 轴下方，对称轴为 $x=1$，则 $abc$ 的符号为 ______，$2a+b=$______。",
      hint: "方向提示：两根已知可写交点式，$c$ 的符号看 $x=0$ 时的函数值；$2a+b$ 联想对称轴公式 $-\\frac{b}{2a}=1$。",
      solution: ["$y=a(x+1)(x-3)$，$x=0$ 时 $y=-3a<0\\Rightarrow a>0$", "$b=-2a<0$，$c=-3a<0$，故 $abc>0$（正·负·负）", "对称轴 $x=-\\frac{b}{2a}=1\\Rightarrow b=-2a\\Rightarrow 2a+b=0$"],
      answer: "正(>0), 0",
      model: "系数符号判断+对称轴", pitfalls: ["a>0 与开口方向弄反"], variants: [] },

    // ===== 统计概率 =====
    { id: "q-stat-1", mod: "stat", layer: "mid", type: "新定义",
      stem: "某组数据 $2,3,3,4,x$ 的众数与中位数相同，则 $x=$______。",
      hint: "方向提示：众数可能由 $3$ 或 $x$ 产生，中位数随 $x$ 落位变化——按 $x$ 与已有数的大小分段讨论。",
      solution: ["若 $x=3$：众数 $3$，排序 $2,3,3,3,4$ 中位数 $3$ ✓", "若 $x=2$：众数 $3$（两个），中位数 $3$ ✓ 也成立？排序 $2,2,3,3,4$ 中位数 $3$ ✓", "若 $x>3$ 或 $2<x<3$ 逐一验证，得 $x=2$ 或 $3$"],
      answer: "2 或 3",
      model: "众数/中位数分段讨论", pitfalls: ["漏 $x=2$ 的解"], variants: [] },
    { id: "q-stat-2", mod: "stat", layer: "mid", type: "新定义",
      stem: "从 $1,2,3,4$ 中任取两数（不放回），其和为偶数的概率是 ______。",
      hint: "方向提示：和为偶数要求两数同奇偶——奇奇、偶偶两类，别用列举时数错总数。",
      solution: ["总数 $C_4^2=6$；同奇（1,3）、同偶（2,4）共 $2$ 种", "$P=\\frac26=\\frac13$"],
      answer: "1/3",
      model: "古典概型·分类计数", pitfalls: ["分母用排列数"], variants: [] },

    // ===== 新定义/压轴 =====
    { id: "q-new-1", mod: "newdef", layer: "ax", type: "新定义",
      stem: "【新定义】若抛物线上存在点 $P$，使 $P$ 到 $y$ 轴距离等于 $P$ 到点 $(0,1)$ 的距离，则称 $P$ 为“平衡点”。已知 $y=x^2$，判断 $(0,0)$ 是否为平衡点，并求所有平衡点。",
      hint: "方向提示：按定义把几何条件翻译成方程——到 $y$ 轴距离是 $|x|$，到 $(0,1)$ 距离用两点式，联立 $y=x^2$ 求解，注意 $x$ 可正可负的对称性。",
      solution: ["$(0,0)$：到 $y$ 轴距 $0$，到 $(0,1)$ 距 $1$，$0\\ne1$，不是", "设 $P(x,x^2)$：$|x|=\\sqrt{x^2+(x^2-1)^2}$，平方化简 $x^2=x^2+(x^2-1)^2$ 的等价变形 → $(x^2-1)^2=0$ 且处理绝对值", "得 $x^2=1$ 时…… $x=\\pm1$？代回验证 $P(1,1)$：左 $|1|=1$，右 $\sqrt{1+0}=1$ ✓；$P(-1,1)$ ✓", "还有 $x=0$ 已排除。平衡点为 $(1,1),(-1,1)$"],
      answer: "(1,1) 和 (-1,1)；(0,0) 不是",
      model: "新定义翻译+方程+对称多解", pitfalls: ["漏负根；未验证"], variants: [
        { stem: "把定义中 $(0,1)$ 改为 $(0,2)$，平衡点有几个？", answer: "重新联立讨论，可能0或1个" }
      ] },
    { id: "q-new-2", mod: "newdef", layer: "ax", type: "填空压轴",
      stem: "在平面直角坐标系中，点 $A(0,2)$，点 $B$ 在 $x$ 轴上运动，以 $AB$ 为边作正方形 $ABCD$（$A,B,C,D$ 顺时针），则 $C$ 点轨迹方程为 ______。",
      hint: "方向提示：$B$ 只有 1 个自由度，用旋转/全等把 $C$ 用 $B$ 的坐标表示，消参数得轨迹；注意正方形朝向是否导致两支。",
      solution: ["设 $B(t,0)$，向量 $\overrightarrow{AB}=(t,-2)$，顺时针旋转 $90^\circ$ 得 $\overrightarrow{BC}=( -2, -t)$ 类推", "$C=B+(-2,-t)=(t-2,-t)$，设 $x=t-2,\;y=-t\\Rightarrow y=-(x+2)$", "由 $t\\in\\mathbb R$，轨迹为直线 $y=-x-2$（若另一朝向则另一条）"],
      answer: "y=-x-2（按顺时针定向）",
      model: "动点轨迹·参数消元", pitfalls: ["正方形定向导致漏一支"], variants: [] }
  ],

  // 变式自动生成的附加设问模板（大题做完追加条件）
  extensionQuestions: [
    "改变题干某个条件，会新增哪些情况？请分类写出。",
    "若把结论中的“相等”改为“成比例”，结论是否仍成立？",
    "把图形从特殊位置推广到一般位置，证明思路哪里要改写？",
    "若引入动点并限定范围，最值/存在性结论如何变化？"
  ],

  // 复习节奏（艾宾浩斯，单位：小时后回看）
  reviewIntervals: [1, 24, 72, 168, 336],

  // 学情报告模板
  reportTemplate: {
    sections: ["得分情况", "失分模块统计", "失分类型统计", "下一阶段专题突破任务"]
  }
};