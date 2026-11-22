import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children?: ReactNode }) => (
    <div data-testid="drei-html">{children}</div>
  ),
}));

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula, mode }: { formula: string; mode?: string }) => (
    <span data-testid="katex-formula" data-formula={formula} data-mode={mode}>
      {formula}
    </span>
  ),
}));

import { FormulaLabel3D } from "../FormulaLabel3D";

describe("FormulaLabel3D 清洗与透传渲染测试", () => {
  it("正常单反斜杠 LaTeX 公式原样透传给 KatexFormula", () => {
    render(
      <FormulaLabel3D
        position={{ x: 1, y: 2, z: 3 }}
        tex="\vec{n} = (1, 0, 2)"
      />,
    );
    const el = screen.getByTestId("katex-formula");
    expect(el).toHaveAttribute("data-formula", "\\vec{n} = (1, 0, 2)");
    expect(el).toHaveAttribute("data-mode", "inline");
  });

  it("误传双反斜杠公式前缀与向量下标时自动清洗归一化为合法单斜杠", () => {
    const { rerender } = render(
      <FormulaLabel3D position={{ x: 0, y: 0, z: 0 }} tex="\\frac{1}{2}" />,
    );
    expect(screen.getByTestId("katex-formula")).toHaveAttribute(
      "data-formula",
      "\\frac{1}{2}",
    );

    rerender(
      <FormulaLabel3D position={{ x: 0, y: 0, z: 0 }} tex="\\vec{n}_1" />,
    );
    expect(screen.getByTestId("katex-formula")).toHaveAttribute(
      "data-formula",
      "\\vec{n}_{1}",
    );
  });

  it("保留矩阵或换行符中的双反斜杠 (后接空白或非字母指令) 且过滤 ASCII 控制字符", () => {
    render(
      <FormulaLabel3D position={{ x: 0, y: 0, z: 0 }} tex={"a \\\\ b\x0b"} />,
    );
    expect(screen.getByTestId("katex-formula")).toHaveAttribute(
      "data-formula",
      "a \\\\ b",
    );
  });
});
