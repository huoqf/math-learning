import { describe, it, expect } from "vitest";
import {
  calcArithmeticSequence,
  calcGeometricSequence,
  calcArithGeoSplit,
  calcTelescoping,
  calcGroupedSequence,
  calcCrossTelescoping,
  calcOddEvenSequence,
  calcAbsSumSequence,
  calcRadicalTelescoping,
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
} from "./sequence";

describe("Sequence Math Calculations", () => {
  it("should correctly compute arithmetic sequence an and Sn", () => {
    const res = calcArithmeticSequence(2, 3, 5);
    expect(res.isValid).toBe(true);
    expect(res.terms.length).toBe(5);
    expect(res.terms[0].an).toBe(2);
    expect(res.terms[4].an).toBe(14);
    expect(res.terms[4].Sn).toBe(40);
    expect(res.lineFn(1)).toBe(2);
    expect(res.lineFn(5)).toBe(14);
  });

  it("should correctly compute arithmetic sequence Sn max/min when d < 0", () => {
    const res = calcArithmeticSequence(7, -2, 6);
    expect(res.maxSnInfo?.nMax).toBe(4);
    expect(res.maxSnInfo?.maxSn).toBe(16);
    expect(res.continuousAxis).toBeCloseTo(4, 4);
    expect(res.lastPositiveN).toBe(4);
  });

  it("should correctly compute arithmetic dual max when axis is half integer", () => {
    // a1 = 7, d = -2 => terms: 7, 5, 3, 1, -1 => Sn: 7, 12, 15, 16, 15
    // a1 = 5, d = -2 => terms: 5, 3, 1, -1, -3 => Sn: 5, 8, 9, 8, 5
    // continuousAxis = 0.5 - 5 / (-2) = 0.5 + 2.5 = 3
    // For a1 = 6, d = -2 => continuousAxis = 0.5 + 3 = 3.5 => a1=6, a2=4, a3=2, a4=0, a5=-2 => S3=12, S4=12
    const res = calcArithmeticSequence(6, -2, 5);
    expect(res.continuousAxis).toBe(3.5);
    expect(res.maxSnInfo?.isDual).toBe(true);
    expect(res.maxSnInfo?.nMax).toBe(3);
    expect(res.maxSnInfo?.dualN).toBe(4);
    expect(res.maxSnInfo?.maxSn).toBe(12);
  });

  it("should correctly compute absolute value sums Tn and segmented sums", () => {
    // a1 = 5, d = -2, N = 6 => an: 5, 3, 1, -1, -3, -5
    // Sn: 5, 8, 9, 8, 5, 0
    // Tn: 5, 8, 9, 10, 13, 18
    const res = calcArithmeticSequence(5, -2, 6, 3);
    expect(res.terms[0].Tn).toBe(5);
    expect(res.terms[2].Tn).toBe(9);
    expect(res.terms[3].Tn).toBe(10);
    expect(res.terms[5].Tn).toBe(18);

    // Segmented sum with k = 3: Seg 1 (n=1..3, sum=9), Seg 2 (n=4..6, sum=-9)
    // Diff = k^2 * d = 9 * (-2) = -18
    expect(res.segmentedSums).not.toBeNull();
    expect(res.segmentedSums?.segments.length).toBe(2);
    expect(res.segmentedSums?.segments[0].sumValue).toBe(9);
    expect(res.segmentedSums?.segments[1].sumValue).toBe(-9);
    expect(res.segmentedSums?.diff).toBe(-18);
  });

  it("should correctly compute geometric sequence an, Sn, Pn and limit", () => {
    const res = calcGeometricSequence(4, 0.5, 4, 2);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].an).toBe(4);
    expect(res.terms[3].an).toBe(0.5);
    expect(res.terms[3].Sn).toBe(7.5);
    expect(res.terms[0].Pn).toBe(4);
    expect(res.terms[1].Pn).toBe(8);
    expect(res.terms[2].Pn).toBe(8); // a3 = 1 => dual max P2 = P3 = 8
    expect(res.terms[3].Pn).toBe(4);
    expect(res.limitSum).toBe(8);
    expect(res.qType).toBe("decay");
    expect(res.maxPnInfo?.nMax).toBe(2);
    expect(res.maxPnInfo?.maxPn).toBe(8);

    // Segmented sums: Seg 1 (n=1..2, sum=6), Seg 2 (n=3..4, sum=1.5) => ratio = 0.25 (q^2)
    expect(res.segmentedSums).not.toBeNull();
    expect(res.segmentedSums?.segments[0].sumValue).toBe(6);
    expect(res.segmentedSums?.segments[1].sumValue).toBe(1.5);
    expect(res.segmentedSums?.ratio).toBeCloseTo(0.25, 4);

    // Stagger data
    expect(res.staggerData.diffLeft.val).toBe(4);
    expect(res.staggerData.diffRight.val).toBe(4 * Math.pow(0.5, 4));
  });

  it("should handle negative q geometric sequence and qType", () => {
    const res = calcGeometricSequence(2, -0.5, 4);
    expect(res.terms[0].an).toBe(2);
    expect(res.terms[1].an).toBe(-1);
    expect(res.terms[2].an).toBe(0.5);
    expect(res.terms[3].an).toBe(-0.25);
    expect(res.limitSum).toBeCloseTo(2 / 1.5, 4);
    expect(res.qType).toBe("oscillate-decay");
  });

  it("should correctly identify constant geometric sequence (q=1)", () => {
    const res = calcGeometricSequence(3, 1, 5);
    expect(res.qType).toBe("constant");
    expect(res.terms[4].Sn).toBe(15);
  });

  it("should correctly compute arith-geo split terms", () => {
    const res = calcArithGeoSplit(1, 2, 0.5, 3);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].cn).toBe(1);
    expect(res.terms[1].cn).toBe(1.5);
    expect(res.terms[2].cn).toBe(1.25);
    expect(res.terms[2].Tn).toBe(3.75);
  });

  it("should correctly compute telescoping terms", () => {
    const res = calcTelescoping(4);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].partA).toBe(1);
    expect(res.terms[0].partB).toBe(0.5);
    expect(res.terms[3].Tn).toBe(0.8);
  });

  it("should correctly compute grouped sequence terms", () => {
    // an = 2n, bn = 2^(n-1) => c1=2+1=3, c2=4+2=6, c3=6+4=10
    const res = calcGroupedSequence(2, 2, 2, 3);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].cn).toBe(3);
    expect(res.terms[1].cn).toBe(6);
    expect(res.terms[2].cn).toBe(10);
    expect(res.terms[2].Tn).toBe(19);
  });

  it("should correctly compute cross-telescoping terms", () => {
    const res = calcCrossTelescoping(4);
    expect(res.isValid).toBe(true);
    // limitSum = 0.5 * (1 + 1/2) = 0.75
    expect(res.limitSum).toBe(0.75);
    // T1 = 1/3 = 0.3333...
    expect(res.terms[0].cn).toBeCloseTo(1 / 3, 4);
  });

  it("should correctly compute odd-even sequence terms", () => {
    const res = calcOddEvenSequence(4);
    expect(res.isValid).toBe(true);
    // c1 = -1, c2 = 2, c3 = -3, c4 = 4
    expect(res.terms[0].cn).toBe(-1);
    expect(res.terms[1].cn).toBe(2);
    expect(res.terms[1].pairSum).toBe(1);
    expect(res.terms[3].pairSum).toBe(1);
    expect(res.terms[3].Tn).toBe(2); // S4 = 1 + 1 = 2
  });

  it("should correctly compute absolute value sum terms (posToNeg)", () => {
    // a1 = 5, d = -2 => terms: 5, 3, 1, -1, -3
    // zeroPoint = 1 - 5/(-2) = 3.5, n0 = 3
    const res = calcAbsSumSequence(5, -2, 5);
    expect(res.isValid).toBe(true);
    expect(res.zeroPoint).toBe(3.5);
    expect(res.n0).toBe(3);
    expect(res.signChangeType).toBe("posToNeg");
    expect(res.terms[2].absAn).toBe(1);
    expect(res.terms[3].absAn).toBe(1);
    expect(res.terms[3].isNegative).toBe(true);
    expect(res.terms[4].absAn).toBe(3);
    // T5 = 5 + 3 + 1 + 1 + 3 = 13
    expect(res.terms[4].Tn).toBe(13);
  });

  it("should correctly compute radical telescoping terms", () => {
    const res = calcRadicalTelescoping(3);
    expect(res.isValid).toBe(true);
    expect(res.terms.length).toBe(3);
    // T3 = sqrt(4) - 1 = 1
    expect(res.finalTn).toBe(1);
    expect(res.terms[2].Tn).toBeCloseTo(1, 4);
  });

  it("should correctly compute linear recurrence terms (a_{n+1} = p*a_n + q)", () => {
    // a1 = 3, p = 2, q = 1 => c = 1 / (1-2) = -1
    // a1 = 3, a2 = 7, a3 = 15, a4 = 31
    const res = calcLinearRecurrence(3, 2, 1, 4);
    expect(res.isValid).toBe(true);
    expect(res.fixedPoint).toBe(-1);
    expect(res.terms[0].an).toBe(3);
    expect(res.terms[1].an).toBe(7);
    expect(res.terms[2].an).toBe(15);
    expect(res.terms[3].an).toBe(31);
    // bn = an - c = an + 1 => b1=4, b2=8, b3=16, b4=32
    expect(res.terms[0].bn).toBe(4);
    expect(res.terms[3].bn).toBe(32);
  });

  it("should handle degenerate linear recurrence (p = 1)", () => {
    const res = calcLinearRecurrence(2, 1, 3, 4);
    expect(res.isDegenerateArith).toBe(true);
    expect(res.fixedPoint).toBeNull();
    expect(res.terms[0].an).toBe(2);
    expect(res.terms[1].an).toBe(5);
    expect(res.terms[2].an).toBe(8);
  });

  it("should correctly compute accumulation recurrence terms", () => {
    // a1 = 1, f(n) = 2n => a1=1, a2=1+2=3, a3=3+4=7, a4=7+6=13
    const res = calcAccumulationRecurrence(1, "linear", 2, 4);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].an).toBe(1);
    expect(res.terms[1].an).toBe(3);
    expect(res.terms[2].an).toBe(7);
    expect(res.terms[3].an).toBe(13);
  });

  it("should correctly compute multiplication recurrence terms", () => {
    // a1 = 1, multType = n/(n+1) => a1=1, a2=1/2, a3=1/3, a4=1/4
    const res = calcMultiplicationRecurrence(1, "n_over_n1", 4);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].an).toBe(1);
    expect(res.terms[1].an).toBe(0.5);
    expect(res.terms[2].an).toBeCloseTo(1 / 3, 4);
    expect(res.terms[3].an).toBe(0.25);
  });

  it("should correctly compute reciprocal recurrence terms", () => {
    // a1 = 1, A = 1, B = 1, C = 1 => 1/a_{n+1} = 1/a_n + 1 => b_n is arith (b1=1, b2=2, b3=3) => a1=1, a2=1/2, a3=1/3
    const res = calcReciprocalRecurrence(1, 1, 1, 1, 3);
    expect(res.isValid).toBe(true);
    expect(res.isReciprocalLinear).toBe(true);
    expect(res.terms[0].an).toBe(1);
    expect(res.terms[1].an).toBe(0.5);
    expect(res.terms[2].an).toBeCloseTo(1 / 3, 4);
  });

  it("should correctly compute second order recurrence terms (Fibonacci sequence)", () => {
    // Fibonacci: a1 = 1, a2 = 1, p = 1, q = 1 => a1=1, a2=1, a3=2, a4=3, a5=5, a6=8
    const res = calcSecondOrderRecurrence(1, 1, 1, 1, 6);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].an).toBe(1);
    expect(res.terms[1].an).toBe(1);
    expect(res.terms[2].an).toBe(2);
    expect(res.terms[3].an).toBe(3);
    expect(res.terms[4].an).toBe(5);
    expect(res.terms[5].an).toBe(8);
  });
});
