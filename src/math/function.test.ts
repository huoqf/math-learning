import { describe, it, expect } from "vitest";
import {
  evalFunctionParity,
  evalSecantSlope,
  evalSymmetryPeriod,
  calculatePowerFunction,
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

describe("calculatePowerFunction", () => {
  it("correctly evaluates power function for integer alpha = 2", () => {
    const res = calculatePowerFunction(2, 3);
    expect(res.isValidPoint).toBe(true);
    expect(res.yVal).toBe(9);
    expect(res.parityDescription).toContain("偶函数");
  });

  it("handles negative exponent alpha = -1 and invalid x0 = 0", () => {
    const resZero = calculatePowerFunction(-1, 0);
    expect(resZero.isValidPoint).toBe(false);
    expect(resZero.warningMessage).toContain("x = 0 为分母无定义点");

    const resValid = calculatePowerFunction(-1, 2);
    expect(resValid.isValidPoint).toBe(true);
    expect(resValid.yVal).toBe(0.5);
    expect(resValid.hasAsymptote).toBe(true);
  });

  it("handles fractional exponent alpha = 0.5 with domain x >= 0", () => {
    const resNeg = calculatePowerFunction(0.5, -4);
    expect(resNeg.isValidPoint).toBe(false);
    expect(resNeg.warningMessage).toContain("x 必须非负");

    const resPos = calculatePowerFunction(0.5, 4);
    expect(resPos.isValidPoint).toBe(true);
    expect(resPos.yVal).toBe(2);
    expect(resPos.isTangentDifferentiable).toBe(true);
    expect(resPos.derivativeVal).toBeCloseTo(0.25);
    expect(resPos.tangentEquationLatex).toContain("0.25x");
  });

  it("calculates derivative and tangent correctly at fixed point (1, 1)", () => {
    const res = calculatePowerFunction(3, 1);
    expect(res.isAtFixedPoint).toBe(true);
    expect(res.isTangentDifferentiable).toBe(true);
    expect(res.derivativeVal).toBe(3);
    expect(res.tangentEquationLatex).toBe("y = 3.00x - 2.00");
  });
});
