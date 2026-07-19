import { describe, it, expect } from "vitest";
import { quadraticChecker, expLogChecker, trigChecker } from "./degeneration";

describe("quadraticChecker", () => {
  it("should detect a = 0 degeneration", () => {
    const result = quadraticChecker.check({ a: 0, b: 2, c: 1 });
    expect(result.isDegenerate).toBe(true);
    expect(result.reports.some((r) => r.type === "a_zero")).toBe(true);
    expect(result.reports[0].level).toBe("danger");
  });

  it("should detect no real roots (Δ < 0)", () => {
    const result = quadraticChecker.check({ a: 1, b: 0, c: 1 });
    expect(result.isDegenerate).toBe(true);
    expect(result.reports.some((r) => r.type === "no_real_roots")).toBe(true);
  });

  it("should detect one root (Δ = 0)", () => {
    const result = quadraticChecker.check({ a: 1, b: -2, c: 1 });
    expect(result.isDegenerate).toBe(true);
    expect(result.reports.some((r) => r.type === "one_root")).toBe(true);
    expect(result.reports[0].level).toBe("info");
  });

  it("should not report for normal case", () => {
    const result = quadraticChecker.check({ a: 1, b: 0, c: -1 });
    expect(result.isDegenerate).toBe(false);
    expect(result.reports).toHaveLength(0);
  });
});

describe("expLogChecker", () => {
  it("should detect base ≤ 0", () => {
    const result = expLogChecker.check({ base: -2 });
    expect(result.isDegenerate).toBe(true);
    expect(result.reports.some((r) => r.type === "base_non_positive")).toBe(
      true,
    );
  });

  it("should detect base = 1", () => {
    const result = expLogChecker.check({ base: 1 });
    expect(result.isDegenerate).toBe(true);
    expect(result.reports.some((r) => r.type === "base_one")).toBe(true);
  });

  it("should not report for valid base", () => {
    const result = expLogChecker.check({ base: 2 });
    expect(result.isDegenerate).toBe(false);
  });
});

describe("trigChecker", () => {
  it("should detect tan undefined at π/2", () => {
    const result = trigChecker.check({ x: Math.PI / 2 });
    expect(result.isDegenerate).toBe(true);
    expect(result.reports.some((r) => r.type === "tan_undefined")).toBe(true);
  });

  it("should not report for valid x", () => {
    const result = trigChecker.check({ x: 0 });
    expect(result.isDegenerate).toBe(false);
  });
});
