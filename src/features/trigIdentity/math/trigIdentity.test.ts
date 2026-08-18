import { describe, it, expect } from "vitest";
import {
  calculateTrigIdentity,
  calculateInduction,
  calculateUniversalInduction,
  calculateComplementaryModel,
  pointToAngleDeg,
  getQuadrant,
} from "./trigIdentity";

describe("trigIdentity math functions", () => {
  it("calculates basic trig identity and pythagorean relation", () => {
    const res = calculateTrigIdentity(30, 2, 1, 1, 1, 1, 0, 0);
    expect(res.sinVal).toBeCloseTo(0.5, 4);
    expect(res.cosVal).toBeCloseTo(Math.sqrt(3) / 2, 4);
    expect(res.sqSum).toBeCloseTo(1, 4);
    expect(res.sumSqVerif).toBeCloseTo(1 + 2 * res.prodSC, 4);
    expect(res.isHomoDefined).toBe(true);
  });

  it("handles homogeneous and quadratic conversions correctly", () => {
    const res = calculateTrigIdentity(45, 1, 2, 1, 1, 2, 1, 1);
    // at 45 deg, tan = 1, homo = (1*1 + 2*1)/(1*1 + 1*1) = 3/2 = 1.5
    expect(res.homoVal).toBeCloseTo(1.5, 4);
    // quad = (2*1^2 + 1*1 + 1) / (1^2 + 1) = 4 / 2 = 2
    expect(res.quadVal).toBeCloseTo(2, 4);
  });

  it("calculates 6 induction formula types correctly", () => {
    const resPiPlus = calculateInduction(30, "pi_plus");
    expect(resPiPlus.sinBeta).toBeCloseTo(-0.5, 4);
    expect(resPiPlus.cosBeta).toBeCloseTo(-Math.sqrt(3) / 2, 4);

    const resHalfPiPlus = calculateInduction(30, "half_pi_plus");
    expect(resHalfPiPlus.sinBeta).toBeCloseTo(Math.sqrt(3) / 2, 4);
    expect(resHalfPiPlus.cosBeta).toBeCloseTo(-0.5, 4);
  });

  it("calculates universal induction k * pi/2 +- alpha", () => {
    // 3 * pi/2 - alpha (k=3, sign=-1)
    // sin(3pi/2 - alpha) = -cos(alpha)
    const res = calculateUniversalInduction(30, 3, -1);
    expect(res.isOdd).toBe(true);
    expect(res.sinBeta).toBeCloseTo(-Math.sqrt(3) / 2, 4);
    expect(res.cosBeta).toBeCloseTo(-0.5, 4);
  });

  it("calculates complementary model", () => {
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
