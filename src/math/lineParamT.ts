/**
 * 直线参数方程 t 的几何意义与割线定理计算库
 * 遵循数学层纯净原则：无 DOM / 无 React / 无副作用
 */

export type ConicType = "circle" | "ellipse" | "parabola" | "hyperbola";

export interface LineParamPoint {
  x: number;
  y: number;
}

export interface LineConicIntersectionResult {
  /** 曲线类型 */
  conicType: ConicType;
  /** 直线方程代入二次曲线后得到的一元二次方程系数 A t^2 + B t + C = 0 */
  A: number;
  B: number;
  C: number;
  /** 判别式 Delta = B^2 - 4AC */
  delta: number;
  /** 是否存在交点 (delta >= 0 且 A != 0) */
  hasIntersection: boolean;
  /** 是否退化为一元一次方程 (A near 0) */
  isDegenerateLine: boolean;
  /** 交点 1 对应参数 t1 */
  t1: number;
  /** 交点 2 对应参数 t2 */
  t2: number;
  /** 交点 A 坐标 */
  pointA?: LineParamPoint;
  /** 交点 B 坐标 */
  pointB?: LineParamPoint;
  /** 韦达定理: t1 + t2 */
  tSum: number;
  /** 韦达定理: t1 * t2 */
  tProd: number;
  /** 弦长 |AB| = |t1 - t2| */
  chordLength: number;
  /** 有向线段乘积 |PA| * |PB| = |t1 * t2| (割线定理 / 相交弦定理 / 方幂) */
  segmentProduct: number;
  /** 弦中点 M 对应参数 tM = (t1 + t2) / 2 */
  tM: number;
  /** 弦中点 M 坐标 */
  pointM?: LineParamPoint;
  /** 倒数和 |1/t1 + 1/t2| (如果 t1, t2 均不为 0) */
  reciprocalSum?: number;
}

/**
 * 根据标准参数方程计算直线上动点坐标
 * x = x0 + t * cos(alpha)
 * y = y0 + t * sin(alpha)
 */
export function getLinePoint(
  x0: number,
  y0: number,
  alphaDeg: number,
  t: number,
): LineParamPoint {
  const rad = (alphaDeg * Math.PI) / 180;
  return {
    x: x0 + t * Math.cos(rad),
    y: y0 + t * Math.sin(rad),
  };
}

/**
 * 根据非标准参数方程计算动点坐标
 * x = x0 + kNorm * m * cos(alpha)
 * y = y0 + kNorm * m * sin(alpha)
 */
export function getNonStandardLinePoint(
  x0: number,
  y0: number,
  alphaDeg: number,
  m: number,
  kNorm: number,
): LineParamPoint {
  const rad = (alphaDeg * Math.PI) / 180;
  return {
    x: x0 + kNorm * m * Math.cos(rad),
    y: y0 + kNorm * m * Math.sin(rad),
  };
}

export interface ConicShapeParams {
  /** 圆半径 R */
  R?: number;
  /** 椭圆/双曲线长半轴 a */
  a?: number;
  /** 椭圆/双曲线短半轴 b */
  b?: number;
  /** 抛物线焦准距 p (y^2 = 2px) */
  p?: number;
}

/**
 * 求解直线与各类二次曲线相交的代数与几何量
 */
export function calcLineConicIntersection(
  x0: number,
  y0: number,
  alphaDeg: number,
  conicType: ConicType,
  shapeParams: ConicShapeParams,
): LineConicIntersectionResult {
  const rad = (alphaDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  let A = 0;
  let B = 0;
  let C = 0;

  if (conicType === "circle") {
    const R = shapeParams.R ?? 3;
    // (x0 + t cos)^2 + (y0 + t sin)^2 = R^2
    // A = cos^2 + sin^2 = 1
    A = 1;
    B = 2 * (x0 * cos + y0 * sin);
    C = x0 * x0 + y0 * y0 - R * R;
  } else if (conicType === "ellipse") {
    const a = shapeParams.a ?? 4;
    const b = shapeParams.b ?? 2.5;
    const a2 = a * a;
    const b2 = b * b;
    // (x0 + t cos)^2 / a^2 + (y0 + t sin)^2 / b^2 = 1
    A = (cos * cos) / a2 + (sin * sin) / b2;
    B = (2 * x0 * cos) / a2 + (2 * y0 * sin) / b2;
    C = (x0 * x0) / a2 + (y0 * y0) / b2 - 1;
  } else if (conicType === "hyperbola") {
    const a = shapeParams.a ?? 3;
    const b = shapeParams.b ?? 2;
    const a2 = a * a;
    const b2 = b * b;
    // (x0 + t cos)^2 / a^2 - (y0 + t sin)^2 / b^2 = 1
    A = (cos * cos) / a2 - (sin * sin) / b2;
    B = (2 * x0 * cos) / a2 - (2 * y0 * sin) / b2;
    C = (x0 * x0) / a2 - (y0 * y0) / b2 - 1;
  } else if (conicType === "parabola") {
    const p = shapeParams.p ?? 2;
    // (y0 + t sin)^2 = 2p(x0 + t cos)
    // t^2 sin^2 + t (2 y0 sin - 2p cos) + (y0^2 - 2p x0) = 0
    A = sin * sin;
    B = 2 * y0 * sin - 2 * p * cos;
    C = y0 * y0 - 2 * p * x0;
  }

  const isDegenerateLine = Math.abs(A) < 1e-7;
  const delta = B * B - 4 * A * C;
  const hasIntersection = !isDegenerateLine && delta >= 0;

  if (!hasIntersection) {
    return {
      conicType,
      A,
      B,
      C,
      delta,
      hasIntersection: false,
      isDegenerateLine,
      t1: 0,
      t2: 0,
      tSum: 0,
      tProd: 0,
      chordLength: 0,
      segmentProduct: 0,
      tM: 0,
    };
  }

  const sqrtDelta = Math.sqrt(Math.max(0, delta));
  const t1 = (-B - sqrtDelta) / (2 * A);
  const t2 = (-B + sqrtDelta) / (2 * A);

  const tSum = -B / A;
  const tProd = C / A;
  const chordLength = Math.abs(t1 - t2);
  const segmentProduct = Math.abs(tProd);
  const tM = tSum / 2;

  const pointA = getLinePoint(x0, y0, alphaDeg, t1);
  const pointB = getLinePoint(x0, y0, alphaDeg, t2);
  const pointM = getLinePoint(x0, y0, alphaDeg, tM);

  let reciprocalSum: number | undefined = undefined;
  if (Math.abs(t1) > 1e-6 && Math.abs(t2) > 1e-6) {
    reciprocalSum = Math.abs((t1 + t2) / (t1 * t2));
  }

  return {
    conicType,
    A,
    B,
    C,
    delta,
    hasIntersection: true,
    isDegenerateLine: false,
    t1,
    t2,
    pointA,
    pointB,
    tSum,
    tProd,
    chordLength,
    segmentProduct,
    tM,
    pointM,
    reciprocalSum,
  };
}
