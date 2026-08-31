import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { SetVennPage } from "../SetVennPage";

describe("SetVennPage 集合运算 Venn 图页面测试", () => {
  it("页面挂载成功并渲染集合运算类型与看板", () => {
    render(
      <MemoryRouter>
        <SetVennPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("集合运算")).toBeInTheDocument();
    expect(screen.getByText("教学导引")).toBeInTheDocument();
    expect(screen.getByText("集合运算与 Venn 图：")).toBeInTheDocument();
    expect(screen.getByText("集合运算看板")).toBeInTheDocument();
  });

  it("平滑切换 Venn 运算模式 (交集/并集/补集/差集)", () => {
    render(
      <MemoryRouter>
        <SetVennPage />
      </MemoryRouter>,
    );

    const unionOption = screen.getByText("A ∪ B");
    fireEvent.click(unionOption);
    expect(unionOption).toBeInTheDocument();

    const compOption = screen.getByText("∁UA");
    fireEvent.click(compOption);
    expect(compOption).toBeInTheDocument();

    const diffOption = screen.getByText("A \\ B");
    fireEvent.click(diffOption);
    expect(diffOption).toBeInTheDocument();
  });
});
