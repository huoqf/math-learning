/**
 * .agents/skills/math-page-audit/scripts/rules/architecture.mjs
 * 领域规则：系统架构与纯洁性底线
 */

// ─────────────────────────────────────────────────────────────────────────────
// arch/no-builder-raw-calc 扫描内核
//
// 逐行正则对以下三类写法天然失效，而三者都是真实可达的（prettier 折行会让
// 行级匹配周期性失效）：
//   1. 跨行赋值：`const R =` / `  Math.sqrt(a*a+b*b);`
//   2. 内联无变量：`value: \`${Math.sqrt(a*a+b*b).toFixed(2)}\``
//   3. 未列入白名单的标识符：`const e = Math.sqrt(...)`、`const s = Math.hypot(...)`
// 故改为字符级扫描：注释已由 FileContext 状态机剥离，这里直接对 cleanContent 做
// 括号配对定位开方调用的实参，再把字符下标回映为行号（用于抑制注解与报告）。
// ─────────────────────────────────────────────────────────────────────────────

/** 从 openIdx 处的 '(' 向右配对，返回对应 ')' 下标；未闭合返回 -1 */
function matchParenForward(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** 从 closeIdx 处的 ')' 向左配对，返回对应 '(' 下标；未闭合返回 -1 */
function matchParenBackward(text, closeIdx) {
  let depth = 0;
  for (let i = closeIdx; i >= 0; i--) {
    const ch = text[i];
    if (ch === ')') depth++;
    else if (ch === '(') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Math 内置常量不属于「运行时标识符」 */
const MATH_CONST_RE =
  /\bMath\s*\.\s*(?:PI|E|SQRT2|SQRT1_2|LN2|LN10|LOG2E|LOG10E)\b/g;

/**
 * 表达式是否含运行时标识符。
 * Math.sqrt(3) / Math.pow(2, 0.5) / (Math.sqrt(2) / 2) 这类纯常数式返回 false，
 * 从而不把「公式里的无理常数系数」误判成「对入参的裸重算」。
 */
function hasRuntimeIdentifier(expr) {
  return /[A-Za-z_$]/.test(String(expr).replace(MATH_CONST_RE, ' '));
}

/** 顶层逗号切分（忽略嵌套括号内的逗号） */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/** 取 `** 0.5` / `^ 0.5` 左侧操作数（必要时回溯配对括号） */
function leftOperand(text, end) {
  let i = end - 1;
  while (i >= 0 && /\s/.test(text[i])) i--;
  if (i < 0) return '';
  if (text[i] === ')') {
    const open = matchParenBackward(text, i);
    return open === -1 ? '' : text.slice(open + 1, i);
  }
  let j = i;
  while (j >= 0 && /[\w$.]/.test(text[j])) j--;
  return text.slice(j + 1, i + 1);
}

/** 行起始偏移表（cleanContent === cleanLines.join('\n')） */
function buildLineIndex(cleanLines) {
  const starts = [0];
  for (let i = 0; i < cleanLines.length; i++) {
    starts.push(starts[i] + cleanLines[i].length + 1);
  }
  return starts;
}

/** 字符下标 → 1-based 行号 */
function lineAt(lineStarts, offset) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/** `Math.sqrt(...)` / `Math.hypot(...)` / `Math.pow(..., 0.5)` */
const RADICAL_CALL_RE = /Math\s*\.\s*(sqrt|hypot|pow)\s*\(/g;
/** `** 0.5` / `**.5` / `^ 0.5` */
const HALF_POWER_RE = /(?:\*\*|\^)\s*0?\.5(?![\d.])/g;
/**
 * 通用 builder 的几何度量命名门槛。
 * solid 专题专用文件不做名称限制（任何开方都是几何度量裸算）；
 * 其余 builder 仅当赋值目标命中几何度量词表时才拦截，避免误伤
 * 对勾函数最值、统计量等非几何开方（如 nike.ts 的 Math.sqrt(a * b)）。
 */
const GENERAL_METRIC_NAME_RE =
  /\b(?:radius|circumRadius|inRadius|distance|dist|zE|slantHeight|generatrix)\b\s*[:=]/;

/** 收集「开方裸重算」的字符下标 */
function collectRawCalcOffsets(content, isTarget) {
  const offsets = [];

  RADICAL_CALL_RE.lastIndex = 0;
  let m;
  while ((m = RADICAL_CALL_RE.exec(content))) {
    const start = m.index;
    const open = content.indexOf('(', start + m[0].length - 1);
    if (open === -1) continue;
    const close = matchParenForward(content, open);
    const rawArgs = content.slice(open + 1, close === -1 ? open + 300 : close);
    let offender = false;
    if (m[1] === 'pow') {
      const args = splitTopLevel(rawArgs);
      const exponent = (args[1] || '').trim().replace(/^\(+|\)+$/g, '').trim();
      offender = /^0?\.5$/.test(exponent) && hasRuntimeIdentifier(args[0] || '');
    } else {
      offender = hasRuntimeIdentifier(rawArgs);
    }
    if (offender && isTarget(start)) offsets.push(start);
  }

  HALF_POWER_RE.lastIndex = 0;
  while ((m = HALF_POWER_RE.exec(content))) {
    if (
      hasRuntimeIdentifier(leftOperand(content, m.index)) &&
      isTarget(m.index)
    ) {
      offsets.push(m.index);
    }
  }

  return offsets;
}

const RAW_CALC_MESSAGE =
  'UI展示层（Builder与Scene）严禁对入参进行空间几何度量裸重算（如 Math.sqrt/hypot/pow/**0.5 计算半径/距离/高度）。所有几何度量与空间坐标必须统一消费 src/math 或 src/math3d 返回的结构化结果，确保单一事实源（SSOT）';

const SCENE_LAMBDA_MESSAGE =
  '3D场景组件严禁直接手算 lambda * c 作为动点坐标。必须同源读取 vertices.E.z 或 distanceData.zE，防止定义域边界处图形与标签脱节';

/** 3D 场景手算动点坐标（容忍冗余括号：`lambda * (c)`、`(lambda) * c`） */
const SCENE_RAW_LAMBDA_CALC =
  /\blambda\s*\)*\s*\*\s*\(*\s*c\b|\bc\s*\)*\s*\*\s*\(*\s*lambda\b/;

export const architectureRules = [
  {
    id: 'arch/pure-math-layer',
    group: 'arch',
    type: '数学层纯洁性违规',
    severity: 'error',
    check(ctx) {
      if (!ctx.isMathPureLayer) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/from\s+['"]react['"]/.test(line) || /from\s+['"]react-dom['"]/.test(line) || /\bdocument\./.test(line) || /\bwindow\./.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: 'src/math/ 与 src/math3d/ 必须为纯函数层，严禁导入 React 或直接访问 DOM / window 全局对象',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'arch/no-browser-router',
    group: 'arch',
    type: '全局禁止BrowserRouter',
    severity: 'error',
    check(ctx) {
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/import\s*\{[^}]*BrowserRouter[^}]*\}\s*from\s*['"]react-router-dom['"]/.test(line) || /<BrowserRouter\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '全库禁止使用 BrowserRouter，离线环境与单页路由必须强制使用 HashRouter Only',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'arch/no-scroll-axis-conflict',
    group: 'arch',
    type: '多轴冲突隐式滚动容器',
    severity: 'error',
    check(ctx) {
      if (!ctx.filePath.includes('components/UI') || ctx.isTest) return [];
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/overflow-x-hidden\s+overflow-y-visible/.test(line) || /overflow-y-visible\s+overflow-x-hidden/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '严禁使用 overflow-x-hidden 与 overflow-y-visible 组合，浏览器规范会强制将 visible 降级为 auto 产生嵌套滚动条',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'arch/no-nested-vertical-scroll',
    group: 'arch',
    type: '嵌套垂直滚动容器违规',
    severity: 'error',
    check(ctx) {
      // 仅精准豁免顶层 ThreePanel.tsx 主布局与知识树主页面，以及单测文件
      const fileName = ctx.filePath.replace(/\\/g, '/').split('/').pop() || '';
      if (ctx.isTest || fileName === 'ThreePanel.tsx' || fileName === 'KnowledgeTreeHome.tsx') {
        return [];
      }
      const issues = [];
      ctx.cleanLines.forEach((line, idx) => {
        if (/overflow-y-(?:auto|scroll)\b/.test(line)) {
          issues.push({
            lineNum: idx + 1,
            message: '严禁在子卡片或内部组件中私自设置 overflow-y-auto/scroll 制造嵌套滚动条，所有垂直滚动必须由 ThreePanel 顶层统一接管',
            snippet: line.trim(),
          });
        }
      });
      return issues;
    },
  },
  {
    id: 'arch/no-builder-raw-calc',
    group: 'arch',
    type: 'UI层裸算几何度量违规',
    severity: 'error',
    check(ctx) {
      if (ctx.isTest) return [];
      const isSolidLayer =
        /^src\/data\/builders\/solid.*\.ts$/.test(ctx.relPath) ||
        /^src\/features\/solidGeometry\//.test(ctx.relPath);
      const isBuilder = ctx.isBuilder;
      if (!isSolidLayer && !isBuilder) return [];

      const issues = [];
      const content = ctx.cleanContent;
      const lineStarts = buildLineIndex(ctx.cleanLines);

      const pushIssue = (lineNum, message) => {
        const line = ctx.cleanLines[lineNum - 1] ?? '';
        issues.push({ lineNum, message, snippet: line.trim() });
      };

      if (isSolidLayer) {
        // 空间几何专题：任何「含运行时标识符的开方」都是几何度量裸重算
        collectRawCalcOffsets(content, () => true).forEach((offset) =>
          pushIssue(lineAt(lineStarts, offset), RAW_CALC_MESSAGE),
        );
      } else {
        // 其余 builder：仅当赋值目标命中几何度量词表时拦截
        const precedingSegment = (offset) => {
          const win = content.slice(Math.max(0, offset - 240), offset);
          const cut = win.lastIndexOf(';');
          return cut === -1 ? win : win.slice(cut + 1);
        };
        collectRawCalcOffsets(content, (offset) =>
          GENERAL_METRIC_NAME_RE.test(precedingSegment(offset)),
        ).forEach((offset) =>
          pushIssue(lineAt(lineStarts, offset), RAW_CALC_MESSAGE),
        );
      }

      if (isSolidLayer) {
        const reported = new Set(issues.map((i) => i.lineNum));
        ctx.cleanLines.forEach((line, idx) => {
          if (SCENE_RAW_LAMBDA_CALC.test(line) && !reported.has(idx + 1)) {
            pushIssue(idx + 1, SCENE_LAMBDA_MESSAGE);
          }
        });
      }

      return issues.sort((a, b) => a.lineNum - b.lineNum);
    },
  },
];
