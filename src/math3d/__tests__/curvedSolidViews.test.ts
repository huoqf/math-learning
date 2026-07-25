import { describe, it, expect } from "vitest";
import {
  cylinderViews,
  coneViews,
  frustumViews,
  sphereViews,
} from "../curvedSolidViews";

describe("curvedSolidViews", () => {
  it("圆柱正视图矩形宽=2R，高=H", () => {
    const { front } = cylinderViews(2, 5);
    const us = front.solid.flatMap((s) => [s[0].u, s[1].u]);
    const vs = front.solid.flatMap((s) => [s[0].v, s[1].v]);
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(4, 5);
    expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(5, 5);
  });

  it("圆柱俯视图为圆（72段）", () => {
    const { top } = cylinderViews(2, 5);
    expect(top.solid.length).toBe(72);
  });

  it("圆柱正视图有轴线中心线", () => {
    const { front } = cylinderViews(2, 5);
    expect(front.centerline.length).toBe(1);
  });

  it("圆锥正视图为三角形（3条边）", () => {
    const { front } = coneViews(3, 6);
    expect(front.solid.length).toBe(3);
  });

  it("圆台正视图为梯形（4条边）", () => {
    const { front } = frustumViews(3, 1.5, 4);
    expect(front.solid.length).toBe(4);
  });

  it("圆台俯视图为两个同心圆（外圆+内圆各72段）", () => {
    const { top } = frustumViews(3, 1.5, 4);
    expect(top.solid.length).toBe(144);
  });

  it("球三个视图半径相同", () => {
    const { front, side, top } = sphereViews(2);
    const radiusOf = (d: typeof front) =>
      Math.hypot(d.solid[0][0].u, d.solid[0][0].v);
    expect(radiusOf(front)).toBeCloseTo(2, 3);
    expect(radiusOf(side)).toBeCloseTo(2, 3);
    expect(radiusOf(top)).toBeCloseTo(2, 3);
  });

  it("球三个视图均有十字中心线", () => {
    const { front, side, top } = sphereViews(2);
    expect(front.centerline.length).toBe(2);
    expect(side.centerline.length).toBe(2);
    expect(top.centerline.length).toBe(2);
  });
});
