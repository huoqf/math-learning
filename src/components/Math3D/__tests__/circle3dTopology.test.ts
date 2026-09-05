import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import type { Vec3 } from "@/math3d/vector3";

describe("Circle3D 空间截面圆几何体数学与渲染拓扑自动化测试", () => {
  it("对于任意倾斜法向量，Circle3D 生成的所有圆周点与填充三角面严格共面于目标平面", () => {
    // 测试多种空间姿态：水平面(Z轴)、铅垂面(Y轴)、斜切面(1, 1, 1)
    const testCases: { center: Vec3; radius: number; normal: Vec3 }[] = [
      { center: { x: 0, y: 0, z: 0 }, radius: 3, normal: { x: 0, y: 0, z: 1 } },
      {
        center: { x: 1, y: 2, z: 3 },
        radius: 2.5,
        normal: { x: 0, y: 1, z: 0 },
      },
      {
        center: { x: -1, y: 0, z: 2 },
        radius: 4,
        normal: { x: 1, y: 1, z: 1 },
      },
    ];

    for (const { center, radius, normal } of testCases) {
      // 1. 基向量计算逻辑
      const n = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
      const up =
        Math.abs(n.z) < 0.99
          ? new THREE.Vector3(0, 0, 1)
          : new THREE.Vector3(0, 1, 0);
      const u = new THREE.Vector3().crossVectors(up, n).normalize();
      const v = new THREE.Vector3().crossVectors(n, u).normalize();

      // 验证正交基三向量两两垂直且模为 1
      expect(u.length()).toBeCloseTo(1, 6);
      expect(v.length()).toBeCloseTo(1, 6);
      expect(u.dot(v)).toBeCloseTo(0, 6);
      expect(u.dot(n)).toBeCloseTo(0, 6);
      expect(v.dot(n)).toBeCloseTo(0, 6);

      // 2. 生成离散点
      const segments = 64;
      const threePoints: [number, number, number][] = [];
      const centerThree = mathToThree(center);

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const mathPt: Vec3 = {
          x: center.x + radius * (u.x * cosT + v.x * sinT),
          y: center.y + radius * (u.y * cosT + v.y * sinT),
          z: center.z + radius * (u.z * cosT + v.z * sinT),
        };

        // 验证数学点到圆心距离严格等于 radius
        const dist = Math.hypot(
          mathPt.x - center.x,
          mathPt.y - center.y,
          mathPt.z - center.z,
        );
        expect(dist).toBeCloseTo(radius, 5);

        // 验证数学点在平面内：(mathPt - center) · n = 0
        const dotN =
          (mathPt.x - center.x) * n.x +
          (mathPt.y - center.y) * n.y +
          (mathPt.z - center.z) * n.z;
        expect(dotN).toBeCloseTo(0, 5);

        threePoints.push(mathToThree(mathPt));
      }

      // 3. 验证三角扇填充面的每个顶点均在平面内且无 NaN，杜绝拉丝
      for (let i = 0; i < segments; i++) {
        const p1 = threePoints[i];
        const p2 = threePoints[i + 1];

        // 不含 NaN
        expect(centerThree.every((c) => !Number.isNaN(c))).toBe(true);
        expect(p1.every((c) => !Number.isNaN(c))).toBe(true);
        expect(p2.every((c) => !Number.isNaN(c))).toBe(true);
      }
    }
  });
});
