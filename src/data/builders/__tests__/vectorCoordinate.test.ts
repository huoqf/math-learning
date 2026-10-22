import { describe, it, expect } from "vitest";
import { buildVectorLinearPanel } from "../vectorLinear";

/**
 * 直角坐标运算模式（必修二 6.3）的看板契约。
 *
 * 该模式补的是「平面向量运算的坐标表示」这一课标承载面：
 * 加减数乘的坐标公式、以及共线判据 x₁y₂ − x₂y₁ = 0。
 * 这里锁定三件事：① 坐标运算必须与手算逐位相符；② 共线判据的两种结果都要出现；
 * ③ 推导链三步齐全且带采分点标签（不得回退成只有一个总述的空链接）。
 */
describe("VectorLinear Builder — 直角坐标运算模式", () => {
  const build = (params: Record<string, number>) =>
    buildVectorLinearPanel(params, { studyMode: "coordinate" });

  it("加减与数乘的坐标逐位可验算（a=(3,1)、b=(1,3)）", () => {
    const panel = build({ xa: 3, ya: 1, xb: 1, yb: 3, lambda: 2 });
    const byLabel = (kw: string) =>
      panel.quantities.find((q) => q.label.includes(kw))?.value ?? "";

    expect(byLabel("向量 a 的坐标")).toBe("(3, 1)");
    expect(byLabel("向量 b 的坐标")).toBe("(1, 3)");
    expect(byLabel("和向量")).toBe("(4, 4)");
    expect(byLabel("差向量")).toBe("(2, -2)");
    expect(byLabel("数乘向量")).toBe("(6, 2)");
  });

  it("共线判据：交叉相乘为 8 时判「不共线」，为 0 时判「共线」", () => {
    const notCollinear = build({ xa: 3, ya: 1, xb: 1, yb: 3 });
    const det8 =
      notCollinear.quantities.find((q) => q.label.includes("共线判据"))
        ?.value ?? "";
    expect(det8).toContain("8");
    expect(det8).toContain("不共线");

    // a=(2,1)、b=(4,2)：b = 2a，det = 2×2 − 4×1 = 0
    const collinear = build({ xa: 2, ya: 1, xb: 4, yb: 2 });
    const det0 =
      collinear.quantities.find((q) => q.label.includes("共线判据"))?.value ??
      "";
    expect(det0).toContain("0");
    expect(det0).toContain("共线");
    expect(det0).not.toContain("不共线");
  });

  it("推导链三步齐全，且每步都有采分点标签", () => {
    const panel = build({ xa: 3, ya: 1, xb: 1, yb: 3 });
    expect(panel.reasoningSteps).toBeDefined();
    expect(panel.reasoningSteps).toHaveLength(3);
    panel.reasoningSteps!.forEach((step) => {
      expect(step.rubric ?? "").toContain("【高考采分点】");
      expect((step.detail ?? "").length).toBeGreaterThan(20);
    });
    // 第三步必须落到判据本身，而不是泛泛而谈
    expect(panel.reasoningSteps![2].latex).toContain("x_ay_b - x_by_a");
  });

  it("定理与口诀随模式切换，不与其它模式串味", () => {
    const panel = build({ xa: 3, ya: 1, xb: 1, yb: 3 });
    expect(
      panel.theorems.some((t) => t.name.includes("平面向量运算的坐标表示")),
    ).toBe(true);
    expect(panel.mnemonic ?? "").toContain("交叉相乘");
  });

  it("任意参数下看板不出现 NaN / undefined（含零向量与非整数）", () => {
    const grid: Array<Record<string, number>> = [
      { xa: 0, ya: 0, xb: 0, yb: 0 },
      { xa: -3.5, ya: 2.5, xb: 4.5, yb: -1.5 },
      { xa: 0, ya: 1, xb: 1, yb: 0 },
      { xa: 2, ya: 1, xb: 4, yb: 2, lambda: -2 },
    ];
    grid.forEach((params) => {
      const panel = build(params);
      panel.quantities.forEach((q) => {
        expect(q.value).not.toContain("NaN");
        expect(q.value).not.toContain("undefined");
      });
      panel.reasoningSteps?.forEach((s) => {
        expect(s.detail).not.toContain("NaN");
      });
    });
  });
});
