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

import { ProbabilityCountingAnimation } from "../ProbabilityCountingAnimation";

function renderPage() {
  return render(
    <MemoryRouter>
      <ProbabilityCountingAnimation />
    </MemoryRouter>,
  );
}

describe("ProbabilityCountingAnimation 集成与三屏联动测试", () => {
  it("正常挂载并输出规范化顶部公式与含背景导引的 TipCard", () => {
    renderPage();

    expect(screen.getByText("二项式定理")).toBeInTheDocument();
    expect(screen.getByText("排列与组合")).toBeInTheDocument();
    expect(screen.getByText("计数原理")).toBeInTheDocument();

    // 默认参数 a=1, b=1，顶部公式应化简为 (x + 1)^5 而非 (1x + 1)^5
    const formulas = screen
      .getAllByTestId("katex")
      .map((el) => el.textContent ?? "")
      .join(" ");
    expect(formulas).not.toContain("1x");

    // TipCard 含背景导引
    expect(
      screen.getByText(/新高考多以选填压轴或中档题形式考察/),
    ).toBeInTheDocument();
  });

  it("切换三大主题及子视图时，左屏 TipCard 与中屏模型同步切换", () => {
    renderPage();

    // 二项式 -> 赋值法动态沙盘
    fireEvent.click(screen.getByText("赋值法动态沙盘"));
    expect(screen.getByText(/赋值法沙盘探索/)).toBeInTheDocument();
    expect(
      screen.getByText(/在求复杂多项式或乘积式展开后的系数总和/),
    ).toBeInTheDocument();

    // 排列与组合
    fireEvent.click(screen.getByText("排列与组合"));
    expect(screen.getByText(/原始元素池/)).toBeInTheDocument();

    // 计数原理 -> 网格路径标数
    fireEvent.click(screen.getByText("计数原理"));
    expect(screen.getByText(/分步乘法决策树模型/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("网格路径标数"));
    expect(screen.getByText(/示例橙色虚线步序/)).toBeInTheDocument();
  });

  it("高参数下 (m1=5, m2=4, m3=3 与 k>5) 启用密集树抽稀与槽位折叠", () => {
    renderPage();

    // 排列组合下将 k 调至 7（超过 5 个显式槽位，此时默认 n=5 需先调大 n=9）
    fireEvent.click(screen.getByText("排列与组合"));
    const [nSlider, kSlider] = screen.getAllByRole("slider");
    fireEvent.change(nSlider, { target: { value: "9" } });
    fireEvent.change(kSlider, { target: { value: "7" } });
    expect(screen.getByText("+3 槽位")).toBeInTheDocument();

    // 计数原理 -> 60 叶子乘法树不溢出并展示抽稀提示
    fireEvent.click(screen.getByText("计数原理"));
    const [m1Slider, m2Slider, m3Slider] = screen.getAllByRole("slider");
    fireEvent.change(m1Slider, { target: { value: "5" } });
    fireEvent.change(m2Slider, { target: { value: "4" } });
    fireEvent.change(m3Slider, { target: { value: "3" } });
    expect(
      screen.getByText(/共 60 条路径（末层标签已抽稀）/),
    ).toBeInTheDocument();
  });
});
