'use strict';
/**
 * 集成测试：启动真实 server.js 子进程，通过 HTTP 验证全部 REST 端点。
 *
 * 覆盖：
 *   - /api/health
 *   - 注册 / 登录 / 鉴权失败
 *   - /api/me
 *   - 项目 CRUD + 同名校验
 *   - 任务 CRUD + 状态流转 + 非法状态校验
 *   - 静态页面托管 (GET /)
 *   - 404 / 401 / 400 错误路径
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 8793;
const BASE = `http://127.0.0.1:${PORT}`;
const DB_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tb-int-')), 'data.json');

let proc = null;
let token = null;
let userId = null;

async function api(method, p, body, tok) {
  const headers = { 'Content-Type': 'application/json' };
  const t = tok !== undefined ? tok : token;
  if (t) headers['Authorization'] = 'Bearer ' + t;
  const res = await fetch(BASE + p, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch (e) { /* 非 JSON */ }
  return { status: res.status, json };
}

before(async () => {
  fs.rmSync(DB_FILE, { force: true });
  proc = spawn('node', [path.join(ROOT, 'src', 'server.js')], {
    env: { ...process.env, PORT: String(PORT), DB_FILE },
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // 等待启动
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(BASE + '/api/health');
      if (r.ok) return;
    } catch (e) { /* 还没起来 */ }
    await new Promise(r => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error('server 未能启动');
});

after(() => {
  if (proc) proc.kill();
  fs.rmSync(path.dirname(DB_FILE), { recursive: true, force: true });
});

test('GET /api/health 返回 ok', async () => {
  const r = await api('GET', '/api/health', undefined, null);
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.json, { ok: true });
});

test('注册：用户名过短 400', async () => {
  const r = await api('POST', '/api/auth/register', { username: 'ab', password: '123456' }, null);
  assert.strictEqual(r.status, 400);
  assert.ok(r.json.error.includes('至少'));
});

test('注册：密码过短 400', async () => {
  const r = await api('POST', '/api/auth/register', { username: 'tester1', password: '123' }, null);
  assert.strictEqual(r.status, 400);
  assert.ok(r.json.error.includes('至少'));
});

test('注册成功返回 token', async () => {
  const r = await api('POST', '/api/auth/register', { username: 'tester1', password: 'secret99' }, null);
  assert.strictEqual(r.status, 201);
  assert.ok(r.json.token && r.json.token.length >= 32, '应返回 token');
  assert.strictEqual(r.json.user.username, 'tester1');
  token = r.json.token;
  userId = r.json.user.id;
});

test('重复注册 409', async () => {
  const r = await api('POST', '/api/auth/register', { username: 'tester1', password: 'secret99' }, null);
  assert.strictEqual(r.status, 409);
});

test('登录成功返回 token', async () => {
  const r = await api('POST', '/api/auth/login', { username: 'tester1', password: 'secret99' }, null);
  assert.strictEqual(r.status, 200);
  assert.ok(r.json.token);
});

test('登录：密码错误 401', async () => {
  const r = await api('POST', '/api/auth/login', { username: 'tester1', password: 'wrong' }, null);
  assert.strictEqual(r.status, 401);
});

test('未授权访问 /api/me 401', async () => {
  const r = await api('GET', '/api/me', undefined, '');
  assert.strictEqual(r.status, 401);
});

test('/api/me 返回当前用户', async () => {
  const r = await api('GET', '/api/me');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.user.username, 'tester1');
  assert.strictEqual(r.json.user.id, userId);
});

test('项目列表初始为空', async () => {
  const r = await api('GET', '/api/projects');
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.json.projects, []);
});

test('创建项目', async () => {
  const r = await api('POST', '/api/projects', { name: '集成测试项目' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.json.project.name, '集成测试项目');
  assert.strictEqual(r.json.project.task_count, 0);
});

test('同名项目 409', async () => {
  const r = await api('POST', '/api/projects', { name: '集成测试项目' });
  assert.strictEqual(r.status, 409);
});

test('项目名过短 400', async () => {
  const r = await api('POST', '/api/projects', { name: 'x' });
  assert.strictEqual(r.status, 400);
});

test('项目列表包含新项目', async () => {
  const r = await api('GET', '/api/projects');
  assert.strictEqual(r.json.projects.length, 1);
  assert.strictEqual(r.json.projects[0].name, '集成测试项目');
});

let projectId = null;
let taskId = null;

test('获取项目 id', async () => {
  const r = await api('GET', '/api/projects');
  projectId = r.json.projects[0].id;
  assert.ok(projectId);
});

test('项目任务初始为空', async () => {
  const r = await api('GET', `/api/projects/${projectId}/tasks`);
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.json.tasks, []);
});

test('创建任务（默认 todo）', async () => {
  const r = await api('POST', `/api/projects/${projectId}/tasks`, { title: '写单测' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.json.task.title, '写单测');
  assert.strictEqual(r.json.task.status, 'todo');
  taskId = r.json.task.id;
});

test('任务标题过短 400', async () => {
  const r = await api('POST', `/api/projects/${projectId}/tasks`, { title: 'a' });
  assert.strictEqual(r.status, 400);
});

test('非法状态 400', async () => {
  const r = await api('POST', `/api/projects/${projectId}/tasks`, { title: 'ok', status: 'bad' });
  assert.strictEqual(r.status, 400);
});

test('不存在的项目 404', async () => {
  const r = await api('GET', '/api/projects/99999/tasks');
  assert.strictEqual(r.status, 404);
});

test('任务状态流转 todo -> in_progress -> done', async () => {
  let r = await api('PATCH', `/api/tasks/${taskId}`, { status: 'in_progress' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.task.status, 'in_progress');

  r = await api('PATCH', `/api/tasks/${taskId}`, { status: 'done' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.task.status, 'done');
});

test('PATCH 非法状态 400', async () => {
  const r = await api('PATCH', `/api/tasks/${taskId}`, { status: 'nope' });
  assert.strictEqual(r.status, 400);
});

test('PATCH 重命名任务', async () => {
  const r = await api('PATCH', `/api/tasks/${taskId}`, { title: '写集成测试' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.task.title, '写集成测试');
});

test('不存在的任务 PATCH 404', async () => {
  const r = await api('PATCH', '/api/tasks/99999', { status: 'done' });
  assert.strictEqual(r.status, 404);
});

test('删除任务', async () => {
  let r = await api('DELETE', `/api/tasks/${taskId}`);
  assert.strictEqual(r.status, 200);
  r = await api('GET', `/api/projects/${projectId}/tasks`);
  assert.deepStrictEqual(r.json.tasks, []);
});

test('再次删除同一任务 404', async () => {
  const r = await api('DELETE', `/api/tasks/${taskId}`);
  assert.strictEqual(r.status, 404);
});

test('无效 JSON body 400/500', async () => {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });
  assert.ok(res.status === 400 || res.status === 500, '实际 ' + res.status);
});

test('静态页面 GET / 返回 HTML', async () => {
  const res = await fetch(BASE + '/');
  assert.strictEqual(res.status, 200);
  const ct = res.headers.get('content-type') || '';
  assert.ok(ct.includes('text/html'), 'content-type: ' + ct);
  const body = await res.text();
  assert.ok(body.includes('<title>'), '应包含 title');
});

test('未知 API 路径 404', async () => {
  const r = await api('GET', '/api/nope', undefined, token);
  assert.strictEqual(r.status, 404);
});

test('登录后的 token 能继续用（持久化）', async () => {
  const r = await api('GET', '/api/me');
  assert.strictEqual(r.status, 200);
});
