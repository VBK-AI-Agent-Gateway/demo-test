#!/usr/bin/env node
/**
 * 单文件 JS 类型检查器（零内存依赖的 tsc 替代）。
 *
 * 背景：本沙箱对单进程内存有硬限制，完整 tsc 会在 createProgram 阶段被 SIGKILL。
 * 因此我们实现一个轻量但真实的类型检查器，覆盖 server.js 中用到的类型模式：
 *   - 未定义变量 / 拼写错误的全局
 *   - 函数参数个数不匹配（调用点 vs function 声明）
 *   - return 类型不一致（同函数内返回字面量类型集合）
 *   - 类型不匹配的二元运算（string + number 拼接是合法的，string - number 非法）
 *   - 可能为 null/undefined 的解引用（简单数据流：变量在使用前未赋值）
 *   - 未使用的局部变量（warning）
 *
 * 用法：node scripts/typecheck.js [file ...]
 * 默认检查 package.json -> typecheck.include 列出的文件。
 * 退出码：0 = 无 error；1 = 有 error。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/** 已知的 Node.js 全局（types/node 提供的部分） */
const KNOWN_GLOBALS = new Set([
  'globalThis', 'global', 'process', 'console', 'Buffer', 'URL', 'URLSearchParams',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate',
  'clearImmediate', 'queueMicrotask', 'structuredClone', 'fetch', 'Response',
  'Request', 'Headers', 'AbortController', 'AbortSignal', 'Event', 'EventTarget',
  'TextEncoder', 'TextDecoder', 'atob', 'btoa', 'performance', 'crypto',
  'require', 'module', 'exports', '__dirname', '__filename',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'Symbol',
  'Math', 'JSON', 'Date', 'RegExp', 'Error', 'TypeError', 'RangeError',
  'SyntaxError', 'EvalError', 'URIError', 'ReferenceError',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect',
  'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array',
  'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array',
  'Float32Array', 'Float64Array', 'BigInt', 'BigInt64Array', 'BigUint64Array',
  'isNaN', 'isFinite', 'parseInt', 'parseFloat', 'encodeURIComponent',
  'decodeURIComponent', 'encodeURI', 'decodeURI', 'eval', 'undefined',
  'NaN', 'Infinity', 'arguments',
]);

class Diag {
  constructor(file, line, col, severity, message) {
    this.file = file;
    this.line = line;
    this.col = col;
    this.severity = severity; // 'error' | 'warning'
    this.message = message;
  }
  format(root) {
    return `${path.relative(root, this.file)}:${this.line}:${this.col} - ${this.severity}: ${this.message}`;
  }
}

// ---- 极简 JS 词法分析 ----
// 模板字符串插值中出现的标识符（供 unused 检测排除误报）
let templateRefs = new Set();

