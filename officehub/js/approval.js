// ===== 审批中心 =====
let apprTab = "mine";
const APPR_TYPES = [
  { k: "请假申请", icon: "🌴" },
  { k: "报销申请", icon: "💰" },
  { k: "加班申请", icon: "🌙" },
  { k: "出差申请", icon: "✈️" },
  { k: "物品领用", icon: "📦" }
];
const APPROVERS = ["陈静", "周雅", "刘婷", "赵天宇"];

function renderApproval() {
  $$("#appr-tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === apprTab));
  const st = S.data;
  let list = st.approvals.slice().sort((a, b) => b.ts - a.ts);
  if (apprTab === "todo") list = list.filter(a => a.status === "pending" && a.needMyAction !== false && a.fromMe !== true);
  if (apprTab === "done") list = list.filter(a => a.status !== "pending");
  if (apprTab === "mine") list = list.filter(a => a.fromMe !== false);

  $("#appr-list").innerHTML = list.length ? list.map(a => `
    <div class="appr-card">
      <div class="appr-top">
        <span class="ty">${apprIcon(a.type)} ${U.esc(a.type)}</span>
        <span class="pill ${a.status}">${a.status === "pending" ? "⏳ 审批中" : a.status === "approved" ? "✅ 已通过" : "❌ 已驳回"}</span>
      </div>
      <div class="appr-meta">
        <span>发起人：${a.fromMe === false ? U.esc(a.applicant || "同事") : "我"}</span>
        <span>审批人：${U.esc(a.submitTo)}</span>
        <span>${a.days ? "时长：" + U.esc(a.days) : ""}${a.amount ? "金额：" + U.esc(a.amount) : ""}</span>
        <span>${U.fmtTime(a.ts)}</span>
      </div>
      <div class="appr-reason">事由：${U.esc(a.reason)}</div>
      ${a.status === "pending" && apprTab === "todo" ? `
        <div class="appr-acts">
          <button class="btn danger" data-appr-no="${a.id}">驳回</button>
          <button class="btn primary" data-appr-yes="${a.id}">同意</button>
        </div>` : ""}
      <div class="timeline">
        ${a.history.map(h => `<div class="tl-i">${U.esc(h.a)} · ${U.esc(h.who)} · ${U.fmtTime(h.ts)}</div>`).join("")}
      </div>
    </div>`).join("") : `<div class="empty">这里暂时没有审批单 📭</div>`;
}
function apprIcon(t) { const x = APPR_TYPES.find(v => v.k === t); return x ? x.icon : "📋"; }

// 新建审批
function newApproval() {
  openModal(`<h3>📋 发起审批</h3>
    <div class="f-row"><label>审批类型</label>
      <select id="ap-type">${APPR_TYPES.map(t => `<option value="${t.k}">${t.icon} ${t.k}</option>`).join("")}</select></div>
    <div class="f-row" id="ap-days-f"><label>时长 / 天数（请假、加班填）</label><input id="ap-days" type="text" placeholder="如：2天 / 8小时" /></div>
    <div class="f-row" id="ap-amt-f" style="display:none"><label>报销金额</label><input id="ap-amt" type="text" placeholder="如：¥1,280" /></div>
    <div class="f-row"><label>审批人</label>
      <select id="ap-to">${APPROVERS.map(n => `<option>${n}</option>`).join("")}</select></div>
    <div class="f-row"><label>事由说明</label><textarea id="ap-reason" placeholder="请简要说明申请事由…"></textarea></div>
    <div class="modal-acts">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" id="ap-submit">提交申请</button>
    </div>`);

  const typeSel = $("#ap-type");
  const sync = () => {
    const v = typeSel.value;
    $("#ap-days-f").style.display = v.includes("请假") || v.includes("加班") || v.includes("出差") ? "" : "none";
    $("#ap-amt-f").style.display = v.includes("报销") || v.includes("领用") ? "" : "none";
  };
  typeSel.onchange = sync; sync();

  $("#ap-submit").onclick = () => {
    const reason = $("#ap-reason").value.trim();
    if (!reason) { toast("请填写事由说明"); return; }
    const type = typeSel.value;
    const ap = {
      id: U.id("ap"), type, reason,
      days: $("#ap-days").value.trim(),
      amount: $("#ap-amt").value.trim(),
      submitTo: $("#ap-to").value,
      ts: Date.now(), status: "pending", fromMe: true, needMyAction: false,
      history: [{ a: "提交申请", who: "我", ts: Date.now() }, { a: "等待 " + $("#ap-to").value + " 审批", who: "系统", ts: Date.now() }]
    };
    S.data.approvals.unshift(ap); S.save();
    closeModal(); apprTab = "mine"; renderApproval(); renderWork();
    toast("✅ 审批已提交，等待处理");
    // 模拟审批人在 4 秒后处理
    setTimeout(() => {
      const target = S.data.approvals.find(x => x.id === ap.id);
      if (!target || target.status !== "pending") return;
      target.status = "approved";
      target.history.push({ a: "已批准", who: target.submitTo, ts: Date.now() });
      target.fromMe = false; target.applicant = "我"; target.needMyAction = true;
      S.save();
      if ($("#view-approval").classList.contains("active")) renderApproval();
      toast("🎉 您的「" + ap.type + "」已通过审批");
    }, 4000);
  };
}
$("#appr-new").onclick = newApproval;

$$("#appr-tabs button").forEach(b => b.onclick = () => { apprTab = b.dataset.tab; renderApproval(); });

document.addEventListener("click", e => {
  const yes = e.target.closest("[data-appr-yes]");
  if (yes) handleApproval(yes.dataset.apprYes, "approved");
  const no = e.target.closest("[data-appr-no]");
  if (no) handleApproval(no.dataset.apprNo, "rejected");
});
function handleApproval(id, result) {
  const a = S.data.approvals.find(x => x.id === id); if (!a) return;
  a.status = result;
  a.history.push({ a: result === "approved" ? "已批准" : "已驳回", who: "我", ts: Date.now() });
  S.save(); renderApproval(); renderWork();
  toast(result === "approved" ? "✅ 已同意该申请" : "❌ 已驳回该申请");
}