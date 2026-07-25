import { describe, it, expect } from "vitest";
import {
  calculateLinearRegression,
  calculateIndependenceTest,
} from "./pairedData";

describe("成对数据纯数学计算库单元测试", () => {
  it("应当正确求解线性回归方程与相关系数", () => {
    const points = [
      { id: "p1", x: 2, y: 3 },
      { id: "p2", x: 4, y: 5 },
      { id: "p3", x: 5, y: 6.5 },
      { id: "p4", x: 6, y: 7.5 },
      { id: "p5", x: 8, y: 9.5 },
    ];

    const result = calculateLinearRegression(points);

    expect(result.isValid).toBe(true);
    expect(result.n).toBe(5);
    expect(result.meanX).toBe(5);
    expect(result.meanY).toBe(6.3);

    // 验证斜率与截距
    expect(result.b).toBeCloseTo(1.1, 4);
    expect(result.a).toBeCloseTo(0.8, 4);

    // 验证相关系数 r > 0.99
    expect(result.r).toBeGreaterThan(0.99);

    // 验证回归直线必定经过样本中心点 (meanX, meanY)
    const yHatAtMeanX = result.b * result.meanX + result.a;
    expect(yHatAtMeanX).toBeCloseTo(result.meanY, 5);
  });

  it("应当正确处理退化线性回归数据（点在同一垂直线上）", () => {
    const points = [
      { id: "p1", x: 3, y: 2 },
      { id: "p2", x: 3, y: 5 },
    ];

    const result = calculateLinearRegression(points);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("无法拟合斜率");
  });

  it("应当正确计算 2x2 列联表的卡方统计量与显著性判断", () => {
    // 高考例题：a=85, b=15, c=40, d=60
    // n = 200, ad - bc = 85*60 - 15*40 = 5100 - 600 = 4500
    const res = calculateIndependenceTest(85, 15, 40, 60);

    expect(res.isValid).toBe(true);
    expect(res.n).toBe(200);

    // 卡方值求解
    // num = 200 * (4500)^2 = 200 * 20250000 = 4,050,000,000
    // den = (100) * (100) * (125) * (75) = 93,750,000
    // chi2 = 4050000000 / 93750000 = 43.2
    expect(res.chiSquare).toBeCloseTo(43.2, 1);

    // 43.2 > 10.828，应达到 99.9% 把握
    expect(res.p999).toBe(true);
    expect(res.confidenceText).toContain("99.9% 以上的把握");
  });

  it("应当在无关联数据时判断接受原假设", () => {
    const res = calculateIndependenceTest(50, 50, 50, 50);

    expect(res.isValid).toBe(true);
    expect(res.chiSquare).toBe(0);
    expect(res.p90).toBe(false);
    expect(res.confidenceText).toContain("接受无关联原假设");
  });
});