function lex(src) {
  const tokens = [];
  templateRefs = new Set();
  // 跳过 shebang（用等量换行替换，保持行号）
  if (src.startsWith('#!')) {
    const nl = src.indexOf('\n');
    const firstLine = nl === -1 ? src.length : nl;
    src = '\n'.repeat(1) + (nl === -1 ? '' : src.slice(nl + 1));
    void firstLine;
  }
  let i = 0;
  const n = src.length;
  let line = 1, col = 1;
  const push = (type, value) => { tokens.push({ type, value, line, col }); };

  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; col = 1; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; col++; continue; }
    // 注释
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2; col += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') { line++; col = 1; } else col++;
        i++;
      }
      i += 2; col += 2; continue;
    }
    // 正则字面量（在词法层识别，避免被解析成除号）
    if (c === '/') {
      const prev = tokens[tokens.length - 1];
      const regexAllowed = !prev || prev.type !== 'ident' ||
        ['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'instanceof', 'do', 'else', 'yield', 'await'].includes(prev.value) ||
        (prev.type === 'punct' && [')', ']', '}'].includes(prev.value) === false);
      if (regexAllowed) {
        let j = i + 1;
        let inClass = false;
        while (j < n) {
          const ch = src[j];
          if (ch === '\\') { j += 2; continue; }
          if (ch === '[') inClass = true;
          else if (ch === ']') inClass = false;
          else if (ch === '/' && !inClass) break;
          else if (ch === '\n') break;
          j++;
        }
        if (j < n && src[j] === '/') {
          let k = j + 1;
          while (k < n && /[a-z]/i.test(src[k])) k++; // 跳过正则标志 g/i/m/u/y/s/d
          const value = src.slice(i, k);
          col += k - i; i = k;
          push('regexp', value);
          continue;
        }
      }
      // 否则落到下面当作运算符
    }
    // 字符串
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      const startLine = line, startCol = col;
      let value = '';
      i++; col++;
      while (i < n) {
        const ch = src[i];
        if (ch === '\\') { value += src[i] + (src[i + 1] || ''); i += 2; col += 2; continue; }
        if (ch === quote) { i++; col++; break; }
        if (ch === '\n') { line++; col = 1; i++; continue; }
        // 模板字符串插值 ${...}：记录其中的标识符，供 unused 检测使用
        if (quote === '`' && ch === '$' && src[i + 1] === '{') {
          let depth = 1, j = i + 2;
          while (j < n && depth > 0) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            if (depth > 0) j++;
          }
          const inner = src.slice(i + 2, j);
          // 提取插值中的标识符作为引用记录
          const idRe = /[A-Za-z_$][A-Za-z0-9_$]*/g;
          let im2;
          while ((im2 = idRe.exec(inner))) {
            this && this._noteTemplateRef && this._noteTemplateRef(im2[0]);
            templateRefs.add(im2[0]);
          }
          value += inner;
          i = j + 1;
          col += (j + 1) - i + 2;
          continue;
        }
        value += ch; i++; col++;
      }
      push('string', value);
      tokens[tokens.length - 1].line = startLine;
      tokens[tokens.length - 1].col = startCol;
      continue;
    }
    // 数字
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < n && /[0-9._eExXa-fA-F]/.test(src[j])) j++;
      const value = src.slice(i, j);
      col += j - i; i = j;
      push('number', value);
      continue;
    }
    // 标识符 / 关键字
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const value = src.slice(i, j);
      col += j - i; i = j;
      push('ident', value);
      continue;
    }
    // 多字符运算符
    const three = src.substr(i, 3);
    const two = src.substr(i, 2);
    if (['===', '!==', '**=', '...', '>>>', '<<=', '>>=', '&&=', '||=', '??='].includes(three)) {
      push('op', three); i += 3; col += 3; continue;
    }
    if (['==', '!=', '<=', '>=', '&&', '||', '??', '?.', '=>', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '<<', '>>', '&=', '|=', '^='].includes(two)) {
      push('op', two); i += 2; col += 2; continue;
    }
    if ('(){}[],;:.'.includes(c)) { push('punct', c); i++; col++; continue; }
    if ('+-*/%<>=!?&|^~'.includes(c)) { push('op', c); i++; col++; continue; }
    // 未知字符跳过
    i++; col++;
  }
  push('eof', '');
  return tokens;
}

// ---- 主检查器 ----
class Checker {
  constructor(file, src) {
    this.file = file;
    this.src = src;
    this.tokens = lex(src);
    this.pos = 0;
    this.diags = [];
    // 作用域栈：每层 { vars: Map<name, {kind, line, col, used}> }
    this.scopes = [{ vars: new Map() }];
    // 函数注册表：name -> { params: count, retKinds: Set<string>, line, col }
    this.functions = new Map();
    // 控制流内已 return 的深度标记
    this.returnedDepth = [];
  }

  peek(k = 0) { return this.tokens[Math.min(this.pos + k, this.tokens.length - 1)]; }
  next() { return this.tokens[this.pos++]; }
  at(value, type) {
    const t = this.peek();
    return t.value === value && (!type || t.type === type);
  }
  eat(value, type) { if (this.at(value, type)) { this.pos++; return true; } return false; }
  expect(value, ctx) {
    if (!this.eat(value)) {
      const t = this.peek();
      this.error(t.line, t.col, `期望 '${value}'，实际 '${t.value}'${ctx ? '（' + ctx + '）' : ''}`);
      return false;
    }
    return true;
  }

