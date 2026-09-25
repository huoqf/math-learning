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

      expect(fine.surfaceAreaError).toBeLessThan(coarse.surfaceAreaError);
      expect(fine.volumeError).toBeLessThan(coarse.volumeError);
      expect(fine.surfaceAreaError).toBeLessThan(0.05); // 细网格误差小于 5%
    });

    it("采样微锥体高恒为球半径 R 且体积满足 (1/3)*ΔS*R", () => {
      const R = 2.0;
      const res = calculateSphereMicroPyramids(R, 12);
      expect(res.samplePyramid.height).toBe(R);
      expect(res.samplePyramid.pyramidVolume).toBeCloseTo(
        (1 / 3) * res.samplePyramid.baseArea * R,
        6,
      );
    });
  });
});
