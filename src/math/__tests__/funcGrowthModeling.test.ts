import { describe, expect, it } from "vitest";
import {
  calcGrowthRace,
  calcPiecewiseBilling,
  calcScatterFitting,
} from "../funcGrowthModeling";

describe("funcGrowthModeling 纯数学计算", () => {
  it("指数增长在较大自变量处最终反超一次与幂函数", () => {
    const small = calcGrowthRace(2, 2, 3, 2);
    expect(small.yLinear).toBe(6);
    expect(small.yExp).toBe(4);

    const large = calcGrowthRace(2, 2, 3, 7);
    expect(large.yExp).toBe(128);
    expect(large.yPower).toBe(49);
    expect(large.yLinear).toBe(21);
    expect(large.leaderName).toBe("指数模型 a^x");
  });

  it("分段阶梯计费在分界点处连续衔接无跳变", () => {
    const leftAt4 = calcPiecewiseBilling(4, 2, 3, 5);
    const rightAt4 = calcPiecewiseBilling(4.0001, 2, 3, 5);
    expect(leftAt4.activeTier).toBe(1);
    expect(rightAt4.activeTier).toBe(2);
    expect(rightAt4.totalCost - leftAt4.totalCost).toBeCloseTo(0.0003, 4);
  });

  it("散点非线性加速趋势下指数/二次模型拟合 SSE 显著小于一次模型", () => {
    const lin = calcScatterFitting("linear", 1);
    const exp = calcScatterFitting("exponential", 1);
    const quad = calcScatterFitting("quadratic", 1);
    expect(exp.sse).toBeLessThan(lin.sse);
    expect(quad.sse).toBeLessThan(lin.sse);
  });
});
