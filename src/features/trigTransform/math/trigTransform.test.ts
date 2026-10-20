import { describe, it, expect } from "vitest";
import {
  calcTrigProperties,
  getTransformPathSteps,
  calculateIntervalZeros,
  solveParamsFromDrag,
  formatPiValue,
  calcAdaptiveTrigXRange,
} from "./trigTransform";

describe("trigTransform math utils", () => {
  it("formatPiValue formats common angles correctly", () => {
    expect(formatPiValue(0)).toBe("0");
    expect(formatPiValue(Math.PI)).toBe("\\pi");
    expect(formatPiValue(-Math.PI)).toBe("-\\pi");
    expect(formatPiValue(Math.PI / 2)).toBe("\\frac{\\pi}{2}");
    expect(formatPiValue(Math.PI / 3)).toBe("\\frac{\\pi}{3}");
  });

  it("calcTrigProperties calculates amplitude, period, intervals, and symmetry elements", () => {
    // y = 2 sin(2x + pi/3) + 1
    const props = calcTrigProperties(2, 2, Math.PI / 3, 1, [-4, 4]);
    expect(props.amplitude).toBe(2);
    expect(props.period).toBeCloseTo(Math.PI);
    expect(props.yMax).toBe(3);
    expect(props.yMin).toBe(-1);
    expect(props.fivePoints.length).toBe(5);

    // 第一点 x0: 2*x + pi/3 = 0 => x = -pi/6
    expect(props.fivePoints[0].x).toBeCloseTo(-Math.PI / 6);
    expect(props.fivePoints[0].y).toBe(1);
    // 第二点 x1: 2*x + pi/3 = pi/2 => x = pi/12
    expect(props.fivePoints[1].x).toBeCloseTo(Math.PI / 12);
    expect(props.fivePoints[1].y).toBe(3);

    // 单调增区间: [-pi/2 - pi/3]/2 = -5pi/12, [pi/2 - pi/3]/2 = pi/12
    expect(props.mainIncInterval[0]).toBeCloseTo((-5 * Math.PI) / 12, 4);
    expect(props.mainIncInterval[1]).toBeCloseTo(Math.PI / 12, 4);

    // 单调减区间: [pi/12, (3pi/2 - pi/3)/2 = 7pi/12]
    expect(props.mainDecInterval[0]).toBeCloseTo(Math.PI / 12, 4);
    expect(props.mainDecInterval[1]).toBeCloseTo((7 * Math.PI) / 12, 4);

    // 对称轴和对称中心必须存在
    expect(props.mainSymmetryAxes.length).toBeGreaterThan(0);
    expect(props.mainSymmetryCenters.length).toBeGreaterThan(0);
  });

  it("getTransformPathSteps generates valid steps and verifies shift-first vs stretch-first shift amounts", () => {
    const A = 2;
    const omega = 2;
    const phi = Math.PI / 3;

    // 1. 先平移后伸缩：平移量为 |phi| = pi/3
    const steps1 = getTransformPathSteps(A, omega, phi, 0, "shift-first");
    expect(steps1.length).toBe(5);
    expect(steps1[1].vectorLabel).toContain("向左移");
    expect(steps1[1].vectorTo?.[0]).toBeCloseTo(-phi, 4);

    // 2. 先伸缩后平移：平移量为 |phi|/omega = pi/6 (高考高频考点)
    const steps2 = getTransformPathSteps(A, omega, phi, 0, "stretch-first");
    expect(steps2.length).toBe(5);
    expect(steps2[2].vectorLabel).toContain("向左移");
    expect(steps2[2].vectorTo?.[0]).toBeCloseTo(-phi / omega, 4);
    expect(steps2[2].explanation).toContain("除以 ω");
  });

  it("calculateIntervalZeros correctly counts zeros and detects monotonicity", () => {
    // f(x) = sin(2x), x in [0, pi] => u in [0, 2pi], zeros at 0, pi/2, pi (3 zeros)
    const res = calculateIntervalZeros(1, 2, 0, 0, 0, Math.PI);
    expect(res.zeroCount).toBe(3);
    expect(res.zeros.some((z) => z.isEndpoint)).toBe(true);

    // f(x) = sin(x), x in [0, pi/3] => strictly increasing
    const monoRes = calculateIntervalZeros(1, 1, 0, 0, 0, Math.PI / 3);
    expect(monoRes.isMonotone).toBe(true);
    expect(monoRes.monotoneType).toBe("increasing");
  });

  it("solveParamsFromDrag correctly updates parameters on dragging key points", () => {
    const current = { A: 1, omega: 2, phi: 0, k: 0 };
    // 拖动波峰点至 y=2.5, x=pi/4 (2*x + phi = pi/2 => phi = 0)
    const updated = solveParamsFromDrag(1, Math.PI / 4, 2.5, current);
    expect(updated.A).toBeCloseTo(2.5);
    expect(updated.phi).toBeCloseTo(0);
  });

  it("calcAdaptiveTrigXRange 自适应扩展视口范围，确保极端低频大相位下五点不飞出画布", () => {
    // 1. 默认参数 (omega=2, phi=pi/3)：保持默认 [-8, 8]
    const defaultRange = calcAdaptiveTrigXRange(2, Math.PI / 3);
    expect(defaultRange[0]).toBe(-8);
    expect(defaultRange[1]).toBe(8);

    // 2. 审查报告典型暴露条件：omega=0.2, phi=-pi
    // 五点 x 从 5pi (~15.71) 到 15pi (~47.12)
    const wideRange = calcAdaptiveTrigXRange(0.2, -Math.PI);
    expect(wideRange[0]).toBeLessThanOrEqual(-8);
    expect(wideRange[1]).toBeGreaterThanOrEqual(47.12 + 2);

    // 3. 验证此视口下五点全部落在内部
    const props = calcTrigProperties(1, 0.2, -Math.PI, 0, wideRange);
    expect(
      props.fivePoints.every(
        (pt: { x: number }) => pt.x >= wideRange[0] && pt.x <= wideRange[1],
      ),
    ).toBe(true);

    // 4. 负大初相：omega=0.5, phi=3pi => x 从 -6pi (~-18.85) 到 -2pi (~-6.28)
    const negRange = calcAdaptiveTrigXRange(0.5, 3 * Math.PI);
    expect(negRange[0]).toBeLessThanOrEqual(-18.85);
    expect(negRange[1]).toBeGreaterThanOrEqual(8);
    const negProps = calcTrigProperties(1, 0.5, 3 * Math.PI, 0, negRange);
    expect(
      negProps.fivePoints.every(
        (pt: { x: number }) => pt.x >= negRange[0] && pt.x <= negRange[1],
      ),
    ).toBe(true);
  });
});
