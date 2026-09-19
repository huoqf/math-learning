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

/**
 * 把「π 的分数倍」格式化为高中通行写法；若该数值不是 π 的（分母 ≤ maxDenominator 的）分数倍则返回 null。
 *
 * 用途：中屏/右屏的角刻度与不等式通解集。
 * 反面示例：`0.17π` 表示 `sin x > 0.5` 的解 `π/6`（真值为 `π/6`，写成 0.17π 属于形式漏解）。
 * 正例：0 -> "0"，Math.PI/6 -> "π/6"，-3*Math.PI/2 -> "-3π/2"，2*Math.PI -> "2π"，1.234 -> null
 */
export function formatPiFraction(
  x: number,
  maxDenominator = 12,
): string | null {
  if (!Number.isFinite(x)) return null;
  if (Math.abs(x) < 1e-9) return "0";

  for (let d = 1; d <= maxDenominator; d++) {
    const k = Math.round((x * d) / Math.PI);
    if (k === 0) continue;
    if (Math.abs((k * Math.PI) / d - x) < 1e-9) {
      const g = gcd(Math.abs(k), d);
      const num = Math.abs(k) / g;
      const den = d / g;
      const sign = k < 0 ? "-" : "";
      if (den === 1) return `${sign}${num === 1 ? "" : num}π`;
      return `${sign}${num === 1 ? "" : num}π/${den}`;
    }
  }
  return null;
}

/**
 * 将数值格式化为 π 的 LaTeX 分数倍（如 \frac{\pi}{6}），非特殊角则返回近似值 \approx 0.xx\pi
 */
export function formatPiFractionLatex(x: number, maxDenominator = 12): string {
  if (!Number.isFinite(x)) return "";
  if (Math.abs(x) < 1e-9) return "0";

  for (let d = 1; d <= maxDenominator; d++) {
    const k = Math.round((x * d) / Math.PI);
    if (k === 0) continue;
    if (Math.abs((k * Math.PI) / d - x) < 1e-6) {
      const g = gcd(Math.abs(k), d);
      const num = Math.abs(k) / g;
      const den = d / g;
      const sign = k < 0 ? "-" : "";
      if (den === 1) return `${sign}${num === 1 ? "" : num}\\pi`;
      return `${sign}\\frac{${num === 1 ? "" : num}\\pi}{${den}}`;
    }
  }
  return `\\approx ${(x / Math.PI).toFixed(2)}\\pi`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
