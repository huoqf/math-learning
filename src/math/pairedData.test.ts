import { describe, it, expect } from "vitest";
import {
  calculateLinearRegression,
  calculateIndependenceTest,
  fitAllRegressionModels,
  getChiSquare1Pdf,
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

    // 验证高考大题关键中间量（含 lxy：最小二乘法核心分子）
    expect(result.sumX).toBe(25);
    expect(result.sumY).toBe(31.5);
    expect(result.sumXX).toBe(145);
    expect(result.lxx).toBe(20);
    // lxy = Σ(xi-x̄)(yi-ȳ) = 22，是高考大题计算 b̂ = lxy/lxx 的核心中间量
    expect(result.lxy).toBeCloseTo(22, 5);

    // 验证斜率与截距：b̂ = lxy/lxx = 22/20 = 1.1，â = ȳ - b̂·x̄ = 6.3 - 1.1×5 = 0.8
    expect(result.b).toBeCloseTo(1.1, 4);
    expect(result.a).toBeCloseTo(0.8, 4);

    // 验证相关系数 r > 0.99（强正相关，与斜率 b̂>0 同号）
    expect(result.r).toBeGreaterThan(0.99);
    expect(result.r).toBeGreaterThan(0); // r 与 b̂ 同号

    // 验证回归直线必定经过样本中心点 (meanX, meanY)
    const yHatAtMeanX = result.b * result.meanX + result.a;
    expect(yHatAtMeanX).toBeCloseTo(result.meanY, 5);

    // 验证决定系数 R² = 1 - SSE/SST，强相关时应接近1
    expect(result.rSquare).toBeGreaterThan(0.99);
    expect(result.rSquare).toBeCloseTo(0.9959, 3);
  });

  it("应当正确处理负相关数据集，验证 r 与 b̂ 同号（高考铁律）", () => {
    // 气温与用电量：气温升高用电量下降 → 负相关
    const points = [
      { id: "p1", x: 10, y: 22 },
      { id: "p2", x: 15, y: 18 },
      { id: "p3", x: 20, y: 15 },
      { id: "p4", x: 25, y: 12 },
      { id: "p5", x: 30, y: 9 },
    ];

    const result = calculateLinearRegression(points);

    expect(result.isValid).toBe(true);
    expect(result.meanX).toBe(20);
    expect(result.meanY).toBeCloseTo(15.2, 5);

    // lxx = 250，lxy = -160（负值表明负相关）
    expect(result.lxx).toBeCloseTo(250, 4);
    expect(result.lxy).toBeCloseTo(-160, 4);

    // 斜率 b̂ = -160/250 = -0.64（负值）
    expect(result.b).toBeCloseTo(-0.64, 4);

    // 高考铁律：r 与 b̂ 同号，负相关时 r < 0 且 b̂ < 0
    expect(result.r).toBeLessThan(0);
    expect(result.b).toBeLessThan(0);
    expect(Math.sign(result.r)).toBe(Math.sign(result.b));

    // 强负相关：|r| > 0.99
    expect(Math.abs(result.r)).toBeGreaterThan(0.99);
    expect(result.r).toBeCloseTo(-0.9981, 3);
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
    // 参数接近真值 c≈2，k≈0.5
    expect(expFit?.params.c).toBeCloseTo(2, 0);
    expect(expFit?.params.k).toBeCloseTo(0.5, 1);
    // 指数模型在此数据集上应为最优模型（R² 最高）
    expect(expFit?.isBest).toBe(true);

    // 预测值合理性检验：predict(3) ≈ 2*e^1.5 ≈ 8.96
    expect(expFit?.predict(3)).toBeCloseTo(2 * Math.exp(1.5), 0);
  });

  it("应当正确处理退化线性回归数据（点在同一垂直线上，lxx=0）", () => {
    const points = [
      { id: "p1", x: 3, y: 2 },
      { id: "p2", x: 3, y: 5 },
    ];

    const result = calculateLinearRegression(points);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("无法拟合斜率");
  });

  it("应当在样本容量不足（n=1）时返回 isValid=false", () => {
    const result = calculateLinearRegression([{ id: "p1", x: 1, y: 2 }]);
    expect(result.isValid).toBe(false);
    expect(result.n).toBe(1);
    expect(result.message).toContain("至少需要2个");
  });

  it("应当正确计算 2×2 列联表的卡方统计量与显著性判断", () => {
    // 经典高考场景：药物疗效对照 (85,15,40,60)，n=200
    const res = calculateIndependenceTest(85, 15, 40, 60);

    expect(res.isValid).toBe(true);
    expect(res.n).toBe(200);
    expect(res.row1).toBe(100);
    expect(res.row2).toBe(100);
    expect(res.col1).toBe(125);
    expect(res.col2).toBe(75);

    // 验证期望频数 E_ij = 行合计×列合计/n
    expect(res.expected.eA).toBeCloseTo(62.5, 2);
    expect(res.expected.eB).toBeCloseTo(37.5, 2);
    expect(res.expected.eC).toBeCloseTo(62.5, 2);
    expect(res.expected.eD).toBeCloseTo(37.5, 2);

    // 验证 Σ(O-E)²/E 与快捷公式 n(ad-bc)²/... 精确相等（两种写法等价性）
    const sumContrib =
      res.contributions.dA +
      res.contributions.dB +
      res.contributions.dC +
      res.contributions.dD;
    expect(sumContrib).toBeCloseTo(res.chiSquare, 4);

    // χ² = 200*(85×60-15×40)²/(100×100×125×75) = 200*4500²/93750000 = 43.2
    expect(res.chiSquare).toBeCloseTo(43.2, 4);

    // Yates 连续性修正：n*(|ad-bc|-n/2)² / ... = 200*(4500-100)²/93750000 ≈ 41.30133...
    expect(res.chiSquareYates).toBeCloseTo(41.301, 3);
    expect(res.chiSquareYates).toBeLessThan(res.chiSquare);

    // 期望频数均≥5，样本量≥40，无需修正
    expect(res.isExpectedEnough).toBe(true);
    expect(res.isSampleLargeEnough).toBe(true);

    // 显著性层级：超过所有临界值 (43.2 >= 10.828)
    expect(res.p90).toBe(true);
    expect(res.p95).toBe(true);
    expect(res.p99).toBe(true);
    expect(res.p999).toBe(true);
    expect(res.confidenceText).toContain("99.9% 以上的把握");
  });

  it("应当正确判断只达 95% 置信水平（α=0.05）的中间分档场景", () => {
    // (30,20,20,30)：n=100, ad-bc=500, chi2 = 100*500² / (50*50*50*50) = 4.0
    // 3.841 <= 4.0 < 6.635 -> 达到 95% 但未达 99%
    const res = calculateIndependenceTest(30, 20, 20, 30);

    expect(res.isValid).toBe(true);
    expect(res.chiSquare).toBeCloseTo(4.0, 4);
    expect(res.p90).toBe(true);
    expect(res.p95).toBe(true);
    expect(res.p99).toBe(false);
    expect(res.p999).toBe(false);
    expect(res.confidenceText).toContain("95% 以上的把握");
  });

  it("应当在无关联数据时（ad=bc）χ²=0，接受原假设", () => {
    // (50,50,50,50)：ad-bc=50×50-50×50=0，完全独立
    const res = calculateIndependenceTest(50, 50, 50, 50);

    expect(res.isValid).toBe(true);
    expect(res.chiSquare).toBe(0);
    expect(res.chiSquareYates).toBe(0);
    expect(res.p90).toBe(false);
    expect(res.p95).toBe(false);
    expect(res.p99).toBe(false);
    expect(res.p999).toBe(false);
    expect(res.confidenceText).toContain("接受无关联原假设");
  });

  it("应当在期望频数不足（E_ij < 5）且存在关联时正确计算并提示使用 Yates 修正", () => {
    // 真实关联小样本 (4, 1, 1, 14)：n=20, row1=5, row2=15, col1=5, col2=15
    // eA = 5*5/20 = 1.25 < 5, eB=3.75 < 5, eC=3.75 < 5, eD=11.25
    // ad-bc = 56-1 = 55
    // chi2 = 20*55² / (5*15*5*15) = 60500 / 5625 ≈ 10.7556
    // Yates: 20*(55-10)² / 5625 = 20*2025 / 5625 = 7.2000
    const res = calculateIndependenceTest(4, 1, 1, 14);

    expect(res.isValid).toBe(true);
    expect(res.n).toBe(20);
    expect(res.isSampleLargeEnough).toBe(false); // n=20 < 40
    expect(res.isExpectedEnough).toBe(false); // 存在 E < 5
    expect(res.expected.eA).toBeCloseTo(1.25, 2);
    expect(res.chiSquare).toBeCloseTo(10.756, 3);
    expect(res.chiSquareYates).toBeCloseTo(7.2, 3);
  });

  it("应当正确处理边际为0的退化列联表，返回 isValid=false", () => {
    // a=10,b=0,c=0,d=0：col2=b+d=0，列边际为0，无法计算卡方
    const res = calculateIndependenceTest(10, 0, 0, 0);
    expect(res.isValid).toBe(false);
    expect(res.confidenceText).toContain("边际分布为0");
  });

  it("应当拦截非法负数输入，返回 isValid=false", () => {
    const res = calculateIndependenceTest(-5, 10, 10, 10);
    expect(res.isValid).toBe(false);
  });

  it("应当正确计算单自由度卡方分布的概率密度函数 getChiSquare1Pdf", () => {
    // x <= 0.01 时截断平滑值为 2.5
    expect(getChiSquare1Pdf(0)).toBe(2.5);
    expect(getChiSquare1Pdf(0.005)).toBe(2.5);

    // x = 1 时，f(1) = (1 / sqrt(2*pi)) * 1^(-0.5) * e^(-0.5) = 1 / sqrt(2*pi*e) ≈ 0.24197
    const expectedAt1 = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5);
    expect(getChiSquare1Pdf(1)).toBeCloseTo(expectedAt1, 4);

    // x = 2 时，f(2) = (1 / sqrt(2*pi)) * (1/sqrt(2)) * e^(-1) = 1 / (2 * sqrt(pi) * e) ≈ 0.10378
    const expectedAt2 =
      (1 / Math.sqrt(2 * Math.PI)) * Math.pow(2, -0.5) * Math.exp(-1);
    expect(getChiSquare1Pdf(2)).toBeCloseTo(expectedAt2, 4);
  });
});
