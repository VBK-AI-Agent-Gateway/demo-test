// ===== 数据层 =====
window.DATA = {
  TOPICS: ["机械运动","声现象","光的折射","凸透镜成像","物态变化","质量与密度","力与运动","压强","浮力","功和机械能","简单机械","内能与热量","电流和电路","欧姆定律","电功率","电与磁","信息的传递","能源与可持续发展"],
  KNOWLEDGE: [
    {name:"机械运动",content:"位置随时间变化",formula:"v=s/t",unit:"m/s",example:"汽车行驶"},
    {name:"声现象",content:"声音由振动产生",formula:"v=340m/s",unit:"m/s",example:"回声测距"},
    {name:"光的折射",content:"光从一种介质斜射入另一种介质",formula:"n=sin i/sin r",unit:"—",example:"筷子弯折"},
    {name:"凸透镜成像",content:"物距与像距关系",formula:"1/f=1/u+1/v",unit:"—",example:"放大镜"},
    {name:"物态变化",content:"物质三态及其转化",formula:"Q=cmΔt",unit:"J",example:"水结冰"},
    {name:"质量与密度",content:"物体所含物质的多少",formula:"ρ=m/V",unit:"kg/m³",example:"鉴别真假"},
    {name:"力与运动",content:"力是改变物体运动状态的原因",formula:"F=ma",unit:"N",example:"刹车"},
    {name:"压强",content:"单位面积上受到的压力",formula:"p=F/S",unit:"Pa",example:"图钉尖"},
    {name:"浮力",content:"浸在液体中的物体受到向上的力",formula:"F浮=ρ液gV排",unit:"N",example:"轮船浮水"},
    {name:"功和机械能",content:"功等于力与距离的乘积",formula:"W=Fs",unit:"J",example:"举高物体"},
    {name:"简单机械",content:"杠杆、滑轮等省力机械",formula:"F1L1=F2L2",unit:"N",example:"开瓶器"},
    {name:"内能与热量",content:"物体内部所有分子热运动的动能与分子势能的总和",formula:"Q=cmΔt",unit:"J",example:"烧水"},
    {name:"电流和电路",content:"电荷的定向移动形成电流",formula:"I=U/R",unit:"A",example:"手电筒"},
    {name:"欧姆定律",content:"导体中的电流与电压成正比",formula:"I=U/R",unit:"A",example:"调光灯"},
    {name:"电功率",content:"电流在单位时间内所做的功",formula:"P=UI",unit:"W",example:"电热水壶"},
    {name:"电与磁",content:"电流周围存在磁场",formula:"F=BIL",unit:"N",example:"电动机"},
    {name:"信息的传递",content:"电磁波传递信息",formula:"c=λf",unit:"m/s",example:"手机通信"},
    {name:"能源与可持续发展",content:"能源分类与合理利用",formula:"η=W有/W总",unit:"—",example:"太阳能"}
  ],
  MATERIAL_TYPES: [
    {id:"story",name:"课堂导入故事",icon:"📖",page:"第2页",desc:"100-300字生活化场景导入"},
    {id:"demo",name:"科学趣味演示",icon:"🧪",page:"第4页",desc:"安全小实验，器材/步骤/现象/原理"},
    {id:"history",name:"物理学史小故事",icon:"📜",page:"第5页",desc:"真实史料，突出探究过程"},
    {id:"board",name:"板书文字（精简版）",icon:"✒️",page:"第8页",desc:"黑板手写版，分条目"},
    {id:"mind",name:"思维导图框架",icon:"🧠",page:"第9页",desc:"Markdown大纲，关键词"},
    {id:"chain",name:"课堂讨论问题链",icon:"🔗",page:"第6页",desc:"递进式问题，由浅入深"},
    {id:"compress",name:"长文本精简压缩",icon:"📄",page:"第10页",desc:"初中生阅读难度摘要"}
  ],
  KINDS: ["新授课","复习课","实验课"],
  LEVELS: [
    {id:"学困生",name:"学困生",icon:"🌱",color:"#15803d"},
    {id:"中等生",name:"中等生",icon:"⚡",color:"#1d4ed8"},
    {id:"优等生",name:"优等生",icon:"🚀",color:"#6d28d9"}
  ],
  PLAN_PLACEHOLDER: "粘贴本节课教案或重难点（选填），素材将对齐；留空则基于课题生成通用素材",
  BANNER: "AI生成素材仅作教学辅助，使用前请教师审核科学性与课堂适配性；严格限定初中物理，不引入高中公式，杜绝伪科学与虚假物理学史。",
  PPT_NOTE: "本素材已标注PPT页建议，可直接复制到课件脚本系统生成PPT文案素材。",
  // ===== 提示词模板（后台可编辑，{topic}{kind}{level}{plan}{reference} 为占位符）=====
  DEFAULT_PROMPTS: [
    {id:"base",name:"通用素材生成",tpl:"你是初中物理教研助手。课题：{topic}；课型：{kind}；学情：{level}。教案要点：{plan}。参考资料：{reference}。仅用初中物理知识，禁止高中公式，史料必须真实，素材简洁实用。"},
    {id:"story",name:"课堂导入故事",tpl:"为课题「{topic}」写100-300字生活化课堂导入故事，面向{level}，贴合{kind}，结尾抛出核心问题。"},
    {id:"demo",name:"科学趣味演示",tpl:"为「{topic}」设计安全小实验：器材/步骤/现象/原理/提问，面向{level}，不超纲不危险。"},
    {id:"history",name:"物理学史",tpl:"讲一个与「{topic}」相关的真实物理学史故事，突出探究过程，史料必须真实，不编造。"},
    {id:"chain",name:"问题链",tpl:"为「{topic}」设计由浅入深递进问题链5问，面向{level}，对齐教案：{plan}。"}
  ],
  // ===== LLM 异常兜底文案 =====
  FALLBACK: {
    errTitle: "⚠️ 生成失败",
    errMsg: "AI 服务暂时不可用（超时/限流/返回异常）。素材未生成，请稍后重试。",
    retry: "🔄 重试生成",
    emptyMsg: "AI 返回内容为空，请调整课题或稍后重试。",
    offline: "检测到本地模板引擎可用，已切换到离线模板素材，可继续备课；联网后重试可获得更丰富内容。"
  }
};