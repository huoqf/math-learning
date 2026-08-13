import type { Vec3 } from "./vector3";

export type FoldingModelKind =
  "trapezoid" | "rectangleDiagonal" | "triangleAltitude" | "rhombus";

export interface FoldingResult {
  model: FoldingModelKind;
  /** 3D 关键顶点映射 */
  points: Record<string, Vec3>;
  /** 变动线段长度 (例如 D'A, A'C, BC') */
  movingSegmentLength: number;
  /** 变动线段名称 */
  movingSegmentName: string;
  /** 翻折形成的立体（三棱锥/四棱锥）体积 */
  pyramidVolume: number;
  /** 三棱锥外接球半径 (若适用，如矩形对角线翻折) */
  circumSphereRadius?: number;
  /** 异面直线夹角 (角度值，如 90.0) */
  skewLinesAngleDeg?: number;
}

/**
 * 1. 直角梯形翻折 (ABCD 中 AD ∥ BC, AB ⊥ AD, AE = BC = b)
 * 笛卡尔坐标系：A 为原点 (0,0,0)，下底 AD 沿 +x 轴，垂直腰 AB 沿 +y 轴。
 * A(0,0,0), B(0,h,0), C(b,h,0), D(a,0,0), E(b,0,0)。
 * 折痕为 CE (从 (b,0,0) 到 (b,h,0)，平行于 +y 轴)。
 * △CDE 绕 CE 旋转 alpha 度得到 D'。
 */
export function calculateRightTrapezoidFolding(
  a: number,
  b: number,
  h: number,
  alphaDeg: number,
): FoldingResult {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const lenED = a - b;

  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: 0, y: h, z: 0 };
  const C: Vec3 = { x: b, y: h, z: 0 };
  const E: Vec3 = { x: b, y: 0, z: 0 };

  // D' 绕折痕 CE (平行于 +y 轴) 旋转 alpha 角
  const D_prime: Vec3 = {
    x: b + lenED * Math.cos(alphaRad),
    y: 0,
    z: lenED * Math.sin(alphaRad),
  };

  // 变动线段 D'A 长度
  const movingSegmentLength = Math.sqrt(
    (D_prime.x - A.x) ** 2 + (D_prime.y - A.y) ** 2 + (D_prime.z - A.z) ** 2,
  );

  // 四棱锥 D'-ABCE 体积 = (1/3) * S_ABCE * height_z
  const baseArea = b * h;
  const heightZ = D_prime.z;
  const pyramidVolume = (1 / 3) * baseArea * heightZ;

  return {
    model: "trapezoid",
    points: { A, B, C, E, "D'": D_prime },
    movingSegmentLength,
    movingSegmentName: "|D'A|",
    pyramidVolume,
  };
}

/**
 * 2. 矩形沿对角线 BD 翻折 (矩形 ABCD，长 AB = a，宽 AD = b)
 * 笛卡尔坐标系：矩形中心 O 为原点 (0,0,0)，长 AB 沿 x 轴，宽 AD 沿 y 轴。
 * A(-a/2, -b/2, 0), B(a/2, -b/2, 0), C(a/2, b/2, 0), D(-a/2, b/2, 0)。
 * 对角线折痕为 BD。△ABD 绕轴 BD 旋转 alpha 度得到 A'。
 */
export function calculateRectangleDiagonalFolding(
  a: number,
  b: number,
  alphaDeg: number,
): FoldingResult {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const L = Math.sqrt(a * a + b * b);

  const A: Vec3 = { x: -a / 2, y: -b / 2, z: 0 };
  const B: Vec3 = { x: a / 2, y: -b / 2, z: 0 };
  const C: Vec3 = { x: a / 2, y: b / 2, z: 0 };
  const D: Vec3 = { x: -a / 2, y: b / 2, z: 0 };

  // 对角线向量 BD = D - B = (-a, b, 0)
  const ux = -a / L;
  const uy = b / L;
  const uz = 0; // 单位向量 u

  // A 到对角线 BD 的垂足 H_A
  // vec(BA) = (-a, 0, 0)
  // proj_u(BA) = vec(BA) · u = (-a) * (-a/L) = a^2 / L
  const projA = (a * a) / L;
  const HA: Vec3 = {
    x: B.x + projA * ux,
    y: B.y + projA * uy,
    z: 0,
  };

  // C 到对角线 BD 的垂足 H_C
  // vec(BC) = (0, b, 0)
  // proj_u(BC) = vec(BC) · u = b * (b/L) = b^2 / L
  const projC = (b * b) / L;
  const HC: Vec3 = {
    x: B.x + projC * ux,
    y: B.y + projC * uy,
    z: 0,
  };

  // 旋转 A 相对 HA 的向量 rA = A - HA
  const rAx = A.x - HA.x;
  const rAy = A.y - HA.y;
  const rAz = 0;

  // vA = u × rA
  const vAx = uy * rAz - uz * rAy;
  const vAy = uz * rAx - ux * rAz;
  const vAz = ux * rAy - uy * rAx;

  // Rodrigues 旋转: rA' = rA * cos(alpha) + vA * sin(alpha)
  const rA_prime_x = rAx * Math.cos(alphaRad) + vAx * Math.sin(alphaRad);
  const rA_prime_y = rAy * Math.cos(alphaRad) + vAy * Math.sin(alphaRad);
  const rA_prime_z = rAz * Math.cos(alphaRad) + vAz * Math.sin(alphaRad);

  const A_prime: Vec3 = {
    x: HA.x + rA_prime_x,
    y: HA.y + rA_prime_y,
    z: HA.z + rA_prime_z,
  };

  // 变动线段 A'C 长度
  const movingSegmentLength = Math.sqrt(
    (A_prime.x - C.x) ** 2 + (A_prime.y - C.y) ** 2 + (A_prime.z - C.z) ** 2,
  );

  // 三棱锥 A'-BCD 外接球半径 R = L / 2 (恒定不变)
  const circumSphereRadius = L / 2;

  // 三棱锥 A'-BCD 体积 = (1/3) * S_BCD * height_z
  const baseArea = 0.5 * a * b;
  const heightZ = Math.abs(A_prime.z);
  const pyramidVolume = (1 / 3) * baseArea * heightZ;

  return {
    model: "rectangleDiagonal",
    points: { A, B, C, D, HA, HC, "A'": A_prime },
    movingSegmentLength,
    movingSegmentName: "|A'C|",
    pyramidVolume,
    circumSphereRadius,
  };
}

