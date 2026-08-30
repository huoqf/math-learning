import { describe, it, expect } from "vitest";
import {
  solveAngleTransform,
  solveSideIneq,
  solveApollonius,
  solvePolarization,
  calcAcuteConstraints,
} from "./triangleExtrema";

describe("triangleExtrema - 解三角形极值与范围计算", () => {
  it("角化边模式：固定 A=60°, a=2*sqrt(3)，等腰时周长与面积取得最大值", () => {
    const a = 2 * Math.sqrt(3);
    const resEquilateral = solveAngleTransform(60, a, 60);

    expect(resEquilateral.isValid).toBe(true);
    expect(resEquilateral.isAcute).toBe(true);
    expect(resEquilateral.sides.b).toBeCloseTo(a, 4);
    expect(resEquilateral.sides.c).toBeCloseTo(a, 4);

    // 最大周长 = a + a/sin(A/2) = 2√3 + 4√3 = 6√3
    expect(resEquilateral.extrema.maxPerimeter).toBeCloseTo(
      6 * Math.sqrt(3),
      4,
    );
    expect(resEquilateral.extrema.perimeter).toBeCloseTo(6 * Math.sqrt(3), 4);

    // 最大面积 = a^2 / (4 * tan(A/2)) = 3*sqrt(3) ≈ 5.196
    expect(resEquilateral.extrema.maxArea).toBeCloseTo(3 * Math.sqrt(3), 4);
    expect(resEquilateral.extrema.area).toBeCloseTo(3 * Math.sqrt(3), 4);
  });

  it("均值不等式模式：固定 A=60°, a=4，验证 b=c 时面积取得最大值", () => {
    // 由余弦定理 a^2 = b^2 + c^2 - bc >= 2bc - bc = bc => bc <= a^2 = 16
    // 当且仅当 b = c = 4 时等号成立，S_max = 0.5 * 16 * sin60° = 4*sqrt(3) ≈ 6.9282
    const res = solveSideIneq(60, 4, 4);
    expect(res.isValid).toBe(true);
    expect(res.sides.a).toBe(4);
    expect(res.sides.b).toBeCloseTo(4, 4);
    expect(res.sides.c).toBeCloseTo(4, 4);
    expect(res.extrema.area).toBeCloseTo(4 * Math.sqrt(3), 4);
    expect(res.extrema.maxArea).toBeCloseTo(4 * Math.sqrt(3), 4);
    expect(res.extrema.maxSideProduct).toBeCloseTo(16, 4);
  });

  it("锐角约束分析：A=60° 时，角 B 必须在 (30°, 90°) 开区间内", () => {
    const constraints = calcAcuteConstraints(60, 4);
    expect(constraints.isPossible).toBe(true);
    expect(constraints.minAngleB).toBeCloseTo(30, 4);
    expect(constraints.maxAngleB).toBeCloseTo(90, 4);
    expect(constraints.maxArea).toBeGreaterThan(constraints.minArea);
    expect(constraints.maxPerimeter).toBeGreaterThan(constraints.minPerimeter);
  });

  it("阿波罗尼斯圆模式：固定 BC=4, c/b=2, 验证阿氏圆半径与顶点轨迹", () => {
    // a = 4, k = 2
    // 阿氏圆半径 R = (k / |k^2 - 1|) * a = (2 / 3) * 4 = 8/3 ≈ 2.6667
    const res = solveApollonius(4, 2, 90);
    expect(res.isValid).toBe(true);
    expect(res.apolloniusCircle?.radius).toBeCloseTo(8 / 3, 4);

    // 验证动点 A 到 B 和 C 的距离比严格等于 k = 2
    expect(res.sides.c / res.sides.b).toBeCloseTo(2.0, 4);
  });

  it("极化恒等式模式：固定 a=6, 中线 ma=4, 验证 AB·AC 的恒定极值", () => {
    // 向量极化恒等式：AB·AC = |AM|^2 - |MB|^2 = ma^2 - (a/2)^2 = 16 - 9 = 7
    const res = solvePolarization(6, 4, 60);
    expect(res.isValid).toBe(true);
    expect(res.polarization?.constantDotProduct).toBeCloseTo(7, 4);
  });
});
