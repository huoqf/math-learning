import type { Vec3 } from "./vector3";

export type FoldingModelKind =
  "trapezoid" | "rectangleDiagonal" | "triangleAltitude" | "rhombus";

export interface FoldingResult {
  model: FoldingModelKind;
  /** 3D 关键顶点映射 */
  points: Record<string, Vec3>;
  /** 二面角平面角垂线构造点：垂足 H，静态面内垂线端点 H_base，翻折面内垂线端点 H_fold */
  dihedralRays?: {
    vertex: Vec3;
    baseRayEnd: Vec3;
    foldRayEnd: Vec3;
  };
  /** 静态底面法向量 n1 与 翻折面法向量 n2 */
  normals?: {
    n1: Vec3;
    n2: Vec3;
  };
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
  /** 矩形对角线翻折时异面直线 A'D ⊥ BC 对应的临界二面角 (度数) */
  criticalPerpAlphaDeg?: number;
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
  const heightZ = Math.max(0, D_prime.z);
  const pyramidVolume = (1 / 3) * baseArea * heightZ;

  // 二面角定义垂线：垂足 E(b, 0, 0)，底面垂线指向 A(0,0,0)，翻折面垂线指向 D'
  const dihedralRays = {
    vertex: E,
    baseRayEnd: A,
    foldRayEnd: D_prime,
  };

  // 法向量：底面法向量 (0, 0, 1)，翻折面法向量 (-sin α, 0, cos α)
  const normals = {
    n1: { x: 0, y: 0, z: 1 },
    n2: { x: -Math.sin(alphaRad), y: 0, z: Math.cos(alphaRad) },
  };

