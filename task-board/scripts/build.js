#!/usr/bin/env node
/**
 * 构建脚本：把 src/ 的静态资源产出到 dist/。
 *
 * 步骤：
 *   1. 清空 dist/
 *   2. 拷贝 src/index.html -> dist/index.html
 *   3. HTML 内联资源最小化（去注释、压空白，保留 <pre>/<textarea>/<script>/<style> 内容）
 *   4. 生成构建元数据 dist/build-info.json
 *
 * 用法：node scripts/build.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

function minifyHtml(html) {
  // 去 HTML 注释（保留 <!--[if ...]--> 条件注释）
  let out = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');

  // 分段处理：script/style/pre/textarea 内部不动，其余段压缩空白
  const parts = [];
  const re = /(<(script|style|pre|textarea)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi;
  let last = 0, m;
  while ((m = re.exec(out))) {
    parts.push({ type: 'code', text: out.slice(last, m.index) });
    parts.push({ type: 'raw', open: m[1], content: m[3], close: m[4] });
    last = m.index + m[0].length;
  }
  parts.push({ type: 'code', text: out.slice(last) });

  let result = '';
  for (const p of parts) {
    if (p.type === 'raw') {
      result += p.open + p.content + p.close;
    } else {
      // 压缩 HTML 段中的空白：行首行尾去空白，多空格合一
      let t = p.text
        .split('\n')
        .map(line => line.replace(/[ \t]+/g, ' ').trim())
        .filter(line => line.length > 0)
        .join('\n');
      // 标签之间的换行保留一个（避免把 inline 元素粘连出错），块级结构更紧凑
      result += t;
    }
  }
  return result.trim() + '\n';
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const t0 = Date.now();
  if (!fs.existsSync(SRC)) {
    console.error('src/ 不存在');
    process.exit(1);
  }

  ensureCleanDir(DIST);

  const files = fs.readdirSync(SRC);
  const copied = [];
  for (const name of files) {
    const from = path.join(SRC, name);
    const to = path.join(DIST, name);
    if (!fs.statSync(from).isFile()) continue;
    // server.js 是运行时后端，不进 dist（dist 只放静态前端产物）
    if (name === 'server.js') continue;

    if (name.endsWith('.html')) {
      const raw = fs.readFileSync(from, 'utf8');
      const min = minifyHtml(raw);
      fs.writeFileSync(to, min);
      copied.push({ name, bytes: fs.statSync(from).size, outBytes: Buffer.byteLength(min) });
    } else {
      fs.copyFileSync(from, to);
      const sz = fs.statSync(to).size;
      copied.push({ name, bytes: sz, outBytes: sz });
    }
  }

  // 构建元数据
  const indexHtml = path.join(DIST, 'index.html');
  const hash = fs.existsSync(indexHtml)
    ? crypto.createHash('sha256').update(fs.readFileSync(indexHtml)).digest('hex').slice(0, 16)
    : '';
  const info = {
    builtAt: new Date().toISOString(),
    node: process.version,
    files: copied,
    indexSha256_16: hash,
  };
  fs.writeFileSync(path.join(DIST, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');

  const totalOut = copied.reduce((s, f) => s + f.outBytes, 0);
  console.log(`build: dist/ 产出 ${copied.length} 个文件, 共 ${totalOut} 字节`);
  for (const f of copied) {
    const saved = f.bytes - f.outBytes;
    const pct = f.bytes ? ((saved / f.bytes) * 100).toFixed(1) : '0.0';
    console.log(`  - ${f.name}: ${f.bytes} -> ${f.outBytes} 字节 (减少 ${pct}%)`);
  }
  console.log(`build 完成，用时 ${Date.now() - t0}ms`);
}

if (require.main === module) main();

module.exports = { minifyHtml };
