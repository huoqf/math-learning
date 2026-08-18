import { describe, it, expect } from "vitest";
import {
  cylinderProfile,
  coneProfile,
  frustumProfile,
  sphereProfile,
  sampleCurveProfile,
  rimRadiusAtZ,
  radiusAtZ,
  calculateSphereCut,
  calculateUnfoldParams,
} from "./rotationProfiles";

describe("rotationProfiles", () => {
  it("圆柱母线首尾闭合且半径恒定", () => {
    const p = cylinderProfile(2, 5);
    expect(p[1].r).toBe(2);
    expect(p[2].r).toBe(2);
    expect(p[2].z).toBe(5);
    expect(p[0].r).toBe(0);
    expect(p[3].r).toBe(0);
  });

  it("圆锥母线顶点半径为 0", () => {
    const p = coneProfile(3, 4);
    expect(p[0].r).toBe(0);
    expect(p[1].r).toBe(3);
    expect(p[p.length - 1].r).toBe(0);
    expect(p[p.length - 1].z).toBe(4);
  });

  it("圆台母线上下底半径正确", () => {
    const p = frustumProfile(2, 1, 3);
    expect(p[1].r).toBe(2);
    expect(p[2].r).toBe(1);
    expect(p[2].z).toBe(3);
  });

  it("半圆母线的两端点半径均为 0（对应球的上下极点）", () => {
    const p = sphereProfile(2, 16);
    expect(p[0].r).toBeCloseTo(0, 5);
    expect(p[p.length - 1].r).toBeCloseTo(0, 5);
  });

  it("半圆母线中点半径等于球半径", () => {
    const p = sphereProfile(3, 32);
    const mid = p[Math.floor(p.length / 2)];
    expect(mid.r).toBeCloseTo(3, 5);
  });

  it("通用曲线母线采样：f(z) = z 抛物线", () => {
    const p = sampleCurveProfile((z) => z, 0, 2, 10);
    expect(p.length).toBe(11);
    expect(p[0].r).toBe(0);
    expect(p[0].z).toBe(0);
    expect(p[p.length - 1].r).toBeCloseTo(2, 5);
    expect(p[p.length - 1].z).toBeCloseTo(2, 5);
  });
});

describe("rimRadiusAtZ", () => {
  it("圆柱上下两端外圆半径均为 radius（而非轴心的 0）", () => {
    const p = cylinderProfile(2, 5);
    expect(rimRadiusAtZ(p, 0)).toBe(2);
    expect(rimRadiusAtZ(p, 5)).toBe(2);
  });

  it("圆锥顶点处半径为 0，不应绘制顶圆", () => {
    const p = coneProfile(3, 4);
    expect(rimRadiusAtZ(p, 4)).toBe(0);
    expect(rimRadiusAtZ(p, 0)).toBe(3);
  });

  it("圆台上下两端外圆半径分别为 rTop / rBottom", () => {
    const p = frustumProfile(3, 1.5, 4);
    expect(rimRadiusAtZ(p, 0)).toBe(3);
    expect(rimRadiusAtZ(p, 4)).toBe(1.5);
  });

  it("球体极点处半径为 0，赤道处半径为球半径", () => {
    const p = sphereProfile(3, 32);
    expect(rimRadiusAtZ(p, -3)).toBeCloseTo(0, 5);
    expect(rimRadiusAtZ(p, 0)).toBeCloseTo(3, 5);
    expect(rimRadiusAtZ(p, 3)).toBeCloseTo(0, 5);
  });
});

describe("radiusAtZ（母线任意高度插值）", () => {
  it("圆柱：中间任意高度半径恒等于 R，不塌陷为 0", () => {
    const p = cylinderProfile(2, 5);
    expect(radiusAtZ(p, 0)).toBeCloseTo(2);
    expect(radiusAtZ(p, 2.5)).toBeCloseTo(2);
    expect(radiusAtZ(p, 5)).toBeCloseTo(2);
  });

  it("圆锥：中间高度按线性插值递减到 0", () => {
    const p = coneProfile(3, 6);
    expect(radiusAtZ(p, 0)).toBeCloseTo(3);
    expect(radiusAtZ(p, 3)).toBeCloseTo(1.5);
    expect(radiusAtZ(p, 6)).toBeCloseTo(0);
  });

  it("圆台：中间高度线性插值介于 rBottom 和 rTop 之间", () => {
    const p = frustumProfile(4, 2, 6);
    expect(radiusAtZ(p, 0)).toBeCloseTo(4);
    expect(radiusAtZ(p, 3)).toBeCloseTo(3);
    expect(radiusAtZ(p, 6)).toBeCloseTo(2);
  });

  it("球体：赤道处半径最大，极点处为 0", () => {
    const p = sphereProfile(3, 32);
    expect(radiusAtZ(p, -3)).toBeCloseTo(0, 3);
    expect(radiusAtZ(p, -1.5)).toBeCloseTo(2.6, 1);
    expect(radiusAtZ(p, 0)).toBeCloseTo(3, 3);
    expect(radiusAtZ(p, 1.5)).toBeCloseTo(2.6, 1);
    expect(radiusAtZ(p, 3)).toBeCloseTo(0, 3);
  });
});

describe("calculateSphereCut", () => {
  it("截面过球心时为大圆 (d=0)", () => {
    const res = calculateSphereCut(5, 0);
    expect(res.isGreatCircle).toBe(true);
    expect(res.cutRadius).toBe(5);
    expect(res.cutArea).toBeCloseTo(Math.PI * 25);
  });

  it("球心距 d=3, R=5 时，小圆半径 r=4 (勾股 3-4-5)", () => {
    const res = calculateSphereCut(5, 3);
    expect(res.isGreatCircle).toBe(false);
    expect(res.cutRadius).toBeCloseTo(4);
    expect(res.cutArea).toBeCloseTo(Math.PI * 16);
  });
});

describe("calculateUnfoldParams", () => {
  it("圆锥展开角计算：r=1, h=sqrt(3) -> l=2, alpha=180°", () => {
    const res = calculateUnfoldParams("cone", 1, 0, Math.sqrt(3));
    expect(res.generatorLength).toBeCloseTo(2);
    expect(res.unfoldAngleDeg).toBeCloseTo(180);
    expect(res.shortestPathAround).toBeCloseTo(4); // 2 * l * sin(90°) = 4
  });

  it("圆柱展开为矩形：最短路径对角线", () => {
    const res = calculateUnfoldParams("cylinder", 1, 0, 4);
    expect(res.unfoldAngleDeg).toBe(360);
    expect(res.shortestPathAround).toBeCloseTo(
      Math.sqrt((2 * Math.PI) ** 2 + 16),
    );
  });
});
