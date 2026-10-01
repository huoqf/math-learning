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
 * 概率类数值的显示精度（小数位数）。
 *
 * 这是「判定 ⟺ 显示」同源的唯一事实源：独立性判定直接比较两个概率量化到该位数后的
 * 整数编码，因此只要两数显示相同就绝不可能印出不等号，反之亦然。
 * 若显示精度高于判定精度，就会出现「两个数显示完全相同却印 ≠」的反向假不等式
 * （实测旧实现 29 189 个可达参数组合中有 513 组命中）。
 * 同步点：src/math/probabilityIndependence.ts 以本常量驱动 quantizeProb。
 */
export const MATH_PROB_DECIMALS = 4;

/**
 * 将概率格式化为定点小数并去除尾随零（负零归一为 "0"）
 * 示例：0.095 -> "0.095"，0.1 -> "0.1"，0.366666 -> "0.3667"，0 -> "0"
 */
export function formatMathProb(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const factor = 10 ** MATH_PROB_DECIMALS;
  const quantized = Math.round(n * factor) / factor;
  return quantized.toFixed(MATH_PROB_DECIMALS).replace(/\.?0+$/, "") || "0";
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
 * 线性式 `ax + b` 的高中规范书写（LaTeX 与纯文本通用）。
 *
 * 为什么必须统一：内层线性函数 `u = ax + b` 在右屏、中屏、推导链里出现多次，
 * 若各调用点各自用 `${a}x + ${b}` 拼接，当 `b < 0` 时会印出 `2x + -3`（负负相连）、
 * 当 `a = 1 / -1` 时会印出 `1x` / `-1x`（漏省系数）、当 `a = 0 / b = 0` 时会多出 `0x` / `+ 0`
 * —— 这四种写法都是初中就已被纠正的不规范书写。收敛到本函数后只可能有一种输出。
 *
 * 示例：(2, -3) -> "2x - 3"；(1, 1) -> "x + 1"；(-1, 2) -> "-x + 2"；(0, 1) -> "1"；(2, 0) -> "2x"
 */
export function formatLinearExpr(a: number, b: number, variable = "x"): string {
  if (Math.abs(a) < 1e-9) return formatMathNumber(b);
  const head = formatSignedTerm(a, variable, true);
  if (Math.abs(b) < 1e-9) return head;
  return `${head} ${formatSignedTerm(b, "", false)}`;
}

/**
 * 形如 `y - f(x_0)` 中减号一侧的书写：把「减号 + 负值」合并为单个 `+`。
 *
 * 反面示例：`f(x_0) = -0.91` 时直接写 `y - ${v}` 会印出 `y - -0.91` 的双负号。
 * 正例：(-0.91) -> "+ 0.91"；(2.13) -> "- 2.13"；(0) -> "- 0"
 */
export function formatSubtractTerm(v: number): string {
  return v < 0 ? `+ ${formatMathNumber(-v)}` : `- ${formatMathNumber(v)}`;
}

/**
 * 形如 `(x - x_0)` 中括号减式的书写：同样避免 `(x - -2)` 的双负号。
 * 正例：(-2) -> "(x + 2)"；(1.5) -> "(x - 1.5)"
 */
export function formatParenSubtractTerm(v: number, variable = "x"): string {
  return v < 0
    ? `(${variable} + ${formatMathNumber(-v)})`
    : `(${variable} - ${formatMathNumber(v)})`;
}

/**
 * 把数值格式化为高中数学卷面通行的「最简分数」LaTeX；若无法用分母 ≤ maxDenominator
 * 的分数精确表示，则返回 null，由调用方回退到 `formatMathNumber`。
 *
 * 为什么必须存在：`formatMathNumber` 只保留两位小数，`2/3` 会被印成 `0.67`、`1/9` 印成 `0.11`。
 * 而在「一般方程配方」「待定系数法」这类题型里，系数与圆心、半径的真值本来就是分数——
 * 教材考的正是分数的通分与配方运算。若退化成机器小数，等于把考点换成近似值，学生照抄会算错。
 *
 * 分工：`formatPiFraction` 处理 π 的分数倍（结果带 π）；本函数只处理纯有理数。
 * 整数直接返回十进制字符串，因此对既有整数参数完全零副作用（不会凭空多出 `\frac`）。
 * 负号位置遵循卷面写法：`-2/3 -> "-\frac{2}{3}"`，而非 `\frac{-2}{3}`。
 *
 * 正例：`0 -> "0"`、`3 -> "3"`、`-4 -> "-4"`、`2/3 -> "\frac{2}{3}"`、
 *       `-1/3 -> "-\frac{1}{3}"`、`0.25 -> "\frac{1}{4}"`；
 * 反例：`Math.PI -> null`、`Math.SQRT2 -> null`（分子含无理数，不是有理数）。
 */
export function formatMathRational(
  x: number,
  maxDenominator = 100,
): string | null {
  if (!Number.isFinite(x)) return null;
  if (Math.abs(x) < 1e-9) return "0";
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));

  for (let d = 2; d <= maxDenominator; d++) {
    const k = Math.round(x * d);
    if (k === 0) continue;
    if (Math.abs(k / d - x) < 1e-9) {
      const g = gcd(Math.abs(k), d);
      const num = Math.abs(k) / g;
      const den = d / g;
      const sign = k < 0 ? "-" : "";
      if (den === 1) return `${sign}${num}`;
      return `${sign}\\frac{${num}}{${den}}`;
    }
  }
  return null;
}

/**
 * 「分数优先、小数兜底」的显示策略：能化为简分数则输出分数 LaTeX，否则回退两位小数。
 *
 * 适用对象：真值本来就是分数的量——一般方程的系数 $D,E,F$、配方求得的圆心与半径、
 * 判别式 $\Delta_c$。这些量在教材题里就是分数形态，印成小数会把考点变成近似值。
 * 不适用于「由滑块选定的几何量」（如标准方程里的圆心 $a,b$ 与半径 $r$）——那里小数更自然。
 *
 * 对整数返回十进制字符串，因此替换 `formatMathNumber` 时对既有整数参数零副作用。
 * 唯一附带效益：`16.00`、`-9.00` 这类 `toFixed(2)` 产生的浮点尾零会被一并消除。
 */
export function formatMathRationalOrNumber(
  x: number,
  maxDenominator = 100,
): string {
  return formatMathRational(x, maxDenominator) ?? formatMathNumber(x);
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
