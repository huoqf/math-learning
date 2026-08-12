import { describe, it, expect } from "vitest";
import {
  calculateCornerModel,
  calculateCylinderModel,
  calculateComplementModel,
} from "../polyhedronSphere";

describe("polyhedronSphere 3D math algorithms", () => {
  it("should correctly compute corner model radius for 3-4-5 triad", () => {
    // a=3, b=4, c=5 => 2R = sqrt(9+16+25) = sqrt(50) = 5*sqrt(2) => R = 2.5*sqrt(2) ~ 3.5355
    const res = calculateCornerModel(3, 4, 5);
    expect(res.radius).toBeCloseTo(Math.sqrt(50) / 2, 4);
    expect(res.center).toEqual({ x: 1.5, y: 2, z: 2.5 });
    expect(res.pyramidVertices.A).toEqual({ x: 3, y: 0, z: 0 });
    expect(res.pyramidVertices.B).toEqual({ x: 0, y: 4, z: 0 });
    expect(res.pyramidVertices.C).toEqual({ x: 0, y: 0, z: 5 });
  });

  it("should correctly compute cylinder model radius for right-triangle base", () => {
    // a=3, b=4, h=6 => cBase=5 => rBase=2.5. h/2=3 => R^2 = 2.5^2 + 3^2 = 6.25 + 9 = 15.25 => R = sqrt(15.25)
    const res = calculateCylinderModel(3, 4, 6);
    expect(res.rBase).toBe(2.5);
    expect(res.radius).toBeCloseTo(Math.sqrt(15.25), 4);
    expect(res.center).toEqual({ x: 1.5, y: 2, z: 3 });
  });

  it("should correctly compute complement model for equal opposite edges tetrahedron", () => {
    // a=sqrt(5), b=sqrt(5), c=sqrt(6)
    // x^2 = (5+5-6)/2 = 2, y^2 = (5+6-5)/2 = 3, z^2 = (5+6-5)/2 = 3
    const a = Math.sqrt(5);
    const b = Math.sqrt(5);
    const c = Math.sqrt(6);
    const res = calculateComplementModel(a, b, c);

    expect(res.isValid).toBe(true);
    expect(res.boxDimensions.x).toBeCloseTo(Math.sqrt(2), 4);
    expect(res.boxDimensions.y).toBeCloseTo(Math.sqrt(3), 4);
    expect(res.boxDimensions.z).toBeCloseTo(Math.sqrt(3), 4);

    // R = 1/2 * sqrt((5+5+6)/2) = 1/2 * sqrt(8) = sqrt(2)
    expect(res.radius).toBeCloseTo(Math.sqrt(2), 4);
  });
});
