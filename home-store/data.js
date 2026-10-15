// HomeStore 家具数据（卡通 SVG 商品图，零外部依赖）
// cat: 分类；pic: 返回 SVG 字符串
var STORE = {
  cats: [
    { id: "sofa", name: "沙发", ic: "🛋️" },
    { id: "bed", name: "床与床垫", ic: "🛏️" },
    { id: "table", name: "桌几", ic: "🪵" },
    { id: "chair", name: "椅凳", ic: "🪑" },
    { id: "cabinet", name: "柜架", ic: "🗄️" },
    { id: "light", name: "照明", ic: "💡" },
    { id: "storage", name: "储物收纳", ic: "📦" },
    { id: "textile", name: "家纺纺织", ic: "🧺" },
    { id: "outdoor", name: "户外", ic: "⛱️" }
  ],
  products: [
    { id: 1, name: "兰德 三人布艺沙发", cat: "sofa", price: 2999, old: 3599, tag: "热卖", rating: 4.8, desc: "高回弹海绵坐垫，可拆洗棉麻外套，奶油白配色，适合 20㎡ 客厅。",
      pic: function (a, b) { return svgSofa(a, b); }, a: "#f3d9b8", b: "#c98b52" },
    { id: 2, name: "贝卡 双人皮质沙发", cat: "sofa", price: 4599, old: 5299, tag: "新品", rating: 4.7, desc: "头层牛皮，实木框架，深棕复古色，坐感柔软支撑好。",
      pic: function (a, b) { return svgSofa(a, b); }, a: "#b98a5f", b: "#7c5230" },
    { id: 3, name: "云朵 单人休闲沙发", cat: "sofa", price: 1299, old: 0, tag: "", rating: 4.6, desc: "圆润云朵造型，小户型友好，客厅卧室都能放。",
      pic: function (a, b) { return svgSofa2(a, b); }, a: "#d6ecff", b: "#8ecdf2" },
    { id: 4, name: "诺拉 松木双人床", cat: "bed", price: 2599, old: 2999, tag: "热卖", rating: 4.9, desc: "FSC 认证松木，圆角床头，环保水性漆，1.5m/1.8m 可选。",
      pic: function (a, b) { return svgBed(a, b); }, a: "#f0dfc0", b: "#c9a063" },
    { id: 5, name: "甜梦 乳胶床垫", cat: "bed", price: 1899, old: 2399, tag: "爆款", rating: 4.8, desc: "92% 天然乳胶，独立袋装弹簧，软硬两面可用。",
      pic: function (a, b) { return svgMattress(a, b); }, a: "#e7f3e9", b: "#9cc9a5" },
    { id: 6, name: "小屋 高架儿童床", cat: "bed", price: 3299, old: 0, tag: "新品", rating: 4.7, desc: "屋顶造型+护栏，带爬梯，给孩子一个秘密基地。",
      pic: function (a, b) { return svgHouseBed(a, b); }, a: "#ffe7c2", b: "#f0a860" },
    { id: 7, name: "原木 餐桌 140cm", cat: "table", price: 1699, old: 1999, tag: "", rating: 4.7, desc: "整块橡木纹桌面，圆角防撞，可坐 4-6 人。",
      pic: function (a, b) { return svgTable(a, b); }, a: "#f0d9ae", b: "#b98a4b" },
    { id: 8, name: "圆圆 茶几", cat: "table", price: 599, old: 799, tag: "特惠", rating: 4.5, desc: "双层收纳圆几，钢木结合，客厅沙发好搭档。",
      pic: function (a, b) { return svgCoffee(a, b); }, a: "#e8e4da", b: "#9a8f7a" },
    { id: 9, name: "书虫 书桌 120cm", cat: "table", price: 899, old: 0, tag: "", rating: 4.6, desc: "自带理线孔与书架挡板，网课办公都合适。",
      pic: function (a, b) { return svgDesk(a, b); }, a: "#f5e6cf", b: "#c69a5a" },
    { id: 10, name: "弯弯 餐椅（两把）", cat: "chair", price: 499, old: 699, tag: "热卖", rating: 4.7, desc: "曲木靠背贴合腰背，轻便可叠放，一套两把。",
      pic: function (a, b) { return svgChair(a, b); }, a: "#ffe1b8", b: "#d99a4e" },
    { id: 11, name: "绒绒 休闲单椅", cat: "chair", price: 1099, old: 1299, tag: "", rating: 4.8, desc: "短绒面料，360° 旋转，卧室阅读角必备。",
      pic: function (a, b) { return svgChair2(a, b); }, a: "#e5d7f5", b: "#a387dd" },
    { id: 12, name: "吧台高脚凳", cat: "chair", price: 349, old: 0, tag: "", rating: 4.4, desc: "可调节高度，防滑脚踏，厨房吧台适配。",
      pic: function (a, b) { return svgStool(a, b); }, a: "#d9e9f5", b: "#6fa8cf" },
    { id: 13, name: "格格 书架 5 层", cat: "cabinet", price: 799, old: 999, tag: "特惠", rating: 4.6, desc: "五层分区，可放书与摆件，防倾倒固定件附送。",
      pic: function (a, b) { return svgShelf(a, b); }, a: "#f0e0c4", b: "#bf9355" },
    { id: 14, name: "衣柜 推拉门 1.8m", cat: "cabinet", price: 2799, old: 3299, tag: "", rating: 4.7, desc: "大容量三门，静音滑轨，挂衣叠放分区。",
      pic: function (a, b) { return svgWardrobe(a, b); }, a: "#eceff2", b: "#a9b4bd" },
    { id: 15, name: "电视柜 1.6m", cat: "cabinet", price: 1099, old: 0, tag: "新品", rating: 4.5, desc: "悬浮柜体好打扫，抽屉+开放格收纳机顶盒。",
      pic: function (a, b) { return svgTv(a, b); }, a: "#f4e5cd", b: "#c79b5e" },
    { id: 16, name: "暖光 吊灯", cat: "light", price: 459, old: 599, tag: "热卖", rating: 4.8, desc: "半球灯罩，3000K 暖光，餐厅客厅百搭。",
      pic: function (a, b) { return svgPendant(a, b); }, a: "#ffe9a3", b: "#e0a93c" },
    { id: 17, name: "蘑菇 台灯", cat: "light", price: 199, old: 259, tag: "", rating: 4.6, desc: "三档调光触控，护眼柔光，床头书桌两用。",
      pic: function (a, b) { return svgLamp(a, b); }, a: "#ffd9d9", b: "#e88a8a" },
    { id: 18, name: "日落 落地灯", cat: "light", price: 399, old: 0, tag: "", rating: 4.5, desc: "细杆不占地，暖黄氛围光，沙发旁刚刚好。",
      pic: function (a, b) { return svgFloor(a, b); }, a: "#f5e2c8", b: "#c68f4d" },
    { id: 19, name: "叠叠 收纳箱（四件）", cat: "storage", price: 159, old: 199, tag: "特惠", rating: 4.7, desc: "可嵌套叠放，带滑轮与把手，衣柜床底都能塞。",
      pic: function (a, b) { return svgBox(a, b); }, a: "#d7ecdb", b: "#7db98a" },
    { id: 20, name: "衣物收纳柜 三层", cat: "storage", price: 329, old: 0, tag: "", rating: 4.5, desc: "抽屉式布艺柜，防尘透气，袜子内衣分类放。",
      pic: function (a, b) { return svgDrawer(a, b); }, a: "#dce9f5", b: "#7fa8cd" },
    { id: 21, name: "藤编收纳篮", cat: "storage", price: 129, old: 0, tag: "", rating: 4.6, desc: "天然藤条手工编织，脏衣玩具一筐收纳。",
      pic: function (a, b) { return svgBasket(a, b); }, a: "#f0dcb8", b: "#c39a55" },
    { id: 22, name: "格纹四件套", cat: "textile", price: 399, old: 499, tag: "爆款", rating: 4.8, desc: "60 支长绒棉，亲肤透气，四种配色可选。",
      pic: function (a, b) { return svgBedding(a, b); }, a: "#dff0e5", b: "#8cc5a0" },
    { id: 23, name: "纯色遮光窗帘", cat: "textile", price: 259, old: 0, tag: "", rating: 4.6, desc: "物理遮光 95%，隔音降温，挂钩/打孔两用。",
      pic: function (a, b) { return svgCurtain(a, b); }, a: "#e2ddf5", b: "#9b8ad4" },
    { id: 24, name: "长绒地毯 140×200", cat: "textile", price: 599, old: 799, tag: "特惠", rating: 4.7, desc: "加密长绒脚感软，防滑底背，客厅卧室适用。",
      pic: function (a, b) { return svgRug(a, b); }, a: "#f5dede", b: "#d98f8f" },
    { id: 25, name: "户外折叠桌椅套装", cat: "outdoor", price: 899, old: 1099, tag: "新品", rating: 4.6, desc: "一桌两椅，铝合金免安装，阳台露营随心用。",
      pic: function (a, b) { return svgOutdoor(a, b); }, a: "#d9f0dd", b: "#79bd85" },
    { id: 26, name: "防晒遮阳伞 2.5m", cat: "outdoor", price: 469, old: 0, tag: "", rating: 4.5, desc: "UPF50+ 防晒，防风骨架，庭院花园遮阳。",
      pic: function (a, b) { return svgUmbrella(a, b); }, a: "#ffe3d1", b: "#e89b6c" }
  ]
};

