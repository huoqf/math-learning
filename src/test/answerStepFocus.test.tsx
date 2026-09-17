import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

import { StepNavigator } from "@/components/UI/StepNavigator";
import { MathPanel } from "@/components/UI/MathPanel";
import { MarkovScene } from "@/features/probabilityMarkov/components/MarkovScene";
import { IndependenceScene } from "@/features/pairedData/components/IndependenceScene";
import { buildProbabilityMarkovPanel } from "@/data/builders/probabilityMarkov";
import { buildPairedDataPanel } from "@/data/builders/pairedData";
import {
  MARKOV_ANSWER_STEPS,
  defaultParams as markovDefaultParams,
} from "@/data/registries/probabilityMarkov";
import {
  INDEPENDENCE_ANSWER_STEPS,
  defaultParams as pairedDefaultParams,
} from "@/data/registries/pairedData";

/**
 * 回归防线（来源：概率统计模块审计 · 决策项 3.1「分步作答闭环」）。
 *
 * 分步作答闭环由三方共同构成，任何一方独自改动都会让学生看到"左屏点第 3 步、
 * 右屏却高亮第 1 张卡片"这种自相矛盾的教具。因此这里把三件事全部变成机器可裁决项：
 *
 *   1. 左屏 `StepNavigator` —— 1 起步号语义、边界禁用、点击跳转；
 *   2. 右屏 `MathPanel`      —— focusStep 只派发给命中的区块（theorems / reasoning），
 *                              绝不两处同时描边；
 *   3. 中屏 Scene            —— 第 N 步只点亮第 N 块图元，其余压暗，并给出当前步围栏；
 *   4. 三方数据的单一来源（SSOT）—— builder 的步号与标题必须逐条等于注册表里的链条。
 */

const fontScale = (v: number) => v;
const FRAME_SELECTOR = 'rect[stroke-dasharray="7 4"]';

/** 收集中屏分区容器的亮度（DOM 顺序 = 左上半区 / 左下半区（或右上）/ 右视窗（或下半）） */
function regionOpacities(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("g[opacity]")).map(
    (g) => g.getAttribute("opacity") ?? "",
  );
}

/**
 * Scene 组件只返回 SVG 片段（无根 <svg>，由中屏画布承载），
 * 因此这里必须套在 <svg> 内渲染——否则 React 判定不了命名空间，
 * 会把 <g>/<rect> 当成未知 HTML 标签并逐条告警。
 */
function renderInSvg(node: ReactNode) {
  return render(<svg>{node}</svg>);
}

