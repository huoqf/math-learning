import { describe, it, expect } from "vitest";
import { buildQuantifiersPanel } from "../quantifiersBuilder";

describe("buildQuantifiersPanel 量词数据看板构建测试", () => {
  it("单变量全称量词模式面板数据生成", () => {
    const params = {
      k: 1.0,
      h: 0.0,
      v: 1.0,
      intMin: -2.0,
      intMax: 2.0,
      threshold: 0.0,
      probeX: 0.0,
    };

    const panelData = buildQuantifiersPanel(params, {
      activeTab: "universal",
    });

    expect(panelData.quantities.length).toBe(5);
    const truthQ = panelData.quantities.find((q) => q.label === "原命题真假");
    expect(truthQ?.value).toContain("真");

    expect(panelData.theorems.length).toBe(2);
    expect(panelData.gaokaoPoints.length).toBe(3);
  });

  it("单变量存在量词模式面板数据生成", () => {
    const params = {
      k: 1.0,
      h: 0.0,
      v: 2.0,
      intMin: -2.0,
      intMax: 2.0,
      threshold: 0.0,
      probeX: 0.0,
    };

    const panelData = buildQuantifiersPanel(params, {
      activeTab: "existential",
    });

    const truthQ = panelData.quantities.find((q) => q.label === "原命题真假");
    expect(truthQ?.value).toContain("假");
  });

  it("双变量博弈模型面板数据生成", () => {
    const params = {
      k: 1.0,
      h: 0.0,
      v: 5.0,
      intMin: 0.0,
      intMax: 2.0,
      k2: -1.0,
      h2: 0.0,
      v2: 3.0,
      int2Min: 0.0,
      int2Max: 2.0,
    };

    const panelData = buildQuantifiersPanel(params, {
      activeTab: "dual",
      dualScenario: "all_all",
    });

    expect(panelData.theorems[0].name).toContain("∀x₁ ∀x₂ 恒成立模型");
    const truthQ = panelData.quantities.find((q) => q.label === "博弈命题判定");
    expect(truthQ?.value).toContain("真命题");
  });

  it("区间端点倒置时触发警告提示", () => {
    const params = {
      k: 1.0,
      h: 0.0,
      v: 1.0,
      intMin: 2.0,
      intMax: -2.0,
      threshold: 0.0,
      probeX: 0.0,
    };

    const panelData = buildQuantifiersPanel(params, {
      activeTab: "universal",
    });

    expect(panelData.warnings?.length).toBeGreaterThan(0);
    expect(panelData.warnings?.[0].text).toContain("左端点需严格小于右端点");
  });
});
