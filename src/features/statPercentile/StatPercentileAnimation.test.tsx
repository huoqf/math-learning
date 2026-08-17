import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../test/mocks";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

vi.mock("@/components/Math", () => ({
  CoordinateGrid: () => <div data-testid="coordinate-grid" />,
  FunctionGraph: () => null,
  InteractivePoint: () => null,
  VectorArrow: () => null,
  Asymptote: () => null,
  IntervalShadow: () => null,
  TangentLine: () => null,
  SecantLine: () => null,
}));

import { StatPercentileAnimation } from "./StatPercentileAnimation";

describe("StatPercentileAnimation smoke & synchronization tests", () => {
  it("renders 3 study modes in full width lines", () => {
    render(<StatPercentileAnimation />);
    expect(screen.getByText("直方图与数字特征")).toBeInTheDocument();
    expect(
      screen.getByText("众数、中位数、均值与物理力矩支点"),
    ).toBeInTheDocument();
    expect(screen.getByText("百分位数线性插值")).toBeInTheDocument();
    expect(screen.getByText("S 型累积折线与面积补齐插值")).toBeInTheDocument();
    expect(screen.getByText("分层抽样与总方差")).toBeInTheDocument();
    expect(
      screen.getByText("各层高斯分布、离差拉扯与总方差分解"),
    ).toBeInTheDocument();
  });

  it("displays parameter section and gaokao presets", () => {
    render(<StatPercentileAnimation />);
    expect(screen.getByText("参数调节")).toBeInTheDocument();
    expect(screen.getByText("典型高考情境")).toBeInTheDocument();
    expect(screen.getByText("对称分布 (钟形)")).toBeInTheDocument();
    expect(screen.getByText("正偏态 (右偏长尾)")).toBeInTheDocument();
    expect(screen.getByText("高考真题: 大均值差异")).toBeInTheDocument();
  });

  it("switches study mode and synchronizes right panel title & quantities", () => {
    render(<StatPercentileAnimation />);
    // 默认直方图看板
    expect(screen.getByText("直方图与数字特征看板")).toBeInTheDocument();

    // 切换到累积频率模式
    const cumulativeMode = screen.getByText("百分位数线性插值");
    fireEvent.click(cumulativeMode);
    expect(screen.getByText("百分位数与累积频率看板")).toBeInTheDocument();

    // 切换到分层抽样模式
    const stratifiedMode = screen.getByText("分层抽样与总方差");
    fireEvent.click(stratifiedMode);
    expect(screen.getByText("分层抽样与总体方差看板")).toBeInTheDocument();
    expect(screen.getByText("总体规模 N")).toBeInTheDocument();
  });

  it("loads preset and automatically switches mode and synchronizes parameters", () => {
    render(<StatPercentileAnimation />);
    // 点击高考分层抽样真题预设
    const presetLabel = screen.getByText("高考真题: 大均值差异");
    fireEvent.click(presetLabel);

    // 预设应自动切换到分层抽样模式
    expect(screen.getByText("分层抽样与总体方差看板")).toBeInTheDocument();
    expect(screen.getByLabelText("抽样总数 n数值")).toHaveValue(120);
    expect(screen.getByLabelText("层 1 总体人数 N₁数值")).toHaveValue(400);
  });
});
