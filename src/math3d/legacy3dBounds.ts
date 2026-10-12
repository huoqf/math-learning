/**
 * 存量 14 个 3D 页面的场景内容包围盒计算（纯数学层）
 *
 * ## 为什么需要它
 * 项目共有 16 个使用 `<ThreeDCanvas>` 的三维页面，其中 2 个（solidAxioms / polyhedronFeatures）
 * 已接入 `<CameraFit>` 并拥有同源包围盒函数。
 * 剩余 14 个页面历史上使用固定机位（`PRESET_POSITIONS` + OrbitControls），
 * 为保证取景不被裁出画布，本模块为这 14 个页面提供**纯数学层场景包围盒（数学坐标，z 轴向上）**：
 * - 各页面 `<CameraFit>` 直接消费对应的 `get*Bounds` 纯函数；
 * - 台账清单 `LEGACY_3D_PAGE_BOUNDS` 100% 由纯函数派生求值生成，彻底消灭手写副本；
 * - 供 `sceneFraming.test.ts` 独立透视投影预言机运行全机位、全长宽比的真实回归断言。
 *
 * 纯数学函数，零 DOM / React 依赖。
 */

import { boundsOf, type Bounds3D } from "./sceneBounds";
import type { Vec3 } from "./vector3";
import {
  calculateRightTrapezoidFolding,
  calculateRectangleDiagonalFolding,
  calculateTriangleAltitudeFolding,
  calculateRhombusFolding,
  type FoldingModelKind,
} from "./folding";

// ============================================================================
// 各页面运行时动态包围盒纯函数（纯数学层，零 DOM/React 依赖）
// ============================================================================

export function getSolidDistanceBounds(params?: {
  a?: number;
  b?: number;
  c?: number;
}): Bounds3D {
  const a = Math.max(1, params?.a ?? 3);
  const b = Math.max(1, params?.b ?? 2);
  const c = Math.max(1, params?.c ?? 2);
  return { min: { x: 0, y: 0, z: 0 }, max: { x: a, y: b, z: c } };
}

export function getSolidAngleBounds(params?: {
  a?: number;
  b?: number;
  c?: number;
}): Bounds3D {
  const a = Math.max(1, params?.a ?? 3);
  const b = Math.max(1, params?.b ?? 2);
  const c = Math.max(1, params?.c ?? 2);
  return { min: { x: 0, y: 0, z: 0 }, max: { x: a, y: b, z: c } };
}

