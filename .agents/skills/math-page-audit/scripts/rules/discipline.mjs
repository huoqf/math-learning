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
  '平稳分布',
  '卡方分布',
  '概率密度函数',
  '微元',
  '定积分',
  '极坐标',
  '参数方程',
];

/**
 * 函数凸凹术语（受控模式 + 语境白名单）
 *
 * 历史漏洞（见审核报告 B1）：黑名单里只写了 '凹凸' 一个词，于是「下凸 / 上凸 /
 * 凸弧 / 凹弧 / 凸性 / 凹向上 / 下凹」等同一族超纲表述全部静默通过——改一个词
 * 就绕过门禁，词表本身不成立。
 *
 * 但也不能把「凹」「凸」直接塞进黑名单：这两个字在课标内的合法几何语境中大量
 * 出现（凸多面体、凸多边形、凸组合、凹陷、凸显…），逐个报错会造成大面积误伤。
 * 故采用「单字模式命中 + 合法语境白名单放行」，使超纲表述的任意组词形式都无处可逃。
 */
const CONCAVITY_PATTERN = /[凹凸]/;
const CONCAVITY_ALLOWLIST = [
  // 立体几何 / 组合数学中的合法用法（与函数凸性无关）
  '凸多面体',
  '凸多边形',
  '凸四边形',
  '凸六边形',
  '凸组合',
  '凸图形',
  '凸体',
  '凸包',
  '凸壳',
  '凸集',
  '凸出',
  '凸起',
  '凸台',
  '凹槽',
  '凹陷',
  '凸显',
  '凸透镜',
  '凹透镜',
];
const CONCAVITY_TERM_LABEL = '函数凸凹表述（下凸 / 上凸 / 凸弧 / 凹弧 / 凸性 …）';

/**
 * 必修一函数章节"正文禁用极限记号"门禁
 *
 * 口径来源：数列章节已立同款机器门禁（见 src/math/__tests__/probabilityMarkov.test.ts
 * 与 src/data/builders/__tests__/probabilityDistribution.test.ts），理由是"极限"不在
 * 高中课标正文内、卷面书写属失分点。但同一份课标下，必修一函数章节却长期使用
 * 「左端点极限 / 左右极限」这类表述（审核报告 B4），造成全库口径分裂。
 *
 * 此处把该口径推广到必修一函数主题：一律改用"分界点左/右侧取值""无限接近"等
 * 课标内表述。选择性必修（导数、超越函数放缩等）允许使用极限思想，不在此列。
 */
