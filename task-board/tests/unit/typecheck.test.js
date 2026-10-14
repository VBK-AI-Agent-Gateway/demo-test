'use strict';
/**
 * 单元测试：scripts/typecheck.js 的 checkFile
 * 验证 typecheck 能捕获常见错误，且不误报正确代码。
 */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkFile } = require('../../scripts/typecheck.js');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typecheck-'));

function check(src) {
  const f = path.join(tmpDir, 'case-' + Math.random().toString(36).slice(2) + '.js');
  fs.writeFileSync(f, src);
  return checkFile(f);
}

test('正确代码 0 errors', () => {
  const diags = check(`
function add(a, b) { return a + b; }
const x = add(1, 2);
function greet(name) { return 'hi ' + name; }
greet('bob');
`);
  const errors = diags.filter(d => d.severity === 'error');
  assert.deepStrictEqual(errors.map(d => d.message), []);
});

test('未定义变量报错', () => {
  const diags = check(`const y = notDefinedAnywhere;`);
  assert.ok(diags.some(d => d.severity === 'error' && d.message.includes('notDefinedAnywhere')));
});

test('调用参数个数不匹配报错', () => {
  const diags = check(`
function f(a, b) { return a + b; }
f(1);
`);
  assert.ok(diags.some(d => d.severity === 'error' && d.message.includes('期望 2 个参数')),
    '实际: ' + JSON.stringify(diags.map(d => d.message)));
});

test('重复声明报错', () => {
  const diags = check(`const a = 1;\nconst a = 2;`);
  assert.ok(diags.some(d => d.severity === 'error' && d.message.includes('重复声明')));
});

test('函数体内 return 后的语句不额外报错（宽松）', () => {
  const diags = check(`
function f() {
  if (true) { return 1; }
  return 2;
}
f();
`);
  const errors = diags.filter(d => d.severity === 'error');
  assert.deepStrictEqual(errors.map(d => d.message), []);
});

test('箭头函数参数不报未定义', () => {
  const diags = check(`
const arr = [1, 2, 3];
const doubled = arr.map(x => x * 2);
`);
  const errors = diags.filter(d => d.severity === 'error');
  assert.deepStrictEqual(errors.map(d => d.message), []);
});

test('catch 参数不报未定义', () => {
  const diags = check(`
function risky() { return 1; }
try { risky(); } catch (e) { console.log(e.message); }
`);
  const errors = diags.filter(d => d.severity === 'error');
  assert.deepStrictEqual(errors.map(d => d.message), []);
});

test('for-of 变量不报未定义', () => {
  const diags = check(`
const list = [1, 2];
for (const item of list) { console.log(item); }
`);
  const errors = diags.filter(d => d.severity === 'error');
  assert.deepStrictEqual(errors.map(d => d.message), []);
});

test('正则字面量不被误判', () => {
  const diags = check(`
const re = /^Bearer\\s+(.+)$/i;
const m = re.exec('Bearer abc');
if (m) { console.log(m[1]); }
`);
  const errors = diags.filter(d => d.severity === 'error');
  assert.deepStrictEqual(errors.map(d => d.message), []);
});

test('未使用局部变量是 warning 不是 error', () => {
  const diags = check(`function f() { const unusedThing = 42; return 1; }\nf();`);
  const errors = diags.filter(d => d.severity === 'error');
  const warnings = diags.filter(d => d.severity === 'warning');
  assert.deepStrictEqual(errors, []);
  assert.ok(warnings.some(w => w.message.includes('unusedThing')));
});
