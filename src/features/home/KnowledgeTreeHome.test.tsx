import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

vi.mock("@/data/knowledgeTree", () => ({
  knowledgeTree: [
    {
      id: "quadratic",
      title: "二次函数",
      chapter: "函数概念与性质",
      module: "函数",
      importance: "core",
      animationIds: ["anim-quadratic"],
    },
    {
      id: "derivative",
      title: "导数的几何意义",
      chapter: "导数及其应用",
      module: "导数",
      importance: "gaokao",
      animationIds: ["anim-derivative-tangent"],
    },
    {
      id: "constant",
      title: "恒成立问题",
      chapter: "导数及其应用",
      module: "导数",
      importance: "hard",
      animationIds: ["anim-constant-single"],
    },
    {
      id: "locked-node",
      title: "数列求和",
      chapter: "数列",
      module: "数列",
      importance: "basic",
      animationIds: [],
    },
  ],
}));

import { KnowledgeTreeHome } from "./KnowledgeTreeHome";

describe("KnowledgeTreeHome smoke test", () => {
  const renderWithRouter = (component: React.ReactNode) =>
    render(<MemoryRouter>{component}</MemoryRouter>);

  it("renders without crashing", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    expect(screen.getByText("知识地图实验室")).toBeInTheDocument();
  });

  it("displays statistics", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    expect(screen.getByText("已激活实验")).toBeInTheDocument();
    expect(screen.getByText("总规划节点")).toBeInTheDocument();
    expect(screen.getByText("数学核心章")).toBeInTheDocument();
  });

  it("displays section categories", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    expect(screen.getByText("代数与函数")).toBeInTheDocument();
    expect(screen.getByText("几何与向量")).toBeInTheDocument();
    expect(screen.getByText("三角与统计")).toBeInTheDocument();
  });

  it('shows active nodes with "实验室已开放" label', () => {
    renderWithRouter(<KnowledgeTreeHome />);
    const openLabels = screen.getAllByText("实验室已开放");
    expect(openLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows locked nodes with "规划中" label', () => {
    renderWithRouter(<KnowledgeTreeHome />);
    const plannedLabels = screen.getAllByText("规划中");
    expect(plannedLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("displays active node titles", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    expect(screen.getByText("二次函数")).toBeInTheDocument();
    expect(screen.getByText("导数的几何意义")).toBeInTheDocument();
    expect(screen.getByText("恒成立问题")).toBeInTheDocument();
  });

  it("displays locked node title", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    expect(screen.getByText("数列求和")).toBeInTheDocument();
  });

  it("prioritizes gaokao/hard nodes in 高考大专题 view and preserves chapter order in 教材同步 view", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    // 默认处于新高考大专题视图：同属 func_derivative 专题下，gaokao 节点排在 core 节点之前
    const gaokaoTitles = screen
      .getAllByRole("heading", { level: 4 })
      .map((el) => el.textContent);
    expect(gaokaoTitles.indexOf("导数的几何意义")).toBeLessThan(
      gaokaoTitles.indexOf("二次函数"),
    );

    // 切换到教材同步章节视图：保持教材章节原始顺序（二次函数在导数的几何意义之前）
    fireEvent.click(screen.getByText(/教材同步章节一览/));
    const textbookTitles = screen
      .getAllByRole("heading", { level: 4 })
      .map((el) => el.textContent);
    expect(textbookTitles.indexOf("二次函数")).toBeLessThan(
      textbookTitles.indexOf("导数的几何意义"),
    );
  });
});
