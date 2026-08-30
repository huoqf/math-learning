import { describe, it, expect } from "vitest";
import {
  solveImplicitZero,
  solveExtremumShift,
  solveLogMean,
} from "@/math/derivativeShift";

describe("隐零点定理与极值点偏移数学计算测试", () => {
  it("应当正确求解隐零点及代换消元轨迹", () => {
    // f(x) = x ln x - a x + 1, a = 1
    // f'(x) = ln x = 0 => x0 = 1, y0 = 1 - 1 + 1 = 1
    const res = solveImplicitZero(1, "x_ln_x");
    expect(res.isValid).toBe(true);
    expect(res.x0).toBeCloseTo(1, 4);
    expect(res.y0).toBeCloseTo(0, 4);
    expect(res.traceY).toBeCloseTo(0, 4); // 1 - x0 = 0
  });

  it("应当正确求解极值点偏移及右偏结论", () => {
    // f(x) = x e^(-x), 极值点 x0 = 1, 极大值 1/e ≈ 0.367879
    // 割线 y = 0.25 (k < 1/e)
    const res = solveExtremumShift(0.25, "xe_neg_x");
    expect(res.isValid).toBe(true);
    expect(res.x0).toBe(1);
    expect(res.x1).toBeLessThan(1);
    expect(res.x2).toBeGreaterThan(1);
    // f(x1) 与 f(x2) 均应接近 k = 0.25
    expect(res.fn(res.x1)).toBeCloseTo(0.25, 3);
    expect(res.fn(res.x2)).toBeCloseTo(0.25, 3);
    // 验证中点右偏 (x1 + x2) / 2 > 1
    expect(res.midX).toBeGreaterThan(1);
    expect(res.shiftType).toBe("right");
  });

  it("应当正确计算对数均值不等式", () => {
    // x1 = 1, x2 = e^2 ≈ 7.389
    // sqrt(x1 x2) = e ≈ 2.718
    // L(x1, x2) = (e^2 - 1) / 2 ≈ 3.194
    // (x1 + x2) / 2 = (e^2 + 1) / 2 ≈ 4.194
    const res = solveLogMean(1, Math.E * Math.E);
    expect(res.isValid).toBe(true);
    expect(res.geoMean).toBeCloseTo(Math.E, 2);
    expect(res.geoMean).toBeLessThan(res.logMean);
    expect(res.logMean).toBeLessThan(res.ariMean);
  });

  it("应当正确求解 lnx/x 经典高考极值点偏移模型及右偏结论", () => {
    // f(x) = (ln x) / x, 极值点 x0 = e ≈ 2.71828, 极大值 1/e ≈ 0.367879
    // 割线 y = 0.3 (k < 1/e)
    const res = solveExtremumShift(0.3, "lnx_div_x");
    expect(res.isValid).toBe(true);
    expect(res.x0).toBeCloseTo(Math.E, 4);
    expect(res.x1).toBeGreaterThan(1);
    expect(res.x1).toBeLessThan(Math.E);
    expect(res.x2).toBeGreaterThan(Math.E);
    // f(x1) 与 f(x2) 均应接近 k = 0.3
    expect(res.fn(res.x1)).toBeCloseTo(0.3, 3);
    expect(res.fn(res.x2)).toBeCloseTo(0.3, 3);
    // 验证中点右偏 (x1 + x2) / 2 > e
    expect(res.midX).toBeGreaterThan(Math.E);
    expect(res.shiftType).toBe("right");
    // 验证差值函数 F(x1) = f(x1) - f(2e - x1)
    expect(res.diffFn(res.x1)).toBeDefined();
  });

  it("应当正确求解 exp_minus_ax 隐零点消参轨迹与退化", () => {
    // a = e => x0 = ln(e) = 1, y0 = e - e*1 = 0
    // 轨迹 h(1) = e^1 * (1 - 1) = 0
    const res = solveImplicitZero(Math.E, "exp_minus_ax");
    expect(res.isValid).toBe(true);
    expect(res.x0).toBeCloseTo(1, 4);
    expect(res.y0).toBeCloseTo(0, 4);
    expect(res.traceY).toBeCloseTo(0, 4);

    // a <= 0 退化情况
    const resDegenerate = solveImplicitZero(-1, "exp_minus_ax");
    expect(resDegenerate.isValid).toBe(false);
    expect(resDegenerate.isDegenerate).toBe(true);
  });
});
