/**
 * .agents/skills/math-page-audit/scripts/rules/style-tokens.mjs
 * 领域规则：色彩令牌与前端样式合规性
 */

export const styleTokensRules = [
  {
    id: 'style/no-hardcoded-hex',
    group: 'style',
    type: '硬编码颜色',
    severity: 'error',
    check(ctx) {
      if (ctx.filePath.includes('theme') || ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/stroke=["']#[0-9a-fA-F]{3,8}["']/.test(line) || /fill=["']#[0-9a-fA-F]{3,8}["']/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '禁止硬编码 Hex 颜色，必须使用 MATH_COLORS.* 或 CANVAS_COLORS.*',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'style/no-hardcoded-rgb',
    type: '硬编码rgb颜色',
    severity: 'error',
    check(ctx) {
      if (ctx.filePath.includes('theme') || ctx.isTest || ctx.filePath.includes('css')) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/(stroke|fill|color|background|backgroundColor):\s*["']rgba?\([0-9\s.,%]+\)["']/.test(line) ||
            /(stroke|fill)=["']rgba?\([0-9\s.,%]+\)["']/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '禁止在业务源码中直接硬编码 rgb() / rgba() 色值，必须使用 MATH_COLORS 或 withAlpha()',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'style/no-jsx-double-backslash',
    type: 'JSX双斜杠陷阱',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/formula="[^"]*\\\\/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: 'JSX 属性字符串中的 \\\\ 会被直接传给 KaTeX 导致换行/排版断裂，请改为单斜杠 \\',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
];
