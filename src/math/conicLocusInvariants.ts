/**
 * src/math/conicLocusInvariants.ts
 * 圆锥曲线标内核心通法纯数学解算（零 React/DOM 副作用）：
 * 1. locusTransfer: 相关点转移法（圆压缩变换生成椭圆）
 * 2. thirdDefinition: 椭圆/双曲线第三定义（中心对称弦两端斜率积 k_PA * k_PB = ±b^2/a^2 = e^2 - 1）
 * 3. fixedPoint: 标内普通联立“先猜后证”定值定点（直角弦恒过定点）
 */

export type LocusStudyMode = "locusTransfer" | "thirdDefinition" | "fixedPoint";
export type ThirdDefCurveType = "ellipse" | "hyperbola";

export interface Point2D {
  x: number;
  y: number;
}

export interface LocusTransferResult {
  a: number;
  b: number;
  ratio: number;
  P0: Point2D; // 圆上原动点 (a cos θ, a sin θ)
  P: Point2D; // 椭圆上转移点 (a cos θ, b sin θ)
  footX: Point2D; // 垂足 (a cos θ, 0)
  circleRadiusSq: number;
  ellipseResidual: number;
}

export interface ThirdDefinitionResult {
  curveType: ThirdDefCurveType;
  a: number;
  b: number;
  e: number;
  A: Point2D; // 中心弦端点 A(-a, 0) 或对称端点
  B: Point2D; // 中心弦端点 B(a, 0) 或对称端点
  P: Point2D; // 曲线上自由动点
  kPA: number | null;
  kPB: number | null;
  measuredProduct: number | null;
  theoreticalProduct: number; // 椭圆为 -b^2/a^2，双曲线为 +b^2/a^2
  isValidSlope: boolean;
}

export interface FixedPointResult {
  a: number;
  b: number;
  A0: Point2D; // 左顶点 (-a, 0)
  A: Point2D | null; // 割线交点 A
  B: Point2D | null; // 割线交点 B
  Q: Point2D; // x 轴恒过定点 (a*(b^2 - a^2)/(a^2 + b^2), 0)
  slopeN: number; // 动割线斜率倒数 m，使直线 x = m y + x_Q 绕定点 Q 旋转
  kA0A: number | null;
  kA0B: number | null;
  slopeProduct: number | null;
  isValid: boolean;
}

/** 保持椭圆半轴安全约束 a > b > 0 */
export function normalizeConicAxes(
  a: number,
  b: number,
  isEllipse: boolean,
): { a: number; b: number } {
  const safeA = Math.max(0.8, a);
  const safeB = isEllipse
    ? Math.max(0.4, Math.min(b, safeA - 0.1))
    : Math.max(0.4, b);
  return { a: safeA, b: safeB };
}

/** 1. 相关点转移法：圆 x₀² + y₀² = a² 压缩生成椭圆 */
export function calcLocusTransfer(
  rawA: number,
  rawB: number,
  thetaDeg: number,
): LocusTransferResult {
  const { a, b } = normalizeConicAxes(rawA, rawB, true);
  const rad = (thetaDeg * Math.PI) / 180;
  const x0 = a * Math.cos(rad);
  const y0 = a * Math.sin(rad);
  const ratio = b / a;
  const x = x0;
  const y = ratio * y0;
  const ellipseResidual = (x * x) / (a * a) + (y * y) / (b * b) - 1;

  return {
    a,
    b,
    ratio,
    P0: { x: x0, y: y0 },
    P: { x, y },
    footX: { x, y: 0 },
    circleRadiusSq: a * a,
    ellipseResidual,
  };
}

