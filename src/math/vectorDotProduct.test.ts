import { describe, it, expect } from "vitest";
import { computeVectorDotProduct, vectorNorm } from "./vectorDotProduct";

describe("平面向量数量积与几何投影 (vectorDotProduct)", () => {
  it("应准确计算非零向量的模长与夹角", () => {
    const v = { x: 3, y: 4 };
    expect(vectorNorm(v)).toBe(5);

    const res = computeVectorDotProduct({ xa: 3, ya: 0, xb: 0, yb: 4 });
    expect(res.normA).toBe(3);
    expect(res.normB).toBe(4);
    expect(res.dotProduct).toBe(0);
    expect(res.angleDeg).toBe(90);
    expect(res.angleType).toBe("right");
    expect(res.isPerpendicular).toBe(true);
  });

  it("应准确计算锐角与钝角的数量积及几何投影", () => {
    // 锐角 45度
    const acuteRes = computeVectorDotProduct({ xa: 4, ya: 0, xb: 2, yb: 2 });
    expect(acuteRes.dotProduct).toBe(8);
    expect(acuteRes.angleType).toBe("acute");
    expect(acuteRes.scalarProjBtoA).toBe(2); // 8 / 4 = 2
    expect(acuteRes.projVecBtoA).toEqual({ x: 2, y: 0 });

    // 钝角
    const obtuseRes = computeVectorDotProduct({ xa: 4, ya: 0, xb: -2, yb: 2 });
    expect(obtuseRes.dotProduct).toBe(-8);
    expect(obtuseRes.angleType).toBe("obtuse");
    expect(obtuseRes.scalarProjBtoA).toBe(-2);
    expect(obtuseRes.projVecBtoA).toEqual({ x: -2, y: 0 });
  });

  it("应准确判定同向共线 (0°) 与反向共线 (180°)", () => {
    // 1. 同向共线: a = (3, 0), b = (5, 0)
    const resSame = computeVectorDotProduct({ xa: 3, ya: 0, xb: 5, yb: 0 });
    expect(resSame.angleType).toBe("zero");
    expect(resSame.angleDeg).toBeCloseTo(0);
    expect(resSame.dotProduct).toBeCloseTo(15);
    expect(resSame.scalarProjBtoA).toBeCloseTo(5);

    // 2. 反向共线: a = (4, 0), b = (-3, 0)
    const resOpp = computeVectorDotProduct({ xa: 4, ya: 0, xb: -3, yb: 0 });
    expect(resOpp.angleType).toBe("pi");
    expect(resOpp.angleDeg).toBeCloseTo(180);
    expect(resOpp.dotProduct).toBeCloseTo(-12);
    expect(resOpp.scalarProjBtoA).toBeCloseTo(-3);
  });

  it("应支持极坐标几何定义模式 (usePolarGeom)", () => {
    const res = computeVectorDotProduct({
      usePolarGeom: true,
      normA: 6,
      normB: 4,
      thetaDeg: 60,
    });

    expect(res.normA).toBeCloseTo(6);
    expect(res.normB).toBeCloseTo(4);
    expect(res.angleDeg).toBeCloseTo(60);
    expect(res.angleType).toBe("acute");
    // a · b = |a||b|cos(60°) = 6 * 4 * 0.5 = 12
    expect(res.dotProduct).toBeCloseTo(12);
    // 投影值 = 12 / 6 = 2
    expect(res.scalarProjBtoA).toBeCloseTo(2);
  });

  it("应满足平行四边形对角线恒等式 (|a+b|^2 + |a-b|^2 = 2(|a|^2 + |b|^2))", () => {
    const res = computeVectorDotProduct({ xa: 3, ya: 2, xb: -1, yb: 4 });
    const sumSquares = res.normSum2 + res.normDiff2;
    const expected = 2 * (res.normA2 + res.normB2);
    expect(sumSquares).toBeCloseTo(expected);
  });

  it("应准确计算极化恒等式中点平方差与平行四边形公式", () => {
    const res = computeVectorDotProduct({ xa: 4, ya: 0, xb: 0, yb: 4 });
    // dotProduct = 0
    // sumVec = (4, 4), normSum2 = 32
    // diffVec = (4, -4), normDiff2 = 32
    // polarizationVal = 1/4 * (32 - 32) = 0
    expect(res.polarizationVal).toBe(0);
    expect(res.polarizationMidVal).toBe(0);
    expect(res.midpointM).toEqual({ x: 2, y: 2 });
    expect(res.normOM).toBeCloseTo(Math.hypot(2, 2));
  });

  it("零向量边界保护", () => {
    const zeroRes = computeVectorDotProduct({ xa: 0, ya: 0, xb: 3, yb: 4 });
    expect(zeroRes.normA).toBe(0);
    expect(zeroRes.dotProduct).toBe(0);
    expect(zeroRes.angleType).toBe("zero");
    expect(zeroRes.scalarProjBtoA).toBe(0);
    expect(zeroRes.projVecBtoA).toEqual({ x: 0, y: 0 });
  });
});
