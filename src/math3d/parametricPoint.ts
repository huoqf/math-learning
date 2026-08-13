import type { Vec3 } from "./vector3";
import { sub, norm, dot, cross, distance } from "./vector3";

/**
 * 单棱动点与空间角探究运算结果
 */
export interface SinglePointAngleResult {
  A: Vec3;
  B: Vec3;
  C: Vec3;
  D: Vec3;
  A1: Vec3;
  B1: Vec3;
  C1: Vec3;
  D1: Vec3;
  P: Vec3;
  /** 截面 PAC 的法向量 (未归一化与归一化) */
  nPAC: Vec3;
  lenN: number;
  /** 点 D 到平面 PAC 的距离 */
  distDToPAC: number;
  /** 二面角 P-AC-B (度) */
  dihedralDeg: number;
  dihedralCos: number;
  /** 直线 DP 与平面 PAC 的线面角 (度) */
  linePlaneDeg: number;
  linePlaneSin: number;
  /** 探究是否满足 DP ⊥ AC1 的 lambda 解 (若存在且在 [0, 1] 内则返回) */
  lambdaPerpDP_AC1: number | null;
  isPerpExist: boolean;
  /** 目标二面角 θ0 对应的反解 lambda 及存在性 */
  targetThetaDeg: number;
  rawLambdaTarget: number;
  lambdaTargetDihedral: number | null;
  isTargetDihedralExist: boolean;
}

/**
 * 双动点与向量最值运算结果
 */
export interface DoublePointDistanceResult {
  P: Vec3;
  Q: Vec3;
  vecPQ: Vec3;
  distPQ: number;
  /** 公垂线最小距离 (lambda=0, mu=a^2/(a^2+b^2)) */
  minDistSkew: number;
  optimalMu: number;
  /** 向量 AP 与 DQ 的数量积 */
  dotAP_DQ: number;
  /** 是否达到向量垂直条件 (dotAP_DQ = 0) */
  isAP_DQ_Perp: boolean;
}

/**
 * 表面沿面最短路径运算结果
 */
export interface SurfacePathResult {
  P: Vec3;
  /** 当前折线 A -> P -> C1 长度 */
  currentPathLength: number;
  /** 侧面展开路径 1 长度 (经过侧棱 BB1) */
  path1Length: number;
  /** 侧棱 BB1 上的理论最优折点 P1 坐标及 lambda */
  optimalP1: Vec3;
  optimalLambda1: number;
  /** 底面/侧面展开路径 2 长度 (经过棱 BC) */
  path2Length: number;
  /** 全局表面最短路径长度 */
  globalMinLength: number;
  bestPathType: "side" | "bottom";
}

/**
 * 1. 棱上单动点与二面角/线面角及存在性探究
 * @param a 长方体长 (x方向)
 * @param b 长方体宽 (y方向)
 * @param c 长方体高 (z方向)
 * @param lambda 动点 P 在侧棱 BB1 上的参数 lambda ∈ [0, 1]
 * @param targetThetaDeg 探究的目标二面角角度 (度)
 */
export function calculateSinglePointAngle(
  a: number,
  b: number,
  c: number,
  lambda: number,
  targetThetaDeg = 45,
): SinglePointAngleResult {
  const safeLambda = Math.max(0, Math.min(1, lambda));

  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const A1: Vec3 = { x: 0, y: 0, z: c };
  const B1: Vec3 = { x: a, y: 0, z: c };
  const C1: Vec3 = { x: a, y: b, z: c };
  const D1: Vec3 = { x: 0, y: b, z: c };

  // 动点 P 在侧棱 BB1 上
  const P: Vec3 = { x: a, y: 0, z: safeLambda * c };

  // 向量 AP = (a, 0, lambda*c), AC = (a, b, 0)
  const vecAP: Vec3 = sub(P, A);
  const vecAC: Vec3 = sub(C, A);

  // 截面 PAC 的法向量 n = vecAP × vecAC = (-lambda*b*c, lambda*a*c, a*b)
  const nPAC: Vec3 = cross(vecAP, vecAC);
  const lenN = norm(nPAC);

  // 点 D 到平面 PAC 的距离 d = |DA · n| / |n|
  // DA = (0, -b, 0) => DA · n = lambda * a * b * c
  const distDToPAC = lenN < 1e-9 ? 0 : (a * b * c * safeLambda) / lenN;

  // 二面角 P-AC-B (底面法向量为 n0 = (0, 0, 1))
  // cosθ = |nz| / lenN = (a * b) / lenN
  const dihedralCos =
    lenN < 1e-9 ? 1 : Math.min(1, Math.max(0, (a * b) / lenN));
  const dihedralDeg = (Math.acos(dihedralCos) * 180) / Math.PI;

  // 直线 DP 与平面 PAC 的线面角
  // vecDP = P - D = (a, -b, safeLambda * c)
  const vecDP: Vec3 = sub(P, D);
  const lenDP = norm(vecDP);
  const dotDP_n = Math.abs(dot(vecDP, nPAC));
  const linePlaneSin =
    lenDP < 1e-9 || lenN < 1e-9 ? 0 : Math.min(1, dotDP_n / (lenDP * lenN));
  const linePlaneDeg = (Math.asin(linePlaneSin) * 180) / Math.PI;

  // 存在性探究 1：使 DP ⊥ AC1 ?
  // vecAC1 = (a, b, c)
  // vecDP · vecAC1 = a^2 - b^2 + lambda * c^2 = 0
  // lambda = (b^2 - a^2) / c^2
  const rawLambdaPerp = (b * b - a * a) / (c * c);
  const isPerpExist = rawLambdaPerp >= 0 && rawLambdaPerp <= 1;
  const lambdaPerpDP_AC1 = isPerpExist
    ? Number(rawLambdaPerp.toFixed(4))
    : null;

  // 存在性探究 2：使二面角等于目标角度 targetThetaDeg ?
  // cosθ(λ) = (a * b) / sqrt(λ^2 c^2 (a^2+b^2) + a^2 b^2) = cos(θ_0)
  // λ_target = (a * b * tan(θ_0)) / (c * sqrt(a^2 + b^2))
  const radTarget = (targetThetaDeg * Math.PI) / 180;
  const tanTarget = Math.tan(radTarget);
  const rawLambdaTarget = (a * b * tanTarget) / (c * Math.sqrt(a * a + b * b));
  const isTargetDihedralExist = rawLambdaTarget >= 0 && rawLambdaTarget <= 1;
  const lambdaTargetDihedral = isTargetDihedralExist
    ? Number(rawLambdaTarget.toFixed(4))
    : null;

  return {
    A,
    B,
    C,
    D,
    A1,
    B1,
    C1,
    D1,
    P,
    nPAC,
    lenN,
    distDToPAC,
    dihedralDeg,
    dihedralCos,
    linePlaneDeg,
    linePlaneSin,
    lambdaPerpDP_AC1,
    isPerpExist,
    targetThetaDeg,
    rawLambdaTarget,
    lambdaTargetDihedral,
    isTargetDihedralExist,
  };
}

