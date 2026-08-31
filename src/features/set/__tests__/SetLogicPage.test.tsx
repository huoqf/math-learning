import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { SetLogicPage } from "../SetLogicPage";

describe("SetLogicPage 充分必要条件页面测试", () => {
  it("页面挂载成功并渲染核心面板与控制项", () => {
    render(
      <MemoryRouter>
        <SetLogicPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("参数调节与位置控制")).toBeInTheDocument();
    expect(screen.getByText("教学导引")).toBeInTheDocument();
    expect(screen.getByText("充分必要条件判定四步法：")).toBeInTheDocument();
    expect(screen.getByText("逻辑条件看板")).toBeInTheDocument();
  });
});
