/**
 * 凸多面体三视图投影（纯函数，无 three.js 依赖）
 *
 * 投影方式：正投影（平行投影），不含透视缩放——
 * 这是"长对正/高平齐/宽相等"三个对应关系成立的数学前提。
 *
 * 消隐规则：仅当相邻两个面都严格背向相机时才判定为隐藏（虚线），
 * 再通过"隐藏边若与可见边重合则丢弃"去重兜底。
 */

import type { Vec3 } from "./vector3";
import { sub, cross, dot, normalize } from "./vector3";
import type { Polyhedron } from "./sectionIntersection";

export type ViewName = "front" | "side" | "top";

export interface Point2D {
  u: number;
  v: number;
}

export interface ViewDrawing {
  /** 实线（可见轮廓/棱） */
  solid: [Point2D, Point2D][];
  /** 虚线（被遮挡的棱） */
  dashed: [Point2D, Point2D][];
  /** 点划线（对称轴/圆心十字，国标 centerline） */
  centerline: [Point2D, Point2D][];
}

interface ViewAxis {
  /** 从物体指向相机的方向（单位向量），用于面法向量的前后分类 */
  viewDir: Vec3;
  /** 三维坐标 -> 二维图纸坐标（u 向右为正，v 向上为正） */
  project: (p: Vec3) => Point2D;
}

/**
 * 三视图坐标约定（数学坐标 x=长度 y=进深 z=高度）：
 * - 正视图 front：相机在 -y 一侧看向物体，u=x，v=z
 * - 侧视图 side（惯例=左视图）：相机在 +x 一侧看向物体，u=-y，v=z
 * - 俯视图 top：相机在 +z 一侧俯视，u=x，v=-y
 *
 * 三视图共享同一套 x/z 数值 → 天然满足"长对正、高平齐"；
 * side 的 u(-y) 与 top 的 v(-y) 复用同一分量 → 天然满足"宽相等"。
 */
export const VIEW_AXES: Record<ViewName, ViewAxis> = {
  front: {
    viewDir: { x: 0, y: -1, z: 0 },
    project: (p) => ({ u: p.x, v: p.z }),
  },
  side: {
    viewDir: { x: 1, y: 0, z: 0 },
    project: (p) => ({ u: -p.y, v: p.z }),
  },
  top: { viewDir: { x: 0, y: 0, z: 1 }, project: (p) => ({ u: p.x, v: -p.y }) },
};

const EPS = 1e-6;

function faceCentroid(vertices: Vec3[], face: number[]): Vec3 {
  const sum = face.reduce(
    (acc, i) => ({
      x: acc.x + vertices[i].x,
      y: acc.y + vertices[i].y,
      z: acc.z + vertices[i].z,
    }),
    { x: 0, y: 0, z: 0 },
  );
  return {
    x: sum.x / face.length,
    y: sum.y / face.length,
    z: sum.z / face.length,
  };
}

function solidCentroid(vertices: Vec3[]): Vec3 {
  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y, z: acc.z + v.z }),
    { x: 0, y: 0, z: 0 },
  );
  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length,
    z: sum.z / vertices.length,
  };
}

/**
 * 计算每个面的外向单位法向量。不要求输入面顶点环绕方向一致——
 * 叉积取向后与"面心→体心"方向比较，若指向体内则翻转，保证恒指向体外。
 */
function computeOutwardNormals(polyhedron: Polyhedron): Vec3[] {
  const center = solidCentroid(polyhedron.vertices);
  return polyhedron.faces.map((face) => {
    const [i0, i1, i2] = face;
    const v0 = polyhedron.vertices[i0];
    const v1 = polyhedron.vertices[i1];
    const v2 = polyhedron.vertices[i2];
    let n = normalize(cross(sub(v1, v0), sub(v2, v0)));
    const toFace = sub(faceCentroid(polyhedron.vertices, face), center);
    if (dot(n, toFace) < 0) n = { x: -n.x, y: -n.y, z: -n.z };
    return n;
  });
}

/**
 * 边是否应画为隐藏（虚线）：仅当相邻两个面都严格背向相机才判定隐藏。
 * 只要有一个面正对或与视线垂直（如长方体的上下面之于正视图，dot≈0），
 * 该边即可见——这类"边缘面"本身不遮挡任何东西，判定不隐藏是几何上正确的，
 * 也正是轮廓边（silhouette edge：一面朝前一面朝后）恒为可见的通用情形。
 */
function isEdgeHidden(normalsAtEdge: Vec3[], viewDir: Vec3): boolean {
  if (normalsAtEdge.length === 0) return false;
  return normalsAtEdge.every((n) => dot(n, viewDir) < -EPS);
}

function pointsClose(a: Point2D, b: Point2D, eps = 1e-4): boolean {
  return Math.abs(a.u - b.u) < eps && Math.abs(a.v - b.v) < eps;
}

function segmentsMatch(
  s1: [Point2D, Point2D],
  s2: [Point2D, Point2D],
): boolean {
  return (
    (pointsClose(s1[0], s2[0]) && pointsClose(s1[1], s2[1])) ||
    (pointsClose(s1[0], s2[1]) && pointsClose(s1[1], s2[0]))
  );
}

/**
 * 计算凸多面体在指定视图方向下的三视图线框（含消隐）。
 *
 * 关键设计：轴对称立体（长方体、正棱锥）的前后对称棱，在轴向正投影下
 * 会精确投影到同一条线段——此时无论该棱被判定可见还是隐藏，最终视觉
 * 都应只画一条实线。因此消隐判断只需做到"两面都严格背向才算隐藏"这一
 * 基本正确的粗粒度规则，再通过"隐藏边若与某条可见边完全重合则丢弃"的
 * 去重步骤兜底，无需实现完整的通用可见性算法。
 */
export function projectPolyhedron(
  polyhedron: Polyhedron,
  viewName: ViewName,
): ViewDrawing {
  const { viewDir, project } = VIEW_AXES[viewName];
  const normals = computeOutwardNormals(polyhedron);

  const edgeFaceNormals: Vec3[][] = polyhedron.edges.map(({ a, b }) => {
    const adjacent: Vec3[] = [];
    polyhedron.faces.forEach((face, fi) => {
      const ia = face.indexOf(a);
      const ib = face.indexOf(b);
      if (ia === -1 || ib === -1) return;
      const isAdjacentInLoop =
        Math.abs(ia - ib) === 1 || Math.abs(ia - ib) === face.length - 1;
      if (isAdjacentInLoop) adjacent.push(normals[fi]);
    });
    return adjacent;
  });

  const rawSolid: [Point2D, Point2D][] = [];
  const rawDashed: [Point2D, Point2D][] = [];

  polyhedron.edges.forEach(({ a, b }, i) => {
    const p1 = project(polyhedron.vertices[a]);
    const p2 = project(polyhedron.vertices[b]);
    if (pointsClose(p1, p2)) return; // 投影退化为一点（如沿深度方向的棱），跳过
    const hidden = isEdgeHidden(edgeFaceNormals[i], viewDir);
    (hidden ? rawDashed : rawSolid).push([p1, p2]);
  });

  // 隐藏边若与可见边重合则丢弃
  const dashed = rawDashed.filter(
    (d) => !rawSolid.some((s) => segmentsMatch(s, d)),
  );

  // 去重可见边
  const solid: [Point2D, Point2D][] = [];
  for (const seg of rawSolid) {
    if (!solid.some((s) => segmentsMatch(s, seg))) solid.push(seg);
  }

  return { solid, dashed, centerline: [] };
}
