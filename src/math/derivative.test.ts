import { describe, it, expect } from "vitest";
import {
  solveDerivative,
  numericalDerivative,
  PRESET_FUNCTIONS,
} from "./derivative";

describe("numericalDerivative", () => {
  it("should approximate d/dx(x²) at x=3 → 6", () => {
    const fn = (x: number) => x * x;
    const d = numericalDerivative(fn, 3);
    expect(d).toBeCloseTo(6, 4);
  });

  it("should approximate d/dx(sin x) at x=0 → 1", () => {
    const d = numericalDerivative(Math.sin, 0);
    expect(d).toBeCloseTo(1, 4);
  });

  it("should approximate d/dx(eˣ) at x=1 → e", () => {
    const d = numericalDerivative(Math.exp, 1);
    expect(d).toBeCloseTo(Math.E, 4);
  });
});

describe("solveDerivative", () => {
  it("should compute tangent info for x² at x=1", () => {
    const fn = (x: number) => x * x;
    const res = solveDerivative(fn, 1);
    expect(res.isValid).toBe(true);
    expect(res.fx).toBeCloseTo(1);
    expect(res.fpx).toBeCloseTo(2);
    expect(res.slope).toBeCloseTo(2);
    expect(res.tangentIntercept).toBeCloseTo(-1); // y = 2x - 1 → intercept = -1
  });

  it("should handle undefined function point", () => {
    const fn = (x: number) => (x > 0 ? Math.log(x) : NaN);
    const res = solveDerivative(fn, 0);
    expect(res.isValid).toBe(false);
    expect(res.degenerateType).toBe("undefined");
  });

  it("should compute cubic derivative correctly", () => {
    const fn = PRESET_FUNCTIONS.cubic.fn;
    const res = solveDerivative(fn, 1);
    expect(res.isValid).toBe(true);
    // f(x) = x³ - 3x → f'(x) = 3x² - 3 → f'(1) = 0
    expect(res.slope).toBeCloseTo(0, 3);
    expect(res.fx).toBeCloseTo(-2);
  });
});

describe("PRESET_FUNCTIONS", () => {
  it("should have correct labels", () => {
    expect(PRESET_FUNCTIONS.cubic.label).toContain("x³");
    expect(PRESET_FUNCTIONS.quadratic.label).toContain("x²");
    expect(PRESET_FUNCTIONS.sine.label).toContain("sin");
  });

  it("cubic fn should match x³ - 3x", () => {
    expect(PRESET_FUNCTIONS.cubic.fn(0)).toBe(0);
    expect(PRESET_FUNCTIONS.cubic.fn(1)).toBe(-2);
    expect(PRESET_FUNCTIONS.cubic.fn(-1)).toBe(2);
  });
});
