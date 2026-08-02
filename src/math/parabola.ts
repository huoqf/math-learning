/**
 * src/math/parabola.ts
 * 抛物线焦点性质与准线几何纯数学计算库
 * 零 DOM / 零 React 依赖，100% 纯函数
 */

export type ParabolaDirection = "right" | "left" | "up" | "down";

export interface Point2D {
  x: number;
  y: number;
}

export interface ParabolaBaseInfo {
  p: number;
  direction: ParabolaDirection;
  isValid: boolean;
  focus: Point2D; // 焦点 F
  vertex: Point2D; // 顶点 (0,0)
  directrixIsVertical: boolean; // 准线是否为 x = c
  directrixConstant: number; // 准线常数 (x = c 或 y = c)
  latusRectum: number; // 通径长度 2p
}

export interface FocalRadiusInfo {
  P: Point2D;
  F: Point2D;
  H: Point2D; // 准线上的垂足
  focalRadius: number; // |PF|
  directrixDistance: number; // d(P, l)
  isEqual: boolean; // |PF| == d(P, l)
}

export interface FocalChordInfo {
  thetaDeg: number;
  thetaRad: number;
  F: Point2D;
  A: Point2D;
  B: Point2D;
  lengthAB: number; // |AB|
  lengthAF: number; // |AF|
  lengthBF: number; // |BF|
  harmonicSum: number; // 1/AF + 1/BF
  expectedHarmonicSum: number; // 2/p
  prodY: number; // y1 * y2 (若适用)
  prodX: number; // x1 * x2 (若适用)
  midCircle: {
    center: Point2D;
    radius: number;
    distToDirectrix: number;
    isTangentToDirectrix: boolean;
  };
}

export interface TangentOpticalInfo {
  P: Point2D;
  F: Point2D;
  H: Point2D;
  tangentSlope: number; // 切线斜率 (可能 Infinity)
  tangentLine: { A: number; B: number; C: number }; // Ax + By + C = 0
  axisIntercept: Point2D; // 切线在对称轴上的截距点
  reflectedDir: Point2D; // 反射光线方向向量
  isParallelToAxis: boolean;
}

export interface DirectrixMongeInfo {
  Q: Point2D; // 准线上点
  A: Point2D; // 切点 A
  B: Point2D; // 切点 B
  slopeQA: number;
  slopeQB: number;
  isPerpendicular: boolean; // QA ⊥ QB
  chordLine: { A: number; B: number; C: number }; // 切点弦 AB 直线
  chordPassesFocus: boolean; // 是否过焦点 F
}

/**
 * 获取抛物线基础几何属性
 */
export function getParabolaBaseInfo(
  p: number,
  direction: ParabolaDirection = "right",
): ParabolaBaseInfo {
  const isValid = p > 0 && Number.isFinite(p);
  const safeP = isValid ? p : 1;

  let focus: Point2D = { x: safeP / 2, y: 0 };
  let directrixIsVertical = true;
  let directrixConstant = -safeP / 2;

  switch (direction) {
    case "right":
      focus = { x: safeP / 2, y: 0 };
      directrixIsVertical = true;
      directrixConstant = -safeP / 2;
      break;
    case "left":
      focus = { x: -safeP / 2, y: 0 };
      directrixIsVertical = true;
      directrixConstant = safeP / 2;
      break;
    case "up":
      focus = { x: 0, y: safeP / 2 };
      directrixIsVertical = false;
      directrixConstant = -safeP / 2;
      break;
    case "down":
      focus = { x: 0, y: -safeP / 2 };
      directrixIsVertical = false;
      directrixConstant = safeP / 2;
      break;
  }

  return {
    p: safeP,
    direction,
    isValid,
    focus,
    vertex: { x: 0, y: 0 },
    directrixIsVertical,
    directrixConstant,
    latusRectum: 2 * safeP,
  };
}

/**
 * 根据自由参数 t 求解抛物线上的点坐标 P
 * @param t 自由参数 (对 right/left 为 y 坐标，对 up/down 为 x 坐标)
 */
export function getPointOnParabola(
  t: number,
  p: number,
  direction: ParabolaDirection = "right",
): Point2D {
  const safeP = p > 0 ? p : 1;
  switch (direction) {
    case "right":
      return { x: (t * t) / (2 * safeP), y: t };
    case "left":
      return { x: -(t * t) / (2 * safeP), y: t };
    case "up":
      return { x: t, y: (t * t) / (2 * safeP) };
    case "down":
      return { x: t, y: -(t * t) / (2 * safeP) };
  }
}

