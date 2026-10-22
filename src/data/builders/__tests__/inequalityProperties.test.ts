import { describe, it, expect } from "vitest";
import { analyzeInequalityProperties } from "@/math/inequalityProperties";
import { buildInequalityBasicPanel } from "../inequalityBasic";

/**
 * 等式与不等式的性质（必修一 2.1）契约。
 *
 * 该模式只讲一件事：用差（或积）的符号判大小。因此锁定
 *   ① 作差符号与大小关系必须一致；
 *   ② 同加恒不变向（对任意 c）；
 *   ③ 同乘只在 c < 0 时变向，c = 0 退化为等式。
 */
describe("analyzeInequalityProperties — 符号判定", () => {
  it("作差符号给出大小关系", () => {
    expect(analyzeInequalityProperties(3, -1, 0).relation).toBe("gt");
    expect(analyzeInequalityProperties(-1, 3, 0).relation).toBe("lt");
    expect(analyzeInequalityProperties(2, 2, 0).relation).toBe("eq");
  });

  it("同加任意实数都不变向", () => {
    [-5, -2, 0, 1.5, 4].forEach((c) => {
      const r = analyzeInequalityProperties(3, -1, c);
      expect(r.sumRelation).toBe(r.relation);
      // 同加后差保持不变
      expect(r.sumA - r.sumB).toBeCloseTo(r.diff, 10);
    });
  });

  it("同乘负数变向、乘正数不变、乘零退化为等式", () => {
    const neg = analyzeInequalityProperties(3, -1, -2);
    expect(neg.relation).toBe("gt");
    expect(neg.prodRelation).toBe("lt");
    expect(neg.isProdReversed).toBe(true);

    const pos = analyzeInequalityProperties(3, -1, 2);
    expect(pos.prodRelation).toBe("gt");
    expect(pos.isProdReversed).toBe(false);

    const zero = analyzeInequalityProperties(3, -1, 0);
    expect(zero.prodRelation).toBe("eq");
    expect(zero.isProdReversed).toBe(false);
  });

  it("两数相等时乘负数不算「变向」（仍相等）", () => {
    const r = analyzeInequalityProperties(2, 2, -3);
    expect(r.relation).toBe("eq");
    expect(r.prodRelation).toBe("eq");
    expect(r.isProdReversed).toBe(false);
  });
});

describe("InequalityBasic Builder — properties 模式看板", () => {
  const build = (pA: number, pB: number, pC: number) =>
    buildInequalityBasicPanel(
      { a: 4, b: 2, k: 4, pA, pB, pC },
      { studyMode: "properties" },
    );

  it("三条性质各自出现在看板与推导链中", () => {
    const panel = build(3, -1, -2);
    const labels = panel.quantities.map((q) => q.label).join(" | ");
    expect(labels).toContain("作差结果");
    expect(labels).toContain("同加");
    expect(labels).toContain("同乘");
    expect(panel.theorems.map((t) => t.name).join("|")).toContain("可乘性");
    expect(panel.reasoningSteps).toHaveLength(3);
  });

  it("同乘负数时看板给出变向结论并附警示", () => {
    const panel = build(3, -1, -2);
    const prod = panel.quantities.find((q) => q.label.includes("同乘"));
    expect(prod?.value).toContain("<");
    expect(panel.warnings?.some((w) => w.text.includes("变向"))).toBe(true);
    expect(panel.reasoningSteps![2].latex ?? "").toContain("ac < bc");
  });

  it("c = 0 时退化为等式并给出专门警示", () => {
    const panel = build(3, -1, 0);
    const prod = panel.quantities.find((q) => q.label.includes("同乘"));
    expect(prod?.value).toContain("=");
    expect(panel.warnings?.some((w) => w.text.includes("退化"))).toBe(true);
  });

  it("任意参数下不出现 NaN / undefined", () => {
    [
      [0, 0, 0],
      [-6, 6, -5],
      [2.5, -2.5, 5],
      [1, 1, -1],
    ].forEach(([a, b, c]) => {
      const panel = build(a, b, c);
      panel.quantities.forEach((q) => {
        expect(q.value).not.toContain("NaN");
        expect(q.value).not.toContain("undefined");
      });
    });
  });
});
