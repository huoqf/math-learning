import { describe, it, expect } from "vitest";
import {
  calculateConditionalProb,
  calculateTotalProb,
  calculateBayesDiagnostic,
  calculateMarkovChain,
  calculateWarnerModel,
} from "../probabilityBayes";

describe("probabilityBayes math module", () => {
  it("should calculate conditional probability correctly", () => {
    const res = calculateConditionalProb(0.5, 0.4, 0.2);
    expect(res.pB_given_A).toBeCloseTo(0.4);
    expect(res.pA_given_B).toBeCloseTo(0.5);
    expect(res.pUnion).toBeCloseTo(0.7);
    expect(res.isDegenerate).toBe(false);
  });

  it("should handle degenerate P(A) = 0 condition", () => {
    const res = calculateConditionalProb(0, 0.4, 0);
    expect(res.isDegenerate).toBe(true);
    expect(res.pB_given_A).toBe(0);
    expect(res.warningMsg).toContain("退化状态");
  });

  it("should calculate total probability correctly", () => {
    const res = calculateTotalProb([
      { key: "A1", name: "A1", pAi: 0.4, pB_given_Ai: 0.6 },
      { key: "A2", name: "A2", pAi: 0.35, pB_given_Ai: 0.3 },
      { key: "A3", name: "A3", pAi: 0.25, pB_given_Ai: 0.8 },
    ]);
    // P(B) = 0.4*0.6 + 0.35*0.3 + 0.25*0.8 = 0.24 + 0.105 + 0.20 = 0.545
    expect(res.pB).toBeCloseTo(0.545);
    expect(res.partitions[0].posterior).toBeCloseTo(0.24 / 0.545);
  });

  it("should calculate Bayes diagnostic post-test probability (classic disease screening)", () => {
    // 先验患病率 2%, 灵敏度 95%, 假阳性率 5%
    const res = calculateBayesDiagnostic(0.02, 0.95, 0.05);
    // True Positive = 0.02 * 0.95 = 0.019
    // False Positive = 0.98 * 0.05 = 0.049
    // P(+) = 0.019 + 0.049 = 0.068
    // P(D|+) = 0.019 / 0.068 ≈ 0.2794 (27.94%)
    expect(res.pTotalPositive).toBeCloseTo(0.068);
    expect(res.pPosteriorD).toBeCloseTo(0.2794, 3);
  });

  it("should calculate Markov Chain recurrence correctly (Pass Ball Game model)", () => {
    // 甲乙丙传球模型：球在甲手中为状态 1。p1 = 1.0, p11 = 0, p21 = 0.5
    // p_{n+1} = -0.5 * p_n + 0.5
    // 稳态 p_infty = 0.5 / (1 - (-0.5)) = 1/3 ≈ 0.3333
    const res = calculateMarkovChain(1.0, 0, 0.5, 10);
    expect(res.lambda).toBeCloseTo(-0.5);
    expect(res.pStationary).toBeCloseTo(1 / 3);
    expect(res.isOscillating).toBe(true);
    expect(res.isPureOscillating).toBe(false);

    // p_1 = 1.0
    expect(res.steps[0].p1).toBeCloseTo(1.0);
    // p_{n+1} = p_{11} * p_n + p_{21} * (1 - p_n)
    // p_2 = 0 * 1.0 + 0.5 * (1 - 1.0) = 0.0
    expect(res.steps[1].p1).toBeCloseTo(0.0);
    // p_3 = 0 * 0.0 + 0.5 * (1 - 0.0) = 0.5
    expect(res.steps[2].p1).toBeCloseTo(0.5);
    // p_4 = 0 * 0.5 + 0.5 * (1 - 0.5) = 0.25
    expect(res.steps[3].p1).toBeCloseTo(0.25);

    // 蛛网图轨迹测试
    expect(res.cobwebPoints.length).toBeGreaterThan(0);
    expect(res.cobwebPoints[0].x).toBeCloseTo(1.0);

    // 高考 4 步法生成测试
    expect(res.gaokaoSteps.step1_define).toContain("设第 n 步系统处于状态");
    expect(res.gaokaoSteps.step2_recurrence).toContain("由全概率公式");
    expect(res.gaokaoSteps.step3_geometric).toContain("等比数列");
    expect(res.gaokaoSteps.step4_generalTerm).toContain("通项公式");

    // 格式严谨性断言：杜绝 ((-0.50)) 双重括号缺陷
    expect(res.generalTermLatex).not.toContain("((");
    expect(res.generalTermText).not.toContain("((");
    expect(res.generalTermLatex).toContain("(-0.50)^{n-1}");
  });

  it("should handle lambda = -1 (pure oscillation, no steady state)", () => {
    // p11=0, p21=1 → lambda = -1，序列在 1 和 0 之间永久等幅振荡
    const res = calculateMarkovChain(1.0, 0, 1.0, 6);
    expect(res.lambda).toBeCloseTo(-1);
    expect(res.isPureOscillating).toBe(true);
    expect(res.isOscillating).toBe(false); // 不是收敛振荡
    expect(res.isDegenerate).toBe(false);
    // 稳态仍可计算（数学上的不动点存在，但极限不存在）
    // pStationary = 1 / (1 - (-1)) = 0.5
    expect(res.pStationary).toBeCloseTo(0.5);
    // 序列：1, 0, 1, 0, 1, 0...
    expect(res.steps[0].p1).toBeCloseTo(1.0);
    expect(res.steps[1].p1).toBeCloseTo(0.0);
    expect(res.steps[2].p1).toBeCloseTo(1.0);
    expect(res.steps[3].p1).toBeCloseTo(0.0);
    // step4 不应输出收敛场景专属的「故稳态极限 lim p_n =」结论
    expect(res.gaokaoSteps.step4_generalTerm).not.toContain("故稳态极限");
    expect(res.gaokaoSteps.step4_generalTerm).toContain("永久等幅振荡");
  });

  it("should handle lambda = 1 (degenerate absorbing state)", () => {
    // p11=1, p21=0 → lambda = 1，退化吸收态，序列恒为初始值
    const res = calculateMarkovChain(0.3, 1.0, 0.0, 5);
    expect(res.lambda).toBeCloseTo(1);
    expect(res.isDegenerate).toBe(true);
    expect(res.isPureOscillating).toBe(false);
    expect(res.isOscillating).toBe(false);
    // 退化时 pStationary = initP1
    expect(res.pStationary).toBeCloseTo(0.3);
    // 序列恒为 0.3
    for (let i = 0; i < 5; i++) {
      expect(res.steps[i].p1).toBeCloseTo(0.3);
    }
  });

  it("should handle diffInit = 0 (initial state equals steady state, constant sequence)", () => {
    // p11=0, p21=0.5 → pStationary = 0.5/1.5 = 1/3
    // 若 p1 = 1/3，则 diffInit = 0，为常数列
    const pStat = 1 / 3;
    const res = calculateMarkovChain(pStat, 0, 0.5, 5);
    // isOscillating 描述转移矩阵的振荡收敛特性（lambda < 0 且 |lambda| < 1），和常数列无关
    expect(res.isOscillating).toBe(true);
    expect(res.isPureOscillating).toBe(false);
    // 所有步骤概率均为 1/3
    for (let i = 0; i < 5; i++) {
      expect(res.steps[i].p1).toBeCloseTo(pStat);
    }
    // step4 应描述常数列，不输出通项展开式中的 diffInit
    expect(res.gaokaoSteps.step4_generalTerm).toContain("常数列");
    expect(res.gaokaoSteps.step4_generalTerm).not.toContain("(0.000) \\cdot");
    expect(res.gaokaoSteps.step4_generalTerm).toContain(
      "初始概率 p_1 = 0.333 恰好等于不动点 0.333",
    );
  });

  it("should handle diffInit < 0 (initial probability below steady state)", () => {
    // p1 = 0.1, p11 = 0, p21 = 0.5 => pStationary = 1/3 ≈ 0.333, diffInit = 0.1 - 1/3 ≈ -0.233
    const res = calculateMarkovChain(0.1, 0, 0.5, 5);
    expect(res.generalTermLatex).toContain("- 0.233");
    expect(res.generalTermLatex).not.toContain("((");
    expect(res.steps[0].deltaToStationary).toBeCloseTo(0.1 - 1 / 3);
  });

  it("should handle lambda = 0 (one-step immediate convergence)", () => {
    // p11 = 0.5, p21 = 0.5 => lambda = 0, pStationary = 0.5
    const res = calculateMarkovChain(0.9, 0.5, 0.5, 5);
    expect(res.lambda).toBe(0);
    expect(res.pStationary).toBe(0.5);
    expect(res.steps[0].p1).toBe(0.9);
    expect(res.steps[1].p1).toBe(0.5);
    expect(res.steps[2].p1).toBe(0.5);
  });

  it("should clamp maxSteps within [3, 15] range", () => {
    const resMin = calculateMarkovChain(0.5, 0.2, 0.8, 1);
    expect(resMin.steps.length).toBe(3);
    const resMax = calculateMarkovChain(0.5, 0.2, 0.8, 20);
    expect(resMax.steps.length).toBe(15);
  });

  it("should calculate falseAlarmRatio in Bayes diagnostic", () => {
    const res = calculateBayesDiagnostic(0.02, 0.95, 0.05);
    // falseAlarmRatio = FP / (TP + FP) = 0.049 / 0.068 ≈ 0.720588
    expect(res.falseAlarmRatio).toBeCloseTo(0.049 / 0.068, 4);
    expect(res.pPosteriorD + res.falseAlarmRatio).toBeCloseTo(1.0);
  });

  it("should handle P(B) = 0 degenerate condition in calculateConditionalProb", () => {
    const res = calculateConditionalProb(0.5, 0, 0);
    expect(res.pA_given_B).toBe(0);
    expect(res.pB_given_A).toBe(0);
  });

  it("should handle P(AB) bounds and warnings in calculateConditionalProb", () => {
    // pAB = 0.5 超出 min(0.3, 0.4) = 0.3
    const res = calculateConditionalProb(0.3, 0.4, 0.5);
    expect(res.pAB).toBe(0.3);
  });

  it("should generate valid recurrenceLatex and geometricLatex formulas", () => {
    const res = calculateMarkovChain(0.8, 0.7, 0.1, 5);
    expect(res.recurrenceLatex).toContain("p_{n+1}");
    expect(res.geometricLatex).toContain("p_{n+1}");
    expect(res.cobwebPoints[0].type).toBe("step");
    expect(res.cobwebPoints[1].type).toBe("vertical");
    expect(res.cobwebPoints[2].type).toBe("horizontal");
  });

  it("should normalize pAi when sum != 1 in total probability", () => {
    // 三个划分先验概率之和为 1.6（未归一化），应自动归一化
    const res = calculateTotalProb([
      { key: "A1", name: "A1", pAi: 0.8, pB_given_Ai: 0.6 },
      { key: "A2", name: "A2", pAi: 0.4, pB_given_Ai: 0.3 },
      { key: "A3", name: "A3", pAi: 0.4, pB_given_Ai: 0.8 },
    ]);
    // 归一化后：pA1=0.5, pA2=0.25, pA3=0.25
    expect(res.partitions[0].pAi).toBeCloseTo(0.5);
    expect(res.partitions[1].pAi).toBeCloseTo(0.25);
    expect(res.partitions[2].pAi).toBeCloseTo(0.25);
    // 归一化后后验概率之和为 1
    const posteriorSum = res.partitions.reduce((a, b) => a + b.posterior, 0);
    expect(posteriorSum).toBeCloseTo(1);
    // P(B) = 0.5*0.6 + 0.25*0.3 + 0.25*0.8 = 0.3 + 0.075 + 0.2 = 0.575
    expect(res.pB).toBeCloseTo(0.575);
  });

  it("should handle pB = 0 degenerate case in total probability", () => {
    // 所有条件概率均为 0 → P(B) = 0，后验概率退化为 0
    const res = calculateTotalProb([
      { key: "A1", name: "A1", pAi: 0.5, pB_given_Ai: 0 },
      { key: "A2", name: "A2", pAi: 0.5, pB_given_Ai: 0 },
    ]);
    expect(res.pB).toBeCloseTo(0);
    expect(res.partitions[0].posterior).toBeCloseTo(0);
    expect(res.partitions[1].posterior).toBeCloseTo(0);
    expect(res.isValid).toBe(true);
  });

  it("should calculate pB_given_notA correctly", () => {
    // P(A)=0.5, P(B)=0.4, P(AB)=0.2
    // P(B|~A) = (P(B) - P(AB)) / (1 - P(A)) = (0.4 - 0.2) / 0.5 = 0.4
    const res = calculateConditionalProb(0.5, 0.4, 0.2);
    expect(res.pB_given_notA).toBeCloseTo(0.4);
    // 特殊情形：P(A)=1 → ~A 不可能，pB_given_notA = 0
    const res2 = calculateConditionalProb(1.0, 0.6, 0.6);
    expect(res2.pB_given_notA).toBeCloseTo(0);
  });

  it("should calculate Warner randomized response model correctly", () => {
    // 抽卡概率 pCard = 0.8, 调查回答 Yes 占比 0.36
    // P(Yes) = 0.8 * p_real + 0.2 * (1 - p_real) = 0.6 * p_real + 0.2 = 0.36
    // p_real = (0.36 - 0.2) / 0.6 = 0.16 / 0.6 = 4/15 ≈ 0.2667 (26.67%)
    const res = calculateWarnerModel(0.8, 0.36);
    expect(res.pReal).toBeCloseTo(4 / 15);
    expect(res.isDegenerate).toBe(false);
    expect(res.inversionFormulaLatex).toContain("26.67\\%");

    // 退化测试：pCard = 0.5 时无法反解真实比例
    const resDegen = calculateWarnerModel(0.5, 0.5);
    expect(resDegen.isDegenerate).toBe(true);
    expect(resDegen.inversionFormulaLatex).toContain("无法解出");
  });
});
