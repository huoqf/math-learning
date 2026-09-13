import { describe, it, expect } from "vitest";
import {
  calcPolarizationIdentity,
  calcApolloniusCircle,
  calcCombinedModel,
} from "./vectorPolarizationApollonius";

describe("vectorPolarizationApollonius", () => {
  it("应准确计算极化恒等式 AB · AC = |AM|^2 - |BM|^2", () => {
    const bcLength = 6;
    const ax = 2;
    const ay = 4;
    const res = calcPolarizationIdentity(ax, ay, bcLength);

    expect(res.isValid).toBe(true);
    expect(res.lenBM).toBe(3);
    expect(res.pointB).toEqual({ x: -3, y: 0 });
    expect(res.pointC).toEqual({ x: 3, y: 0 });
    expect(res.pointM).toEqual({ x: 0, y: 0 });

    // 坐标点积与极化恒等式应完全相等
    expect(res.dotProductCoord).toBeCloseTo(res.dotProductPolar, 5);
    // (2^2 + 4^2) - 3^2 = 20 - 9 = 11
    expect(res.dotProductCoord).toBeCloseTo(11, 5);
  });

  it("应准确求解阿波罗尼斯圆 (lambda > 1 且圆心在正半轴)", () => {
    const bcLength = 6; // A(-3,0), B(3,0), c = 3
    const lambda = 2; // |PA| / |PB| = 2
    const res = calcApolloniusCircle(bcLength, lambda, 45);

    expect(res.isValid).toBe(true);
    expect(res.isDegenerate).toBe(false);
    // 内分点 D: xD = 3 * (2 - 1) / (2 + 1) = 1
    expect(res.pointD.x).toBeCloseTo(1, 5);
    // 外分点 E: xE = 3 * (1 + 2) / (2 - 1) = 9
    expect(res.pointE.x).toBeCloseTo(9, 5);
    // 圆心 O: (1 + 9) / 2 = 5
    expect(res.centerO.x).toBeCloseTo(5, 5);
    // 半径 R: (9 - 1) / 2 = 4
    expect(res.radiusR).toBeCloseTo(4, 5);

    // 动点 P 上的 distance ratio 应精准等于 λ = 2
    expect(res.ratioP).toBeCloseTo(2, 4);
  });

  it("应准确求解阿波罗尼斯圆 (lambda < 1 且圆心在负半轴)", () => {
    const bcLength = 6; // A(-3,0), B(3,0), c = 3
    const lambda = 0.5; // |PA| / |PB| = 0.5 => 靠近 A 侧
    const res = calcApolloniusCircle(bcLength, lambda, 0);

    expect(res.isValid).toBe(true);
    expect(res.isDegenerate).toBe(false);
    // 内分点 D: xD = 3 * (0.5 - 1) / (0.5 + 1) = 3 * (-0.5) / 1.5 = -1
    expect(res.pointD.x).toBeCloseTo(-1, 5);
    // 外分点 E: xE = 3 * (1 + 0.5) / (0.5 - 1) = 3 * 1.5 / (-0.5) = -9
    expect(res.pointE.x).toBeCloseTo(-9, 5);
    // 圆心 O: (-1 + -9) / 2 = -5
    expect(res.centerO.x).toBeCloseTo(-5, 5);
    // 半径 R: |-9 - (-1)| / 2 = 4
    expect(res.radiusR).toBeCloseTo(4, 5);

    expect(res.ratioP).toBeCloseTo(0.5, 4);
  });

  it("应处理 λ = 1 退化为中垂线的情况", () => {
    const bcLength = 6;
    const lambda = 1.0;
    const res = calcApolloniusCircle(bcLength, lambda, 0);

    expect(res.isDegenerate).toBe(true);
    expect(res.ratioP).toBeCloseTo(1.0, 4);
  });

  it("应计算压轴综合模型 PA · PB 的极值与极化恒等式 (lambda > 1 与 lambda < 1)", () => {
    const bcLength = 6; // c = 3, MB = 3, MB^2 = 9

    // 1. lambda = 2: D(1,0), E(9,0)
    const res1 = calcCombinedModel(bcLength, 2, 60);
    // 任意角度下，点积与极化恒等式均相等
    expect(res1.dotProductP).toBeCloseTo(res1.dotProductViaPolar, 4);
    // 最小值: 1^2 - 3^2 = -8
    expect(res1.minDotProduct).toBeCloseTo(-8, 4);
    // 最大值: 9^2 - 3^2 = 72
    expect(res1.maxDotProduct).toBeCloseTo(72, 4);

    // 2. lambda = 0.5: D(-1,0), E(-9,0)
    const res2 = calcCombinedModel(bcLength, 0.5, 120);
    expect(res2.dotProductP).toBeCloseTo(res2.dotProductViaPolar, 4);
    // 最小值: |-1|^2 - 3^2 = 1 - 9 = -8
    expect(res2.minDotProduct).toBeCloseTo(-8, 4);
    // 最大值: |-9|^2 - 3^2 = 81 - 9 = 72
    expect(res2.maxDotProduct).toBeCloseTo(72, 4);
  });

  it("应准确自适应求解不同 lambda 下极值对应的参数极角", async () => {
    const { getCombinedExtremaAngles } =
      await import("./vectorPolarizationApollonius");

    // lambda = 2 > 1 时，圆心在正半轴，内分点 D 对应 180°，外分点 E 对应 0°
    const angles1 = getCombinedExtremaAngles(2.0);
    expect(angles1.minAngle).toBe(180);
    expect(angles1.maxAngle).toBe(0);

    // lambda = 0.5 < 1 时，圆心在负半轴，内分点 D 对应 0°，外分点 E 对应 180°
    const angles2 = getCombinedExtremaAngles(0.5);
    expect(angles2.minAngle).toBe(0);
    expect(angles2.maxAngle).toBe(180);

    // lambda = 1 退化时
    const angles3 = getCombinedExtremaAngles(1.0);
    expect(angles3.minAngle).toBe(0);
  });

  it("应保证退化为中垂线时动点纵坐标平滑有界且不产生发散", () => {
    // 测试 90度奇点与 270度
    const res90 = calcApolloniusCircle(6, 1.0, 90);
    expect(res90.isDegenerate).toBe(true);
    expect(Number.isFinite(res90.pointP.y)).toBe(true);
    expect(Math.abs(res90.pointP.y)).toBeLessThanOrEqual(5);

    const res270 = calcApolloniusCircle(6, 1.0, 270);
    expect(Number.isFinite(res270.pointP.y)).toBe(true);
    expect(Math.abs(res270.pointP.y)).toBeLessThanOrEqual(5);
  });

  it("应准确求解正交垂直状态极角，使数量积严格为 0", async () => {
    const { getOrthogonalAngle } =
      await import("./vectorPolarizationApollonius");
    const orthoAngle = getOrthogonalAngle(6.0, 2.0);
    expect(orthoAngle).toBe(143);

    // 验证当 pointAngle = 143 时，两向量点积接近 0
    const res = calcCombinedModel(6.0, 2.0, orthoAngle);
    expect(Math.abs(res.dotProductP)).toBeLessThan(0.1);
  });
});
