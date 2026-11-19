import { describe, it, expect } from "vitest";
import {
  calcLocusTransfer,
  calcThirdDefinition,
  calcFixedPointModel,
} from "./conicLocusInvariants";

describe("圆锥曲线第三定义、相关点转移与定值定点纯解算 (conicLocusInvariants)", () => {
  it("相关点转移法：圆上任意点按 b/a 纵向压缩后精确落在椭圆上", () => {
    const res = calcLocusTransfer(4, 2.5, 53);
    expect(res.ratio).toBeCloseTo(2.5 / 4, 6);
    expect(res.P.x).toBeCloseTo(res.P0.x, 6);
    expect(res.ellipseResidual).toBeCloseTo(0, 8);
  });

  it("椭圆第三定义：过中心对称点与动点连线斜率积恒为 -b^2/a^2 = e^2 - 1", () => {
    const res = calcThirdDefinition("ellipse", 4, 2, 42);
    expect(res.isValidSlope).toBe(true);
    expect(res.measuredProduct).toBeCloseTo(-0.25, 6);
    expect(res.theoreticalProduct).toBeCloseTo(res.e * res.e - 1, 6);
  });

  it("双曲线第三定义：过实轴顶点与动点连线斜率积恒为 +b^2/a^2 = e^2 - 1", () => {
    const res = calcThirdDefinition("hyperbola", 3, 2, 260);
    expect(res.isValidSlope).toBe(true);
    expect(res.measuredProduct).toBeCloseTo(4 / 9, 5);
    expect(res.theoreticalProduct).toBeCloseTo(res.e * res.e - 1, 6);
  });

  it("标内普通联立过定点：绕 Q 旋转的任意非水平割线均满足 k_PA * k_PB = -1", () => {
    const res1 = calcFixedPointModel(3, 2, 0.4);
    const res2 = calcFixedPointModel(3, 2, -0.9);
    expect(res1.isValid).toBe(true);
    expect(res2.isValid).toBe(true);
    expect(res1.Q.x).toBeCloseTo((3 * (4 - 9)) / (9 + 4), 6);
    expect(res1.slopeProduct).toBeCloseTo(-1, 6);
    expect(res2.slopeProduct).toBeCloseTo(-1, 6);
  });
});
