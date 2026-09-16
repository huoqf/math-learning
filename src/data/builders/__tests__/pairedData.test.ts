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

    expect(step1?.title).toContain("识别离群点");
    expect(step2?.title).toContain("剔除异常点");
    expect(step3?.title).toContain("决定系数对比");

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
});
