'use strict';
/**
 * 单元测试：scripts/build.js 的 minifyHtml
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { minifyHtml } = require('../../scripts/build.js');

test('minifyHtml 移除 HTML 注释', () => {
  const html = '<p>hi</p><!-- comment --><p>yo</p>';
  const out = minifyHtml(html);
  assert.ok(!out.includes('comment'), '注释应被移除');
  assert.ok(out.includes('<p>hi</p>'));
  assert.ok(out.includes('<p>yo</p>'));
});

test('minifyHtml 保留条件注释', () => {
  const html = '<p>a</p><!--[if lt IE 9]><script src="x.js"></script><![endif]-->';
  const out = minifyHtml(html);
  assert.ok(out.includes('[if lt IE 9]'), '条件注释应保留');
});

test('minifyHtml 压缩标签间空白但不破坏内容', () => {
  const html = '<div>\n  <p>hello   world</p>\n</div>';
  const out = minifyHtml(html);
  // 行内文本中的连续空格会被压成单个（当前实现），至少结构完整
  assert.ok(out.includes('<p>'));
  assert.ok(out.includes('</p>'));
  assert.ok(out.includes('hello'));
  assert.ok(!/\n\n/.test(out), '不应有连续空行');
});

test('minifyHtml 不改动 script 内容', () => {
  const html = '<script>\n  const a = 1;   // keep\n</script>';
  const out = minifyHtml(html);
  assert.ok(out.includes('const a = 1;   // keep'), 'script 内容应原样保留');
});

test('minifyHtml 不改动 style 内容', () => {
  const html = '<style>\n  .x { color: red; }\n</style>';
  const out = minifyHtml(html);
  assert.ok(out.includes('color: red'), 'style 内容应保留');
});

test('minifyHtml 保留 pre 原样', () => {
  const html = '<pre>line1\n  line2</pre>';
  const out = minifyHtml(html);
  assert.ok(out.includes('line1\n  line2'), 'pre 内容应原样保留');
});

test('minifyHtml 输出以换行结尾', () => {
  const out = minifyHtml('<p>x</p>');
  assert.ok(out.endsWith('\n'));
});
