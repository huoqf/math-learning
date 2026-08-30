import { describe, it, expect } from "vitest";
import {
  calculateSumDiff,
  calculateDoubleAngle,
  calculateAuxiliary,
} from "./trigFormulas";

describe("trigFormulas 纯数学模型测试", () => {
  it("calculateSumDiff: 全部六种和差角公式与几何点积/弦长", () => {
    // 1. cos(alpha - beta): cos(60° - 30°) = cos(30°)
    const resCosMinus = calculateSumDiff(60, 30, "cos_minus");
    expect(resCosMinus.resultVal).toBeCloseTo(Math.cos(Math.PI / 6), 5);
    expect(resCosMinus.dotProduct).toBeCloseTo(Math.cos(Math.PI / 6), 5);
    expect(resCosMinus.chordLength).toBeCloseTo(
      Math.sqrt(2 - 2 * Math.cos(Math.PI / 6)),
      5,
    );

    // 2. cos(alpha + beta): cos(45° + 15°) = cos(60°) = 0.5
    const resCosPlus = calculateSumDiff(45, 15, "cos_plus");
    expect(resCosPlus.resultVal).toBeCloseTo(0.5, 5);

    // 3. sin(alpha + beta): sin(30° + 60°) = sin(90°) = 1.0
    const resSinPlus = calculateSumDiff(30, 60, "sin_plus");
    expect(resSinPlus.resultVal).toBeCloseTo(1.0, 5);

    // 4. sin(alpha - beta): sin(60° - 30°) = sin(30°) = 0.5
    const resSinMinus = calculateSumDiff(60, 30, "sin_minus");
    expect(resSinMinus.resultVal).toBeCloseTo(0.5, 5);

    // 5. tan(alpha + beta): tan(45° + 30°) = tan(75°)
    const resTanPlus = calculateSumDiff(45, 30, "tan_plus");
    expect(resTanPlus.isTanDefined).toBe(true);
    expect(resTanPlus.resultVal).toBeCloseTo(Math.tan((75 * Math.PI) / 180), 4);

    // 6. tan(alpha - beta): tan(60° - 30°) = tan(30°) = 1/√3
    const resTanMinus = calculateSumDiff(60, 30, "tan_minus");
    expect(resTanMinus.isTanDefined).toBe(true);
    expect(resTanMinus.resultVal).toBeCloseTo(1 / Math.sqrt(3), 4);
  });

  it("calculateSumDiff: 正切和差未定义奇异点处理", () => {
    // tan(45° + 45°) = tan(90°), 分母 1 - tan45*tan45 = 0 => 未定义
    const resTanSingular = calculateSumDiff(45, 45, "tan_plus");
    expect(resTanSingular.isTanDefined).toBe(false);
    expect(Number.isNaN(resTanSingular.resultVal)).toBe(true);

    // 单角 90°: tan(90° + 30°) => 未定义
    const resTan90 = calculateSumDiff(90, 30, "tan_plus");
    expect(resTan90.isTanDefined).toBe(false);
  });

  it("calculateDoubleAngle: 全部倍角与降幂公式及奇异点", () => {
    // 1. sin 2a
    const resSin2a = calculateDoubleAngle(30, "sin_2a");
    expect(resSin2a.sin2Alpha).toBeCloseTo(Math.sin(Math.PI / 3), 5);
    expect(resSin2a.cos2Alpha).toBeCloseTo(Math.cos(Math.PI / 3), 5);

    // 2. cos 2a
    const resCos2a = calculateDoubleAngle(30, "cos_2a");
    expect(resCos2a.cos2Alpha).toBeCloseTo(Math.cos(Math.PI / 3), 5);

    // 3. tan 2a
    const resTan2a = calculateDoubleAngle(30, "tan_2a");
    expect(resTan2a.isTanDefined).toBe(true);
    expect(resTan2a.tan2Alpha).toBeCloseTo(Math.tan(Math.PI / 3), 5);

    // 4. tan 2a 奇异点: alpha = 45° (2alpha = 90°)
    const resTan2aSingular = calculateDoubleAngle(45, "tan_2a");
    expect(resTan2aSingular.isTanDefined).toBe(false);

    // 5. 正弦降幂
    const resPowerSin = calculateDoubleAngle(45, "sin2_a");
    expect(resPowerSin.sinSqAlpha).toBeCloseTo(0.5, 5);
    expect(resPowerSin.period).toBe(Math.PI);

    // 6. 余弦降幂: cos^2(30°) = (1 + cos60°)/2 = 0.75
    const resPowerCos = calculateDoubleAngle(30, "cos2_a");
    expect(resPowerCos.cosSqAlpha).toBeCloseTo(0.75, 5);
  });

  it("calculateAuxiliary: 四大象限与坐标轴全覆盖", () => {
    // 第一象限 (1, √3) -> 2sin(x + 60°)
    const aux1 = calculateAuxiliary(1, Math.sqrt(3));
    expect(aux1.amplitude).toBeCloseTo(2.0, 4);
    expect(aux1.phiDeg).toBeCloseTo(60, 1);
    expect(aux1.quadrantStr).toBe("第一象限");

    // 第二象限 (-1, √3) -> 2sin(x + 120°)
    const aux2 = calculateAuxiliary(-1, Math.sqrt(3));
    expect(aux2.amplitude).toBeCloseTo(2.0, 4);
    expect(aux2.phiDeg).toBeCloseTo(120, 1);
    expect(aux2.quadrantStr).toBe("第二象限");

    // 第三象限 (-√3, -1) -> 2sin(x + 210°)
    const aux3 = calculateAuxiliary(-Math.sqrt(3), -1);
    expect(aux3.amplitude).toBeCloseTo(2.0, 4);
    expect(aux3.phiDeg).toBeCloseTo(210, 1);
    expect(aux3.quadrantStr).toBe("第三象限");

    // 第四象限 (1, -1) -> √2 sin(x + 315°)
    const aux4 = calculateAuxiliary(1, -1);
    expect(aux4.amplitude).toBeCloseTo(Math.sqrt(2), 4);
    expect(aux4.phiDeg).toBeCloseTo(315, 1);
    expect(aux4.quadrantStr).toBe("第四象限");

    // y 轴正半轴 (0, 3) -> 3sin(x + 90°)
    const auxAxis = calculateAuxiliary(0, 3);
    expect(auxAxis.amplitude).toBeCloseTo(3.0, 4);
    expect(auxAxis.phiDeg).toBeCloseTo(90, 1);
    expect(auxAxis.quadrantStr).toBe("y 轴正半轴");

    // 退化 (0, 0)
    const auxDegenerate = calculateAuxiliary(0, 0);
    expect(auxDegenerate.isDegenerate).toBe(true);
    expect(auxDegenerate.amplitude).toBe(0);
  });
});
