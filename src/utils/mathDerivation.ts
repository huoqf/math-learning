/**
 * src/utils/mathDerivation.ts
 * 高中数学核心通法代数推演宏（Derivation Macros）
 *
 * 严格遵循新高考解答题评分标准，标准封装「① 符号母式 -> ② 参数代入式 -> ③ 计算化简结果」三部曲
 * 彻底消除业务层手写模板拼接容易出现的跳步、漏公式、直接空降浮点数等教学事故
 */

import { formatMathNumber } from "./mathFormat";

export interface PointCoords {
  x: number;
  y: number;
  name?: string;
}

export interface GeneralLineCoeffs {
  A: number;
  B: number;
  C: number;
}

/**
 * 1. 点到直线距离推演宏
 * 符号公式 -> 代入参数 -> 模长与分母根式 -> 最终距离
 * 示例：d = \frac{|Ax_0 + By_0 + C|}{\sqrt{A^2 + B^2}} = \frac{|0.75(0) - 1(0) + (-1)|}{\sqrt{0.75^2 + (-1)^2}} = \frac{1}{1.25} = 0.8
 */
export function derivePointToLineDistance(
  pt: PointCoords,
  line: GeneralLineCoeffs,
  dist: number,
): string {
  const xVal = formatMathNumber(pt.x);
  const yVal = formatMathNumber(pt.y);
  const aVal = formatMathNumber(line.A);
  const bVal = formatMathNumber(line.B);
  const cVal = formatMathNumber(line.C);
  const distVal = formatMathNumber(dist);

  const numVal = Math.abs(line.A * pt.x + line.B * pt.y + line.C);
  const denVal = Math.hypot(line.A, line.B);
  const numValStr = formatMathNumber(numVal);
  const denValStr = formatMathNumber(denVal);

  const subExpr = `\\frac{|${aVal}(${xVal}) + (${bVal})(${yVal}) + (${cVal})|}{\\sqrt{(${aVal})^2 + (${bVal})^2}}`;
  const simExpr = `\\frac{${numValStr}}{${denValStr}}`;

  return `d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}} = ${subExpr} = ${simExpr} = ${distVal}`;
}

/**
 * 2. 垂径定理勾股相交弦长推演宏 (几何法)
 * 符号勾股 -> 代入半径与弦心距 -> 开方结果
 * 示例：L = 2\sqrt{r^2 - d^2} = 2\sqrt{3^2 - 0.8^2} = 2\sqrt{8.36} = 5.78
 */
export function deriveChordLengthPythagoras(
  radius: number,
  distance: number,
  chordLength: number,
): string {
  const rVal = formatMathNumber(radius);
  const dVal = formatMathNumber(distance);
  const diffVal = formatMathNumber(
    Math.max(0, radius * radius - distance * distance),
  );
  const lVal = formatMathNumber(chordLength);

  return `L = 2\\sqrt{r^2 - d^2} = 2\\sqrt{${rVal}^2 - (${dVal})^2} = 2\\sqrt{${diffVal}} = ${lVal}`;
}

/**
 * 3. 韦达定理代数相交弦长推演宏 (消元法)
 * 符号展开 -> 判别式与二次项代入 -> 结果
 * 示例：L = \frac{\sqrt{\Delta}}{\sqrt{1+k^2}} = \frac{\sqrt{33.44}}{\sqrt{1+0.75^2}} = 5.78
 */
export function deriveVietaChordLength(
  k: number,
  delta: number,
  chordLength: number,
): string {
  const kVal = formatMathNumber(k);
  const deltaVal = formatMathNumber(delta);
  const k2Plus1Val = formatMathNumber(1 + k * k);
  const lVal = formatMathNumber(chordLength);

  return `L = \\sqrt{1+k^2}|x_1 - x_2| = \\frac{\\sqrt{\\Delta}}{\\sqrt{1+k^2}} = \\frac{\\sqrt{${deltaVal}}}{\\sqrt{1 + ${kVal}^2}} = \\frac{\\sqrt{${deltaVal}}}{\\sqrt{${k2Plus1Val}}} = ${lVal}`;
}

/**
 * 4. 圆外一点引切线长定理推演宏
 * 点心距勾股定理展开
 * 示例：PT = \sqrt{|PC|^2 - r^2} = \sqrt{6.4^2 - 3^2} = \sqrt{41 - 9} = 5.66
 */
export function deriveTangentLength(
  distPC: number,
  radius: number,
  tangentLength: number,
): string {
  const distPCVal = formatMathNumber(distPC);
  const rVal = formatMathNumber(radius);
  const diffVal = formatMathNumber(
    Math.max(0, distPC * distPC - radius * radius),
  );
  const tVal = formatMathNumber(tangentLength);

  return `PT = \\sqrt{|PC|^2 - r^2} = \\sqrt{(${distPCVal})^2 - (${rVal})^2} = \\sqrt{${diffVal}} = ${tVal}`;
}

/**
 * 5. 垂径中点连线与割线垂直斜率乘积推演宏
 * 斜率公式 -> 负倒数充要条件
 * 示例：k_{CH} = \frac{y_0 - b}{x_0 - a} = 1 \implies k_{AB} = -\frac{1}{k_{CH}} = -1
 */
export function deriveMidpointPerpendicularSlope(
  midpoint: PointCoords,
  center: PointCoords,
  kCH: number | null,
  kAB: number,
): string {
  const x0Val = formatMathNumber(midpoint.x);
  const y0Val = formatMathNumber(midpoint.y);
  const aVal = formatMathNumber(center.x);
  const bVal = formatMathNumber(center.y);
  const kCHVal = kCH !== null ? formatMathNumber(kCH) : "不存在";
  const kABVal = formatMathNumber(kAB);

  if (kCH === null) {
    return `k_{CH} = \\text{不存在 (铅垂线 } x = ${x0Val}) \\implies k_{AB} = 0 \\text{ (水平弦)}`;
  }

  return `k_{CH} = \\frac{y_0 - b}{x_0 - a} = \\frac{${y0Val} - (${bVal})}{${x0Val} - (${aVal})} = ${kCHVal} \\implies k_{AB} = -\\frac{1}{k_{CH}} = -\\frac{1}{${kCHVal}} = ${kABVal}`;
}
