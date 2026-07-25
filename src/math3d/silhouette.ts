/**
 * 旋转体轮廓线计算（通用解）
 *
 * 基于物理条件：轮廓线 = 曲面上法线恰好垂直于视线方向的点的集合（N·V=0）。
 * 正交投影近似：仅由相机方位角 thetaCam、仰角 beta 决定，忽略透视视差
 * （教学场景相机距离远大于物体尺寸，此近似误差可忽略）。
 *
 * 推导：
 *   母线切线 (dr,dz) 旋转 -90° 得子午面法线 (Nr,Nz) = (dz,-dr)。
 *   三维外法线 N(θ) = (Nr·cosθ, Nr·sinθ, Nz)。
 *   相机方向 V = (cosβ·cosθc, cosβ·sinθc, sinβ)。
 *   轮廓条件 N·V=0 化简为：
 *     cos(θ - θc) = -(Nz/Nr)·tanβ
 *     θ = θc ± arccos( clamp(-(Nz/Nr)·tanβ, -1, 1) )
 *
 * 特例退化验证：
 *   圆柱：Nr>0, Nz=0 → θ = θc±90°，与 β 无关，恒定两条竖直母线 ✅
 *   圆锥/圆台：Nr,Nz 恒定 → θ 沿母线恒定，退化为两条斜直线 ✅
 *   球：Nr,Nz 随纬度连续变化 → θ 连续变化，精确描出倾斜地平圆 ✅
 *
 * 设计要点（修复"分段常数斜率在 acos 边界处被放大成钩状伪影"的 bug）：
 *   用三次 Hermite 样条插值 r(z) 和 slope(z)，保证 C¹ 连续。
 *   圆柱/圆锥/圆台的原始点共线，Hermite 退化为直线，零副作用。
 *   球的 C¹ 连续斜率彻底消除"分段常数→acos 跳变"的病根。
 *
 *   有效性判断只在"求边界"阶段做一次二分（对噪声不敏感），
 *   求出解析边界 [zLo, zHi] 后，在区间内部做纯粹的等距重采样，
 *   全程不含任何条件跳过，输出数组物理上不可能出现内部缺口。
 */

import type { ProfilePoint } from "./rotationProfiles";

export interface SilhouettePoint {
  r: number;
  z: number;
  theta: number;
}

export interface SilhouetteResult {
  /** 左侧轮廓线，按 z 升序排列 */
  left: SilhouettePoint[];
  /** 右侧轮廓线，按 z 升序排列，与 left 一一对应同一高度 */
  right: SilhouettePoint[];
  /** 轮廓线存在的有效高度区间；null 表示当前视角下完全无轮廓解 */
  zRange: [number, number] | null;
}

const EPS = 1e-9;
const SAMPLE_COUNT = 96;

interface HermiteNode {
  z: number;
  r: number;
  /** 该节点处的切线斜率 dr/dz，用相邻两段斜率的中心差分估计（Catmull-Rom 风格），
   *  保证 slope(z) 在节点处连续，而非分段常数。 */
  m: number;
}

/**
 * 构建 Hermite 节点：提取真实侧壁轮廓点。
 *
 * 对于有端面收口的 profile（圆柱/圆锥/圆台），同一 z 处有 r=0 的轴心点和 r>0 的 rim 点，
 * 只保留 r 最大的点（rim 点），因为轴心点只是 LatheGeometry 封口用的，不属于侧壁轮廓。
 * 对于无端面的 profile（球），所有 z 唯一，无需特殊处理。
 */
function buildHermiteNodes(profile: ProfilePoint[]): HermiteNode[] {
  // 按 z 排序，同一 z 保留 r 最大的点（rim 点优先于轴心点）
  const sorted = [...profile].sort((a, b) => a.z - b.z || b.r - a.r);
  const pts: ProfilePoint[] = [];
  for (const p of sorted) {
    if (pts.length === 0 || Math.abs(p.z - pts[pts.length - 1].z) > EPS) {
      pts.push(p);
    }
    // 同一 z 的后续点（r 更小的轴心点）被跳过
  }

  const n = pts.length;
  const secant = (i: number, j: number) =>
    (pts[j].r - pts[i].r) / (pts[j].z - pts[i].z);

  return pts.map((p, i) => {
    let m: number;
    if (i === 0) m = secant(0, 1);
    else if (i === n - 1) m = secant(n - 2, n - 1);
    else m = (secant(i - 1, i) + secant(i, i + 1)) / 2;
    return { z: p.z, r: p.r, m };
  });
}

