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

  it("双曲线离心率与渐近线夹角公式 cos(α/2) = 1/e 验证", () => {
    // 等轴双曲线: a = b => e = sqrt(2), 渐近线垂直 α = 90°, cos(45°) = 1/sqrt(2) = 1/e
    const resEquilateral = calculateConicProperties("hyperbola", 3, 3, 0);
    const cosHalfAlpha1 = 1 / resEquilateral.e;
    expect(cosHalfAlpha1).toBeCloseTo(Math.SQRT1_2, 4);

    // 广角双曲线: b/a = sqrt(3) => e = 2, 渐近线夹角 120°, cos(60°) = 0.5 = 1/e
    const resWide = calculateConicProperties(
      "hyperbola",
      2,
      2 * Math.sqrt(3),
      0,
    );
    const cosHalfAlpha2 = 1 / resWide.e;
    expect(cosHalfAlpha2).toBeCloseTo(0.5, 4);
  });

  it("椭圆短轴端点处顶角最大值及直角焦点三角形充要条件 e >= sqrt(2)/2", () => {
    // 临界情况: e = sqrt(2)/2, 则 c = b, tan(θ_max / 2) = c / b = 1, θ_max = 90°
    const a = 2;
    const b = Math.SQRT2; // c = sqrt(4 - 2) = sqrt(2) = b
    const resCritical = calculateConicProperties("ellipse", a, b, Math.PI / 2);
    expect(resCritical.focusTriangle.maxAngleRad).toBeCloseTo(Math.PI / 2, 4);

    // e < sqrt(2)/2 时，最大顶角小于 90°
    const resAcute = calculateConicProperties("ellipse", 5, 4, Math.PI / 2); // c=3, e=0.6 < 0.707
    expect(resAcute.focusTriangle.maxAngleRad).toBeLessThan(Math.PI / 2);
  });

  it("双曲线 t 有效域被钳制在 (-1.35, 1.35)：越域输入不得再改变动点位置", () => {
    // 参数方程 x = a·sec t, y = b·tan t 在 |t| → π/2 处发散，
    // 故左屏 t 滑块量程必须与 math 层钳制域一致，否则轨道两端空转。
    const atBound = calculateConicProperties("hyperbola", 3, 2, 1.35);
    const beyond = calculateConicProperties("hyperbola", 3, 2, 2.5);
    const wayBeyond = calculateConicProperties("hyperbola", 3, 2, -3.0);

    expect(beyond.pointP.x).toBeCloseTo(atBound.pointP.x, 10);
    expect(beyond.pointP.y).toBeCloseTo(atBound.pointP.y, 10);
    // 负向越域对称钳制：sec 为偶函数，tan 为奇函数
    expect(wayBeyond.pointP.x).toBeCloseTo(atBound.pointP.x, 10);
    expect(wayBeyond.pointP.y).toBeCloseTo(-atBound.pointP.y, 10);

    // 域内取值必须真实生效（防止钳制过度把整条轨道压死）
    const inside = calculateConicProperties("hyperbola", 3, 2, 0.9);
    expect(inside.pointP.y).not.toBeCloseTo(atBound.pointP.y, 3);
  });
});
