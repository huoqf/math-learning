import { describe, it, expect } from "vitest";
import { buildObliqueDrawingPanel } from "../solidObliqueDrawing";
import { buildMathQuantities } from "@/data/mathQuantities";

describe("buildObliqueDrawingPanel 右屏数据与契约测试", () => {
  it("默认参数下生成完整看板数据，无 NaN/undefined", () => {
    const data = buildObliqueDrawingPanel({
      a: 4,
      b: 4,
      alphaDeg: 45,
      ratioY: 0.5,
    });

    expect(data.quantities.length).toBeGreaterThan(0);
    expect(data.theorems.length).toBeGreaterThanOrEqual(2);
    expect(data.gaokaoPoints.length).toBeGreaterThanOrEqual(2);
    expect(data.reasoningSteps?.length).toBe(3);

    for (const q of data.quantities) {
      expect(q.value).not.toContain("NaN");
      expect(q.value).not.toContain("undefined");
    }

    const ratioQuantity = data.quantities.find((q) =>
      q.symbol?.includes("S_{\\text{直观}}"),
    );
    expect(ratioQuantity).toBeDefined();
  });

  it("通过 buildMathQuantities 派发能正确命中并返回值", () => {
    const data = buildMathQuantities("anim-solid-oblique-drawing", {
      a: 6,
      b: 3,
      alphaDeg: 45,
      ratioY: 0.5,
    });

    expect(data.theorems.some((t) => t.name.includes("斜二测"))).toBe(true);
  });
});
