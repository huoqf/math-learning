import { describe, it, expect } from "vitest";
import {
  calcArithmeticSequence,
  calcGeometricSequence,
  calcArithGeoSplit,
  calcTelescoping,
  calcGroupedSequence,
  calcCrossTelescoping,
  calcOddEvenSequence,
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
  });

  it("should correctly compute geometric sequence an, Sn and limit", () => {
    const res = calcGeometricSequence(4, 0.5, 4);
    expect(res.isValid).toBe(true);
    expect(res.terms[0].an).toBe(4);
    expect(res.terms[3].an).toBe(0.5);
    expect(res.terms[3].Sn).toBe(7.5);
    expect(res.limitSum).toBe(8);
  });

  it("should handle negative q geometric sequence", () => {
    const res = calcGeometricSequence(2, -0.5, 4);
    expect(res.terms[0].an).toBe(2);
    expect(res.terms[1].an).toBe(-1);
    expect(res.terms[2].an).toBe(0.5);
    expect(res.terms[3].an).toBe(-0.25);
    expect(res.limitSum).toBeCloseTo(2 / 1.5, 4);
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
    expect(res.terms[3].Tn).toBe(2);
  });
});
