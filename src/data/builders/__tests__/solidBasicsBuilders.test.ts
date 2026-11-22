import { describe, it, expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { MathPanelData } from "@/data/types";
import {
  buildSolidAxiomsPanel,
  buildPolyhedronFeaturesPanel,
  buildRotationBodyPanel,
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

describe("立体几何基础与旋转体 Builder 聚合单测", () => {
  describe("buildSolidAxiomsPanel (anim-solid-axioms)", () => {
    it("覆盖确定平面四构型并响应共面偏移参数", () => {
      const subTypes = [
        "threePoints",
        "lineAndPoint",
        "intersectingLines",
        "parallelLines",
      ] as const;
      for (const subType of subTypes) {
        const panel = buildSolidAxiomsPanel(
          { tParam: 0 },
          { mode: "determination", subType },
        );
        assertValidPanel(panel, true);
        expect(panel.warnings.some((w) => w.text.includes("偏移"))).toBe(false);
      }

      const lifted = buildMathQuantities(
        "anim-solid-axioms",
        { tParam: 1.5 },
        {
          mode: "determination",
          subType: "threePoints",
        },
      );
      assertValidPanel(lifted, true);
      expect(lifted.warnings.some((w) => w.level === "warning")).toBe(true);
    });

    it("覆盖两平面相交与空间等角定理（同向与反向）", () => {
      const inter = buildSolidAxiomsPanel(
        { tiltDeg: 45 },
        { mode: "intersection" },
      );
      assertValidPanel(inter, false);
      expect(inter.quantities.some((q) => String(q.value).includes("45"))).toBe(
        true,
      );

      const sameDir = buildSolidAxiomsPanel(
        { angleParamDeg: 60 },
        { mode: "spatialLines", flipSecondRay: false },
      );
      assertValidPanel(sameDir, false);
      expect(
        sameDir.quantities.some((q) => String(q.value).includes("相等")),
      ).toBe(true);

      const oppDir = buildSolidAxiomsPanel(
        { angleParamDeg: 60 },
        { mode: "spatialLines", flipSecondRay: true },
      );
      assertValidPanel(oppDir, false);
      expect(
        oppDir.quantities.some((q) => String(q.value).includes("互补")),
      ).toBe(true);
    });
  });

  describe("buildPolyhedronFeaturesPanel (anim-solid-polyhedron)", () => {
    it("覆盖棱柱、棱锥、棱台与等体积法四大模式", () => {
      for (const mode of [
        "prism",
        "pyramid",
        "frustum",
        "equalVolume",
      ] as const) {
        const panel = buildMathQuantities(
          "anim-solid-polyhedron",
          { a: 3, b: 4, h: 4, a1: 2, a2: 4 },
          { mode },
        );
        assertValidPanel(
          panel,
          mode === "equalVolume" || mode === "frustum",
          true,
        );
      }
      const degenerateFrustum = buildPolyhedronFeaturesPanel(
        { a1: 0, a2: 4, h: 4 },
        { mode: "frustum" },
      );
      assertValidPanel(degenerateFrustum, true, true);
    });
  });

  describe("buildRotationBodyPanel (anim-solid-rotation-body)", () => {
    it("覆盖四大截面旋转生成与截面模式", () => {
      const shapes = [
        "rectangle",
        "rightTriangle",
        "rightTrapezoid",
        "semicircle",
      ] as const;
      for (const shape of shapes) {
        const gen = buildMathQuantities(
          "anim-solid-rotation-body",
          { r1: 2, r2: 1, height: 3, cutDistance: 0.6, sweepAngleDeg: 270 },
          { shape, mode: "generation" },
        );
        assertValidPanel(gen);
        expect(gen.warnings.some((w) => w.text.includes("旋转扫掠"))).toBe(
          true,
        );

        const sec = buildRotationBodyPanel(
          { r1: 2, r2: 1, height: 3, cutDistance: 0.6, sweepAngleDeg: 360 },
          { shape, mode: "section" },
        );
        assertValidPanel(sec);
      }
    });

    it("unfoldPath 覆盖圆柱矩形对角线、圆锥超半圆折经锥顶与圆台余弦定理/贴弧退化", () => {
      const cylUnfold = buildRotationBodyPanel(
        { r1: 1.5, height: 3, unfoldProgress: 1 },
        { shape: "rectangle", mode: "unfoldPath" },
      );
      assertValidPanel(cylUnfold, true);
      expect(
        cylUnfold.theorems.some((t) => t.name.includes("圆柱侧面展开最短路径")),
      ).toBe(true);

      // 圆锥 α = 360 * r1 / l > 180° 时触发折经锥顶临界警告
      const coneWide = buildRotationBodyPanel(
        { r1: 3, height: 1, unfoldProgress: 1 },
        { shape: "rightTriangle", mode: "unfoldPath" },
      );
      assertValidPanel(coneWide, true);
      expect(coneWide.warnings.some((w) => w.text.includes("超过半圆"))).toBe(
        true,
      );

      // 圆台余弦定理与内孔贴弧场景
      const frustumNormal = buildRotationBodyPanel(
        { r1: 2, r2: 1, height: 3, unfoldProgress: 0.8 },
        { shape: "rightTrapezoid", mode: "unfoldPath" },
      );
      assertValidPanel(frustumNormal, true);
      expect(
        frustumNormal.theorems.some((t) => t.name.includes("圆台补台成锥")),
      ).toBe(true);

      // 高底小半径触发弦切入内孔贴合顶边圆弧警告
      const frustumTangentArc = buildRotationBodyPanel(
        { r1: 3.2, r2: 2.2, height: 1.2, unfoldProgress: 1 },
        { shape: "rightTrapezoid", mode: "unfoldPath" },
      );
      assertValidPanel(frustumTangentArc, true);
      expect(frustumTangentArc.warnings.length).toBeGreaterThan(0);
    });
  });
});
