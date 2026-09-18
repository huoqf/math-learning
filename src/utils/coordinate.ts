import type { SceneScale } from "@/hooks/useSceneScale";

export type { SceneScale };

export interface Point {
  x: number;
  y: number;
}

/**
 * 数学坐标 -> 设计坐标 (design-unit)
 * 数学坐标 y↑，Canvas/设计坐标 y↓
 */
export function mathToDesign(mx: number, my: number, scale: SceneScale): Point {
  return {
    x: scale.originX + mx * scale.scaleX,
    y: scale.originY - my * scale.scaleY,
  };
}

/**
 * 设计坐标 -> 数学坐标
 */
export function designToMath(dx: number, dy: number, scale: SceneScale): Point {
  return {
    x: (dx - scale.originX) / scale.scaleX,
    y: (scale.originY - dy) / scale.scaleY,
  };
}

/**
 * 把数学平面上的无限直线 A·x + B·y + C = 0 裁剪到当前可见视口，
 * 返回可直接交给 <line> 绘制的两个数学坐标端点；直线与视口不相交时返回 null。
 *
 * 用途：中屏绘制「定直线 / 准线 / 渐近线」这类参考直线。若直接取
 * x ∈ [xMin, xMax] 求 y，遇到近铅垂直线会得到爆炸或 Infinity 的坐标，
 * 因此统一改为与视口四条边求交、再取相距最远的一对端点。
 */
export function clipLineToScale(
  scale: SceneScale,
  A: number,
  B: number,
  C: number,
): [Point, Point] | null {
  const { xMin, xMax, yMin, yMax } = scale;
  const eps = 1e-9;
  const candidates: Point[] = [];

  // 与左右两条竖直边界求交
  if (Math.abs(B) > eps) {
    for (const x of [xMin, xMax]) {
      const y = -(A * x + C) / B;
      if (y >= yMin - eps && y <= yMax + eps) candidates.push({ x, y });
    }
  }
  // 与上下两条水平边界求交
  if (Math.abs(A) > eps) {
    for (const y of [yMin, yMax]) {
      const x = -(B * y + C) / A;
      if (x >= xMin - eps && x <= xMax + eps) candidates.push({ x, y });
    }
  }

  // 去重：视口顶点处会被相邻两条边界各命中一次
  const uniq = candidates.filter(
    (p, i) =>
      candidates.findIndex(
        (q) => Math.abs(q.x - p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9,
      ) === i,
  );
  if (uniq.length < 2) return null;

  // 取相距最远的一对作为可视端点
  let best: [Point, Point] = [uniq[0], uniq[1]];
  let bestLen = -1;
  for (let i = 0; i < uniq.length; i++) {
    for (let j = i + 1; j < uniq.length; j++) {
      const len = Math.hypot(uniq[i].x - uniq[j].x, uniq[i].y - uniq[j].y);
      if (len > bestLen) {
        bestLen = len;
        best = [uniq[i], uniq[j]];
      }
    }
  }
  return best;
}

// ─── 3D → 2D 投影 ─────────────────────────────────────────────────────────────

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface CameraOptions {
  /** 方位角（弧度），绕 Y 轴旋转，默认 π/6 (30°) */
  azimuth?: number;
  /** 仰角（弧度），绕 X 轴旋转，默认 π/6 (30°) */
  elevation?: number;
  /** 是否使用透视投影，默认 false（正交投影） */
  perspective?: boolean;
  /** 透视投影的焦距（像素），仅 perspective=true 时有效 */
  focalLength?: number;
}

/** 默认相机参数：等轴测风格 */
const DEFAULT_AZIMUTH = Math.PI / 6;
const DEFAULT_ELEVATION = Math.PI / 6;

/**
 * 3D 数学坐标 → 2D 设计坐标
 *
 * 采用旋转矩阵投影：先绕 Y 轴旋转 azimuth，再绕 X 轴旋转 elevation，
 * 然后映射到 SceneScale 定义的 2D 平面。
 *
 * 坐标约定：数学坐标系 y↑，设计坐标系 y↓。
 */
export function math3DToDesign(
  mx: number,
  my: number,
  mz: number,
  scale: SceneScale,
  camera: CameraOptions = {},
): Point {
  const {
    azimuth = DEFAULT_AZIMUTH,
    elevation = DEFAULT_ELEVATION,
    perspective = false,
    focalLength = 500,
  } = camera;

  const cosA = Math.cos(azimuth);
  const sinA = Math.sin(azimuth);
  const cosE = Math.cos(elevation);
  const sinE = Math.sin(elevation);

  // 绕 Y 轴旋转 azimuth
  const x1 = mx * cosA + mz * sinA;
  const y1 = my;
  const z1 = -mx * sinA + mz * cosA;

  // 绕 X 轴旋转 elevation
  const x2 = x1;
  const y2 = y1 * cosE - z1 * sinE;
  const z2 = y1 * sinE + z1 * cosE;

  // 投影到 2D
  let px: number;
  let py: number;

  if (perspective && focalLength > 0) {
    const d = focalLength + z2;
    const factor = d > 0 ? focalLength / d : 0;
    px = x2 * factor;
    py = y2 * factor;
  } else {
    px = x2;
    py = y2;
  }

  return {
    x: scale.originX + px * scale.scaleX,
    y: scale.originY - py * scale.scaleY,
  };
}
