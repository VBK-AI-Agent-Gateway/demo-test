#!/usr/bin/env node
/**
 * 零依赖 HTML lint（针对 index.html）。
 *
 * 检查项（error）：
 *   - 必须声明 <!DOCTYPE html>
 *   - <html> 必须有 lang 属性
 *   - <meta charset="utf-8"> 必须存在
 *   - <meta name="viewport"> 必须存在（响应式）
 *   - <title> 必须存在且非空
 *   - 标签必须正确配对（简单栈检查：void 标签除外）
 *   - 属性必须加引号
 *   - id 必须唯一
 *   - 所有 <img> 必须有 alt
 *   - 禁止内联 event handler（onclick= 等，应用 addEventListener）
 *
 * 检查项（warning）：
 *   - <a> 缺 rel="noopener"（target="_blank" 时）
 *   - 残留的 console.log 调试代码
 *
 * 用法：node scripts/lint_html.js [file.html ...]
 * 默认：src/index.html
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);

function lintHtml(file) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const issues = [];
  const add = (line, col, sev, rule, msg) => issues.push({ file: rel, line, col, sev, rule, msg });

  // 行号定位工具
  const lineOf = (idx) => src.slice(0, idx).split('\n').length;
  const colOf = (idx) => idx - src.lastIndexOf('\n', idx - 1);

  // 1. DOCTYPE
  if (!/^\s*<!DOCTYPE\s+html>/i.test(src)) {
    add(1, 1, 'error', 'doctype', '缺少 <!DOCTYPE html> 声明');
  }

  // 2. html lang
  const htmlMatch = /<html\b[^>]*>/i.exec(src);
  if (!htmlMatch) {
    add(1, 1, 'error', 'html-tag', '缺少 <html> 标签');
  } else if (!/\blang\s*=/i.test(htmlMatch[0])) {
    add(lineOf(htmlMatch.index), colOf(htmlMatch.index), 'error', 'html-lang', '<html> 缺少 lang 属性');
  }

  // 3. charset
  if (!/<meta\b[^>]*charset\s*=/i.test(src)) {
    add(1, 1, 'error', 'charset', '缺少 <meta charset="utf-8">');
  }

  // 4. viewport
  if (!/<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(src)) {
    add(1, 1, 'error', 'viewport', '缺少 <meta name="viewport"> 响应式声明');
  }

  // 5. title
  const titleM = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(src);
  if (!titleM || !titleM[1].trim()) {
    add(1, 1, 'error', 'title', '<title> 缺失或为空');
  }

  // 6. 属性引号（只检查真正的未引号属性值）
  const tagAttrRe = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m;
  while ((m = tagAttrRe.exec(src))) {
    const attrsSrc = m[2] || '';
    // 逐字符扫描，剥离已引号的属性值
    // 找出所有 attr= 位置，判断值是否以引号开头
    const attrStartRe = /(^|\s)([a-zA-Z-][\w-]*)\s*=\s*/g;
    let am2;
    while ((am2 = attrStartRe.exec(attrsSrc))) {
      const valStart = am2.index + am2[0].length;
      const ch = attrsSrc[valStart];
      if (ch === '"' || ch === "'") {
        // 已引号——跳到闭合引号
        const closeIdx = attrsSrc.indexOf(ch, valStart + 1);
        if (closeIdx !== -1) {
          attrStartRe.lastIndex = closeIdx + 1;
        }
        continue;
      }
      // 未引号——value 到下一个空白为止
      let j = valStart;
      while (j < attrsSrc.length && !/\s/.test(attrsSrc[j])) j++;
      const val = attrsSrc.slice(valStart, j);
      if (val && val !== '>' && val !== '/' && !/["']/.test(val)) {
        add(lineOf(m.index + valStart), 1, 'error', 'attr-quotes',
          `属性 ${am2[2]} 的值必须加引号: ${am2[2]}=${val}`);
      }
      attrStartRe.lastIndex = j;
    }
  }

  // 7. 标签配对（简单栈，跳过脚本/样式内容）
  const tagRe = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  const stack = [];
  let tm;
  while ((tm = tagRe.exec(src))) {
    const full = tm[0];
    if (full.startsWith('<!--') || full.startsWith('<![')) continue;
    const tagName = tm[1].toLowerCase();
    const isClosing = full.startsWith('</');
    const selfClosing = /\/>$/.test(full);
    if (VOID_TAGS.has(tagName)) continue;
    if (['script', 'style'].includes(tagName)) {
      if (isClosing) {
        // 这是 </script> 或 </style> 的闭合——正常交给栈处理
        // 但需要跳过其内容：实际上从 lastIndex 开始找内容结束即可
        // 由于我们只在 opening 时跳内容，closing 直接进栈逻辑
      } else {
        // 找到内容结束的位置（</tag>），把 lastIndex 移到那里，
        // 让下一次匹配直接命中 </tag>，从而进入 isClosing 分支
        const closeIdx = src.toLowerCase().indexOf('</' + tagName, tagRe.lastIndex);
        if (closeIdx === -1) {
          add(lineOf(tm.index), 1, 'error', 'unclosed', `<${tagName}> 未闭合`);
          break;
        }
        stack.push({ tag: tagName, idx: tm.index });
        tagRe.lastIndex = closeIdx;
        continue;
      }
    }
    if (selfClosing) continue;
    if (!isClosing) {
      stack.push({ tag: tagName, idx: tm.index });
    } else {
      if (stack.length === 0) {
        add(lineOf(tm.index), colOf(tm.index), 'error', 'unmatched-close', `多余的 </${tagName}>`);
      } else if (stack[stack.length - 1].tag !== tagName) {
        const top = stack[stack.length - 1];
        add(lineOf(tm.index), colOf(tm.index), 'error', 'mismatch',
          `标签不匹配：期望 </${top.tag}>，实际 </${tagName}>`);
        // 尝试恢复：弹出直到匹配
        while (stack.length && stack[stack.length - 1].tag !== tagName) stack.pop();
        if (stack.length) stack.pop();
      } else {
        stack.pop();
      }
    }
  }
  for (const left of stack) {
    add(lineOf(left.idx), colOf(left.idx), 'error', 'unclosed', `<${left.tag}> 未闭合`);
  }

  // 8. id 唯一
  const idRe = /\bid\s*=\s*["']([^"']+)["']/g;
  const seenIds = new Map();
  let im;
  while ((im = idRe.exec(src))) {
    const id = im[1];
    if (seenIds.has(id)) {
      add(lineOf(im.index), colOf(im.index), 'error', 'dup-id', `重复的 id="${id}"（首次出现在第 ${seenIds.get(id)} 行）`);
    } else {
      seenIds.set(id, lineOf(im.index));
    }
  }

  // 9. img alt
  const imgRe = /<img\b[^>]*>/gi;
  let gm;
  while ((gm = imgRe.exec(src))) {
    if (!/\balt\s*=/i.test(gm[0])) {
      add(lineOf(gm.index), colOf(gm.index), 'error', 'img-alt', '<img> 缺少 alt 属性');
    }
  }

  // 10. 内联事件处理器
  const inlineRe = /\son(?:click|change|input|submit|keydown|keyup|load|error|focus|blur)\s*=/gi;
  let om;
  while ((om = inlineRe.exec(src))) {
    add(lineOf(om.index), colOf(om.index), 'error', 'no-inline-handler',
      `禁止内联事件处理器 ${om[0].trim().split('=')[0].trim()}（应使用 addEventListener）`);
  }

  // 11. target=_blank 需要 rel=noopener
  const aRe = /<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi;
  let am;
  while ((am = aRe.exec(src))) {
    if (!/rel\s*=\s*["'][^"']*noopener/i.test(am[0])) {
      add(lineOf(am.index), colOf(am.index), 'warning', 'noopener', 'target="_blank" 建议加 rel="noopener"');
    }
  }

  // 12. 调试 console 残留
  const lines = src.split('\n');
  lines.forEach((ln, idx) => {
    if (/\bconsole\.(log|debug|dir|trace)\s*\(/.test(ln)) {
      add(idx + 1, ln.indexOf('console') + 1, 'warning', 'no-console', 'HTML 中残留 console 调试代码');
    }
  });

  return issues;
}

function main() {
  let files = process.argv.slice(2).filter(a => !a.startsWith('-'));
  if (files.length === 0) files = ['src/index.html'];
  let errors = 0, warnings = 0;
  for (const f of files) {
    const abs = path.resolve(ROOT, f);
    if (!fs.existsSync(abs)) { console.error(`文件不存在: ${f}`); process.exit(2); }
    for (const it of lintHtml(abs)) {
      console.log(`${it.file}:${it.line}:${it.col} - ${it.sev}[${it.rule}]: ${it.msg}`);
      if (it.sev === 'error') errors++; else warnings++;
    }
  }
  console.log(`\nhtml-lint: ${files.length} 个文件, ${errors} errors, ${warnings} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

if (require.main === module) main();

module.exports = { lintHtml };
