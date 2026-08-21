import type { Vec3 } from "./vector3";

// ─── 1. 面面垂直与交线双外心模型 ───
export interface PerpPlanesSphereResult {
  /** 底面外接圆半径 r1 */
  r1: number;
  /** 侧面外接圆半径 r2 */
  r2: number;
  /** 公共交线弦长 c */
  c: number;
  /** 外接球球心 O */
  center: Vec3;
  /** 外接球半径 R */
  radius: number;
  /** 底面外心 O1 */
  O1: Vec3;
  /** 侧面外心 O2 */
  O2: Vec3;
  /** 交线中点 H */
  H: Vec3;
  /** 四面体 4 个顶点: A, C (交线两端), B (底面顶点), P (侧面顶点) */
  vertices: {
    A: Vec3;
    C: Vec3;
    B: Vec3;
    P: Vec3;
  };
}

/**
 * 计算面面垂直双外心交轨外接球模型
 *
 * 定理：两平面垂直时，其交线长为 c。
 * 底面外接圆半径为 r1，外心为 O1；侧面外接圆半径为 r2，外心为 O2。
 * 则球心 O 与 O1、O2 及交线中点 H 在垂直于交线的截面内构成直角矩形：
 * R^2 = r1^2 + r2^2 - (c/2)^2
 */
export function calculatePerpPlanesSphere(
  r1: number,
  r2: number,
  c: number,
): PerpPlanesSphereResult {
  const safeR1 = Math.max(1, r1);
  const safeR2 = Math.max(1, r2);
  const maxC = 2 * Math.min(safeR1, safeR2) - 0.05;
  const safeC = Math.min(Math.max(0.5, c), maxC);

  const halfC = safeC / 2;
  const d1 = Math.sqrt(Math.max(0, safeR1 * safeR1 - halfC * halfC));
  const d2 = Math.sqrt(Math.max(0, safeR2 * safeR2 - halfC * halfC));

  // 交线 AC 沿 X 轴，中点 H 在 (0, 0, 0)
  const A: Vec3 = { x: -halfC, y: 0, z: 0 };
  const C: Vec3 = { x: halfC, y: 0, z: 0 };
  const H: Vec3 = { x: 0, y: 0, z: 0 };

  // 底面在 XY 平面 (z = 0)，外心 O1 在 Y 轴正方向 (0, d1, 0)
  const O1: Vec3 = { x: 0, y: d1, z: 0 };
  // 底面第三顶点 B (取外心在 Y 轴上的延伸点或等腰顶角)
  const B: Vec3 = { x: 0, y: d1 + safeR1, z: 0 };

  // 侧面垂直于底面 (在 XZ 平面 y = 0)，外心 O2 在 Z 轴正方向 (0, 0, d2)
  const O2: Vec3 = { x: 0, y: 0, z: d2 };
  // 侧面第三顶点 P
  const P: Vec3 = { x: 0, y: 0, z: d2 + safeR2 };

  // 球心 O 为矩形 H - O1 - O - O2 的第四顶点: (0, d1, d2)
  const center: Vec3 = { x: 0, y: d1, z: d2 };
  const radius = Math.sqrt(safeR1 * safeR1 + safeR2 * safeR2 - halfC * halfC);

  return {
    r1: safeR1,
    r2: safeR2,
    c: safeC,
    center,
    radius,
    O1,
    O2,
    H,
    vertices: { A, C, B, P },
  };
}

// ─── 2. 正四面体三球同心对比模型 ───
export interface ConcentricSpheresResult {
  /** 正四面体棱长 a */
  edgeLength: number;
  /** 4 个顶点坐标 */
  vertices: [Vec3, Vec3, Vec3, Vec3];
  /** 共同球心 O */
  center: Vec3;
  /** 内切球半径 r (与 4 个面相切) */
  inRadius: number;
  /** 棱切球半径 r_edge (与 6 条棱相切) */
  edgeRadius: number;
  /** 外接球半径 R (过 4 个顶点) */
  circumRadius: number;
  /** 6 个棱切点 (6 条棱的中点) */
  edgeTangents: Vec3[];
  /** 4 个面切点 (4 个面的中心/重心) */
  faceTangents: Vec3[];
}

