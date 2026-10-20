/* 坦克跳坑 · 经典高级版 — 纯原生 Canvas 实现 */
(() => {
"use strict";

const cv = document.getElementById("game");
const ctx = cv.getContext("2d");
const W = cv.width, H = cv.height;

// ---------- HUD ----------
const hud = {
  coins: document.getElementById("coins"),
  dist: document.getElementById("dist"),
  best: document.getElementById("best"),
  score: document.getElementById("score"),
};
const BEST_KEY = "tankJumpBest";
let best = +(localStorage.getItem(BEST_KEY) || 0);
hud.best.textContent = best;

// ---------- 音效（WebAudio 合成，无外部资源） ----------
let actx = null;
function beep(freq, dur = 0.08, type = "square", vol = 0.06) {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) {}
}
const sndJump = () => beep(300, 0.12, "square", 0.07);
const sndCoin = () => { beep(880, 0.06, "square"); setTimeout(() => beep(1320, 0.08, "square"), 60); };
const sndDie  = () => { beep(200, 0.2, "sawtooth", 0.09); setTimeout(() => beep(120, 0.35, "sawtooth", 0.09), 150); };

// ---------- 游戏状态 ----------
const STATE = { MENU: 0, PLAY: 1, PAUSE: 2, OVER: 3 };
let state = STATE.MENU;
let coins = 0, dist = 0, score = 0, t = 0;

// 地形：平台段序列。每段 {x, w, gap(bool)} —— gap=true 表示深坑
const GROUND_Y = H - 90;
let segs = [];        // 实心地面段 [{x,w}]
let gapWidths = [];   // 深坑 [{x,w}]
let nextX = 0;
const TANK_SPEED = 3.2;
const GRAVITY = 0.55;
const JUMP_V = -13.5;

const tank = { x: 0, y: GROUND_Y - 34, vy: 0, onGround: true, rot: 0, w: 74, h: 34 };
let camX = 0;

// 金币与障碍
let pickups = [];   // {x,y,got}
let spikes = [];    // {x} 尖刺障碍（可碾过但减速）

function resetGame() {
  segs = [{ x: -400, w: 900 }];
  gapWidths = [];
  nextX = 500;
  pickups = [];
  spikes = [];
  coins = 0; dist = 0; score = 0; t = 0;
  tank.x = 60; tank.y = GROUND_Y - tank.h; tank.vy = 0;
  tank.onGround = true; tank.rot = 0;
  camX = Math.max(0, tank.x - 260);
  genTerrain(tank.x + W + 600);
}

function genTerrain(untilX) {
  while (nextX < untilX) {
    // 难度曲线：随距离坑更宽、平台更短
    const diff = Math.min(1, tank.x / 9000);
    const pw = 140 + Math.random() * (320 - 160 * diff);
    segs.push({ x: nextX, w: pw });
    // 该平台上撒金币
    if (Math.random() < 0.8) {
      const n = 1 + (Math.random() * 3 | 0);
      for (let i = 0; i < n; i++) {
        pickups.push({ x: nextX + 30 + i * 34, y: GROUND_Y - 60 - Math.random() * 40, got: false });
      }
    }
    if (Math.random() < 0.25 && pw > 220) {
      spikes.push({ x: nextX + pw - 60 });
    }
    nextX += pw;
    // 深坑
    const gw = 70 + Math.random() * (60 + 90 * diff);
    gapWidths.push({ x: nextX, w: gw });
    nextX += gw;
  }
  // 清理屏幕外旧数据
  const cull = camX - 700;
  segs = segs.filter(s => s.x + s.w > cull);
  gapWidths = gapWidths.filter(g => g.x + g.w > cull);
  pickups = pickups.filter(p => p.x > cull);
  spikes = spikes.filter(s => s.x > cull);
}

function groundAt(x) {
  // 返回 x 处地面顶 y，坑内返回 null
  for (const s of segs) if (x >= s.x && x <= s.x + s.w) return GROUND_Y;
  return null;
}

// ---------- 输入 ----------
const keys = {};
addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    if (state === STATE.MENU || state === STATE.OVER) { resetGame(); state = STATE.PLAY; beep(660, .1); }
    else if (state === STATE.PLAY && tank.onGround) { tank.vy = JUMP_V; tank.onGround = false; sndJump(); }
    else if (state === STATE.PAUSE) state = STATE.PLAY;
  }
  if (e.code === "KeyP" && (state === STATE.PLAY || state === STATE.PAUSE)) {
    state = state === STATE.PLAY ? STATE.PAUSE : STATE.PLAY;
  }
  if (e.code === "KeyR") { resetGame(); state = STATE.PLAY; }
});
addEventListener("keyup", e => keys[e.code] = false);

