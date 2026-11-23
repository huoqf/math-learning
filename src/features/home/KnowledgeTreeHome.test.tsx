import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/data/knowledgeTree", () => ({
  knowledgeTree: [
    {
      id: "quadratic",
      title: "二次函数",
      chapter: "函数概念与性质",
      module: "函数",
      importance: "core",
      questionCategory: "foundation",
      animationIds: ["anim-quadratic"],
    },
    {
      id: "derivative",
      title: "导数的几何意义",
      chapter: "导数及其应用",
      module: "导数",
      importance: "gaokao",
      questionCategory: "solution_first",
      animationIds: ["anim-derivative-tangent"],
    },
    {
      id: "constant",
      title: "恒成立问题",
      chapter: "导数及其应用",
      module: "导数",
      importance: "hard",
      questionCategory: "solution_final",
      animationIds: ["anim-constant-single"],
    },
    {
      id: "know-sequence-geom",
      title: "等差数列通项与求和",
      chapter: "数列",
      module: "等差与等比数列",
      importance: "core",
      questionCategory: "solution_first",
      route: "/sequence-arithmetic",
      animationIds: ["anim-sequence-arithmetic"],
    },
    {
      id: "know-conic-line",
      title: "直线与圆锥曲线位置关系",
      chapter: "解析几何",
      module: "曲线与方程",
      importance: "gaokao",
      questionCategory: "solution_final",
      route: "/conic-line",
      animationIds: ["anim-conic-line"],
    },
    {
      id: "know-gaokao-new-def",
      title: "新定义综合压轴",
      chapter: "高考压轴与新定义",
      module: "新定义专题",
      importance: "hard",
      gaokaoTopic: "new_definition",
      questionCategory: "solution_final",
      route: "/gaokao-new-definition",
      animationIds: ["anim-gaokao-new-definition"],
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

  beforeEach(() => {
    mockNavigate.mockReset();
  });

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

  it("仅对声明支持 ?view=gaokao 的路由拼接查询参数，不对其他页面透传无效参数", () => {
    renderWithRouter(<KnowledgeTreeHome />);

    fireEvent.click(screen.getByText("等差数列通项与求和"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/sequence-arithmetic?view=gaokao",
    );

    mockNavigate.mockReset();
    fireEvent.click(screen.getByText("直线与圆锥曲线位置关系"));
    expect(mockNavigate).toHaveBeenCalledWith("/conic-line?view=gaokao");

    mockNavigate.mockReset();
    fireEvent.click(screen.getByText("新定义综合压轴"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/gaokao-new-definition?view=gaokao",
    );

    mockNavigate.mockReset();
    fireEvent.click(screen.getByText("二次函数"));
    expect(mockNavigate).toHaveBeenCalledWith("/quadratic");
  });

  it("支持教材同步五册递进/三大板块切换与按分册过滤", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    fireEvent.click(screen.getByText(/教材同步章节一览/));

    expect(screen.getByText("按人教A版五册同步递进")).toBeInTheDocument();
    expect(screen.getByText("二次函数")).toBeInTheDocument();
    expect(screen.getByText("导数的几何意义")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "必修一" }));
    expect(screen.getByText("二次函数")).toBeInTheDocument();
    expect(screen.queryByText("导数的几何意义")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "按三大板块" }));
    expect(
      screen.getByText("按代数/几何/三角统计板块聚合"),
    ).toBeInTheDocument();
    expect(screen.getByText("导数的几何意义")).toBeInTheDocument();
  });

  it("在高考大专题视图支持题型分层筛选与新定义题型卡片展示", () => {
    renderWithRouter(<KnowledgeTreeHome />);
    expect(
      screen.getByText("新高考 19 题新定义与创新压轴"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "大题压轴" }));
    expect(screen.getByText("恒成立问题")).toBeInTheDocument();
    expect(screen.getByText("新定义综合压轴")).toBeInTheDocument();
    expect(screen.queryByText("二次函数")).not.toBeInTheDocument();
  });
});
