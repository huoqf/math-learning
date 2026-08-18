import { describe, it, expect } from "vitest";
import { mathToThree, threeToMath } from "@/math3d/coordinateConvention";
import type { Vec3 } from "@/math3d/vector3";

describe("coordinateConvention - 空间直角坐标系右手系规范", () => {
  it("数学基底向量映射到 Three.js 必须保持行列式为 +1 (严格右手系)", () => {
    // 数学坐标系基向量: i = (1, 0, 0), j = (0, 1, 0), k = (0, 0, 1)
    const e1 = mathToThree({ x: 1, y: 0, z: 0 }); // 映射后: [0, 0, 1]
    const e2 = mathToThree({ x: 0, y: 1, z: 0 }); // 映射后: [1, 0, 0]
    const e3 = mathToThree({ x: 0, y: 0, z: 1 }); // 映射后: [0, 1, 0]

    expect(e1).toEqual([0, 0, 1]);
    expect(e2).toEqual([1, 0, 0]);
    expect(e3).toEqual([0, 1, 0]);

    // 计算三维基矩阵行列式 det([e2, e3, e1])
    // 矩阵每一行:
    // [0, 0, 1]
    // [1, 0, 0]
    // [0, 1, 0]
    // 行列式 = 1 * (1 * 1 - 0 * 0) = +1 (保手性刚体旋转)
    const det =
      e1[0] * (e2[1] * e3[2] - e2[2] * e3[1]) -
      e1[1] * (e2[0] * e3[2] - e2[2] * e3[0]) +
      e1[2] * (e2[0] * e3[1] - e2[1] * e3[0]);

    expect(det).toBe(1);
  });

  it("mathToThree 与 threeToMath 互为严格逆映射", () => {
    const original: Vec3 = { x: 2.5, y: -3.8, z: 7.1 };
    const three = mathToThree(original);
    const roundTrip = threeToMath(three[0], three[1], three[2]);

    expect(roundTrip.x).toBeCloseTo(original.x);
    expect(roundTrip.y).toBeCloseTo(original.y);
    expect(roundTrip.z).toBeCloseTo(original.z);
  });
});
