import { describe, it, expect } from "vitest";
import {
  calcEndpointEffect,
  calcLHopital,
  calcTaylorPolynomial,
} from "./derivativeEndpointTaylor";

describe("端点效应与洛必达/泰勒拟合数学计算模块", () => {
  describe("端点效应 (calcEndpointEffect)", () => {
    it("指数模型 f(x) = e^x - ax - 1: a=1.0 临界成立，a=1.2 失效", () => {
      const resValid = calcEndpointEffect("exp", 1.0);
      expect(resValid.x0).toBe(0);
      expect(resValid.f0).toBe(0);
      expect(resValid.df0).toBeCloseTo(0, 5);
      expect(resValid.isNecessaryValid).toBe(true);
      expect(resValid.isSufficientValid).toBe(true);

      const resInvalid = calcEndpointEffect("exp", 1.2);
      expect(resInvalid.df0).toBeCloseTo(-0.2, 5);
      expect(resInvalid.isNecessaryValid).toBe(false);
      expect(resInvalid.isSufficientValid).toBe(false);
    });

    it("对数模型 f(x) = ln(x+1) - ax: a=1.0 临界成立，a=0.8 失效", () => {
      const resValid = calcEndpointEffect("ln", 1.0);
      expect(resValid.x0).toBe(0);
      expect(resValid.df0).toBeCloseTo(0, 5);
      expect(resValid.isNecessaryValid).toBe(true);
      expect(resValid.isSufficientValid).toBe(true);

      const resInvalid = calcEndpointEffect("ln", 0.8);
      expect(resInvalid.isNecessaryValid).toBe(false);
      expect(resInvalid.isSufficientValid).toBe(false);
    });

    it("超越混合模型 f(x) = x ln x - a(x-1): 端点 x0=1, 临界 a=1.0", () => {
      const resValid = calcEndpointEffect("xln", 1.0);
      expect(resValid.x0).toBe(1);
      expect(resValid.f0).toBe(0);
      expect(resValid.df0).toBeCloseTo(0, 5);
      expect(resValid.isNecessaryValid).toBe(true);
      expect(resValid.isSufficientValid).toBe(true);
    });
  });

  describe("洛必达法则 (calcLHopital)", () => {
    it("0/0 未定式极限趋于 1/2", () => {
      const res = calcLHopital(0.1);
      expect(res.limitVal).toBe(0.5);
      expect(res.ratioVal).toBeCloseTo(0.517, 2);

      const resZero = calcLHopital(0.0);
      expect(resZero.ratioVal).toBe(0.5);
      expect(resZero.ratioDerivVal).toBe(0.5);
    });
  });

  describe("泰勒拟合放缩 (calcTaylorPolynomial)", () => {
    it("e^x 展开: 1阶 1+x, 2阶 1+x+x^2/2, 3阶 1+x+x^2/2+x^3/6", () => {
      const res1 = calcTaylorPolynomial("exp", 1, 0);
      expect(res1.taylorFn(1)).toBe(2);
      expect(res1.scalingInequality).toContain("e^x \\ge x + 1");

      const res2 = calcTaylorPolynomial("exp", 2, 0);
      expect(res2.taylorFn(1)).toBe(2.5);

      const res3 = calcTaylorPolynomial("exp", 3, 0);
      expect(res3.taylorFn(1)).toBeCloseTo(2.6666, 3);
    });

    it("ln(1+x) 展开: 1阶 x, 2阶 x-x^2/2", () => {
      const res1 = calcTaylorPolynomial("ln", 1, 0);
      expect(res1.taylorFn(0.5)).toBe(0.5);

      const res2 = calcTaylorPolynomial("ln", 2, 0);
      expect(res2.taylorFn(0.5)).toBe(0.375);
    });

    it("sin(x) 与 cos(x) 展开正确性", () => {
      const sin3 = calcTaylorPolynomial("sin", 3, 0);
      expect(sin3.taylorFn(0.5)).toBeCloseTo(0.5 - (1 / 6) * 0.125, 4);

      const cos2 = calcTaylorPolynomial("cos", 2, 0);
      expect(cos2.taylorFn(0.5)).toBeCloseTo(1 - 0.5 * 0.25, 4);
    });

    it("泰勒多项式残差 residualFn 在展开点附近快速收敛于 0", () => {
      const resExp3 = calcTaylorPolynomial("exp", 3, 0);
      expect(resExp3.residualFn(0)).toBe(0);
      expect(Math.abs(resExp3.residualFn(0.1))).toBeLessThan(1e-4);

      const resLn2 = calcTaylorPolynomial("ln", 2, 0);
      expect(resLn2.residualFn(0)).toBe(0);
      expect(Math.abs(resLn2.residualFn(0.05))).toBeLessThan(1e-4);
    });

    it("端点效应切线函数 tangentFn 正确计算", () => {
      const res = calcEndpointEffect("exp", 1.0);
      expect(res.tangentFn(0)).toBe(0); // 端点处相切过 (0,0)
      expect(res.tangentFn(1)).toBe(0); // 斜率 0 时水平线
    });
  });
});
