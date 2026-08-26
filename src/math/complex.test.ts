import { describe, it, expect } from "vitest";
import {
  createComplex,
  addComplex,
  subComplex,
  mulComplex,
  divComplex,
  modulus,
  argument,
  conjugate,
  formatComplexLatex,
  calcCircleLocusExtrema,
  calcPerpBisectorLocus,
  calcModulusTriangleInequality,
} from "./complex";

describe("complex math pure functions", () => {
  it("should calculate basic operations correctly", () => {
    const z1 = createComplex(3, 4);
    const z2 = createComplex(1, -2);

    expect(modulus(z1)).toBeCloseTo(5);
    expect(conjugate(z1)).toEqual({ re: 3, im: -4 });
    expect(addComplex(z1, z2)).toEqual({ re: 4, im: 2 });
    expect(subComplex(z1, z2)).toEqual({ re: 2, im: 6 });
  });

  it("should calculate multiplication and division correctly", () => {
    const z1 = createComplex(1, 2);
    const z2 = createComplex(3, -4);

    // (1+2i)(3-4i) = 3 - 4i + 6i - 8i^2 = 11 + 2i
    expect(mulComplex(z1, z2)).toEqual({ re: 11, im: 2 });

    const divRes = divComplex(createComplex(11, 2), z2);
    expect(divRes.valid).toBe(true);
    expect(divRes.result.re).toBeCloseTo(1);
    expect(divRes.result.im).toBeCloseTo(2);
  });

  it("should handle argument correctly", () => {
    expect(argument(createComplex(1, 0))).toBeCloseTo(0);
    expect(argument(createComplex(0, 1))).toBeCloseTo(Math.PI / 2);
    expect(argument(createComplex(-1, 0))).toBeCloseTo(Math.PI);
    expect(argument(createComplex(0, -1))).toBeCloseTo(-Math.PI / 2);
  });

  it("should format complex numbers to latex", () => {
    expect(formatComplexLatex(createComplex(3, 4))).toBe("3 + 4i");
    expect(formatComplexLatex(createComplex(0, -1))).toBe("-i");
    expect(formatComplexLatex(createComplex(5, 0))).toBe("5");
    expect(formatComplexLatex(createComplex(0, 0))).toBe("0");
  });

  it("should calculate circle locus extrema correctly", () => {
    const center = createComplex(3, 4);
    const radius = 2;
    const target = createComplex(0, 0);

    const res = calcCircleLocusExtrema(center, radius, target);
    expect(res.valid).toBe(true);
    expect(res.centerDist).toBeCloseTo(5);
    expect(res.minDist).toBeCloseTo(3); // 5 - 2
    expect(res.maxDist).toBeCloseTo(7); // 5 + 2
  });

  it("should calculate perpendicular bisector locus correctly", () => {
    const z1 = createComplex(3, 1);
    const z2 = createComplex(-1, 3);

    const res = calcPerpBisectorLocus(z1, z2);
    expect(res.valid).toBe(true);
    expect(res.midPoint).toEqual({ re: 1, im: 2 });
    expect(res.dist).toBeCloseTo(Math.hypot(-4, 2));
  });

  it("should calculate modulus triangle inequality range correctly", () => {
    const z1 = createComplex(3, 0);
    const z2 = createComplex(0, 4);

    const res = calcModulusTriangleInequality(z1, z2);
    expect(res.mod1).toBeCloseTo(3);
    expect(res.mod2).toBeCloseTo(4);
    expect(res.modSum).toBeCloseTo(5);
    expect(res.lowerBound).toBeCloseTo(1); // |3 - 4|
    expect(res.upperBound).toBeCloseTo(7); // 3 + 4
  });
});
