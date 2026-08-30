import { describe, it, expect } from "vitest";
import { buildSequencePanel } from "../sequence";

describe("Sequence MathPanel Builder Tests — 数列右屏看板与高考考点生成", () => {
  describe("等差数列看板 (arithmetic)", () => {
    it("线性函数透视 (linear)", () => {
      const panel = buildSequencePanel(
        { a1: 3, d: -1, N: 6 },
        { activeMode: "arithmetic", arithmeticSubMode: "linear" },
      );
      expect(panel.quantities.length).toBeGreaterThanOrEqual(2);
      expect(panel.theorems.length).toBeGreaterThanOrEqual(2);
      expect(panel.gaokaoPoints.length).toBeGreaterThanOrEqual(1);
      panel.quantities.forEach((q) => {
        expect(q.value).not.toContain("NaN");
        expect(q.value).not.toContain("undefined");
      });
    });

    it("高斯倒序相加 (gauss)", () => {
      const panel = buildSequencePanel(
        { a1: 1, d: 2, N: 10 },
        { activeMode: "arithmetic", arithmeticSubMode: "gauss" },
      );
      expect(panel.quantities.some((q) => q.label.includes("首尾和"))).toBe(
        true,
      );
      expect(panel.theorems.some((t) => t.name.includes("高斯倒序相加"))).toBe(
        true,
      );
    });

    it("二次函数最值 (quadratic)", () => {
      const panel = buildSequencePanel(
        { a1: 6, d: -2, N: 5 },
        { activeMode: "arithmetic", arithmeticSubMode: "quadratic" },
      );
      expect(panel.quantities.some((q) => q.label.includes("最大值项"))).toBe(
        true,
      );
      expect(panel.theorems.some((t) => t.name.includes("二次函数模型"))).toBe(
        true,
      );
    });

    it("等长片段和 (segment)", () => {
      const panel = buildSequencePanel(
        { a1: 2, d: 3, N: 9, kSegment: 3 },
        { activeMode: "arithmetic", arithmeticSubMode: "segment" },
      );
      expect(panel.quantities.some((q) => q.label.includes("片段公差"))).toBe(
        true,
      );
      expect(panel.theorems.some((t) => t.name.includes("等长片段和"))).toBe(
        true,
      );
    });

    it("绝对值求和 (absSum)", () => {
      const panel = buildSequencePanel(
        { a1: 5, d: -2, N: 6 },
        { activeMode: "arithmetic", arithmeticSubMode: "absSum" },
      );
      expect(panel.quantities.some((q) => q.label.includes("绝对值总和"))).toBe(
        true,
      );
      expect(
        panel.theorems.some((t) => t.name.includes("绝对值数列求和")),
      ).toBe(true);
    });
  });

  describe("等比数列看板 (geometric)", () => {
    it("指数函数与形态 (exponential)", () => {
      const panel = buildSequencePanel(
        { a1: 2, q: 0.5, N: 5 },
        { activeMode: "geometric", geometricSubMode: "exponential" },
      );
      expect(
        panel.quantities.some((q) => q.label.includes("公比形态特征")),
      ).toBe(true);
      expect(panel.theorems.some((t) => t.name.includes("指数模型"))).toBe(
        true,
      );
    });

    it("错位相减法推导 (staggerSum)", () => {
      const panel = buildSequencePanel(
        { a1: 1, q: 2, N: 5 },
        { activeMode: "geometric", geometricSubMode: "staggerSum" },
      );
      expect(panel.quantities.some((q) => q.label.includes("错位项"))).toBe(
        true,
      );
      expect(panel.theorems.some((t) => t.name.includes("错位相减法"))).toBe(
        true,
      );
    });

    it("前 n 项积极值 (productMax)", () => {
      const panel = buildSequencePanel(
        { a1: 4, q: 0.5, N: 5 },
        { activeMode: "geometric", geometricSubMode: "productMax" },
      );
      expect(panel.quantities.some((q) => q.label.includes("项积"))).toBe(true);
      expect(
        panel.theorems.some((t) => t.name.includes("对数二次函数模型")),
      ).toBe(true);
    });

    it("无穷递缩等比几何 (tessellation)", () => {
      const panel = buildSequencePanel(
        { a1: 1, q: 0.5, N: 6 },
        { activeMode: "geometric", geometricSubMode: "tessellation" },
      );
      expect(panel.quantities.some((q) => q.label.includes("无穷递缩和"))).toBe(
        true,
      );
      expect(panel.theorems.some((t) => t.name.includes("无穷递缩"))).toBe(
        true,
      );
    });
  });

  describe("求和五大模型看板 (models)", () => {
    it("差比数列错位相减 (arith-geo)", () => {
      const panel = buildSequencePanel(
        { a1: 1, d: 2, q: 0.5, N: 4 },
        { activeMode: "models", subModel: "arith-geo" },
      );
      expect(panel.theorems.some((t) => t.name.includes("错位相减法"))).toBe(
        true,
      );
      expect(panel.gaokaoPoints.length).toBeGreaterThanOrEqual(2);
    });

    it("裂项相消 (telescoping)", () => {
      const standard = buildSequencePanel(
        { N: 5, teleGap: 1 },
        { activeMode: "models", subModel: "telescoping" },
      );
      expect(standard.theorems.some((t) => t.name.includes("标准裂项"))).toBe(
        true,
      );

      const cross = buildSequencePanel(
        { N: 5, teleGap: 2 },
        { activeMode: "models", subModel: "telescoping" },
      );
      expect(cross.theorems.some((t) => t.name.includes("跨项裂项"))).toBe(
        true,
      );

      const radical = buildSequencePanel(
        { N: 5, teleGap: 3 },
        { activeMode: "models", subModel: "telescoping" },
      );
      expect(radical.theorems.some((t) => t.name.includes("根式有理化"))).toBe(
        true,
      );
    });

    it("绝对值分段求和 (abs-sum)", () => {
      const panel = buildSequencePanel(
        { a1: 5, d: -2, N: 5 },
        { activeMode: "models", subModel: "abs-sum" },
      );
      expect(panel.theorems.some((t) => t.name.includes("绝对值数列"))).toBe(
        true,
      );
    });

    it("分组求和 (grouped)", () => {
      const panel = buildSequencePanel(
        { a1: 2, d: 2, q: 2, N: 4 },
        { activeMode: "models", subModel: "grouped" },
      );
      expect(panel.theorems.some((t) => t.name.includes("分组转化"))).toBe(
        true,
      );
    });

    it("奇偶并项 (odd-even)", () => {
      const panel = buildSequencePanel(
        { N: 6 },
        { activeMode: "models", subModel: "odd-even" },
      );
      expect(panel.theorems.some((t) => t.name.includes("奇偶并项"))).toBe(
        true,
      );
    });
  });

  describe("递推六大模型看板 (recurrence)", () => {
    it("一阶常系数平移待定 (linear-pan)", () => {
      const panel = buildSequencePanel(
        { a1: 3, p_rec: 2, q_rec: 1, N: 4 },
        { activeMode: "recurrence", subModel: "linear-pan" },
      );
      expect(panel.theorems.some((t) => t.name.includes("待定系数法"))).toBe(
        true,
      );
      expect(panel.mnemonic).toBeDefined();
    });

    it("累加法 (accumulation)", () => {
      const panel = buildSequencePanel(
        { a1: 1, stepParam: 2, N: 4 },
        {
          activeMode: "recurrence",
          subModel: "accumulation",
          accumFnType: "arithmetic",
        },
      );
      expect(panel.theorems.some((t) => t.name.includes("累加法原理"))).toBe(
        true,
      );
    });

    it("累乘法 (multiplication)", () => {
      const panel = buildSequencePanel(
        { a1: 1, N: 4 },
        {
          activeMode: "recurrence",
          subModel: "multiplication",
          multType: "n_over_n1",
        },
      );
      expect(panel.theorems.some((t) => t.name.includes("累乘法原理"))).toBe(
        true,
      );
    });

    it("指数非齐次同除 (non-homogeneous)", () => {
      const resonant = buildSequencePanel(
        { a1: 1, p_rec: 2, q_rec: 1, r_rec: 2, N: 4 },
        { activeMode: "recurrence", subModel: "non-homogeneous" },
      );
      expect(resonant.theorems.some((t) => t.name.includes("共振临界"))).toBe(
        true,
      );

      const nonRes = buildSequencePanel(
        { a1: 2, p_rec: 2, q_rec: 1, r_rec: 3, N: 4 },
        { activeMode: "recurrence", subModel: "non-homogeneous" },
      );
      expect(
        nonRes.theorems.some((t) => t.name.includes("一阶非齐次指数型")),
      ).toBe(true);
    });

    it("倒数分式递推 (reciprocal)", () => {
      const linearRecip = buildSequencePanel(
        { a1: 1, coefA: 1, coefB: 1, coefC: 1, N: 3 },
        { activeMode: "recurrence", subModel: "reciprocal" },
      );
      expect(
        linearRecip.theorems.some((t) => t.name.includes("倒数构造等差数列")),
      ).toBe(true);
    });

    it("二阶递推特征方程 (second-order)", () => {
      const panel = buildSequencePanel(
        { a1: 1, a2: 3, p_rec: 3, q_rec: -2, N: 5 },
        { activeMode: "recurrence", subModel: "second-order" },
      );
      expect(panel.theorems.some((t) => t.name.includes("特征方程法"))).toBe(
        true,
      );
    });
  });
});