const COMPULSORY_ONE_FUNCTION_FILES = [
  // 展示层
  /^src\/features\/(composite|funcExpLog|funcProperties|funcZero|transform|quadratic|nike)\//,
  // 数据层（右屏 MathPanel 文案来源）
  /^src\/data\/builders\/(funcComposite|funcExpLog|funcProperties|funcZero|funcTransform|quadratic|nike)\.ts$/,
  // 求解层
  /^src\/math\/(composite|function)\.ts$/,
];
const LIMIT_NOTATION_PATTERN = /\blim\b|极限/;

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
            // 先将模板字符串中的 ${...} 插值替换为安全占位符，避免其中的 $ 干扰 LaTeX $...$ 定界符配对
            const textWithoutInterpolation = text.replace(/\$\{[^}]*\}/g, '___EXPR___');
            const stripped = textWithoutInterpolation.replace(/\$[^$]+\$/g, '');
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

      // 扫描范围：凡承载教学内容与学生可见文案的载体文件。
      //  - 数据层：builders / registries / knowledgeTree / meta.ts
      //  - 展示层：Animation / Page / Scene / modeConfig
      //  - 兜底：src/features 下全部非测试源码
      //    （旧清单按文件名后缀枚举，漏掉了首页知识树卡片等文案载体，
      //      导致"马尔可夫链"从首页第一屏泄漏，见概率统计模块审计 P0-1）
      const isContentFile =
        ctx.isBuilder ||
        ctx.isRegistry ||
        ctx.filePath.includes('knowledgeTree') ||
        ctx.filePath.includes('modeConfig') ||
        ctx.filePath.endsWith('meta.ts') ||
        ctx.filePath.endsWith('Animation.tsx') ||
        ctx.filePath.endsWith('Page.tsx') ||
        ctx.filePath.endsWith('Scene.tsx') ||
        /^src\/features\//.test(ctx.relPath);
      if (!isContentFile) return [];

      // 已显式声明"拓展/选学/超出课标"的文件：命中降级为 warning（视为已标注的拓展内容）
      //  - 条目级（首选）：右屏 Theorem 上的 `isExtension: true`，会渲染「拓展 · 选学」紫色徽标；
      //  - 文件级（兼容）：节点/文件声明 importance: "extend" 或 status: 拓展/选学/竞赛，
      //    以及历史写法中把「（拓展 · 超出课标）」写进文案的情形。
      const declaredExtend =
        /isExtension:\s*true/.test(ctx.cleanContent) ||
        /importance:\s*["']extend["']/.test(ctx.cleanContent) ||
        /status:\s*["'](拓展|选学|竞赛)["']/.test(ctx.cleanContent) ||
        /超出课标/.test(ctx.cleanContent) ||
        /选学/.test(ctx.cleanContent) ||
        /拓展\s*[·・]/.test(ctx.cleanContent) ||
        /[（(]\s*(拓展|选学)/.test(ctx.cleanContent);

      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        const termHit = BEYOND_SYLLABUS_TERMS.find((term) => line.includes(term));
        // 凸凹族单独走"模式 + 白名单"：命中任何「凹/凸」且不含合法语境词组即判超纲，
        // 从而覆盖「凹凸」之外的 下凸 / 上凸 / 凸弧 / 凹弧 / 凸性 / 凹向上 … 全部变体。
        const concavityHit =
          !termHit && !CONCAVITY_ALLOWLIST.some((w) => line.includes(w)) && CONCAVITY_PATTERN.test(line);
        const hit = termHit || (concavityHit ? CONCAVITY_TERM_LABEL : null);
        if (hit) {
          // 标内白名单放行：新高考倡导的"向量参数方程"、"参数化设点"、"单参数设点"、"三角参数化"属合规技巧，不误判为超纲
          if (hit === '参数方程') {
            const isCompliantParametric =
              line.includes('向量参数') ||
              line.includes('参数化设点') ||
              line.includes('单参数设点') ||
              line.includes('三角参数') ||
              line.includes('参数化') ||
              line.includes('参数设点');
            if (isCompliantParametric && !line.includes('双曲线参数方程')) {
              return;
            }
          }

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
  {
    id: 'discipline/no-limit-notation-compulsory-one',
    group: 'discipline',
    type: '必修一正文极限记号',
    severity: 'error',
    check(ctx) {
      if (ctx.isTest) return [];
      if (!COMPULSORY_ONE_FUNCTION_FILES.some((re) => re.test(ctx.relPath))) {
        return [];
      }
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (!LIMIT_NOTATION_PATTERN.test(line)) return;
        if (ctx.isSuppressed(idx + 1, 'discipline/no-limit-notation-compulsory-one', '必修一正文极限记号')) {
          return;
        }
        issues.push({
          lineNum: idx + 1,
          type: '必修一正文极限记号',
          message:
            '必修一函数章节尚未学习极限（数列章节已立同款门禁）。请改用「分界点左/右侧取值」「无限接近」等课标内表述，严禁出现 lim 记号与「极限」术语。',
          snippet: line.trim(),
        });
      });
      return issues;
    },
  },
  {
    id: 'discipline/no-hardcoded-white',
    group: 'discipline',
    type: '硬编码白色',
    severity: 'error',
    check(ctx) {
      if (ctx.isTest) return [];
      // 令牌定义文件（theme 层）是白色的合法出处
      if (/\/theme\//.test(ctx.relPath)) return [];
      const WHITE_PATTERN =
        /(?:stroke|fill|color)=\{?"(?:white|#fff\b|#ffffff|white"|'#fff(?:fff)?')/i;
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (!WHITE_PATTERN.test(line)) return;
        issues.push({
          lineNum: idx + 1,
          type: '硬编码白色',
          message:
            '白色必须使用主题令牌 MATH_COLORS.white（或 Tailwind 语义类），严禁硬编码 "white" / "#fff" 字面量——深色主题或非白底场景下会不可见',
          snippet: line.trim(),
        });
      });
      return issues;
    },
  },
];
