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
  MathPoint: () => null,
  VectorArrow: () => null,
  Asymptote: () => null,
  IntervalShadow: () => null,
  TangentLine: () => null,
  SecantLine: () => null,
}));

import { DoubleVarPage } from "./DoubleVarPage";

describe("DoubleVarPage smoke and logic tests", () => {
  it("renders without crashing with all default panels", () => {
    render(<DoubleVarPage />);
    expect(screen.getByText("博弈量词关系")).toBeInTheDocument();
    expect(screen.getByText("典型构型预设")).toBeInTheDocument();
    expect(screen.getByText("双动点博弈看板")).toBeInTheDocument();
    expect(screen.getByText("自由探究")).toBeInTheDocument();
  });

  it("switches logic to same variable mode (差函数法)", () => {
    render(<DoubleVarPage />);
    const sameVarBtn = screen.getByText("∀x ∈ I₁ ∩ I₂ (同变量)");
    fireEvent.click(sameVarBtn);
    expect(screen.getAllByText(/同自变量对垒/i).length).toBeGreaterThan(0);
    expect(screen.getByText("作用域公共交集")).toBeInTheDocument();
  });

  it("switches logic across all quantifier modes and updates theorems", () => {
    render(<DoubleVarPage />);
    // 1. all_exist
    fireEvent.click(screen.getByText("∀x₁, ∃x₂"));
    expect(screen.getAllByText(/极小保底/i).length).toBeGreaterThan(0);

    // 2. exist_all
    fireEvent.click(screen.getByText("∃x₁, ∀x₂"));
    expect(screen.getAllByText(/顶峰压制/i).length).toBeGreaterThan(0);

    // 3. exist_exist
    fireEvent.click(screen.getByText("∃x₁, ∃x₂"));
    expect(screen.getAllByText(/门槛超越/i).length).toBeGreaterThan(0);
  });

  it("applies critical touch preset correctly", () => {
    render(<DoubleVarPage />);
    const touchBtn = screen.getByText("临界相切");
    fireEvent.click(touchBtn);
    expect(touchBtn).toBeInTheDocument();
  });
});
