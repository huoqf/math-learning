import { describe, it, expect } from "vitest";
import {
  evalFunctionParity,
  evalSecantSlope,
  evalSymmetryPeriod,
  evalAxisSymmetry,
  evalCenterSymmetry,
  evalPeriodicityModel,
  calculatePowerFunction,
  calculateExpLog,
  solveBisection,
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

  it("correctly identifies absolute value as even function", () => {
    const res = evalFunctionParity("abs", -3);
    expect(res.parity).toBe("even");
    expect(res.fx).toBe(3);
    expect(res.fNegX).toBe(3);
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

  it("calculates negative slope for decreasing interval", () => {
    const fn = (x: number) => -2 * x + 5;
    const res = evalSecantSlope(fn, 1, 4);
    expect(res.slope).toBe(-2);
    expect(res.monotonicity).toBe("decreasing");
  });

  it("handles constant function slope k = 0", () => {
    const fn = (_x: number) => 3;
    const res = evalSecantSlope(fn, 1, 5);
    expect(res.slope).toBe(0);
    expect(res.monotonicity).toBe("constant");
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

describe("evalAxisSymmetry", () => {
  it("evaluates symmetry for parabola y = (x - 2)^2 about axis x = 2", () => {
    const fn = (x: number) => Math.pow(x - 2, 2);
    const res = evalAxisSymmetry(fn, 2, 3);
    expect(res.symX).toBe(1);
    expect(res.fx).toBe(1);
    expect(res.symFx).toBe(1);
    expect(res.isSymmetric).toBe(true);
  });

  it("evaluates asymmetry when function is not symmetric about given axis", () => {
    const fn = (x: number) => Math.pow(x, 3);
    const res = evalAxisSymmetry(fn, 2, 3);
    expect(res.isSymmetric).toBe(false);
  });
});

describe("evalCenterSymmetry", () => {
  it("evaluates center symmetry for cubic y = (x - 1)^3 + 2 about (1, 2)", () => {
    const fn = (x: number) => Math.pow(x - 1, 3) + 2;
    const res = evalCenterSymmetry(fn, 1, 2, 2);
    expect(res.symX).toBe(0);
    expect(res.fx).toBe(3);
    expect(res.symFx).toBe(1);
    expect(res.midY).toBe(2);
    expect(res.isSymmetric).toBe(true);
  });

  it("evaluates asymmetry for non-center-symmetric point", () => {
    const fn = (x: number) => x * x;
    const res = evalCenterSymmetry(fn, 1, 2, 3);
    expect(res.isSymmetric).toBe(false);
  });
});

describe("evalPeriodicityModel", () => {
  it("computes dual-axis period T = 2|a - b|", () => {
    const res = evalPeriodicityModel("dual-axis", 1, 3);
    expect(res.period).toBe(4);
    expect(res.waveFn(1)).toBeCloseTo(1);
    expect(res.waveFn(3)).toBeCloseTo(-1);
  });

  it("computes dual-center period T = 2|a - b|", () => {
    const res = evalPeriodicityModel("dual-center", 1, 3);
    expect(res.period).toBe(4);
    expect(res.waveFn(1)).toBeCloseTo(0);
    expect(res.waveFn(3)).toBeCloseTo(0);
  });

  it("computes axis-center period T = 4|a - b|", () => {
    const res = evalPeriodicityModel("axis-center", 0, 2);
    expect(res.period).toBe(8);
    expect(res.waveFn(0)).toBeCloseTo(1); // 轴对称处峰值
    expect(res.waveFn(2)).toBeCloseTo(0); // 中心对称处零点
  });

  it("handles coincident parameters a === b with valid: false", () => {
    const res = evalPeriodicityModel("dual-axis", 2, 2);
    expect(res.valid).toBe(false);
    expect(res.formulaLatex).toContain("两轴重合");
  });
});

describe("calculateExpLog", () => {
  it("calculates standard exponential and logarithmic functions (a = 2)", () => {
    const res = calculateExpLog(2, 3);
    expect(res.isValidBase).toBe(true);
    expect(res.expVal).toBe(8); // 2^3 = 8
    expect(res.logVal).toBeCloseTo(Math.log2(3));
    expect(res.isLogDefined).toBe(true);
    expect(res.logSignState).toBe("positive"); // a > 1, x > 1 -> positive
  });

  it("detects invalid base a <= 0 or a = 1", () => {
    const resNeg = calculateExpLog(-2, 1);
    expect(resNeg.isValidBase).toBe(false);
    expect(resNeg.baseWarning).toContain("必须大于 0");

    const resOne = calculateExpLog(1, 2);
    expect(resOne.isValidBase).toBe(false);
    expect(resOne.baseWarning).toContain("退化为常数函数");
  });

  it("evaluates fixed point derivatives and tangent equations", () => {
    // at fixed point x0 = 1 for log, x0 = 0 for exp with base e (approx a = Math.E)
    const resE = calculateExpLog(Math.E, 1);
    expect(resE.expFixedPointSlope).toBeCloseTo(1); // (e^x)' at x=0 is ln(e)=1
    expect(resE.logFixedPointSlope).toBeCloseTo(1); // (ln x)' at x=1 is 1/ln(e)=1
    expect(resE.logSignState).toBe("zero"); // log(1) = 0
  });

  it("correctly identifies 'same large positive, opposite negative' for logarithms", () => {
    // a > 1, 0 < x < 1 -> negative
    const res1 = calculateExpLog(2, 0.5);
    expect(res1.logSignState).toBe("negative");

    // 0 < a < 1, x > 1 -> negative
    const res2 = calculateExpLog(0.5, 2);
    expect(res2.logSignState).toBe("negative");

    // 0 < a < 1, 0 < x < 1 -> positive
    const res3 = calculateExpLog(0.5, 0.25);
    expect(res3.logSignState).toBe("positive");

    // x <= 0 -> undefined
    const resUndef = calculateExpLog(2, -1);
    expect(resUndef.isLogDefined).toBe(false);
    expect(resUndef.logSignState).toBe("undefined");
  });
});

describe("calculatePowerFunction", () => {
  it("correctly evaluates power function for integer alpha = 2", () => {
    const res = calculatePowerFunction(2, 3);
    expect(res.isValidPoint).toBe(true);
    expect(res.yVal).toBe(9);
    expect(res.parityDescription).toContain("偶函数");
  });

  it("handles alpha = 0 and 0^0 invalid point", () => {
    const res0Valid = calculatePowerFunction(0, 2);
    expect(res0Valid.isValidPoint).toBe(true);
    expect(res0Valid.yVal).toBe(1);
    expect(res0Valid.tangentSlopeStr).toBe("0");

    const res0Zero = calculatePowerFunction(0, 0);
    expect(res0Zero.isValidPoint).toBe(false);
    expect(res0Zero.warningMessage).toContain("0⁰ 在数学上无意义");
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

    // at x0 = 0, tangent is vertical (x = 0)
    const resZero = calculatePowerFunction(0.5, 0);
    expect(resZero.isTangentDifferentiable).toBe(false);
    expect(resZero.tangentEquationLatex).toBe("x = 0");
  });

  it("calculates derivative and tangent correctly at fixed point (1, 1)", () => {
    const res = calculatePowerFunction(3, 1);
    expect(res.isAtFixedPoint).toBe(true);
    expect(res.isTangentDifferentiable).toBe(true);
    expect(res.derivativeVal).toBe(3);
    expect(res.tangentEquationLatex).toBe("y = 3.00x - 2.00");
  });
});

describe("solveBisection", () => {
  it("finds root of continuous function f(x) = x^2 - 2 on [1, 2]", () => {
    const fn = (x: number) => x * x - 2;
    const res = solveBisection(fn, 1, 2, 10);
    expect(res.hasZero).toBe(true);
    expect(res.validity).toBe(true);
    expect(res.approxRoot).toBeCloseTo(Math.SQRT2, 2);
    expect(res.steps.length).toBeGreaterThan(0);
    expect(res.errorBound).toBeLessThanOrEqual(1 / Math.pow(2, 10));
  });

  it("warns when intermediate value theorem precondition f(a)*f(b) < 0 is violated", () => {
    const fn = (x: number) => x * x + 1; // f(x) > 0 for all x
    const res = solveBisection(fn, 1, 3, 5);
    expect(res.hasZero).toBe(false);
    expect(res.warningMessage).toContain("不满足零点存在性定理前提");
  });

  it("rejects invalid interval when m >= n", () => {
    const fn = (x: number) => x;
    const res = solveBisection(fn, 3, 1, 5);
    expect(res.hasZero).toBe(false);
    expect(res.validity).toBe(false);
    expect(res.warningMessage).toContain("要求左端点 m < 右端点 n");
  });
});
