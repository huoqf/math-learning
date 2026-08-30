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

  it("应当正确计算抛物线焦点弦长与通径", () => {
    // 抛物线标准方程 y^2 = 2px (取焦准距 p=2 => y^2 = 4x), 焦点坐标 (p/2, 0) = (1, 0)
    // 垂直于对称轴的焦点弦（即通径）：theta = PI/2 => 通径长度 |AB| = 2p = 4
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

  it("应当正确计算双曲线与抛物线点差法", () => {
    // 双曲线 x^2/9 - y^2/4 = 1 (a=3, b=2)
    // 中点 M(1, 2) (满足 x0^2/a^2 - y0^2/b^2 < 0 保证中点弦存在)
    // k_AB * k_OM = b^2/a^2 = 4/9 ≈ 0.4444
    const resHyp = solveConicLineIntersection({
      conicType: "hyperbola",
      studyMode: "midpoint",
      a: 3,
      b: 2,
      p: 2,
      k: 1,
      m: 0,
      midpointX: 1,
      midpointY: 2,
    });
    expect(resHyp.status).toBe("secant");
    expect(resHyp.pointDiffSlopeProduct).toBeCloseTo(4 / 9, 3);

    // 抛物线 y^2 = 2px (p=2) => k_AB * y0 = p => k_AB = p / y0
    // 取中点 M(1, 2) => k_AB = 2 / 2 = 1
    const resPara = solveConicLineIntersection({
      conicType: "parabola",
      studyMode: "midpoint",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      midpointX: 1,
      midpointY: 2,
    });
    expect(resPara.slopeAB).toBeCloseTo(1, 4);
    expect(resPara.midpoint?.y).toBeCloseTo(2, 4);
  });

  it("应当正确计算极点极线/切点弦模式 (polePolar)", () => {
    // 椭圆 x^2/16 + y^2/9 = 1 (a=4, b=3)
    // 外部极点 P(4, 3) 引切点弦: (4x)/16 + (3y)/9 = 1 => x/4 + y/3 = 1 => y = -3/4 x + 3
    const resPolar = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "polePolar",
      a: 4,
      b: 3,
      p: 2,
      k: 0,
      m: 0,
      poleX: 4,
      poleY: 3,
    });
    // k = -3/4 = -0.75, m = 3
    expect(resPolar.slopeAB).toBeCloseTo(-0.75, 4);
    expect(resPolar.status).toBe("secant");
    expect(resPolar.intersectionCount).toBe(2);
    // 两切点分别为 (4, 0) 和 (0, 3)
    const pts = resPolar.intersections;
    expect(
      pts.some((pt) => Math.abs(pt.x - 4) < 1e-3 && Math.abs(pt.y) < 1e-3),
    ).toBe(true);
    expect(
      pts.some((pt) => Math.abs(pt.x) < 1e-3 && Math.abs(pt.y - 3) < 1e-3),
    ).toBe(true);
  });
});
