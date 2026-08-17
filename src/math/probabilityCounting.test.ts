import { describe, it, expect } from "vitest";
import {
  factorial,
  perm,
  comb,
  getPascalTriangle,
  getPascalProperties,
  getBinomialTerm,
  evaluateAssignments,
  getGridPathMatrix,
  calculateGroupingAllocation,
} from "./probabilityCounting";

describe("probabilityCounting math module", () => {
  it("basic combinatorics: factorial, perm, comb", () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(4)).toBe(24);
    expect(perm(5, 2)).toBe(20);
    expect(perm(5, 5)).toBe(120);
    expect(comb(5, 2)).toBe(10);
    expect(comb(6, 3)).toBe(20);
    expect(comb(5, 0)).toBe(1);
  });

  it("Pascal triangle & advanced properties", () => {
    const triangle = getPascalTriangle(4);
    expect(triangle.length).toBe(5);
    expect(triangle[4]).toEqual([1, 4, 6, 4, 1]);

    // n = 4 (偶数), 最大项索引为 2
    const propsEven = getPascalProperties(4, 2);
    expect(propsEven.maxIndices).toEqual([2]);
    expect(propsEven.maxValue).toBe(6);

    // n = 5 (奇数), 最大项索引为 2 和 3
    const propsOdd = getPascalProperties(5, 2);
    expect(propsOdd.maxIndices).toEqual([2, 3]);
    expect(propsOdd.maxValue).toBe(10);

    // 曲棍球棒恒等式验证：C_2^2 + C_3^2 + C_4^2 = 1 + 3 + 6 = 10 = C_5^3
    const hockey = getPascalProperties(4, 2).hockeyStick;
    const sum = hockey.points.reduce((acc, p) => acc + comb(p.r, p.c), 0);
    expect(sum).toBe(comb(hockey.target.r, hockey.target.c));
  });

  it("binomial term computation", () => {
    // (2x + 1)^4 中的第 3 项 (k=2) => C_4^2 * (2x)^2 * 1^2 = 6 * 4 * x^2 = 24 x^2
    const term = getBinomialTerm(4, 2, 2, 1);
    expect(term.binomialCoeff).toBe(6);
    expect(term.termCoeff).toBe(24);
    expect(term.powerA).toBe(2);
    expect(term.powerB).toBe(2);
  });

  it("assignment method evaluation", () => {
    // f(x) = (2x - 1)^3 = 8x^3 - 12x^2 + 6x - 1
    const res = evaluateAssignments(3, 2, -1);
    // f(1) = (2-1)^3 = 1
    expect(res.sum_all.evaluatedValue).toBe(1);
    // f(-1) = (-2-1)^3 = -27
    expect(res.sum_alt.evaluatedValue).toBe(-27);
    // f(0) = (-1)^3 = -1
    expect(res.constant.evaluatedValue).toBe(-1);
    // 偶次项和: (1 + (-27)) / 2 = -13
    expect(res.sum_even.evaluatedValue).toBe(-13);
    // 奇次项和: (1 - (-27)) / 2 = 14
    expect(res.sum_odd.evaluatedValue).toBe(14);
    // 导数赋值法 f'(1) = 3 * 2 * (2-1)^2 = 6
    expect(res.derivative.evaluatedValue).toBe(6);
  });

  it("grid path matrix calculations", () => {
    const grid = getGridPathMatrix(3, 2);
    // (0,0) 到 (3,2) 的总走法 C_5^3 = 10
    expect(grid[2][3].ways).toBe(10);
    // 满足加法原理：N(3,2) = N(2,2) + N(3,1) = 6 + 4 = 10
    expect(grid[2][3].ways).toBe(grid[2][2].ways + grid[1][3].ways);
  });

  it("grouping & allocation calculation with order elimination", () => {
    // 6 本书均分为 3 堆 (每堆 2 本)
    // 逐步选: C_6^2 * C_4^2 * C_2^2 = 15 * 6 * 1 = 90
    // 消序除以 3! = 6 => 均分总数 15
    const groupInfo = calculateGroupingAllocation(6, 3);
    expect(groupInfo.directCombinationWays).toBe(90);
    expect(groupInfo.divisionOrderFactor).toBe(6);
    expect(groupInfo.groupedWays).toBe(15);
    expect(groupInfo.allocatedWays).toBe(90);
  });
});
