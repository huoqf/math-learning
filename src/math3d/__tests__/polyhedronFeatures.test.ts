import { describe, it, expect } from "vitest";
import {
  calculatePrismFeatures,
  calculateRegularPyramidFeatures,
  calculateFrustumDerivation,
  calculateEqualVolumeMethod,
  frustumA1UpperBound,
  frustumApexGuide,
  frustumVertices,
  equalVolumeVertices,
  polyhedronSceneBounds,
  FRUSTUM_APEX_MAX_EXTEND,
} from "../polyhedronFeatures";
import { boundsAreFinite } from "../sceneBounds";
import {
  defaultParams as solidDefaultParams,
  polyhedronFeaturesMeta,
} from "@/data/registries/solidGeometry";

/** 参数域单一来源：registry 声明 */
const META = new Map(polyhedronFeaturesMeta.map((m) => [m.key, m]));
const bounds = (key: string) => {
  const m = META.get(key);
  if (!m) throw new Error(`参数 ${key} 未在 registry 登记`);
  return { min: m.min, max: m.max };
};

describe("多面体结构特征与台体体积推导数学层测试", () => {
  describe("棱柱与棱锥结构特征", () => {
    it("正四棱柱体积等于底面积乘高", () => {
      const prism = calculatePrismFeatures(4, 3, 5);
      expect(prism.baseArea).toBeCloseTo(9, 5);
      expect(prism.volume).toBeCloseTo(45, 5);
      expect(prism.lateralArea).toBeCloseTo(60, 5);
    });

    it("正四棱锥满足高与斜高勾股定理", () => {
      const pyramid = calculateRegularPyramidFeatures(6, 4);
      // a=6, r=3, h=4 => slantHeight = sqrt(4^2 + 3^2) = 5
      expect(pyramid.slantHeight).toBeCloseTo(5, 5);
      // R = 3*sqrt(2) => l = sqrt(16 + 18) = sqrt(34)
      expect(pyramid.sideEdgeLength).toBeCloseTo(Math.sqrt(34), 5);
      expect(pyramid.volume).toBeCloseTo((1 / 3) * 36 * 4, 5);
    });
  });

  describe("棱台体积推导：大锥减小锥与通用台体公式", () => {
    it("大锥减小锥与台体通用公式 100% 严格恒等", () => {
      const res = calculateFrustumDerivation(4, 2, 3);
      expect(res.diffError).toBeLessThan(1e-7);
      expect(res.frustumVolume).toBeCloseTo(res.formulaVolume, 5);
      // S2 = 16, S1 = 4, h = 3 => V = (1/3)*3*(4 + 8 + 16) = 28
      expect(res.formulaVolume).toBeCloseTo(28, 5);
    });

    it("a₁ 的动态上界在整个声明域上都严格小于 a₂（保证 k < 1、H 不发散）", () => {
      const a1Limits = bounds("a1");
      const a2Range = bounds("a2");
      for (let i = 0; i <= 20; i++) {
        const a2 = a2Range.min + ((a2Range.max - a2Range.min) * i) / 20;
        const cap = frustumA1UpperBound(a2, a1Limits);
        expect(cap).toBeLessThan(a2);
        expect(cap).toBeGreaterThanOrEqual(a1Limits.min);
        expect(cap).toBeLessThanOrEqual(a1Limits.max);
        // 上界本身也必须给出可用的相似比与有限的 H
        const res = calculateFrustumDerivation(a2, cap, 3);
        expect(res.k).toBeLessThan(1);
        expect(Number.isFinite(res.bigHeight)).toBe(true);
        expect(res.bigHeight).toBeGreaterThan(0);
      }
    });

    it("静态声明域确实允许 a₁ ≥ a₂（这正是必须引入动态上界的原因）", () => {
      const a1Limits = bounds("a1");
      const a2Limits = bounds("a2");
      expect(a1Limits.max).toBeGreaterThanOrEqual(a2Limits.min);
    });

    it("动态上界对非法 a₂ 退化为声明域上界，不产生 NaN", () => {
      const a1Limits = bounds("a1");
      expect(Number.isFinite(frustumA1UpperBound(NaN, a1Limits))).toBe(true);
      expect(frustumA1UpperBound(NaN, a1Limits)).toBeLessThanOrEqual(
        a1Limits.max,
      );
    });

    it("k = a₁/a₂ 与高之比自洽：H 由 H = h/(1−k) 给出", () => {
      const res = calculateFrustumDerivation(5, 3, 4);
      expect(res.k).toBeCloseTo(0.6, 6);
      expect(res.bigHeight).toBeCloseTo(4 / 0.4, 5);
    });
  });

  describe("棱台补形延长线（frustumApexGuide）", () => {
    it("未截断时端点重合于真实原锥顶点", () => {
      const g = frustumApexGuide(4, 1, 3);
      expect(g.isTruncated).toBe(false);
      expect(g.drawnHeight).toBeCloseTo(g.trueHeight, 9);
      for (const e of g.endpoints) {
        expect(e.x).toBeCloseTo(g.trueApex.x, 9);
        expect(e.y).toBeCloseTo(g.trueApex.y, 9);
        expect(e.z).toBeCloseTo(g.trueApex.z, 9);
      }
    });

    it("截断时延长量有固定上界（与 h 无关），且端点严格共线在侧棱延长线上", () => {
      const a2 = 5;
      const a1 = 4.5;
      for (const h of [1, 3, 6]) {
        const g = frustumApexGuide(a2, a1, h);
        expect(g.isTruncated).toBe(true);
        expect(g.drawnHeight).toBeCloseTo(h + FRUSTUM_APEX_MAX_EXTEND, 9);
        const { bottom } = frustumVertices(a2, a1, h);
        const t = g.drawnHeight / g.trueHeight;
        g.endpoints.forEach((e, i) => {
          const b = bottom[i];
          expect(e.x).toBeCloseTo(b.x + (g.trueApex.x - b.x) * t, 9);
          expect(e.y).toBeCloseTo(b.y + (g.trueApex.y - b.y) * t, 9);
          expect(e.z).toBeCloseTo(b.z + (g.trueApex.z - b.z) * t, 9);
        });
      }
    });

    it("截断判据与相似比无关：只要 t < 1 就必须截断，且绘制高度单调不超真实高度", () => {
      const cases: [number, number, number][] = [
        [4, 2, 3],
        [5, 4.5, 6],
        [5, 1, 1],
        [2.5, 2, 5],
      ];
      for (const [a2, a1, h] of cases) {
        const g = frustumApexGuide(a2, a1, h);
        expect(g.drawnHeight).toBeLessThanOrEqual(g.trueHeight + 1e-9);
        expect(g.isTruncated).toBe(g.drawnHeight < g.trueHeight - 1e-9);
      }
    });

    it("全声明域扫描：绘制几何包围盒有限且包含所有绘制顶点", () => {
      const aRange = bounds("a");
      const bRange = bounds("b");
      const hRange = bounds("h");
      const a1Range = bounds("a1");
      const a2Range = bounds("a2");
      const modes = ["prism", "pyramid", "frustum", "equalVolume"] as const;
      for (const mode of modes) {
        for (const h of [hRange.min, hRange.max]) {
          const p = {
            a: aRange.max,
            b: bRange.max,
            h,
            a1: a1Range.max,
            a2: a2Range.max,
          };
          const bb = polyhedronSceneBounds(mode, p);
          expect(boundsAreFinite(bb)).toBe(true);
          expect(bb.max.z).toBeGreaterThanOrEqual(bb.min.z);
          expect(bb.max.x).toBeGreaterThanOrEqual(bb.min.x);
          expect(bb.max.y).toBeGreaterThanOrEqual(bb.min.y);
        }
      }
    });

    it("棱台绘制几何的顶点与被包围盒共享同一来源（不出现两套尺寸）", () => {
      const { bottom, top } = frustumVertices(4, 2, 3);
      expect(bottom).toHaveLength(4);
      expect(top).toHaveLength(4);
      const bb = polyhedronSceneBounds("frustum", {
        ...solidDefaultParams.polyhedronFeatures,
        a2: 4,
        a1: 2,
        h: 3,
      });
      for (const v of [...bottom, ...top]) {
        expect(v.x).toBeGreaterThanOrEqual(bb.min.x - 1e-9);
        expect(v.x).toBeLessThanOrEqual(bb.max.x + 1e-9);
        expect(v.z).toBeLessThanOrEqual(bb.max.z + 1e-9);
      }
    });

    it("等体积法的四个顶点与计算结果自洽", () => {
      const res = calculateEqualVolumeMethod(3, 4, 5);
      const v = equalVolumeVertices(res);
      expect(v.A).toEqual({ x: 0, y: 0, z: 0 });
      expect(v.P.z).toBeCloseTo(res.h, 9);
      expect(v.B.x).toBeCloseTo(res.a, 9);
      expect(v.C.y).toBeCloseTo(res.b, 9);
    });
  });

  describe("三棱锥等体积法求点面距", () => {
    it("等体积法反解高线与几何垂线长度一致", () => {
      const res = calculateEqualVolumeMethod(3, 4, 5);
      expect(res.error).toBeLessThan(1e-7);
      expect(res.distBToPAC).toBeCloseTo(3, 5);
    });
  });
});
