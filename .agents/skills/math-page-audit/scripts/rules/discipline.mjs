/**
 * .agents/skills/math-page-audit/scripts/rules/discipline.mjs
 * 领域规则：高考学科规范与学术符号标准
 */

import fs from 'node:fs';
import path from 'node:path';
import { FileContext } from '../engine/context.mjs';

/**
 * 超纲术语黑名单（2019 人教A版新课标之外的内容）
 * 命中即判为 error；仅当**命中所在条目**（或该条目所属知识树节点）已显式声明为拓展
 * （`isExtension: true` / `importance: "extend"` / `status: 拓展|选学|竞赛`）时，
 * 该条命中才降级为 warning。判定为条目级，详见下方「已声明拓展」的条目级解析。
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
  // 渐近分析族（2026-09-25 补：曾有一页把「以平代曲」写成
  // 「收敛阶 δ = O(1/N²)、二阶收敛」，门禁全绿漏过 —— 这类大学《数值分析》
  // 记号高中生从未学过，高考绝不涉及，只允许在声明 isExtension 的条目里出现）
  '收敛阶',
  '二阶收敛',
  '三阶收敛',
  '渐近记号',
  '渐进记号',
  '大O记号',
  '大 O 记号',
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
  '行列式',
  '混合积',
  '\\det',
  'det[',
  '\\begin{vmatrix}',
  'e_{1x}e_{2y}',
  'e_{1x} e_{2y}',
  'e₁ₓe₂ᵧ',
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

// ─────────────────────────────────────────────────────────────────────────────
// 「已声明拓展」的条目级解析（no-beyond-syllabus-terms 反外溢）
// ─────────────────────────────────────────────────────────────────────────────
// 旧实现把「文件内出现过拓展 / 选学 / 超出课标等字样」当作整个文件的豁免开关，
// 由此产生两个结构性漏洞（见解析几何专项治理报告 §4.1）：
//   ① 局部词外溢：文件里任意一处文案含「拓展 ·」，其余**未标注**的条目一并被豁免；
//   ② 改名即绕过：把超纲术语换成课标词、只在注释里保留原词，字面匹配即静默通过。
// 现收紧为条目级：豁免只认**结构化声明**，且作用域 = 该声明所属的条目 / 知识树节点。
//
// 豁免判定（任一成立即可）：
//   A. 命中行所属的**数据条目对象**（花括号配对得到、且形如 `{ 键: ... }`）在**自身直接属性**上
//      声明了 `isExtension: true` / `importance: "extend"` / `status: "拓展|选学|竞赛"`；
//   B. 该文件所属**知识树节点** importance === "extend"：
//      - `src/features/<f>/**`      → 同目录 `meta.ts` 的节点声明；
//      - `src/data/builders/<b>.ts` → 经 `mathQuantities.ts` 的 animId→builder 映射反查节点；
//      - `src/data/knowledgeTree/*.ts` → 交由 A 覆盖（同文件多节点，文件级豁免必然串味）。
// 自由文本（`超出课标` / `选学` / `拓展 ·` / `（拓展`）**不再**作为任何豁免依据。
//
// 注意 A 的两个限定（缺一即退化为"换层级的外溢豁免"）：
//   ① 必须是**数据条目对象**——函数体 / if 体 / 箭头函数体的花括号不得计入，否则整函数被豁免；
//   ② 判定必须落在对象**自身直接属性**上，不能拿整个子树文本去匹配，否则
//      `return { theorems: [...], warnings: [...] }` 这类外层聚合对象会因内部某一条目标了拓展
//      而把全文件所有超纲命中一并降级（见 ownDeclaresExtend / topLevelProps）。
const EXT_DECL_PATTERN =
  /isExtension:\s*true|importance:\s*["']extend["']|status:\s*["'](?:拓展|选学|竞赛)["']/;

/** 数据条目对象的头部特征：花括号后第一个内容就是 `键:`，而非语句（函数体 / if 体 / 箭头函数体） */
const ITEM_SHAPE_PATTERN = /^\s*[A-Za-z_$][\w$]*\s*:/;

/**
 * 把字符串字面量内容整体替换为空格（保留引号与换行结构），
 * 使花括号配对不被字符串内部的 `{` `}` 干扰。注释已由 FileContext 预先清除。
 */
