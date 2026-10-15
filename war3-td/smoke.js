// 本地冒烟测试: 模拟 DOM/Canvas, 加载 game.js + game-ui.js, 跑若干帧, 捕获异常
var fs = require("fs");

// ---- 极简 DOM/Canvas mock ----
function makeEl(id){
  return {
    id:id, children:[], style:{}, dataset:{}, hidden:false, disabled:false,
    className:"", textContent:"", innerHTML:"", value:"",
    classList:{add:function(){}, remove:function(){}, toggle:function(){}, contains:function(){return false;}},
    appendChild:function(c){this.children.push(c); return c;},
    removeChild:function(c){var i=this.children.indexOf(c); if(i>=0)this.children.splice(i,1);},
    querySelector:function(){return makeEl("q");},
    querySelectorAll:function(){return [];},
    closest:function(){return null;},
    addEventListener:function(){},
    getBoundingClientRect:function(){return {left:0,top:0,width:792,height:484};},
    parentElement:null
  };
}
var els = {};
function getEl(sel){
  var key=sel.replace(/[#.]/g,"");
  if(!els[key]) { els[key]=makeEl(key); els[key].parentElement = {clientWidth:792}; }
  return els[key];
}
// querySelectorAll 需要返回数组
global.document = {
  querySelector:function(sel){return getEl(sel);},
  querySelectorAll:function(){return [];},
  createElement:function(){return makeEl("c");},
  addEventListener:function(){}
};
global.window = {addEventListener:function(){}, devicePixelRatio:1, location:{reload:function(){}}};
global.devicePixelRatio = 1;
global.localStorage = {getItem:function(){return null;}, setItem:function(){}};
global.requestAnimationFrame = function(cb){ /* 手动驱动 */ global._raf = cb; };
global.setTimeout = function(f,t){ return 0; };
global.clearTimeout = function(){};

// Canvas mock
var canvasEl = getEl("cv");
canvasEl.getContext = function(){
  return new Proxy({}, {get:function(t,p){ return (typeof p==="string") ? function(){} : undefined; },
                        set:function(){return true;}});
};
canvasEl.parentElement = {clientWidth:792};

// ---- 加载脚本 ----
var errs = [];
try {
  var code1 = fs.readFileSync("game.js","utf8");
  eval(code1);
  console.log("LOADED game.js, WAR3=" + (typeof global.WAR3));
} catch(e){ errs.push("game.js load: "+e.stack); }

try {
  var code2 = fs.readFileSync("game-ui.js","utf8");
  eval(code2);
  console.log("LOADED game-ui.js");
} catch(e){ errs.push("game-ui.js load: "+e.stack); }

if(errs.length){ console.log("LOAD_ERRORS:"); errs.forEach(function(e){console.log(e);}); process.exit(1); }

var W = global.WAR3 || window.WAR3;
if(!W){ console.log("NO WAR3 exported"); process.exit(1); }
var G = W.G;
console.log("G ok, towers="+G.towers.length+" gold="+G.gold);

// ---- 跑帧 ----
try {
  // 模拟建造几座塔 (每座不同位置, 先加钱)
  G.gold = 5000;
  var t1=W.buildTower("cannon", 3, 0);
  var t2=W.buildTower("shaman", 5, 0);
  var t3=W.buildTower("hero", 7, 2);
  var t4=W.buildTower("paladin", 9, 0);
  var t5=W.buildTower("blademaster", 11, 2);
  console.log("build results: "+[t1,t2,t3,t4,t5].join(","));
  console.log("built towers: " + G.towers.length);

  // 模拟开波
  W.startWave();
  console.log("wave=" + G.wave + " enemies=" + G.enemies.length);

  // 驱动 300 帧 rAF
  if(global._raf){
    var ts = 0;
    for(var i=0;i<3000;i++){
      ts += 16.7;
      var cb = global._raf; global._raf = null;
      cb(ts);
      if(!global._raf) { console.log("rAF chain broken at frame "+i); break; }
      if(i%500===0) console.log("frame"+i+" enemies="+G.enemies.length+" gold="+Math.floor(G.gold)+" waveActive="+G.waveActive);
    }
  } else console.log("no rAF scheduled");
  console.log("AFTER_FRAMES enemies="+G.enemies.length+" bullets="+G.bullets.length+" effects="+G.effects.length+" hp="+G.hp+" wave="+G.wave+" gold="+Math.floor(G.gold));
  console.log("SMOKE_OK");
} catch(e){
  console.log("RUNTIME_ERROR: " + e.stack);
  process.exit(1);
}