/**
 * 3D 场景包围盒 / 包围球（纯数学层）
 *
 * ## 为什么需要它
 * 三维页面使用**固定机位**（`use3DViewport` 的 `[6,5,8]` / `fov 45`）。
 * 一旦页面画出的要素远超主体尺度（典型：台体"补全大棱锥"顶点在相似比 k→1 时
 * 高达 `H = h/(1-k)`，或棱锥/棱柱把 h 拉满），关键装置就会被裁出画布 ——
 * 而 `solid3dRender.contract` 只断言"3D 元素树非空 + 几何数值有限"，
 * **结构上无法发现取景问题**。
 *
 * 本模块把"场景有多大、中心在哪"变成**可计算的纯函数**：
 * 各页面用它算出内容包围盒，交给 `<CameraFit>` 把相机拉到"恰好装得下"的距离，
 * 于是"关键装置必须可见"从口头约定变成可断言的性质（见 `sceneFraming.test.ts`）。
 *
 * ## 取景职责边界契约（Geometry vs Decoration）
 * 1. 核心数学主体：`Bounds3D` 与 `<CameraFit>` 专门且唯一服务于**真实数学几何主体**
 *    （几何多面体顶点、棱、面、几何动点与展平参考底板），确保核心数学装置绝对不被裁切；
 * 2. 辅助装饰图层：坐标轴基底、法向量箭头与二面角弧等属于局部视觉标注/屏幕语义，
 *    其尺寸固定，统一由 `<CameraFit>` 内置视口边距（默认 padding = 0.35 余量）消化吸收；
 *    严禁将辅助箭头长度反向耦合进几何包围盒，避免导致相机过度后退削弱几何主体视觉占比。
 *
 * 约定：全部使用**数学坐标**（z 轴向上），与项目坐标系约定一致。
 */

import type { Vec3 } from "./vector3";

export interface Bounds3D {
  min: Vec3;
  max: Vec3;
}

export interface BoundingSphere {
  center: Vec3;
  radius: number;
}

/** 空盒（退化到原点）。调用方应保证 points 非空，此处只作兜底。 */
export const emptyBounds = (): Bounds3D => ({
  min: { x: 0, y: 0, z: 0 },
  max: { x: 0, y: 0, z: 0 },
});

/** 点集包围盒；空集返回原点退化盒。 */
export const boundsOf = (points: Vec3[]): Bounds3D => {
  if (points.length === 0) return emptyBounds();
  const min: Vec3 = { ...points[0] };
  const max: Vec3 = { ...points[0] };
  for (const p of points) {
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    min.z = Math.min(min.z, p.z);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
    max.z = Math.max(max.z, p.z);
  }
  return { min, max };
};

/** 两个包围盒的并集。 */
export const unionBounds = (a: Bounds3D, b: Bounds3D): Bounds3D => ({
  min: {
    x: Math.min(a.min.x, b.min.x),
    y: Math.min(a.min.y, b.min.y),
    z: Math.min(a.min.z, b.min.z),
  },
  max: {
    x: Math.max(a.max.x, b.max.x),
    y: Math.max(a.max.y, b.max.y),
    z: Math.max(a.max.z, b.max.z),
  },
});

/** 逐轴外扩（pad 为数值时三轴同量外扩）。 */
export const expandBounds = (b: Bounds3D, pad: number | Vec3): Bounds3D => {
  const p: Vec3 =
    typeof pad === "number" ? { x: pad, y: pad, z: pad } : { ...pad };
  return {
    min: { x: b.min.x - p.x, y: b.min.y - p.y, z: b.min.z - p.z },
    max: { x: b.max.x + p.x, y: b.max.y + p.y, z: b.max.z + p.z },
  };
};

export const boundsSize = (b: Bounds3D): Vec3 => ({
  x: Math.max(0, b.max.x - b.min.x),
  y: Math.max(0, b.max.y - b.min.y),
  z: Math.max(0, b.max.z - b.min.z),
});

export const boundsCenter = (b: Bounds3D): Vec3 => ({
  x: (b.min.x + b.max.x) / 2,
  y: (b.min.y + b.max.y) / 2,
  z: (b.min.z + b.max.z) / 2,
});

/** 8 个角点，可用于"逐个角点做投影断言"。 */
export const boundsCorners = (b: Bounds3D): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [b.min.x, b.max.x]) {
    for (const y of [b.min.y, b.max.y]) {
      for (const z of [b.min.z, b.max.z]) out.push({ x, y, z });
    }
  }
  return out;
};

/**
 * 包围球：中心取包围盒中心，半径为**半对角线**。
 * 采用半对角线（而非最小包围球）是刻意的保守选择：
 * 只要包围球在视锥内，其内部任意点必然可见，断言不必区分具体图元。
 */
export const boundingSphereOf = (b: Bounds3D): BoundingSphere => {
  const size = boundsSize(b);
  return {
    center: boundsCenter(b),
    radius: 0.5 * Math.hypot(size.x, size.y, size.z),
  };
};

/** 包围盒三轴均为有限值（防 NaN / Infinity 进入相机计算）。 */
export const boundsAreFinite = (b: Bounds3D): boolean =>
  [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].every((v) =>
    Number.isFinite(v),
  );

// ============================================================================
// 相机适配的**纯计算**部分（组件与测试共用同一份实现，避免两处各写一套）
// ============================================================================

/** 默认竖直视场角，须与 `ThreeDCanvas` 的 `fov` 一致 */
export const DEFAULT_CAMERA_FOV_DEG = 45;
/** 默认取景余量（四周各留约 12% 空白） */
export const DEFAULT_FIT_MARGIN = 1.12;

export interface FitViewport {
  /** 竖直视场角（度） */
  fovDeg: number;
  /** 画布宽高比（宽 / 高） */
  aspect: number;
  /** 取景余量，默认 {@link DEFAULT_FIT_MARGIN} */
  margin?: number;
}

/**
 * 让半径为 `radius` 的包围球"恰好装得下"所需的最小相机距离。
 *
 * 竖直方向半张角 tan(fov/2) 决定纵向容量；横向容量还要除以 aspect。
 * **竖屏（aspect < 1）时水平方向才是瓶颈**，故两个方向都算并取大者 ——
 * 只算竖直方向会让窄画布上的场景左右被裁。
 *
 * 非法输入（非正半径、非有限值、越界 fov）一律返回 0，表示"不做适配"。
 */
export const requiredCameraDistance = (
  radius: number,
  { fovDeg, aspect, margin = DEFAULT_FIT_MARGIN }: FitViewport,
): number => {
  if (!(radius > 0) || !Number.isFinite(radius)) return 0;
  if (!(fovDeg > 0) || fovDeg >= 180) return 0;
  const halfV = Math.tan((fovDeg * Math.PI) / 360);
  const safeAspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  const distance =
    Math.max(radius / halfV, radius / (halfV * safeAspect)) * margin;
  return Number.isFinite(distance) && distance > 0 ? distance : 0;
};
