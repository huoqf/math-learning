import { describe, it, expect } from "vitest";
import {
  calculateIndependenceMeasure,
  getIndependentRatio,
  calculateDiscreteDiceEvents,
} from "../probabilityIndependence";

describe("事件独立性与互斥纯数学引擎测试", () => {
  it("连续测度：重叠为0时互斥判定成立，若先验为正必不独立", () => {
    const res = calculateIndependenceMeasure(0.4, 0.5, 0);
    expect(res.pA).toBe(0.4);
    expect(res.pB).toBe(0.5);
    expect(res.pAB).toBe(0);
    expect(res.isMutuallyExclusive).toBe(true);
    expect(res.isIndependent).toBe(false);
    expect(res.relationType).toBe("exclusive_not_independent");
    expect(res.pConditionalBGivenA).toBe(0);
  });

  it("连续测度：达到独立点时 P(AB) = P(A)P(B)，且 P(B|A) = P(B)", () => {
    const ratio = getIndependentRatio(0.4, 0.5);
    const res = calculateIndependenceMeasure(0.4, 0.5, ratio);
    expect(res.isIndependent).toBe(true);
    expect(res.isMutuallyExclusive).toBe(false);
    expect(res.relationType).toBe("independent_not_exclusive");
    expect(Math.abs((res.pConditionalBGivenA ?? 0) - res.pB)).toBeLessThan(
      0.015,
    );
  });

  it("离散骰子模型：偶数与<=4独立且不互斥", () => {
    const res = calculateDiscreteDiceEvents("even", "le4");
    expect(res.outcomesA).toEqual([2, 4, 6]);
    expect(res.outcomesB).toEqual([1, 2, 3, 4]);
    expect(res.intersectionOutcomes).toEqual([2, 4]);
    expect(res.pA).toBeCloseTo(0.5);
    expect(res.pB).toBeCloseTo(4 / 6);
    expect(res.pAB).toBeCloseTo(2 / 6);
    expect(res.isIndependent).toBe(true);
    expect(res.isMutuallyExclusive).toBe(false);
  });

  it("离散骰子模型：偶数与奇数互斥且不独立", () => {
    const res = calculateDiscreteDiceEvents("even", "odd");
    expect(res.intersectionOutcomes).toEqual([]);
    expect(res.pAB).toBe(0);
    expect(res.isMutuallyExclusive).toBe(true);
    expect(res.isIndependent).toBe(false);
  });

  it("极端小概率边界：pA=0.1, pB=0.1, lambda=0 时互斥且绝不判定为独立", () => {
    const res = calculateIndependenceMeasure(0.1, 0.1, 0);
    expect(res.pAB).toBe(0);
    expect(res.isMutuallyExclusive).toBe(true);
    expect(res.isIndependent).toBe(false);
    expect(res.relationType).toBe("exclusive_not_independent");
  });

  it("近独立但未达容差边界：差异大于相对容差时判定为不独立", () => {
    // 独立点 overlapRatio = 0.5，此时 pAB = 0.2
    // 当 overlapRatio = 0.3 时，pAB = 0.12，显著偏离 0.2
    const res = calculateIndependenceMeasure(0.4, 0.5, 0.3);
    expect(res.isIndependent).toBe(false);
    expect(res.isMutuallyExclusive).toBe(false);
    expect(res.relationType).toBe("neither");
  });
});
