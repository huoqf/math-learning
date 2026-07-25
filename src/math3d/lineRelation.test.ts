import { describe, it, expect } from "vitest";
import { judgeLinePlane } from "./lineRelation";
import type { Plane } from "./plane";

const xOyPlane: Plane = {
  point: { x: 0, y: 0, z: 0 },
  normal: { x: 0, y: 0, z: 1 },
};

describe("lineRelation", () => {
  it("line parallel to plane when direction perpendicular to normal", () => {
    expect(
      judgeLinePlane({ x: 1, y: 0, z: 0 }, xOyPlane, { x: 0, y: 0, z: 5 }),
    ).toBe("parallel");
  });

  it("line perpendicular to plane when direction parallel to normal", () => {
    expect(
      judgeLinePlane({ x: 0, y: 0, z: 1 }, xOyPlane, { x: 0, y: 0, z: 5 }),
    ).toBe("perpendicular");
  });

  it("line intersecting plane", () => {
    expect(
      judgeLinePlane({ x: 1, y: 1, z: 1 }, xOyPlane, { x: 0, y: 0, z: 5 }),
    ).toBe("intersect");
  });

  it("line in plane when direction in plane and point on plane", () => {
    expect(
      judgeLinePlane({ x: 1, y: 0, z: 0 }, xOyPlane, { x: 0, y: 0, z: 0 }),
    ).toBe("inPlane");
  });
});
