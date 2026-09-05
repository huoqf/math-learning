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

    it("几何不变量测试：四面体所有 4 个顶点 A, B, C, P 到球心 O 的距离严格等于 R", () => {
      // 任意选取一组典型参数
      const testCases = [
        { r1: 3, r2: 3.5, c: 3 },
        { r1: 2.5, r2: 3, c: 3 },
        { r1: 4, r2: 4, c: 5 },
      ];

      for (const { r1, r2, c } of testCases) {
        const res = calculatePerpPlanesSphere(r1, r2, c);
        const { A, B, C, P } = res.vertices;
        const O = res.center;
        const R = res.radius;

        const dist = (v: typeof A) =>
          Math.hypot(v.x - O.x, v.y - O.y, v.z - O.z);

        expect(dist(A)).toBeCloseTo(R, 5);
        expect(dist(B)).toBeCloseTo(R, 5);
        expect(dist(C)).toBeCloseTo(R, 5);
        expect(dist(P)).toBeCloseTo(R, 5);
      }
    });

    it("空间正交性测试：底面 ABC (Z=0) 与 侧面 PAC (Y=0) 严格垂直于交线 AC (X轴)", () => {
      const res = calculatePerpPlanesSphere(3, 3.5, 3);
      const { A, C, B, P } = res.vertices;

      // AC 在 X 轴上：Y=0, Z=0
      expect(A.y).toBeCloseTo(0, 5);
      expect(A.z).toBeCloseTo(0, 5);
      expect(C.y).toBeCloseTo(0, 5);
      expect(C.z).toBeCloseTo(0, 5);

      // B 在底面 XY 平面：Z=0
      expect(B.z).toBeCloseTo(0, 5);
      // P 在侧面 XZ 平面：Y=0
      expect(P.y).toBeCloseTo(0, 5);

      // 垂足 H 位于 AC 中点 (0, 0, 0)
      expect(res.H.x).toBeCloseTo(0, 5);
      expect(res.H.y).toBeCloseTo(0, 5);
      expect(res.H.z).toBeCloseTo(0, 5);
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
