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

  it("displays parameter section and mode-isolated parameters", () => {
    render(<StatPercentileAnimation />);
    expect(screen.getByText("参数调节")).toBeInTheDocument();
    expect(screen.getByText("典型高考情境")).toBeInTheDocument();

    // 默认 histogram 模式展示对应专属情景（含新高考 6 组模型）
    expect(screen.getByText("自由探索")).toBeInTheDocument();
    expect(screen.getByText("新高考 6 组模型")).toBeInTheDocument();
    expect(screen.getByText("课本经典 5 组模型")).toBeInTheDocument();
    expect(screen.getByText("正偏态 (右偏长尾)")).toBeInTheDocument();

    // 直方图模式下展示分组数与分布偏斜度 shift，不应展示百分位数 p%
    expect(screen.getByText("直方图组数")).toBeInTheDocument();
    expect(screen.getByText("6组(新高考)")).toBeInTheDocument();
    expect(screen.getByText("5组(课本)")).toBeInTheDocument();
    expect(screen.getByLabelText("分布偏斜度 shift数值")).toBeInTheDocument();
    expect(screen.queryByLabelText("百分位数 p%数值")).not.toBeInTheDocument();

    // 切换到 cumulative 模式
    fireEvent.click(screen.getByText("百分位数线性插值"));
    expect(screen.getByLabelText("百分位数 p%数值")).toBeInTheDocument();
    expect(screen.getByLabelText("分布偏斜度 shift数值")).toBeInTheDocument();
  });

  it("switches study mode and synchronizes right panel title & quantities without unrelated stats", () => {
    render(<StatPercentileAnimation />);
    // 默认直方图看板
    expect(screen.getByText("直方图与数字特征看板")).toBeInTheDocument();
    expect(screen.getByText("估算众数 Mo (最高组中点)")).toBeInTheDocument();
    expect(screen.getByText("估算中位数 Me (面积二等分)")).toBeInTheDocument();
    expect(screen.getByText("估算平均数 x̄ (力矩重心)")).toBeInTheDocument();
    // 直方图看板不应展示不相干的四分位数或百分位数
    expect(screen.queryByText("下四分位数 Q₁ (25%)")).not.toBeInTheDocument();

    // 切换到累积频率模式
    const cumulativeMode = screen.getByText("百分位数线性插值");
    fireEvent.click(cumulativeMode);
    expect(screen.getByText("百分位数与累积频率看板")).toBeInTheDocument();
    // 左屏二级情景选项与右屏看板各包含一个匹配项
    expect(screen.getAllByText("下四分位数 Q₁ (25%)")).toHaveLength(2);
    expect(screen.getByText("四分位距 IQR (Q₃ - Q₁)")).toBeInTheDocument();

    // 切换到分层抽样模式
    const stratifiedMode = screen.getByText("分层抽样与总方差");
    fireEvent.click(stratifiedMode);
    expect(screen.getByText("分层抽样与总体方差看板")).toBeInTheDocument();
    expect(screen.getByText("总体规模 N")).toBeInTheDocument();
    expect(screen.getByText("高考必考: 两层合并")).toBeInTheDocument();
  });

  it("TipCard synchronizes dynamically with study mode and secondary scenarios", () => {
    render(<StatPercentileAnimation />);

    // 默认自由探索：展示【背景说明】、【初始条件】与【核心设问】
    expect(screen.getByText("【背景说明】")).toBeInTheDocument();
    expect(screen.getByText("【初始条件】")).toBeInTheDocument();
    expect(screen.getByText("【核心设问】")).toBeInTheDocument();
    expect(
      screen.getByText(/物理力矩与统计平衡跨学科情境/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/在中屏直接拖拽重心支点 ▲ 或在左屏切换组数/),
    ).toBeInTheDocument();

    // 点击正偏态
    fireEvent.click(screen.getByText("正偏态 (右偏长尾)"));
    expect(screen.getByText(/从业人员年收入抽样调研/)).toBeInTheDocument();
    expect(
      screen.getByText(/探究高收入\/高分调研中为何中位数比平均数更具稳健性/),
    ).toBeInTheDocument();

    // 切换到分层抽样两层合并
    fireEvent.click(screen.getByText("分层抽样与总方差"));
    fireEvent.click(screen.getByText("高考必考: 两层合并"));
    expect(
      screen.getByText(
        /某高中生体质健康调研，男生与女生体能测试存在显著性别差异/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/利用两层合并方差极速公式/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText("层 3 总体人数 N₃数值"),
    ).not.toBeInTheDocument();
  });
});
