import { describe, it, expect } from "vitest";
import { buildSurfaceRelationPanel } from "../solidGeometry";

describe("buildSurfaceRelationPanel 测试", () => {
  it("面面平行判定模式正确输出法向量、判定结论与考点", () => {
    const data = buildSurfaceRelationPanel(
      { zHeight: 2.2, tiltDeg: 0 },
      { mode: "parallelJudge", subType: "standard" },
    );
    expect(data.quantities.some((q) => q.label === "平面 α 法向量 n₁")).toBe(
      true,
    );
    expect(
      data.quantities.find((q) => q.label === "两平面判定结论")?.value,
    ).toBe("面面平行 (α ∥ β)");
    expect(data.theorems.some((t) => t.name.includes("面面平行判定定理"))).toBe(
      true,
    );
    expect(data.warnings.length).toBe(0);
  });

  it("面面平行反例（平行两线旋转）触发危险警示", () => {
    const data = buildSurfaceRelationPanel(
      { zHeight: 2.2, tiltDeg: 30 },
      { mode: "parallelJudge", subType: "counterExample" },
    );
    expect(data.warnings.length).toBeGreaterThan(0);
    expect(data.warnings[0].text).toContain("反例警示");
    expect(
      data.quantities.find((q) => q.label === "两平面判定结论")?.value,
    ).toBe("两面相交 (反例成立)");
  });

  it("面面平行性质模式输出截线平行与距离定理", () => {
    const data = buildSurfaceRelationPanel(
      { zHeight: 2.5, azimuthDeg: 30 },
      { mode: "parallelProp" },
    );
    expect(data.quantities.find((q) => q.label === "交线位置关系")?.value).toBe(
      "a ∥ b (截线恒平行)",
    );
    expect(data.theorems.some((t) => t.name.includes("截线平行"))).toBe(true);
  });

  it("面面垂直判定模式输出二面角与垂面族", () => {
    const data = buildSurfaceRelationPanel(
      { planeRotDeg: 45 },
      { mode: "perpJudge" },
    );
    expect(data.quantities.find((q) => q.label === "二面角平面角")?.value).toBe(
      "90.00°",
    );
    expect(data.theorems.some((t) => t.name.includes("面面垂直判定定理"))).toBe(
      true,
    );
  });

  it("面面垂直性质模式斜交时产生反例警示，90°时成立", () => {
    const data90 = buildSurfaceRelationPanel(
      { lineThetaDeg: 90 },
      { mode: "perpProp" },
    );
    expect(data90.warnings.length).toBe(0);
    expect(
      data90.quantities.find((q) => q.label === "线面垂直判定结论")?.value,
    ).toContain("成立");

    const data45 = buildSurfaceRelationPanel(
      { lineThetaDeg: 45 },
      { mode: "perpProp" },
    );
    expect(data45.warnings.length).toBeGreaterThan(0);
    expect(data45.warnings[0].text).toContain("高考极高频扣分反例");
  });

  it("高考母题模式正确解算四棱锥与建系指导", () => {
    const data = buildSurfaceRelationPanel(
      { pyramidA: 4, pyramidB: 3, pyramidH: 3.5, posO: 0.5 },
      { mode: "gaokaoModel", subType: "pyramid" },
    );
    expect(data.quantities.find((q) => q.label === "四棱锥高 PO")?.value).toBe(
      "3.50",
    );
    expect(data.gaokaoPoints.some((g) => g.text.includes("第(1)问"))).toBe(
      true,
    );
  });
});
