import { describe, it, expect } from "vitest";
import {
  getFirstDefData,
  getUnifiedDefData,
  getLocusGenData,
  solveThetaFromDrag,
} from "./conicDefinition";

describe("conicDefinition 数学求解与测试", () => {
  describe("第一定义求解 (getFirstDefData)", () => {
    it("椭圆正常状态 (a > c > 0)：满足 |PF1| + |PF2| = 2a", () => {
      const a = 3.0;
      const c = 2.0;
      const data = getFirstDefData("ellipse", a, c, 2.0, 0.8);

      expect(data.isDegenerate).toBe(false);
      expect(data.points.length).toBeGreaterThan(10);
      expect(data.foci.f1).toEqual({ x: -2, y: 0 });
      expect(data.foci.f2).toEqual({ x: 2, y: 0 });

      // 距离和恒等于 2a = 6
      const sum = data.d1 + (data.d2 ?? 0);
      expect(sum).toBeCloseTo(2 * a, 3);
    });

    it("椭圆退化状态 (a <= c)：标记 isDegenerate 并返回退化原因", () => {
      const dataEq = getFirstDefData("ellipse", 2.0, 2.0, 2.0, 0.5);
      expect(dataEq.isDegenerate).toBe(true);
      expect(dataEq.degenerateReason).toContain("退化为线段");

      const dataLess = getFirstDefData("ellipse", 1.5, 2.0, 2.0, 0.5);
      expect(dataLess.isDegenerate).toBe(true);
      expect(dataLess.degenerateReason).toContain("无轨迹");
    });

    it("双曲线正常状态 (c > a > 0)：满足 ||PF1| - |PF2|| = 2a", () => {
      const a = 2.0;
      const c = 3.0;
      const data = getFirstDefData("hyperbola", a, c, 2.0, 0.8);

      expect(data.isDegenerate).toBe(false);
      expect(data.branches?.length).toBe(2);

      // 距离差绝对值恒等于 2a = 4
      const diff = Math.abs(data.d1 - (data.d2 ?? 0));
      expect(diff).toBeCloseTo(2 * a, 2);
    });

    it("抛物线 (p > 0)：满足 |PF| = d_l = x + p/2", () => {
      const p = 2.0;
      const data = getFirstDefData("parabola", 3.0, 2.0, p, 1.2);

      expect(data.isDegenerate).toBe(false);
      expect(data.foci.f1).toEqual({ x: 1, y: 0 });
      expect(data.directrix).toEqual({ x: -1 });

      // 焦半径与准线距离相等
      expect(data.d1).toBeCloseTo(data.dl ?? 0, 3);
    });
  });

  describe("统一定义求解 (getUnifiedDefData)", () => {
    it("验证离心率比值恒等式 d_F / d_l ≡ e", () => {
      // 椭圆 e = 0.6
      const dataE = getUnifiedDefData(0.6, 2.0, 1.1);
      expect(dataE.d1 / (dataE.dl ?? 1)).toBeCloseTo(0.6, 2);

      // 抛物线 e = 1.0
      const dataP = getUnifiedDefData(1.0, 2.0, 0.5);
      expect(dataP.d1 / (dataP.dl ?? 1)).toBeCloseTo(1.0, 2);

      // 双曲线 e = 1.5
      const dataH = getUnifiedDefData(1.5, 2.0, 0.4);
      expect(dataH.d1 / (dataH.dl ?? 1)).toBeCloseTo(1.5, 2);
    });
  });

  describe("动圆切线几何生成法 (getLocusGenData)", () => {
    it("F2在定圆内 (c < a) 生成椭圆轨迹", () => {
      const a = 3.0;
      const c = 2.0;
      const data = getLocusGenData("ellipse", a, c, 1.2);

      expect(data.isDegenerate).toBe(false);
      expect(data.auxiliaryCircles?.length).toBe(2);
      expect(data.qPoint).toBeDefined();
      expect(data.nPoint).toBeDefined();
      expect(data.bisectorLine).toBeDefined();

      // 动圆圆心 M 满足 |MF1| + |MF2| = 2a
      const sum = data.d1 + (data.d2 ?? 0);
      expect(sum).toBeCloseTo(2 * a, 2);
    });
  });

  describe("精准反向拖拽解算 (solveThetaFromDrag)", () => {
    it("椭圆反向解算恢复离心角", () => {
      const a = 3.0;
      const c = 2.0;
      const b = Math.sqrt(a * a - c * c);
      const originalTheta = 1.2;
      const pt = {
        x: a * Math.cos(originalTheta),
        y: b * Math.sin(originalTheta),
      };

      const solvedTheta = solveThetaFromDrag("firstDef", "ellipse", pt, {
        a,
        c,
        e: 0.66,
        p: 2.0,
      });
      expect(solvedTheta).toBeCloseTo(originalTheta, 2);
    });
  });
});
