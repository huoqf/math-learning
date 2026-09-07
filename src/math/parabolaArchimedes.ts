/**
 * src/math/parabolaArchimedes.ts
 * 抛物线焦点弦性质与阿基米德三角形数学计算核心库
 * 零 DOM / 零 React 依赖，100% 纯函数
 *
 * 核心模型：以新高考解析几何标准型 y^2 = 2px (p > 0) 为基准
 * 焦点 F(p/2, 0)，准线 l: x = -p/2
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface LineCoeffs {
  A: number;
  B: number;
  C: number; // Ax + By + C = 0
}

/**
 * 抛物线基准几何信息
 */
export interface ParabolaArchimedesBase {
  p: number; // 焦准距 (p > 0)
  focus: Point2D; // 焦点 F(p/2, 0)
  vertex: Point2D; // 顶点 O(0, 0)
  directrixX: number; // 准线 x = -p/2
  latusRectum: number; // 通径长 2p
}

/**
 * 阿基米德三角形与正交切线核心信息
 * 点 Q(-p/2, yQ) 在准线上，引两条切线 QA, QB
 */
export interface ArchimedesTriangleInfo {
  Q: Point2D; // 准线上外点 (-p/2, yQ)
  A: Point2D; // 切点 A (上半支或对应点)
  B: Point2D; // 切点 B (下半支或对应点)
  kQA: number; // 切线 QA 斜率
  kQB: number; // 切线 QB 斜率
  isPerpendicular: boolean; // QA ⊥ QB (kQA * kQB == -1)
  chordLine: LineCoeffs; // 切点弦 AB 方程
  chordPassesFocus: boolean; // 切点弦必过焦点 F
  isQFPerpAB: boolean; // QF ⊥ AB (两垂直连线)
  M: Point2D; // 弦 AB 中点 ((xA+xB)/2, (yA+yB)/2)
  P0: Point2D; // 中线 QM 与抛物线弧的交点
  isP0MidpointOfQM: boolean; // P0 恰为 QM 中点 (抛物线平分中线)
  areaQAB: number; // 阿基米德三角形 QAB 面积
  areaParabolicSegment: number; // 抛物线与弦 AB 围成的弓形面积 (恰为 2/3 S_QAB)
  minArea: number; // 面积最小值 p^2
}

/**
 * 焦点弦高级性质与相切圆信息
 * 过焦点 F(p/2, 0)，倾斜角 θ (θ ∈ (0°, 180°))
 */
export interface FocalChordAdvInfo {
  thetaDeg: number;
  thetaRad: number;
  F: Point2D;
  A: Point2D;
  B: Point2D;
  lengthAB: number; // 弦长 |AB| = 2p / sin^2(θ)
  lengthAF: number; // 焦半径 |AF| = xA + p/2
  lengthBF: number; // 焦半径 |BF| = xB + p/2
  focalRatio: number; // 焦半径比值 λ = |AF| / |BF|
  harmonicSum: number; // 1/|AF| + 1/|BF|
  harmonicSumConst: number; // 定值 2/p
  prodY: number; // yA * yB = -p^2
  prodX: number; // xA * xB = p^2 / 4
  midpointM: Point2D; // 弦 AB 中点
  directrixTangentCircle: {
    center: Point2D; // M
    radius: number; // |AB| / 2
    tangentPointK: Point2D; // 准线切点 K(-p/2, yM)
    distToDirectrix: number;
    isTangent: boolean;
  };
  vertexTangentCircleA: {
    center: Point2D; // AF 中点
    radius: number; // |AF| / 2
    isTangentToYAxis: boolean; // 是否与 y 轴相切
  };
  vertexTangentCircleB: {
    center: Point2D; // BF 中点
    radius: number; // |BF| / 2
    isTangentToYAxis: boolean; // 是否与 y 轴相切
  };
}

/**
 * 互相垂直的两条焦点弦性质
 * AB ⊥ CD，倾角分别为 θ 和 θ + 90°
 */
