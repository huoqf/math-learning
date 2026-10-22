import { describe, it, expect } from "vitest";
import { buildSequencePanel } from "../sequence";
import { calcSnToAn } from "@/math/sequence";

/**
 * 已知 S_n 求 a_n（选择性必修二 4.1）的契约。
 *
 * 本模式的全部教学价值在「首项必须单独验证」这一条上，因此这里锁定三件事：
 *   ① 作差 a_n = S_n − S_{n−1} 在 n ≥ 2 恒等于真实通项（常数项 C 必须抵消）；
 *   ② C = 0 时可合并、C ≠ 0 时必须分段，两种结论都要被识别；
 *   ③ 看板不得给出「直接合并」的错误引导。
 */
describe("数学层 calcSnToAn — 作差法的数值内核", () => {
  it("n ≥ 2 处 S_n − S_{n−1} 恒等于真实通项（含 C ≠ 0）", () => {
    for (const C of [0, 2, -3, 0.5]) {
      const res = calcSnToAn(5, -1.5, 8, C);
      expect(res.isValid).toBe(true);
      res.terms.forEach((t) => {
        if (t.n === 1) {
          expect(t.anFromSn).toBeNull();
        } else {
          expect(t.anFromSn).toBeCloseTo(t.anReal, 10);
        }
      });
    }
  });

  it("首项 S_1 = a_1 + C：C ≠ 0 时不等于作差式在 n = 1 的取值", () => {
    const zero = calcSnToAn(5, -1.5, 8, 0);
    expect(zero.a1FromSn).toBeCloseTo(5, 10);
    expect(zero.a1FromFormula).toBeCloseTo(5, 10);
    expect(zero.isFirstTermConsistent).toBe(true);

    const shifted = calcSnToAn(5, -1.5, 8, 2);
    expect(shifted.a1FromSn).toBeCloseTo(7, 10);
    expect(shifted.a1FromFormula).toBeCloseTo(5, 10);
    expect(shifted.isFirstTermConsistent).toBe(false);
  });
});

describe("Sequence Builder — snToAn 模式看板", () => {
  const build = (snConst: number) =>
    buildSequencePanel(
      { a1: 5, d: -1.5, N: 8, snConst, snConstRaw: 0 },
      { activeMode: "arithmetic", arithmeticSubMode: "snToAn" },
    );

  it("C = 0：结论为可合并，且推导链仍保留首项验证步骤", () => {
    const panel = build(0);
    const texts = panel.quantities.map((q) => q.value).join(" | ");
    expect(texts).toContain("S_n =");
    expect(texts).toContain("a_1 = S_1 = 5");
    expect(panel.reasoningSteps).toHaveLength(3);
    expect(panel.reasoningSteps![2].title).toContain("首项");
    expect(panel.warnings ?? []).toHaveLength(0);
  });

  it("C = 2：首项脱轨，必须出现分段结论与警示", () => {
    const panel = build(2);
    const texts = panel.quantities.map((q) => q.value).join(" | ");
    expect(texts).toContain("a_1 = S_1 = 7");
    // 作差式在 n = 1 的取值仍是 5，两者落差 2
    expect(texts).toContain("5");
    expect(panel.warnings?.some((w) => w.text.includes("必须分段"))).toBe(true);
    expect(panel.gaokaoPoints.some((g) => g.text.includes("分段形式"))).toBe(
      true,
    );
    // 第 3 步的 latex 应给出分段式，而不是合并式
    expect(panel.reasoningSteps![2].latex ?? "").toContain("\\begin{cases}");
  });

  it("任意参数下不出现 NaN / undefined", () => {
    [0, 2, -3, 7.5].forEach((C) => {
      const panel = build(C);
      panel.quantities.forEach((q) => {
        expect(q.value).not.toContain("NaN");
        expect(q.value).not.toContain("undefined");
      });
      panel.reasoningSteps?.forEach((s) => {
        expect(s.detail ?? "").not.toContain("NaN");
      });
    });
  });
});
