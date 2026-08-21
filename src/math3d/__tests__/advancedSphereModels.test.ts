import { describe, it, expect } from "vitest";
import {
  calculatePerpPlanesSphere,
  calculateConcentricSpheres,
  calculateTruncatedConeSphere,
  calculateSphereExtrema,
} from "../advancedSphereModels";

describe("advancedSphereModels 进阶切接球数学纯函数测试", () => {
  describe("1. 面面垂直双外心模型", () => {
    it("当 r1=3, r2=4, c=2 时，球半径满足 R^2 = r1^2 + r2^2 - (c/2)^2", () => {
      const res = calculatePerpPlanesSphere(3, 4, 2);
      // R^2 = 9 + 16 - 1 = 24 => R = sqrt(24) ≈ 4.89898
      expect(res.radius).toBeCloseTo(Math.sqrt(24), 4);
      expect(res.center.x).toBe(0);
      expect(res.center.y).toBeCloseTo(Math.sqrt(9 - 1), 4);
      expect(res.center.z).toBeCloseTo(Math.sqrt(16 - 1), 4);
    });

    it("交线长度超限保护", () => {
      const res = calculatePerpPlanesSphere(2, 2, 10);
      expect(res.radius).toBeGreaterThan(0);
    });
  });

  describe("2. 正四面体三球同心对比模型", () => {
    it("当 a=4 时，三半径满足 r : r_edge : R = 1 : sqrt(3) : 3", () => {
      const res = calculateConcentricSpheres(4);
      const { inRadius, edgeRadius, circumRadius } = res;

      expect(inRadius).toBeCloseTo((Math.sqrt(6) / 12) * 4, 4);
      expect(edgeRadius).toBeCloseTo((Math.sqrt(2) / 4) * 4, 4);
      expect(circumRadius).toBeCloseTo((Math.sqrt(6) / 4) * 4, 4);

      expect(edgeRadius / inRadius).toBeCloseTo(Math.sqrt(3), 4);
      expect(circumRadius / inRadius).toBeCloseTo(3, 4);
    });

    it("6 个棱切点与 4 个面切点准确计算", () => {
      const res = calculateConcentricSpheres(4);
      expect(res.edgeTangents).toHaveLength(6);
      expect(res.faceTangents).toHaveLength(4);
    });
  });

  describe("3. 圆台切接球与临界模型", () => {
    it("圆台外接球半径正确计算", () => {
      const res = calculateTruncatedConeSphere(1, 2, 2);
      // d = (4 + 1 - 4) / (2 * 2) = 1/4 = 0.25
      // R = sqrt(4 + 0.25^2) = sqrt(4.0625) ≈ 2.01556
      expect(res.circumRadius).toBeCloseTo(Math.sqrt(4.0625), 4);
      expect(res.centerOffsetBottom).toBeCloseTo(0.25, 4);
    });

    it("当 h = 2*sqrt(r1*r2) 时存在内切球", () => {
      const r1 = 1;
      const r2 = 4;
      const idealH = 2 * Math.sqrt(r1 * r2); // 4
      const res = calculateTruncatedConeSphere(r1, r2, idealH);
      expect(res.hasInSphere).toBe(true);
      expect(res.inRadius).toBeCloseTo(2, 4);
    });
  });

  describe("4. 球内接几何体体积极值模型", () => {
    it("球内接圆柱体积极值点在 h = 2*sqrt(3)/3 * R", () => {
      const R = 3;
      const optH = ((2 * Math.sqrt(3)) / 3) * R; // 2 * sqrt(3) ≈ 3.464
      const res = calculateSphereExtrema(R, 0, optH);
      expect(res.optimalH).toBeCloseTo(optH, 4);
      expect(res.maxRatio).toBeCloseTo(1 / Math.sqrt(3), 4);
    });

    it("球内接圆锥体积极值点在 h = 4/3 * R", () => {
      const R = 3;
      const optH = (4 / 3) * R; // 4
      const res = calculateSphereExtrema(R, 1, optH);
      expect(res.optimalH).toBeCloseTo(optH, 4);
      expect(res.maxRatio).toBeCloseTo(8 / 27, 4);
    });
  });
});
