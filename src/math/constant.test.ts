import { describe, it, expect } from "vitest";
import {
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantDouble,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
} from "./constant";

describe("solveConstantSingleSep (单变量参变分离)", () => {
  it("正确求解区间内的极值与判定状态", () => {
    // 默认区间 [0.5, 2.5]
    // 静态函数 f(x) = x^2 - 2x + 2, 对称轴在 1.0, 顶点最值 f(1.0) = 1.0
    // 当 a = 0.5 时， 最小值 1.0 >= 0.5，恒成立与存在性都应满足
    const res = solveConstantSingleSep(0.5, 0.5, 2.5);
    expect(res.isValid).toBe(true);
    expect(res.isDegenerate).toBe(false);
    expect(res.fMin).toBe(1.0);
    expect(res.xFMin).toBe(1.0);
    expect(res.isAlwaysTrue).toBe(true);
    expect(res.isExistTrue).toBe(true);
    expect(res.violatedInterval).toBeNull();
  });

  it("当 a 超过极小值时，恒成立判定为 false，并计算违背区间", () => {
    // a = 2.0. 函数 f(x) = x^2 - 2x + 2.
    // 违背区间 f(x) < 2 => x^2 - 2x < 0 => x in (0, 2)
    // 与 [0.5, 2.5] 求交集 => [0.5, 2.0]
    const res = solveConstantSingleSep(2.0, 0.5, 2.5);
    expect(res.isAlwaysTrue).toBe(false);
    expect(res.isExistTrue).toBe(true); // 最大值在 2.5 处是 3.25 >= 2.0
    expect(res.violatedInterval).not.toBeNull();
    expect(res.violatedInterval![0]).toBeCloseTo(0.5);
    expect(res.violatedInterval![1]).toBeCloseTo(2.0);
  });

  it("区间退化检查", () => {
    const res = solveConstantSingleSep(1.0, 2.5, 0.5);
    expect(res.isValid).toBe(false);
    expect(res.isDegenerate).toBe(true);
    expect(res.degenerateType).toBe("interval_collapse");
  });
});

describe("solveConstantSingleDirect (单变量直接最值讨论)", () => {
  it("对称轴在区间内的情况", () => {
    // f(x) = x^2 - 2ax + 2.
    // m = 0.5, n = 2.5, a = 1.0 (对称轴在区间内)
    // 最小值为 f(1) = 2 - 1 = 1.0. 1.0 >= 0, isAlwaysTrue = true
    const res = solveConstantSingleDirect(1.0, 0.5, 2.5);
    expect(res.discussionType).toBe("inside");
    expect(res.fMin).toBe(1.0);
    expect(res.isAlwaysTrue).toBe(true);
    expect(res.violatedInterval).toBeNull();
  });

  it("对称轴在区间外导致跌破 0", () => {
    // a = 2.0. m = 0.5, n = 1.5 (对称轴在右侧外)
    // 最小值在 n = 1.5 取得, f(1.5) = 2.25 - 6 + 2 = -1.75 < 0
    // 违背区间：x^2 - 4x + 2 < 0. delta = 16 - 8 = 8.
    // 根为 2 - sqrt(2) ≈ 0.585, 2 + sqrt(2) ≈ 3.414.
    // 与 [0.5, 1.5] 求交 => [0.5857, 1.5]
    const res = solveConstantSingleDirect(2.0, 0.5, 1.5);
    expect(res.discussionType).toBe("right");
    expect(res.fMin).toBe(-1.75);
    expect(res.isAlwaysTrue).toBe(false);
    expect(res.violatedInterval).not.toBeNull();
    expect(res.violatedInterval![0]).toBeCloseTo(2 - Math.sqrt(2));
    expect(res.violatedInterval![1]).toBeCloseTo(1.5);
  });
});

