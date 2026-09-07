/**
 * 空间距离与动态极值 纯数学算法层
 * 涵盖：
 * 1. 异面直线公垂线、两动点距离函数与二次型极值解析解
 * 2. 线面平行转化平面参数与公垂向量
 * 3. 点到平面距离（向量射影法与等体积法互验）
 * 4. 动点体积极值与轨迹分析
 * 纯数学函数，零 DOM / React 依赖。
 */
import { type Vec3, sub, norm, scale, normalize } from "./vector3";

export interface SkewLinesDistanceResult {
  /** 动点 P 坐标 */
  P: Vec3;
  /** 动点 Q 坐标 */
  Q: Vec3;
  /** 动线段向量 vecPQ */
  vecPQ: Vec3;
  /** 实时动点距离 */
  distPQ: number;
  /** 公垂线理论最短距离 */
  minDist: number;
  /** 极值状态下 P 点参数 lambda* */
  optimalLambda: number;
  /** 极值状态下 Q 点参数 mu* */
  optimalMu: number;
  /** 公垂线在直线 1 上的垂足 H1 */
  footH1: Vec3;
  /** 公垂线在直线 2 上的垂足 H2 */
  footH2: Vec3;
  /** 公垂线方向单位向量 n_unit */
  nUnit: Vec3;
  /** 公垂线方向整数组合向量 n_raw */
  nRaw: Vec3;
  /** 平行平面 ACD1 的顶点 */
  parallelPlaneVertices: [Vec3, Vec3, Vec3];
  /** 是否已到达公垂线极值状态 (容差内) */
  isAtPerpendicular: boolean;
  /** 相对极值距离的增量 Δd = distPQ - minDist */
  distDelta: number;
  /** 二次型配方展开各分项系数与正交分解 */
  quadraticFormula: {
    A: number;
    B: number;
    C: number;
    minDistSq: number;
    orthogonalDecomp: {
      uSq: number;
      vSq: number;
      dotUV: number;
    };
  };
}

export interface PointPlaneDistanceResult {
  /** 动点 E 坐标 */
  E: Vec3;
  /** 垂足 H 坐标 */
  footH: Vec3;
  /** 截面 BDE 法向量 (整数组合) */
  nRaw: Vec3;
  /** 截面 BDE 单位法向量 */
  nUnit: Vec3;
  /** 点面垂直距离 d */
  distance: number;
  /** 底面 △ABD 面积 */
  areaBase: number;
  /** 截面 △BDE 面积 */
  areaSection: number;
  /** 三棱锥 E-ABD 体积 */
  volume: number;
  /** 理论最大体积 (λ=1) */
  maxVolume: number;
  /** 等体积法反解高线一致性验证误差 */
  volumeCheckError: number;
}

/**
 * 1. 异面直线公垂线与两动点距离函数求解 (长方体面对角线 A1B 与 底面对角线 AC)
 * 直线 1 (A1B): 方向向量 u = (a, 0, -c), P(λ) = (λa, 0, (1-λ)c)
 * 直线 2 (AC): 方向向量 v = (a, b, 0), Q(μ) = (μa, μb, 0)
 */
export function solveSkewLinesDistance(
  a: number,
  b: number,
  c: number,
  lambda: number,
  mu: number,
): SkewLinesDistanceResult {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);
  const safeC = Math.max(0.1, c);
  const safeLambda = Math.max(0, Math.min(1, lambda));
  const safeMu = Math.max(0, Math.min(1, mu));

  // 动点坐标
  const P: Vec3 = {
    x: safeLambda * safeA,
    y: 0,
    z: (1 - safeLambda) * safeC,
  };
  const Q: Vec3 = {
    x: safeMu * safeA,
    y: safeMu * safeB,
    z: 0,
  };

  const vecPQ: Vec3 = sub(Q, P);
  const distPQ = norm(vecPQ);

  // 公垂向量 n = u × v = (bc, -ac, ab)
  const nRaw: Vec3 = {
    x: safeB * safeC,
    y: -safeA * safeC,
    z: safeA * safeB,
  };
  const lenN = norm(nRaw);
  const nUnit = lenN < 1e-9 ? { x: 0, y: 0, z: 1 } : normalize(nRaw);

  // 公垂距离解析解 d_min = abc / |n|
  const minDist = (safeA * safeB * safeC) / lenN;

  // 联立垂直方程解得 optimalLambda 与 optimalMu
  // (a² + c²)λ - a²μ = c²
  // (a² + b²)μ - a²λ = 0  =>  μ = a²λ / (a² + b²)
  const denom =
    safeA * safeA * safeB * safeB +
    safeB * safeB * safeC * safeC +
    safeC * safeC * safeA * safeA;

  const optimalLambda =
    denom < 1e-9
      ? 0.5
      : (safeC * safeC * (safeA * safeA + safeB * safeB)) / denom;
  const optimalMu =
    denom < 1e-9 ? 0.5 : (safeA * safeA * safeC * safeC) / denom;

  // 理论公垂足
  const footH1: Vec3 = {
    x: optimalLambda * safeA,
    y: 0,
    z: (1 - optimalLambda) * safeC,
  };
  const footH2: Vec3 = {
    x: optimalMu * safeA,
    y: optimalMu * safeB,
    z: 0,
  };

  // 平行平面 ACD1 的顶点 (过 AC 平行于 A1B)
  const parallelPlaneVertices: [Vec3, Vec3, Vec3] = [
    { x: 0, y: 0, z: 0 }, // A
    { x: safeA, y: safeB, z: 0 }, // C
    { x: 0, y: safeB, z: safeC }, // D1
  ];

  const distDelta = Math.max(0, distPQ - minDist);
  const isAtPerpendicular =
    Math.abs(safeLambda - optimalLambda) < 0.04 &&
    Math.abs(safeMu - optimalMu) < 0.04;

  // 二次型系数 |PQ|² 展开与正交分解模方参数
  const quadraticFormula = {
    A: safeA * safeA + safeC * safeC,
    B: safeA * safeA + safeB * safeB,
    C: -2 * safeA * safeA,
    minDistSq: minDist * minDist,
    orthogonalDecomp: {
      uSq: safeA * safeA + safeC * safeC,
      vSq: safeA * safeA + safeB * safeB,
      dotUV: safeA * safeA,
    },
  };

  return {
    P,
    Q,
    vecPQ,
    distPQ,
    minDist,
    optimalLambda,
    optimalMu,
    footH1,
    footH2,
    nUnit,
    nRaw,
    parallelPlaneVertices,
    isAtPerpendicular,
    distDelta,
    quadraticFormula,
  };
}

