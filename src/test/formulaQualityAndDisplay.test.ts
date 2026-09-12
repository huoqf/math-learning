import { describe, it, expect } from "vitest";
import {
  extractLatexLines,
  findOptimalSplit,
} from "@/components/UI/latexUtils";
import { buildConicLineMathQuantities } from "@/data/builders/conicLine";

describe("KatexFormula多行解构与排版引擎测试", () => {
  it("正确解构\\begin{aligned}包裹的多行公式", () => {
    const aligned =
      "\\begin{aligned} & (b^2+a^2k^2)x^2 + 2a^2kmx + a^2(m^2-b^2) = 0 \\\\ & 13x^2 - 36 = 0 \\end{aligned}";
    const lines = extractLatexLines(aligned);
    expect(lines).not.toBeNull();
    expect(lines?.length).toBe(2);
    expect(lines?.[0]).toContain("(b^2+a^2k^2)x^2");
    expect(lines?.[1]).toBe("13x^2 - 36 = 0");
  });

  it("正确解构顶层带\\\\的多行公式", () => {
    const twoLines = "\\Delta = 1872 > 0 \\\\ x_1 + x_2 = 0";
    const lines = extractLatexLines(twoLines);
    expect(lines).not.toBeNull();
    expect(lines?.length).toBe(2);
    expect(lines?.[0]).toBe("\\Delta = 1872 > 0");
    expect(lines?.[1]).toBe("x_1 + x_2 = 0");
  });

  it("保持cases与matrix等不可拆环境为单体", () => {
    const cases = "\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}";
    const lines = extractLatexLines(cases);
    expect(lines).toBeNull();
  });

  it("单行普通公式不被extractLatexLines拆分，交由findOptimalSplit语义断行", () => {
    const single = "y = 2x + 1";
    expect(extractLatexLines(single)).toBeNull();

    const longImplies =
      "(b^2+a^2k^2)x^2 + 2a^2kmx + C = 0 \\implies 13x^2 - 36 = 0";
    const split = findOptimalSplit(longImplies);
    expect(split).not.toBeNull();
    expect(split?.[1]).toContain("\\implies");
  });
});

describe("圆锥曲线右屏推导步骤高中答题规范检验", () => {
  const conicTypes = ["ellipse", "hyperbola", "parabola"] as const;
  const studyModes = ["general", "focus", "midpoint", "polePolar"] as const;

  it("12组模式全覆盖下，每一步推导链严禁跳步且公式字符长度严格受控", () => {
    for (const conicType of conicTypes) {
      for (const studyMode of studyModes) {
        const params = {
          conicType,
          studyMode,
          a: 3,
          b: 2,
          p: 2,
          k: 1,
          m: 0,
          theta: 60,
          midpointX: 1,
          midpointY: 1,
          poleX: 4,
          poleY: 2,
        };

        const data = buildConicLineMathQuantities(params as any, {
          conicType,
          studyMode,
        });
        expect(data.reasoningSteps).toBeDefined();
        const steps = data.reasoningSteps!;
        expect(steps.length).toBeGreaterThanOrEqual(3);

        steps.forEach((step) => {
          // 1. 标题严禁包含裸LaTeX或空泛文字
          expect(step.title).toMatch(/^(审题|建模|求解)/);

          // 2. detail 必须包含内联数学符号 $...$
          expect(step.detail).toContain("$");

          // 3. latex 视窗中若有多行必须使用规范\\\\，且每一行字符数严禁超过55以杜绝超宽截断
          if (step.latex) {
            const rawLines = step.latex.split(/\\\\/);
            for (const line of rawLines) {
              const cleaned = line.replace(/\\[a-zA-Z]+/g, "").trim();
              expect(cleaned.length).toBeLessThanOrEqual(55);
            }
          }
        });
      }
    }
  });
});