  return {
    model: "trapezoid",
    points: { A, B, C, E, "D'": D_prime },
    dihedralRays,
    normals,
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
  const projA = (a * a) / L;
  const HA: Vec3 = {
    x: B.x + projA * ux,
    y: B.y + projA * uy,
    z: 0,
  };

  // C 到对角线 BD 的垂足 H_C
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

  // 异面直线 A'D 与 BC 的向量夹角
  const vAprimeD = {
    x: D.x - A_prime.x,
    y: D.y - A_prime.y,
    z: D.z - A_prime.z,
  };
  const vBC = { x: C.x - B.x, y: C.y - B.y, z: C.z - B.z }; // (0, b, 0)
  const dot = vAprimeD.x * vBC.x + vAprimeD.y * vBC.y + vAprimeD.z * vBC.z;
  const lenAprimeD = Math.sqrt(
    vAprimeD.x ** 2 + vAprimeD.y ** 2 + vAprimeD.z ** 2,
  );
  const lenBC = Math.sqrt(vBC.x ** 2 + vBC.y ** 2 + vBC.z ** 2);
  const cosSkew = Math.abs(dot) / (lenAprimeD * lenBC || 1);
  const skewLinesAngleDeg =
    (Math.acos(Math.min(1, Math.max(0, cosSkew))) * 180) / Math.PI;

  // 高考临界角：A'D ⊥ BC 时的二面角 cos(alpha_perp) = -b^2 / a^2（代数推导：criticalCos = b³/L² ÷ (-a²b/L²) = -b²/a²）
  // vAprimeD · vBC = 0 <=> D.y - A_prime.y = 0 <=> A_prime.y = D.y = b/2
  // rA_prime_y = b/2 - HA.y
  // rAy * cos(alpha) + vAy * sin(alpha) = b/2 - HA.y (由于 vAy = 0，因此 cos(alpha) = (b/2 - HA.y) / rAy)
  let criticalPerpAlphaDeg: number | undefined;
  if (Math.abs(rAy) > 1e-6) {
    const targetCos = (b / 2 - HA.y) / rAy;
    if (targetCos >= -1 && targetCos <= 1) {
      criticalPerpAlphaDeg = Math.round((Math.acos(targetCos) * 180) / Math.PI);
    }
  }

  // 二面角定义垂线对：垂足 HA，底面指向 A_base(沿平面与 BD 垂直的射线)，翻折面指向 A'
  const dihedralRays = {
    vertex: HA,
    baseRayEnd: A,
    foldRayEnd: A_prime,
  };

  return {
    model: "rectangleDiagonal",
    points: { A, B, C, D, HA, HC, "A'": A_prime },
    dihedralRays,
    movingSegmentLength,
    movingSegmentName: "|A'C|",
    pyramidVolume,
    circumSphereRadius,
    skewLinesAngleDeg,
    criticalPerpAlphaDeg,
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

  // 变动底边 BC' 长度：B=(-a/2,0,0), C'=(a/2·cosα, 0, a/2·sinα)
  // |BC'|² = (a/2)²·2(1+cosα) = a²·cos²(α/2)，故 |BC'| = a·cos(α/2)
  const movingSegmentLength = a * Math.cos(alphaRad / 2);

  // 三棱锥 A-BC'D 体积 = (1/3) * S_BC'D * h = (1/6) * (1/2 * a/2 * a/2 * sin(alpha)) * h
  const baseArea = 0.5 * halfA * halfA * Math.sin(alphaRad);
  const pyramidVolume = (1 / 3) * baseArea * h;

  // 二面角定义垂线对：垂足 D，底面指向 B，翻折面指向 C'
  const dihedralRays = {
    vertex: D,
    baseRayEnd: B,
    foldRayEnd: C_prime,
  };

  return {
    model: "triangleAltitude",
    points: { A, B, D, "C'": C_prime },
    dihedralRays,
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
  const heightZ = Math.max(0, A_prime.z);
  const pyramidVolume = (1 / 3) * baseArea * heightZ;

  // 二面角定义垂线对：垂足 O(0,0,0)，底面指向 A_0(-hAO, 0, 0)，翻折面指向 A'
  const dihedralRays = {
    vertex: O,
    baseRayEnd: { x: -hAO, y: 0, z: 0 },
    foldRayEnd: A_prime,
  };

  return {
    model: "rhombus",
    points: { O, B, C, D, "A'": A_prime },
    dihedralRays,
    movingSegmentLength,
    movingSegmentName: "|A'C|",
    pyramidVolume,
    skewLinesAngleDeg: 90, // A'C 与 BD 恒垂直
  };
}

import type { Polyhedron } from "./sectionIntersection";

/**
 * 根据折叠结果构建标准 Polyhedron 几何体（供三视图投影与正投影分析）
 */
export function buildFoldingPolyhedron(result: FoldingResult): Polyhedron {
  switch (result.model) {
    case "trapezoid": {
      const { A, B, C, E, "D'": D_prime } = result.points;
      // 顶点: 0:A, 1:B, 2:C, 3:E, 4:D'
      const vertices = [A, B, C, E, D_prime];
      const edges = [
        { a: 0, b: 1 }, // AB
        { a: 1, b: 2 }, // BC
        { a: 2, b: 3 }, // CE
        { a: 3, b: 0 }, // EA
        { a: 3, b: 4 }, // ED'
        { a: 2, b: 4 }, // CD'
        { a: 0, b: 4 }, // AD'
      ];
      const faces = [
        [0, 1, 2, 3], // 底面 ABCE
        [3, 2, 4], // 翻折面 ECD'
        [0, 3, 4], // 侧面 AED'
        [0, 4, 2, 1], // 侧面 ABD'C
      ];
      return { vertices, edges, faces };
    }
    case "rectangleDiagonal": {
      const { B, C, D, "A'": A_prime } = result.points;
      // 顶点: 0:B, 1:C, 2:D, 3:A'
      const vertices = [B, C, D, A_prime];
      const edges = [
        { a: 0, b: 1 }, // BC
        { a: 1, b: 2 }, // CD
        { a: 2, b: 0 }, // DB
        { a: 0, b: 3 }, // BA'
        { a: 2, b: 3 }, // DA'
        { a: 1, b: 3 }, // CA'
      ];
      const faces = [
        [0, 1, 2], // 底面 BCD
        [0, 3, 2], // 侧面 BA'D
        [0, 1, 3], // 侧面 BCA'
        [1, 2, 3], // 侧面 CDA'
      ];
      return { vertices, edges, faces };
    }
    case "triangleAltitude": {
      const { A, B, D, "C'": C_prime } = result.points;
      // 顶点: 0:D, 1:A, 2:B, 3:C'
      const vertices = [D, A, B, C_prime];
      const edges = [
        { a: 0, b: 1 }, // DA
        { a: 0, b: 2 }, // DB
        { a: 1, b: 2 }, // AB
        { a: 0, b: 3 }, // DC'
        { a: 1, b: 3 }, // AC'
        { a: 2, b: 3 }, // BC'
      ];
      const faces = [
        [0, 1, 2], // 面 DAB
        [0, 3, 1], // 面 DC'A
        [0, 2, 3], // 面 DBC'
        [1, 2, 3], // 面 ABC'
      ];
      return { vertices, edges, faces };
    }
    case "rhombus": {
      const { B, C, D, "A'": A_prime } = result.points;
      // 顶点: 0:B, 1:C, 2:D, 3:A'
      const vertices = [B, C, D, A_prime];
      const edges = [
        { a: 0, b: 1 }, // BC
        { a: 1, b: 2 }, // CD
        { a: 2, b: 0 }, // DB
        { a: 0, b: 3 }, // BA'
        { a: 2, b: 3 }, // DA'
        { a: 1, b: 3 }, // CA'
      ];
      const faces = [
        [0, 1, 2], // 面 BCD
        [0, 3, 2], // 面 BA'D
        [0, 1, 3], // 面 BCA'
        [1, 2, 3], // 面 CDA'
      ];
      return { vertices, edges, faces };
    }
  }
}
