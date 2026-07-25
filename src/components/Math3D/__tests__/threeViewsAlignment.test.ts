import { describe, it, expect } from "vitest";
import { coneViews } from "@/math3d/curvedSolidViews";

function bboxCenter(drawing: {
  solid: [any, any][];
  dashed: [any, any][];
  centerline: [any, any][];
}) {
  const pts = [
    ...drawing.solid,
    ...drawing.dashed,
    ...drawing.centerline,
  ].flat();
  const us = pts.map((p: any) => p.u);
  const vs = pts.map((p: any) => p.v);
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
