import { describe, it, expect } from "vitest";
import {
  calcInductionVerification,
  findPrimeCounterexample,
} from "@/math/sequence";
import { buildSequencePanel } from "@/data/builders/sequence";

/**
 * 第三阶段 G2：数学归纳法（选学拓展）。
 * 要守住的是「两步都是真的」：
 *   ① 奠基 P(1) 成立；
 *   ② 递推的增量恒等式对每个 k 都成立——这一步才是证明的灵魂。
 * 另外必须把「只奠基不递推」的反例 n²+n+41 钉死，否则学生会以为验算有限项就是证明。
 */
describe("数学归纳法引擎：两条腿分别验证", () => {
  it("奇数求和 1+3+…+(2n−1) = n²：逐项成立，且相邻增量恒等", () => {
    const res = calcInductionVerification("sum_odd", { N: 8 });
    expect(res.baseCaseHolds).toBe(true);
    expect(res.allRowsHold).toBe(true);
    expect(res.stepIdentityHolds).toBe(true);
    expect(res.rows.map((r) => r.leftValue)).toEqual([
      1, 4, 9, 16, 25, 36, 49, 64,
    ]);
    expect(res.rows.map((r) => r.rightValue)).toEqual(
      res.rows.map((r) => r.leftValue),
    );
    // 第 k 与第 k+1 项的增量是 2k+1，与 n² 的差分完全一致
    res.stepChecks.forEach((s) => {
      expect(s.lhsIncrement).toBe(2 * s.k + 1);
      expect(s.rhsIncrement).toBe(2 * s.k + 1);
      expect(s.ok).toBe(true);
    });
  });

  it("等比求和 1+2+…+2^(n−1) = 2^n − 1：逐项成立", () => {
    const res = calcInductionVerification("geo_sum", { N: 8 });
    expect(res.allRowsHold).toBe(true);
    expect(res.stepIdentityHolds).toBe(true);
    expect(res.rows[0]).toMatchObject({ n: 1, leftValue: 1, rightValue: 1 });
    expect(res.rows[7]).toMatchObject({
      n: 8,
      leftValue: 255,
      rightValue: 255,
    });
  });

  it("等差通项：递推值必须与猜想公式逐项一致", () => {
    const res = calcInductionVerification("linear_term", { a1: 3, d: 4, N: 6 });
    expect(res.allRowsHold).toBe(true);
    expect(res.rows[0].leftValue).toBe(3);
    expect(res.rows[5].leftValue).toBe(3 + 5 * 4);
    res.stepChecks.forEach((s) => {
      expect(s.lhsIncrement).toBeCloseTo(4, 12);
      expect(s.rhsIncrement).toBeCloseTo(4, 12);
      expect(s.ok).toBe(true);
    });
  });

  it("N 被钳制在 [2, 20]，不会因为滑块越界算出空表", () => {
    expect(calcInductionVerification("sum_odd", { N: 1 }).rows).toHaveLength(2);
    expect(calcInductionVerification("sum_odd", { N: 999 }).rows).toHaveLength(
      20,
    );
  });

  it("只奠基不递推的反例：n²+n+41 在 n=40 处塌成 41²", () => {
    const ce = findPrimeCounterexample();
    expect(ce).not.toBeNull();
    expect(ce).toMatchObject({ n: 40, value: 1681, factor: 41 });
    expect(41 * 41).toBe(1681);
    // 前 39 项确实全是质数，反例不是随便挑的
    for (let n = 1; n <= 39; n++) {
      const v = n * n + n + 41;
      let prime = true;
      for (let i = 2; i * i <= v; i++) {
        if (v % i === 0) {
          prime = false;
          break;
        }
      }
      expect(prime, `n=${n} 时 ${v} 不应是合数`).toBe(true);
    }
  });
});

describe("归纳法看板：两步框架必须写清楚", () => {
  const panel = (claim: "sum_odd" | "geo_sum" | "linear_term") =>
    buildSequencePanel(
      { a1: 1, stepParam: 2, N: 8 },
      {
        activeMode: "recurrence",
        subModel: "induction",
        inductionClaim: claim,
      },
    );

  it("看板给出奠基结论与增量核对结果", () => {
    const data = panel("sum_odd");
    const flat = data.quantities
      .map((q) => `${q.label}=${q.value}`)
      .join(" | ");
    expect(flat).toContain("奠基 $P(1)$ 是否成立=成立");
    expect(flat).toContain("逐项核对 $n=1$ 至 $n=8$=8 / 8 项成立");
    // N=8 时只有 7 组相邻增量
    expect(flat).toContain("7 / 7 组增量严格相等");
  });

  it("两步框架定理标注为选学拓展，并点明缺一不可", () => {
    const data = panel("geo_sum");
    const thm = data.theorems.find((t) => t.name.includes("两步框架"))!;
    expect(thm.latex).toContain("\\begin{cases}");
    expect(thm.isExtension).toBe(true);
    expect(thm.extensionBadge).toBe("拓展 · 选学");
    expect(thm.condition).toContain("缺一不可");
  });

  it("推导链按「奠基 → 假设 → 推 k+1」三步给出，且每步有数字", () => {
    const data = panel("sum_odd");
    const steps = data.reasoningSteps ?? [];
    expect(steps).toHaveLength(3);
    expect(steps[0].title).toContain("奠基");
    expect(steps[1].title).toContain("归纳假设");
    expect(steps[2].title).toContain("递推");
    expect(steps[0].latex).toContain("n = 1");
    expect(steps[2].latex).toContain("(k+1)^2");
  });

  it("等差通项命题的归纳步骤要真的用上归纳假设", () => {
    const data = panel("linear_term");
    const stepThm = data.theorems.find((t) => t.name.includes("归纳步骤"))!;
    expect(stepThm.latex).toContain("归纳假设");
    expect(stepThm.latex).toContain("a_{k+1}");
  });

  it("反例以看板读数形式常驻，提醒验算有限项不等于证明", () => {
    const data = panel("sum_odd");
    const flat = data.quantities
      .map((q) => `${q.label}=${q.value}`)
      .join(" | ");
    expect(flat).toContain("1681 = 41^2");
  });
});
