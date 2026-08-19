import { describe, it, expect } from "vitest";
import {
  solveBasisCoefficients,
  computeTripleProduct,
  calculateParallelepipedVertices,
  checkCoplanarCondition,
  getPresetBasisVectors,
  calculateBasisVectorNorm,
  projectPointOnPlaneABC,
  getSolidFrameworkEdges,
} from "../basis";
import type { Vec3 } from "../vector3";

describe("3D 空间向量基底分解与共面检验数学纯函数测试", () => {
  const vecA: Vec3 = { x: 2, y: 0, z: 0 };
  const vecB: Vec3 = { x: 0, y: 2, z: 0 };
  const vecC: Vec3 = { x: 0, y: 0, z: 2 };

  it("当基底正交时，应能精准解算线性分解系数 x, y, z", () => {
    const P: Vec3 = { x: 3, y: 4, z: 5 }; // P = 1.5*A + 2*B + 2.5*C
    const res = solveBasisCoefficients(vecA, vecB, vecC, P);
    expect(res.isValid).toBe(true);
    expect(res.x).toBeCloseTo(1.5);
    expect(res.y).toBeCloseTo(2.0);
    expect(res.z).toBeCloseTo(2.5);
  });

  it("当基底为一般非正交向量时，应仍能用克拉默法则精准求解", () => {
    const a: Vec3 = { x: 1, y: 1, z: 0 };
    const b: Vec3 = { x: 0, y: 1, z: 1 };
    const c: Vec3 = { x: 1, y: 0, z: 1 };
    // P = 2*a + 3*b - 1*c = (2*1+0-1, 2*1+3*1-0, 0+3*1-1*1) = (1, 5, 2)
    const P: Vec3 = { x: 1, y: 5, z: 2 };
    const res = solveBasisCoefficients(a, b, c, P);
    expect(res.isValid).toBe(true);
    expect(res.x).toBeCloseTo(2);
    expect(res.y).toBeCloseTo(3);
    expect(res.z).toBeCloseTo(-1);
  });

  it("当基底向量共面时，应正确识别出退化 (isValid = false)", () => {
    const a: Vec3 = { x: 1, y: 0, z: 0 };
    const b: Vec3 = { x: 0, y: 1, z: 0 };
    const cCoplanar: Vec3 = { x: 2, y: 3, z: 0 }; // 在 xy 平面上，与 a, b 共面
    const det = computeTripleProduct(a, b, cCoplanar);
    expect(Math.abs(det)).toBeLessThan(1e-5);

    const res = solveBasisCoefficients(a, b, cCoplanar, { x: 1, y: 1, z: 1 });
    expect(res.isValid).toBe(false);
  });

  it("应准确计算平行六面体 8 个顶点的坐标", () => {
    const vertices = calculateParallelepipedVertices(vecA, vecB, vecC, 1, 1, 1);
    expect(vertices.O).toEqual({ x: 0, y: 0, z: 0 });
    expect(vertices.xa).toEqual({ x: 2, y: 0, z: 0 });
    expect(vertices.yb).toEqual({ x: 0, y: 2, z: 0 });
    expect(vertices.zc).toEqual({ x: 0, y: 0, z: 2 });
    expect(vertices.P).toEqual({ x: 2, y: 2, z: 2 });
  });

  it("应准确判定四点共面条件 x+y+z=1 及其几何意义", () => {
    const info1 = checkCoplanarCondition(0.5, 0.3, 0.2); // sum = 1
    expect(info1.isCoplanar).toBe(true);
    expect(info1.isInsideTriangle).toBe(true);
    expect(info1.spatialRegion).toBe("plane_inside");

    const infoCentroid = checkCoplanarCondition(0.333, 0.333, 0.334);
    expect(infoCentroid.isCentroid).toBe(true);

    const infoOutside = checkCoplanarCondition(1.5, -0.2, -0.3); // sum = 1 但有负数
    expect(infoOutside.isCoplanar).toBe(true);
    expect(infoOutside.isInsideTriangle).toBe(false);
    expect(infoOutside.spatialRegion).toBe("plane_outside");

    const infoTetra = checkCoplanarCondition(0.2, 0.2, 0.2); // sum = 0.6 < 1
    expect(infoTetra.isInsideTetrahedron).toBe(true);
    expect(infoTetra.spatialRegion).toBe("tetra_inside");
  });

  it("应准确获取典型几何体基底并进行基底法模长计算", () => {
    const cubeBasis = getPresetBasisVectors("cube");
    const normRes = calculateBasisVectorNorm(
      cubeBasis.a,
      cubeBasis.b,
      cubeBasis.c,
      1,
      1,
      1,
    );
    // |P|^2 = 1^2*4 + 1^2*4 + 1^2*4 = 12
    expect(normRes.modulusSq).toBeCloseTo(12);
    expect(normRes.modulus).toBeCloseTo(Math.sqrt(12));

    const cubeEdges = getSolidFrameworkEdges(
      "cube",
      cubeBasis.a,
      cubeBasis.b,
      cubeBasis.c,
    );
    expect(cubeEdges.length).toBe(12);

    const tetraBasis = getPresetBasisVectors("tetrahedron");
    const tetraEdges = getSolidFrameworkEdges(
      "tetrahedron",
      tetraBasis.a,
      tetraBasis.b,
      tetraBasis.c,
    );
    expect(tetraEdges.length).toBe(6);
  });

  it("应准确计算点到平面 ABC 的投影与距离", () => {
    const A: Vec3 = { x: 1, y: 0, z: 0 };
    const B: Vec3 = { x: 0, y: 1, z: 0 };
    const C: Vec3 = { x: 0, y: 0, z: 1 };
    // 平面方程为 x + y + z = 1
    const P1: Vec3 = { x: 1 / 3, y: 1 / 3, z: 1 / 3 }; // 恰在平面上
    const proj1 = projectPointOnPlaneABC(P1, A, B, C);
    expect(proj1.distance).toBeCloseTo(0);
    expect(proj1.projectedPoint.x).toBeCloseTo(1 / 3);

    const P2: Vec3 = { x: 0, y: 0, z: 0 }; // 原点到平面的距离为 1/sqrt(3) ≈ 0.57735
    const proj2 = projectPointOnPlaneABC(P2, A, B, C);
    expect(proj2.distance).toBeCloseTo(1 / Math.sqrt(3));
  });
});
