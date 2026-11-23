/**
 * 立体几何动点轨迹三大经典问题纯数学解算（Z-up 数学坐标系）
 *
 * 约定：正方体 ABCD-A1B1C1D1 顶点固定放在第一卦限：
 * A(0,0,0), B(a,0,0), C(a,a,0), D(0,a,0)
 * A1(0,0,a), B1(a,0,a), C1(a,a,a), D1(0,a,a)
 * 严格保持纯数学层无副作用。
 */

import type { Vec3 } from "./vector3";
import { add, sub, scale, dot, norm, normalize } from "./vector3";
import type { Plane } from "./plane";
import { planeFromPoints } from "./plane";
import type { Bounds3D } from "./sceneBounds";

export type SolidDynamicLocusMode =
  "perpLineLocus" | "constDistCircle" | "constAngleConic";

export type ConicSectionType = "circle" | "ellipse" | "parabola" | "hyperbola";

export interface CubeVertices {
  A: Vec3;
  B: Vec3;
  C: Vec3;
  D: Vec3;
  A1: Vec3;
  B1: Vec3;
  C1: Vec3;
  D1: Vec3;
}

export interface PerpLineLocusResult {
  a: number;
  vertices: CubeVertices;
  /** 垂面截面三角形 AB1C 顶点 */
  sectionPoints: [Vec3, Vec3, Vec3];
  plane: Plane;
  /** 体对角线 BD1 与平面 AB1C 的垂足 H */
  footH: Vec3;
  /** 垂线段 BH 长度 = (√3 / 3) * a */
  distBH: number;
  /** 截面周长 = 3√2 * a */
  perimeter: number;
  /** 截面面积 = (√3 / 2) * a^2 */
  area: number;
  /** 随参数 t ∈ [0,1] 沿截面边界运动的动点 P */
  movingPointP: Vec3;
  /** 垂足 H 处的空间直角垂直标记折线 [p1, H, p2] 与直角顶折线 [q1, q2, q3] */
  rightAngleMark: [Vec3, Vec3, Vec3];
}

export interface ConstDistCircleResult {
  a: number;
  R: number;
  /** 底面轨迹圆半径 r = √(R^2 - a^2) */
  circleRadius: number;
  /** 在底面正方形 ABCD 内的四分之一圆弧弧长 */
  arcLength: number;
  vertices: CubeVertices;
  /** 圆弧采样点（四分之一圆弧，从 AB 上一点到 AD 上一点） */
  arcPoints: Vec3[];
  /** 随参数 t ∈ [0,1] 在圆弧上移动的动点 P */
  movingPointP: Vec3;
  /** 垂足 A 处的直角标记折线（对应 A1A ⊥ AP） */
  rightAngleMark: [Vec3, Vec3, Vec3];
}

export interface ConstAngleConicResult {
  a: number;
  /** 圆锥半顶角 θ（度，固定 35°） */
  halfAngleDeg: number;
  /** 截平面与底面所成二面角 β（度） */
  tiltDeg: number;
  /** 截交线分类 */
  conicType: ConicSectionType;
  /** 截交线离心率判定值 sin(β) / cos(θ) */
  eccentricity: number;
  vertices: CubeVertices;
  /** 截平面过定点 M0 */
  planeAnchor: Vec3;
  plane: Plane;
  /** 截交线采样段（避免双曲线两支之间直连，按支分数组存放） */
  curveBranches: Vec3[][];
  /** 代表性动点 P（取主支上对应参数 t 的合法点） */
  movingPointP: Vec3;
  /** 母线射线端点（展示圆锥轮廓的 8 条母线终点） */
  coneGeneratrices: Vec3[];
  /** 垂足 A 处的直角标记折线（对应 A1A ⊥ 底面） */
  rightAngleMark: [Vec3, Vec3, Vec3];
}

export function buildCubeVertices(a: number): CubeVertices {
  const safeA = Math.max(0.5, a);
  return {
    A: { x: 0, y: 0, z: 0 },
    B: { x: safeA, y: 0, z: 0 },
    C: { x: safeA, y: safeA, z: 0 },
    D: { x: 0, y: safeA, z: 0 },
    A1: { x: 0, y: 0, z: safeA },
    B1: { x: safeA, y: 0, z: safeA },
    C1: { x: safeA, y: safeA, z: safeA },
    D1: { x: 0, y: safeA, z: safeA },
  };
}

/** 根据公共顶点 O 与两条不同射线方向生成空间直角标折线三点 */
function makeRightAngleBracket(
  origin: Vec3,
  dir1: Vec3,
  dir2: Vec3,
  legLen: number,
): [Vec3, Vec3, Vec3] {
  const u = scale(normalize(dir1), legLen);
  const v = scale(normalize(dir2), legLen);
  const p1 = add(origin, u);
  const corner = add(origin, add(u, v));
  const p2 = add(origin, v);
  return [p1, corner, p2];
}

/**
 * 模式 1：线面垂直定轨迹（BD1 ⊥ 平面 AB1C，动点 P 满足 AP ⊥ BD1 在正方体表面上的轨迹即 △AB1C 边界）
 */
