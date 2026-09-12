/**
 * .agents/skills/math-page-audit/scripts/rules/discipline.mjs
 * 领域规则：高考学科规范与学术符号标准
 */

export const disciplineRules = [
  {
    id: 'discipline/standard-symbols',
    group: 'discipline',
    type: '课标符号违规',
    severity: 'error',
    check(ctx) {
      if ((!ctx.isBuilder && !ctx.isRegistry && !ctx.filePath.endsWith('Animation.tsx') && !ctx.isScene) || ctx.isTest) {
        return [];
      }
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/\\mathbf\{[a-zA-Z]/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '高中向量必须使用 \\vec{a} 或 \\overrightarrow{AB}，严禁大学粗体 \\mathbf{a}',
            snippet: line.trim(),
          });
        }
        if (/\b(nCr|nPr)\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '排列组合必须使用课标标准 C_n^m / \\binom{n}{m} / A_n^m，严禁工程记号 nCr / nPr',
            snippet: line.trim(),
          });
        }
        if (/\\bot\b/.test(line) && !line.includes('bottom')) {
          issues.push({
            lineNum: idx + 1,
            message: '垂直符号必须使用课标标准 \\perp，严禁底元素符号 \\bot',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'discipline/no-physics-units',
    type: '物理单位残留',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/\bunit:\s*["'](m|s|kg|N|m\/s|rad|m²|m³|cm)["']/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '数学量严禁配置物理学科单位 (m, s, N, kg 等)，纯数学量无物理量纲',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'discipline/text-delimiter',
    type: '混合文本缺少$定界符',
    severity: 'error',
    check(ctx) {
      if (ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        const isCommentLine = /^\s*(\/\/|\/\*|\{\/\*|\*)/.test(line);
        const isJsxElement = /<[A-Za-z][a-zA-Z0-9]*\b/.test(line);
        if (isCommentLine || isJsxElement || line.includes('import') || !/[\u4e00-\u9fa5]/.test(line)) {
          return;
        }
        const strMatches = line.match(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g) || [];
        for (const rawStr of strMatches) {
          const str = rawStr.slice(1, -1);
          if (/[\u4e00-\u9fa5]/.test(str) && !str.includes('$') && !line.includes('latex:') && !line.includes('formula:')) {
            const textFreeStr = str.replace(/\\(?:text|mathrm|operatorname)\{[^}]*\}/g, '');
            if (/[\u4e00-\u9fa5]/.test(textFreeStr)) {
              const hasLatexCmd = /\\[a-zA-Z]{2,}/.test(textFreeStr);
              const hasMathSuper = /[a-zA-Z]\^[0-9a-zA-Z]+/.test(textFreeStr);
              const hasMathSub = /\b[a-zA-Z]{1,2}_[0-9a-zA-Z]+|\b[fgh]_(?:max|min)\b/.test(textFreeStr);
              if (hasLatexCmd || hasMathSuper || hasMathSub) {
                issues.push({
                  lineNum: idx + 1,
                  type: '混合文本缺少$定界符',
                  message: '检测到中文句子中包含 LaTeX 指令或上下标，但未用 $...$ 包裹，会导致公式无法被 KaTeX 正确切分渲染',
                  snippet: line.trim(),
                });
                break;
              }
            }
          }
        }
      });
      return issues;
    },
  },
  {
    id: 'discipline/raw-latex-instructions',
    type: '文本缺少$定界符',
    severity: 'error',
    check(ctx) {
      if ((!ctx.isBuilder && !ctx.filePath.endsWith('Page.tsx') && !ctx.filePath.endsWith('Animation.tsx')) || ctx.isTest) {
        return [];
      }
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/(?:detail|condition|question|prerequisites)\s*:\s*[`'"].*?\\(in|ge|le|Delta|subset|cap|cup)\b.*?[`'"]/.test(line)) {
          const strMatch = line.match(/(?:detail|condition|question|prerequisites)\s*:\s*([`'"])([\s\S]*?)\1/);
          if (strMatch) {
            const text = strMatch[2];
            const stripped = text.replace(/\$[^$]+\$/g, '');
            if (/\\(in|ge|le|Delta|subset|cap|cup)\b/.test(stripped)) {
              issues.push({
                lineNum: idx + 1,
                message: '说明文本中包含 LaTeX 数学指令但未用 $...$ 包裹，会导致界面直接暴露 raw 源码字符',
                snippet: line.trim(),
              });
            }
          }
        }
      });
      return issues;
    },
  },
];
