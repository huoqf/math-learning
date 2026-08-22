import { describe, it, expect } from "vitest";
import {
  calculateRightTrapezoidFolding,
  calculateRectangleDiagonalFolding,
  calculateTriangleAltitudeFolding,
  calculateRhombusFolding,
  buildFoldingPolyhedron,
} from "../folding";

describe("平面图形折叠与翻折二面角 3D 数学解算法库测试", () => {
  it("直角梯形翻折 (trapezoid): alpha = 90° 时 D' 的 3D 坐标与体积", () => {
    const res = calculateRightTrapezoidFolding(4, 3, 3, 90);
    const D_prime = res.points["D'"];

    // a=4, b=3, lenED=1, alpha=90° => D' = (3 + 1*cos90, 0, 1*sin90) = (3, 0, 1)
    expect(D_prime.x).toBeCloseTo(3);
    expect(D_prime.y).toBeCloseTo(0);
    expect(D_prime.z).toBeCloseTo(1);

    // 四棱锥 D'-ABCE 体积 = (1/3) * b * h * z = (1/3) * 3 * 3 * 1 = 3
    expect(res.pyramidVolume).toBeCloseTo(3);
  });

  it("直角梯形翻折 (trapezoid): alpha = 0° 展平态", () => {
    const res = calculateRightTrapezoidFolding(4, 3, 3, 0);
    const D_prime = res.points["D'"];

    // alpha=0° => D' = (3 + 1*cos0, 0, 0) = (4, 0, 0) (即原始 D 点)
    expect(D_prime.x).toBeCloseTo(4);
    expect(D_prime.y).toBeCloseTo(0);
    expect(D_prime.z).toBeCloseTo(0);

    // |D'A| 长度从 (0,0,0) 到 (4,0,0) 为 4
    expect(res.movingSegmentLength).toBeCloseTo(4);
    expect(res.dihedralRays?.vertex).toEqual({ x: 3, y: 0, z: 0 });
    expect(res.normals?.n1).toEqual({ x: 0, y: 0, z: 1 });
  });

  it("矩形对角线翻折 (rectangleDiagonal): 外接球半径恒定 R = L/2 且求解异面垂直临界角", () => {
    const a = 4;
    const b = 3;
    const res90 = calculateRectangleDiagonalFolding(a, b, 90);
    const res45 = calculateRectangleDiagonalFolding(a, b, 45);

    const expectedR = Math.sqrt(a * a + b * b) / 2; // 5 / 2 = 2.5
    expect(res90.circumSphereRadius).toBeCloseTo(expectedR);
    expect(res45.circumSphereRadius).toBeCloseTo(expectedR);

    // 异面直线 A'D ⊥ BC 存在临界角度数
    expect(res90.criticalPerpAlphaDeg).toBeDefined();
    expect(res90.dihedralRays?.vertex).toBeDefined();
  });

  it("等腰三角形高折叠 (triangleAltitude): 变动底边 |BC'| 公式", () => {
    const a = 4;
    const h = 3;
    const res90 = calculateTriangleAltitudeFolding(a, h, 90);

    // alpha = 90° => |BC'| = a * sin(45°) = 4 * (sqrt(2)/2) = 2.8284
    expect(res90.movingSegmentLength).toBeCloseTo(4 * Math.sin(Math.PI / 4));
    expect(res90.dihedralRays?.vertex).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("菱形对角线折叠 (rhombus): 异面直线 A'C 与 BD 恒垂直", () => {
    const res = calculateRhombusFolding(2, 60);
    expect(res.skewLinesAngleDeg).toBe(90);
    expect(res.dihedralRays?.vertex).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("多面体三视图几何体构建 (buildFoldingPolyhedron): 4 种母题面数与顶点数验证", () => {
    const r1 = calculateRightTrapezoidFolding(4, 3, 3, 90);
    const poly1 = buildFoldingPolyhedron(r1);
    expect(poly1.vertices.length).toBe(5);
    expect(poly1.faces.length).toBe(4);

    const r2 = calculateRectangleDiagonalFolding(4, 3, 60);
    const poly2 = buildFoldingPolyhedron(r2);
    expect(poly2.vertices.length).toBe(4);
    expect(poly2.faces.length).toBe(4);

    const r3 = calculateTriangleAltitudeFolding(4, 3, 90);
    const poly3 = buildFoldingPolyhedron(r3);
    expect(poly3.vertices.length).toBe(4);
    expect(poly3.faces.length).toBe(4);

    const r4 = calculateRhombusFolding(3, 75);
    const poly4 = buildFoldingPolyhedron(r4);
    expect(poly4.vertices.length).toBe(4);
    expect(poly4.faces.length).toBe(4);
  });
});
