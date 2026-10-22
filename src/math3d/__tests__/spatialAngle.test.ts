import { describe, it, expect } from "vitest";
import {
  solveCuboidVertices,
  solveSkewLines,
  solveLinePlaneAngle,
  solveDihedralAngle,
  solvePointToPlaneDistance,
} from "../spatialAngle";
import { buildSpatialAnglePanel } from "@/data/builders/solidSpatialAngle";

describe("spatialAngle 空间角与距离数学求解器测试（新高考母题规范）", () => {
  it("正确求解长方体顶点坐标与动点约束", () => {
    const vertices = solveCuboidVertices(3, 2, 2, 0.6);
    expect(vertices.A).toEqual({ x: 0, y: 0, z: 0 });
    expect(vertices.B).toEqual({ x: 3, y: 0, z: 0 });
    expect(vertices.C).toEqual({ x: 3, y: 2, z: 0 });
    expect(vertices.D).toEqual({ x: 0, y: 2, z: 0 });
    expect(vertices.A1).toEqual({ x: 0, y: 0, z: 2 });
    expect(vertices.B1).toEqual({ x: 3, y: 0, z: 2 });
    expect(vertices.E).toEqual({ x: 0, y: 0, z: 1.2 });
  });

  it("正确计算长方体面对角线 A1B 与 AC 的异面直线角与平移模型", () => {
    const res = solveSkewLines(3, 2, 2);
    expect(res.u).toEqual({ x: 3, y: 0, z: -2 });
    expect(res.v).toEqual({ x: 3, y: 2, z: 0 });
    expect(res.uParallel).toEqual({ x: 3, y: 0, z: -2 });
    expect(res.cosTheta).toBeCloseTo(9 / (Math.sqrt(13) * Math.sqrt(13)), 4);
    expect(res.angleDeg).toBeGreaterThan(0);
    expect(res.angleDeg).toBeLessThanOrEqual(90);
    expect(res.distance).toBeGreaterThan(0);

    // 验证公垂线段 P1P2 与两条异面直线严格正交
    const P1P2 = {
      x: res.P2.x - res.P1.x,
      y: res.P2.y - res.P1.y,
      z: res.P2.z - res.P1.z,
    };
    const dotU = P1P2.x * res.u.x + P1P2.y * res.u.y + P1P2.z * res.u.z;
    const dotV = P1P2.x * res.v.x + P1P2.y * res.v.y + P1P2.z * res.v.z;
    expect(dotU).toBeCloseTo(0, 6);
    expect(dotV).toBeCloseTo(0, 6);
    const lenP1P2 = Math.sqrt(
      P1P2.x * P1P2.x + P1P2.y * P1P2.y + P1P2.z * P1P2.z,
    );
    expect(lenP1P2).toBeCloseTo(res.distance, 6);
  });

  it("正确计算体对角斜线 EC 与底面 ABCD 的线面角", () => {
    const res = solveLinePlaneAngle(3, 2, 2, 0.6);
    expect(res.lineVector).toEqual({ x: -3, y: -2, z: 1.2 });
    expect(res.projectionVector).toEqual({ x: -3, y: -2, z: 0 });
    expect(res.sinTheta).toBeCloseTo(1.2 / Math.sqrt(9 + 4 + 1.44), 4);
    expect(res.angleDeg).toBeGreaterThan(0);
    expect(res.angleDeg).toBeLessThan(90);
    expect(res.normalAngleDeg + res.angleDeg).toBeCloseTo(90, 4);
  });

  it("正确计算截面 BDE 与底面的二面角及垂足 M", () => {
    const res = solveDihedralAngle(3, 2, 2, 0.6);
    expect(res.n1).toEqual({ x: 0, y: 0, z: 1 });
    expect(res.n2Raw).toEqual({ x: 2 * 1.2, y: 3 * 1.2, z: 6 });
    expect(res.cosTheta).toBeGreaterThan(0);
    expect(res.dihedralDeg).toBeGreaterThan(0);
    expect(res.dihedralDeg).toBeLessThan(90);
    expect(res.edgeFootM.z).toBe(0);
    const kAM = res.edgeFootM.y / res.edgeFootM.x;
    expect(kAM).toBeCloseTo(3 / 2, 4);
    expect(res.centroidBase).toEqual({ x: 1, y: 2 / 3, z: 0 });
    expect(res.centroidSection).toEqual({ x: 1, y: 2 / 3, z: 1.2 / 3 });
  });

  it("正确计算点 A 到截面 BDE 的垂直距离与体积极值", () => {
    const res = solvePointToPlaneDistance(3, 2, 2, 0.6);
    expect(res.distance).toBeGreaterThan(0);
    expect(res.volume).toBeCloseTo((1 / 6) * 3 * 2 * 1.2, 4);
    expect(res.maxVolume).toBeCloseTo((1 / 6) * 3 * 2 * 2, 4);
    expect((1 / 3) * res.areaBDE * res.distance).toBeCloseTo(res.volume, 4);
  });

  it("异面直线与线面角数学性质严格满足高中课标值域区间", () => {
    // 改变长方体各向比例验证角度范围
    const testDimensions = [
      { a: 1, b: 1, c: 1, l: 0.2 },
      { a: 5, b: 2, c: 8, l: 0.8 },
      { a: 2, b: 6, c: 3, l: 1.0 },
    ];

    for (const { a, b, c, l } of testDimensions) {
      const skew = solveSkewLines(a, b, c);
      expect(skew.cosTheta).toBeGreaterThanOrEqual(0);
      expect(skew.cosTheta).toBeLessThanOrEqual(1);
      expect(skew.angleDeg).toBeGreaterThan(0);
      expect(skew.angleDeg).toBeLessThanOrEqual(90);

      const linePlane = solveLinePlaneAngle(a, b, c, l);
      expect(linePlane.sinTheta).toBeGreaterThan(0);
      expect(linePlane.sinTheta).toBeLessThanOrEqual(1);
      expect(linePlane.angleDeg).toBeGreaterThan(0);
      expect(linePlane.angleDeg).toBeLessThanOrEqual(90);

      const dihedral = solveDihedralAngle(a, b, c, l);
      expect(dihedral.cosTheta).toBeGreaterThan(0);
      expect(dihedral.dihedralDeg).toBeGreaterThan(0);
      expect(dihedral.dihedralDeg).toBeLessThanOrEqual(90);
    }
  });
});