/**
 * 2. 侧棱与底面对角线异面直线模型 (BB1 与 AC)
 * 直线 1 (BB1): P(a, 0, λc)
 * 直线 2 (AC): Q(μa, μb, 0)
 */
export function solveSideEdgeAndFaceDiagonalDistance(
  a: number,
  b: number,
  c: number,
  lambda: number,
  mu: number,
): SkewLinesDistanceResult {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);
  const safeC = Math.max(0.1, c);
  const safeLambda = Math.max(0, Math.min(1, lambda));
  const safeMu = Math.max(0, Math.min(1, mu));

  const P: Vec3 = { x: safeA, y: 0, z: safeLambda * safeC };
  const Q: Vec3 = { x: safeMu * safeA, y: safeMu * safeB, z: 0 };

  const vecPQ = sub(Q, P);
  const distPQ = norm(vecPQ);

  // 公垂线对应 λ=0, μ = a² / (a² + b²)
  const abSq = safeA * safeA + safeB * safeB;
  const optimalLambda = 0;
  const optimalMu = abSq < 1e-9 ? 0.5 : (safeA * safeA) / abSq;

  const minDist = (safeA * safeB) / Math.sqrt(abSq);

  const footH1: Vec3 = { x: safeA, y: 0, z: 0 };
  const footH2: Vec3 = {
    x: optimalMu * safeA,
    y: optimalMu * safeB,
    z: 0,
  };

  const nRaw: Vec3 = { x: -safeB, y: safeA, z: 0 };
  const nUnit = normalize(nRaw);

  const distDelta = Math.max(0, distPQ - minDist);
  const isAtPerpendicular =
    Math.abs(safeLambda - optimalLambda) < 0.04 &&
    Math.abs(safeMu - optimalMu) < 0.04;

  const parallelPlaneVertices: [Vec3, Vec3, Vec3] = [
    { x: 0, y: 0, z: 0 },
    { x: safeA, y: safeB, z: 0 },
    { x: safeA, y: safeB, z: safeC },
  ];

  return {
    P,
    Q,
    vecPQ,
    distPQ,
    minDist,
    optimalLambda,
    optimalMu,
    footH1,
    footH2,
    nUnit,
    nRaw,
    parallelPlaneVertices,
    isAtPerpendicular,
    distDelta,
    quadraticFormula: {
      A: safeC * safeC,
      B: abSq,
      C: 0,
      minDistSq: minDist * minDist,
      orthogonalDecomp: {
        uSq: safeC * safeC,
        vSq: abSq,
        dotUV: 0,
      },
    },
  };
}

/**
 * 3. 点到平面的距离与等体积法对账 (原点 A 到截面 BDE 的距离)
 */
export function solvePointPlaneDistance(
  a: number,
  b: number,
  c: number,
  lambda: number,
): PointPlaneDistanceResult {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);
  const safeC = Math.max(0.1, c);
  const safeLambda = Math.max(0.01, Math.min(1, lambda));
  const zE = safeLambda * safeC;

  const E: Vec3 = { x: 0, y: 0, z: zE };

  // 截面 BDE 法向量 n = (b*zE, a*zE, a*b)
  const nRaw: Vec3 = {
    x: safeB * zE,
    y: safeA * zE,
    z: safeA * safeB,
  };
  const lenN = norm(nRaw);
  const nUnit = lenN < 1e-9 ? { x: 0, y: 0, z: 1 } : normalize(nRaw);

  // 向量射影法距离 d = |AB · n| / |n| = (a * b * zE) / |n|
  const distance = (safeA * safeB * zE) / lenN;

  // 垂足 H: A + d * nUnit
  const footH: Vec3 = scale(nUnit, distance);

  // 底面积与截面积
  const areaBase = 0.5 * safeA * safeB;
  const areaSection = 0.5 * lenN;

  // 体积
  const volume = (1 / 3) * areaBase * zE;
  const maxVolume = (1 / 6) * safeA * safeB * safeC;

  // 等体积法反解 d_check = (3 * volume) / areaSection
  const dCheck = (3 * volume) / areaSection;
  const volumeCheckError = Math.abs(distance - dCheck);

  return {
    E,
    footH,
    nRaw,
    nUnit,
    distance,
    areaBase,
    areaSection,
    volume,
    maxVolume,
    volumeCheckError,
  };
}
