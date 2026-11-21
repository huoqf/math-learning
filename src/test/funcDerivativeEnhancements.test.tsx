import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@/test/mocks";

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
  SceneLegend: () => null,
  SceneLabelGroup: () => null,
}));

import { solveExternalTangents, PRESET_FUNCTIONS } from "@/math/derivative";
import { solveIsomorphism } from "@/math/transcendental";
import { DerivativeAnimation } from "@/features/derivative/DerivativeAnimation";
import { TranscendentalAnimation } from "@/features/derivativeTranscendental/TranscendentalAnimation";
import { DerivativeFormulasAnimation } from "@/features/derivativeFormulas/DerivativeFormulasAnimation";
import { SingleVarPage } from "@/features/constant/SingleVarPage";
import { CompositeAnimation } from "@/features/composite/CompositeAnimation";
import { ParityPage } from "@/features/funcProperties/ParityPage";

describe("函数与导数高阶专题补全与交互回归测试", () => {
  it("solveExternalTangents 能准确区分过点的切线条数（0条 / 多条）", () => {
    const quad = PRESET_FUNCTIONS.quadratic.fn;
    // 抛物线 y = x^2 内凹侧点 (0, 1) 无法作切线
    expect(solveExternalTangents(quad, 0, 1, -3, 3)).toHaveLength(0);
    // 抛物线外侧点 (0, -1) 可作 2 条对称切线（t = ±1）
    const quadTwo = solveExternalTangents(quad, 0, -1, -3, 3);
    expect(quadTwo).toHaveLength(2);
    expect(quadTwo[0].t).toBeCloseTo(-1, 2);
    expect(quadTwo[1].t).toBeCloseTo(1, 2);

    // 三次曲线 f(x) = x^3 - 3x 过外点 (1, -2.5) 存在 3 条切线，过曲线上一点 (1, -2) 存在 2 条切线（含偶数重切根）
    const cubic = PRESET_FUNCTIONS.cubic.fn;
    expect(solveExternalTangents(cubic, 1, -2.5, -3, 3).length).toBe(3);
    expect(solveExternalTangents(cubic, 1, -2, -3, 3).length).toBe(2);
  });

  it("DerivativeAnimation 支持切换过点求切线模式与 8x 放大镜开关", () => {
    render(<DerivativeAnimation />);
    fireEvent.click(screen.getByText("过点求切线"));
    expect(screen.getByText("过定点作切线设点方程")).toBeInTheDocument();
    expect(screen.getByText("过点可作切线条数")).toBeInTheDocument();

    fireEvent.click(screen.getByText("切线方程性质"));
    const loupeBtn = screen.getByText("8× 放大镜");
    fireEvent.click(loupeBtn);
    expect(screen.getByText("8× 局部放大 (以直代曲)")).toBeInTheDocument();
  });

  it("solveIsomorphism 指对同构计算在临界点及左右区间满足单调等价性", () => {
    const prodEq = solveIsomorphism(1.0, "prod_iso");
    expect(prodEq.u).toBeCloseTo(1.0, 5);
    expect(prodEq.satisfied).toBe(true);

    const prodFail = solveIsomorphism(0.5, "prod_iso");
    expect(prodFail.u).toBeLessThan(1.0);
    expect(prodFail.satisfied).toBe(false);

    const sumOk = solveIsomorphism(0.8, "sum_iso");
    expect(sumOk.satisfied).toBe(true);
  });

  it("TranscendentalAnimation：log/chain 模式重置不越界，指对同构模式正常切换", () => {
    render(<TranscendentalAnimation />);

    fireEvent.click(screen.getByText("对数放缩"));
    const resetButtons = screen.getAllByRole("button", {
      name: /恢复默认参数|重置/,
    });
    fireEvent.click(resetButtons[0]);
    expect(screen.queryByText(/定义域必须满足 x₀ > 0/)).toBeNull();

    fireEvent.click(screen.getByText("双基准对偶"));
    fireEvent.click(
      screen.getAllByRole("button", { name: /恢复默认参数|重置/ })[0],
    );
    expect(screen.queryByText(/无定义/)).toBeNull();

    fireEvent.click(screen.getByText("指对同构"));
    expect(screen.getByText("同构母函数")).toBeInTheDocument();
  });

  it("DerivativeFormulasAnimation 使用浅色主题 Toggle 且挂载 ParamPlayBar", () => {
    const { container } = render(<DerivativeFormulasAnimation />);
    expect(container.innerHTML).not.toContain("bg-slate-800");
    expect(screen.getAllByRole("switch").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("割线逼近切线 (Δx → 0)")).toBeInTheDocument();
  });

  it("SingleVarPage 集成 Toggle、ParamPlayBar 与标准解答分步导引", () => {
    render(<SingleVarPage />);
    expect(screen.getAllByRole("switch").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("标准解答分步")).toBeInTheDocument();
  });

  it("CompositeAnimation 支持生活应用分段阶梯计费建模预设", () => {
    render(<CompositeAnimation />);
    fireEvent.click(screen.getByText("阶梯水电费建模"));
    expect(
      screen.getByText("生活应用建模 · 阶梯水电费分段计费"),
    ).toBeInTheDocument();
  });

  it("ParityPage 开启奇偶不等式对照后右屏实时同步展示奇/偶抽象不等式结论", () => {
    render(<ParityPage />);
    expect(screen.queryByText("奇函数对称移项对照")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "奇偶不等式对照" }));
    expect(screen.getByText("奇函数对称移项对照")).toBeInTheDocument();
    expect(screen.getByText(/奇偶\+单调抽象不等式通法/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("二次抛物线"));
    expect(screen.getByText("偶函数绝对值脱壳对照")).toBeInTheDocument();
  });
});
