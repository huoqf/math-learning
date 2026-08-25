import { describe, it, expect } from "vitest";
import {
  calculateTrigLines,
  calculateComparisonAreas,
  solveTrigInequality,
  pointToAngleDeg,
} from "./trigLines";

describe("trigLines pure math tests", () => {
  it("should calculate basic trig lines for 30 deg", () => {
    const res = calculateTrigLines(30);
    expect(res.sinVal).toBeCloseTo(0.5, 3);
    expect(res.cosVal).toBeCloseTo(Math.sqrt(3) / 2, 3);
    expect(res.isTanDefined).toBe(true);
    expect(res.tanVal).toBeCloseTo(1 / Math.sqrt(3), 3);
    expect(res.quadrant).toBe(1);
  });

  it("should handle 90 deg tangent undefined", () => {
    const res = calculateTrigLines(90);
    expect(res.sinVal).toBeCloseTo(1, 3);
    expect(res.cosVal).toBeCloseTo(0, 3);
    expect(res.isTanDefined).toBe(false);
    expect(res.pointT).toBeNull();
    expect(res.quadrant).toBe("axis-y-pos");
  });

  it("should calculate comparison areas correctly", () => {
    const areas = calculateComparisonAreas(30);
    expect(areas.triangleOMP).toBeLessThan(areas.sectorOAP);
    expect(areas.sectorOAP).toBeLessThan(areas.triangleOAT);
    expect(areas.sinX).toBeLessThan(areas.xRad);
    expect(areas.xRad).toBeLessThan(areas.tanX);
  });

  it("should solve trig inequality sin x > 0.5", () => {
    const ineq = solveTrigInequality("sin_gt", 0.5, 45);
    expect(ineq.isSatisfied).toBe(true);
    const ineqFalse = solveTrigInequality("sin_gt", 0.5, 0);
    expect(ineqFalse.isSatisfied).toBe(false);
  });

  it("should reverse solve angle correctly on drag", () => {
    const deg = pointToAngleDeg(0, 1, 45);
    expect(deg).toBe(90);
  });
});
