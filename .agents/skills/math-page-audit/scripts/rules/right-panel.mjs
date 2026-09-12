/**
 * .agents/skills/math-page-audit/scripts/rules/right-panel.mjs
 * 领域规则：右屏数据看板与破题推演规范
 */

export const rightPanelRules = [
  {
    id: 'right/build-context-forwarding',
    group: 'right',
    type: '右屏缺少模式上下文透传',
    severity: 'error',
    check(ctx) {
      if (!ctx.isAnimationPage || !ctx.cleanContent.includes('buildMathQuantities(') || !ctx.cleanContent.includes('<SelectGrid')) {
        return [];
      }
      const buildCallMatch = ctx.cleanContent.match(/buildMathQuantities\s*\(\s*[^,]+,\s*[^,]+(?:,\s*\{([^}]*)\})?\s*\)/);
      if (buildCallMatch) {
        const configObj = (buildCallMatch[1] || "").toLowerCase();
        const validTokens = ["mode", "preset", "sub", "scenario", "type", "tab", "op", "logic"];
        if (!validTokens.some((t) => configObj.includes(t))) {
          return [{
            lineNum: 1,
            message: '主页面存在多情景切换，但 buildMathQuantities 第三个参数 config 缺少当前模式/二级选项透传，会导致右屏显示默认或不相干内容',
            snippet: buildCallMatch[0].slice(0, 60),
          }];
        }
      }
      return [];
    },
  },
  {
    id: 'right/builder-mode-branch',
    group: 'right',
    type: 'Builder定理未按模式隔离',
    severity: 'error',
    check(ctx) {
      if (!ctx.isBuilder || !ctx.cleanContent.includes('theorems') || !ctx.cleanContent.includes('mode')) {
        return [];
      }
      const hasModeBranch =
        ctx.cleanContent.includes('switch') ||
        ctx.cleanContent.includes('else if') ||
        /if\s*\(\s*(activeMode|subMode|mode|studyMode|modelType|model)\b/.test(ctx.cleanContent);
      const hasUnconditionalPush =
        /theorems\.push\([\s\S]*?theorems\.push\(/g.test(ctx.cleanContent) && !hasModeBranch;
      if (hasUnconditionalPush) {
        return [{
          lineNum: 1,
          message: '检测到 Builder 函数中可能存在跨模式定理无条件连续追加，必须按 mode 分支或字典映射纯净装配',
          snippet: 'theorems 缺少模式条件分支隔离',
        }];
      }
      return [];
    },
  },
  {
    id: 'right/algebra-rigor',
    group: 'right',
    type: '代数表达规范违规',
    severity: 'error',
    check(ctx) {
      if ((!ctx.isBuilder && !ctx.isMathPureLayer) || ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/\b\d+\.00(?:[a-zA-Z]|\\[a-zA-Z]+)/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            type: '代数式机器浮点尾零',
            message: '解析几何与函数代数式严禁使用 .00 机器浮点数污染代数变量（如 1.00x, 1.00\\pi），必须使用纯整数与 formatMathNumber()',
            snippet: line.trim(),
          });
        }
        if (/(?:latex|value)\s*:\s*[`'"].*?[+\-=]\s*1[a-zA-Z]\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            type: '代数式未省略系数1',
            message: '代数多项式中的系数 1 必须省略（如 1x 必须化简为 x），严禁未化简表达式直接呈现在右屏',
            snippet: line.trim(),
          });
        }
        if (/\\iff.*?\\in\s*[A-Za-z]/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            type: '伪命题充要条件滥用',
            message: '点线位置关系严禁滥用充要双向箭头 \\iff（过定点的直线有无数条，反推不成立），必须使用单向蕴涵 \\implies',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'right/reasoning-no-isolated-number',
    group: 'right',
    type: '推导链孤立数值跳步',
    severity: 'error',
    check(ctx) {
      if (!ctx.isBuilder || ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        // 确保位于包含 step: 或 reasoningSteps 的推导上下文内，避免误伤 theorems / quantities
        const surroundingLines = ctx.cleanLines.slice(Math.max(0, idx - 6), Math.min(ctx.cleanLines.length, idx + 6)).join('\n');
        const isStepContext = surroundingLines.includes('reasoningSteps') || /\bstep\s*:\s*[0-9]/.test(surroundingLines);
        if (!isStepContext) return;

        // 匹配推导链中形如 latex: "|AB| = 5.33" 或 latex: `S = ${num}` 单等号孤立数字赋值（跳步未展示推导展开）
        const isolatedMatch = line.match(/^\s*latex:\s*[`'"]\s*(\|?[A-Za-z]+(?:_[0-9A-Za-z]+)?\|?|[A-Za-z]+)\s*=\s*-?(?:\$\{[^}]+\}|\d+(?:\.\d+)?)(?:\s*\\text\{[^}]*\})?\s*[`'"]/);
        if (isolatedMatch) {
          const varName = isolatedMatch[1];
          // 排除常规坐标系/零值初始化定义 (如 x = 0, y = 0)
          if (!/^[xy]$/.test(varName)) {
            issues.push({
              lineNum: idx + 1,
              message: `推导链严禁跳步直接给孤立数值 (${varName} = ...)，必须遵循「① 符号表达式 → ② 具体参数代入 → ③ 求解结果」代数三部曲展开`,
              snippet: line.trim(),
            });
          }
        }
      });
      return issues;
    },
  },
];
