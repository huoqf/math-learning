import { describe, it, expect } from "vitest";
import {
  getLinePoint,
  getNonStandardLinePoint,
  calcLineConicIntersection,
} from "./lineParamT";

describe("直线参数方程 t 的几何意义与圆锥曲线割线定理 (lineParamT)", () => {
  it("getLinePoint: 准确计算标准参数方程下动点坐标", () => {
    // P0(1, 2), alpha = 60°, t = 4
    // x = 1 + 4 * cos(60°) = 1 + 2 = 3
    // y = 2 + 4 * sin(60°) = 2 + 2*sqrt(3) ≈ 5.4641
    const pt = getLinePoint(1, 2, 60, 4);
    expect(pt.x).toBeCloseTo(3, 4);
    expect(pt.y).toBeCloseTo(2 + 2 * Math.sqrt(3), 4);
  });

  it("getNonStandardLinePoint: 准确计算非标准参数方程动点坐标", () => {
    const pt = getNonStandardLinePoint(1, 1, 45, 2, Math.SQRT2);
    // x = 1 + sqrt(2) * 2 * cos(45°) = 1 + 2 = 3
    expect(pt.x).toBeCloseTo(3, 4);
    expect(pt.y).toBeCloseTo(3, 4);
  });

  it("直线与圆: 割线定理 / 圆的方幂 |PA|*|PB| = |t1*t2| = d^2 - R^2", () => {
    // 圆 x^2 + y^2 = 9 (R=3), 定点 P(5, 0), 沿 x 轴方向 alpha = 180° (指向圆心)
    // 直线: x = 5 - t, y = 0
    // (5 - t)^2 = 9 => 5 - t = 3 or -3 => t1 = 2, t2 = 8
    const res = calcLineConicIntersection(5, 0, 180, "circle", { R: 3 });
    expect(res.hasIntersection).toBe(true);
    expect(res.t1).toBeCloseTo(2, 4);
    expect(res.t2).toBeCloseTo(8, 4);
    expect(res.chordLength).toBeCloseTo(6, 4); // 2R = 6
    expect(res.segmentProduct).toBeCloseTo(16, 4); // d^2 - R^2 = 25 - 9 = 16
    expect(res.tM).toBeCloseTo(5, 4);
    expect(res.pointM?.x).toBeCloseTo(0, 4); // 弦中点即圆心 (0, 0)
    expect(res.pointM?.y).toBeCloseTo(0, 4);
  });

  it("直线与椭圆: 韦达定理与中点参数 tM = (t1 + t2)/2", () => {
    // 椭圆 x^2/16 + y^2/4 = 1 (a=4, b=2), 定点 P(0, 0), alpha = 0° (x 轴)
    // t1 = -4, t2 = 4
    const res = calcLineConicIntersection(0, 0, 0, "ellipse", { a: 4, b: 2 });
    expect(res.hasIntersection).toBe(true);
    expect(res.t1).toBeCloseTo(-4, 4);
    expect(res.t2).toBeCloseTo(4, 4);
    expect(res.chordLength).toBeCloseTo(8, 4);
    expect(res.tSum).toBeCloseTo(0, 4);
    expect(res.tM).toBeCloseTo(0, 4);
    expect(res.pointA?.x).toBeCloseTo(-4, 4);
    expect(res.pointB?.x).toBeCloseTo(4, 4);
  });

  it("直线与双曲线: 渐近线方向退化为一元一次方程", () => {
    // 双曲线 x^2/4 - y^2/4 = 1 (等轴双曲线 a=2, b=2, 渐近线斜率 k = 1 => alpha = 45°)
    // 穿过定点 P(0, 0) 且平行于渐近线
    const res = calcLineConicIntersection(0, 0, 45, "hyperbola", {
      a: 2,
      b: 2,
    });
    // A = cos^2(45)/4 - sin^2(45)/4 = 0 => isDegenerateLine = true
    expect(res.isDegenerateLine).toBe(true);
    expect(res.hasIntersection).toBe(false);
  });

  it("直线与抛物线: 焦点弦倒数和性质 |1/t1 + 1/t2|", () => {
    // 抛物线 y^2 = 2px (p=2 => y^2 = 4x, 焦点 F(1, 0))
    // 直线过焦点 F(1, 0), 倾斜角 alpha = 60°
    // 直线参数方程: x = 1 + t cos(60°) = 1 + t/2, y = t sin(60°) = t * sqrt(3)/2
    // 代入抛物线: 3/4 t^2 = 4 (1 + t/2) = 4 + 2t => 3/4 t^2 - 2t - 4 = 0
    // 3t^2 - 8t - 16 = 0 => (3t + 4)(t - 4) = 0 => t1 = -4/3, t2 = 4
    const res = calcLineConicIntersection(1, 0, 60, "parabola", { p: 2 });
    expect(res.hasIntersection).toBe(true);
    expect(res.t1).toBeCloseTo(-4 / 3, 3);
    expect(res.t2).toBeCloseTo(4, 3);
    expect(res.chordLength).toBeCloseTo(4 - -4 / 3, 3); // 16/3
    // 倒数和 |1/t1 + 1/t2| = |-3/4 + 1/4| = |-2/4| = 0.5 = 1/p = 1/2
    expect(res.reciprocalSum).toBeCloseTo(0.5, 3);
  });
});
