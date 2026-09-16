/**
 * LaTeX 排版工具（KatexFormula / MathPanel 共用）。
 * 单独成文件以符合 react-refresh 仅导出组件的约束。
 */

/**
 * LaTeX 定界符深度追踪状态
 */
export interface LatexDepthState {
  brace: number; // { } [ ]
  paren: number; // ( )
  angle: number; // \langle \rangle
  env: number; // \begin{...} \end{...}
  leftRight: number; // \left \right
}

export function createDepthState(): LatexDepthState {
  return { brace: 0, paren: 0, angle: 0, env: 0, leftRight: 0 };
}

export function isTopLevel(state: LatexDepthState): boolean {
  return (
    state.brace === 0 &&
    state.paren === 0 &&
    state.angle === 0 &&
    state.env === 0 &&
    state.leftRight === 0
  );
}

/**
 * 前向扫描一个字符或命令，更新嵌套深度
 * @returns 消耗的字符数步长
 */
export function advanceLatexDepth(
  latex: string,
  index: number,
  state: LatexDepthState,
): number {
  const ch = latex[index];
  if (ch === "{" || ch === "[") {
    state.brace++;
    return 1;
  }
  if (ch === "}" || ch === "]") {
    state.brace = Math.max(0, state.brace - 1);
    return 1;
  }
  if (ch === "(") {
    state.paren++;
    return 1;
  }
  if (ch === ")") {
    state.paren = Math.max(0, state.paren - 1);
    return 1;
  }
  if (ch === "\\") {
    const sub = latex.slice(index);
    if (sub.startsWith("\\langle")) {
      state.angle++;
      return 7;
    }
    if (sub.startsWith("\\rangle")) {
      state.angle = Math.max(0, state.angle - 1);
      return 7;
    }
    if (sub.startsWith("\\begin{")) {
      const endBrace = sub.indexOf("}");
      if (endBrace !== -1) {
        state.env++;
        return endBrace + 1;
      }
      state.env++;
      return 7;
    }
    if (sub.startsWith("\\end{")) {
      const endBrace = sub.indexOf("}");
      if (endBrace !== -1) {
        state.env = Math.max(0, state.env - 1);
        return endBrace + 1;
      }
      state.env = Math.max(0, state.env - 1);
      return 5;
    }
    if (sub.startsWith("\\left")) {
      state.leftRight++;
      return 5;
    }
    if (sub.startsWith("\\right")) {
      state.leftRight = Math.max(0, state.leftRight - 1);
      return 6;
    }
  }
  return 1;
}

/**
 * 计算 LaTeX 片段的有效可见字符长度（去除指令名、颜色标记、定界符与空白）。
 * 用于断行时的平衡度度量与短左端保护判定。
 */
export function getEffectiveLatexLength(latex: string): number {
  if (!latex) return 0;
  let s = latex.replace(/\\color\{[^}]+\}/g, "");
  s = s.replace(/\\text\{([^}]+)\}/g, "$1");
  s = s.replace(/\\[a-zA-Z]+/g, "x");
  s = s.replace(/[{}[\]()^_\s\\,;!]/g, "");
  return s.length;
}

/**
 * 寻找公式中所有顶层等号的位置。
 * 排除 <= >= != \neq 等复合符号中的 = 以避免误断。
 */
