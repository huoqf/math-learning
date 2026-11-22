import { describe, it, expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { MathPanelData } from "@/data/types";
import { buildSectionPanel, buildSolidFoldingPanel } from "../solidGeometry";

function assertValidPanel(
  panel: MathPanelData,
  requireReasoning = false,
): void {
  expect(panel.quantities.length).toBeGreaterThan(0);
  expect(panel.theorems.length).toBeGreaterThan(0);
  expect(panel.gaokaoPoints.length).toBeGreaterThan(0);
  if (requireReasoning) {
    expect(panel.reasoningSteps?.length ?? 0).toBeGreaterThan(0);
  }

  for (const q of panel.quantities) {
    if (typeof q.value === "number") {
      expect(Number.isFinite(q.value)).toBe(true);
    } else {
      expect(String(q.value)).not.toMatch(/\bNaN\b|\bInfinity\b/);
    }
  }

  const textFields: string[] = [];
  for (const t of panel.theorems) {
    if (t.condition) textFields.push(t.condition);
    if (t.note) textFields.push(t.note);
  }
  for (const gp of panel.gaokaoPoints) textFields.push(gp.text);
  for (const w of panel.warnings) textFields.push(w.text);
  for (const s of panel.reasoningSteps ?? []) {
    if (s.title) textFields.push(s.title);
    if (s.detail) textFields.push(s.detail);
    if (s.rubric) textFields.push(s.rubric);
  }

  for (const txt of textFields) {
    expect(txt).not.toMatch(/\bNaN\b|\bInfinity\b/);
    const unescapedDollars = (txt.replace(/\\\$/g, "").match(/\$/g) ?? [])
      .length;
    expect(unescapedDollars % 2, `文本内 "$" 未成对闭合: ${txt}`).toBe(0);
  }
}

describe("立体几何截面与翻折 Builder 聚合单测", () => {
  describe("buildSectionPanel (anim-solid-section)", () => {
    it("覆盖截面作图模式（直接连线 / 面面平行 / 交轨延长）及五类几何体名称", () => {
      const solids = [
        "长方体 / 正方体",
        "正四棱锥",
        "正三棱锥",
        "直三棱柱",
        "正四棱台",
      ];
      for (const solidName of solids) {
        const panel = buildMathQuantities(
          "anim-solid-section",
          {},
          {
            mode: "construction",
            solidName,
            vertexCount: 4,
            area3D: 6.4,
            areaProj: 4.5,
            cosTheta: 0.7031,
            thetaDeg: 45.3,
            shapeName: "梯形",
            methodName: "交轨延长线法",
            stepNum: 2,
            stepTitle: "在底面求交线外点 K₁",
            rationale: "P, Q 在同一侧面内，连线延长与底面交于外点",
            externalPointsStr: "K₁(-1.50, 0.00, 0.00)",
          },
        );
        assertValidPanel(panel);
        expect(
          panel.quantities.some((q) => String(q.value) === solidName),
        ).toBe(true);
        expect(panel.quantities.some((q) => q.label === "底面交轨外点")).toBe(
          true,
        );
      }
    });

    it("覆盖面面平行线法与面积极值模式", () => {
      const parallel = buildSectionPanel(
        {},
        {
          mode: "construction",
          vertexCount: 4,
          area3D: 8,
          areaProj: 5,
          cosTheta: 0.625,
          thetaDeg: 51.3,
          shapeName: "平行四边形",
          methodName: "面面平行线法",
          stepNum: 3,
          rationale: "两平行平面被第三平面所截，交线平行",
        },
      );
      assertValidPanel(parallel);
      expect(parallel.theorems[0].latex).toContain("\\parallel");

      const extrema = buildSectionPanel(
        {},
        {
          mode: "extrema",
          vertexCount: 6,
          area3D: 9.2,
          areaProj: 5.1,
          cosTheta: 0.554,
          thetaDeg: 56.3,
          shapeName: "正六边形",
          minArea: 4.5,
          maxArea: 10.4,
        },
      );
      assertValidPanel(extrema);
      expect(extrema.quantities.some((q) => q.symbol === "S_{\\min}")).toBe(
        true,
      );
      expect(extrema.quantities.some((q) => q.symbol === "S_{\\max}")).toBe(
        true,
      );
    });
  });

  describe("buildSolidFoldingPanel (anim-solid-folding)", () => {
    it("覆盖四大翻折模型（直角梯形/矩形对角线/三角形高线/菱形）及展平与立体两态", () => {
      const models = [
        "trapezoid",
        "rectangleDiagonal",
        "triangleAltitude",
        "rhombus",
      ] as const;
      for (const model of models) {
        // 展平态 (α = 0)
        const flatPanel = buildMathQuantities(
          "anim-solid-folding",
          { a: 4, b: 2.5, h: 3, alphaDeg: 0 },
          { model },
        );
        assertValidPanel(flatPanel);

        // 立体翻折态 (α = 90 / 60)
        const foldedPanel = buildSolidFoldingPanel(
          { a: 4, b: 2.5, h: 3, alphaDeg: 90 },
          { model },
        );
        assertValidPanel(foldedPanel);

        // 钝角翻折态 (α = 120)
        const obtusePanel = buildSolidFoldingPanel(
          { a: 4, b: 2.5, h: 3, alphaDeg: 120 },
          { model },
        );
        assertValidPanel(obtusePanel);
      }
    });
  });
});
