/**
 * 纯数学模型：圆的方程实验室 (选必一 2.4)
 * 严格纯函数，零 DOM / React 依赖，保证 SSOT 与确定性
 */

import {
  formatMathNumber,
  formatMathRationalOrNumber,
} from "@/utils/mathFormat";

export interface Point2D {
  x: number;
  y: number;
}

export type CircleStudyMode = "standard" | "general" | "threePoints";

export interface StandardCircleResult {
  validity: "valid" | "invalid";
  errorMessage?: string;
  center: Point2D;
  radius: number;
  // 点 P 与圆的位置关系
  pointP: Point2D;
  distPC: number;
  positionRelation: "inside" | "on" | "outside";
  positionRelationLabel: string;
  // 方程字符串 (LaTeX)
  standardEquationLatex: string;
  generalD: number;
  generalE: number;
  generalF: number;
  generalEquationLatex: string;
}

export interface GeneralCircleResult {
  validity: "valid" | "degenerate_point" | "no_graph";
  D: number;
  E: number;
  F: number;
  deltaC: number; // D^2 + E^2 - 4F
  center: Point2D;
  radius: number;
  standardEquationLatex: string;
  generalEquationLatex: string;
  explanation: string;
}

export interface ThreePointsCircleResult {
  validity: "valid" | "collinear";
  pointA: Point2D;
  pointB: Point2D;
  pointC: Point2D;
  isCollinear: boolean;
  center?: Point2D;
  radius?: number;
  D?: number;
  E?: number;
  F?: number;
  standardEquationLatex?: string;
  generalEquationLatex?: string;
  midAB?: Point2D;
  midBC?: Point2D;
  perpDirAB?: Point2D;
  perpDirBC?: Point2D;
}

/**
 * 把配方结果写成标准方程的左半段 `(x ± a)^2 + (y ± b)^2`。
 * 圆心分量为 0 时退化为 `x^2` / `y^2`（不写 `(x - 0)^2`）。
 * 圆心分量按「分数优先」显示：a = -1/3 印成 `(x + \frac{1}{3})^2` 而非 `(x - (-0.33))^2`。
 */
function quadraticParts(
  a: number,
  b: number,
): { aPart: string; bPart: string } {
  const aPart =
    a === 0
      ? "x^2"
      : a > 0
        ? `(x - ${formatMathRationalOrNumber(a)})^2`
        : `(x + ${formatMathRationalOrNumber(-a)})^2`;
  const bPart =
    b === 0
      ? "y^2"
      : b > 0
        ? `(y - ${formatMathRationalOrNumber(b)})^2`
        : `(y + ${formatMathRationalOrNumber(-b)})^2`;
  return { aPart, bPart };
}

/**
 * 模式 1：标准方程与点圆位置关系
 */
export function solveStandardCircle(
  a: number,
  b: number,
  r: number,
  px: number,
  py: number,
): StandardCircleResult {
  if (r <= 0 || !Number.isFinite(r)) {
    return {
      validity: "invalid",
      errorMessage: "圆半径必须大于 0",
      center: { x: a, y: b },
      radius: 0,
      pointP: { x: px, y: py },
      distPC: 0,
      positionRelation: "inside",
      positionRelationLabel: "半径非法",
      standardEquationLatex: "",
      generalD: 0,
      generalE: 0,
      generalF: 0,
      generalEquationLatex: "",
    };
  }

  const center: Point2D = { x: a, y: b };
  const pointP: Point2D = { x: px, y: py };
  const distPC = Math.hypot(px - a, py - b);

  let positionRelation: "inside" | "on" | "outside" = "outside";
  let positionRelationLabel = "点在圆外 (|PC| > r)";
  if (Math.abs(distPC - r) <= 1e-4) {
    positionRelation = "on";
    positionRelationLabel = "点在圆上 (|PC| = r)";
  } else if (distPC < r) {
    positionRelation = "inside";
    positionRelationLabel = "点在圆内 (|PC| < r)";
  }

  // (x-a)^2 + (y-b)^2 = r^2 => x^2 + y^2 - 2ax - 2by + (a^2+b^2-r^2) = 0
  const generalD = -2 * a;
  const generalE = -2 * b;
  const generalF = a * a + b * b - r * r;

  const aPart = a === 0 ? "x^2" : a > 0 ? `(x - ${a})^2` : `(x + ${-a})^2`;
  const bPart = b === 0 ? "y^2" : b > 0 ? `(y - ${b})^2` : `(y + ${-b})^2`;
  const rSqStr = formatMathNumber(r * r);
  const standardEquationLatex = `${aPart} + ${bPart} = ${rSqStr}`;

  const dStr =
    generalD === 0 ? "" : generalD > 0 ? ` + ${generalD}x` : ` - ${-generalD}x`;
  const eStr =
    generalE === 0 ? "" : generalE > 0 ? ` + ${generalE}y` : ` - ${-generalE}y`;
  // 常数项必须走 SSOT：原实现直接 toFixed(2)，默认预设就会印出 `x^2 + y^2 - 9.00 = 0`。
  const fStr =
    generalF === 0
      ? ""
      : generalF > 0
        ? ` + ${formatMathNumber(generalF)}`
        : ` - ${formatMathNumber(-generalF)}`;
  const generalEquationLatex = `x^2 + y^2${dStr}${eStr}${fStr} = 0`;

  return {
    validity: "valid",
    center,
    radius: r,
    pointP,
    distPC,
    positionRelation,
    positionRelationLabel,
    standardEquationLatex,
    generalD,
    generalE,
    generalF,
    generalEquationLatex,
  };
}