/** 三次 Hermite 插值：同时返回 r(z) 和其精确导数 slope(z)=dr/dz，全程 C¹ 连续 */
function sampleHermite(
  nodes: HermiteNode[],
  z: number,
): { r: number; slope: number } {
  let i = 0;
  while (i < nodes.length - 2 && z > nodes[i + 1].z) i++;
  const a = nodes[i];
  const b = nodes[i + 1] ?? nodes[i];
  if (a === b) return { r: a.r, slope: a.m };

  const h = b.z - a.z;
  if (h < EPS) return { r: a.r, slope: a.m };
  const t = Math.max(0, Math.min(1, (z - a.z) / h));
  const t2 = t * t;
  const t3 = t2 * t;

  // Hermite 基函数
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  const r = h00 * a.r + h10 * h * a.m + h01 * b.r + h11 * h * b.m;

  // 导数基函数
  const dh00 = 6 * t2 - 6 * t;
  const dh10 = 3 * t2 - 4 * t + 1;
  const dh01 = -6 * t2 + 6 * t;
  const dh11 = 3 * t2 - 2 * t;
  const slope = (dh00 * a.r + dh10 * h * a.m + dh01 * b.r + dh11 * h * b.m) / h;

  return { r, slope };
}

/**
 * 基于"曲面法线 ⊥ 视线方向"的物理条件计算旋转体轮廓线，正交投影近似。
 *
 * 用三次 Hermite 样条保证 slope(z) 处处 C¹ 连续，
 * 消除分段常数斜率在 acos 边界处的病态放大。
 */
export function computeSilhouette(
  profile: ProfilePoint[],
  thetaCam: number,
  beta: number,
): SilhouetteResult {
  const nodes = buildHermiteNodes(profile);
  if (nodes.length < 2) return { left: [], right: [], zRange: null };

  const zBottom = nodes[0].z;
  const zTop = nodes[nodes.length - 1].z;
  const tanBeta = Math.tan(beta);
  const rhsAt = (z: number) => sampleHermite(nodes, z).slope * tanBeta;

  // 水平视角：rhs≡0 恒有效，圆柱/圆锥退化为整条母线可见
  if (Math.abs(tanBeta) < EPS) {
    const zRange: [number, number] = [zBottom, zTop];
    return {
      ...buildCurves(nodes, thetaCam, tanBeta, zRange),
      zRange,
    };
  }

  const zMid = (zBottom + zTop) / 2;
  if (Math.abs(rhsAt(zMid)) > 1) {
    return { left: [], right: [], zRange: null };
  }

  // 从"必然有效"的中点向两端二分，精确定位有效区间边界
  const findBoundary = (zValid: number, zInvalid: number): number => {
    let lo = zValid;
    let hi = zInvalid;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (Math.abs(rhsAt(mid)) <= 1) lo = mid;
      else hi = mid;
    }
    return lo;
  };

  const zHi = Math.abs(rhsAt(zTop)) <= 1 ? zTop : findBoundary(zMid, zTop);
  const zLo =
    Math.abs(rhsAt(zBottom)) <= 1 ? zBottom : findBoundary(zMid, zBottom);

  const zRange: [number, number] = [zLo, zHi];
  return {
    ...buildCurves(nodes, thetaCam, tanBeta, zRange),
    zRange,
  };
}

function buildCurves(
  nodes: HermiteNode[],
  thetaCam: number,
  tanBeta: number,
  [zLo, zHi]: [number, number],
): { left: SilhouettePoint[]; right: SilhouettePoint[] } {
  const left: SilhouettePoint[] = [];
  const right: SilhouettePoint[] = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const z = zLo + ((zHi - zLo) * i) / SAMPLE_COUNT;
    const { r, slope } = sampleHermite(nodes, z);
    const rhs = Math.max(-1, Math.min(1, slope * tanBeta));
    const phi = Math.acos(rhs);
    left.push({ r, z, theta: thetaCam - phi });
    right.push({ r, z, theta: thetaCam + phi });
  }
  return { left, right };
}
