import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../test/mocks";

import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

import { ProbabilityMarkovAnimation } from "../ProbabilityMarkovAnimation";
import { MARKOV_ANSWER_STEPS } from "@/data/registries/probabilityMarkov";

function renderPage() {
  return render(
    <MemoryRouter>
      <ProbabilityMarkovAnimation />
    </MemoryRouter>,
  );
}

describe("ProbabilityMarkovAnimation 集成与三屏联动测试", () => {
  it("正常挂载并呈现 5 个典型情境、4 步解答导航与右屏看板", () => {
    renderPage();

    expect(screen.getByText("自由探索")).toBeInTheDocument();
    expect(screen.getByText("三人传球问题")).toBeInTheDocument();
    expect(screen.getByText("四人传球问题")).toBeInTheDocument();
    expect(screen.getByText("摸球置换问题")).toBeInTheDocument();
    expect(screen.getByText("乒乓加赛问题")).toBeInTheDocument();

    expect(screen.getByText("全概递推数列高考采分看板")).toBeInTheDocument();
    expect(screen.getByText("第 1 / 4 步")).toBeInTheDocument();
    expect(screen.getAllByText(/累计期望/).length).toBeGreaterThan(0);
  });

  it("切换不同高考模型预设，左屏 TipCard 与中屏拓扑模型同步特化", () => {
    renderPage();

    // 切换四人传球
    fireEvent.click(screen.getByText("四人传球问题"));
    expect(
      screen.getByText(/甲、乙、丙、丁四人围成一圈传球训练/),
    ).toBeInTheDocument();
    expect(screen.getByText(/回传甲 p₂₁ = 1\/3/)).toBeInTheDocument();

    // 切换摸球置换
    fireEvent.click(screen.getByText("摸球置换问题"));
    expect(screen.getByText(/箱内装有黑白两色球/)).toBeInTheDocument();
    expect(screen.getByText(/白球池 \(Aₙ\)/)).toBeInTheDocument();

    // 切换乒乓加赛
    fireEvent.click(screen.getByText("乒乓加赛问题"));
    expect(screen.getByText(/甲发球局 \(Aₙ\)/)).toBeInTheDocument();
  });

  it("点击 StepNavigator 第 3 步与第 4 步时，中屏解耦切换显示缩放系数与累计期望", () => {
    const { container } = renderPage();

    // 默认第 1 步，点击第 3 步
    fireEvent.click(screen.getByText(MARKOV_ANSWER_STEPS[2].title));
    expect(screen.getByText("第 3 / 4 步")).toBeInTheDocument();
    expect(screen.getByText(/× λ \(/)).toBeInTheDocument();

    // 切到第 4 步
    fireEvent.click(screen.getByText(MARKOV_ANSWER_STEPS[3].title));
    expect(screen.getByText("第 4 / 4 步")).toBeInTheDocument();
    expect(container.textContent).toContain("S_1");
  });

  it("手动修改参数自动切回自由探索，点击重置可恢复默认参数", () => {
    renderPage();
    fireEvent.click(screen.getByText("摸球置换问题"));
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThanOrEqual(3);

    // 改动 p11 滑块 → 应自动切回 free 并渲染自由探索双圆状态图
    fireEvent.change(sliders[1], { target: { value: "0.7" } });
    expect(screen.getByText(/跨状态流出 1-p₁₁/)).toBeInTheDocument();
    expect(screen.getByText(/二状态离散随机转移探究实验/)).toBeInTheDocument();

    // 重置按钮可正常执行
    const resetBtn = screen.getByLabelText("恢复默认参数");
    fireEvent.click(resetBtn);
    expect(screen.getByText(/二状态离散随机转移探究实验/)).toBeInTheDocument();
  });
});
