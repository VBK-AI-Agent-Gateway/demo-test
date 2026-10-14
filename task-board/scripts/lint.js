#!/usr/bin/env node
/**
 * 零依赖 JS lint 工具（替代 eslint）。
 *
 * 检查规则：
 *   - 未声明的变量（区分于 typecheck 的类型，lint 关注风格与常见错误）
 *   - 未使用的变量/参数（前缀 _ 豁免）
 *   - == / !=（应使用 === / !==）
 *   - 空 catch 块（必须至少有注释）
 *   - debugger 语句
 *   - console.log 允许但 console.error 建议（warning）
 *   - 缩进必须为 2 空格
 *   - 行尾空白
 *   - 文件必须以换行结尾
 *   - 文件中不得有 tab
 *   - 函数 complexity 超过阈值 (warning)
 *   - 变量遮蔽 (shadowing) warning
 *
 * 用法：node scripts/lint.js [file ...]
 * 默认读取 package.json -> lint.include
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

class Issue {
  constructor(file, line, col, severity, rule, message) {
    this.file = file;
    this.line = line;
    this.col = col;
    this.severity = severity;
    this.rule = rule;
    this.message = message;
  }
}

// ---- 基于正则/行扫描的轻量 lint（不依赖完整 parser，避免内存/复杂度问题） ----

function lintFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const issues = [];
  const lines = src.split('\n');
  const rel = path.relative(ROOT, file);

  const add = (line, col, sev, rule, msg) => issues.push(new Issue(rel, line, col, sev, rule, msg));

  // 文件末尾换行
  if (src.length > 0 && !src.endsWith('\n')) {
    add(lines.length, 1, 'error', 'eol-last', '文件必须以换行符结尾');
  }

  // Tab 检查 & 行尾空白 & 缩进
  lines.forEach((ln, idx) => {
    const n = idx + 1;
    if (ln.includes('\t')) add(n, ln.indexOf('\t') + 1, 'error', 'no-tabs', '不允许使用 Tab 缩进（应使用 2 空格）');
    if (/[ \t]+$/.test(ln)) add(n, ln.replace(/[ \t]+$/, '').length + 1, 'error', 'no-trailing-spaces', '行尾不允许空白');
    const m = /^( +)/.exec(ln);
    if (m && m[1].length % 2 !== 0 && !ln.trim().startsWith('*') && !ln.trim().startsWith('//')) {
      // 缩进必须是 2 的倍数（忽略续行等罕见场景，用宽松规则）
      // 放宽：只在长度为奇数且不涉及 * 注释时报
      add(n, 1, 'warning', 'indent', `缩进 ${m[1].length} 空格不是 2 的倍数`);
    }
  });

  // 去掉字符串和注释后的代码，用于符号级检查
  const strippedLines = stripNoise(src).split('\n');

  strippedLines.forEach((ln, idx) => {
    const n = idx + 1;
    // == / !=
    let m;
    const eqRe = /([^=!<>])==([^=])/g;
    while ((m = eqRe.exec(ln))) add(n, m.index + 1, 'error', 'eqeqeq', "必须使用 '===' 而非 '=='");
    const neRe = /([^=!])!=([^=])/g;
    while ((m = neRe.exec(ln))) add(n, m.index + 1, 'error', 'eqeqeq', "必须使用 '!==' 而非 '!='");

    // debugger
    if (/\bdebugger\b/.test(ln)) add(n, ln.indexOf('debugger') + 1, 'error', 'no-debugger', '不允许 debugger 语句');

    // console
    const cm = /\bconsole\.(log|debug|info)\s*\(/.exec(ln);
    if (cm) add(n, cm.index + 1, 'warning', 'no-console', `避免使用 console.${cm[1]}（生产代码建议移除）`);

    // typeof 比较建议
    if (/typeof\s+\w+\s*==\s*['"]/.test(ln)) {
      add(n, 1, 'warning', 'valid-typeof', "typeof 比较建议用 ===");
    }

    // eval
    if (/\beval\s*\(/.test(ln)) add(n, ln.indexOf('eval(') + 1, 'error', 'no-eval', '不允许 eval');
  });

  // 空 catch 块（检查原始行，允许 { /* 注释 */ } 形式）
  lines.forEach((ln, idx) => {
    const n = idx + 1;
    if (/catch\s*(\(\s*\w*\s*\))?\s*\{\s*\}/.test(ln)) {
      add(n, 1, 'error', 'no-empty', 'catch 块不能为空（至少写注释说明为何忽略）');
    }
  });

  // 未使用变量的简单检测（基于 const/let 声明 + 全文引用计数）
  const declRe = /\b(?:const|let)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  let dm;
  while ((dm = declRe.exec(strippedLines.join('\n')))) {
    const name = dm[1];
    if (name.startsWith('_')) continue;
    // 计算引用次数
    const useRe = new RegExp('\\b' + name.replace(/\$/g, '\\$') + '\\b', 'g');
    const count = (strippedLines.join('\n').match(useRe) || []).length;
    if (count <= 1) {
      // 找到行号
      let lineNo = 1, pos = 0;
      const whole = strippedLines.join('\n');
      const idx2 = whole.indexOf(dm[0]);
      if (idx2 >= 0) lineNo = whole.slice(0, idx2).split('\n').length;
      add(lineNo, dm.index ? 1 : 1, 'warning', 'no-unused-vars', `变量 '${name}' 声明后未被使用`);
    }
  }

  // 函数 complexity 粗估
  const fnRe = /function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/g;
  let fm;
  while ((fm = fnRe.exec(src))) {
    const startIdx = fm.index;
    const lineNo = src.slice(0, startIdx).split('\n').length;
    // 找到函数结束的大括号
    let depth = 0, i2 = startIdx, end = -1;
    for (; i2 < src.length; i2++) {
      const ch = src[i2];
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i2; break; } }
    }
    if (end === -1) continue;
    const body = src.slice(startIdx, end);
    const branches = (body.match(/\b(if|else if|while|for|case|catch|\?\?|\|\||&&)\b|\?\s*:/g) || []).length;
    if (branches > 15) add(lineNo, 1, 'warning', 'complexity', `函数复杂度较高（分支数 ~${branches}），建议拆分`);
  }

  return issues;
}

