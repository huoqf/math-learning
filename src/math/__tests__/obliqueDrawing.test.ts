import { describe, it, expect } from "vitest";
import {
  transformToOblique,
  restoreFromOblique,
  buildPresetPolygon,
  solveGaokaoInverse,
} from "../obliqueDrawing";

describe("斜二测画法纯数学模型", () => {
  it("标准斜二测变换：x轴原长不变，y轴45度倾斜且折半", () => {
    const pt = { x: 2, y: 4 };
    const oblique = transformToOblique(pt, 45, 0.5);

    // x' = 2 + 4 * cos(45°) * 0.5 = 2 + 2 * (√2/2) = 2 + √2 ≈ 3.4142
    expect(oblique.x).toBeCloseTo(2 + Math.SQRT2, 4);
    // y' = 4 * sin(45°) * 0.5 = 2 * (√2/2) = √2 ≈ 1.4142
    expect(oblique.y).toBeCloseTo(Math.SQRT2, 4);

    // 逆向还原必须精准回到原点
    const restored = restoreFromOblique(oblique, 45, 0.5);
    expect(restored.x).toBeCloseTo(2, 4);
    expect(restored.y).toBeCloseTo(4, 4);
  });

  it("正方形面积变换比恒为 √2 / 4", () => {
    const poly = buildPresetPolygon("square", { a: 4, b: 4 }, 45, 0.5);
    expect(poly.originalArea).toBeCloseTo(16, 4);

    const theoreticalRatio = Math.SQRT2 / 4; // ≈ 0.35355
    expect(poly.areaRatio).toBeCloseTo(theoreticalRatio, 4);
    expect(poly.obliqueArea).toBeCloseTo(16 * theoreticalRatio, 4);
  });

  it("直角三角形与等腰梯形同样满足 √2 / 4 面积压缩恒等式", () => {
    const tri = buildPresetPolygon("rightTriangle", { a: 6, b: 8 }, 45, 0.5);
    expect(tri.originalArea).toBeCloseTo(24, 4);
    expect(tri.areaRatio).toBeCloseTo(Math.SQRT2 / 4, 4);

    const trap = buildPresetPolygon(
      "isoscelesTrapezoid",
      { a: 6, b: 2, h: 4 },
      45,
      0.5,
    );
    // 梯形原面积 = (6 + 2) * 4 / 2 = 16
    expect(trap.originalArea).toBeCloseTo(16, 4);
    expect(trap.areaRatio).toBeCloseTo(Math.SQRT2 / 4, 4);
  });

  it("高考逆向还原：已知直观图面积反求原面积", () => {
    const obliqueArea = Math.SQRT2; // 设直观图面积为 √2
    const res = solveGaokaoInverse(obliqueArea, 45, 0.5);
    // S_原 = 2√2 * √2 = 4
    expect(res.calculatedOriginalArea).toBeCloseTo(4, 4);
    expect(res.theoreticalFactor).toBeCloseTo(2 * Math.SQRT2, 4);
  });
});
