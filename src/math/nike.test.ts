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

  it("should calculate inverted Nike function (a = -1, b = -4)", () => {
    const res = solveNike(-1, -4, 0, 0);
    expect(res.isValid).toBe(true);
    expect(res.curveType).toBe("nike");
    expect(res.criticalPoints).toHaveLength(2);

    const minPt = res.criticalPoints.find((p) => p.type === "min");
    const maxPt = res.criticalPoints.find((p) => p.type === "max");
    expect(minPt?.x).toBeCloseTo(-2);
    expect(minPt?.y).toBeCloseTo(4);
    expect(maxPt?.x).toBeCloseTo(2);
    expect(maxPt?.y).toBeCloseTo(-4);
  });

  it("should calculate AM-GM minimum point when a > 0 and b > 0", () => {
    const res = solveNike(2, 8, 0, 0); // x = sqrt(8/2) = 2, min y = 2*2 + 8/2 = 8
    expect(res.amgmMinPoint).toBeDefined();
    expect(res.amgmMinPoint?.x).toBeCloseTo(2);
    expect(res.amgmMinPoint?.y).toBeCloseTo(8);
    expect(res.amgmMinPoint?.val1).toBeCloseTo(4);
    expect(res.amgmMinPoint?.val2).toBeCloseTo(4);
  });

  it("should verify high school math properties in buildNikePanel", async () => {
    const { buildNikePanel } = await import("@/data/builders/nike");
    const panel = buildNikePanel(
      { a: 1, b: 4, x0: 2 },
      { activeMode: "standard" },
    );

    // 1. 包含高中函数核心性质：定义域与值域
    const domain = panel.quantities.find((q) => q.label === "函数定义域");
    const range = panel.quantities.find((q) => q.label === "函数值域");
    expect(domain?.value).toContain("x \\ne 0.0");
    expect(range?.value).toContain("(-\\infty, -4.00] \\cup [4.00, +\\infty)");

    // 2. 验证推导链中正确标出第三象限，杜绝第二象限常识错误
    const step3 = panel.reasoningSteps?.find((s) => s.step === 3);
    expect(step3?.detail).toContain("第三象限取得极大值点");
    expect(step3?.detail).not.toContain("第二象限极大值点");
    expect(step3?.latex).toContain("f_{\\text{极小}}");
    expect(step3?.latex).toContain("f_{\\text{极大}}");
  });
});
