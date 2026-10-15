// ===== 即时沟通 =====
let curChat = null; // {type:'user'|'group', id}

function chatTitle(c) {
  if (c.type === "group") { const g = D.groups.find(x => x.id === c.id); return g ? g.name : "群组"; }
  const p = D.org.find(x => x.id === c.id); return p ? p.name : "联系人";
}
function chatAvatar(c) {
  if (c.type === "group") return { cls: "av-g", txt: "群" };
  const p = D.org.find(x => x.id === c.id);
  return { cls: "", txt: p ? p.avatar : "?" };
}
function lastMsg(c) { return c.msgs.length ? c.msgs[c.msgs.length - 1] : null; }

function renderChatList() {
  const st = S.data;
  $("#chat-list").innerHTML = st.chats.map((c, i) => {
    const lm = lastMsg(c);
    const av = chatAvatar(c);
    const fromName = lm && c.type === "group" ? (D.org.find(x => x.id === lm.from) || {}).name + "：" : "";
    return `<div class="chat-li ${curChat && curChat.type === c.type && curChat.id === c.id ? "active" : ""}" data-ci="${i}">
      <span class="av ${av.cls}">${av.txt}</span>
      <div style="min-width:0;flex:1">
        <div class="nm">${U.esc(chatTitle(c))} <em>${lm ? U.fmtTime(lm.ts) : ""}</em></div>
        <div class="last">${lm ? U.esc(fromName + lm.text) : "暂无消息"}</div>
      </div></div>`;
  }).join("");
}

function renderMsgs() {
  const c = curChat;
  if (!c) { $("#chat-msgs").innerHTML = `<div class="empty">👈 从左侧选择联系人或群组</div>`; return; }
  const chat = S.data.chats.find(x => x.type === c.type && x.id === c.id);
  $("#chat-head").innerHTML = `${c.type === "group" ? "👥" : "💬"} ${U.esc(chatTitle(c))} <span style="font-weight:400;color:var(--muted);font-size:12.5px">${c.type === "group" ? D.groups.find(g => g.id === c.id).members.length + " 位成员" : (D.org.find(p => p.id === c.id) || {}).title || ""}</span>`;
  $("#chat-input").style.display = "flex";
  $("#chat-msgs").innerHTML = chat.msgs.map(m => {
    const mine = m.from === "u1";
    const p = D.org.find(x => x.id === m.from) || { name: m.from, avatar: "?" };
    return `<div class="msg ${mine ? "me" : ""}">
      <span class="av">${mine ? "我" : p.avatar}</span>
      <div><div>${!mine && c.type === "group" ? `<div class="who">${p.name}</div>` : ""}
      <div class="bub">${U.esc(m.text)}</div><div class="mt">${U.fmtTime(m.ts)}</div></div></div></div>`;
  }).join("") || `<div class="empty">还没有消息，发一条吧～</div>`;
  const box = $("#chat-msgs"); box.scrollTop = box.scrollHeight;
}

function openChat(type, id) {
  const st = S.data;
  let c = st.chats.find(x => x.type === type && x.id === id);
  if (!c) { c = { type, id, msgs: [] }; st.chats.unshift(c); S.save(); }
  curChat = { type, id };
  renderChatList(); renderMsgs();
}

function sendMsg() {
  const inp = $("#chat-text");
  const text = inp.value.trim();
  if (!text || !curChat) return;
  const chat = S.data.chats.find(x => x.type === curChat.type && x.id === curChat.id);
  chat.msgs.push({ from: "u1", text, ts: Date.now() });
  // 会话置顶
  S.data.chats = [chat, ...S.data.chats.filter(x => x !== chat)];
  S.save(); inp.value = "";
  renderChatList(); renderMsgs();
  replyLater(curChat);
}

// 简单自动回复，提升“可直接使用”体验
const REPLIES = {
  u3: ["收到，我看一下～", "好的，马上处理！", "接口已经改完了，你刷新下接口文档。"],
  u2: ["嗯，方案我看过，整体没问题。", "下午同步一下进展。", "记得更新看板任务状态。"],
  u6: ["好的，已经帮您登记。", "稍后把表单链接发您。"],
  u4: ["UI 已经走查完啦～", "这个交互我再优化一下。"],
  _default: ["收到！", "好的👌", "了解，稍后回复你。", "辛苦了～"]
};
function replyLater(c) {
  if (!c) return;
  let responderId;
  if (c.type === "group") {
    const g = D.groups.find(x => x.id === c.id);
    responderId = (g.members.filter(m => m !== "u1")[0]) || "u3";
  } else responderId = c.id;
  setTimeout(() => {
    const chat = S.data.chats.find(x => x.type === c.type && x.id === c.id);
    if (!chat) return;
    const pool = REPLIES[responderId] || REPLIES._default;
    chat.msgs.push({ from: responderId, text: pool[Math.floor(Math.random() * pool.length)], ts: Date.now() });
    S.save();
    if (curChat && curChat.type === c.type && curChat.id === c.id) { renderChatList(); renderMsgs(); }
    else { renderChatList(); updateBadge(); }
  }, 900 + Math.random() * 1500);
}

function updateBadge() {
  // 简化：有会话就显示会话数
  const b = $("#chat-badge");
  if (b) { b.style.display = ""; b.textContent = S.data.chats.length; }
}

function renderQuick() {
  $("#quick-people").innerHTML = D.org.filter(p => p.id !== "u11").slice(0, 6).map(p =>
    `<div class="qp" data-msg="${p.id}"><span class="av">${p.avatar}</span>${p.name}<span class="dot ${p.online ? "on" : ""}"></span></div>`).join("") +
    D.groups.map(g => `<div class="qp" data-grp="${g.id}"><span class="av av-g">群</span>${g.name}</div>`).join("");
}

document.addEventListener("click", e => {
  const li = e.target.closest(".chat-li");
  if (li) {
    const c = S.data.chats[+li.dataset.ci];
    if (c) { curChat = { type: c.type, id: c.id }; renderChatList(); renderMsgs(); }
  }
  const g = e.target.closest("[data-grp]");
  if (g) { showView("chat"); openChat("group", g.dataset.grp); }
  const m2 = e.target.closest("#quick-people [data-msg]");
  if (m2) { showView("chat"); openChat("user", m2.dataset.msg); }
});
$("#chat-send").onclick = sendMsg;
$("#chat-text").addEventListener("keydown", e => { if (e.key === "Enter") sendMsg(); });

function renderChat() { renderChatList(); renderMsgs(); renderQuick(); updateBadge(); }
window.openChat = openChat;