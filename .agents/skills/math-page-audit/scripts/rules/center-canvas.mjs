/**
 * .agents/skills/math-page-audit/scripts/rules/center-canvas.mjs
 * 领域规则：中屏画布与数形结合规范
 */

export const centerCanvasRules = [
  {
    id: 'center/no-raw-float-text',
    group: 'center',
    type: '中屏浮点堆砌',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (line.includes('<text') && (line.includes('toFixed') || line.includes('${'))) {
          if (!line.includes('SceneLabelGroup') && !line.includes('PolarGrid') && !line.includes('CoordinateGrid')) {
            issues.push({
              lineNum: idx + 1,
              message: '检测到 SVG 内可能直接渲染了浮点坐标字符串，请使用纯代数符号 + SceneLegend',
              snippet: line.trim(),
            });
          }
        }
      });
      return issues;
    },
  },
  {
    id: 'center/no-svg-raw-latex',
    type: 'SVG裸LaTeX源码',
    severity: 'error',
    check(ctx) {
      if (!ctx.isScene && !ctx.cleanContent.includes('<text')) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if ((ctx.filePath.includes('Scene') || line.includes('<text')) &&
          (/text:\s*["'`][^"'`]*\\[a-zA-Z]+/.test(line) || /<text[^>]*>[^<]*\\[a-zA-Z]+/.test(line))) {
          issues.push({
            lineNum: idx + 1,
            message: '检测到 SVG 画布点标或曲线标签传入了裸 LaTeX 源码，SVG 不支持 LaTeX 解析，请使用 Unicode 字符 (如 √x, 1/x, x²) 或归位 SceneLegend',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'center/font-scale',
    type: 'SVG裸fontSize硬编码',
    severity: 'error',
    check(ctx) {
      if ((!ctx.isTsx && !ctx.filePath.endsWith('.jsx')) || ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/<text\b[^>]*\bfontSize=\{[0-9.]+\}/.test(line) && !line.includes('fontScale')) {
          issues.push({
            lineNum: idx + 1,
            message: 'SVG 标签内严禁直接硬编码裸数字 fontSize={...}，必须通过 fontScale 或 canvasSize.font 进行动态缩放',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'center/no-drag-reconvert',
    type: '拖拽二次转换',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (line.includes('onDrag') && line.includes('designToMath')) {
          issues.push({
            lineNum: idx + 1,
            message: 'InteractivePoint 回调已是数学坐标，严禁二次调用 designToMath',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'center/paradigm-a-pure',
    type: '3D综合法范式混入坐标轴或向量或网格',
    severity: 'error',
    check(ctx) {
      const isDedicatedParadigmA =
        (ctx.filePath.includes('solidGeometry') || ctx.filePath.includes('math3d')) &&
        (ctx.cleanContent.includes('范式 A') || ctx.cleanContent.includes('综合法') || ctx.cleanContent.includes('paradigm: "A"')) &&
        !ctx.cleanContent.includes('向量法') &&
        !ctx.cleanContent.includes('坐标法') &&
        !ctx.cleanContent.includes('vector') &&
        !ctx.cleanContent.includes('coordinate');

      if (!isDedicatedParadigmA) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/<CoordinateAxes3D\b/.test(line) || /<Vector3DArrow\b/.test(line) || /<Scene3DGrid\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '综合法 (范式 A) 必须保持纯几何纯净度，严禁混入 <CoordinateAxes3D>、<Vector3DArrow> 或 <Scene3DGrid>',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'center/sequence-discrete',
    type: '数列图象连续化违规',
    severity: 'error',
    check(ctx) {
      if ((!ctx.filePath.includes('sequence') && !ctx.filePath.includes('Sequence')) || !ctx.filePath.endsWith('Scene.tsx')) {
        return [];
      }
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/<SplineCurve\b/.test(line) || /<SmoothCurve\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '数列必须严格遵守离散点域规范 (n ∈ N*)，图象主体必须为离散点列或柱状图，严禁光滑样条连续曲线冒充数列',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
];
