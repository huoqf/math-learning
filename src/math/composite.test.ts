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