export function getVector3DBasisBounds(params?: {
  x?: number;
  y?: number;
  z?: number;
  cz?: number;
  ax?: number;
  ay?: number;
  az?: number;
  bx?: number;
  by?: number;
  bz?: number;
}): Bounds3D {
  const ax = params?.ax ?? 2;
  const ay = params?.ay ?? 1;
  const az = params?.az ?? 0;
  const bx = params?.bx ?? 1;
  const by = params?.by ?? 2;
  const bz = params?.bz ?? 2;
  const cz = params?.cz ?? 2;
  const x = params?.x ?? 1;
  const y = params?.y ?? 1;
  const z = params?.z ?? 1;

  const minX = Math.min(-1, ax, bx, 0);
  const minY = Math.min(-1, ay, by, 0);
  const minZ = Math.min(0, az, bz);
  const maxX = Math.max(3, ax + 1, bx + 1, x * ax + y * bx + 1);
  const maxY = Math.max(3, ay + 1, by + 1, x * ay + y * by + 1);
  const maxZ = Math.max(3, cz, az + 1, bz + 1, z * cz + 1);
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

export function getPyramidDerivationBounds(params?: {
  a?: number;
  b?: number;
  h?: number;
  c?: number;
  explode?: number;
}): Bounds3D {
  const a = params?.a ?? 2.6;
  const b = params?.b ?? 2.2;
  const h = Math.max(params?.h ?? 3.2, params?.c ?? 3.2);
  const explode = params?.explode ?? 0;
  const expOffset = explode * 1.5;
  return {
    min: { x: -1.5 - expOffset, y: -2.5 - expOffset, z: 0 },
    max: {
      x: Math.max(3, a) + expOffset,
      y: Math.max(3.5, b + 1.5) + expOffset,
      z: Math.max(3.2, h),
    },
  };
}

export function getSphereDerivationBounds(params?: {
  radius?: number;
}): Bounds3D {
  const r = Math.max(1, params?.radius ?? 2.0);
  return {
    min: { x: -r, y: -r, z: 0 },
    max: { x: r, y: r, z: r },
  };
}

export function getRotationBodyBounds(params?: {
  r1?: number;
  r2?: number;
  height?: number;
}): Bounds3D {
  const maxR = Math.max(2, params?.r1 ?? 1.5, params?.r2 ?? 0.8);
  const h = Math.max(2, params?.height ?? 3);
  return {
    min: { x: -maxR, y: -maxR, z: 0 },
    max: { x: maxR, y: maxR, z: h },
  };
}

export function getSurfaceRelationBounds(params?: {
  pyramidA?: number;
  pyramidB?: number;
  pyramidH?: number;
  zHeight?: number;
}): Bounds3D {
  const a = params?.pyramidA ?? 3.6;
  const b = params?.pyramidB ?? 2.8;
  const h = Math.max(params?.pyramidH ?? 3.2, (params?.zHeight ?? 2.2) + 1);
  return {
    min: { x: -2, y: -2.5, z: 0 },
    max: {
      x: Math.max(3, a * 0.8),
      y: Math.max(2.5, b * 0.8),
      z: Math.max(3.5, h),
    },
  };
}

export function getLinePlaneRelationBounds(params?: {
  pyramidA?: number;
  pyramidB?: number;
  pyramidH?: number;
  zHeight?: number;
}): Bounds3D {
  const a = params?.pyramidA ?? 3.6;
  const b = params?.pyramidB ?? 2.8;
  const h = Math.max(params?.pyramidH ?? 3.5, (params?.zHeight ?? 2) + 1);
  return {
    min: { x: -2, y: -2, z: 0 },
    max: {
      x: Math.max(3, a * 0.8),
      y: Math.max(3, b * 0.8),
      z: Math.max(3.5, h),
    },
  };
}

export function getSectionCuboidBounds(params?: {
  a?: number;
  b?: number;
  c?: number;
}): Bounds3D {
  const a = params?.a ?? 3;
  const b = params?.b ?? 3;
  const c = params?.c ?? 3.5;
  return {
    min: { x: 0, y: 0, z: 0 },
    max: { x: Math.max(2, a), y: Math.max(2, b), z: Math.max(2, c) },
  };
}

/**
 * 模型感知的翻折场景包围盒（直接调用纯数学层 calculateXxxFolding 取顶点真实 AABB，
 * 并根据 foldState 自动感知是否需要容纳展平参考底板轮廓顶点）
 */
export function getFoldingBounds(params?: {
  model?: FoldingModelKind;
  a?: number;
  b?: number;
  h?: number;
  alphaDeg?: number;
  foldState?: "folded" | "both" | "unfolded";
}): Bounds3D {
  const model = params?.model ?? "trapezoid";
  const a = params?.a ?? 4;
  const b = params?.b ?? 3;
  const h = params?.h ?? 3;
  const alphaDeg = params?.alphaDeg ?? 90;
  const foldState = params?.foldState ?? "both";

  let points: Vec3[] = [];
  let unfolded: Vec3[] = [];
  switch (model) {
    case "trapezoid": {
      const res = calculateRightTrapezoidFolding(a, b, h, alphaDeg);
      points = Object.values(res.points);
      unfolded = Object.values(res.unfoldedPoints);
      break;
    }
    case "rectangleDiagonal": {
      const res = calculateRectangleDiagonalFolding(a, b, alphaDeg);
      points = Object.values(res.points);
      unfolded = Object.values(res.unfoldedPoints);
      break;
    }
    case "triangleAltitude": {
      const res = calculateTriangleAltitudeFolding(a, h, alphaDeg);
      points = Object.values(res.points);
      unfolded = Object.values(res.unfoldedPoints);
      break;
    }
    case "rhombus": {
      const res = calculateRhombusFolding(a, alphaDeg);
      points = Object.values(res.points);
      unfolded = Object.values(res.unfoldedPoints);
      break;
    }
  }

  const allPoints = foldState === "folded" ? points : points.concat(unfolded);
  return boundsOf(allPoints);
}

/**
 * 遍历 4 种翻折模型在声明域全极端参数下的空间几何，派生求值生成真实的全局极限包围盒（零手写字面量）
 */
export function getFoldingExtremeBounds(): Bounds3D {
  const models: FoldingModelKind[] = [
    "trapezoid",
    "rectangleDiagonal",
    "triangleAltitude",
    "rhombus",
  ];
  const allCorners: Vec3[] = [];
  for (const m of models) {
    for (const alpha of [1, 45, 90, 135, 179]) {
      const b = getFoldingBounds({
        model: m,
        a: 5,
        b: 1,
        h: 5,
        alphaDeg: alpha,
        foldState: "both",
      });
      allCorners.push(b.min, b.max);
    }
  }
  return boundsOf(allCorners);
}

export function getCircumInSphereBounds(params?: {
  a?: number;
  h?: number;
}): Bounds3D {
  const a = params?.a ?? 3;
  const h = params?.h ?? 3.5;
  const halfA = Math.max(2, a / 2);
  return {
    min: { x: -halfA, y: -halfA, z: 0 },
    max: { x: halfA, y: halfA, z: Math.max(3.5, h) },
  };
}

export function getPolyhedronCircumSphereBounds(params?: {
  a?: number;
  b?: number;
  c?: number;
  r?: number;
}): Bounds3D {
  const a = params?.a ?? 3;
  const b = params?.b ?? 2;
  const c = params?.c ?? 2;
  // 长方体对角线半径 R = 0.5 * sqrt(a^2+b^2+c^2)
  const sphereR = Math.max(params?.r ?? 2.5, 0.5 * Math.hypot(a, b, c));
  return {
    min: { x: -sphereR, y: -sphereR, z: -sphereR },
    max: { x: sphereR, y: sphereR, z: sphereR },
  };
}

export function getAdvancedSphereBounds(params?: {
  r?: number;
  d?: number;
}): Bounds3D {
  const r = Math.max(2.5, params?.r ?? 3);
  return {
    min: { x: -r, y: -r, z: -1 },
    max: { x: r + 1, y: r + 1, z: r + 1 },
  };
}

export function getParametricPointBounds(params?: {
  a?: number;
  b?: number;
  c?: number;
}): Bounds3D {
  const a = params?.a ?? 4;
  const b = params?.b ?? 3;
  const c = params?.c ?? 3;
  return {
    min: { x: 0, y: 0, z: 0 },
    max: { x: Math.max(2, a), y: Math.max(2, b), z: Math.max(2, c) },
  };
}

// ============================================================================
// 14 个存量 3D 页面全量台账清单（100% 由纯函数派生求值，杜绝第二份手写数据）
// ============================================================================

export interface Legacy3DPageBoundsCase {
  pageId: string;
  name: string;
  defaultBounds: Bounds3D;
  extremeBounds: Bounds3D;
}

export const LEGACY_3D_PAGE_BOUNDS: Legacy3DPageBoundsCase[] = [
  {
    pageId: "know-solid-distance",
    name: "异面直线公垂线与空间距离",
    defaultBounds: getSolidDistanceBounds({ a: 3, b: 2, c: 2 }),
    extremeBounds: getSolidDistanceBounds({ a: 5, b: 5, c: 5 }),
  },
  {
    pageId: "know-solid-angle",
    name: "空间线面面面空间角",
    defaultBounds: getSolidAngleBounds({ a: 3, b: 2, c: 2 }),
    extremeBounds: getSolidAngleBounds({ a: 5, b: 5, c: 5 }),
  },
  {
    pageId: "know-vector3d-basis",
    name: "空间向量基底与坐标分解",
    defaultBounds: getVector3DBasisBounds(),
    extremeBounds: getVector3DBasisBounds({
      x: 2,
      y: 2,
      z: 2,
      cz: 4,
      ax: 3.5,
      ay: 3.5,
      az: 0,
      bx: -2,
      by: 3.5,
      bz: 3.5,
    }),
  },
  {
    pageId: "know-solid-pyramid-derivation",
    name: "祖暅原理与棱锥体积推导",
    defaultBounds: getPyramidDerivationBounds(),
    extremeBounds: getPyramidDerivationBounds({
      a: 4,
      b: 4,
      h: 4,
      c: 4,
      explode: 1,
    }),
  },
  {
    pageId: "know-solid-sphere-derivation",
    name: "祖暅原理与球表面积体积推导",
    defaultBounds: getSphereDerivationBounds({ radius: 2.0 }),
    extremeBounds: getSphereDerivationBounds({ radius: 3.5 }),
  },
  {
    pageId: "know-solid-rotation-body",
    name: "旋转体的结构特征与表面积",
    defaultBounds: getRotationBodyBounds(),
    extremeBounds: getRotationBodyBounds({ r1: 3.5, r2: 3.5, height: 5 }),
  },
  {
    pageId: "know-solid-surface-relation",
    name: "空间面面平行与垂直判定",
    defaultBounds: getSurfaceRelationBounds(),
    extremeBounds: getSurfaceRelationBounds({
      pyramidA: 5,
      pyramidB: 4,
      pyramidH: 5,
      zHeight: 4,
    }),
  },
  {
    pageId: "know-solid-position",
    name: "空间线面平行与垂直判定",
    defaultBounds: getLinePlaneRelationBounds(),
    extremeBounds: getLinePlaneRelationBounds({
      pyramidA: 5,
      pyramidB: 4,
      pyramidH: 5,
      zHeight: 4,
    }),
  },
  {
    pageId: "know-solid-section",
    name: "空间多面体截面截割构造",
    defaultBounds: getSectionCuboidBounds({ a: 3, b: 3, c: 3.5 }),
    extremeBounds: getSectionCuboidBounds({ a: 4.5, b: 4.5, c: 4.5 }),
  },
  {
    pageId: "know-solid-folding",
    name: "四面体平面动态翻折",
    defaultBounds: getFoldingBounds({
      model: "trapezoid",
      a: 4,
      b: 3,
      h: 3,
      alphaDeg: 90,
    }),
    extremeBounds: getFoldingExtremeBounds(),
  },
  {
    pageId: "know-solid-ball",
    name: "内切球与正棱锥外接球",
    defaultBounds: getCircumInSphereBounds({ a: 3, h: 3.5 }),
    extremeBounds: getCircumInSphereBounds({ a: 5, h: 5.5 }),
  },
  {
    pageId: "know-solid-ball-models",
    name: "四大外接球模型",
    defaultBounds: getPolyhedronCircumSphereBounds({ a: 3, b: 2, c: 2 }),
    extremeBounds: getPolyhedronCircumSphereBounds({
      a: 5,
      b: 5,
      c: 5,
      r: 4,
    }),
  },
  {
    pageId: "know-solid-advanced-sphere",
    name: "进阶切接球模型",
    defaultBounds: getAdvancedSphereBounds({ r: 3 }),
    extremeBounds: getAdvancedSphereBounds({ r: 5 }),
  },
  {
    pageId: "know-solid-parametric",
    name: "动点轨迹参数化设点",
    defaultBounds: getParametricPointBounds({ a: 4, b: 3, c: 3 }),
    extremeBounds: getParametricPointBounds({ a: 5, b: 5, c: 5 }),
  },
];
