import { describe, it, expect } from "vitest";
import {
  calculateTrigLines,
  calculateComparisonAreas,
  solveTrigInequality,
  pointToAngleDeg,
} from "../trigLines";

describe("trigLines feature math tests", () => {
  it("should calculate basic trig lines for 30 deg", () => {
    const res = calculateTrigLines(30);
    expect(res.sinVal).toBeCloseTo(0.5, 3);
    expect(res.cosVal).toBeCloseTo(Math.sqrt(3) / 2, 3);
    expect(res.isTanDefined).toBe(true);
    expect(res.tanVal).toBeCloseTo(1 / Math.sqrt(3), 3);
    expect(res.quadrant).toBe(1);
  });

  it("should handle axis boundary angles and degenerations correctly", () => {
    const res0 = calculateTrigLines(0);
    expect(res0.hasDegenerateSine).toBe(true);
    expect(res0.quadrant).toBe("axis-x-pos");

    const res90 = calculateTrigLines(90);
    expect(res90.isTanDefined).toBe(false);
    expect(res90.quadrant).toBe("axis-y-pos");
  });

  it("should calculate comparison areas and inequalities correctly", () => {
    const areas = calculateComparisonAreas(30);
    expect(areas.triangleOMP).toBeLessThan(areas.sectorOAP);
    expect(areas.sectorOAP).toBeLessThan(areas.triangleOAT);

    const ineq = solveTrigInequality("sin_gt", 0.5, 45);
    expect(ineq.isSatisfied).toBe(true);

    const ineqTanLt = solveTrigInequality("tan_lt", 1, 30);
    expect(ineqTanLt.intervals.length).toBeGreaterThan(0);
  });

  it("should reverse solve angle correctly on drag", () => {
    const deg = pointToAngleDeg(0, 1, 45);
    expect(deg).toBe(90);
  });
});
