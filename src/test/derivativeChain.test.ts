import { describe, it, expect } from "vitest";
import { calculateDerivativeChain } from "@/math/derivativeChain";
import { buildDerivativeChainPanel } from "@/data/builders/derivativeChain";

describe("简单复合函数求导数学层与组装层契约", () => {
  it("指数复合函数正确运用链式法则放大导数", () => {
    // y = e^(2x + 1), x0 = 0 -> u0 = 1, y0 = e, y' = 2 * e
    const res = calculateDerivativeChain("exp", 2, 1, 0);

    expect(res.isValid).toBe(true);
    expect(res.u0).toBeCloseTo(1, 5);
    expect(res.y0).toBeCloseTo(Math.E, 5);
    expect(res.slope).toBeCloseTo(2 * Math.E, 5);
  });

  it("三角复合函数正确包含系数 a", () => {
    // y = sin(3x - 1), x0 = 0 -> u0 = -1, y' = 3 * cos(-1)
    const res = calculateDerivativeChain("sin", 3, -1, 0);

    expect(res.isValid).toBe(true);
    expect(res.u0).toBeCloseTo(-1, 5);
    expect(res.slope).toBeCloseTo(3 * Math.cos(-1), 5);
  });

  it("对数复合函数定义域边界保护合规", () => {
    // y = ln(2x + 1), 当 x0 = -1 时, u = -1 <= 0, 必须返回 isValid = false
    const invalidRes = calculateDerivativeChain("ln", 2, 1, -1);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.domainError).toContain("真数必须满足");

    // 合法点 x0 = 1 -> u0 = 3, y' = 2 / 3
    const validRes = calculateDerivativeChain("ln", 2, 1, 1);
    expect(validRes.isValid).toBe(true);
    expect(validRes.slope).toBeCloseTo(2 / 3, 5);
  });

  it("立方幂函数复合求导精度", () => {
    // y = (2x + 1)^3, x0 = 0 -> y'(0) = 3 * (1)^2 * 2 = 6
    const res = calculateDerivativeChain("power", 2, 1, 0);
    expect(res.isValid).toBe(true);
    expect(res.slope).toBeCloseTo(6, 5);
  });

  it("右屏推导链严格遵守代数三部曲与 LaTeX 规范", () => {
    const result = buildDerivativeChainPanel(
      { a: 2, b: 1, x0: 0.5 },
      { outerType: "exp" },
    );

    expect(result.quantities.length).toBeGreaterThan(0);
    expect(result.theorems?.length).toBeGreaterThan(0);
    expect(result.reasoningSteps?.length).toBeGreaterThan(0);

    const steps = result.reasoningSteps!;
    expect(steps[0].title).toContain("审题定法");
    expect(steps[1].title).toContain("建模联立");
    expect(steps[2].title).toContain("求解反思");

    for (const step of steps) {
      if (step.detail && step.detail.includes("x")) {
        expect(step.detail).toMatch(/\$.*?\$/);
      }
    }
  });
});
