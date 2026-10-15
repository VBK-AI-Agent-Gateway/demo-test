/* ============================================================
   War3 TD - 渲染 + 交互 + UI 控制
   ============================================================ */
(function(){
"use strict";
var W=window.WAR3; if(!W) return;
var G=W.G, $=W.$, $$=W.$$;
var cv=$("#cv"), ctx=cv.getContext("2d");

/* ================= 画布尺寸自适应 ================= */
var W_LOGIC=W.COLS*W.CELL, H_LOGIC=W.ROWS*W.CELL;
function fitCanvas(){
  var stage=cv.parentElement;
  var w=stage.clientWidth;
  cv.width=w*devicePixelRatio;
  cv.height=(w*H_LOGIC/W_LOGIC)*devicePixelRatio;
  cv.style.height=(w*H_LOGIC/W_LOGIC)+"px";
  ctx.setTransform(devicePixelRatio*w/W_LOGIC,0,0,devicePixelRatio*w/W_LOGIC,0,0);
}
window.addEventListener("resize",fitCanvas);

/* ================= 绘制 ================= */
function drawMap(){
  // 草地
  for(var y=0;y<W.ROWS;y++){
    for(var x=0;x<W.COLS;x++){
      var c=W.MAP[y][x];
      if(c==="1"||c==="2"||c==="3"){
        ctx.fillStyle=(c==="2")?"#6b4f2a":(c==="3")?"#7a1f1f":"#8a6b42";
        ctx.fillRect(x*W.CELL,y*W.CELL,W.CELL,W.CELL);
        ctx.fillStyle="rgba(0,0,0,.12)";
        ctx.fillRect(x*W.CELL,y*W.CELL,W.CELL,2);
      } else if(c==="X"){
        ctx.fillStyle="#3f4a3a";
        ctx.fillRect(x*W.CELL,y*W.CELL,W.CELL,W.CELL);
      } else {
        ctx.fillStyle=((x+y)%2)?"#2d4a2d":"#315231";
        ctx.fillRect(x*W.CELL,y*W.CELL,W.CELL,W.CELL);
      }
      ctx.strokeStyle="rgba(0,0,0,.18)";
      ctx.strokeRect(x*W.CELL,y*W.CELL,W.CELL,W.CELL);
    }
  }
  // 起点/基地标记
  ctx.font="24px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("🚩", W.WAYPOINTS[0].x, W.WAYPOINTS[0].y);
  var last=W.WAYPOINTS[W.WAYPOINTS.length-1];
  ctx.fillText("🏰", last.x, last.y);
}
function drawRange(t){
  ctx.beginPath();
  ctx.arc(t.x,t.y,t.range,0,Math.PI*2);
  ctx.fillStyle="rgba(74,163,255,.14)"; ctx.fill();
  ctx.strokeStyle="rgba(74,163,255,.7)"; ctx.lineWidth=2; ctx.stroke();
}
function drawBuildGhost(){
  if(!G.build) return;
  var mx=G.ghostX, my=G.ghostY;
  if(mx===undefined) return;
  var def=W.TMAP[G.build];
  var ok=W.MAP[my]&&W.MAP[my][mx]==="0"&&G.gold>=def.cost&&
    !G.towers.some(function(t){return t.gx===mx&&t.gy===my;});
  var cx=mx*W.CELL+W.CELL/2, cy=my*W.CELL+W.CELL/2;
  ctx.beginPath(); ctx.arc(cx,cy,def.range,0,Math.PI*2);
  ctx.fillStyle="rgba(102,187,106,.14)"; ctx.fill();
  ctx.strokeStyle=ok?"#66bb6a":"#ef5350"; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
  ctx.font="26px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.globalAlpha=.8; ctx.fillText(def.icon,cx,cy); ctx.globalAlpha=1;
}
function drawTower(t){
  var d=t.tDef;
  ctx.fillStyle="#1e2a3a";
  ctx.beginPath();
  ctx.arc(t.x,t.y,17,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=t===G.sel?"#f0b429":"#4aa3ff";
  ctx.lineWidth=t===G.sel?3:2;
  ctx.stroke();
  ctx.font="20px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(d.icon,t.x,t.y);
  // 等级星
  if(t.level>1){
    ctx.font="9px sans-serif"; ctx.fillStyle="#ffd166";
    ctx.fillText("★".repeat(Math.min(t.level,6)),t.x,t.y+24);
  }
  // 装备点
  var filled=(t.items||[]).filter(Boolean).length;
  if(filled){
    ctx.fillStyle="#4aa3ff";
    ctx.beginPath(); ctx.arc(t.x+14,t.y-14,5+Math.min(filled,6),0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff"; ctx.font="8px sans-serif";
    ctx.fillText(filled,t.x+14,t.y-14);
  }
}
function drawEnemy(e){
  if(e.dead||e.delay>0) return;
  var r=e.boss?16:(e.type==="tank"?13:e.fly?10:9);
  // 飞行阴影
  if(e.fly){ ctx.fillStyle="rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(e.x,e.y+8,r*.8,r*.35,0,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle=e.stunT>0?"#9e9e9e":e.slowT>0?"#8ecbff":e.boss?"#b388ff":e.type==="tank"?"#a1887f":e.fly?"#ce93d8":"#ef9a9a";
  ctx.beginPath();
  if(e.fly){ // 菱形
    ctx.moveTo(e.x,e.y-r); ctx.lineTo(e.x+r,e.y); ctx.lineTo(e.x,e.y+r); ctx.lineTo(e.x-r,e.y); ctx.closePath();
  } else { ctx.arc(e.x,e.y,r,0,Math.PI*2); }
  ctx.fill();
  ctx.strokeStyle=e.boss?"#ffd54f":"rgba(0,0,0,.5)"; ctx.lineWidth=e.boss?3:1.5; ctx.stroke();
  // 眩晕/诅咒标
  if(e.stunT>0){ctx.font="11px serif";ctx.textAlign="center";ctx.fillText("💫",e.x,e.y-r-8);}
  if(e.curseT>0){ctx.font="11px serif";ctx.textAlign="center";ctx.fillText("☠️",e.x+r,e.y-r);}
  // 血条
  var bw=e.boss?34:22, bh=e.boss?6:4;
  ctx.fillStyle="#000"; ctx.fillRect(e.x-bw/2,e.y-r-bh-3,bw,bh);
  var pct=Math.max(0,e.hp/e.maxHp);
  ctx.fillStyle=pct>0.5?"#66bb6a":pct>0.25?"#ffb300":"#ef5350";
  ctx.fillRect(e.x-bw/2,e.y-r-bh-3,bw*pct,bh);
  // 护甲标识
  ctx.fillStyle="rgba(0,0,0,.65)"; ctx.fillRect(e.x-14,e.y+r+1,28,11);
  ctx.fillStyle="#fff"; ctx.font="8px sans-serif"; ctx.textAlign="center";
  ctx.fillText(W.ARM[e.armor],e.x,e.y+r+7);
}
function drawBullet(b){
  var p=b.t/b.dur;
  var x=b.x+(b.tx-b.x)*p, y=b.y+(b.ty-b.y)*p;
  ctx.fillStyle=b.color;
  ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
}
function drawSummon(s){
  ctx.font="16px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.globalAlpha=.9; ctx.fillText("💀",s.x,s.y); ctx.globalAlpha=1;
  ctx.fillStyle="#000"; ctx.fillRect(s.x-10,s.y-15,20,3);
  ctx.fillStyle="#66bb6a"; ctx.fillRect(s.x-10,s.y-15,20*Math.max(0,s.hp/60),3);
}
function drawFX(fx){
  var p=fx.t/fx.dur;
  if(fx.kind==="pop"){
    ctx.globalAlpha=1-p;
    ctx.font="bold 13px sans-serif"; ctx.textAlign="center";
    ctx.fillStyle=fx.color; ctx.fillText(fx.txt,fx.x,fx.y-14-p*18);
    ctx.globalAlpha=1;
  } else if(fx.kind==="hit"){
    ctx.globalAlpha=1-p;
    ctx.font="11px sans-serif"; ctx.textAlign="center";
    ctx.fillStyle="#ffe082"; ctx.fillText(fx.txt,fx.x+10,fx.y-10-p*10);
    ctx.globalAlpha=1;
  } else if(fx.kind==="bolt"){
    ctx.globalAlpha=1-p;
    ctx.strokeStyle="#ffe082"; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(fx.x,fx.y);
    var mx=(fx.x+fx.x2)/2+(Math.random()-.5)*14, my=(fx.y+fx.y2)/2+(Math.random()-.5)*14;
    ctx.lineTo(mx,my); ctx.lineTo(fx.x2,fx.y2); ctx.stroke();
    ctx.globalAlpha=1;
  } else if(fx.kind==="ring"){
    ctx.globalAlpha=1-p;
    ctx.strokeStyle=fx.color; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(fx.x,fx.y,fx.r*p,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=1;
  }
}
function draw(){
  ctx.clearRect(0,0,W_LOGIC,H_LOGIC);
  drawMap();
  if(G.sel) drawRange(G.sel);
  G.towers.forEach(drawTower);
  G.summons.forEach(drawSummon);
  G.enemies.forEach(drawEnemy);
  G.bullets.forEach(drawBullet);
  G.effects.forEach(drawFX);
  drawBuildGhost();
}

/* ================= 更新 ================= */
var ultimateCd=0;
function update(dt){
  if(G.paused||G.over) return;
  // 敌人
  G.enemies.forEach(function(e){
    W.moveAlong(e,dt);
    if(e.slowT>0)e.slowT-=dt;
    if(e.curseT>0)e.curseT-=dt;
    if(e.dotT>0){e.dotT-=dt;e.hp-=e.dotDps*dt;if(e.hp<=0&&!e.dead)W.killEnemy(e,null);}
    if(e.bleedT>0)e.bleedT-=dt;
  });
  G.enemies=G.enemies.filter(function(e){return !e.dead;});
  // 骷髅
  G.summons.forEach(function(s){
    if(s.delay>0){s.delay-=dt;return;}
    s.cd-=dt;
    // 找路最近敌人阻挡
    var tgt=G.enemies.filter(function(e){return !e.dead;})
      .sort(function(a,b){return (a.seg*W.CELL+a.t*W.CELL)-(b.seg*W.CELL+b.t*W.CELL);})[0];
    if(tgt){
      var dd=W.dist(s,tgt);
      if(dd>26){
        var sp=60*dt;
        s.x+=(tgt.x-s.x)/dd*sp; s.y+=(tgt.y-s.y)/dd*sp;
      } else if(s.cd<=0){
        s.cd=1; tgt.hp-=s.atk; if(tgt.hp<=0&&!tgt.dead)W.killEnemy(tgt,null);
      }
    }
  });
  // 塔攻击
  G.towers.forEach(function(t){
    var d=t.tDef;
    // 光环给周围塔加攻速已在 recalc; 这里 tick
    W.auraTick(t,dt);
    if(d.dmg===0) return;
    t.cd-=dt;
    if(t.cd>0) return;
    // 寻敌: 路径最前
    var best=null,bestScore=-1;
    G.enemies.forEach(function(e){
      if(e.dead||e.delay>0) return;
      var dd=W.dist(t,e);
      if(dd>t.range) return;
      var score=e.seg*W.CELL+e.t*W.CELL;
      if(score>bestScore){bestScore=score;best=e;}
    });
    if(best){
      t.cd=t.stats.interval/(1+t.stats.auraAs);
      W.towerFire(t,best);
    }
  });
  // 英雄塔终极技能
  var heroTowers=G.towers.filter(function(t){return t.tDef.ultimate;});
  heroTowers.forEach(function(hero){
    var d=hero.tDef;
    hero.ultCd=(hero.ultCd||0)-dt;
    if(hero.ultCd>0||!G.enemies.length) return;
    if(d.ultimate==="blizzard"){
      hero.ultCd=8;
      W.fxRing(hero.x,hero.y,260,"#8ecbff");
      G.enemies.forEach(function(e){ if(W.dist(hero,e)<=260) W.dealDamage(e,80,hero,false); });
      W.addLog("🌩️ 大法师·暴风雪 肆虐全场!","good");
    } else if(d.ultimate==="holystorm"){
      hero.ultCd=10;
      W.fxRing(hero.x,hero.y,300,"#fff59d");
      G.enemies.forEach(function(e){ if(W.dist(hero,e)<=300) W.dealDamage(e,110,hero,false); });
      G.hp=Math.min(G.maxHp,G.hp+3);
      if(d.summonWater && G.summons.length<7)
        G.summons.push({x:hero.x+14,y:hero.y+14,seg:0,t:0,hp:90,atk:16,cd:0,water:true});
      W.addLog("🛡️ 圣骑士·神圣风暴 + 水元素!","good");
    } else if(d.ultimate==="metamorph"){
      hero.ultCd=12;
      var dur=6; hero.metaT=dur;
      W.fxRing(hero.x,hero.y,140,"#ce93d8");
      G.enemies.forEach(function(e){ if(W.dist(hero,e)<=140) W.dealDamage(e,90,hero,true); });
      W.addLog("😈 恶魔猎手·变身刀扇!","good");
    } else if(d.ultimate==="bladestorm"){
      hero.ultCd=14;
      W.fxRing(hero.x,hero.y,220,"#ff8a65");
      G.enemies.forEach(function(e){ if(W.dist(hero,e)<=220){ W.dealDamage(e,150,hero,true); } });
      W.addLog("👺 剑圣·剑刃风暴!","warn");
    } else if(d.ultimate==="deathdecay"){
      hero.ultCd=16;
      W.fxRing(hero.x,hero.y,999,"#b388ff");
      G.enemies.forEach(function(e){ if(!e.dead) W.dealDamage(e,e.maxHp*0.12,hero,false); });
      W.addLog("☠️ 巫妖·死亡凋零 全场 -12% HP!","warn");
    }
    if(hero.metaT>0) hero.metaT-=dt;
  });
  // 诅咒光环 (含 Miss 概率: 诅咒塔范围怪物 15% 攻击落空, 简化为缓速)
  G.towers.forEach(function(t){
    if(t.tDef.special!=="curse") return;
    G.enemies.forEach(function(e){
      if(!e.dead&&W.dist(t,e)<=t.stats.range){
        e.curseT=3; e.curseVal=Math.max(e.curseVal,0.25);
        e.curseMiss=(e.curseMiss||0.15);
      }
    });
  });
  // 兽族狂暴: 残血怪物受塔打击更快? —— 换成: 兽族塔对残血+伤害(已在 execute); 狂暴=牛头人/巨魔相邻叠攻速
  G.towers.forEach(function(t){
    if(t.raceOrc!==true && t.tDef.race!=="兽族") return;
    var near=G.towers.filter(function(o){return o!==t&&o.tDef.race==="兽族"&&W.dist(o,t)<150;}).length;
    t.stats.auraAs=Math.min(0.6,(t.stats.auraAs||0)+near*0.05);
  });
  // 毁灭之角光环: 周围塔附带混沌(视觉)
  // 子弹/特效
  G.bullets.forEach(function(b){b.t+=dt;});
  G.bullets=G.bullets.filter(function(b){return b.t<b.dur;});
  G.effects.forEach(function(f){f.t+=dt;});
  G.effects=G.effects.filter(function(f){return f.t<f.dur;});
  // 波次检查
  W.checkWaveEnd();
  W.checkOver();
}

/* ================= 主循环 ================= */
var last=0;
function loop(ts){
  var dt=Math.min(0.05,(ts-last)/1000||0); last=ts;
  var steps=G.speed;
  for(var i=0;i<steps;i++) update(dt);
  draw();
  syncUI();
  requestAnimationFrame(loop);
}

/* ================= UI 同步 ================= */
function syncUI(){
  $("#gold").textContent=Math.floor(G.gold);
  $("#wood").textContent=Math.floor(G.wood);
  $("#hp").textContent=Math.max(0,G.hp);
  $("#wave").textContent=G.wave;
  $("#lvl").textContent=G.lvl;
  // 商店置灰
  $$(".tcard").forEach(function(c){
    var id=c.getAttribute("data-t");
    c.classList.toggle("poor",G.gold<W.TMAP[id].cost);
    c.classList.toggle("on",G.build===id);
  });
  // 科技树/装备商店成本置灰
  $$("[data-tech]").forEach(function(b){
    var t=W.TECHS.filter(function(x){return x.id===b.getAttribute("data-tech");})[0];
    if(!t) return;
    var full=(W.TECH_STATE[t.id]||0)>=t.max, cost=W.techCost(t);
    b.disabled=full||G.wood<cost;
    if(!full) b.textContent=cost+"🪵";
    b.parentElement.classList.toggle("maxed",full);
    if(full) b.textContent="满级";
  });
  $$("[data-buy]").forEach(function(b){
    var s=W.SHOP_ITEMS[+b.getAttribute("data-buy")];
    if(!s) return;
    b.classList.toggle("poor",G.gold<s.cost||G.wood<s.wood||(G.inv||[]).length>=6);
  });
  // 选中塔信息
  if(G.sel){
    $("#selSec").hidden=false;
    $("#selName").textContent=G.sel.tDef.icon+" "+G.sel.tDef.name+" Lv."+G.sel.level;
    var s=G.sel.stats;
    $("#selStats").innerHTML=
      '<span>⚔️ 攻击 <b>'+Math.round(s.atk)+'</b></span>'+
      '<span>⏱ 攻速 <b>'+s.interval.toFixed(2)+'s</b></span>'+
      '<span>🎯 范围 <b>'+Math.round(s.range)+'</b></span>'+
      '<span>💥 类型 <b>'+W.DMG[s.dmgType]+'</b></span>'+
      '<span>✨ 光环 <b>+'+Math.round(s.auraAs*100)+'%</b></span>'+
      '<span>💰 投入 <b>'+G.sel.invested+'</b></span>';
    $("#btnUp").textContent="⬆ 升级 ("+(G.sel.level*90+60)+"💰)";
    $("#btnUp").disabled=G.gold<(G.sel.level*90+60);
    $("#btnUp").style.opacity=$("#btnUp").disabled?".5":"1";
    renderSlots(); renderInv();
  } else $("#selSec").hidden=true;
}
function renderSlots(){
  var t=G.sel, h="";
  for(var i=0;i<6;i++){
    var it=(t.items||[])[i];
    if(it){
      var def=W.itemDef(it.id);
      h+='<div class="slot filled" data-si="'+i+'" title="'+def.name+'">'+def.icon+'<span class="sname">'+def.name+'</span></div>';
    } else h+='<div class="slot"></div>';
  }
  $("#slots").innerHTML=h;
}
function renderInv(){
  var inv=G.inv||[], h="";
  if(!inv.length){$("#inv").innerHTML='<div class="empty-i">背包空 · 击杀 Boss 掉落装备</div>';return;}
  inv.forEach(function(it,i){
    var def=W.itemDef(it.id);
    h+='<div class="slot filled" data-ii="'+i+'" title="'+def.name+': '+def.desc+'">'+def.icon+'<span class="sname">'+def.name+'</span></div>';
  });
  $("#inv").innerHTML=h;
}

/* ================= 交互 ================= */
function canvasPos(ev){
  var rect=cv.getBoundingClientRect();
  var cx=(ev.touches?ev.touches[0].clientX:ev.clientX)-rect.left;
  var cy=(ev.touches?ev.touches[0].clientY:ev.clientY)-rect.top;
  var gx=Math.floor(cx/(rect.width/W.COLS));
  var gy=Math.floor(cy/(rect.width/W.COLS));
  return {gx:gx, gy:gy};
}
function posFromEvent(ev){
  var rect=cv.getBoundingClientRect();
  var px=(ev.touches?ev.touches[0].clientX:ev.clientX)-rect.left;
  var py=(ev.touches?ev.touches[0].clientY:ev.clientY)-rect.top;
  var gx=Math.floor(px/(rect.width/W.COLS));
  var gy=Math.floor(py/(rect.width/W.COLS)); // 格子等宽
  return {gx:gx,gy:gy};
}
cv.addEventListener("pointermove",function(ev){
  var p=posFromEvent(ev); G.ghostX=p.gx; G.ghostY=p.gy;
});
cv.addEventListener("pointerdown",function(ev){
  ev.preventDefault();
  var p=posFromEvent(ev);
  if(p.gx<0||p.gy<0||p.gx>=W.COLS||p.gy>=W.ROWS) return;
  // 建造模式
  if(G.build){
    if(W.buildTower(G.build,p.gx,p.gy)){
      G.build=null; W.toast("建造成功!");
      var t=G.towers[G.towers.length-1]; G.sel=t;
    } else W.toast("❌ 此处不可建造");
    return;
  }
  // 选塔
  var t=G.towers.filter(function(t){return t.gx===p.gx&&t.gy===p.gy;})[0];
  G.sel=t||null;
  if(t) W.toast(t.tDef.name+" Lv."+t.level);
});

/* 商店 */
function renderShop(){
  var h="";
  W.TOWERS.forEach(function(t){
    h+='<button class="tcard" data-t="'+t.id+'">'+
      '<span class="ti">'+t.icon+'</span>'+
      '<span class="tn">'+t.name+'</span>'+
      '<span class="td">'+t.desc+'</span>'+
      '<span class="tc">'+t.cost+'💰 · '+W.DMG[t.dmgType]+'</span></button>';
  });
  $("#shop").innerHTML=h;
}
$("#shop").addEventListener("click",function(e){
  var c=e.target.closest(".tcard"); if(!c) return;
  var id=c.getAttribute("data-t");
  G.build=(G.build===id)?null:id;
  if(G.build) W.toast("🏗️ 选择草地放置 "+W.TMAP[id].name);
  syncUI();
});

/* 塔操作 */
$("#btnUp").addEventListener("click",function(){
  var t=G.sel; if(!t) return;
  var cost=t.level*90+60;
  if(G.gold<cost){W.toast("💰 金币不足");return;}
  G.gold-=cost; t.invested+=cost; t.level++; W.recalcTower(t);
  W.fxRing(t.x,t.y,40,"#ffd166");
  W.addLog("⬆ "+t.tDef.name+" 升至 Lv."+t.level,"gold");
});
$("#btnSell").addEventListener("click",function(){
  var t=G.sel; if(!t) return;
  var back=Math.floor(t.invested*0.7);
  G.gold+=back;
  G.towers.splice(G.towers.indexOf(t),1);
  W.MAP[t.gy]=W.MAP[t.gy].substring(0,t.gx)+"0"+W.MAP[t.gy].substring(t.gx+1);
  (t.items||[]).forEach(function(it){if(it){G.inv=G.inv||[];if(G.inv.length<6)G.inv.push(it);}});
  G.sel=null;
  W.addLog("💰 出售 "+t.tDef.name+" +"+back+"💰","gold");
});
$("#btnClose").addEventListener("click",function(){G.sel=null;});

/* 装备装/卸 */
$("#slots").addEventListener("click",function(e){
  var s=e.target.closest("[data-si]"); if(!s) return;
  var i=+s.getAttribute("data-si"), t=G.sel;
  var it=(t.items||[])[i];
  if(!it) return;
  G.inv=G.inv||[];
  if(G.inv.length>=6){W.toast("背包已满");return;}
  G.inv.push(it); t.items.splice(i,1);
  W.recalcTower(t); W.toast("卸下 "+W.itemDef(it.id).name);
});
$("#inv").addEventListener("click",function(e){
  var s=e.target.closest("[data-ii]"); if(!s) return;
  var i=+s.getAttribute("data-ii"), t=G.sel;
  if(!t){W.toast("先点选一座塔");return;}
  var inv=G.inv; if(!inv[i]) return;
  if((t.items||[]).length>=6){W.toast("装备栏已满(6格)");return;}
  t.items=t.items||[];
  t.items.push(inv[i]); inv.splice(i,1);
  // 自动合成(背包)
  var before=inv.length;
  W.synthInv(inv);
  if(inv.length<before) W.addLog("✨ 背包自动合成更高级装备!","good");
  W.recalcTower(t);
  W.fxRing(t.x,t.y,34,"#4aa3ff");
  W.toast("已装备");
});

/* 顶栏 */
$("#btnPause").addEventListener("click",function(){
  G.paused=!G.paused;
  $("#btnPause").textContent=G.paused?"▶ 继续":"⏸ 暂停";
  W.toast(G.paused?"⏸ 已暂停":"▶ 继续");
});
$("#btnSpeed").addEventListener("click",function(){
  G.speed=G.speed>=3?1:G.speed+1;
  $("#btnSpeed").textContent="▶"+G.speed+"×";
  W.toast("速度 x"+G.speed);
});
$("#btnReset").addEventListener("click",function(){location.reload();});
$("#btnWave").addEventListener("click",function(){ if(!G.waveActive) openWaveModal(); });

/* 波次选择弹窗 */
function openWaveModal(){
  var idx=Math.min(G.wave, W.WAVES.length-1);
  var w=W.WAVES[idx];
  var preview=[
    w,
    W.WAVES[Math.min(idx+1,W.WAVES.length-1)],
    W.WAVES[Math.min(idx+2,W.WAVES.length-1)]
  ];
  var h="";
  preview.forEach(function(p,i){
    h+='<button class="wcard" data-w="'+i+'">'+
      '<div class="wt">'+(p.boss?"☠️ ":"🌊 ")+p.name+'</div>'+
      '<div class="wd">'+p.desc+'</div>'+
      '<span class="wf">护甲: '+W.ARM[p.armor]+' · HP '+Math.round(p.hp*(1+G.wave*0.18))+' · 数量 '+p.cnt+' · 奖励 '+p.gold+'💰</span>'+
      '</button>';
  });
  $("#waveList").innerHTML=h;
  $("#waveModal").hidden=false;
}
function closeWaveModal(){$("#waveModal").hidden=true;}
$("#btnCloseWave").addEventListener("click",closeWaveModal);
$("#waveList").addEventListener("click",function(e){
  var c=e.target.closest("[data-w]"); if(!c) return;
  // 直接开当前波(选择仅作展示+确认)
  W.startWave();
});

/* 克制表 */
$("#btnChart").addEventListener("click",function(){
  var c=$("#chart");
  c.hidden=!c.hidden;
  $("#btnChart").textContent=c.hidden?"展开":"收起";
  if(c.dataset.done) return;
  c.dataset.done="1";
  var h="<table><tr><th>伤害\\护甲</th>";
  Object.keys(W.ARM).forEach(function(a){h+="<th>"+W.ARM[a]+"</th>";});
  h+="</tr>";
  Object.keys(W.DMG).forEach(function(d){
    h+="<tr><td><b>"+W.DMG[d]+"</b></td>";
    Object.keys(W.ARM).forEach(function(a){
      var m=W.mult(d,a);
      var cls=m>=1.4?"gt":m<=0.7?"lt":"eq";
      h+='<td class="'+cls+'">'+Math.round(m*100)+"%</td>";
    });
    h+="</tr>";
  });
  h+='</table><div class="note">150%=克制 | 65%=被克 | 混沌对所有护甲恒 100% 全额伤害<br>轻甲: 克制; 重甲: 魔法克; 城甲: 攻城克; 神圣甲: 仅混沌全额</div>';
  c.innerHTML=h;
});

/* ================= 首页交互层: 高容错启动 + 种族/地图选择 ================= */
var homeLayer = $("#homeLayer"), selectLayer = $("#selectLayer");
var pick = { race: null, map: "serpent" };
function showHome(){
  if(homeLayer) homeLayer.hidden = false;
  if(selectLayer) selectLayer.hidden = true;
}
function showSelect(){
  if(homeLayer) homeLayer.hidden = true;
  if(selectLayer) selectLayer.hidden = false;
}
function forceRenderStartBtn(){
  // 异步加载容错: DOM 兜底, 无论如何保证主按钮存在且可点
  var b = $("#btnStart");
  if(!b){
    b = document.createElement("button");
    b.id = "btnStart"; b.type = "button";
    b.className = "btn gold big";
    b.textContent = "🎮 进入游戏";
    var card = homeLayer && homeLayer.querySelector(".ov-card");
    if(card) card.appendChild(b); else document.body.appendChild(b);
  }
  if(b.style.display === "none") b.style.display = "";
  b.disabled = false;
  b.onclick = function(){ showSelect(); };
  return b;
}
try { forceRenderStartBtn(); } catch(e){ /* 任何异常都不能挡住按钮 */ }

var btnQuick = $("#btnQuick");
if(btnQuick) btnQuick.onclick = function(){ pick.race = pick.race || "human"; startGame(); };
var btnBack = $("#btnBack");
if(btnBack) btnBack.onclick = function(){ showHome(); };
var btnPlay = $("#btnPlay");
if(btnPlay) btnPlay.onclick = function(){
  if(!pick.race){ W.toast("🛡️ 请先选择种族"); return; }
  startGame();
};
// 种族卡片
var raceGrid = $("#raceGrid");
if(raceGrid) raceGrid.addEventListener("click", function(e){
  var c = e.target.closest("[data-race]"); if(!c) return;
  pick.race = c.getAttribute("data-race");
  Array.prototype.forEach.call(raceGrid.querySelectorAll(".race-card"), function(x){ x.classList.remove("on"); });
  c.classList.add("on");
  W.toast("已选种族: " + (c.querySelector("b") ? c.querySelector("b").textContent : pick.race));
});
// 地图卡片
var mapGrid = $("#mapGrid");
if(mapGrid) mapGrid.addEventListener("click", function(e){
  var c = e.target.closest("[data-map]"); if(!c) return;
  pick.map = c.getAttribute("data-map");
  Array.prototype.forEach.call(mapGrid.querySelectorAll(".race-card"), function(x){ x.classList.remove("on"); });
  c.classList.add("on");
});
function startGame(){
  try { if(homeLayer) homeLayer.hidden = true; } catch(e){}
  try { if(selectLayer) selectLayer.hidden = true; } catch(e){}
  G.paused = false;
  G.race = pick.race || "human";
  G.mapId = pick.map || "serpent";
  var raceName = {human:"🛡️ 人族", nightelf:"🌿 暗夜精灵", orc:"👹 兽族", undead:"💀 不死族"}[G.race] || "🛡️ 人族";
  try { W.addLog("⚔️ 守卫开始! 种族: " + raceName + " · 点塔商店建塔, 然后 🚀 开波", "good"); } catch(e){}
  try { openWaveModal(); } catch(e){}
}
/* 结束画面: 直接复用首页交互层 (极简备份结构) */
W.closeWaveModal = closeWaveModal;
W.openWaveModal = openWaveModal;
W.showOverlay = function(title, sub, tip){
  showHome();
  try{
    var ov = homeLayer;
    ov.querySelector("h2").textContent = title;
    var ps = ov.querySelectorAll("p");
    if(ps[0]) ps[0].textContent = sub;
    if(ps[1]) ps[1].textContent = tip;
    var b = $("#btnStart");
    if(b){ b.textContent = "↺ 再来一局"; b.onclick = function(){ location.reload(); }; }
  }catch(e){}
};
W.homeLayer = homeLayer; W.selectLayer = selectLayer;
showHome();

/* ================= v2: 科技树 / 装备商店 UI ================= */
function renderTech(){
  if(!W.TECHS) return;
  var h="";
  W.TECHS.forEach(function(t){
    var lv=W.TECH_STATE[t.id]||0, cost=W.techCost(t), full=lv>=t.max;
    h+='<div class="tech-row'+(full?" maxed":"")+'">'+
      '<div class="tn2">'+t.name+'<span class="td2">'+t.desc+'</span></div>'+
      '<span class="lv">Lv.'+lv+'/'+t.max+'</span>'+
      '<button class="buy" data-tech="'+t.id+'"'+((full||G.wood<cost)?" disabled":"")+'>'+(full?"满级":cost+"🪵")+'</button>'+
      '</div>';
  });
  $("#techList").innerHTML=h;
}
function renderItemShop(){
  if(!W.SHOP_ITEMS) return;
  var h="";
  W.SHOP_ITEMS.forEach(function(s,i){
    var it=W.IMAP[s.id];
    var poor=G.gold<s.cost||G.wood<s.wood||(G.inv||[]).length>=6;
    h+='<button class="is-item'+(poor?" poor":"")+'" data-buy="'+i+'">'+
      '<span class="ii">'+it.icon+'</span>'+
      '<span class="ib"><span class="in">'+it.name+'</span>'+
      '<span class="ic">'+s.cost+'💰'+(s.wood?' <span class="wd">'+s.wood+'🪵</span>':'')+' · 合成材料</span></span>'+
      '</button>';
  });
  $("#itemShop").innerHTML=h;
}
$("#techList").addEventListener("click",function(e){
  var b=e.target.closest("[data-tech]"); if(!b) return;
  W.buyTech(b.getAttribute("data-tech"));
  renderTech(); syncUI();
});
$("#itemShop").addEventListener("click",function(e){
  var b=e.target.closest("[data-buy]"); if(!b) return;
  if(W.buyItem(+b.getAttribute("data-buy"))){ renderItemShop(); syncUI(); }
});

/* ================= 启动 ================= */
G.inv=[];
renderShop(); renderTech(); renderItemShop();
fitCanvas();
requestAnimationFrame(function(ts){last=ts;requestAnimationFrame(loop);});
W.addLog("🏰 War3 TD 已载入 · 克制链生效中","good");
})();