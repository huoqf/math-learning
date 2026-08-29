import { describe, it, expect } from "vitest";
import {
  erf,
  normalPdf,
  skewNormalPdf,
  standardNormalCdf,
  normalCdf,
  calcIntervalProbability,
  generateHistogramBins,
  estimateHistogramStats,
  getThreeSigmaIntervals,
  calcSymmetricNormalIntervals,
} from "./probabilityNormal";

describe("probabilityNormal math module", () => {
  it("erf approximation accuracy", () => {
    expect(erf(0)).toBe(0);
    // erf(1) ≈ 0.84270079
    expect(erf(1)).toBeCloseTo(0.8427, 4);
    // erf(-x) = -erf(x)
    expect(erf(-1)).toBeCloseTo(-erf(1), 6);
  });

  it("standard normal pdf & cdf", () => {
    // phi(0) = 1 / sqrt(2*pi) ≈ 0.39894
    expect(normalPdf(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 5);
    // Phi(0) = 0.5
    expect(standardNormalCdf(0)).toBeCloseTo(0.5, 5);
    // Phi(1.96) ≈ 0.9750
    expect(standardNormalCdf(1.96)).toBeCloseTo(0.975, 3);
    // Phi(-1.96) ≈ 0.0250
    expect(standardNormalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });

  it("normal cdf and interval probability", () => {
    // X ~ N(100, 15^2)
    expect(normalCdf(100, 100, 15)).toBeCloseTo(0.5, 5);
    // P(85 <= X <= 115) = P(mu-sigma <= X <= mu+sigma) ≈ 0.6827
    const p1Sigma = calcIntervalProbability(100, 15, 85, 115);
    expect(p1Sigma).toBeCloseTo(0.6827, 3);

    // 逆序输入 [115, 85] 结果应一致
    expect(calcIntervalProbability(100, 15, 115, 85)).toBeCloseTo(p1Sigma, 5);

    // sigma <= 0 退化处理
    expect(normalPdf(0, 0, 0)).toBe(0);
    expect(normalCdf(1, 0, 0)).toBe(1);
    expect(normalCdf(-1, 0, 0)).toBe(0);
  });

  it("3-Sigma rule intervals", () => {
    const intervals = getThreeSigmaIntervals(80, 10);
    expect(intervals).toHaveLength(3);

    // [μ-σ, μ+σ] = [70, 90] => 68.27%
    expect(intervals[0].x1).toBe(70);
    expect(intervals[0].x2).toBe(90);
    expect(intervals[0].prob).toBeCloseTo(0.6827, 3);

    // [μ-2σ, μ+2σ] = [60, 100] => 95.45%
    expect(intervals[1].x1).toBe(60);
    expect(intervals[1].x2).toBe(100);
    expect(intervals[1].prob).toBeCloseTo(0.9545, 3);

    // [μ-3σ, μ+3σ] = [50, 110] => 99.73%
    expect(intervals[2].x1).toBe(50);
    expect(intervals[2].x2).toBe(110);
    expect(intervals[2].prob).toBeCloseTo(0.9973, 3);
  });

  it("symmetric normal intervals (Gaokao classic problem)", () => {
    // X ~ N(100, 10^2), x0 = 80 => 对称点 xSym = 200 - 80 = 120
    const sym = calcSymmetricNormalIntervals(100, 10, 80);
    expect(sym.xSym).toBe(120);
    expect(sym.leftX).toBe(80);
    expect(sym.rightX).toBe(120);
    // z = (80-100)/10 = -2
    expect(sym.zLeft).toBe(-2);
    expect(sym.zRight).toBe(2);
    // P(80 <= X <= 120) ≈ 0.9545
    expect(sym.centerProb).toBeCloseTo(0.9545, 3);
    // 尾部概率 P(X <= 80) = (1 - 0.9545) / 2 ≈ 0.02275
    expect(sym.tailProb).toBeCloseTo((1 - 0.9545) / 2, 3);
  });

  it("histogram bin generation and statistical estimates", () => {
    // 奇数分组：中心组中点恰好为 mu = 100
    const binsOdd = generateHistogramBins(100, 15, 11, 1000, 0);
    expect(binsOdd.length).toBe(11);

    const sumFreq = binsOdd.reduce((acc, b) => acc + b.frequency, 0);
    expect(sumFreq).toBeCloseTo(1.0, 5);

    const statsOdd = estimateHistogramStats(binsOdd, 50);
    expect(statsOdd.mean).toBeCloseTo(100, 0);
    expect(statsOdd.median).toBeCloseTo(100, 0);
    expect(statsOdd.mode).toBeCloseTo(100, 0);
    expect(statsOdd.q1).toBeLessThan(statsOdd.median);
    expect(statsOdd.q3).toBeGreaterThan(statsOdd.median);

    // 偶数分组：最高矩形在中点两侧，mode 偏差在半个组距内
    const binsEven = generateHistogramBins(100, 15, 10, 1000, 0);
    const statsEven = estimateHistogramStats(binsEven, 50);
    expect(Math.abs(statsEven.mode - 100)).toBeLessThanOrEqual(
      binsEven[0].width,
    );

    // 空数组边界防护
    const emptyStats = estimateHistogramStats([]);
    expect(emptyStats.mean).toBe(0);
    expect(emptyStats.median).toBe(0);
  });

  it("skew normal distribution", () => {
    // alpha = 0 时退化为标准正态
    const phiNormal = normalPdf(1, 0, 1);
    const phiSkew0 = skewNormalPdf(1, 0, 1, 0);
    expect(phiSkew0).toBeCloseTo(phiNormal, 5);

    // alpha > 0 (右偏) 时，正半轴概率密度大于负半轴
    const rightPos = skewNormalPdf(1, 0, 1, 2);
    const rightNeg = skewNormalPdf(-1, 0, 1, 2);
    expect(rightPos).toBeGreaterThan(rightNeg);
  });
});
