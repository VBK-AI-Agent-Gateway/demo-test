// 零压语言课 题库（日语 / 英语，零基础）
// 题型: pick=选择题  listen=听力选择  fill=选词填空  tran=翻译练习
// furigana: 汉字假名标注；kana: 假名题
window.BDATA = {
  ja: [
    { id: "ja-kana1", title: "平假名入门（あ～の）", desc: "认读 あ行～な行", items: [
      { t: "pick", q: "这个假名怎么读？", show: "あ", opts: ["a", "i", "u", "e"], a: 0, exp: "あ = a", key: "あ" },
      { t: "pick", q: "哪个是读作 i 的假名？", opts: ["い", "う", "え", "お"], a: 0, exp: "い = i", key: "い" },
      { t: "pick", q: "「う」的读音是？", show: "う", opts: ["u", "a", "o", "e"], a: 0, exp: "う = u", key: "う" },
      { t: "pick", q: "哪个假名读 o？", opts: ["お", "あ", "か", "を"], a: 0, exp: "お = o", key: "お" },
      { t: "listen", say: "か", q: "听音选假名", opts: ["か", "き", "く", "さ"], a: 0, exp: "か = ka", key: "か" },
      { t: "pick", q: "「な」的读音是？", show: "な", opts: ["na", "ha", "ma", "ya"], a: 0, exp: "な = na", key: "な" }
    ]},
    { id: "ja-kana2", title: "平假名（は～ん）", desc: "认读 は行～ん", items: [
      { t: "pick", q: "「は」的读音是？", show: "は", opts: ["ha/wa", "ba", "pa", "fa"], a: 0, exp: "は 作助词时读 wa，否则读 ha", key: "は" },
      { t: "pick", q: "哪个假名读 ma？", opts: ["ま", "み", "む", "め"], a: 0, exp: "ま = ma", key: "ま" },
      { t: "pick", q: "「や」的读音是？", show: "や", opts: ["ya", "yu", "yo", "ra"], a: 0, exp: "や = ya", key: "や" },
      { t: "pick", q: "哪个读 ra 行？", opts: ["ら", "た", "な", "わ"], a: 0, exp: "ら = ra", key: "ら" },
      { t: "listen", say: "ん", q: "听音选假名", opts: ["ん", "み", "り", "し"], a: 0, exp: "ん = n", key: "ん" },
      { t: "pick", q: "「を」读音是？（现代只作助词）", show: "を", opts: ["o/wo", "ko", "no", "ho"], a: 0, exp: "を = o（发音同 お）", key: "を" }
    ]},
    { id: "ja-katakana", title: "片假名入门", desc: "认读外来语用片假名", items: [
      { t: "pick", q: "「ア」的读音是？", show: "ア", opts: ["a", "i", "u", "e"], a: 0, exp: "ア = a（片假名）", key: "ア" },
      { t: "pick", q: "哪个是片假名的 ko？", opts: ["コ", "サ", "タ", "ナ"], a: 0, exp: "コ = ko", key: "コ" },
      { t: "pick", q: "「シ」的读音是？", show: "シ", opts: ["shi", "chi", "tsu", "fu"], a: 0, exp: "シ = shi", key: "シ" },
      { t: "listen", say: "コーヒー", q: "听音选意思（外来语）", opts: ["咖啡", "茶", "牛奶", "果汁"], a: 0, exp: "コーヒー = coffee 来自英语", key: "コーヒー" },
      { t: "pick", q: "「テ」的读音是？", show: "テ", opts: ["te", "to", "ta", "da"], a: 0, exp: "テ = te", key: "テ" },
      { t: "pick", q: "片假名「ナ」对应平假名？", opts: ["な", "た", "は", "ま"], a: 0, exp: "ナ = な（na）", key: "ナ" }
    ]},
    { id: "ja-word1", title: "基础单词（日常）", desc: "高频名词+振假名", items: [
      { t: "pick", q: "「水（みず）」是什么意思？", show: "水", ruby: "みず", opts: ["水", "火", "土", "空"], a: 0, exp: "みず = 水", key: "水" },
      { t: "pick", q: "「猫（ねこ）」是什么意思？", show: "猫", ruby: "ねこ", opts: ["猫", "狗", "鸟", "鱼"], a: 0, exp: "ねこ = 猫", key: "猫" },
      { t: "listen", say: "いぬ", q: "听音选词", opts: ["狗", "猫", "马", "牛"], a: 0, exp: "いぬ = 犬（狗）", key: "いぬ" },
      { t: "pick", q: "「本（ほん）」是什么意思？", show: "本", ruby: "ほん", opts: ["书", "笔", "纸", "桌子"], a: 0, exp: "ほん = 书", key: "本" },
      { t: "pick", q: "「山（やま）」是什么意思？", show: "山", ruby: "やま", opts: ["山", "川", "海", "桥"], a: 0, exp: "やま = 山", key: "山" },
      { t: "tran", q: "把「ありがとう」译成中文", opts: ["谢谢", "对不起", "再见", "你好"], a: 0, exp: "arigatou = 谢谢", key: "ありがとう" }
    ]},
    { id: "ja-phrase", title: "基础短句", desc: "会开口的第一批句子", items: [
      { t: "pick", q: "「おはよう」的意思是？", show: "おはよう", opts: ["早上好", "晚安", "谢谢", "再见"], a: 0, exp: "ohayou = 早上好", key: "おはよう" },
      { t: "fill", q: "选词填空：わたし＿ がくせいです。（我是学生）", opts: ["は", "を", "に", "で"], a: 0, exp: "「は」提示主题", key: "わたしはがくせいです", sent: "わたし ▢ がくせいです" },
      { t: "tran", q: "「こんにちは」译成中文", opts: ["你好", "早上好", "谢谢", "晚安"], a: 0, exp: "konnichiwa = 你好（白天）", key: "こんにちは" },
      { t: "listen", say: "さようなら", q: "听音选意思", opts: ["再见", "你好", "谢谢", "对不起"], a: 0, exp: "sayounara = 再见", key: "さようなら" },
      { t: "fill", q: "选词填空：これ＿ ほんです。（这是书）", opts: ["は", "が", "を", "も"], a: 0, exp: "「は」提示主题", key: "これはほんです", sent: "これ ▢ ほんです" },
      { t: "pick", q: "「すみません」的意思是？", show: "すみません", opts: ["对不起/打扰了", "谢谢", "你好", "再见"], a: 0, exp: "sumimasen = 对不起/劳驾", key: "すみません" }
    ]},
    { id: "ja-furigana", title: "汉字+假名标注", desc: "看汉字读假名", items: [
      { t: "pick", q: "「学生」的假名标注是？", show: "学生", opts: ["がくせい", "がくしゃ", "がくもん", "せいがく"], a: 0, exp: "学生 = がくせい", key: "学生" },
      { t: "pick", q: "「先生」的读音是？", show: "先生", opts: ["せんせい", "せんしゃ", "しんせい", "せいせん"], a: 0, exp: "先生 = せんせい（老师）", key: "先生" },
      { t: "pick", q: "「日本」的假名是？", show: "日本", opts: ["にほん", "にっぽん", "にばん", "にほう"], a: 0, exp: "日本 = にほん", key: "日本" },
      { t: "tran", q: "「きょうは はれです」译成中文", opts: ["今天天气晴", "今天下雨", "昨天很冷", "明天有课"], a: 0, exp: "kyou wa hare desu = 今天晴天", key: "きょうははれです" },
      { t: "pick", q: "「食べる」的假名标注？", show: "食べる", opts: ["たべる", "くうる", "のむる", "みるる"], a: 0, exp: "食べる = たべる（吃）", key: "食べる" },
      { t: "pick", q: "「飲む」怎么读？", show: "飲む", opts: ["のむ", "たべる", "はなす", "きく"], a: 0, exp: "飲む = のむ（喝）", key: "飲む" }
    ]}
  ],
  en: [
    { id: "en-alp", title: "字母与发音", desc: "26 个字母起步", items: [
      { t: "pick", q: "哪个是元音字母？", opts: ["a", "b", "c", "d"], a: 0, exp: "a e i o u 是元音", key: "a" },
      { t: "listen", say: "A B C", q: "听音选字母", opts: ["ABC", "BCD", "ACD", "ABD"], a: 0, exp: "听到 A B C", key: "abc" },
      { t: "pick", q: "“apple” 中 a 的发音？", opts: ["æ（苹果音）", "e", "i", "o"], a: 0, exp: "apple /ˈæpl/", key: "apple" },
      { t: "pick", q: "“egg” 的首字母是？", opts: ["e", "a", "i", "u"], a: 0, exp: "egg 鸡蛋", key: "egg" },
      { t: "pick", q: "哪个字母读 /siː/？", opts: ["C", "S", "X", "Z"], a: 0, exp: "C 也读 see", key: "c" },
      { t: "listen", say: "D E F", q: "听音选字母", opts: ["DEF", "EFG", "CDF", "DEA"], a: 0, exp: "听到 D E F", key: "def" }
    ]},
    { id: "en-word1", title: "基础单词（日常）", desc: "高频名词", items: [
      { t: "pick", q: "“water” 是什么意思？", show: "water", opts: ["水", "火", "风", "土"], a: 0, exp: "water = 水", key: "water" },
      { t: "listen", say: "cat", q: "听音选词", opts: ["猫", "帽子", "小汽车", "蛋糕"], a: 0, exp: "cat = 猫", key: "cat" },
      { t: "pick", q: "“book” 是什么意思？", show: "book", opts: ["书", "笔", "包", "纸"], a: 0, exp: "book = 书", key: "book" },
      { t: "pick", q: "“friend” 是什么意思？", show: "friend", opts: ["朋友", "家人", "老师", "同学"], a: 0, exp: "friend = 朋友", key: "friend" },
      { t: "listen", say: "school", q: "听音选词", opts: ["学校", "医院", "商店", "公园"], a: 0, exp: "school = 学校", key: "school" },
      { t: "tran", q: "“谢谢” 用英语怎么说？", opts: ["thank you", "sorry", "hello", "goodbye"], a: 0, exp: "thank you = 谢谢", key: "thankyou" }
    ]},
    { id: "en-word2", title: "基础动词", desc: "最常用的动词", items: [
      { t: "pick", q: "“run” 是什么意思？", show: "run", opts: ["跑", "走", "跳", "坐"], a: 0, exp: "run = 跑", key: "run" },
      { t: "pick", q: "“eat” 是什么意思？", show: "eat", opts: ["吃", "喝", "睡", "玩"], a: 0, exp: "eat = 吃", key: "eat" },
      { t: "listen", say: "sleep", q: "听音选意思", opts: ["睡觉", "跑步", "说话", "写字"], a: 0, exp: "sleep = 睡觉", key: "sleep" },
      { t: "pick", q: "“read” 是什么意思？", show: "read", opts: ["读", "写", "说", "听"], a: 0, exp: "read = 读", key: "read" },
      { t: "pick", q: "“write” 是什么意思？", show: "write", opts: ["写", "画", "想", "唱"], a: 0, exp: "write = 写", key: "write" },
      { t: "tran", q: "“我喜欢猫” 英语怎么说？", opts: ["I like cats", "I like dogs", "I eat cats", "I see cats"], a: 0, exp: "I like cats", key: "iliketcats" }
    ]},
    { id: "en-fill", title: "选词填空", desc: "be 动词与冠词", items: [
      { t: "fill", q: "选词填空：I ＿ a student.", opts: ["am", "is", "are", "be"], a: 0, exp: "I am", key: "iamastudent", sent: "I ▢ a student" },
      { t: "fill", q: "选词填空：She ＿ happy.", opts: ["is", "am", "are", "be"], a: 0, exp: "She is", key: "sheishappy", sent: "She ▢ happy" },
      { t: "fill", q: "选词填空：They ＿ friends.", opts: ["are", "is", "am", "be"], a: 0, exp: "They are", key: "theyarefriends", sent: "They ▢ friends" },
      { t: "fill", q: "选冠词：＿ apple", opts: ["An", "A", "The", "—"], a: 0, exp: "元音音素前用 an", key: "anapple", sent: "▢ apple" },
      { t: "fill", q: "选冠词：＿ book", opts: ["A", "An", "The", "—"], a: 0, exp: "辅音音素前用 a", key: "abook", sent: "▢ book" },
      { t: "fill", q: "选词填空：We ＿ dinner at 7.", opts: ["eat", "eats", "eating", "ate"], a: 0, exp: "一般现在时原形", key: "weedinner", sent: "We ▢ dinner at 7" }
    ]},
    { id: "en-phrase", title: "基础短句", desc: "开口第一批句子", items: [
      { t: "pick", q: "“Good morning” 是什么意思？", show: "Good morning", opts: ["早上好", "晚安", "下午好", "再见"], a: 0, exp: "Good morning = 早上好", key: "goodmorning" },
      { t: "tran", q: "“晚安” 英语怎么说？", opts: ["good night", "good evening", "good day", "good luck"], a: 0, exp: "good night = 晚安", key: "goodnight" },
      { t: "listen", say: "How are you", q: "听音选意思", opts: ["你好吗", "你是谁", "你在哪里", "你叫什么"], a: 0, exp: "How are you = 你好吗", key: "howareyou" },
      { t: "fill", q: "补全：Nice to ＿ you.", opts: ["meet", "see", "know", "talk"], a: 0, exp: "Nice to meet you 见到你很高兴", key: "nicetomeetyou", sent: "Nice to ▢ you" },
      { t: "tran", q: "“我去上学” 英语怎么说？", opts: ["I go to school", "I go home", "I am school", "I at school"], a: 0, exp: "I go to school", key: "igotoschool" },
      { t: "pick", q: "“Thank you” 的回应常用？", show: "Thank you", opts: ["You're welcome", "Goodbye", "Sorry", "Yes"], a: 0, exp: "You're welcome = 不客气", key: "yourewelcome" }
    ]},
    { id: "en-listen", title: "听力选择题", desc: "听音辨词辨句", items: [
      { t: "listen", say: "dog", q: "听音选词", opts: ["狗", "猫", "猪", "牛"], a: 0, exp: "dog = 狗", key: "dog" },
      { t: "listen", say: "bird", q: "听音选词", opts: ["鸟", "蜜蜂", "鱼", "虫"], a: 0, exp: "bird = 鸟", key: "bird" },
      { t: "listen", say: "milk", q: "听音选词", opts: ["牛奶", "水", "果汁", "茶"], a: 0, exp: "milk = 牛奶", key: "milk" },
      { t: "listen", say: "I like apples", q: "听音选意思", opts: ["我喜欢苹果", "我讨厌苹果", "我有一个苹果", "这是苹果"], a: 0, exp: "I like apples = 我喜欢苹果", key: "ilikapples" },
      { t: "listen", say: "open the door", q: "听音选意思", opts: ["开门", "关门", "擦门", "锁门"], a: 0, exp: "open the door = 开门", key: "openthedoor" },
      { t: "listen", say: "she is reading", q: "听音选意思", opts: ["她正在读书", "她在写字", "她在睡觉", "她在跑步"], a: 0, exp: "she is reading = 她正在读书", key: "shereading" }
    ]}
  ]
};