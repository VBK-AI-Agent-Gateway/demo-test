// LingoTree 课程与题库数据
window.DATA = {
  courses: [
    { id: "ja", name: "日本語", color: "#ff5b5b", icon: "🇯🇵" },
    { id: "en", name: "English", color: "#1cb0f6", icon: "🇬🇧" }
  ],
  units: {
    ja: [
      {
        id: "ja-hira", title: "假名入门", subtitle: "Hiragana 基础", color: "#ff5b5b",
        lessons: [
          { id: "ja-a", title: "五十音 あ行", icon: "あ", kind: "pick", items: [
            { q: "「あ」的读音是？", opts: ["a", "i", "u", "e"], a: 0, tip: "あ = a" },
            { q: "「い」的读音是？", opts: ["a", "i", "o", "u"], a: 1, tip: "い = i" },
            { q: "哪个是元音 a？", opts: ["う", "あ", "え", "お"], a: 1, tip: "a 对应 あ" },
            { q: "「う」的读音是？", opts: ["u", "e", "a", "i"], a: 0, tip: "う = u" },
            { q: "「え」的读音是？", opts: ["e", "o", "u", "a"], a: 0, tip: "え = e" }
          ]},
          { id: "ja-k", title: "五十音 か行", icon: "か", kind: "pick", items: [
            { q: "「か」的读音是？", opts: ["ka", "ki", "ku", "ke"], a: 0, tip: "か = ka" },
            { q: "「き」的读音是？", opts: ["ki", "ka", "ku", "ko"], a: 0, tip: "き = ki" },
            { q: "哪个读 ku？", opts: ["け", "こ", "く", "か"], a: 2, tip: "く = ku" },
            { q: "「こ」的读音是？", opts: ["ko", "ke", "ka", "ki"], a: 0, tip: "こ = ko" },
            { q: "「け」的读音是？", opts: ["ke", "ki", "ko", "ku"], a: 0, tip: "け = ke" }
          ]},
          { id: "ja-match", title: "假名配对", icon: "🔗", kind: "match", pairs: [
            ["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"], ["か", "ka"], ["き", "ki"], ["く", "ku"]
          ]},
          { id: "ja-dak", title: "浊音与半浊音", icon: "が", kind: "pick", items: [
            { q: "「が」是哪个的浊音？", opts: ["か", "さ", "た", "は"], a: 0, tip: "か → が" },
            { q: "「ざ」是哪个的浊音？", opts: ["さ", "た", "が", "な"], a: 0, tip: "さ → ざ" },
            { q: "「だ」是哪个的浊音？", opts: ["た", "な", "は", "だ"], a: 0, tip: "た → だ" },
            { q: "「ば」是哪个的浊音？", opts: ["は", "た", "か", "な"], a: 0, tip: "は → ば" },
            { q: "「ぱ」是半浊音，来自？", opts: ["は", "さ", "だ", "が"], a: 0, tip: "は → ぱ" }
          ]}
        ]
      },
      {
        id: "ja-word", title: "基础词汇", subtitle: "Daily words", color: "#ff9600",
        lessons: [
          { id: "ja-w1", title: "自我介绍", icon: "👋", kind: "pick", items: [
            { q: "「わたし」是什么意思？", opts: ["我", "你", "他", "爱"], a: 0, tip: "watashi = 我" },
            { q: "「あなた」的意思是？", opts: ["你", "我", "谁", "那"], a: 0, tip: "anata = 你" },
            { q: "「ほんとう」= ?", opts: ["真的", "假的", "快的", "慢的"], a: 0, tip: "hontou = 真的" },
            { q: "“我是学生”怎么说？", opts: ["わたしはがくせいです", "あなたはがくせいです", "がくせいはわたしです", "これはほんです"], a: 0, tip: "watashi wa gakusei desu" },
            { q: "「ありがとう」的意思？", opts: ["谢谢", "对不起", "你好", "再见"], a: 0, tip: "arigatou = 谢谢" }
          ]},
          { id: "ja-w2", title: "食物", icon: "🍣", kind: "pick", items: [
            { q: "「みず」的意思？", opts: ["水", "火", "木", "金"], a: 0, tip: "mizu = 水" },
            { q: "「さかな」的意思？", opts: ["鱼", "肉", "米", "菜"], a: 0, tip: "sakana = 鱼" },
            { q: "「たべもの」的意思？", opts: ["食物", "饮料", "水果", "甜点"], a: 0, tip: "tabemono = 食物" },
            { q: "“吃”是？", opts: ["たべる", "のむ", "いく", "ねる"], a: 0, tip: "taberu = 吃" },
            { q: "“喝”是？", opts: ["のむ", "たべる", "かく", "きく"], a: 0, tip: "nomu = 喝" }
          ]},
          { id: "ja-sent", title: "简单句子", icon: "💬", kind: "build", items: [
            { q: "拼出：我是学生", words: ["わたし", "は", "がくせい", "です"], a: ["わたし", "は", "がくせい", "です"], tip: "watashi wa gakusei desu" },
            { q: "拼出：这是书", words: ["これ", "は", "ほん", "です"], a: ["これ", "は", "ほん", "です"], tip: "kore wa hon desu" },
            { q: "拼出：我喜欢猫", words: ["わたし", "は", "ねこ", "が", "すきです"], a: ["わたし", "は", "ねこ", "が", "すきです"], tip: "watashi wa neko ga suki desu" },
            { q: "拼出：水是冷的", words: ["みず", "は", "つめたい", "です"], a: ["みず", "は", "つめたい", "です"], tip: "mizu wa tsumetai desu" }
          ]}
        ]
      },
      {
        id: "ja-listen", title: "听力", subtitle: "Listening", color: "#ce82ff",
        lessons: [
          { id: "ja-l1", title: "听音辨词", icon: "🎧", kind: "listen", items: [
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
        id: "en-alp", title: "字母发音", subtitle: "Alphabet", color: "#1cb0f6",
        lessons: [
          { id: "en-a1", title: "元音字母", icon: "🅰️", kind: "pick", items: [
            { q: "哪个是元音 vowel？", opts: ["b", "a", "t", "s"], a: 1, tip: "a e i o u 是元音" },
            { q: "“apple” 的首字母发音？", opts: ["æ", "e", "i", "o"], a: 0, tip: "apple /ˈæpl/" },
            { q: "“egg” 的首字母发音？", opts: ["e", "a", "i", "u"], a: 0, tip: "egg /eɡ/" },
            { q: "哪个字母读 /iː/？", opts: ["e", "a", "o", "u"], a: 0, tip: "E says /iː/" },
            { q: "“unit” 的首字母发音？", opts: ["juː", "u", "a", "e"], a: 0, tip: "unit /ˈjuːnɪt/" }
          ]},
          { id: "en-a2", title: "常见辅音", icon: "🅱️", kind: "pick", items: [
            { q: "“cat” 中 c 的发音？", opts: ["/k/", "/s/", "/t/", "/g/"], a: 0, tip: "c before a = /k/" },
            { q: "“sun” 中 s 的发音？", opts: ["/s/", "/z/", "/θ/", "/ʃ/"], a: 0, tip: "s = /s/" },
            { q: "“think” 中 th 的发音？", opts: ["/θ/", "/t/", "/f/", "/s/"], a: 0, tip: "th = /θ/" },
            { q: "“dog” 中 d 的发音？", opts: ["/d/", "/t/", "/b/", "/ɡ/"], a: 0, tip: "d = /d/" },
            { q: "“fish” 中 sh 的发音？", opts: ["/ʃ/", "/s/", "/tʃ/", "/ʒ/"], a: 0, tip: "sh = /ʃ/" }
          ]},
          { id: "en-match", title: "字母配对", icon: "🔗", kind: "match", pairs: [
            ["A", "apple"], ["B", "book"], ["C", "cat"], ["D", "dog"], ["E", "egg"], ["F", "fish"], ["G", "go"], ["H", "hat"]
          ]}
        ]
      },
      {
        id: "en-word", title: "基础词汇", subtitle: "Vocabulary", color: "#58cc02",
        lessons: [
          { id: "en-w1", title: "日常名词", icon: "🍎", kind: "pick", items: [
            { q: "“water” 的意思？", opts: ["水", "火", "土", "风"], a: 0, tip: "water = 水" },
            { q: "“friend” 的意思？", opts: ["朋友", "家人", "老师", "同学"], a: 0, tip: "friend = 朋友" },
            { q: "“house” 的意思？", opts: ["房子", "车", "学校", "商店"], a: 0, tip: "house = 房子" },
            { q: "“book” 的意思？", opts: ["书", "笔", "纸", "桌"], a: 0, tip: "book = 书" },
            { q: "“school” 的意思？", opts: ["学校", "医院", "公园", "商店"], a: 0, tip: "school = 学校" }
          ]},
          { id: "en-w2", title: "常用动词", icon: "🏃", kind: "pick", items: [
            { q: "“run” 的意思？", opts: ["跑", "走", "跳", "游"], a: 0, tip: "run = 跑" },
            { q: "“eat” 的意思？", opts: ["吃", "喝", "睡", "玩"], a: 0, tip: "eat = 吃" },
            { q: "“sleep” 的意思？", opts: ["睡觉", "坐", "站", "笑"], a: 0, tip: "sleep = 睡觉" },
            { q: "“read” 的意思？", opts: ["读", "写", "说", "听"], a: 0, tip: "read = 读" },
            { q: "“write” 的意思？", opts: ["写", "读", "画", "想"], a: 0, tip: "write = 写" }
          ]},
          { id: "en-sent", title: "拼句练习", icon: "🧱", kind: "build", items: [
            { q: "拼出：I am a student", words: ["I", "am", "a", "student"], a: ["I", "am", "a", "student"], tip: "I am a student" },
            { q: "拼出：She likes cats", words: ["She", "likes", "cats"], a: ["She", "likes", "cats"], tip: "She likes cats" },
            { q: "拼出：I go to school", words: ["I", "go", "to", "school"], a: ["I", "go", "to", "school"], tip: "I go to school" },
            { q: "拼出：We eat dinner", words: ["We", "eat", "dinner"], a: ["We", "eat", "dinner"], tip: "We eat dinner" }
          ]}
        ]
      },
      {
        id: "en-gram", title: "语法", subtitle: "Grammar", color: "#ff9600",
        lessons: [
          { id: "en-g1", title: "be 动词", icon: "📝", kind: "pick", items: [
            { q: "I ___ a student.", opts: ["am", "is", "are", "be"], a: 0, tip: "I am" },
            { q: "She ___ happy.", opts: ["is", "am", "are", "was"], a: 0, tip: "She is" },
            { q: "They ___ friends.", opts: ["are", "is", "am", "be"], a: 0, tip: "They are" },
            { q: "You ___ welcome.", opts: ["are", "is", "am", "be"], a: 0, tip: "You are" },
            { q: "It ___ a cat.", opts: ["is", "am", "are", "be"], a: 0, tip: "It is" }
          ]},
          { id: "en-g2", title: "冠词 a/an", icon: "📄", kind: "pick", items: [
            { q: "___ apple", opts: ["An", "A", "The", "—"], a: 0, tip: "元音前用 an" },
            { q: "___ book", opts: ["A", "An", "The", "—"], a: 0, tip: "辅音前用 a" },
            { q: "___ egg", opts: ["An", "A", "The", "—"], a: 0, tip: "egg 以元音音素开头" },
            { q: "___ university", opts: ["A", "An", "The", "—"], a: 0, tip: "university 以 /j/ 开头，用 a" },
            { q: "___ hour", opts: ["An", "A", "The", "—"], a: 0, tip: "hour 不发音，用 an" }
          ]}
        ]
      },
      {
        id: "en-listen", title: "听力", subtitle: "Listening", color: "#ce82ff",
        lessons: [
          { id: "en-l1", title: "听音辨词", icon: "🎧", kind: "listen", items: [
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