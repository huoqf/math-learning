import { describe, it, expect } from "vitest";
import {
  calculateTangentLine,
  checkParamKBounding,
  calculateSecantLine,
  calculateParallelBandGap,
} from "./tangentScaling";

describe("导数切线放缩与双切线卡位数学计算库测试", () => {
  it("基准切线方程计算准确性 (e^x 在 x0=0 处切线为 y = x + 1)", () => {
    const res = calculateTangentLine("exp", 0);
    expect(res.isValid).toBe(true);
    expect(res.slope).toBeCloseTo(1.0, 5);
    expect(res.intercept).toBeCloseTo(1.0, 5);
    expect(res.equationLatex).toContain("x + 1");
  });

  it("移轴切线计算 (e^(x-1) 在 x0=1 处切线为 y = x)", () => {
    const res = calculateTangentLine("exp_shift", 1);
    expect(res.isValid).toBe(true);
    expect(res.slope).toBeCloseTo(1.0, 5);
    expect(res.intercept).toBeCloseTo(0.0, 5);
    expect(res.equationLatex).toBe("y = x");
  });

  it("对数切线计算 (ln x 在 x0=1 处切线为 y = x - 1)", () => {
    const res = calculateTangentLine("log", 1);
    expect(res.isValid).toBe(true);
    expect(res.slope).toBeCloseTo(1.0, 5);
    expect(res.intercept).toBeCloseTo(-1.0, 5);
  });

  it("过定点动直线双切线卡位斜率边界判定 (1/e <= k <= e)", () => {
    // k = 1.0 处于 [1/e, e] 之内，应当安全
    const safeRes = checkParamKBounding(1.0, 1.0);
    expect(safeRes.isSafe).toBe(true);
    expect(safeRes.upperMargin).toBeGreaterThanOrEqual(0);
    expect(safeRes.lowerMargin).toBeGreaterThanOrEqual(0);

    // k = 3.0 > e，穿透 e^x
    const topFail = checkParamKBounding(3.0, 1.0);
    expect(topFail.isSafe).toBe(false);
    expect(topFail.statusText).toContain("穿透上方曲线");

    // k = 0.2 < 1/e，穿透 ln x
    const bottomFail = checkParamKBounding(0.2, 1.0);
    expect(bottomFail.isSafe).toBe(false);
    expect(bottomFail.statusText).toContain("穿透下方曲线");
  });

  it("单侧卡位斜率判定 (exp_kx_origin: k <= e, log_kx_origin: k >= 1/e)", () => {
    // 指数单侧 k <= e: 即使 k = 0.2 < 1/e，对指数也是安全的
    const expSingleSafe = checkParamKBounding(0.2, 1.0, "exp_kx_origin");
    expect(expSingleSafe.isSafe).toBe(true);
    expect(expSingleSafe.statusText).toContain("单侧卡位成功");

    const expSingleFail = checkParamKBounding(3.0, 1.0, "exp_kx_origin");
    expect(expSingleFail.isSafe).toBe(false);

    // 对数单侧 k >= 1/e: 即使 k = 3.0 > e，对对数也是安全的
    const logSingleSafe = checkParamKBounding(3.0, 1.0, "log_kx_origin");
    expect(logSingleSafe.isSafe).toBe(true);
    expect(logSingleSafe.statusText).toContain("单侧卡位成功");

    const logSingleFail = checkParamKBounding(0.2, 1.0, "log_kx_origin");
    expect(logSingleFail.isSafe).toBe(false);
  });

  it("平行双切线缓冲间距计算 (y = x + 1 与 y = x - 1 纵向差为 2)", () => {
    const gap = calculateParallelBandGap(1, 1, -1);
    expect(gap.verticalGap).toBe(2);
    expect(gap.normalDistance).toBeCloseTo(2 / Math.SQRT2, 5);
  });

  it("割线斜率与截距计算", () => {
    const sec = calculateSecantLine((x) => x * x, 1, 3);
    expect(sec.isValid).toBe(true);
    expect(sec.slope).toBeCloseTo(4, 5); // (9 - 1) / (3 - 1) = 4
    expect(sec.intercept).toBeCloseTo(-3, 5); // 1 - 4 * 1 = -3
  });
});
