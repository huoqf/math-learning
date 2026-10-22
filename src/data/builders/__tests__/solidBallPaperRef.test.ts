import { describe, it, expect } from "vitest";
import { buildCircumSpherePanel } from "../solidCircumSphere";
import { buildPolyhedronSpherePanel } from "../solidPolyhedronSphere";
import {
  BALL_PAPER_REFS,
  BALL_OBJECTIVE_SCORE,
  BALL_SOLUTION_SCORE,
  getBallPaperRef,
} from "../solidBallPaperRef";

/**
 * 第四阶段债务 #6：solid-ball 题型与 rubric 赋分定位。
 *
 * 改前：45 条 rubric 全部写死 `(+2分)`，三步恒 6 分，题位写成
 * 「高考客观题/解答题压轴母题」——客观 5 分档与解答 6 分档被抹平成一档，
 * 且「客观题/解答题」这种两边都沾的话术等于没定题位。
 *
 * 改后：题位 → 总分 → 各步权重集中成一张表（solidBallPaperRef.ts），
 * builder 只取不算。本文件从 builder 的真实输出反算，锁死三件事：
 *   ① 右屏 examAnchor 与表逐字一致；
 *   ② 三条 rubric 的分值之和严格等于该题位总分；
 *   ③ 每步 rubric 印出的分值逐项等于表里的权重。
 */

const SHAPES = [
  "cuboid",
  "regularPyramid",
  "triangularPrism",
  "cone",
  "cylinder",
] as const;
const SPHERE_TYPES = ["circum", "inscribed"] as const;
const MODELS = [
  "corner",
  "cylinder",
  "complement",
  "verticalEdge",
  "inSphere",
] as const;

const PARAMS = { a: 3, b: 2, c: 2, h: 4 };

const circumPanel = (shape: string, sphereType: string) =>
  buildCircumSpherePanel(PARAMS, { sphereType, shape });
const modelPanel = (modelType: string) =>
  buildPolyhedronSpherePanel(PARAMS, { modelType });

/** 从 `(+3分)` 里取出数字；格式不符直接返回 null 让断言炸出来 */
const scoreOf = (rubric?: string): number | null => {
  const m = /\(\+(\d+)分\)/.exec(rubric ?? "");
  return m ? Number(m[1]) : null;
};

describe("题位表自身的一致性", () => {
  it("每档的分值之和严格等于题位总分", () => {
    Object.entries(BALL_PAPER_REFS).forEach(([key, ref]) => {
      const sum = ref.stepScores.reduce((s, x) => s + x, 0);
      expect(sum, `${key} 三步分值和 ${sum} ≠ 题位总分 ${ref.totalScore}`).toBe(
        ref.totalScore,
      );
    });
  });

  it("题位只允许客观 5 分 / 解答 6 分两档，且总分与 anchor 里的数字一致", () => {
    Object.entries(BALL_PAPER_REFS).forEach(([key, ref]) => {
      expect([BALL_OBJECTIVE_SCORE, BALL_SOLUTION_SCORE], key).toContain(
        ref.totalScore,
      );
      expect(ref.anchor, `${key} 的 anchor 未印出分值`).toContain(
        `${ref.totalScore} 分`,
      );
    });
  });

  it("anchor 必须明确二选一：客观题 / 解答题，不得两边都沾", () => {
    Object.entries(BALL_PAPER_REFS).forEach(([key, ref]) => {
      const isObjective = ref.anchor.includes("客观题");
      const isSolution = ref.anchor.includes("解答题");
      expect(
        isObjective !== isSolution,
        `${key} 题位不唯一：${ref.anchor}`,
      ).toBe(true);
      // 与分档必须对口，不能标「客观题」却按 6 分算
      if (isObjective) expect(ref.totalScore, key).toBe(BALL_OBJECTIVE_SCORE);
      if (isSolution) expect(ref.totalScore, key).toBe(BALL_SOLUTION_SCORE);
    });
  });

  it("分值先重后轻：第一步不轻于第三步（收尾那步只值 1 分）", () => {
    Object.entries(BALL_PAPER_REFS).forEach(([key, ref]) => {
      expect(ref.stepScores[0], `${key} 首步弱于末步`).toBeGreaterThanOrEqual(
        ref.stepScores[2],
      );
      expect(ref.stepScores[1], `${key} 第二步强于第一步`).toBeLessThanOrEqual(
        ref.stepScores[0],
      );
    });
  });

  it("键名写错立刻抛错，不静默落回默认题位", () => {
    expect(() => getBallPaperRef("circum:sphere")).toThrow(/未登记的题位键名/);
  });
});

