import { describe, it, expect } from "vitest";
import {
  planeFromPoints,
  planeAngle,
  linePlaneAngle,
  pointPlaneDistance,
} from "../plane";

describe("plane 空间平面方程与夹角距离纯函数", () => {
  it("planeFromPoints computes correct normal", () => {
    const p = planeFromPoints(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    );
    expect(p.normal.z).toBeCloseTo(1, 5);
    expect(p.normal.x).toBeCloseTo(0, 5);
    expect(p.normal.y).toBeCloseTo(0, 5);
  });

  it("two perpendicular planes have 90° angle", () => {
    const p1 = planeFromPoints(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    );
    const p2 = planeFromPoints(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
    );
    expect(planeAngle(p1, p2)).toBeCloseTo(Math.PI / 2, 5);
  });

  it("parallel planes have 0° angle", () => {
    const p1 = planeFromPoints(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    );
    const p2 = planeFromPoints(
      { x: 0, y: 0, z: 5 },
      { x: 1, y: 0, z: 5 },
      { x: 0, y: 1, z: 5 },
    );
    expect(planeAngle(p1, p2)).toBeCloseTo(0, 5);
  });

  it("linePlaneAngle computes correct angle", () => {
    const p = planeFromPoints(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    );
    // line along z-axis is perpendicular to xOy plane → angle = 90°
    expect(linePlaneAngle({ x: 0, y: 0, z: 1 }, p)).toBeCloseTo(Math.PI / 2, 5);
    // line along x-axis lies in xOy plane → angle = 0°
    expect(linePlaneAngle({ x: 1, y: 0, z: 0 }, p)).toBeCloseTo(0, 5);
  });

  it("pointPlaneDistance computes distance", () => {
    const p = planeFromPoints(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    );
    expect(pointPlaneDistance({ x: 0, y: 0, z: 5 }, p)).toBeCloseTo(5, 5);
    expect(pointPlaneDistance({ x: 3, y: 4, z: 0 }, p)).toBeCloseTo(0, 5);
  });
});