function maskStringLiterals(lines) {
  const out = [];
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let escaped = false;
  for (const line of lines) {
    let masked = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (escaped) {
        masked += ' ';
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        masked += ' ';
        escaped = true;
        continue;
      }
      if (inSingle) {
        if (ch === "'") {
          inSingle = false;
          masked += "'";
        } else masked += ' ';
        continue;
      }
      if (inDouble) {
        if (ch === '"') {
          inDouble = false;
          masked += '"';
        } else masked += ' ';
        continue;
      }
      if (inBacktick) {
        if (ch === '`') {
          inBacktick = false;
          masked += '`';
        } else masked += ' ';
        continue;
      }
      if (ch === "'") {
        inSingle = true;
        masked += "'";
        continue;
      }
      if (ch === '"') {
        inDouble = true;
        masked += '"';
        continue;
      }
      if (ch === '`') {
        inBacktick = true;
        masked += '`';
        continue;
      }
      masked += ch;
    }
    out.push(masked);
  }
  return out;
}

/**
 * 对掩码后的代码做一次花括号配对，得到
 *  - `openAtLineStart[i]`：第 i 行**行首**仍然打开的对象区间（由外向内）
 *  - `openedOnLine[i]`   ：在第 i 行**内部**打开的对象区间（用于单行对象字面量）
 * 区间为引用对象 `{ start, col, end }`，`col` 为该 `{` 在本行中的列号，`end` 在配对闭合时回填。
 */
function buildObjectIndex(maskedLines) {
  const openAtLineStart = new Array(maskedLines.length);
  const openedOnLine = new Array(maskedLines.length);
  for (let i = 0; i < maskedLines.length; i++) openedOnLine[i] = [];
  const stack = [];
  for (let i = 0; i < maskedLines.length; i++) {
    openAtLineStart[i] = stack.slice();
    const line = maskedLines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '{') {
        const range = { start: i, col: j, end: maskedLines.length - 1 };
        stack.push(range);
        openedOnLine[i].push(range);
      } else if (ch === '}') {
        const range = stack.pop();
        if (range) range.end = i;
      }
    }
  }
  return { openAtLineStart, openedOnLine };
}

/**
 * 取命中行所属的「数据条目对象」链（由内向外的顺序），已剔除函数体 / 语句块等非条目花括号。
 *
 * 花括号常常出现在行中间（如 `theorems.push({`），因此条目头的判定必须从该 `{` 的
 * **列号之后**开始取文本，而不能拿整行文本去匹配。
 */
function enclosingItems(cleanLines, maskedLines, objectIndex, lineIdx) {
  const chain = objectIndex.openAtLineStart[lineIdx].concat(
    objectIndex.openedOnLine[lineIdx],
  );
  const items = [];
  for (let k = chain.length - 1; k >= 0; k--) {
    const range = chain[k];
    const bodyText =
      maskedLines[range.start].slice(range.col + 1) +
      '\n' +
      maskedLines.slice(range.start + 1, range.end + 1).join('\n');
    // 函数体 / if 体 / 箭头函数体虽然也是 {}，但内容以语句开头，不是数据条目；
    // 若不排除，整个函数体文本里任意一处 importance:"extend" 都会把全函数豁免掉（旧漏洞的翻版）。
    if (!ITEM_SHAPE_PATTERN.test(bodyText)) continue;
    items.push({
      range,
      text: cleanLines.slice(range.start, range.end + 1).join('\n'),
    });
  }
  return items;
}

/**
 * 取对象「自身直接属性」的文本片段（不含嵌套对象 / 数组 / 调用实参内部的内容）。
 *
 * 为什么必须做这一层切分：
 *   `enclosingItems` 给出的 `item.text` 是**整个子树**的文本。若直接拿它匹配
 *   `isExtension: true`，则「外层聚合对象」会因**内部任意一个条目**标了拓展而整体被豁免——
 *   这是"局部含拓展字样导致整页检测失效"的换层级翻版。典型泄漏点：
 *   builders 的 `return { theorems: [...], warnings: [...] }`，其首个键同样呈 `键:` 形态，
 *   会被 ITEM_SHAPE 误判为数据条目，从而把该文件里所有超纲命中一律降级为 warning。
 *
 * 实现：结构定位用掩码行（字符串内容已抹白，括号配对可靠），文本切片用原始行
 *   （保证 "extend" / "拓展" 这类**字符串值**在判定时可见）。深度以当前对象为基准，
 *   因此只在该对象自身直接属性的逗号处切分。
 */
