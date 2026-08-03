import { describe, it, expect } from "vitest";
import { solveConicLineIntersection } from "./conicLine";

describe("solveConicLineIntersection", () => {
  it("应当正确计算直线与椭圆相交、相切、相离", () => {
    // 椭圆 x^2/9 + y^2/4 = 1 (a=3, b=2)
    // 直线 y = 0 => 与椭圆相交于 (3,0) 和 (-3,0), 弦长 6
    const resSecant = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
    });
    expect(resSecant.status).toBe("secant");
    expect(resSecant.intersectionCount).toBe(2);
    expect(resSecant.chordLength).toBeCloseTo(6, 4);

    // 直线 y = 2 => 与椭圆相切于 (0, 2)
    const resTangent = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 2,
    });
    expect(resTangent.status).toBe("tangent");
    expect(resTangent.intersectionCount).toBe(1);
    expect(resTangent.intersections[0].x).toBeCloseTo(0, 4);
    expect(resTangent.intersections[0].y).toBeCloseTo(2, 4);

    // 直线 y = 3 => 与椭圆相离
    const resDisjoint = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 3,
    });
    expect(resDisjoint.status).toBe("disjoint");
    expect(resDisjoint.intersectionCount).toBe(0);
  });

  it("应当检测双曲线平行于渐近线的退化情况", () => {
    // 双曲线 x^2/9 - y^2/4 = 1 (a=3, b=2), 渐近线斜率 b/a = 2/3 ≈ 0.66667
    const resParallel = solveConicLineIntersection({
      conicType: "hyperbola",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 2 / 3,
      m: 1,
    });
    expect(resParallel.status).toBe("degenerated_parallel");
    expect(resParallel.intersectionCount).toBe(1);
  });

  it("应当正确计算抛物线焦点弦长", () => {
    // 抛物线 y^2 = 4x (p=2), 焦点 (1, 0)
    // 垂直焦点的弦（通径）：theta = PI/2 => |AB| = 2p = 4
    const resFocus = solveConicLineIntersection({
      conicType: "parabola",
      studyMode: "focus",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      theta: Math.PI / 2,
    });
    expect(resFocus.isFocusChord).toBe(true);
    expect(resFocus.chordLength).toBeCloseTo(4, 3);
  });

  it("应当正确计算椭圆点差法斜率积", () => {
    // 椭圆 x^2/9 + y^2/4 = 1 (a=3, b=2)
    // -b^2/a^2 = -4/9 ≈ -0.4444
    const resMid = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "midpoint",
      a: 3,
      b: 2,
      p: 2,
      k: 1,
      m: 0,
      midpointX: 1,
      midpointY: 1,
    });
    expect(resMid.pointDiffSlopeProduct).toBeCloseTo(-4 / 9, 3);
  });
});
