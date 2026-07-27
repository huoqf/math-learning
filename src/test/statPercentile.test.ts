import { describe, it, expect } from "vitest";
import {
  generateHistogramBins,
  calculatePercentile,
  calculateHistogramStats,
  calculateStratifiedSampling,
} from "@/math/statPercentile";

describe("statPercentile math module", () => {
  it("should generate normalized histogram bins summing to 1 frequency", () => {
    const bins = generateHistogramBins(0);
    expect(bins).toHaveLength(5);

    const totalFreq = bins.reduce((acc, bin) => acc + bin.frequency, 0);
    expect(totalFreq).toBeCloseTo(1.0, 5);

    // Height should equal frequency / width (width = 10)
    bins.forEach((bin) => {
      expect(bin.height).toBeCloseTo(bin.frequency / 10, 5);
    });
  });

  it("should calculate percentile with linear interpolation", () => {
    const bins = generateHistogramBins(0);
    const p50 = calculatePercentile(bins, 50);

    // 50% percentile (median) should fall within the bins [50, 100]
    expect(p50.value).toBeGreaterThanOrEqual(50);
    expect(p50.value).toBeLessThanOrEqual(100);

    const p25 = calculatePercentile(bins, 25);
    const p75 = calculatePercentile(bins, 75);
    expect(p25.value).toBeLessThan(p50.value);
    expect(p50.value).toBeLessThan(p75.value);
  });

  it("should calculate full histogram statistics", () => {
    const bins = generateHistogramBins(0);
    const stats = calculateHistogramStats(bins, 80);

    expect(stats.mean).toBeGreaterThan(50);
    expect(stats.mean).toBeLessThan(100);
    expect(stats.median).toBeCloseTo(calculatePercentile(bins, 50).value, 5);
    expect(stats.iqr).toBeCloseTo(stats.q3 - stats.q1, 5);
    expect(stats.percentileVal).toBeCloseTo(
      calculatePercentile(bins, 80).value,
      5,
    );
  });

  it("should calculate stratified sampling with rounded integer counts and total variance", () => {
    const result = calculateStratifiedSampling(
      100, // sampleN
      300, // N1
      500, // N2
      200, // N3
      70, // mean1
      80, // mean2
      90, // mean3
      25, // var1
      36, // var2
      16, // var3
    );

    expect(result.totalN).toBe(1000);
    expect(result.sampleN).toBe(100);
    expect(
      result.strataSampleN[0] +
        result.strataSampleN[1] +
        result.strataSampleN[2],
    ).toBe(100);

    // Weighted mean = 0.3*70 + 0.5*80 + 0.2*90 = 21 + 40 + 18 = 79
    expect(result.totalMean).toBeCloseTo(79, 4);

    // Total variance should account for both within-strata and between-strata
    expect(result.totalVar).toBeGreaterThan(0);
    expect(result.totalStd).toBeCloseTo(Math.sqrt(result.totalVar), 5);
  });
});
