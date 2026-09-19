import { describe, it, expect } from "vitest";
import { buildProbabilityEventsPanel } from "../probabilityEvents";

describe("随机事件与概率基本性质右屏看板测试 (buildProbabilityEventsPanel)", () => {
  it("连续 Venn 模式：正确生成特征量与推导链", () => {
    const data = buildProbabilityEventsPanel(
      { pA: 0.4, pB: 0.5, overlapRatio: 0.5 },
      { activeMode: "venn" },
    );
    expect(data.quantities.length).toBeGreaterThan(0);
    expect(data.theorems.length).toBeGreaterThan(0);
    expect(data.reasoningSteps?.length).toBe(3);
    const qA = data.quantities.find((q) => q.symbol === "P(A)");
    expect(qA?.value).toBe("0.40");
  });

  it("离散点阵模式：正确计算 36 个基本事件计数与比值", () => {
    const data = buildProbabilityEventsPanel(
      { dicePresetA: "sum_even", dicePresetB: "same_points" },
      { activeMode: "discrete" },
    );
    expect(data.quantities.length).toBeGreaterThan(0);
    const qTotal = data.quantities.find((q) => q.symbol === "n(Ω)");
    expect(qTotal?.value).toBe("36");
    const qUnion = data.quantities.find((q) => q.symbol === "P(A ∪ B)");
    expect(qUnion?.value).toContain("/36");
  });

  it("包含关系情景：推导链闭环输出差事件 P(B-A)", () => {
    const data = buildProbabilityEventsPanel(
      { pA: 0.25, pB: 0.65, overlapRatio: 1.0 },
      { activeMode: "venn" },
    );
    expect(data.reasoningSteps?.[1].latex).toContain("P(B - A) = P(B) - P(A)");
    expect(data.reasoningSteps?.[2].latex).toContain("0.40");
  });

  it("概率之和大于1且重叠度接近0时，看板触发安全警告", () => {
    const data = buildProbabilityEventsPanel(
      { pA: 0.7, pB: 0.8, overlapRatio: 0.0 },
      { activeMode: "venn" },
    );
    expect(data.warnings?.length).toBeGreaterThan(0);
    expect(data.warnings?.[0].text).toContain("必然相交无法互斥");
  });
});
