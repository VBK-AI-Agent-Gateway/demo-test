// ===== 学情看板 + 结构化学情报告 =====
window.ST = {
  refresh() {
    const st = MTStore.data;
    document.getElementById("k-total").textContent = st.total;
    document.getElementById("k-acc").textContent = st.total ? Math.round(st.correct / st.total * 100) + "%" : "--%";
    document.getElementById("k-ax").textContent = st.axDone;

    // 失分类型 Top（按错因次数）
    const errs = Object.entries(st.errCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxErr = errs.length ? errs[0][1] : 1;
    document.getElementById("err-bars").innerHTML = errs.length
      ? errs.map(([k, v]) => `<div class="bar-row"><span class="nm">${k}</span><span class="bar bad"><i style="width:${Math.round(v / maxErr * 100)}%"></i></span><span class="vl">${v}</span></div>`).join("")
      : `<div class="empty">暂无失分记录</div>`;

    // 模块掌握
    document.getElementById("mod-bars").innerHTML = MD.modules.map(m => {
      const b = st.byMod[m.k];
      const pct = b && b.n ? Math.round(b.r / b.n * 100) : 0;
      return `<div class="bar-row"><span class="nm">${m.icon}${m.name}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="vl">${b && b.n ? pct + "%" : "—"}</span></div>`;
    }).join("");

    this.refreshDue();
    document.getElementById("wb-count").textContent = st.wrong.length;
  },
  refreshDue() {
    const due = WB.due().slice(0, 5);
    document.getElementById("due-list").innerHTML = due.length
      ? due.map(w => {
        const q = MD.questions.find(q => q.id === w.qid); if (!q) return "";
        return `<div class="due-i" onclick="WB.open()"><div>${q.type} · ${q.model}</div>
          <div class="mt">${w.errs[0] || ""} · <span class="due-tag">现在到期</span></div></div>`;
      }).join("")
      : `<div class="empty">${MTStore.data.wrong.length ? "暂无到期错题，按节奏推进中" : "暂无错题"}</div>`;
  },
  report() {
    const st = MTStore.data;
    const acc = st.total ? Math.round(st.correct / st.total * 100) : 0;
    const errs = Object.entries(st.errCount).sort((a, b) => b[1] - a[1]);
    const weakMods = MD.modules.map(m => {
      const b = st.byMod[m.k] || { n: 0, r: 0 };
      return { m, acc: b.n ? b.r / b.n : 1, n: b.n };
    }).filter(x => x.n > 0).sort((a, b) => a.acc - b.acc);
    const layerScore = k => {
      const recs = st.records || [];
      return "";
    };
    const axAttempts = Object.values(st.byMod).reduce((a, b) => a + b.n, 0);

    const weakest = errs.slice(0, 3).map(e => e[0]);
    const tasks = weakMods.slice(0, 3).map(x => `【${x.m.name}】${x.m.focus}`);
    if (errs.some(e => e[0].includes("分类"))) tasks.push("专项：多解分类讨论题 5 道（强化漏解检测）");
    if (errs.some(e => e[0].includes("踩分"))) tasks.push("规范：压轴大题按中考步骤抄写 2 题，对照踩分点");

    const html = `
      <span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
      <h3>📊 阶段培优学情报告</h3>
      <div class="report-sec"><h4>一、得分情况</h4>
        <p>累计完成 <b>${st.total}</b> 题，正确率 <b style="color:var(--brand2)">${acc}%</b>，压轴完成 <b>${st.axDone}</b> 道。
        目标：稳定 140+、冲刺 145+。当前${acc >= 80 ? "压轴稳定性良好，继续拔高" : "中档踩分与分类仍是主要失分点"}。</p></div>
      <div class="report-sec"><h4>二、失分模块统计</h4>
        ${weakMods.length ? "<ul>" + weakMods.map(x => `<li>${x.m.icon} ${x.m.name}：${x.n} 题 · 正确率 ${Math.round(x.acc * 100)}%</li>`).join("") + "</ul>" : "<p>暂无足够数据，继续训练。</p>"}</div>
      <div class="report-sec"><h4>三、失分类型统计</h4>
        ${errs.length ? "<ul>" + errs.slice(0, 6).map(([k, v]) => `<li>${k}：<b>${v}</b> 次</li>`).join("") + "</ul>" : "<p>暂无错因记录。</p>"}
        ${weakest.length ? `<p>主要痛点：<b style="color:var(--bad)">${weakest.join("、")}</b></p>` : ""}</div>
      <div class="report-sec"><h4>四、下一阶段专题突破任务</h4>
        <ul>${(tasks.length ? tasks : ["保持当前节奏，完成 1 轮综合限时小测"]).map(t => `<li>${t}</li>`).join("")}</ul></div>
      <div class="report-sec"><h4>模式与建议</h4>
        <p>当前模式：${T.mode === "sprint" ? "中考压轴专项冲刺（选择10/填空16/几何综合/二次函数/新定义）" : "新课同步培优（专题精讲→单元测评→错题复盘→变式强化）"}。
        ${st.wrong.length ? `错题本 ${st.wrong.length} 题，到期 ${WB.due().length} 题，请优先复盘。` : ""}</p></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">
        <button class="btn" onclick="MTStore.reset && (MTStore.reset(), location.reload())">清空学情数据</button>
        <button class="btn primary" onclick="document.getElementById('mask').style.display='none'">关闭</button>
      </div>`;
    document.getElementById("modal").innerHTML = html;
    document.getElementById("mask").style.display = "flex";
  }
};
document.getElementById("btn-report").onclick = () => ST.report();
document.getElementById("mask").addEventListener("click", e => { if (e.target.id === "mask") e.target.style.display = "none"; });

// 初始化看板
ST.refresh();