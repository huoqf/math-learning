import { describe, it, expect } from "vitest";
import {
  getFirstDefData,
  getUnifiedDefData,
  solveThetaFromDrag,
} from "./conicDefinition";

describe("conicDefinition 数学求解与规范测试", () => {
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

    it("椭圆临界退化状态 (a = c)：退化为线段 F1F2", () => {
      const dataEq = getFirstDefData("ellipse", 2.0, 2.0, 2.0, 0.5);
      expect(dataEq.isDegenerate).toBe(true);
      expect(dataEq.degenerateReason).toContain("线段");
      expect(dataEq.points).toEqual([
        { x: -2, y: 0 },
        { x: 2, y: 0 },
      ]);
      // 动点在线段上，距离和依然等于 2a = 4
      const sum = dataEq.d1 + (dataEq.d2 ?? 0);
      expect(sum).toBeCloseTo(4.0, 3);
    });

    it("椭圆无轨迹状态 (a < c)：返回空轨迹并提示两边之和小于第三边", () => {
      const dataLess = getFirstDefData("ellipse", 1.5, 2.0, 2.0, 0.5);
      expect(dataLess.isDegenerate).toBe(true);
      expect(dataLess.points).toEqual([]);
      expect(dataLess.degenerateReason).toContain("不存在");
    });

    it("双曲线正常状态 (c > a > 0)：包含左右两支并满足 ||PF1| - |PF2|| = 2a", () => {
      const a = 2.0;
      const c = 3.0;
      const data = getFirstDefData("hyperbola", a, c, 2.0, 0.8);

      expect(data.isDegenerate).toBe(false);
      expect(data.branches?.length).toBe(2);

      // 距离差绝对值恒等于 2a = 4
      const diff = Math.abs(data.d1 - (data.d2 ?? 0));
      expect(diff).toBeCloseTo(2 * a, 2);
    });

    it("双曲线临界退化状态 (a = c)：退化为以 F1, F2 为端点向外延伸的两条射线", () => {
      const dataEq = getFirstDefData("hyperbola", 2.5, 2.5, 2.0, 0.8);
      expect(dataEq.isDegenerate).toBe(true);
      expect(dataEq.branches?.length).toBe(2);
      expect(dataEq.degenerateReason).toContain("射线");

      // 距离差绝对值恒等于 2a = 5
      const diff = Math.abs(dataEq.d1 - (dataEq.d2 ?? 0));
      expect(diff).toBeCloseTo(5.0, 3);
    });

    it("双曲线无轨迹状态 (a > c)：返回空分支并标记无轨迹", () => {
      const dataMore = getFirstDefData("hyperbola", 3.5, 2.5, 2.0, 0.8);
      expect(dataMore.isDegenerate).toBe(true);
      expect(dataMore.branches).toEqual([]);
      expect(dataMore.degenerateReason).toContain("无满足条件");
    });

    it("抛物线 (p > 0)：满足 |PF| = d_l = x + p/2", () => {
      const p = 2.0;
      const data = getFirstDefData("parabola", 3.0, 2.0, p, 1.2);

      expect(data.isDegenerate).toBe(false);
      expect(data.foci.f1).toEqual({ x: 1, y: 0 });
      expect(data.directrix).toEqual({ x: -1 });

      // 焦半径与准线距离严格相等
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

      // 双曲线 e = 1.5 (必须包含左右两支)
      const dataH = getUnifiedDefData(1.5, 2.0, 0.4);
      expect(dataH.branches?.length).toBe(2);
      expect(dataH.d1 / (dataH.dl ?? 1)).toBeCloseTo(1.5, 2);
    });
  });

  describe("精准反向拖拽解算 (solveThetaFromDrag) - 杜绝跨支瞬移", () => {
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

    it("双曲线右支拖拽：右上与右下均严格保留在右支半区，绝不跨支跳到左支", () => {
      const a = 2.0;
      const c = 3.0;
      const b = Math.sqrt(c * c - a * a);

      // 右支点 (x > 0)
      const ptRightUp = { x: 2.5, y: b * Math.sqrt((2.5 / a) ** 2 - 1) };
      const solvedThetaUp = solveThetaFromDrag(
        "firstDef",
        "hyperbola",
        ptRightUp,
        { a, c, e: 1.5, p: 2.0 },
      );
      // 必须小于 π，即严格判定为右支
      expect(solvedThetaUp).toBeLessThan(Math.PI);
      expect(solvedThetaUp).toBeGreaterThanOrEqual(0);

      // 正向带入验证动点 x 坐标必须依然为正 (在右支)
      const dataRecov = getFirstDefData("hyperbola", a, c, 2.0, solvedThetaUp);
      expect(dataRecov.pPoint.x).toBeGreaterThan(0);

      // 左支点 (x < 0)
      const ptLeftUp = { x: -2.5, y: b * Math.sqrt((2.5 / a) ** 2 - 1) };
      const solvedThetaLeft = solveThetaFromDrag(
        "firstDef",
        "hyperbola",
        ptLeftUp,
        { a, c, e: 1.5, p: 2.0 },
      );
      // 必须在 [π, 2π) 区间，即严格判定为左支
      expect(solvedThetaLeft).toBeGreaterThanOrEqual(Math.PI);
      const dataLeftRecov = getFirstDefData(
        "hyperbola",
        a,
        c,
        2.0,
        solvedThetaLeft,
      );
      expect(dataLeftRecov.pPoint.x).toBeLessThan(0);
    });
  });
});
