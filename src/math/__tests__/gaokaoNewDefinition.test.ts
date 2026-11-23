import { describe, expect, it } from "vitest";
import {
  calcDivisibleSequence,
  calcFixedPointIter,
  calcManhattanGeom,
} from "../gaokaoNewDefinition";

describe("gaokaoNewDefinition 纯数学计算", () => {
  it("可分数列 (6, i, j) 严格符合 2024 新课标 I 卷 19 题结论", () => {
    // m=1 时 {1..6} 删 (1,2),(1,6),(5,6) 均为可分数列，删 (1,4) 不可分
    expect(calcDivisibleSequence(1, 1, 2).isDivisible).toBe(true);
    expect(calcDivisibleSequence(1, 1, 6).isDivisible).toBe(true);
    expect(calcDivisibleSequence(1, 5, 6).isDivisible).toBe(true);
    expect(calcDivisibleSequence(1, 1, 4).isDivisible).toBe(false);

    // m=2 时，删 (1,2) 或 (1,10) 必可划分出 2 个等差四元组
    const resM2 = calcDivisibleSequence(2, 1, 10);
    expect(resM2.isDivisible).toBe(true);
    expect(resM2.groups.length).toBe(2);
  });

  it("不动点迭代稳定性判定正确", () => {
    const attract = calcFixedPointIter(2.4, 0.2, 8);
    expect(attract.stability).toBe("attracting");
    expect(attract.fixedPoint).toBeCloseTo(1 - 1 / 2.4, 6);

    const period = calcFixedPointIter(3.2, 0.2, 8);
    expect(period.stability).toBe("repelling_or_periodic");
  });

  it("曼哈顿圆面积与欧氏圆面积计算准确", () => {
    const res = calcManhattanGeom(0, 0, 2, 2);
    expect(res.manhattanArea).toBe(8);
    expect(res.euclideanArea).toBeCloseTo(4 * Math.PI, 6);
    expect(res.diamondVertices.length).toBe(4);
  });
});
