/**
 * 平面向量线性运算与共线数学计算模块
 * 包含向量加减数乘、共线判定、三点共线公式(x+y=1)及基底向量唯一分解计算
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface LinearOperationResult {
  // 基础向量
  a: Vector2D;
  b: Vector2D;
  lambdaA: Vector2D;
  muB: Vector2D;
  sumVec: Vector2D; // s = lambda * a + mu * b
  diffVec: Vector2D; // d = a - b

  // 模长与标量
  normA: number;
  normB: number;
  normSum: number;
  normDiff: number;
  dotProduct: number;
  angleRad: number;
  angleDeg: number;

  // 共线判定
  detAB: number; // xa * yb - xb * ya
  isCollinearAB: boolean;
  collinearRatio?: number; // b = ratio * a (若存在)

  // 三点共线: OC = x * OA + y * OB
  pointC: Vector2D;
  coeffSum: number; // x + y
  isThreePointsCollinear: boolean; // |x + y - 1| < 1e-4
  isOnSegmentAB: boolean; // 在线段 AB 上 (0 <= t <= 1 且三点共线)

  // 基底分解: v = lambda1 * e1 + lambda2 * e2
  targetVecV: Vector2D;
  isBasisValid: boolean; // det(e1, e2) != 0
  lambda1: number;
  lambda2: number;
  basisComponent1: Vector2D; // lambda1 * e1
  basisComponent2: Vector2D; // lambda2 * e2
}

export interface VectorLinearParams {
  xa?: number;
  ya?: number;
  xb?: number;
  yb?: number;
  lambda?: number;
  mu?: number;

  // 模式二三点共线参数
  xCoeff?: number;
  yCoeff?: number;
  lockCollinear?: boolean; // 是否锁定 x + y = 1

  // 模式三基底分解参数
  xv?: number;
  yv?: number;
}

/**
 * 向量模长计算
 */
export function vectorNorm(v: Vector2D): number {
  return Math.hypot(v.x, v.y);
}

/**
 * 计算平面向量线性运算与共线全部几何指标
 * @param params 交互输入参数
 */
export function computeVectorLinear(
  params: VectorLinearParams,
): LinearOperationResult {
  const xa = params.xa ?? 3;
  const ya = params.ya ?? 1;
  const xb = params.xb ?? 1;
  const yb = params.yb ?? 3;
  const lambda = params.lambda ?? 1;
  const mu = params.mu ?? 1;

  const a: Vector2D = { x: xa, y: ya };
  const b: Vector2D = { x: xb, y: yb };

  const lambdaA: Vector2D = { x: lambda * xa, y: lambda * ya };
  const muB: Vector2D = { x: mu * xb, y: mu * yb };

  const sumVec: Vector2D = {
    x: lambdaA.x + muB.x,
    y: lambdaA.y + muB.y,
  };

  const diffVec: Vector2D = {
    x: a.x - b.x,
    y: a.y - b.y,
  };

  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  const normSum = vectorNorm(sumVec);
  const normDiff = vectorNorm(diffVec);

  const dotProduct = a.x * b.x + a.y * b.y;
  let angleRad = 0;
  if (normA > 1e-7 && normB > 1e-7) {
    const cosVal = Math.max(-1, Math.min(1, dotProduct / (normA * normB)));
    angleRad = Math.acos(cosVal);
  }
  const angleDeg = (angleRad * 180) / Math.PI;

  // 2. 共线判定
  const detAB = a.x * b.y - a.y * b.x;
  const isCollinearAB = Math.abs(detAB) < 1e-4;

  let collinearRatio: number | undefined = undefined;
  if (normA > 1e-7) {
    if (Math.abs(a.x) > 1e-7) {
      collinearRatio = b.x / a.x;
    } else {
      collinearRatio = b.y / a.y;
    }
  }

  // 3. 三点共线计算
  let xCoeff = params.xCoeff ?? 0.4;
  let yCoeff = params.yCoeff ?? 0.6;

  if (params.lockCollinear) {
    yCoeff = 1 - xCoeff;
  }

  const coeffSum = xCoeff + yCoeff;
  const pointC: Vector2D = {
    x: xCoeff * a.x + yCoeff * b.x,
    y: xCoeff * a.y + yCoeff * b.y,
  };

  const isThreePointsCollinear = Math.abs(coeffSum - 1) < 1e-4;
  const isOnSegmentAB =
    isThreePointsCollinear && xCoeff >= -1e-4 && yCoeff >= -1e-4;

  // 4. 基底分解 (将 targetVecV 分解为 lambda1 * a + lambda2 * b)
  const xv = params.xv ?? 4;
  const yv = params.yv ?? 3.5;
  const targetVecV: Vector2D = { x: xv, y: yv };

  const isBasisValid = !isCollinearAB && normA > 1e-7 && normB > 1e-7;
  let lambda1 = 0;
  let lambda2 = 0;

  if (isBasisValid) {
    // a.x * lambda1 + b.x * lambda2 = xv
    // a.y * lambda1 + b.y * lambda2 = yv
    lambda1 = (xv * b.y - yv * b.x) / detAB;
    lambda2 = (a.x * yv - a.y * xv) / detAB;
  }

  const basisComponent1: Vector2D = {
    x: lambda1 * a.x,
    y: lambda1 * a.y,
  };
  const basisComponent2: Vector2D = {
    x: lambda2 * b.x,
    y: lambda2 * b.y,
  };

  return {
    a,
    b,
    lambdaA,
    muB,
    sumVec,
    diffVec,
    normA,
    normB,
    normSum,
    normDiff,
    dotProduct,
    angleRad,
    angleDeg,
    detAB,
    isCollinearAB,
    collinearRatio,
    pointC,
    coeffSum,
    isThreePointsCollinear,
    isOnSegmentAB,
    targetVecV,
    isBasisValid,
    lambda1,
    lambda2,
    basisComponent1,
    basisComponent2,
  };
}