export interface OrthogonalChordsInfo {
  thetaDeg: number;
  chordAB: FocalChordAdvInfo;
  chordCD: FocalChordAdvInfo;
  harmonicSumChords: number; // 1/|AB| + 1/|CD|
  harmonicSumConst: number; // 定值 1/(2p)
  sumLengths: number; // |AB| + |CD|
  minSumLengths: number; // 最小和 8p (θ = 45°)
  quadrilateralArea: number; // 四边形 ACBD 面积 1/2 |AB| |CD|
  minArea: number; // 最小面积 8p^2 (θ = 45°)
}

/**
 * 计算抛物线基准几何信息
 */
export function getParabolaArchimedesBase(p: number): ParabolaArchimedesBase {
  const safeP = p > 0 && Number.isFinite(p) ? p : 2;
  return {
    p: safeP,
    focus: { x: safeP / 2, y: 0 },
    vertex: { x: 0, y: 0 },
    directrixX: -safeP / 2,
    latusRectum: 2 * safeP,
  };
}

/**
 * 模式 1：计算阿基米德三角形及其性质
 * @param p 焦准距 (p > 0)
 * @param yQ 准线上外点 Q 的纵坐标
 */
export function getArchimedesTriangleInfo(
  p: number,
  yQ: number,
): ArchimedesTriangleInfo {
  const safeP = p > 0 && Number.isFinite(p) ? p : 2;
  const Q: Point2D = { x: -safeP / 2, y: yQ };
  const F: Point2D = { x: safeP / 2, y: 0 };

  // 过 Q(-p/2, yQ) 引 y^2 = 2px 的切线
  // 设切点为 (y0^2/(2p), y0)，切线方程为 y0 y = p(x + y0^2/(2p))
  // 代入点 Q(-p/2, yQ): y0 yQ = p(-p/2 + y0^2/(2p)) = -p^2/2 + y0^2 / 2
  // 整理得二次方程: y0^2 - 2 yQ y0 - p^2 = 0
  // 判别式 Δ = 4 yQ^2 + 4 p^2 > 0 恒成立！
  const delta = 4 * yQ * yQ + 4 * safeP * safeP;
  const sqrtD = Math.sqrt(delta);

  const yA = (2 * yQ + sqrtD) / 2;
  const yB = (2 * yQ - sqrtD) / 2;

  const xA = (yA * yA) / (2 * safeP);
  const xB = (yB * yB) / (2 * safeP);

  const A: Point2D = { x: xA, y: yA };
  const B: Point2D = { x: xB, y: yB };

  // 切线斜率: y0 y = p x + p x0 => 斜率 k = p / y0
  const kQA = Math.abs(yA) < 1e-7 ? 1e7 : safeP / yA;
  const kQB = Math.abs(yB) < 1e-7 ? 1e7 : safeP / yB;
  const kProd = kQA * kQB;
  // 理论值: (p/yA)*(p/yB) = p^2 / (yA*yB) = p^2 / (-p^2) = -1
  const isPerpendicular = Math.abs(kProd + 1) < 1e-4;

  // 切点弦 AB 方程: (yA - yB) x - (xA - xB) y + (xA yB - xB yA) = 0
  // 由弦方程可推导: yQ y = p(x - p/2) => p x - yQ y - p^2/2 = 0
  const chordA = safeP;
  const chordB = -yQ;
  const chordC = -(safeP * safeP) / 2;

  // 验证焦点 F(p/2, 0) 在直线上: p*(p/2) - yQ*0 - p^2/2 = 0 恒等！
  const distF = Math.abs(chordA * F.x + chordB * F.y + chordC);
  const chordPassesFocus = distF < 1e-5;

  // 验证 QF ⊥ AB:
  // 向量 QF = (p, -yQ)
  // 直线 AB 的方向向量为 (yQ, p)
  // 数量积: p * yQ + (-yQ) * p = 0 恒成立！
  const isQFPerpAB = true;

  // 弦 AB 中点 M
  const M: Point2D = {
    x: (xA + xB) / 2,
    y: (yA + yB) / 2, // 恰好等于 yQ！因为 yA + yB = 2 yQ
  };

  // QM 中线与抛物线交点 P0:
  // QM 是水平线 y = yQ
  // 与 y^2 = 2px 联立 => xP0 = yQ^2 / (2p), yP0 = yQ
  const P0: Point2D = {
    x: (yQ * yQ) / (2 * safeP),
    y: yQ,
  };

  // 检验 P0 是否为 QM 中点:
  // xQ = -p/2, xM = (xA+xB)/2 = (yA^2 + yB^2)/(4p) = ((yA+yB)^2 - 2yA yB)/(4p) = (4 yQ^2 + 2 p^2)/(4p) = yQ^2/p + p/2
  // (xQ + xM)/2 = (-p/2 + yQ^2/p + p/2) / 2 = yQ^2 / (2p) = xP0！
  const midQM_x = (Q.x + M.x) / 2;
  const isP0MidpointOfQM = Math.abs(P0.x - midQM_x) < 1e-4;

  // 阿基米德三角形 QAB 面积:
  // 底为水平线段 QM, 长度为 xM - xQ = yQ^2/p + p
  // 顶点 A, B 到 QM 的垂直距离分别为 |yA - yQ| 与 |yB - yQ|
  // S_QAB = 1/2 * (xM - xQ) * |yA - yB| = (yA - yB)^3 / (8p)
  const dy = Math.abs(yA - yB); // sqrt(4 yQ^2 + 4 p^2) = 2 sqrt(yQ^2 + p^2)
  const areaQAB = (dy * dy * dy) / (8 * safeP);

  // 抛物线弓形面积: 阿基米德定理 2/3 S_QAB
  const areaParabolicSegment = (2 / 3) * areaQAB;

  // 当 yQ = 0 (通径切线) 时取得最小值: dy_min = 2p, S_min = (8p^3)/(8p) = p^2
  const minArea = safeP * safeP;

  return {
    Q,
    A,
    B,
    kQA,
    kQB,
    isPerpendicular,
    chordLine: { A: chordA, B: chordB, C: chordC },
    chordPassesFocus,
    isQFPerpAB,
    M,
    P0,
    isP0MidpointOfQM,
    areaQAB,
    areaParabolicSegment,
    minArea,
  };
}