/**
 * 计算正四面体三球同心模型
 *
 * 定理：正四面体中，外接球、棱切球、内切球同心。
 * 半径之比为 R : r_edge : r_in = sqrt(6)/4 : sqrt(2)/4 : sqrt(6)/12 = 3 : sqrt(3) : 1
 */
export function calculateConcentricSpheres(a: number): ConcentricSpheresResult {
  const safeA = Math.max(1, a);

  // 正四面体各球半径精确公式
  const circumRadius = (Math.sqrt(6) / 4) * safeA;
  const edgeRadius = (Math.sqrt(2) / 4) * safeA;
  const inRadius = (Math.sqrt(6) / 12) * safeA;

  const center: Vec3 = { x: 0, y: 0, z: 0 };

  // 4 个顶点坐标（以正方体对角面四顶点构造，中心在原点）
  const s = safeA / Math.sqrt(2);
  const V0: Vec3 = { x: s / 2, y: s / 2, z: s / 2 };
  const V1: Vec3 = { x: s / 2, y: -s / 2, z: -s / 2 };
  const V2: Vec3 = { x: -s / 2, y: s / 2, z: -s / 2 };
  const V3: Vec3 = { x: -s / 2, y: -s / 2, z: s / 2 };
  const vertices: [Vec3, Vec3, Vec3, Vec3] = [V0, V1, V2, V3];

  // 6 条棱的中点（棱切点）
  const edgeTangents: Vec3[] = [
    { x: s / 2, y: 0, z: 0 },
    { x: 0, y: s / 2, z: 0 },
    { x: 0, y: 0, z: s / 2 },
    { x: 0, y: -s / 2, z: 0 },
    { x: 0, y: 0, z: -s / 2 },
    { x: -s / 2, y: 0, z: 0 },
  ];

  // 4 个面的重心（面切点）
  const faceTangents: Vec3[] = [
    { x: s / 6, y: s / 6, z: -s / 6 },
    { x: s / 6, y: -s / 6, z: s / 6 },
    { x: -s / 6, y: s / 6, z: s / 6 },
    { x: -s / 6, y: -s / 6, z: -s / 6 },
  ];

  return {
    edgeLength: safeA,
    vertices,
    center,
    inRadius,
    edgeRadius,
    circumRadius,
    edgeTangents,
    faceTangents,
  };
}

// ─── 3. 圆台切接球与内切充要临界模型 ───
export interface TruncatedConeSphereResult {
  /** 上底半径 r1 */
  r1: number;
  /** 下底半径 r2 */
  r2: number;
  /** 高度 h */
  height: number;
  /** 母线长 l */
  slantHeight: number;
  /** 外接球球心 */
  circumCenter: Vec3;
  /** 外接球半径 R */
  circumRadius: number;
  /** 外接球球心距下底高度 d */
  centerOffsetBottom: number;
  /** 是否满足内切球充要条件 (l === r1 + r2 <=> h === 2*sqrt(r1*r2)) */
  hasInSphere: boolean;
  /** 内切球半径 (存在时) */
  inRadius: number;
  /** 内切球球心 (存在时) */
  inCenter: Vec3;
  /** 理想内切临界高度 2*sqrt(r1*r2) */
  idealHForInSphere: number;
}

/**
 * 计算圆台切接球模型
 *
 * 定理：
 * 1. 外接球球心高度 d = (h^2 + r1^2 - r2^2) / (2h)，外接半径 R = sqrt(r2^2 + d^2)
 * 2. 存在内切球充要条件：轴截面等腰梯形两腰等于两底之和，即 h = 2*sqrt(r1*r2)
 *    此时内切球心在 (0, 0, h/2)，内切半径 r = h/2 = sqrt(r1*r2)
 */
