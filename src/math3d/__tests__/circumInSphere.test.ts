import { describe, it, expect } from "vitest";
import {
  calculateCuboidSphere,
  calculatePyramidSphere,
  calculatePrismSphere,
  calculateConeSphere,
  calculateCylinderSphere,
} from "../circumInSphere";

describe("circumInSphere 切接球数学模型测试", () => {
  describe("1. 长方体切接球", () => {
    it("外接球 3-4-12 模型应满足 2R = 13", () => {
      const res = calculateCuboidSphere(3, 4, 12, "circum");
      expect(res.radius).toBeCloseTo(6.5, 5);
      expect(res.center).toEqual({ x: 1.5, y: 2, z: 6 });
      expect(res.solidVolume).toBe(144);
    });

    it("正方体 a=4 内切球应满足 r = 2", () => {
      const res = calculateCuboidSphere(4, 4, 4, "inscribed");
      expect(res.radius).toBe(2);
      expect(res.center).toEqual({ x: 2, y: 2, z: 2 });
    });
  });

  describe("2. 正四棱锥切接球", () => {
    it("外接球底边 a=2, 高 h=2 应满足 (h-R)^2 + (a/√2)^2 = R^2", () => {
      const res = calculatePyramidSphere(2, 2, "circum");
      // rBase = 2/√2 = √2, rBase^2 = 2. R = (2 + 4) / 4 = 1.5
      expect(res.radius).toBeCloseTo(1.5, 5);
      expect(res.center.z).toBeCloseTo(0.5, 5);
    });

    it("内切球满足等体积法 r = 3V / S表", () => {
      const res = calculatePyramidSphere(4, 3, "inscribed");
      // hs = sqrt(9 + 4) = sqrt(13)
      // V = 1/3 * 16 * 3 = 16
      // S = 16 + 2*4*sqrt(13) = 16 + 8*sqrt(13)
      // r = 4*3 / (4 + 2*sqrt(13)) = 12 / (4 + 2*sqrt(13))
      const expectedR = 12 / (4 + 2 * Math.sqrt(13));
      expect(res.radius).toBeCloseTo(expectedR, 5);
    });
  });

  describe("3. 直三棱柱切接球", () => {
    it("底面 3-4-5 直角三角形，高 12，外接球 2R = 13", () => {
      const res = calculatePrismSphere(3, 4, 12, "circum");
      // rBase = 5/2 = 2.5. R^2 = 2.5^2 + 6^2 = 6.25 + 36 = 42.25 => R = 6.5
      expect(res.radius).toBeCloseTo(6.5, 5);
    });

    it("内切球半径受限于底面内切圆与高的一半", () => {
      const res = calculatePrismSphere(3, 4, 4, "inscribed");
      // rBaseIn = (3 + 4 - 5)/2 = 1. h/2 = 2. r = min(1, 2) = 1
      expect(res.radius).toBe(1);
    });
  });

  describe("4. 圆锥切接球", () => {
    it("底面 r=3, 高 h=4, 母线 l=5, 外接球 R = l^2/(2h) = 25/8 = 3.125", () => {
      const res = calculateConeSphere(3, 4, "circum");
      expect(res.radius).toBeCloseTo(3.125, 5);
    });

    it("底面 r=3, 高 h=4, 内切球 rIn = r*h / (r + l) = 12 / 8 = 1.5", () => {
      const res = calculateConeSphere(3, 4, "inscribed");
      expect(res.radius).toBeCloseTo(1.5, 5);
    });
  });

  describe("5. 圆柱切接球", () => {
    it("底面 r=3, 高 h=8, 外接球 R = sqrt(9 + 16) = 5", () => {
      const res = calculateCylinderSphere(3, 8, "circum");
      expect(res.radius).toBeCloseTo(5, 5);
    });

    it("底面 r=3, 高 h=4, 内切球 r = min(3, 2) = 2", () => {
      const res = calculateCylinderSphere(3, 4, "inscribed");
      expect(res.radius).toBe(2);
    });
  });
});