/**
 * 模式 2：计算焦点弦高级几何性质与准线切圆
 * @param p 焦准距
 * @param thetaDeg 焦点弦倾斜角 (15° ~ 165°)
 */
export function getFocalChordAdvInfo(
  p: number,
  thetaDeg: number,
): FocalChordAdvInfo {
  const safeP = p > 0 && Number.isFinite(p) ? p : 2;
  const F: Point2D = { x: safeP / 2, y: 0 };

  // 限制倾斜角避免与对称轴平行
  let theta = thetaDeg;
  if (theta <= 5) theta = 5;
  if (theta >= 175) theta = 175;
  const thetaRad = (theta * Math.PI) / 180;

  const sinT = Math.sin(thetaRad);
  const cosT = Math.cos(thetaRad);

  // 参数方程法: 直线 x = p/2 + r cos(θ), y = r sin(θ)
  // 代入 y^2 = 2px: r^2 sin^2(θ) - 2p cos(θ) r - p^2 = 0
  const aCoeff = sinT * sinT;
  const bCoeff = -2 * safeP * cosT;
  const cCoeff = -safeP * safeP;
  const delta = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
  const sqrtD = Math.sqrt(Math.max(0, delta));

  const r1 = (-bCoeff + sqrtD) / (2 * aCoeff); // > 0 对应 A
  const r2 = (-bCoeff - sqrtD) / (2 * aCoeff); // < 0 对应 B

  const A: Point2D = { x: F.x + r1 * cosT, y: F.y + r1 * sinT };
  const B: Point2D = { x: F.x + r2 * cosT, y: F.y + r2 * sinT };

  // 焦半径 |AF| = r1, |BF| = -r2
  const lengthAF = r1;
  const lengthBF = Math.abs(r2);
  const lengthAB = lengthAF + lengthBF; // = 2p / sin^2(θ)

  const focalRatio = lengthAF / lengthBF;

  // 调和倒数和: 1/AF + 1/BF = 2/p
  const harmonicSum = 1 / lengthAF + 1 / lengthBF;
  const harmonicSumConst = 2 / safeP;

  const prodY = A.y * B.y; // 恒等于 -p^2
  const prodX = A.x * B.x; // 恒等于 p^2 / 4

  // 弦中点 M
  const midpointM: Point2D = {
    x: (A.x + B.x) / 2,
    y: (A.y + B.y) / 2,
  };

  // 以 AB 为直径的圆: 圆心 M, 半径 R = |AB| / 2
  const radius = lengthAB / 2;
  const directrixX = -safeP / 2;
  // M 到准线的距离 d = xM - (-p/2) = xM + p/2
  // 由解析几何: xM = (xA + xB) / 2, 又 |AB| = |AF| + |BF| = xA + p/2 + xB + p/2 = xA + xB + p
  // 所以 R = |AB| / 2 = (xA + xB + p) / 2 = xM + p/2 = d(M, l) 恒成立！
  const distToDirectrix = midpointM.x - directrixX;
  const tangentPointK: Point2D = { x: directrixX, y: midpointM.y };
  const isTangent = Math.abs(distToDirectrix - radius) < 1e-4;

  // 以焦半径 AF 为直径的圆: 圆心 ((xA+xF)/2, yA/2), 半径 |AF|/2 = (xA + p/2)/2
  // 圆心横坐标 = (xA + p/2)/2 = 半径 R_A => 必与 y 轴相切！
  const isTangentToYAxisA = true;
  const isTangentToYAxisB = true;

  return {
    thetaDeg: theta,
    thetaRad,
    F,
    A,
    B,
    lengthAB,
    lengthAF,
    lengthBF,
    focalRatio,
    harmonicSum,
    harmonicSumConst,
    prodY,
    prodX,
    midpointM,
    directrixTangentCircle: {
      center: midpointM,
      radius,
      tangentPointK,
      distToDirectrix,
      isTangent,
    },
    vertexTangentCircleA: {
      center: { x: (A.x + F.x) / 2, y: (A.y + F.y) / 2 },
      radius: lengthAF / 2,
      isTangentToYAxis: isTangentToYAxisA,
    },
    vertexTangentCircleB: {
      center: { x: (B.x + F.x) / 2, y: (B.y + F.y) / 2 },
      radius: lengthBF / 2,
      isTangentToYAxis: isTangentToYAxisB,
    },
  };
}

