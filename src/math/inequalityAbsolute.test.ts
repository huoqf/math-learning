import { describe, it, expect } from "vitest";
import {
  evalAbsoluteFunc,
  solveAbsoluteInequality,
} from "./inequalityAbsolute";

describe("inequalityAbsolute - 绝对值不等式几何求解与最值", () => {
  describe("1. 单绝对值不等式 |x - a| <=> c", () => {
    it("单绝对值不等式 |x - 2| <= 3 解集为 [-1, 5]", () => {
      const res = solveAbsoluteInequality(2, 0, 3, 0, 1, "single", "<=");
      expect(res.isDegenerate).toBe(false);
      expect(res.intervals).toHaveLength(1);
      expect(res.intervals[0].x1).toBeCloseTo(-1, 4);
      expect(res.intervals[0].x2).toBeCloseTo(5, 4);
    });

    it("单绝对值不等式 |x - 2| >= 3 解集为 (-∞, -1] ∪ [5, +∞)", () => {
      const res = solveAbsoluteInequality(2, 0, 3, 0, 1, "single", ">=");
      expect(res.intervals).toHaveLength(2);
      expect(res.intervals[0].x2).toBeCloseTo(-1, 4);
      expect(res.intervals[1].x1).toBeCloseTo(5, 4);
    });

    it("单绝对值退化：c = 0 时 |x - 2| <= 0 为单点解 {2}，|x - 2| >= 0 为全集 R", () => {
      const resLe = solveAbsoluteInequality(2, 0, 0, 0, 2, "single", "<=");
      expect(resLe.intervals).toHaveLength(1);
      expect(resLe.intervals[0].x1).toBe(2);
      expect(resLe.intervals[0].x2).toBe(2);

      const resGe = solveAbsoluteInequality(2, 0, 0, 0, 2, "single", ">=");
      expect(resGe.intervals).toHaveLength(1);
      expect(resGe.intervals[0].isLeftInfinity).toBe(true);
      expect(resGe.intervals[0].isRightInfinity).toBe(true);
    });

    it("单绝对值退化：c < 0 时 |x - 2| <= -1 无解，|x - 2| >= -1 为全集 R", () => {
      const resLe = solveAbsoluteInequality(2, 0, -1, 0, 2, "single", "<=");
      expect(resLe.isDegenerate).toBe(true);
      expect(resLe.intervals).toHaveLength(0);

      const resGe = solveAbsoluteInequality(2, 0, -1, 0, 2, "single", ">=");
      expect(resGe.isDegenerate).toBe(true);
      expect(resGe.intervals).toHaveLength(1);
      expect(resGe.intervals[0].isLeftInfinity).toBe(true);
      expect(resGe.intervals[0].isRightInfinity).toBe(true);
    });
  });

  describe("2. 双绝对值和不等式 |x - a| + |x - b| <=> m", () => {
    it("双绝对值和不等式 |x - 1| + |x - 5| >= 6 求解", () => {
      // a = 1, b = 5, |a - b| = 4, 最小值为 4 在 [1, 5] 上取得
      // |x - 1| + |x - 5| = 6 => x = (1+5-6)/2 = 0 或 x = (1+5+6)/2 = 6
      const res = solveAbsoluteInequality(1, 5, 0, 6, 3, "sum", ">=");

      expect(res.extremaInfo.minVal).toBeCloseTo(4, 4);
      expect(res.intersectionRoots).toHaveLength(2);
      expect(res.intersectionRoots[0]).toBeCloseTo(0, 4);
      expect(res.intersectionRoots[1]).toBeCloseTo(6, 4);

      // >= 6 的解集为 (-∞, 0] U [6, +∞)
      expect(res.intervals).toHaveLength(2);
      expect(res.intervals[0].x2).toBeCloseTo(0, 4);
      expect(res.intervals[1].x1).toBeCloseTo(6, 4);
    });

    it("临界点 m = |a - b| 时：<= 4 的解集为闭区间 [1, 5]，>= 4 的解集为全集 R", () => {
      const resLe = solveAbsoluteInequality(1, 5, 0, 4, 3, "sum", "<=");
      expect(resLe.intervals).toHaveLength(1);
      expect(resLe.intervals[0].x1).toBeCloseTo(1, 4);
      expect(resLe.intervals[0].x2).toBeCloseTo(5, 4);

      const resGe = solveAbsoluteInequality(1, 5, 0, 4, 3, "sum", ">=");
      expect(resGe.intervals).toHaveLength(1);
      expect(resGe.intervals[0].isLeftInfinity).toBe(true);
      expect(resGe.intervals[0].isRightInfinity).toBe(true);
    });

    it("双绝对值和不等式无解退化：m < |a-b| 且方向为 <=", () => {
      // a = 1, b = 5 => 最小值为 4. 当 m = 2 时，|x-1| + |x-5| <= 2 无解
      const res = solveAbsoluteInequality(1, 5, 0, 2, 3, "sum", "<=");
      expect(res.isDegenerate).toBe(true);
      expect(res.intervals).toHaveLength(0);
      expect(res.degenerateReason).toContain("空集");
    });

    it("重合点 a = b 退化：2|x - 2| <= 4 解集为 [0, 4]", () => {
      const res = solveAbsoluteInequality(2, 2, 0, 4, 2, "sum", "<=");
      expect(res.extremaInfo.minVal).toBeCloseTo(0, 4);
      expect(res.intervals).toHaveLength(1);
      expect(res.intervals[0].x1).toBeCloseTo(0, 4);
      expect(res.intervals[0].x2).toBeCloseTo(4, 4);
    });
  });

  describe("3. 双绝对值差不等式 |x - a| - |x - b| <=> m", () => {
    it("双绝对值差不等式 |x - 1| - |x - 5| 最值与值域 [-4, 4]", () => {
      const res = solveAbsoluteInequality(1, 5, 0, 0, 3, "diff", "<=");
      expect(res.extremaInfo.minVal).toBeCloseTo(-4, 4);
      expect(res.extremaInfo.maxVal).toBeCloseTo(4, 4);

      // 函数值验证：x=0 时为 1 - 5 = -4; x=6 时为 5 - 1 = 4; x=3 时为 2 - 2 = 0
      expect(evalAbsoluteFunc(0, 1, 5, "diff")).toBeCloseTo(-4);
      expect(evalAbsoluteFunc(6, 1, 5, "diff")).toBeCloseTo(4);
      expect(evalAbsoluteFunc(3, 1, 5, "diff")).toBeCloseTo(0);
    });

    it("临界边界 m = -4 (下界)：>= -4 应为全集 R，<= -4 应为 (-∞, 1]", () => {
      const resGe = solveAbsoluteInequality(1, 5, 0, -4, 3, "diff", ">=");
      expect(resGe.intervals).toHaveLength(1);
      expect(resGe.intervals[0].isLeftInfinity).toBe(true);
      expect(resGe.intervals[0].isRightInfinity).toBe(true);

      const resLe = solveAbsoluteInequality(1, 5, 0, -4, 3, "diff", "<=");
      expect(resLe.intervals).toHaveLength(1);
      expect(resLe.intervals[0].isLeftInfinity).toBe(true);
      expect(resLe.intervals[0].x2).toBeCloseTo(1, 4);
    });

    it("临界边界 m = 4 (上界)：<= 4 应为全集 R，>= 4 应为 [5, +∞)", () => {
      const resLe = solveAbsoluteInequality(1, 5, 0, 4, 3, "diff", "<=");
      expect(resLe.intervals).toHaveLength(1);
      expect(resLe.intervals[0].isLeftInfinity).toBe(true);
      expect(resLe.intervals[0].isRightInfinity).toBe(true);

      const resGe = solveAbsoluteInequality(1, 5, 0, 4, 3, "diff", ">=");
      expect(resGe.intervals).toHaveLength(1);
      expect(resGe.intervals[0].x1).toBeCloseTo(5, 4);
      expect(resGe.intervals[0].isRightInfinity).toBe(true);
    });

    it("当 a > b 时 (|x - 5| - |x - 1|)：方向颠倒，递减", () => {
      // a = 5, b = 1. 当 x <= 1 时为 4; 当 x >= 5 时为 -4
      const res = solveAbsoluteInequality(5, 1, 0, 0, 3, "diff", "<=");
      expect(res.extremaInfo.minVal).toBeCloseTo(-4, 4);
      expect(res.extremaInfo.maxVal).toBeCloseTo(4, 4);

      // <= 0 的解集为 [3, +∞)
      expect(res.intervals).toHaveLength(1);
      expect(res.intervals[0].x1).toBeCloseTo(3, 4);
      expect(res.intervals[0].isRightInfinity).toBe(true);
    });

    it("越界情况：m < -4 且 <= 为空集；m > 4 且 >= 为空集", () => {
      const resLe = solveAbsoluteInequality(1, 5, 0, -5, 3, "diff", "<=");
      expect(resLe.isDegenerate).toBe(true);
      expect(resLe.intervals).toHaveLength(0);

      const resGe = solveAbsoluteInequality(1, 5, 0, 5, 3, "diff", ">=");
      expect(resGe.isDegenerate).toBe(true);
      expect(resGe.intervals).toHaveLength(0);
    });
  });

  describe("4. 绝对值三角不等式性质验证 ||a| - |b|| <= |a ± b| <= |a| + |b|", () => {
    it("验证对于任意实数满足三角不等式链", () => {
      const testPairs = [
        [3, 4],
        [-3, 4],
        [5, -5],
        [0, -7],
      ];
      for (const [u, v] of testPairs) {
        const left = Math.abs(Math.abs(u) - Math.abs(v));
        const midPlus = Math.abs(u + v);
        const midMinus = Math.abs(u - v);
        const right = Math.abs(u) + Math.abs(v);

        expect(left).toBeLessThanOrEqual(midPlus + 1e-9);
        expect(midPlus).toBeLessThanOrEqual(right + 1e-9);
        expect(left).toBeLessThanOrEqual(midMinus + 1e-9);
        expect(midMinus).toBeLessThanOrEqual(right + 1e-9);
      }
    });
  });
});
