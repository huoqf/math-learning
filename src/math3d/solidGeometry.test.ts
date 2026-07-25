import { describe, it, expect } from "vitest";
import {
  cuboidCircumRadius,
  sphereVolume,
  sphereSurfaceArea,
  regularTetrahedronCircumRadius,
  regularTetrahedronInRadius,
  coneCircumRadius,
} from "./solidGeometry";

describe("solidGeometry", () => {
  it("cuboidCircumRadius for unit cube", () => {
    expect(cuboidCircumRadius(1, 1, 1)).toBeCloseTo(Math.sqrt(3) / 2, 5);
  });

  it("cuboidCircumRadius for 3x4x5", () => {
    expect(cuboidCircumRadius(3, 4, 5)).toBeCloseTo(Math.sqrt(50) / 2, 5);
  });

  it("sphereVolume", () => {
    expect(sphereVolume(1)).toBeCloseTo((4 / 3) * Math.PI, 5);
  });

  it("sphereSurfaceArea", () => {
    expect(sphereSurfaceArea(1)).toBeCloseTo(4 * Math.PI, 5);
  });

  it("regularTetrahedronCircumRadius", () => {
    expect(regularTetrahedronCircumRadius(1)).toBeCloseTo(Math.sqrt(6) / 4, 5);
  });

  it("regularTetrahedronInRadius", () => {
    expect(regularTetrahedronInRadius(1)).toBeCloseTo(Math.sqrt(6) / 12, 5);
  });

  it("coneCircumRadius for r=1, h=2", () => {
    expect(coneCircumRadius(1, 2)).toBeCloseTo((1 + 4) / 4, 5);
  });
});
