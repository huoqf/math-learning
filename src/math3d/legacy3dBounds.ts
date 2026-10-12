/**
 * 存量 14 个 3D 页面的场景内容包围盒计算（纯数学层）
 *
 * ## 为什么需要它
 * 项目共有 16 个使用 `<ThreeDCanvas>` 的三维页面，其中 2 个（solidAxioms / polyhedronFeatures）
 * 已接入 `<CameraFit>` 并拥有同源包围盒函数。
 * 剩余 14 个页面历史上使用固定机位（`PRESET_POSITIONS` + OrbitControls），
 * 一直未曾量化取景是否出框、以及由 `use3DViewport` 中 `target: [0, 1.5, 0]` 与
 * 首屏 `target: [0, 0, 0]` 带来的 36% 视窗位移到底造成了多大程度的裁切。
 *
 * 本模块为这 14 个页面提供**纯数学层场景包围盒（数学坐标，z 轴向上）**：
 * - 涵盖典型默认参数与高中课标声明域内的极限参数；
 * - 供 `sceneFraming.test.ts` 独立透视投影预言机运行全机位、全长宽比的真实量化断言；
 * - 供后续各页面接入 `<CameraFit>` 时直接作为 SSOT 消费。
 *
 * 纯数学函数，零 DOM / React 依赖。
 */

import { type Bounds3D } from "./sceneBounds";

export interface Legacy3DPageBoundsCase {
  pageId: string;
  name: string;
  defaultBounds: Bounds3D;
  extremeBounds: Bounds3D;
}

/**
 * 14 个存量 3D 页面在默认参数与极限参数下的场景包围盒清单
 */
export const LEGACY_3D_PAGE_BOUNDS: Legacy3DPageBoundsCase[] = [
  {
    pageId: "know-solid-distance",
    name: "异面直线公垂线与空间距离",
    // 长方体默认 a=3,b=3,c=3；极限 a=5,b=5,c=5，顶点在原点与 (a,b,c) 之间
    defaultBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 3, y: 3, z: 3 } },
    extremeBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 5, y: 5, z: 5 } },
  },
  {
    pageId: "know-solid-angle",
    name: "空间线面面面空间角",
    defaultBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 3, y: 3, z: 3 } },
    extremeBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 5, y: 5, z: 5 } },
  },
  {
    pageId: "know-vector3d-basis",
    name: "空间向量基底与坐标分解",
    // 基底向量及坐标分解合成向量，默认分解到 (2,2,2)，极限分解到 (3.5, 3.5, 3.5)
    defaultBounds: { min: { x: -1, y: -1, z: 0 }, max: { x: 3, y: 3, z: 3 } },
    extremeBounds: {
      min: { x: -2, y: -2, z: 0 },
      max: { x: 4.5, y: 4.5, z: 4.5 },
    },
  },
  {
    pageId: "know-solid-pyramid-derivation",
    name: "祖暅原理与棱锥体积推导",
    // 模式一阳马鳖臑拆解(高3底3)，模式三圆锥(y=-2.5)与棱锥(y=2.5)双体横跨 8 个单位
    defaultBounds: {
      min: { x: -1.5, y: -1.5, z: 0 },
      max: { x: 3, y: 3, z: 3 },
    },
    extremeBounds: {
      min: { x: -2.5, y: -4.5, z: 0 },
      max: { x: 2.5, y: 4.5, z: 4 },
    },
  },
  {
    pageId: "know-solid-sphere-derivation",
    name: "祖暅原理与球表面积体积推导",
    // 祖暅半球与圆柱圆锥等高截面，默认 R=2.2，极限 R=3.5
    defaultBounds: {
      min: { x: -2.2, y: -2.2, z: 0 },
      max: { x: 2.2, y: 2.2, z: 2.2 },
    },
    extremeBounds: {
      min: { x: -3.5, y: -3.5, z: 0 },
      max: { x: 3.5, y: 3.5, z: 3.5 },
    },
  },
  {
    pageId: "know-solid-rotation-body",
    name: "旋转体的结构特征与表面积",
    // 圆柱/圆锥/圆台，默认 r=2, h=3；极限 r=3.5, h=5
    defaultBounds: { min: { x: -2, y: -2, z: 0 }, max: { x: 2, y: 2, z: 3 } },
    extremeBounds: {
      min: { x: -3.5, y: -3.5, z: 0 },
      max: { x: 3.5, y: 3.5, z: 5 },
    },
  },
  {
    pageId: "know-solid-surface-relation",
    name: "空间面面平行与垂直判定",
    // 双示意面片及法向量、交线，宽 4~6，高 3~4.5
    defaultBounds: {
      min: { x: -2, y: -2.5, z: 0 },
      max: { x: 3, y: 2.5, z: 3.5 },
    },
    extremeBounds: {
      min: { x: -3, y: -3.5, z: 0 },
      max: { x: 4, y: 3.5, z: 4.5 },
    },
  },
  {
    pageId: "know-solid-position",
    name: "空间线面平行与垂直判定",
    defaultBounds: { min: { x: -2, y: -2, z: 0 }, max: { x: 3, y: 3, z: 3.5 } },
    extremeBounds: { min: { x: -3, y: -3, z: 0 }, max: { x: 4, y: 4, z: 4.5 } },
  },
  {
    pageId: "know-solid-section",
    name: "空间多面体截面截割构造",
    defaultBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 3, y: 3, z: 3 } },
    extremeBounds: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 4.5, y: 4.5, z: 4.5 },
    },
  },
  {
    pageId: "know-solid-folding",
    name: "四面体平面动态翻折",
    // 展开时平面底板跨度约 5~6，翻折时顶点升至空间
    defaultBounds: { min: { x: -2, y: -2, z: 0 }, max: { x: 3, y: 3, z: 2.5 } },
    extremeBounds: { min: { x: -3, y: -3, z: 0 }, max: { x: 4, y: 4, z: 3.5 } },
  },
  {
    pageId: "know-solid-ball",
    name: "内切球与正棱锥外接球",
    // 正棱锥底面 a=3, h=3.5 到 a=5, h=5.5
    defaultBounds: { min: { x: -2, y: -2, z: 0 }, max: { x: 2, y: 2, z: 3.5 } },
    extremeBounds: {
      min: { x: -3.5, y: -3.5, z: 0 },
      max: { x: 3.5, y: 3.5, z: 5.5 },
    },
  },
  {
    pageId: "know-solid-ball-models",
    name: "四大外接球模型",
    // 长方体/直棱柱/垂棱/汉堡外接球模型，外接球跨越中心，默认 R=2.5，极限 R=4 (球体直径达 8)
    defaultBounds: {
      min: { x: -2.5, y: -2.5, z: -1 },
      max: { x: 3.5, y: 3.5, z: 4 },
    },
    extremeBounds: { min: { x: -4, y: -4, z: -2 }, max: { x: 5, y: 5, z: 6 } },
  },
  {
    pageId: "know-solid-advanced-sphere",
    name: "进阶切接球模型",
    // 双外心与三球同心，外接球半径 R 达 3~5，球体三维范围达 8~10
    defaultBounds: {
      min: { x: -2.5, y: -2.5, z: -1 },
      max: { x: 3.5, y: 3.5, z: 4 },
    },
    extremeBounds: {
      min: { x: -4, y: -4, z: -2 },
      max: { x: 5.5, y: 5.5, z: 6.5 },
    },
  },
  {
    pageId: "know-solid-parametric",
    name: "动点轨迹参数化设点",
    defaultBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 3, y: 3, z: 3 } },
    extremeBounds: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 4.5, y: 4.5, z: 4.5 },
    },
  },
];