export function solvePerpLineLocus(a: number, t: number): PerpLineLocusResult {
  const safeA = Math.max(0.5, a);
  const clampedT = Math.min(1, Math.max(0, t));
  const vertices = buildCubeVertices(safeA);
  const { A, B, C, B1 } = vertices;

  const sectionPoints: [Vec3, Vec3, Vec3] = [A, B1, C];
  const plane = planeFromPoints(A, B1, C);

  // BD1 方向向量为 (-a, a, a)，与平面 -x+y+z=0 交点参数 k = 1/3
  const footH: Vec3 = {
    x: (2 * safeA) / 3,
    y: safeA / 3,
    z: safeA / 3,
  };

  // 沿 △AB1C 三条边（A -> B1 -> C -> A）等比例参数化动点 P
  const seg = clampedT * 3;
  let movingPointP: Vec3;
  if (seg <= 1) {
    movingPointP = add(scale(A, 1 - seg), scale(B1, seg));
  } else if (seg <= 2) {
    const s = seg - 1;
    movingPointP = add(scale(B1, 1 - s), scale(C, s));
  } else {
    const s = Math.min(1, seg - 2);
    movingPointP = add(scale(C, 1 - s), scale(A, s));
  }

  const hbDir = sub(B, footH);
  const haDir = sub(A, footH);
  const rightAngleMark = makeRightAngleBracket(
    footH,
    hbDir,
    haDir,
    0.11 * safeA,
  );

  return {
    a: safeA,
    vertices,
    sectionPoints,
    plane,
    footH,
    distBH: (Math.sqrt(3) / 3) * safeA,
    perimeter: 3 * Math.SQRT2 * safeA,
    area: (Math.sqrt(3) / 2) * safeA * safeA,
    movingPointP,
    rightAngleMark,
  };
}

/**
 * 模式 2：空间定距圆弧轨迹（底面动点 P 满足 A1P = R，其中 R = rFactor * a）
 */
export function solveConstDistCircle(
  a: number,
  rFactor: number,
  t: number,
): ConstDistCircleResult {
  const safeA = Math.max(0.5, a);
  // 严格保证 R ∈ (a, √2 a)，使半径 r ∈ (0, a) 落在底面正方形 ABCD 内
  const safeFactor = Math.min(1.4, Math.max(1.02, rFactor));
  const R = safeFactor * safeA;
  const circleRadius = Math.sqrt(Math.max(0, R * R - safeA * safeA));
  const clampedT = Math.min(1, Math.max(0, t));

  const vertices = buildCubeVertices(safeA);
  const steps = 48;
  const arcPoints: Vec3[] = [];
  for (let i = 0; i <= steps; i++) {
    const phi = (i / steps) * (Math.PI / 2);
    arcPoints.push({
      x: circleRadius * Math.cos(phi),
      y: circleRadius * Math.sin(phi),
      z: 0,
    });
  }

  const pAngle = clampedT * (Math.PI / 2);
  const movingPointP: Vec3 = {
    x: circleRadius * Math.cos(pAngle),
    y: circleRadius * Math.sin(pAngle),
    z: 0,
  };

  // A1A ⊥ AP（垂足 A）处直角标
  const pDir = norm(movingPointP) > 1e-6 ? movingPointP : { x: 1, y: 0, z: 0 };
  const rightAngleMark = makeRightAngleBracket(
    vertices.A,
    { x: 0, y: 0, z: 1 },
    pDir,
    0.12 * safeA,
  );

  return {
    a: safeA,
    R,
    circleRadius,
    arcLength: (Math.PI / 2) * circleRadius,
    vertices,
    arcPoints,
    movingPointP,
    rightAngleMark,
  };
}

export function classifyConicByTilt(
  tiltDeg: number,
  halfAngleDeg = 35,
): { conicType: ConicSectionType; eccentricity: number } {
  const betaRad = (Math.min(88, Math.max(0, tiltDeg)) * Math.PI) / 180;
  const thetaRad = (halfAngleDeg * Math.PI) / 180;
  const e = Math.sin(betaRad) / Math.cos(thetaRad);
  if (tiltDeg < 0.8) {
    return { conicType: "circle", eccentricity: e };
  }
  const criticalDeg = 90 - halfAngleDeg;
  if (Math.abs(tiltDeg - criticalDeg) <= 1.2) {
    return { conicType: "parabola", eccentricity: 1 };
  }
  if (tiltDeg < criticalDeg) {
    return { conicType: "ellipse", eccentricity: e };
  }
  return { conicType: "hyperbola", eccentricity: e };
}

/**
 * 模式 3：定角圆锥截面轨迹（以 A1 为顶点、A1A 为轴、半顶角 θ=35° 的圆锥面被倾角 β 的平面所截）
 */
