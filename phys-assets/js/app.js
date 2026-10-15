// ===== 应用交互层 =====
const {TOPICS,MATERIAL_TYPES,KINDS,LEVELS,PLAN_PLACEHOLDER} = window.DATA;
const {generateMaterials} = window.GENERATOR;
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let state = {topic: TOPICS[0], kind: KINDS[0], level: LEVELS[1].id, selectedTypes: ["story","demo","board"], plan: "", lastResult: null};

function initControls(){
  const sel = $("#sel-topic");
  TOPICS.forEach(t=>{ const opt=document.createElement("option"); opt.value=t; opt.textContent=t; sel.appendChild(opt); });
  sel.value = state.topic;
  sel.addEventListener("change", e=>{ state.topic = e.target.value; });
  $("#in-custom").addEventListener("input", e=>{ if(e.target.value.trim()) state.topic = e.target.value.trim(); });
  $("#seg-kind").addEventListener("click", e=>{ if(e.target.dataset.k){ $$("#seg-kind button").forEach(b=>b.classList.remove("active")); e.target.classList.add("active"); state.kind = e.target.dataset.k; }});
  $("#seg-level").addEventListener("click", e=>{ if(e.target.dataset.l){ $$("#seg-level button").forEach(b=>b.classList.remove("active")); e.target.classList.add("active"); state.level = e.target.dataset.l; $("#level-meta").textContent = `当前：${state.level}`; }});
  $("#level-meta").textContent = `当前：${state.level}`;
  const ckTypes = $("#ck-types");
  MATERIAL_TYPES.forEach(t=>{ const label=document.createElement("label"); label.innerHTML = `<input type="checkbox" value="${t.id}"> <span class="ckd">${t.icon} ${t.name}</span>`; ckTypes.appendChild(label); });
  state.selectedTypes.forEach(id=>{ const cb=ckTypes.querySelector(`input[value="${id}"]`); if(cb) cb.checked=true; });
  ckTypes.addEventListener("change", ()=>{ state.selectedTypes = Array.from(ckTypes.querySelectorAll("input:checked")).map(c=>c.value); });
  $("#in-plan").placeholder = PLAN_PLACEHOLDER;
  $("#in-plan").addEventListener("input", e=>{ state.plan = e.target.value; });
}

$("#btn-gen").addEventListener("click", ()=>{
  if(state.selectedTypes.length===0){ showToast("请至少选择一类素材"); return; }
  const result = generateMaterials(state.topic, state.kind, state.level, state.selectedTypes, state.plan);
  state.lastResult = result;
  renderResult(result);
  saveToHistory(result);
});

function renderResult(result){
  $("#out-title").textContent = `素材预览：${result.topic} · ${result.kind} · ${result.level}`;
  let html = `<div class="idea"><b>💡 设计思路：</b>${result.designIdea}</div>`;
  html += `<div class="warn-strip">${result.planAlign}</div>`;
  result.materials.forEach(m=>{
    html += `<div class="mat"><div class="mat-h"><span>${m.icon} ${m.name}</span><span class="lv">${m.level}</span></div><div class="mat-b"><div class="ppt-note"><span class="ppt-tag">PPT</span>${m.pptNote}</div><div class="m-body" style="white-space:pre-wrap;margin-top:10px">${escapeHtml(m.content)}</div><div class="copy-b"><button onclick="copyMaterial('${m.id}')">📋 复制</button></div></div></div>`;
  });
  html += `<div class="warn-strip" style="margin-top:15px">📌 ${result.banner}</div>`;
  html += `<div class="ppt-note" style="margin-top:10px">${result.pptNote}</div>`;
  $("#output").innerHTML = html;
}

function escapeHtml(str){ return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

window.copyMaterial = function(id){
  if(!state.lastResult) return;
  const m = state.lastResult.materials.find(x=>x.id===id);
  if(!m) return;
  navigator.clipboard.writeText(`${m.pptNote}\n\n${m.content}`).then(()=>showToast("已复制到剪贴板"));
};

$("#btn-copy").addEventListener("click", ()=>{
  if(!state.lastResult){ showToast("请先生成素材"); return; }
  let text = `${state.lastResult.designIdea}\n\n${state.lastResult.planAlign}\n\n`;
  state.lastResult.materials.forEach(m=>{ text += `${m.pptNote}\n${m.content}\n\n`; });
  text += state.lastResult.banner;
  navigator.clipboard.writeText(text).then(()=>showToast("已复制全部素材"));
});

$("#btn-md").addEventListener("click", ()=>{
  if(!state.lastResult){ showToast("请先生成素材"); return; }
  const r = state.lastResult;
  let md = `# ${r.topic} 素材包\n\n${r.designIdea}\n\n${r.planAlign}\n\n`;
  r.materials.forEach(m=>{ md += `## ${m.icon} ${m.name}\n\n${m.pptNote}\n\n${m.content}\n\n---\n\n`; });
  md += r.banner;
  const blob = new Blob([md],{type:'text/markdown'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${r.topic}_素材包.md`; a.click();
});

$("#btn-print").addEventListener("click", ()=>{ window.print(); });

function saveToHistory(result){ try{ const hist=JSON.parse(localStorage.getItem('phys_assets_hist')||'[]'); hist.unshift({time:new Date().toISOString(),topic:result.topic,kind:result.kind,level:result.level,data:result}); localStorage.setItem('phys_assets_hist',JSON.stringify(hist.slice(0,50))); }catch(e){} }

$("#btn-history").addEventListener("click", ()=>{
  try{ const hist=JSON.parse(localStorage.getItem('phys_assets_hist')||'[]');
    let html = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span><h3>历史记录</h3>`;
    if(hist.length===0){ html += `<div style="color:var(--muted);text-align:center;padding:30px">暂无历史记录</div>`; }
    else{ hist.forEach((h,i)=>{ html += `<div class="hist-i" onclick="loadHistory(${i})"><div class="ht">${h.topic} · ${h.kind} · ${h.level}</div><div class="hm">${new Date(h.time).toLocaleString()}</div></div>`; }); }
    $("#modal").innerHTML = html; $("#mask").style.display = 'flex'; window.__hist = hist;
  }catch(e){}
});

window.loadHistory = function(idx){
  const h = window.__hist[idx]; if(!h) return;
  state.topic = h.topic; state.kind = h.kind; state.level = h.level; state.lastResult = h.data;
  $("#mask").style.display = 'none'; renderResult(h.data); showToast("已加载历史素材");
};

$("#btn-help").addEventListener("click", ()=>{
  const html = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span>
    <h3>使用说明</h3>
    <div class="help-li">1. 选择课型（新授课/复习课/实验课）</div>
    <div class="help-li">2. 选择课题或输入自定义课题</div>
    <div class="help-li">3. 选择学情层次（学困生/中等生/优等生）</div>
    <div class="help-li">4. 勾选需要的素材类型（可多选）</div>
    <div class="help-li">5. 可粘贴教案对齐教学目标</div>
    <div class="help-li">6. 点击「生成课堂素材」</div>
    <div class="help-li">7. 每个素材附PPT页建议，可直接复制到课件系统</div>
    <div class="help-li">8. 支持复制、导出MD、打印</div>
    <div class="help-li">⚠️ AI素材仅供辅助，请教师审核后使用</div>`;
  $("#modal").innerHTML = html; $("#mask").style.display = 'flex';
});

$("#mask").addEventListener("click", e=>{ if(e.target.id === 'mask') e.target.style.display = 'none'; });

function showToast(msg){ const t=$("#toast"); t.textContent=msg; t.style.display='block'; setTimeout(()=>{ t.style.display='none'; },2000); }

initControls();