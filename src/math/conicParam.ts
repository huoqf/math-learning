/**
 * 圆锥曲线参数化设点与代数降维化简纯数学模块
 * 涵盖新高考三大核心降维模型：
 * 1. 椭圆三角参数设点与辅助角极值模型 (a, b, theta)
 * 2. 抛物线单参数(纵坐标)设点与免联立割线模型 (p, y1, y2)
 * 3. 设线降维 x = my + n 与对称韦达消元模型 (a, b, m, n)
 * 4. 兼容保留：直线参数方程 t 计算接口
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface EllipseTrigResult {
  valid: boolean;
  a: number;
  b: number;
  thetaDeg: number;
  thetaRad: number;
  // 椭圆上的参数动点 P(a cos theta, b sin theta)
  P: Point2D;
  // 辅助离心圆点 P'(a cos theta, a sin theta)
  Paux: Point2D;
  // 内切圆点 P_in(b cos theta, b sin theta)
  Pin: Point2D;
  // 切线截距三角形面积
  tangentA: number;
  tangentB: number;
  interceptX: number;
  interceptY: number;
  triangleArea: number;
  // 动点到目标直线 Ax + By + C = 0 的距离极值 (例如 x - y - 6 = 0)
  targetLine: { A: number; B: number; C: number };
  distToTargetLine: number;
  /**
   * 动点 P 在目标直线上的垂足 H（即「过 P 作目标直线垂线」的落点）。
   * 中屏据此绘制「定直线 + 动态垂线段 P→H」，让右屏「点线距离」推导链与画面 100% 对应。
   * 直线系数退化（A² + B² ≈ 0）时为 null。
   */
  footOnTargetLine: Point2D | null;
  maxDist: number;
  minDist: number;
  phiRad: number; // 辅助角 phi
}

export interface ParabolaYParamResult {
  valid: boolean;
  p: number; // 焦点坐标 (p/2, 0)
  y1: number;
  y2: number;
  pointA: Point2D;
  pointB: Point2D;
  // 割线 (y1 + y2)y = 2px + y1 y2 的参数
  isTangent: boolean;
  slope: number; // k = 2p / (y1 + y2)
  xIntercept: number; // - y1 y2 / (2p)
  // 弦中点 M
  pointM: Point2D;
  // 弦长
  chordLength: number;
  // 是否过焦点 F(p/2, 0)
  isFocusChord: boolean;
  // 若过焦点，焦点弦长 x1 + x2 + p
  focusChordLength: number;
}

export interface LineYFormResult {
  valid: boolean;
  a: number;
  b: number;
  m: number; // x = my + n
  n: number;
  // 代入后关于 y 的一元二次方程 Ay^2 + By + C = 0
  A: number;
  B: number;
  C: number;
  deltaY: number;
  y1: number;
  y2: number;
  ySum: number; // y1 + y2
  yProd: number; // y1 * y2
  yDiffAbs: number; // |y1 - y2|
  pointA: Point2D;
  pointB: Point2D;
  pointM: Point2D;
  chordLength: number; // sqrt(1 + m^2) * |y1 - y2|
  triangleAreaOAB: number; // 0.5 * |n| * |y1 - y2|
}

/**
 * 1. 椭圆三角参数设点与辅助角最值计算
 */