describe("solveConstantDouble (双变量最值博弈对决)", () => {
  it("测试四种逻辑判定与博弈点提取", () => {
    // f(x) = (x-1)^2 + 2, min=2 (在1.0), I1=[0.5, 2.0]
    // g(x) = -(x-2)^2 + 1, max=1 (在2.0), I2=[1.5, 3.0]
    // f_min = 2, f_max = f(2.0) = 3
    // g_max = 1, g_min = g(3.0) = 0
    const res = solveConstantDouble(
      2,
      1.0,
      0.5,
      2.0,
      1,
      2.0,
      1.5,
      3.0,
      "all_all",
    );
    expect(res.isAllAllTrue).toBe(true); // 2 >= 1
    expect(res.isAllExistTrue).toBe(true); // 2 >= 0
    expect(res.isExistAllTrue).toBe(true); // 3 >= 1
    expect(res.isExistExistTrue).toBe(true); // 3 >= 0

    // 检查博弈对决的两个决定点坐标
    expect(res.battlePointF).toEqual({ x: 1.0, y: 2.0 });
    expect(res.battlePointG).toEqual({ x: 2.0, y: 1.0 });
  });

  it("测试 same_var (同自变量) 逻辑判定与博弈点提取", () => {
    // f(x) = (x-1.25)^2 + 2.5, I1=[0.5, 2.0]
    // g(x) = -(x-2.25)^2 + 1.5, I2=[1.5, 3.0]
    // 交集为 [1.5, 2.0]，差函数对称轴为 1.75
    // 最值在 x = 1.75 处，此时 f(1.75) = 2.75, g(1.75) = 1.25, 差值为 1.5
    const res = solveConstantDouble(
      2.5,
      1.25,
      0.5,
      2.0,
      1.5,
      2.25,
      1.5,
      3.0,
      "same_var",
    );
    expect(res.isSameVarTrue).toBe(true);
    expect(res.sameVarMinDiff).toBeCloseTo(1.5);
    expect(res.sameVarXMin).toBeCloseTo(1.75);
    expect(res.battlePointF).toEqual({ x: 1.75, y: 2.75 });
    expect(res.battlePointG).toEqual({ x: 1.75, y: 1.25 });
  });
});

describe("solveConstantSingleSepTrans (超越函数参变分离)", () => {
  it("正确求解区间内极值及判定状态 (含 x = e 极大值点)", () => {
    // m = 1.0, n = 4.0. 极值点 e = 2.718 在区间内。
    // f(x) = ln(x) / x. 最大值为 f(e) = 1/e ≈ 0.368
    // 最小值为 min(f(1), f(4)) = min(0, ln(4)/4 ≈ 0.347) = 0.
    const res = solveConstantSingleSepTrans(0.2, 1.0, 4.0);
    expect(res.isValid).toBe(true);
    expect(res.fMax).toBeCloseTo(1 / Math.E);
    expect(res.xFMax).toBeCloseTo(Math.E);
    expect(res.fMin).toBe(0);
    expect(res.xFMin).toBe(1.0);
    expect(res.isAlwaysTrue).toBe(false); // 0 < 0.2
    expect(res.isExistTrue).toBe(true); // 0.368 >= 0.2
  });

  it("违背区间计算 (a = 0.35)", () => {
    const res = solveConstantSingleSepTrans(0.35, 1.0, 4.0);
    expect(res.isAlwaysTrue).toBe(false);
    expect(res.violatedInterval).not.toBeNull();
  });
});

describe("solveConstantSingleDirectTrans (超越函数直接讨论)", () => {
  it("极小值点在区间内且恒成立", () => {
    // f(x) = e^x - ax. a = 1.5, ln a = 0.405.
    // 区间 [0, 2.0]. 极小值点 ln a 在区间内.
    // 最小值为 f(ln a) = 1.5 - 1.5 * ln(1.5) ≈ 1.5 - 1.5 * 0.405 = 0.89 > 0.
    const res = solveConstantSingleDirectTrans(1.5, 0, 2.0);
    expect(res.discussionType).toBe("inside");
    expect(res.fMin).toBeCloseTo(1.5 - 1.5 * Math.log(1.5));
    expect(res.isAlwaysTrue).toBe(true);
    expect(res.violatedInterval).toBeNull();
  });

  it("极小值点在区间内但不恒成立，计算违背区间", () => {
    // a = 4.0. ln a ≈ 1.386. 区间 [0, 2.0].
    // f(ln a) = 4 - 4 * ln 4 ≈ -1.54 < 0.
    const res = solveConstantSingleDirectTrans(4.0, 0, 2.0);
    expect(res.isAlwaysTrue).toBe(false);
    expect(res.violatedInterval).not.toBeNull();
  });
});
