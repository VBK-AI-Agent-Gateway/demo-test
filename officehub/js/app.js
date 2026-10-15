// ===== OfficeHub 主逻辑 =====
const D = OH_DATA, U = OHUtil, S = OHStore;
const $ = U.$, $$ = U.$$;

// Toast / Modal
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.display = "none", 2200);
}
function openModal(html) {
  $("#modal").innerHTML = html;
  $("#modal-mask").style.display = "flex";
}
function closeModal() { $("#modal-mask").style.display = "none"; }
$("#modal-mask").addEventListener("click", e => { if (e.target.id === "modal-mask") closeModal(); });

// 视图切换
function showView(name) {
  $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
  $$(".rail-nav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (name === "work") renderWork();
  if (name === "contacts") renderContacts("");
  if (name === "attendance") renderAttendance();
  if (name === "announce") renderAnnounce();
  if (name === "approval" && window.renderApproval) renderApproval();
  if (name === "tasks" && window.renderTasks) renderTasks();
  if (name === "chat" && window.renderChat) renderChat();
}
document.addEventListener("click", e => {
  const nav = e.target.closest("[data-view]");
  if (nav) showView(nav.dataset.view);
  const go = e.target.closest("[data-go]");
  if (go) showView(go.dataset.go);
});

// 时钟
function tick() {
  const now = new Date();
  const s = now.toLocaleString("zh-CN", { weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  ["#clock", "#att-clock"].forEach(sel => { const el = $(sel); if (el) el.textContent = s; });
}
setInterval(tick, 1000); tick();

// ===== 工作台 =====
function renderWork() {
  const st = S.data;
  const hour = new Date().getHours();
  const greet = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  const pend = st.approvals.filter(a => a.status === "pending").length;
  const doing = st.tasks.filter(t => t.status === "doing").length;
  const att = st.attendance[U.today()];
  const banner = $(".banner");
  if (banner) banner.innerHTML = `👋 ${greet}，${D.me.name}。今天有 <b>${pend}</b> 项待办审批，<b>${doing}</b> 个进行中任务。`;
  $("#wd-pending").textContent = pend;
  $("#wd-tasks").textContent = doing;
  $("#wd-appr").textContent = pend;
  $("#wd-taskn").textContent = doing;
  $("#wd-chat").textContent = st.chats.length;
  $("#wd-clockin").textContent = att ? (att.in ? "✅ " + att.in + " 打卡" : "未打卡") : "未打卡";

  $("#wd-schedule").innerHTML = D.schedule.map(x =>
    `<div class="sch-item"><span class="t">${x.time}</span><span>${U.esc(x.title)}</span><span class="tag">${x.tag}</span></div>`).join("");

  $("#wd-announce").innerHTML = D.announcements.slice(0, 3).map(a =>
    `<div class="ann-mini" data-ann="${a.id}"><div class="ti">${U.esc(a.title)}</div><div class="mt">${a.from} · ${U.fmtTime(a.ts)}</div></div>`).join("");
}

// ===== 通讯录 =====
function renderContacts(kw) {
  kw = (kw || "").trim();
  const list = D.org.filter(p => p.id !== "u11" && (!kw || p.name.includes(kw) || p.title.includes(kw) || p.dept.includes(kw)));
  let html = "";
  D.depts.forEach(dep => {
    const ps = list.filter(p => p.dept === dep);
    if (!ps.length) return;
    html += `<div class="dept-h">🏢 ${dep}（${ps.length}）</div>`;
    html += ps.map(p => `
      <div class="person">
        <div class="pi"><span class="av">${p.avatar}</span>
          <div><div class="nm">${p.name} <span class="dot ${p.online ? "on" : ""}" style="display:inline-block;vertical-align:middle;margin-left:4px"></span></div>
          <div class="tt">${p.title} · ${p.dept}</div></div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn small" data-call="${p.id}">📞 ${p.phone || "拨打"}</button>
          <button class="btn small primary" data-msg="${p.id}">💬 发消息</button>
        </div>
      </div>`).join("");
  });
  $("#contact-tree").innerHTML = html || `<div class="empty">没有匹配的联系人</div>`;
}
$("#contact-search").addEventListener("input", e => renderContacts(e.target.value));
document.addEventListener("click", e => {
  const m = e.target.closest("[data-msg]");
  if (m && window.openChat) { showView("chat"); openChat("user", m.dataset.msg); }
  const c = e.target.closest("[data-call]");
  if (c) toast("📞 正在呼叫…（演示环境）");
  const a = e.target.closest("[data-ann]");
  if (a) showAnn(a.dataset.ann);
});

// ===== 考勤 =====
function renderAttendance() {
  const st = S.data, today = U.today();
  const d = new Date();
  $("#att-date").textContent = d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const rec = st.attendance[today] || {};
  $("#att-in").disabled = !!rec.in;
  $("#att-out").disabled = !rec.in || !!rec.out;
  $("#att-state").innerHTML = rec.in
    ? `上班打卡：<b>${rec.in}</b>${rec.out ? `　下班打卡：<b>${rec.out}</b>` : "　下班未打卡"}`
    : "今日尚未打卡，点击上方按钮打卡";

  const rows = Object.entries(st.attendance).sort((a, b) => b[0].localeCompare(a[0]));
  $("#att-records").innerHTML = rows.length
    ? rows.map(([day, r]) => `<div class="att-row"><span>${day}</span><span class="in">${r.in || "--:--"}</span><span class="out">${r.out || "--:--"}</span></div>`).join("")
    : `<div class="empty">暂无打卡记录</div>`;
}
$("#att-in").onclick = () => {
  const t = new Date().toTimeString().slice(0, 5);
  const today = U.today();
  S.data.attendance[today] = Object.assign(S.data.attendance[today] || {}, { in: t });
  S.save(); renderAttendance(); renderWork();
  toast(`✅ 上班打卡成功 ${t}` + (t > "09:30" ? "（迟到提醒：超过 09:30）" : ""));
};
$("#att-out").onclick = () => {
  const t = new Date().toTimeString().slice(0, 5);
  const today = U.today();
  S.data.attendance[today] = Object.assign(S.data.attendance[today] || {}, { out: t });
  S.save(); renderAttendance(); renderWork();
  toast(`🌙 下班打卡成功 ${t}`);
};

// ===== 公告 =====
function renderAnnounce() {
  const st = S.data;
  $("#announce-list").innerHTML = D.announcements.map(a => {
    const unread = !st.readAnn.includes(a.id);
    return `<div class="ann-card" data-ann="${a.id}">
      <h3>${unread ? '<span class="unread"></span>' : ""}${U.esc(a.title)}</h3>
      <div class="meta">${a.from} · ${U.fmtTime(a.ts)}</div>
      <p>${U.esc(a.body)}</p></div>`;
  }).join("");
}
function showAnn(id) {
  const a = D.announcements.find(x => x.id === id); if (!a) return;
  if (!S.data.readAnn.includes(id)) { S.data.readAnn.push(id); S.save(); }
  openModal(`<h3>📢 ${U.esc(a.title)}</h3>
    <div class="meta" style="color:var(--muted);font-size:13px;margin-bottom:12px">${a.from} · ${U.fmtTime(a.ts)}</div>
    <p style="font-size:14.5px;line-height:1.9">${U.esc(a.body)}</p>
    <div class="modal-acts"><button class="btn" onclick="closeModal()">关闭</button></div>`);
  renderAnnounce(); renderWork();
}

// ===== 设置 =====
$("#reset-data").onclick = () => {
  if (confirm("确定清空本机所有数据并恢复初始状态吗？")) {
    S.reset();
    toast("已恢复初始数据");
    location.reload();
  }
};

// 初始化
renderWork();
window.toast = toast; window.openModal = openModal; window.closeModal = closeModal; window.showView = showView;