describe("/solid-ball：10 个「几何体 × 内外接」组合的题位与赋分", () => {
  const cases = SPHERE_TYPES.flatMap((sphereType) =>
    SHAPES.map(
      (shape) => [`${sphereType}:${shape}`, sphereType, shape] as const,
    ),
  );

  it.each(cases)("%s 的题位与三步赋值同表一致", (key, sphereType, shape) => {
    const ref = getBallPaperRef(key);
    const panel = circumPanel(shape, sphereType);

    expect(panel.examAnchor).toBe(ref.anchor);

    const steps = panel.reasoningSteps ?? [];
    expect(steps).toHaveLength(3);

    const scores = steps.map((s) => scoreOf(s.rubric));
    expect(scores, `${key} 有步骤缺 (+n分) 标记`).toEqual([...ref.stepScores]);
    expect(scores.reduce<number>((sum, x) => sum + (x ?? 0), 0)).toBe(
      ref.totalScore,
    );
  });
});

describe("/solid-ball-models：5 个模型的题位与赋分", () => {
  it.each(MODELS.map((m) => [m, m] as const))(
    "%s 的题位与三步赋值同表一致",
    (key) => {
      const ref = getBallPaperRef(key);
      const panel = modelPanel(key);

      expect(panel.examAnchor).toBe(ref.anchor);

      const steps = panel.reasoningSteps ?? [];
      expect(steps).toHaveLength(3);

      const scores = steps.map((s) => scoreOf(s.rubric));
      expect(scores, `${key} 有步骤缺 (+n分) 标记`).toEqual([
        ...ref.stepScores,
      ]);
      expect(scores.reduce<number>((sum, x) => sum + (x ?? 0), 0)).toBe(
        ref.totalScore,
      );
    },
  );
});

describe("反回归：这些旧写法不许回来", () => {
  const allPanels = [
    ...SPHERE_TYPES.flatMap((t) => SHAPES.map((s) => circumPanel(s, t))),
    ...MODELS.map((m) => modelPanel(m)),
  ];

  it("15 个组合里 5 分档与 6 分档都要存在，不能又退化成清一色 6 分", () => {
    const totals = allPanels.map((p) =>
      (p.reasoningSteps ?? []).reduce(
        (s, x) => s + (scoreOf(x.rubric) ?? 0),
        0,
      ),
    );
    expect(
      totals.filter((t) => t === BALL_OBJECTIVE_SCORE).length,
    ).toBeGreaterThan(0);
    expect(
      totals.filter((t) => t === BALL_SOLUTION_SCORE).length,
    ).toBeGreaterThan(0);
    // 旧实现在这里恰好是 15 个 6 分
    expect(new Set(totals).size).toBe(2);
  });

  it("右屏不得再出现「客观题/解答题」这种两边都沾的题位话术", () => {
    allPanels.forEach((p) => {
      expect(p.examAnchor ?? "").not.toContain("客观题/解答题");
      expect(p.examAnchor ?? "").not.toContain("压轴母题");
    });
  });

  it("不再残留硬编码的 (+2分)，且 rubric 前缀口径未变", () => {
    const rubrics = allPanels.flatMap((p) =>
      (p.reasoningSteps ?? []).map((s) => s.rubric ?? ""),
    );
    expect(rubrics).toHaveLength(45);
    rubrics.forEach((r) => {
      expect(r).toContain("[高考采分点]");
      expect(r).toMatch(/\(\+\d+分\)$/);
    });
    // 旧实现 45 条全为 +2；现在客观题档（10 个组合）的收尾步必须是 1 分，
    // 解答题档（5 个组合）三步均权 2 分，故恰好 10 条 +1、35 条 +2。
    expect(rubrics.filter((r) => scoreOf(r) === 1).length).toBe(10);
    expect(rubrics.filter((r) => scoreOf(r) === 2).length).toBe(35);
  });
});