export function calculateEllipseParam(
  a: number,
  b: number,
  thetaDeg: number,
  targetLine: { A: number; B: number; C: number } = { A: 1, B: -1, C: -6 },
): EllipseTrigResult {
  if (a <= 0 || b <= 0) {
    return {
      valid: false,
      a,
      b,
      thetaDeg,
      thetaRad: 0,
      P: { x: 0, y: 0 },
      Paux: { x: 0, y: 0 },
      Pin: { x: 0, y: 0 },
      tangentA: 0,
      tangentB: 0,
      interceptX: 0,
      interceptY: 0,
      triangleArea: 0,
      targetLine,
      distToTargetLine: 0,
      footOnTargetLine: null,
      maxDist: 0,
      minDist: 0,
      phiRad: 0,
    };
  }

  const thetaRad = (thetaDeg * Math.PI) / 180;
  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);

  // 高中课标安全契约：焦点在 x 轴的椭圆必须满足 a > b > 0。
  // 越界参数在此钳制，避免 b ≥ a 时半焦距 c = √(a²-b²) 归零、两个焦点退化重合于原点。
  const safeA = Math.max(0.1, a);
  const safeB = Math.min(Math.max(0.01, b), Math.max(0.01, safeA - 0.01));

  const P: Point2D = { x: safeA * cosT, y: safeB * sinT };
  const Paux: Point2D = { x: safeA * cosT, y: safeA * sinT };
  const Pin: Point2D = { x: safeB * cosT, y: safeB * sinT };

  // 切线 (cosT / a) x + (sinT / b) y = 1
  const tangentA = cosT / safeA;
  const tangentB = sinT / safeB;
  const interceptX = Math.abs(cosT) > 1e-6 ? safeA / cosT : Infinity;
  const interceptY = Math.abs(sinT) > 1e-6 ? safeB / sinT : Infinity;
  const triangleArea =
    isFinite(interceptX) && isFinite(interceptY)
      ? 0.5 * Math.abs(interceptX * interceptY)
      : Infinity;

  // 动点到目标直线 Ax + By + C = 0 的距离
  const { A, B, C } = targetLine;
  const denom = Math.sqrt(A * A + B * B);
  const curDist = denom > 1e-6 ? Math.abs(A * P.x + B * P.y + C) / denom : 0;

  // 垂足 H = P − [(A·Px + B·Py + C) / (A² + B²)] · (A, B)
  // 与上面的点线距离公式同源：|PH| 恰等于 curDist，故中屏垂线段长度可被右屏数值校验。
  const sqDenom = A * A + B * B;
  const footOnTargetLine: Point2D | null =
    sqDenom > 1e-12
      ? {
          x: P.x - ((A * P.x + B * P.y + C) / sqDenom) * A,
          y: P.y - ((A * P.x + B * P.y + C) / sqDenom) * B,
        }
      : null;

  // 辅助角公式：A*a*cosθ + B*b*sinθ = sqrt((A a)^2 + (B b)^2) * sin(θ + φ)
  const coefCos = A * safeA;
  const coefSin = B * safeB;
  const R = Math.sqrt(coefCos * coefCos + coefSin * coefSin);
  const phiRad = Math.atan2(coefCos, coefSin);

  let maxDist = 0;
  let minDist = 0;
  if (denom > 1e-6) {
    maxDist = (Math.abs(C) + R) / denom;
    minDist = Math.abs(Math.abs(C) - R) / denom;
    // 如果直线与椭圆相交，最小距离为 0
    if (Math.abs(C) <= R) {
      minDist = 0;
    }
  }

  return {
    valid: true,
    a: safeA,
    b: safeB,
    thetaDeg,
    thetaRad,
    P,
    Paux,
    Pin,
    tangentA,
    tangentB,
    interceptX,
    interceptY,
    triangleArea,
    targetLine,
    distToTargetLine: curDist,
    footOnTargetLine,
    maxDist,
    minDist,
    phiRad,
  };
}

/**
 * 2. 抛物线纵坐标单参数设点模型
 * y^2 = 2px，A(y1^2/(2p), y1), B(y2^2/(2p), y2)
 */
export function calculateParabolaYParam(
  p: number,
  y1: number,
  y2: number,
): ParabolaYParamResult {
  if (p <= 0) {
    const origin = { x: 0, y: 0 };
    return {
      valid: false,
      p,
      y1,
      y2,
      pointA: origin,
      pointB: origin,
      isTangent: false,
      slope: 0,
      xIntercept: 0,
      pointM: origin,
      chordLength: 0,
      isFocusChord: false,
      focusChordLength: 0,
    };
  }

  const x1 = (y1 * y1) / (2 * p);
  const x2 = (y2 * y2) / (2 * p);
  const pointA: Point2D = { x: x1, y: y1 };
  const pointB: Point2D = { x: x2, y: y2 };

  const isTangent = Math.abs(y1 - y2) < 1e-5;
  const ySum = y1 + y2;
  const yProd = y1 * y2;

  // 割线斜率 k = 2p / (y1 + y2)，若 y1 + y2 = 0 则垂直于 x 轴
  const slope = Math.abs(ySum) > 1e-6 ? (2 * p) / ySum : Infinity;
  // x 截距 (割线与 x 轴交点): 当 y = 0 时，x = - y1 y2 / (2p)
  const xIntercept = -yProd / (2 * p);

  // 弦中点 M
  const pointM: Point2D = {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };

  // 弦长 |AB| = sqrt((x1 - x2)^2 + (y1 - y2)^2)
  const dx = x1 - x2;
  const dy = y1 - y2;
  const chordLength = Math.sqrt(dx * dx + dy * dy);

  // 是否过焦点 F(p/2, 0): xIntercept ≈ p/2 <=> - y1 y2 / (2p) = p/2 <=> y1 y2 = -p^2
  const isFocusChord = Math.abs(yProd + p * p) < 0.1;
  const focusChordLength = x1 + x2 + p;

  return {
    valid: true,
    p,
    y1,
    y2,
    pointA,
    pointB,
    isTangent,
    slope,
    xIntercept,
    pointM,
    chordLength,
    isFocusChord,
    focusChordLength,
  };
}

