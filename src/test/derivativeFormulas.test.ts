/**
 * 基本初等函数求导公式模块单元测试与看板契约测试
 */
import { describe, it, expect } from "vitest";
import { calculateDerivativeFormula } from "@/math/derivativeFormulas";
import { buildDerivativeFormulasPanel } from "@/data/builders/derivativeFormulas";
import { buildMathQuantities } from "@/data/mathQuantities";

describe("基本初等函数求导领域模型测试 (math/derivativeFormulas)", () => {
  it("常数函数求导恒为 0", () => {
    const res = calculateDerivativeFormula("constant", 2.0, 0.5, 5.0);
    expect(res.fx0).toBe(5.0);
    expect(res.fpx0).toBe(0);
    expect(res.secantSlope).toBe(0);
    expect(res.derivativeLatex).toContain("f'(x) = 0");
  });

  it("幂函数 y = x^2 与 y = x^3 求导及割线逼近切线", () => {
    // f(x) = x^2 在 x0 = 2 处：f'(2) = 4
    const res = calculateDerivativeFormula("power", 2.0, 0.1, 2.0);
    expect(res.fx0).toBe(4.0);
    expect(res.fpx0).toBe(4.0);
    // 割线斜率 (2.1^2 - 4) / 0.1 = (4.41 - 4)/0.1 = 4.1
    expect(res.secantSlope).toBeCloseTo(4.1, 4);
    expect(res.slopeDiff).toBeCloseTo(0.1, 4);

    // 当 Δx 缩小时，逼近差进一步缩小
    const resTiny = calculateDerivativeFormula("power", 2.0, 0.001, 2.0);
    expect(resTiny.slopeDiff).toBeLessThan(0.002);
  });

  it("正弦与余弦导数关系验证", () => {
    const resSin = calculateDerivativeFormula("sin", Math.PI / 6, 0.1);
    // (sin x)' = cos x => cos(π/6) = √3/2 ≈ 0.8660
    expect(resSin.fpx0).toBeCloseTo(Math.sqrt(3) / 2, 4);

    const resCos = calculateDerivativeFormula("cos", Math.PI / 3, 0.1);
    // (cos x)' = -sin x => -sin(π/3) = -√3/2 ≈ -0.8660
    expect(resCos.fpx0).toBeCloseTo(-Math.sqrt(3) / 2, 4);
  });

  it("指数函数与对数函数导数验证", () => {
    // f(x) = e^x
    const resExp = calculateDerivativeFormula("exp", 1.0, 0.05, Math.E);
    expect(resExp.fpx0).toBeCloseTo(Math.E, 4);

    // f(x) = ln x 在 x0 = 2 处导数为 1/2 = 0.5
    const resLog = calculateDerivativeFormula("log", 2.0, 0.05, Math.E);
    expect(resLog.fpx0).toBeCloseTo(0.5, 4);
  });
});

describe("基本初等函数求导看板契约与三屏闭环 (builders/derivativeFormulas)", () => {
  it("右屏面板导出完整看板量与推导链三部曲", () => {
    const panel = buildDerivativeFormulasPanel(
      { x0: 2.0, deltaX: 0.5, paramA: 2.0 },
      { funcType: "power" },
    );

    expect(panel.quantities.length).toBeGreaterThanOrEqual(6);
    expect(panel.theorems.length).toBeGreaterThanOrEqual(2);
    expect(panel.gaokaoPoints.length).toBeGreaterThanOrEqual(2);
    expect(panel.reasoningSteps).toBeDefined();
    expect(panel.reasoningSteps?.length).toBe(3);

    // 验证推导链三要素闭环
    expect(panel.reasoningSteps?.[0].title).toContain("审题定法");
    expect(panel.reasoningSteps?.[1].title).toContain("建模联立");
    expect(panel.reasoningSteps?.[2].title).toContain("求解反思");

    // 严禁孤立数值，必须包含公式与分步赋分
    panel.reasoningSteps?.forEach((step) => {
      expect(step.rubric).toBeDefined();
      expect(step.latex).toBeDefined();
    });
  });

  it("通过 buildMathQuantities 统一分流正确接入", () => {
    const panel = buildMathQuantities(
      "anim-derivative-formulas",
      { x0: 1.0, deltaX: 0.5, paramA: Math.E },
      { funcType: "exp" },
    );
    expect(panel.theorems.some((t) => t.name.includes("导数公式全表"))).toBe(
      true,
    );
    expect(panel.mnemonic).toContain("常导为零幂降次");
  });
});
