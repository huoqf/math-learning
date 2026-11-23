import { describe, expect, it } from "vitest";
import {
  calcLinearTransformStats,
  calcOutlierSensitivity,
  calcSampleStats,
  calcSamplingComparison,
} from "../statSamplingFeatures";

describe("statSamplingFeatures 纯数学计算", () => {
  it("五数概括与方差标准差计算精准", () => {
    const stats = calcSampleStats([2, 4, 6, 8, 10, 12, 14, 16]);
    expect(stats.mean).toBeCloseTo(9, 6);
    expect(stats.median).toBeCloseTo(9, 6);
    expect(stats.q1).toBeCloseTo(5, 6);
    expect(stats.q3).toBeCloseTo(13, 6);
    expect(stats.variance).toBeCloseTo(21, 6);
  });

  it("分层抽样总分配名额严格等于 sampleN", () => {
    const res = calcSamplingComparison(120, 180, 300, 30);
    expect(res.validity).toBe("ok");
    expect(res.totalN).toBe(600);
    expect(res.samplingFraction).toBeCloseTo(0.05, 6);
    expect(res.strata.map((s) => s.allocated)).toEqual([6, 9, 15]);
  });

  it("线性变换 y=ax+b 满足均值 a*xbar+b 与方差 a^2*s^2", () => {
    const res = calcLinearTransformStats([3, 5, 6, 7, 9], -2, 10);
    expect(res.transformed.mean).toBeCloseTo(res.meanFormulaCheck, 6);
    expect(res.transformed.variance).toBeCloseTo(res.varFormulaCheck, 6);
    expect(res.transformed.stdDev).toBeCloseTo(res.stdFormulaCheck, 6);
  });

  it("加入原均值新样本：新均值不变而新方差严格减小", () => {
    const res = calcOutlierSensitivity([4, 6, 8, 10, 12], 12, true);
    expect(res.deltaMean).toBeCloseTo(0, 6);
    expect(res.deltaVariance).toBeLessThan(0);
    expect(res.perturbed.n).toBe(6);
  });
});
