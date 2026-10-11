import { describe, it, expect } from "vitest";
import {
  boundsOf,
  unionBounds,
  expandBounds,
  boundsSize,
  boundsCenter,
  boundsCorners,
  boundingSphereOf,
  boundsAreFinite,
  requiredCameraDistance,
  DEFAULT_CAMERA_FOV_DEG,
} from "../sceneBounds";
import type { Vec3 } from "../vector3";

const p = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

describe("3D 场景包围盒 / 包围球纯数学层", () => {
  describe("boundsOf", () => {
    it("逐点求 min/max", () => {
      const b = boundsOf([p(0, 0, 0), p(3, -2, 5), p(-1, 4, 1)]);
      expect(b.min).toEqual({ x: -1, y: -2, z: 0 });
      expect(b.max).toEqual({ x: 3, y: 4, z: 5 });
    });

    it("空集退化为原点（不抛异常、不产生 Infinity）", () => {
      const b = boundsOf([]);
      expect(boundsAreFinite(b)).toBe(true);
      expect(b.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(b.max).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe("unionBounds / expandBounds", () => {
    it("并集覆盖两个盒子的全部范围", () => {
      const a = boundsOf([p(0, 0, 0), p(1, 1, 1)]);
      const b = boundsOf([p(-3, 2, -5), p(-2, 3, -4)]);
      const u = unionBounds(a, b);
      expect(u.min).toEqual({ x: -3, y: 0, z: -5 });
      expect(u.max).toEqual({ x: 1, y: 3, z: 1 });
    });

    it("数值外扩三轴同量，逐轴外扩只影响对应轴", () => {
      const b = boundsOf([p(0, 0, 0), p(2, 2, 2)]);
      expect(expandBounds(b, 0.5).min).toEqual({ x: -0.5, y: -0.5, z: -0.5 });
      expect(expandBounds(b, p(1, 2, 3)).max).toEqual({ x: 3, y: 4, z: 5 });
    });

    it("外扩后的盒子仍然包住原盒子", () => {
      const b = boundsOf([p(-1, 2, 3), p(4, 5, 6)]);
      const e = expandBounds(b, 0.7);
      expect(e.min.x).toBeLessThan(b.min.x);
      expect(e.max.z).toBeGreaterThan(b.max.z);
    });
  });

  describe("boundsSize / boundsCenter / boundsCorners", () => {
    it("尺寸与中心一致", () => {
      const b = boundsOf([p(0, 0, 0), p(4, 2, 6)]);
      expect(boundsSize(b)).toEqual({ x: 4, y: 2, z: 6 });
      expect(boundsCenter(b)).toEqual({ x: 2, y: 1, z: 3 });
    });

    it("角点恰好 8 个且都落在盒面上", () => {
      const b = boundsOf([p(-1, -1, -1), p(1, 1, 1)]);
      const corners = boundsCorners(b);
      expect(corners).toHaveLength(8);
      for (const c of corners) {
        expect(Math.abs(c.x)).toBe(1);
        expect(Math.abs(c.y)).toBe(1);
        expect(Math.abs(c.z)).toBe(1);
      }
      expect(new Set(corners.map((c) => `${c.x},${c.y},${c.z}`)).size).toBe(8);
    });
  });

  describe("boundingSphereOf", () => {
    it("半径取半对角线（刻意保守：只要球可见，盒内任意点必然可见）", () => {
      const b = boundsOf([p(0, 0, 0), p(2, 4, 4)]);
      const s = boundingSphereOf(b);
      expect(s.center).toEqual({ x: 1, y: 2, z: 2 });
      expect(s.radius).toBeCloseTo(0.5 * Math.hypot(2, 4, 4), 10);
    });

    it("退化盒（单点）半径为 0", () => {
      expect(boundingSphereOf(boundsOf([p(1, 1, 1)])).radius).toBe(0);
    });

    it("盒内任意点到球心距离都不超过半径", () => {
      const b = boundsOf([p(-2, 0.5, 3), p(1.5, 7, 9)]);
      const s = boundingSphereOf(b);
      for (const c of boundsCorners(b)) {
        const d = Math.hypot(
          c.x - s.center.x,
          c.y - s.center.y,
          c.z - s.center.z,
        );
        expect(d).toBeLessThanOrEqual(s.radius + 1e-9);
      }
    });
  });

  describe("requiredCameraDistance", () => {
    it("距离与半径成正比", () => {
      const view = { fovDeg: 45, aspect: 1 };
      const d1 = requiredCameraDistance(1, view);
      const d2 = requiredCameraDistance(3, view);
      expect(d2 / d1).toBeCloseTo(3, 10);
    });

    it("宽画布（aspect > 1）时竖直方向是瓶颈", () => {
      const d = requiredCameraDistance(2, { fovDeg: 45, aspect: 2 });
      const halfV = Math.tan((45 * Math.PI) / 360);
      expect(d).toBeCloseTo((2 / halfV) * 1.12, 10);
    });

    it("窄画布（aspect < 1）时水平方向接管，距离必须更大", () => {
      const wide = requiredCameraDistance(2, { fovDeg: 45, aspect: 1.6 });
      const narrow = requiredCameraDistance(2, { fovDeg: 45, aspect: 0.6 });
      expect(narrow).toBeGreaterThan(wide);
      const halfV = Math.tan((45 * Math.PI) / 360);
      expect(narrow).toBeCloseTo((2 / (halfV * 0.6)) * 1.12, 10);
    });

    it("margin 越大距离越远", () => {
      const base = requiredCameraDistance(2, { fovDeg: 45, aspect: 1 });
      const loose = requiredCameraDistance(2, {
        fovDeg: 45,
        aspect: 1,
        margin: 2,
      });
      expect(loose).toBeGreaterThan(base);
    });

    it("fov 越大所需距离越小（视角越广越省距离）", () => {
      const small = requiredCameraDistance(2, { fovDeg: 30, aspect: 1 });
      const large = requiredCameraDistance(2, { fovDeg: 90, aspect: 1 });
      expect(large).toBeLessThan(small);
    });

    it("非法输入一律返回 0（表示不做适配），绝不返回 NaN/Infinity", () => {
      expect(requiredCameraDistance(0, { fovDeg: 45, aspect: 1 })).toBe(0);
      expect(requiredCameraDistance(-1, { fovDeg: 45, aspect: 1 })).toBe(0);
      expect(requiredCameraDistance(NaN, { fovDeg: 45, aspect: 1 })).toBe(0);
      expect(requiredCameraDistance(Infinity, { fovDeg: 45, aspect: 1 })).toBe(
        0,
      );
      expect(requiredCameraDistance(2, { fovDeg: 0, aspect: 1 })).toBe(0);
      expect(requiredCameraDistance(2, { fovDeg: 180, aspect: 1 })).toBe(0);
      expect(requiredCameraDistance(2, { fovDeg: 200, aspect: 1 })).toBe(0);
    });

    it("非法 aspect 退化为 1 而不是产生 NaN", () => {
      const fallback = requiredCameraDistance(2, { fovDeg: 45, aspect: 1 });
      expect(requiredCameraDistance(2, { fovDeg: 45, aspect: 0 })).toBe(
        fallback,
      );
      expect(requiredCameraDistance(2, { fovDeg: 45, aspect: NaN })).toBe(
        fallback,
      );
    });

    it("默认 fov 与 ThreeDCanvas 保持一致（45°）", () => {
      expect(DEFAULT_CAMERA_FOV_DEG).toBe(45);
    });
  });
});
