import { describe, it, expect } from "vitest";
import { coneViews } from "@/math3d/curvedSolidViews";
import type { Point2D } from "@/math3d/orthographicProjection";

function bboxCenter(drawing: {
  solid: [Point2D, Point2D][];
  dashed: [Point2D, Point2D][];
  centerline: [Point2D, Point2D][];
}) {
  const pts = [
    ...drawing.solid,
    ...drawing.dashed,
    ...drawing.centerline,
  ].flat();
  const us = pts.map((p: Point2D) => p.u);
  const vs = pts.map((p: Point2D) => p.v);
  return {
    cx: (Math.max(...us) + Math.min(...us)) / 2,
    cy: (Math.max(...vs) + Math.min(...vs)) / 2,
  };
}

describe("三视图包围盒居中不破坏对齐约束", () => {
  it("正视图与俯视图的 u 方向（x轴）包围盒中心一致 —— 长对正", () => {
    const { front, top } = coneViews(3, 6);
    expect(bboxCenter(front).cx).toBeCloseTo(bboxCenter(top).cx, 5);
  });

  it("正视图与侧视图的 v 方向（高度轴）包围盒中心一致 —— 高平齐", () => {
    const { front, side } = coneViews(3, 6);
    expect(bboxCenter(front).cy).toBeCloseTo(bboxCenter(side).cy, 5);
  });
});
