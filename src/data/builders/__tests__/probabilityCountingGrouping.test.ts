import { describe, it, expect } from "vitest";
import { buildProbabilityCountingPanel } from "@/data/builders/probabilityCounting";

/**
 * 均分模型右屏看板 · 退化态门禁。
 *
 * 改前右屏把滑块的 $N=8$ 静默印成 $6$：math 层用 `validTotal = floor(N/k)*k`
 * 回填了 totalItems，右屏照抄，于是「总元素数 N = 6」与左屏滑块 8 同屏打架。
 * 定案是不锁滑块（整除性检验本身是高频考点），由右屏如实报「无解」。
 */
function build(N: number, K: number) {
  return buildProbabilityCountingPanel(
    { groupTotal: N, groupCount: K },
    { activeMode: "perm_comb", subMode: 1 },
  );
}

describe("均分模型右屏 · 不可整除帧必须报无解", () => {
  const CASES: Array<{ n: number; k: number; remainder: number }> = [
    { n: 4, k: 3, remainder: 1 },
    { n: 6, k: 4, remainder: 2 },
    { n: 8, k: 3, remainder: 2 },
  ];

  for (const c of CASES) {
    it(`N=${c.n}, k=${c.k}：总元素数如实显示 ${c.n}，并给出 danger 级预警`, () => {
      const data = build(c.n, c.k);
      const q = data.quantities ?? [];

      // 1. 总元素数必须等于滑块值——这是原始 bug 的正中心
      expect(q.find((x) => x.symbol === "N")?.value).toBe(c.n);
      // 2. 组数 k 如实显示滑块值（把 k 印成 0 会制造新的三屏撕裂）
      expect(q.find((x) => x.symbol === "k")?.value).toBe(c.k);
      // 3. 每组元素数无定义 → 0，且标签点明「无解」
      const m = q.find((x) => x.symbol === "m");
      expect(m?.value).toBe(0);
      expect(m?.label).toContain("无解");
      // 4. 三个计数一律 0，不能出现「15 种」这类伪装成结论的数字
      expect(q.find((x) => x.symbol === "\\prod C")?.value).toBe(0);
      expect(q.find((x) => x.symbol === "\\frac{\\prod C}{k!}")?.value).toBe(0);

      // 5. 必须有一条 danger 级预警，且把余数讲出来
      const danger = (data.warnings ?? []).filter((w) => w.level === "danger");
      expect(danger).toHaveLength(1);
      expect(danger[0].text).toContain(`N=${c.n}`);
      expect(danger[0].text).toContain(`k=${c.k}`);
      expect(danger[0].text).toContain(`r=${c.remainder}`);

      // 6. 推导链改为「先验整除性 → 前提不成立 → 结论书写」，不得再出现组合式
      const steps = data.reasoningSteps ?? [];
      expect(steps).toHaveLength(3);
      expect(steps[0].title).toContain("整除性");
      expect(steps.map((s) => s.latex).join(" ")).not.toContain("C_{");
      for (const s of steps) {
        expect(s.rubric ?? "").toContain("【高考采分点】");
      }
    });
  }
});

describe("均分模型右屏 · 可整除帧不受影响", () => {
  it("N=6, k=3 保持 90 ÷ 3! = 15，且无预警", () => {
    const data = build(6, 3);
    const q = data.quantities ?? [];
    expect(q.find((x) => x.symbol === "N")?.value).toBe(6);
    expect(q.find((x) => x.symbol === "m")?.value).toBe(2);
    expect(q.find((x) => x.symbol === "m")?.label).toBe("每组元素数");
    expect(q.find((x) => x.symbol === "\\prod C")?.value).toBe(90);
    expect(q.find((x) => x.symbol === "\\frac{\\prod C}{k!}")?.value).toBe(15);
    expect(data.warnings ?? []).toHaveLength(0);
    expect(data.reasoningSteps?.[2]?.latex).toContain("15");
  });
});