// 触屏：点画布 = 起跳/开始
cv.addEventListener("pointerdown", e => {
  if (state === STATE.MENU || state === STATE.OVER) { resetGame(); state = STATE.PLAY; }
  else if (state === STATE.PLAY && tank.onGround) { tank.vy = JUMP_V; tank.onGround = false; sndJump(); }
});
// 触屏姿态按钮
const touchBar = document.createElement("div");
touchBar.id = "touch";
touchBar.innerHTML = `<button data-k="ArrowLeft">◀</button><button data-k="Space">▲ 跳</button><button data-k="ArrowRight">▶</button>`;
document.getElementById("wrap").appendChild(touchBar);
touchBar.querySelectorAll("button").forEach(b => {
  const k = b.dataset.k;
  b.addEventListener("pointerdown", e => { e.preventDefault(); keys[k] = true; if (k === "Space") window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" })); });
  b.addEventListener("pointerup", () => keys[k] = false);
  b.addEventListener("pointercancel", () => keys[k] = false);
});

// ---------- 粒子 ----------
let parts = [];
function burst(x, y, color, n = 10) {
  for (let i = 0; i < n; i++)
    parts.push({ x, y, vx: (Math.random() - .5) * 5, vy: -Math.random() * 4, life: 30 + Math.random() * 20, color });
}

// ---------- 更新 ----------
function update() {
  t++;
  if (state !== STATE.PLAY) return;

  // 水平
  tank.x += TANK_SPEED;
  if (keys.ArrowRight) tank.x += 1.4;
  if (keys.ArrowLeft && !tank.onGround) tank.x -= 1.6;

  // 重力
  tank.vy += GRAVITY;
  tank.y += tank.vy;

  // 地面碰撞（只检测车体底部两角中点附近）
  const gL = groundAt(tank.x + 8), gR = groundAt(tank.x + tank.w - 8);
  const g = (gL !== null && gR !== null) ? GROUND_Y : null;
  const foot = tank.y + tank.h;
  if (g !== null && foot >= g && tank.vy >= 0 && (tank.y + tank.h - tank.vy) <= g + 2) {
    tank.y = g - tank.h; tank.vy = 0; tank.onGround = true;
    tank.rot = 0;
  } else if (g === null) {
    tank.onGround = false;
    // 空中姿态
    if (keys.ArrowRight) tank.rot += 0.045;
    if (keys.ArrowLeft) tank.rot -= 0.045;
    tank.rot *= 0.98;
  } else {
    tank.onGround = false;
  }

  // 坠落判定
  if (tank.y > H + 120) {
    state = STATE.OVER; sndDie();
    burst(tank.x, H, "#ff5533", 20);
    saveBest();
  }

  // 金币
  for (const p of pickups) {
    if (!p.got && Math.abs(p.x - (tank.x + tank.w / 2)) < 34 && Math.abs(p.y - (tank.y + tank.h / 2)) < 40) {
      p.got = true; coins++; score += 100; sndCoin();
      burst(p.x, p.y, "#ffcc33", 8);
    }
  }
  // 尖刺：跳起时碾过，平地撞上则失速 + 扣分
  for (let i = spikes.length - 1; i >= 0; i--) {
    const s = spikes[i];
    if (Math.abs(s.x - (tank.x + tank.w / 2)) < 26) {
      if (tank.y + tank.h < GROUND_Y - 18) { score += 50; burst(s.x, GROUND_Y - 10, "#cccccc", 6); spikes.splice(i, 1); }
      else if (tank.onGround) { tank.x -= 14; score = Math.max(0, score - 30); burst(s.x, GROUND_Y - 10, "#ff5533", 8); spikes.splice(i, 1); beep(150, .15, "sawtooth", .08); }
    }
  }

  dist = Math.max(dist, Math.floor(tank.x / 40));
  score += 0.1;

  // 相机
  camX = Math.max(camX, tank.x - 260);
  if (tank.x - camX > W * 0.62) camX = tank.x - W * 0.62;

  genTerrain(camX + W + 700);

  // 粒子
  parts = parts.filter(p => (p.life--, p.life > 0));
  for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; }

  // HUD
  hud.coins.textContent = coins;
  hud.dist.textContent = dist;
  hud.score.textContent = Math.floor(score);
}

function saveBest() {
  if (dist > best) { best = dist; localStorage.setItem(BEST_KEY, best); hud.best.textContent = best; }
}

// ---------- 渲染 ----------
function draw() {
  // 天空渐变（黄昏战场）
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a2a3a"); sky.addColorStop(0.6, "#2d3b2a"); sky.addColorStop(1, "#141c12");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // 远山（视差）
  ctx.fillStyle = "#22331f";
  for (let i = 0; i < 8; i++) {
    const mx = ((i * 320 - camX * 0.3) % (W + 400)) - 200;
    ctx.beginPath();
    ctx.moveTo(mx, GROUND_Y);
    ctx.lineTo(mx + 140, GROUND_Y - 120 - (i % 3) * 40);
    ctx.lineTo(mx + 300, GROUND_Y);
    ctx.fill();
  }
  // 月亮
  ctx.fillStyle = "#e8dfb0";
  ctx.beginPath(); ctx.arc(W - 120, 80, 26, 0, 7); ctx.fill();

  ctx.save();
  ctx.translate(-camX, 0);

  // 地面段
  for (const s of segs) {
    ctx.fillStyle = "#3d2f1e";
    ctx.fillRect(s.x, GROUND_Y, s.w, H - GROUND_Y);
    ctx.fillStyle = "#5a8f3c";
    ctx.fillRect(s.x, GROUND_Y - 6, s.w, 8);
    // 草点
    ctx.fillStyle = "#7ac142";
    for (let gx = s.x; gx < s.x + s.w; gx += 26) ctx.fillRect(gx, GROUND_Y - 10, 4, 4);
    // 土壤纹理
    ctx.fillStyle = "#2c2115";
    for (let gx = s.x + 10; gx < s.x + s.w; gx += 40) ctx.fillRect(gx, GROUND_Y + 20 + (gx % 30), 8, 6);
  }
  // 坑壁阴影
  for (const g of gapWidths) {
    ctx.fillStyle = "#050705";
    ctx.fillRect(g.x, GROUND_Y - 6, g.w, H - GROUND_Y + 6);
    ctx.fillStyle = "#000";
    ctx.fillRect(g.x - 3, GROUND_Y - 6, 3, 30);
    ctx.fillRect(g.x + g.w, GROUND_Y - 6, 3, 30);
  }

  // 金币
  for (const p of pickups) {
    if (p.got) continue;
    const bob = Math.sin(t * 0.08 + p.x) * 4;
    const squish = Math.abs(Math.sin(t * 0.06 + p.x));
    ctx.fillStyle = "#ffcc33";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + bob, 9 * Math.max(.3, squish), 11, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#e0a020";
    ctx.fillRect(p.x - 2, p.y + bob - 5, 3, 10);
  }

  // 尖刺
  ctx.fillStyle = "#b9c4b0";
  for (const s of spikes) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + i * 14 - 7, GROUND_Y);
      ctx.lineTo(s.x + i * 14, GROUND_Y - 22);
      ctx.lineTo(s.x + i * 14 + 7, GROUND_Y);
      ctx.fill();
    }
  }

  // 粒子
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, p.life / 40);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;

  // 坦克
  drawTank(tank.x, tank.y, tank.rot);

  ctx.restore();

  // 状态遮罩
  if (state === STATE.MENU) overlay("坦克跳坑", "经典高级版", "按 空格 / 点击 开始", "跳过深坑 · 收集金币 · 锯断尖刺");
  else if (state === STATE.PAUSE) overlay("暂停中", "", "按 P / 空格 继续", "");
  else if (state === STATE.OVER) overlay("任务失败!", `距离 ${dist}m · 金币 ${coins} · 得分 ${Math.floor(score)}`, "按 空格 / R 重新出击", dist >= best && dist > 0 ? "🏆 新纪录!" : `最佳 ${best}m`);
}

