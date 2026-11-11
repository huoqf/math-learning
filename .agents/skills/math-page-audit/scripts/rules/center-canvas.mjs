/**
 * .agents/skills/math-page-audit/scripts/rules/center-canvas.mjs
 * 领域规则：中屏画布与数形结合规范
 */

/** 跨行精确提取 JSX <text ...>...</text> 元素范围（跟踪 {} 深度与引号，跳过 >= / =>） */
function findJsxTextElements(code) {
  const ranges = [];
  let idx = 0;
  while (true) {
    const start = code.indexOf('<text', idx);
    if (start === -1) break;
    const after = code[start + 5];
    if (after && !/[\s>]/.test(after)) {
      idx = start + 5;
      continue;
    }
    let i = start + 5;
    let brace = 0;
    let quote = null;
    let selfClosing = false;
    let openEnd = -1;
    while (i < code.length) {
      const ch = code[i];
      if (quote) {
        if (ch === '\\') {
          i += 2;
          continue;
        }
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
      } else if (ch === '{') {
        brace++;
      } else if (ch === '}') {
        if (brace > 0) brace--;
      } else if (brace === 0) {
        if (ch === '/' && code[i + 1] === '>') {
          selfClosing = true;
          openEnd = i + 2;
          break;
        }
        if (ch === '>') {
          openEnd = i + 1;
          break;
        }
      }
      i++;
    }
    if (openEnd === -1) break;
    if (selfClosing) {
      idx = openEnd;
      continue;
    }
    const closeIdx = code.indexOf('</text>', openEnd);
    if (closeIdx === -1) {
      idx = openEnd;
      continue;
    }
    ranges.push({ openStart: start, bodyStart: openEnd, bodyEnd: closeIdx });
    idx = closeIdx + 7;
  }
  return ranges;
}

export const centerCanvasRules = [
  {
    id: 'center/no-raw-float-text',
    group: 'center',
    type: '中屏浮点堆砌',
    severity: 'error',
    check(ctx) {
      if (!ctx.isTsx && !ctx.filePath.endsWith('.jsx')) return [];
      if (
        ctx.filePath.includes('SceneLabelGroup') ||
        ctx.filePath.includes('PolarGrid') ||
        ctx.filePath.includes('CoordinateGrid')
      ) {
        return [];
      }
      const issues = [];
      const seenLines = new Set();

      // 1. 跨行扫描 JSX <text ...>BODY</text> 标签体内的裸 .toFixed(...) 调用
      const textRanges = findJsxTextElements(ctx.cleanContent);
      for (const r of textRanges) {
        const body = ctx.cleanContent.slice(r.bodyStart, r.bodyEnd);
        const match = /\.toFixed\s*\(/.exec(body);
        if (match) {
          const absPos = r.bodyStart + match.index;
          const lineNum = ctx.cleanContent.slice(0, absPos).split('\n').length;
          if (!seenLines.has(lineNum)) {
            seenLines.add(lineNum);
            issues.push({
              lineNum,
              message:
                '检测到 SVG <text> 内直接调用 .toFixed() 渲染浮点字符串，请改用 formatMathNumber() / formatMathProb() 或纯代数符号 + SceneLegend',
              snippet: (ctx.cleanLines[lineNum - 1] || '').trim(),
            });
          }
        }
      }

      // 2. 兼容单行遗留模式（如 <text ...>{`...${...}`}</text> 含模板坐标）
      ctx.cleanLines.forEach((line, idx) => {
        if (seenLines.has(idx + 1)) return;
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
    id: 'center/no-font-scale-in-coords',
    type: 'fontScale误用于几何坐标或尺寸',
    severity: 'error',
    check(ctx) {
      if ((!ctx.isTsx && !ctx.filePath.endsWith('.jsx')) || ctx.isTest) return [];
      // 严格守卫共享组件层（src/components/），防止公共基础设施将 fontScale 渗入几何坐标造成全库性畸变
      if (!/(?:^|[/\\])src[/\\]components[/\\]/.test(ctx.filePath)) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/\b(?:x|y|cx|cy|r|rx|ry|width|height|strokeWidth)\s*=\s*\{[^}]*\bfontScale\s*\(/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '共享原子组件严禁将 fontScale 用于几何坐标或尺寸属性，几何量必须使用纯 design 常量以避免非线性截断畸变',
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
