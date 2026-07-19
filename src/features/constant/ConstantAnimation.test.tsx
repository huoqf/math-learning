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

import { ConstantAnimation } from "./ConstantAnimation";

describe("ConstantAnimation smoke test", () => {
  it("renders without crashing", () => {
    render(<ConstantAnimation />);
    expect(screen.getByText("单变量实验室")).toBeInTheDocument();
    expect(screen.getByText("双变量对决")).toBeInTheDocument();
  });

  it("displays scene selection section", () => {
    render(<ConstantAnimation />);
    expect(screen.getByText("选择场景")).toBeInTheDocument();
  });

  it("switches to double variable mode", () => {
    render(<ConstantAnimation />);
    fireEvent.click(screen.getByText("双变量对决"));
    expect(screen.getByText("高考双变量博弈")).toBeInTheDocument();
  });

  it("shows single variable sub-modes by default", () => {
    render(<ConstantAnimation />);
    expect(screen.getByText("参变分离法")).toBeInTheDocument();
    expect(screen.getByText("直接最值讨论")).toBeInTheDocument();
    expect(screen.getByText("恒成立 (∀x)")).toBeInTheDocument();
    expect(screen.getByText("存在性 (∃x)")).toBeInTheDocument();
  });

  it("has MathPanel with correct title for single mode", () => {
    render(<ConstantAnimation />);
    expect(screen.getByText("单自变量看板")).toBeInTheDocument();
  });
});
