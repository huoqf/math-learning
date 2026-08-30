import { describe, it, expect } from "vitest";
import {
  solveTriangleFromSAS,
  solveSSA,
  solveBisectorAndMedian,
} from "./triangleSolve";

describe("triangleSolve - 解三角形与几何计算", () => {
  it("SAS 模式下验证余弦定理、正弦比值 2R 与面积公式 (等边三角形)", () => {
    // b = 4, c = 4, A = 60° => 等边三角形 a = 4, S = sqrt(3)/4 * 16 = 4*sqrt(3) ≈ 6.928
    const res = solveTriangleFromSAS(4, 4, 60);

    expect(res.sides.a).toBeCloseTo(4, 4);
    expect(res.anglesDeg.B).toBeCloseTo(60, 4);
    expect(res.anglesDeg.C).toBeCloseTo(60, 4);
    expect(res.area).toBeCloseTo(4 * Math.sqrt(3), 4);

    // 正弦定理 a/sinA = b/sinB = c/sinC = 2R
    const sin60 = Math.sqrt(3) / 2;
    const expected2R = 4 / sin60; // 2R = 8/sqrt(3) ≈ 4.619
    expect(res.sineRatios.ratioA).toBeCloseTo(expected2R, 4);
    expect(res.sineRatios.ratioB).toBeCloseTo(expected2R, 4);
    expect(res.circumcircle.radius).toBeCloseTo(4 / Math.sqrt(3), 4);

    // 内切圆半径 r = S / p = 4*sqrt(3) / 6 = 2*sqrt(3)/3
    expect(res.incircle.radius).toBeCloseTo((2 * Math.sqrt(3)) / 3, 4);

    // 射影定理（第二余弦定理）: c·cosB + b·cosC = a
    expect(res.projections.cCosB + res.projections.bCosC).toBeCloseTo(4, 4);
  });

  it("SAS 模式下直角与钝角三角形验证", () => {
    // 1. 直角三角形: b = 3, c = 4, A = 90° => a = 5, S = 6
    const resRight = solveTriangleFromSAS(3, 4, 90);
    expect(resRight.sides.a).toBeCloseTo(5, 4);
    expect(resRight.area).toBeCloseTo(6, 4);
    expect(resRight.circumcircle.radius).toBeCloseTo(2.5, 4);
    expect(resRight.incircle.radius).toBeCloseTo(1, 4);

    // 2. 钝角三角形: b = 3, c = 4, A = 120°
    // a^2 = 9 + 16 - 2*3*4*(-0.5) = 25 + 12 = 37 => a = sqrt(37) ≈ 6.0828
    const resObtuse = solveTriangleFromSAS(3, 4, 120);
    expect(resObtuse.sides.a).toBeCloseTo(Math.sqrt(37), 4);
    expect(resObtuse.anglesDeg.A).toBe(120);
    // 射影定理在钝角三角形下仍然严格成立: c*cosB + b*cosC = a
    expect(
      resObtuse.projections.cCosB + resObtuse.projections.bCosC,
    ).toBeCloseTo(Math.sqrt(37), 4);
  });

  it("SSA 探究模式下全面验证锐角与钝角解的个数 (2 解, 1 解, 0 解)", () => {
    // ── 锐角情况 A = 30°, b = 4 => 临界高 h = b * sin(30°) = 2 ──
    // 1. a < h (a = 1.5) => 无解
    const res0 = solveSSA(1.5, 4, 30);
    expect(res0.solutionCount).toBe(0);
    expect(res0.solutions).toHaveLength(0);

    // 2. a = h (a = 2.0) => 唯一解 (直角三角形)
    const res1 = solveSSA(2.0, 4, 30);
    expect(res1.solutionCount).toBe(1);
    expect(res1.solutions).toHaveLength(1);
    expect(res1.details[0].angleB).toBeCloseTo(Math.PI / 2, 4);

    // 3. h < a < b (a = 3.0) => 双解 (一个锐角三角形，一个钝角三角形)
    const res2 = solveSSA(3.0, 4, 30);
    expect(res2.solutionCount).toBe(2);
    expect(res2.solutions).toHaveLength(2);
    const sumDegB =
      (res2.details[0].angleB + res2.details[1].angleB) * (180 / Math.PI);
    expect(sumDegB).toBeCloseTo(180, 2);

    // 4. a >= b (a = 5.0) => 唯一解
    const resSingle = solveSSA(5.0, 4, 30);
    expect(resSingle.solutionCount).toBe(1);

    // ── 钝角情况 A = 120°, b = 4 ──
    // 5. a <= b (a = 3.5 <= 4) => 0 解 (大角对大边矛盾)
    const resObtuse0 = solveSSA(3.5, 4, 120);
    expect(resObtuse0.solutionCount).toBe(0);

    // 6. a > b (a = 6.0 > 4) => 唯一钝角三角形解
    const resObtuse1 = solveSSA(6.0, 4, 120);
    expect(resObtuse1.solutionCount).toBe(1);
    expect(resObtuse1.details[0].angleA).toBeCloseTo((120 * Math.PI) / 180, 4);
  });

  it("角平分线与中线定理验证", () => {
    // b = 6, c = 4, A = 60°
    // a^2 = 36 + 16 - 2*6*4*0.5 = 52 - 24 = 28 => a = 2*sqrt(7)
    const res = solveBisectorAndMedian(6, 4, 60);

    // 角平分线长 ta = 2*b*c*cos(30°) / (b+c) = 2*6*4*(sqrt(3)/2) / 10 = 2.4 * sqrt(3) ≈ 4.1569
    expect(res.bisectorLength).toBeCloseTo(2.4 * Math.sqrt(3), 4);

    // 内角平分线定理：BD / DC = AB / AC = c / b = 4 / 6
    expect(res.sideBD / res.sideDC).toBeCloseTo(4 / 6, 4);

    // 中线长 ma = 0.5 * sqrt(2*36 + 2*16 - 28) = sqrt(19) ≈ 4.3589
    expect(res.medianLength).toBeCloseTo(Math.sqrt(19), 4);

    // 向量基底分解系数: AD = (b/(b+c)) B + (c/(b+c)) C, 权重和为 1
    expect(res.vectorWeights.lambda + res.vectorWeights.mu).toBeCloseTo(1.0, 4);
  });
});
