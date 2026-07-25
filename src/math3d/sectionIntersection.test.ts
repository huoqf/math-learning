import { describe, it, expect } from "vitest";
import {
  buildCuboidPolyhedron,
  buildRegularPyramidPolyhedron,
  intersectConvexPolyhedronPlane,
  intersectRotationSolidPlane,
} from "./sectionIntersection";
import {
  cylinderProfile,
  coneProfile,
  sphereProfile,
} from "./rotationProfiles";
import type { Plane } from "./plane";

describe("intersectConvexPolyhedronPlane", () => {
  it("长方体被水平面在中间高度截开：截面应为与底面全等的矩形", () => {
    const poly = buildCuboidPolyhedron(2, 3, 4);
    const plane: Plane = {
      point: { x: 0, y: 0, z: 2 },
      normal: { x: 0, y: 0, z: 1 },
    };
    const section = intersectConvexPolyhedronPlane(poly, plane);
    expect(section.length).toBe(4);
    for (const p of section) expect(p.z).toBeCloseTo(2, 5);
    const xs = section.map((p) => p.x);
    const ys = section.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2, 5);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(3, 5);
  });

  it("正四棱锥被半高水平面截开：截面应为缩小一半的相似矩形", () => {
    const poly = buildRegularPyramidPolyhedron(4, 2, 4);
    const plane: Plane = {
      point: { x: 0, y: 0, z: 2 },
      normal: { x: 0, y: 0, z: 1 },
    };
    const section = intersectConvexPolyhedronPlane(poly, plane);
    expect(section.length).toBe(4);
    const dists = section.map((p) => Math.hypot(p.x, p.y));
    for (const d of dists) expect(d).toBeCloseTo(1, 5);
  });

  it("平面完全不与长方体相交时返回空数组", () => {
    const poly = buildCuboidPolyhedron(2, 2, 2);
    const plane: Plane = {
      point: { x: 0, y: 0, z: 10 },
      normal: { x: 0, y: 0, z: 1 },
    };
    expect(intersectConvexPolyhedronPlane(poly, plane)).toEqual([]);
  });
});

describe("intersectRotationSolidPlane", () => {
  it("圆柱被水平面截开：截面应为半径不变的圆", () => {
    const profile = cylinderProfile(2, 5);
    const plane: Plane = {
      point: { x: 0, y: 0, z: 2.5 },
      normal: { x: 0, y: 0, z: 1 },
    };
    const { points } = intersectRotationSolidPlane(profile, plane);
    for (const p of points) {
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(2, 4);
      expect(p.z).toBeCloseTo(2.5, 4);
    }
  });

  it("圆柱被斜面截开：截面应为椭圆", () => {
    const profile = cylinderProfile(1, 5);
    const tilt = Math.PI / 6;
    const plane: Plane = {
      point: { x: 0, y: 0, z: 2.5 },
      normal: {
        x: Math.sin(tilt),
        y: 0,
        z: Math.cos(tilt),
      },
    };
    const { points } = intersectRotationSolidPlane(profile, plane, 200);
    // 所有点应在平面上
    for (const p of points) {
      const d =
        (p.x - plane.point.x) * plane.normal.x +
        (p.y - plane.point.y) * plane.normal.y +
        (p.z - plane.point.z) * plane.normal.z;
      expect(d).toBeCloseTo(0, 4);
    }
    // 截面应有足够多点（椭圆闭合曲线）
    expect(points.length).toBeGreaterThan(50);
  });

  it("圆锥被水平面截开：截面圆半径应按高度线性缩小", () => {
    const profile = coneProfile(4, 8);
    const plane: Plane = {
      point: { x: 0, y: 0, z: 4 },
      normal: { x: 0, y: 0, z: 1 },
    };
    const { points } = intersectRotationSolidPlane(profile, plane);
    for (const p of points) expect(Math.hypot(p.x, p.y)).toBeCloseTo(2, 3);
  });

  it("球被水平面截开：截面圆半径符合勾股定理", () => {
    const profile = sphereProfile(3);
    const d = 1.5;
    const plane: Plane = {
      point: { x: 0, y: 0, z: d },
      normal: { x: 0, y: 0, z: 1 },
    };
    const { points } = intersectRotationSolidPlane(profile, plane, 200);
    const expected = Math.sqrt(3 * 3 - d * d);
    for (const p of points)
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(expected, 2);
  });
});
