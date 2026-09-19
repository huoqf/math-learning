import { describe, it, expect } from "vitest";
import {
  calculateVennProbabilities,
  filterDiceEvents,
} from "../probabilityEvents";

describe("随机事件与概率性质数学纯函数测试 (probabilityEvents)", () => {
  it("互斥事件测试：overlapRatio = 0 时，交集概率为 0，并集概率等于两者之和", () => {
    const res = calculateVennProbabilities(0.3, 0.4, 0);
    expect(res.pIntersection).toBeCloseTo(0, 4);
    expect(res.pUnion).toBeCloseTo(0.7, 4);
    expect(res.isMutuallyExclusive).toBe(true);
    expect(res.isOpposite).toBe(false);
    expect(res.relation).toBe("mutually_exclusive");
  });

  it("对立事件测试：pA + pB = 1 且 overlapRatio = 0 时，判定为对立事件", () => {
    const res = calculateVennProbabilities(0.4, 0.6, 0);
    expect(res.pIntersection).toBeCloseTo(0, 4);
    expect(res.pUnion).toBeCloseTo(1.0, 4);
    expect(res.isMutuallyExclusive).toBe(true);
    expect(res.isOpposite).toBe(true);
    expect(res.relation).toBe("opposite");
  });

  it("包含关系测试：pA < pB 且 overlapRatio = 1 时，A 包含于 B", () => {
    const res = calculateVennProbabilities(0.3, 0.7, 1);
    expect(res.pIntersection).toBeCloseTo(0.3, 4);
    expect(res.pUnion).toBeCloseTo(0.7, 4);
    expect(res.relation).toBe("subset_A_in_B");
  });

  it("一般相交与加法公式验证：P(A∪B) = P(A) + P(B) - P(A∩B)", () => {
    const res = calculateVennProbabilities(0.5, 0.6, 0.5);
    expect(res.pUnion).toBeCloseTo(res.pA + res.pB - res.pIntersection, 4);
    expect(res.pNeither).toBeCloseTo(1 - res.pUnion, 4);
    expect(res.pOnlyA).toBeCloseTo(res.pA - res.pIntersection, 4);
  });

  it("掷两骰子样本空间测试：点数和为偶数与同奇同偶的关系", () => {
    const res = filterDiceEvents("sum_even", "both_odd");
    // 点数和为偶数共 18 种 (18/36 = 0.5)
    expect(res.countA).toBe(18);
    expect(res.pA).toBeCloseTo(0.5, 4);
    // 两数均为奇数共 3 * 3 = 9 种
    expect(res.countB).toBe(9);
    expect(res.pB).toBeCloseTo(0.25, 4);
    // 两数均为奇数必然和为偶数，因此 B 包含于 A，交集为 9
    expect(res.countIntersection).toBe(9);
    expect(res.countUnion).toBe(18);
  });

  it("掷两骰子对立事件测试：点数和为偶数 与 点数和为奇数", () => {
    const res = filterDiceEvents("sum_even", "sum_odd");
    expect(res.countA).toBe(18);
    expect(res.countB).toBe(18);
    expect(res.countIntersection).toBe(0);
    expect(res.countUnion).toBe(36);
    expect(res.isMutuallyExclusive).toBe(true);
    expect(res.isOpposite).toBe(true);
  });

  it("掷两骰子互斥事件测试：两数全为奇 与 两数全为偶", () => {
    const res = filterDiceEvents("both_odd", "both_even");
    expect(res.countA).toBe(9);
    expect(res.countB).toBe(9);
    expect(res.countIntersection).toBe(0);
    expect(res.countUnion).toBe(18);
    expect(res.isMutuallyExclusive).toBe(true);
    expect(res.isOpposite).toBe(false);
  });

  it("连续模型差事件与概率和大于1警告测试", () => {
    const res = calculateVennProbabilities(0.6, 0.7, 0);
    expect(res.pIntersection).toBeCloseTo(0.3, 4);
    expect(res.pUnion).toBeCloseTo(1.0, 4);
    expect(res.pDiffBminusA).toBeCloseTo(0.4, 4);
    expect(res.warningMessage).toContain("必然相交无法互斥");
  });
});