/** 2. 第三定义：过中心弦端点 A(-x_A, -y_A), B(x_A, y_A) 与动点 P 连线斜率积 */
export function calcThirdDefinition(
  curveType: ThirdDefCurveType,
  rawA: number,
  rawB: number,
  thetaDeg: number,
): ThirdDefinitionResult {
  const isEllipse = curveType === "ellipse";
  const { a, b } = normalizeConicAxes(rawA, rawB, isEllipse);
  const c = isEllipse ? Math.sqrt(a * a - b * b) : Math.sqrt(a * a + b * b);
  const e = c / a;

  const A: Point2D = { x: -a, y: 0 };
  const B: Point2D = { x: a, y: 0 };

  let px: number;
  let py: number;
  if (isEllipse) {
    const rad = (thetaDeg * Math.PI) / 180;
    px = a * Math.cos(rad);
    py = b * Math.sin(rad);
  } else {
    // 将 [0, 360] 度均匀映射到双曲线右支上可视区间 t ∈ [-1.15, 1.15]
    const norm = ((thetaDeg % 360) + 360) % 360;
    const tSigned = ((norm - 180) / 180) * 1.12;
    const clampedT = Math.abs(tSigned) < 0.08 ? 0.15 : tSigned;
    px = a / Math.cos(clampedT);
    py = b * Math.tan(clampedT);
  }

  const dx1 = px - A.x;
  const dx2 = px - B.x;
  const isValidSlope = Math.abs(dx1) > 1e-4 && Math.abs(dx2) > 1e-4;
  const kPA = isValidSlope ? (py - A.y) / dx1 : null;
  const kPB = isValidSlope ? (py - B.y) / dx2 : null;
  const measuredProduct = kPA !== null && kPB !== null ? kPA * kPB : null;
  const theoreticalProduct = isEllipse ? -(b * b) / (a * a) : (b * b) / (a * a);

  return {
    curveType,
    a,
    b,
    e,
    A,
    B,
    P: { x: px, y: py },
    kPA,
    kPB,
    measuredProduct,
    theoreticalProduct,
    isValidSlope,
  };
}

/** 3. 标内普通联立：以过定点 Q 直线 x = m y + x_Q 与椭圆联立，验证左顶点直角弦 k_PA · k_PB = -1 */
export function calcFixedPointModel(
  rawA: number,
  rawB: number,
  slopeInvM: number,
): FixedPointResult {
  const { a, b } = normalizeConicAxes(rawA, rawB, true);
  const A0: Point2D = { x: -a, y: 0 };
  const xQ = (a * (b * b - a * a)) / (a * a + b * b);
  const Q: Point2D = { x: xQ, y: 0 };

  // 将 x = m y + xQ 代入 b^2 x^2 + a^2 y^2 = a^2 b^2:
  // (b^2 m^2 + a^2) y^2 + 2 b^2 m xQ y + b^2 (xQ^2 - a^2) = 0
  const qa = b * b * slopeInvM * slopeInvM + a * a;
  const qb = 2 * b * b * slopeInvM * xQ;
  const qc = b * b * (xQ * xQ - a * a);
  const delta = qb * qb - 4 * qa * qc;

  if (delta <= 1e-7) {
    return {
      a,
      b,
      A0,
      A: null,
      B: null,
      Q,
      slopeN: slopeInvM,
      kA0A: null,
      kA0B: null,
      slopeProduct: null,
      isValid: false,
    };
  }

  const sqrtD = Math.sqrt(delta);
  const y1 = (-qb + sqrtD) / (2 * qa);
  const y2 = (-qb - sqrtD) / (2 * qa);
  const x1 = slopeInvM * y1 + xQ;
  const x2 = slopeInvM * y2 + xQ;

  const A: Point2D = { x: x1, y: y1 };
  const B: Point2D = { x: x2, y: y2 };
  const dx1 = A.x - A0.x;
  const dx2 = B.x - A0.x;
  const kA0A = Math.abs(dx1) > 1e-6 ? (A.y - A0.y) / dx1 : null;
  const kA0B = Math.abs(dx2) > 1e-6 ? (B.y - A0.y) / dx2 : null;
  const slopeProduct = kA0A !== null && kA0B !== null ? kA0A * kA0B : null;

  return {
    a,
    b,
    A0,
    A,
    B,
    Q,
    slopeN: slopeInvM,
    kA0A,
    kA0B,
    slopeProduct,
    isValid: true,
  };
}