/**
 * 模式 3：计算互相垂直的两条焦点弦
 * @param p 焦准距
 * @param thetaDeg 第一条焦点弦倾角 (15° ~ 75°)
 */
export function getOrthogonalChordsInfo(
  p: number,
  thetaDeg: number,
): OrthogonalChordsInfo {
  const safeP = p > 0 && Number.isFinite(p) ? p : 2;

  // 限制 theta 在 (15°, 75°) 使得第二条垂直弦都在合法范围内
  let theta = thetaDeg;
  if (theta < 15) theta = 15;
  if (theta > 75) theta = 75;

  const chordAB = getFocalChordAdvInfo(safeP, theta);
  const chordCD = getFocalChordAdvInfo(safeP, theta + 90);

  // 弦长倒数和: 1/|AB| + 1/|CD| = sin^2(θ)/(2p) + cos^2(θ)/(2p) = 1/(2p) 恒等定值！
  const harmonicSumChords = 1 / chordAB.lengthAB + 1 / chordCD.lengthAB;
  const harmonicSumConst = 1 / (2 * safeP);

  // 弦长之和: |AB| + |CD| = 2p/sin^2(θ) + 2p/cos^2(θ) = 8p / sin^2(2θ) >= 8p
  const sumLengths = chordAB.lengthAB + chordCD.lengthAB;
  const minSumLengths = 8 * safeP;

  // 四边形 ACBD 面积: 由于对角线互相垂直 AB ⊥ CD，S = 1/2 * |AB| * |CD|
  // S = 1/2 * (2p/sin^2 θ) * (2p/cos^2 θ) = 8p^2 / sin^2(2θ) >= 8p^2
  const quadrilateralArea = 0.5 * chordAB.lengthAB * chordCD.lengthAB;
  const minArea = 8 * safeP * safeP;

  return {
    thetaDeg: theta,
    chordAB,
    chordCD,
    harmonicSumChords,
    harmonicSumConst,
    sumLengths,
    minSumLengths,
    quadrilateralArea,
    minArea,
  };
}
