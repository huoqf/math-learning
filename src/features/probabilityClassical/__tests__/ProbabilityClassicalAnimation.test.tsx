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

import { ProbabilityClassicalAnimation } from "../ProbabilityClassicalAnimation";

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ProbabilityClassicalAnimation />
    </MemoryRouter>,
  );
}

describe("ProbabilityClassicalAnimation 页面集成与三屏交互测试", () => {
  it("挂载时正确渲染三屏核心元素与题设闭环卡片", () => {
    renderWithRouter();
    // 左屏标题与视图切换
    expect(screen.getByText("展现形态")).toBeInTheDocument();
    expect(screen.getByText("二维矩阵视图")).toBeInTheDocument();
    expect(screen.getByText("分步树状图视图")).toBeInTheDocument();

    // 题设三要素闭环
    expect(screen.getByText("【背景说明】")).toBeInTheDocument();
    expect(screen.getByText("【初始条件】")).toBeInTheDocument();
    expect(screen.getByText("【核心设问】")).toBeInTheDocument();

    // 分步作答导航器
    expect(screen.getByText("高考标准解答分步走")).toBeInTheDocument();

    // 右屏特征量
    expect(screen.getByText("样本空间总数")).toBeInTheDocument();
    expect(screen.getByText("事件包含点数")).toBeInTheDocument();
    expect(screen.getByText("古典概型概率")).toBeInTheDocument();
  });

  it("情境切换联动 TipCard 题设三要素特化", () => {
    renderWithRouter();

    // 切换到“摸球正难则反”
    fireEvent.click(screen.getByText("摸球正难则反"));
    expect(screen.getByText(/高考秒杀 · 对立事件逆向破题/)).toBeInTheDocument();

    // 切换到“志愿选人”
    fireEvent.click(screen.getByText("志愿选人"));
    expect(screen.getByText(/新高考真题 · 标准解答分步走/)).toBeInTheDocument();
  });

  it("切换到三抛硬币情景并展示分步树状图视图", () => {
    renderWithRouter();
    // 切换到“三抛硬币”，该情景预设即为 tree 视图
    fireEvent.click(screen.getByText("三抛硬币"));
    expect(screen.getByText(/课标核心 · 树状图法列举/)).toBeInTheDocument();
    // 树状图渲染出阶段标题
    expect(screen.getByText("试验起点")).toBeInTheDocument();
    expect(screen.getByText("第 1 次抛掷")).toBeInTheDocument();
  });

  it("分步导航器 StepNavigator 步数递进与同源同频聚焦", () => {
    renderWithRouter();
    // 左屏与右屏均同源展示第一步
    expect(
      screen.getAllByText(/审题定模：判定古典概型两大特征/).length,
    ).toBeGreaterThan(0);

    // 点击“下一步”按钮跳转到第 2 步
    const nextBtn = screen.getByLabelText("下一步");
    fireEvent.click(nextBtn);
    expect(
      screen.getAllByText(/列举样本：规范写出样本空间并求总数/).length,
    ).toBeGreaterThan(0);
  });

  it("志愿选人情景下正确展示事件切换列表", () => {
    renderWithRouter();
    fireEvent.click(screen.getByText("志愿选人"));
    expect(screen.getByText("至少有 1 名女生")).toBeInTheDocument();
    expect(screen.getByText("恰好有 1 名女生")).toBeInTheDocument();
  });

  it("摸球情景下展示抽样方式切换", () => {
    renderWithRouter();
    fireEvent.click(screen.getByText("摸球正难则反"));
    expect(screen.getByText("不放回抽样 (n=20)")).toBeInTheDocument();
    expect(screen.getByText("有放回抽样 (n=25)")).toBeInTheDocument();
  });
});
