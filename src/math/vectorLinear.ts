/**
 * 平面向量线性运算与共线数学计算模块
 * 包含向量加减数乘、共线判定、三点共线公式(x+y=1)及基底向量唯一分解计算
 */

export interface Vector2D {
  x: number;
  y: number;
}

/**
 * 模长判零阈值（全文件唯一）。
 *
 * 零向量方向任意，于是「夹角是否有定义」「是否存在单位向量」「能否充当基底」
 * 三条判据的边界其实是同一个问题：这个向量的模长是不是 0。
 * 此前该阈值以字面量 1e-7 散落在三处，本轮新增单位向量（第四、五处使用）时
 * 极易漏改其中一处，故收敛为常量。
 *
 * 数值本身只用于吸收浮点残差：左屏滑块与中屏拖拽的步长都是 0.5，
 * 不存在"真实的、需要靠 1e-7 才挡得住"的小向量。
 */
const EPS_NORM = 1e-7;

export interface LinearOperationResult {
  // 基础向量
  a: Vector2D;
  b: Vector2D;
  lambdaA: Vector2D;
  muB: Vector2D;
  sumVec: Vector2D; // s = lambda * a + mu * b
  diffVec: Vector2D; // d = a - b
  /**
   * 闭环向量 = −s = −(λa + μb)：与 λa、μb 首尾相接恰好回到起点，
   * 即 λa + μb + closingVec = 0，三者构成闭合三角形。
   *
   * 物理侧对应「三力平衡」的第三个力（必修二 6.4.2）：三力平衡 ⇔ 三力首尾相接
   * 构成闭合三角形 ⇔ 向量和为 0，故第三力与前两力的合力等大反向。
   */
  closingVec: Vector2D;

  // 模长与标量
  normA: number;
  normB: number;
  normSum: number;
  normDiff: number;
  dotProduct: number;
  angleRad: number;
  angleDeg: number;
  /**
   * 夹角是否有定义：当 a 或 b 为零向量时为 false。
   * 零向量方向任意，高中口径下两向量夹角以二者均非零为前提，
   * 此时 `angleRad` / `angleDeg` 仅为占位 0，**禁止**当作真实夹角展示。
   */
  isAngleDefined: boolean;

  // 单位向量（必修二 6.2.3 数乘 · 向量的单位化）
  /**
   * 与 a 同向的单位向量 e_a = a / |a|。
   * a 为零向量时其方向任意、不存在单位向量，此时仅为占位 (0, 0)——
   * 该占位量的模长是 0 而不是 1，**禁止**当作真实单位向量展示，
   * 消费方必须先判 `isUnitADefined`。
   */
  unitA: Vector2D;
  /** 与 b 同向的单位向量 e_b = b / |b|；b 为零向量时与 `unitA` 同理是占位 (0, 0)。 */
  unitB: Vector2D;
  /**
   * e_a 是否有定义（判据：a 非零向量）。
   * 与 `isUnitBDefined` **相互独立**——a、b 中只有一个退化时，
   * 另一个的单位向量依然成立，不得用一个布尔量一并抹掉。
   */
  isUnitADefined: boolean;
  /** e_b 是否有定义（判据：b 非零向量）。 */
  isUnitBDefined: boolean;
  /**
   * 两单位向量的数量积 e_a · e_b。
   * 当二者都有定义时它恒等于 cosθ（这正是「单位化」在夹角问题中的价值：
   * 夹角余弦只由两个单位向量决定，与向量长度无关）；任一无定义时取占位 0。
   */
  unitDotProduct: number;

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

  // 闭环向量：与 λa、μb 首尾相接回到原点的第三边（三力平衡的第三个力）
  const closingVec: Vector2D = { x: -sumVec.x, y: -sumVec.y };

  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  const normSum = vectorNorm(sumVec);
  const normDiff = vectorNorm(diffVec);

  const dotProduct = a.x * b.x + a.y * b.y;
  const isAngleDefined = normA > EPS_NORM && normB > EPS_NORM;
  let angleRad = 0;
  if (isAngleDefined) {
    const cosVal = Math.max(-1, Math.min(1, dotProduct / (normA * normB)));
    angleRad = Math.acos(cosVal);
  }
  const angleDeg = (angleRad * 180) / Math.PI;

  // 单位向量：e = a / |a|（方向不变、长度归一；零向量方向任意 ⇒ 无单位向量）
  const isUnitADefined = normA > EPS_NORM;
  const isUnitBDefined = normB > EPS_NORM;
  const unitA: Vector2D = isUnitADefined
    ? { x: xa / normA, y: ya / normA }
    : { x: 0, y: 0 };
  const unitB: Vector2D = isUnitBDefined
    ? { x: xb / normB, y: yb / normB }
    : { x: 0, y: 0 };
  const unitDotProduct =
    isUnitADefined && isUnitBDefined
      ? unitA.x * unitB.x + unitA.y * unitB.y
      : 0;

  // 2. 共线判定
  const detAB = a.x * b.y - a.y * b.x;
  const isCollinearAB = Math.abs(detAB) < 1e-4;

  let collinearRatio: number | undefined = undefined;
  if (normA > EPS_NORM) {
    if (Math.abs(a.x) > EPS_NORM) {
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

  const isBasisValid = !isCollinearAB && normA > EPS_NORM && normB > EPS_NORM;
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
    closingVec,
    normA,
    normB,
    normSum,
    normDiff,
    dotProduct,
    angleRad,
    angleDeg,
    isAngleDefined,
    unitA,
    unitB,
    isUnitADefined,
    isUnitBDefined,
    unitDotProduct,
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
