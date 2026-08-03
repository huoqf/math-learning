/**
 * 圆锥曲线与直线参数方程计算逻辑模块
 * 包含：
 * 1. 直线参数方程与几何意义 (x0, y0, alpha, t)
 * 2. 椭圆参数方程与三角设点 (a, b, theta)
 * 3. 直线与椭圆相交的 t 一元二次方程 At^2 + Bt + C = 0 与韦达定理
 * 4. 弦长、中点、|PA|*|PB|、倒数和等高考解题指标
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface LineParamResult {
  valid: boolean;
  message?: string;
  // 定点
  P0: Point2D;
  // 倾斜角 (rad)
  alphaRad: number;
  // 动点 P(t)
  Pt: Point2D;
  // 椭圆方程 x^2/a^2 + y^2/b^2 = 1
  a: number;
  b: number;
  // 直线代入椭圆后一元二次方程 At^2 + Bt + C = 0 的系数
  A: number;
  B: number;
  C: number;
  discriminant: number; // Delta = B^2 - 4AC
  // 交点对应的参数 t1, t2
  t1: number;
  t2: number;
  // 交点坐标 A, B
  pointA: Point2D;
  pointB: Point2D;
  // 弦中点 M 坐标与对应参数 tM
  tM: number;
  pointM: Point2D;
  // 几何量
  chordLength: number; // |AB| = |t1 - t2|
  productPA_PB: number; // |PA| * |PB| = |t1 * t2|
  sumPA_PB: number; // |PA| + |PB|
  invSumPA_PB: number; // 1/|PA| + 1/|PB|
}

export interface EllipseParamResult {
  valid: boolean;
  a: number;
  b: number;
  thetaRad: number;
  // 椭圆上的参数点 P(a cos theta, b sin theta)
  P: Point2D;
  // 离心圆 (半径 a) 对应点 P_aux(a cos theta, a sin theta)
  Paux: Point2D;
  // 内切圆 (半径 b) 对应点 P_in(b cos theta, b sin theta)
  Pin: Point2D;
  // 切线方程 Ax + By + C = 0 -> (cos theta / a) x + (sin theta / b) y = 1
  tangentA: number;
  tangentB: number;
  tangentC: number;
  // 与 x 轴、y 轴交点
  interceptX: number;
  interceptY: number;
  // 切线三角形面积 1/2 |interceptX * interceptY| = a*b / |sin(2 theta)|
  triangleArea: number;
}

/**
 * 计算直线参数方程及与椭圆相交的参数 t1, t2 韦达定理
 */
export function calculateLineConicParam(
  x0: number,
  y0: number,
  alphaDeg: number,
  t: number,
  a: number,
  b: number,
): LineParamResult {
  const P0: Point2D = { x: x0, y: y0 };
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const cosA = Math.cos(alphaRad);
  const sinA = Math.sin(alphaRad);

  // 动点 P(t)
  const Pt: Point2D = {
    x: x0 + t * cosA,
    y: y0 + t * sinA,
  };

  // 校验椭圆半轴有效性
  if (a <= 0 || b <= 0) {
    return {
      valid: false,
      message: "椭圆半轴必须大于 0",
      P0,
      alphaRad,
      Pt,
      a,
      b,
      A: 0,
      B: 0,
      C: 0,
      discriminant: -1,
      t1: 0,
      t2: 0,
      pointA: P0,
      pointB: P0,
      tM: 0,
      pointM: P0,
      chordLength: 0,
      productPA_PB: 0,
      sumPA_PB: 0,
      invSumPA_PB: 0,
    };
  }

  // 直线 x = x0 + t cosA, y = y0 + t sinA
  // 代入 x^2/a^2 + y^2/b^2 = 1
  // b^2 (x0 + t cosA)^2 + a^2 (y0 + t sinA)^2 = a^2 b^2
  // t^2 (b^2 cos^2 A + a^2 sin^2 A) + 2 t (b^2 x0 cosA + a^2 y0 sinA) + (b^2 x0^2 + a^2 y0^2 - a^2 b^2) = 0
  const a2 = a * a;
  const b2 = b * b;

  const A = b2 * cosA * cosA + a2 * sinA * sinA;
  const B = 2 * (b2 * x0 * cosA + a2 * y0 * sinA);
  const C = b2 * x0 * x0 + a2 * y0 * y0 - a2 * b2;

  const discriminant = B * B - 4 * A * C;

  if (discriminant < 0) {
    return {
      valid: false,
      message: "直线与椭圆无交点 (判别式 Δ < 0)",
      P0,
      alphaRad,
      Pt,
      a,
      b,
      A,
      B,
      C,
      discriminant,
      t1: 0,
      t2: 0,
      pointA: P0,
      pointB: P0,
      tM: 0,
      pointM: P0,
      chordLength: 0,
      productPA_PB: 0,
      sumPA_PB: 0,
      invSumPA_PB: 0,
    };
  }

  const sqrtDelta = Math.sqrt(discriminant);
  const t1 = (-B - sqrtDelta) / (2 * A);
  const t2 = (-B + sqrtDelta) / (2 * A);

  const pointA: Point2D = {
    x: x0 + t1 * cosA,
    y: y0 + t1 * sinA,
  };
  const pointB: Point2D = {
    x: x0 + t2 * cosA,
    y: y0 + t2 * sinA,
  };

  const tM = (t1 + t2) / 2; // -B / (2A)
  const pointM: Point2D = {
    x: x0 + tM * cosA,
    y: y0 + tM * sinA,
  };

  const chordLength = Math.abs(t1 - t2); // sqrt((t1+t2)^2 - 4 t1 t2)
  const productPA_PB = Math.abs(t1 * t2); // |C / A|

  const distPA = Math.abs(t1);
  const distPB = Math.abs(t2);
  const sumPA_PB = distPA + distPB;
  const invSumPA_PB =
    distPA > 1e-6 && distPB > 1e-6 ? 1 / distPA + 1 / distPB : 0;

  return {
    valid: true,
    P0,
    alphaRad,
    Pt,
    a,
    b,
    A,
    B,
    C,
    discriminant,
    t1,
    t2,
    pointA,
    pointB,
    tM,
    pointM,
    chordLength,
    productPA_PB,
    sumPA_PB,
    invSumPA_PB,
  };
}

/**
 * 计算椭圆参数方程及三角设点化简指标
 */
export function calculateEllipseParam(
  a: number,
  b: number,
  thetaDeg: number,
): EllipseParamResult {
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);

  const P: Point2D = { x: a * cosT, y: b * sinT };
  const Paux: Point2D = { x: a * cosT, y: a * sinT };
  const Pin: Point2D = { x: b * cosT, y: b * sinT };

  // 切线 (cosT / a) x + (sinT / b) y = 1
  const tangentA = cosT / a;
  const tangentB = sinT / b;
  const tangentC = -1;

  const interceptX = Math.abs(cosT) > 1e-6 ? a / cosT : Infinity;
  const interceptY = Math.abs(sinT) > 1e-6 ? b / sinT : Infinity;

  const triangleArea =
    isFinite(interceptX) && isFinite(interceptY)
      ? 0.5 * Math.abs(interceptX * interceptY)
      : Infinity;

  return {
    valid: true,
    a,
    b,
    thetaRad,
    P,
    Paux,
    Pin,
    tangentA,
    tangentB,
    tangentC,
    interceptX,
    interceptY,
    triangleArea,
  };
}
