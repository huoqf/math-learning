import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../test/mocks";
import { MemoryRouter } from "react-router-dom";
import { ProbabilityIndependenceAnimation } from "../ProbabilityIndependenceAnimation";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ProbabilityIndependenceAnimation />
    </MemoryRouter>,
  );
}

describe("ProbabilityIndependenceAnimation 页面集成与三屏联动测试", () => {
  it("挂载后正常渲染模式切换、情境选择与右屏看板", () => {
    renderWithRouter();
    expect(screen.getByText("连续概率测度")).toBeInTheDocument();
    expect(screen.getByText("离散骰子模型")).toBeInTheDocument();
    expect(screen.getByText("辨析情境选择")).toBeInTheDocument();
    expect(screen.getByText("独立不互斥")).toBeInTheDocument();
    expect(screen.getByText("互斥不独立")).toBeInTheDocument();
    expect(screen.getByText("连续自由探索")).toBeInTheDocument();
  });

  it("点击情境切换能动态更新 TipCard 题设三要素与右屏数据", () => {
    renderWithRouter();
    // 切换到互斥不独立模型
    fireEvent.click(screen.getByText("互斥不独立"));
    expect(screen.getByText(/加法公式 · P\(AB\)=0/)).toBeInTheDocument();
    expect(screen.getByText(/单次试验分类讨论中/)).toBeInTheDocument();

    // 切换到离散骰子模型模式
    fireEvent.click(screen.getByText("离散骰子模型"));
    expect(screen.getByText(/离散等可能 · 样本空间验证/)).toBeInTheDocument();
    expect(screen.getByText("骰子独立模型")).toBeInTheDocument();
    expect(screen.getByText("骰子相交相关")).toBeInTheDocument();
  });

  it("切换到离散骰子模型能渲染骰子样本点、事件选项与右屏条件概率", () => {
    renderWithRouter();
    fireEvent.click(screen.getByText("离散骰子模型"));
    expect(screen.getByText("事件 A 设定")).toBeInTheDocument();
    expect(screen.getByText("事件 B 设定")).toBeInTheDocument();
    expect(screen.getByText("偶数点")).toBeInTheDocument();
    expect(screen.getByText("点数不大于四")).toBeInTheDocument();
    expect(screen.getByText("条件概率 (A发生下B)")).toBeInTheDocument();

    // 切换到相交相关情景
    fireEvent.click(screen.getByText("骰子相交相关"));
    expect(screen.getByText(/离散等可能 · 相交不独立/)).toBeInTheDocument();
  });
});
