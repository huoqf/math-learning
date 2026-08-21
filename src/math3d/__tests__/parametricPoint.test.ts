import { describe, it, expect } from "vitest";
import {
  calculateSinglePointAngle,
  calculateDoublePointDistance,
  calculatePyramidVolumeExtrema,
  calculateSurfacePath,
} from "../parametricPoint";

describe("parametricPoint 纯数学算法单元测试", () => {
  it("单动点二面角与点面距离推导计算", () => {
    const a = 4,
      b = 3,
      c = 3;
    const res = calculateSinglePointAngle(a, b, c, 0.5);

    expect(res.P).toEqual({ x: 4, y: 0, z: 1.5 });
    // nPAC = (-0.5*3*3, 0.5*4*3, 4*3) = (-4.5, 6, 12)
    expect(res.nPAC.x).toBeCloseTo(-4.5);
    expect(res.nPAC.y).toBeCloseTo(6);
    expect(res.nPAC.z).toBeCloseTo(12);

    // 点面距离
    expect(res.distDToPAC).toBeGreaterThan(0);
    expect(res.dihedralDeg).toBeGreaterThan(0);
    expect(res.dihedralDeg).toBeLessThan(90);
  });

  it("动点存在性方程解算 (DP ⊥ AC1 与 目标二面角)", () => {
    // a=3, b=4, c=3 => rawLambda = (16-9)/9 = 7/9 ≈ 0.7778 ∈ [0, 1]
    const resExist = calculateSinglePointAngle(3, 4, 3, 0.5, 45);
    expect(resExist.isPerpExist).toBe(true);
    expect(resExist.lambdaPerpDP_AC1).toBeCloseTo(0.7778, 3);
    expect(resExist.perpTargetP.z).toBeCloseTo((7 / 9) * 3);

    // 目标二面角 θ0 = 45° (tan45° = 1)
    // rawLambdaTarget = (3 * 4 * 1) / (3 * sqrt(9+16)) = 12 / 15 = 0.8 ∈ [0, 1] => 存在!
    expect(resExist.isTargetDihedralExist).toBe(true);
    expect(resExist.lambdaTargetDihedral).toBeCloseTo(0.8);
    expect(resExist.dihedralTargetP.z).toBeCloseTo(0.8 * 3);

    // a=4, b=3, c=3 => rawLambda = (9-16)/9 = -7/9 < 0 => 不存在
    const resNotExist = calculateSinglePointAngle(4, 3, 3, 0.5);
    expect(resNotExist.isPerpExist).toBe(false);
    expect(resNotExist.lambdaPerpDP_AC1).toBeNull();
    expect(resNotExist.perpTargetP.z).toBeLessThan(0);
  });

  it("双动点公垂线与向量最值解算", () => {
    const a = 4,
      b = 3,
      c = 3;
    const res = calculateDoublePointDistance(a, b, c, 0, 0.64);

    // optimalMu = 16 / (16 + 9) = 16/25 = 0.64
    expect(res.optimalMu).toBeCloseTo(0.64);
    // minDistSkew = 12 / 5 = 2.4
    expect(res.minDistSkew).toBeCloseTo(2.4);
    expect(res.optimalFootOnBB1).toEqual({ x: 4, y: 0, z: 0 });
    expect(res.optimalFootOnAC).toEqual({ x: 2.56, y: 1.92, z: 0 });
  });

  it("动点三棱锥体积极值与高线计算", () => {
    const a = 4,
      b = 3,
      c = 3;
    const res = calculatePyramidVolumeExtrema(a, b, c, 0.5);

    // baseArea = 0.5 * 4 * 3 = 6
    expect(res.baseAreaACD).toBeCloseTo(6);
    // height = 0.5 * 3 = 1.5
    expect(res.heightH).toBeCloseTo(1.5);
    // volume = 1/3 * 6 * 1.5 = 3
    expect(res.volumePACD).toBeCloseTo(3);
    // maxVolume = 1/6 * 4 * 3 * 3 = 6
    expect(res.maxVolumePACD).toBeCloseTo(6);
  });

  it("表面沿面展开最短路径计算", () => {
    const a = 4,
      b = 3,
      c = 3;
    const res = calculateSurfacePath(a, b, c, 0.5);

    // 路径 1: sqrt((4+3)^2 + 3^2) = sqrt(49+9) = sqrt(58) ≈ 7.6158
    expect(res.path1Length).toBeCloseTo(Math.sqrt(58));
    // 最优 lambda1 = 4 / 7 ≈ 0.5714
    expect(res.optimalLambda1).toBeCloseTo(4 / 7);
    expect(res.globalMinLength).toBeLessThanOrEqual(res.currentPathLength);
  });
});