/**
 * 3. 等腰三角形沿高 AD 折叠
 * 笛卡尔坐标系：底边中点 D 为原点 (0,0,0)，高 AD 沿 +y 轴。
 * D(0,0,0), A(0,h,0), B(-a/2, 0, 0), C_0(a/2, 0, 0)。
 * △ACD 绕 AD (+y 轴) 旋转 alpha 度得到 C'。
 */
export function calculateTriangleAltitudeFolding(
  a: number,
  h: number,
  alphaDeg: number,
): FoldingResult {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const halfA = a / 2;

  const D: Vec3 = { x: 0, y: 0, z: 0 };
  const A: Vec3 = { x: 0, y: h, z: 0 };
  const B: Vec3 = { x: -halfA, y: 0, z: 0 };

  const C_prime: Vec3 = {
    x: halfA * Math.cos(alphaRad),
    y: 0,
    z: halfA * Math.sin(alphaRad),
  };

  // 变动底边 BC' 长度 = a * sin(alpha / 2)
  const movingSegmentLength = a * Math.sin(alphaRad / 2);

  // 三棱锥 A-BC'D 体积 = (1/3) * S_BC'D * h = (1/6) * (1/2 * a/2 * a/2 * sin(alpha)) * h
  const baseArea = 0.5 * halfA * halfA * Math.sin(alphaRad);
  const pyramidVolume = (1 / 3) * baseArea * h;

  return {
    model: "triangleAltitude",
    points: { A, B, D, "C'": C_prime },
    movingSegmentLength,
    movingSegmentName: "|BC'|",
    pyramidVolume,
  };
}

/**
 * 4. 菱形沿短对角线 BD 折叠 (边长 a，∠BAD = 60°)
 * 笛卡尔坐标系：对角线交点 O 为原点 (0,0,0)，短对角线 BD 沿 y 轴，长对角线 AC 沿 x 轴。
 * O(0,0,0), B(0, -a/2, 0), D(0, a/2, 0), C(hAO, 0, 0), A_0(-hAO, 0, 0)。
 * △ABD 绕 BD (+y 轴) 旋转 alpha 度得到 A'。
 */
export function calculateRhombusFolding(
  a: number,
  alphaDeg: number,
): FoldingResult {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const hAO = (Math.sqrt(3) / 2) * a; // OA 长度

  const O: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: 0, y: -a / 2, z: 0 };
  const D: Vec3 = { x: 0, y: a / 2, z: 0 };
  const C: Vec3 = { x: hAO, y: 0, z: 0 };

  const A_prime: Vec3 = {
    x: -hAO * Math.cos(alphaRad),
    y: 0,
    z: hAO * Math.sin(alphaRad),
  };

  // 对角顶点距离 |A'C|
  const movingSegmentLength = Math.sqrt(
    (A_prime.x - C.x) ** 2 + (A_prime.y - C.y) ** 2 + (A_prime.z - C.z) ** 2,
  );

  // 三棱锥 A'-BCD 体积 = (1/3) * S_BCD * height_z
  const baseArea = 0.5 * a * hAO;
  const heightZ = A_prime.z;
  const pyramidVolume = (1 / 3) * baseArea * heightZ;

  return {
    model: "rhombus",
    points: { O, B, C, D, "A'": A_prime },
    movingSegmentLength,
    movingSegmentName: "|A'C|",
    pyramidVolume,
    skewLinesAngleDeg: 90, // A'C 与 BD 恒垂直
  };
}
