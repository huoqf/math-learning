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

  it("应准确求解阿波罗尼斯圆的圆心、半径及轨迹点比值", () => {
    const bcLength = 6; // A(-3,0), B(3,0)
    const lambda = 2; // |PA| / |PB| = 2
    const res = calcApolloniusCircle(bcLength, lambda, 45);

    expect(res.isValid).toBe(true);
    expect(res.isDegenerate).toBe(false);
    // 内分点 D: xD = 3 * (2 - 1) / (2 + 1) = 1
    expect(res.pointD.x).toBeCloseTo(1, 5);
    // 外分点 E: xE = 3 * (1 + 2) / (2 - 1) = 9
    expect(res.pointE.x).toBeCloseTo(9, 5);
    // 圆心 O_A: (1 + 9) / 2 = 5
    expect(res.centerO.x).toBeCloseTo(5, 5);
    // 半径 R_A: (9 - 1) / 2 = 4
    expect(res.radiusR).toBeCloseTo(4, 5);

    // 动点 P 上的 distance ratio 应精准等于 λ = 2
    expect(res.ratioP).toBeCloseTo(2, 4);
  });

  it("应处理 λ = 1 退化为中垂线的情况", () => {
    const bcLength = 6;
    const lambda = 1.0;
    const res = calcApolloniusCircle(bcLength, lambda, 0);

    expect(res.isDegenerate).toBe(true);
    expect(res.ratioP).toBeCloseTo(1.0, 4);
  });

  it("应计算压轴综合模型 PA · PB 的极值与极化恒等式", () => {
    const bcLength = 6;
    const lambda = 2;
    const res = calcCombinedModel(bcLength, lambda, 0);

    // 点积 PA · PB 应与极化恒等式 |PM|^2 - |MB|^2 完全吻合
    expect(res.dotProductP).toBeCloseTo(res.dotProductViaPolar, 4);
    // 最小值对应 P 在内分点 D(1, 0)，距离 M(0,0) 为 1
    // PM_min^2 - MB^2 = 1^2 - 3^2 = -8
    expect(res.minDotProduct).toBeCloseTo(-8, 4);
    // 最大值对应 P 在外分点 E(9, 0)，距离 M(0,0) 为 9
    // PM_max^2 - MB^2 = 9^2 - 3^2 = 72
    expect(res.maxDotProduct).toBeCloseTo(72, 4);
  });
});
