import { describe, it, expect } from "vitest";
import { buildPolyLatex, buildQuadraticLatex } from "./polyBuilder";

describe("buildPolyLatex", () => {
  it("should render 2x² - 3x + 1", () => {
    const latex = buildPolyLatex([
      { coeff: 2, power: 2 },
      { coeff: -3, power: 1 },
      { coeff: 1, power: 0 },
    ]);
    expect(latex).toContain("2");
    expect(latex).toContain("x^{2}");
    expect(latex).toContain("-");
    expect(latex).toContain("3");
    expect(latex).toContain("x");
    expect(latex).toContain("+");
    expect(latex).toContain("1");
  });

  it('should handle all zero terms → "0"', () => {
    const latex = buildPolyLatex([
      { coeff: 0, power: 2 },
      { coeff: 0, power: 1 },
      { coeff: 0, power: 0 },
    ]);
    expect(latex).toBe("0");
  });

  it("should omit coefficient 1 for non-constant terms", () => {
    const latex = buildPolyLatex([
      { coeff: 1, power: 2 },
      { coeff: -1, power: 1 },
      { coeff: 3, power: 0 },
    ]);
    // Should not have "1x^{2}" but should have "x^{2}"
    expect(latex).not.toMatch(/1x/);
    expect(latex).toContain("x^{2}");
  });

  it("should wrap terms in color commands when color is provided", () => {
    const latex = buildPolyLatex([{ coeff: 2, power: 2, color: "#FF0000" }]);
    expect(latex).toContain("\\color{#FF0000}");
    expect(latex).toContain("2");
  });
});

describe("buildQuadraticLatex", () => {
  it("should build y = ax² + bx + c with colors", () => {
    const latex = buildQuadraticLatex(1, 2, 3, {
      a: "#0000FF",
      b: "#00FF00",
      c: "#FF0000",
    });
    expect(latex).toMatch(/^y = /);
    expect(latex).toContain("x^{2}");
    expect(latex).toContain("\\color{#0000FF}");
    expect(latex).toContain("\\color{#00FF00}");
    expect(latex).toContain("\\color{#FF0000}");
  });

  it("should handle a = 0 → linear function", () => {
    const latex = buildQuadraticLatex(0, 2, 3);
    expect(latex).not.toContain("x^{2}");
    expect(latex).toContain("x");
  });

  it("should handle a = 0, b = 0 → constant", () => {
    const latex = buildQuadraticLatex(0, 0, 5);
    expect(latex).toContain("5");
    expect(latex).not.toContain("x");
  });

  it("should handle negative coefficients", () => {
    const latex = buildQuadraticLatex(-1, 2, -3);
    expect(latex).toContain("-");
  });
});
