import { describe, it, expect } from "vitest";
import {
  computeConicHomogenization,
  getPerpendicularChordLineA,
  getLeftVertexPerpendicularFixedPoint,
} from "./conicHomogenization";

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

  it("新高考压轴真题：左顶点直角弦 PA ⊥ PB 与动割线恒过定点 Q 验证", () => {
    const a = 2.5;
    const b = 1.5;
    const exactLineA = getPerpendicularChordLineA(a, b);
    const expectedQ = getLeftVertexPerpendicularFixedPoint(a, b);

    const res = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "shift",
      a,
      b,
      P: { x: -a, y: 0 },
      lineA: exactLineA,
      lineB: 0.35, // 倾斜动割线
    });

    expect(res.isValidIntersections).toBe(true);
    expect(res.theoreticalProduct).not.toBeNull();
    // 验证理论斜率积严格为 -1 (直角弦)
    expect(res.theoreticalProduct!).toBeCloseTo(-1, 4);
    expect(res.measuredProduct!).toBeCloseTo(-1, 3);

    // 验证动割线恒过定点 Q
    expect(res.fixedPointQ).not.toBeNull();
    expect(res.fixedPointQ!.x).toBeCloseTo(expectedQ.x, 4);
    expect(res.fixedPointQ!.y).toBe(0);

    // 验证定点 Q 坐标代入割线方程 lineA*(x - x0) + lineB*(y - y0) = 1 严格成立
    const lineValAtQ = exactLineA * (expectedQ.x - -a) + 0.35 * (0 - 0);
    expect(lineValAtQ).toBeCloseTo(1, 4);
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

  it("新高考压轴题：非对称斜率约束与韦达消参特征量计算", () => {
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
    expect(res.asymmetricEliminationResidual).not.toBeNull();
  });

  it("割线与曲线无交点时触发退化保护", () => {
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
