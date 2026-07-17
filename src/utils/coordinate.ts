export interface Point {
  x: number;
  y: number;
}

export interface SceneScale {
  scaleX: number;
  scaleY: number;
  scale: number;
  originX: number;
  originY: number;
}

/**
 * 数学坐标 -> 设计坐标 (design-unit)
 * 物理坐标 y↑，Canvas/设计坐标 y↓
 */
export function mathToDesign(
  mx: number,
  my: number,
  scale: SceneScale
): Point {
  return {
    x: scale.originX + mx * scale.scaleX,
    y: scale.originY - my * scale.scaleY,
  };
}

/**
 * 设计坐标 -> 数学坐标
 */
export function designToMath(
  dx: number,
  dy: number,
  scale: SceneScale
): Point {
  return {
    x: (dx - scale.originX) / scale.scaleX,
    y: (scale.originY - dy) / scale.scaleY,
  };
}

// ─── 3D → 2D 投影 ─────────────────────────────────────────────────────────────

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface CameraOptions {
  /** 方位角（弧度），绕 Y 轴旋转，默认 π/6 (30°) */
  azimuth?: number
  /** 仰角（弧度），绕 X 轴旋转，默认 π/6 (30°) */
  elevation?: number
  /** 是否使用透视投影，默认 false（正交投影） */
  perspective?: boolean
  /** 透视投影的焦距（像素），仅 perspective=true 时有效 */
  focalLength?: number
}

/** 默认相机参数：等轴测风格 */
const DEFAULT_AZIMUTH = Math.PI / 6
const DEFAULT_ELEVATION = Math.PI / 6

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
  camera: CameraOptions = {}
): Point {
  const {
    azimuth = DEFAULT_AZIMUTH,
    elevation = DEFAULT_ELEVATION,
    perspective = false,
    focalLength = 500,
  } = camera

  const cosA = Math.cos(azimuth)
  const sinA = Math.sin(azimuth)
  const cosE = Math.cos(elevation)
  const sinE = Math.sin(elevation)

  // 绕 Y 轴旋转 azimuth
  const x1 = mx * cosA + mz * sinA
  const y1 = my
  const z1 = -mx * sinA + mz * cosA

  // 绕 X 轴旋转 elevation
  const x2 = x1
  const y2 = y1 * cosE - z1 * sinE
  const z2 = y1 * sinE + z1 * cosE

  // 投影到 2D
  let px: number
  let py: number

  if (perspective && focalLength > 0) {
    const d = focalLength + z2
    const factor = d > 0 ? focalLength / d : 0
    px = x2 * factor
    py = y2 * factor
  } else {
    px = x2
    py = y2
  }

  return {
    x: scale.originX + px * scale.scaleX,
    y: scale.originY - py * scale.scaleY,
  }
}
