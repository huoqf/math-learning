import { describe, it, expect } from "vitest";
import { buildClassicalProbabilityPanel } from "../probabilityClassical";
import { DEFAULT_CLASSICAL_PARAMS } from "../../registries/probabilityClassical";

describe("古典概型右屏看板生成器 (buildClassicalProbabilityPanel)", () => {
  it("默认参数生成完整 MathPanelData，包含特征量、定理、考点与推导链", () => {
    const panel = buildClassicalProbabilityPanel(DEFAULT_CLASSICAL_PARAMS);

    expect(panel.quantities.length).toBeGreaterThanOrEqual(4);
    const nOmega = panel.quantities.find((q) => q.symbol === "n(\\Omega)");
    expect(nOmega?.value).toBe("36");

    const pA = panel.quantities.find((q) => q.symbol === "P(A)");
    expect(pA?.value).toContain("\\frac{1}{6}");

    expect(panel.theorems.length).toBe(4);
    expect(panel.theorems.some((t) => t.name.includes("两大概征"))).toBe(true);

    expect(panel.gaokaoPoints?.length).toBe(2);

    expect(panel.reasoningSteps?.length).toBe(4);
    expect(panel.reasoningSteps?.map((s) => s.step)).toEqual([1, 2, 3, 4]);
  });

  it("摸球抽样与选人模型特征量正确更新", () => {
    const ballPanel = buildClassicalProbabilityPanel({
      modelType: "ball_draw",
      targetEvent: "at_least_one_red",
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
    });
    const nOmegaBall = ballPanel.quantities.find(
      (q) => q.symbol === "n(\\Omega)",
    );
    expect(nOmegaBall?.value).toBe("20");

    const volPanel = buildClassicalProbabilityPanel({
      modelType: "gaokao_volunteer",
      targetEvent: "at_least_one_girl",
    });
    const nOmegaVol = volPanel.quantities.find(
      (q) => q.symbol === "n(\\Omega)",
    );
    expect(nOmegaVol?.value).toBe("10");
  });

  it("全场景无 NaN / undefined 字段且文本数学符号均合规包裹", () => {
    const panel = buildClassicalProbabilityPanel({
      modelType: "coin_toss",
      targetEvent: "two_heads",
    });

    panel.quantities.forEach((q) => {
      expect(q.value).not.toContain("NaN");
      expect(q.value).not.toContain("undefined");
    });

    panel.theorems.forEach((t) => {
      expect(t.latex).toBeTruthy();
      expect(t.note).not.toContain("NaN");
    });

    panel.reasoningSteps?.forEach((step) => {
      expect(step.latex).toBeTruthy();
      expect(step.detail).not.toContain("NaN");
    });
  });

  it("Step 3 规范列出具体样本点集合且 Step 4 杜绝重复等号", () => {
    const volPanel = buildClassicalProbabilityPanel({
      modelType: "gaokao_volunteer",
      targetEvent: "at_least_one_girl",
    });

    const step3 = volPanel.reasoningSteps?.find((s) => s.step === 3);
    expect(step3?.latex).toContain("A = \\{");
    expect(step3?.detail).toContain("A = \\{");

    const step4 = volPanel.reasoningSteps?.find((s) => s.step === 4);
    // 7/10 时不得出现 \frac{7}{10} = \frac{7}{10}
    expect(step4?.latex).not.toContain("= \\frac{7}{10} = \\frac{7}{10}");
    expect(step4?.latex).toBe(
      "P(A) = \\frac{n(A)}{n(\\Omega)} = \\frac{7}{10}",
    );
  });
});
