import type { Vec3 } from "./vector3";

export interface CornerModelResult {
  /** 墙角三棱锥 4 个顶点: P(原点), A, B, C */
  pyramidVertices: { P: Vec3; A: Vec3; B: Vec3; C: Vec3 };
  /** 补形长方体 8 个顶点 */
  cuboidVertices: Vec3[];
  /** 外接球球心 */
  center: Vec3;
  /** 外接球半径 R */
  radius: number;
  /** 外接球表面积 S = 4 * pi * R^2 */
  surfaceArea: number;
  /** 外接球体积 V = 4/3 * pi * R^3 */
  volume: number;
}

export interface CylinderModelResult {
  /** 下底面顶点 */
  bottomVertices: Vec3[];
  /** 上底面顶点 */
  topVertices: Vec3[];
  /** 下底面外接圆心 O1 */
  bottomCenter: Vec3;
  /** 上底面外接圆心 O2 */
  topCenter: Vec3;
  /** 外接球球心 O */
  center: Vec3;
  /** 底面外接圆半径 r_base */
  rBase: number;
  /** 高度 h */
  height: number;
  /** 外接球半径 R */
  radius: number;
  /** 外接球表面积 */
  surfaceArea: number;
  /** 外接球体积 */
  volume: number;
}

export interface ComplementModelResult {
  /** 四面体 4 个交错顶点 */
  tetrahedronVertices: Vec3[];
  /** 补形长方体 8 个顶点 */
  cuboidVertices: Vec3[];
  /** 补形长方体长宽高 (x, y, z) */
  boxDimensions: Vec3;
  /** 外接球球心 O */
  center: Vec3;
  /** 外接球半径 R */
  radius: number;
  /** 外接球表面积 */
  surfaceArea: number;
  /** 外接球体积 */
  volume: number;
  /** 是否可构成实数补形长方体 */
  isValid: boolean;
}

/**
 * 1. 墙角模型（侧棱两两垂直三棱锥 P-ABC）
 * @param a 侧棱 PA 长度
 * @param b 侧棱 PB 长度
 * @param c 侧棱 PC 长度
 */
export function calculateCornerModel(
  a: number,
  b: number,
  c: number,
): CornerModelResult {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);
  const safeC = Math.max(0.1, c);

  const P: Vec3 = { x: 0, y: 0, z: 0 };
  const A: Vec3 = { x: safeA, y: 0, z: 0 };
  const B: Vec3 = { x: 0, y: safeB, z: 0 };
  const C: Vec3 = { x: 0, y: 0, z: safeC };

  const cuboidVertices: Vec3[] = [
    { x: 0, y: 0, z: 0 },
    { x: safeA, y: 0, z: 0 },
    { x: safeA, y: safeB, z: 0 },
    { x: 0, y: safeB, z: 0 },
    { x: 0, y: 0, z: safeC },
    { x: safeA, y: 0, z: safeC },
    { x: safeA, y: safeB, z: safeC },
    { x: 0, y: safeB, z: safeC },
  ];

  const radius = Math.sqrt(safeA * safeA + safeB * safeB + safeC * safeC) / 2;
  const center: Vec3 = { x: safeA / 2, y: safeB / 2, z: safeC / 2 };
  const surfaceArea = 4 * Math.PI * radius * radius;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);

  return {
    pyramidVertices: { P, A, B, C },
    cuboidVertices,
    center,
    radius,
    surfaceArea,
    volume,
  };
}

/**
 * 2. 柱体模型（直三棱柱 / 直棱柱）
 * @param a 底面直角边 a
 * @param b 底面直角边 b
 * @param h 柱体高度
 */
export function calculateCylinderModel(
  a: number,
  b: number,
  h: number,
): CylinderModelResult {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);
  const safeH = Math.max(0.1, h);

  // 直角三角形底面斜边长 c_base = sqrt(a^2 + b^2)
  const cBase = Math.sqrt(safeA * safeA + safeB * safeB);
  const rBase = cBase / 2;

  const bottomVertices: Vec3[] = [
    { x: 0, y: 0, z: 0 },
    { x: safeA, y: 0, z: 0 },
    { x: 0, y: safeB, z: 0 },
  ];

  const topVertices: Vec3[] = [
    { x: 0, y: 0, z: safeH },
    { x: safeA, y: 0, z: safeH },
    { x: 0, y: safeB, z: safeH },
  ];

  const bottomCenter: Vec3 = { x: safeA / 2, y: safeB / 2, z: 0 };
  const topCenter: Vec3 = { x: safeA / 2, y: safeB / 2, z: safeH };
  const center: Vec3 = { x: safeA / 2, y: safeB / 2, z: safeH / 2 };

  const radius = Math.sqrt(rBase * rBase + Math.pow(safeH / 2, 2));
  const surfaceArea = 4 * Math.PI * radius * radius;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);

  return {
    bottomVertices,
    topVertices,
    bottomCenter,
    topCenter,
    center,
    rBase,
    height: safeH,
    radius,
    surfaceArea,
    volume,
  };
}

/**
 * 3. 补形模型（对棱相等四面体）
 * @param a 对棱1 长度 (AB = CD = a)
 * @param b 对棱2 长度 (AC = BD = b)
 * @param c 对棱3 长度 (AD = BC = c)
 */
export function calculateComplementModel(
  a: number,
  b: number,
  c: number,
): ComplementModelResult {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);
  const safeC = Math.max(0.1, c);

  const x2 = (safeA * safeA + safeB * safeB - safeC * safeC) / 2;
  const y2 = (safeA * safeA + safeC * safeC - safeB * safeB) / 2;
  const z2 = (safeB * safeB + safeC * safeC - safeA * safeA) / 2;

  const isValid = x2 > 0 && y2 > 0 && z2 > 0;

  const x = isValid ? Math.sqrt(x2) : 1;
  const y = isValid ? Math.sqrt(y2) : 1;
  const z = isValid ? Math.sqrt(z2) : 1;

  // 四面体 4 个交错顶点
  const V1: Vec3 = { x: 0, y: 0, z: z };
  const V2: Vec3 = { x: x, y: y, z: z };
  const V3: Vec3 = { x: x, y: 0, z: 0 };
  const V4: Vec3 = { x: 0, y: y, z: 0 };

  const tetrahedronVertices = [V1, V2, V3, V4];

  const cuboidVertices: Vec3[] = [
    { x: 0, y: 0, z: 0 },
    { x: x, y: 0, z: 0 },
    { x: x, y: y, z: 0 },
    { x: 0, y: y, z: 0 },
    { x: 0, y: 0, z: z },
    { x: x, y: 0, z: z },
    { x: x, y: y, z: z },
    { x: 0, y: y, z: z },
  ];

  const center: Vec3 = { x: x / 2, y: y / 2, z: z / 2 };
  const radius =
    Math.sqrt(safeA * safeA + safeB * safeB + safeC * safeC) /
    (2 * Math.sqrt(2));
  const surfaceArea = 4 * Math.PI * radius * radius;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);

  return {
    tetrahedronVertices,
    cuboidVertices,
    boxDimensions: { x, y, z },
    center,
    radius,
    surfaceArea,
    volume,
    isValid,
  };
}
