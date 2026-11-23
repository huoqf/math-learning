import { describe, expect, it } from "vitest";
import {
  calcElimMethod,
  calcHomogMethod,
  calcOneSubstitution,
  calcSumProdMethod,
} from "../ineqMultivarExtrema";

describe("ineqMultivarExtrema 纯数学计算", () => {
  it("常数1的代换：x+y=2 求 1/x + 4/y 最小值为 9/2", () => {
    const res = calcOneSubstitution(1, 1, 1, 4, 2, 0.5);
    expect(res.validity).toBe("ok");
    expect(res.minVal).toBeCloseTo(4.5, 6);
    expect(res.optX).toBeCloseTo(2 / 3, 6);
    expect(res.optY).toBeCloseTo(4 / 3, 6);
    expect(res.probeVal).toBeGreaterThanOrEqual(res.minVal - 1e-6);
  });

  it("消元法：(x+1)(y+1)=9 求 x+y 最小值为 4", () => {
    const res = calcElimMethod(1, 1, 8, 1.5);
    expect(res.validity).toBe("ok");
    expect(res.kVal).toBe(9);
    expect(res.minSum).toBeCloseTo(4, 6);
    expect(res.optX).toBeCloseTo(2, 6);
  });

  it("齐次比值换元：t + 4/t 最小值为 4", () => {
    const res = calcHomogMethod(4, 1);
    expect(res.minVal).toBeCloseTo(4, 6);
    expect(res.optT).toBeCloseTo(2, 6);
    expect(res.currentVal).toBeGreaterThanOrEqual(res.minVal);
  });

  it("和积互化：x + y + xy = 3 求 x+y 最小值为 2 且 xy 最大值为 1", () => {
    const res = calcSumProdMethod(3, 0.8);
    expect(res.minSum).toBeCloseTo(2, 6);
    expect(res.maxProd).toBeCloseTo(1, 6);
    expect(res.probeSum).toBeGreaterThanOrEqual(res.minSum - 1e-6);
  });
});
