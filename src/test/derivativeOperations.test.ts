import { describe, it, expect } from "vitest";
import { calculateDerivativeOperation } from "@/math/derivativeOperations";
import { buildDerivativeOperationsPanel } from "@/data/builders/derivativeOperations";

describe("导数四则运算法则数学层与组装层契约", () => {
  it("积法则数学计算与导数莱布尼茨公式精确吻合", () => {
    // modelPair "poly_trig": f(x) = x, g(x) = sin x
    // f'(x) = 1, g'(x) = cos x
    // [fg]' = 1 * sin x + x * cos x
    const x0 = 1.0;
    const res = calculateDerivativeOperation("multiply", x0, 0.05, "poly_trig");

    expect(res.isValid).toBe(true);
    expect(res.fx).toBeCloseTo(1.0, 5);
    expect(res.fpx).toBeCloseTo(1.0, 5);
    expect(res.gx).toBeCloseTo(Math.sin(1.0), 5);
    expect(res.gpx).toBeCloseTo(Math.cos(1.0), 5);

    const expectedProductPrime = 1 * Math.sin(1.0) + 1.0 * Math.cos(1.0);
    expect(res.combinedSlope).toBeCloseTo(expectedProductPrime, 5);
  });

  it("商法则正确计算且具备分母防除零保护", () => {
    const x0 = 1.0;
    const res = calculateDerivativeOperation("divide", x0, 0.01, "poly_exp");
    expect(res.isValid).toBe(true);

    // f = x^2, g = e^x
    // (f/g)' = (2x e^x - x^2 e^x) / e^(2x) = (2 - x) / e^x
    const expected = (2 - 1.0) / Math.exp(1.0);
    expect(res.combinedSlope).toBeCloseTo(expected, 5);
  });

  it("面积微元矩形模型满足增量分解公式", () => {
    const x0 = 1.5;
    const dx = 0.1;
    const res = calculateDerivativeOperation("multiply", x0, dx, "poly_trig");

    // 验证积法则面积微元主部与高阶小量分解:
    // areaMain1: u * Δv
    // areaMain2: v * Δu
    // areaHigher: Δu * Δv
    expect(res.areaMain1).toBeCloseTo(res.rectU * res.deltaV, 5);
    expect(res.areaMain2).toBeCloseTo(res.rectV * res.deltaU, 5);
    expect(res.areaHigher).toBeCloseTo(res.deltaU * res.deltaV, 5);
  });

  it("右屏推导链必须遵循代数三部曲并包含规范 LaTeX", () => {
    const result = buildDerivativeOperationsPanel(
      { x0: 1.0, deltaX: 0.05 },
      { opType: "multiply", modelPair: "poly_trig" },
    );

    expect(result.quantities.length).toBeGreaterThan(0);
    expect(result.theorems?.length).toBeGreaterThan(0);
    expect(result.reasoningSteps?.length).toBeGreaterThan(0);

    // 验证推导链三部曲
    const steps = result.reasoningSteps!;
    expect(steps[0].title).toContain("审题定法");
    expect(steps[1].title).toContain("建模联立");
    expect(steps[2].title).toContain("求解反思");

    // 验证文本字段数学符号包裹 $...$
    for (const step of steps) {
      if (
        step.detail &&
        (step.detail.includes("x") ||
          step.detail.includes("u") ||
          step.detail.includes("v"))
      ) {
        expect(step.detail).toMatch(/\$.*?\$/);
      }
    }
  });

  it("商法则在分母为零时安全退化且绝不泄漏 NaN 文本", () => {
    // x0 = 0 时，sin(0) = 0 产生除零
    const panel = buildDerivativeOperationsPanel(
      { x0: 0, deltaX: 0.2 },
      { opType: "divide", modelPair: "poly_trig" },
    );

    // quantities 必须渲染为无定义，不能有 NaN
    const slopeQty = panel.quantities.find((q) => q.symbol === "H'(x_0)");
    expect(slopeQty?.value).toBe("无定义");

    // warnings 必须标明危险
    expect(panel.warnings.some((w) => w.text.includes("分母"))).toBe(true);

    // 推导链 step 2 和 step 3 绝不包含 "NaN"
    panel.reasoningSteps?.forEach((step) => {
      expect(step.detail).not.toContain("NaN");
      expect(step.latex).not.toContain("NaN");
    });
  });
});
