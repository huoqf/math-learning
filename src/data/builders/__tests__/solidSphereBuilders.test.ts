import { describe, it, expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { MathPanelData } from "@/data/types";
import {
  buildCircumSpherePanel,
  buildPolyhedronSpherePanel,
  buildAdvancedSpherePanel,
} from "../solidGeometry";

function assertValidPanel(
  panel: MathPanelData,
  requireReasoning = false,
  requireGaokao = true,
): void {
  expect(panel.quantities.length).toBeGreaterThan(0);
  expect(panel.theorems.length).toBeGreaterThan(0);
  if (requireGaokao) {
    expect(panel.gaokaoPoints.length).toBeGreaterThan(0);
  }
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

describe("外接球与内切球系列 Builder 聚合单测", () => {
  describe("buildCircumSpherePanel (anim-solid-ball)", () => {
    it("全覆盖五类几何体（长方体/正四棱锥/直三棱柱/圆锥/圆柱）× 外接球/内切球", () => {
      const shapes = [
        "cuboid",
        "regularPyramid",
        "triangularPrism",
        "cone",
        "cylinder",
      ] as const;
      for (const sphereType of ["circum", "inscribed"] as const) {
        for (const shape of shapes) {
          const panel = buildMathQuantities(
            "anim-solid-ball",
            { a: 3, b: 4, c: 3 },
            { sphereType, shape },
          );
          assertValidPanel(panel, true, true);
        }
      }

      // 正方体全相切退化特例校验
      const cubeIn = buildCircumSpherePanel(
        { a: 3, b: 3, c: 3 },
        { sphereType: "inscribed", shape: "cuboid" },
      );
      assertValidPanel(cubeIn, true, true);
    });
  });

  describe("buildPolyhedronSpherePanel (anim-solid-ball-models)", () => {
    it("全覆盖五大经典模型（墙角/圆柱柱体/对棱补形/侧棱垂面/等体积内切球）", () => {
      const models = [
        "corner",
        "cylinder",
        "complement",
        "verticalEdge",
        "inSphere",
      ] as const;
      for (const modelType of models) {
        const panel = buildMathQuantities(
          "anim-solid-ball-models",
          { a: 3, b: 4, c: 5, h: 4 },
          { modelType },
        );
        assertValidPanel(panel, true);
      }

      const explicitPanel = buildPolyhedronSpherePanel(
        { a: 3, b: 4, c: 5, h: 4 },
        { modelType: "complement" },
      );
      assertValidPanel(explicitPanel, true);
    });
  });

  describe("buildAdvancedSpherePanel (anim-solid-advanced-sphere)", () => {
    it("全覆盖进阶切接球四大压轴模型（双垂直面/正四面体同心三球/圆台外接球/内接极值）", () => {
      const models = [
        "perpPlanes",
        "concentric",
        "truncatedCone",
        "extrema",
      ] as const;
      for (const modelType of models) {
        const panel = buildMathQuantities(
          "anim-solid-advanced-sphere",
          { a: 4, r1: 3, r2: 1.5, c: 3, h: 3, R: 3, shapeType: 0 },
          { modelType },
        );
        assertValidPanel(panel, true, true);
      }

      const extremaCone = buildAdvancedSpherePanel(
        { R: 3, shapeType: 1, h: 4 },
        { modelType: "extrema" },
      );
      assertValidPanel(extremaCone, true, true);
    });
  });
});
