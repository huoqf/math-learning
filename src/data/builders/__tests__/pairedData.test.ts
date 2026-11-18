import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildPairedDataPanel } from "../pairedData";

describe("成对数据推导链与右屏面板自动化严谨性测试", () => {
  it("线性回归全预设下推导链公式应结构完整且 KaTeX 渲染无异常", () => {
    const presets = ["ad_sales", "temp_power", "ev_growth"];

    presets.forEach((scenarioKey) => {
      const data = buildPairedDataPanel(
        { targetX: 10 },
        { scenarioKey, selectedModel: "linear" },
      );

      expect(data.reasoningSteps).toBeDefined();
      expect(data.reasoningSteps?.length).toBe(3);

      data.reasoningSteps?.forEach((step) => {
        // 1. 契约保障：latex 属性必须为合法的非空 string（向下兼容）
        expect(typeof step.latex).toBe("string");
        expect(step.latex?.length).toBeGreaterThan(0);

        // 2. 新能力保障：latexBlocks 必须为非空数组
        expect(Array.isArray(step.latexBlocks)).toBe(true);
        expect(step.latexBlocks?.length).toBeGreaterThan(0);

        // 3. KaTeX 语法严谨性校验：每个 block 必须能被 katex 顺利编译，绝无语法报错
        step.latexBlocks?.forEach((block) => {
          expect(() => {
            katex.renderToString(block, {
              throwOnError: true,
              displayMode: true,
            });
          }).not.toThrow();
        });

        // 4. 答题采分点与题设说明不为空
        expect(step.rubric).toBeDefined();
        expect(step.detail).toBeDefined();
        expect(step.detail).not.toContain("x="); // 确保无裸露 x= 字符（必须为 $x = ...$）
      });
    });
  });

  it("离群点情境下推导链必须完整包含对比与清洗前后指标", () => {
    const data = buildPairedDataPanel(
      { targetX: 10 },
      { scenarioKey: "outlier", selectedModel: "linear" },
    );

    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);

    const step1 = data.reasoningSteps?.[0];
    const step2 = data.reasoningSteps?.[1];
    const step3 = data.reasoningSteps?.[2];

    expect(step1?.detail).toContain("离群");
    expect(step2?.detail).toContain("剔除异常");
    expect(step3?.detail).toContain("决定系数");

    // 校验每个步骤分块公式能成功编译
    [step1, step2, step3].forEach((step) => {
      step?.latexBlocks?.forEach((block) => {
        expect(() => {
          katex.renderToString(block, {
            throwOnError: true,
            displayMode: true,
          });
        }).not.toThrow();
      });
    });
  });

  it("非线性模型转换下各模型公式应能正确生成并合法渲染", () => {
    const models = ["exponential", "logarithmic", "power", "inverse"] as const;

    models.forEach((selectedModel) => {
      const data = buildPairedDataPanel(
        { targetX: 6 },
        { scenarioKey: "ev_growth", selectedModel },
      );

      expect(data.reasoningSteps).toBeDefined();
      expect(data.reasoningSteps?.length).toBe(3);

      data.reasoningSteps?.forEach((step) => {
        expect(typeof step.latex).toBe("string");
        expect(step.latexBlocks?.length).toBeGreaterThan(0);
        step.latexBlocks?.forEach((block) => {
          expect(() => {
            katex.renderToString(block, {
              throwOnError: true,
              displayMode: true,
            });
          }).not.toThrow();
        });
      });
    });
  });

  it("离群点情境下 quantities 显式列出清洗前后对比指标与预报值", () => {
    const data = buildPairedDataPanel(
      { targetX: 10 },
      { scenarioKey: "outlier", selectedModel: "linear" },
    );
    const predQty = data.quantities.find((q) =>
      q.label.includes("清洗后预报值"),
    );
    expect(predQty).toBeDefined();
    expect(predQty?.value).toContain("含异常点:");
    const rQty = data.quantities.find((q) => q.label.includes("相关系数"));
    expect(rQty?.value).toContain("→");
  });

  it("独立性检验 (studyMode=independence) 全模式生成有效看板与卡方公式", () => {
    // 1. 标准预设情景
    const std = buildPairedDataPanel(
      { scaleMultiplier: 1 },
      { studyMode: "independence", indPresetKey: "0", activeTab: "standard" },
    );
    expect(std.reasoningSteps).toHaveLength(3);
    expect(std.quantities.some((q) => q.symbol === "\\chi^2")).toBe(true);

    // 2. 样本倍增情景（10倍扩大后卡方严格放大 10 倍，且展示样本倍增高考要点）
    const baseChi = Number(
      std.quantities.find((q) => q.symbol === "\\chi^2")?.value ?? "0",
    );
    const scaled = buildPairedDataPanel(
      { scaleMultiplier: 10 },
      { studyMode: "independence", indPresetKey: "0", activeTab: "scale" },
    );
    expect(scaled.quantities.find((q) => q.symbol === "n")?.value).toContain(
      "10×",
    );
    const scaledChi = Number(
      scaled.quantities.find((q) => q.symbol === "\\chi^2")?.value ?? "0",
    );
    expect(scaledChi).toBeCloseTo(baseChi * 10, 2);
    expect(
      scaled.gaokaoPoints?.some((g) => g.text.includes("样本量倍增效应")),
    ).toBe(true);

    // 3. 自由探索下 ad - bc = 0 完全独立退化检验
    const zeroInd = buildPairedDataPanel(
      { freqA: 20, freqB: 30, freqC: 20, freqD: 30, scaleMultiplier: 1 },
      {
        studyMode: "independence",
        indPresetKey: "free",
        activeTab: "standard",
      },
    );
    expect(
      zeroInd.quantities.find((q) => q.symbol === "|ad - bc|")?.value,
    ).toBe("0");
    expect(zeroInd.quantities.find((q) => q.symbol === "\\chi^2")?.value).toBe(
      "0.000",
    );
    expect(
      zeroInd.theorems.some((t) => t.name.includes("零假设独立充要条件定理")),
    ).toBe(true);
  });
});
