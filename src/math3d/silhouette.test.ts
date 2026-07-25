import { describe, it, expect } from "vitest";
import { computeSilhouette } from "./silhouette";
import {
  cylinderProfile,
  coneProfile,
  sphereProfile,
  frustumProfile,
} from "./rotationProfiles";

const DEG = Math.PI / 180;

describe("computeSilhouette", () => {
  it("圆柱：theta 恒为 thetaCam±90°，与仰角无关", () => {
    const profile = cylinderProfile(2, 5);
    const { left, right } = computeSilhouette(profile, 30 * DEG, 25 * DEG);
    for (const p of left) expect(p.theta).toBeCloseTo(30 * DEG - 90 * DEG, 5);
    for (const p of right) expect(p.theta).toBeCloseTo(30 * DEG + 90 * DEG, 5);
  });

  it("圆锥：母线上 theta 恒定（单一斜率退化为直线）", () => {
    const profile = coneProfile(3, 6);
    const { left } = computeSilhouette(profile, 0, 25 * DEG);
    const thetas = left.map((p) => p.theta);
    for (const t of thetas) expect(t).toBeCloseTo(thetas[0], 5);
  });

  it("圆台：母线上 theta 恒定（单一斜率退化为直线）", () => {
    const profile = frustumProfile(3, 1.5, 4);
    const { left } = computeSilhouette(profile, 0, 25 * DEG);
    const thetas = left.map((p) => p.theta);
    for (const t of thetas) expect(t).toBeCloseTo(thetas[0], 5);
  });

  it("球：beta=0 时退化为过两极的经线（theta 恒定 ±90°）", () => {
    const profile = sphereProfile(1);
    const { left, right } = computeSilhouette(profile, 0, 0);
    for (const p of left) expect(p.theta).toBeCloseTo(-90 * DEG, 5);
    for (const p of right) expect(p.theta).toBeCloseTo(90 * DEG, 5);
  });

  it("球：输出连续无缺口，theta 单调变化（无跳变伪影）", () => {
    const profile = sphereProfile(1);
    const { left } = computeSilhouette(profile, 0, 35 * DEG);
    // 连续性：z 严格升序，相邻 dz 恒定（均匀重采样）
    const dz0 = left[1].z - left[0].z;
    for (let i = 1; i < left.length; i++) {
      expect(left[i].z - left[i - 1].z).toBeCloseTo(dz0, 8);
    }
    // 单调性：theta 差分符号应一致
    for (let i = 2; i < left.length; i++) {
      const prev = left[i].theta - left[i - 1].theta;
      const curr = left[i - 1].theta - left[i - 2].theta;
      expect(prev * curr).toBeGreaterThanOrEqual(-1e-6);
    }
  });

  it("球：输出数组长度恒定（均匀重采样）", () => {
    const profile = sphereProfile(1);
    const { left, right } = computeSilhouette(profile, 0, 40 * DEG);
    expect(left.length).toBe(right.length);
    expect(left.length).toBeGreaterThan(50);
  });

  it("较大仰角：球的有效区间收缩但不为 null", () => {
    const profile = sphereProfile(1);
    const { zRange } = computeSilhouette(profile, 0, 70 * DEG);
    expect(zRange).not.toBeNull();
    const { zRange: zRangeSmall } = computeSilhouette(profile, 0, 30 * DEG);
    expect(zRangeSmall).not.toBeNull();
    const spanLarge = zRange![1] - zRange![0];
    const spanSmall = zRangeSmall![1] - zRangeSmall![0];
    expect(spanLarge).toBeLessThan(spanSmall);
  });

  it("球：闭合边界附近 theta 应光滑变化，不出现钩状回摆", () => {
    const profile = sphereProfile(1);
    const { left, right, zRange } = computeSilhouette(profile, 0, 35 * DEG);
    expect(zRange).not.toBeNull();
    expect(left.length).toBeGreaterThan(10);

    // 连续性：theta 应光滑变化，相邻差分符号一致（无锯齿）
    for (let i = 2; i < left.length; i++) {
      const prev = left[i].theta - left[i - 1].theta;
      const curr = left[i - 1].theta - left[i - 2].theta;
      expect(prev * curr).toBeGreaterThanOrEqual(-1e-4);
    }

    // 左右曲线在底部应闭合（phi≈0 → theta ≈ thetaCam）
    expect(Math.abs(left[0].theta - right[0].theta)).toBeLessThan(0.1);
  });

  it("球：beta>0 时 theta 随纬度连续变化", () => {
    const profile = sphereProfile(1);
    const beta = 40 * DEG;
    const { left, zRange } = computeSilhouette(profile, 0, beta);
    expect(zRange).not.toBeNull();
    const thetas = [...new Set(left.map((p) => p.theta))];
    expect(thetas.length).toBeGreaterThan(1);
  });
});