/**
 * 模式 2：一般方程与配方互化
 * x^2 + y^2 + Dx + Ey + F = 0
 */
export function solveGeneralCircle(
  D: number,
  E: number,
  F: number,
): GeneralCircleResult {
  const deltaC = D * D + E * E - 4 * F;
  const centerX = -D / 2;
  const centerY = -E / 2;

  // 系数显示走「分数优先」：教材题里 D,E,F 本来就是分数（原式同乘过系数），
  // 直接插值会印出 0.6666666666666666 这种机器小数，改用 SSOT 统一格式化。
  const dStr =
    D === 0
      ? ""
      : D > 0
        ? ` + ${formatMathRationalOrNumber(D)}x`
        : ` - ${formatMathRationalOrNumber(-D)}x`;
  const eStr =
    E === 0
      ? ""
      : E > 0
        ? ` + ${formatMathRationalOrNumber(E)}y`
        : ` - ${formatMathRationalOrNumber(-E)}y`;
  const fStr =
    F === 0
      ? ""
      : F > 0
        ? ` + ${formatMathRationalOrNumber(F)}`
        : ` - ${formatMathRationalOrNumber(-F)}`;
  const generalEquationLatex = `x^2 + y^2${dStr}${eStr}${fStr} = 0`;

  if (deltaC > 1e-5) {
    const radius = Math.sqrt(deltaC) / 2;
    const { aPart, bPart } = quadraticParts(centerX, centerY);
    const rSqStr = formatMathRationalOrNumber(radius * radius);
    const standardEquationLatex = `${aPart} + ${bPart} = ${rSqStr}`;

    return {
      validity: "valid",
      D,
      E,
      F,
      deltaC,
      center: { x: centerX, y: centerY },
      radius,
      standardEquationLatex,
      generalEquationLatex,
      explanation: "判别式 D² + E² - 4F > 0，表示以 (-D/2, -E/2) 为圆心的实圆",
    };
  }

  if (Math.abs(deltaC) <= 1e-5) {
    const { aPart, bPart } = quadraticParts(centerX, centerY);
    return {
      validity: "degenerate_point",
      D,
      E,
      F,
      deltaC: 0,
      center: { x: centerX, y: centerY },
      radius: 0,
      standardEquationLatex: `${aPart} + ${bPart} = 0`,
      generalEquationLatex,
      explanation: "判别式 D² + E² - 4F = 0，方程退化为孤立实数点 (-D/2, -E/2)",
    };
  }

  return {
    validity: "no_graph",
    D,
    E,
    F,
    deltaC,
    center: { x: centerX, y: centerY },
    radius: 0,
    standardEquationLatex: "\\text{无实数轨迹}",
    generalEquationLatex,
    explanation: "判别式 D² + E² - 4F < 0，无任何实数解，不表示任何几何图形",
  };
}

/**
 * 模式 3：待定系数法（已知三点求圆的方程）
 */
