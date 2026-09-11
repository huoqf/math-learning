/**
 * src/utils/mathFormat.ts
 * 全库通用纯数学代数表达与数值格式化纯函数（SSOT 单一事实源）
 * 严格遵循高中数学课标，杜绝工科测量机器浮点尾零与未化简代数式
 */

/**
 * 将数值格式化为高中数学规范的精简代数表示（整数无小数位，非整数去除多余尾随零）
 * 示例：1 -> "1", 1.00 -> "1", 2.50 -> "2.5", 0 -> "0"
 */
export function formatMathNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < 1e-9) return "0";
  if (Math.abs(n - Math.round(n)) < 1e-6) {
    return Math.round(n).toString();
  }
  return Number(n.toFixed(2)).toString();
}

/**
 * 格式化带符号的代数项（用于多项式拼接，自动处理正负号并省略代数变量系数 1 / -1，常数项 1 不省略）
 * 示例：(1, 'x') -> "+ x", (-1, 'x') -> "- x", (2, 'y') -> "+ 2y", (1, '') -> "+ 1"
 */
export function formatSignedTerm(
  coeff: number,
  variable: string,
  isFirst = false,
): string {
  if (Math.abs(coeff) < 1e-9) return "";

  const absCoeff = Math.abs(coeff);
  const isOne = Math.abs(absCoeff - 1) < 1e-6;
  const coeffStr = isOne && variable !== "" ? "" : formatMathNumber(absCoeff);

  if (isFirst) {
    const sign = coeff < 0 ? "-" : "";
    return `${sign}${coeffStr}${variable}`;
  }

  const sign = coeff < 0 ? "- " : "+ ";
  return `${sign}${coeffStr}${variable}`;
}
