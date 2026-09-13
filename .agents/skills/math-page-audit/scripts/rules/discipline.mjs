/**
 * .agents/skills/math-page-audit/scripts/rules/discipline.mjs
 * 领域规则：高考学科规范与学术符号标准
 */

/**
 * 超纲术语黑名单（2019 人教A版新课标之外的内容）
 * 命中即判为 error；若文件已显式声明为"拓展/选学"（importance: "extend" 或含拓展徽标），
 * 则该文件内的命中降级为 warning（视为"已标注的拓展内容"，允许保留）。
 */
const BEYOND_SYLLABUS_TERMS = [
  '洛必达',
  "L'Hôpital",
  'L’Hôpital',
  '洛比达',
  '麦克劳林',
  '泰勒展开',
  '泰勒公式',
  '泰勒',
  '琴生',
  '凹凸',
  '极点极线',
  '克拉默',
  '外积',
  '叉积',
  '夹逼',
  '等价无穷小',
  '上确界',
  '下确界',
  '紧致',
  '无穷级数',
  '数列极限',
  '特征方程',
  '马尔可夫链',
  '卡方分布',
  '概率密度函数',
  '微元',
  '定积分',
  '极坐标',
  '参数方程',
];

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
  {
    id: 'discipline/no-beyond-syllabus-terms',
    group: 'discipline',
    type: '超纲术语',
    severity: 'error',
    check(ctx) {
      if (ctx.isTest) return [];

      // 仅扫描承载教学内容与文案的载体文件（不含纯工具/类型/常量文件）
      const isContentFile =
        ctx.isBuilder ||
        ctx.isRegistry ||
        ctx.filePath.includes('knowledgeTree') ||
        ctx.filePath.includes('modeConfig') ||
        ctx.filePath.endsWith('meta.ts') ||
        ctx.filePath.endsWith('Animation.tsx') ||
        ctx.filePath.endsWith('Page.tsx') ||
        ctx.filePath.endsWith('Scene.tsx');
      if (!isContentFile) return [];

      // 已显式声明"拓展/选学/超出课标"的文件：命中降级为 warning（视为已标注的拓展内容）
      const declaredExtend =
        /importance:\s*["']extend["']/.test(ctx.cleanContent) ||
        /status:\s*["'](拓展|选学|竞赛)["']/.test(ctx.cleanContent) ||
        /超出课标/.test(ctx.cleanContent) ||
        /选学/.test(ctx.cleanContent) ||
        /拓展\s*[·・]/.test(ctx.cleanContent) ||
        /[（(]\s*(拓展|选学)/.test(ctx.cleanContent);

      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        const hit = BEYOND_SYLLABUS_TERMS.find((term) => line.includes(term));
        if (hit) {
          issues.push({
            lineNum: idx + 1,
            type: '超纲术语',
            severity: declaredExtend ? 'warning' : 'error',
            message: `检测到超出 2019 人教A版新课标的术语「${hit}」。若确为拓展/强基/竞赛内容，请标注 importance: "extend" 并在页面显示「拓展 · 超出课标」徽标；否则请改用课标内表述。`,
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
];
