import { describe, it, expect } from "vitest";
import { buildRotationUnfoldData } from "../rotationUnfold";

function expectAllGridFinite(
  grid: { x: number; y: number; z: number }[][],
): void {
  expect(grid.length).toBeGreaterThan(2);
  for (const row of grid) {
    expect(row.length).toBeGreaterThan(2);
    for (const pt of row) {
      expect(Number.isFinite(pt.x)).toBe(true);
      expect(Number.isFinite(pt.y)).toBe(true);
      expect(Number.isFinite(pt.z)).toBe(true);
    }
  }
}

describe("rotationUnfold 旋转体侧面连续展平与最短路径计算测试", () => {
  it("圆柱侧面展开：最短路径严格等于矩形对角线 √((2πr)² + h²)", () => {
    const r1 = 1.5;
    const height = 3;
    const res = buildRotationUnfoldData({
      type: "cylinder",
      r1,
      height,
      unfoldProgress: 1,
    });
    expect(res.pathRegime).toBe("cylinder_diagonal");
    expect(res.minPathLength).toBeCloseTo(
      Math.hypot(2 * Math.PI * r1, height),
      5,
    );
    expectAllGridFinite(res.gridPoints);
    expect(res.geodesicPoints.length).toBeGreaterThan(10);
  });

  it("圆锥展开：α ≤ π 时取直线弦长 2l·sin(α/2)", () => {
    // r1 = 1, h = 3 => l = √10 ≈ 3.162, α = 2π·1/√10 ≈ 113.8° ≤ 180°
    const r1 = 1;
    const height = 3;
    const res = buildRotationUnfoldData({
      type: "cone",
      r1,
      height,
      unfoldProgress: 1,
    });
    const l = Math.hypot(r1, height);
    const alpha = (2 * Math.PI * r1) / l;
    expect(alpha).toBeLessThan(Math.PI);
    expect(res.pathRegime).toBe("cone_chord");
    expect(res.minPathLength).toBeCloseTo(2 * l * Math.sin(alpha / 2), 5);
  });

  it("圆锥展开：α > π 时过锥顶退化，最短路径恒等于 2l", () => {
    // r1 = 3, h = 1 => l = √10 ≈ 3.162, α = 2π·3/√10 > π
    const r1 = 3;
    const height = 1;
    const res = buildRotationUnfoldData({
      type: "cone",
      r1,
      height,
      unfoldProgress: 1,
    });
    const l = Math.hypot(r1, height);
    expect(res.unfoldAngleRad).toBeGreaterThan(Math.PI);
    expect(res.pathRegime).toBe("cone_apex_degenerate");
    expect(res.minPathLength).toBeCloseTo(2 * l, 5);
  });

  it("圆台展开：覆盖正常余弦弦长、内孔遮挡切线贴弧及 r1≈r2 圆柱极限退化", () => {
    // 1. 窄高尖锥台 (r1=1.2, r2=0.2, height=6 => α ≈ 59° < φ_tangent ≈ 80.4°) -> 余弦定理正常弦
    const chordFrustum = buildRotationUnfoldData({
      type: "frustum",
      r1: 1.2,
      r2: 0.2,
      height: 6,
      unfoldProgress: 0.7,
    });
    expect(chordFrustum.pathRegime).toBe("frustum_chord");
    expect(chordFrustum.minPathLength).toBeCloseTo(
      chordFrustum.chordLawOfCosinesLength,
      5,
    );
    expectAllGridFinite(chordFrustum.gridPoints);

    // 2. 扁宽接近圆柱的小锥台 -> 扇角超过切角，触发内孔切线+贴合顶边圆弧
    const arcFrustum = buildRotationUnfoldData({
      type: "frustum",
      r1: 3.2,
      r2: 2.2,
      height: 1.2,
      unfoldProgress: 1,
    });
    expect(arcFrustum.pathRegime).toBe("frustum_tangent_arc");
    expect(arcFrustum.minPathLength).toBeGreaterThan(
      arcFrustum.chordLawOfCosinesLength,
    );
    expectAllGridFinite(arcFrustum.gridPoints);

    // 3. |r1 - r2| < 1e-3 -> 无 NaN 平滑退化为圆柱对角线
    const nearCyl = buildRotationUnfoldData({
      type: "frustum",
      r1: 1.5,
      r2: 1.5002,
      height: 3,
      unfoldProgress: 0.5,
    });
    expect(nearCyl.pathRegime).toBe("cylinder_diagonal");
    expect(nearCyl.minPathLength).toBeCloseTo(
      Math.hypot(2 * Math.PI * 1.5, 3),
      2,
    );
    expectAllGridFinite(nearCyl.gridPoints);
  });

  it("展开中间进度 p = 0 / 0.5 / 1 下网格与测地线坐标全部有限平滑", () => {
    for (const p of [0, 0.5, 1]) {
      const res = buildRotationUnfoldData({
        type: "cone",
        r1: 1.5,
        height: 3,
        unfoldProgress: p,
      });
      expectAllGridFinite(res.gridPoints);
      for (const pt of res.geodesicPoints) {
        expect(
          Number.isFinite(pt.x) &&
            Number.isFinite(pt.y) &&
            Number.isFinite(pt.z),
        ).toBe(true);
      }
    }
  });
});
