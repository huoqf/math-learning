import { describe, it, expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { MathPanelData } from "@/data/types";
import { buildVector3DBasisPanel } from "../vector3d";
import {
  buildSpatialAnglePanel,
  buildSpatialDistancePanel,
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

describe("空间向量基底、空间角、空间距离与动点最值 Builder 聚合单测", () => {
  describe("buildVector3DBasisPanel (anim-vector3d-basis)", () => {
    it("覆盖空间基底分解、共面判定（四点共面及外部态）、坐标点积与基底共面失效预警", () => {
      const para = buildMathQuantities(
        "anim-vector3d-basis",
        { x: 1.5, y: 1.2, z: 1.8, cz: 2 },
        { mode: "parallelepiped" },
      );
      assertValidPanel(para, true);

      const coplanarHit = buildVector3DBasisPanel(
        { x: 0.4, y: 0.3, z: 0.3, cz: 2 },
        { mode: "coplanar" },
      );
      assertValidPanel(coplanarHit, true);
      expect(
        coplanarHit.quantities.some((q) =>
          String(q.value).includes("四点共面"),
        ),
      ).toBe(true);

      const coord = buildVector3DBasisPanel(
        { ax: 2, ay: 1, az: 0, bx: 1, by: 2, bz: 2 },
        { mode: "coordDotProduct" },
      );
      assertValidPanel(coord, false);

      // 共面基底失效预警 (z 分量为 0 使三向量落在 xy 平面)
      const degenerated = buildVector3DBasisPanel(
        { x: 1, y: 1, z: 1, cz: 0 },
        {
          mode: "parallelepiped",
          vecA: { x: 2, y: 0, z: 0 },
          vecB: { x: 0, y: 2, z: 0 },
          vecC: { x: 1, y: 1, z: 0 },
        },
      );
      assertValidPanel(degenerated, true);
      expect(degenerated.warnings.some((w) => w.text.includes("共面"))).toBe(
        true,
      );
    });
  });

  describe("buildSpatialAnglePanel (anim-solid-angle)", () => {
    it("覆盖异面直线角、线面角、点面距与长方体二面角", () => {
      for (const mode of [
        "skewLines",
        "linePlane",
        "distance",
        "dihedral",
      ] as const) {
        const panel = buildMathQuantities(
          "anim-solid-angle",
          { a: 3, b: 2, c: 2, lambda: 0.6 },
          { mode, preset: "free" },
        );
        assertValidPanel(panel, true, true);
      }
    });

    it("dihedral + triPrism 覆盖正三棱柱非长方体中点建系母题与法向量进出判别", () => {
      const prismPanel = buildSpatialAnglePanel(
        { a: 2, b: 2, c: 3, lambda: 0.6 },
        { mode: "dihedral", preset: "triPrism" },
      );
      assertValidPanel(prismPanel, true);
      expect(prismPanel.quantities.some((q) => q.symbol === "|OA|")).toBe(true);
      expect(
        prismPanel.quantities.some((q) => String(q.value).includes("一进一出")),
      ).toBe(true);
      expect(prismPanel.reasoningSteps?.length).toBe(3);
    });
  });

  describe("buildSpatialDistancePanel (anim-solid-distance)", () => {
    it("覆盖异面直线距离、点面距与体积极值模式", () => {
      for (const mode of [
        "skewDistance",
        "pointPlaneDistance",
        "volumeExtrema",
      ] as const) {
        const panel = buildMathQuantities(
          "anim-solid-distance",
          { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 },
          { mode, preset: "free" },
        );
        assertValidPanel(panel, true);
      }
    });

    it("pointLineDistance 覆盖点到直线距离推演及 cubeMid 正方体中点对称捷径预警", () => {
      const panel = buildSpatialDistancePanel(
        { a: 2, b: 2, c: 2, lambda: 0.5 },
        { mode: "pointLineDistance", preset: "cubeMid" },
      );
      assertValidPanel(panel, true);
      expect(
        panel.warnings.some((w) => w.text.includes("正方体中点对称捷径")),
      ).toBe(true);
      expect(panel.reasoningSteps?.length).toBe(3);
    });
  });

  describe("buildParametricPointPanel (anim-solid-parametric)", () => {
    it("覆盖单动点角度存在性、双动点距离、三棱锥体积极值与表面展开最短路径", () => {
      const modes = [
        "singlePointAngle",
        "doublePointDistance",
        "pyramidVolumeExtrema",
        "surfaceShortestPath",
      ] as const;
      for (const activeMode of modes) {
        const panel = buildMathQuantities(
          "anim-solid-parametric",
          { a: 4, b: 3, c: 3, lambda: 0.5, mu: 0.5, targetThetaDeg: 45 },
          { activeMode },
        );
        assertValidPanel(panel, true);
      }
    });
  });
});
