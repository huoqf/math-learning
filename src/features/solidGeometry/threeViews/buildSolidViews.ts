/**
 * 三视图统一出口：按立体类型分发到对应的投影/解析构造函数。
 *
 * - 凸多面体（长方体/棱锥）→ projectPolyhedron（含消隐虚线）
 * - 旋转体（圆柱/圆锥/圆台/球）→ 解析视图（标准教材图形）
 */

import type { ViewDrawing, ViewName } from "@/math3d/orthographicProjection";
import { projectPolyhedron } from "@/math3d/orthographicProjection";
import {
  buildCuboidPolyhedron,
  buildRegularPyramidPolyhedron,
} from "@/math3d/sectionIntersection";
import {
  cylinderViews,
  coneViews,
  frustumViews,
  sphereViews,
} from "@/math3d/curvedSolidViews";

export type SolidKind =
  "cuboid" | "pyramid" | "cylinder" | "cone" | "frustum" | "sphere";

export interface SolidViewParams {
  width?: number;
  depth?: number;
  height?: number;
  sides?: number;
  baseRadius?: number;
  radius?: number;
  topRadius?: number;
  bottomRadius?: number;
}

export function buildSolidViews(
  kind: SolidKind,
  p: SolidViewParams,
): { views: Record<ViewName, ViewDrawing>; extent: number } {
  switch (kind) {
    case "cuboid": {
      const poly = buildCuboidPolyhedron(p.width!, p.depth!, p.height!);
      return {
        views: {
          front: projectPolyhedron(poly, "front"),
          side: projectPolyhedron(poly, "side"),
          top: projectPolyhedron(poly, "top"),
        },
        extent: Math.max(p.width!, p.depth!, p.height!),
      };
    }
    case "pyramid": {
      const poly = buildRegularPyramidPolyhedron(
        p.sides!,
        p.baseRadius!,
        p.height!,
      );
      return {
        views: {
          front: projectPolyhedron(poly, "front"),
          side: projectPolyhedron(poly, "side"),
          top: projectPolyhedron(poly, "top"),
        },
        extent: Math.max(p.baseRadius! * 2, p.height!),
      };
    }
    case "cylinder":
      return {
        views: cylinderViews(p.radius!, p.height!),
        extent: Math.max(p.radius! * 2, p.height!),
      };
    case "cone":
      return {
        views: coneViews(p.radius!, p.height!),
        extent: Math.max(p.radius! * 2, p.height!),
      };
    case "frustum":
      return {
        views: frustumViews(p.bottomRadius!, p.topRadius!, p.height!),
        extent: Math.max(p.bottomRadius! * 2, p.height!),
      };
    case "sphere":
      return { views: sphereViews(p.radius!), extent: p.radius! * 2 };
  }
}
