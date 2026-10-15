/* ============================================================
   War3 TD - 魔兽争霸3 风格塔防 核心引擎
   模块: 地图/克制链/波次/塔/弹道/光环/装备合成
   ============================================================ */
(function () {
"use strict";
var $ = function(s){return document.querySelector(s);};
var $$ = function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function dist(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);}

/* ================= 克制链 (伤害 x 护甲) ================= */
// 伤害: normal/pierce/siege/magic/chaos ; 护甲: unarmored/light/heavy/fortified/divine
var DMG = {normal:"普通",pierce:"穿刺",siege:"攻城",magic:"魔法",chaos:"混沌"};
var ARM = {unarmored:"无甲",light:"轻甲",heavy:"重甲",fortified:"城甲",divine:"神圣甲"};
// 1.5 克制 / 0.65 被克 / 1.0 普通; chaos 恒 1.0
var CHART = {
  normal:  {unarmored:1.0, light:1.5,  heavy:0.65, fortified:1.0, divine:1.0},
  pierce:  {unarmored:1.5, light:1.5,  heavy:0.65, fortified:0.65,divine:1.0},
  siege:   {unarmored:0.65,light:0.65, heavy:1.0,  fortified:1.5, divine:1.0},
  magic:   {unarmored:1.0, light:0.65, heavy:1.5,  fortified:0.65,divine:0.65},
  chaos:   {unarmored:1.0, light:1.0,  heavy:1.0,  fortified:1.0, divine:1.0}
};
function mult(dmgType,armType){
  var m = CHART[dmgType] && CHART[dmgType][armType];
  return m===undefined?1:m;
}
function multLabel(m){return m>=1.4?"克! "+Math.round(m*100)+"%":m<=0.7?"被克 "+Math.round(m*100)+"%":m>1?"+"+Math.round((m-1)*100)+"%":Math.round(m*100)+"%";}

/* ================= 地图: 蜿蜒怪路 + 建造格 ================= */
// 逻辑格子 18 x 11 ; 0=草地(可建) 1=路 2=起点 3=基地
var MAP = [
"000000000000000000",
"021111111111111110",
"000000000000000010",
"011111111111111110",
"010000000000000000",
"011111111111111110",
"000000000000000010",
"011111111111111110",
"010000000000000000",
"011111111111111113",
"000000000000000000"
];
var COLS=18, ROWS=11;
var CELL=44; // 逻辑像素, canvas 会缩放
var pathCells=[]; // 顺序路径点(格坐标)
(function buildPath(){
  // 从 (1,1) 起点沿路走
  var seen={}, x=1,y=1;
  while(true){
    pathCells.push({x:x,y:y});
    seen[x+","+y]=1;
    var dirs=[[1,0],[0,1],[-1,0],[0,-1]], moved=false;
    for(var i=0;i<dirs.length;i++){
      var nx=x+dirs[i][0], ny=y+dirs[i][1];
      if(nx<0||ny<0||nx>=COLS||ny>=ROWS) continue;
      var c=MAP[ny][nx];
      if((c==="1"||c==="3")&&!seen[nx+","+ny]){x=nx;y=ny;moved=true;break;}
    }
    if(!moved) break;
    if(MAP[y][x]==="3") { pathCells.push({x:x,y:y}); break; }
  }
})();
function cellCenter(c){return {x:c.x*CELL+CELL/2, y:c.y*CELL+CELL/2};}
var WAYPOINTS = pathCells.map(cellCenter);

/* ================= 防御塔定义 ================= */
// slot: 6 格装备; aura 光环; chain 闪电链; execute 斩杀; poison DoT; summon 击杀召唤
var TOWERS = [
  {id:"human", name:"圣光塔", icon:"✨", race:"人族", cost:120, dmg:14, interval:1.2, range:140,
   dmgType:"magic", desc:"范围光环: 周围塔 +12% 攻速; 单体治疗基地",
   aura:{type:"as", val:0.12, r:150}, special:"healBase"},
  {id:"cannon", name:"火炮塔", icon:"💣", race:"人族", cost:150, dmg:30, interval:1.8, range:165,
   dmgType:"siege", aoe:62, desc:"范围溅射物理; 攻城伤害克城甲",
   special:"sunder"},
  {id:"wind", name:"风之树塔", icon:"🍂", race:"暗夜", cost:140, dmg:11, interval:0.7, range:150,
   dmgType:"pierce", bounces:3, desc:"弹射 3 目标, 每跳伤害递减 25%",
   special:"bounce"},
  {id:"poison", name:"毒花古树", icon:"🌿", race:"暗夜", cost:130, dmg:9, interval:1.0, range:135,
   dmgType:"normal", dot:{dps:8, dur:3}, slow:{pct:0.3, dur:2}, desc:"持续毒伤 + 30% 减速",
   special:"poison"},
  {id:"moon", name:"月亮井", icon:"🌙", race:"暗夜", cost:100, dmg:0, interval:99, range:160,
   dmgType:"normal", desc:"不攻击; 为周围塔充能 +20% 攻速",
   aura:{type:"as", val:0.20, r:170}, special:"mana"},
  {id:"shaman", name:"萨满祭坛", icon:"⚡", race:"兽族", cost:160, dmg:22, interval:1.3, range:155,
   dmgType:"magic", chain:{n:3, falloff:0.75}, desc:"闪电链弹跳 3 目标 75% 递减",
   special:"chain"},
  {id:"tauren", name:"牛头人图腾", icon:"🦬", race:"兽族", cost:180, dmg:46, interval:2.6, range:150,
   dmgType:"normal", aoe:95, stun:1.1, desc:"极慢攻速, 每击大范围踩踏眩晕",
   special:"stomp"},
  {id:"troll", name:"巨魔猎头塔", icon:"🪓", race:"兽族", cost:135, dmg:20, interval:1.0, range:175,
   dmgType:"pierce", execute:{hp:0.3, mult:2.2}, desc:"对残血(+220% 斩杀) 追加流血",
   special:"execute"},
  {id:"crypt", name:"通灵塔", icon:"💀", race:"不死", cost:145, dmg:18, interval:1.25, range:145,
   dmgType:"magic", summon:1, desc:"击杀怪物召唤骷髅阻挡道路",
   special:"summon"},
  {id:"frost", name:"冰霜巨龙塔", icon:"🧊", race:"不死", cost:175, dmg:24, interval:1.6, range:160,
   dmgType:"magic", aoe:70, slow:{pct:0.55, dur:2.5}, desc:"范围冰冻 55% 减速 + 降防",
   special:"frost"},
  {id:"curse", name:"诅咒塔", icon:"☠️", race:"不死", cost:155, dmg:8, interval:1.4, range:170,
   dmgType:"chaos", debuff:{taken:0.25, r:170, dur:3}, desc:"范围诅咒: 敌人受伤 +25%; 混沌伤害无视克制",
   special:"curse"},
  {id:"hero", name:"英雄塔·大法师", icon:"🧙", race:"人族", cost:420, dmg:60, interval:1.1, range:190,
   dmgType:"magic", aoe:80, bounces:2, ultimate:"blizzard", desc:"终极: 每 8s 暴风雪全屏 AOE",
   special:"hero"},
  /* ===== v2 新增: 魔法哨塔 ===== */
  {id:"magisentry", name:"魔法哨塔", icon:"🔮", race:"人族", cost:170, dmg:34, interval:1.4, range:170,
   dmgType:"magic", manaBurn:25, desc:"抽魔 25/击(降低怪物强度) + 高额单体魔法",
   special:"manaburn"},
  /* ===== v2 新增: 圣骑士英雄塔 ===== */
  {id:"paladin", name:"英雄塔·圣骑士", icon:"🛡️", race:"人族", cost:460, dmg:52, interval:1.3, range:175,
   dmgType:"magic", aura:{type:"heal", val:0.5, r:180}, ultimate:"holystorm", summonWater:true,
   desc:"光环治疗周围塔; 终极: 神圣风暴 + 召唤水元素",
   special:"paladin"},
  /* ===== v2 新增: 恶魔猎手英雄塔 ===== */
  {id:"demonhunter", name:"英雄塔·恶魔猎手", icon:"😈", race:"暗夜", cost:440, dmg:38, interval:0.38, range:145,
   dmgType:"normal", crit:0.35, ultimate:"metamorph", desc:"高频单体切割 35% 暴击; 终极: 变身+刀扇",
   special:"demonhunter"},
  /* ===== v2 新增: 剑圣英雄塔 ===== */
  {id:"blademaster", name:"英雄塔·剑圣", icon:"👺", race:"兽族", cost:470, dmg:70, interval:1.0, range:160,
   dmgType:"normal", crit:0.3, critMult:4, ultimate:"bladestorm", desc:"30% 概率 4 倍绝命一击; 终极: 剑刃风暴",
   special:"blademaster"},
  /* ===== v2 新增: 巫妖英雄塔 ===== */
  {id:"lich", name:"英雄塔·巫妖", icon:"☠️", race:"不死", cost:480, dmg:55, interval:1.5, range:185,
   dmgType:"magic", aoe:85, ultimate:"deathdecay", desc:"霜冻新星 AOE+冻结; 终极: 死亡凋零 全屏按%扣血",
   special:"lich"}
];
var TMAP={}; TOWERS.forEach(function(t){TMAP[t.id]=t;});

/* ================= 装备系统 (6 格 + 合成) ================= */
// base 材料可合成: 2 同级 -> 高一级; 特殊公式用 recipe
var ITEMS = {
  claw:   {id:"claw",   name:"攻击爪", icon:"🐾", tier:1, atk:8,  recipe:null, desc:"+8 攻击"},
  glove:  {id:"glove",  name:"加速手套", icon:"🧤", tier:1, as:0.10, recipe:null, desc:"+10% 攻速"},
  frostb: {id:"frostb", name:"冰霜之球", icon:"❄️", tier:1, slow:0.2, desc:"攻击附带 20% 减速"},
  rune:   {id:"rune",   name:"邪恶光环符文", icon:"🔮", tier:1, auraAs:0.08, desc:"光环: 周围塔 +8% 攻速"},
  boot:   {id:"boot",   name:"疾风之靴", icon:"👢", tier:1, range:25, desc:"+25 射程"},
  tome:   {id:"tome",   name:"智力之书", icon:"📖", tier:1, dmgPct:0.12, desc:"+12% 伤害"},
  // 合成产物 (recipe: 两件基础)
  doomblade:{id:"doomblade", name:"灭世之刃", icon:"🗡️", tier:2, atk:26, crit:0.25, armorShred:0.2, desc:"+26 攻击 / 25% 暴击 / 破甲", recipe:["claw","tome"]},
  bloodstone:{id:"bloodstone", name:"振奋宝石", icon:"💠", tier:2, as:0.30, auraAs:0.10, desc:"+30% 攻速 / 光环 +10%", recipe:["glove","glove"]},
  stormorb:{id:"stormorb", name:"闪电之球", icon:"🌩️", tier:2, chain:2, atk:14, desc:"攻击闪电弹射 2 次 / +14 攻击", recipe:["frostb","claw"]},
  earring:{id:"earring", name:"毁灭之角", icon:"📯", tier:2, chaosAura:0.15, atk:12, desc:"光环: 周围塔攻击附带 15% 混沌 / +12 攻击", recipe:["rune","boot"]},
  heart:  {id:"heart",  name:"恶魔之心", icon:"❤️‍🔥", tier:2, dmgPct:0.35, hpRegen:0.5, desc:"+35% 伤害 / 基地回血", recipe:["tome","tome"]}
};
var IMAP={}; Object.keys(ITEMS).forEach(function(k){IMAP[k]=ITEMS[k];});
function synthInv(inv){ // 自动合成: 2 同级(非传说) -> recipe 匹配或升阶
  var changed=true;
  while(changed){
    changed=false;
    for(var i=0;i<inv.length;i++){
      for(var j=i+1;j<inv.length;j++){
        var a=inv[i],b=inv[j];
        if(!a||!b||a===b) continue;
        // 查配方: 任意 recipe 由 [a,b] 组成
        var made=null;
        Object.keys(ITEMS).forEach(function(k){
          var it=ITEMS[k];
          if(it.recipe && made) return;
          if(!it.recipe) return;
          var need=it.recipe.slice(), pool=[a.id,b.id];
          var ok=true;
          need.forEach(function(n){var p=pool.indexOf(n); if(p<0)ok=false; else pool.splice(p,1);});
          if(ok && need.length===2) made=it.id;
        });
        if(made){
          inv.splice(j,1); inv[i]=IMAP[made];
          changed=true; break;
        }
      }
      if(changed) break;
    }
  }
  // 去 null
  for(var k=inv.length-1;k>=0;k--) if(!inv[k]) inv.splice(k,1);
  return inv;
}
function makeItem(id){
  var it=IMAP[id]; if(!it) return null;
  return {id:it.id, atk:it.atk||0, as:it.as||0, slow:it.slow||0, auraAs:itemDef(it).auraAs||0,
    range:it.range||0, dmgPct:it.dmgPct||0, crit:it.crit||0, armorShred:it.armorShred||0,
    chain:it.chain||0, chaosAura:it.chaosAura||0, hpRegen:it.hpRegen||0};
}
function itemDef(it){return typeof it==="string"?IMAP[it]:it;}

/* ================= 游戏状态 ================= */
var G = {
  gold:250, wood:40, hp:20, maxHp:20, wave:0, maxWave:15, lvl:1, exp:0,
  techAtk:1, techAs:1, techGold:1, baseHpBonus:0, luck:0,
  towers:[], enemies:[], bullets:[], effects:[], summons:[],
  pathT:0, running:false, paused:false, speed:1, over:false,
  sel:null, build:null, spawnQ:[], waveActive:false,
  base:{x:WAYPOINTS[WAYPOINTS.length-1].x, y:WAYPOINTS[WAYPOINTS.length-1].y},
  startPt:WAYPOINTS[0]
};

/* ================= 波次设计 (小怪/高速/肉盾/飞行/Boss) ================= */
var WAVES = [
  {name:"斥候狼群", type:"light",   hp:45,  spd:70,  cnt:8,  gold:6,  armor:"unarmored", fly:false, desc:"轻甲小怪成群冲锋"},
  {name:"轻步兵",   type:"light",   hp:70,  spd:62,  cnt:10, gold:7,  armor:"light",     fly:false, desc:"轻甲标准波"},
  {name:"疾风狼",   type:"fast",    hp:55,  spd:135, cnt:12, gold:8,  armor:"unarmored", fly:false, desc:"高速怪, 低血量"},
  {name:"重甲战士", type:"tank",    hp:210, spd:45,  cnt:6,  gold:14, armor:"heavy",      fly:false, desc:"重甲肉盾, 魔法克"},
  {name:"石像鬼",   type:"fly",     hp:120, spd:95,  cnt:9,  gold:12, armor:"light",      fly:true,  desc:"飞行怪, 穿刺克"},
  {name:"攻城车",   type:"tank",    hp:340, spd:40,  cnt:5,  gold:20, armor:"fortified",  fly:false, desc:"城甲! 攻城克"},
  {name:"暗影刺客", type:"fast",    hp:180, spd:150, cnt:10, gold:15, armor:"light",      fly:false, desc:"超高速, 击晕塔有奇效"},
  {name:"冰霜巨人", type:"tank",    hp:620, spd:36,  cnt:4,  gold:30, armor:"heavy",      fly:false, desc:"高血重甲肉盾"},
  {name:"风暴鹰身", type:"fly",     hp:300, spd:110, cnt:8,  gold:22, armor:"light",      fly:true,  desc:"高速飞行波"},
  {name:"钢铁傀儡", type:"tank",    hp:900, spd:34,  cnt:4,  gold:38, armor:"fortified",  fly:false, desc:"城甲精英"},
  {name:"亡灵军团", type:"normal",  hp:520, spd:75,  cnt:16, gold:16, armor:"unarmored", fly:false, desc:"无甲人海"},
  {name:"圣骑士团", type:"tank",    hp:1400,spd:42,  cnt:5,  gold:55, armor:"divine",     fly:false, desc:"神圣甲! 混沌克"},
  {name:"虚空领主", type:"fast",    hp:900, spd:120, cnt:8,  gold:45, armor:"light",      fly:false, desc:"高速精英"},
  {name:"深渊巨龙", type:"fly",     hp:2600,spd:70,  cnt:3,  gold:120,armor:"divine",     fly:true,  desc:"飞行精英, 神圣甲"},
  {name:"☠️ 魔王阿克蒙德", type:"boss", hp:9000, spd:48, cnt:1, gold:600, armor:"divine", fly:false, desc:"最终 Boss: 神圣甲 · 掉落传说装备", boss:true}
];

/* ================= 敌人 ================= */
function spawnEnemy(w, idx){
  var hpScale = 1 + (G.wave-1)*0.18;
  var e = {
    x:G.startPt.x, y:G.startPt.y, seg:0, t:0,
    hp:w.hp*hpScale, maxHp:w.hp*hpScale, spd:w.spd, baseSpd:w.spd,
    armor:w.armor, fly:w.fly, type:w.type, boss:!!w.boss,
    slowT:0, slowPct:0, stunT:0, curseT:0, curseVal:0, dotT:0, dotDps:0, bleedT:0,
    dead:false, dist:0, gold:w.gold, delay:idx*0.55
  };
  G.enemies.push(e);
}
function moveAlong(e, dt){
  if(e.delay>0){e.delay-=dt;return;}
  if(e.stunT>0){e.stunT-=dt;return;}
  var spd=e.spd*(e.slowT>0?(1-e.slowPct):1);
  e.t += spd*dt/CELL;
  while(e.t>=1){
    e.t-=1; e.seg++;
    if(e.seg>=WAYPOINTS.length-1){
      // 到达基地
      G.hp-=e.boss?5:1; e.dead=true; e.reached=true;
      addLog("💥 "+(e.boss?"BOSS ":"")+ "怪物抵达基地! -"+(e.boss?5:1)+" ❤️","warn");
      checkOver(); return;
    }
  }
  var a=WAYPOINTS[e.seg], b=WAYPOINTS[e.seg+1];
  e.x=a.x+(b.x-a.x)*e.t; e.y=a.y+(b.y-a.y)*e.t;
  e.dist+=spd*dt;
}
function dealDamage(e, raw, tower, isCrit){
  if(e.dead) return 0;
  var dt = tower? tower.tDef.dmgType : "normal";
  var m = mult(dt, e.armor);
  var dmg = raw * m;
  if(e.curseT>0) dmg *= (1+e.curseVal);
  if(isCrit) dmg *= (tower && tower.tDef.critMult>=4) ? 4 : 2;
  dmg = Math.max(1, dmg);
  e.hp -= dmg;
  if(e.hp<=0){ killEnemy(e, tower); }
  return dmg;
}
function killEnemy(e, tower){
  if(e.dead) return;
  e.dead=true; e.killed=true;
  var g = Math.floor((e.gold + Math.max(0, Math.floor(e.maxHp/50))) * (G.techGold||1));
  G.gold += g;
  if(e.boss){ G.wood += 25; dropItem(); if(Math.random()<(G.luck||0)) dropItem(); addLog("🏆 击杀 BOSS! +"+g+"💰 +25🪵 掉落装备!","gold"); }
  else if(e.type==="tank"||e.type==="fly"&&e.maxHp>500){ G.wood += 2; }
  gainExp(tower?2:1);
  // 通灵塔召唤骷髅
  if(tower && tower.tDef.special==="summon" && G.summons.length<6){
    G.summons.push({x:e.x,y:e.y,seg:e.seg,t:e.t,hp:60,atk:8,cd:0});
  }
  fxPop(e.x,e.y,"+"+g,"#f0b429");
}
function dropItem(){
  var pool=["claw","glove","frostb","rune","boot","tome"];
  var id=pool[Math.floor(Math.random()*pool.length)];
  G.inv=G.inv||[];
  if(G.inv.length<6){ G.inv.push(makeItem(id)); addLog("🎁 掉落装备: "+IMAP[id].icon+" "+IMAP[id].name,"gold"); }
  else { G.gold+=80; addLog("🎒 背包已满, 装备折算 +80💰","gold"); }
  synthInv(G.inv||[]);
}
function gainExp(n){
  G.exp+=n;
  var need=G.lvl*10;
  if(G.exp>=need){ G.exp-=need; G.lvl++; G.gold+=50; addLog("⭐ 升级! Lv."+G.lvl+" +50💰","good"); }
}

/* ================= 塔 ================= */
function buildTower(id, gx, gy){
  var def=TMAP[id];
  if(!def||G.gold<def.cost) return false;
  if(MAP[gy][gx]!=="0") return false;
  // 不能压路/重复
  for(var i=0;i<G.towers.length;i++) if(G.towers[i].gx===gx&&G.towers[i].gy===gy) return false;
  G.gold-=def.cost;
  var c=cellCenter({x:gx,y:gy});
  var t={id:def.id, tDef:def, gx:gx, gy:gy, x:c.x, y:c.y,
    level:1, cd:0, items:[], invested:def.cost,
    stats:null};
  recalcTower(t);
  G.towers.push(t);
  MAP[gy]=MAP[gy].substring(0,gx)+"X"+MAP[gy].substring(gx+1);
  addLog("🏗️ 建造 "+def.icon+" "+def.name+" (-"+def.cost+"💰)","good");
  return true;
}
function recalcTower(t){
  var d=t.tDef;
  var lv=t.level;
  var atk=d.dmg*(1+(lv-1)*0.35)*(G.techAtk||1);
  var as=d.interval/(1+(lv-1)*0.12)*(G.techAs||1);
  var range=d.range+(lv-1)*8;
  var items=t.items||[];
  var auraAs=0, chaosBonus=0, dmgPct=0, bonusAtk=0, bonusRange=0, slowBonus=0, crit=0, shred=0, chain=0;
  items.forEach(function(inst){
    if(!inst) return;
    bonusAtk+=inst.atk||0; as/= (1+(inst.as||0)); bonusRange+=inst.range||0;
    dmgPct+=inst.dmgPct||0; auraAs+=inst.auraAs||0; chaosBonus+=inst.chaosAura||0;
    slowBonus+=inst.slow||0; crit=Math.max(crit,inst.crit||0); shred+=inst.armorShred||0;
    chain+=inst.chain||0;
  });
  atk = (atk+bonusAtk)*(1+dmgPct);
  range += bonusRange;
  // 光环加成(自身 + 周围光源)
  var auraSpeed=auraAs;
  G.towers.forEach(function(o){
    if(o===t) return;
    var dd=o.tDef;
    if(dd.aura && dd.aura.type==="as" && dist(o,t)<=dd.aura.r) auraSpeed+=dd.aura.val;
  });
  // 诅咒塔对自己加 chaos
  t.stats={atk:atk, interval:Math.max(0.22,as), range:range, auraAs:auraSpeed,
    dmgType:d.dmgType, slowBonus:slowBonus, crit:crit, shred:shred, chain:chain, chaosChaos:chaosBonus};
  t.atk=atk; t.interval=Math.max(0.22,as); t.range=range;
}
function towerFire(t, e){
  var d=t.tDef, s=t.stats;
  // 月亮井不攻击
  if(d.dmg===0) return;
  var raw=s.atk;
  var isCrit = (s.crit>0 && Math.random()<s.crit) || (d.special==="blademaster" && Math.random()<0.3);
  var dmgMult = mult(s.dmgType, e.armor);
  // 诅咒塔 chaos 附加
  if(s.chaosChaos>0){ /* 混沌附加已在装备光环 */ }
  // 斩杀
  if(d.execute && e.hp/e.maxHp<=d.execute.hp) raw*=d.execute.mult;
  // 破甲临时
  var effArmor=e.armor;
  dealDamage(e, raw, t, isCrit);
  if(isCrit) fxPop(e.x,e.y, d.critMult>=4?"4×绝命一击!":"暴击!","#ffd166");
  fxHit(e.x,e.y, multLabel(dmgMult));
  // 抽魔 (魔法哨塔): 抽蓝减速
  if(d.special==="manaburn"){
    e.slowT=Math.max(e.slowT,1.2); e.slowPct=Math.min(0.5,e.slowPct+0.06);
    fxPop(e.x,e.y-10,"抽魔!","#b388ff");
  }
  // 淡魔剑刃风暴: 剑圣 30% 双倍输出已在 isCrit 处理
  // 减速装备/塔
  var slowPct=(d.slow?d.slow.pct:0)+s.slowBonus;
  if(slowPct>0){ e.slowT=Math.max(e.slowT,(d.slow?d.slow.dur:2)); e.slowPct=Math.min(0.8,slowPct); }
  // DoT
  if(d.dot){ e.dotT=d.dot.dur; e.dotDps=d.dot.dps*(1+(t.level-1)*0.3); }
  // 眩晕
  if(d.stun) e.stunT=Math.max(e.stunT,d.stun);
  // 闪电链
  if(d.chain || s.chain>0){
    var n=(d.chain?d.chain.n:0)+s.chain;
    var near=G.enemies.filter(function(x){return !x.dead&&x!==e&&dist(x,e)<130;}).slice(0,n);
    var hop=raw;
    near.forEach(function(x,i){
      hop*= (d.chain?d.chain.falloff:0.8);
      dealDamage(x, hop, t, false);
      fxBolt(e.x,e.y,x.x,x.y);
    });
  }
  // 弹射 (风之树)
  if(d.bounces||d.special==="bounce"){
    var n2=d.bounces||3, hop2=raw, cur=e;
    for(var i=0;i<n2;i++){
      var nx=G.enemies.filter(function(x){return !x.dead&&x!==cur&&dist(x,cur)<120;});
      if(!nx.length) break;
      hop2*=0.75;
      dealDamage(nx[0], hop2, t, false);
      fxBolt(cur.x,cur.y,nx[0].x,nx[0].y);
      cur=nx[0];
    }
  }
  // 弹道视觉
  G.bullets.push({x:t.x,y:t.y,tx:e.x,ty:e.y,t:0,dur:0.18,color:d.id==="frost"?"#8ecbff":d.id==="shaman"?"#ffe082":d.id==="cannon"?"#ff8a65":"#dcdcdc"});
}
function auraTick(t, dt){
  var d=t.tDef;
  if(d.special==="healBase" && Math.random()<dt*0.3){ G.hp=Math.min(20+(G.lvl-1),G.hp+1); }
}

/* ================= 波次控制 ================= */
var pendingWave=null;
function startWave(){
  if(G.waveActive||G.over) return;
  G.hp = G.maxHp = 20 + (G.baseHpBonus||0);
  G.wave++;
  var w = WAVES[Math.min(G.wave-1, WAVES.length-1)];
  G.waveActive=true;
  var cnt = w.cnt + Math.floor(G.wave/5);
  for(var i=0;i<cnt;i++) spawnEnemy(w,i);
  addLog("🌊 第 "+G.wave+" 波: "+(w.boss?"☠️ ":"")+w.name+" x"+cnt+" ["+ARM[w.armor]+"]","warn");
  if(window.WAR3 && window.WAR3.closeWaveModal) window.WAR3.closeWaveModal();
}
function checkWaveEnd(){
  if(!G.waveActive) return;
  var alive=G.enemies.filter(function(e){return !e.dead;});
  if(alive.length===0){
    G.waveActive=false;
    var bonus=50+G.wave*10; G.gold+=bonus; G.wood+=5;
    addLog("✅ 第 "+G.wave+" 波守住! +"+bonus+"💰 +5🪵","good");
    if(G.wave>=G.maxWave){ victory(); return; }
    // 下一波选择弹窗
    setTimeout(function(){ if(window.WAR3 && window.WAR3.openWaveModal) window.WAR3.openWaveModal(); }, 700);
  }
}
function checkOver(){
  if(G.hp<=0&&!G.over){ defeat(); }
}
function victory(){G.over=true;G.paused=true;if(window.WAR3&&window.WAR3.showOverlay)window.WAR3.showOverlay("🏆 胜利!","你守住了 "+G.wave+" 波进攻, 基地完好!","史诗级指挥官!");}
function defeat(){G.over=true;G.paused=true;if(window.WAR3&&window.WAR3.showOverlay)window.WAR3.showOverlay("💀 失守!","基地被摧毁于第 "+G.wave+" 波","调整塔位与装备, 再战一局!");}

/* ================= 战报 / UI ================= */
function addLog(msg, cls){
  var el=$("#log");
  var p=document.createElement("p");
  if(cls)p.className=cls;
  p.textContent=msg;
  el.appendChild(p);
  el.scrollTop=el.scrollHeight;
  while(el.children.length>60) el.removeChild(el.firstChild);
}
function toast(msg){
  var t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(t._t); t._t=setTimeout(function(){t.classList.remove("show");},1700);
}

/* ================= 特效 ================= */
function fxPop(x,y,txt,color){G.effects.push({kind:"pop",x:x,y:y,txt:txt,color:color,t:0,dur:0.9});}
function fxHit(x,y,txt){G.effects.push({kind:"hit",x:x,y:y,txt:txt,t:0,dur:0.7});}
function fxBolt(x1,y1,x2,y2){G.effects.push({kind:"bolt",x:x1,y:y1,x2:x2,y2:y2,t:0,dur:0.22});}
function fxRing(x,y,r,color){G.effects.push({kind:"ring",x:x,y:y,r:r,color:color,t:0,dur:0.5});}

/* ================= v2: 局外养成科技树 (木材永久升级, localStorage) ================= */
var TECHS = [
  {id:"tech_atk",  name:"⚔️ 武器专精", desc:"全体塔 +4% 伤害/级", max:5, base:30, key:"tk1"},
  {id:"tech_as",   name:"⚡ 攻速强化", desc:"全体塔 +3% 攻速/级", max:5, base:30, key:"tk2"},
  {id:"tech_gold", name:"💰 贪婪光环", desc:"击杀金币 +6%/级", max:5, base:40, key:"tk3"},
  {id:"tech_base", name:"🏰 基地加固", desc:"基地生命 +3/级", max:3, base:60, key:"tk4"},
  {id:"tech_luck", name:"🍀 幸运女神", desc:"Boss 掉装率提升/级", max:3, base:50, key:"tk5"}
];
var TECH_STATE = {};
function loadMeta(){
  try{
    var raw = localStorage.getItem("war3td-meta");
    var m = raw?JSON.parse(raw):{};
    TECHS.forEach(function(t){TECH_STATE[t.id]=Math.min(t.max, m[t.key]||0);});
  }catch(e){ TECHS.forEach(function(t){TECH_STATE[t.id]=0;}); }
}
function saveMeta(){
  try{
    var m={}; TECHS.forEach(function(t){m[t.key]=TECH_STATE[t.id]||0;});
    localStorage.setItem("war3td-meta", JSON.stringify(m));
  }catch(e){}
}
function techCost(t){ return t.base + (TECH_STATE[t.id]||0)*t.base; }
function buyTech(id){
  var t=TECHS.filter(function(x){return x.id===id;})[0]; if(!t) return false;
  if((TECH_STATE[id]||0)>=t.max){ toast("已满级"); return false; }
  var c=techCost(t);
  if(G.wood<c){ toast("🪵 木材不足 ("+c+")"); return false; }
  G.wood-=c; TECH_STATE[id]=(TECH_STATE[id]||0)+1; saveMeta();
  applyTech(); addLog("🔬 科技升级: "+t.name+" Lv."+TECH_STATE[id],"good");
  G.towers.forEach(recalcTower);
  toast("🔬 "+t.name+" Lv."+TECH_STATE[id]);
  return true;
}
function applyTech(){
  G.techAtk = 1 + (TECH_STATE.tech_atk||0)*0.04;
  G.techAs  = 1 + (TECH_STATE.tech_as||0)*0.03;
  G.techGold= 1 + (TECH_STATE.tech_gold||0)*0.06;
  G.baseHpBonus = (TECH_STATE.tech_base||0)*3;
  G.luck     = (TECH_STATE.tech_luck||0)*0.15;
  G.maxHp = 20 + G.baseHpBonus;
}
loadMeta(); applyTech();

/* ================= v2: 装备商店 (金币/木材购买基础材料) ================= */
var SHOP_ITEMS = [
  {id:"claw",   cost:60,  wood:0,  desc:"基础材料 +8 攻击"},
  {id:"glove",  cost:55,  wood:0,  desc:"基础材料 +10% 攻速"},
  {id:"frostb", cost:70,  wood:0,  desc:"基础材料 攻击减速"},
  {id:"rune",   cost:75,  wood:10, desc:"基础材料 攻速光环"},
  {id:"boot",   cost:65,  wood:0,  desc:"基础材料 +25 射程"},
  {id:"tome",   cost:70,  wood:0,  desc:"基础材料 +12% 伤害"}
];
function buyItem(idx){
  var s=SHOP_ITEMS[idx]; if(!s) return false;
  if(G.gold<s.cost||G.wood<s.wood){ toast("资源不足: 需 "+s.cost+"💰 "+s.wood+"🪵"); return false; }
  G.inv=G.inv||[];
  if(G.inv.length>=6){ toast("背包已满, 请先装备或出售"); return false; }
  G.gold-=s.cost; G.wood-=s.wood;
  G.inv.push(makeItem(s.id));
  synthInv(G.inv);
  addLog("🛒 购入 "+IMAP[s.id].icon+" "+IMAP[s.id].name,"gold");
  toast("🛒 已购入 "+IMAP[s.id].name);
  return true;
}

/* ================= 与渲染/UI 模块交互 (ui.js 注入) ================= */
window.WAR3 = {G:G, TOWERS:TOWERS, TMAP:TMAP, ITEMS:ITEMS, IMAP:IMAP, WAVES:WAVES,
  CHART:CHART, DMG:DMG, ARM:ARM, mult:mult, multLabel:multLabel, MAP:MAP, COLS:COLS, ROWS:ROWS,
  CELL:CELL, WAYPOINTS:WAYPOINTS, buildTower:buildTower, recalcTower:recalcTower, towerFire:towerFire,
  auraTick:auraTick, moveAlong:moveAlong, dealDamage:dealDamage, spawnEnemy:spawnEnemy,
  startWave:startWave, checkWaveEnd:checkWaveEnd, checkOver:checkOver, synthInv:synthInv,
  makeItem:makeItem, itemDef:itemDef, addLog:addLog, toast:toast, fxPop:fxPop, fxHit:fxHit,
  fxBolt:fxBolt, fxRing:fxRing, gainExp:gainExp, dropItem:dropItem, clamp:clamp, dist:dist,
  killEnemy:killEnemy, mult:mult,
  victory:victory, defeat:defeat, $:$, $$:$$,
  TECHS:TECHS, TECH_STATE:TECH_STATE, buyTech:buyTech, techCost:techCost, applyTech:applyTech,
  SHOP_ITEMS:SHOP_ITEMS, buyItem:buyItem, closeWaveModal:undefined};
})();