import { describe, it, expect } from "vitest";
import {
  getQuadraticExtrema,
  solveSingleVarQuantifier,
  solveDualVarQuantifier,
} from "./quantifiers";

describe("quantifiers pure math and logic tests", () => {
  describe("getQuadraticExtrema", () => {
    it("对称轴在区间内：f(x) = (x - 1)^2 + 2 在 [0, 3] 上的极值", () => {
      const res = getQuadraticExtrema(1, 1, 2, 0, 3);
      expect(res.minVal).toBe(2);
      expect(res.xMin).toBe(1);
      expect(res.maxVal).toBe(6); // (3-1)^2+2 = 6
      expect(res.xMax).toBe(3);
    });

    it("对称轴在区间外：f(x) = (x - 1)^2 + 2 在 [2, 4] 上的极值", () => {
      const res = getQuadraticExtrema(1, 1, 2, 2, 4);
      expect(res.minVal).toBe(3); // (2-1)^2+2 = 3
      expect(res.xMin).toBe(2);
      expect(res.maxVal).toBe(11); // (4-1)^2+2 = 11
      expect(res.xMax).toBe(4);
    });
  });

  describe("solveSingleVarQuantifier", () => {
    it("全称量词为真：f(x) = x^2 + 1 在 [-2, 2] 上恒 ≥ 0", () => {
      const res = solveSingleVarQuantifier("universal", 1, 0, 1, -2, 2, 0, 0);
      expect(res.isOriginalTrue).toBe(true);
      expect(res.isNegationTrue).toBe(false);
      expect(res.isProbeCounterExample).toBe(false);
      expect(res.counterIntervals.length).toBe(0);
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
    });

    it("存在量词为假：f(x) = x^2 + 2 在 [-2, 2] 上 ∃x, f(x) ≤ 0", () => {
      const res = solveSingleVarQuantifier("existential", 1, 0, 2, -2, 2, 0, 0);
      expect(res.isOriginalTrue).toBe(false);
      expect(res.isNegationTrue).toBe(true);
      expect(res.counterIntervals.length).toBe(1);
    });
  });

  describe("solveDualVarQuantifier", () => {
    it("∀x₁ ∀x₂ 强强对决模型：f_min > g_max", () => {
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
    });

    it("∀x₁ ∃x₂ 值域包含模型：Range(f) ⊆ Range(g)", () => {
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
    });

    it("∃x₁ ∃x₂ 交集非空模型：Range(f) ∩ Range(g) ≠ ∅", () => {
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
    });
  });
});
