/**
 * LaTeX 排版工具（KatexFormula / MathPanel 共用）。
 * 单独成文件以符合 react-refresh 仅导出组件的约束。
 */

/**
 * 教材推导换行：在首个顶层等号处把长等式拆为两段
 * （左端一段，右端以「=」起头，与高中教材/高考答题卡书写习惯一致）。
 * 只在 brace/paren 深度均为 0 的位置切分，保证不破坏 \frac、( ) 等结构。
 */
export function splitAtTopLevelEquals(latex: string): [string, string] | null {
  let braceDepth = 0;
  let parenDepth = 0;
  for (let i = 0; i < latex.length; i++) {
    const ch = latex[i];
    if (ch === "{" || ch === "[") braceDepth++;
    else if (ch === "}" || ch === "]") braceDepth = Math.max(0, braceDepth - 1);
    else if (ch === "(") parenDepth++;
    else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === "=" && braceDepth === 0 && parenDepth === 0) {
      const left = latex.slice(0, i).trim();
      const right = latex.slice(i).trim(); // 含开头的 =
      if (left && right.length > 1) return [left, right];
      return null;
    }
  }
  return null;
}

/**
 * 教材续行换行：在首个顶层二元 +/- 处把长式拆为两段，
 * 续行以运算符起头（教材多项式展开的标准排法）。
 * 只在 brace/paren 深度均为 0 的位置切分；跳过一元正负号（如 = -2x、(-x)）。
 */
export function splitAtTopLevelBinary(latex: string): [string, string] | null {
  let braceDepth = 0;
  let parenDepth = 0;
  for (let i = 0; i < latex.length; i++) {
    const ch = latex[i];
    if (ch === "{" || ch === "[") braceDepth++;
    else if (ch === "}" || ch === "]") braceDepth = Math.max(0, braceDepth - 1);
    else if (ch === "(") parenDepth++;
    else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (
      (ch === "+" || ch === "-") &&
      braceDepth === 0 &&
      parenDepth === 0
    ) {
      // 跳过一元正负号：前一个非空字符是 = + - ( , 或位于串首
      let p = i - 1;
      while (p >= 0 && latex[p] === " ") p--;
      if (p < 0 || "=+-,(<>:≤≥".includes(latex[p])) continue;
      const left = latex.slice(0, i).trim();
      const right = latex.slice(i).trim(); // 含开头的 +/-
      if (left && right.length > 1) return [left, right];
      return null;
    }
  }
  return null;
}