// ============================================================================
// 各页面运行时动态包围盒纯函数（纯数学层，零 DOM/React 依赖）
// ============================================================================

export function getSolidDistanceBounds(params?: {
  a?: number;
  b?: number;
  c?: number;
}): Bounds3D {
  const a = Math.max(1, params?.a ?? 3);
  const b = Math.max(1, params?.b ?? 3);
  const c = Math.max(1, params?.c ?? 3);
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
  const minX = Math.min(
    -1,
    (params?.ax ?? 0) < 0 ? params!.ax! : -1,
    (params?.bx ?? 0) < 0 ? params!.bx! : -1,
  );
  const minY = Math.min(
    -1,
    (params?.ay ?? 0) < 0 ? params!.ay! : -1,
    (params?.by ?? 0) < 0 ? params!.by! : -1,
  );
  const maxX = Math.max(
    3,
    (params?.ax ?? 2) + 1,
    (params?.bx ?? 1) + 1,
    (params?.x ?? 1) * 2 + 1,
  );
  const maxY = Math.max(
    3,
    (params?.ay ?? 1) + 1,
    (params?.by ?? 2) + 1,
    (params?.y ?? 1) * 2 + 1,
  );
  const maxZ = Math.max(3, params?.cz ?? 2, (params?.z ?? 1) * 2 + 1);
  return {
    min: { x: minX, y: minY, z: 0 },
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
      y: Math.max(3, b + 1.5) + expOffset,
      z: Math.max(3, h),
    },
  };
}

export function getSphereDerivationBounds(params?: {
  radius?: number;
}): Bounds3D {
  const r = Math.max(1, params?.radius ?? 2.2);
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
  const c = params?.c ?? 3;
  return {
    min: { x: 0, y: 0, z: 0 },
    max: { x: Math.max(2, a), y: Math.max(2, b), z: Math.max(2, c) },
  };
}

export function getFoldingBounds(params?: {
  a?: number;
  b?: number;
}): Bounds3D {
  const a = params?.a ?? 3;
  const b = params?.b ?? 3;
  return {
    min: { x: -2, y: -2, z: 0 },
    max: { x: Math.max(3, a), y: Math.max(3, b), z: 2.5 },
  };
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
  const maxDim = Math.max(
    3,
    params?.a ?? 3,
    params?.b ?? 3,
    params?.c ?? 3,
    (params?.r ?? 2.5) * 1.5,
  );
  return {
    min: { x: -2.5, y: -2.5, z: -1 },
    max: { x: maxDim, y: maxDim, z: maxDim },
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
  const a = params?.a ?? 3;
  const b = params?.b ?? 3;
  const c = params?.c ?? 3;
  return {
    min: { x: 0, y: 0, z: 0 },
    max: { x: Math.max(2, a), y: Math.max(2, b), z: Math.max(2, c) },
  };
}

export function getLegacyPageDefaultBounds(pageId: string): Bounds3D {
  const item = LEGACY_3D_PAGE_BOUNDS.find((p) => p.pageId === pageId);
  return item
    ? item.defaultBounds
    : { min: { x: -3, y: -3, z: 0 }, max: { x: 3, y: 3, z: 3 } };
}
