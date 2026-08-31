import { describe, it, expect } from "vitest";
import {
  getQuadraticExtrema,
  solveSingleVarQuantifier,
  solveDualVarQuantifier,
} from "./quantifiers";

describe("quantifiers pure math and logic tests", () => {
  describe("getQuadraticExtrema 二次函数区间极值", () => {
    it("开口向上，对称轴在区间内：f(x) = (x - 1)^2 + 2 在 [0, 3] 上的极值", () => {
      const res = getQuadraticExtrema(1, 1, 2, 0, 3);
      expect(res.minVal).toBe(2);
      expect(res.xMin).toBe(1);
      expect(res.maxVal).toBe(6); // (3-1)^2+2 = 6
      expect(res.xMax).toBe(3);
    });

    it("开口向下，对称轴在区间内：f(x) = - (x - 1)^2 + 4 在 [0, 3] 上的极值", () => {
      const res = getQuadraticExtrema(-1, 1, 4, 0, 3);
      expect(res.maxVal).toBe(4);
      expect(res.xMax).toBe(1);
      expect(res.minVal).toBe(0); // -(3-1)^2+4 = 0
      expect(res.xMin).toBe(3);
    });

    it("对称轴在区间左侧：f(x) = (x - 0)^2 + 1 在 [2, 4] 上的极值", () => {
      const res = getQuadraticExtrema(1, 0, 1, 2, 4);
      expect(res.minVal).toBe(5); // 2^2+1 = 5
      expect(res.xMin).toBe(2);
      expect(res.maxVal).toBe(17); // 4^2+1 = 17
      expect(res.xMax).toBe(4);
    });

    it("对称轴在区间右侧：f(x) = (x - 5)^2 + 1 在 [1, 3] 上的极值", () => {
      const res = getQuadraticExtrema(1, 5, 1, 1, 3);
      expect(res.minVal).toBe(5); // (3-5)^2+1 = 5
      expect(res.xMin).toBe(3);
      expect(res.maxVal).toBe(17); // (1-5)^2+1 = 17
      expect(res.xMax).toBe(1);
    });

    it("区间左右端点倒序输入容错：[3, 0] 与 [0, 3] 结果一致", () => {
      const res1 = getQuadraticExtrema(1, 1, 2, 0, 3);
      const res2 = getQuadraticExtrema(1, 1, 2, 3, 0);
      expect(res1.minVal).toBe(res2.minVal);
      expect(res1.maxVal).toBe(res2.maxVal);
    });
  });

  describe("solveSingleVarQuantifier 单变量全称/存在量词命题", () => {
    it("全称量词为真：f(x) = x^2 + 1 在 [-2, 2] 上恒 ≥ 0", () => {
      const res = solveSingleVarQuantifier("universal", 1, 0, 1, -2, 2, 0, 0);
      expect(res.isOriginalTrue).toBe(true);
      expect(res.isNegationTrue).toBe(false);
      expect(res.isProbeCounterExample).toBe(false);
      expect(res.counterIntervals.length).toBe(0);
      expect(res.originalFormula).toContain("\\forall x");
      expect(res.negationFormula).toContain("\\exists x");
    });

    it("全称量词为假并捕获反例：f(x) = x^2 - 1 在 [-2, 2] 上 ≥ 0", () => {
      const res = solveSingleVarQuantifier("universal", 1, 0, -1, -2, 2, 0, 0);
      expect(res.isOriginalTrue).toBe(false);
      expect(res.isNegationTrue).toBe(true);
      // 探针在 x=0 处 f(0) = -1 < 0 是反例
      expect(res.isProbeCounterExample).toBe(true);
      // 反例区间为 (-1, 1)
      expect(res.counterIntervals.length).toBe(1);
      expect(res.counterIntervals[0].min).toBeCloseTo(-1, 5);
      expect(res.counterIntervals[0].max).toBeCloseTo(1, 5);
    });

    it("开口向下全称量词为假：f(x) = -x^2 + 4 在 [-3, 3] 上 ≥ 0", () => {
      const res = solveSingleVarQuantifier(
        "universal",
        -1,
        0,
        4,
        -3,
        3,
        0,
        2.5,
      );
      expect(res.isOriginalTrue).toBe(false);
      expect(res.isNegationTrue).toBe(true);
      expect(res.isProbeCounterExample).toBe(true); // f(2.5) = -2.25 < 0
      expect(res.counterIntervals.length).toBe(2); // [-3, -2] 与 [2, 3]
    });

    it("存在量词为真：f(x) = x^2 - 1 在 [-2, 2] 上 ∃x, f(x) ≤ 0", () => {
      const res = solveSingleVarQuantifier(
        "existential",
        1,
        0,
        -1,
        -2,
        2,
        0,
        0,
      );
      expect(res.isOriginalTrue).toBe(true);
      expect(res.isNegationTrue).toBe(false);
      expect(res.isProbeCounterExample).toBe(false);
    });

    it("存在量词为假：f(x) = x^2 + 2 在 [-2, 2] 上 ∃x, f(x) ≤ 0", () => {
      const res = solveSingleVarQuantifier("existential", 1, 0, 2, -2, 2, 0, 0);
      expect(res.isOriginalTrue).toBe(false);
      expect(res.isNegationTrue).toBe(true);
      expect(res.counterIntervals.length).toBe(1);
    });

    it("常数函数边界测试 (k=0)", () => {
      const res = solveSingleVarQuantifier("universal", 0, 0, 3, -1, 1, 5, 0);
      expect(res.isOriginalTrue).toBe(false);
      expect(res.counterIntervals.length).toBe(1);
    });
  });

  describe("solveDualVarQuantifier 双变量博弈命题", () => {
    it("1. ∀x₁ ∀x₂ 强强对决模型为真：f_min > g_max", () => {
      // f(x) = x^2 + 5 在 [0, 2] -> [5, 9]
      // g(x) = -x^2 + 3 在 [0, 2] -> [-1, 3]
      const res = solveDualVarQuantifier(
        "all_all",
        1,
        0,
        5,
        0,
        2,
        -1,
        0,
        3,
        0,
        2,
      );
      expect(res.isTrue).toBe(true);
      expect(res.fMin).toBe(5);
      expect(res.gMax).toBe(3);
      expect(res.conditionFormula).toContain("f(x)_{\\min} > g(x)_{\\max}");
    });

    it("1b. ∀x₁ ∀x₂ 强强对决模型为假：f_min ≤ g_max", () => {
      // f: [2, 5], g: [3, 6] -> f_min = 2 < g_max = 6 -> false
      const res = solveDualVarQuantifier(
        "all_all",
        1,
        0,
        2,
        0,
        1,
        1,
        0,
        3,
        0,
        1,
      );
      expect(res.isTrue).toBe(false);
    });

    it("2. ∀x₁ ∃x₂ 值域包含模型为真：Range(f) ⊆ Range(g)", () => {
      // f 在 [0, 1] 值域 [1, 2]
      // g 在 [0, 3] 值域 [0, 5] => [1, 2] ⊆ [0, 5] => true
      const res = solveDualVarQuantifier(
        "all_exist",
        1,
        0,
        1,
        0,
        1,
        1,
        0,
        0,
        0,
        Math.sqrt(5),
      );
      expect(res.isTrue).toBe(true);
      expect(res.conditionFormula).toContain(
        "\\text{Range}(f) \\subseteq \\text{Range}(g)",
      );
    });

    it("2b. ∀x₁ ∃x₂ 值域包含模型为假：Range(f) ⊈ Range(g)", () => {
      // f: [0, 10], g: [2, 5] => [0, 10] 不是 [2, 5] 的子集 => false
      const res = solveDualVarQuantifier(
        "all_exist",
        1,
        0,
        0,
        0,
        Math.sqrt(10),
        1,
        0,
        2,
        0,
        Math.sqrt(3),
      );
      expect(res.isTrue).toBe(false);
    });

    it("3. ∃x₁ ∃x₂ 交集非空模型为真：Range(f) ∩ Range(g) ≠ ∅", () => {
      // f: [1, 4], g: [3, 6] => 交集 [3, 4] ≠ ∅ => true
      const res = solveDualVarQuantifier(
        "exist_exist",
        1,
        0,
        1,
        0,
        Math.sqrt(3),
        1,
        0,
        3,
        0,
        Math.sqrt(3),
      );
      expect(res.isTrue).toBe(true);
      expect(res.conditionFormula).toContain(
        "\\text{Range}(f) \\cap \\text{Range}(g) \\neq \\emptyset",
      );
    });

    it("3b. ∃x₁ ∃x₂ 交集非空模型为假：两值域完全相离", () => {
      // f: [1, 2], g: [5, 8] => 交集为空 => false
      const res = solveDualVarQuantifier(
        "exist_exist",
        1,
        0,
        1,
        0,
        1,
        1,
        0,
        5,
        0,
        Math.sqrt(3),
      );
      expect(res.isTrue).toBe(false);
    });
  });
});
