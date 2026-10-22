import { describe, it, expect } from "vitest";
import {
  computeClassicalProbability,
  simulateClassicalFrequency,
} from "@/math/probabilityClassical";
import { buildClassicalProbabilityPanel } from "@/data/builders/probabilityClassical";

const diceSeven = () =>
  computeClassicalProbability({
    modelType: "dice_two",
    targetEvent: "sum_k",
    targetSum: 7,
    drawMode: "without_replacement",
    redBalls: 2,
    whiteBalls: 3,
  });

/**
 * 第三阶段 G3：古典概型的大样本频率试验。
 * 要守住三件事：
 *   ① 抽样必须忠实于「等可能」——命中率收敛到算出来的概率，而不是另一个数；
 *   ② 同一 seed 结果可复现（否则测试无法钉数值，学生也无法复看同一次试验）；
 *   ③ 频率与概率是两个概念，看板必须把这句话写明。
 */
describe("频率试验引擎：等可能抽样与频率稳定性", () => {
  it("掷两枚骰子和为 7：大样本频率收敛到 1/6", () => {
    const mathRes = diceSeven();
    expect(mathRes.totalCount).toBe(36);
    expect(mathRes.eventCount).toBe(6);
    expect(mathRes.probability).toBeCloseTo(1 / 6, 10);

    const sim = simulateClassicalFrequency(mathRes, 20000, 20260101);
    expect(sim.trials).toBe(20000);
    expect(sim.totalCount).toBe(36);
    // 命中率与 n(A)/n(Ω) 同源：样本池里的事件点必须正好占 1/6
    expect(sim.eventCount / sim.totalCount).toBeCloseTo(1 / 6, 10);
    expect(sim.frequency).toBeCloseTo(1 / 6, 2);
    expect(sim.absError).toBeLessThan(0.02);
    expect(sim.withinTolerance).toBe(true);
  });

  it("同一 seed 结果完全可复现，换 seed 才会变", () => {
    const mathRes = diceSeven();
    const a = simulateClassicalFrequency(mathRes, 800, 7);
    const b = simulateClassicalFrequency(mathRes, 800, 7);
    const c = simulateClassicalFrequency(mathRes, 800, 8);
    expect(a.hits).toBe(b.hits);
    expect(a.frequency).toBe(b.frequency);
    expect(c.hits).not.toBe(a.hits);
  });

  it("轨迹按试验次数递增，末点就是最终频率", () => {
    const sim = simulateClassicalFrequency(diceSeven(), 1000, 20260101);
    expect(sim.track.length).toBeGreaterThan(4);
    for (let i = 1; i < sim.track.length; i++) {
      expect(sim.track[i].trials).toBeGreaterThan(sim.track[i - 1].trials);
      expect(sim.track[i].hits).toBeGreaterThanOrEqual(sim.track[i - 1].hits);
    }
    const last = sim.track[sim.track.length - 1];
    expect(last.trials).toBe(1000);
    expect(last.frequency).toBeCloseTo(sim.frequency, 12);
    expect(last.absError).toBeCloseTo(sim.absError, 12);
  });

  it("试验次数被钳制在 [1, 20000]，极端输入不会算出 NaN", () => {
    const mathRes = diceSeven();
    expect(simulateClassicalFrequency(mathRes, 0.2, 1).trials).toBe(1);
    expect(simulateClassicalFrequency(mathRes, 999999, 1).trials).toBe(20000);
    const one = simulateClassicalFrequency(mathRes, 1, 1);
    expect(Number.isFinite(one.frequency)).toBe(true);
    expect(one.frequency === 0 || one.frequency === 1).toBe(true);
  });

  it("样本空间为空时给出无效结果而不是崩溃", () => {
    const empty = simulateClassicalFrequency(
      { samplePoints: [], probability: 0, totalCount: 0 },
      500,
      1,
    );
    expect(empty.validity).toBe(false);
    expect(empty.trials).toBe(0);
    expect(empty.track).toEqual([]);
  });
});

describe("频率视图看板：频率与概率必须被区分开", () => {
  const panel = (activeView: string) =>
    buildClassicalProbabilityPanel({
      modelType: "dice_two",
      targetEvent: "sum_k",
      targetSum: 7,
      activeView,
      trials: 2000,
      simSeed: 20260101,
    });

  it("频率视图追加试验次数、命中次数、频率与偏差四项读数", () => {
    const data = panel("frequency");
    const flat = data.quantities
      .map((q) => `${q.label}=${q.value}`)
      .join(" | ");
    expect(flat).toContain("试验次数 $n$=2000");
    expect(flat).toContain("事件 $A$ 发生次数");
    expect(flat).toContain("试验频率 $f_n(A) = \\frac{n_A}{n}$");
    expect(flat).toContain("与理论概率的偏差");
  });

  it("频率视图给出频率稳定性定理，并申明概率是确定常数", () => {
    const data = panel("frequency");
    const thm = data.theorems.find((t) => t.name.includes("频率稳定性"))!;
    expect(thm.latex).toContain("n \\to \\infty");
    expect(thm.note).toContain("确定常数");
  });

  it("矩阵视图不受影响：不出现频率读数，保持原样", () => {
    const data = panel("matrix");
    const flat = data.quantities.map((q) => q.label).join(" | ");
    expect(flat).not.toContain("试验次数");
    expect(data.theorems.some((t) => t.name.includes("频率稳定性"))).toBe(
      false,
    );
  });

  it("教学落点写进高考点：不能把频率当概率", () => {
    const data = panel("frequency");
    const texts = data.gaokaoPoints.map((g) => g.text).join(" | ");
    expect(texts).toContain("频率≠概率");
  });
});