describe("左屏 StepNavigator · 分步作答的驱动源", () => {
  it("渲染当前步徽标，并把前进 / 后退映射为 1 起步号", () => {
    const onChange = vi.fn();
    render(
      <StepNavigator
        steps={MARKOV_ANSWER_STEPS}
        active={2}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("第 2 / 4 步")).toBeInTheDocument();
    // 当前步标题同时出现在"当前步卡片"与"步骤清单"两处，故用 getAllByText
    expect(
      screen.getAllByText(MARKOV_ANSWER_STEPS[1].title).length,
    ).toBeGreaterThan(0);
    // 中屏联动提示必须落到左屏，学生才知道该看中屏哪一块
    expect(screen.getByText(/中屏联动/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("下一步"));
    expect(onChange).toHaveBeenLastCalledWith(3);
    fireEvent.click(screen.getByLabelText("上一步"));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("首步禁用上一步、末步禁用下一步，步号永不越界", () => {
    const onChange = vi.fn();
    const first = render(
      <StepNavigator
        steps={MARKOV_ANSWER_STEPS}
        active={1}
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText("上一步")).toBeDisabled();
    first.unmount();

    render(
      <StepNavigator
        steps={MARKOV_ANSWER_STEPS}
        active={MARKOV_ANSWER_STEPS.length}
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText("下一步")).toBeDisabled();
  });

  it("点击清单任意步可直跳该步（不清空、不重置）", () => {
    const onChange = vi.fn();
    render(
      <StepNavigator
        steps={MARKOV_ANSWER_STEPS}
        active={1}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText(MARKOV_ANSWER_STEPS[2].title));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});

describe("右屏 MathPanel · focusStep 只派发给命中的区块", () => {
  const panelProps = {
    quantities: [],
    theorems: [
      { name: "采分步甲", latex: "a", step: 1 },
      { name: "采分步乙", latex: "b", step: 2 },
    ],
    reasoningSteps: [
      { step: 1, title: "推演步甲", detail: "甲" },
      { step: 2, title: "推演步乙", detail: "乙" },
    ],
  };
  const focusedCardOf = (text: string) =>
    screen.getByText(text).closest('[data-focus-step="true"]');

  it('focusTarget="theorems"：只描边定理卡片，推演链不得同时描边', () => {
    render(<MathPanel {...panelProps} focusStep={2} focusTarget="theorems" />);
    expect(focusedCardOf("采分步乙")).not.toBeNull();
    expect(
      screen.getByText("采分步甲").closest("[data-focus-step]"),
    ).toBeNull();
    // 未派发区块完全不带聚焦属性，避免"两处同时聚焦"的焦点分裂
    expect(
      screen.getByText("推演步甲").closest("[data-focus-step]"),
    ).toBeNull();
    expect(
      screen.getByText("推演步乙").closest("[data-focus-step]"),
    ).toBeNull();
  });

  it('focusTarget="reasoning"：只描边推演链，定理卡片不得同时描边', () => {
    render(<MathPanel {...panelProps} focusStep={1} focusTarget="reasoning" />);
    expect(focusedCardOf("推演步甲")).not.toBeNull();
    expect(
      screen.getByText("推演步乙").closest("[data-focus-step]"),
    ).toBeNull();
    expect(
      screen.getByText("采分步甲").closest("[data-focus-step]"),
    ).toBeNull();
  });

  it("缺省 focusTarget 为 reasoning（列联表这类 3 步链落在推演区的页面无需额外传参）", () => {
    render(<MathPanel {...panelProps} focusStep={2} />);
    expect(focusedCardOf("推演步乙")).not.toBeNull();
    expect(
      screen.getByText("采分步甲").closest("[data-focus-step]"),
    ).toBeNull();
  });

  it("不传 focusStep 时整块看板都不描边（未启用分步的页面观感不得被改变）", () => {
    render(<MathPanel {...panelProps} />);
    expect(document.querySelectorAll("[data-focus-step]").length).toBe(0);
  });
});

describe("中屏分区点亮 · 概率递推（4 步链）", () => {
  const sceneProps = {
    params: markovDefaultParams,
    scenarioKey: "pass_ball_3",
    fontScale,
  };

  it("未分步时三块分区全亮，且不出现围栏", () => {
    const { container } = renderInSvg(
      <MarkovScene {...sceneProps} activeStep={0} />,
    );
    expect(regionOpacities(container)).toEqual(["1", "1", "1"]);
    expect(container.querySelector(FRAME_SELECTOR)).toBeNull();
  });

  it("第 1 步只亮左上半区，第 2 步只亮左下半区", () => {
    const { container, rerender } = renderInSvg(
      <MarkovScene {...sceneProps} activeStep={1} />,
    );
    expect(regionOpacities(container)).toEqual(["1", "0.3", "0.3"]);

    rerender(
      <svg>
        <MarkovScene {...sceneProps} activeStep={2} />
      </svg>,
    );
    expect(regionOpacities(container)).toEqual(["0.3", "1", "0.3"]);
  });

  it("第 3、4 步共同点亮右视窗（配凑与通项本就看同一张数列演变图）", () => {
    const { container, rerender } = renderInSvg(
      <MarkovScene {...sceneProps} activeStep={3} />,
    );
    expect(regionOpacities(container)).toEqual(["0.3", "0.3", "1"]);

    rerender(
      <svg>
        <MarkovScene {...sceneProps} activeStep={4} />
      </svg>,
    );
    expect(regionOpacities(container)).toEqual(["0.3", "0.3", "1"]);
    // 仍然给出围栏，学生能确认"第 4 步也在这张图上"
    expect(container.querySelector(FRAME_SELECTOR)).not.toBeNull();
  });

  it("步骤标牌随 activeStepLabel 出现，未传时不渲染", () => {
    const label = "第 2 / 4 步 · 全概率公式建立一阶线性递推";
    const { rerender } = renderInSvg(
      <MarkovScene {...sceneProps} activeStep={2} activeStepLabel={label} />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();

    rerender(
      <svg>
        <MarkovScene {...sceneProps} activeStep={2} />
      </svg>,
    );
    expect(screen.queryByText(label)).toBeNull();
  });
});

describe("中屏分区点亮 · 成对数据独立性检验（3 步链）", () => {
  const sceneProps = {
    freqA: 85,
    freqB: 15,
    freqC: 40,
    freqD: 60,
    fontScale,
  };

  it("未分步时三块分区全亮，且不出现围栏", () => {
    const { container } = renderInSvg(
      <IndependenceScene {...sceneProps} activeStep={0} />,
    );
    expect(regionOpacities(container)).toEqual(["1", "1", "1"]);
    expect(container.querySelector(FRAME_SELECTOR)).toBeNull();
  });

  it("第 1 步亮列联表、第 2 步亮等高条形图、第 3 步亮 χ² 分布曲线", () => {
    const { container, rerender } = renderInSvg(
      <IndependenceScene {...sceneProps} activeStep={1} />,
    );
    expect(regionOpacities(container)).toEqual(["1", "0.3", "0.3"]);
    expect(container.querySelector(FRAME_SELECTOR)).not.toBeNull();

    rerender(
      <svg>
        <IndependenceScene {...sceneProps} activeStep={2} />
      </svg>,
    );
    expect(regionOpacities(container)).toEqual(["0.3", "1", "0.3"]);

    rerender(
      <svg>
        <IndependenceScene {...sceneProps} activeStep={3} />
      </svg>,
    );
    expect(regionOpacities(container)).toEqual(["0.3", "0.3", "1"]);
  });
});

describe("三方同源（SSOT）· 右屏步号与标题必须逐条等于注册表链条", () => {
  it("概率递推：右屏定理区的名称与 step 完全由 MARKOV_ANSWER_STEPS 生成", () => {
    const panel = buildProbabilityMarkovPanel(
      { ...markovDefaultParams },
      { scenarioKey: "pass_ball_3" },
    );
    expect(panel.theorems?.map((t) => t.step)).toEqual(
      MARKOV_ANSWER_STEPS.map((s) => s.step),
    );
    expect(panel.theorems?.map((t) => t.name)).toEqual(
      MARKOV_ANSWER_STEPS.map((s) => `【高考采分步 ${s.step}】${s.title}`),
    );
  });

  it("独立性检验：右屏推演链的步号与标题完全由 INDEPENDENCE_ANSWER_STEPS 生成", () => {
    const panel = buildPairedDataPanel(
      { ...pairedDefaultParams, scaleMultiplier: 1 },
      {
        studyMode: "independence",
        indPresetKey: "0",
        activeTab: "standard",
        points: [],
      },
    );
    expect(panel.reasoningSteps?.map((s) => s.step)).toEqual(
      INDEPENDENCE_ANSWER_STEPS.map((s) => s.step),
    );
    expect(panel.reasoningSteps?.map((s) => s.title)).toEqual(
      INDEPENDENCE_ANSWER_STEPS.map((s) => s.title),
    );
  });

  it("两条链条的步号必须从 1 连续递增——否则左屏清单与右屏聚焦会错位", () => {
    for (const steps of [MARKOV_ANSWER_STEPS, INDEPENDENCE_ANSWER_STEPS]) {
      expect(steps.map((s) => s.step)).toEqual(steps.map((_, i) => i + 1));
      // 每一步都要给出"该看中屏哪一块"，否则分步导航就只剩翻页没有联动
      for (const s of steps) {
        expect(s.title.trim().length).toBeGreaterThan(0);
        expect(s.sceneHint.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
