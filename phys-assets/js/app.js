// ===== 应用交互层 =====
const {TOPICS,MATERIAL_TYPES,KINDS,LEVELS,PLAN_PLACEHOLDER,FALLBACK} = window.DATA;
const {generateMaterials} = window.GENERATOR;
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let state = {topic: TOPICS[0], kind: KINDS[0], level: LEVELS[1].id, selectedTypes: ["story","demo","board"], plan: "", reference: "", lastResult: null, editing: false};

// ---------- 初始化控件 ----------
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
  // 参考材料：粘贴 + 上传文件（P1 减少幻觉）
  $("#in-ref").addEventListener("input", e=>{ state.reference = e.target.value; });
  $("#in-file").addEventListener("change", e=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{ state.reference = String(r.result).slice(0,4000); $("#in-ref").value = state.reference; showToast(`已载入参考材料 ${state.reference.length} 字`); };
    r.readAsText(f);
  });
}

// ---------- 生成 ----------
$("#btn-gen").addEventListener("click", ()=>{
  if(state.selectedTypes.length===0){ showToast("请至少选择一类素材"); return; }
  const result = generateMaterials(state.topic, state.kind, state.level, state.selectedTypes, state.plan, state.reference);
  state.lastResult = result;
  if(!result.ok){ renderError(result); return; }
  renderResult(result);
  saveToHistory(result);
});

// ===== LLM 异常兜底页面 =====
function renderError(result){
  $("#out-title").textContent = `生成结果：${result.topic}`;
  $("#output").innerHTML = `<div class="err-card">
    <div class="err-t">${FALLBACK.errTitle}</div>
    <div class="err-m">${escapeHtml(result.error)}</div>
    <div class="err-h">${FALLBACK.errMsg}</div>
    <button class="btn primary" onclick="document.getElementById('btn-gen').click()">${FALLBACK.retry}</button>
    <div class="err-hint">提示：可缩短教参、换课题、或稍后再试。</div></div>`;
}

function renderResult(result){
  $("#out-title").textContent = `素材预览：${result.topic} · ${result.kind} · ${result.level}`;
  let html = `<div class="idea"><b>💡 设计思路：</b>${result.designIdea}</div>`;
  html += `<div class="warn-strip">${result.planAlign}</div>`;
  result.materials.forEach(m=>{
    html += `<div class="mat"><div class="mat-h"><span>${m.icon} ${m.name}</span><span class="lv">${m.level}</span></div><div class="mat-b"><div class="ppt-note"><span class="ppt-tag">PPT</span>${m.pptNote}</div><div class="m-body" data-id="${m.id}" style="white-space:pre-wrap;margin-top:10px">${escapeHtml(m.content)}</div><div class="copy-b"><button class="btn-edit" data-id="${m.id}">✏️ 编辑</button><button onclick="copyMaterial('${m.id}')">📋 复制</button><button class="btn-fav" data-id="${m.id}">⭐ 收藏</button></div></div></div>`;
  });
  html += `<div class="warn-strip" style="margin-top:15px">📌 ${result.banner}</div>`;
  html += `<div class="ppt-note" style="margin-top:10px">${result.pptNote}</div>`;
  $("#output").innerHTML = html;
  // 0 在线编辑 + 单模块复制 + 收藏
  $$("#output .btn-edit").forEach(b=>b.addEventListener("click",()=>toggleEdit(b.dataset.id)));
  $$("#output .btn-fav").forEach(b=>b.addEventListener("click",()=>favMaterial(b.dataset.id)));
}
function toggleEdit(id){
  const el = $(`#output .m-body[data-id="${id}"]`);
  if(!el) return;
  const on = el.isContentEditable;
  el.contentEditable = !on;
  el.classList.toggle("editing", !on);
  const btn = $(`#output .btn-edit[data-id="${id}"]`);
  if(btn) btn.textContent = !on ? "💾 保存" : "✏️ 编辑";
  if(on){ // 保存回 state
    const m = state.lastResult.materials.find(x=>x.id===id);
    if(m){ m.content = el.innerText; }
    showToast("已保存编辑");
  } else { el.focus(); showToast("进入编辑，改完点保存"); }
}

