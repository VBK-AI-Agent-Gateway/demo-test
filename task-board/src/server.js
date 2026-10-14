#!/usr/bin/env node
/**
 * 任务看板后端 API（零依赖 Node）
 * REST 端点：
 *   POST /api/auth/register   {username,password}
 *   POST /api/auth/login      {username,password} -> {token}
 *   GET  /api/me              Bearer
 *   GET  /api/projects        Bearer
 *   POST /api/projects        {name}
 *   GET  /api/projects/:id/tasks
 *   POST /api/projects/:id/tasks  {title,status}
 *   PATCH /api/tasks/:id      {status?|title?}
 *   DELETE /api/tasks/:id
 * 持久化到 data.db (sqlite3 via node:sqlite)
 */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data.db');
const DB_DIR = path.dirname(DB_FILE);
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// ---- 简易 JSON 文件持久化（零依赖）----
let state = { users: [], tokens: {}, projects: [], tasks: [], seq: { user: 0, project: 0, task: 0 } };
function loadState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      if (raw.trim()) state = Object.assign(state, JSON.parse(raw));
    }
  } catch (e) { /* 忽略损坏的数据文件，重新初始化 */ }
}
function saveState() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, DB_FILE);
}
loadState();

const VALID_STATUS = new Set(['todo', 'in_progress', 'done']);

function hashPassword(pass, salt) {
  return crypto.scryptSync(String(pass), salt, 32).toString('hex');
}
function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 1e6) { reject(new Error('payload too large')); req.destroy(); return; }
      data += c;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function authUser(req) {
  const h = req.headers['authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) return null;
  const uid = state.tokens[m[1]];
  return uid !== null && uid !== undefined ? uid : null;
}
function findUserByName(name) { return state.users.find(u => u.username === name); }
function findUser(id) { return state.users.find(u => u.id === id); }
function nextId(kind) { state.seq[kind] = (state.seq[kind] || 0) + 1; return state.seq[kind]; }
function issueToken(uid) {
  const t = newToken();
  state.tokens[t] = uid;
  return t;
}
function projectsOf(uid) {
  return state.projects.filter(p => p.user_id === uid)
    .map(p => ({ ...p, task_count: state.tasks.filter(t => t.project_id === p.id).length }))
    .sort((a, b) => b.id - a.id);
}
function tasksOf(pid) {
  return state.tasks.filter(t => t.project_id === pid).sort((a, b) => a.id - b.id);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  try {
    if (req.method === 'GET' && p === '/api/health') {
      return send(res, 200, { ok: true });
    }

    // ---- 静态页面托管（让同一进程即可访问前端，无需额外 HTTP 服务）----
    if (req.method === 'GET' && !p.startsWith('/api/')) {
      const rel = (p === '/' || p === '') ? '/index.html' : p;
      const fp = path.normalize(path.join(__dirname, rel));
      if (fp.startsWith(__dirname) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        const data = fs.readFileSync(fp);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length });
        return res.end(data);
      }
    }

    // ---- auth ----
    if (req.method === 'POST' && p === '/api/auth/register') {
      const b = await readBody(req);
      const username = String(b.username || '').trim();
      const password = String(b.password || '');
      if (username.length < 3) return send(res, 400, { error: '用户名至少 3 个字符' });
      if (password.length < 6) return send(res, 400, { error: '密码至少 6 个字符' });
      if (findUserByName(username)) return send(res, 409, { error: '用户名已存在' });
      const salt = crypto.randomBytes(16).toString('hex');
      const u = { id: nextId('user'), username, pass_hash: hashPassword(password, salt), salt, created_at: Date.now() };
      state.users.push(u);
      const token = issueToken(u.id);
      saveState();
      return send(res, 201, { token, user: { id: u.id, username } });
    }

    if (req.method === 'POST' && p === '/api/auth/login') {
      const b = await readBody(req);
      const username = String(b.username || '').trim();
      const password = String(b.password || '');
      const u = findUserByName(username);
      if (!u) return send(res, 401, { error: '用户名或密码错误' });
      if (hashPassword(password, u.salt) !== u.pass_hash) return send(res, 401, { error: '用户名或密码错误' });
      const token = issueToken(u.id);
      saveState();
      return send(res, 200, { token, user: { id: u.id, username: u.username } });
    }

    // ---- auth required below ----
    const uid = authUser(req);
    if (!uid) return send(res, 401, { error: '未登录或登录已过期' });

    if (req.method === 'GET' && p === '/api/me') {
      const u = findUser(uid);
      if (!u) return send(res, 401, { error: '未登录或登录已过期' });
      return send(res, 200, { user: { id: u.id, username: u.username } });
    }

    if (req.method === 'GET' && p === '/api/projects') {
      return send(res, 200, { projects: projectsOf(uid) });
    }

    if (req.method === 'POST' && p === '/api/projects') {
      const b = await readBody(req);
      const name = String(b.name || '').trim();
      if (name.length < 2) return send(res, 400, { error: '项目名至少 2 个字符' });
      if (state.projects.some(x => x.user_id === uid && x.name === name))
        return send(res, 409, { error: '同名项目已存在' });
      const id = nextId('project');
      state.projects.push({ id, user_id: uid, name, created_at: Date.now() });
      saveState();
      return send(res, 201, { project: { id, name, task_count: 0 } });
    }

    let m;
    if ((m = /^\/api\/projects\/(\d+)\/tasks$/.exec(p))) {
      const pid = Number(m[1]);
      const proj = state.projects.find(x => x.id === pid && x.user_id === uid);
      if (!proj) return send(res, 404, { error: '项目不存在' });
      if (req.method === 'GET') {
        return send(res, 200, { tasks: tasksOf(pid) });
      }
      if (req.method === 'POST') {
        const b = await readBody(req);
        const title = String(b.title || '').trim();
        const status = String(b.status || 'todo');
        if (title.length < 2) return send(res, 400, { error: '任务标题至少 2 个字符' });
        if (!VALID_STATUS.has(status)) return send(res, 400, { error: '非法状态' });
        const id = nextId('task');
        state.tasks.push({ id, project_id: pid, title, status, created_at: Date.now() });
        saveState();
        return send(res, 201, { task: { id, project_id: pid, title, status } });
      }
    }

    if ((m = /^\/api\/tasks\/(\d+)$/.exec(p))) {
      const tid = Number(m[1]);
      const task = state.tasks.find(t => t.id === tid &&
        state.projects.some(x => x.id === t.project_id && x.user_id === uid));
      if (!task) return send(res, 404, { error: '任务不存在' });

      if (req.method === 'PATCH') {
        const b = await readBody(req);
        if (b.title !== undefined) {
          const title = String(b.title).trim();
          if (title.length < 2) return send(res, 400, { error: '任务标题至少 2 个字符' });
          task.title = title;
        }
        if (b.status !== undefined) {
          const status = String(b.status);
          if (!VALID_STATUS.has(status)) return send(res, 400, { error: '非法状态' });
          task.status = status;
        }
        saveState();
        return send(res, 200, { task: { ...task } });
      }
      if (req.method === 'DELETE') {
        state.tasks = state.tasks.filter(t => t.id !== tid);
        saveState();
        return send(res, 200, { ok: true });
      }
    }

    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 500, { error: e.message || 'server error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('API listening on http://127.0.0.1:' + PORT);
});
