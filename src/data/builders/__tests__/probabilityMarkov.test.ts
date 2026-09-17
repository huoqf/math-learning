import { describe, it, expect } from "vitest";
import { buildProbabilityMarkovPanel } from "../probabilityMarkov";

/**
 * 回归防线（来源：概率统计模块审计 P0-2）：
 *
 * 背景：本模块右屏「高考采分步」正文曾经直接书写 $\lim_{n \to \infty} p_n$，
 * 而同一面板的警戒条又明确写着"高中课标解答题卷面严禁直接书写未定义的极限记号"，
 * 学生会在同一屏内读到互相矛盾的两套规范，且卷面写极限记号属真实失分点。
 *
 * 本测试把"教学正文不得出现极限记号"从人工自觉变成机器可拦截项：
 *  - 教学正文（数学量 / 定理与推导链 / 高考考点 / 口诀 / 推理步骤）：严禁出现 \lim 与 \to \infty；
 *  - 警戒条是唯一允许引用该记号的位置（正是用它来告诫学生禁用），且必须存在。
 *
 * 同时拦截"马尔可夫链 / 平稳分布"等超纲术语——它们在课标正文之外，
 * 只能出现在显式声明 extend 的节点里，不得混入本页教学文案。
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

const SCENARIOS: Array<{
  name: string;
  scenarioKey: string;
  params: Record<string, number>;
}> = [
  {
    name: "三人传球 (pass_ball_3)",
    scenarioKey: "pass_ball_3",
    params: { p1: 1, p11: 0, p21: 1 / 3, maxN: 10, currStep: 3 },
  },
  {
    name: "四人传球 (pass_ball_4)",
    scenarioKey: "pass_ball_4",
    params: { p1: 1, p11: 0, p21: 0.25, maxN: 8, currStep: 4 },
  },
  {
    name: "摸球置换 (urn_replace)",
    scenarioKey: "urn_replace",
    params: { p1: 0.5, p11: 0.4, p21: 0.6, maxN: 8, currStep: 2 },
  },
  {
    name: "乒乓加赛 (game_pingpong)",
    scenarioKey: "game_pingpong",
    params: { p1: 0.75, p11: 0.7, p21: 0.2, maxN: 8, currStep: 5 },
  },
  {
    name: "自由探索 (退化 λ=1)",
    scenarioKey: "free",
    params: { p1: 0.8, p11: 1, p21: 0, maxN: 6, currStep: 2 },
  },
];

describe("概率递推右屏 · 卷面规范门禁", () => {
  it("教学正文（数学量/定理/考点/口诀）严禁出现极限记号 \\lim 与 \\to \\infty", () => {
    const offenders: string[] = [];
    for (const { name, scenarioKey, params } of SCENARIOS) {
      const panel = buildProbabilityMarkovPanel(params, { scenarioKey });
      const teachText = collectStrings([
        panel.quantities,
        panel.theorems,
        panel.gaokaoPoints,
        panel.reasoningSteps,
        panel.mnemonic,
        panel.examAnchor,
      ]).join("\n");

      if (teachText.includes("\\lim")) offenders.push(`${name}：含 \\lim`);
      if (teachText.includes("\\to \\infty"))
        offenders.push(`${name}：含 \\to \\infty`);
    }
    expect(offenders).toEqual([]);
  });

  it("教学正文严禁出现超纲术语「马尔可夫链」「平稳分布」", () => {
    const offenders: string[] = [];
    for (const { name, scenarioKey, params } of SCENARIOS) {
      const panel = buildProbabilityMarkovPanel(params, { scenarioKey });
      const teachText = collectStrings([
        panel.quantities,
        panel.theorems,
        panel.gaokaoPoints,
        panel.reasoningSteps,
        panel.mnemonic,
        panel.examAnchor,
      ]).join("\n");

      if (teachText.includes("马尔可夫链"))
        offenders.push(`${name}：含马尔可夫链`);
      if (teachText.includes("平稳分布")) offenders.push(`${name}：含平稳分布`);
    }
    expect(offenders).toEqual([]);
  });

  it("答题规范警戒必须存在，且是唯一引用极限记号之处", () => {
    for (const { scenarioKey, params } of SCENARIOS) {
      const panel = buildProbabilityMarkovPanel(params, { scenarioKey });
      const warnText = collectStrings(panel.warnings).join("\n");
      expect(warnText).toContain("严禁");
      expect(warnText).toContain("\\lim");
    }
  });

  it("振荡分支的教学正文必须给出「趋于定值」的中文规范表述", () => {
    const panel = buildProbabilityMarkovPanel(
      { p1: 1, p11: 0, p21: 0.5, maxN: 10, currStep: 3 },
      { scenarioKey: "pass_ball_3" },
    );
    const step4 = panel.theorems.find((t) => t.name.includes("采分步 4"));
    expect(step4).toBeDefined();
    expect(step4?.condition ?? "").toContain("趋近于");
  });
});
