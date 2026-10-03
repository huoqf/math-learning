import { describe, it, expect } from "vitest";
import {
  solveTriangleFromSAS,
  solveSSA,
  solveBisectorAndMedian,
  solveAngleAFromVertices,
  solveAngleAFromVertexPosition,
  solveTriangleFromSSS,
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
    expect(res0.caseKind).toBe("acute_no_solution");

    // 2. a = h (a = 2.0) => 唯一解 (直角三角形)
    const res1 = solveSSA(2.0, 4, 30);
    expect(res1.solutionCount).toBe(1);
    expect(res1.solutions).toHaveLength(1);
    expect(res1.details[0].angleB).toBeCloseTo(Math.PI / 2, 4);
    expect(res1.caseKind).toBe("acute_right_single");

    // 3. h < a < b (a = 3.0) => 双解 (一个锐角三角形，一个钝角三角形)
    const res2 = solveSSA(3.0, 4, 30);
    expect(res2.solutionCount).toBe(2);
    expect(res2.solutions).toHaveLength(2);
    const sumDegB =
      (res2.details[0].angleB + res2.details[1].angleB) * (180 / Math.PI);
    expect(sumDegB).toBeCloseTo(180, 2);
    expect(res2.caseKind).toBe("acute_double");

    // 4. a >= b (a = 5.0) => 唯一解
    const resSingle = solveSSA(5.0, 4, 30);
    expect(resSingle.solutionCount).toBe(1);
    expect(resSingle.caseKind).toBe("acute_single");

    // ── 钝角情况 A = 120°, b = 4 ──
    // 5. a <= b (a = 3.5 <= 4) => 0 解 (大角对大边矛盾)
    const resObtuse0 = solveSSA(3.5, 4, 120);
    expect(resObtuse0.solutionCount).toBe(0);
    expect(resObtuse0.caseKind).toBe("nonacute_no_solution");

    // 6. a > b (a = 6.0 > 4) => 唯一钝角三角形解
    const resObtuse1 = solveSSA(6.0, 4, 120);
    expect(resObtuse1.solutionCount).toBe(1);
    expect(resObtuse1.details[0].angleA).toBeCloseTo((120 * Math.PI) / 180, 4);
    expect(resObtuse1.caseKind).toBe("nonacute_single");

    // ── 回归：A ≥ 90° 时不得再落回锐角四分支（旧右屏文案会输出「0 个解 (h < a < b 双解)」）──
    // A = 120°, b = 5, a = 4.4 → h = 5·sin120° = 4.3301, a < b 但 A 为钝角 ⇒ 无解
    const resObtuse2 = solveSSA(4.4, 5, 120);
    expect(resObtuse2.solutionCount).toBe(0);
    expect(resObtuse2.caseKind).toBe("nonacute_no_solution");

    // A = 90°, b = 5, a = h = 5 ⇒ 退化（A+B=180°），必须判 0 解而不是「单解(直角)」
    const resRight = solveSSA(5, 5, 90);
    expect(resRight.solutionCount).toBe(0);
    expect(resRight.caseKind).toBe("nonacute_no_solution");

    // A = 90°, b = 5, a = 6 > b ⇒ 唯一解
    const resRight2 = solveSSA(6, 5, 90);
    expect(resRight2.solutionCount).toBe(1);
    expect(resRight2.caseKind).toBe("nonacute_single");

    // 「相切单解」预设取 a = b·sinA 的精确值时必须真的得到唯一解
    const tangentA = 60;
    const tangentB = 5;
    const resTangent = solveSSA(
      tangentB * Math.sin((tangentA * Math.PI) / 180),
      tangentB,
      tangentA,
    );
    expect(resTangent.solutionCount).toBe(1);
    expect(resTangent.caseKind).toBe("acute_right_single");
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

  it("solveAngleAFromVertices 应由顶点几何严格反解角 A，理论点 0 跳变", () => {
    // 构造 SAS 三角形 A=60°, b=5, c=6
    const sas = solveTriangleFromSAS(5, 6, 60);
    const { A, B, C } = sas.points;

    // 当输入顶点 A 的当前坐标时，反解角严格等于 60°
    const angleResolved = solveAngleAFromVertices(A, B, C);
    expect(angleResolved).toBeCloseTo(60, 4);

    // 当 A 点退化重合时返回安全兜底角（默认 60°，传入原角则保持原角）
    expect(solveAngleAFromVertices(B, B, C)).toBe(60);
    expect(solveAngleAFromVertices(B, B, C, 120)).toBe(120);
  });

  it("solveAngleAFromVertexPosition 应沿 A 的真实轨迹反解角 A，对任意 b/c 比值（含等腰退化）都成立", () => {
    // 1. 轨迹点自洽：反解必须回到原角度（含 b = c 的退化比值 —— 此时 A 恒在 x = 0）
    for (const [b, c] of [
      [5, 6],
      [6, 5],
      [5, 5],
      [4, 8],
    ] as const) {
      for (const angleA of [20, 45, 60, 90, 135]) {
        const p = solveTriangleFromSAS(b, c, angleA).points.A;
        const back = solveAngleAFromVertexPosition(p.x, p.y, b, c, 1, 179);
        expect(back).toBeCloseTo(angleA, 3);
      }
    }

    // 2. 旧实现失效的参数区间（b = 5, c = 6）：20° 与 30° 的轨迹点**竖直高度相近**（3.183 vs 3.326，
    //    极值在 ≈32° 附近），但横坐标差异显著（1.706 vs 1.220）—— 单靠竖直分量无法区分，
    //    拖拽必须走轨迹投影，否则 A ≲ 32° 区间接柄会逆光标。
    const p20 = solveTriangleFromSAS(5, 6, 20).points.A;
    const p30 = solveTriangleFromSAS(5, 6, 30).points.A;
    expect(Math.abs(p20.y - p30.y)).toBeLessThan(0.2);
    expect(Math.abs(p20.x - p30.x)).toBeGreaterThan(0.4);
    expect(
      solveAngleAFromVertexPosition(p20.x, p20.y, 5, 6, 1, 179),
    ).toBeCloseTo(20, 3);
    expect(
      solveAngleAFromVertexPosition(p30.x, p30.y, 5, 6, 1, 179),
    ).toBeCloseTo(30, 3);

    // 3. 光标远离轨迹时，结果仍必须落在搜索域内（不越界）
    const far = solveAngleAFromVertexPosition(999, 999, 5, 6, 15, 150);
    expect(far).toBeGreaterThanOrEqual(15);
    expect(far).toBeLessThanOrEqual(150);
  });

  it("solveTriangleFromSSS 应由三边唯一确定三角形，并拦截不满足三角不等式的输入", () => {
    // 3-4-5 直角三角形（a = 5 的对角为直角）
    const rt = solveTriangleFromSSS(5, 4, 3);
    expect(rt.isValid).toBe(true);
    const full = rt.full!;
    expect(full.sides.a).toBeCloseTo(5, 6);
    expect(full.sides.b).toBeCloseTo(4, 6);
    expect(full.sides.c).toBeCloseTo(3, 6);
    expect(full.anglesDeg.A).toBeCloseTo(90, 4);
    expect(full.area).toBeCloseTo(6, 6); // ½ × 4 × 3 × sin90°

    // 与 SAS 路径（余弦定理反解 A 再走 SAS）必须逐位一致
    const cosA = (4 * 4 + 3 * 3 - 5 * 5) / (2 * 4 * 3);
    const angleA = (Math.acos(cosA) * 180) / Math.PI;
    const sas = solveTriangleFromSAS(4, 3, angleA);
    expect(full.points.A.x).toBeCloseTo(sas.points.A.x, 10);
    expect(full.points.A.y).toBeCloseTo(sas.points.A.y, 10);

    // 等边三角形：三边相等 ⇒ 三角均为 60°
    const eq = solveTriangleFromSSS(4, 4, 4);
    expect(eq.isValid).toBe(true);
    expect(eq.full!.anglesDeg.A).toBeCloseTo(60, 6);
    expect(eq.full!.anglesDeg.B).toBeCloseTo(60, 6);
    expect(eq.full!.anglesDeg.C).toBeCloseTo(60, 6);

    // 三角不等式取等号（3 + 4 = 7）⇒ 三点共线退化，必须判为无效
    const degenerate = solveTriangleFromSSS(3, 4, 7);
    expect(degenerate.isValid).toBe(false);
    expect(degenerate.warning).toBeTruthy();
    expect(degenerate.full).toBeUndefined();

    // 两边之和小于第三边、非正边长 ⇒ 均无效
    expect(solveTriangleFromSSS(1, 1, 10).isValid).toBe(false);
    expect(solveTriangleFromSSS(0, 4, 5).isValid).toBe(false);
    expect(solveTriangleFromSSS(3, -4, 5).isValid).toBe(false);
  });
});
