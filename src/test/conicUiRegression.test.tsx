import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

import { ConicPropertiesAnimation } from "@/features/conicProperties/ConicPropertiesAnimation";
import { ConicLocusInvariantsAnimation } from "@/features/conicLocusInvariants/ConicLocusInvariantsAnimation";
import { ConicLineAnimation } from "@/features/conicLine/ConicLineAnimation";

describe("圆锥曲线二轮修复 UI 与交互回归", () => {
  it("ConicPropertiesAnimation: 切换双曲线与「焦点在 y 轴」后，中屏特征矩形角标与渐近线公式同步更新", () => {
    const { container } = render(<ConicPropertiesAnimation />);

    fireEvent.click(screen.getByText("双曲线"));
    fireEvent.click(screen.getByText("焦点在 y 轴"));

    expect(container.textContent).toContain("M(b, a)");
    expect(container.textContent).toContain("\\frac{y^2}");
    expect(container.textContent).toContain("y = \\pm \\frac{a}{b}x");
  });

  it("ConicLocusInvariantsAnimation: 切换三种通法与 StepNavigator 分步聚光均正常联动", () => {
    const { container } = render(<ConicLocusInvariantsAnimation />);

    // 默认处于「全图亮」状态，无步骤围栏与右屏聚焦框
    expect(screen.getByText("全图亮")).toBeInTheDocument();
    expect(container.querySelector("[data-focus-step]")).toBeNull();
    expect(container.querySelector('rect[stroke-dasharray="7 4"]')).toBeNull();

    // 点击下一步：自动进入「聚光开」并高亮第 2 步 + 围栏
    fireEvent.click(screen.getByRole("button", { name: /下一步/ }));
    expect(screen.getByText("聚光开")).toBeInTheDocument();
    const focusedLocus = container.querySelector('[data-focus-step="true"]');
    expect(focusedLocus).not.toBeNull();
    expect(focusedLocus?.textContent).toContain("代入");
    expect(
      container.querySelector('rect[stroke-dasharray="7 4"]'),
    ).not.toBeNull();

    // 切回全图亮后不再显示步骤围栏与右屏聚焦框
    fireEvent.click(screen.getByText("聚光开"));
    expect(screen.getByText("全图亮")).toBeInTheDocument();
    expect(container.querySelector("[data-focus-step]")).toBeNull();
    expect(container.querySelector('rect[stroke-dasharray="7 4"]')).toBeNull();

    // 切到第三定义斜率积并切换椭圆/双曲线
    fireEvent.click(screen.getByText("第三定义斜率积"));
    expect(container.textContent).toContain("e^2 - 1");
    fireEvent.click(screen.getByText("双曲线"));
    expect(container.textContent).toContain("\\frac{b^2}{a^2}");

    // 切到常规联立过定点
    fireEvent.click(screen.getByText("常规联立过定点"));
    expect(container.textContent).toContain("k_{A_0A} \\cdot k_{A_0B}");
    expect(container.textContent).toContain("恒过定点 Q");
  });

  it("ConicLineAnimation: 接入 StepNavigator 后默认全图亮，点下一步切换聚光聚焦且双曲线切换不崩溃", () => {
    const { container } = render(<ConicLineAnimation />);

    expect(screen.getByText("全图亮")).toBeInTheDocument();
    expect(container.querySelector("[data-focus-step]")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /下一步/ }));
    expect(screen.getByText("聚光开")).toBeInTheDocument();
    const focusedLine = container.querySelector('[data-focus-step="true"]');
    expect(focusedLine).not.toBeNull();
    expect(focusedLine?.textContent).toContain("建模");
    expect(
      container.querySelector('rect[stroke-dasharray="7 4"]'),
    ).not.toBeNull();

    fireEvent.click(screen.getByText("双曲线"));
    expect(container.textContent).toContain("双曲线");
  });
});
