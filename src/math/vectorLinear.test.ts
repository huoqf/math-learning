import { describe, it, expect } from "vitest";
import { computeVectorLinear, vectorNorm } from "./vectorLinear";

describe("平面向量线性运算与共线数学模块 (vectorLinear)", () => {
  it("应正确计算向量模长", () => {
    expect(vectorNorm({ x: 3, y: 4 })).toBeCloseTo(5);
    expect(vectorNorm({ x: 0, y: 0 })).toBe(0);
  });

  it("应正确计算向量加减与数乘，并验证差向量几何方向 (b指向a)", () => {
    const res = computeVectorLinear({
      xa: 3,
      ya: 1,
      xb: 1,
      yb: 3,
      lambda: 2,
      mu: -1,
    });

    // lambdaA = (6, 2), muB = (-1, -3)
    // sumVec = (5, -1)
    expect(res.sumVec.x).toBeCloseTo(5);
    expect(res.sumVec.y).toBeCloseTo(-1);
    // diffVec = a - b = (3-1, 1-3) = (2, -2)
    // 符合高中几何三角形法则：从减向量 b(1,3) 的终点指向被减向量 a(3,1) 的终点
    expect(res.diffVec.x).toBeCloseTo(2);
    expect(res.diffVec.y).toBeCloseTo(-2);
    // 验证差向量平移到 b 的终点时精确到达 a 的终点：(xb + diffX, yb + diffY) == (xa, ya)
    expect(1 + res.diffVec.x).toBeCloseTo(3);
    expect(3 + res.diffVec.y).toBeCloseTo(1);
  });

  it("应正确判定向量共线条件及反向共线", () => {
    // 共线: a = (2, 4), b = (1, 2) => det = 2*2 - 4*1 = 0
    const res1 = computeVectorLinear({
      xa: 2,
      ya: 4,
      xb: 1,
      yb: 2,
    });
    expect(res1.isCollinearAB).toBe(true);
    expect(res1.detAB).toBeCloseTo(0);
    expect(res1.collinearRatio).toBeCloseTo(0.5);

    // 反向共线: a = (2, 4), b = (-4, -8)
    const resRev = computeVectorLinear({
      xa: 2,
      ya: 4,
      xb: -4,
      yb: -8,
    });
    expect(resRev.isCollinearAB).toBe(true);
    expect(resRev.collinearRatio).toBeCloseTo(-2);

    // 不共线: a = (3, 1), b = (1, 3) => det = 3*3 - 1*1 = 8
    const res2 = computeVectorLinear({
      xa: 3,
      ya: 1,
      xb: 1,
      yb: 3,
    });
    expect(res2.isCollinearAB).toBe(false);
  });

  it("应正确验证三点共线定理 (x + y = 1) 及其在线段内外的分布", () => {
    // 1. x = 0.4, y = 0.6 => x + y = 1 且 x>=0, y>=0 => 落在线段 AB 内部
    const res1 = computeVectorLinear({
      xa: 3,
      ya: 1,
      xb: 1,
      yb: 3,
      xCoeff: 0.4,
      yCoeff: 0.6,
    });
    expect(res1.coeffSum).toBeCloseTo(1);
    expect(res1.isThreePointsCollinear).toBe(true);
    expect(res1.isOnSegmentAB).toBe(true);
    expect(res1.pointC.x).toBeCloseTo(0.4 * 3 + 0.6 * 1); // 1.8
    expect(res1.pointC.y).toBeCloseTo(0.4 * 1 + 0.6 * 3); // 2.2

    // 2. x = 1.5, y = -0.5 => x + y = 1 但 y < 0 => 落在 AB 延长线上 (非线段内)
    const resExt = computeVectorLinear({
      xa: 3,
      ya: 1,
      xb: 1,
      yb: 3,
      xCoeff: 1.5,
      yCoeff: -0.5,
    });
    expect(resExt.coeffSum).toBeCloseTo(1);
    expect(resExt.isThreePointsCollinear).toBe(true);
    expect(resExt.isOnSegmentAB).toBe(false);

    // 3. x + y != 1 => 脱离直线 AB
    const res2 = computeVectorLinear({
      xa: 3,
      ya: 1,
      xb: 1,
      yb: 3,
      xCoeff: 0.5,
      yCoeff: 0.8,
    });
    expect(res2.isThreePointsCollinear).toBe(false);
  });

  it("应正确计算平面向量基本定理基底唯一分解及退化防护", () => {
    // 标准基底分解
    const res = computeVectorLinear({
      xa: 1,
      ya: 0,
      xb: 0,
      yb: 1,
      xv: 4,
      yv: 3.5,
    });
    expect(res.isBasisValid).toBe(true);
    expect(res.lambda1).toBeCloseTo(4);
    expect(res.lambda2).toBeCloseTo(3.5);

    // 共线或零向量基底退化防护
    const resDegen = computeVectorLinear({
      xa: 0,
      ya: 0,
      xb: 1,
      yb: 2,
      xv: 4,
      yv: 3.5,
    });
    expect(resDegen.isBasisValid).toBe(false);
  });
});
