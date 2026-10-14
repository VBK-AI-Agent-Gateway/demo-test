'use strict';
/**
 * 单元测试：scripts/lint_html.js 的 lintHtml
 * 通过构造临时 HTML 文件验证每条规则能正确触发/放行。
 */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { lintHtml } = require('../../scripts/lint_html.js');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-html-'));

function makeHtml(body) {
  const f = path.join(tmpDir, 'case-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(f, body);
  return f;
}

function rulesOf(issues) {
  return new Set(issues.map(i => i.rule));
}

const VALID = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>合法页面</title>
</head>
<body>
<p id="a">hello</p>
<img src="x.png" alt="图">
</body>
</html>`;

test('合法 HTML 无 error', () => {
  const issues = lintHtml(makeHtml(VALID));
  const errors = issues.filter(i => i.sev === 'error');
  assert.deepStrictEqual(errors, [], '合法 HTML 不应有 error: ' + JSON.stringify(errors));
});

test('缺少 DOCTYPE 报错', () => {
  const issues = lintHtml(makeHtml(VALID.replace('<!DOCTYPE html>\n', '')));
  assert.ok(rulesOf(issues).has('doctype'));
});

test('html 缺 lang 报错', () => {
  const issues = lintHtml(makeHtml(VALID.replace(' lang="zh-CN"', '')));
  assert.ok(rulesOf(issues).has('html-lang'));
});

test('缺 charset 报错', () => {
  const issues = lintHtml(makeHtml(VALID.replace('<meta charset="UTF-8">\n', '')));
  assert.ok(rulesOf(issues).has('charset'));
});

test('缺 viewport 报错', () => {
  const issues = lintHtml(makeHtml(VALID.replace(/<meta name="viewport"[^>]*>\n/, '')));
  assert.ok(rulesOf(issues).has('viewport'));
});

test('title 为空报错', () => {
  const issues = lintHtml(makeHtml(VALID.replace('<title>合法页面</title>', '<title> </title>')));
  assert.ok(rulesOf(issues).has('title'));
});

test('重复 id 报错', () => {
  const dup = VALID.replace('<p id="a">hello</p>', '<p id="a">one</p>\n<p id="a">two</p>');
  const issues = lintHtml(makeHtml(dup));
  assert.ok(rulesOf(issues).has('dup-id'));
});

test('img 缺 alt 报错', () => {
  const bad = VALID.replace(' alt="图"', '');
  const issues = lintHtml(makeHtml(bad));
  assert.ok(rulesOf(issues).has('img-alt'));
});

test('内联 onclick 报错', () => {
  const bad = VALID.replace('<p id="a">hello</p>', '<p id="a" onclick="go()">hello</p>');
  const issues = lintHtml(makeHtml(bad));
  assert.ok(rulesOf(issues).has('no-inline-handler'));
});

test('标签不匹配报错', () => {
  const bad = VALID.replace('</p>', '</div>');
  const issues = lintHtml(makeHtml(bad));
  assert.ok(rulesOf(issues).has('mismatch') || rulesOf(issues).has('unmatched-close') || rulesOf(issues).has('unclosed'));
});

test('未闭合标签报错', () => {
  const bad = VALID.replace('</body>', '');
  const issues = lintHtml(makeHtml(bad));
  const rules = rulesOf(issues);
  assert.ok(rules.has('unclosed') || rules.has('mismatch'),
    '缺少 </body> 应报 unclosed 或 mismatch，实际: ' + [...rules].join(','));
});

test('属性未加引号报错', () => {
  const bad = VALID.replace('id="a"', 'id=a');
  const issues = lintHtml(makeHtml(bad));
  assert.ok(rulesOf(issues).has('attr-quotes'));
});

test('script 内的标签不影响配对', () => {
  const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>t</title></head>
<body>
<script>
  // 这里有 <div> 文本但不该被解析为标签
  const s = "</div>";
  if (true) { console.log("<p>"); }
</script>
</body>
</html>`;
  const issues = lintHtml(makeHtml(page));
  const errors = issues.filter(i => i.sev === 'error');
  assert.deepStrictEqual(errors, [], 'script 内容不应影响标签配对: ' + JSON.stringify(errors));
});
