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
});
