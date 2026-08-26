/**
 * src/math/secondDerivative.test.ts
 * 二阶导数、拐点与凹凸性纯数学单测
 */

import { describe, it, expect } from "vitest";
import {
  evalFunction,
  findInflectionPoints,
  findExtremaPoints,
  evalJensen,
} from "./secondDerivative";

describe("secondDerivative 纯数学逻辑测试", () => {
  it("三次函数求值、一阶导与二阶导正确计算", () => {
    // f(x) = x^3 - 3x
    const params = { a: 1, b: 0, c: -3, d: 0, x0: 0, x1: -1, x2: 1 };
    const res = evalFunction("cubic", params, 2);
    // f(2) = 8 - 6 = 2
    expect(res.y).toBe(2);
    // f'(2) = 3(4) - 3 = 9
    expect(res.dy).toBe(9);
    // f''(2) = 6(2) = 12
    expect(res.ddy).toBe(12);
    expect(res.concavity).toBe("concaveUp");
  });

  it("三次函数拐点与对称中心正确解算", () => {
    // f(x) = x^3 - 3x^2 + 2 -> a=1, b=-3, c=0, d=2 => x_inf = -(-3)/(3*1) = 1
    const params = { a: 1, b: -3, c: 0, d: 2, x0: 1, x1: 0, x2: 2 };
    const inflections = findInflectionPoints("cubic", params);
    expect(inflections.length).toBe(1);
    expect(inflections[0].x).toBeCloseTo(1, 4);
    expect(inflections[0].y).toBeCloseTo(0, 4);
    expect(inflections[0].isTrueInflection).toBe(true);
  });

  it("四次函数 f(x)=x^4 在原点二阶导为0但非拐点", () => {
    const params = { a: 1, b: 0, c: 0, d: 0, x0: 0, x1: -1, x2: 1 };
    const inflections = findInflectionPoints("quartic", params);
    expect(inflections.length).toBe(1);
    expect(inflections[0].x).toBe(0);
    expect(inflections[0].isTrueInflection).toBe(false);
  });

  it("极值点由一阶导与二阶导符号判定", () => {
    // f(x) = x^3 - 3x, f'(x) = 3x^2 - 3 = 0 => x = ±1
    // x = -1 极大值, x = 1 极小值
    const params = { a: 1, b: 0, c: -3, d: 0, x0: 0, x1: -1, x2: 1 };
    const extrema = findExtremaPoints("cubic", params);
    expect(extrema.length).toBe(2);
    const maxPt = extrema.find((e) => e.type === "max");
    const minPt = extrema.find((e) => e.type === "min");
    expect(maxPt?.x).toBeCloseTo(-1, 4);
    expect(minPt?.x).toBeCloseTo(1, 4);
  });

  it("琴生不等式中点与割线差值解算", () => {
    // f(x) = x^2 (四次退化或二次: a=0, b=1)
    // 对于下凸函数，弦中点 > 弧中点
    const params = { a: 0, b: 1, c: 0, d: 0, x0: 0, x1: -2, x2: 2 };
    const jensen = evalJensen("quartic", params, -2, 2);
    expect(jensen.xMid).toBe(0);
    expect(jensen.yChordMid).toBe(4);
    expect(jensen.yCurveMid).toBe(0);
    expect(jensen.diff).toBe(4);
    expect(jensen.isConvexUp).toBe(true);
  });
});
