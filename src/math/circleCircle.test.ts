/**
 * src/math/circleCircle.test.ts
 * 两圆位置关系与公共弦计算单元测试
 */
import { describe, it, expect } from "vitest";
import { calculateCircleCircle } from "./circleCircle";

describe("calculateCircleCircle", () => {
  it("应准确识别两圆外离并计算 4 条公切线", () => {
    const res = calculateCircleCircle({
      x1: -3,
      y1: 0,
      r1: 1.5,
      x2: 3,
      y2: 0,
      r2: 1.5,
    });
    expect(res.relation).toBe("disjoint");
    expect(res.d).toBeCloseTo(6);
    expect(res.tangents.length).toBe(4);
    expect(res.intersections.length).toBe(0);
    expect(res.outerTangentLength).toBeCloseTo(6);
    expect(res.innerTangentLength).toBeCloseTo(Math.sqrt(36 - 9)); // sqrt(27)
  });

  it("应准确识别两圆外切并计算 3 条公切线与切点", () => {
    const res = calculateCircleCircle({
      x1: -2,
      y1: 0,
      r1: 2,
      x2: 2,
      y2: 0,
      r2: 2,
    });
    expect(res.relation).toBe("outer_tangent");
    expect(res.d).toBeCloseTo(4);
    expect(res.tangents.length).toBe(3);
    expect(res.intersections.length).toBe(1);
    expect(res.intersections[0].x).toBeCloseTo(0);
    expect(res.intersections[0].y).toBeCloseTo(0);
    expect(res.outerTangentLength).toBeCloseTo(4);
    expect(res.innerTangentLength).toBeCloseTo(0);
  });

  it("应准确识别两圆相交并计算公共弦方程、弦心距与弦长", () => {
    // 圆1: x^2 + y^2 = 4 (r=2)
    // 圆2: (x-2)^2 + y^2 = 4 (r=2)
    // 弦交点: x=1, y = +-sqrt(3) => 弦长 2*sqrt(3) ~= 3.464, 弦心距 d1=1
    const res = calculateCircleCircle({
      x1: 0,
      y1: 0,
      r1: 2,
      x2: 2,
      y2: 0,
      r2: 2,
    });
    expect(res.relation).toBe("intersect");
    expect(res.intersections.length).toBe(2);
    expect(res.commonChord?.length).toBeCloseTo(2 * Math.sqrt(3));
    expect(res.commonChord?.distToO1).toBeCloseTo(1.0);
    expect(res.tangents.length).toBe(2); // 2 条外公切线
    expect(res.outerTangentLength).toBeCloseTo(2);
    expect(res.innerTangentLength).toBeNull();
  });

  it("应准确识别两圆内切与内含", () => {
    const resInnerTangent = calculateCircleCircle({
      x1: 0,
      y1: 0,
      r1: 3,
      x2: 1,
      y2: 0,
      r2: 2,
    });
    expect(resInnerTangent.relation).toBe("inner_tangent");

    const resContain = calculateCircleCircle({
      x1: 0,
      y1: 0,
      r1: 3,
      x2: 0.5,
      y2: 0,
      r2: 1,
    });
    expect(resContain.relation).toBe("contain");
    expect(resContain.tangents.length).toBe(0);
  });
});
