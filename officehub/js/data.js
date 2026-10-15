// OfficeHub 云办公 - Mock 数据与存储
window.OH_DATA = {
  me: { id: "u1", name: "林晓峰", title: "产品部 · 高级产品经理", dept: "产品部", avatar: "林", phone: "138****2211" },
  org: [
    { id: "u1", name: "林晓峰", title: "高级产品经理", dept: "产品部", avatar: "林", online: true },
    { id: "u2", name: "陈静", title: "产品总监", dept: "产品部", avatar: "陈", online: true },
    { id: "u3", name: "王志强", title: "后端工程师", dept: "技术部", avatar: "王", online: true },
    { id: "u4", name: "李梦琪", title: "前端工程师", dept: "技术部", avatar: "李", online: false },
    { id: "u5", name: "赵天宇", title: "架构师", dept: "技术部", avatar: "赵", online: true },
    { id: "u6", name: "刘婷", title: "HRBP", dept: "人力资源部", avatar: "刘", online: false },
    { id: "u7", name: "孙浩然", title: "招聘专员", dept: "人力资源部", avatar: "孙", online: true },
    { id: "u8", name: "周雅", title: "财务经理", dept: "财务部", avatar: "周", online: true },
    { id: "u9", name: "吴磊", title: "销售代表", dept: "销售部", avatar: "吴", online: false },
    { id: "u10", name: "郑雪", title: "销售主管", dept: "销售部", avatar: "郑", online: true },
    { id: "u11", name: "林晓峰", title: "你", dept: "产品部", avatar: "我", online: true }
  ],
  depts: ["产品部", "技术部", "人力资源部", "财务部", "销售部"],
  groups: [
    { id: "g1", name: "产品技术协作群", members: ["u1", "u2", "u3", "u4", "u5"], avatar: "群" },
    { id: "g2", name: "全员通知群", members: ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10"], avatar: "群" },
    { id: "g3", name: "项目攻坚组", members: ["u1", "u3", "u5"], avatar: "群" }
  ],
  seedChats: [
    { type: "user", id: "u3", msgs: [
      { from: "u3", text: "接口联调今天下午能完成，注意看 swagger 文档。", ts: Date.now() - 3600e3 },
      { from: "u1", text: "收到，我这边把 UI 稿同步给你。", ts: Date.now() - 3500e3 }
    ]},
    { type: "group", id: "g1", msgs: [
      { from: "u2", text: "明早 10 点评审会，大家提前把原型更新一下。", ts: Date.now() - 7200e3 },
      { from: "u4", text: "好的，我今晚把交互细节补完。", ts: Date.now() - 7000e3 }
    ]},
    { type: "user", id: "u6", msgs: [
      { from: "u6", text: "您好，本月社保基数申报开始了，麻烦确认一下信息。", ts: Date.now() - 86400e3 }
    ]}
  ],
  announcements: [
    { id: "a1", title: "关于 2024 年度调薪通知", from: "人力资源部", ts: Date.now() - 86400e3 * 2, body: "各位同事：经管理层研究决定，2024 年度调薪方案将于本月 25 日起执行，具体明细由各部门 HRBP 单独沟通。" },
    { id: "a2", title: "办公区网络维护公告", from: "行政部", ts: Date.now() - 86400e3, body: "本周六 22:00-次日 6:00 进行核心交换机升级，期间 VPN 可能中断，请提前保存工作内容。" },
    { id: "a3", title: "Q3 OKR 复盘会议", from: "产品部", ts: Date.now() - 3600e3 * 5, body: "请各负责人于本周五 14:00 前提交 Q3 OKR 复盘文档，会议时间：下周一 10:00，地点：3F 战略会议室。" }
  ],
  seedApprovals: [
    { id: "ap1", type: "请假申请", days: "2天", reason: "家中有事需返乡处理", submitTo: "陈静", ts: Date.now() - 86400e3 * 3, status: "approved", history: [{ a: "提交申请", who: "我", ts: Date.now() - 86400e3 * 3 }, { a: "已批准", who: "陈静", ts: Date.now() - 86400e3 * 2 }] },
    { id: "ap2", type: "报销申请", amount: "¥1,280", reason: "客户拜访差旅（高铁+住宿）", submitTo: "周雅", ts: Date.now() - 86400e3, status: "pending", history: [{ a: "提交申请", who: "我", ts: Date.now() - 86400e3 }] }
  ],
  seedTasks: [
    { id: "t1", title: "V2.3 版本需求文档定稿", owner: "林晓峰", due: "10-28", priority: "高", status: "done" },
    { id: "t2", title: "支付模块联调", owner: "王志强", due: "10-30", priority: "高", status: "doing" },
    { id: "t3", title: "首页改版视觉走查", owner: "李梦琪", due: "11-02", priority: "中", status: "doing" },
    { id: "t4", title: "竞品分析报告", owner: "林晓峰", due: "11-05", priority: "中", status: "todo" },
    { id: "t5", title: "新员工入职培训材料", owner: "刘婷", due: "11-08", priority: "低", status: "todo" },
    { id: "t6", title: "数据库索引优化", owner: "赵天宇", due: "10-31", priority: "高", status: "todo" }
  ],
  schedule: [
    { time: "09:30", title: "每日站会", tag: "会议" },
    { time: "11:00", title: "需求评审（V2.4）", tag: "会议" },
    { time: "14:00", title: "与销售部对齐方案", tag: "沟通" },
    { time: "16:30", title: "周报提交截止", tag: "待办" }
  ]
};

// ===== 本地存储 =====
window.OHStore = {
  key: "officehub_v1",
  data: null,
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.key)) || null; } catch (e) { this.data = null; }
    if (!this.data) {
      this.data = {
        chats: JSON.parse(JSON.stringify(OH_DATA.seedChats)),
        approvals: JSON.parse(JSON.stringify(OH_DATA.seedApprovals)),
        tasks: JSON.parse(JSON.stringify(OH_DATA.seedTasks)),
        attendance: {},          // "2024-10-28": {in:"09:02", out:"18:31"}
        readAnn: []
      };
      this.save();
    }
    return this.data;
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  reset() { try { localStorage.removeItem(this.key); } catch (e) {} this.load(); }
};
OHStore.load();

window.OHUtil = {
  $: (s, r) => (r || document).querySelector(s),
  $$: (s, r) => Array.from((r || document).querySelectorAll(s)),
  esc: s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
  today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; },
  fmtTime(ts) {
    const d = new Date(ts), now = new Date();
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (d.toDateString() === now.toDateString()) return hm;
    return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
  },
  id(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1e4); }
};