/**
 * .agents/skills/math-page-audit/scripts/engine/context.mjs
 * 审计文件上下文预解析层 (Context)
 * 职责：一次性读取文件、字符级状态机精准剥离注释、构建行信息映射与行级抑制注解解析
 */

import path from 'node:path';

export class FileContext {
  constructor(filePath, content, workspaceRoot) {
    this.filePath = filePath;
    this.content = content;
    this.workspaceRoot = workspaceRoot;

    // 跨平台统一相对路径 (修复 BUG 3: Windows 盘符大小写与斜杠不一致)
    const rel = path.relative(workspaceRoot, filePath);
    this.relPath = rel.replace(/\\/g, '/');

    // 文件类型特征标志
    this.isTsx = filePath.endsWith('.tsx');
    this.isTs = filePath.endsWith('.ts');
    this.isTest = filePath.includes('test') || filePath.includes('spec');
    this.isMathPureLayer =
      (filePath.includes('src/math') ||
        filePath.includes('src\\math') ||
        filePath.includes('src/math3d') ||
        filePath.includes('src\\math3d')) &&
      !this.isTest;
    this.isAnimationPage =
      (filePath.endsWith('Animation.tsx') || filePath.endsWith('Page.tsx')) &&
      !this.isTest &&
      content.includes('ThreePanel');
    this.isScene = filePath.endsWith('Scene.tsx') || filePath.includes('Scene');
    this.isBuilder = (filePath.includes('builders') || filePath.includes('builder')) && !this.isTest;
    this.isRegistry = (filePath.includes('registries') || filePath.includes('registry')) && !this.isTest;

    // 分行处理
    this.rawLines = content.split('\n');

    // 解析行级抑制注解: // audit-disable-next-line [ruleId 或 type]
    // 修复 BUG 2: 遇到空行时自动跳过空行，绑定到下一个非空代码行
    this.suppressedLines = this._parseSuppressedLines(this.rawLines);

    // 生成剥离注释后的代码文本及逐行映射（保留原有行号与空行结构）
    // 修复 BUG 1: 状态机精准剥离注释，支持引号嵌套与转义
    this.cleanLines = this._stripComments(this.rawLines);
    this.cleanContent = this.cleanLines.join('\n');
  }

  /**
   * 解析 // audit-disable-next-line 注解
   * 自动跳过空行，绑定到紧接着的第一个非空代码行
   */
  _parseSuppressedLines(lines) {
    const suppressed = new Map();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/\/\/\s*audit-disable-next-line(?:\s+([^\n]+))?/);
      if (match) {
        // 向后寻找下一个非空行
        let targetLineNum = i + 2; // 默认下一行 (1-based)
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().length > 0) {
            targetLineNum = j + 1;
            break;
          }
        }

        const rulesArg = match[1] ? match[1].trim() : '';
        if (!rulesArg) {
          // 未指定规则，全量豁免该目标行
          suppressed.set(targetLineNum, null);
        } else {
          // 指定具体 ruleId 或 type（支持空格或逗号分割多个）
          const ruleTokens = rulesArg.split(/[\s,]+/).filter(Boolean);
          const currentSet = suppressed.get(targetLineNum) || new Set();
          ruleTokens.forEach((r) => currentSet.add(r));
          suppressed.set(targetLineNum, currentSet);
        }
      }
    }
    return suppressed;
  }

  /**
   * 判断某行某规则是否被抑制
   */
  isSuppressed(lineNum, ruleId, type) {
    if (!this.suppressedLines.has(lineNum)) return false;
    const ruleSet = this.suppressedLines.get(lineNum);
    if (ruleSet === null) return true; // 全量豁免
    return ruleSet.has(ruleId) || ruleSet.has(type);
  }

  /**
   * 字符级状态机精准清除单行 // 与块级 /* ... *\/ 注释
   * 正确处理引号嵌套 (如 "Don't touch" // 注释)、转义字符与多行块级注释
   */
  _stripComments(lines) {
    const result = [];
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let cleanLine = '';
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let inBacktick = false;
      let isEscaped = false;

      let j = 0;
      while (j < line.length) {
        const char = line[j];
        const nextChar = j + 1 < line.length ? line[j + 1] : '';

        if (inBlockComment) {
          if (char === '*' && nextChar === '/') {
            inBlockComment = false;
            cleanLine += '  ';
            j += 2;
          } else {
            cleanLine += ' ';
            j++;
          }
          continue;
        }

        // 处理转义字符
        if (isEscaped) {
          cleanLine += char;
          isEscaped = false;
          j++;
          continue;
        }

        if (char === '\\') {
          cleanLine += char;
          isEscaped = true;
          j++;
          continue;
        }

        // 字符串状态跟踪
        if (char === "'" && !inDoubleQuote && !inBacktick) {
          inSingleQuote = !inSingleQuote;
          cleanLine += char;
          j++;
          continue;
        }

        if (char === '"' && !inSingleQuote && !inBacktick) {
          inDoubleQuote = !inDoubleQuote;
          cleanLine += char;
          j++;
          continue;
        }

        if (char === '`' && !inSingleQuote && !inDoubleQuote) {
          inBacktick = !inBacktick;
          cleanLine += char;
          j++;
          continue;
        }

        // 不在任何字符串内时，检测注释
        if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
          // 单行注释 //
          if (char === '/' && nextChar === '/') {
            // // 之后整行都是注释，直接丢弃
            break;
          }

          // 块级注释 /*
          if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            cleanLine += '  ';
            j += 2;
            continue;
          }
        }

        cleanLine += char;
        j++;
      }

      result.push(cleanLine);
    }

    return result;
  }
}
