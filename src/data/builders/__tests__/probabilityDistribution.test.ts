import { describe, it, expect } from "vitest";
import { buildProbabilityDistributionPanel } from "../probabilityDistribution";

/**
 * 回归防线（来源：概率统计模块审计 P1-1）：
 *
 * 背景：分布列模块曾把大学记号 $\lim_{N \to \infty} H(N,M,n) = B(n,p)$ 直接写在
 * 左屏模式选项与右屏「定理」正位上，而同库的概率递推模块却明令"卷面严禁书写极限记号"，
 * 全库口径分裂。数列极限不在高中课标内（项目自己在 builders/sequence.ts 把"无穷递缩
 * 等比数列的极限和"标为「拓展 · 超出课标」）。
 *
 * 本测试把"逼近表述必须文字化"从人工自觉变成机器可拦截项：
 *  - 教学正文（数学量 / 定理与推导链 / 高考考点 / 口诀 / 推理步骤 / 考试锚点）严禁出现
 *    \lim、\to \infty，也严禁把"极限"当作教学内容术语（应写"N 远大于 n 时近似相等"）；
 *  - 逼近结论必须以文字化近似表述出现，并保留"远大于"这一课标内语言。
 */

/** 递归收集任意结构中的全部字符串 */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

const CASES: Array<{
  name: string;
  studyMode: string;
  params: Record<string, number>;
  config?: Record<string, unknown>;
}> = [
  {
    name: "二项分布 B(n,p)",
    studyMode: "binomial",
    params: { n: 5, p: 0.4 },
  },
  {
    name: "超几何分布 H(N,M,n)",
    studyMode: "hypergeometric",
    params: { N: 30, M: 6, sampleN: 4 },
  },
  {
    name: "双分布逼近对比",
    studyMode: "compare",
    params: { compareN: 30, compareP: 0.35, compareSampleN: 4 },
  },
  {
    name: "决策方案 · 质检",
    studyMode: "decision",
    params: { decisionParam: 0.05 },
    config: { decisionScenario: "quality" },
  },
  {
    name: "决策方案 · 投资",
    studyMode: "decision",
    params: { decisionParam: 0.5 },
    config: { decisionScenario: "equity" },
  },
  {
    name: "线性变换 Y=aX+b",
    studyMode: "linear",
    params: { linearA: 2, linearB: 1 },
  },
  {
    name: "一般分布列",
    studyMode: "general",
    params: { p0: 0.2, p1: 0.3, p2: 0.4 },
  },
];

function panelText(
  studyMode: string,
  params: Record<string, number>,
  config?: Record<string, unknown>,
) {
  const panel = buildProbabilityDistributionPanel(params, {
    studyMode,
    ...config,
  });
  return collectStrings([
    panel.quantities,
    panel.theorems,
    panel.gaokaoPoints,
    panel.warnings,
    panel.reasoningSteps,
    panel.mnemonic,
    panel.examAnchor,
  ]).join("\n");
}

describe("分布列右屏 · 逼近表述规范门禁", () => {
  it("教学正文严禁出现极限记号 \\lim / \\to \\infty 与「极限」术语", () => {
    const offenders: string[] = [];
    for (const { name, studyMode, params, config } of CASES) {
      const text = panelText(studyMode, params, config);
      if (text.includes("\\lim")) offenders.push(`${name}：含 \\lim`);
      if (text.includes("\\to \\infty"))
        offenders.push(`${name}：含 \\to \\infty`);
      if (text.includes("极限")) offenders.push(`${name}：含「极限」术语`);
    }
    expect(offenders).toEqual([]);
  });

  it("逼近结论必须保留「远大于」文字化近似表述", () => {
    const compareText = panelText("compare", {
      compareN: 30,
      compareP: 0.35,
      compareSampleN: 4,
    });
    expect(compareText).toContain("远大于");

    const hyperText = panelText("hypergeometric", { N: 30, M: 6, sampleN: 4 });
    expect(hyperText).toContain("远大于");
  });

  it("拓展条目需自带「拓展 · 超出课标」语义标注（保持学段边界可识别）", () => {
    const compareText = panelText("compare", {
      compareN: 30,
      compareP: 0.35,
      compareSampleN: 4,
    });
    expect(compareText).toContain("拓展");
  });
});