function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
window.copyMaterial = function(id){
  if(!state.lastResult) return;
  const m = state.lastResult.materials.find(x=>x.id===id);
  if(!m) return;
  navigator.clipboard.writeText(`${m.pptNote}\n\n${m.content}`).then(()=>showToast("已复制该模块"));
};
// ===== P2 素材收藏 =====
window.favMaterial = function(id){
  if(!state.lastResult) return;
  const m = state.lastResult.materials.find(x=>x.id===id); if(!m) return;
  try{ const fav=JSON.parse(localStorage.getItem('pa_fav')||'[]');
    if(fav.some(f=>f.name===m.name&&f.content===m.content)){ showToast("已收藏过"); return; }
    fav.unshift({name:m.name,content:m.content,topic:state.lastResult.topic,time:new Date().toISOString()});
    localStorage.setItem('pa_fav',JSON.stringify(fav.slice(0,200))); showToast("已收藏到素材库 ⭐");
  }catch(e){ showToast("收藏失败"); }
};

// 复制全部
$("#btn-copy").addEventListener("click", ()=>{
  if(!state.lastResult||!state.lastResult.ok){ showToast("请先生成素材"); return; }
  let text = `${state.lastResult.designIdea}\n\n${state.lastResult.planAlign}\n\n`;
  state.lastResult.materials.forEach(m=>{ text += `${m.pptNote}\n${m.content}\n\n`; });
  text += state.lastResult.banner;
  navigator.clipboard.writeText(text).then(()=>showToast("已复制全部素材"));
});

