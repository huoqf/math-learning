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

  it("准 P0 修复保护：生成模式下扫掠角未满整周时，右屏必须显式出示理论值说明与扫掠角进度", () => {
    // 旋转 180°（半圆柱中屏图形）
    const panelPartial = buildRotationBodyPanel(
      {
        r1: 1.5,
        height: 3,
        shape: "rectangle",
        sweepAngleDeg: 180,
      } as unknown as Record<string, number>,
      { mode: "generation" },
    );

    // 必须有扫掠角数学量
    const sweepQ = panelPartial.quantities.find(
      (q) => q.label === "生成扫掠角",
    );
    expect(sweepQ?.value).toBe("180°");

    // 必须有警示说明数值为 360° 整周理论值
    expect(
      panelPartial.warnings?.some(
        (w) =>
          w.text.includes("当前仅旋转扫掠 180°") &&
          w.text.includes("360° 完整闭合旋转体"),
      ),
    ).toBe(true);

    // 对照支：完整旋转 360° 时不报该警示
    const panelFull = buildRotationBodyPanel(
      {
        r1: 1.5,
        height: 3,
        shape: "rectangle",
        sweepAngleDeg: 360,
      } as unknown as Record<string, number>,
      { mode: "generation" },
    );
    expect(panelFull.warnings?.some((w) => w.text.includes("生成态演示"))).toBe(
      false,
    );

    // 对照支：轴截面模式下不报该警示
    const panelSection = buildRotationBodyPanel(
      {
        r1: 1.5,
        height: 3,
        shape: "rectangle",
        sweepAngleDeg: 180,
      } as unknown as Record<string, number>,
      { mode: "section" },
    );
    expect(
      panelSection.warnings?.some((w) => w.text.includes("生成态演示")),
    ).toBe(false);
  });
});
