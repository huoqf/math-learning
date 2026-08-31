import { describe, it, expect } from "vitest";
import { calculateVectorOperations } from "../vectorOperations";
import type { Vec3 } from "../vector3";

describe("空间向量坐标运算、数量积与投影数学纯函数测试", () => {
  it("应准确计算空间向量的加减坐标", () => {
    const a: Vec3 = { x: 2, y: 3, z: 1 };
    const b: Vec3 = { x: -1, y: 2, z: 4 };
    const res = calculateVectorOperations(a, b);

    expect(res.sum).toEqual({ x: 1, y: 5, z: 5 });
    expect(res.diff).toEqual({ x: 3, y: 1, z: -3 });
  });

  it("应准确计算空间向量数量积与模长", () => {
    const a: Vec3 = { x: 1, y: 2, z: 2 }; // |a| = 3
    const b: Vec3 = { x: 2, y: -2, z: 1 }; // |b| = 3
    const res = calculateVectorOperations(a, b);

    // a·b = 1*2 + 2*(-2) + 2*1 = 2 - 4 + 2 = 0 (垂直!)
    expect(res.dotProduct).toBe(0);
    expect(res.normA).toBe(3);
    expect(res.normB).toBe(3);
    expect(res.isPerp).toBe(true);
    expect(res.angleDeg).toBeCloseTo(90);
  });

  it("应准确计算正交投影向量与投影数量", () => {
    const a: Vec3 = { x: 4, y: 0, z: 0 }; // 沿 x 轴, |a| = 4
    const b: Vec3 = { x: 3, y: 4, z: 0 }; // 在 xy 平面上
    const res = calculateVectorOperations(a, b);

    // 投影数量 = a·b / |a| = 12 / 4 = 3
    expect(res.projScalar).toBeCloseTo(3);
    // 投影向量 = (3, 0, 0)
    expect(res.projBOnA.x).toBeCloseTo(3);
    expect(res.projBOnA.y).toBeCloseTo(0);
    expect(res.projBOnA.z).toBeCloseTo(0);
  });

  it("应正确判断空间向量共线/平行", () => {
    const a: Vec3 = { x: 1, y: 2, z: 3 };
    const b: Vec3 = { x: -2, y: -4, z: -6 };
    const res = calculateVectorOperations(a, b);

    expect(res.isParallel).toBe(true);
    expect(res.angleDeg).toBeCloseTo(180);
    expect(res.cosTheta).toBeCloseTo(-1);
  });

  it("当空间向量夹角为钝角时，投影数量为负且投影向量与基向量反向", () => {
    const a: Vec3 = { x: 2, y: 0, z: 0 }; // 沿着 +x 轴
    const b: Vec3 = { x: -3, y: 4, z: 0 }; // 夹角为钝角
    const res = calculateVectorOperations(a, b);

    expect(res.dotProduct).toBe(-6);
    expect(res.projScalar).toBeCloseTo(-3);
    expect(res.projBOnA.x).toBeCloseTo(-3);
    expect(res.projBOnA.y).toBeCloseTo(0);
    expect(res.projBOnA.z).toBeCloseTo(0);
    expect(res.angleDeg).toBeGreaterThan(90);
  });
});