function drawTank(x, y, rot) {
  ctx.save();
  ctx.translate(x + tank.w / 2, y + tank.h / 2);
  ctx.rotate(rot);
  ctx.translate(-tank.w / 2, -tank.h / 2);
  // 尾气
  if (state === STATE.PLAY) {
    ctx.fillStyle = "rgba(180,180,160,.35)";
    ctx.fillRect(-8, tank.h - 14, 6, 6);
  }
  // 履带
  ctx.fillStyle = "#23281f";
  roundRect(0, tank.h - 14, tank.w, 14, 7);
  // 履带纹
  ctx.fillStyle = "#3a4232";
  const off = (tank.x * 0.6) % 14;
  for (let i = -1; i < 6; i++) ctx.fillRect(((i * 14 + off) % tank.w + tank.w) % tank.w, tank.h - 13, 5, 12);
  // 轮子
  ctx.fillStyle = "#111";
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(12 + i * 17, tank.h - 7, 5, 0, 7); ctx.fill(); }
  // 车体
  ctx.fillStyle = "#4f7a35";
  roundRect(4, 8, tank.w - 8, 14, 3);
  ctx.fillStyle = "#619445";
  ctx.fillRect(8, 10, tank.w - 16, 4);
  // 炮塔
  ctx.fillStyle = "#456b2e";
  roundRect(tank.w / 2 - 16, -4, 34, 16, 4);
  // 炮管
  ctx.fillStyle = "#2e4a1f";
  ctx.fillRect(tank.w / 2 + 14, 0, 30, 6);
  ctx.fillStyle = "#1c2e13";
  ctx.fillRect(tank.w / 2 + 42, -1, 6, 8);
  // 舱盖
  ctx.fillStyle = "#6fae4c";
  ctx.beginPath(); ctx.arc(tank.w / 2 - 2, -4, 6, Math.PI, 0); ctx.fill();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

function overlay(title, sub, action, foot) {
  ctx.fillStyle = "rgba(5,8,5,.72)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#7ac142";
  ctx.font = "bold 54px 'Courier New',monospace";
  ctx.fillText(title, W / 2, H / 2 - 60);
  if (sub) { ctx.fillStyle = "#ffcc33"; ctx.font = "22px 'Courier New',monospace"; ctx.fillText(sub, W / 2, H / 2 - 14); }
  if (foot) { ctx.fillStyle = "#d7e6cf"; ctx.font = "18px 'Courier New',monospace"; ctx.fillText(foot, W / 2, H / 2 + 24); }
  if (action) {
    ctx.fillStyle = (t % 60 < 40) ? "#ffffff" : "#7ac142";
    ctx.font = "bold 24px 'Courier New',monospace";
    ctx.fillText(action, W / 2, H / 2 + 76);
  }
  ctx.textAlign = "left";
}

// ---------- 主循环 ----------
resetGame();
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
})();