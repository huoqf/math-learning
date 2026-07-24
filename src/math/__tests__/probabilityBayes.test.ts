import { describe, it, expect } from "vitest";
import {
  calculateConditionalProb,
  calculateTotalProb,
  calculateBayesDiagnostic,
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
});
