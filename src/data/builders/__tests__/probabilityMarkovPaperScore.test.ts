import { describe, it, expect } from "vitest";
import { buildProbabilityMarkovPanel } from "@/data/builders/probabilityMarkov";

/**
 * probability-markov 题位与赋分自洽门禁（报告 §11.5 债务 #9）。
 *
 * ── 改前的矛盾 ──
 * gaokaoPoint 写「【新高考大题 17 分标准采分点链路】」，而同页四步 rubric 实际
 * 是 2+3+3+2 = 10 分。同一屏两个数字对不上：学生按 17 分去核，会以为漏了 7 分的步骤。
 * 知识树把该节点标 `questionCategory: "solution_final"`（压轴）、17 分题位本身没错，
 * 错在把「整题 17 分」说成了「本页四步链路 17 分」。
 *
 * ── 改后的口径 ──
 * 分值收进 `MARKOV_STEP_SCORES` 常量单源：声明文案与四条 rubric 都由它算出。
 * 17 分是题位总分，10 分是本页覆盖的主干，差额明确写成「落在各小问的具体计数、
 * 分类讨论与结论书写上」。改任一处分值，文案与 rubric 同步，不会再各说各话。
 */

const BASE = { p1: 1, p11: 0.3, p21: 0.4, maxN: 10 };
const panel = (config?: Record<string, unknown>) =>
  buildProbabilityMarkovPanel(BASE, config);

/** 从 rubric 的「得 n 分」取分 */
const scoreOf = (rubric: string): number | null => {
  const m = /得\s*(\d+)\s*分/.exec(rubric);
  return m ? Number(m[1]) : null;
};

describe("四条采分链的分值与声明一致", () => {
  it("四步 rubric 各自印出分值，且合计等于 gaokaoPoint 声称的「本页四步覆盖 n 分」", () => {
    const data = panel();
    const steps = data.reasoningSteps ?? [];
    expect(steps).toHaveLength(4);

    const scores = steps.map((s) => scoreOf(s.rubric ?? ""));
    expect(scores).toEqual([2, 3, 3, 2]);
    const mainScore = scores.reduce<number>((sum, x) => sum + (x ?? 0), 0);
    expect(mainScore).toBe(10);

    const claim = data.gaokaoPoints.find((g) => g.text.includes("采分主干"));
    expect(claim, "缺「采分主干」声明").toBeDefined();
    expect(claim!.text).toContain(`本页四步覆盖 ${mainScore} 分`);
  });

  it("题位总分 17 分与差额 7 分都要显式写出，不能只留一个光秃秃的「17 分」", () => {
    const claim = panel().gaokaoPoints.find((g) =>
      g.text.includes("采分主干"),
    )!;
    expect(claim.text).toContain("17 分");
    expect(claim.text).toContain("余下 7 分");
    // 必须交代差额去向，否则 10 ≠ 17 的矛盾只是被换个说法藏起来
    expect(claim.text).toContain("具体计数");
    expect(claim.text).toContain("分类讨论");
  });

  it("换场景预设后分值与声明仍同步（不是某一个 preset 的特例）", () => {
    for (const config of [
      { scenario: "weather" },
      { scenario: "defect" },
      { scenario: "study" },
    ]) {
      const data = panel(config);
      const steps = data.reasoningSteps ?? [];
      const sum = steps.reduce((s, x) => s + (scoreOf(x.rubric ?? "") ?? 0), 0);
      const claim = data.gaokaoPoints.find((g) => g.text.includes("采分主干"));
      expect(claim, `场景 ${JSON.stringify(config)} 缺声明`).toBeDefined();
      expect(claim!.text).toContain(`本页四步覆盖 ${sum} 分`);
      expect(claim!.text).toContain("17 分");
    }
  });
});

describe("反回归：不许再出现「整题 17 分 = 本页链路 17 分」的说法", () => {
  it("旧话术「新高考大题 17 分标准采分点链路」不得复活", () => {
    const dump = JSON.stringify(panel());
    expect(dump).not.toContain("17 分标准采分点链路");
    expect(dump).not.toContain("新高考大题 17 分标准");
  });
});
