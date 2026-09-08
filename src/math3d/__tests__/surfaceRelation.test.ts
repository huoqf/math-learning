import { describe, it, expect } from "vitest";
import {
  calculateParallelJudgeState,
  calculateParallelIntersectionLines,
  calculatePerpJudgeFamily,
  calculatePerpPropState,
  calculatePyramidPerpModel,
  calculateCubeDiagonalModel,
} from "../surfaceRelation";

describe("surfaceRelation 纯数学计算测试", () => {
  it("面面平行判定：两条相交直线时判定成立", () => {
    const res = calculateParallelJudgeState(true, 0, 2);
    expect(res.isAlphaParallelToBeta).toBe(true);
    expect(res.alphaNormal).toEqual({ x: 0, y: 0, z: 1 });
  });

  it("面面平行判定：两条平行线且发生旋转时判定失败 (反例)", () => {
    const res = calculateParallelJudgeState(false, 30, 2);
    expect(res.isAlphaParallelToBeta).toBe(false);
    expect(res.alphaNormal.z).toBeCloseTo(Math.cos((30 * Math.PI) / 180));
  });

  it("面面平行性质：两交线方向向量始终平行", () => {
    const res = calculateParallelIntersectionLines(2, 45, 30);
    expect(res.distance).toBe(2);
    // 两条线的方向向量一致
    const dirA = {
      x: res.lineAEnd.x - res.lineAStart.x,
      y: res.lineAEnd.y - res.lineAStart.y,
    };
    const dirB = {
      x: res.lineBEnd.x - res.lineBStart.x,
      y: res.lineBEnd.y - res.lineBStart.y,
    };
    expect(dirA.x).toBeCloseTo(dirB.x);
    expect(dirA.y).toBeCloseTo(dirB.y);
  });

  it("面面垂直判定：过垂线的任意平面与底面法向量内积始终为 0", () => {
    for (const deg of [0, 45, 90, 135, 180]) {
      const res = calculatePerpJudgeFamily(deg);
      expect(res.isPerpendicular).toBe(true);
      expect(res.dotProduct).toBe(0);
    }
  });

  it("面面垂直性质：面内直线垂直于交线 (90°) 时垂直于底面，斜交时产生反例", () => {
    const resPerp = calculatePerpPropState(90);
    expect(resPerp.isPerpToAlpha).toBe(true);
    expect(resPerp.linePlaneAngleDeg).toBeCloseTo(90);

    const resOblique = calculatePerpPropState(45);
    expect(resOblique.isPerpToAlpha).toBe(false);
    expect(resOblique.linePlaneAngleDeg).toBeCloseTo(45);
  });

  it("高考四棱锥模型：垂足与高线正确解算", () => {
    const model = calculatePyramidPerpModel(4, 3, 3.5, 0.5);
    expect(model.isOFoot).toBe(true);
    expect(model.O.y).toBe(1.5);
    expect(model.P.z).toBe(3.5);
  });

  it("高考正方体平行截面模型：体对角线被两截面三等分且截面间距正确", () => {
    const cube = calculateCubeDiagonalModel(3);
    expect(cube.diagonalLength).toBeCloseTo(3 * Math.sqrt(3));
    expect(cube.planeDistance).toBeCloseTo(Math.sqrt(3));

    // 验证 M 点在面 AB1C 上且为对角线 1/3 处
    expect(cube.M.x).toBeCloseTo(0.5);
    expect(cube.M.y).toBeCloseTo(-0.5);
    expect(cube.M.z).toBeCloseTo(1.0);

    // 验证 N 点在面 A1C1D 上且为对角线 2/3 处
    expect(cube.N.x).toBeCloseTo(-0.5);
    expect(cube.N.y).toBeCloseTo(0.5);
    expect(cube.N.z).toBeCloseTo(2.0);

    // 验证三等分各段长度均等于 planeDistance
    const distBM = Math.hypot(
      cube.M.x - cube.B.x,
      cube.M.y - cube.B.y,
      cube.M.z - cube.B.z,
    );
    const distMN = Math.hypot(
      cube.N.x - cube.M.x,
      cube.N.y - cube.M.y,
      cube.N.z - cube.M.z,
    );
    const distND1 = Math.hypot(
      cube.D1.x - cube.N.x,
      cube.D1.y - cube.N.y,
      cube.D1.z - cube.N.z,
    );
    expect(distBM).toBeCloseTo(cube.planeDistance);
    expect(distMN).toBeCloseTo(cube.planeDistance);
    expect(distND1).toBeCloseTo(cube.planeDistance);
  });
});
