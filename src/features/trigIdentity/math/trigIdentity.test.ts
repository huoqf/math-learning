import { describe, it, expect } from "vitest";
import {
  calculateTrigIdentity,
  calculateInduction,
  calculateUniversalInduction,
  calculateComplementaryModel,
  pointToAngleDeg,
  getQuadrant,
  FormulaType,
} from "./trigIdentity";

describe("trigIdentity math functions", () => {
  it("calculates basic trig identity and pythagorean relation", () => {
    const res = calculateTrigIdentity(30, 2, 1, 1, 1, 1, 0, 0);
    expect(res.sinVal).toBeCloseTo(0.5, 4);
    expect(res.cosVal).toBeCloseTo(Math.sqrt(3) / 2, 4);
    expect(res.sqSum).toBeCloseTo(1, 4);
    expect(res.sumSqVerif).toBeCloseTo(1 + 2 * res.prodSC, 4);
    expect(res.diffSqVerif).toBeCloseTo(1 - 2 * res.prodSC, 4);
    expect(res.isHomoDefined).toBe(true);
  });

  it("handles known-one-find-two sign decision based on y=x comparison", () => {
    // 60°: sin > cos (y > x) => diffSC > 0
    const res60 = calculateTrigIdentity(60);
    expect(res60.sinVal).toBeGreaterThan(res60.cosVal);
    expect(res60.diffSignReason).toContain("正号 '+'");

    // 30°: sin < cos (y < x) => diffSC < 0
    const res30 = calculateTrigIdentity(30);
    expect(res30.sinVal).toBeLessThan(res30.cosVal);
    expect(res30.diffSignReason).toContain("负号 '-'");

    // 45°: sin = cos => diffSC = 0
    const res45 = calculateTrigIdentity(45);
    expect(res45.diffSC).toBeCloseTo(0, 4);
  });

  it("handles homogeneous and quadratic conversions correctly", () => {
    const res = calculateTrigIdentity(45, 1, 2, 1, 1, 2, 1, 1);
    // at 45 deg, tan = 1, homo = (1*1 + 2*1)/(1*1 + 1*1) = 3/2 = 1.5
    expect(res.homoVal).toBeCloseTo(1.5, 4);
    // quad = (2*1^2 + 1*1 + 1) / (1^2 + 1) = 4 / 2 = 2
    expect(res.quadVal).toBeCloseTo(2, 4);
  });

  it("calculates all 6 standard induction formula types correctly", () => {
    const formulas: Array<{
      type: FormulaType;
      expectedSin: number;
      expectedCos: number;
      expectedOdd: boolean;
    }> = [
      {
        type: "period", // alpha + 2pi
        expectedSin: 0.5,
        expectedCos: Math.sqrt(3) / 2,
        expectedOdd: false,
      },
      {
        type: "pi_plus", // pi + alpha
        expectedSin: -0.5,
        expectedCos: -Math.sqrt(3) / 2,
        expectedOdd: false,
      },
      {
        type: "neg", // -alpha
        expectedSin: -0.5,
        expectedCos: Math.sqrt(3) / 2,
        expectedOdd: false,
      },
      {
        type: "pi_minus", // pi - alpha
        expectedSin: 0.5,
        expectedCos: -Math.sqrt(3) / 2,
        expectedOdd: false,
      },
      {
        type: "half_pi_minus", // pi/2 - alpha
        expectedSin: Math.sqrt(3) / 2,
        expectedCos: 0.5,
        expectedOdd: true,
      },
      {
        type: "half_pi_plus", // pi/2 + alpha
        expectedSin: Math.sqrt(3) / 2,
        expectedCos: -0.5,
        expectedOdd: true,
      },
    ];

    for (const f of formulas) {
      const res = calculateInduction(30, f.type);
      expect(res.sinBeta).toBeCloseTo(f.expectedSin, 4);
      expect(res.cosBeta).toBeCloseTo(f.expectedCos, 4);
      expect(res.isOdd).toBe(f.expectedOdd);
    }
  });

  it("calculates universal induction k * pi/2 +- alpha with different k parity and signs", () => {
    // 1. k=3, sign=-1: sin(3pi/2 - alpha) = -cos(alpha)
    const res3Minus = calculateUniversalInduction(30, 3, -1);
    expect(res3Minus.isOdd).toBe(true);
    expect(res3Minus.sinBeta).toBeCloseTo(-Math.sqrt(3) / 2, 4);
    expect(res3Minus.cosBeta).toBeCloseTo(-0.5, 4);

    // 2. k=2, sign=-1: sin(pi - alpha) = sin(alpha)
    const res2Minus = calculateUniversalInduction(30, 2, -1);
    expect(res2Minus.isOdd).toBe(false);
    expect(res2Minus.sinBeta).toBeCloseTo(0.5, 4);
    expect(res2Minus.cosBeta).toBeCloseTo(-Math.sqrt(3) / 2, 4);

    // 3. k=1, sign=1: sin(pi/2 + alpha) = cos(alpha)
    const res1Plus = calculateUniversalInduction(30, 1, 1);
    expect(res1Plus.isOdd).toBe(true);
    expect(res1Plus.sinBeta).toBeCloseTo(Math.sqrt(3) / 2, 4);
    expect(res1Plus.cosBeta).toBeCloseTo(-0.5, 4);
  });

  it("calculates complementary and supplementary model", () => {
    const res = calculateComplementaryModel(15, 30);
    expect(res.angle1Deg).toBe(45);
    expect(res.angle2Deg).toBe(45);
    expect(res.isComplementary).toBe(true);
  });

  it("correctly converts point coordinates to degrees", () => {
    const deg = pointToAngleDeg(1, 1, 40);
    expect(deg).toBe(45);
  });

  it("identifies quadrants correctly", () => {
    expect(getQuadrant(45)).toBe(1);
    expect(getQuadrant(135)).toBe(2);
    expect(getQuadrant(225)).toBe(3);
    expect(getQuadrant(315)).toBe(4);
    expect(getQuadrant(90)).toBe(0);
  });
});
