import { describe, it, expect } from "vitest";
import {
  calculateTrigLines,
  calculateComparisonAreas,
  solveTrigInequality,
  pointToAngleDeg,
  normalizeAngleDeg,
} from "./trigLines";

describe("trigLines pure math tests", () => {
  it("should calculate basic trig lines for 30 deg", () => {
    const res = calculateTrigLines(30);
    expect(res.sinVal).toBeCloseTo(0.5, 3);
    expect(res.cosVal).toBeCloseTo(Math.sqrt(3) / 2, 3);
    expect(res.isTanDefined).toBe(true);
    expect(res.tanVal).toBeCloseTo(1 / Math.sqrt(3), 3);
    expect(res.quadrant).toBe(1);
    expect(res.hasDegenerateSine).toBe(false);
    expect(res.hasDegenerateCosine).toBe(false);
  });

  it("should handle axis boundary angles and degenerations correctly", () => {
    // 0 deg: sin = 0 (正弦线退化为点), tan = 0 (正切线退化为点)
    const res0 = calculateTrigLines(0);
    expect(res0.sinVal).toBeCloseTo(0, 4);
    expect(res0.cosVal).toBeCloseTo(1, 4);
    expect(res0.hasDegenerateSine).toBe(true);
    expect(res0.hasDegenerateTangent).toBe(true);
    expect(res0.quadrant).toBe("axis-x-pos");

    // 90 deg: cos = 0 (余弦线退化为点), tan 未定义
    const res90 = calculateTrigLines(90);
    expect(res90.sinVal).toBeCloseTo(1, 3);
    expect(res90.cosVal).toBeCloseTo(0, 3);
    expect(res90.isTanDefined).toBe(false);
    expect(res90.pointT).toBeNull();
    expect(res90.hasDegenerateCosine).toBe(true);
    expect(res90.quadrant).toBe("axis-y-pos");

    // 180 deg
    const res180 = calculateTrigLines(180);
    expect(res180.quadrant).toBe("axis-x-neg");
    expect(res180.hasDegenerateSine).toBe(true);

    // 270 deg
    const res270 = calculateTrigLines(270);
    expect(res270.quadrant).toBe("axis-y-neg");
    expect(res270.isTanDefined).toBe(false);
  });

  it("should handle 4 quadrants correctly", () => {
    // Q2: 120 deg
    const res120 = calculateTrigLines(120);
    expect(res120.quadrant).toBe(2);
    expect(res120.sinVal).toBeGreaterThan(0);
    expect(res120.cosVal).toBeLessThan(0);
    expect(res120.tanVal).toBeLessThan(0);

    // Q3: 210 deg
    const res210 = calculateTrigLines(210);
    expect(res210.quadrant).toBe(3);
    expect(res210.sinVal).toBeLessThan(0);
    expect(res210.cosVal).toBeLessThan(0);
    expect(res210.tanVal).toBeGreaterThan(0);

    // Q4: 300 deg
    const res300 = calculateTrigLines(300);
    expect(res300.quadrant).toBe(4);
    expect(res300.sinVal).toBeLessThan(0);
    expect(res300.cosVal).toBeGreaterThan(0);
    expect(res300.tanVal).toBeLessThan(0);
  });

  it("should calculate comparison areas correctly and verify sin x < x < tan x", () => {
    const areas = calculateComparisonAreas(30);
    expect(areas.triangleOMP).toBeLessThan(areas.sectorOAP);
    expect(areas.sectorOAP).toBeLessThan(areas.triangleOAT);
    expect(areas.sinX).toBeLessThan(areas.xRad);
    expect(areas.xRad).toBeLessThan(areas.tanX);

    // 接近 0 极限：sin(x) / x -> 1
    const areasSmall = calculateComparisonAreas(1);
    expect(areasSmall.sinX / areasSmall.xRad).toBeCloseTo(1, 2);
  });

  it("should solve all 6 types of trig inequalities including positive and negative thresholds", () => {
    // 1. sin x > 0.5 (正阈值)
    const ineqSinGt = solveTrigInequality("sin_gt", 0.5, 45);
    expect(ineqSinGt.isSatisfied).toBe(true);
    expect(ineqSinGt.intervals).toHaveLength(1);
    expect(ineqSinGt.intervals[0].startDeg).toBeCloseTo(30, 1);
    expect(ineqSinGt.intervals[0].endDeg).toBeCloseTo(150, 1);

    // 2. sin x > -0.5 (负阈值: 应为两段 [0, 210°) ∪ (330°, 360°))
    const ineqSinGtNeg = solveTrigInequality("sin_gt", -0.5, 0);
    expect(ineqSinGtNeg.isSatisfied).toBe(true);
    expect(ineqSinGtNeg.intervals).toHaveLength(2);
    expect(ineqSinGtNeg.intervals[0].endDeg).toBeCloseTo(210, 1);
    expect(ineqSinGtNeg.intervals[1].startDeg).toBeCloseTo(330, 1);

    // 3. sin x < -0.5 (负阈值: 单段 (210°, 330°))
    const ineqSinLtNeg = solveTrigInequality("sin_lt", -0.5, 270);
    expect(ineqSinLtNeg.isSatisfied).toBe(true);
    expect(ineqSinLtNeg.intervals).toHaveLength(1);
    expect(ineqSinLtNeg.intervals[0].startDeg).toBeCloseTo(210, 1);
    expect(ineqSinLtNeg.intervals[0].endDeg).toBeCloseTo(330, 1);

    // 4. cos x > 0.5 (两段 [0, 60°) ∪ (300°, 360°))
    const ineqCosGt = solveTrigInequality("cos_gt", 0.5, 30);
    expect(ineqCosGt.isSatisfied).toBe(true);
    expect(ineqCosGt.intervals).toHaveLength(2);

    // 5. cos x < 0.5 (单段 (60°, 300°))
    const ineqCosLt = solveTrigInequality("cos_lt", 0.5, 180);
    expect(ineqCosLt.isSatisfied).toBe(true);
    expect(ineqCosLt.intervals).toHaveLength(1);

    // 6. tan x > 1 (两段 (45°, 90°) ∪ (225°, 270°))
    const ineqTanGt = solveTrigInequality("tan_gt", 1, 60);
    expect(ineqTanGt.isSatisfied).toBe(true);
    expect(ineqTanGt.intervals).toHaveLength(2);

    // 7. tan x < 1 (正阈值: [0, 45°) ∪ (90°, 225°) ∪ (270°, 360°))
    const ineqTanLt = solveTrigInequality("tan_lt", 1, 30);
    expect(ineqTanLt.isSatisfied).toBe(true);
    expect(ineqTanLt.intervals).toHaveLength(3);

    // 8. 越界无解情形
    const ineqEmpty = solveTrigInequality("sin_gt", 1.5, 90);
    expect(ineqEmpty.latexSolution).toBe("\\varnothing");
  });

  it("should normalize angles and reverse solve angle on drag", () => {
    expect(normalizeAngleDeg(750)).toBe(30);
    expect(normalizeAngleDeg(-30)).toBe(330);

    const deg = pointToAngleDeg(0, 1, 45);
    expect(deg).toBe(90);
  });
});
