import { describe, it, expect } from "vitest";
import {
  calculateIndependenceMeasure,
  getIndependentRatio,
} from "../probabilityIndependence";
import { formatMathProb } from "@/utils/mathFormat";

describe("独立性判定与显示同源（消除反向假不等式）", () => {
  it("全域可达参数：判定独立 ⟺ 两个概率显示完全相同", () => {
    // 参数域：pA, pB ∈ [0.1, 0.9] step 0.05；overlapRatio ∈ [0, 1] step 0.01。
    // 旧实现用 1e-4 阈值判定、2 位小数显示，29 189 组里有 513 组出现
    // 「P(B|A) 与 P(B) 显示完全相同却印 ≠」的反向假不等式。
    let checked = 0;
    for (let a = 1; a <= 18; a++) {
      for (let b = 1; b <= 18; b++) {
        for (let r = 0; r <= 100; r++) {
          const res = calculateIndependenceMeasure(a * 0.05, b * 0.05, r / 100);
          if (res.isMutuallyExclusive || res.pConditionalBGivenA === null)
            continue;
          const shownEqual =
            formatMathProb(res.pConditionalBGivenA) === formatMathProb(res.pB);
          expect(res.isIndependent).toBe(shownEqual);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(20000);
  });

  it("互斥且两事件均为正概率时必定不独立", () => {
    for (let a = 1; a <= 18; a++) {
      for (let b = 1; b <= 18; b++) {
        const pA = a * 0.05;
        const pB = b * 0.05;
        // pA + pB > 1 时下界 max(0, P(A)+P(B)-1) > 0，两事件数学上不可能互斥
        if (pA + pB > 1) continue;
        const res = calculateIndependenceMeasure(pA, pB, 0);
        expect(res.isMutuallyExclusive).toBe(true);
        expect(res.isIndependent).toBe(false);
      }
    }
  });

  it("预设独立点（overlapRatio = getIndependentRatio）必须判定为独立", () => {
    // 各预设场景以 getIndependentRatio 生成独立点，学生进入场景时必须看到「相互独立」。
    for (let a = 1; a <= 18; a++) {
      for (let b = 1; b <= 18; b++) {
        const pA = a * 0.05;
        const pB = b * 0.05;
        const res = calculateIndependenceMeasure(
          pA,
          pB,
          getIndependentRatio(pA, pB),
        );
        if (res.isMutuallyExclusive) continue;
        expect(res.isIndependent).toBe(true);
      }
    }
  });
});
