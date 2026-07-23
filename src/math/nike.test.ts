import { describe, it, expect } from "vitest";
import { solveNike, evalNikeAt } from "./nike";

describe("Nike Function Math Solver (y = a(x-h) + c + b/(x-h))", () => {
  it("should correctly calculate classic Nike function (a=1, b=4)", () => {
    const res = solveNike(1, 4, 0, 0);
    expect(res.isValid).toBe(true);
    expect(res.curveType).toBe("nike");
    expect(res.criticalPoints).toHaveLength(2);

    const minPt = res.criticalPoints.find((p) => p.type === "min");
    const maxPt = res.criticalPoints.find((p) => p.type === "max");
    expect(minPt).toBeDefined();
    expect(minPt?.x).toBeCloseTo(2);
    expect(minPt?.y).toBeCloseTo(4);

    expect(maxPt).toBeDefined();
    expect(maxPt?.x).toBeCloseTo(-2);
    expect(maxPt?.y).toBeCloseTo(-4);

    expect(res.verticalAsymptoteX).toBe(0);
    expect(res.obliqueAsymptoteSlope).toBe(1);
    expect(res.obliqueAsymptoteIntercept).toBe(0);
  });

  it("should correctly calculate streamer hyperbolic function (a=1, b=-4)", () => {
    const res = solveNike(1, -4, 0, 0);
    expect(res.isValid).toBe(true);
    expect(res.curveType).toBe("streamer");
    expect(res.criticalPoints).toHaveLength(0);
    expect(res.monotonicityDescription).toContain("均为单调递增");
  });

  it("should handle shifted hyperbolic function (a=1, b=4, h=1, c=2)", () => {
    const res = solveNike(1, 4, 1, 2);
    expect(res.isValid).toBe(true);
    expect(res.verticalAsymptoteX).toBe(1);
    expect(res.symmetryCenter).toEqual({ x: 1, y: 2 });

    const minPt = res.criticalPoints.find((p) => p.type === "min");
    expect(minPt?.x).toBeCloseTo(3);
    expect(minPt?.y).toBeCloseTo(6);
  });

  it("should handle degeneration cases (a=0 or b=0)", () => {
    const resA0 = solveNike(0, 4, 0, 0);
    expect(resA0.isDegenerate).toBe(true);
    expect(resA0.degenerationType).toBe("a_zero");
    expect(resA0.curveType).toBe("inverse_prop");

    const resB0 = solveNike(2, 0, 0, 0);
    expect(resB0.isDegenerate).toBe(true);
    expect(resB0.degenerationType).toBe("b_zero");
    expect(resB0.curveType).toBe("proportional");
  });

  it("should evaluate function value and derivative correctly at x0", () => {
    const evalRes = evalNikeAt(1, 4, 0, 0, 2);
    expect(evalRes.isValid).toBe(true);
    expect(evalRes.y).toBeCloseTo(4);
    expect(evalRes.derivative).toBeCloseTo(0); // Extreme point derivative is 0
  });
});