/**
 * 2. 双动点与向量最值探究
 * @param a 长方体长
 * @param b 长方体宽
 * @param c 长方体高
 * @param lambda 动点 P 在棱 BB1 上的比例参数 [0, 1]
 * @param mu 动点 Q 在底面对角线 AC 上的比例参数 [0, 1]
 */
export function calculateDoublePointDistance(
  a: number,
  b: number,
  c: number,
  lambda: number,
  mu: number,
): DoublePointDistanceResult {
  const safeLambda = Math.max(0, Math.min(1, lambda));
  const safeMu = Math.max(0, Math.min(1, mu));

  // P(a, 0, lambda*c), Q(a*mu, b*mu, 0)
  const P: Vec3 = { x: a, y: 0, z: safeLambda * c };
  const Q: Vec3 = { x: a * safeMu, y: b * safeMu, z: 0 };

  const vecPQ: Vec3 = sub(Q, P);
  const distPQ = norm(vecPQ);

  // 异面直线 AC 与 BB1 的公垂线最小距离
  // AC: (a*t, b*t, 0), BB1: (a, 0, z)
  // 公垂线对应 lambda = 0, mu = a^2 / (a^2 + b^2)
  const optimalMu = (a * a) / (a * a + b * b);
  const minDistSkew = (a * b) / Math.sqrt(a * a + b * b);

  // 向量 AP = (a, 0, lambda*c), DQ = (a*mu, b(mu-1), 0)
  // AP · DQ = a^2 * mu
  const dotAP_DQ = a * a * safeMu;
  const isAP_DQ_Perp = Math.abs(dotAP_DQ) < 1e-6;

  return {
    P,
    Q,
    vecPQ,
    distPQ,
    minDistSkew,
    optimalMu,
    dotAP_DQ,
    isAP_DQ_Perp,
  };
}

/**
 * 3. 表面沿面最短路径与折线最值
 * @param a 长方体长
 * @param b 长方体宽
 * @param c 长方体高
 * @param lambda 动折点 P 在棱 BB1 上的位置 [0, 1]
 */
export function calculateSurfacePath(
  a: number,
  b: number,
  c: number,
  lambda: number,
): SurfacePathResult {
  const safeLambda = Math.max(0, Math.min(1, lambda));

  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const C1: Vec3 = { x: a, y: b, z: c };
  const P: Vec3 = { x: a, y: 0, z: safeLambda * c };

  // 当前折线段 A -> P -> C1
  const currentPathLength = distance(A, P) + distance(P, C1);

  // 路径 1 (侧面展开 ABB1A1 + BCC1B1): A(0,0) -> C1(a+b, c)
  const path1Length = Math.sqrt((a + b) ** 2 + c ** 2);
  const optimalLambda1 = a / (a + b);
  const optimalP1: Vec3 = { x: a, y: 0, z: optimalLambda1 * c };

  // 路径 2 (底侧展开 ABCD + BCC1B1): A(0,0) -> C1(a, b+c)
  const path2Length = Math.sqrt(a ** 2 + (b + c) ** 2);

  const globalMinLength = Math.min(path1Length, path2Length);
  const bestPathType = path1Length <= path2Length ? "side" : "bottom";

  return {
    P,
    currentPathLength,
    path1Length,
    optimalP1,
    optimalLambda1,
    path2Length,
    globalMinLength,
    bestPathType,
  };
}