/* ---------- SVG 卡通商品图 ---------- */
function frame(inner) {
  return '<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="200" height="140" fill="#f6f8fa"/>' + inner + "</svg>";
}
if (typeof window !== "undefined") window.STORE = STORE;
function svgSofa(a, b) {
  return frame('<rect x="28" y="58" width="144" height="44" rx="14" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="22" y="44" width="34" height="58" rx="12" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="144" y="44" width="34" height="58" rx="12" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="58" y="52" width="40" height="30" rx="8" fill="#fff" opacity=".55"/>' +
    '<rect x="104" y="52" width="40" height="30" rx="8" fill="#fff" opacity=".55"/>' +
    '<rect x="40" y="102" width="10" height="14" rx="3" fill="' + b + '"/><rect x="150" y="102" width="10" height="14" rx="3" fill="' + b + '"/>');
}
function svgSofa2(a, b) {
  return frame('<ellipse cx="100" cy="96" rx="62" ry="20" fill="' + b + '" opacity=".35"/>' +
    '<path d="M44 96 q0-44 56-44 q56 0 56 44 z" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="52" y="70" width="96" height="28" rx="14" fill="#fff" opacity=".5"/>' +
    '<rect x="46" y="88" width="108" height="18" rx="9" fill="' + b + '"/>');
}
function svgBed(a, b) {
  return frame('<rect x="24" y="72" width="152" height="34" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="24" y="44" width="24" height="62" rx="8" fill="' + b + '"/>' +
    '<rect x="40" y="62" width="136" height="20" rx="8" fill="#fff" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="52" y="54" width="34" height="16" rx="7" fill="#dfeaf5" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="96" y="54" width="34" height="16" rx="7" fill="#dfeaf5" stroke="' + b + '" stroke-width="3"/>');
}
function svgMattress(a, b) {
  return frame('<rect x="26" y="58" width="148" height="44" rx="12" fill="#fff" stroke="' + b + '" stroke-width="4"/>' +
    '<path d="M26 76 h148" stroke="' + b + '" stroke-width="3" stroke-dasharray="8 6"/>' +
    '<path d="M26 90 h148" stroke="' + b + '" stroke-width="3" stroke-dasharray="8 6"/>' +
    '<rect x="26" y="102" width="148" height="10" rx="5" fill="' + a + '"/>' +
    '<circle cx="52" cy="68" r="5" fill="' + a + '"/><circle cx="100" cy="68" r="5" fill="' + a + '"/><circle cx="148" cy="68" r="5" fill="' + a + '"/>');
}
function svgHouseBed(a, b) {
  return frame('<path d="M40 62 L100 26 L160 62" fill="' + a + '" stroke="' + b + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<rect x="48" y="62" width="104" height="48" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="56" y="84" width="88" height="20" rx="7" fill="#fff" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="62" y="72" width="30" height="14" rx="6" fill="#fff" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="150" y="40" width="8" height="70" fill="' + b + '"/>');
}
function svgTable(a, b) {
  return frame('<rect x="26" y="52" width="148" height="16" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="44" y="68" width="10" height="42" rx="4" fill="' + b + '"/>' +
    '<rect x="146" y="68" width="10" height="42" rx="4" fill="' + b + '"/>' +
    '<rect x="44" y="96" width="112" height="8" rx="4" fill="' + b + '" opacity=".6"/>' +
    '<circle cx="100" cy="44" r="10" fill="#fff" stroke="' + b + '" stroke-width="3"/>');
}
function svgCoffee(a, b) {
  return frame('<ellipse cx="100" cy="60" rx="58" ry="16" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<ellipse cx="100" cy="92" rx="44" ry="12" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="66" y="60" width="8" height="34" fill="' + b + '"/><rect x="126" y="60" width="8" height="34" fill="' + b + '"/>' +
    '<rect x="86" y="44" width="26" height="14" rx="5" fill="#fff" stroke="' + b + '" stroke-width="3"/>');
}
function svgDesk(a, b) {
  return frame('<rect x="24" y="56" width="152" height="12" rx="6" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="34" y="68" width="42" height="42" rx="6" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="55" y1="78" x2="55" y2="100" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="150" y="68" width="8" height="42" fill="' + b + '"/>' +
    '<rect x="100" y="34" width="44" height="22" rx="4" fill="#dfeaf5" stroke="' + b + '" stroke-width="3"/>');
}
function svgChair(a, b) {
  return frame('<rect x="76" y="30" width="48" height="52" rx="14" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="66" y="78" width="68" height="14" rx="7" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="72" y="92" width="8" height="20" rx="3" fill="' + b + '"/><rect x="120" y="92" width="8" height="20" rx="3" fill="' + b + '"/>');
}
function svgChair2(a, b) {
  return frame('<path d="M60 100 q0-52 40-52 q40 0 40 52 z" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="56" y="88" width="88" height="20" rx="10" fill="' + b + '"/>' +
    '<circle cx="74" cy="114" r="6" fill="' + b + '"/><circle cx="126" cy="114" r="6" fill="' + b + '"/>');
}
function svgStool(a, b) {
  return frame('<ellipse cx="100" cy="52" rx="40" ry="12" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="70" y="60" width="8" height="50" fill="' + b + '"/><rect x="122" y="60" width="8" height="50" fill="' + b + '"/>' +
    '<rect x="74" y="88" width="52" height="7" rx="3" fill="' + b + '"/>');
}
function svgShelf(a, b) {
  return frame('<rect x="52" y="24" width="96" height="92" rx="6" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="52" y1="48" x2="148" y2="48" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="52" y1="72" x2="148" y2="72" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="52" y1="96" x2="148" y2="96" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="60" y="30" width="8" height="16" fill="#e07a5f"/><rect x="72" y="32" width="8" height="14" fill="#81b29a"/>' +
    '<rect x="118" y="54" width="20" height="16" rx="3" fill="#f2cc8f"/><circle cx="84" cy="84" r="9" fill="#9cc9a5"/>');
}
function svgWardrobe(a, b) {
  return frame('<rect x="44" y="22" width="112" height="96" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="81" y1="22" x2="81" y2="118" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="119" y1="22" x2="119" y2="118" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="72" y="62" width="6" height="16" rx="3" fill="' + b + '"/><rect x="123" y="62" width="6" height="16" rx="3" fill="' + b + '"/>');
}
function svgTv(a, b) {
  return frame('<rect x="34" y="66" width="132" height="34" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="48" y="74" width="44" height="18" rx="4" fill="#fff" opacity=".7"/><rect x="108" y="74" width="44" height="18" rx="4" fill="#fff" opacity=".7"/>' +
    '<rect x="66" y="30" width="68" height="34" rx="4" fill="#3f5566"/><rect x="72" y="36" width="56" height="22" rx="2" fill="#8ecdf2"/>' +
    '<rect x="46" y="100" width="8" height="12" fill="' + b + '"/><rect x="146" y="100" width="8" height="12" fill="' + b + '"/>');
}
function svgPendant(a, b) {
  return frame('<line x1="100" y1="10" x2="100" y2="42" stroke="' + b + '" stroke-width="5"/>' +
    '<path d="M64 78 q0-36 36-36 q36 0 36 36 z" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<ellipse cx="100" cy="78" rx="36" ry="9" fill="#fff" stroke="' + b + '" stroke-width="4"/>' +
    '<path d="M78 96 l-8 16 M100 100 l0 16 M122 96 l8 16" stroke="#f2cc8f" stroke-width="5" stroke-linecap="round"/>');
}
function svgLamp(a, b) {
  return frame('<path d="M64 74 q0-38 36-38 q36 0 36 38 z" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="96" y="74" width="8" height="30" fill="' + b + '"/>' +
    '<ellipse cx="100" cy="106" rx="26" ry="8" fill="' + b + '"/>' +
    '<circle cx="100" cy="52" r="8" fill="#fff9d6"/>');
}
function svgFloor(a, b) {
  return frame('<line x1="118" y1="20" x2="118" y2="96" stroke="' + b + '" stroke-width="6"/>' +
    '<path d="M92 46 q0-26 26-26 q26 0 26 26 z" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<ellipse cx="118" cy="104" rx="30" ry="9" fill="' + b + '"/>');
}
function svgBox(a, b) {
  return frame('<rect x="40" y="54" width="56" height="44" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="104" y="54" width="56" height="44" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="72" y="34" width="56" height="44" rx="8" fill="#fff" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="90" y="50" width="20" height="12" rx="4" fill="' + b + '"/>');
}
function svgDrawer(a, b) {
  return frame('<rect x="50" y="30" width="100" height="80" rx="8" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="50" y1="56" x2="150" y2="56" stroke="' + b + '" stroke-width="4"/>' +
    '<line x1="50" y1="84" x2="150" y2="84" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="88" y="40" width="24" height="7" rx="3" fill="' + b + '"/><rect x="88" y="66" width="24" height="7" rx="3" fill="' + b + '"/><rect x="88" y="94" width="24" height="7" rx="3" fill="' + b + '"/>');
}
function svgBasket(a, b) {
  return frame('<path d="M52 56 h96 l-12 54 h-72 z" fill="' + a + '" stroke="' + b + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<ellipse cx="100" cy="56" rx="48" ry="12" fill="#fff" stroke="' + b + '" stroke-width="4"/>' +
    '<path d="M62 70 l10 34 M100 70 l0 36 M138 70 l-10 34" stroke="' + b + '" stroke-width="3" opacity=".6"/>' +
    '<path d="M56 84 h88" stroke="' + b + '" stroke-width="3" opacity=".6"/>');
}
function svgBedding(a, b) {
  return frame('<rect x="34" y="52" width="132" height="54" rx="10" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<path d="M34 74 h132 M34 92 h132 M68 52 v54 M102 52 v54 M136 52 v54" stroke="' + b + '" stroke-width="3" opacity=".55"/>' +
    '<rect x="44" y="36" width="46" height="20" rx="8" fill="#fff" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="110" y="36" width="46" height="20" rx="8" fill="#fff" stroke="' + b + '" stroke-width="3"/>');
}
function svgCurtain(a, b) {
  return frame('<rect x="30" y="26" width="140" height="8" rx="4" fill="' + b + '"/>' +
    '<path d="M40 34 q10 40 4 78 h30 q-6-40 4-78 z" fill="' + a + '" stroke="' + b + '" stroke-width="3"/>' +
    '<path d="M126 34 q10 40 4 78 h30 q-6-40 4-78 z" fill="' + a + '" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="84" y="46" width="36" height="56" rx="4" fill="#eaf5ff" stroke="' + b + '" stroke-width="3"/>');
}
function svgRug(a, b) {
  return frame('<rect x="34" y="44" width="132" height="60" rx="10" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="48" y="56" width="104" height="36" rx="7" fill="none" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="64" y="66" width="72" height="16" rx="5" fill="#fff" opacity=".65"/>' +
    '<path d="M40 104 v10 M64 104 v10 M88 104 v10 M112 104 v10 M136 104 v10 M160 104 v10" stroke="' + b + '" stroke-width="3"/>');
}
function svgOutdoor(a, b) {
  return frame('<ellipse cx="78" cy="70" rx="40" ry="12" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<rect x="74" y="70" width="8" height="40" fill="' + b + '"/>' +
    '<rect x="58" y="86" width="40" height="10" rx="5" fill="' + a + '" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="132" y="74" width="34" height="10" rx="5" fill="' + a + '" stroke="' + b + '" stroke-width="3"/>' +
    '<rect x="136" y="84" width="7" height="26" fill="' + b + '"/><rect x="156" y="84" width="7" height="26" fill="' + b + '"/>');
}
function svgUmbrella(a, b) {
  return frame('<path d="M46 66 q54-46 108 0 z" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
    '<path d="M46 66 q18-14 36 0 q18-14 36 0 q18-14 36 0" fill="none" stroke="' + b + '" stroke-width="3"/>' +
    '<line x1="100" y1="60" x2="100" y2="110" stroke="' + b + '" stroke-width="5"/>' +
    '<path d="M100 110 q0 8 10 8" fill="none" stroke="' + b + '" stroke-width="5" stroke-linecap="round"/>');
}
if (typeof window !== "undefined") window.STORE = STORE;