export function solveConstAngleConic(
  a: number,
  tiltDeg: number,
  t: number,
): ConstAngleConicResult {
  const safeA = Math.max(0.5, a);
  const halfAngleDeg = 35;
  const safeTilt = Math.min(82, Math.max(0, tiltDeg));
  const clampedT = Math.min(1, Math.max(0, t));
  const vertices = buildCubeVertices(safeA);

  const theta = (halfAngleDeg * Math.PI) / 180;
  const beta = (safeTilt * Math.PI) / 180;
  const { conicType, eccentricity } = classifyConicByTilt(
    safeTilt,
    halfAngleDeg,
  );

  // 平面锚定在轴线 A1A 上 z0 = 0.28a 处，绕 y 轴倾转 β 角
  const z0 = 0.28 * safeA;
  const h0 = safeA - z0;
  const planeAnchor: Vec3 = { x: 0, y: 0, z: z0 };
  const planeNormal = normalize({
    x: Math.sin(beta),
    y: 0,
    z: Math.cos(beta),
  });
  const plane: Plane = { point: planeAnchor, normal: planeNormal };

  const tanTheta = Math.tan(theta);
  const tanBeta = Math.tan(beta);
  const k = tanTheta * tanBeta;
  const maxReach = 1.65 * safeA;

  // 在下支圆锥上按方位角 phi ∈ [0, 2π] 过滤出合理可视化范围的点集
  const samples = 120;
  const branches: Vec3[][] = [];
  let currentBranch: Vec3[] = [];

  for (let i = 0; i <= samples; i++) {
    const phi = (i / samples) * Math.PI * 2;
    const denom = 1 - k * Math.cos(phi);
    if (denom <= 0.08) {
      if (currentBranch.length >= 2) {
        branches.push(currentBranch);
      }
      currentBranch = [];
      continue;
    }
    const rho = (h0 * tanTheta) / denom;
    const x = rho * Math.cos(phi);
    const y = rho * Math.sin(phi);
    const z = z0 - x * tanBeta;
    if (
      rho <= maxReach &&
      z >= -0.25 * safeA &&
      z <= 0.92 * safeA &&
      Math.abs(x) <= maxReach &&
      Math.abs(y) <= maxReach
    ) {
      currentBranch.push({ x, y, z });
    } else {
      if (currentBranch.length >= 2) {
        branches.push(currentBranch);
      }
      currentBranch = [];
    }
  }
  if (currentBranch.length >= 2) {
    branches.push(currentBranch);
  }

  // 若闭合曲线首尾相连，把末段拼到首段前以保持连续
  if (
    branches.length >= 2 &&
    branches[0].length > 0 &&
    branches[branches.length - 1].length > 0
  ) {
    const first = branches[0][0];
    const last =
      branches[branches.length - 1][branches[branches.length - 1].length - 1];
    if (norm(sub(first, last)) < 0.25 * safeA) {
      const merged = [...branches.pop()!, ...branches[0]];
      branches[0] = merged;
    }
  }

  // 从主分支取动点 P
  const mainBranch =
    branches.reduce<Vec3[]>(
      (best, br) => (br.length > best.length ? br : best),
      [],
    ) || [];
  let movingPointP: Vec3 = {
    x: h0 * tanTheta,
    y: 0,
    z: z0,
  };
  if (mainBranch.length > 0) {
    const idx = Math.min(
      mainBranch.length - 1,
      Math.floor(clampedT * (mainBranch.length - 1)),
    );
    movingPointP = mainBranch[idx];
  }

  // 圆锥 8 条母线底端终点（至 z = 0 平面高度）
  const coneRadiusBottom = safeA * tanTheta;
  const coneGeneratrices: Vec3[] = [];
  for (let i = 0; i < 8; i++) {
    const phi = (i / 8) * Math.PI * 2;
    coneGeneratrices.push({
      x: coneRadiusBottom * Math.cos(phi),
      y: coneRadiusBottom * Math.sin(phi),
      z: 0,
    });
  }

  const rightAngleMark = makeRightAngleBracket(
    vertices.A,
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 0 },
    0.12 * safeA,
  );

  return {
    a: safeA,
    halfAngleDeg,
    tiltDeg: safeTilt,
    conicType,
    eccentricity,
    vertices,
    planeAnchor,
    plane,
    curveBranches: branches,
    movingPointP,
    coneGeneratrices,
    rightAngleMark,
  };
}

/** 3D 场景内容包围盒（用于 CameraFit） */
export function getSolidDynamicLocusBounds(
  a: number,
  mode: SolidDynamicLocusMode,
): Bounds3D {
  const safeA = Math.max(0.5, a);
  if (mode === "constAngleConic") {
    return {
      min: { x: -0.9 * safeA, y: -0.9 * safeA, z: -0.25 * safeA },
      max: { x: 1.35 * safeA, y: 1.25 * safeA, z: 1.1 * safeA },
    };
  }
  return {
    min: { x: -0.2 * safeA, y: -0.2 * safeA, z: -0.1 * safeA },
    max: { x: 1.15 * safeA, y: 1.15 * safeA, z: 1.15 * safeA },
  };
}

/** 辅助校验：点 Q 是否满足 dot(Q - A, BD1) === 0 */
export function checkPerpToBD1(a: number, q: Vec3): number {
  const bd1: Vec3 = { x: -a, y: a, z: a };
  return dot(q, bd1);
}
