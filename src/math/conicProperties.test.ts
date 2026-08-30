import { describe, it, expect } from "vitest";
import {
  calculateConicProperties,
  deriveBFromEccentricity,
} from "../features/conicProperties/math/conicProperties";

describe("椭圆与双曲线纯解算逻辑测试 (calculateConicProperties)", () => {
  it("椭圆基础解算: a=3, b=2 时，c = sqrt(5) ≈ 2.236，e ≈ 0.745", () => {
    const res = calculateConicProperties("ellipse", 3, 2, Math.PI / 4);
    expect(res.c).toBeCloseTo(Math.sqrt(5), 3);
    expect(res.e).toBeCloseTo(Math.sqrt(5) / 3, 3);
    expect(res.directrices.rightX).toBeCloseTo(9 / Math.sqrt(5), 3);
    expect(res.latusRectum.length).toBeCloseTo((2 * 4) / 3, 3);
  });

  it("双曲线基础解算: a=3, b=4 时，c = 5，e = 5/3 = 1.667，渐近线斜率 = 4/3", () => {
    const res = calculateConicProperties("hyperbola", 3, 4, 0);
    expect(res.c).toBeCloseTo(5, 4);
    expect(res.e).toBeCloseTo(5 / 3, 3);
    expect(res.asymptotes?.slope).toBeCloseTo(4 / 3, 3);
  });

  it("椭圆焦点三角形面积验证: S_geom 与 S_theo 相相等", () => {
    const res = calculateConicProperties("ellipse", 4, 3, Math.PI / 3);
    expect(res.focusTriangle.areaGeom).toBeGreaterThan(0);
    expect(res.focusTriangle.areaGeom).toBeCloseTo(
      res.focusTriangle.areaTheoretical,
      2,
    );
  });

  it("离心率反推 b 测试", () => {
    // 椭圆: a=5, e=0.6 => b = 5 * sqrt(1 - 0.36) = 4
    const bEllipse = deriveBFromEccentricity("ellipse", 5, 0.6);
    expect(bEllipse).toBeCloseTo(4, 3);

    // 双曲线: a=3, e=sqrt(2) (等轴双曲线) => b = 3
    const bHyperbola = deriveBFromEccentricity("hyperbola", 3, Math.SQRT2);
    expect(bHyperbola).toBeCloseTo(3, 3);
  });

  it("椭圆焦点三角形内切圆切点与内心横坐标 x_T = x_I = e * x_P", () => {
    const a = 5;
    const b = 4;
    const t = Math.PI / 3; // P(a cos t, b sin t) = (2.5, 4 * sqrt(3)/2)
    const res = calculateConicProperties("ellipse", a, b, t);
    const expectedX = res.e * res.pointP.x; // e * xP = (3/5) * 2.5 = 1.5

    // 切点横坐标与内心横坐标必须相等且恒等于 e * xP
    expect(res.focusTriangle.incircle.tangentBase.x).toBeCloseTo(expectedX, 4);
    expect(res.focusTriangle.incircle.incenter.x).toBeCloseTo(expectedX, 4);
    expect(res.focusTriangle.incircle.tangentBase.y).toBe(0);

    // 内切圆面积公式验证 S = r * p_half
    const pHalf = (res.focusTriangle.r1 + res.focusTriangle.r2 + 2 * res.c) / 2;
    expect(res.focusTriangle.incircle.inradius * pHalf).toBeCloseTo(
      res.focusTriangle.areaGeom,
      4,
    );
  });

  it("双曲线焦点三角形内切圆切点恒为实轴右顶点 (a, 0)", () => {
    const a = 3;
    const b = 4;
    const t = 0.5; // 右支动点 P
    const res = calculateConicProperties("hyperbola", a, b, t);

    // 双曲线焦点三角形内切圆与 x 轴切点横坐标恒等于 a = 3
    expect(res.focusTriangle.incircle.tangentBase.x).toBeCloseTo(a, 4);
    expect(res.focusTriangle.incircle.incenter.x).toBeCloseTo(a, 4);
  });
});
