import { describe, it, expect } from "vitest";
import {
  combinations,
  computeBinomialDistribution,
  computeHypergeometricDistribution,
  computeGeneralDiscreteDistribution,
  computeLinearTransformedDistribution,
  computeHypergeometricBinomialComparison,
  computeDecisionModel,
} from "./probabilityDistribution";

describe("probabilityDistribution math module", () => {
  it("combinations calculations", () => {
    expect(combinations(5, 0)).toBe(1);
    expect(combinations(5, 1)).toBe(5);
    expect(combinations(5, 2)).toBe(10);
    expect(combinations(5, 5)).toBe(1);
    expect(combinations(5, 6)).toBe(0);
  });

  it("binomial distribution B(n, p)", () => {
    // B(4, 0.5) => E(X) = 2, D(X) = 1
    const res = computeBinomialDistribution(4, 0.5);
    expect(res.isValid).toBe(true);
    expect(res.mean).toBeCloseTo(2);
    expect(res.variance).toBeCloseTo(1);
    expect(res.stdDev).toBeCloseTo(1);
    expect(res.sumP).toBeCloseTo(1);
    expect(res.outcomes.length).toBe(5);
  });

  it("hypergeometric distribution H(N, M, n)", () => {
    // H(10, 4, 3) => E(X) = 3 * (4/10) = 1.2
    const res = computeHypergeometricDistribution(10, 4, 3);
    expect(res.isValid).toBe(true);
    expect(res.mean).toBeCloseTo(1.2);
    expect(res.sumP).toBeCloseTo(1);

    // 退化校验
    const invalidRes = computeHypergeometricDistribution(5, 10, 3);
    expect(invalidRes.isValid).toBe(false);
  });

  it("general discrete distribution & linear transformation E(aX+b) = aE(X)+b", () => {
    const base = computeGeneralDiscreteDistribution([
      { x: 1, p: 0.2 },
      { x: 2, p: 0.5 },
      { x: 3, p: 0.3 },
    ]);
    expect(base.isValid).toBe(true);
    expect(base.sumP).toBeCloseTo(1.0);
    // E(X) = 1*0.2 + 2*0.5 + 3*0.3 = 0.2 + 1.0 + 0.9 = 2.1
    expect(base.mean).toBeCloseTo(2.1);

    // Y = 3X + 2 => E(Y) = 3 * 2.1 + 2 = 8.3
    const linear = computeLinearTransformedDistribution(base, 3, 2);
    expect(linear.transformed.mean).toBeCloseTo(8.3);
    // D(Y) = 3^2 * D(X) = 9 * D(X)
    expect(linear.transformed.variance).toBeCloseTo(9 * base.variance);
    expect(linear.transformed.stdDev).toBeCloseTo(3 * base.stdDev);
  });

  it("hypergeometric vs binomial convergence N -> infinity", () => {
    // 当 N 很大时，超几何分布接近二项分布
    const smallN = computeHypergeometricBinomialComparison(10, 0.4, 3);
    const largeN = computeHypergeometricBinomialComparison(500, 0.4, 3);

    expect(smallN.maxDifference).toBeGreaterThan(0);
    expect(largeN.maxDifference).toBeLessThan(smallN.maxDifference);
    expect(largeN.varianceCorrectionFactor).toBeCloseTo(1.0, 1);
  });

  it("decision model calculations for quality and investment", () => {
    const qual = computeDecisionModel("quality", 0.05);
    expect(qual.schemeADist.isValid).toBe(true);
    expect(qual.schemeBDist.isValid).toBe(true);
    expect(qual.bestByMean).toBe("A");

    const invest = computeDecisionModel("investment", 0.7);
    expect(invest.schemeADist.mean).toBe(4);
    expect(invest.schemeBDist.mean).toBeCloseTo(11.0);
    expect(invest.bestByMean).toBe("B");
    expect(invest.bestByRisk).toBe("A");
  });
});