export function findTopLevelEqualsIndices(latex: string): number[] {
  const indices: number[] = [];
  const state = createDepthState();
  let i = 0;
  while (i < latex.length) {
    if (latex[i] === "=" && isTopLevel(state)) {
      // 排除 <=, >=, !=, \leq=, \geq= 等复合符号中的 =
      const prev = i > 0 ? latex[i - 1] : "";
      if (!"<>!".includes(prev)) {
        indices.push(i);
      }
      i++;
      continue;
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }
  return indices;
}

/**
 * 教材推导换行：在最合适的顶层等号处把长等式拆为两段
 * （左端一段，右端以「=」起头，与高中教材/高考答题卡书写习惯一致）。
 *
 * 核心规则（符合高中数学人类习惯）：
 * 1. 若为单等号式且左端仅为简单单变量（如 S = ..., y = ..., e = ...，有效字符 <= 3）：
 *    严禁在等号处截断！因为右端依然占据全宽，截断无法降低行宽且破坏视觉整体感，返回 null。
 * 2. 若两端均有实质结构（左端 >= 4 字符，如 \cos\langle\vec{n_1},\vec{n_2}\rangle = ...），允许断开。
 * 3. 若为连等式（A = B = C），选择使两行字符数最均衡的等号处断开。
 */
export function splitAtTopLevelEquals(latex: string): [string, string] | null {
  const equalsIndices = findTopLevelEqualsIndices(latex);
  if (equalsIndices.length === 0) return null;

  // 单等号场景：执行短左端保护
  if (equalsIndices.length === 1) {
    const idx = equalsIndices[0];
    const left = latex.slice(0, idx).trim();
    const right = latex.slice(idx).trim();
    if (!left || right.length <= 1) return null;

    const leftLen = getEffectiveLatexLength(left);
    const rightLen = getEffectiveLatexLength(right);

    // 短左端保护：有效字符 <= 3 拒绝断行
    if (leftLen <= 3) {
      return null;
    }

    // 两端均有实质内容时允许断开
    if (leftLen >= 4 && rightLen >= 4) {
      return [left, right];
    }
    return null;
  }

  // 连等式（>= 2 个等号）：选使两段最均衡的断点
  const mid = latex.length / 2;
  let chosenIdx = equalsIndices[0];
  let minDist = Math.abs(equalsIndices[0] - mid);
  for (const idx of equalsIndices) {
    const dist = Math.abs(idx - mid);
    if (dist < minDist) {
      minDist = dist;
      chosenIdx = idx;
    }
  }

  const left = latex.slice(0, chosenIdx).trim();
  const right = latex.slice(chosenIdx).trim(); // 含开头的 =
  if (left && right.length > 1) return [left, right];
  return null;
}

/**
 * 教材续行换行：在最均衡的顶层二元运算符处把长式拆为两段，
 * 续行以运算符起头（教材多项式展开的标准排法）。
 * 支持 +, -, \cdot, \times, \pm, \mp。
 */
export function splitAtTopLevelBinary(latex: string): [string, string] | null {
  const cmdOps = ["\\cdot", "\\times", "\\pm", "\\mp", "\\oplus", "\\otimes"];
  interface BinaryCandidate {
    charIdx: number;
    opLen: number;
  }
  const candidates: BinaryCandidate[] = [];
  const state = createDepthState();
  let i = 0;

  while (i < latex.length) {
    const ch = latex[i];
    if (isTopLevel(state)) {
      if (ch === "+" || ch === "-") {
        // 跳过一元正负号：前一个非空字符是 = + - ( , < > : ≤ ≥ 或位于串首
        let p = i - 1;
        while (p >= 0 && latex[p] === " ") p--;
        if (p < 0 || "=+-,(<>:≤≥".includes(latex[p])) {
          // 一元号，跳过
        } else {
          candidates.push({ charIdx: i, opLen: 1 });
        }
      } else if (ch === "\\") {
        const sub = latex.slice(i);
        for (const op of cmdOps) {
          if (sub.startsWith(op)) {
            const nextCh = sub[op.length];
            if (!nextCh || !/[a-zA-Z]/.test(nextCh)) {
              candidates.push({ charIdx: i, opLen: op.length });
              i += op.length;
              break;
            }
          }
        }
      }
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }

  if (candidates.length === 0) return null;

  // 选使左右字符数最均衡的断点
  const mid = latex.length / 2;
  let chosen = candidates[0];
  let minDist = Math.abs(candidates[0].charIdx - mid);
  for (const c of candidates) {
    const dist = Math.abs(c.charIdx - mid);
    if (dist < minDist) {
      minDist = dist;
      chosen = c;
    }
  }

  const left = latex.slice(0, chosen.charIdx).trim();
  const right = latex.slice(chosen.charIdx).trim(); // 含开头的运算符
  if (left && right.length > 1) return [left, right];
  return null;
}

/**
 * 语义间距换行：在顶层 \quad/\qquad/\; 间距命令处断开。
 * 高中教材中这类命令往往标志着「条件与结论」或「前提与推论」的分界，
 * 是最自然的换行位置，优先级高于 +/-，低于等号/推导符。
 * 选使两段长度最均衡的断点。
 * 注意：剔除微小细间距 \,（避免在积分微元或紧凑乘法处误断）。
 */
export function splitAtTopLevelSpacing(latex: string): [string, string] | null {
  const spacingOps = ["\\qquad", "\\quad", "\\;"];
  interface SpacingCandidate {
    idx: number;
    opLen: number;
  }
  const candidates: SpacingCandidate[] = [];
  const state = createDepthState();
  let i = 0;

  while (i < latex.length) {
    if (isTopLevel(state) && latex[i] === "\\") {
      const sub = latex.slice(i);
      for (const op of spacingOps) {
        if (sub.startsWith(op)) {
          const nextCh = sub[op.length];
          if (!nextCh || !/[a-zA-Z]/.test(nextCh)) {
            candidates.push({ idx: i, opLen: op.length });
            i += op.length;
            break;
          }
        }
      }
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }

  if (candidates.length === 0) return null;

  // 选最均衡断点
  const mid = latex.length / 2;
  let chosen = candidates[0];
  let minDist = Math.abs(candidates[0].idx - mid);
  for (const c of candidates) {
    const dist = Math.abs(c.idx - mid);
    if (dist < minDist) {
      minDist = dist;
      chosen = c;
    }
  }

  // 左段去掉末尾间距命令，右段从间距命令后的内容开始
  let left = latex.slice(0, chosen.idx).trim();
  left = left.replace(/(\s|\\;|\\!|\\quad|\\qquad)+$/, "").trim();
  const right = latex.slice(chosen.idx + chosen.opLen).trim();
  if (left && right) return [left, right];
  return null;
}

/**
 * 寻找公式中顶层 \xrightarrow{...} 变换箭头的位置与完整长度（包括 [下标] 与 {上标} 参数）。
 */
export function findTopLevelArrows(
  latex: string,
): { index: number; length: number }[] {
  const matches: { index: number; length: number }[] = [];
  const state = createDepthState();
  let i = 0;

  while (i < latex.length) {
    if (isTopLevel(state) && latex[i] === "\\") {
      const sub = latex.slice(i);
      if (sub.startsWith("\\xrightarrow")) {
        let p = "\\xrightarrow".length;
        // 匹配可选的下标 [...]
        if (p < sub.length && sub[p] === "[") {
          let b = 1;
          p++;
          while (p < sub.length && b > 0) {
            if (sub[p] === "[") b++;
            else if (sub[p] === "]") b--;
            p++;
          }
        }
        // 匹配必选的上标 {...}
        if (p < sub.length && sub[p] === "{") {
          let b = 1;
          p++;
          while (p < sub.length && b > 0) {
            if (sub[p] === "{") b++;
            else if (sub[p] === "}") b--;
            p++;
          }
        }
        matches.push({ index: i, length: p });
        i += p;
        continue;
      }
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }
  return matches;
}

/**
 * 教材变换推导折行：在最靠近中点的顶层 \xrightarrow 处把长变换链条拆为两段。
 * 续行以 \xrightarrow 起头，符合高中教材板书推导习惯。
 */
export function splitAtTopLevelArrow(latex: string): [string, string] | null {
  const arrows = findTopLevelArrows(latex);
  if (arrows.length === 0) return null;

  // 选最靠近中点的箭头断点
  const mid = latex.length / 2;
  let chosen = arrows[0];
  let minDist = Math.abs(arrows[0].index - mid);
  for (const a of arrows) {
    const dist = Math.abs(a.index - mid);
    if (dist < minDist) {
      minDist = dist;
      chosen = a;
    }
  }

  let left = latex.slice(0, chosen.index).trim();
  left = left.replace(/(\s|\\;|\\,|\\!|\\quad|\\qquad)+$/, "").trim();
  const right = latex.slice(chosen.index).trim();

  if (left && right.length > chosen.length) {
    return [left, right];
  }
  return null;
}

/**
 * 寻找公式中顶层逻辑推导符（\Rightarrow, \implies, \iff, \Leftrightarrow 等）的位置与长度。
 * 注意：剔除 \to（\to 在高中数学用于极限或极值趋向，非命题逻辑推导）。
 */
export function findTopLevelImplies(
  latex: string,
): { index: number; length: number; op: string }[] {
  const matches: { index: number; length: number; op: string }[] = [];
  const state = createDepthState();
  let i = 0;
  const impliesOps = [
    "\\longleftrightarrow",
    "\\Leftrightarrow",
    "\\Rightarrow",
    "\\implies",
    "\\iff",
  ];

  while (i < latex.length) {
    if (isTopLevel(state) && latex[i] === "\\") {
      const sub = latex.slice(i);
      for (const op of impliesOps) {
        if (sub.startsWith(op)) {
          const nextChar = sub[op.length];
          if (!nextChar || !/[a-zA-Z]/.test(nextChar)) {
            matches.push({ index: i, length: op.length, op });
            i += op.length;
            break;
          }
        }
      }
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }
  return matches;
}

/**
 * 教材推导折行：在顶层推出符号（\Rightarrow, \implies 等）处拆分长推导式
 * 例如：PA \perp \text{平面 } ABCD, \; PA \subset \text{平面 } PAD \;\Rightarrow\; \text{平面 } PAD \perp \text{平面 } ABCD
 * 拆为：
 *   行 1: PA \perp \text{平面 } ABCD, \; PA \subset \text{平面 } PAD
 *   行 2: \Rightarrow\; \text{平面 } PAD \perp \text{平面 } ABCD
 *
 * 针对大括号方程组加结论（\begin{cases} ... \end{cases} \;\Rightarrow\; 结论）：
 * 也将在 cases 外部的 \Rightarrow 处拆分为上下两段！
 */
export function splitAtTopLevelImplies(latex: string): [string, string] | null {
  const impliesList = findTopLevelImplies(latex);
  if (impliesList.length === 0) return null;

  // 取最合适断开的推导符（通常为最后一个主推导符）
  const chosen = impliesList[impliesList.length - 1];
  let left = latex.slice(0, chosen.index).trim();
  // 清理左侧末尾残留的 LaTeX 间距命令（如 \;, \quad 等）
  left = left.replace(/(\s|\\;|\\,|\\!|\\quad|\\qquad)+$/, "").trim();

  let right = latex.slice(chosen.index).trim(); // 含开头的 \Rightarrow
  if (left && right.length > chosen.length) {
    return [left, right];
  }
  return null;
}

/**
 * 顶层标点折行：在最靠近中点的顶层逗号或分号处断开复合条件。
 * 作为等号/推导符/间距命令/二元运算符均无法断开时的最终兜底。
 */
export function splitAtTopLevelPunctuation(
  latex: string,
): [string, string] | null {
  const candidates: number[] = [];
  const state = createDepthState();
  let i = 0;
  while (i < latex.length) {
    if (isTopLevel(state) && (latex[i] === "," || latex[i] === ";")) {
      // 反斜杠前缀判定：\, \; \! 等是 LaTeX 间距命令，
      // 其末尾的 , / ; 属于命令名的一部分，绝不可作为断点，
      // 否则左行将以孤立反斜杠结尾，产生非法 LaTeX（KaTeX 渲染为错误文本）。
      if (latex[i - 1] !== "\\") {
        candidates.push(i);
      }
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }
  if (candidates.length === 0) return null;

  // 选最靠近中点的逗号/分号，使两段长度均衡
  const mid = latex.length / 2;
  let chosenIdx = candidates[0];
  let minDist = Math.abs(candidates[0] - mid);
  for (const idx of candidates) {
    const dist = Math.abs(idx - mid);
    if (dist < minDist) {
      minDist = dist;
      chosenIdx = idx;
    }
  }

  // 断点标点保留在左行行尾（教材习惯：逗号/分号留在上一行），
  // 先前 slice(0, chosenIdx) 会把标点直接删除，属于内容级改写。
  const left = latex.slice(0, chosenIdx + 1).trim();
  let right = latex.slice(chosenIdx + 1).trim();
  // 清理右行行首残留的 LaTeX 间距命令（如 \; \quad），避免续行无故缩进
  right = right.replace(/^(?:\s|\\;|\\,|\\!|\\quad|\\qquad)+/, "").trim();
  if (left && right) return [left, right];
  return null;
}

/**
 * 引擎级通用分式行距平衡与满尺寸升级：
 * 在多行数学环境（cases, matrix, aligned, array 等）内部，
 * 若某一行包含 \frac 或 \dfrac，且其换行符未显式指定额外间距（仅为普通 \\），
 * 自动注入 0.65em 的行距补偿，彻底消除分式分母下沉导致的上下行挤压。
 * 同时将普通 \frac 自动提升为满尺寸 \dfrac。
 */
export function normalizeFractionRowSpacing(
  latex: string,
  /**
   * 是否对「普通单行公式」执行 \frac → \dfrac 满尺寸升级。
   * 多行数学环境（cases/aligned/array 等）不受此开关影响，始终升级并平衡行距。
   *
   * 背景：行内公式（正文中的 $…$）按排版规范应保持 textstyle，
   * 强制升为 \dfrac 会抬高行高、造成正文行距忽大忽小，
   * 因此由调用方按「块级/多行排版」显式声明，而非全局静默改写。
   */
  displayFraction = false,
): string {
  if (!latex) return "";

  // 1. 如果包含多行环境
  if (
    /\\begin\{(cases|aligned|matrix|pmatrix|bmatrix|vmatrix|array|gather|split)\}/.test(
      latex,
    )
  ) {
    return latex.replace(
      /(\\begin\{(?:cases|aligned|matrix|pmatrix|bmatrix|vmatrix|array|gather|split)\})([\s\S]*?)(\\end\{(?:cases|aligned|matrix|pmatrix|bmatrix|vmatrix|array|gather|split)\})/g,
      (_match, beginTag, body, endTag) => {
        const lines = body.split(/\\\\(?![ \t]*\[)/);
        const processedLines = lines.map((line: string, idx: number) => {
          const upgraded = line.replace(/\\frac(?=\{)/g, "\\dfrac");
          if (idx < lines.length - 1) {
            if (/\\dfrac(?=\{)/.test(upgraded)) {
              return upgraded + "\\\\[0.65em]";
            } else {
              return upgraded + "\\\\[0.2em]";
            }
          }
          return upgraded;
        });
        return `${beginTag}${processedLines.join("")}${endTag}`;
      },
    );
  }

  // 2. 普通单行公式：仅在块级/多行排版下将 \frac 升级为 \dfrac
  return displayFraction ? latex.replace(/\\frac(?=\{)/g, "\\dfrac") : latex;
}

/**
 * 教材续行对齐：取首行中「首个顶层关系符 / 推导符 / 变换箭头」之前的片段，
 * 作为续行悬挂对齐的基准宽度来源（渲染时以 \phantom 占位）。
 * 返回 null 表示首行不存在顶层对齐点，或前缀不适合作占位（含环境、过长）。
 */
export function getAlignmentPrefix(line: string): string | null {
  if (!line) return null;
  const indices: number[] = [];
  const eq = findTopLevelEqualsIndices(line);
  if (eq.length > 0) indices.push(eq[0]);
  const im = findTopLevelImplies(line);
  if (im.length > 0) indices.push(im[0].index);
  const ar = findTopLevelArrows(line);
  if (ar.length > 0) indices.push(ar[0].index);
  if (indices.length === 0) return null;

  const idx = Math.min(...indices);
  const prefix = line.slice(0, idx).trim();
  if (!prefix) return null;
  // \phantom 不允许承载环境体，且过长前缀会挤占行宽，二者均退回左对齐
  if (prefix.includes("\\begin{")) return null;
  if (getEffectiveLatexLength(prefix) > 12) return null;
  return prefix;
}

/**
 * 判断某一行是否以「关系符 / 二元运算符 / 变换箭头」起头——
 * 这正是教材推导续行的标准形态，也是需要悬挂对齐的行。
 */
export function startsWithRelation(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  return /^(=|\\leq|\\geq|\\neq|\\le\b|\\ge\b|\\ne\b|\\approx|\\equiv|\\cong|\\Rightarrow|\\Leftrightarrow|\\iff|\\implies|\\xrightarrow|\\pm|\\mp|\\cdot|\\times|\\div|\\cap|\\cup|\\subset|\\subseteq|<|>|\+|-)/.test(
    s,
  );
}

/**
 * 全局最优公式拆行裁决算法：
 * 综合推导符、语义间距、等号平衡度、多项式二元运算与标点，
 * 避免单一优先级的短路陷阱（如等号右端超长而左端极短时，应在等号右端的二元运算符处换行），
 * 确保拆分后的各行长度最均衡，行宽降幅最大，避免暴跌为不可读的微小字号。
 */
export function findOptimalSplit(latex: string): [string, string] | null {
  const origLen = getEffectiveLatexLength(latex);
  if (origLen <= 8) return null;

  // 1. 优先变换箭头 \xrightarrow 与推导符 \Rightarrow / \iff
  const arrowSplit = splitAtTopLevelArrow(latex);
  if (arrowSplit) {
    const maxLen = Math.max(
      getEffectiveLatexLength(arrowSplit[0]),
      getEffectiveLatexLength(arrowSplit[1]),
    );
    if (maxLen <= origLen * 0.85) return arrowSplit;
  }

  const impliesSplit = splitAtTopLevelImplies(latex);
  if (impliesSplit) {
    const maxLen = Math.max(
      getEffectiveLatexLength(impliesSplit[0]),
      getEffectiveLatexLength(impliesSplit[1]),
    );
    if (maxLen <= origLen * 0.85) return impliesSplit;
  }

  // 2. 语义间距 \quad / \qquad / \;
  const spacingSplit = splitAtTopLevelSpacing(latex);
  if (spacingSplit) {
    const maxLen = Math.max(
      getEffectiveLatexLength(spacingSplit[0]),
      getEffectiveLatexLength(spacingSplit[1]),
    );
    if (maxLen <= origLen * 0.85) return spacingSplit;
  }

  // 3. 等号与二元运算符协同评估
  const eqSplit = splitAtTopLevelEquals(latex);
  const binSplit = splitAtTopLevelBinary(latex);

  if (eqSplit && binSplit) {
    const eqMax = Math.max(
      getEffectiveLatexLength(eqSplit[0]),
      getEffectiveLatexLength(eqSplit[1]),
    );
    const binMax = Math.max(
      getEffectiveLatexLength(binSplit[0]),
      getEffectiveLatexLength(binSplit[1]),
    );

    // 如果等号拆分导致某一侧依然占据 75% 以上的长度（短左端+长右端），
    // 且二元运算符拆分显著更均衡（降宽幅度比等号好 20% 以上），优先采用二元运算符拆分
    if (eqMax > origLen * 0.75 && binMax < eqMax * 0.8) {
      return binSplit;
    }

    if (eqMax <= origLen * 0.85) {
      return eqSplit;
    }
    if (binMax <= origLen * 0.85) {
      return binSplit;
    }
  } else if (eqSplit) {
    const eqMax = Math.max(
      getEffectiveLatexLength(eqSplit[0]),
      getEffectiveLatexLength(eqSplit[1]),
    );
    if (eqMax <= origLen * 0.85) return eqSplit;
  } else if (binSplit) {
    const binMax = Math.max(
      getEffectiveLatexLength(binSplit[0]),
      getEffectiveLatexLength(binSplit[1]),
    );
    if (binMax <= origLen * 0.88) return binSplit;
  }

  // 4. 标点符号（逗号/分号）
  const puncSplit = splitAtTopLevelPunctuation(latex);
  if (puncSplit) {
    const maxLen = Math.max(
      getEffectiveLatexLength(puncSplit[0]),
      getEffectiveLatexLength(puncSplit[1]),
    );
    if (maxLen <= origLen * 0.85) return puncSplit;
  }

  // 5. 兜底放宽：只要公式超宽，存在推导符、箭头、语义间距、二元运算符、等号或标点时均执行拆分，坚决杜绝超出容器
  if (arrowSplit) return arrowSplit;
  if (impliesSplit) return impliesSplit;
  if (spacingSplit) return spacingSplit;
  if (binSplit) return binSplit;
  if (eqSplit) return eqSplit;
  if (puncSplit) return puncSplit;

  return null;
}

/**
 * 深度感知地把公式在**顶层** \\ 处切分为多个可独立排版的片段。
 *
 * 三条不变量（缺一即导致独立成行后 KaTeX 编译失败、界面出现红色错误源码）：
 * 1. 只在顶层的 \\ 处切分。`aligned`/`gathered`/`cases` 等环境内部的 \\ 是该环境自身的
 *    行分隔，必须留在环境体内——否则环境会被拦腰截断成两个半截，KaTeX 直接报错。
 * 2. \\ 之后若跟可选高度参数 [..]，一并丢弃——切出的片段由外层以独立行渲染，
 *    行距由外层 flex gap 统一控制，残留的行距参数在环境外属非法语法。
 * 3. 切出的片段内**顶层** & 必须剥离（环境体内的 & 位于非顶层，予以保留）。
 *    顶层 & 没有对齐上下文，KaTeX 会报 "Expected 'EOF', got '&'"。
 */
function splitTopLevelRows(latex: string): string[] {
  const state = createDepthState();
  const rows: string[] = [];
  let current = "";
  let i = 0;
  while (i < latex.length) {
    if (latex[i] === "\\" && latex[i + 1] === "\\" && isTopLevel(state)) {
      rows.push(current);
      i += 2;
      while (i < latex.length && (latex[i] === " " || latex[i] === "\t")) i++;
      if (latex[i] === "[") {
        const endBracket = latex.indexOf("]", i);
        i = endBracket === -1 ? i : endBracket + 1;
      }
      current = "";
      continue;
    }
    const step = advanceLatexDepth(latex, i, state);
    current += latex.slice(i, i + step);
    i += step;
  }
  rows.push(current);
  return rows;
}

/** 剥离片段中所有顶层对齐符 &（环境体内的 & 保留）。 */
function stripTopLevelAlignment(row: string): string {
  const state = createDepthState();
  let out = "";
  let i = 0;
  while (i < row.length) {
    if (row[i] === "&" && isTopLevel(state)) {
      i++;
      continue;
    }
    const step = advanceLatexDepth(row, i, state);
    out += row.slice(i, i + step);
    i += step;
  }
  return out.trim();
}

/** 统计子串出现次数 */
function countOccurrences(text: string, token: string): number {
  return text.split(token).length - 1;
}

/**
 * 若整串恰由**一对方括号对齐环境**完整包裹，返回其环境体；否则返回 null。
 *
 * 必须严格校验「恰好一对」：形如
 *   `\begin{aligned}…\end{aligned} \\ \begin{aligned}…\end{aligned}`
 * 的并列结构首尾虽然也是 begin/end，但内部仍留有完整的第二组环境。
 * 若仅凭首尾去解包，会剥掉外层 begin/end 却把内层留在环境体里，
 * 拍平后即产生「有 begin 无 end」的非法片段，KaTeX 直接报错。
 */
function unwrapSingleAlignedEnv(latex: string): string | null {
  const m = latex.match(/^\\begin\{(aligned|gathered)\}/);
  if (!m) return null;
  const begin = m[0];
  const end = `\\end{${m[1]}}`;
  if (!latex.endsWith(end)) return null;
  if (countOccurrences(latex, begin) !== 1) return null;
  if (countOccurrences(latex, end) !== 1) return null;
  return latex.slice(begin.length, latex.length - end.length);
}

/** 含不可外部改写的复杂环境（分段函数 / 矩阵 / 数组）：内部行列结构由 KaTeX 自行负责 */
const RIGID_ENV = /\\begin\{(cases|matrix|pmatrix|bmatrix|vmatrix|array)\}/;

/**
 * 从 LaTeX 中提取原生多行结构（顶层 \\\\）。
 *
 * 行为约定：
 * 1. 整串恰为一对 aligned / gathered 包裹时解包，再在顶层 \\ 处拍平为独立行——
 *    拍平后每一行都可能被 findOptimalSplit 继续按语义断行，
 *    这是窄容器中避免整体暴跌字号的必要前提。
 * 2. 并列环境（多对）不做解包，改为在顶层 \\ 处切分，
 *    使每个片段都是**完整闭合**的环境体，交由 KaTeX 原生对齐排版。
 * 3. 含 cases / matrix / array 等复杂环境且无外层 aligned 可解包时整体交出，
 *    绝不外部切分。
 * 4. 无论走哪条路径，均只切顶层 \\、丢弃行距参数 [..]、剥离顶层 &，
 *    保证每个片段都能被 KaTeX 独立无错编译。
 */
export function extractLatexLines(latex: string): string[] | null {
  if (!latex) return null;
  const trimmed = latex.trim();
  if (!trimmed.includes("\\\\")) return null;

  const inner = unwrapSingleAlignedEnv(trimmed);
  if (inner === null && RIGID_ENV.test(trimmed)) return null;

  const rows = splitTopLevelRows(inner ?? trimmed)
    .map((row) => stripTopLevelAlignment(row))
    .filter((row) => row.length > 0);

  return rows.length > 1 ? rows : null;
}
