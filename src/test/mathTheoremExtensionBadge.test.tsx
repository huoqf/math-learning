import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

import { MathTheoremSection } from "@/components/UI/mathPanel/MathTheoremSection";
import { buildProbabilityDistributionPanel } from "@/data/builders/probabilityDistribution";
import { buildProbabilityBayesPanel } from "@/data/builders/probabilityBayes";

/**
 * 回归防线（来源：概率统计模块审计 · 决策项 3.2「syllabus.status 徽标下沉到条目级」）：
 *
 * 背景：右屏「核心定理与公式模型」此前只能靠定理**名称**里手写
 * 「（拓展 · 超出课标）」来表达超纲属性，属于隐式标注——
 *   1. 条目被复用或改名，超纲属性即静默丢失；
 *   2. 学生在同一张卡片上看到「拓展」二字写在标题里，容易误认为是要背的正文。
 *
 * 本测试把「条目级显式声明 → 自动渲染紫色拓展徽标」变成机器可裁决项，
 * 同时守住两件事：正文条目不得被反向污染出拓展徽标；拓展条目不得再靠名称标注。
 */

const EXTEND_HINT = /拓展|选学|超出课标/;

describe("右屏定理卡片 · 条目级拓展徽标", () => {
  it("isExtension 为真时渲染默认「拓展 · 选学」徽标", () => {
    render(
      <MathTheoremSection
        theorems={[
          {
            name: "贝叶斯公式",
            latex: "P(A|B) = \\frac{P(AB)}{P(B)}",
            level: "supplementary",
            isExtension: true,
          },
        ]}
      />,
    );
    expect(screen.getByText("拓展 · 选学")).toBeInTheDocument();
    // 与既有的 level 徽标正交共存，二者互不吞并
    expect(screen.getByText("补充结论")).toBeInTheDocument();
  });

  it("extensionBadge 可自定义为「拓展 · 超出课标」", () => {
    render(
      <MathTheoremSection
        theorems={[
          {
            name: "大样本二项逼近",
            latex: "N \\gg n",
            isExtension: true,
            extensionBadge: "拓展 · 超出课标",
          },
        ]}
      />,
    );
    expect(screen.getByText("拓展 · 超出课标")).toBeInTheDocument();
    expect(screen.queryByText("拓展 · 选学")).not.toBeInTheDocument();
  });

  it("未声明 isExtension 的课标正文条目不得出现任何拓展徽标", () => {
    render(
      <MathTheoremSection
        theorems={[
          { name: "二项分布的期望", latex: "E(X) = np", level: "core" },
        ]}
      />,
    );
    expect(screen.queryByText(/拓展\s*·/)).not.toBeInTheDocument();
    expect(screen.getByText("核心定理")).toBeInTheDocument();
  });
});

describe("拓展条目必须走条目级声明，不得再把标记写进定理名称", () => {
  it("超几何/二项逼近两条拓展定理已改为 isExtension + 徽标文案", () => {
    const panel = buildProbabilityDistributionPanel(
      { compareN: 30, compareP: 0.35, compareSampleN: 4 },
      { studyMode: "compare" },
    );
    const extensions = panel.theorems.filter((t) => t.isExtension === true);
    expect(extensions.length).toBeGreaterThan(0);
    for (const t of extensions) {
      expect(t.extensionBadge ?? "").toMatch(EXTEND_HINT);
      // 名称里不再手写「（拓展 · 超出课标）」——超纲属性由结构化字段承载
      expect(t.name).not.toMatch(EXTEND_HINT);
    }
  });

  it("贝叶斯公式（选学拓展）已改为条目级声明", () => {
    const panel = buildProbabilityBayesPanel({}, { activeMode: "bayes" });
    const theorem = panel.theorems.find((t) => t.name.includes("贝叶斯公式"));
    expect(theorem).toBeDefined();
    expect(theorem?.isExtension).toBe(true);
    expect(theorem?.name).not.toMatch(EXTEND_HINT);
  });
});
