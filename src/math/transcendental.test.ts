import { describe, it, expect } from "vitest";
import {
  solveExpTangent,
  solveLogTangent,
  solveParamExpAx1,
  solveParamExpAx,
  sampleTangentDiff,
} from "./transcendental";

describe("transcendental (基准超越函数与切线放缩)", () => {
  describe("solveExpTangent (指数函数切线)", () => {
    it("原点处切线 (x0 = 0) 应为 y = x + 1", () => {
      const res = solveExpTangent(0);
      expect(res.isValid).toBe(true);
      expect(res.x0).toBe(0);
      expect(res.y0).toBe(1);
      expect(res.slope).toBe(1);
      expect(res.intercept).toBe(1);
      expect(res.latexEquation).toBe("y = 1.00x + 1.00");
    });

    it("切点 (1, e) 处切线应过原点 y = ex", () => {
      const res = solveExpTangent(1);
      expect(res.isValid).toBe(true);
      expect(res.x0).toBe(1);
      expect(res.y0).toBeCloseTo(Math.E, 4);
      expect(res.slope).toBeCloseTo(Math.E, 4);
      expect(res.intercept).toBeCloseTo(0, 4); // 截距为 0，过原点
    });

    it("处理非有限数值输入", () => {
      const res = solveExpTangent(NaN);
      expect(res.isValid).toBe(false);
      expect(res.degenerateReason).toBeDefined();
    });
  });

  describe("solveLogTangent (对数函数切线)", () => {
    it("切点 (1, 0) 处切线应为 y = x - 1", () => {
      const res = solveLogTangent(1);
      expect(res.isValid).toBe(true);
      expect(res.x0).toBe(1);
      expect(res.y0).toBe(0);
      expect(res.slope).toBe(1);
      expect(res.intercept).toBe(-1);
    });

    it("切点 (e, 1) 处切线应过原点 y = (1/e)x", () => {
      const res = solveLogTangent(Math.E);
      expect(res.isValid).toBe(true);
      expect(res.x0).toBeCloseTo(Math.E, 4);
      expect(res.y0).toBeCloseTo(1, 4);
      expect(res.slope).toBeCloseTo(1 / Math.E, 4);
      expect(res.intercept).toBeCloseTo(0, 4); // 截距为 0，过原点
    });

    it("非正定义域 (x <= 0) 应标记为无效", () => {
      const res = solveLogTangent(0);
      expect(res.isValid).toBe(false);
      expect(res.degenerateReason).toContain("定义域必须为 x > 0");
    });
  });

  describe("solveParamExpAx1 (e^x >= ax + 1 临界模型)", () => {
    it("a = 1 时为临界切线相切状态，全定义域恒成立", () => {
      const res = solveParamExpAx1(1.0);
      expect(res.status).toBe("tangent");
      expect(res.intersections).toBe(1);
    });

    it("a > 1 时产生相交，不等式不恒成立", () => {
      const res = solveParamExpAx1(1.5);
      expect(res.status).toBe("intersect");
      expect(res.intersections).toBe(2);
    });

    it("a < 1 时直线在曲线下方，放缩恒成立", () => {
      const res = solveParamExpAx1(0.5);
      expect(res.status).toBe("above");
      expect(res.intersections).toBe(1);
    });
  });

  describe("solveParamExpAx (e^x >= ax 过原点模型)", () => {
    it("a = e 时为临界相切，切点在 (1, e)", () => {
      const res = solveParamExpAx(Math.E);
      expect(res.status).toBe("tangent");
      expect(res.intersections).toBe(1);
      expect(res.tangentX).toBe(1.0);
    });

    it("a > e 时割线穿过曲线，交于两点", () => {
      const res = solveParamExpAx(3.5);
      expect(res.status).toBe("intersect");
      expect(res.intersections).toBe(2);
    });

    it("a < e 时直线完全在下方，无交点", () => {
      const res = solveParamExpAx(2.0);
      expect(res.status).toBe("separated");
      expect(res.intersections).toBe(0);
    });
  });

  describe("sampleTangentDiff (差值采样)", () => {
    it("正确采样 e^x 与 x + 1 的非负差值 (e^x >= x + 1)", () => {
      const expFn = (x: number) => Math.exp(x);
      const lineFn = (x: number) => x + 1;
      const samples = sampleTangentDiff(expFn, lineFn, -2, 2, 20);

      expect(samples.length).toBe(21);
      for (const s of samples) {
        expect(s.diff).toBeGreaterThanOrEqual(-1e-6); // 恒 >= 0
      }
    });
  });
});
