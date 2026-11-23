import { describe, expect, it } from "vitest";
import {
  calcBundleModel,
  calcGapModel,
  calcGroupingModel,
  calcStarsBarsModel,
  comb,
  factorial,
  perm,
} from "../combinatoricsModels";

describe("combinatoricsModels 纯数学计算", () => {
  it("基础排列组合计算准确", () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(5)).toBe(120);
    expect(perm(5, 2)).toBe(20);
    expect(comb(6, 2)).toBe(15);
    expect(comb(5, 6)).toBe(0);
  });

  it("捆绑法：5 个元素中 2 个相邻应为 A_2^2 * A_4^4 = 48", () => {
    const res = calcBundleModel(5, 2);
    expect(res.superCount).toBe(4);
    expect(res.innerPerms).toBe(2);
    expect(res.outerPerms).toBe(24);
    expect(res.total).toBe(48);
    expect(res.validity).toBe("ok");
  });

  it("捆绑法参数越界时安全钳制", () => {
    const res = calcBundleModel(4, 7);
    expect(res.k).toBe(4);
    expect(res.validity).toBe("clamped");
    expect(res.total).toBe(24);
  });

  it("插空法：4 个底座 3 个不相邻元素应为 A_4^4 * A_5^3 = 1440", () => {
    const res = calcGapModel(4, 3);
    expect(res.slots).toBe(5);
    expect(res.total).toBe(24 * 60);
    expect(res.validity).toBe("ok");

    const impossible = calcGapModel(2, 4);
    expect(impossible.validity).toBe("impossible");
    expect(impossible.total).toBe(0);
  });

  it("隔板法：正整数解与非负整数解计数精确", () => {
    const positive = calcStarsBarsModel(7, 3, false);
    expect(positive.total).toBe(comb(6, 2)); // 15
    expect(positive.validity).toBe("ok");

    const nonNeg = calcStarsBarsModel(4, 3, true);
    expect(nonNeg.effectiveN).toBe(7);
    expect(nonNeg.total).toBe(comb(6, 2)); // 15

    const impossible = calcStarsBarsModel(2, 4, false);
    expect(impossible.validity).toBe("impossible");
  });

  it("分组分配：均分、局部均分与定向分配消序精确", () => {
    // 6 人平均分 3 组：C(6,2)C(4,2)C(2,2) / A(3,3) = 90 / 6 = 15
    const equal3 = calcGroupingModel([2, 2, 2], false);
    expect(equal3.rawCombinationProduct).toBe(90);
    expect(equal3.duplicateFactor).toBe(6);
    expect(equal3.unorderedGroups).toBe(15);
    expect(equal3.orderedAllocations).toBe(90);

    // 5 人分 2-2-1 局部均分给 3 个不同地点：C(5,2)C(3,2)C(1,1) / A(2,2) * A(3,3) = 15 * 6 = 90
    const partial = calcGroupingModel([2, 2, 1], true);
    expect(partial.duplicateFactor).toBe(2);
    expect(partial.unorderedGroups).toBe(15);
    expect(partial.total).toBe(90);
  });
});
