import { describe, it, expect } from "vitest";
import {
  calculateZuxuanSection,
  calculateSphereMicroPyramids,
} from "../sphereDerivation";

describe("sphereDerivation", () => {
  describe("calculateZuxuanSection", () => {
    it("在任意高度 h，半球截面积恒等于挖锥圆柱截面积", () => {
      const R = 2.5;
      const heights = [0, 0.5, 1.25, 2.0, 2.5];

      for (const h of heights) {
        const res = calculateZuxuanSection(R, h);
        expect(res.isAreaEqual).toBe(true);
        expect(res.areaDifference).toBeLessThan(1e-6);
        expect(res.hemisphereCutArea).toBeCloseTo(Math.PI * (R * R - h * h), 5);
        expect(res.cylinderCutArea).toBeCloseTo(Math.PI * (R * R - h * h), 5);
      }
    });

    it("正确计算各实体体积比例", () => {
      const R = 3;
      const res = calculateZuxuanSection(R, 1.5);
      expect(res.cylinderVolume).toBeCloseTo(Math.PI * 27, 4);
      expect(res.invertedConeVolume).toBeCloseTo(9 * Math.PI, 4);
      expect(res.hollowCylinderVolume).toBeCloseTo(18 * Math.PI, 4);
      expect(res.hemisphereVolume).toBeCloseTo(18 * Math.PI, 4);
      expect(res.sphereVolume).toBeCloseTo(36 * Math.PI, 4);
    });
  });

  describe("calculateSphereMicroPyramids", () => {
    it("微元分割网格随着细分数增加，表面积和体积误差逼近于 0", () => {
      const R = 2.0;
      const coarse = calculateSphereMicroPyramids(R, 8);
      const fine = calculateSphereMicroPyramids(R, 24);

      const relErr = (approximate: number, exact: number) =>
        Math.abs(approximate - exact) / exact;

      expect(fine.surfaceAreaError).toBeLessThan(coarse.surfaceAreaError);
      // 体积误差由 ∑ΔV 与 (4/3)πR³ 直接算出（不再读已删除的 volumeError 字段）
      expect(relErr(fine.approximateVolume, fine.exactVolume)).toBeLessThan(
        relErr(coarse.approximateVolume, coarse.exactVolume),
      );
      // ∑ΔV = (1/3)R·∑ΔS ⇒ 体积相对误差率与 surfaceAreaError 恒等，此处显式钉住该恒等式
      expect(relErr(fine.approximateVolume, fine.exactVolume)).toBeCloseTo(
        fine.surfaceAreaError,
        12,
      );
      expect(fine.surfaceAreaError).toBeLessThan(0.05); // 细网格误差小于 5%
    });

    it("采样微锥高是**真实几何高**：严格小于 R，且随细分加密单调趋于 R", () => {
      const R = 2.0;
      const coarse = calculateSphereMicroPyramids(R, 8).samplePyramid;
      const fine = calculateSphereMicroPyramids(R, 32).samplePyramid;

      // 真实几何高 = 球心到弦面的距离 ⇒ 恒小于 R（教材"h_i ≈ R"正是这一步近似）
      expect(coarse.height).toBeLessThan(R);
      expect(fine.height).toBeLessThan(R);
      // 细分加密 ⇒ 单元变小 ⇒ 单调趋于 R
      expect(fine.height).toBeGreaterThan(coarse.height);
      expect(fine.height).toBeGreaterThan(0.99 * R);

      // 体积仍走教材模型 ΔV = (1/3)·R·ΔS（「h_i ≈ R」那一步），故**不满足** (1/3)·ΔS·h_i。
      // 这条负断言是刻意的：防止日后"顺手"把 R 改成 height 而静默破坏
      // ∑ΔV = (1/3)R∑ΔS 与"体积误差率 ≡ 表面积误差率"的恒等式。
      expect(fine.pyramidVolume).toBeCloseTo((1 / 3) * fine.baseArea * R, 12);
      expect(
        Math.abs(fine.pyramidVolume - (1 / 3) * fine.baseArea * fine.height),
      ).toBeGreaterThan(1e-6);
    });

    it("采样单元的 4 个球面顶点落在球面上，且与声明的格号、真实几何高自洽", () => {
      const R = 2.0;
      const { samplePyramid } = calculateSphereMicroPyramids(R, 16);
      const { cell } = samplePyramid;

      expect(cell.vertices).toHaveLength(4);
      cell.vertices.forEach((v) => {
        // z 轴向上球坐标：极角自 +z 量起 ⇒ 顶点必在半径 R 的球面上
        expect(Math.hypot(v[0], v[1], v[2])).toBeCloseTo(R, 12);
      });

      const dPhi = Math.PI / cell.latSteps;
      const dTheta = (Math.PI * 2) / cell.lonSteps;
      expect(cell.phiCenter).toBeCloseTo((cell.latIdx + 0.5) * dPhi, 12);
      expect(cell.thetaCenter).toBeCloseTo((cell.lonIdx + 0.5) * dTheta, 12);

      // 4 顶点确实落在该格的 4 个角上（两两配对覆盖 φ 的上下边界）
      const phis = cell.vertices.map((v) => Math.acos(v[2] / R));
      expect(Math.min(...phis)).toBeCloseTo(cell.phiCenter - dPhi / 2, 10);
      expect(Math.max(...phis)).toBeCloseTo(cell.phiCenter + dPhi / 2, 10);

      // 真实几何高 = 底面质心到球心的距离
      expect(Math.hypot(...samplePyramid.center)).toBeCloseTo(
        samplePyramid.height,
        12,
      );
    });
  });
});