/**
 * 3. 割线方程 x = my + n 与椭圆联立降维模型
 * x^2/a^2 + y^2/b^2 = 1 联立 x = my + n
 */
export function calculateLineYFormConic(
  a: number,
  b: number,
  m: number,
  n: number,
): LineYFormResult {
  if (a <= 0 || b <= 0) {
    const origin = { x: 0, y: 0 };
    return {
      valid: false,
      a,
      b,
      m,
      n,
      A: 0,
      B: 0,
      C: 0,
      deltaY: -1,
      y1: 0,
      y2: 0,
      ySum: 0,
      yProd: 0,
      yDiffAbs: 0,
      pointA: origin,
      pointB: origin,
      pointM: origin,
      chordLength: 0,
      triangleAreaOAB: 0,
    };
  }

  const a2 = a * a;
  const b2 = b * b;

  // (my + n)^2 / a^2 + y^2 / b^2 = 1
  // b^2(m^2 y^2 + 2mny + n^2) + a^2 y^2 - a^2 b^2 = 0
  // (b^2 m^2 + a^2) y^2 + 2 b^2 m n y + b^2(n^2 - a^2) = 0
  const A = b2 * m * m + a2;
  const B = 2 * b2 * m * n;
  const C = b2 * (n * n - a2);

  const deltaY = B * B - 4 * A * C; // = 4 a^2 b^2 (b^2 m^2 + a^2 - n^2)

  if (deltaY < 0) {
    const origin = { x: 0, y: 0 };
    return {
      valid: false,
      a,
      b,
      m,
      n,
      A,
      B,
      C,
      deltaY,
      y1: 0,
      y2: 0,
      ySum: -B / A,
      yProd: C / A,
      yDiffAbs: 0,
      pointA: origin,
      pointB: origin,
      pointM: origin,
      chordLength: 0,
      triangleAreaOAB: 0,
    };
  }

  const sqrtDelta = Math.sqrt(deltaY);
  const y1 = (-B - sqrtDelta) / (2 * A);
  const y2 = (-B + sqrtDelta) / (2 * A);

  const x1 = m * y1 + n;
  const x2 = m * y2 + n;

  const pointA: Point2D = { x: x1, y: y1 };
  const pointB: Point2D = { x: x2, y: y2 };

  const ySum = y1 + y2; // = -B / A
  const yProd = y1 * y2; // = C / A
  const yDiffAbs = Math.abs(y1 - y2); // = sqrt(deltaY) / A

  const pointM: Point2D = {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };

  // 弦长公式 |AB| = sqrt(1 + m^2) * |y1 - y2|
  const chordLength = Math.sqrt(1 + m * m) * yDiffAbs;
  // 原点三角形面积 S_OAB = 0.5 * |n| * |y1 - y2|
  const triangleAreaOAB = 0.5 * Math.abs(n) * yDiffAbs;

  return {
    valid: true,
    a,
    b,
    m,
    n,
    A,
    B,
    C,
    deltaY,
    y1,
    y2,
    ySum,
    yProd,
    yDiffAbs,
    pointA,
    pointB,
    pointM,
    chordLength,
    triangleAreaOAB,
  };
}

// -------------------------------------------------------------
// 4. 兼容保留：直线参数方程 t 计算接口（保障依赖兼容）
// -------------------------------------------------------------
export interface LineParamResult {
  valid: boolean;
  message?: string;
  P0: Point2D;
  alphaRad: number;
  Pt: Point2D;
  a: number;
  b: number;
  A: number;
  B: number;
  C: number;
  discriminant: number;
  t1: number;
  t2: number;
  pointA: Point2D;
  pointB: Point2D;
  tM: number;
  pointM: Point2D;
  chordLength: number;
  productPA_PB: number;
  sumPA_PB: number;
  invSumPA_PB: number;
}

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

  const Pt: Point2D = {
    x: x0 + t * cosA,
    y: y0 + t * sinA,
  };

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
  const pointA: Point2D = { x: x0 + t1 * cosA, y: y0 + t1 * sinA };
  const pointB: Point2D = { x: x0 + t2 * cosA, y: y0 + t2 * sinA };
  const tM = (t1 + t2) / 2;
  const pointM: Point2D = { x: x0 + tM * cosA, y: y0 + tM * sinA };
  const chordLength = Math.abs(t1 - t2);
  const productPA_PB = Math.abs(t1 * t2);
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
