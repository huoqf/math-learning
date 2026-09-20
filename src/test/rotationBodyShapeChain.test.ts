import { describe, expect, it } from "vitest";
import { buildRotationBodyPanel } from "@/data/builders/solidRotationBody";

describe("临时校验：旋转体页圆柱（默认 shape）推导链", () => {
  it("默认参数即 rectangle，三步推导必须走圆柱公式而非圆锥公式", () => {
    const panel = buildRotationBodyPanel({
      r1: 1.5,
      r2: 0.8,
      height: 3,
      cutDistance: 0.8,
      shape: "rectangle",
    } as unknown as Record<string, number>);

    const steps = panel.reasoningSteps ?? [];
    expect(steps.length).toBe(3);

    const joined = steps
      .map((s) => `${s.latex ?? ""}${s.detail ?? ""}`)
      .join(" | ");
    // 圆柱特征：侧面积 2πrh、体积 πr²h
    expect(joined).toContain("2\\pi r h");
    expect(joined).toContain("\\pi r^2 h");
    // 不得出现圆锥体积系数 1/3 与母线斜高 l = √(r²+h²)
    expect(joined).not.toContain("\\frac{1}{3}\\pi r^2 h");
    expect(joined).not.toContain("l = \\sqrt{r^2 + h^2}");
    // 第三步必须是矩形展开而非圆心角
    expect(joined).toContain("2\\pi r");
    expect(joined).not.toMatch(/\\alpha = \\frac\{r\}\{l\}/);
  });

  it("圆锥仍走圆锥公式（回归保护）", () => {
    const panel = buildRotationBodyPanel({
      r1: 1.5,
      r2: 0.8,
      height: 3,
      cutDistance: 0.8,
      shape: "rightTriangle",
    } as unknown as Record<string, number>);
    const joined = (panel.reasoningSteps ?? [])
      .map((s) => `${s.latex ?? ""}${s.detail ?? ""}`)
      .join(" | ");
    expect(joined).toContain("\\frac{1}{3}\\pi r^2 h");
    expect(joined).toContain("\\pi r l");
  });
});
