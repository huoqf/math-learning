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
  SceneLegend: () => null,
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

  it("displays parameter section and mode-isolated scenarios with dimensionality reduction", () => {
    render(<StatPercentileAnimation />);
    expect(screen.getByText("参数调节")).toBeInTheDocument();
    expect(screen.getByText("典型高考情境")).toBeInTheDocument();

    // 默认 histogram 模式展示对应专属情景
    expect(screen.getByText("自由探索")).toBeInTheDocument();
    expect(screen.getByText("对称分布 (钟形)")).toBeInTheDocument();
    expect(screen.getByText("正偏态 (右偏长尾)")).toBeInTheDocument();

    // 默认 free 状态下，展示 percentileP 与 shift
    expect(screen.getByLabelText("百分位数 p%数值")).toBeInTheDocument();
    expect(screen.getByLabelText("分布偏斜度 shift数值")).toBeInTheDocument();

    // 点击对称分布情景：实行参数降维，shift 滑块应被隐藏
    fireEvent.click(screen.getByText("对称分布 (钟形)"));
    expect(screen.getByLabelText("百分位数 p%数值")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("分布偏斜度 shift数值"),
    ).not.toBeInTheDocument();
  });

  it("switches study mode and synchronizes right panel title & quantities", () => {
    render(<StatPercentileAnimation />);
    // 默认直方图看板
    expect(screen.getByText("直方图与数字特征看板")).toBeInTheDocument();

    // 切换到累积频率模式
    const cumulativeMode = screen.getByText("百分位数线性插值");
    fireEvent.click(cumulativeMode);
    expect(screen.getByText("百分位数与累积频率看板")).toBeInTheDocument();
    expect(screen.getByText("下四分位数 Q₁ (25%)")).toBeInTheDocument();

    // 切换到分层抽样模式
    const stratifiedMode = screen.getByText("分层抽样与总方差");
    fireEvent.click(stratifiedMode);
    expect(screen.getByText("分层抽样与总体方差看板")).toBeInTheDocument();
    expect(screen.getByText("总体规模 N")).toBeInTheDocument();
    expect(screen.getByText("高考必考: 两层合并")).toBeInTheDocument();
  });

  it("loads stratified scenario, performs parameter reduction and resets to free on manual change", () => {
    render(<StatPercentileAnimation />);
    // 切换到分层抽样模式
    fireEvent.click(screen.getByText("分层抽样与总方差"));

    // 点击高考两层合并情景：隐藏第 3 层
    fireEvent.click(screen.getByText("高考必考: 两层合并"));
    expect(screen.getByLabelText("抽样总数 n数值")).toHaveValue(80);
    expect(screen.getByLabelText("层 1 总体人数 N₁数值")).toHaveValue(400);
    expect(screen.getByLabelText("层 2 总体人数 N₂数值")).toHaveValue(600);
    expect(
      screen.queryByLabelText("层 3 总体人数 N₃数值"),
    ).not.toBeInTheDocument();

    // 手动调参：通过滑块或输入框失焦提交，应自动切回自由探索并恢复展示第 3 层
    const sampleSlider = screen.getByLabelText("抽样总数 n滑块");
    fireEvent.change(sampleSlider, { target: { value: "110" } });
    expect(screen.getByLabelText("层 3 总体人数 N₃数值")).toBeInTheDocument();
  });
});
