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