/**
 * 计算焦半径与准线投影距离
 */
export function getFocalRadiusInfo(
  P: Point2D,
  p: number,
  direction: ParabolaDirection = "right",
): FocalRadiusInfo {
  const base = getParabolaBaseInfo(p, direction);
  const F = base.focus;

  const focalRadius = Math.hypot(P.x - F.x, P.y - F.y);

  let H: Point2D = { x: 0, y: 0 };
  let directrixDistance = 0;

  if (base.directrixIsVertical) {
    H = { x: base.directrixConstant, y: P.y };
    directrixDistance = Math.abs(P.x - base.directrixConstant);
  } else {
    H = { x: P.x, y: base.directrixConstant };
    directrixDistance = Math.abs(P.y - base.directrixConstant);
  }

  const isEqual = Math.abs(focalRadius - directrixDistance) < 1e-5;

  return {
    P,
    F,
    H,
    focalRadius,
    directrixDistance,
    isEqual,
  };
}

/**
 * 计算焦点弦几何性质
 * @param thetaDeg 焦点弦倾斜角（角度制）
 */
export function getFocalChordInfo(
  thetaDeg: number,
  p: number,
  direction: ParabolaDirection = "right",
): FocalChordInfo {
  const base = getParabolaBaseInfo(p, direction);
  const safeP = base.p;
  const F = base.focus;

  // 将 theta 规范到 (0, 180) 排除平行对称轴情况
  let thetaRad = (thetaDeg * Math.PI) / 180;
  // 避开 0 和 Math.PI
  if (Math.abs(Math.sin(thetaRad)) < 1e-4) {
    thetaRad = 1e-4;
  }

  const sinT = Math.sin(thetaRad);
  const cosT = Math.cos(thetaRad);

  let A: Point2D = { x: 0, y: 0 };
  let B: Point2D = { x: 0, y: 0 };

  if (direction === "right") {
    // 直线过 F(p/2, 0): x = p/2 + r cos(theta), y = r sin(theta)
    // 带入 y^2 = 2px: r^2 sin^2(theta) - 2p r cos(theta) - p^2 = 0
    // r1, r2 是带有方向的根: r^2 sin^2(T) - 2p cos(T) r - p^2 = 0
    const aCoeff = sinT * sinT;
    const bCoeff = -2 * safeP * cosT;
    const cCoeff = -safeP * safeP;
    const delta = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
    const sqrtD = Math.sqrt(Math.max(0, delta));

    const r1 = (-bCoeff + sqrtD) / (2 * aCoeff);
    const r2 = (-bCoeff - sqrtD) / (2 * aCoeff);

    A = { x: F.x + r1 * cosT, y: F.y + r1 * sinT };
    B = { x: F.x + r2 * cosT, y: F.y + r2 * sinT };
  } else if (direction === "left") {
    const aCoeff = sinT * sinT;
    const bCoeff = 2 * safeP * cosT;
    const cCoeff = -safeP * safeP;
    const delta = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
    const sqrtD = Math.sqrt(Math.max(0, delta));

    const r1 = (-bCoeff + sqrtD) / (2 * aCoeff);
    const r2 = (-bCoeff - sqrtD) / (2 * aCoeff);

    A = { x: F.x + r1 * cosT, y: F.y + r1 * sinT };
    B = { x: F.x + r2 * cosT, y: F.y + r2 * sinT };
  } else if (direction === "up") {
    // F(0, p/2), 直线: y = p/2 + r sin(theta), x = r cos(theta)
    // x^2 = 2py => r^2 cos^2(theta) - 2p r sin(theta) - p^2 = 0
    const cosT_safe = Math.abs(cosT) < 1e-4 ? 1e-4 : cosT;
    const aCoeff = cosT_safe * cosT_safe;
    const bCoeff = -2 * safeP * sinT;
    const cCoeff = -safeP * safeP;
    const delta = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
    const sqrtD = Math.sqrt(Math.max(0, delta));

    const r1 = (-bCoeff + sqrtD) / (2 * aCoeff);
    const r2 = (-bCoeff - sqrtD) / (2 * aCoeff);

    A = { x: F.x + r1 * cosT_safe, y: F.y + r1 * sinT };
    B = { x: F.x + r2 * cosT_safe, y: F.y + r2 * sinT };
  } else {
    // down
    const cosT_safe = Math.abs(cosT) < 1e-4 ? 1e-4 : cosT;
    const aCoeff = cosT_safe * cosT_safe;
    const bCoeff = 2 * safeP * sinT;
    const cCoeff = -safeP * safeP;
    const delta = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
    const sqrtD = Math.sqrt(Math.max(0, delta));

    const r1 = (-bCoeff + sqrtD) / (2 * aCoeff);
    const r2 = (-bCoeff - sqrtD) / (2 * aCoeff);

    A = { x: F.x + r1 * cosT_safe, y: F.y + r1 * sinT };
    B = { x: F.x + r2 * cosT_safe, y: F.y + r2 * sinT };
  }

  const lengthAF = Math.hypot(A.x - F.x, A.y - F.y);
  const lengthBF = Math.hypot(B.x - F.x, B.y - F.y);
  const lengthAB = lengthAF + lengthBF;

  const harmonicSum = 1 / lengthAF + 1 / lengthBF;
  const expectedHarmonicSum = 2 / safeP;

  const prodY = A.y * B.y;
  const prodX = A.x * B.x;

  // 以 AB 为直径的圆
  const midCenter: Point2D = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const radius = lengthAB / 2;
  const distToDirectrix = base.directrixIsVertical
    ? Math.abs(midCenter.x - base.directrixConstant)
    : Math.abs(midCenter.y - base.directrixConstant);

  const isTangentToDirectrix = Math.abs(distToDirectrix - radius) < 1e-4;

  return {
    thetaDeg,
    thetaRad,
    F,
    A,
    B,
    lengthAB,
    lengthAF,
    lengthBF,
    harmonicSum,
    expectedHarmonicSum,
    prodY,
    prodX,
    midCircle: {
      center: midCenter,
      radius,
      distToDirectrix,
      isTangentToDirectrix,
    },
  };
}

