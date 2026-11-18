import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildStatPercentilePanel } from "../statPercentile";

describe("statPercentile 右屏看板生成测试 (buildStatPercentilePanel)", () => {
  it("histogram 模式：正确输出直方图特征量、三步推导链与双峰兼容", () => {
    const data = buildStatPercentilePanel(
      { groupCount: 6, shift: 0.6, percentileP: 50 },
      { studyMode: "histogram", activeScenario: "rightSkewed" },
    );

    expect(data.quantities.length).toBeGreaterThanOrEqual(6);
    expect(data.theorems.length).toBe(3);
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.warnings?.length).toBeGreaterThan(0);

    // 验证偏态结论为正偏态
    const skewItem = data.quantities.find((q) => q.label.includes("偏态"));
    expect(skewItem?.value).toContain("正偏态");

    // 验证所有公式均可被 KaTeX 正常解析
    for (const step of data.reasoningSteps ?? []) {
      if (step.latex) {
        expect(() => katex.renderToString(step.latex!)).not.toThrow();
      }
    }
    for (const th of data.theorems) {
      expect(() => katex.renderToString(th.latex)).not.toThrow();
    }

    // 双峰模式：众数应披露多个并列组中值
    const bimodalData = buildStatPercentilePanel(
      { groupCount: 6, shift: 999 },
      { studyMode: "histogram", activeScenario: "bimodal" },
    );
    const modeItem = bimodalData.quantities.find((q) =>
      q.label.includes("众数"),
    );
    expect(modeItem?.value).toContain("与");
  });

  it("cumulative 模式：输出线性插值公式、四分位距 IQR 与推导链", () => {
    const data = buildStatPercentilePanel(
      { groupCount: 6, shift: 0, percentileP: 25 },
      { studyMode: "cumulative", activeScenario: "q1" },
    );

    expect(data.quantities.some((q) => q.label.includes("下四分位数"))).toBe(
      true,
    );
    expect(data.quantities.some((q) => q.label.includes("四分位距 IQR"))).toBe(
      true,
    );
    expect(data.reasoningSteps?.length).toBe(3);
    for (const step of data.reasoningSteps ?? []) {
      if (step.latex) {
        expect(() => katex.renderToString(step.latex!)).not.toThrow();
      }
    }
  });

  it("stratified 模式：两层合并与三层均给出准确均值及方差分解公式", () => {
    const twoStrata = buildStatPercentilePanel(
      {
        sampleN: 80,
        N1: 400,
        N2: 600,
        N3: 0,
        mean1: 70,
        mean2: 85,
        var1: 25,
        var2: 36,
        var3: 0,
      },
      { studyMode: "stratified", activeScenario: "twoStrata" },
    );

    const meanQ = twoStrata.quantities.find((q) =>
      q.label.includes("总体加权均值"),
    );
    // 0.4*70 + 0.6*85 = 28 + 51 = 79.00
    expect(meanQ?.value).toBe("79.00");
    expect(twoStrata.reasoningSteps?.length).toBe(3);
    for (const step of twoStrata.reasoningSteps ?? []) {
      if (step.latex) {
        expect(() => katex.renderToString(step.latex!)).not.toThrow();
      }
    }
  });
});
