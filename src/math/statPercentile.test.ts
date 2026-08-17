import { describe, it, expect } from "vitest";
import {
  generateHistogramBins,
  calculateHistogramStats,
  calculateStratifiedSampling,
  calculatePercentileShadeBins,
} from "./statPercentile";

describe("statPercentile math module", () => {
  it("generateHistogramBins should generate normalized bins summing to 1", () => {
    const bins = generateHistogramBins(0);
    expect(bins).toHaveLength(5);
    const sumFreq = bins.reduce((acc, b) => acc + b.frequency, 0);
    expect(sumFreq).toBeCloseTo(1, 6);

    bins.forEach((b) => {
      expect(b.height).toBeCloseTo(b.frequency / b.width, 6);
      expect(b.midpoint).toBeCloseTo((b.xMin + b.xMax) / 2, 6);
    });
  });

  it("calculateHistogramStats should calculate correct mean, mode, and percentiles", () => {
    const bins = generateHistogramBins(0);
    const stats = calculateHistogramStats(bins, 50);

    // 均值应为各组组中值乘频率之和
    const expectedMean = bins.reduce(
      (sum, b) => sum + b.midpoint * b.frequency,
      0,
    );
    expect(stats.mean).toBeCloseTo(expectedMean, 6);

    // 中位数应落在 [50, 100] 范围内
    expect(stats.median).toBeGreaterThanOrEqual(50);
    expect(stats.median).toBeLessThanOrEqual(100);

    // 50% 百分位对应中位数
    expect(stats.percentileVal).toBeCloseTo(stats.median, 6);

    // Q1 < Median < Q3
    expect(stats.q1).toBeLessThanOrEqual(stats.median);
    expect(stats.median).toBeLessThanOrEqual(stats.q3);
    expect(stats.iqr).toBeCloseTo(stats.q3 - stats.q1, 6);
  });

  it("calculateStratifiedSampling should correctly decompose total variance", () => {
    const result = calculateStratifiedSampling(
      100, // sampleN
      300, // N1
      500, // N2
      200, // N3
      70, // mean1
      80, // mean2
      90, // mean3
      20, // var1
      30, // var2
      25, // var3
    );

    // 总人数
    expect(result.totalN).toBe(1000);
    // 各层权重之和为 1
    const sumWeights = result.strataWeights.reduce((a, b) => a + b, 0);
    expect(sumWeights).toBeCloseTo(1, 6);

    // 各层抽样数之和为 sampleN
    const sumSampleN = result.strataSampleN.reduce((a, b) => a + b, 0);
    expect(sumSampleN).toBe(100);

    // 总均值 x̄ = 0.3*70 + 0.5*80 + 0.2*90 = 21 + 40 + 18 = 79
    expect(result.totalMean).toBeCloseTo(79, 6);

    // 组内方差加权和: 0.3*20 + 0.5*30 + 0.2*25 = 6 + 15 + 5 = 26
    const withinVar =
      result.strataWeights[0] * result.strataVars[0] +
      result.strataWeights[1] * result.strataVars[1] +
      result.strataWeights[2] * result.strataVars[2];
    expect(withinVar).toBeCloseTo(26, 6);

    // 组间方差加权和: 0.3*(70-79)^2 + 0.5*(80-79)^2 + 0.2*(90-79)^2 = 0.3*81 + 0.5*1 + 0.2*121 = 24.3 + 0.5 + 24.2 = 49
    const betweenVar =
      result.strataWeights[0] * Math.pow(70 - 79, 2) +
      result.strataWeights[1] * Math.pow(80 - 79, 2) +
      result.strataWeights[2] * Math.pow(90 - 79, 2);
    expect(betweenVar).toBeCloseTo(49, 6);

    // 总方差 = 组内方差 + 组间方差 = 26 + 49 = 75
    expect(result.totalVar).toBeCloseTo(75, 6);
    expect(result.totalStd).toBeCloseTo(Math.sqrt(75), 6);
  });

  it("calculatePercentileShadeBins should correctly slice histogram bins up to percentile", () => {
    const bins = generateHistogramBins(0);
    const targetX = 75;
    const shadeBins = calculatePercentileShadeBins(bins, targetX);

    expect(shadeBins).toHaveLength(5);
    // 第一组 [50, 60] 和第二组 [60, 70] 应该完全填满
    expect(shadeBins[0].fraction).toBe(1);
    expect(shadeBins[1].fraction).toBe(1);
    // 第三组 [70, 80] 部分填满 ((75-70)/10 = 0.5)
    expect(shadeBins[2].fraction).toBeCloseTo(0.5, 6);
    // 第四、五组没有填充
    expect(shadeBins[3].fraction).toBe(0);
    expect(shadeBins[4].fraction).toBe(0);
  });
});