/**
 * 计算切线方程与光学反射性质
 */
export function getTangentAndOpticalInfo(
  P: Point2D,
  p: number,
  direction: ParabolaDirection = "right",
): TangentOpticalInfo {
  const base = getParabolaBaseInfo(p, direction);
  const safeP = base.p;
  const F = base.focus;
  const radiusInfo = getFocalRadiusInfo(P, safeP, direction);
  const H = radiusInfo.H;

  let tangentSlope = 0;
  let tangentLine = { A: 0, B: 0, C: 0 };
  let axisIntercept: Point2D = { x: 0, y: 0 };

  if (direction === "right") {
    // y0 * y = p (x + x0) => p x - y0 y + p x0 = 0
    if (Math.abs(P.y) < 1e-6) {
      tangentSlope = Infinity; // 顶点处切线为垂直线 x = 0
      tangentLine = { A: 1, B: 0, C: 0 };
      axisIntercept = { x: 0, y: 0 };
    } else {
      tangentSlope = safeP / P.y;
      tangentLine = { A: safeP, B: -P.y, C: safeP * P.x };
      axisIntercept = { x: -P.x, y: 0 };
    }
  } else if (direction === "left") {
    if (Math.abs(P.y) < 1e-6) {
      tangentSlope = Infinity;
      tangentLine = { A: 1, B: 0, C: 0 };
      axisIntercept = { x: 0, y: 0 };
    } else {
      tangentSlope = -safeP / P.y;
      tangentLine = { A: -safeP, B: -P.y, C: -safeP * P.x };
      axisIntercept = { x: -P.x, y: 0 };
    }
  } else if (direction === "up") {
    // x0 * x = p (y + y0) => x0 x - p y - p y0 = 0
    tangentSlope = P.x / safeP;
    tangentLine = { A: P.x, B: -safeP, C: -safeP * P.y };
    axisIntercept = { x: 0, y: -P.y };
  } else {
    // down
    tangentSlope = -P.x / safeP;
    tangentLine = { A: -P.x, B: -safeP, C: safeP * P.y };
    axisIntercept = { x: 0, y: -P.y };
  }

  // 反射光线：焦点发出的光线经抛物线 P 反射后平行于抛物线对称轴
  let reflectedDir: Point2D = { x: 1, y: 0 };
  if (direction === "right") reflectedDir = { x: 1, y: 0 };
  else if (direction === "left") reflectedDir = { x: -1, y: 0 };
  else if (direction === "up") reflectedDir = { x: 0, y: 1 };
  else reflectedDir = { x: 0, y: -1 };

  return {
    P,
    F,
    H,
    tangentSlope,
    tangentLine,
    axisIntercept,
    reflectedDir,
    isParallelToAxis: true,
  };
}

/**
 * 准线上任意一点 Q 引两条切线 QA, QB
 * 验证 QA ⊥ QB，且切点弦 AB 必过焦点 F
 */
