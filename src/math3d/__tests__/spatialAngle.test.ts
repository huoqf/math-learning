import { describe, it, expect } from "vitest";
import {
  solveCuboidVertices,
  solveSkewLines,
  solveLinePlaneAngle,
  solveDihedralAngle,
  solvePointToPlaneDistance,
} from "../spatialAngle";

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
    const res = solveSkewLines(3, 2, 2, 0.6);
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

  it("正确计算截面 BDE 与底面的二面角及三垂线垂足", () => {
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
});
