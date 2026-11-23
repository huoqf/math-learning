import { describe, it, expect } from "vitest";
import {
  solvePerpLineLocus,
  solveConstDistCircle,
  solveConstAngleConic,
  classifyConicByTilt,
  checkPerpToBD1,
  getSolidDynamicLocusBounds,
} from "../solidDynamicLocus";
import { sub, norm } from "../vector3";

describe("solidDynamicLocus 纯数学解算", () => {
  it("模式1：体对角线 BD1 垂直截面 AB1C，且 P 在截面边界上满足 AP ⊥ BD1", () => {
    const a = 3;
    for (const t of [0, 0.2, 0.5, 0.8, 1]) {
      const res = solvePerpLineLocus(a, t);
      expect(checkPerpToBD1(a, res.footH)).toBeCloseTo(0, 6);
      expect(checkPerpToBD1(a, res.movingPointP)).toBeCloseTo(0, 6);
      expect(res.distBH).toBeCloseTo(Math.sqrt(3), 6);
      expect(res.perimeter).toBeCloseTo(9 * Math.SQRT2, 6);
      expect(res.area).toBeCloseTo((9 * Math.sqrt(3)) / 2, 6);
    }
  });

  it("模式2：底面定距圆弧满足 A1P = R 且落在底面第一象限边界内", () => {
    const a = 2;
    const rFactor = 1.25;
    const R = a * rFactor;
    const res = solveConstDistCircle(a, rFactor, 0.5);
    const expectedR = Math.sqrt(R * R - a * a);
    expect(res.circleRadius).toBeCloseTo(expectedR, 6);
    expect(res.arcLength).toBeCloseTo((Math.PI / 2) * expectedR, 6);
    // 校验 P 到 A1 的三维距离精确等于 R
    expect(norm(sub(res.movingPointP, res.vertices.A1))).toBeCloseTo(R, 6);
    expect(res.movingPointP.z).toBe(0);
    expect(res.movingPointP.x).toBeGreaterThanOrEqual(0);
    expect(res.movingPointP.y).toBeGreaterThanOrEqual(0);
  });

  it("模式3：截面倾角与半顶角 35° 准确划分圆 / 椭圆 / 抛物线 / 双曲线", () => {
    expect(classifyConicByTilt(0, 35).conicType).toBe("circle");
    expect(classifyConicByTilt(30, 35).conicType).toBe("ellipse");
    expect(classifyConicByTilt(55, 35).conicType).toBe("parabola");
    expect(classifyConicByTilt(75, 35).conicType).toBe("hyperbola");

    for (const tilt of [0, 30, 55, 75]) {
      const res = solveConstAngleConic(3, tilt, 0.4);
      expect(res.curveBranches.length).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(res.movingPointP.x)).toBe(true);
      expect(Number.isFinite(res.movingPointP.y)).toBe(true);
      expect(Number.isFinite(res.movingPointP.z)).toBe(true);
    }
  });

  it("包围盒输出有限数值", () => {
    const b1 = getSolidDynamicLocusBounds(3, "perpLineLocus");
    const b2 = getSolidDynamicLocusBounds(3, "constAngleConic");
    expect(b1.max.x).toBeGreaterThan(b1.min.x);
    expect(b2.max.z).toBeGreaterThan(b2.min.z);
  });
});