export function getDirectrixMongeInfo(
  qParam: number, // 准线上的坐标参数 (若准线垂直，则为 yQ；若准线水平，则为 xQ)
  p: number,
  direction: ParabolaDirection = "right",
): DirectrixMongeInfo {
  const base = getParabolaBaseInfo(p, direction);
  const safeP = base.p;
  const F = base.focus;

  let Q: Point2D = { x: 0, y: 0 };
  let A: Point2D = { x: 0, y: 0 };
  let B: Point2D = { x: 0, y: 0 };

  if (direction === "right") {
    // 准线 x = -p/2, Q(-p/2, qParam)
    Q = { x: -safeP / 2, y: qParam };
    // 过 Q(-p/2, yQ) 引 y^2 = 2px 的切线
    // 切点弦 AB 的方程为: yQ y = p (x - p/2) => p x - yQ y - p^2/2 = 0
    // 与 y^2 = 2px 联立: (p x - p^2/2)^2 / yQ^2 ...
    // 切点 A, B 的 y 坐标是 y^2 - 2 yQ y + p^2 = 0 的两个根！
    // Δ = 4 yQ^2 - 4 p^2
    const yQ = qParam;
    const delta = 4 * yQ * yQ + 4 * safeP * safeP; // 注意: 是 4 yQ^2 + 4 p^2 (恒正!)
    const sqrtD = Math.sqrt(delta);

    const yA = (2 * yQ + sqrtD) / 2;
    const yB = (2 * yQ - sqrtD) / 2;

    A = { x: (yA * yA) / (2 * safeP), y: yA };
    B = { x: (yB * yB) / (2 * safeP), y: yB };
  } else if (direction === "left") {
    // 准线 x = p/2, Q(p/2, qParam)
    Q = { x: safeP / 2, y: qParam };
    const yQ = qParam;
    const delta = 4 * yQ * yQ + 4 * safeP * safeP;
    const sqrtD = Math.sqrt(delta);

    const yA = (2 * yQ + sqrtD) / 2;
    const yB = (2 * yQ - sqrtD) / 2;

    A = { x: -(yA * yA) / (2 * safeP), y: yA };
    B = { x: -(yB * yB) / (2 * safeP), y: yB };
  } else if (direction === "up") {
    // 准线 y = -p/2, Q(qParam, -p/2)
    Q = { x: qParam, y: -safeP / 2 };
    const xQ = qParam;
    const delta = 4 * xQ * xQ + 4 * safeP * safeP;
    const sqrtD = Math.sqrt(delta);

    const xA = (2 * xQ + sqrtD) / 2;
    const xB = (2 * xQ - sqrtD) / 2;

    A = { x: xA, y: (xA * xA) / (2 * safeP) };
    B = { x: xB, y: (xB * xB) / (2 * safeP) };
  } else {
    // down: 准线 y = p/2, Q(qParam, p/2)
    Q = { x: qParam, y: safeP / 2 };
    const xQ = qParam;
    const delta = 4 * xQ * xQ + 4 * safeP * safeP;
    const sqrtD = Math.sqrt(delta);

    const xA = (2 * xQ + sqrtD) / 2;
    const xB = (2 * xQ - sqrtD) / 2;

    A = { x: xA, y: -(xA * xA) / (2 * safeP) };
    B = { x: xB, y: -(xB * xB) / (2 * safeP) };
  }

  const slopeQA = Math.abs(A.x - Q.x) < 1e-6 ? 1e6 : (A.y - Q.y) / (A.x - Q.x);
  const slopeQB = Math.abs(B.x - Q.x) < 1e-6 ? 1e6 : (B.y - Q.y) / (B.x - Q.x);

  // 验证 kQA * kQB = -1
  const kProd = slopeQA * slopeQB;
  const isPerpendicular = Math.abs(kProd + 1) < 1e-4;

  // 切点弦 AB 的直线方程 Ax + By + C = 0
  const lineA = B.y - A.y;
  const lineB = A.x - B.x;
  const lineC = B.x * A.y - A.x * B.y;

  // 验证 F(Fx, Fy) 是否在直线上 A Fx + B Fy + C == 0
  const distF = Math.abs(lineA * F.x + lineB * F.y + lineC);
  const chordPassesFocus = distF < 1e-4;

  return {
    Q,
    A,
    B,
    slopeQA,
    slopeQB,
    isPerpendicular,
    chordLine: { A: lineA, B: lineB, C: lineC },
    chordPassesFocus,
  };
}
