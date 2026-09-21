import { describe, it, expect } from "vitest";
import { calculateMarkovChain } from "../probabilityMarkov";
import { MARKOV_PRESETS } from "@/data/registries/probabilityMarkov";

describe("马尔可夫链动力学分类与退化极限测试", () => {
  it("退化常数列：当转移差 lambda = 1 时，全步概率严格等于初值", () => {
    // p0 = 0.6, p00 = 1, p10 = 0 => lambda = 1 - 0 = 1
    const res = calculateMarkovChain(0.6, 1.0, 0.0, 10);
    expect(res.lambda).toBe(1);
    expect(res.dynamicType).toBe("degenerate_constant");
    expect(res.isDegenerate).toBe(true);
    expect(res.steps.length).toBe(10);
    // 所有步都保持 0.6
    res.steps.forEach((step) => {
      expect(step.p1).toBeCloseTo(0.6);
    });
  });

  it("纯等幅振荡：当转移差 lambda = -1 时，全步呈双周期两值振荡", () => {
    // p0 = 0.7, p00 = 0, p10 = 1 => lambda = 0 - 1 = -1
    const res = calculateMarkovChain(0.7, 0.0, 1.0, 6);
    expect(res.lambda).toBe(-1);
    expect(res.dynamicType).toBe("pure_oscillating");
    expect(res.isPureOscillating).toBe(true);
    expect(res.steps[0].p1).toBeCloseTo(0.7);
    expect(res.steps[1].p1).toBeCloseTo(0.3);
    expect(res.steps[2].p1).toBeCloseTo(0.7);
    expect(res.steps[3].p1).toBeCloseTo(0.3);
  });

  it("单调收敛：0 < lambda < 1 时呈现单调逼近极限值", () => {
    // p00 = 0.8, p10 = 0.3 => lambda = 0.5
    const res = calculateMarkovChain(0.1, 0.8, 0.3, 15);
    expect(res.lambda).toBeCloseTo(0.5);
    expect(res.dynamicType).toBe("convergent_monotonic");
    expect(res.isDegenerate).toBe(false);
    expect(res.isPureOscillating).toBe(false);
    // 初值为0.1，稳态为 0.3 / (1 - 0.5) = 0.6，单调上升
    for (let i = 0; i < res.steps.length - 1; i++) {
      expect(res.steps[i + 1].p1).toBeGreaterThan(res.steps[i].p1);
    }
    expect(res.pStationary).toBeCloseTo(0.6);
  });

  it("阻尼振荡收敛：-1 < lambda < 0 时呈现交替围绕极限值收敛", () => {
    // lambda = -0.5
    // p00 = 0.2, p10 = 0.7 => lambda = 0.2 - 0.7 = -0.5
    const res = calculateMarkovChain(0.8, 0.2, 0.7, 10);
    expect(res.lambda).toBeCloseTo(-0.5);
    expect(res.dynamicType).toBe("convergent_damped");
    expect(res.isOscillating).toBe(true);
    const pInf = res.pStationary;
    // 偏差符号交替
    for (let i = 0; i < 6; i++) {
      const diffCurrent = res.steps[i].p1 - pInf;
      const diffNext = res.steps[i + 1].p1 - pInf;
      expect(diffCurrent * diffNext).toBeLessThanOrEqual(0);
    }
  });

  it("预设完整性：所有预设的初值与转移概率均符合 [0, 1] 概率公理", () => {
    Object.values(MARKOV_PRESETS).forEach((scenario) => {
      const p = scenario.params;
      expect(p.p1).toBeGreaterThanOrEqual(0);
      expect(p.p1).toBeLessThanOrEqual(1);
      expect(p.p11).toBeGreaterThanOrEqual(0);
      expect(p.p11).toBeLessThanOrEqual(1);
      expect(p.p21).toBeGreaterThanOrEqual(0);
      expect(p.p21).toBeLessThanOrEqual(1);
    });
  });
});
