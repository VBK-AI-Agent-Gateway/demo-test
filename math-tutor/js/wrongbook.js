// ===== 错题本 + 艾宾浩斯复习 =====
window.MTStore = {
  key: "math_tutor_v1",
  data: null,
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.key)) || null; } catch (e) { this.data = null; }
    if (!this.data) {
      this.data = {
        total: 0, correct: 0, axDone: 0,
        byMod: {},                 // {mod:{n,r}}
        errCount: {},              // {错因标签: 次数}
        wrong: [],                 // {qid, errs, layer, ts, intervalIdx, nextAt, reviews}
        records: []
      };
      this.save();
    }
    return this.data;
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  reset() { try { localStorage.removeItem(this.key); } catch (e) {} this.load(); }
};
window.MTStore.load();

window.WB = {
  add(q, errs, layer) {
    const st = MTStore.data;
    const exist = st.wrong.find(w => w.qid === q.id);
    if (exist) {
      exist.errs = Array.from(new Set(exist.errs.concat(errs)));
      exist.intervalIdx = 0; exist.nextAt = Date.now(); exist.reviews = exist.reviews || 0;
    } else {
      st.wrong.push({ qid: q.id, errs, layer, ts: Date.now(), intervalIdx: 0, nextAt: Date.now(), reviews: 0 });
    }
    MTStore.save();
    document.getElementById("wb-count").textContent = st.wrong.length;
    window.ST && ST.refreshDue();
  },
  due() {
    const now = Date.now();
    return MTStore.data.wrong.filter(w => w.nextAt <= now);
  },
  // 复习一次 → 按艾宾浩斯推进间隔
  review(w, ok) {
    const st = MTStore.data;
    const it = st.wrong.find(x => x.qid === w.qid); if (!it) return;
    it.reviews = (it.reviews || 0) + 1;
    if (ok) {
      it.intervalIdx = Math.min(it.intervalIdx + 1, MD.reviewIntervals.length - 1);
      it.nextAt = Date.now() + MD.reviewIntervals[it.intervalIdx] * 3600e3;
      // 全部节奏走完 → 移出
      if (it.intervalIdx >= MD.reviewIntervals.length - 1 && it.reviews >= MD.reviewIntervals.length) {
        st.wrong = st.wrong.filter(x => x.qid !== w.qid);
        toast("🎉 该错题已掌握，移出错题本");
      }
    } else {
      it.intervalIdx = 0; it.nextAt = Date.now();
      it.errs = Array.from(new Set(it.errs.concat(["复习仍未掌握"])));
    }
    MTStore.save();
    document.getElementById("wb-count").textContent = st.wrong.length;
    window.ST && ST.refresh();
  },
  open() {
    const st = MTStore.data;
    const items = st.wrong.map(w => ({ w, q: MD.questions.find(q => q.id === w.qid) })).filter(x => x.q);
    const html = `
      <span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
      <h3>📕 错题本（${items.length} 题 · 到期 ${this.due().length}）</h3>
      <div style="color:var(--muted);font-size:12.5px;margin-bottom:14px">艾宾浩斯复习节奏：1h → 24h → 72h → 168h → 336h，复习时答案隐藏，独立重做后再展开。</div>
      ${items.length ? items.map(({ w, q }) => {
        const due = w.nextAt <= Date.now();
        const hrs = Math.max(0, Math.round((w.nextAt - Date.now()) / 3600e3));
        return `<div class="wb-item" id="wb-${w.qid}">
          <div class="wi-h">
            <span>${MD.modules.find(m => m.k === q.mod).icon} ${q.type} · ${w.layer}层</span>
            <span class="pill ${due ? "err" : "good"}">${due ? "🔴 今日到期" : `⏳ ${hrs}h 后复习`}</span>
          </div>
          <div class="wi-stem">${md(q.stem)}</div>
          <div class="wi-meta">错因：${w.errs.map(t => `<span class="pill err">${t}</span>`).join("")} ｜ 模型：${q.model} ｜ 已复习 ${w.reviews || 0} 次</div>
          <button class="btn small" onclick="WB.toggle('${w.qid}')">👀 独立重做（展开答案）</button>
          <div class="reveal">
            <div style="font-size:12.5px;color:var(--muted);margin:8px 0">标准答案：<b style="color:var(--brand2)">${md(q.answer)}</b></div>
            <div class="steps">${q.solution.map(s => `<div>${md(s)}</div>`).join("")}</div>
            <div style="font-size:13px;color:var(--warn);margin-top:8px">🔁 复盘设问：${md(MD.extensionQuestions[0])}</div>
            <div style="display:flex;gap:8px;margin-top:9px">
              <button class="btn small primary" onclick="WB.answer('${w.qid}',true)">✅ 已独立做对</button>
              <button class="btn small" onclick="WB.answer('${w.qid}',false)">❌ 仍没掌握</button>
            </div>
          </div>
        </div>`;
      }).join("") : `<div class="empty">错题本是空的，继续保持！</div>`}
    `;
    document.getElementById("modal").innerHTML = html;
    document.getElementById("mask").style.display = "flex";
  },
  toggle(qid) { document.getElementById("wb-" + qid).classList.toggle("open"); },
  answer(qid, ok) {
    const w = MTStore.data.wrong.find(x => x.qid === qid);
    if (w) this.review(w, ok);
    this.open();
  },
  // 单知识点汇总
  byModule(mod) {
    return MTStore.data.wrong.filter(w => { const q = MD.questions.find(q => q.id === w.qid); return q && q.mod === mod; });
  }
};
document.getElementById("wb-count").textContent = MTStore.data.wrong.length;
document.getElementById("btn-wrongbook").onclick = () => WB.open();
document.getElementById("mask").addEventListener("click", e => { if (e.target.id === "mask") e.target.style.display = "none"; });