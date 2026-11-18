import { describe, it, expect } from "vitest";
import { buildProbabilityBayesPanel } from "../probabilityBayes";
import {
  BAYES_ANSWER_STEPS,
  defaultParams,
} from "@/data/registries/probabilityBayes";

describe("条件概率、全概率与贝叶斯看板生成器 (buildProbabilityBayesPanel)", () => {
  it("条件概率模式：四预设情景与 P(A)=0 退化状态返回合规看板", () => {
    for (const condScenario of [
      "independent",
      "exclusive",
      "correlated",
      "free",
    ] as const) {
      const panel = buildProbabilityBayesPanel(
        { ...defaultParams },
        { activeMode: "conditional", condScenario },
      );
      expect(panel.quantities.length).toBeGreaterThanOrEqual(4);
      expect(panel.theorems.length).toBeGreaterThanOrEqual(2);
      expect(panel.reasoningSteps?.map((s) => s.step)).toEqual(
        BAYES_ANSWER_STEPS.map((s) => s.step),
      );
    }

    const degeneratePanel = buildProbabilityBayesPanel(
      { pA: 0, pB: 0.4, pAB: 0 },
      { activeMode: "conditional", condScenario: "free" },
    );
    expect(degeneratePanel.warnings?.some((w) => w.level === "danger")).toBe(
      true,
    );
    expect(degeneratePanel.reasoningSteps?.[1]?.latex).toContain("无意义");
  });

  it("全概率模式：三车间暴露 P(A_i|B) 后验归因，Warner 模式退化点准确预警", () => {
    const factoryPanel = buildProbabilityBayesPanel(
      {
        pA1: 0.5,
        pA2: 0.3,
        pB_A1: 0.04,
        pB_A2: 0.03,
        pB_A3: 0.02,
      },
      { activeMode: "total_prob", totalScenario: "factory3" },
    );
    expect(factoryPanel.quantities.some((q) => q.symbol === "P(A_1|B)")).toBe(
      true,
    );
    expect(factoryPanel.quantities.some((q) => q.symbol === "P(A_2|B)")).toBe(
      true,
    );
    expect(factoryPanel.quantities.some((q) => q.symbol === "P(A_3|B)")).toBe(
      true,
    );

    const warnerDegenerate = buildProbabilityBayesPanel(
      { pCard: 0.5, pReportYes: 0.5 },
      { activeMode: "total_prob", totalScenario: "warner" },
    );
    expect(warnerDegenerate.warnings?.[0]?.level).toBe("danger");
    expect(
      warnerDegenerate.quantities.find((q) => q.symbol === "p_{\\text{real}}")
        ?.value,
    ).toBe("退化无法解出");
  });

  it("贝叶斯模式：显式声明选学拓展 isExtension=true 且计算阳性误报稀释比率", () => {
    const bayesPanel = buildProbabilityBayesPanel(
      { pPriorD: 0.01, pSensitivity: 0.95, pFalsePositive: 0.05 },
      { activeMode: "bayes", bayesScenario: "screening" },
    );
    const bayesTheorem = bayesPanel.theorems.find(
      (t) => t.name === "贝叶斯公式",
    );
    expect(bayesTheorem?.isExtension).toBe(true);
    expect(bayesTheorem?.extensionBadge).toContain("拓展");
    expect(bayesPanel.quantities.some((q) => q.symbol === "P(D|+)")).toBe(true);
    expect(bayesPanel.warnings?.length).toBeGreaterThan(0);
  });
});
