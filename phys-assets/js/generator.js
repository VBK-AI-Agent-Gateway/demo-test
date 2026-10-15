// ===== 素材生成引擎（含提示词模板、参考材料注入、异常兜底） =====
const {KNOWLEDGE,MATERIAL_TYPES,FALLBACK} = window.DATA;
function getKnowledge(topic){ return KNOWLEDGE.find(k=>k.name===topic) || KNOWLEDGE[0]; }

function getPrompts(){
  try{ const p=JSON.parse(localStorage.getItem('pa_prompts')); if(Array.isArray(p)&&p.length) return p; }catch(e){}
  return window.DATA.DEFAULT_PROMPTS;
}
function renderPrompt(tpl,topic,kind,level,plan,reference){
  return (tpl||"").replace(/\{topic\}/g,topic).replace(/\{kind\}/g,kind)
    .replace(/\{level\}/g,level).replace(/\{plan\}/g,plan||"（无）")
    .replace(/\{reference\}/g,reference||"（无）");
}

function generateMaterials(topic,kind,level,selectedTypes,plan,reference){
  const kp = getKnowledge(topic);
  const results = [];
  try{
    if(!selectedTypes || selectedTypes.length===0) throw new Error(FALLBACK.emptyMsg);
    const prompts = getPrompts();
    selectedTypes.forEach(tid=>{
      const type = MATERIAL_TYPES.find(t=>t.id===tid);
      if(!type) return;
      const pt = prompts.find(p=>p.id===tid) || prompts[0];
      const prompt = renderPrompt(pt?pt.tpl:"", topic,kind,level,plan,reference);
      let content = "";
      switch(tid){
        case "story": content = genStory(topic,kp); break;
        case "demo": content = genDemo(topic,kp); break;
        case "history": content = genHistory(topic,kp); break;
        case "board": content = genBoard(topic,kp,kind,level); break;
        case "mind": content = genMind(topic,kp,level); break;
        case "chain": content = genChain(topic,kp,level,plan,reference); break;
        case "compress": content = genCompress(topic,kp,reference); break;
      }
      if(!content || !content.trim()) throw new Error(FALLBACK.emptyMsg);
      const pptPage = type.page;
      const pptNote = `【PPT页建议】${pptPage} · ${type.name} · 适合${level}学生`;
      results.push({id:tid,icon:type.icon,name:type.name,content,pptPage,pptNote,level,prompt});
    });
    const designIdea = `本素材设计思路：面向${kind}（${level}），紧扣${topic}知识点，适配教学环节导入/探究/巩固/应用，素材简洁实用不冗长，符合初三学生认知水平。`;
    const planAlign = plan ? `【教案对齐】已结合您提供的教案/重难点，素材内容与教学目标保持一致。` : `【教案提示】未提供教案，素材基于课题生成通用内容；如需对齐请粘贴教案。`;
    const refAlign = reference ? `【参考材料】已注入 ${reference.length} 字参考资料，素材已据此减少幻觉。` : "";
    return {ok:true,topic,kind,level,materials:results,designIdea,planAlign:planAlign+refAlign,banner:window.DATA.BANNER,pptNote:window.DATA.PPT_NOTE};
  }catch(e){
    // ===== LLM/引擎异常兜底 =====
    return {ok:false,error:e.message||FALLBACK.errMsg,topic,kind,level,materials:[],
      designIdea:"",planAlign:"",banner:window.DATA.BANNER,pptNote:window.DATA.PPT_NOTE};
  }
}

