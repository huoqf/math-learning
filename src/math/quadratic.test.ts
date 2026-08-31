import { describe, it, expect } from "vitest";
import { solveQuadratic } from "./quadratic";

describe("solveQuadratic", () => {
  it("should solve x² - 1 = 0 → roots ±1", () => {
    const res = solveQuadratic(1, 0, -1);
    expect(res.delta).toBeCloseTo(4);
    expect(res.roots).toHaveLength(2);
    // roots are sorted ascending
    expect(res.roots[0]).toBeCloseTo(-1);
    expect(res.roots[1]).toBeCloseTo(1);
    expect(res.axisX).toBeCloseTo(0);
    expect(res.vertexX).toBeCloseTo(0);
    expect(res.vertexY).toBeCloseTo(-1);
  });

  it("should handle x² = 0 → one root at 0", () => {
    const res = solveQuadratic(1, 0, 0);
    expect(res.delta).toBeCloseTo(0);
    expect(res.roots).toHaveLength(1);
    expect(res.roots[0]).toBeCloseTo(0);
  });

  it("should handle x² + 1 = 0 → no real roots", () => {
    const res = solveQuadratic(1, 0, 1);
    expect(res.delta).toBeLessThan(0);
    expect(res.roots).toHaveLength(0);
  });

  it("should degenerate when a = 0 → linear function", () => {
    const res = solveQuadratic(0, 2, 1);
    expect(res.isDegenerate).toBe(true);
    expect(res.degenerateType).toBe("linear");
    expect(res.axisX).toBeNull();
    expect(res.vertexX).toBeNull();
  });

  it("should handle a = 0, b = 0 → constant", () => {
    const res = solveQuadratic(0, 0, 5);
    expect(res.isDegenerate).toBe(true);
    expect(res.degenerateType).toBe("constant");
  });

  it("should handle 2x² - 4x + 2 = 0 → one root at x=1", () => {
    const res = solveQuadratic(2, -4, 2);
    expect(res.delta).toBeCloseTo(0);
    expect(res.roots).toHaveLength(1);
    expect(res.roots[0]).toBeCloseTo(1);
    expect(res.axisX).toBeCloseTo(1);
    expect(res.vertexY).toBeCloseTo(0);
  });

  it("should handle downward facing parabola (a < 0)", () => {
    // y = -x^2 + 2x + 3 -> axisX = 1, vertexY = 4, roots = -1, 3
    const res = solveQuadratic(-1, 2, 3);
    expect(res.direction).toBe("向下");
    expect(res.axisX).toBeCloseTo(1);
    expect(res.vertexY).toBeCloseTo(4);
    expect(res.roots).toHaveLength(2);
    expect(res.roots[0]).toBeCloseTo(-1);
    expect(res.roots[1]).toBeCloseTo(3);
  });

  it("should handle a = 0, b = 0, c = 0 → infinite roots [-Infinity, Infinity]", () => {
    const res = solveQuadratic(0, 0, 0);
    expect(res.isDegenerate).toBe(true);
    expect(res.degenerateType).toBe("constant");
    expect(res.roots).toEqual([-Infinity, Infinity]);
  });
});
