// ===== 任务看板 =====
const STATUSES = [
  { k: "todo", el: "#col-todo", cnt: "#cnt-todo" },
  { k: "doing", el: "#col-doing", cnt: "#cnt-doing" },
  { k: "done", el: "#col-done", cnt: "#cnt-done" }
];

function renderTasks() {
  const st = S.data;
  STATUSES.forEach(s => {
    const list = st.tasks.filter(t => t.status === s.k);
    $(s.cnt).textContent = list.length;
    $(s.el).innerHTML = list.map(t => `
      <div class="task" draggable="true" data-tid="${t.id}">
        <div class="tt">${U.esc(t.title)}</div>
        <div class="tm"><span>👤 ${U.esc(t.owner)}</span><span>📅 ${U.esc(t.due)}</span>
          <span class="pri ${t.priority}">${t.priority}</span></div>
        <div class="mv">
          ${t.status !== "todo" ? `<button data-mv="${t.id}:todo">← 待办</button>` : ""}
          ${t.status !== "doing" ? `<button data-mv="${t.id}:doing">进行中</button>` : ""}
          ${t.status !== "done" ? `<button data-mv="${t.id}:done">完成 ✓</button>` : `<button data-del="${t.id}">删除</button>`}
        </div>
      </div>`).join("") || `<div class="empty" style="padding:26px 6px;font-size:13px">暂无任务</div>`;
  });
}

function newTask() {
  const members = ["我"].concat(D.org.filter(p => p.id !== "u11").map(p => p.name));
  const d = new Date(Date.now() + 3 * 86400e3);
  openModal(`<h3>✅ 新建任务</h3>
    <div class="f-row"><label>任务标题</label><input id="tk-title" type="text" placeholder="如：完成支付模块联调" /></div>
    <div class="f-row"><label>负责人</label><select id="tk-owner">${members.map(n => `<option>${n}</option>`).join("")}</select></div>
    <div class="f-row"><label>截止日期</label><input id="tk-due" type="date" value="${d.toISOString().slice(0, 10)}" /></div>
    <div class="f-row"><label>优先级</label><select id="tk-pri"><option>高</option><option selected>中</option><option>低</option></select></div>
    <div class="modal-acts">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" id="tk-save">创建任务</button>
    </div>`);
  $("#tk-save").onclick = () => {
    const title = $("#tk-title").value.trim();
    if (!title) { toast("请填写任务标题"); return; }
    const due = $("#tk-due").value.slice(5).replace("-", "-") || "--";
    S.data.tasks.unshift({
      id: U.id("t"), title,
      owner: $("#tk-owner").value,
      due, priority: $("#tk-pri").value, status: "todo"
    });
    S.save(); closeModal(); renderTasks(); renderWork();
    toast("✅ 任务已创建");
  };
}
$("#task-new").onclick = newTask;

document.addEventListener("click", e => {
  const mv = e.target.closest("[data-mv]");
  if (mv) {
    const [id, status] = mv.dataset.mv.split(":");
    const t = S.data.tasks.find(x => x.id === id);
    if (t) {
      t.status = status; S.save(); renderTasks(); renderWork();
      toast(status === "done" ? "🎉 任务已完成" : "任务已移动到「" + (status === "todo" ? "待办" : "进行中") + "」");
    }
  }
  const del = e.target.closest("[data-del]");
  if (del) {
    if (confirm("删除该任务？")) {
      S.data.tasks = S.data.tasks.filter(x => x.id !== del.dataset.del);
      S.save(); renderTasks(); renderWork();
      toast("已删除");
    }
  }
});

// 拖拽流转
let dragId = null;
document.addEventListener("dragstart", e => {
  const t = e.target.closest(".task");
  if (t) { dragId = t.dataset.tid; e.dataTransfer.effectAllowed = "move"; }
});
document.addEventListener("dragover", e => {
  const col = e.target.closest(".col");
  if (col) { e.preventDefault(); col.style.outline = "2px dashed var(--blue)"; }
});
document.addEventListener("dragleave", e => {
  const col = e.target.closest(".col");
  if (col) col.style.outline = "";
});
document.addEventListener("drop", e => {
  const col = e.target.closest(".col");
  if (col && dragId) {
    e.preventDefault(); col.style.outline = "";
    const t = S.data.tasks.find(x => x.id === dragId);
    if (t && t.status !== col.dataset.status) {
      t.status = col.dataset.status; S.save(); renderTasks(); renderWork();
      toast("任务已移动");
    }
    dragId = null;
  }
});