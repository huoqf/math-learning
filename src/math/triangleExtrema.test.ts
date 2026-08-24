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
    // 当 B = 60° (C = 60°) 时为等边三角形，取得最大周长与最大面积
    const resEquilateral = solveAngleTransform(60, a, 60);

    expect(resEquilateral.isValid).toBe(true);
    expect(resEquilateral.isAcute).toBe(true);
    expect(resEquilateral.sides.b).toBeCloseTo(a, 4);
    expect(resEquilateral.sides.c).toBeCloseTo(a, 4);

    // 最大周长：当 B = (180°-A)/2 = 60° 时等腰（即等边三角形）取最大值
    // 由正弦定理：b+c = 2R(sinB+sinC) = 2R·2sin((B+C)/2)cos((B-C)/2)
    // 等腰时 B=C=(180°-60°)/2=60°，b+c 取最大 = a/sin(A/2) = 2√3/0.5 = 4√3
    // 最大周长 = a + b + c = 2√3 + 4√3 = 6√3
    expect(resEquilateral.extrema.maxPerimeter).toBeCloseTo(
      6 * Math.sqrt(3),
      4,
    );
    expect(resEquilateral.extrema.perimeter).toBeCloseTo(6 * Math.sqrt(3), 4);

    // 最大面积 = a^2 / (4 * tan(A/2)) = 12 / (4 * tan(30°)) = 3 / (1/sqrt(3)) = 3*sqrt(3) ≈ 5.196
    expect(resEquilateral.extrema.maxArea).toBeCloseTo(3 * Math.sqrt(3), 4);
    expect(resEquilateral.extrema.area).toBeCloseTo(3 * Math.sqrt(3), 4);
  });

  it("锐角约束分析：A=60° 时，角 B 必须在 (30°, 90°) 开区间内", () => {
    const constraints = calcAcuteConstraints(60, 4);
    expect(constraints.isPossible).toBe(true);
    expect(constraints.minAngleB).toBeCloseTo(30, 4);
    expect(constraints.maxAngleB).toBeCloseTo(90, 4);
    expect(constraints.maxArea).toBeGreaterThan(constraints.minArea);
  });

  it("均值不等式模式：求解第三边并验证极限", () => {
    // A = 60°, a = 4, b = 3
    const res = solveSideIneq(60, 4, 3);
    expect(res.isValid).toBe(true);
    expect(res.sides.a).toBe(4);
    expect(res.sides.b).toBeCloseTo(3, 4);
    expect(res.sides.c).toBeGreaterThan(0);
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
    // 当 theta 变化时，AB·AC 保持恒定值 7
    expect(res.polarization?.constantDotProduct).toBeCloseTo(7, 4);
  });
});
