import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@/test/mocks";
import ObliqueDrawingAnimation from "../ObliqueDrawingAnimation";

// Mock KaTeX and SVG
vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

vi.mock("@/components/Math", () => ({
  SceneLegend: () => <div data-testid="scene-legend" />,
}));

describe("ObliqueDrawingAnimation 页面集成与冒烟测试", () => {
  it("正常挂载并渲染左屏控制台与右屏看板", () => {
    render(<ObliqueDrawingAnimation />);

    // 验证标题与模式切换存在
    expect(screen.getByText("教学模式")).toBeInTheDocument();
    expect(screen.getByText("平面多边形")).toBeInTheDocument();
    expect(screen.getByText("空间几何体")).toBeInTheDocument();
    expect(screen.getByText("斜二测画法与面积推导看板")).toBeInTheDocument();
  });

  it("切换到空间几何体模式能平滑刷新", () => {
    render(<ObliqueDrawingAnimation />);

    const prismBtn = screen.getByText("空间几何体");
    fireEvent.click(prismBtn);

    expect(screen.getByText("底面横向尺寸 a")).toBeInTheDocument();
    expect(screen.getByText("几何体直观高 h")).toBeInTheDocument();
  });
});
