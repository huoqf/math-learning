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
});