function topLevelProps(cleanLines, maskedLines, range) {
  const props = [];
  let depth = 0;
  let buf = [];
  for (let i = range.start; i <= range.end; i++) {
    const mLine = maskedLines[i] || '';
    const cLine = cleanLines[i] || '';
    for (let j = i === range.start ? range.col + 1 : 0; j < mLine.length; j++) {
      const ch = mLine[j];
      if (ch === '{' || ch === '[' || ch === '(') {
        depth++;
        continue;
      }
      if (ch === '}' || ch === ']' || ch === ')') {
        if (depth === 0) {
          // 当前对象自身的闭合括号
          props.push(buf.join(''));
          return props;
        }
        depth--;
        continue;
      }
      // 嵌套对象 / 数组 / 实参的内容一律丢弃：豁免判定只看自身直接属性
      if (depth > 0) continue;
      if (ch === ',') {
        props.push(buf.join(''));
        buf = [];
        continue;
      }
      buf.push(cLine[j]);
    }
    buf.push('\n');
  }
  props.push(buf.join(''));
  return props;
}

/**
 * 条目级豁免的唯一结构化依据：该对象是否在**自身直接属性**上声明了拓展。
 * 这是"文件级豁免 → 条目级"升级的判定核心，禁止回退为子树全文匹配。
 */
function ownDeclaresExtend(cleanLines, maskedLines, range) {
  return topLevelProps(cleanLines, maskedLines, range).some((prop) =>
    EXT_DECL_PATTERN.test(prop),
  );
}

let __nodeGraphCache = null;

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * 收集「动画 id → 知识树节点 importance」。
 * 知识树节点（`src/data/knowledgeTree/*.ts`）与各 feature 的 `meta.ts` 都同时声明了
 * `animationIds: [...]` 与 `importance: "..."`，因此按「animationIds 所属条目对象」取值即可。
 * 同一 id 被多个节点引用时，只要有一个标为 extend 就以 extend 为准（从严）。
 */
function collectAnimImportance(filePath, workspaceRoot, animImportance) {
  const content = readFileSafe(filePath);
  if (content === null) return;
  const ctx = new FileContext(filePath, content, workspaceRoot);
  const masked = maskStringLiterals(ctx.cleanLines);
  const objectIndex = buildObjectIndex(masked);

  ctx.cleanLines.forEach((line, idx) => {
    const match = line.match(/animationIds\s*:\s*\[([^\]]*)\]/);
    if (!match) return;
    const ids = (match[1].match(/["']([^"']+)["']/g) || []).map((s) =>
      s.slice(1, -1),
    );
    if (ids.length === 0) return;
    const owner = enclosingItems(ctx.cleanLines, masked, objectIndex, idx)[0];
    if (!owner) return;
    let importance = null;
    for (const prop of topLevelProps(ctx.cleanLines, masked, owner.range)) {
      const propMatch = prop.match(/importance\s*:\s*["']([^"']+)["']/);
      if (propMatch) {
        importance = propMatch[1];
        break;
      }
    }
    for (const id of ids) {
      if (importance === 'extend' || !animImportance.has(id)) {
        animImportance.set(id, importance);
      }
    }
  });
}

/**
 * 从 `src/data/mathQuantities.ts` 的 `switch (animId)` 中解析「builder 模块名 → 动画 id 列表」。
 * 这是 builder 文件与其所属知识树节点之间**唯一**的映射桥梁（builder 不被 feature 直接 import）。
 */
function collectBuilderAnimIds(workspaceRoot, builderAnimIds) {
  const content = readFileSafe(
    path.join(workspaceRoot, 'src/data/mathQuantities.ts'),
  );
  if (!content) return;
  const switchStart = content.indexOf('switch (animId)');
  if (switchStart < 0) return;
  const chunks = content
    .slice(switchStart)
    .split(/case\s+"([^"]+)"\s*:|default\s*:/);

  let pending = [];
  for (let i = 1; i < chunks.length; i += 2) {
    const animId = chunks[i];
    const body = chunks[i + 1] || '';
    if (animId) pending.push(animId);
    const returnMatch = body.match(/return\s+build(\w+)\s*\(/);
    if (!returnMatch || pending.length === 0) continue;
    const moduleName =
      returnMatch[1].replace(/^build/, '').replace(/Panel$/, '');
    const key = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
    const list = builderAnimIds.get(key) || [];
    for (const id of pending) if (!list.includes(id)) list.push(id);
    builderAnimIds.set(key, list);
    pending = [];
  }
}

