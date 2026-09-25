import { describe, it, expect } from "vitest";
import {
  calculatePrismTripartition,
  calculateYangmaBienao,
} from "../pyramidDerivation";

describe("pyramidDerivation 数学纯计算层", () => {
  describe("1. 三棱柱三等分法 (Prism Tripartition)", () => {
    it("三棱柱体积严格等于底面积乘以高，且三个三棱锥体积严格三分之一恒等", () => {
      const a = 3;
      const b = 4;
      const h = 5;
      const res = calculatePrismTripartition(a, b, h);

      expect(res.baseArea).toBe(6);
      expect(res.prismVolume).toBe(30);
      expect(res.pyramidVolume).toBe(10);
      expect(res.parts).toHaveLength(3);

      const sumPartVolumes = res.parts.reduce((sum, p) => sum + p.volume, 0);
      expect(sumPartVolumes).toBeCloseTo(res.prismVolume, 6);

      res.parts.forEach((part) => {
        expect(part.volume).toBeCloseTo(res.prismVolume / 3, 6);
        expect(part.volumeRatio).toBeCloseTo(1 / 3, 6);
      });
    });

    it("各三棱锥爆炸方向单位向量长度严格归一化 (len = 1)", () => {
      const res = calculatePrismTripartition(2, 3, 4);
      res.parts.forEach((part) => {
        const { x, y, z } = part.explodeOffset;
        const len = Math.sqrt(x * x + y * y + z * z);
        expect(len).toBeCloseTo(1, 4);
      });
    });

    it("几何参数下界防御与鲁棒性", () => {
      const res = calculatePrismTripartition(0.01, -1, 0);
      expect(res.a).toBeGreaterThanOrEqual(0.5);
      expect(res.b).toBeGreaterThanOrEqual(0.5);
      expect(res.h).toBeGreaterThanOrEqual(0.5);
      expect(res.prismVolume).toBeGreaterThan(0);
    });
  });

  describe("2. 刘徽割体术 (堑堵剖分阳马与鳖臑)", () => {
    it("直角三棱柱（堑堵）剖分为 1 阳马 + 1 鳖臑，体积和严格等于堑堵且体积比为 2:1", () => {
      const a = 2;
      const b = 3;
      const c = 4;
      const res = calculateYangmaBienao(a, b, c);

      expect(res.cuboidVolume).toBe(24);
      expect(res.qianduVolume).toBe(12);
      expect(res.yangmaVolume).toBe(8);
      expect(res.bienaoVolume).toBe(4);
      expect(res.parts).toHaveLength(2);

      const sumVolumes = res.parts.reduce((acc, p) => acc + p.volume, 0);
      expect(sumVolumes).toBeCloseTo(res.qianduVolume, 6);

      const yangma = res.parts.find((p) => p.id === "part-yangma")!;
      const bienao = res.parts.find((p) => p.id === "part-bienao")!;

      expect(yangma.volume).toBeCloseTo((1 / 3) * 24, 6);
      expect(bienao.volume).toBeCloseTo((1 / 6) * 24, 6);
      expect(yangma.volume / bienao.volume).toBeCloseTo(2, 6);
      expect(yangma.volumeRatio).toBeCloseTo(2 / 3, 6);
      expect(bienao.volumeRatio).toBeCloseTo(1 / 3, 6);
    });

    it("爆炸偏移量模长归一化", () => {
      const res = calculateYangmaBienao(3, 4, 5);
      res.parts.forEach((p) => {
        const { x, y, z } = p.explodeOffset;
        const len = Math.sqrt(x * x + y * y + z * z);
        expect(len).toBeCloseTo(1, 4);
      });
    });
  });
});
