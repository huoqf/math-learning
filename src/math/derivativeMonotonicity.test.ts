import { describe, it, expect } from "vitest";
import {
  solveMonotonicityModel,
  MONOTONICITY_MODELS,
  formatFloat,
} from "./derivativeMonotonicity";

describe("derivativeMonotonicity math model", () => {
  it("should correctly solve cubic_param model for a > 0", () => {
    const res = solveMonotonicityModel("cubic_param", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(2);
    expect(res.extrema[0].type).toBe("maximum");
    expect(res.extrema[0].x).toBeCloseTo(-1.0);
    expect(res.extrema[1].type).toBe("minimum");
    expect(res.extrema[1].x).toBeCloseTo(1.0);
    expect(res.monotonicIntervals.length).toBe(3);
  });

  it("should handle cubic_param model critical case a = 0 (stationary point, non-extrema)", () => {
    const res = solveMonotonicityModel("cubic_param", 0.0);
    expect(res.hasExtrema).toBe(false);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("inflection_stationary");
    expect(res.extrema[0].x).toBe(0);
    expect(res.monotonicIntervals[0].type).toBe("increasing");
  });

  it("should handle cubic_param model monotonic case a < 0", () => {
    const res = solveMonotonicityModel("cubic_param", -1.0);
    expect(res.hasExtrema).toBe(false);
    expect(res.extrema.length).toBe(0);
    expect(res.monotonicIntervals[0].type).toBe("increasing");
  });

  it("should correctly solve exp_poly model (x - a)e^x", () => {
    const res = solveMonotonicityModel("exp_poly", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("minimum");
    expect(res.extrema[0].x).toBeCloseTo(0.0); // a - 1 = 0
    expect(res.extrema[0].y).toBeCloseTo(-1.0);
  });

  it("should correctly solve ln_x_ratio model (ln x)/x", () => {
    const res = solveMonotonicityModel("ln_x_ratio", 0.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("maximum");
    expect(res.extrema[0].x).toBeCloseTo(Math.E, 2); // e ≈ 2.718
    expect(res.extrema[0].y).toBeCloseTo(1 / Math.E, 2);
  });

  it("should correctly solve x_ln_x_param model x ln x - ax", () => {
    const res = solveMonotonicityModel("x_ln_x_param", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("minimum");
    expect(res.extrema[0].x).toBeCloseTo(1.0); // e^(1-1) = 1
    expect(res.extrema[0].y).toBeCloseTo(-1.0);
  });

  it("should correctly solve nike_rational model x + a/x", () => {
    const res = solveMonotonicityModel("nike_rational", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(2);
    expect(res.extrema[0].type).toBe("maximum");
    expect(res.extrema[0].x).toBeCloseTo(-1.0);
    expect(res.extrema[0].y).toBeCloseTo(-2.0);
    expect(res.extrema[1].type).toBe("minimum");
    expect(res.extrema[1].x).toBeCloseTo(1.0);
    expect(res.extrema[1].y).toBeCloseTo(2.0);
  });

  it("formats floats correctly", () => {
    expect(formatFloat(0)).toBe("0");
    expect(formatFloat(1.5)).toBe("1.5");
    expect(formatFloat(2.0)).toBe("2");
    expect(formatFloat(-0.0001)).toBe("0");
  });

  it("all models have complete definitions in MONOTONICITY_MODELS", () => {
    const keys = Object.keys(MONOTONICITY_MODELS);
    expect(keys.length).toBe(5);
  });
});
