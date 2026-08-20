/**
 * 空间直角坐标系与求空间角/距离 核心数学模型求解器
 *
 * 遵循普通高中数学课程标准（选择性必修一·空间向量与立体几何）
 * 100% 纯函数，零 DOM / React 依赖，支持完备单元测试
 */

import type { Vec3 } from "./vector3";

export interface CuboidVertices {
  A: Vec3;
  B: Vec3;
  C: Vec3;
  D: Vec3;
  A1: Vec3;
  B1: Vec3;
  C1: Vec3;
  D1: Vec3;
  E: Vec3; // 动点 E(0, 0, lambda*c)
}

/**
 * 解算长方体标准顶点坐标（以 A 为坐标原点建立直角坐标系 A-xyz）
 */
export function solveCuboidVertices(
  a: number,
  b: number,
  c: number,
  lambda: number,
): CuboidVertices {
  const zE = Math.max(0.01, Math.min(c, lambda * c));
  return {
    A: { x: 0, y: 0, z: 0 },
    B: { x: a, y: 0, z: 0 },
    C: { x: a, y: b, z: 0 },
    D: { x: 0, y: b, z: 0 },
    A1: { x: 0, y: 0, z: c },
    B1: { x: a, y: 0, z: c },
    C1: { x: a, y: b, z: c },
    D1: { x: 0, y: b, z: c },
    E: { x: 0, y: 0, z: zE },
  };
}

export interface SkewLinesResult {
  u: Vec3; // 异面直线 1 (A1B): (a, 0, -c)
  v: Vec3; // 异面直线 2 (AC): (a, b, 0)
  uParallel: Vec3; // 平移向量 D1C // A1B: (a, 0, -c)
  cosTheta: number; // 异面直线角余弦 |u·v| / (|u||v|)
  angleDeg: number; // 异面直线夹角 (0°, 90°]
  P1: Vec3; // 公垂线段在 A1B 上的垂足
  P2: Vec3; // 公垂线段在 AC 上的垂足
  distance: number; // 异面直线间距离
}

/**
 * 求解长方体典型异面直线 A1B 与 AC 的夹角与平移模型
 */
export function solveSkewLines(
  a: number,
  b: number,
  c: number,
  _lambda: number,
): SkewLinesResult {
  // 异面直线 1: A1(0,0,c) -> B(a,0,0), u = A1B = (a, 0, -c)
  // 异面直线 2: A(0,0,0) -> C(a,b,0), v = AC = (a, b, 0)
  const u: Vec3 = { x: a, y: 0, z: -c };
  const v: Vec3 = { x: a, y: b, z: 0 };
  const uParallel: Vec3 = { x: a, y: 0, z: -c }; // D1(0,b,c) -> C(a,b,0)

  const dot = a * a;
  const lenU = Math.sqrt(a * a + c * c);
  const lenV = Math.sqrt(a * a + b * b);
  const cosTheta =
    lenU > 1e-6 && lenV > 1e-6
      ? Math.min(1, Math.max(0, Math.abs(dot) / (lenU * lenV)))
      : 1;
  const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;

  // 公垂向量 n = u × v = (b*c, -a*c, a*b)
  const nX = b * c;
  const nY = -a * c;
  const nZ = a * b;
  const lenN = Math.sqrt(nX * nX + nY * nY + nZ * nZ);

  // 公垂线距离: 连接 A1(0,0,c) 与 A(0,0,0), 向量 A1A = (0, 0, -c)
  // d = |A1A · n| / |n| = (a * b * c) / lenN
  const distance = lenN > 1e-6 ? (a * b * c) / lenN : 0;

  // 求解公垂线段在 A1B 上的点 P1 和 AC 上的点 P2
  // 设 P1 = A1 + s * u = (s*a, 0, c*(1-s))
  // 设 P2 = A + t * v = (t*a, t*b, 0)
  // 由 P1P2 // n 且 P1P2 ⊥ u, v
  const den = b * b * c * c + a * a * c * c + a * a * b * b;
  const s0 = den > 1e-6 ? (a * a * b * b) / den : 0.5;
  const t0 = den > 1e-6 ? (a * a * c * c) / den : 0.5;

  const P1: Vec3 = { x: s0 * a, y: 0, z: c * (1 - s0) };
  const P2: Vec3 = { x: t0 * a, y: t0 * b, z: 0 };

  return {
    u,
    v,
    uParallel,
    cosTheta,
    angleDeg,
    P1,
    P2,
    distance,
  };
}

export interface LinePlaneAngleResult {
  E: Vec3; // 动点 E(0, 0, zE)
  A: Vec3; // 垂足 A(0, 0, 0)
  C: Vec3; // 顶点 C(a, b, 0)
  lineVector: Vec3; // 空间体对角斜线向量 CE: (-a, -b, zE)
  projectionVector: Vec3; // 底面射影向量 CA: (-a, -b, 0)
  planeNormal: Vec3; // 底面法向量: (0, 0, 1)
  sinTheta: number; // 线面角正弦值
  cosTheta: number; // 线面角余弦值
  angleDeg: number; // 线面角大小 [0°, 90°]
  normalAngleDeg: number; // 斜线与法向量夹角
  zE: number; // 实际高度
}

/**
 * 求解空间斜线 EC 与底面 ABCD 的线面角（空间直角三角形 EAC）
 */
