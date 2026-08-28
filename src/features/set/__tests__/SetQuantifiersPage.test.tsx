import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { SetQuantifiersPage } from "../SetQuantifiersPage";

describe("SetQuantifiersPage smoke & interaction test", () => {
  it("renders without crashing with header formula and tabs", () => {
    render(
      <MemoryRouter>
        <SetQuantifiersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("全称命题 ∀")).toBeInTheDocument();
    expect(screen.getByText("存在命题 ∃")).toBeInTheDocument();
    expect(screen.getByText("双变量博弈")).toBeInTheDocument();
    expect(screen.getByText("量词与逻辑看板")).toBeInTheDocument();
  });

  it("switches to existential quantifier tab smoothly", () => {
    render(
      <MemoryRouter>
        <SetQuantifiersPage />
      </MemoryRouter>,
    );

    const existTab = screen.getByText("存在命题 ∃");
    fireEvent.click(existTab);

    expect(screen.getByText("存在命题证实原则：")).toBeInTheDocument();
  });

  it("switches to dual variables game tab and displays scenarios", () => {
    render(
      <MemoryRouter>
        <SetQuantifiersPage />
      </MemoryRouter>,
    );

    const dualTab = screen.getByText("双变量博弈");
    fireEvent.click(dualTab);

    expect(screen.getByText("高考双变量模型")).toBeInTheDocument();
    expect(screen.getByText("∀x₁ ∀x₂ 恒大压制")).toBeInTheDocument();
    expect(screen.getByText("∀x₁ ∃x₂ 值域包含")).toBeInTheDocument();
  });
});
