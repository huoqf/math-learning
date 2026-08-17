import { describe, it, expect } from "vitest";
import {
  calculateLinearRegression,
  calculateIndependenceTest,
  fitAllRegressionModels,
} from "./pairedData";

describe("成对数据纯数学计算库单元测试", () => {
  it("应当正确求解线性回归方程、中间统计量与相关系数", () => {
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

    // 验证高考大题关键中间量
    expect(result.sumX).toBe(25);
    expect(result.sumY).toBe(31.5);
    expect(result.sumXX).toBe(145);
    expect(result.lxx).toBe(20);

    // 验证斜率与截距
    expect(result.b).toBeCloseTo(1.1, 4);
    expect(result.a).toBeCloseTo(0.8, 4);

    // 验证相关系数 r > 0.99
    expect(result.r).toBeGreaterThan(0.99);

    // 验证回归直线必定经过样本中心点 (meanX, meanY)
    const yHatAtMeanX = result.b * result.meanX + result.a;
    expect(yHatAtMeanX).toBeCloseTo(result.meanY, 5);
  });

  it("应当正确拟合非线性回归模型并选出最优模型", () => {
    // 构造指数增长数据: y ≈ 2 * e^(0.5x)
    const expPoints = [
      { id: "p1", x: 1, y: 3.3 },
      { id: "p2", x: 2, y: 5.4 },
      { id: "p3", x: 3, y: 9.0 },
      { id: "p4", x: 4, y: 14.8 },
      { id: "p5", x: 5, y: 24.4 },
    ];

    const fits = fitAllRegressionModels(expPoints);
    expect(fits.length).toBeGreaterThan(0);

    const expFit = fits.find((f) => f.type === "exponential");
    expect(expFit).toBeDefined();
    expect(expFit?.isValid).toBe(true);
    expect(expFit?.rSquare).toBeGreaterThan(0.99);
    expect(expFit?.isBest).toBe(true);
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
    const res = calculateIndependenceTest(85, 15, 40, 60);

    expect(res.isValid).toBe(true);
    expect(res.n).toBe(200);
    expect(res.row1).toBe(100);
    expect(res.row2).toBe(100);
    expect(res.col1).toBe(125);
    expect(res.col2).toBe(75);

    // 验证期望频数 E_ij
    expect(res.expected.eA).toBeCloseTo(62.5, 2);
    expect(res.expected.eB).toBeCloseTo(37.5, 2);
    expect(res.expected.eC).toBeCloseTo(62.5, 2);
    expect(res.expected.eD).toBeCloseTo(37.5, 2);

    // 验证 sum (O-E)^2 / E 等于卡方统计量
    const sumContrib =
      res.contributions.dA +
      res.contributions.dB +
      res.contributions.dC +
      res.contributions.dD;
    expect(sumContrib).toBeCloseTo(res.chiSquare, 4);

    expect(res.chiSquare).toBeCloseTo(43.2, 1);
    expect(res.chiSquareYates).toBeLessThan(res.chiSquare);
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
