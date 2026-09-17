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

import { ProbabilityBayesAnimation } from "../ProbabilityBayesAnimation";

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ProbabilityBayesAnimation />
    </MemoryRouter>,
  );
}

describe("ProbabilityBayesAnimation integration & synchronization tests", () => {
  it("renders 3 core modes properly on initial mount", () => {
    renderWithRouter();
    expect(screen.getByText("条件概率")).toBeInTheDocument();
    expect(screen.getByText("全概率公式")).toBeInTheDocument();
    expect(screen.getByText("贝叶斯由果溯因")).toBeInTheDocument();
    expect(screen.getByText("数学解析看板")).toBeInTheDocument();
  });

  it("displays conditional probability presets and updates TipCard triad", () => {
    renderWithRouter();
    // 默认展示条件概率情景
    expect(screen.getByText("典型情境")).toBeInTheDocument();
    expect(screen.getByText("自由探索")).toBeInTheDocument();
    expect(screen.getByText("相互独立模型")).toBeInTheDocument();
    expect(screen.getByText("互斥事件模型")).toBeInTheDocument();

    // 初始状态包含题设背景、条件与设问
    expect(screen.getByText("【背景说明】")).toBeInTheDocument();
    expect(screen.getByText("【初始条件】")).toBeInTheDocument();
    expect(screen.getByText("【核心设问】")).toBeInTheDocument();

    // 切换到“相互独立模型”
    fireEvent.click(screen.getByText("相互独立模型"));
    expect(screen.getByText(/先后两次抛掷质地均匀的硬币/)).toBeInTheDocument();
    expect(
      screen.getByText(/高考经典 · 相互独立事件与乘法公式/),
    ).toBeInTheDocument();

    // 切换到“互斥事件模型”
    fireEvent.click(screen.getByText("互斥事件模型"));
    expect(
      screen.getByText(/易错概念辨析：两事件不可能在同一次试验中同时发生/),
    ).toBeInTheDocument();
    expect(screen.getByText(/高考基础 · 互斥事件概念辨析/)).toBeInTheDocument();
  });

  it("switches to total_prob mode and tests Warner randomized response model", () => {
    renderWithRouter();
    // 切换到全概率公式模式
    fireEvent.click(screen.getByText("全概率公式"));
    expect(screen.getByText("三车间次品")).toBeInTheDocument();
    expect(screen.getByText("三等分均衡")).toBeInTheDocument();
    expect(screen.getByText("Warner调查")).toBeInTheDocument();

    // 切换到 Warner 调查模型
    fireEvent.click(screen.getByText("Warner调查"));
    // 检查 TipCard 的背景三要素
    expect(
      screen.getByText(/高考创新 · Warner 敏感问题随机化调查模型/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/新高考创新应用大题原型：在涉及隐私、敏感话题/),
    ).toBeInTheDocument();
    // 检查参数控制项是否隔离并精准切换为 pCard 与 pReportYes
    expect(screen.getByText(/正面卡概率/)).toBeInTheDocument();
    expect(screen.getByText(/调查回答率/)).toBeInTheDocument();
    // 右屏应展示反解真实比例相关数学量
    expect(screen.getByText(/全概逆解真实具有特征率/)).toBeInTheDocument();
  });

  it("switches to bayes mode and tests disease screening scenario", () => {
    renderWithRouter();
    // 切换到贝叶斯公式模式
    fireEvent.click(screen.getByText("贝叶斯由果溯因"));
    expect(screen.getByText("罕见病筛查")).toBeInTheDocument();
    expect(screen.getByText("次品溯源")).toBeInTheDocument();

    // 切换到罕见病筛查
    fireEvent.click(screen.getByText("罕见病筛查"));
    expect(
      screen.getByText(/高考应用 · 罕见病筛查与基率效应/),
    ).toBeInTheDocument();
    expect(screen.getByText(/新高考信息给予大题原型/)).toBeInTheDocument();
    // 检查参数滑块切换为先验基率
    expect(screen.getByText(/先验基率/)).toBeInTheDocument();
  });

  it("handles Warner model degeneration properly when pCard is 0.5", () => {
    renderWithRouter();
    fireEvent.click(screen.getByText("全概率公式"));
    fireEvent.click(screen.getByText("Warner调查"));

    // 默认 pCard = 0.8 时正常反解真实比例，中屏不出现无法反解的退化提示
    expect(screen.getByText(/p_real =/)).toBeInTheDocument();
    expect(
      screen.queryByText("信息完全抵消，无法反解真实比例"),
    ).not.toBeInTheDocument();
  });
});
