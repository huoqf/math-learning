import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import "@/test/mocks";

vi.mock("@react-three/fiber", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.fiberMock;
});

vi.mock("@react-three/drei", async () => {
  const h = await import("@/test/harness/threeTestLayer");
  return h.dreiMock;
});

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

import { CombinatoricsModelsAnimation } from "@/features/combinatoricsModels/CombinatoricsModelsAnimation";
import { StatSamplingFeaturesAnimation } from "@/features/statSamplingFeatures/StatSamplingFeaturesAnimation";
import { ExpLogCompareAnimation } from "@/features/expLogCompare/ExpLogCompareAnimation";
import { FuncGrowthModelingAnimation } from "@/features/funcGrowthModeling/FuncGrowthModelingAnimation";
import { GaokaoNewDefinitionAnimation } from "@/features/gaokaoNewDefinition/GaokaoNewDefinitionAnimation";
import { NestedFuncZerosAnimation } from "@/features/nestedFuncZeros/NestedFuncZerosAnimation";
import { IneqMultivarExtremaAnimation } from "@/features/ineqMultivarExtrema/IneqMultivarExtremaAnimation";
import { ConicAsymmetricVietaAnimation } from "@/features/conicAsymmetricVieta/ConicAsymmetricVietaAnimation";
import { RecurrencePage } from "@/features/sequence/RecurrencePage";
import { ProbabilityBayesAnimation } from "@/features/probabilityBayes/ProbabilityBayesAnimation";
import { ConicLineAnimation } from "@/features/conicLine/ConicLineAnimation";
import { InequalityBasicAnimation } from "@/features/inequalityBasic/InequalityBasicAnimation";
import { ProbabilityCountingAnimation } from "@/features/probabilityCounting/ProbabilityCountingAnimation";
import { StatPercentileAnimation } from "@/features/statPercentile/StatPercentileAnimation";
import SpatialDistanceAnimation from "@/features/solidGeometry/SpatialDistanceAnimation";

function renderAtRoute(node: ReactNode, initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>{node}</MemoryRouter>,
  );
}