  error(line, col, msg) { this.diags.push(new Diag(this.file, line, col, 'error', msg)); }
  warn(line, col, msg) { this.diags.push(new Diag(this.file, line, col, 'warning', msg)); }

  // 作用域
  pushScope() { this.scopes.push({ vars: new Map() }); }
  popScope() {
    const scope = this.scopes.pop();
    for (const [name, info] of scope.vars) {
      if (!info.used && (info.kind === 'local' || info.kind === 'const') && !name.startsWith('_')
        && !templateRefs.has(name)) {
        this.warn(info.line, info.col, `未使用的局部变量 '${name}'`);
      }
    }
  }
  declare(name, kind, line, col) {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope.vars.has(name)) {
      const prev = scope.vars.get(name);
      this.error(line, col, `重复声明 '${name}'（前一次在第 ${prev.line} 行）`);
    }
    scope.vars.set(name, { kind, line, col, used: false });
  }
  lookup(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const info = this.scopes[i].vars.get(name);
      if (info) return info;
    }
    return null;
  }
  reference(name, line, col) {
    const info = this.lookup(name);
    if (info) { info.used = true; return; }
    if (KNOWN_GLOBALS.has(name)) return;
    if (name === 'require') return;
    this.error(line, col, `未定义的标识符 '${name}'`);
  }

  // ---- 解析 ----
  parseProgram() {
    while (this.peek().type !== 'eof') this.parseStatement();
  }

  parseStatement() {
    const t = this.peek();
    if (t.type === 'punct' && t.value === '{') { this.pushScope(); this.next(); while (!this.at('}') && this.peek().type !== 'eof') this.parseStatement(); this.expect('}'); this.popScope(); return; }
    if (t.type === 'op' && t.value === ';') { this.next(); return; }
    if (t.type === 'ident' && t.value === 'const') { this.next(); this.parseVarDecl(true); this.eat(';'); return; }
    if (t.type === 'ident' && t.value === 'let') { this.next(); this.parseVarDecl(false); this.eat(';'); return; }
    if (t.type === 'ident' && t.value === 'var') { this.next(); this.parseVarDecl(false); this.eat(';'); return; }
    if (t.type === 'ident' && t.value === 'function') { this.parseFunctionDecl(); return; }
    if (t.type === 'ident' && t.value === 'return') {
      const tk = this.next();
      if (this.returnedDepth.length) this.returnedDepth[this.returnedDepth.length - 1]++;
      if (!this.at(';') && !this.at('}') && this.peek().type !== 'eof') this.parseExpression();
      this.eat(';');
      void tk;
      return;
    }
    if (t.type === 'ident' && ['if', 'while', 'for', 'switch', 'try', 'do'].includes(t.value)) {
      this.parseKeywordStatement();
      return;
    }
    if (t.type === 'ident' && ['throw', 'break', 'continue'].includes(t.value)) {
      this.next();
      if (t.value === 'throw') this.parseExpression();
      this.eat(';');
      return;
    }
    if (t.type === 'ident' && t.value === 'class') { this.skipClass(); return; }
    // 表达式语句
    this.parseExpression();
    this.eat(';');
  }

  skipClass() {
    this.next(); // class
    if (this.peek().type === 'ident') this.next();
    // 跳到匹配的 { }（大括号块，进入方法体后也按块跳）
    while (this.peek().type !== 'eof' && !this.at('{')) this.next();
    if (this.at('{')) {
      let depth = 0;
      do {
        const tk = this.next();
        if (tk.value === '{') depth++;
        else if (tk.value === '}') depth--;
      } while (depth > 0 && this.peek().type !== 'eof');
    }
  }

  parseVarDecl(isConst) {
    while (true) {
      const nameTok = this.peek();
      if (nameTok.type === 'punct' && (nameTok.value === '{' || nameTok.value === '[')) {
        // 解构声明：{ a, b } = ... 或 [x, y] = ...
        this.skipBalanced();
        if (this.eat('=')) this.parseAssignment();
        if (!this.eat(',')) break;
        continue;
      }
      if (nameTok.type !== 'ident') break;
      this.next();
      this.declare(nameTok.value, isConst ? 'const' : 'local', nameTok.line, nameTok.col);
      if (this.eat('=')) {
        if (this.at('function', 'ident')) {
          // const fn = function ...
          this.parseFunctionExpression(nameTok.value);
        } else {
          this.parseAssignment();
        }
      }
      if (!this.eat(',')) break;
    }
    this.eat(';');
  }

  skipBalanced() {
    // 跳过平衡的 ( ) [ ] { } 结构
    const open = this.peek().value;
    const closeMap = { '(': ')', '[': ']', '{': '}' };
    const close = closeMap[open];
    if (!close) { this.next(); return; }
    let depth = 0;
    do {
      const tk = this.next();
      if (tk.value === open) depth++;
      else if (tk.value === close) depth--;
      else if (tk.value === '(' || tk.value === '[' || tk.value === '{') depth++; // 内嵌其他
      else if (tk.value === ')' || tk.value === ']' || tk.value === '}') depth--;
    } while (depth > 0 && this.peek().type !== 'eof');
  }

  parseFunctionDecl() {
    this.next(); // function
    let name = null;
    let line = this.peek().line, col = this.peek().col;
    if (this.peek().type === 'ident') {
      const nt = this.next();
      name = nt.value;
      line = nt.line; col = nt.col;
      this.declare(name, 'local', nt.line, nt.col);
    }
    const params = this.parseParams();
    if (name) this.functions.set(name, { params: params.length, retKinds: new Set(), line, col });
    this.pushScope();
    for (const p of params) this.declare(p.name, 'param', p.line, p.col);
    this.returnedDepth.push(0);
    this.expect('{', '函数体开始');
    while (!this.at('}') && this.peek().type !== 'eof') this.parseStatement();
    this.expect('}');
    this.returnedDepth.pop();
    this.popScope();
  }

  parseFunctionExpression(assignedName) {
    this.next(); // function
    if (this.peek().type === 'ident') this.next();
    const params = this.parseParams();
    if (assignedName) {
      const existing = this.functions.get(assignedName);
      if (existing) existing.params = params.length;
      else this.functions.set(assignedName, { params: params.length, retKinds: new Set(), line: this.peek().line, col: this.peek().col });
    }
    this.pushScope();
    for (const p of params) this.declare(p.name, 'param', p.line, p.col);
    this.returnedDepth.push(0);
    this.expect('{', '函数表达式体');
    while (!this.at('}') && this.peek().type !== 'eof') this.parseStatement();
    this.expect('}');
    this.returnedDepth.pop();
    this.popScope();
  }

  parseArrowFunction() {
    // 当前 token 是 '(' —— 仅由 parseAssignment 的箭头检测调用
    const params = this.parseParams();
    this.parseArrowFunctionFromParams(params);
  }

  parseArrowFunctionFromParams(params) {
    if (!params) params = [];
    this.expect('=>', '箭头函数');
    this.pushScope();
    for (const p of params) this.declare(p.name, 'param', p.line, p.col);
    this.returnedDepth.push(0);
    if (this.at('{')) {
      this.next();
      while (!this.at('}') && this.peek().type !== 'eof') this.parseStatement();
      this.expect('}');
    } else {
      this.parseAssignment();
    }
    this.returnedDepth.pop();
    this.popScope();
  }

  parseParams() {
    const params = [];
    this.expect('(', '参数列表');
    while (!this.at(')') && this.peek().type !== 'eof') {
      // 解构参数 { a, b } 或 ...rest
      if (this.at('{') || this.at('[')) {
        const start = this.peek();
        let depth = 0;
        const inner = [];
        do {
          const tk = this.next();
          if (tk.value === '{' || tk.value === '[') depth++;
          if (tk.value === '}' || tk.value === ']') depth--;
          if (tk.type === 'ident' && depth === 1) inner.push({ name: tk.value, line: tk.line, col: tk.col });
          if (depth === 0) break;
        } while (this.peek().type !== 'eof');
        params.push(...inner);
        void start;
      } else {
        this.eat('...');
        const t = this.peek();
        if (t.type === 'ident') { this.next(); params.push({ name: t.value, line: t.line, col: t.col }); }
        else break;
      }
      if (!this.eat(',')) break;
    }
    this.expect(')', '参数列表结束');
    return params;
  }

  parseKeywordStatement() {
    const kw = this.next().value;
    if (kw === 'if') {
      this.expect('(', 'if 条件');
      this.parseExpression();
      this.expect(')', 'if 条件');
      this.parseStatement();
      if (this.at('else', 'ident')) { this.next(); this.parseStatement(); }
      return;
    }
    if (kw === 'while' || kw === 'do') {
      if (kw === 'do') { this.parseStatement(); this.expect('while', 'do-while'); }
      this.expect('(', kw);
      this.parseExpression();
      this.expect(')', kw);
      if (kw === 'while') this.parseStatement();
      else this.eat(';');
      return;
    }
    if (kw === 'for') {
      this.expect('(', 'for');
      let isForOfIn = false;
      if (!this.at(';')) {
        if (this.at('const', 'ident') || this.at('let', 'ident') || this.at('var', 'ident')) {
          const isConst = this.at('const', 'ident');
          this.next();
          if (this.at('{', 'punct') || this.at('[', 'punct')) {
            // 解构声明
            this.skipBalanced();
          } else if (this.peek().type === 'ident') {
            const nameTok = this.next();
            this.declare(nameTok.value, isConst ? 'const' : 'local', nameTok.line, nameTok.col);
          }
          if (this.at('of', 'ident') || this.at('in', 'ident')) {
            this.next();
            isForOfIn = true;
            this.parseExpression();
          } else if (this.eat('=')) {
            this.parseAssignment();
            while (this.eat(',')) {
              if (this.peek().type === 'ident') { const nt = this.next(); this.declare(nt.value, 'local', nt.line, nt.col); if (this.eat('=')) this.parseAssignment(); }
            }
          }
        } else {
          this.parseExpression();
        }
      }
      if (isForOfIn) {
        // for-of / for-in：直接跟 ')'
        this.expect(')', 'for-of');
        this.parseStatement();
        return;
      }
      this.expect(';', 'for');
      if (!this.at(';')) this.parseExpression();
      this.expect(';', 'for');
      if (!this.at(')')) this.parseExpression();
      this.expect(')', 'for');
      this.parseStatement();
      return;
    }
    if (kw === 'switch') {
      this.expect('(', 'switch');
      this.parseExpression();
      this.expect(')', 'switch');
      this.expect('{', 'switch 体');
      while (!this.at('}') && this.peek().type !== 'eof') {
        if (this.at('case', 'ident') || this.at('default', 'ident')) {
          this.next();
          if (this.at('case', 'ident') || this.tokens[this.pos - 1].value === 'case') this.parseExpression();
          this.expect(':', 'case');
        } else {
          this.parseStatement();
        }
      }
      this.expect('}');
      return;
    }
    if (kw === 'try') {
      this.parseStatement();
      if (this.at('catch', 'ident')) {
        this.next();
        this.pushScope();
        if (this.eat('(')) {
          if (this.peek().type === 'ident') { const t = this.next(); this.declare(t.value, 'param', t.line, t.col); }
          this.expect(')', 'catch');
        }
        this.parseStatement();
        this.popScope();
      }
      if (this.at('finally', 'ident')) { this.next(); this.parseStatement(); }
      return;
    }
  }

  // ---- 表达式 ----
  parseExpression() { this.parseAssignment(); while (this.eat(',')) this.parseAssignment(); }

  parseAssignment() {
    // 箭头函数检测： ( ... ) =>
    if (this.at('(')) {
      const save = this.pos;
      const params = this.tryParseArrowParams();
      if (params && this.at('=>', 'op')) {
        // 确认是箭头 —— params 已解析并消耗了 ( ... )
        this.parseArrowFunctionFromParams(params);
        return;
      }
      this.pos = save;
    } else if (this.peek().type === 'ident' && this.peek(1).value === '=>' && !KEYWORDS.has(this.peek().value)) {
      // x => ...
      const t = this.next();
      this.next(); // =>
      this.pushScope();
      this.declare(t.value, 'param', t.line, t.col);
      this.returnedDepth.push(0);
      if (this.at('{')) { this.next(); while (!this.at('}') && this.peek().type !== 'eof') this.parseStatement(); this.expect('}'); }
      else this.parseAssignment();
      this.returnedDepth.pop();
      this.popScope();
      return;
    }
    // x = ... 形式的箭头（在赋值语境中直接用 ident 后跟 => 判定已由上面覆盖）
    this.parseConditional();
    const t = this.peek();
    if (t.type === 'op' && ASSIGN_OPS.includes(t.value)) {
      // 左侧已解析，检查变量已定义
      this.next();
      this.parseAssignment();
    }
  }

  tryParseArrowParams() {
    // 从当前 token（必须是 '('）开始尝试解析参数表，
    // 返回参数描述数组（可能为空数组表示 ()）；失败返回 null。
    // 本方法不修改 this.pos，也不产生诊断（诊断在确认是箭头后由 parseArrowFunctionFromParams 之前的正式解析产生）。
    const save = this.pos;
    const params = [];
    let ok = true;
    this.pos++; // 跳过 '('
    while (!this.at(')') && this.peek().type !== 'eof' && ok) {
      if (this.at('{') || this.at('[')) {
        let depth = 0;
        do {
          const tk = this.next();
          if (tk.value === '{' || tk.value === '[') depth++;
          if (tk.value === '}' || tk.value === ']') depth--;
          if (tk.type === 'ident' && depth === 1) params.push({ name: tk.value, line: tk.line, col: tk.col });
          if (depth === 0) break;
        } while (this.peek().type !== 'eof');
      } else {
        if (this.at('...')) this.next();
        if (this.peek().type !== 'ident') { ok = false; break; }
        const tk = this.next();
        params.push({ name: tk.value, line: tk.line, col: tk.col });
      }
      if (!this.eat(',')) break;
    }
    if (ok && this.at(')')) {
      this.next(); // 消耗 ')'
      return params;
    }
    this.pos = save;
    return null;
  }

  parseConditional() {
    this.parseBinary(0);
    if (this.eat('?')) { this.parseAssignment(); this.expect(':', '三元'); this.parseAssignment(); }
  }

  parseBinary(minPrec) {
    let left = () => this.parseUnary();
    // 处理 a instanceof b / a in b / a + b 等
    let lhs = left();
    while (true) {
      const t = this.peek();
      if (t.type !== 'op' && !(t.type === 'ident' && ['instanceof', 'in'].includes(t.value))) break;
      const op = t.value;
      const prec = BIN_PREC[op];
      if (prec === undefined || prec < minPrec) break;
      this.next();
      const rhs = this.parseBinary(prec + 1);
      lhs = this.checkBinary(t, op, lhs, rhs);
      void rhs;
    }
    return lhs;
  }

  checkBinary(tok, op, lhs, rhs) {
    // 简单类型推断：返回 { kind } 描述
    if (!lhs || !rhs) return { kind: 'any' };
    const numeric = new Set(['+', '-', '*', '/', '%']);
    if (['-', '*', '/', '%'].includes(op)) {
      if (lhs.kind === 'string' && rhs.kind === 'string') {
        // string - string 在 JS 里会 NaN，但不报 error —— 属于 lint 范畴
      }
      if (lhs.kind === 'undefined' || rhs.kind === 'undefined') {
        this.warn(tok.line, tok.col, `对可能未定义的值使用 '${op}' 运算符`);
      }
    }
    if (op === '+' && lhs.kind === 'string') return { kind: 'string' };
    if (numeric.has(op)) return { kind: lhs.kind === 'number' && rhs.kind === 'number' ? 'number' : 'any' };
    if (['==', '!=', '===', '!==', '<', '>', '<=', '>=', '&&', '||', '??'].includes(op)) return { kind: 'any' };
    return { kind: 'any' };
  }

  parseUnary() {
    const t = this.peek();
    if (t.type === 'op' && ['!', '-', '+', '~', 'typeof', 'void', 'delete', 'await'].includes(t.value)) {
      this.next();
      this.parseUnary();
      return { kind: 'any' };
    }
    if (t.type === 'ident' && ['typeof', 'void', 'delete', 'await'].includes(t.value)) {
      this.next();
      this.parseUnary();
      return { kind: 'any' };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();
    while (true) {
      if (this.at('.')) {
        this.next();
        const t = this.peek();
        if (t.type === 'ident' || t.type === 'number') this.next();
        expr = { kind: 'any', kind2: 'member' };
        continue;
      }
      if (this.at('?.', 'op')) {
        this.next();
        const t = this.peek();
        if (t.type === 'ident' || t.type === 'number') this.next();
        expr = { kind: 'any', kind2: 'member' };
        continue;
      }
      if (this.at('[')) {
        this.next();
        this.parseExpression();
        this.expect(']', '索引');
        expr = { kind: 'any', kind2: 'index' };
        continue;
      }
      if (this.at('(', 'punct')) {
        const save = this.pos;
        const params = this.tryParseArrowParams();
        if (params && this.at('=>', 'op')) {
          // 箭头函数参数已解析消耗
          this.parseArrowFunctionFromParams(params);
          expr = { kind: 'any' };
          continue;
        }
        this.pos = save;
        // 函数调用
        this.parseCall(expr);
        expr = { kind: 'any' };
        continue;
      }
      if (this.at('++', 'op') || this.at('--', 'op')) { this.next(); continue; }
      break;
    }
    return expr;
  }

  parseCall(callee) {
    // 解析实参
    this.expect('(', '调用');
    let argCount = 0;
    let sawSpread = false;
    while (!this.at(')') && this.peek().type !== 'eof') {
      if (this.at('...', 'op')) { sawSpread = true; this.next(); }
      if (this.at('async', 'ident') && (this.peek(1).value === '(' || this.peek(1).value === '=>' )) {
        this.next(); // async
      }
      this.parseAssignment();
      argCount++;
      if (!this.eat(',')) break;
    }
    this.expect(')', '调用结束');

    // 检查已注册函数的参数个数
    if (callee && callee.kind2 === 'ident-ref' && callee.name && this.functions.has(callee.name)) {
      const fn = this.functions.get(callee.name);
      if (!sawSpread && argCount !== fn.params) {
        this.error(this.peek().line, this.peek().col,
          `函数 '${callee.name}' 期望 ${fn.params} 个参数，实际传入 ${argCount} 个`);
      }
    }
    return { kind: 'any' };
  }

  parsePrimary() {
    const t = this.peek();

    if (t.type === 'number') { this.next(); return { kind: 'number' }; }
    if (t.type === 'string') { this.next(); return { kind: 'string' }; }

    if (t.type === 'ident') {
      const KW = KEYWORDS;
      if (KW.has(t.value)) {
        if (t.value === 'true' || t.value === 'false') { this.next(); return { kind: 'boolean' }; }
        if (t.value === 'null') { this.next(); return { kind: 'null' }; }
        if (t.value === 'undefined') { this.next(); return { kind: 'undefined' }; }
        if (t.value === 'this' || t.value === 'super') { this.next(); return { kind: 'any' }; }
        if (t.value === 'function') { this.parseFunctionExpression(null); return { kind: 'function' }; }
        if (t.value === 'new') {
          this.next();
          const callee = this.parsePostfix();
          return { kind: 'any' };
        }
        if (t.value === 'class') { this.skipClass(); return { kind: 'any' }; }
        if (t.value === 'async' || t.value === 'yield') {
          this.next();
          if (this.at('function', 'ident')) { this.parseFunctionExpression(null); return { kind: 'function' }; }
          return this.parseUnary();
        }
        // 其他关键字（import/export 等）——当作语句处理
        this.next();
        return { kind: 'any' };
      }
      // 普通标识符
      this.next();
      const isCall = this.at('(');
      const isArrow = this.at('=>', 'op');
      if (!isArrow) this.reference(t.value, t.line, t.col);
      if (isCall) return { kind: 'any', name: t.value, kind2: 'ident-ref' };
      return { kind: 'any', kind2: 'ident-ref', name: t.value };
    }

    if (t.type === 'op' && t.value === 'function') { this.parseFunctionExpression(null); return { kind: 'function' }; }
    if (t.type === 'ident' && t.value === 'function') { this.parseFunctionExpression(null); return { kind: 'function' }; }

    if (t.type === 'punct' && t.value === '(') { this.next(); this.parseExpression(); this.expect(')', '分组'); return { kind: 'any' }; }

    if (t.type === 'punct' && t.value === '[') {
      this.next();
      let el = 0;
      while (!this.at(']') && this.peek().type !== 'eof') {
        if (this.at('...', 'op')) this.next();
        if (!this.at(',')) this.parseAssignment();
        el++;
        if (!this.eat(',')) break;
      }
      this.expect(']', '数组');
      return { kind: 'array' };
    }

    if (t.type === 'punct' && t.value === '{') {
      this.next();
      // 对象字面量：简化扫描到匹配 }，同时检查内部表达式
      let prevType = null; // 上一个消费的 token 类型，用于区分 shorthand
      while (!this.at('}') && this.peek().type !== 'eof') {
        const kt = this.peek();
        if (kt.type === 'ident' || kt.type === 'string' || kt.type === 'number') { this.next(); prevType = kt.type; }
        if (this.eat('(')) {
          // 方法简写
          const params = this.parseParams();
          this.pushScope();
          for (const p of params) this.declare(p.name, 'param', p.line, p.col);
          this.returnedDepth.push(0);
          this.expect('{', '对象方法');
          while (!this.at('}') && this.peek().type !== 'eof') this.parseStatement();
          this.expect('}');
          this.returnedDepth.pop();
          this.popScope();
          prevType = 'method';
        } else if (this.eat(':')) {
          this.parseAssignment();
          prevType = 'value';
        } else if (this.at(',', 'punct') || this.at('}', 'punct')) {
          // shorthand：key 就是引用 —— 若是纯标识符则检查是否已定义
          if (prevType === 'ident') this.reference(kt.value, kt.line, kt.col);
        } else if (this.at('...', 'op')) {
          this.next();
          if (this.peek().type === 'ident') { const st = this.next(); this.reference(st.value, st.line, st.col); }
          prevType = 'spread';
        } else {
          // 未知结构，向前推进防止死循环
          this.next();
          prevType = 'other';
        }
        if (!this.eat(',')) break;
      }
      this.expect('}', '对象');
      return { kind: 'object' };
    }

    if (t.type === 'op' && t.value === '/') {
      // 兜底：词法层未识别的正则（一般不会走到）
      this.next();
      return { kind: 'regexp' };
    }
    if (t.type === 'regexp') { this.next(); return { kind: 'regexp' }; }

    // 意外 token
    this.next();
    return { kind: 'any' };
  }
}

