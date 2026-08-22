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
      state.env++;
      return 7;
    }
    if (sub.startsWith("\\end{")) {
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
 * 寻找公式中所有顶层等号的位置
 */
export function findTopLevelEqualsIndices(latex: string): number[] {
  const indices: number[] = [];
  const state = createDepthState();
  let i = 0;
  while (i < latex.length) {
    if (latex[i] === "=" && isTopLevel(state)) {
      indices.push(i);
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
 * 针对连等式（A = B = C），优先在能使两行长度更均衡的等号处断开。
 */
export function splitAtTopLevelEquals(latex: string): [string, string] | null {
  const equalsIndices = findTopLevelEqualsIndices(latex);
  if (equalsIndices.length === 0) return null;

  // 默认取第 1 个等号
  let chosenIdx = equalsIndices[0];

  // 若有多个等号（连等式，如 A = B = C），若在第 1 个等号切分后右侧依然过长，
  // 且第 2 个等号能使前后长度更均衡，则选择在第 2 个等号处折行
  if (equalsIndices.length >= 2) {
    const secondIdx = equalsIndices[1];
    const leftFirstLen = chosenIdx;
    const rightFirstLen = latex.length - chosenIdx;
    const leftSecondLen = secondIdx;

    // 若第 1 个等号左边过短（如只是 \sin\theta）而右边很长，优先选第 2 个等号断开
    if (leftFirstLen < 20 && rightFirstLen > 40 && leftSecondLen < 55) {
      chosenIdx = secondIdx;
    }
  }

  const left = latex.slice(0, chosenIdx).trim();
  const right = latex.slice(chosenIdx).trim(); // 含开头的 =
  if (left && right.length > 1) return [left, right];
  return null;
}

/**
 * 教材续行换行：在首个顶层二元 +/- 处把长式拆为两段，
 * 续行以运算符起头（教材多项式展开的标准排法）。
 */
export function splitAtTopLevelBinary(latex: string): [string, string] | null {
  const state = createDepthState();
  let i = 0;
  while (i < latex.length) {
    const ch = latex[i];
    if ((ch === "+" || ch === "-") && isTopLevel(state)) {
      // 跳过一元正负号：前一个非空字符是 = + - ( , 或位于串首
      let p = i - 1;
      while (p >= 0 && latex[p] === " ") p--;
      if (p >= 0 && !"=+-,(<>:≤≥".includes(latex[p])) {
        const left = latex.slice(0, i).trim();
        const right = latex.slice(i).trim(); // 含开头的 +/-
        if (left && right.length > 1) return [left, right];
        return null;
      }
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }
  return null;
}

/**
 * 寻找公式中顶层逻辑推导符（\Rightarrow, \implies, \iff, \Leftrightarrow 等）的位置与长度
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
    "\\to",
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
 * 顶层标点/分号折行：在顶层逗号或分号处断开复合条件（仅在等号/推导符无法断开或需进一步分行时作为辅助）
 */
export function splitAtTopLevelPunctuation(
  latex: string,
): [string, string] | null {
  const state = createDepthState();
  let i = 0;
  let chosenIdx = -1;
  while (i < latex.length) {
    if (isTopLevel(state)) {
      if (latex[i] === "," || latex[i] === ";") {
        chosenIdx = i;
      }
    }
    const step = advanceLatexDepth(latex, i, state);
    i += step;
  }
  if (chosenIdx > 0) {
    const left = latex.slice(0, chosenIdx).trim();
    const right = latex.slice(chosenIdx + 1).trim();
    if (left && right) return [left, right];
  }
  return null;
}

/**
 * 引擎级通用分式行距平衡与满尺寸升级：
 * 在多行数学环境（cases, matrix, aligned, array 等）内部，
 * 若某一行包含 \frac 或 \dfrac，且其换行符未显式指定额外间距（仅为普通 \\），
 * 自动注入 0.65em 的行距补偿，彻底消除分式分母下沉导致的上下行挤压。
 * 同时将普通 \frac 自动提升为满尺寸 \dfrac。
 */
export function normalizeFractionRowSpacing(latex: string): string {
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

  // 2. 普通单行公式直接将 \frac 升级为 \dfrac
  return latex.replace(/\\frac(?=\{)/g, "\\dfrac");
}
