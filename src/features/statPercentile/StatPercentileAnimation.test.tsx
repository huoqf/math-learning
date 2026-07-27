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

describe("StatPercentileAnimation smoke test", () => {
  it("renders without crashing", () => {
    render(<StatPercentileAnimation />);
    expect(screen.getByText("直方图与数字特征")).toBeInTheDocument();
    expect(screen.getByText("百分位数线性插值")).toBeInTheDocument();
    expect(screen.getByText("分层抽样与总方差")).toBeInTheDocument();
  });

  it("displays parameter section", () => {
    render(<StatPercentileAnimation />);
    expect(screen.getByText("参数调节")).toBeInTheDocument();
  });

  it("switches study mode on button click", () => {
    render(<StatPercentileAnimation />);
    const cumulativeBtn = screen.getByRole("radio", {
      name: "百分位数线性插值",
    });
    fireEvent.click(cumulativeBtn);
    expect(cumulativeBtn).toBeInTheDocument();
  });
});
