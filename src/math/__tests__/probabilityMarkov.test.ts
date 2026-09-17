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

/**
 * 回归防线（来源：概率统计模块审计 P0-2）：
 * 右屏「高考采分步」正文与口诀必须与同面板「严禁书写 $\lim$ 记号」的答题规范警告保持自洽。
 * 高中课标不含数列极限，卷面写极限记号属失分点，故此处把口径变成机器可裁决项。
 */
describe("答题规范门禁：递推文案严禁极限记号与超纲术语", () => {
  // 覆盖 step3/step4 的全部分支：退化(λ=1) / 常数列 / 永久振荡(λ=-1) / 振荡(|λ|<1) / 单调(0≤λ<1)
  const branches: Array<{
    name: string;
    args: [number, number, number, number];
  }> = [
    { name: "退化恒等 (λ=1)", args: [0.8, 1, 0, 6] },
    { name: "常数列 (p₁=t)", args: [0.4, 0.4, 0.4, 6] },
    { name: "永久等幅振荡 (λ=-1)", args: [1, 0, 1, 6] },
    { name: "交替振荡衰减 (-1<λ<0)", args: [1, 0, 0.5, 6] },
    { name: "单调趋近 (0≤λ<1)", args: [0.75, 0.7, 0.2, 5] },
  ];

  function collectStepTexts(
    res: ReturnType<typeof calculateMarkovChain>,
  ): string {
    return [
      res.step1_partition,
      res.step2_recurrence,
      res.step3_geometric,
      res.step4_generalTerm,
      res.recurrenceText,
      res.geometricText,
      res.generalTermText,
      ...Object.values(res.gaokaoSteps),
    ].join("\n");
  }

  for (const { name, args } of branches) {
    it(`${name}：正文不得出现 \\lim 与 \\to \\infty 记号`, () => {
      const text = collectStepTexts(calculateMarkovChain(...args));
      expect(text).not.toContain("\\lim");
      expect(text).not.toContain("\\to \\infty");
      expect(text).not.toContain("极限");
    });
  }

  it("全文不得出现超纲术语「马尔可夫链」「平稳分布」「特征方程」", () => {
    for (const { args } of branches) {
      const text = collectStepTexts(calculateMarkovChain(...args));
      expect(text).not.toContain("马尔可夫链");
      expect(text).not.toContain("平稳分布");
      expect(text).not.toContain("特征方程");
      expect(text).not.toContain("特征公比");
    }
  });

  it("振荡分支必须改用「随项数增大趋近于定值」的中文规范表述", () => {
    const osc = calculateMarkovChain(1, 0, 0.5, 6);
    expect(osc.isOscillating).toBe(true);
    expect(osc.step4_generalTerm).toContain("趋近于");

    const mono = calculateMarkovChain(0.75, 0.7, 0.2, 5);
    expect(mono.isOscillating).toBe(false);
    expect(mono.step4_generalTerm).toContain("趋近于定值");
  });
});