export function solveLinePlaneAngle(
  a: number,
  b: number,
  c: number,
  lambda: number,
): LinePlaneAngleResult {
  const zE = Math.max(0.01, Math.min(c, lambda * c));
  const E: Vec3 = { x: 0, y: 0, z: zE };
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };

  const lineVector: Vec3 = { x: -a, y: -b, z: zE };
  const projectionVector: Vec3 = { x: -a, y: -b, z: 0 };
  const planeNormal: Vec3 = { x: 0, y: 0, z: 1 };

  const lenL = Math.sqrt(a * a + b * b + zE * zE);
  const sinTheta = lenL > 1e-6 ? Math.min(1, Math.max(0, zE / lenL)) : 0;
  const cosTheta = Math.sqrt(Math.max(0, 1 - sinTheta * sinTheta));
  const angleDeg = (Math.asin(sinTheta) * 180) / Math.PI;

  const normalAngleDeg = 90 - angleDeg;

  return {
    E,
    A,
    C,
    lineVector,
    projectionVector,
    planeNormal,
    sinTheta,
    cosTheta,
    angleDeg,
    normalAngleDeg,
    zE,
  };
}

export interface DihedralAngleResult {
  n1: Vec3; // 底面法向量: (0, 0, 1)
  n2: Vec3; // 截面 BDE 法向量: (b*zE, a*zE, a*b) 归一化
  n2Raw: Vec3; // 未归一化法向量
  cosTheta: number; // 二面角余弦值 (由几何直观确认为锐二面角)
  dihedralDeg: number; // 二面角大小 [0°, 180°]
  edgeFootM: Vec3; // 垂足 M (过 A 向 BD 作垂线 AM ⊥ BD，由三垂线定理 EM ⊥ BD)
  centroidBase: Vec3; // 底面 △ABD 重心 G1(a/3, b/3, 0)
  centroidSection: Vec3; // 截面 △BDE 重心 G2(a/3, b/3, zE/3)
  zE: number; // 实际动点高度
}

/**
 * 求解截面 BDE 与底面 ABCD 的二面角（三垂线定理平面角 + 双法向量）
 */
export function solveDihedralAngle(
  a: number,
  b: number,
  c: number,
  lambda: number,
): DihedralAngleResult {
  const zE = Math.max(0.01, Math.min(c, lambda * c));
  const n1: Vec3 = { x: 0, y: 0, z: 1 };
  const n2Raw: Vec3 = { x: b * zE, y: a * zE, z: a * b };
  const lenN2 = Math.sqrt(
    n2Raw.x * n2Raw.x + n2Raw.y * n2Raw.y + n2Raw.z * n2Raw.z,
  );

  const n2: Vec3 =
    lenN2 > 1e-6
      ? { x: n2Raw.x / lenN2, y: n2Raw.y / lenN2, z: n2Raw.z / lenN2 }
      : { x: 0, y: 0, z: 1 };

  // 二面角平面角余弦值 (底面与截面形成锐二面角)
  const cosTheta = lenN2 > 1e-6 ? (a * b) / lenN2 : 1;
  const dihedralRad = Math.acos(Math.min(1, Math.max(-1, cosTheta)));
  const dihedralDeg = (dihedralRad * 180) / Math.PI;

  // 三垂线定理垂足 M: 在直线 BD 上，A(0,0,0) 向 BD 作垂线
  const bdDen = a * a + b * b;
  const edgeFootM: Vec3 =
    bdDen > 1e-6
      ? {
          x: (a * b * b) / bdDen,
          y: (a * a * b) / bdDen,
          z: 0,
        }
      : { x: 0, y: 0, z: 0 };

  const centroidBase: Vec3 = { x: a / 3, y: b / 3, z: 0 };
  const centroidSection: Vec3 = { x: a / 3, y: b / 3, z: zE / 3 };

  return {
    n1,
    n2,
    n2Raw,
    cosTheta,
    dihedralDeg,
    edgeFootM,
    centroidBase,
    centroidSection,
    zE,
  };
}

export interface DistanceVolumeResult {
  distance: number; // 点 A 到截面 BDE 的距离 d
  footH: Vec3; // 垂足 H 坐标
  areaBDE: number; // 截面三角形面积 S_BDE
  areaABD: number; // 底面三角形面积 S_ABD
  volume: number; // 三棱锥 E-ABD 体积
  maxVolume: number; // 动点到达 A1 时的体积极值
  zE: number; // 实际动点高度
}

/**
 * 求解点 A 到截面 BDE 的距离与三棱锥体积极值
 */
export function solvePointToPlaneDistance(
  a: number,
  b: number,
  c: number,
  lambda: number,
): DistanceVolumeResult {
  const zE = Math.max(0.01, Math.min(c, lambda * c));
  const nX = b * zE;
  const nY = a * zE;
  const nZ = a * b;
  const lenN = Math.sqrt(nX * nX + nY * nY + nZ * nZ);

  const distance = lenN > 1e-6 ? (a * b * zE) / lenN : 0;

  // 垂足 H 坐标: H = A + d * (n / |n|)
  const t = lenN > 1e-6 ? (a * b * zE) / (lenN * lenN) : 0;
  const footH: Vec3 = {
    x: t * nX,
    y: t * nY,
    z: t * nZ,
  };

  const areaBDE = 0.5 * lenN;
  const areaABD = 0.5 * a * b;
  const volume = (1 / 6) * a * b * zE;
  const maxVolume = (1 / 6) * a * b * c;

  return {
    distance,
    footH,
    areaBDE,
    areaABD,
    volume,
    maxVolume,
    zE,
  };
}
