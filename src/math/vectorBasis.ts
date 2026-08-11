/**
 * 平面向量基本定理与基底分解 - 纯数学计算层
 * 严格保持无副作用与零 DOM/React 依赖
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface VectorBasisInput {
  // 基底 e1 (e1x, e1y)
  e1x: number;
  e1y: number;
  // 基底 e2 (e2x, e2y)
  e2x: number;
  e2y: number;
  // 目标向量 a (ax, ay)
  ax: number;
  ay: number;
  // 正交模式下的角度 theta (rad 或 deg)
  thetaDeg?: number;
  // 三点共线与等系数线参数
  xCoeff?: number;
  yCoeff?: number;
  // 三角形分割点比率 t (0~1)
  ratioT?: number;
}

export interface VectorBasisResult {
  // 基底点坐标
  e1: Point2D;
  e2: Point2D;
  // 目标向量终点坐标
  target: Point2D;
  // 行列式 D = e1x * e2y - e1y * e2x
  det: number;
  // 是否退化（基底共线/平行）
  isCollinear: boolean;
  // 分解系数 lambda (针对 e1), mu (针对 e2)
  lambda: number;
  mu: number;
  // 分解中间点 P1 = lambda * e1, P2 = mu * e2
  p1: Point2D;
  p2: Point2D;
  // 向量模长
  modE1: number;
  modE2: number;
  modTarget: number;
  // 基底夹角 (rad, deg)
  angleRad: number;
  angleDeg: number;

  // 正交模式相关
  orthoE1: Point2D;
  orthoE2: Point2D;
  orthoLambda: number;
  orthoMu: number;

  // 三点共线模式相关
  sumCoeff: number; // x + y
  isSumOne: boolean; // |x + y - 1| < 1e-4
  collinearPoint: Point2D; // P = x*A + y*B
  eqLineStart: Point2D; // 等系数线端点 1
  eqLineEnd: Point2D; // 等系数线端点 2

  // 三角形几何模式相关
  midpoint: Point2D; // AB 中点 M
  centroid: Point2D; // OAB 重心 G
  divisionPoint: Point2D; // P = (1-t)A + tB
}

/**
 * 向量二维交叉乘积（外积 / 2D 行列式）
 */
export function crossProduct2D(u: Point2D, v: Point2D): number {
  return u.x * v.y - u.y * v.x;
}

/**
 * 向量点积
 */
export function dotProduct2D(u: Point2D, v: Point2D): number {
  return u.x * v.x + u.y * v.y;
}

/**
 * 向量模长
 */
export function vectorMagnitude(v: Point2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * 计算平面向量基底分解的核心纯函数
 */
export function computeVectorBasis(input: VectorBasisInput): VectorBasisResult {
  const e1: Point2D = { x: input.e1x, y: input.e1y };
  const e2: Point2D = { x: input.e2x, y: input.e2y };
  const target: Point2D = { x: input.ax, y: input.ay };

  const modE1 = vectorMagnitude(e1);
  const modE2 = vectorMagnitude(e2);
  const modTarget = vectorMagnitude(target);

  // 基底夹角
  const dotE1E2 = dotProduct2D(e1, e2);
  const cosAngle = modE1 > 1e-6 && modE2 > 1e-6 ? dotE1E2 / (modE1 * modE2) : 1;
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const angleRad = Math.acos(clampedCos);
  const angleDeg = (angleRad * 180) / Math.PI;

  // 2D 行列式 (外积) D = e1x * e2y - e1y * e2x
  const det = crossProduct2D(e1, e2);
  const isCollinear = Math.abs(det) < 1e-4 || modE1 < 1e-4 || modE2 < 1e-4;

  let lambda = 0;
  let mu = 0;

  if (!isCollinear) {
    // 克拉默法则求解二元一次方程组:
    // e1x * lambda + e2x * mu = ax
    // e1y * lambda + e2y * mu = ay
    lambda = (target.x * e2.y - target.y * e2.x) / det;
    mu = (e1.x * target.y - e1.y * target.x) / det;
  }

  // 四舍五入避免浮点数显示长尾
  lambda = Math.round(lambda * 1000) / 1000;
  mu = Math.round(mu * 1000) / 1000;

  const p1: Point2D = { x: lambda * e1.x, y: lambda * e1.y };
  const p2: Point2D = { x: mu * e2.x, y: mu * e2.y };

  // --- 正交基底模式计算 ---
  const thetaRad = ((input.thetaDeg ?? 0) * Math.PI) / 180;
  const orthoE1: Point2D = { x: Math.cos(thetaRad), y: Math.sin(thetaRad) };
  const orthoE2: Point2D = { x: -Math.sin(thetaRad), y: Math.cos(thetaRad) };
  const orthoLambda = Math.round(dotProduct2D(target, orthoE1) * 1000) / 1000;
  const orthoMu = Math.round(dotProduct2D(target, orthoE2) * 1000) / 1000;

  // --- 三点共线模式计算 ---
  const xCoeff = input.xCoeff ?? 0.5;
  const yCoeff = input.yCoeff ?? 0.5;
  const sumCoeff = Math.round((xCoeff + yCoeff) * 100) / 100;
  const isSumOne = Math.abs(sumCoeff - 1) < 1e-4;

  const collinearPoint: Point2D = {
    x: xCoeff * e1.x + yCoeff * e2.x,
    y: xCoeff * e1.y + yCoeff * e2.y,
  };

  // 等系数线 x + y = sumCoeff 的两端渲染坐标（在基底 e1, e2 的连线上延伸）
  const k = sumCoeff;
  const lineP1: Point2D = { x: k * e1.x, y: k * e1.y };
  const lineP2: Point2D = { x: k * e2.x, y: k * e2.y };
  const dirX = lineP2.x - lineP1.x;
  const dirY = lineP2.y - lineP1.y;
  const eqLineStart: Point2D = {
    x: lineP1.x - dirX * 0.5,
    y: lineP1.y - dirY * 0.5,
  };
  const eqLineEnd: Point2D = {
    x: lineP2.x + dirX * 0.5,
    y: lineP2.y + dirY * 0.5,
  };

  // --- 三角形几何模式计算 ---
  const t = input.ratioT ?? 0.5;
  const midpoint: Point2D = { x: (e1.x + e2.x) / 2, y: (e1.y + e2.y) / 2 };
  const centroid: Point2D = { x: (e1.x + e2.x) / 3, y: (e1.y + e2.y) / 3 };
  const divisionPoint: Point2D = {
    x: (1 - t) * e1.x + t * e2.x,
    y: (1 - t) * e1.y + t * e2.y,
  };

  return {
    e1,
    e2,
    target,
    det: Math.round(det * 1000) / 1000,
    isCollinear,
    lambda,
    mu,
    p1,
    p2,
    modE1: Math.round(modE1 * 100) / 100,
    modE2: Math.round(modE2 * 100) / 100,
    modTarget: Math.round(modTarget * 100) / 100,
    angleRad,
    angleDeg: Math.round(angleDeg * 10) / 10,
    orthoE1,
    orthoE2,
    orthoLambda,
    orthoMu,
    sumCoeff,
    isSumOne,
    collinearPoint,
    eqLineStart,
    eqLineEnd,
    midpoint,
    centroid,
    divisionPoint,
  };
}
