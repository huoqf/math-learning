/**
 * 数值格式化 SSOT（src/utils/mathFormat.ts）单元测试
 *
 * 重点覆盖 `formatCoefTerm` 的「系数 ±1 省略」规则：
 * 高中数学记号中 `1x` / `-1x` 一律写作 `x` / `-x`，`2.0x` 写作 `2x`。
 * 该规则此前散落在 4 个页面的主公式与 3 处渐近线/图例标签里各写一遍，
 * 且多数写成了 `\color{}{1.0}x`，导致中屏出现 `f(x) = 1.0x + \frac{4.0}{x}`。
 */

import { describe, it, expect } from "vitest";
import {
  formatMathNumber,
  formatCoefTerm,
  formatShiftParen,
} from "../mathFormat";

describe("formatMathNumber：去尾零与整数化", () => {
  it("整数不带小数点，非整数最多 2 位并去尾零", () => {
    expect(formatMathNumber(1)).toBe("1");
    expect(formatMathNumber(2.0)).toBe("2");
    expect(formatMathNumber(2.5)).toBe("2.5");
    expect(formatMathNumber(0.45)).toBe("0.45");
    expect(formatMathNumber(-3)).toBe("-3");
    expect(formatMathNumber(0)).toBe("0");
    expect(formatMathNumber(-0.001)).toBe("0");
  });
});

describe("formatCoefTerm：系数 ±1 省略（课标记号规范）", () => {
  it("系数 1 省略为裸主体，且不施加语义色", () => {
    expect(formatCoefTerm(1, "x")).toBe("x");
    expect(formatCoefTerm(1, "(x - 2)")).toBe("(x - 2)");
    expect(formatCoefTerm(1, "x_1 x_2")).toBe("x_1 x_2");
    // 系数不出现时不得给变量染色，否则造成「x 属于参数 a」的伪对应
    expect(formatCoefTerm(1, "x", "#EF4444")).toBe("x");
  });

  it("系数 -1 省略为 -主体", () => {
    expect(formatCoefTerm(-1, "x")).toBe("-x");
    expect(formatCoefTerm(-1, "(x - 2)")).toBe("-(x - 2)");
  });

  it("其余系数保留，带色时只染系数本身", () => {
    expect(formatCoefTerm(2, "x")).toBe("2x");
    expect(formatCoefTerm(-2.5, "x")).toBe("-2.5x");
    // 整数系数不得写成 2.0x
    expect(formatCoefTerm(2.0, "x")).toBe("2x");
    expect(formatCoefTerm(2, "x", "#EF4444")).toBe("\\color{#EF4444}{2}x");
  });

  it("系数 0 返回空串，供上层拼接时省去整项", () => {
    expect(formatCoefTerm(0, "x")).toBe("");
    expect(formatCoefTerm(0, "x", "#EF4444")).toBe("");
  });

  it("与既有 buildSlopeInterceptLatex 的 ±1 口径一致", () => {
    // 该函数（src/math/derivative.ts）对 1 → "x"、-1 → "-x" 的处理是本规则的先例
    expect(formatCoefTerm(1, "x")).toBe("x");
    expect(formatCoefTerm(-1, "x")).toBe("-x");
  });
});

describe("formatShiftParen：平移因式不得出现双负号", () => {
  it("h > 0 写 (x - h)，h < 0 写 (x + |h|)，h = 0 退化为 x", () => {
    expect(formatShiftParen(2)).toBe("(x - 2)");
    expect(formatShiftParen(0.5)).toBe("(x - 0.5)");
    expect(formatShiftParen(-2)).toBe("(x + 2)");
    expect(formatShiftParen(-0.5)).toBe("(x + 0.5)");
    expect(formatShiftParen(0)).toBe("x");
    // 旧实现直接拼 `(x - ${h})`，h = -2 时印成 (x - -2)
    expect(formatShiftParen(-2)).not.toContain("- -");
  });
});