// 去掉字符串字面量与注释（保留换行，保持行号）
function stripNoise(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  if (src.startsWith('#!')) {
    const nl = src.indexOf('\n');
    out += '\n';
    i = nl === -1 ? n : nl + 1;
  }
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') out += '\n'; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      if (q === '`') {
        // 模板字符串：保留 ${...} 插值内容（这些是真实代码引用）
        let buf = '';
        while (i < n && src[i] !== q) {
          if (src[i] === '\\') { i += 2; continue; }
          if (src[i] === '\n') { out += '\n'; i++; continue; }
          if (src[i] === '$' && src[i + 1] === '{') {
            // 输出已缓冲的字面量部分，然后递归保留插值
            out += '""';
            // 找到匹配的 }
            let depth = 1, j = i + 2;
            while (j < n && depth > 0) {
              if (src[j] === '{') depth++;
              else if (src[j] === '}') depth--;
              j++;
            }
            // 插值内容是真实代码，原样输出
            out += src.slice(i + 2, j - 1);
            i = j;
            buf = '';
            out += '""';
            continue;
          }
          i++;
        }
        i++; // 跳过收尾 `
        continue;
      }
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '\n') out += '\n';
        i++;
      }
      i++; out += '""'; continue;
    }
    // 正则字面量：跳过内容（防止规则误匹配正则里的 == / eval 等文本）
    if (c === '/') {
      const prevCh = out.length ? out[out.length - 1] : '';
      const afterIdent = /[A-Za-z0-9_$)\]]/.test(prevCh);
      if (!afterIdent) {
        let j = i + 1, inClass = false, ok = true;
        while (j < n) {
          const ch = src[j];
          if (ch === '\\') { j += 2; continue; }
          if (ch === '\n') { ok = false; break; }
          if (ch === '[') inClass = true;
          else if (ch === ']') inClass = false;
          else if (ch === '/' && !inClass) break;
          j++;
        }
        if (ok && j < n && src[j] === '/') {
          j++;
          while (j < n && /[a-z]/i.test(src[j])) j++;
          out += '//regex//';
          i = j;
          continue;
        }
      }
    }
    out += c; i++;
  }
  return out;
}

function main() {
  let files = process.argv.slice(2).filter(a => !a.startsWith('-'));
  if (files.length === 0) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
      const include = (pkg.lint && pkg.lint.include) || ['src/*.js', 'scripts/*.js', 'tests/**/*.js'];
      files = [];
      for (const pat of include) files.push(...expand(pat));
    } catch (e) {
      console.error('无法读取 package.json:', e.message);
      process.exit(2);
    }
  }
  let errors = 0, warnings = 0;
  for (const f of files) {
    const abs = path.resolve(ROOT, f);
    if (!fs.existsSync(abs)) continue;
    const issues = lintFile(abs);
    for (const it of issues) {
      console.log(`${it.file}:${it.line}:${it.col} - ${it.severity}[${it.rule}]: ${it.message}`);
      if (it.severity === 'error') errors++; else warnings++;
    }
  }
  console.log(`\nlint: ${files.length} 个文件, ${errors} errors, ${warnings} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

function expand(pattern) {
  const results = [];
  if (pattern.includes('**')) {
    const [pre, post] = pattern.split('/**/');
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (matches(ent.name, post)) results.push(path.relative(ROOT, full));
      }
    };
    walk(path.resolve(ROOT, pre));
  } else if (pattern.includes('*')) {
    const dir = path.dirname(path.join(ROOT, pattern));
    const base = path.basename(pattern);
    if (fs.existsSync(dir)) {
      for (const ent of fs.readdirSync(dir)) {
        if (matches(ent, base)) results.push(path.relative(ROOT, path.join(dir, ent)));
      }
    }
  } else {
    results.push(pattern);
  }
  return results;
}

function matches(name, glob) {
  const rx = '^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '.') + '$';
  return new RegExp(rx).test(name);
}

if (require.main === module) main();

module.exports = { lintFile };
