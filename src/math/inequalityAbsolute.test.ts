import { describe, it, expect } from "vitest";
import {
  evalAbsoluteFunc,
  solveAbsoluteInequality,
} from "./inequalityAbsolute";

describe("inequalityAbsolute - 绝对值不等式几何求解与最值", () => {
  it("单绝对值不等式 |x - 2| <= 3 解集为 [-1, 5]", () => {
    const res = solveAbsoluteInequality(2, 0, 3, 0, 1, "single", "<=");
    expect(res.isDegenerate).toBe(false);
    expect(res.intervals).toHaveLength(1);
    expect(res.intervals[0].x1).toBeCloseTo(-1, 4);
    expect(res.intervals[0].x2).toBeCloseTo(5, 4);
  });

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

  it("双绝对值和不等式无解退化：m < |a-b| 且方向为 <=", () => {
    // a = 1, b = 5 => 最小值为 4. 当 m = 2 时，|x-1| + |x-5| <= 2 无解
    const res = solveAbsoluteInequality(1, 5, 0, 2, 3, "sum", "<=");
    expect(res.isDegenerate).toBe(true);
    expect(res.intervals).toHaveLength(0);
    expect(res.degenerateReason).toContain("空集");
  });

  it("双绝对值差不等式 |x - 1| - |x - 5| 最值与值域 [-4, 4]", () => {
    const res = solveAbsoluteInequality(1, 5, 0, 0, 3, "diff", "<=");
    expect(res.extremaInfo.minVal).toBeCloseTo(-4, 4);
    expect(res.extremaInfo.maxVal).toBeCloseTo(4, 4);

    // 函数值验证：x=0 时为 1 - 5 = -4; x=6 时为 5 - 1 = 4; x=3 时为 2 - 2 = 0
    expect(evalAbsoluteFunc(0, 1, 5, "diff")).toBeCloseTo(-4);
    expect(evalAbsoluteFunc(6, 1, 5, "diff")).toBeCloseTo(4);
    expect(evalAbsoluteFunc(3, 1, 5, "diff")).toBeCloseTo(0);
  });
});
