import { describe, it, expect } from "vitest";
import { calculateMarkovChain } from "../probabilityMarkov";

describe("全概率一阶递推数列模型 (calculateMarkovChain)", () => {
  it("三人传球模型 (2020新高考I卷真题)：交替振荡衰减收敛至 1/3", () => {
    // p1 = 1.0 (初始在甲), p11 = 0 (甲必传出), p21 = 0.5 (乙丙各半回传)
    const res = calculateMarkovChain(1.0, 0.0, 0.5, 6);

    expect(res.lambda).toBeCloseTo(-0.5, 4);
    expect(res.pStationary).toBeCloseTo(1 / 3, 4);
    expect(res.isOscillating).toBe(true);

    // p1 = 1.0
    expect(res.steps[0].p1).toBeCloseTo(1.0, 4);
    // p2 = 0 * 1 + 0.5 * 0 = 0.0
    expect(res.steps[1].p1).toBeCloseTo(0.0, 4);
    // p3 = 0 * 0 + 0.5 * 1 = 0.5
    expect(res.steps[2].p1).toBeCloseTo(0.5, 4);
    // p4 = 0 * 0.5 + 0.5 * 0.5 = 0.25
    expect(res.steps[3].p1).toBeCloseTo(0.25, 4);

    // 检查通项公式闭环一致性: p_n = 1/3 + (2/3) * (-1/2)^{n-1}
    for (let n = 1; n <= 6; n++) {
      const expectedPn = 1 / 3 + (2 / 3) * Math.pow(-0.5, n - 1);
      expect(res.steps[n - 1].p1).toBeCloseTo(expectedPn, 4);
    }
  });

  it("四人传球模型：精确分数 p21=1/3 时，不动点精确等于 0.25", () => {
    const res = calculateMarkovChain(1.0, 0.0, 1 / 3, 5);

    expect(res.lambda).toBeCloseTo(-1 / 3, 4);
    expect(res.pStationary).toBeCloseTo(0.25, 4);
    expect(res.isOscillating).toBe(true);

    // p1 = 1, p2 = 0, p3 = 1/3
    expect(res.steps[0].p1).toBeCloseTo(1.0, 4);
    expect(res.steps[1].p1).toBeCloseTo(0.0, 4);
    expect(res.steps[2].p1).toBeCloseTo(1 / 3, 4);

    // 通项公式: p_n = 0.25 + 0.75 * (-1/3)^{n-1}
    for (let n = 1; n <= 5; n++) {
      const expectedPn = 0.25 + 0.75 * Math.pow(-1 / 3, n - 1);
      expect(res.steps[n - 1].p1).toBeCloseTo(expectedPn, 4);
    }
  });

  it("乒乓加赛模型：公比 lambda > 0，单调递减收敛至平稳值", () => {
    // p1 = 0.75, p11 = 0.7, p21 = 0.2 => lambda = 0.5
    const res = calculateMarkovChain(0.75, 0.7, 0.2, 5);

    expect(res.lambda).toBeCloseTo(0.5, 4);
    expect(res.pStationary).toBeCloseTo(0.4, 4);
    expect(res.isOscillating).toBe(false);

    // 单调递减验证: p1 > p2 > p3 > p4 > t
    for (let i = 0; i < 4; i++) {
      expect(res.steps[i].p1).toBeGreaterThan(res.steps[i + 1].p1);
      expect(res.steps[i].p1).toBeGreaterThan(res.pStationary);
    }
  });

  it("单步递推迭代与通项公式双向严格吻合", () => {
    const p1 = 0.8;
    const p11 = 0.4;
    const p21 = 0.6;
    const res = calculateMarkovChain(p1, p11, p21, 8);

    const t = res.pStationary;
    const lambda = res.lambda;
    const b1 = p1 - t;

    res.steps.forEach((step) => {
      const formulaVal = t + b1 * Math.pow(lambda, step.n - 1);
      expect(step.p1).toBeCloseTo(formulaVal, 4);
    });
  });
});