// ===== P2 导出完整备课包（教案+课件脚本+全部素材）=====
$("#btn-md").addEventListener("click", exportPack);
function exportPack(){
  if(!state.lastResult||!state.lastResult.ok){ showToast("请先生成素材"); return; }
  const r = state.lastResult;
  let md = `# ${r.topic} 完整备课包\n\n## 一、教案（基础信息）\n- 课题：${r.topic}\n- 课型：${r.kind}\n- 学情：${r.level}\n- 教案要点：${state.plan||"（未提供）"}\n\n> ${r.planAlign}\n\n## 二、课件脚本（PPT页规划）\n`;
  MATERIAL_TYPES.forEach(t=>{ if(r.materials.some(m=>m.id===t.id)) md += `- ${t.page}：${t.name}\n`; });
  md += `\n## 三、全部课堂素材\n\n`;
  r.materials.forEach(m=>{ md += `### ${m.icon} ${m.name}（${m.pptPage}）\n\n${m.content}\n\n---\n\n`; });
  md += `## 四、参考材料\n\n${state.reference||"（未上传）"}\n\n> ${r.banner}`;
  const blob = new Blob([md],{type:'text/markdown'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${r.topic}_完整备课包.md`; a.click();
  showToast("已导出备课包");
}
$("#btn-print").addEventListener("click", ()=>{ window.print(); });

// ===== P1 历史记录 / 备课工程保存 =====
function saveToHistory(result){ try{ const hist=JSON.parse(localStorage.getItem('pa_hist')||'[]'); hist.unshift({time:new Date().toISOString(),topic:result.topic,kind:result.kind,level:result.level,data:result}); localStorage.setItem('pa_hist',JSON.stringify(hist.slice(0,50))); }catch(e){} }
$("#btn-save-proj").addEventListener("click", ()=>{
  if(!state.lastResult||!state.lastResult.ok){ showToast("请先生成素材再保存工程"); return; }
  const name = (state.lastResult.topic+"_"+state.kind)+"_"+new Date().toLocaleDateString();
  try{ const pr=JSON.parse(localStorage.getItem('pa_proj')||'[]');
    pr.unshift({name,time:new Date().toISOString(),state:{topic:state.topic,kind:state.kind,level:state.level,selectedTypes:state.selectedTypes,plan:state.plan,reference:state.reference},data:state.lastResult});
    localStorage.setItem('pa_proj',JSON.stringify(pr.slice(0,30))); showToast("已保存备课工程：" + name);
  }catch(e){ showToast("保存失败"); }
});
$("#btn-history").addEventListener("click", ()=>{
  const hist=JSON.parse(localStorage.getItem('pa_hist')||'[]');
  const proj=JSON.parse(localStorage.getItem('pa_proj')||'[]');
  const fav=JSON.parse(localStorage.getItem('pa_fav')||'[]');
  let html = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span><h3>历史 / 工程 / 收藏</h3>`;
  html += `<div class="sec-t">📂 备课工程</div>`;
  if(!proj.length) html += `<div class="mut">暂无工程</div>`;
  proj.forEach((p,i)=>{ html += `<div class="hist-i"><div class="ht">${p.name}</div><div class="hm">${new Date(p.time).toLocaleString()} <button onclick="loadProj(${i})">加载</button> <button onclick="delProj(${i})">删除</button></div></div>`; });
  html += `<div class="sec-t">🕘 历史记录</div>`;
  if(!hist.length) html += `<div class="mut">暂无历史</div>`;
  hist.forEach((h,i)=>{ html += `<div class="hist-i" onclick="loadHistory(${i})"><div class="ht">${h.topic} · ${h.kind} · ${h.level}</div><div class="hm">${new Date(h.time).toLocaleString()}</div></div>`; });
  html += `<div class="sec-t">⭐ 素材收藏库（${fav.length}）</div>`;
  if(!fav.length) html += `<div class="mut">暂无收藏，点击素材下方「收藏」按钮</div>`;
  fav.forEach((f,i)=>{ html += `<div class="hist-i"><div class="ht">${f.name}</div><div class="hm">${f.topic} · ${new Date(f.time).toLocaleString()} <button onclick="copyFav(${i})">复制</button></div></div>`; });
  $("#modal").innerHTML = html; $("#mask").style.display='flex'; window.__hist=hist; window.__proj=proj; window.__fav=fav;
});
window.loadHistory = function(idx){ const h=window.__hist[idx]; if(!h) return; state.topic=h.topic;state.kind=h.kind;state.level=h.level;state.lastResult=h.data; $("#mask").style.display='none'; renderResult(h.data); showToast("已加载历史素材"); };
window.loadProj = function(idx){ const p=window.__proj[idx]; if(!p) return; Object.assign(state,p.state); state.lastResult=p.data; $("#mask").style.display='none'; renderResult(p.data); showToast("已加载备课工程："+p.name); };
window.delProj = function(idx){ const pr=window.__proj; pr.splice(idx,1); localStorage.setItem('pa_proj',JSON.stringify(pr)); showToast("已删除"); $("#btn-history").click(); };
window.copyFav = function(idx){ const f=window.__fav[idx]; if(f) navigator.clipboard.writeText(f.content).then(()=>showToast("已复制收藏素材")); };

// ===== 0 Agent 提示词后台管理 =====
$("#btn-prompts").addEventListener("click", ()=>{
  const prompts = window.GENERATOR.getPrompts();
  let html = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span><h3>⚙️ Agent 提示词后台</h3>
  <div class="mut" style="margin-bottom:10px">占位符：{topic}{kind}{level}{plan}{reference}；改完点保存，立即生效。</div>`;
  prompts.forEach((p,i)=>{
    html += `<div class="prompt-i"><label>${p.name}（${p.id}）</label><textarea data-i="${i}" rows="3">${p.tpl}</textarea></div>`;
  });
  html += `<button class="btn primary" id="btn-save-prompts">💾 保存提示词</button> <button class="btn" id="btn-reset-prompts">恢复默认</button>`;
  $("#modal").innerHTML = html; $("#mask").style.display='flex';
  $("#btn-save-prompts").onclick = ()=>{
    const arr = Array.from($$("#modal textarea")).map((t,i)=>({id:prompts[i].id,name:prompts[i].name,tpl:t.value}));
    localStorage.setItem('pa_prompts',JSON.stringify(arr)); showToast("提示词已保存并生效"); $("#mask").style.display='none';
  };
  $("#btn-reset-prompts").onclick = ()=>{ localStorage.removeItem('pa_prompts'); showToast("已恢复默认提示词"); $("#mask").style.display='none'; };
});

$("#btn-help").addEventListener("click", ()=>{
  $("#modal").innerHTML = `<span class="close" onclick="document.getElementById('mask').style.display='none'">×</span><h3>使用说明</h3>
  <div class="help-li">1. 选课型/课题/学情 → 勾素材 → 可粘贴教案、上传教参 → 生成</div>
  <div class="help-li">2. 每个素材：✏️在线编辑 / 📋单模块复制 / ⭐收藏</div>
  <div class="help-li">3. 🗂 保存备课工程、查看历史与收藏</div>
  <div class="help-li">4. ⚙️ 提示词后台可改 Agent 模板</div>
  <div class="help-li">5. ⬇ 导出完整备课包（教案+课件脚本+素材）</div>
  <div class="help-li">6. ⚠️ AI 生成异常时页面会给出兜底提示与重试</div>
  <div class="help-li">⚠️ AI素材仅供辅助，请教师审核后使用</div>`;
  $("#mask").style.display='flex';
});
$("#mask").addEventListener("click", e=>{ if(e.target.id === 'mask') e.target.style.display = 'none'; });
function showToast(msg){ const t=$("#toast"); t.textContent=msg; t.style.display='block'; setTimeout(()=>{ t.style.display='none'; },2000); }
window.addEventListener("error", ()=>{ if($("#output")) showToast("页面异常，已兜底捕获"); });

initControls();