export function calculateTruncatedConeSphere(
  r1: number,
  r2: number,
  h: number,
): TruncatedConeSphereResult {
  const safeR1 = Math.max(0.2, r1);
  const safeR2 = Math.max(safeR1 + 0.1, r2);
  const safeH = Math.max(0.5, h);

  const slantHeight = Math.sqrt(safeH * safeH + (safeR2 - safeR1) ** 2);

  // 外接球：下底在 Z=0，上底在 Z=safeH，球心在 (0, 0, d)
  const d = (safeH * safeH + safeR1 * safeR1 - safeR2 * safeR2) / (2 * safeH);
  const circumRadius = Math.sqrt(safeR2 * safeR2 + d * d);
  const circumCenter: Vec3 = { x: 0, y: 0, z: d };

  // 内切球充要条件判定
  const idealHForInSphere = 2 * Math.sqrt(safeR1 * safeR2);
  const hasInSphere = Math.abs(safeH - idealHForInSphere) < 0.1;
  const inRadius = safeH / 2;
  const inCenter: Vec3 = { x: 0, y: 0, z: inRadius };

  return {
    r1: safeR1,
    r2: safeR2,
    height: safeH,
    slantHeight,
    circumCenter,
    circumRadius,
    centerOffsetBottom: d,
    hasInSphere,
    inRadius,
    inCenter,
    idealHForInSphere,
  };
}

// ─── 4. 球内接几何体体积极值模型 ───
export interface SphereExtremaResult {
  /** 外接球半径 R */
  R: number;
  /** 内接体类型 (0: 圆柱, 1: 圆锥) */
  shapeType: 0 | 1;
  /** 几何体高度 h */
  h: number;
  /** 内接底面半径 r */
  r: number;
  /** 内接体体积 V */
  volume: number;
  /** 外接球体积 V_sphere */
  sphereVolume: number;
  /** 体积占比 V / V_sphere */
  volumeRatio: number;
  /** 理论最大体积对应的高度 h_opt */
  optimalH: number;
  /** 理论最大体积 V_max */
  maxVolume: number;
  /** 理论最大体积占比 */
  maxRatio: number;
}

/**
 * 计算球内接圆柱/圆锥体积极值模型
 *
 * 定理：
 * 1. 内接圆柱：V(h) = pi * (R^2 - h^2/4) * h，当 h = (2*sqrt(3)/3)*R 时，V_max = (4*pi/(3*sqrt(3)))*R^3 (占比 57.7%)
 * 2. 内接圆锥：V(h) = (1/3)*pi * h^2 * (2R - h)，当 h = (4/3)*R 时，V_max = (32*pi/81)*R^3 (占比 29.6%)
 */
export function calculateSphereExtrema(
  R: number,
  shapeType: number,
  h: number,
): SphereExtremaResult {
  const safeR = Math.max(1, R);
  const type: 0 | 1 = shapeType === 1 ? 1 : 0;
  const sphereVolume = (4 / 3) * Math.PI * safeR ** 3;

  if (type === 0) {
    // ── 内接圆柱 ──
    const safeH = Math.min(Math.max(0.1, h), 2 * safeR - 0.05);
    const r = Math.sqrt(Math.max(0.01, safeR * safeR - (safeH / 2) ** 2));
    const volume = Math.PI * r * r * safeH;
    const optimalH = ((2 * Math.sqrt(3)) / 3) * safeR;
    const maxVolume = ((4 * Math.PI) / (3 * Math.sqrt(3))) * safeR ** 3;

    return {
      R: safeR,
      shapeType: 0,
      h: safeH,
      r,
      volume,
      sphereVolume,
      volumeRatio: volume / sphereVolume,
      optimalH,
      maxVolume,
      maxRatio: 1 / Math.sqrt(3),
    };
  } else {
    // ── 内接圆锥 ──
    const safeH = Math.min(Math.max(0.1, h), 2 * safeR - 0.05);
    const r = Math.sqrt(Math.max(0.01, safeH * (2 * safeR - safeH)));
    const volume = (1 / 3) * Math.PI * r * r * safeH;
    const optimalH = (4 / 3) * safeR;
    const maxVolume = ((32 * Math.PI) / 81) * safeR ** 3;

    return {
      R: safeR,
      shapeType: 1,
      h: safeH,
      r,
      volume,
      sphereVolume,
      volumeRatio: volume / sphereVolume,
      optimalH,
      maxVolume,
      maxRatio: 8 / 27,
    };
  }
}
