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

import { ProbabilityNormalAnimation } from "../ProbabilityNormalAnimation";

function renderPage() {
  return render(
    <MemoryRouter>
      <ProbabilityNormalAnimation />
    </MemoryRouter>,
  );
}

describe("ProbabilityNormalAnimation 集成与三屏联动测试", () => {
  it("正常挂载并展示 normalFit 的区间端点 x1/x2 滑块与分组标题", () => {
    renderPage();
    expect(screen.getByText("极限逼近拟合")).toBeInTheDocument();
    expect(screen.getByText("小样本粗划分阶段")).toBeInTheDocument();
    expect(screen.getByText("大样本密集逼近阶段")).toBeInTheDocument();
    expect(screen.getByText("探究区间边界")).toBeInTheDocument();
    expect(screen.getByLabelText("区间左端点 x₁数值")).toBeInTheDocument();
    expect(screen.getByLabelText("区间右端点 x₂数值")).toBeInTheDocument();
  });

  it("normalFit 模式下修改 x1/x2 不强制破坏当前粗/密阶段预设", () => {
    renderPage();
    fireEvent.click(screen.getByText("小样本粗划分阶段"));
    expect(screen.getByText(/N = 80/)).toBeInTheDocument();

    const sliders = screen.getAllByRole("slider");
    const lastSlider = sliders[sliders.length - 1];
    fireEvent.change(lastSlider, { target: { value: "1.5" } });
    // 仍处于小样本粗划分阶段预设
    expect(screen.getByText(/N = 80/)).toBeInTheDocument();
  });

  it("切换至 paramsShape 与 sigmaRule 时渲染标准化 Z 轴标尺与非对称配凑情景", () => {
    renderPage();
    fireEvent.click(screen.getByText("参数 μ, σ 形态"));
    expect(screen.getByText("Z = (X-μ)/σ")).toBeInTheDocument();
    expect(
      screen.getByText(/正态分布 μ 与 σ 形态探究看板/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("对称性与解题"));
    fireEvent.click(screen.getByText("非对称区间配凑"));
    expect(
      screen.getByText(/翼区 \[μ\+σ, μ\+2σ\] ≈ 13.59%/),
    ).toBeInTheDocument();
    expect(screen.getByText("Z = (X-μ)/σ")).toBeInTheDocument();
  });
});
