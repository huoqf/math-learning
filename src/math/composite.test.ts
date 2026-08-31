import { describe, it, expect } from "vitest";
import { calculatePiecewise, calculateComposite } from "./composite";

describe("calculatePiecewise", () => {
  it("应正确判断分段函数全域单调递增（单增 + 单增 + 搭接不等式成立）", () => {
    const res = calculatePiecewise({
      x0: 1.0,
      leftSlope: 2.0,
      leftConst: 0.0, // f1(1) = 2
      rightSlope: 1.0,
      rightConst: 2.0, // f2(1) = 3 (3 >= 2)
    });
    expect(res.isContinuous).toBe(false);
    expect(res.leftMonotonicity).toBe("increasing");
    expect(res.rightMonotonicity).toBe("increasing");
    expect(res.globalMonotonicity).toBe("increasing");
  });

  it("应正确判定分界点向下跳跃破坏全域单调性（高考经典陷阱）", () => {
    const res = calculatePiecewise({
      x0: 1.0,
      leftSlope: 2.0,
      leftConst: 2.0, // f1(1) = 4
      rightSlope: 1.0,
      rightConst: 0.0, // f2(1) = 1 (1 < 4, 发生跳跃向下)
    });
    expect(res.leftMonotonicity).toBe("increasing");
    expect(res.rightMonotonicity).toBe("increasing");
    expect(res.globalMonotonicity).toBe("non-monotonic");
  });

  it("应正确计算连续情况下的单调性", () => {
    const res = calculatePiecewise({
      x0: 2.0,
      leftSlope: 1.0,
      leftConst: 0.0, // f1(2) = 2
      rightSlope: 3.0,
      rightConst: -4.0, // f2(2) = 2 (连续)
    });
    expect(res.isContinuous).toBe(true);
    expect(res.globalMonotonicity).toBe("increasing");
  });

  it("应正确判定分段函数全域单调递减（单减 + 单减 + 搭接不等式 f1(x0) >= f2(x0) 成立）", () => {
    const res = calculatePiecewise({
      x0: 0.0,
      leftSlope: -2.0,
      leftConst: 3.0, // f1(0) = 3
      rightSlope: -1.0,
      rightConst: 2.0, // f2(0) = 2 (3 >= 2)
    });
    expect(res.leftMonotonicity).toBe("decreasing");
    expect(res.rightMonotonicity).toBe("decreasing");
    expect(res.globalMonotonicity).toBe("decreasing");
    expect(res.evaluate(-1)).toBe(5);
    expect(res.evaluate(1)).toBe(1);
  });

  it("应正确判定分界点向上跳跃破坏全域单调递减", () => {
    const res = calculatePiecewise({
      x0: 0.0,
      leftSlope: -1.0,
      leftConst: 1.0, // f1(0) = 1
      rightSlope: -2.0,
      rightConst: 4.0, // f2(0) = 4 (1 < 4, 向上跳跃破坏单减)
    });
    expect(res.leftMonotonicity).toBe("decreasing");
    expect(res.rightMonotonicity).toBe("decreasing");
    expect(res.globalMonotonicity).toBe("non-monotonic");
  });
});

describe("calculateComposite", () => {
  it("指数复合增函数应满足同增异减", () => {
    // g(x) = x^2 - 2x + 2, 对称轴 x = 1, x > 1 增, x < 1 减
    const resInc = calculateComposite({
      xSample: 2.0, // x > 1, g'(x) > 0
      innerB: -2.0,
      innerC: 2.0,
      outerType: "exp", // f(u) = 2^u, f'(u) > 0
    });
    expect(resInc.innerMonotonicity).toBe("increasing");
    expect(resInc.outerMonotonicity).toBe("increasing");
    expect(resInc.compositeMonotonicity).toBe("increasing");

    const resDec = calculateComposite({
      xSample: 0.0, // x < 1, g'(x) < 0
      innerB: -2.0,
      innerC: 2.0,
      outerType: "exp",
    });
    expect(resDec.innerMonotonicity).toBe("decreasing");
    expect(resDec.outerMonotonicity).toBe("increasing");
    expect(resDec.compositeMonotonicity).toBe("decreasing");
  });

  it("二次外层函数（顶点 u=2）在递减区间与内层结合应满足同增异减", () => {
    // f(u) = -(u-2)^2 + 4, 当 u > 2 时 f'(u) < 0 (递减)
    // g(x) = x^2, 当 x > 0 时 g'(x) > 0 (递增)
    // 当 x = 3 时 u = 9 > 2: 内层递增 + 外层递减 => 复合函数单调递减 (异减)
    const resDec = calculateComposite({
      xSample: 3.0,
      innerB: 0,
      innerC: 0,
      outerType: "quadratic",
    });
    expect(resDec.innerMonotonicity).toBe("increasing");
    expect(resDec.outerMonotonicity).toBe("decreasing");
    expect(resDec.compositeMonotonicity).toBe("decreasing");

    // 当 x = -3 时 u = 9 > 2: 内层递减 + 外层递减 => 复合函数单调递增 (同增)
    const resInc = calculateComposite({
      xSample: -3.0,
      innerB: 0,
      innerC: 0,
      outerType: "quadratic",
    });
    expect(resInc.innerMonotonicity).toBe("decreasing");
    expect(resInc.outerMonotonicity).toBe("decreasing");
    expect(resInc.compositeMonotonicity).toBe("increasing");
  });

  it("对数复合在真数 u <= 0 时应标记为非法并提示定义域越界", () => {
    // g(x) = x^2 - 2x - 3, 当 x = 1 时 u = 1 - 2 - 3 = -4 <= 0
    const res = calculateComposite({
      xSample: 1.0,
      innerB: -2.0,
      innerC: -3.0,
      outerType: "log",
    });
    expect(res.isValid).toBe(false);
    expect(Number.isNaN(res.y)).toBe(true);
    expect(res.warningMessage).toContain("超出对数外层定义域");
  });
});
