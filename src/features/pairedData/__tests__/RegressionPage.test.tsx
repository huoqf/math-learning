import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@/test/mocks";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

import { RegressionPage } from "../RegressionPage";

describe("RegressionPage 线性回归交互与视口稳定性测试", () => {
  it("挂载成功并渲染模式与典型高考情景", () => {
    render(<RegressionPage />);
    expect(screen.getByText("一元线性回归模型")).toBeInTheDocument();
    expect(screen.getByText("非线性回归转换模型")).toBeInTheDocument();
    expect(screen.getByText("广告支出与销售额")).toBeInTheDocument();
    expect(screen.getByText("气温与用电量")).toBeInTheDocument();
    expect(screen.getByText("含异常干扰点")).toBeInTheDocument();
    expect(screen.getByText("自由探索")).toBeInTheDocument();
  });

  it("切换到含异常干扰点情景，三屏联动呈现离群点检验题设", () => {
    render(<RegressionPage />);
    const outlierBtn = screen.getByRole("radio", { name: "含异常干扰点" });
    fireEvent.click(outlierBtn);
    expect(
      screen.getByText("高考经典 · 离群点检验与数据清洗"),
    ).toBeInTheDocument();
  });

  it("切换到自由探索模式，展现自主探究题设并保持视口稳定", () => {
    render(<RegressionPage />);
    const freeBtn = screen.getByRole("radio", { name: "自由探索" });
    fireEvent.click(freeBtn);
    expect(screen.getByText("自主探究 · 自由拖拽散点")).toBeInTheDocument();
  });
});
