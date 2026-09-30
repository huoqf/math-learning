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

  it("零向量时夹角必须判为无定义，不得把占位 0° 当作真实夹角（math/vectorLinear.ts:isAngleDefined）", () => {
    // 推导：夹角以两向量均非零为前提（零向量方向任意）。
    // a = (0, 0) 时 cosθ = a·b / (|a||b|) 分母为 0，公式失效 ⇒ isAngleDefined = false。
    const resZeroA = computeVectorLinear({
      xa: 0,
      ya: 0,
      xb: 1,
      yb: 3,
    });
    expect(resZeroA.normA).toBeCloseTo(0);
    expect(resZeroA.isAngleDefined).toBe(false);
    // 占位值恒为 0，消费方必须先判 isAngleDefined 再播报
    expect(resZeroA.angleDeg).toBe(0);

    const resZeroB = computeVectorLinear({
      xa: 3,
      ya: 1,
      xb: 0,
      yb: 0,
    });
    expect(resZeroB.isAngleDefined).toBe(false);

    // 反向对照：两向量均非零 ⇒ 有定义，且 90° 正交用例精确成立
    const resNormal = computeVectorLinear({
      xa: 3,
      ya: 0,
      xb: 0,
      yb: 4,
    });
    expect(resNormal.isAngleDefined).toBe(true);
    expect(resNormal.angleDeg).toBeCloseTo(90);
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

  it("单位向量化：e = a / |a| 模长恒为 1 且方向不变；零向量无单位向量（math/vectorLinear.ts:unitA）", () => {
    // 推导：e_a = a / |a| ⇒ |e_a| = |a| / |a| = 1，且 e_a = (1/|a|)·a 与 a 同向（系数 1/|a| > 0）。
    // 3-4-5 直角三角形是高考最常考的单位化实例，必须给出精确值而非近似值。
    const res = computeVectorLinear({ xa: 3, ya: 4, xb: 0, yb: 0 });
    expect(res.normA).toBeCloseTo(5);
    expect(res.isUnitADefined).toBe(true);
    expect(res.unitA.x).toBeCloseTo(0.6, 10);
    expect(res.unitA.y).toBeCloseTo(0.8, 10);
    expect(vectorNorm(res.unitA)).toBeCloseTo(1, 10);
    // 还原关系 a = |a| · e_a，证明「单位化只改长度、不改方向」
    expect(res.unitA.x * res.normA).toBeCloseTo(res.a.x, 10);
    expect(res.unitA.y * res.normA).toBeCloseTo(res.a.y, 10);

    // 反向象限：a = (−3, −4) 的 e_a 必须是 (−0.6, −0.8) 而不是取反成正向
    const resNeg = computeVectorLinear({ xa: -3, ya: -4, xb: 2, yb: 1 });
    expect(resNeg.unitA.x).toBeCloseTo(-0.6, 10);
    expect(resNeg.unitA.y).toBeCloseTo(-0.8, 10);

    // 零向量方向任意 ⇒ 不存在单位向量；占位 (0, 0) 的模长是 0 而非 1，必须先判 isUnitADefined
    expect(res.isUnitBDefined).toBe(false);
    expect(res.unitB).toEqual({ x: 0, y: 0 });

    const resZeroA = computeVectorLinear({ xa: 0, ya: 0, xb: 0, yb: 4 });
    expect(resZeroA.isUnitADefined).toBe(false);
    expect(resZeroA.unitA).toEqual({ x: 0, y: 0 });
    // 两个判据相互独立：a 退化不影响 e_b
    expect(resZeroA.isUnitBDefined).toBe(true);
    expect(vectorNorm(resZeroA.unitB)).toBeCloseTo(1, 10);
    expect(resZeroA.unitB.y).toBeCloseTo(1, 10);
  });

  it("两单位向量的数量积恒等于夹角余弦（unitDotProduct === cosθ），任一无定义时取占位 0", () => {
    // e_a · e_b = (a/|a|)·(b/|b|) = (a·b)/(|a||b|) = cosθ —— 单位化在夹角问题中的全部价值所在
    const res = computeVectorLinear({ xa: 3, ya: 4, xb: -4, yb: 3 });
    expect(res.isUnitADefined && res.isUnitBDefined).toBe(true);
    expect(res.dotProduct).toBeCloseTo(0); // 3·(−4) + 4·3 = 0
    expect(res.unitDotProduct).toBeCloseTo(0, 10);
    expect(Math.cos(res.angleRad)).toBeCloseTo(res.unitDotProduct, 10);

    const res2 = computeVectorLinear({ xa: 3, ya: 1, xb: 1, yb: 3 });
    expect(res2.unitDotProduct).toBeCloseTo(
      res2.dotProduct / (res2.normA * res2.normB),
      10,
    );
    expect(res2.unitDotProduct).toBeCloseTo(Math.cos(res2.angleRad), 10);

    // 存在零向量时单位向量不成立，数量积无意义，取占位 0（不得当作 cosθ = 0 解读）
    const resZero = computeVectorLinear({ xa: 0, ya: 0, xb: 1, yb: 3 });
    expect(resZero.unitDotProduct).toBe(0);
    expect(resZero.isUnitADefined).toBe(false);
  });

  it("闭环向量 closingVec = −(λa + μb)：三向量首尾相接必然回到原点（三力平衡的代数表达）", () => {
    // a + b + closingVec = (a + b) − (a + b) = 0
    // 这正是「三力首尾相接构成闭合三角形 ⇔ 三力平衡」的代数量化（必修二 6.4.2）
    const res = computeVectorLinear({
      xa: 4,
      ya: 3,
      xb: 0,
      yb: -3,
      lambda: 1,
      mu: 1,
    });
    expect(res.sumVec.x).toBeCloseTo(4);
    expect(res.sumVec.y).toBeCloseTo(0);
    expect(res.closingVec.x).toBeCloseTo(-4);
    expect(res.closingVec.y).toBeCloseTo(0);

    // 三向量之和恒为 0（首尾相接回到起点）
    expect(res.lambdaA.x + res.muB.x + res.closingVec.x).toBeCloseTo(0, 10);
    expect(res.lambdaA.y + res.muB.y + res.closingVec.y).toBeCloseTo(0, 10);
    // 平衡力与前两向量的合力等大反向
    expect(vectorNorm(res.closingVec)).toBeCloseTo(res.normSum, 10);
  });
});
