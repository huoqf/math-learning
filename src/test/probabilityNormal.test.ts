import { describe, it, expect } from "vitest";
import {
  normalPdf,
  normalCdf,
  calcIntervalProbability,
  generateHistogramBins,
  estimateHistogramStats,
  getThreeSigmaIntervals,
  calcSymmetricNormalIntervals,
} from "../math/probabilityNormal";

describe("probabilityNormal math functions", () => {
  it("normalPdf should compute correct peak and symmetry", () => {
    const mu = 0;
    const sigma = 1;
    const peak = normalPdf(0, mu, sigma);
    expect(peak).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 4);
    expect(normalPdf(-1, mu, sigma)).toBeCloseTo(normalPdf(1, mu, sigma), 5);
  });

  it("normalCdf and interval probabilities adhere to 3-sigma rule", () => {
    const mu = 2;
    const sigma = 1.5;
    expect(normalCdf(mu, mu, sigma)).toBeCloseTo(0.5, 4);
    expect(
      calcIntervalProbability(mu, sigma, mu - sigma, mu + sigma),
    ).toBeCloseTo(0.6827, 3);

    const intervals = getThreeSigmaIntervals(mu, sigma);
    expect(intervals[0].prob).toBeCloseTo(0.6827, 3);
    expect(intervals[1].prob).toBeCloseTo(0.9545, 3);
    expect(intervals[2].prob).toBeCloseTo(0.9973, 3);
  });

  it("histogram bins area should sum to approximately 1", () => {
    const bins = generateHistogramBins(0, 1, 10, 500, 0);
    expect(bins.length).toBe(10);
    const stats = estimateHistogramStats(bins, 50);
    expect(stats.totalArea).toBeCloseTo(1.0, 2);
    // 对称分布下中位数应接近 0
    expect(Math.abs(stats.median)).toBeLessThan(0.3);
  });

  it("calcSymmetricNormalIntervals should calculate exact mirror probabilities", () => {
    const mu = 1;
    const sigma = 2;
    const x0 = -1; // 距离 mu 为 2
    const res = calcSymmetricNormalIntervals(mu, sigma, x0);
    expect(res.xSym).toBe(3); // 2*1 - (-1) = 3
    expect(res.leftX).toBe(-1);
    expect(res.rightX).toBe(3);

    // P(X <= -1) 应该等于 P(X >= 3)
    const pLeft = normalCdf(-1, mu, sigma);
    const pRight = 1 - normalCdf(3, mu, sigma);
    expect(pLeft).toBeCloseTo(pRight, 5);
    expect(res.tailProb).toBeCloseTo(pLeft, 5);
    expect(res.centerProb).toBeCloseTo(1 - 2 * pLeft, 5);
  });
});