export function solveThreePointsCircle(
  pA: Point2D,
  pB: Point2D,
  pC: Point2D,
): ThreePointsCircleResult {
  // 判定三点是否共线：叉积 (xB-xA)(yC-yA) - (yB-yA)(xC-xA)
  const cross = (pB.x - pA.x) * (pC.y - pA.y) - (pB.y - pA.y) * (pC.x - pA.x);
  if (Math.abs(cross) < 1e-4) {
    return {
      validity: "collinear",
      pointA: pA,
      pointB: pB,
      pointC: pC,
      isCollinear: true,
    };
  }

  // 待定系数法求解三元一次线性方程组：
  // x_i * D + y_i * E + F = -(x_i^2 + y_i^2)
  const zA = -(pA.x * pA.x + pA.y * pA.y);
  const zB = -(pB.x * pB.x + pB.y * pB.y);
  const zC = -(pC.x * pC.x + pC.y * pC.y);

  // 克拉默法则 / 行列式求解:
  // | xA  yA  1 |
  // | xB  yB  1 |
  // | xC  yC  1 |
  const det =
    pA.x * (pB.y - pC.y) - pA.y * (pB.x - pC.x) + (pB.x * pC.y - pC.x * pB.y);

  if (Math.abs(det) < 1e-5) {
    return {
      validity: "collinear",
      pointA: pA,
      pointB: pB,
      pointC: pC,
      isCollinear: true,
    };
  }

  // detD: 用 [zA, zB, zC]^T 替换第 1 列
  const detD = zA * (pB.y - pC.y) - pA.y * (zB - zC) + (zB * pC.y - zC * pB.y);

  // detE: 用 [zA, zB, zC]^T 替换第 2 列
  const detE = pA.x * (zB - zC) - zA * (pB.x - pC.x) + (pB.x * zC - pC.x * zB);

  // detF: 用 [zA, zB, zC]^T 替换第 3 列
  const detF =
    pA.x * (pB.y * zC - pC.y * zB) -
    pA.y * (pB.x * zC - pC.x * zB) +
    zA * (pB.x * pC.y - pC.x * pB.y);

  const D = detD / det;
  const E = detE / det;
  const F = detF / det;

  const centerX = -D / 2;
  const centerY = -E / 2;
  const radius = Math.hypot(pA.x - centerX, pA.y - centerY);

  // 待定系数法的解 D、E、F 与外心、半径全部走「分数优先」SSOT：
  // 原实现用 toFixed(2)，连整数解都会印成 `- 8.00x`、`= 5.00`（本项目明令禁止的浮点尾零）。
  const { aPart, bPart } = quadraticParts(centerX, centerY);
  const standardEquationLatex = `${aPart} + ${bPart} = ${formatMathRationalOrNumber(radius * radius)}`;

  const dStr =
    D === 0
      ? ""
      : D > 0
        ? ` + ${formatMathRationalOrNumber(D)}x`
        : ` - ${formatMathRationalOrNumber(-D)}x`;
  const eStr =
    E === 0
      ? ""
      : E > 0
        ? ` + ${formatMathRationalOrNumber(E)}y`
        : ` - ${formatMathRationalOrNumber(-E)}y`;
  const fStr =
    F === 0
      ? ""
      : F > 0
        ? ` + ${formatMathRationalOrNumber(F)}`
        : ` - ${formatMathRationalOrNumber(-F)}`;
  const generalEquationLatex = `x^2 + y^2${dStr}${eStr}${fStr} = 0`;

  // 中垂线几何参考：
  const midAB: Point2D = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
  const midBC: Point2D = { x: (pB.x + pC.x) / 2, y: (pB.y + pC.y) / 2 };
  const perpDirAB: Point2D = { x: -(pB.y - pA.y), y: pB.x - pA.x };
  const perpDirBC: Point2D = { x: -(pC.y - pB.y), y: pC.x - pB.x };

  return {
    validity: "valid",
    pointA: pA,
    pointB: pB,
    pointC: pC,
    isCollinear: false,
    center: { x: centerX, y: centerY },
    radius,
    D,
    E,
    F,
    standardEquationLatex,
    generalEquationLatex,
    midAB,
    midBC,
    perpDirAB,
    perpDirBC,
  };
}
