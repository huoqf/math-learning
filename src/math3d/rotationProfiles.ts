/**
 * 旋转体母线（profile）纯函数采样
 *
 * 每个函数返回 ProfilePoint[]，供 RotationSolid / RotationSweep 使用。
 * r = 半径方向距离旋转轴的距离，z = 竖直高度（数学坐标，z 轴向上）。
 */

export interface ProfilePoint {
  r: number;
  z: number;
}

/** 矩形绕一边旋转 → 圆柱 */
export function cylinderProfile(
  radius: number,
  height: number,
): ProfilePoint[] {
  return [
    { r: 0, z: 0 },
    { r: radius, z: 0 },
    { r: radius, z: height },
    { r: 0, z: height },
  ];
}

/** 直角三角形绕直角边旋转 → 圆锥 */
export function coneProfile(radius: number, height: number): ProfilePoint[] {
  return [
    { r: 0, z: 0 },
    { r: radius, z: 0 },
    { r: 0, z: height },
  ];
}

/** 直角梯形绕垂直腰旋转 → 圆台 */
export function frustumProfile(
  rBottom: number,
  rTop: number,
  height: number,
): ProfilePoint[] {
  return [
    { r: 0, z: 0 },
    { r: rBottom, z: 0 },
    { r: rTop, z: height },
    { r: 0, z: height },
  ];
}

/** 半圆绕直径旋转 → 球（直径落在旋转轴 [-radius, radius] 上，球心在原点 z = 0 处） */
export function sphereProfile(radius: number, segments = 32): ProfilePoint[] {
  const pts: ProfilePoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    pts.push({
      r: radius * Math.sin(t),
      z: -radius * Math.cos(t),
    });
  }
  return pts;
}

/**
 * 在给定高度 z 处，取母线上所有该高度点里的最大半径（即该端面的外圆半径）。
 * 解决 cylinderProfile/frustumProfile 首尾点在轴心（r=0）导致端面圆半径取错的问题。
 */
export function rimRadiusAtZ(
  profile: ProfilePoint[],
  z: number,
  eps = 1e-3,
): number {
  return profile
    .filter((p) => Math.abs(p.z - z) < eps)
    .reduce((max, p) => Math.max(max, p.r), 0);
}

const Z_EPS = 1e-9;

/**
 * 沿旋转体母线，在任意高度 z 处插值出外壁半径。
 *
 * 与 rimRadiusAtZ 的区别：
 * - rimRadiusAtZ 用于查"端面圆"的精确高度（zMin/zMax），按 z 分组取最大半径
 * - radiusAtZ 用于侧面轮廓线沿任意中间高度采样，必须跳过"端面收口段"
 *   （profile 中相邻两点 z 相同、r 不同的那一段，是造盖子用的，不是侧壁）
 *   只在 z 真正变化的相邻点之间做线性插值，代表旋转体的真实外壁形状。
 */
export function radiusAtZ(profile: ProfilePoint[], z: number): number {
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    if (Math.abs(a.z - b.z) < Z_EPS) continue; // 跳过端面收口段（同高度）

    const zLo = Math.min(a.z, b.z);
    const zHi = Math.max(a.z, b.z);
    if (z >= zLo - Z_EPS && z <= zHi + Z_EPS) {
      const t = (z - a.z) / (b.z - a.z);
      return a.r + t * (b.r - a.r);
    }
  }
  // 越界兜底：夹到最近端面半径
  return rimRadiusAtZ(
    profile,
    z < profile[0].z ? profile[0].z : profile[profile.length - 1].z,
  );
}

/**
 * 通用曲线母线采样（解析几何扩展用）：给定 r = f(z)，采样出母线点列。
 * 例：抛物线 y² = 2px 绕 x 轴旋转 → 旋转抛物面
 */
export function sampleCurveProfile(
  rOfZ: (z: number) => number,
  zMin: number,
  zMax: number,
  segments = 48,
): ProfilePoint[] {
  const pts: ProfilePoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const z = zMin + ((zMax - zMin) * i) / segments;
    pts.push({ r: Math.max(0, rOfZ(z)), z });
  }
  return pts;
}

/**
 * 球截面小圆几何计算
 * @param radius 球半径 R
 * @param cutZFromCenter 截面距球心的有向距离 d (-R < d < R)
 */
export interface SphereCutResult {
  radius: number; // 球半径 R
  d: number; // 球心距 |d|
  cutRadius: number; // 截面圆半径 r_cut = sqrt(R^2 - d^2)
  cutArea: number; // 截面圆面积 S_cut = pi * r_cut^2
  greatCircleArea: number; // 大圆面积 S_great = pi * R^2
  isGreatCircle: boolean; // 是否为大圆 (d == 0)
}

export function calculateSphereCut(
  radius: number,
  cutZFromCenter: number,
): SphereCutResult {
  const R = Math.max(0.01, radius);
  const d = Math.min(R, Math.max(-R, cutZFromCenter));
  const absD = Math.abs(d);
  const cutRadius = Math.sqrt(Math.max(0, R * R - absD * absD));
  const cutArea = Math.PI * cutRadius * cutRadius;
  const greatCircleArea = Math.PI * R * R;

  return {
    radius: R,
    d: absD,
    cutRadius,
    cutArea,
    greatCircleArea,
    isGreatCircle: absD < 1e-4,
  };
}

/**
 * 侧面展开图几何参数（化曲为直）
 */
export interface UnfoldParamsResult {
  generatorLength: number; // 母线长 l
  unfoldAngleDeg: number; // 展开圆心角 α (度)
  unfoldAngleRad: number; // 展开圆心角 α (弧度)
  shortestPathAround: number; // 绕侧面一周最短测地线长度
  type: "cylinder" | "cone" | "frustum";
}

export function calculateUnfoldParams(
  type: "cylinder" | "cone" | "frustum",
  r1: number,
  r2: number,
  height: number,
): UnfoldParamsResult {
  if (type === "cylinder") {
    const l = height;
    const shortestPath = Math.sqrt((2 * Math.PI * r1) ** 2 + height ** 2);
    return {
      generatorLength: l,
      unfoldAngleDeg: 360,
      unfoldAngleRad: 2 * Math.PI,
      shortestPathAround: shortestPath,
      type: "cylinder",
    };
  }

  if (type === "cone") {
    const l = Math.sqrt(r1 * r1 + height * height);
    const unfoldAngleRad = (r1 / l) * 2 * Math.PI;
    const unfoldAngleDeg = (r1 / l) * 360;
    // 展开扇形中两母线夹角为 unfoldAngleRad，连接两端点的直线距离
    const shortestPath =
      unfoldAngleRad <= Math.PI ? 2 * l * Math.sin(unfoldAngleRad / 2) : 2 * l; // 超过 180° 时展平成直线
    return {
      generatorLength: l,
      unfoldAngleDeg,
      unfoldAngleRad,
      shortestPathAround: shortestPath,
      type: "cone",
    };
  }

  // frustum
  const l = Math.sqrt((r1 - r2) ** 2 + height * height);
  const unfoldAngleDeg = r1 > r2 && l > 0 ? ((r1 - r2) / l) * 360 : 0;
  const unfoldAngleRad = (unfoldAngleDeg * Math.PI) / 180;
  return {
    generatorLength: l,
    unfoldAngleDeg,
    unfoldAngleRad,
    shortestPathAround: 0,
    type: "frustum",
  };
}
