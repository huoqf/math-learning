import { describe, it, expect } from "vitest";
import { buildProbabilityIndependencePanel } from "../probabilityIndependence";
import { DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS } from "@/data/registries/probabilityIndependence";

describe("buildProbabilityIndependencePanel 单元测试", () => {
  it("使用默认参数能构建完整右屏看板数据", () => {
    const data = buildProbabilityIndependencePanel(
      DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS,
    );
    expect(data.quantities.length).toBeGreaterThan(0);
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.theorems.length).toBeGreaterThan(0);
    expect(data.gaokaoPoints.length).toBeGreaterThan(0);
    expect(data.mnemonic).toBeTruthy();
  });

  it("在互斥状态下能正确发出预警", () => {
    const data = buildProbabilityIndependencePanel({
      pA: 0.4,
      pB: 0.5,
      overlapRatio: 0,
      activeMode: "venn",
    });
    expect(data.warnings?.some((w) => w.text.includes("互斥不独立"))).toBe(
      true,
    );
  });

  it("在离散骰子模式下能正确输出样本点特征量", () => {
    const data = buildProbabilityIndependencePanel({
      activeMode: "discrete",
      dicePresetA: "even",
      dicePresetB: "le4",
    });
    expect(data.quantities.some((q) => q.label.includes("事件 A"))).toBe(true);
    expect(data.reasoningSteps?.[0]?.step).toBe(1);
  });
});