function genStory(topic,kp){
  const map = {
    "机械运动":"清晨小明坐公交车，看到路边树木飞快向后退。明明是树在动，怎么感觉自己在动？判断运动要看参照物。今天探究机械运动的奥秘。",
    "声现象":"上课铃响了，最后一排的小红听不清老师讲课。声音怎样从讲台传到她耳朵？原来空气是传播媒介。今天探究声现象规律。",
    "光的折射":"小明把筷子插入水中，看到筷子弯折了。拿出一看筷子完好。原来光从空气斜射入水中会折射。今天探究光的折射规律。",
    "凸透镜成像":"小华用放大镜看报纸字变大，拿远字又变小甚至倒立。原来凸透镜成像与物距有关。今天探究凸透镜成像规律。",
    "物态变化":"冬天戴眼镜进教室镜片起雾，夏天从冰箱拿饮料瓶壁出汗。这都与物态变化有关。今天探究物质三态转化规律。",
    "质量与密度":"小明怀疑金戒指是假的，放入水中沉浮与真金不同。原来不同物质密度不同。今天探究质量与密度知识。",
    "力与运动":"小红骑车下坡不蹬脚踏板车也能前进。什么维持了车的运动？原来力不是维持运动的原因。今天探究力与运动关系。",
    "压强":"小明用铅笔尖和笔尾压手指，笔尖更疼。原来受力面积越小压强越大。今天探究压强规律。",
    "浮力":"小明把木块按入水中，感觉有股力量向上推。原来浸在液体中的物体受浮力。今天探究浮力规律。",
    "功和机械能":"小红把书包从地上提到桌上，对书包做了功。做功多少与什么有关？今天探究功和机械能知识。",
    "简单机械":"小明用开瓶器开瓶盖感觉很省力。原来开瓶器是杠杆。今天探究简单机械原理。",
    "内能与热量":"小红搓手取暖感觉手变热。原来摩擦生热，机械能转化为内能。今天探究内能与热量知识。",
    "电流和电路":"小明的手电筒不亮了，检查发现灯泡坏了。原来电路必须闭合才能工作。今天探究电流和电路知识。",
    "欧姆定律":"小红调节台灯亮度，旋钮能改变灯的亮度。原来电阻可以改变电流大小。今天探究欧姆定律规律。",
    "电功率":"小明用电热水壶烧水，水很快烧开了。原来电热水壶电功率大做功快。今天探究电功率知识。",
    "电与磁":"小红发现通电导线旁的小磁针会偏转。原来电流周围存在磁场。今天探究电与磁的知识。",
    "信息的传递":"小明用手机打电话，声音通过电磁波传递。原来电磁波可在真空中传播。今天探究信息传递方式。",
    "能源与可持续发展":"小红知道煤石油是不可再生能源。如何合理利用能源？今天探究能源与可持续发展知识。"
  };
  return map[topic] || `${topic}是初中物理重要知识点，与生活密切相关。今天我们就来探究${topic}的规律。`;
}
function genDemo(topic,kp){
  const demos = {
    "机械运动":{器材:"刻度尺、秒表、小车",步骤:"1.测小车行驶距离 2.记录时间 3.算速度",现象:"不同距离速度不同",原理:"v=s/t",提问:"如何测平均速度？"},
    "声现象":{器材:"音叉、橡胶锤、水",步骤:"1.敲击音叉 2.音叉接触水面",现象:"音叉振动溅起水花",原理:"声音由振动产生",提问:"振动停止声音会怎样？"},
    "光的折射":{器材:"玻璃砖、激光笔、白纸",步骤:"1.光斜射入玻璃砖 2.观察折射光线",现象:"光线偏折",原理:"折射定律",提问:"垂直入射会怎样？"},
    "凸透镜成像":{器材:"凸透镜、蜡烛、光屏",步骤:"1.点燃蜡烛 2.移动光屏找清晰像",现象:"成倒立缩小实像",原理:"物距大于2倍焦距",提问:"物距变小像如何变化？"},
    "物态变化":{器材:"烧杯、水、冰块、温度计",步骤:"1.加热冰块 2.记录温度变化",现象:"冰熔化时温度不变",原理:"晶体熔化特点",提问:"熔化吸热还是放热？"},
    "质量与密度":{器材:"天平、量筒、水、石块",步骤:"1.测质量 2.测体积 3.算密度",现象:"石块密度大于水",原理:"ρ=m/V",提问:"如何测不规则固体密度？"},
    "力与运动":{器材:"小车、木板、毛巾",步骤:"1.小车从同一高度滑下 2.比较滑行距离",现象:"表面越光滑滑得越远",原理:"阻力越小运动越远",推理:"若无阻力将匀速直线运动"},
    "压强":{器材:"铅笔、海绵",步骤:"1.笔尖朝下压海绵 2.笔尾朝下压海绵",现象:"笔尖压痕更深",原理:"p=F/S",提问:"如何增大压强？"},
    "浮力":{器材:"弹簧测力计、石块、水桶、水",步骤:"1.测重力 2.浸入水中测拉力 3.求浮力",现象:"拉力减小",原理:"F浮=G-F拉",提问:"浮力与排开液体体积有何关系？"},
    "功和机械能":{器材:"弹簧测力计、钩码、刻度尺",步骤:"1.提升钩码 2.测量力和距离 3.算功",现象:"W=Fs",原理:"功的计算",提问:"额外功来自哪里？"},
    "简单机械":{器材:"杠杆、支架、钩码",步骤:"1.调节杠杆平衡 2.挂钩码 3.读力臂",现象:"杠杆平衡",原理:"F1L1=F2L2",提问:"如何判断省力杠杆？"},
    "内能与热量":{器材:"温度计、水、酒精灯",步骤:"1.测初温 2.加热 3.记录温度",现象:"温度升高",原理:"Q=cmΔt",提问:"比热容大的物质升温快还是慢？"},
    "电流和电路":{器材:"电池、小灯泡、导线、开关",步骤:"1.连接电路 2.闭合开关",现象:"灯泡发光",原理:"闭合电路",提问:"断路会怎样？"},
    "欧姆定律":{器材:"电源、电阻、电流表、电压表、滑动变阻器",步骤:"1.连接电路 2.调节滑片 3.记录数据",现象:"电流与电压成正比",原理:"I=U/R",提问:"电阻不变电压增大电流如何变化？"},
    "电功率":{器材:"电源、小灯泡、滑动变阻器、电压表、电流表",步骤:"1.连接电路 2.调节电压 3.测功率",现象:"灯泡亮度变化",原理:"P=UI",提问:"额定功率与实际功率有何区别？"},
    "电与磁":{器材:"电池、导线、小磁针",步骤:"1.导线放在磁针上方 2.通电",现象:"磁针偏转",原理:"电流磁效应",提问:"断开电源磁针会怎样？"},
    "信息的传递":{器材:"手机、收音机",步骤:"1.打开手机 2.收音机靠近手机",现象:"收音机发出杂音",原理:"电磁波干扰",提问:"电磁波如何传递信息？"},
    "能源与可持续发展":{器材:"太阳能电池板、小风扇",步骤:"1.太阳能电池板接风扇 2.照射阳光",现象:"风扇转动",原理:"太阳能转化",提问:"太阳能有何优缺点？"}
  };
  const d = demos[topic];
  if(!d) return `【演示】围绕${topic}设计安全小实验：${kp.example}场景，器材简单，观察现象，理解${kp.name}原理。`;
  let s = `【演示】${topic}趣味实验\n器材：${d.器材}\n步骤：${d.步骤}\n现象：${d.现象}\n原理：${d.原理}`;
  if(d.提问) s += `\n课堂提问：${d.提问}`;
  if(d.推理) s += `\n推理：${d.推理}`;
  return s;
}
function genHistory(topic,kp){
  const h = {
    "机械运动":"伽利略在比萨斜塔做落体实验，挑战亚里士多德权威，开创实验物理学先河。",
    "声现象":"17世纪伽利略测量了声音传播速度，为声学研究奠定基础。",
    "光的折射":"1621年斯涅尔发现光的折射定律，揭示光在介质界面的传播规律。",
    "凸透镜成像":"17世纪开普勒改进望远镜，深入研究凸透镜成像规律。",
    "物态变化":"18世纪布莱克区分了热量和温度概念，为热力学发展奠定基础。",
    "质量与密度":"1783年拉瓦锡通过精密实验测定水的密度，推动化学发展。",
    "力与运动":"牛顿在前人基础上总结三大运动定律，建立经典力学体系。",
    "压强":"1653年帕斯卡进行裂桶实验证明液体压强存在。",
    "浮力":"公元前3世纪阿基米德发现浮力原理，留下'尤里卡'佳话。",
    "功和机械能":"19世纪焦耳通过大量实验测定热功当量，奠定能量守恒定律。",
    "简单机械":"阿基米德研究杠杆原理，说出'给我一个支点可以撬动地球'名言。",
    "内能与热量":"18世纪瓦特改良蒸汽机，推动工业革命。",
    "电流和电路":"1800年伏打发明电池，为电学研究提供稳定电源。",
    "欧姆定律":"1827年欧姆通过实验发现电流与电压、电阻的关系。",
    "电功率":"19世纪焦耳精确测定电流热效应，为电功率研究奠定基础。",
    "电与磁":"1820年奥斯特发现电流磁效应，开启电磁学大门。",
    "信息的传递":"19世纪麦克斯韦预言电磁波存在，为无线通信奠定理论基础。",
    "能源与可持续发展":"20世纪爱因斯坦提出质能方程，揭示核能巨大潜力。"
  };
  return h[topic] || `${kp.name}的发展历程中，众多科学家通过实验和推理逐步揭示其规律。`;
}
function genBoard(topic,kp,kind,level){
  return `【板书设计】${topic}\n一、${kp.name}\n   定义：${kp.content}\n   公式：${kp.formula}\n   单位：${kp.unit}\n二、典型应用\n   ${kp.example}\n三、易错点\n   - 注意条件和单位\n   - 理解物理意义\n四、${kind}小结\n   ${level}重点掌握：${kp.name}的理解与应用`;
}
function genMind(topic,kp,level){
  return `【思维导图】${topic}\n├── ${kp.name}\n│   ├── 定义：${kp.content}\n│   ├── 公式：${kp.formula}\n│   └── 单位：${kp.unit}\n├── 应用\n│   └── ${kp.example}\n├── 易错点\n│   └── 条件、单位、物理意义\n└── 拓展\n    └── ${level}进阶思考`;
}
function genChain(topic,kp,level,plan,reference){
  let extra = "";
  if(plan) extra += `\n6. 教案对齐：结合教案要点「${plan.slice(0,60)}」追问。`;
  if(reference) extra += `\n7. 参考材料关联：依据上传教参片段设问。`;
  return `【问题链】${topic}（递进式）\n1. 基础：什么是${kp.name}？如何定义？\n2. 理解：${kp.formula}中各字母代表什么？\n3. 应用：生活中哪些现象与${topic}有关？\n4. 拓展：如果条件改变，结论会怎样？\n5. 评价：${level}如何评价这一规律的适用范围？${extra}`;
}
function genCompress(topic,kp,reference){
  let ref = reference ? `\n参考要点：${reference.slice(0,80)}…` : "";
  return `【阅读摘要】${topic}（初中生阅读难度）\n${kp.name}是${topic}的核心内容。\n定义：${kp.content}\n公式：${kp.formula}（单位：${kp.unit}）\n应用：${kp.example}\n要点：理解${kp.name}的物理意义，掌握${kp.formula}的应用条件。${ref}`;
}

window.GENERATOR = {generateMaterials,getKnowledge,getPrompts,renderPrompt};