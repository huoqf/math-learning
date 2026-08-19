/**
 * 截面积计算、周长、射影面积定理与动态极值分析纯函数解算层
 */

import type { Vec3 } from "./vector3";
import { sub, cross, normalize, distance } from "./vector3";

/**
 * 精确计算 3D 凸/简单共面多边形的 3D 面积
 * 使用三角扇向量叉积和：S = 0.5 * || sum_{i=1}^{n-2} (P_i - P_0) x (P_{i+1} - P_0) ||
 */
export function computeSectionArea3D(points: Vec3[]): number {
  if (points.length < 3) return 0;

  const p0 = points[0];
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const v1 = sub(points[i], p0);
    const v2 = sub(points[i + 1], p0);
    const c = cross(v1, v2);
    sumX += c.x;
    sumY += c.y;
    sumZ += c.z;
  }

  return 0.5 * Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ);
}

/**
 * 计算 3D 截面周长
 */
export function computeSectionPerimeter3D(points: Vec3[]): number {
  if (points.length < 3) return 0;
  let perimeter = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    perimeter += distance(points[i], points[(i + 1) % n]);
  }
  return perimeter;
}

/**
 * 智能判定截面几何形状
 */
export function judgeSectionShape(points: Vec3[]): string {
  const n = points.length;
  if (n < 3) return "退化/无截面";
  if (n === 3) {
    const d0 = distance(points[0], points[1]);
    const d1 = distance(points[1], points[2]);
    const d2 = distance(points[2], points[0]);
    const maxD = Math.max(d0, d1, d2);
    const minD = Math.min(d0, d1, d2);
    if (Math.abs(maxD - minD) < 0.05) return "正三角形 (等边)";
    if (
      Math.abs(d0 - d1) < 0.05 ||
      Math.abs(d1 - d2) < 0.05 ||
      Math.abs(d2 - d0) < 0.05
    ) {
      return "等腰三角形";
    }
    return "一般三角形";
  }
  if (n === 4) {
    const d0 = distance(points[0], points[1]);
    const d1 = distance(points[1], points[2]);
    const d2 = distance(points[2], points[3]);
    const d3 = distance(points[3], points[0]);
    // 对边是否平行
    const v01 = sub(points[1], points[0]);
    const v32 = sub(points[2], points[3]);
    const c1 = cross(v01, v32);
    const isP1 = Math.sqrt(c1.x * c1.x + c1.y * c1.y + c1.z * c1.z) < 0.05;

    const v12 = sub(points[2], points[1]);
    const v03 = sub(points[3], points[0]);
    const c2 = cross(v12, v03);
    const isP2 = Math.sqrt(c2.x * c2.x + c2.y * c2.y + c2.z * c2.z) < 0.05;

    if (isP1 && isP2) {
      if (
        Math.abs(d0 - d1) < 0.05 &&
        Math.abs(d1 - d2) < 0.05 &&
        Math.abs(d2 - d3) < 0.05
      ) {
        return "菱形 / 正方形";
      }
      return "平行四边形 / 矩形";
    }
    if (isP1 || isP2) return "梯形";
    return "凸四边形";
  }
  if (n === 5) return "五边形";
  if (n === 6) {
    const d0 = distance(points[0], points[1]);
    const d1 = distance(points[1], points[2]);
    const d2 = distance(points[2], points[3]);
    const d3 = distance(points[3], points[4]);
    const d4 = distance(points[4], points[5]);
    const d5 = distance(points[5], points[0]);
    const maxD = Math.max(d0, d1, d2, d3, d4, d5);
    const minD = Math.min(d0, d1, d2, d3, d4, d5);
    if (Math.abs(maxD - minD) < 0.08) return "正六边形";
    return "六边形";
  }
  return `${n} 边形`;
}

/**
 * 计算 3D 截面顶点投影到 XY 基准面（z=0）后的 2D 投影面积
 * 使用鞋带公式 (Shoelace formula)
 */
export function computeProjectionArea2D(points: Vec3[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const current = points[i];
    const next = points[(i + 1) % n];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) * 0.5;
}

export interface SectionProjectionDetails {
  /** 3D 截面实际面积 S_截 */
  area3D: number;
  /** 截面周长 L */
  perimeter: number;
  /** 截面形状名称 */
  shapeName: string;
  /** 底面 (XY面) 投影面积 S_投 */
  areaProj: number;
  /** 截面法向量与底面法向量夹角的余弦值 cos θ */
  cosTheta: number;
  /** 截面与底面的二面角 (角度 °) */
  thetaDeg: number;
  /** 射影面积公式是否适用 (当 cos θ > 1e-4 且截面非垂直于底面时有效) */
  isProjectionValid: boolean;
}

/**
 * 求解截面射影面积定理参数与几何量
 */
export function computeSectionProjectionDetails(
  points: Vec3[],
  planeNormal: Vec3,
): SectionProjectionDetails {
  const area3D = computeSectionArea3D(points);
  const perimeter = computeSectionPerimeter3D(points);
  const shapeName = judgeSectionShape(points);
  const areaProj = computeProjectionArea2D(points);

  const n = normalize(planeNormal);
  // 底面为 z=0，底面法向量为 (0,0,1)
  const cosTheta = Math.abs(n.z);
  const thetaRad = Math.acos(Math.min(1, Math.max(0, cosTheta)));
  const thetaDeg = (thetaRad * 180) / Math.PI;

  // 避免截面垂直于底面 (cos θ = 0) 时除以 0
  const isProjectionValid = cosTheta > 1e-4 && points.length >= 3;

  return {
    area3D,
    perimeter,
    shapeName,
    areaProj,
    cosTheta,
    thetaDeg,
    isProjectionValid,
  };
}

/**
 * 动点参数极值探究采样输出
 */
export interface AreaCurveSample {
  t: number;
  area: number;
  perimeter: number;
  vertexCount: number;
}

export interface AreaCurveAnalysis {
  samples: AreaCurveSample[];
  minArea: number;
  maxArea: number;
  minT: number;
  maxT: number;
  transitionPoints: number[]; // 形状突变拐点 t
}
