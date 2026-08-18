import { describe, it, expect } from "vitest";
import {
  calculateSumDiff,
  calculateDoubleAngle,
  calculateAuxiliary,
} from "./trigFormulas";

describe("trigFormulas 纯数学模型测试", () => {
  it("calculateSumDiff: 两角和差计算与点积几何", () => {
    const resCosMinus = calculateSumDiff(60, 30, "cos_minus");
    expect(resCosMinus.resultVal).toBeCloseTo(Math.cos(Math.PI / 6), 5);
    expect(resCosMinus.dotProduct).toBeCloseTo(Math.cos(Math.PI / 6), 5);
    expect(resCosMinus.chordLength).toBeCloseTo(
      Math.sqrt(2 - 2 * Math.cos(Math.PI / 6)),
      5,
    );

    const resTanPlus = calculateSumDiff(45, 30, "tan_plus");
    expect(resTanPlus.isTanDefined).toBe(true);
    expect(resTanPlus.resultVal).toBeCloseTo(Math.tan((75 * Math.PI) / 180), 4);
  });

  it("calculateDoubleAngle: 二倍角与升降幂计算", () => {
    const resSin2a = calculateDoubleAngle(30, "sin_2a");
    expect(resSin2a.sin2Alpha).toBeCloseTo(Math.sin(Math.PI / 3), 5);
    expect(resSin2a.cos2Alpha).toBeCloseTo(Math.cos(Math.PI / 3), 5);

    const resPower = calculateDoubleAngle(45, "sin2_a");
    expect(resPower.sinSqAlpha).toBeCloseTo(0.5, 5);
    expect(resPower.period).toBe(Math.PI);
    expect(resPower.baseline).toBe(0.5);
  });

  it("calculateAuxiliary: 辅助角四象限判定与振幅", () => {
    // 第一象限 (1, √3) -> 2sin(x + 60°)
    const aux1 = calculateAuxiliary(1, Math.sqrt(3));
    expect(aux1.amplitude).toBeCloseTo(2.0, 4);
    expect(aux1.phiDeg).toBeCloseTo(60, 1);
    expect(aux1.quadrantStr).toBe("第一象限");
    expect(aux1.isDegenerate).toBe(false);

    // 第二象限 (-1, √3) -> 2sin(x + 120°)
    const aux2 = calculateAuxiliary(-1, Math.sqrt(3));
    expect(aux2.amplitude).toBeCloseTo(2.0, 4);
    expect(aux2.phiDeg).toBeCloseTo(120, 1);
    expect(aux2.quadrantStr).toBe("第二象限");

    // 退化状态 (0, 0)
    const auxDegenerate = calculateAuxiliary(0, 0);
    expect(auxDegenerate.isDegenerate).toBe(true);
    expect(auxDegenerate.amplitude).toBe(0);
  });
});
