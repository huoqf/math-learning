import { describe, it, expect } from "vitest";
import {
  computeSectionArea3D,
  computeProjectionArea2D,
  computeSectionProjectionDetails,
} from "../sectionArea";
import type { Vec3 } from "../vector3";

describe("sectionArea Math Tests", () => {
  it("计算水平 2x3 矩形截面的 3D 面积与投影面积应完全相等", () => {
    const points: Vec3[] = [
      { x: 0, y: 0, z: 2 },
      { x: 2, y: 0, z: 2 },
      { x: 2, y: 3, z: 2 },
      { x: 0, y: 3, z: 2 },
    ];

    const s3d = computeSectionArea3D(points);
    const sProj = computeProjectionArea2D(points);

    expect(s3d).toBeCloseTo(6, 5);
    expect(sProj).toBeCloseTo(6, 5);
  });

  it("倾斜 45° 截面的射影面积公式 S_截 * cos(45°) = S_投 检验", () => {
    // 平面倾斜 45 度，n = (0, sin(45°), cos(45°)) = (0, sqrt(2)/2, sqrt(2)/2)
    // 边长 x: [0, 2], y: [0, 2], z: [0, 2]
    const points: Vec3[] = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 2 },
      { x: 0, y: 2, z: 2 },
    ];

    const details = computeSectionProjectionDetails(points, {
      x: 0,
      y: 1,
      z: 1,
    });

    // 3D 矩形长 2，宽 sqrt(2^2 + 2^2) = sqrt(8) = 2*sqrt(2)
    // S_截 = 2 * 2*sqrt(2) = 4*sqrt(2) ≈ 5.65685
    expect(details.area3D).toBeCloseTo(4 * Math.SQRT2, 4);

    // S_投 = 2 * 2 = 4
    expect(details.areaProj).toBeCloseTo(4, 4);

    // cos θ = 1 / sqrt(2) ≈ 0.7071
    expect(details.cosTheta).toBeCloseTo(Math.SQRT1_2, 4);

    // 射影面积公式验证: S_截 * cos θ = S_投
    expect(details.area3D * details.cosTheta).toBeCloseTo(details.areaProj, 4);
  });
});
