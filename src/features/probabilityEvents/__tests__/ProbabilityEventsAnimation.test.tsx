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

import { ProbabilityEventsAnimation } from "../ProbabilityEventsAnimation";

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ProbabilityEventsAnimation />
    </MemoryRouter>,
  );
}

describe("ProbabilityEventsAnimation 页面集成与三屏交互测试", () => {
  it("挂载时正确渲染三屏核心元素与题设要素", () => {
    renderWithRouter();
    // 模式切换
    expect(screen.getByText("连续测度")).toBeInTheDocument();
    expect(screen.getByText("掷骰点阵")).toBeInTheDocument();
    // 题设卡片条件与设问
    expect(screen.getByText("【初始条件】")).toBeInTheDocument();
    expect(screen.getByText("【核心设问】")).toBeInTheDocument();
    // 右屏看板
    expect(screen.getByText("数学解析看板")).toBeInTheDocument();
    expect(screen.getByText("事件 A 概率")).toBeInTheDocument();
  });

  it("典型情境切换与 TipCard 动态联动", () => {
    renderWithRouter();
    // 切换到“互斥加法”
    fireEvent.click(screen.getByText("互斥加法"));
    expect(screen.getByText(/命中 10 环/)).toBeInTheDocument();
    expect(screen.getByText(/课标核心 · 互斥加法公式/)).toBeInTheDocument();

    // 切换到“对立事件”
    fireEvent.click(screen.getByText("对立事件"));
    expect(screen.getByText(/高考秒杀 · 对立事件求概率/)).toBeInTheDocument();
  });

  it("模式切换到离散点阵掷骰子", () => {
    renderWithRouter();
    fireEvent.click(screen.getByText("掷骰点阵"));
    expect(screen.getByText("离散事件规则设定")).toBeInTheDocument();
    expect(screen.getAllByText("和为偶数").length).toBeGreaterThan(0);
    expect(screen.getAllByText("两数相同").length).toBeGreaterThan(0);
    // 右屏看板同步切换到离散样本空间统计
    expect(screen.getByText("样本空间容量")).toBeInTheDocument();
    expect(screen.getByText("36")).toBeInTheDocument();
  });

  it("包含关系情景切换与差事件设问闭环", () => {
    renderWithRouter();
    fireEvent.click(screen.getByText("包含关系"));
    expect(screen.getByText(/基础概念 · 事件包含关系/)).toBeInTheDocument();
    expect(screen.getAllByText(/差事件/).length).toBeGreaterThan(0);
    // 右屏看板推导链中包含差事件公式
    expect(
      screen.getAllByText(/P\(B - A\) = P\(B\) - P\(A\)/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("情景自适应模式切换：掷骰点阵与连续测度模式双向同步", () => {
    renderWithRouter();
    // 默认是连续测度，含滑块与连续情境
    expect(screen.getByText("核心概率参数")).toBeInTheDocument();
    expect(screen.getByText("互斥加法")).toBeInTheDocument();

    // 点击切换到掷骰点阵
    fireEvent.click(screen.getByText("掷骰点阵"));
    expect(screen.getByText("离散事件规则设定")).toBeInTheDocument();
    expect(screen.getByText("奇偶对立")).toBeInTheDocument();
    expect(screen.getByText("奇偶包含")).toBeInTheDocument();

    // 点击离散的“奇偶包含”
    fireEvent.click(screen.getByText("奇偶包含"));
    expect(screen.getAllByText(/离散包含关系/).length).toBeGreaterThan(0);

    // 点击切回连续测度，应自动同步为连续测度参数与情境
    fireEvent.click(screen.getByText("连续测度"));
    expect(screen.getByText("核心概率参数")).toBeInTheDocument();
    expect(screen.getByText("互斥加法")).toBeInTheDocument();

    // 点击“互斥加法”
    fireEvent.click(screen.getByText("互斥加法"));
    expect(screen.getByText(/命中 10 环/)).toBeInTheDocument();
  });

  it("离散模式下切换规则，TipCard 动态特化题设", () => {
    renderWithRouter();
    fireEvent.click(screen.getByText("掷骰点阵"));
    // 切换规则到两数全为偶
    const evenBtn = screen.getAllByText("两数全为偶")[0];
    fireEvent.click(evenBtn);
    expect(screen.getAllByText(/两数全为偶/).length).toBeGreaterThanOrEqual(2);
  });

  it("中屏动画：文氏图模式和离散模式在运算高亮下的动态状态与样本点渲染", () => {
    renderWithRouter();
    // 1. 连续测度文氏图模式：默认 highlightOp 为 none，检查全集 Ω 标题与两事件关系状态
    expect(
      screen.getByText(/样本空间 Ω \(P\(Ω\) = 1.00\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/两事件关系：/)).toBeInTheDocument();

    // 切换集合运算为交事件
    fireEvent.click(screen.getByText("交事件"));
    expect(screen.getByText(/运算高亮：交事件 A ∩ B/)).toBeInTheDocument();

    // 切换集合运算为并事件
    fireEvent.click(screen.getByText("并事件"));
    expect(screen.getByText(/运算高亮：并事件 A ∪ B/)).toBeInTheDocument();

    // 2. 切换到离散点阵模式
    fireEvent.click(screen.getByText("掷骰点阵"));
    expect(
      screen.getByText(/离散样本空间 Ω \(36 种等可能基本事件\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/骰子 1 点数 x →/)).toBeInTheDocument();
    expect(screen.getByText(/骰子 2 点数 y →/)).toBeInTheDocument();

    // 在离散模式下切换运算为交事件
    fireEvent.click(screen.getByText("交事件"));
    expect(screen.getByText(/运算高亮：交事件 A ∩ B/)).toBeInTheDocument();

    // 切换为对立事件甲
    fireEvent.click(screen.getByText("对立事件甲"));
    expect(screen.getByText(/运算高亮：对立事件 Aᶜ/)).toBeInTheDocument();

    // 切换回全景全显
    fireEvent.click(screen.getByText("全景全显"));
    expect(screen.getByText(/事件 A: 18 点/)).toBeInTheDocument();
  });
});
