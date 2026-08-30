import { describe, it, expect } from "vitest";
import { calculateLineConicParam, calculateEllipseParam } from "./conicParam";

describe("calculateLineConicParam - 直线与椭圆参数方程计算", () => {
  it("水平直线经过椭圆中心 (0, 0)，交点参数为 -a 和 a", () => {
    const res = calculateLineConicParam(0, 0, 0, 1, 4, 3);
    expect(res.valid).toBe(true);
    expect(res.t1).toBeCloseTo(-4);
    expect(res.t2).toBeCloseTo(4);
    expect(res.chordLength).toBeCloseTo(8);
    expect(res.pointM.x).toBeCloseTo(0);
    expect(res.pointM.y).toBeCloseTo(0);
  });

  it("垂直直线 α = 90° 经过焦点 (c, 0)", () => {
    const a = 5;
    const b = 4;
    const c = Math.sqrt(a * a - b * b); // c = 3
    const res = calculateLineConicParam(c, 0, 90, 0, a, b);
    expect(res.valid).toBe(true);
    expect(res.pointA.x).toBeCloseTo(3);
    expect(res.pointB.x).toBeCloseTo(3);
    // 通径长度 2b^2 / a = 2*16/5 = 6.4
    expect(res.chordLength).toBeCloseTo(6.4);
  });

  it("当直线在椭圆外不相交时返回 valid = false", () => {
    // x = 10 垂直线与 a=3 椭圆无交点
    const res = calculateLineConicParam(10, 0, 90, 0, 3, 2);
    expect(res.valid).toBe(false);
    expect(res.discriminant).toBeLessThan(0);
  });
});

describe("calculateEllipseParam - 椭圆参数方程与离心圆", () => {
  it("参数角 θ = 0° 时，点 P 为右顶点 (a, 0)", () => {
    const res = calculateEllipseParam(4, 3, 0);
    expect(res.P.x).toBeCloseTo(4);
    expect(res.P.y).toBeCloseTo(0);
    expect(res.Paux.x).toBeCloseTo(4);
    expect(res.Paux.y).toBeCloseTo(0);
  });

  it("参数角 θ = 90° 时，点 P 为上顶点 (0, b)", () => {
    const res = calculateEllipseParam(4, 3, 90);
    expect(res.P.x).toBeCloseTo(0);
    expect(res.P.y).toBeCloseTo(3);
    expect(res.Paux.x).toBeCloseTo(0);
    expect(res.Paux.y).toBeCloseTo(4);
  });

  it("切线三角形面积极值：当 θ = 45° 时取得最小值 S_min = a * b", () => {
    const a = 4;
    const b = 3;
    const res45 = calculateEllipseParam(a, b, 45);
    // S_min = a * b = 12
    expect(res45.triangleArea).toBeCloseTo(12, 4);

    // 当 θ = 30° 时，S = ab / sin(60°) = 12 / (sqrt(3)/2) = 24 / sqrt(3) ≈ 13.856 > 12
    const res30 = calculateEllipseParam(a, b, 30);
    expect(res30.triangleArea).toBeCloseTo(24 / Math.sqrt(3), 4);
    expect(res30.triangleArea).toBeGreaterThan(res45.triangleArea);
  });

  it("直线割线乘积 |PA| * |PB| = |t1 * t2|", () => {
    // 椭圆 a=5, b=3, 定点 P(0, 0), alpha = 0° (x 轴), t1 = -5, t2 = 5
    const res = calculateLineConicParam(0, 0, 0, 0, 5, 3);
    expect(res.productPA_PB).toBeCloseTo(25, 4);
  });
});
