/**
 * 高中立体几何切接球纯数学计算核心 (综合几何范式)
 * 严格支持长方体、正四棱锥、直三棱柱、圆锥、圆柱五大几何体
 * 包含外接球/内切球半径、球心坐标、必标辅助线特征点与切点
 */

import type { Vec3 } from "./vector3";

export type SphereType = "circum" | "inscribed";
export type ShapeType =
  "cuboid" | "regularPyramid" | "triangularPrism" | "cone" | "cylinder";

export interface SphereModelResult {
  radius: number;
  center: Vec3;
  /** 关键特征点集合（用于辅助线与标注） */
  keyPoints: Record<string, Vec3>;
  /** 辅助线段集合 (from -> to) */
  auxSegments: { from: Vec3; to: Vec3; label?: string; dashed?: boolean }[];
  /** 几何体体积 */
  solidVolume: number;
  /** 几何体表面积 */
  solidArea: number;
  /** 球体积 */
  sphereVolume: number;
  /** 球表面积 */
  sphereArea: number;
}

/**
 * 1. 长方体切接球计算
 */
export function calculateCuboidSphere(
  a: number,
  b: number,
  c: number,
  type: SphereType,
): SphereModelResult {
  const solidVolume = a * b * c;
  const solidArea = 2 * (a * b + b * c + c * a);
  const center: Vec3 = { x: a / 2, y: b / 2, z: c / 2 };

  if (type === "circum") {
    const diag = Math.sqrt(a * a + b * b + c * c);
    const radius = diag / 2;
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    const O: Vec3 = { x: 0, y: 0, z: 0 };
    const B1: Vec3 = { x: a, y: b, z: c };
    const B: Vec3 = { x: a, y: b, z: 0 };
    const A: Vec3 = { x: a, y: 0, z: 0 };

    return {
      radius,
      center,
      keyPoints: { O, B, B1, A, Center: center },
      auxSegments: [
        { from: O, to: B1, label: "2R", dashed: true },
        { from: O, to: B, label: "底面对角线", dashed: true },
        { from: B, to: B1, label: "高 c", dashed: false },
        { from: center, to: B1, dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  } else {
    // 内切球
    const radius = Math.min(a, b, c) / 2;
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    const tBottom: Vec3 = { x: a / 2, y: b / 2, z: 0 };
    const tTop: Vec3 = { x: a / 2, y: b / 2, z: c };
    const tFront: Vec3 = { x: a, y: b / 2, z: c / 2 };
    const tBack: Vec3 = { x: 0, y: b / 2, z: c / 2 };
    const tRight: Vec3 = { x: a / 2, y: b, z: c / 2 };
    const tLeft: Vec3 = { x: a / 2, y: 0, z: c / 2 };

    return {
      radius,
      center,
      keyPoints: {
        Center: center,
        tBottom,
        tTop,
        tFront,
        tBack,
        tRight,
        tLeft,
      },
      auxSegments: [
        { from: center, to: tBottom, label: "r", dashed: true },
        { from: center, to: tTop, label: "r", dashed: true },
        { from: center, to: tFront, label: "r", dashed: true },
        { from: center, to: tRight, label: "r", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  }
}

/**
 * 2. 正四棱锥切接球计算
 */
export function calculatePyramidSphere(
  a: number,
  h: number,
  type: SphereType,
): SphereModelResult {
  const rBase = a / Math.sqrt(2);
  const hs = Math.sqrt(h * h + (a / 2) ** 2);
  const solidVolume = (1 / 3) * a * a * h;
  const solidArea = a * a + 2 * a * hs;

  const S: Vec3 = { x: 0, y: 0, z: h };
  const OBase: Vec3 = { x: 0, y: 0, z: 0 };
  const A: Vec3 = { x: a / 2, y: -a / 2, z: 0 };
  const M: Vec3 = { x: a / 2, y: 0, z: 0 }; // 侧面中点

  if (type === "circum") {
    // (h-R)^2 + rBase^2 = R^2 => R = (rBase^2 + h^2) / (2h)
    const radius = (rBase * rBase + h * h) / (2 * h);
    const center: Vec3 = { x: 0, y: 0, z: h - radius };
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    return {
      radius,
      center,
      keyPoints: { S, OBase, A, Center: center },
      auxSegments: [
        { from: S, to: OBase, label: "高线 h", dashed: true },
        { from: OBase, to: A, label: "r底", dashed: true },
        { from: center, to: S, label: "R", dashed: true },
        { from: center, to: A, label: "R", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  } else {
    // r = 3V / S表 = a*h / (a + 2hs)
    const radius = (a * h) / (a + 2 * hs);
    const center: Vec3 = { x: 0, y: 0, z: radius };
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    // 侧面相切切点 T
    // cos(theta) = (a/2) / hs, sin(theta) = h / hs
    // 切点在 SM 上，距 S 的距离为 l_tangent = hs - (a/2) * (r / (a/2))
    const tSideZ = radius + (radius * (a / 2)) / hs;
    const tSideX = (radius * h) / hs;
    const tSide: Vec3 = { x: tSideX, y: 0, z: tSideZ };

    return {
      radius,
      center,
      keyPoints: { S, OBase, M, Center: center, tSide },
      auxSegments: [
        { from: S, to: OBase, label: "高 h", dashed: true },
        { from: S, to: M, label: "斜高 hs", dashed: true },
        { from: center, to: OBase, label: "r", dashed: true },
        { from: center, to: tSide, label: "r", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  }
}

/**
 * 3. 直三棱柱切接球计算
 */
export function calculatePrismSphere(
  a: number,
  b: number,
  h: number,
  type: SphereType,
): SphereModelResult {
  const solidVolume = 0.5 * a * b * h;
  const cHyp = Math.sqrt(a * a + b * b);
  const solidArea = a * b + (a + b + cHyp) * h;

  const rBaseCircum = cHyp / 2;
  const rBaseIn = (a + b - cHyp) / 2;

  if (type === "circum") {
    const radius = Math.sqrt(rBaseCircum * rBaseCircum + (h / 2) ** 2);
    const center: Vec3 = { x: a / 2, y: b / 2, z: h / 2 };
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    const O1: Vec3 = { x: a / 2, y: b / 2, z: 0 };
    const O2: Vec3 = { x: a / 2, y: b / 2, z: h };
    const C1: Vec3 = { x: 0, y: b, z: h };

    return {
      radius,
      center,
      keyPoints: { O1, O2, Center: center, C1 },
      auxSegments: [
        { from: O1, to: O2, label: "外心高线", dashed: true },
        { from: center, to: O1, dashed: true },
        { from: center, to: C1, label: "R", dashed: true },
        { from: O2, to: C1, label: "r底", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  } else {
    const radius = Math.min(rBaseIn, h / 2);
    const center: Vec3 = { x: rBaseIn, y: rBaseIn, z: h / 2 };
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    const tBottom: Vec3 = { x: rBaseIn, y: rBaseIn, z: 0 };
    const tTop: Vec3 = { x: rBaseIn, y: rBaseIn, z: h };
    const tSideA: Vec3 = { x: rBaseIn, y: 0, z: h / 2 };
    const tSideB: Vec3 = { x: 0, y: rBaseIn, z: h / 2 };

    return {
      radius,
      center,
      keyPoints: { Center: center, tBottom, tTop, tSideA, tSideB },
      auxSegments: [
        { from: center, to: tBottom, label: "r", dashed: true },
        { from: center, to: tTop, label: "r", dashed: true },
        { from: center, to: tSideA, label: "r", dashed: true },
        { from: center, to: tSideB, label: "r", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  }
}

/**
 * 4. 圆锥切接球计算
 */
export function calculateConeSphere(
  r: number,
  h: number,
  type: SphereType,
): SphereModelResult {
  const l = Math.sqrt(r * r + h * h);
  const solidVolume = (1 / 3) * Math.PI * r * r * h;
  const solidArea = Math.PI * r * r + Math.PI * r * l;

  const S: Vec3 = { x: 0, y: 0, z: h };
  const OBase: Vec3 = { x: 0, y: 0, z: 0 };
  const A: Vec3 = { x: r, y: 0, z: 0 };

  if (type === "circum") {
    const radius = (r * r + h * h) / (2 * h);
    const center: Vec3 = { x: 0, y: 0, z: h - radius };
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    return {
      radius,
      center,
      keyPoints: { S, OBase, A, Center: center },
      auxSegments: [
        { from: S, to: OBase, label: "轴高 h", dashed: true },
        { from: OBase, to: A, label: "底半径 r", dashed: false },
        { from: S, to: A, label: "母线 l", dashed: false },
        { from: center, to: S, label: "R", dashed: true },
        { from: center, to: A, label: "R", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  } else {
    // rIn = r*h / (r + l)
    const radius = (r * h) / (r + l);
    const center: Vec3 = { x: 0, y: 0, z: radius };
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    // 母线切点坐标 (x, 0, z)
    // sin(alpha) = r / l, cos(alpha) = h / l
    // 垂足距轴线距离 x = radius * cos(alpha) = radius * h / l
    // 垂足高度 z = radius + radius * sin(alpha) = radius + radius * r / l
    const tSide: Vec3 = {
      x: (radius * h) / l,
      y: 0,
      z: radius + (radius * r) / l,
    };

    return {
      radius,
      center,
      keyPoints: { S, OBase, A, Center: center, tSide },
      auxSegments: [
        { from: S, to: OBase, label: "轴高 h", dashed: true },
        { from: S, to: A, label: "母线 l", dashed: false },
        { from: center, to: OBase, label: "r", dashed: true },
        { from: center, to: tSide, label: "r", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  }
}

/**
 * 5. 圆柱切接球计算
 */
export function calculateCylinderSphere(
  r: number,
  h: number,
  type: SphereType,
): SphereModelResult {
  const solidVolume = Math.PI * r * r * h;
  const solidArea = 2 * Math.PI * r * r + 2 * Math.PI * r * h;
  const center: Vec3 = { x: 0, y: 0, z: h / 2 };

  const O1: Vec3 = { x: 0, y: 0, z: 0 };
  const O2: Vec3 = { x: 0, y: 0, z: h };
  const A1: Vec3 = { x: r, y: 0, z: h };

  if (type === "circum") {
    const radius = Math.sqrt(r * r + (h / 2) ** 2);
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    return {
      radius,
      center,
      keyPoints: { O1, O2, Center: center, A1 },
      auxSegments: [
        { from: O1, to: O2, label: "旋转轴 h", dashed: true },
        { from: center, to: A1, label: "R", dashed: true },
        { from: O2, to: A1, label: "r", dashed: false },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  } else {
    const radius = Math.min(r, h / 2);
    const sphereVolume = (4 / 3) * Math.PI * radius ** 3;
    const sphereArea = 4 * Math.PI * radius ** 2;

    const tSide: Vec3 = { x: r, y: 0, z: h / 2 };

    return {
      radius,
      center,
      keyPoints: { O1, O2, Center: center, tSide },
      auxSegments: [
        { from: center, to: O1, label: "r", dashed: true },
        { from: center, to: O2, label: "r", dashed: true },
        { from: center, to: tSide, label: "r", dashed: true },
      ],
      solidVolume,
      solidArea,
      sphereVolume,
      sphereArea,
    };
  }
}
