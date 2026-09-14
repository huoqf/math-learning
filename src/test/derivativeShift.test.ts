import { describe, it, expect } from "vitest";
import {
  solveImplicitZero,
  solveExtremumShift,
  solveLogMean,
} from "@/math/derivativeShift";
import { buildDerivativeShiftPanel } from "@/data/builders/derivativeShift";
import { getPresets } from "@/data/registries/derivativeShift";

describe("隐零点定理与极值点偏移数学计算测试", () => {
  it("应当正确求解超越隐零点及二次消参消元轨迹 (x ln x + (1/2)x^2 - ax)", () => {
    // f(x) = x ln x + 0.5 x^2 - a x
    // f'(x) = ln x + x + 1 - a = 0
    // 当 a = 2 时，ln(1) + 1 + 1 - 2 = 0 => 隐零点 x0 = 1
    const res = solveImplicitZero(2, "x_ln_x");
    expect(res.isValid).toBe(true);
    expect(res.x0).toBeCloseTo(1, 3);
    // f(1) = 0 + 0.5 - 2 = -1.5
    expect(res.y0).toBeCloseTo(-1.5, 3);
    // 轨迹 h(x0) = -0.5*x0^2 - x0 = -1.5 (极值与轨迹严格重合，消去参数 a)
    expect(res.traceY).toBeCloseTo(-1.5, 3);
  });

  it("应当正确求解超越隐零点及指数消参轨迹 (e^x - (1/2)x^2 - ax)", () => {
    // f'(x) = e^x - x - a = 0
    // 当 x0 = 1 时，a = e - 1 ≈ 1.71828
    const aVal = Math.E - 1;
    const res = solveImplicitZero(aVal, "exp_linear");
    expect(res.isValid).toBe(true);
    expect(res.x0).toBeCloseTo(1, 3);
    // f(1) = e - 0.5 - (e-1)*1 = 0.5
    expect(res.y0).toBeCloseTo(0.5, 3);
    // 轨迹 h(1) = e^1*(1-1) + 0.5*1^2 = 0.5
    expect(res.traceY).toBeCloseTo(0.5, 3);

    // a <= 1.001 退化情况
    const resDegenerate = solveImplicitZero(0.5, "exp_linear");
    expect(resDegenerate.isValid).toBe(false);
    expect(resDegenerate.isDegenerate).toBe(true);
  });

  it("应当正确求解极值点偏移右偏结论及差值函数严格小于0", () => {
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
    // 验证中点加法右偏 (x1 + x2) / 2 > 1
    expect(res.midX).toBeGreaterThan(1);
    expect(res.shiftType).toBe("right");
    // 验证对称差值函数 F(x1) = f(x1) - f(2 - x1) < 0
    expect(res.diffFn(res.x1)).toBeLessThan(0);
  });

  it("应当正确求解 lnx/x 经典高考极值点偏移模型、乘积偏移与双重右偏", () => {
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
    // 验证中点加法右偏 (x1 + x2) / 2 > e
    expect(res.midX).toBeGreaterThan(Math.E);
    expect(res.shiftType).toBe("right");
    // 验证乘积偏移 x1 * x2 > e^2 ≈ 7.389
    expect(res.prod).toBeGreaterThan(Math.E * Math.E);
    expect(res.prodShiftType).toBe("greater");
    // 验证差值函数 F(x1) < 0
    expect(res.diffFn(res.x1)).toBeLessThan(0);
  });

  it("应当正确支持 ln_x_div_x 别名模型求解", () => {
    const res = solveExtremumShift(0.25, "ln_x_div_x");
    expect(res.isValid).toBe(true);
    expect(res.x0).toBeCloseTo(Math.E, 3);
  });

  it("应当正确计算对数均值不等式链 G < L < A", () => {
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

  it("应当正确组装右屏 MathPanel 数据与高考考点 (三模式完整契约)", () => {
    // 1. 隐零点模式
    const panel1 = buildDerivativeShiftPanel(
      { a: 2.0 },
      { activeMode: "implicit_zero", subModel: "x_ln_x" },
    );
    expect(panel1.quantities.length).toBeGreaterThanOrEqual(4);
    expect(panel1.theorems.length).toBe(2);
    expect(panel1.gaokaoPoints.length).toBe(3);
    expect(panel1.warnings).toHaveLength(0);
    expect(panel1.reasoningSteps).toBeDefined();
    expect(panel1.reasoningSteps).toHaveLength(3);
    expect(panel1.reasoningSteps![0].rubric).toContain("采分点");

    // 隐零点异常参数触发警告
    const panel1Warn = buildDerivativeShiftPanel(
      { a: 0.1 },
      { activeMode: "implicit_zero", subModel: "x_ln_x" },
    );
    expect(panel1Warn.warnings.length).toBeGreaterThan(0);

    // 2. 极值点偏移模式
    const panel2 = buildDerivativeShiftPanel(
      { k: 0.25 },
      { activeMode: "shift_symmetric", subModel: "xe_neg_x" },
    );
    expect(panel2.quantities.length).toBeGreaterThanOrEqual(5);
    expect(panel2.theorems.length).toBe(2);
    expect(panel2.gaokaoPoints.length).toBe(2);
    expect(panel2.reasoningSteps).toBeDefined();
    expect(panel2.reasoningSteps).toHaveLength(3);

    // 割线超过极值警告
    const panel2Warn = buildDerivativeShiftPanel(
      { k: 0.4 },
      { activeMode: "shift_symmetric", subModel: "xe_neg_x" },
    );
    expect(panel2Warn.warnings.length).toBeGreaterThan(0);

    // 3. 对数均值模式
    const panel3 = buildDerivativeShiftPanel(
      { x1: 0.5, x2: 4.0 },
      { activeMode: "log_mean" },
    );
    expect(panel3.quantities.length).toBeGreaterThanOrEqual(4);
    expect(panel3.theorems.length).toBe(2);
    expect(panel3.gaokaoPoints.length).toBe(1);
    expect(panel3.reasoningSteps).toBeDefined();
    expect(panel3.reasoningSteps).toHaveLength(3);
  });

  it("应当为所有模式与模型提供有效预设列表 (含 ln_x_div_x)", () => {
    const presetsImplicit = getPresets("implicit_zero", "x_ln_x");
    expect(presetsImplicit.length).toBeGreaterThanOrEqual(3);

    const presetsExpLinear = getPresets("implicit_zero", "exp_linear");
    expect(presetsExpLinear.length).toBeGreaterThanOrEqual(3);

    const presetsShiftXe = getPresets("shift_symmetric", "xe_neg_x");
    expect(presetsShiftXe.length).toBeGreaterThanOrEqual(3);

    const presetsShiftLnx = getPresets("shift_symmetric", "ln_x_div_x");
    expect(presetsShiftLnx.length).toBeGreaterThanOrEqual(3);

    const presetsLogMean = getPresets("log_mean");
    expect(presetsLogMean.length).toBeGreaterThanOrEqual(3);
  });
});
