import { describe, it, expect } from "vitest";
import {
  evalFunctionParity,
  evalSecantSlope,
  evalSymmetryPeriod,
} from "./function";

describe("evalFunctionParity", () => {
  it("correctly identifies cubic as odd function", () => {
    const res = evalFunctionParity("cubic", 2);
    expect(res.parity).toBe("odd");
    expect(res.fx).toBe(8);
    expect(res.fNegX).toBe(-8);
  });

  it("correctly identifies quadratic as even function", () => {
    const res = evalFunctionParity("quadratic", 2);
    expect(res.parity).toBe("even");
    expect(res.fx).toBe(4);
    expect(res.fNegX).toBe(4);
  });

  it("handles reciprocal discontinuity at 0", () => {
    const res = evalFunctionParity("reciprocal", 0);
    expect(Number.isNaN(res.fx)).toBe(true);
  });
});

describe("evalSecantSlope", () => {
  it("calculates positive slope for increasing interval", () => {
    const fn = (x: number) => x * x;
    const res = evalSecantSlope(fn, 1, 3);
    expect(res.slope).toBe(4); // (9 - 1) / (3 - 1) = 4
    expect(res.monotonicity).toBe("increasing");
  });

  it("handles coincident points x1 === x2", () => {
    const fn = (x: number) => x * x;
    const res = evalSecantSlope(fn, 2, 2);
    expect(res.monotonicity).toBe("invalid");
    expect(Number.isNaN(res.slope)).toBe(true);
  });
});

describe("evalSymmetryPeriod", () => {
  it("calculates period from double axis symmetry T = 2|a - b|", () => {
    const res = evalSymmetryPeriod(1, 4);
    expect(res.dist).toBe(3);
    expect(res.period).toBe(6);
  });
});
