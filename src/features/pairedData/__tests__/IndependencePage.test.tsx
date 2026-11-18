import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../test/mocks";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

import { IndependencePage } from "../IndependencePage";
import { INDEPENDENCE_ANSWER_STEPS } from "@/data/registries/pairedData";

function renderPage() {
  return render(
    <MemoryRouter>
      <IndependencePage />
    </MemoryRouter>,
  );
}

describe("IndependencePage 独立性检验三屏联动测试", () => {
  it("正常挂载并渲染探究实验维度、分步导航器、列联表与卡方看板", () => {
    renderPage();

    expect(screen.getByText("探究实验维度")).toBeInTheDocument();
    expect(screen.getByText("列联表频数检验")).toBeInTheDocument();
    expect(screen.getByText("样本容量倍增效应")).toBeInTheDocument();
    expect(screen.getByText("高考标准解答分步走")).toBeInTheDocument();
    expect(screen.getByText("卡方检验值")).toBeInTheDocument();
  });

  it("支持切换样本容量倍增效应与自由探索频数调节", () => {
    renderPage();

    fireEvent.click(screen.getByText("样本容量倍增效应"));
    expect(screen.getByText("样本倍增倍率调节")).toBeInTheDocument();

    fireEvent.click(screen.getByText("自由探索"));
    expect(screen.getByText("倍增倍率与基准频数调节")).toBeInTheDocument();
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0);
  });

  it("点击 StepNavigator 步进切换时同步高亮对应解答步骤", () => {
    renderPage();

    fireEvent.click(screen.getByLabelText("下一步"));
    expect(screen.getByText("第 2 / 3 步")).toBeInTheDocument();
    expect(
      screen.getAllByText(INDEPENDENCE_ANSWER_STEPS[1].title).length,
    ).toBeGreaterThan(0);
  });
});
