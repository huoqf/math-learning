import { describe, it, expect } from "vitest";
import {
  createComplex,
  addComplex,
  subComplex,
  mulComplex,
  divComplex,
  modulus,
  argument,
  toPolar,
  fromPolar,
  conjugate,
  formatComplexLatex,
  calcCircleLocusExtrema,
  calcPerpBisectorLocus,
  calcModulusTriangleInequality,
  expandComplexMultiply,
  rationalizeComplexDivision,
  powerOfI,
} from "./complex";

describe("complex math pure functions", () => {
  it("should calculate basic operations correctly", () => {
    const z1 = createComplex(3, 4);
    const z2 = createComplex(1, -2);

    expect(modulus(z1)).toBeCloseTo(5);
    expect(conjugate(z1)).toEqual({ re: 3, im: -4 });
    expect(addComplex(z1, z2)).toEqual({ re: 4, im: 2 });
    expect(subComplex(z1, z2)).toEqual({ re: 2, im: 6 });
  });

  it("should calculate multiplication and division correctly, and handle division by zero", () => {
    const z1 = createComplex(1, 2);
    const z2 = createComplex(3, -4);

    // (1+2i)(3-4i) = 3 - 4i + 6i - 8i^2 = 11 + 2i
    expect(mulComplex(z1, z2)).toEqual({ re: 11, im: 2 });

    const divRes = divComplex(createComplex(11, 2), z2);
    expect(divRes.valid).toBe(true);
    expect(divRes.result.re).toBeCloseTo(1);
    expect(divRes.result.im).toBeCloseTo(2);

    // 除零保护
    const divZero = divComplex(z1, createComplex(0, 0));
    expect(divZero.valid).toBe(false);
    expect(divZero.result).toEqual({ re: 0, im: 0 });
  });

  it("should verify complex algebraic properties (|z1*z2|=|z1||z2|, conj(z1*z2)=conj(z1)*conj(z2), z*conj(z)=|z|^2)", () => {
    const z1 = createComplex(3, 4); // |z1| = 5
    const z2 = createComplex(1, -1); // |z2| = sqrt(2)

    // 模乘积定理
    const prod = mulComplex(z1, z2);
    expect(modulus(prod)).toBeCloseTo(modulus(z1) * modulus(z2));

    // 共轭乘积定理
    const conjProd = conjugate(prod);
    const prodConj = mulComplex(conjugate(z1), conjugate(z2));
    expect(conjProd.re).toBeCloseTo(prodConj.re);
    expect(conjProd.im).toBeCloseTo(prodConj.im);

    // z * z_bar = |z|^2
    const zZbar = mulComplex(z1, conjugate(z1));
    expect(zZbar.re).toBeCloseTo(25);
    expect(zZbar.im).toBeCloseTo(0);
  });

  it("should handle polar and algebraic conversions correctly", () => {
    const z = createComplex(0, 2);
    const polar = toPolar(z);
    expect(polar.mod).toBeCloseTo(2);
    expect(polar.arg).toBeCloseTo(Math.PI / 2);

    const restored = fromPolar(polar.mod, polar.arg);
    expect(restored.re).toBeCloseTo(0);
    expect(restored.im).toBeCloseTo(2);
  });

  it("should handle argument correctly", () => {
    expect(argument(createComplex(0, 0))).toBe(0);
    expect(argument(createComplex(1, 0))).toBeCloseTo(0);
    expect(argument(createComplex(0, 1))).toBeCloseTo(Math.PI / 2);
    expect(argument(createComplex(-1, 0))).toBeCloseTo(Math.PI);
    expect(argument(createComplex(0, -1))).toBeCloseTo(-Math.PI / 2);
  });

  it("should format complex numbers to latex correctly", () => {
    expect(formatComplexLatex(createComplex(3, 4))).toBe("3 + 4i");
    expect(formatComplexLatex(createComplex(3, -4))).toBe("3 - 4i");
    expect(formatComplexLatex(createComplex(-2, 1))).toBe("-2 + i");
    expect(formatComplexLatex(createComplex(0, 1))).toBe("i");
    expect(formatComplexLatex(createComplex(0, -1))).toBe("-i");
    expect(formatComplexLatex(createComplex(0, -3))).toBe("-3i");
    expect(formatComplexLatex(createComplex(5, 0))).toBe("5");
    expect(formatComplexLatex(createComplex(-5, 0))).toBe("-5");
    expect(formatComplexLatex(createComplex(0, 0))).toBe("0");
  });

  it("should calculate circle locus extrema correctly (outside, inside, and center)", () => {
    const center = createComplex(3, 4); // |center| = 5
    const radius = 2;

    // 1. 目标点在圆外部 (0,0)
    const targetOutside = createComplex(0, 0);
    const resOut = calcCircleLocusExtrema(center, radius, targetOutside);
    expect(resOut.valid).toBe(true);
    expect(resOut.centerDist).toBeCloseTo(5);
    expect(resOut.minDist).toBeCloseTo(3); // 5 - 2
    expect(resOut.maxDist).toBeCloseTo(7); // 5 + 2

    // 2. 目标点在圆内部 (3, 3)
    const targetInside = createComplex(3, 3);
    const resIn = calcCircleLocusExtrema(center, radius, targetInside);
    expect(resIn.valid).toBe(true);
    expect(resIn.centerDist).toBeCloseTo(1);
    expect(resIn.minDist).toBeCloseTo(1); // |1 - 2| = 1
    expect(resIn.maxDist).toBeCloseTo(3); // 1 + 2 = 3

    // 3. 目标点重合于圆心 (3, 4)
    const targetCenter = createComplex(3, 4);
    const resCenter = calcCircleLocusExtrema(center, radius, targetCenter);
    expect(resCenter.valid).toBe(true);
    expect(resCenter.minDist).toBeCloseTo(2);
    expect(resCenter.maxDist).toBeCloseTo(2);
  });

  it("should calculate perpendicular bisector locus correctly", () => {
    const z1 = createComplex(3, 1);
    const z2 = createComplex(-1, 3);

    const res = calcPerpBisectorLocus(z1, z2);
    expect(res.valid).toBe(true);
    expect(res.midPoint).toEqual({ re: 1, im: 2 });
    expect(res.dist).toBeCloseTo(Math.hypot(-4, 2));

    // 重合点退化
    const degRes = calcPerpBisectorLocus(z1, z1);
    expect(degRes.valid).toBe(false);
  });

  it("should calculate modulus triangle inequality range correctly", () => {
    const z1 = createComplex(3, 0);
    const z2 = createComplex(0, 4);

    const res = calcModulusTriangleInequality(z1, z2);
    expect(res.mod1).toBeCloseTo(3);
    expect(res.mod2).toBeCloseTo(4);
    expect(res.modSum).toBeCloseTo(5);
    expect(res.lowerBound).toBeCloseTo(1); // |3 - 4|
    expect(res.upperBound).toBeCloseTo(7); // 3 + 4
  });

  it("should expand complex multiplication into term-by-term intermediates", () => {
    const z1 = createComplex(1, 2); // a=1, b=2
    const z2 = createComplex(3, -4); // c=3, d=-4

    const exp = expandComplexMultiply(z1, z2);

    // 逐项：ac=3, bd=-8, ad=-4, bc=6
    expect(exp.ac).toBeCloseTo(3);
    expect(exp.bd).toBeCloseTo(-8);
    expect(exp.ad).toBeCloseTo(-4);
    expect(exp.bc).toBeCloseTo(6);

    // i² 归并：bd·i² = -bd = 8，与实部 ac 合并
    expect(exp.iSquaredTerm).toBeCloseTo(8);

    // (1+2i)(3-4i) = 3 - 4i + 6i - 8i² = (3+8) + (-4+6)i = 11 + 2i
    expect(exp.re).toBeCloseTo(11);
    expect(exp.im).toBeCloseTo(2);

    // 展开式必须与既有乘法实现完全一致（同源校验）
    const direct = mulComplex(z1, z2);
    expect(exp.re).toBeCloseTo(direct.re);
    expect(exp.im).toBeCloseTo(direct.im);
  });

  it("should rationalize complex division via conjugate and expose denominator |z2|^2", () => {
    const z1 = createComplex(11, 2);
    const z2 = createComplex(3, -4); // |z2|² = 9 + 16 = 25

    const res = rationalizeComplexDivision(z1, z2);

    expect(res.valid).toBe(true);
    expect(res.c2).toBeCloseTo(9);
    expect(res.d2).toBeCloseTo(16);
    // 分母实数化：c² + d² = |z2|² = 25
    expect(res.denominator).toBeCloseTo(25);

    // 分子乘共轭：(11+2i)(3+4i) = 33 + 44i + 6i + 8i² = (33-8) + (44+6)i = 25 + 50i
    expect(res.numeratorRe).toBeCloseTo(25);
    expect(res.numeratorIm).toBeCloseTo(50);

    // 商 = (25 + 50i) / 25 = 1 + 2i
    expect(res.result.re).toBeCloseTo(1);
    expect(res.result.im).toBeCloseTo(2);

    // 与既有除法实现同源校验
    const direct = divComplex(z1, z2);
    expect(direct.valid).toBe(true);
    expect(res.result.re).toBeCloseTo(direct.result.re);
    expect(res.result.im).toBeCloseTo(direct.result.im);
  });

  it("should mark division by zero as invalid during rationalization", () => {
    const res = rationalizeComplexDivision(
      createComplex(1, 1),
      createComplex(0, 0),
    );
    expect(res.valid).toBe(false);
    expect(res.denominator).toBe(0);
    expect(res.result).toEqual({ re: 0, im: 0 });
  });

  it("should compute i^n by cycle 4 and agree with repeated multiplication", () => {
    // 一个周期内的四张牌：i^1=i, i^2=-1, i^3=-i, i^4=1
    expect(powerOfI(1).value).toEqual({ re: 0, im: 1 });
    expect(powerOfI(1).latex).toBe("i");
    expect(powerOfI(2).value).toEqual({ re: -1, im: 0 });
    expect(powerOfI(2).latex).toBe("-1");
    expect(powerOfI(3).value).toEqual({ re: 0, im: -1 });
    expect(powerOfI(3).latex).toBe("-i");
    expect(powerOfI(4).value).toEqual({ re: 1, im: 0 });
    expect(powerOfI(4).latex).toBe("1");

    // 周期性与余数
    expect(powerOfI(0).residue).toBe(0);
    expect(powerOfI(5).residue).toBe(1);
    expect(powerOfI(5).value).toEqual({ re: 0, im: 1 }); // i^5 = i
    expect(powerOfI(2026).residue).toBe(2); // 2026 mod 4 = 2
    expect(powerOfI(2026).value).toEqual({ re: -1, im: 0 });

    // 负指数按最小非负余数归一：i^(-1) = 1/i = -i（余数 3）
    expect(powerOfI(-1).residue).toBe(3);
    expect(powerOfI(-1).value).toEqual({ re: 0, im: -1 });
    expect(powerOfI(-4).residue).toBe(0);
    expect(powerOfI(-4).value).toEqual({ re: 1, im: 0 });

    // 交叉校验：i^n 必须等于把 i 连乘 n 次的结果
    for (let n = 0; n <= 12; n += 1) {
      let acc = createComplex(1, 0);
      for (let k = 0; k < n; k += 1) {
        acc = mulComplex(acc, createComplex(0, 1));
      }
      const cycle = powerOfI(n).value;
      expect(cycle.re).toBeCloseTo(acc.re);
      expect(cycle.im).toBeCloseTo(acc.im);
    }
  });
});
