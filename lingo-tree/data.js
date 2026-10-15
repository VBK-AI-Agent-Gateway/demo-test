// LingoTree 课程与题库（界面语言：中文；日语/英语为学习内容）
// read = 朗读文本（语音用），lang = 语音语言
window.DATA = {
  courses: [
    { id: "ja", name: "学日语", color: "#ff5b5b", icon: "🇯🇵" },
    { id: "en", name: "学英语", color: "#1cb0f6", icon: "🇬🇧" }
  ],
  units: {
    ja: [
      {
        id: "ja-hira", title: "假名入门", subtitle: "从零开始认读日语字母", color: "#ff5b5b",
        lessons: [
          { id: "ja-a", title: "五十音 あ行", icon: "あ", kind: "pick", lang: "ja", items: [
            { q: "“あ”怎么读？", read: "あ", opts: ["a", "i", "u", "e"], a: 0, tip: "あ 读作 a（啊）" },
            { q: "“い”怎么读？", read: "い", opts: ["a", "i", "o", "u"], a: 1, tip: "い 读作 i（衣）" },
            { q: "哪个假名读 a？", opts: ["う", "あ", "え", "お"], a: 1, tip: "a 对应 あ" },
            { q: "“う”怎么读？", read: "う", opts: ["u", "e", "a", "i"], a: 0, tip: "う 读作 u（乌）" },
            { q: "“え”怎么读？", read: "え", opts: ["e", "o", "u", "a"], a: 0, tip: "え 读作 e（诶）" }
          ]},
          { id: "ja-k", title: "五十音 か行", icon: "か", kind: "pick", lang: "ja", items: [
            { q: "“か”怎么读？", read: "か", opts: ["ka", "ki", "ku", "ke"], a: 0, tip: "か = ka（咔）" },
            { q: "“き”怎么读？", read: "き", opts: ["ki", "ka", "ku", "ko"], a: 0, tip: "き = ki（きい）" },
            { q: "哪个假名读 ku？", opts: ["け", "こ", "く", "か"], a: 2, tip: "く = ku（哭）" },
            { q: "“こ”怎么读？", read: "こ", opts: ["ko", "ke", "ka", "ki"], a: 0, tip: "こ = ko（抠）" },
            { q: "“け”怎么读？", read: "け", opts: ["ke", "ki", "ko", "ku"], a: 0, tip: "け = ke（开）" }
          ]},
          { id: "ja-match", title: "假名配对", icon: "🔗", kind: "match", lang: "ja", pairs: [
            ["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"], ["か", "ka"], ["き", "ki"], ["く", "ku"]
          ]},
          { id: "ja-dak", title: "浊音与半浊音", icon: "が", kind: "pick", lang: "ja", items: [
            { q: "“が”是哪个假名加浊点变来的？", read: "が", opts: ["か", "さ", "た", "は"], a: 0, tip: "か → が" },
            { q: "“ざ”是哪个假名加浊点变来的？", read: "ざ", opts: ["さ", "た", "が", "な"], a: 0, tip: "さ → ざ" },
            { q: "“だ”是哪个假名加浊点变来的？", read: "だ", opts: ["た", "な", "は", "だ"], a: 0, tip: "た → だ" },
            { q: "“ば”是哪个假名加浊点变来的？", read: "ば", opts: ["は", "た", "か", "な"], a: 0, tip: "は → ば" },
            { q: "“ぱ”是半浊音，来自哪个假名？", read: "ぱ", opts: ["は", "さ", "だ", "が"], a: 0, tip: "は → ぱ" }
          ]}
        ]
      },
      {
        id: "ja-word", title: "基础词汇", subtitle: "日常单词，跟读学日语", color: "#ff9600",
        lessons: [
          { id: "ja-w1", title: "自我介绍", icon: "👋", kind: "pick", lang: "ja", items: [
            { q: "“わたし”是什么意思？", read: "わたし", opts: ["我", "你", "他", "爱"], a: 0, tip: "watashi = 我" },
            { q: "“あなた”是什么意思？", read: "あなた", opts: ["你", "我", "谁", "那"], a: 0, tip: "anata = 你" },
            { q: "“ほんとう”是什么意思？", read: "ほんとう", opts: ["真的", "假的", "快的", "慢的"], a: 0, tip: "hontou = 真的" },
            { q: "“我是学生”日语怎么说？", read: "わたしはがくせいです", opts: ["わたしはがくせいです", "あなたはがくせいです", "がくせいはわたしです", "これはほんです"], a: 0, tip: "watashi wa gakusei desu" },
            { q: "“ありがとう”是什么意思？", read: "ありがとう", opts: ["谢谢", "对不起", "你好", "再见"], a: 0, tip: "arigatou = 谢谢" }
          ]},
          { id: "ja-w2", title: "食物", icon: "🍣", kind: "pick", lang: "ja", items: [
            { q: "“みず”是什么意思？", read: "みず", opts: ["水", "火", "木", "金"], a: 0, tip: "mizu = 水" },
            { q: "“さかな”是什么意思？", read: "さかな", opts: ["鱼", "肉", "米", "菜"], a: 0, tip: "sakana = 鱼" },
            { q: "“たべもの”是什么意思？", read: "たべもの", opts: ["食物", "饮料", "水果", "甜点"], a: 0, tip: "tabemono = 食物" },
            { q: "“吃”日语怎么说？", read: "たべる", opts: ["たべる", "のむ", "いく", "ねる"], a: 0, tip: "taberu = 吃" },
            { q: "“喝”日语怎么说？", read: "のむ", opts: ["のむ", "たべる", "かく", "きく"], a: 0, tip: "nomu = 喝" }
          ]},
          { id: "ja-sent", title: "简单句子", icon: "💬", kind: "build", lang: "ja", items: [
            { q: "拼出：我是学生", read: "わたしはがくせいです", words: ["わたし", "は", "がくせい", "です"], a: ["わたし", "は", "がくせい", "です"], tip: "watashi wa gakusei desu（我是学生）" },
            { q: "拼出：这是书", read: "これはほんです", words: ["これ", "は", "ほん", "です"], a: ["これ", "は", "ほん", "です"], tip: "kore wa hon desu（这是书）" },
            { q: "拼出：我喜欢猫", read: "わたしはねこがすきです", words: ["わたし", "は", "ねこ", "が", "すきです"], a: ["わたし", "は", "ねこ", "が", "すきです"], tip: "watashi wa neko ga suki desu（我喜欢猫）" },
            { q: "拼出：水是凉的", read: "みずはつめたいです", words: ["みず", "は", "つめたい", "です"], a: ["みず", "は", "つめたい", "です"], tip: "mizu wa tsumetai desu（水是凉的）" }
          ]}
        ]
      },
      {
        id: "ja-listen", title: "听力练习", subtitle: "听发音选意思", color: "#ce82ff",
        lessons: [
          { id: "ja-l1", title: "听音辨词", icon: "🎧", kind: "listen", lang: "ja", items: [
            { say: "ねこ", q: "听到的是哪个词？", opts: ["猫", "狗", "鸟", "鱼"], a: 0, tip: "neko = 猫" },
            { say: "いぬ", q: "听到的是哪个词？", opts: ["狗", "猫", "马", "牛"], a: 0, tip: "inu = 狗" },
            { say: "とり", q: "听到的是哪个词？", opts: ["鸟", "虫", "兔", "鼠"], a: 0, tip: "tori = 鸟" },
            { say: "さかな", q: "听到的是哪个词？", opts: ["鱼", "肉", "米", "蛋"], a: 0, tip: "sakana = 鱼" },
            { say: "みず", q: "听到的是哪个词？", opts: ["水", "茶", "奶", "汤"], a: 0, tip: "mizu = 水" }
          ]}
        ]
      }
    ],
    en: [
      {
        id: "en-alp", title: "字母发音", subtitle: "学会英语字母和读音", color: "#1cb0f6",
        lessons: [
          { id: "en-a1", title: "元音字母", icon: "🅰️", kind: "pick", lang: "en", items: [
            { q: "哪个是元音（vowel）？", opts: ["b", "a", "t", "s"], a: 1, tip: "a e i o u 是元音" },
            { q: "“apple”（苹果）怎么读？", read: "apple", opts: ["æ 开头", "e 开头", "i 开头", "o 开头"], a: 0, tip: "apple /ˈæpl/ 苹果" },
            { q: "“egg”（鸡蛋）怎么读？", read: "egg", opts: ["e 开头", "a 开头", "i 开头", "u 开头"], a: 0, tip: "egg /eɡ/ 鸡蛋" },
            { q: "哪个字母读 /iː/？", read: "E", opts: ["E", "A", "O", "U"], a: 0, tip: "E 读 /iː/" },
            { q: "“unit”（单元）首字母怎么读？", read: "unit", opts: ["juː 开头", "u 开头", "a 开头", "e 开头"], a: 0, tip: "unit /ˈjuːnɪt/" }
          ]},
          { id: "en-a2", title: "常见辅音", icon: "🅱️", kind: "pick", lang: "en", items: [
            { q: "“cat”（猫）中 c 的发音？", read: "cat", opts: ["/k/", "/s/", "/t/", "/g/"], a: 0, tip: "c 在 a 前读 /k/" },
            { q: "“sun”（太阳）中 s 的发音？", read: "sun", opts: ["/s/", "/z/", "/θ/", "/ʃ/"], a: 0, tip: "s 读 /s/" },
            { q: "“think”（想）中 th 的发音？", read: "think", opts: ["/θ/", "/t/", "/f/", "/s/"], a: 0, tip: "th 读 /θ/" },
            { q: "“dog”（狗）中 d 的发音？", read: "dog", opts: ["/d/", "/t/", "/b/", "/ɡ/"], a: 0, tip: "d 读 /d/" },
            { q: "“fish”（鱼）中 sh 的发音？", read: "fish", opts: ["/ʃ/", "/s/", "/tʃ/", "/ʒ/"], a: 0, tip: "sh 读 /ʃ/" }
          ]},
          { id: "en-match", title: "字母配对", icon: "🔗", kind: "match", lang: "en", pairs: [
            ["A", "apple"], ["B", "book"], ["C", "cat"], ["D", "dog"], ["E", "egg"], ["F", "fish"], ["G", "go"], ["H", "hat"]
          ]}
        ]
      },
      {
        id: "en-word", title: "基础词汇", subtitle: "常用单词，跟读学英语", color: "#58cc02",
        lessons: [
          { id: "en-w1", title: "日常名词", icon: "🍎", kind: "pick", lang: "en", items: [
            { q: "“water”是什么意思？", read: "water", opts: ["水", "火", "土", "风"], a: 0, tip: "water = 水" },
            { q: "“friend”是什么意思？", read: "friend", opts: ["朋友", "家人", "老师", "同学"], a: 0, tip: "friend = 朋友" },
            { q: "“house”是什么意思？", read: "house", opts: ["房子", "车", "学校", "商店"], a: 0, tip: "house = 房子" },
            { q: "“book”是什么意思？", read: "book", opts: ["书", "笔", "纸", "桌子"], a: 0, tip: "book = 书" },
            { q: "“school”是什么意思？", read: "school", opts: ["学校", "医院", "公园", "商店"], a: 0, tip: "school = 学校" }
          ]},
          { id: "en-w2", title: "常用动词", icon: "🏃", kind: "pick", lang: "en", items: [
            { q: "“run”是什么意思？", read: "run", opts: ["跑", "走", "跳", "游泳"], a: 0, tip: "run = 跑" },
            { q: "“eat”是什么意思？", read: "eat", opts: ["吃", "喝", "睡", "玩"], a: 0, tip: "eat = 吃" },
            { q: "“sleep”是什么意思？", read: "sleep", opts: ["睡觉", "坐", "站", "笑"], a: 0, tip: "sleep = 睡觉" },
            { q: "“read”是什么意思？", read: "read", opts: ["读", "写", "说", "听"], a: 0, tip: "read = 读" },
            { q: "“write”是什么意思？", read: "write", opts: ["写", "读", "画", "想"], a: 0, tip: "write = 写" }
          ]},
          { id: "en-sent", title: "拼句练习", icon: "🧱", kind: "build", lang: "en", items: [
            { q: "拼出：I am a student（我是学生）", read: "I am a student", words: ["I", "am", "a", "student"], a: ["I", "am", "a", "student"], tip: "I am a student" },
            { q: "拼出：She likes cats（她喜欢猫）", read: "She likes cats", words: ["She", "likes", "cats"], a: ["She", "likes", "cats"], tip: "She likes cats" },
            { q: "拼出：I go to school（我去上学）", read: "I go to school", words: ["I", "go", "to", "school"], a: ["I", "go", "to", "school"], tip: "I go to school" },
            { q: "拼出：We eat dinner（我们吃晚饭）", read: "We eat dinner", words: ["We", "eat", "dinner"], a: ["We", "eat", "dinner"], tip: "We eat dinner" }
          ]}
        ]
      },
      {
        id: "en-gram", title: "基础语法", subtitle: "be 动词与冠词", color: "#ff9600",
        lessons: [
          { id: "en-g1", title: "be 动词", icon: "📝", kind: "pick", lang: "en", items: [
            { q: "选 be 动词：I ___ a student.", read: "I am a student", opts: ["am", "is", "are", "be"], a: 0, tip: "I am（我是）" },
            { q: "选 be 动词：She ___ happy.", read: "She is happy", opts: ["is", "am", "are", "was"], a: 0, tip: "She is（她是）" },
            { q: "选 be 动词：They ___ friends.", read: "They are friends", opts: ["are", "is", "am", "be"], a: 0, tip: "They are（他们是）" },
            { q: "选 be 动词：You ___ welcome.", read: "You are welcome", opts: ["are", "is", "am", "be"], a: 0, tip: "You are（你是）" },
            { q: "选 be 动词：It ___ a cat.", read: "It is a cat", opts: ["is", "am", "are", "be"], a: 0, tip: "It is（它是）" }
          ]},
          { id: "en-g2", title: "冠词 a / an", icon: "📄", kind: "pick", lang: "en", items: [
            { q: "选冠词：___ apple（苹果）", read: "an apple", opts: ["An", "A", "The", "不用填"], a: 0, tip: "元音音素前用 an" },
            { q: "选冠词：___ book（书）", read: "a book", opts: ["A", "An", "The", "不用填"], a: 0, tip: "辅音音素前用 a" },
            { q: "选冠词：___ egg（鸡蛋）", read: "an egg", opts: ["An", "A", "The", "不用填"], a: 0, tip: "egg 以元音音素开头，用 an" },
            { q: "选冠词：___ university（大学）", read: "a university", opts: ["A", "An", "The", "不用填"], a: 0, tip: "university 以 /j/ 开头，用 a" },
            { q: "选冠词：___ hour（小时）", read: "an hour", opts: ["An", "A", "The", "不用填"], a: 0, tip: "hour 的 h 不发音，用 an" }
          ]}
        ]
      },
      {
        id: "en-listen", title: "听力练习", subtitle: "听发音选意思", color: "#ce82ff",
        lessons: [
          { id: "en-l1", title: "听音辨词", icon: "🎧", kind: "listen", lang: "en", items: [
            { say: "cat", q: "听到的是哪个词？", opts: ["猫", "帽子", "小汽车", "蛋糕"], a: 0, tip: "cat = 猫" },
            { say: "dog", q: "听到的是哪个词？", opts: ["狗", "猫", "猪", "牛"], a: 0, tip: "dog = 狗" },
            { say: "bird", q: "听到的是哪个词？", opts: ["鸟", "蜜蜂", "鱼", "虫"], a: 0, tip: "bird = 鸟" },
            { say: "milk", q: "听到的是哪个词？", opts: ["牛奶", "水", "果汁", "茶"], a: 0, tip: "milk = 牛奶" },
            { say: "book", q: "听到的是哪个词？", opts: ["书", "笔", "包", "纸"], a: 0, tip: "book = 书" }
          ]}
        ]
      }
    ]
  }
};