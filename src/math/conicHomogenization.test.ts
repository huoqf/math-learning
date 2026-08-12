import { describe, it, expect } from "vitest";
import { computeConicHomogenization } from "./conicHomogenization";

describe("conicHomogenization math calculations", () => {
  it("should compute valid homogenization for origin mode with ellipse", () => {
    const res = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "origin",
      a: 3.5,
      b: 2.5,
      P: { x: 0, y: 0 },
      lineA: 0.2,
      lineB: 0.3,
    });

    expect(res.isValidIntersections).toBe(true);
    expect(res.A).not.toBeNull();
    expect(res.B).not.toBeNull();
    expect(res.theoreticalSum).not.toBeNull();
    expect(res.measuredSum).not.toBeNull();

    // 理论斜率和与实测斜率和一致 (误差在 1e-3 内)
    expect(res.theoreticalSum!).toBeCloseTo(res.measuredSum!, 3);
    expect(res.theoreticalProduct!).toBeCloseTo(res.measuredProduct!, 3);
  });

  it("should compute valid homogenization for vertex shift mode", () => {
    const res = computeConicHomogenization({
      curveType: "ellipse",
      studyMode: "shift",
      a: 2.5,
      b: 1.5,
      P: { x: -2.5, y: 0 },
      lineA: 0.3,
      lineB: 0.4,
    });

    expect(res.isValidIntersections).toBe(true);
    expect(res.measuredK1).not.toBeNull();
    expect(res.measuredK2).not.toBeNull();
    expect(res.theoreticalSum!).toBeCloseTo(res.measuredSum!, 3);
  });
});
