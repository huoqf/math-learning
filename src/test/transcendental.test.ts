import { describe, it, expect } from "vitest";
import {
  solveExpTangent,
  solveLogTangent,
  solveParamExpAx1,
  solveParamExpAx,
} from "../math/transcendental";

describe("Transcendental Math Module Tests", () => {
  it("should calculate exp tangent correctly at x0 = 0", () => {
    const res = solveExpTangent(0);
    expect(res.isValid).toBe(true);
    expect(res.y0).toBeCloseTo(1.0);
    expect(res.slope).toBeCloseTo(1.0);
    expect(res.intercept).toBeCloseTo(1.0);
  });

  it("should calculate exp tangent correctly at x0 = 1", () => {
    const res = solveExpTangent(1);
    expect(res.isValid).toBe(true);
    expect(res.y0).toBeCloseTo(Math.E);
    expect(res.slope).toBeCloseTo(Math.E);
    expect(res.intercept).toBeCloseTo(0.0); // y = e*x + 0
  });

  it("should calculate log tangent correctly at x0 = 1", () => {
    const res = solveLogTangent(1);
    expect(res.isValid).toBe(true);
    expect(res.y0).toBeCloseTo(0.0);
    expect(res.slope).toBeCloseTo(1.0);
    expect(res.intercept).toBeCloseTo(-1.0); // y = x - 1
  });

  it("should return invalid for x0 <= 0 in log function", () => {
    const res = solveLogTangent(-1);
    expect(res.isValid).toBe(false);
  });

  it("should identify tangent critical state for e^x >= ax + 1", () => {
    const resTangent = solveParamExpAx1(1.0);
    expect(resTangent.status).toBe("tangent");
    expect(resTangent.intersections).toBe(1);

    const resIntersect = solveParamExpAx1(1.5);
    expect(resIntersect.status).toBe("intersect");
    expect(resIntersect.intersections).toBe(2);
  });

  it("should identify tangent critical state for e^x >= ax", () => {
    const resTangent = solveParamExpAx(Math.E);
    expect(resTangent.status).toBe("tangent");
    expect(resTangent.intersections).toBe(1);
  });
});