describe("新建 8 个 2D 实验室页面真实渲染与交互冒烟契约", () => {
  const pages: {
    name: string;
    element: () => ReactNode;
    switchTab: string;
    expectedAfterSwitch: RegExp;
  }[] = [
    {
      name: "P1-1 排列组合经典模型 (CombinatoricsModelsAnimation)",
      element: () => <CombinatoricsModelsAnimation />,
      switchTab: "插空法",
      expectedAfterSwitch: /插空/,
    },
    {
      name: "P1-2 随机抽样与数字特征 (StatSamplingFeaturesAnimation)",
      element: () => <StatSamplingFeaturesAnimation />,
      switchTab: "线性变换",
      expectedAfterSwitch: /线性变换|倍增/,
    },
    {
      name: "P1-3 指对数运算与比大小 (ExpLogCompareAnimation)",
      element: () => <ExpLogCompareAnimation />,
      switchTab: "中间值搭桥",
      expectedAfterSwitch: /中间值|搭桥/,
    },
    {
      name: "P1-4 函数增长差异与建模 (FuncGrowthModelingAnimation)",
      element: () => <FuncGrowthModelingAnimation />,
      switchTab: "分段计费",
      expectedAfterSwitch: /分段|计费/,
    },
    {
      name: "P2-1 新高考 19 题新定义 (GaokaoNewDefinitionAnimation)",
      element: () => <GaokaoNewDefinitionAnimation />,
      switchTab: "迭代不动点",
      expectedAfterSwitch: /不动点|迭代/,
    },
    {
      name: "P2-2 嵌套函数零点 (NestedFuncZerosAnimation)",
      element: () => <NestedFuncZerosAnimation />,
      switchTab: "分段嵌套",
      expectedAfterSwitch: /分段/,
    },
    {
      name: "P2-3 多元不等式最值 (IneqMultivarExtremaAnimation)",
      element: () => <IneqMultivarExtremaAnimation />,
      switchTab: "齐次比值",
      expectedAfterSwitch: /齐次/,
    },
    {
      name: "P2-4 非对称韦达与隐圆 (ConicAsymmetricVietaAnimation)",
      element: () => <ConicAsymmetricVietaAnimation />,
      switchTab: "隐圆模型",
      expectedAfterSwitch: /隐圆/,
    },
  ];

  pages.forEach(({ name, element, switchTab, expectedAfterSwitch }) => {
    it(`${name} 正常渲染三屏布局，并支持主模式交互切换`, () => {
      const { container } = renderAtRoute(element());
      expect(container.querySelector("svg")).not.toBeNull();
      expect(screen.getByText("【核心设问】")).toBeInTheDocument();

      const tabRadio = screen.getByRole("radio", { name: switchTab });
      fireEvent.click(tabRadio);
      expect(tabRadio).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getAllByText(expectedAfterSwitch).length,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("高三二轮视角 ?view=gaokao 路由扩展全链路验证", () => {
  it("RecurrencePage 在 /sequence-recurrence?view=gaokao 下同步选中新定义模式与首个预设", () => {
    renderAtRoute(<RecurrencePage />, "/sequence-recurrence?view=gaokao");
    expect(screen.getByText("新定义约束规则")).toBeInTheDocument();
    const firstPresetRadio = screen.getByRole("radio", {
      name: /新定义 · 差分等比数列/,
    });
    expect(firstPresetRadio).toHaveAttribute("aria-checked", "true");
  });

  it("ProbabilityBayesAnimation 在 /probability-bayes?view=gaokao 下保持贝叶斯模式并激活次品溯源，在条件概率路径下切入全概率 Warner", () => {
    const bayesView = renderAtRoute(
      <ProbabilityBayesAnimation />,
      "/probability-bayes?view=gaokao",
    );
    expect(
      screen.getByRole("radio", { name: "贝叶斯由果溯因" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "次品溯源" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.queryByRole("radio", { name: "Warner调查" }),
    ).not.toBeInTheDocument();
    bayesView.unmount();

    renderAtRoute(
      <ProbabilityBayesAnimation />,
      "/probability-conditional?view=gaokao",
    );
    expect(screen.getByRole("radio", { name: "全概率公式" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Warner调查" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("GaokaoNewDefinitionAnimation 在 ?view=gaokao 下默认开启聚光，点击可切换回全图亮", () => {
    renderAtRoute(
      <GaokaoNewDefinitionAnimation />,
      "/gaokao-new-definition?view=gaokao",
    );
    const toggleBtn = screen.getByRole("button", { name: "聚光开" });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByRole("button", { name: "全图亮" })).toBeInTheDocument();
  });

  it("ConicLineAnimation 在 /conic-line?view=gaokao 下默认切入中点弦模式且开启聚光", () => {
    renderAtRoute(<ConicLineAnimation />, "/conic-line?view=gaokao");
    expect(screen.getByRole("button", { name: "聚光开" })).toBeInTheDocument();
    expect(screen.getAllByText(/点差法|弦中点/).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("InequalityBasicAnimation 在 /inequality-basic?view=gaokao 下默认切入对勾函数配凑最值", () => {
    renderAtRoute(
      <InequalityBasicAnimation />,
      "/inequality-basic?view=gaokao",
    );
    expect(
      screen.getByRole("radio", { name: "对勾函数配凑最值" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("ProbabilityCountingAnimation 在 /probability-counting?view=gaokao 下默认进入赋值法求系数和", () => {
    renderAtRoute(
      <ProbabilityCountingAnimation />,
      "/probability-counting?view=gaokao",
    );
    expect(screen.getAllByText(/赋值|系数和/).length).toBeGreaterThanOrEqual(1);
  });

  it("StatPercentileAnimation 在 /stat-percentile?view=gaokao 下默认切入分层抽样与总方差", () => {
    renderAtRoute(<StatPercentileAnimation />, "/stat-percentile?view=gaokao");
    expect(
      screen.getAllByText(/总方差|分层抽样/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("SpatialDistanceAnimation 在 /solid-distance?view=gaokao 下默认进入体积最值模式且正常挂载 3D 树", () => {
    const { container } = renderAtRoute(
      <SpatialDistanceAnimation />,
      "/solid-distance?view=gaokao",
    );
    expect(
      container.querySelector('[data-testid="r3f-canvas"]'),
    ).not.toBeNull();
    expect(
      screen.getAllByText(/顶点极大值构型|体积/).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
