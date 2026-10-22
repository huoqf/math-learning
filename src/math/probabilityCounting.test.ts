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
  buildGroupingItems,
  buildAdditionTree,
  buildMultiplicationTree,
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

  it("decision trees and boundary conditions", () => {
    // 边界与非法参数
    expect(factorial(-1)).toBe(0);
    expect(perm(3, 5)).toBe(0);
    expect(perm(-1, 2)).toBe(0);
    expect(comb(3, 5)).toBe(0);
    expect(comb(-1, 2)).toBe(0);

    // 乘法原理树: 2步 * 3步 = 6 个末端叶子
    const multiTree = buildMultiplicationTree(2, 3);
    expect(multiTree.nodes.length).toBe(1 + 2 + 6);
    expect(multiTree.edges.length).toBe(2 + 6);

    // 加法原理树: 类别1(3种) + 类别2(4种) = 7 个选项
    const addTree = buildAdditionTree(3, 4);
    expect(addTree.nodes.length).toBe(1 + 3 + 4);
    expect(addTree.edges.length).toBe(3 + 4);
  });

  it("均分模型：不可整除的 3 帧必须显式退化，禁止静默截断", () => {
    /* 改前 validTotal = floor(N/k)*k：
       (4,3) 截断成 3、(6,4) 截断成 4、(8,3) 截断成 6，
       于是中屏少画球、右屏把滑块的 N 印小、左屏滑块还是原值——三屏撕裂。
       定案是保留滑块全区间（整除性检验本身就是考点），由数学层如实报无解。 */
    const cases = [
      { n: 4, k: 3, remainder: 1 },
      { n: 6, k: 4, remainder: 2 },
      { n: 8, k: 3, remainder: 2 },
    ];
    for (const c of cases) {
      const info = calculateGroupingAllocation(c.n, c.k);
      expect(info.isDivisible, `(${c.n},${c.k}) 应判为不可均分`).toBe(false);
      expect(info.validity).toBe("not_divisible");
      expect(info.remainder).toBe(c.remainder);
      // 关键回归：totalItems 必须如实等于滑块值，不得回填成截断后的数
      expect(info.totalItems).toBe(c.n);
      expect(info.itemsPerGroup).toBe(0);
      expect(info.directCombinationWays).toBe(0);
      expect(info.groupedWays).toBe(0);
      expect(info.allocatedWays).toBe(0);
      // 中屏元素库必须全员在场（A~H 共 N 个）
      const items = buildGroupingItems(info);
      expect(items).toHaveLength(c.n);
      expect(items[items.length - 1].label).toBe(String.fromCharCode(64 + c.n));
    }
  });

  it("均分模型：可整除的 6 帧计数不变，元素库长度与 N 一致", () => {
    // [N, k, 每组个数, 逐步组合积, 均分总数]
    const cases: Array<[number, number, number, number, number]> = [
      [4, 2, 2, 6, 3],
      [4, 4, 1, 24, 1],
      [6, 2, 3, 20, 10],
      [6, 3, 2, 90, 15],
      [8, 2, 4, 70, 35],
      [8, 4, 2, 2520, 105],
    ];
    for (const [n, k, m, direct, grouped] of cases) {
      const info = calculateGroupingAllocation(n, k);
      expect(info.isDivisible, `(${n},${k}) 应可均分`).toBe(true);
      expect(info.validity).toBe("valid");
      expect(info.totalItems).toBe(n);
      expect(info.itemsPerGroup).toBe(m);
      expect(info.directCombinationWays).toBe(direct);
      expect(info.groupedWays).toBe(grouped);
      // 定向分配乘回 k! 后回到含序积
      expect(info.allocatedWays).toBe(direct);
      expect(buildGroupingItems(info)).toHaveLength(n);
    }
  });
});
