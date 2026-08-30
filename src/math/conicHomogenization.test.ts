import { describe, it, expect } from "vitest";
import { computeConicHomogenization } from "./conicHomogenization";

describe("conicHomogenization math calculations", () => {
  it("should compute valid homogenization for origin mode with ellipse", () => {
    const res = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "origin",
      a: 3.5,
      b: 2.5,
      P: { x: 0, y: 0 },
      lineA: 0.2,
      lineB: 0.3,
    });

    expect(res.isValidIntersections).toBe(true);
    expect(res.A).not.toBeNull();
    expect(res.B).not.toBeNull();
    expect(res.theoreticalSum).not.toBeNull();
    expect(res.measuredSum).not.toBeNull();

    // 理论斜率和与实测斜率和一致 (误差在 1e-3 内)
    expect(res.theoreticalSum!).toBeCloseTo(res.measuredSum!, 3);
    expect(res.theoreticalProduct!).toBeCloseTo(res.measuredProduct!, 3);
  });

  it("should compute valid homogenization for vertex shift mode", () => {
    const res = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "shift",
      a: 2.5,
      b: 1.5,
      P: { x: -2.5, y: 0 },
      lineA: 0.3,
      lineB: 0.4,
    });

    expect(res.isValidIntersections).toBe(true);
    expect(res.measuredK1).not.toBeNull();
    expect(res.measuredK2).not.toBeNull();
    expect(res.theoreticalSum!).toBeCloseTo(res.measuredSum!, 3);
  });

  it("双曲线齐次化联立与斜率和/积理论值校验", () => {
    const res = computeConicHomogenization({
      curveType: "hyperbola",
      studyMode: "origin",
      a: 3.0,
      b: 2.0,
      P: { x: 0, y: 0 },
      lineA: 0.25,
      lineB: 0.1,
    });

    expect(res.isValidIntersections).toBe(true);
    expect(res.theoreticalSum).not.toBeNull();
    expect(res.theoreticalProduct).not.toBeNull();
    expect(res.theoreticalSum!).toBeCloseTo(res.measuredSum!, 3);
    expect(res.theoreticalProduct!).toBeCloseTo(res.measuredProduct!, 3);
  });

  it("新高考压轴题：非对称加权斜率和 λ k1 + μ k2 计算", () => {
    const res = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "asymmetric",
      a: 3.0,
      b: 2.0,
      P: { x: -3.0, y: 0 }, // 左顶点
      lineA: 0.2,
      lineB: 0.3,
      lambda: 2,
      mu: 3,
    });

    expect(res.isValidIntersections).toBe(true);
    expect(res.measuredK1).not.toBeNull();
    expect(res.measuredK2).not.toBeNull();
    const expectedWeighted = 2 * res.measuredK1! + 3 * res.measuredK2!;
    expect(res.asymmetricWeightedSum).toBeCloseTo(expectedWeighted, 4);
  });

  it("割线与曲线无交点时触发退化保护", () => {
    const res = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "origin",
      a: 2.0,
      b: 1.0,
      P: { x: 0, y: 0 },
      lineA: 10, // 割线 10x + 10y = 1 距离原点太近或斜率太大与椭圆无交点？
      lineB: 10, // 10x + 10y = 1 => x+y=0.1, 与椭圆有交点。如果是 0.001x + 0.001y = 1 => 割线在外部很远
    });

    const resFar = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "origin",
      a: 2.0,
      b: 1.0,
      P: { x: 0, y: 0 },
      lineA: 0.01,
      lineB: 0.01, // 0.01x + 0.01y = 1 => x + y = 100，完全在椭圆外部
    });

    expect(resFar.isValidIntersections).toBe(false);
    expect(resFar.degenerationReason).toBe("delta_non_positive");
  });
});
