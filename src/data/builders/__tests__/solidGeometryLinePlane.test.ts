import { describe, it, expect } from "vitest";
import katex from "katex";
import { buildLinePlaneRelationPanel } from "../solidGeometry";

describe("buildLinePlaneRelationPanel 测试", () => {
  it("线面平行判定与性质模式包含正确的数学量与定理", () => {
    // 判定定理
    const dataJudge = buildLinePlaneRelationPanel(
      { zHeight: 2, thetaDeg: 0, phiDeg: 0 },
      { mode: "parallel", subTheorem: "judge" },
    );
    expect(
      dataJudge.quantities.find((q) => q.label === "空间位置关系")?.value,
    ).toBe("线面平行 (l ∥ α)");
    expect(
      dataJudge.theorems.some((t) => t.name.includes("线面平行判定定理")),
    ).toBe(true);
    expect(dataJudge.mnemonic).toContain("线线平行变线面");

    // 性质定理
    const dataProp = buildLinePlaneRelationPanel(
      { zHeight: 2, thetaDeg: 0, phiDeg: 0 },
      { mode: "parallel", subTheorem: "prop" },
    );
    expect(dataProp.theorems.some((t) => t.name.includes("性质定理"))).toBe(
      true,
    );
  });

  it("垂直模式与平行反例触发 WarningItem", () => {
    const data = buildLinePlaneRelationPanel(
      { zHeight: 0, thetaDeg: 45, phiDeg: 30, intersectType: 0 },
      { mode: "perpendicular", subTheorem: "judge" },
    );

    expect(data.warnings.length).toBeGreaterThan(0);
    expect(data.warnings[0].text).toContain("相交陷阱反例");
  });

  it("面外反例触发 WarningItem 并准确同步位置关系", () => {
    const data = buildLinePlaneRelationPanel(
      { zHeight: 2, thetaDeg: 0, inPlaneType: 0 },
      { mode: "parallel" },
    );

    expect(data.warnings.some((w) => w.text.includes("面外陷阱反例"))).toBe(
      true,
    );
    expect(
      data.quantities.find((q) => q.label === "空间位置关系")?.value,
    ).toContain("线在面内");
  });

  it("向量模式下输出专属法向量、数量积与线面角公式", () => {
    const data = buildLinePlaneRelationPanel(
      { thetaDeg: 30, phiDeg: 0 },
      { mode: "vector" },
    );
    expect(data.quantities.some((q) => q.label === "数量积 l·n")).toBe(true);
    expect(data.theorems.some((t) => t.name.includes("向量法线面角公式"))).toBe(
      true,
    );
    expect(data.mnemonic).toContain("向量法求线面角");
  });

  it("高考四棱锥母题模式包含动点比例与定理", () => {
    // 比例相等 (平行)
    const dataParallel = buildLinePlaneRelationPanel(
      { lambdaE: 0.5, lambdaF: 0.5 },
      { mode: "gaokaoPyramid" },
    );
    expect(
      dataParallel.quantities.find((q) => q.label.includes("EF 与底面位置关系"))
        ?.value,
    ).toContain("EF ∥ 平面 ABCD");
    expect(dataParallel.warnings.length).toBe(0);

    // 比例不相等 (相交)
    const dataIntersect = buildLinePlaneRelationPanel(
      { lambdaE: 0.3, lambdaF: 0.7 },
      { mode: "gaokaoPyramid" },
    );
    expect(
      dataIntersect.quantities.find((q) =>
        q.label.includes("EF 与底面位置关系"),
      )?.value,
    ).toContain("相交");
    expect(dataIntersect.warnings.length).toBeGreaterThan(0);
  });

  it("面面垂直模式包含交线垂线定理与规范提示", () => {
    const data = buildLinePlaneRelationPanel({}, { mode: "surfacePerp" });
    expect(data.theorems.some((t) => t.name.includes("面面垂直性质定理"))).toBe(
      true,
    );
    expect(data.gaokaoPoints[0].text).toContain("面面垂直满分答题注意");
  });

  it("所有模式下的定理公式均能被 KaTeX 正常解析无报错", () => {
    const modes = [
      "parallel",
      "perpendicular",
      "gaokaoPyramid",
      "vector",
      "surfaceParallel",
      "surfacePerp",
    ];
    const subTheorems = ["judge", "prop"];

    for (const mode of modes) {
      for (const subTheorem of subTheorems) {
        const data = buildLinePlaneRelationPanel(
          { thetaDeg: 30, lambdaE: 0.5, lambdaF: 0.5 },
          { mode, subTheorem },
        );
        for (const t of data.theorems) {
          expect(() => {
            katex.renderToString(t.latex, {
              throwOnError: true,
              strict: false,
            });
          }).not.toThrow();
        }
        for (const q of data.quantities) {
          if (q.symbol) {
            expect(() => {
              katex.renderToString(q.symbol!, {
                throwOnError: true,
                strict: false,
              });
            }).not.toThrow();
          }
        }
      }
    }
  });
});
