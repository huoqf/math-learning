/**
 * 截面求交算法（纯函数，无 three.js 依赖）
 *
 * 覆盖两类立体：
 * 1. 凸多面体（长方体/棱锥/棱台）——逐边符号变化 + 线性插值 + 极角排序
 * 2. 旋转体（圆柱/圆锥/圆台/球）——逐方位角解析/数值求根
 *
 * 关键约束：教学场景涉及的所有立体均为凸体，截面恒为凸图形，
 * 因此"绕质心极角排序"等价于正确的多边形环绕顺序。
 */

import type { Vec3 } from "./vector3";
import { add, sub, scale, dot, cross, normalize, lerp } from "./vector3";
import type { Plane } from "./plane";
import { radiusAtZ } from "./rotationProfiles";
import type { ProfilePoint } from "./rotationProfiles";

const EPS = 1e-7;
const Z_EPS = 1e-9;

// ============================================================
// 工具函数
// ============================================================

function buildPlaneBasis(normal: Vec3): { u: Vec3; v: Vec3 } {
  const n = normalize(normal);
  const helper: Vec3 =
    Math.abs(n.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(helper, n));
  const v = normalize(cross(n, u));
  return { u, v };
}

function dedupe(points: Vec3[], eps = 1e-5): Vec3[] {
  const out: Vec3[] = [];
  for (const p of points) {
    if (!out.some((q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < eps))
      out.push(p);
  }
  return out;
}

/**
 * 将共面三维点按绕质心极角排序成闭合环。
 * 前提：截面恒为凸图形（教学场景所有立体均为凸体）。
 */
function orderByAngleAroundCentroid(points: Vec3[], plane: Plane): Vec3[] {
  if (points.length < 3) return points;
  const centroid = points.reduce((acc, p) => add(acc, p), {
    x: 0,
    y: 0,
    z: 0,
  } as Vec3);
  const c = scale(centroid, 1 / points.length);
  const { u, v } = buildPlaneBasis(plane.normal);
  return [...points].sort((p1, p2) => {
    const d1 = sub(p1, c);
    const d2 = sub(p2, c);
    return (
      Math.atan2(dot(d1, v), dot(d1, u)) - Math.atan2(dot(d2, v), dot(d2, u))
    );
  });
}

// ============================================================
// 一、凸多面体求交
// ============================================================

export interface PolyhedronEdge {
  a: number;
  b: number;
}

export interface Polyhedron {
  vertices: Vec3[];
  edges: PolyhedronEdge[];
  /** 各面顶点索引环（环绕方向不要求一致，orthographicProjection 会自动纠正法向朝外） */
  faces: number[][];
}

/**
 * 凸多面体与平面求交，返回按环绕顺序排列的截面多边形顶点。
 * 逐边判断符号变化，线性插值出交点；极角排序确定环绕顺序。
 */
export function intersectConvexPolyhedronPlane(
  polyhedron: Polyhedron,
  plane: Plane,
): Vec3[] {
  const dists = polyhedron.vertices.map((v) =>
    dot(sub(v, plane.point), plane.normal),
  );
  const points: Vec3[] = [];

  for (const { a, b } of polyhedron.edges) {
    const da = dists[a];
    const db = dists[b];
    if (Math.abs(da) < EPS && Math.abs(db) < EPS) continue;
    if (Math.abs(da) < EPS) {
      points.push(polyhedron.vertices[a]);
    } else if (da * db < 0) {
      const t = da / (da - db);
      points.push(lerp(polyhedron.vertices[a], polyhedron.vertices[b], t));
    }
  }

  const unique = dedupe(points);
  if (unique.length < 3) return [];
  return orderByAngleAroundCentroid(unique, plane);
}

// ── 常用立体构造器 ──

/** 长方体：a(x) × b(y) × c(z)，底面中心在原点 */
export function buildCuboidPolyhedron(
  a: number,
  b: number,
  c: number,
): Polyhedron {
  const hx = a / 2;
  const hy = b / 2;
  const vertices: Vec3[] = [
    { x: -hx, y: -hy, z: 0 },
    { x: hx, y: -hy, z: 0 },
    { x: hx, y: hy, z: 0 },
    { x: -hx, y: hy, z: 0 },
    { x: -hx, y: -hy, z: c },
    { x: hx, y: -hy, z: c },
    { x: hx, y: hy, z: c },
    { x: -hx, y: hy, z: c },
  ];
  const edges: PolyhedronEdge[] = [
    { a: 0, b: 1 },
    { a: 1, b: 2 },
    { a: 2, b: 3 },
    { a: 3, b: 0 },
    { a: 4, b: 5 },
    { a: 5, b: 6 },
    { a: 6, b: 7 },
    { a: 7, b: 4 },
    { a: 0, b: 4 },
    { a: 1, b: 5 },
    { a: 2, b: 6 },
    { a: 3, b: 7 },
  ];
  const faces: number[][] = [
    [0, 1, 2, 3], // 底面
    [4, 5, 6, 7], // 顶面
    [0, 1, 5, 4], // 前面
    [1, 2, 6, 5], // 右面
    [2, 3, 7, 6], // 后面
    [3, 0, 4, 7], // 左面
  ];
  return { vertices, edges, faces };
}

/** 正 n 棱锥：底面外接圆半径 baseRadius，高 height */
export function buildRegularPyramidPolyhedron(
  sides: number,
  baseRadius: number,
  height: number,
): Polyhedron {
  const base: Vec3[] = Array.from({ length: sides }, (_, i) => {
    const t = (i / sides) * Math.PI * 2;
    return {
      x: baseRadius * Math.cos(t),
      y: baseRadius * Math.sin(t),
      z: 0,
    };
  });
  const apex: Vec3 = { x: 0, y: 0, z: height };
  const vertices = [...base, apex];
  const apexIdx = sides;
  const edges: PolyhedronEdge[] = [];
  for (let i = 0; i < sides; i++) {
    edges.push({ a: i, b: (i + 1) % sides });
    edges.push({ a: i, b: apexIdx });
  }
  const faces: number[][] = [
    Array.from({ length: sides }, (_, i) => i), // 底面
    ...Array.from({ length: sides }, (_, i) => [i, (i + 1) % sides, apexIdx]), // 侧面三角形
  ];
  return { vertices, edges, faces };
}

// ============================================================
// 二、旋转体求交
// ============================================================

export interface RotationSection {
  points: Vec3[];
  intersectsCap: boolean;
}

interface LateralSegment {
  z0: number;
  z1: number;
  r0: number;
  r1: number;
}

function buildLateralSegments(profile: ProfilePoint[]): LateralSegment[] {
  const pts = [...profile].sort((a, b) => a.z - b.z);
  const segs: LateralSegment[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (Math.abs(b.z - a.z) < Z_EPS) continue;
    segs.push({ z0: a.z, z1: b.z, r0: a.r, r1: b.r });
  }
  return segs;
}

/**
 * 沿固定方位角 theta，求侧面母线与平面的交点高度 z。
 * profile 内相邻两点间按线性插值（radiusAtZ 约定），每段内方程对 z 线性，直接解析求解。
 */
function solveZForTheta(
  profile: ProfilePoint[],
  plane: Plane,
  theta: number,
): number[] {
  const segs = buildLateralSegments(profile);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const { normal, point } = plane;
  const d = dot(point, normal);

  // f(z) = nx*r(z)*cosθ + ny*r(z)*sinθ + nz*z - d
  const roots: number[] = [];

  for (const seg of segs) {
    const k = (seg.r1 - seg.r0) / (seg.z1 - seg.z0);
    const coeff = normal.x * cosT + normal.y * sinT;
    const A = coeff * k + normal.z;
    const B = coeff * (seg.r0 - k * seg.z0) - d;
    if (Math.abs(A) < EPS) continue;
    const z = -B / A;
    if (z >= seg.z0 - Z_EPS && z <= seg.z1 + Z_EPS) roots.push(z);
  }
  return roots;
}

/**
 * 旋转体与平面求交，返回截面闭合曲线的采样点（按角度自然有序）。
 *
 * @param angularSegments 环向采样密度，越大截面曲线越光滑
 */
export function intersectRotationSolidPlane(
  profile: ProfilePoint[],
  plane: Plane,
  angularSegments = 96,
): RotationSection {
  const points: Vec3[] = [];
  for (let i = 0; i < angularSegments; i++) {
    const theta = (i / angularSegments) * Math.PI * 2;
    const roots = solveZForTheta(profile, plane, theta);
    if (roots.length === 0) continue;
    const z = roots[0];
    const r = radiusAtZ(profile, z);
    points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z });
  }
  return { points, intersectsCap: false };
}