function loadNodeGraph(workspaceRoot) {
  if (__nodeGraphCache && __nodeGraphCache.root === workspaceRoot) {
    return __nodeGraphCache;
  }
  const graph = {
    root: workspaceRoot,
    animImportance: new Map(),
    builderAnimIds: new Map(),
    featureExtend: new Map(),
  };

  // ① 知识树节点文件
  const knowledgeTreeDir = path.join(workspaceRoot, 'src/data/knowledgeTree');
  let entries = [];
  try {
    entries = fs.readdirSync(knowledgeTreeDir);
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.endsWith('.ts') || entry.includes('test')) continue;
    collectAnimImportance(
      path.join(knowledgeTreeDir, entry),
      workspaceRoot,
      graph.animImportance,
    );
  }

  // ② 各 feature 的 meta.ts（同时建立 feature 目录 → 是否 extend 的映射）
  const featuresDir = path.join(workspaceRoot, 'src/features');
  let featureDirs = [];
  try {
    featureDirs = fs.readdirSync(featuresDir);
  } catch {
    featureDirs = [];
  }
  for (const dir of featureDirs) {
    const metaPath = path.join(featuresDir, dir, 'meta.ts');
    const content = readFileSafe(metaPath);
    if (content === null) continue;
    collectAnimImportance(metaPath, workspaceRoot, graph.animImportance);
    graph.featureExtend.set(
      dir,
      /importance:\s*["']extend["']/.test(content),
    );
  }

  // ③ builder 模块 → 动画 id
  collectBuilderAnimIds(workspaceRoot, graph.builderAnimIds);

  __nodeGraphCache = graph;
  return graph;
}

/**
 * 判定 ctx 所描述的文件「所属节点」是否已声明为拓展（豁免判定链 B）。
 * 注意：`src/data/knowledgeTree/*.ts` 单文件含多节点，不能用文件级豁免，故直接返回 false。
 */
function resolveOwnerNodeExtend(ctx) {
  const rel = ctx.relPath;
  if (!rel) return false;
  const graph = loadNodeGraph(ctx.workspaceRoot);

  // ① src/features/<feature>/** → 同目录 meta.ts 的节点声明
  const featureMatch = rel.match(/^src\/features\/([^/]+)\//);
  if (featureMatch) {
    return graph.featureExtend.get(featureMatch[1]) === true;
  }

  // ② src/data/builders/<builder>.ts → animId 映射反查节点
  const builderMatch = rel.match(/^src\/data\/builders\/([^/]+)\.ts$/);
  if (builderMatch) {
    const animIds = graph.builderAnimIds.get(builderMatch[1]);
    if (!animIds) return false;
    return animIds.some((id) => graph.animImportance.get(id) === 'extend');
  }

  return false;
}

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
        /^src\/features\//.test(ctx.relPath) ||
        /^src\/math\//.test(ctx.relPath) ||
        /^src\/math3d\//.test(ctx.relPath);
      if (!isContentFile) return [];

      // 条目级豁免解析（见文件头「已声明拓展」的条目级解析说明）
      const maskedLines = maskStringLiterals(ctx.cleanLines);
      const objectIndex = buildObjectIndex(maskedLines);
      const ownerNodeIsExtend = resolveOwnerNodeExtend(ctx);
      const itemDeclaresExtend = (lineIdx) =>
        enclosingItems(
          ctx.cleanLines,
          maskedLines,
          objectIndex,
          lineIdx,
        ).some((item) =>
          ownDeclaresExtend(ctx.cleanLines, maskedLines, item.range),
        );

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

          const declaredExtend = itemDeclaresExtend(idx) || ownerNodeIsExtend;
          issues.push({
            lineNum: idx + 1,
            type: '超纲术语',
            severity: declaredExtend ? 'warning' : 'error',
            message: `检测到超出 2019 人教A版新课标的术语「${hit}」。若确为拓展/强基/竞赛内容，请在该**条目**上标注 isExtension: true（右屏定理/警示）或让条目所属知识树节点声明 importance: "extend"；否则请改用课标内表述。（条目级判定：不再接受"文件里出现过拓展字样"这类文件级豁免）`,
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
