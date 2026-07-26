import { describe, it, expect } from "vitest";
import { buildRotationBodyPanel } from "@/data/builders/solidGeometry";

describe("buildRotationBodyPanel - 旋转体结构特征指标测试", () => {
  it("圆柱 (rectangle) 指标与定理计算准确", () => {
    const res = buildRotationBodyPanel({
      shape: "rectangle" as any,
      r1: 2,
      height: 5,
    });

    const quantitiesMap = Object.fromEntries(
      res.quantities.map((q) => [q.label, q.value]),
    );

    expect(quantitiesMap["轴截面积"]).toBe((2 * 2 * 5).toFixed(2));
    expect(quantitiesMap["侧面积"]).toBe((2 * Math.PI * 2 * 5).toFixed(2));
    expect(quantitiesMap["全面积"]).toBe(
      (2 * Math.PI * 2 * 5 + 2 * Math.PI * 4).toFixed(2),
    );
    expect(quantitiesMap["体积"]).toBe((Math.PI * 4 * 5).toFixed(2));

    expect(res.theorems.some((t) => t.name.includes("全面积"))).toBe(true);
    expect(res.theorems.some((t) => t.name.includes("轴截面"))).toBe(true);
  });

  it("圆锥 (rightTriangle) 展开角与侧面积计算准确", () => {
    const res = buildRotationBodyPanel({
      shape: "rightTriangle" as any,
      r1: 3,
      height: 4,
    });

    const quantitiesMap = Object.fromEntries(
      res.quantities.map((q) => [q.label, q.value]),
    );

    // r=3, h=4 -> l=5
    expect(quantitiesMap["母线长"]).toBe("5.00");
    // alpha = (3/5) * 360 = 216
    expect(quantitiesMap["展开角"]).toBe("216.0°");
    expect(quantitiesMap["侧面积"]).toBe((Math.PI * 3 * 5).toFixed(2));
    expect(quantitiesMap["体积"]).toBe(((Math.PI * 9 * 4) / 3).toFixed(2));

    expect(res.theorems.some((t) => t.name.includes("侧面展开图"))).toBe(true);
  });

  it("圆台 (rightTrapezoid) 指标与极限演化退化提示正确", () => {
    const res = buildRotationBodyPanel({
      shape: "rightTrapezoid" as any,
      r1: 3,
      r2: 1.5,
      height: 4,
    });

    const quantitiesMap = Object.fromEntries(
      res.quantities.map((q) => [q.label, q.value]),
    );

    expect(quantitiesMap["体积"]).toBe(
      ((Math.PI * 4 * (9 + 4.5 + 2.25)) / 3).toFixed(2),
    );

    expect(res.theorems.some((t) => t.name.includes("柱锥台体积统一"))).toBe(
      true,
    );

    // 测试 r2 ≈ r1 退化圆柱警告
    const resCylinderWarn = buildRotationBodyPanel({
      shape: "rightTrapezoid" as any,
      r1: 1.5,
      r2: 1.5,
      height: 3,
    });
    expect(
      resCylinderWarn.warnings.some((w) => w.text.includes("演变/退化为圆柱")),
    ).toBe(true);

    // 测试 r2 ≈ 0 退化圆锥警告
    const resConeWarn = buildRotationBodyPanel({
      shape: "rightTrapezoid" as any,
      r1: 1.5,
      r2: 0.1,
      height: 3,
    });
    expect(
      resConeWarn.warnings.some((w) => w.text.includes("演变/退化为圆锥")),
    ).toBe(true);
  });

  it("球 (semicircle) 表面积、体积与截面定理正确", () => {
    const res = buildRotationBodyPanel({
      shape: "semicircle" as any,
      r1: 3,
    });

    const quantitiesMap = Object.fromEntries(
      res.quantities.map((q) => [q.label, q.value]),
    );

    expect(quantitiesMap["球表面积"]).toBe((4 * Math.PI * 9).toFixed(2));
    expect(quantitiesMap["球体积"]).toBe(((4 / 3) * Math.PI * 27).toFixed(2));

    expect(res.theorems.some((t) => t.name.includes("截面圆性质"))).toBe(true);
  });

  it("高考考点应包含降维轴截面、曲面展开与切接模型", () => {
    const res = buildRotationBodyPanel({
      shape: "rectangle" as any,
      r1: 2,
      height: 4,
    });

    expect(res.gaokaoPoints.some((g) => g.text.includes("轴截面"))).toBe(true);
    expect(res.gaokaoPoints.some((g) => g.text.includes("切接问题"))).toBe(
      true,
    );
    expect(res.gaokaoPoints.some((g) => g.text.includes("化曲为直"))).toBe(
      true,
    );
  });
});
