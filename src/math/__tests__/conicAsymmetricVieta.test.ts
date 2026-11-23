import { describe, expect, it } from "vitest";
import {
  calcAsymVieta,
  calcHiddenCircle,
  calcSymmetryShortest,
} from "../conicAsymmetricVieta";

describe("conicAsymmetricVieta 纯数学计算", () => {
  it("非对称韦达定直线：无论斜率倒数 m 如何变化，PA 与 QB 交点横坐标恒为 a^2 / x0", () => {
    const res1 = calcAsymVieta(3, 2, 2, 0.5);
    const res2 = calcAsymVieta(3, 2, 2, -1.2);
    expect(res1.validity).toBe("ok");
    expect(res1.ptT.x).toBeCloseTo(4.5, 6);
    expect(res2.ptT.x).toBeCloseTo(4.5, 6);

    // 验证 T 也满足直线 QB 方程: (yT - 0)/(xT - a) == (y2 - 0)/(x2 - a)
    const slopeQB = res1.ptB.y / (res1.ptB.x - res1.ptQ.x);
    const slopeQT = res1.ptT.y / (res1.ptT.x - res1.ptQ.x);
    expect(slopeQT).toBeCloseTo(slopeQB, 6);
  });

  it("隐圆三大构型：直径圆点积恒为0，定角圆张角恒定，平方和恒定", () => {
    const diam = calcHiddenCircle("diameter", 2, 0, 50);
    expect(diam.measureValue).toBeCloseTo(0, 6);

    const ang = calcHiddenCircle("fixedAngle", 2, 60, 45);
    expect(ang.measureValue).toBeCloseTo(60, 4);

    // 钝角边界（120°）叠加方位角极小值 20° / 极大值 160° 时仍必须被钳制在上方同侧圆弧，测得张角恒为 120°
    const obtuseLow = calcHiddenCircle("fixedAngle", 2, 120, 20);
    expect(obtuseLow.ptP.y).toBeGreaterThan(0);
    expect(obtuseLow.measureValue).toBeCloseTo(120, 4);

    const obtuseHigh = calcHiddenCircle("fixedAngle", 2, 120, 160);
    expect(obtuseHigh.ptP.y).toBeGreaterThan(0);
    expect(obtuseHigh.measureValue).toBeCloseTo(120, 4);

    const sq = calcHiddenCircle("distSumSq", 2, 16, 120);
    expect(sq.measureValue).toBeCloseTo(16, 6);
  });

  it("将军饮马同侧镜像与异侧直连均严格满足折线长不小于理论下界", () => {
    const optCheck = calcSymmetryShortest(0.2, -0.5, 0);
    expect(optCheck.isSameSide).toBe(true);
    const atOpt = calcSymmetryShortest(0.2, -0.5, optCheck.ptOptP.x);
    expect(atOpt.currentSum).toBeCloseTo(atOpt.minSum, 5);
    expect(optCheck.currentSum).toBeGreaterThanOrEqual(optCheck.minSum - 1e-6);

    // 异侧反例：k = 0.6, b = 0.5 时 A(-2.5, 2.2) 在直线之上，B(2.5, 1.8) 在直线之下
    const opposite = calcSymmetryShortest(0.6, 0.5, 0.5);
    expect(opposite.isSameSide).toBe(false);
    expect(opposite.minSum).toBeCloseTo(Math.hypot(5, -0.4), 5);
    for (const px of [-3.5, -1, 0, 1.5, 3.5]) {
      const sample = calcSymmetryShortest(0.6, 0.5, px);
      expect(sample.currentSum).toBeGreaterThanOrEqual(sample.minSum - 1e-6);
    }
    const atOppositeOpt = calcSymmetryShortest(0.6, 0.5, opposite.ptOptP.x);
    expect(atOppositeOpt.currentSum).toBeCloseTo(atOppositeOpt.minSum, 5);
  });
});