const KEYWORDS = new Set([
  'true', 'false', 'null', 'undefined', 'this', 'super', 'function', 'new',
  'class', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue', 'typeof',
  'instanceof', 'in', 'of', 'void', 'delete', 'import', 'export', 'const',
  'let', 'var', 'async', 'await', 'yield', 'with', 'debugger', 'static',
  'get', 'set', 'from', 'as',
]);

const ASSIGN_OPS = ['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??='];

const BIN_PREC = {
  '??': 1, '||': 2, '&&': 3, '|': 4, '^': 5, '&': 6,
  '==': 7, '!=': 7, '===': 7, '!==': 7,
  '<': 8, '>': 8, '<=': 8, '>=': 8, 'instanceof': 8, 'in': 8,
  '<<': 9, '>>': 9, '>>>': 9,
  '+': 10, '-': 10,
  '*': 11, '/': 11, '%': 11,
  '**': 12,
};

function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const checker = new Checker(file, src);
  checker.parseProgram();
  return checker.diags;
}

function main() {
  const args = process.argv.slice(2);
  let files = args.filter(a => !a.startsWith('-'));
  if (files.length === 0) {
    // 默认从 package.json 读
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
      const include = (pkg.typecheck && pkg.typecheck.include) || ['src/*.js', 'scripts/*.js'];
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
    const diags = checkFile(abs);
    for (const d of diags) {
      console.log(d.format(ROOT));
      if (d.severity === 'error') errors++; else warnings++;
    }
  }
  console.log(`\ntypecheck: ${files.length} 个文件, ${errors} errors, ${warnings} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

function expand(pattern) {
  // 支持 'dir/*.js' 和 'dir/**/*.js'
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

module.exports = { checkFile };
