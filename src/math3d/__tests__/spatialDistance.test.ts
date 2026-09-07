import { describe, it, expect } from "vitest";
import {
  solveSkewLinesDistance,
  solveSideEdgeAndFaceDiagonalDistance,
  solvePointPlaneDistance,
} from "../spatialDistance";
import { dot, sub } from "../vector3";

describe("空间距离与异面直线公垂线数学层算法测试", () => {
  describe("面对角线异面直线公垂线模型 (A1B 与 AC)", () => {
    it("在正方体 a=b=c=3 时满足高考理论解析解", () => {
      const a = 3;
      const b = 3;
      const c = 3;
      // 传入任意 lambda, mu
      const res = solveSkewLinesDistance(a, b, c, 0.5, 0.5);

      // 理论最短距离 d = a / sqrt(3) = 3 / sqrt(3) = sqrt(3) ≈ 1.73205
      expect(res.minDist).toBeCloseTo(Math.sqrt(3), 5);

      // 极值点参数: lambda* = 2/3, mu* = 1/3
      expect(res.optimalLambda).toBeCloseTo(2 / 3, 5);
      expect(res.optimalMu).toBeCloseTo(1 / 3, 5);

      // 验证公垂足连线向量与两直线方向向量严格正交
      const vecH1H2 = sub(res.footH2, res.footH1);
      const u = { x: a, y: 0, z: -c }; // A1B
      const v = { x: a, y: b, z: 0 }; // AC

      expect(Math.abs(dot(vecH1H2, u))).toBeLessThan(1e-7);
      expect(Math.abs(dot(vecH1H2, v))).toBeLessThan(1e-7);
    });

    it("当动点到达理论极值位置时 isAtPerpendicular 触发", () => {
      const resOptimal = solveSkewLinesDistance(3, 3, 3, 2 / 3, 1 / 3);
      expect(resOptimal.isAtPerpendicular).toBe(true);
      expect(resOptimal.distPQ).toBeCloseTo(resOptimal.minDist, 4);
      expect(resOptimal.distDelta).toBeCloseTo(0, 4);
    });

    it("平行转化平面的三点满足外积向量正交性", () => {
      const res = solveSkewLinesDistance(3, 2, 4, 0.5, 0.5);
      const [A, C, D1] = res.parallelPlaneVertices;
      const vecAC = sub(C, A);
      const vecAD1 = sub(D1, A);

      // 法向量与两边正交
      expect(Math.abs(dot(vecAC, res.nUnit))).toBeLessThan(1e-7);
      expect(Math.abs(dot(vecAD1, res.nUnit))).toBeLessThan(1e-7);
    });
    it("验证公垂线正交基底分解模方恒等式 |PQ|² = d_min² + ||Δλ u - Δμ v||²", () => {
      const a = 3;
      const b = 2;
      const c = 2.5;
      const lambda = 0.8;
      const mu = 0.2;
      const res = solveSkewLinesDistance(a, b, c, lambda, mu);

      const dMin = res.minDist;
      const dMinSq = dMin * dMin;
      const dL = lambda - res.optimalLambda;
      const dM = mu - res.optimalMu;

      const { uSq, vSq, dotUV } = res.quadraticFormula.orthogonalDecomp;
      const perpDecompSq =
        dMinSq + uSq * dL * dL + vSq * dM * dM - 2 * dotUV * dL * dM;

      expect(res.distPQ * res.distPQ).toBeCloseTo(perpDecompSq, 5);
      expect(res.distPQ).toBeGreaterThanOrEqual(dMin - 1e-7);
    });
  });

  describe("侧棱与底面对角线公垂线模型 (BB1 与 AC)", () => {
    it("在 a=4, b=3, c=5 时满足勾股定理公垂距离", () => {
      const a = 4;
      const b = 3;
      const c = 5;
      const res = solveSideEdgeAndFaceDiagonalDistance(a, b, c, 0, 0.64);

      // 最短距离 = 4*3 / 5 = 2.4
      expect(res.minDist).toBeCloseTo(2.4, 5);
      expect(res.optimalLambda).toBe(0);
      expect(res.optimalMu).toBeCloseTo(16 / 25, 5); // 4^2 / (4^2 + 3^2) = 16/25 = 0.64
      expect(res.isAtPerpendicular).toBe(true);
    });

    it("侧棱与底面对角线垂直 (dotUV=0)，满足两独立单项配方恒等式", () => {
      const a = 4;
      const b = 3;
      const c = 5;
      const lambda = 0.5;
      const mu = 0.3;
      const res = solveSideEdgeAndFaceDiagonalDistance(a, b, c, lambda, mu);

      const { uSq, vSq, dotUV } = res.quadraticFormula.orthogonalDecomp;
      expect(dotUV).toBe(0);

      const dMinSq = res.minDist * res.minDist;
      const dL = lambda - res.optimalLambda;
      const dM = mu - res.optimalMu;
      const independentSq = dMinSq + uSq * dL * dL + vSq * dM * dM;

      expect(res.distPQ * res.distPQ).toBeCloseTo(independentSq, 5);
    });
  });

  describe("点到平面距离与等体积法对账", () => {
    it("向量射影法与等体积法反解高线 100% 严格吻合", () => {
      const a = 3;
      const b = 2;
      const c = 4;
      const lambda = 0.6;
      const res = solvePointPlaneDistance(a, b, c, lambda);

      expect(res.volumeCheckError).toBeLessThan(1e-7);
      expect(res.volume).toBeGreaterThan(0);
      expect(res.volume).toBeLessThanOrEqual(res.maxVolume);
      expect(res.distance).toBeGreaterThan(0);
    });

    it("当 lambda=1 时体积达到理论最大值", () => {
      const a = 3;
      const b = 2;
      const c = 4;
      const resMax = solvePointPlaneDistance(a, b, c, 1.0);
      expect(resMax.volume).toBeCloseTo(resMax.maxVolume, 5);
      expect(resMax.volume).toBeCloseTo((1 / 6) * a * b * c, 5);
    });
  });
});
