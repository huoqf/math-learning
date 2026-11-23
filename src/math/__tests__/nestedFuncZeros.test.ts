import { describe, expect, it } from "vitest";
import {
  evalPiecewiseNested,
  evalQuadraticAbs,
  solveNestedEquation,
} from "../nestedFuncZeros";

describe("nestedFuncZeros 纯数学计算", () => {
  it("绝对值二次型 f(x)=|x^2-2x| 在不同水平线 a 下生成阶梯跳变零点数", () => {
    // f(x)=|x^2-2x| 顶点高度为 1，谷底为 0
    // 当 a = 0.5 时：f(t)=0.5 有 4 个根，均在 (0, 1) 或 (>2 或 <0) 之间
    const resMid = solveNestedEquation("quadraticNested", 0.5, 2, 0);
    expect(resMid.outerRoots.length).toBe(4);
    expect(resMid.totalCount).toBeGreaterThanOrEqual(8);
    // 验证每个根满足 f(f(x)) = a
    for (const x of resMid.allRoots) {
      const fx = evalQuadraticAbs(x, 2, 0);
      const ffx = evalQuadraticAbs(fx, 2, 0);
      expect(ffx).toBeCloseTo(0.5, 4);
    }

    // a < 0 时无解
    const resEmpty = solveNestedEquation("quadraticNested", -0.5, 2, 0);
    expect(resEmpty.totalCount).toBe(0);
  });

  it("分段翻折型嵌套方程 f(f(x)) = a 所有实根回代精确成立", () => {
    const res = solveNestedEquation("piecewiseNested", 0.8, 2, 0);
    expect(res.outerRoots.length).toBe(3); // x<=0 有 1 个负根(< -1)，x>0 有 2 个根 e^{-0.8}, e^{0.8}
    expect(res.totalCount).toBeGreaterThanOrEqual(5);
    for (const x of res.allRoots) {
      const ffx = evalPiecewiseNested(evalPiecewiseNested(x, 0), 0);
      expect(ffx).toBeCloseTo(0.8, 4);
    }
  });
});
