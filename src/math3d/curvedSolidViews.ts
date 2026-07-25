/**
 * 旋转体三视图解析构造（纯函数，无 three.js 依赖）
 *
 * 圆柱/圆锥/圆台/球的三视图是教材标准图形，直接解析构造比套通用消隐算法
 * 更精确、更快。每个函数返回 front/side/top 三个方向的 ViewDrawing。
 *
 * 国标约定：
 * - 圆的俯视图必须画十字中心线（点划线），标记回转轴位置
 * - 正/侧视图中轴线也用点划线表示
 */

import type { ViewDrawing, Point2D } from "./orthographicProjection";

function seg(a: Point2D, b: Point2D): [Point2D, Point2D] {
  return [a, b];
}

function circleView(radius: number, segments = 72): ViewDrawing {
  const pts: Point2D[] = Array.from({ length: segments + 1 }, (_, i) => {
    const t = (i / segments) * Math.PI * 2;
    return { u: radius * Math.cos(t), v: radius * Math.sin(t) };
  });
  const solid: [Point2D, Point2D][] = [];
  for (let i = 0; i < segments; i++) solid.push(seg(pts[i], pts[i + 1]));
  const ext = radius * 1.12;
  return {
    solid,
    dashed: [],
    // 国标：圆的俯视图必须画十字中心线（点划线），标记回转轴位置
    centerline: [
      seg({ u: -ext, v: 0 }, { u: ext, v: 0 }),
      seg({ u: 0, v: -ext }, { u: 0, v: ext }),
    ],
  };
}

/** 圆柱：正/侧视图为矩形+竖直轴线，俯视图为圆+十字中心线 */
export function cylinderViews(
  radius: number,
  height: number,
): Record<"front" | "side" | "top", ViewDrawing> {
  const rect = (): ViewDrawing => ({
    solid: [
      seg({ u: -radius, v: 0 }, { u: radius, v: 0 }),
      seg({ u: radius, v: 0 }, { u: radius, v: height }),
      seg({ u: radius, v: height }, { u: -radius, v: height }),
      seg({ u: -radius, v: height }, { u: -radius, v: 0 }),
    ],
    dashed: [],
    centerline: [seg({ u: 0, v: -height * 0.06 }, { u: 0, v: height * 1.06 })],
  });
  return { front: rect(), side: rect(), top: circleView(radius) };
}

/** 圆锥：正/侧视图为等腰三角形+轴线，俯视图为圆+十字中心线 */
export function coneViews(
  radius: number,
  height: number,
): Record<"front" | "side" | "top", ViewDrawing> {
  const triangle = (): ViewDrawing => ({
    solid: [
      seg({ u: -radius, v: 0 }, { u: radius, v: 0 }),
      seg({ u: radius, v: 0 }, { u: 0, v: height }),
      seg({ u: 0, v: height }, { u: -radius, v: 0 }),
    ],
    dashed: [],
    centerline: [seg({ u: 0, v: -height * 0.06 }, { u: 0, v: height * 1.06 })],
  });
  return { front: triangle(), side: triangle(), top: circleView(radius) };
}

/** 圆台：正/侧视图为等腰梯形+轴线，俯视图为两个同心圆 */
export function frustumViews(
  bottomRadius: number,
  topRadius: number,
  height: number,
): Record<"front" | "side" | "top", ViewDrawing> {
  const trapezoid = (): ViewDrawing => ({
    solid: [
      seg({ u: -bottomRadius, v: 0 }, { u: bottomRadius, v: 0 }),
      seg({ u: bottomRadius, v: 0 }, { u: topRadius, v: height }),
      seg({ u: topRadius, v: height }, { u: -topRadius, v: height }),
      seg({ u: -topRadius, v: height }, { u: -bottomRadius, v: 0 }),
    ],
    dashed: [],
    centerline: [seg({ u: 0, v: -height * 0.06 }, { u: 0, v: height * 1.06 })],
  });
  const outer = circleView(bottomRadius);
  const inner = circleView(topRadius);
  const top: ViewDrawing = {
    solid: [...outer.solid, ...inner.solid],
    dashed: [],
    centerline: outer.centerline,
  };
  return { front: trapezoid(), side: trapezoid(), top };
}

/** 球：三个方向视图完全相同——大小相同的圆+十字中心线 */
export function sphereViews(
  radius: number,
): Record<"front" | "side" | "top", ViewDrawing> {
  const circle = circleView(radius);
  return { front: circle, side: circle, top: circle };
}
