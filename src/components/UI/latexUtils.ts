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
      candidates.push(i);
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

  const left = latex.slice(0, chosenIdx).trim();
  const right = latex.slice(chosenIdx + 1).trim();
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
