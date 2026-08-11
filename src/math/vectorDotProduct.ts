/**
 * 平面向量的数量积与几何投影数学计算模块
 * 包含向量数量积、几何投影、夹角公式、模长二次展开及极化恒等式几何计算
 */

export interface Vector2D {
  x: number;
  y: number;
}

export type AngleType = "zero" | "acute" | "right" | "obtuse" | "pi";

export interface VectorDotProductResult {
  // 基础向量
  a: Vector2D;
  b: Vector2D;
  sumVec: Vector2D; // s = a + b
  diffVec: Vector2D; // d = a - b (B -> A)

  // 模长与角度
  normA: number;
  normB: number;
  normA2: number; // |a|^2
  normB2: number; // |b|^2
  dotProduct: number; // a · b
  cosTheta: number; // cosθ
  angleRad: number; // 弧度
  angleDeg: number; // 角度
  angleType: AngleType; // 角度类型 (锐角/直角/钝角等)

  // 几何投影 (b 在 a 方向上的投影)
  scalarProjBtoA: number; // 投影数量 |b|cosθ
  projVecBtoA: Vector2D; // 投影向量 (a·b/|a|^2) * a
  footH: Vector2D; // B 在 OA 所在直线上的垂足 H (等于 projVecBtoA)

  // 几何投影 (a 在 b 方向上的投影)
  scalarProjAtoB: number; // 投影数量 |a|cosθ
  projVecAtoB: Vector2D; // 投影向量 (a·b/|b|^2) * b

  // 运算律与模长展开
  normSum: number; // |a + b|
  normDiff: number; // |a - b|
  normSum2: number; // |a + b|^2
  normDiff2: number; // |a - b|^2
  isPerpendicular: boolean; // 是否垂直 (a ⊥ b)

  // 极化恒等式相关数据
  polarizationVal: number; // 1/4 * (|a+b|^2 - |a-b|^2)
  midpointM: Vector2D; // AB 中点 M (a+b)/2
  normOM: number; // |OM|
  normMB: number; // |MB| = |MA| = 1/2|AB|
  polarizationMidVal: number; // |OM|^2 - |MB|^2
}

export interface VectorDotProductParams {
  xa?: number;
  ya?: number;
  xb?: number;
  yb?: number;
}

/**
 * 向量模长计算
 */
export function vectorNorm(v: Vector2D): number {
  return Math.hypot(v.x, v.y);
}

/**
 * 计算平面向量数量积与几何投影的全部指标
 */
export function computeVectorDotProduct(
  params: VectorDotProductParams,
): VectorDotProductResult {
  const xa = params.xa ?? 4;
  const ya = params.ya ?? 0;
  const xb = params.xb ?? 2;
  const yb = params.yb ?? 3;

  const a: Vector2D = { x: xa, y: ya };
  const b: Vector2D = { x: xb, y: yb };

  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  const normA2 = normA * normA;
  const normB2 = normB * normB;

  const dotProduct = a.x * b.x + a.y * b.y;

  let cosTheta = 0;
  let angleRad = 0;
  let angleType: AngleType = "right";

  if (normA > 1e-7 && normB > 1e-7) {
    cosTheta = Math.max(-1, Math.min(1, dotProduct / (normA * normB)));
    angleRad = Math.acos(cosTheta);

    if (Math.abs(cosTheta - 1) < 1e-5) {
      angleType = "zero";
    } else if (Math.abs(cosTheta + 1) < 1e-5) {
      angleType = "pi";
    } else if (Math.abs(cosTheta) < 1e-4) {
      angleType = "right";
    } else if (cosTheta > 0) {
      angleType = "acute";
    } else {
      angleType = "obtuse";
    }
  } else {
    // 零向量处理
    angleType = "zero";
  }

  const angleDeg = (angleRad * 180) / Math.PI;

  // 1. 投影计算 (b 在 a 方向)
  let scalarProjBtoA = 0;
  let projVecBtoA: Vector2D = { x: 0, y: 0 };
  if (normA > 1e-7) {
    scalarProjBtoA = dotProduct / normA;
    const factor = dotProduct / normA2;
    projVecBtoA = { x: factor * a.x, y: factor * a.y };
  }
  const footH = { ...projVecBtoA };

  // 2. 投影计算 (a 在 b 方向)
  let scalarProjAtoB = 0;
  let projVecAtoB: Vector2D = { x: 0, y: 0 };
  if (normB > 1e-7) {
    scalarProjAtoB = dotProduct / normB;
    const factor = dotProduct / normB2;
    projVecAtoB = { x: factor * b.x, y: factor * b.y };
  }

  // 3. 和差向量与模长展开
  const sumVec: Vector2D = { x: a.x + b.x, y: a.y + b.y };
  const diffVec: Vector2D = { x: a.x - b.x, y: a.y - b.y };

  const normSum = vectorNorm(sumVec);
  const normDiff = vectorNorm(diffVec);
  const normSum2 = normSum * normSum;
  const normDiff2 = normDiff * normDiff;

  const isPerpendicular =
    normA > 1e-7 && normB > 1e-7 && Math.abs(dotProduct) < 1e-4;

  // 4. 极化恒等式计算
  const polarizationVal = 0.25 * (normSum2 - normDiff2);

  const midpointM: Vector2D = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const normOM = vectorNorm(midpointM);
  const normMB = 0.5 * normDiff;
  const polarizationMidVal = normOM * normOM - normMB * normMB;

  return {
    a,
    b,
    sumVec,
    diffVec,
    normA,
    normB,
    normA2,
    normB2,
    dotProduct,
    cosTheta,
    angleRad,
    angleDeg,
    angleType,
    scalarProjBtoA,
    projVecBtoA,
    footH,
    scalarProjAtoB,
    projVecAtoB,
    normSum,
    normDiff,
    normSum2,
    normDiff2,
    isPerpendicular,
    polarizationVal,
    midpointM,
    normOM,
    normMB,
    polarizationMidVal,
  };
}
