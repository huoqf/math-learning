import { describe, it, expect } from "vitest";
import {
  splitAtTopLevelEquals,
  splitAtTopLevelBinary,
  splitAtTopLevelImplies,
  normalizeFractionRowSpacing,
  findTopLevelEqualsIndices,
} from "../latexUtils";

describe("latexUtils 定界符深度追踪与公式换行测试", () => {
  it("正确识别 \\langle ... \\rangle 内部的逗号不属于顶层", () => {
    const latex =
      "\\sin\\theta = |\\cos\\langle\\vec{l}, \\vec{n}\\rangle| = \\frac{|\\vec{l} \\cdot \\vec{n}|}{|\\vec{l}| \\cdot |\\vec{n}|}";
    const equals = findTopLevelEqualsIndices(latex);

    // 应该只找到 2 个顶层等号，不会被 \langle\vec{l}, \vec{n}\rangle 内部打断
    expect(equals.length).toBe(2);

    const split = splitAtTopLevelEquals(latex);
    expect(split).not.toBeNull();
    // 连等式应该在合适的位置断开，左右两部分均完整无乱码
    expect(split![0]).toContain("\\sin\\theta");
    expect(split![0]).toContain("\\langle\\vec{l}, \\vec{n}\\rangle");
    expect(split![1].startsWith("=")).toBe(true);
    expect(split![1]).toContain("\\frac");
  });

  it("正确处理二面角向量法公式中的 \\langle\\rangle 与 \\quad", () => {
    const latex =
      "\\cos\\langle\\vec{n_1},\\vec{n_2}\\rangle = \\frac{\\vec{n_1} \\cdot \\vec{n_2}}{|\\vec{n_1}||\\vec{n_2}|}";
    const split = splitAtTopLevelEquals(latex);
    expect(split).not.toBeNull();
    expect(split![0]).toBe("\\cos\\langle\\vec{n_1},\\vec{n_2}\\rangle");
    expect(split![1]).toBe(
      "= \\frac{\\vec{n_1} \\cdot \\vec{n_2}}{|\\vec{n_1}||\\vec{n_2}|}",
    );
  });

  it("正确处理长多项式的二元 +/- 运算符断行", () => {
    const latex = "x^2 + 2ax + a^2 - 4b";
    const split = splitAtTopLevelBinary(latex);
    expect(split).not.toBeNull();
    expect(split![0]).toBe("x^2");
    expect(split![1]).toBe("+ 2ax + a^2 - 4b");
  });

  it("跳过一元正负号（如负数项）", () => {
    const latex = "-3x^2 + 5x";
    const split = splitAtTopLevelBinary(latex);
    expect(split).not.toBeNull();
    expect(split![0]).toBe("-3x^2");
    expect(split![1]).toBe("+ 5x");
  });

  it("正确识别顶层推导符 \\Rightarrow 并拆分长推导式", () => {
    const latex =
      "PA \\perp \\text{平面 } ABCD, \\; PA \\subset \\text{平面 } PAD \\;\\Rightarrow\\; \\text{平面 } PAD \\perp \\text{平面 } ABCD";
    const split = splitAtTopLevelImplies(latex);
    expect(split).not.toBeNull();
    expect(split![0]).toBe(
      "PA \\perp \\text{平面 } ABCD, \\; PA \\subset \\text{平面 } PAD",
    );
    expect(split![1]).toBe(
      "\\Rightarrow\\; \\text{平面 } PAD \\perp \\text{平面 } ABCD",
    );
  });

  it("正确处理大括号方程组加顶层结论的拆分", () => {
    const latex =
      "\\begin{cases} \\frac{PE}{PB} = \\frac{PF}{PC} \\;\\Rightarrow\\; EF \\parallel AD \\\\ EF \\not\\subset \\text{平面 }PAD \\\\ AD \\subset \\text{平面 }PAD \\end{cases} \\;\\Rightarrow\\; EF \\parallel \\text{平面 }PAD";
    const split = splitAtTopLevelImplies(latex);
    expect(split).not.toBeNull();
    expect(split![0].startsWith("\\begin{cases}")).toBe(true);
    expect(split![0].endsWith("\\end{cases}")).toBe(true);
    expect(split![1]).toBe("\\Rightarrow\\; EF \\parallel \\text{平面 }PAD");
  });

  it("normalizeFractionRowSpacing 自动为多行环境中的分式注入行距补偿并将 frac 提升为 dfrac", () => {
    const raw =
      "\\begin{cases} \\frac{PE}{PB} = \\frac{PF}{PC} \\;\\Rightarrow\\; EF \\parallel AD \\\\ EF \\not\\subset \\text{平面 }PAD \\\\ AD \\subset \\text{平面 }PAD \\end{cases}";
    const normalized = normalizeFractionRowSpacing(raw);
    expect(normalized).toContain("\\dfrac{PE}{PB}");
    expect(normalized).toContain("\\\\[0.65em]");
    expect(normalized).toContain("\\\\[0.2em]");
  });
});
