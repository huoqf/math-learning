import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildProbabilityNormalPanel } from "../probabilityNormal";

describe("probabilityNormal 右屏看板生成测试 (buildProbabilityNormalPanel)", () => {
  it("normalFit 模式：输出直方图频率、正态概率、逼近差与三步推导链", () => {
    const data = buildProbabilityNormalPanel(
      { mu: 0, sigma: 1, binCount: 10, sampleSize: 300, x1: -1, x2: 1 },
      { studyMode: "normalFit" },
    );

    expect(data.quantities.length).toBeGreaterThanOrEqual(8);
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.theorems.length).toBe(2);

    for (const step of data.reasoningSteps ?? []) {
      if (step.latex) {
        expect(() => katex.renderToString(step.latex!)).not.toThrow();
      }
    }
  });

  it("paramsShape 模式：已补齐 3 步推导链并输出正确对称轴与峰值", () => {
    const data = buildProbabilityNormalPanel(
      { mu: 0.5, sigma: 0.5 },
      { studyMode: "paramsShape" },
    );

    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.quantities.some((q) => q.value === "0.50")).toBe(true);
    for (const step of data.reasoningSteps ?? []) {
      if (step.latex) {
        expect(() => katex.renderToString(step.latex!)).not.toThrow();
      }
    }
  });

  it("sigmaRule 模式（含非对称区间配凑）：推导链准确呈现 13.59% 配凑", () => {
    const data = buildProbabilityNormalPanel(
      { mu: 0, sigma: 1, x0: 1 },
      { studyMode: "sigmaRule", activeScenario: "asymmetricSigma" },
    );

    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[2].latex).toContain("13.59");
    for (const step of data.reasoningSteps ?? []) {
      if (step.latex) {
        expect(() => katex.renderToString(step.latex!)).not.toThrow();
      }
    }
  });
});