/**
 * 第二阶段债务 #8：二面角锐钝不再「由图可知」，改为可算的进出方位判定。
 * 三条硬约束：
 *   ① 法向量规则算出的二面角必须与既有 dihedralDeg 逐位吻合；
 *   ② 进出方位判定必须与几何法平面角 ∠PMQ 的独立复算吻合；
 *   ③ 全参数域内不得出现 NaN，也不得出现符号翻转。
 */
describe("二面角锐钝自动判定（法向量进出方位 + 几何法复核）", () => {
  /** 用几何法的 tan 闭式独立复算 cos∠AME，与点积路径完全无关 */
  const cosByTangent = (a: number, b: number, zE: number) => {
    const am = (a * b) / Math.sqrt(a * a + b * b); // 直角三角形 ABD 中 BD 边上的高
    return am / Math.sqrt(am * am + zE * zE);
  };

  it("默认参数：一进一出，法向量规则与几何法同解", () => {
    const res = solveDihedralAngle(3, 2, 2, 0.6);
    expect(res.isNormal1Inward).toBe(true); // n₁=(0,0,1) 指向截面上方，即二面角内部
    expect(res.isNormal2Inward).toBe(false); // n₂ 的 z 分量为正，指向底面上方（外侧）
    expect(res.orientationRelation).toBe("equal");
    expect(res.predictedDihedralDeg).toBeCloseTo(res.dihedralDeg, 6);
    expect(res.isOrientationConsistent).toBe(true);
    expect(res.angleClass).toBe("acute");
    // 法向量夹角本身已是锐角：cos⟨n₁,n₂⟩ = ab/|n₂| > 0
    expect(res.cosNormalSigned).toBeGreaterThan(0);
    expect(res.cosNormalSigned).toBeCloseTo(res.n2.z, 10);
    expect(res.normalAngleDeg).toBeCloseTo(res.dihedralDeg, 6);
  });

  it("几何法复核走的是独立算式：点积路径 cos 必须等于 tan 闭式复算的 cos∠AME", () => {
    const cases = [
      [3, 2, 2, 0.6],
      [5, 2, 8, 0.3],
      [1, 1, 1, 1],
      [2, 6, 3, 0.15],
    ];
    for (const [a, b, c, l] of cases) {
      const res = solveDihedralAngle(a, b, c, l);
      expect(res.cosThetaGeometric).toBeCloseTo(cosByTangent(a, b, res.zE), 9);
      expect(res.cosThetaGeometric).toBeCloseTo(res.cosTheta, 9);
    }
  });

  it("全参数域扫描：不出现 NaN，且法向量规则恒与几何法同解", () => {
    const sides = [1, 2, 3, 4, 5, 6];
    const lambdas = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 1];
    let checked = 0;
    for (const a of sides) {
      for (const b of sides) {
        for (const c of [1, 2, 3, 5, 8]) {
          for (const l of lambdas) {
            const res = solveDihedralAngle(a, b, c, l);
            [
              res.cosTheta,
              res.dihedralDeg,
              res.cosNormalSigned,
              res.normalAngleDeg,
              res.predictedDihedralDeg,
              res.cosThetaGeometric,
            ].forEach((v) => expect(Number.isFinite(v)).toBe(true));

            expect(res.isOrientationConsistent).toBe(true);
            expect(res.predictedDihedralDeg).toBeCloseTo(res.dihedralDeg, 6);
            // 本节截面恒位于底面上方，二面角恒为锐角，不得被误判为钝角
            expect(res.angleClass).toBe("acute");
            expect(res.dihedralDeg).toBeLessThan(90);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBe(6 * 6 * 5 * 7);
  });

  it("进出方位判定的原始点积符号与布尔结论一致（可回退复算）", () => {
    const res = solveDihedralAngle(3, 2, 2, 0.6);
    expect(res.isNormal1Inward).toBe(res.inwardProbe.dot1 > 0);
    expect(res.isNormal2Inward).toBe(res.inwardProbe.dot2 > 0);
    // dot1 = n₁·(G₂ − A) = z_E/3 > 0；dot2 = n₂·(G₁ − B) < 0，两者反号 ⇒ 一进一出
    expect(res.inwardProbe.dot1).toBeCloseTo(res.zE / 3, 10);
    expect(res.inwardProbe.dot2).toBeLessThan(0);
  });

  it("看板与推导链彻底删除「由图判定正负」，并给出可算的分段式", () => {
    const panel = buildSpatialAnglePanel(
      { a: 3, b: 2, c: 2, lambda: 0.6 },
      { mode: "dihedral" },
    );
    const flat = JSON.stringify(panel);
    expect(flat).not.toContain("由图");
    expect(flat).not.toContain("几何直观");

    const theorem = panel.theorems.find((t) => t.name.includes("钝锐判断"))!;
    expect(theorem.latex).toContain("\\begin{cases}");
    expect(theorem.latex).toContain("一进一出");
    expect(theorem.latex).toContain("同进同出");
    expect(theorem.condition).toContain("无需看图");

    const lastStep = panel.reasoningSteps!.at(-1)!;
    expect(lastStep.title).toContain("点积符号");
    expect(lastStep.latex).toContain("一进一出");
  });
});
