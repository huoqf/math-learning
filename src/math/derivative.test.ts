import { describe, it, expect } from "vitest";
import {
  solveDerivative,
  numericalDerivative,
  PRESET_FUNCTIONS,
  formatNum,
  buildPointSlopeLatex,
  buildSlopeInterceptLatex,
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

describe("formatNum", () => {
  it("formats numbers properly without -0", () => {
    expect(formatNum(0)).toBe("0");
    expect(formatNum(-0.0001)).toBe("0");
    expect(formatNum(2.5)).toBe("2.5");
    expect(formatNum(-3.14159, 2)).toBe("-3.14");
  });
});

describe("buildPointSlopeLatex & buildSlopeInterceptLatex", () => {
  it("eliminates double negatives and formats standard point-slope properly", () => {
    // 切点 (1, -2), 斜率 0 => y + 2 = 0
    const latex1 = buildPointSlopeLatex(1, -2, 0);
    expect(latex1).toBe("y + 2 = 0");

    // 切点 (-1, 2), 斜率 3 => y - 2 = 3(x + 1)
    const latex2 = buildPointSlopeLatex(-1, 2, 3);
    expect(latex2).toBe("y - 2 = 3(x + 1)");

    // 切点 (0, 0), 斜率 1 => y = x
    const latex3 = buildPointSlopeLatex(0, 0, 1);
    expect(latex3).toBe("y = x");

    // 切点 (0, 1), 斜率 1 => y - 1 = x
    const latex4 = buildPointSlopeLatex(0, 1, 1);
    expect(latex4).toBe("y - 1 = x");
  });

  it("formats slope-intercept standard latex properly", () => {
    // y = 2x - 1
    expect(buildSlopeInterceptLatex(2, -1)).toBe("y = 2x - 1");
    // y = -x + 3
    expect(buildSlopeInterceptLatex(-1, 3)).toBe("y = -x + 3");
    // y = 4 (水平线)
    expect(buildSlopeInterceptLatex(0, 4)).toBe("y = 4");
    // y = x (截距 0)
    expect(buildSlopeInterceptLatex(1, 0)).toBe("y = x");
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
