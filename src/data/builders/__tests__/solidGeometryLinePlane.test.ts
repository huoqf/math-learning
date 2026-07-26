import { describe, it, expect } from "vitest";
import { buildLinePlaneRelationPanel } from "../solidGeometry";

describe("buildLinePlaneRelationPanel 测试", () => {
  it("平行模式下包含正确的数学量与定理", () => {
    const data = buildLinePlaneRelationPanel(
      { zHeight: 2, thetaDeg: 0, phiDeg: 30 },
      { mode: "parallel" },
    );

    expect(data.quantities.find((q) => q.label === "位置关系")?.value).toBe(
      "线面平行 (l ∥ α)",
    );
    expect(data.theorems.length).toBeGreaterThanOrEqual(3);
    expect(data.theorems[0].name).toContain("线面平行判定定理");
  });

  it("垂直模式与平行反例触发 WarningItem", () => {
    const data = buildLinePlaneRelationPanel(
      { zHeight: 0, thetaDeg: 45, phiDeg: 30, intersectType: 0 },
      { mode: "perpendicular" },
    );

    expect(data.warnings.length).toBeGreaterThan(0);
    expect(data.warnings[0].text).toContain("平面内两条直线");
  });

  it("线在面内条件触发 WarningItem", () => {
    const data = buildLinePlaneRelationPanel(
      { zHeight: 0, thetaDeg: 0, phiDeg: 0 },
      { mode: "parallel" },
    );

    expect(
      data.warnings.some((w) => w.text.includes("线面平行的严格前提条件")),
    ).toBe(true);
  });
});
