/**
 * 「球」类题的题位口径与卷面分值（/solid-ball 与 /solid-ball-models 共用的单一数据源）。
 *
 * ── 为什么需要这张表 ──
 * 这两个 builder 原来把 45 条 rubric 全部写死 `(+2分)`：三步恒为 6 分，既与真实题位
 * 对不上（客观题 5 分 / 解答题一问 6 分两档被抹平成一档），也抹掉了「哪一步更值钱」的
 * 信息——学生按步自查时会误以为三步等权。同时 examAnchor 里出现「高考客观题/解答题压轴
 * 母题」这种两边都沾的话术，等于没定题位。
 *
 * 这里把「题位 → 总分 → 各步权重」集中成一张表，builder 只从表里取，测试再从同一张表
 * 反算，三者不可能各说各话。
 *
 * ── 分值依据（2026 新课标卷数学）──
 * · 客观题（单选 / 多选 / 填空）每题 5 分。「球」类求半径、表面积、体积绝大多数落在这里，
 *   卷面只认结果，故三步按 2 + 2 + 1 分配：前两步是通法（找圆心 / 列勾股），
 *   第三步只是代公式算出数值。
 * · 需要写出论证过程的（等体积剖分、内切球存在性充要条件、外心垂线证明），多作为
 *   立体几何解答题（15 分）中的一问出现，按 6 分档计，三步按 2 + 2 + 2 均分。
 *
 * ── 归类判据（不是逐题拍脑袋）──
 * 凡半径可由一条几何关系直接读出（体对角线、2R = d、h = 2r、2r = a）⇒ 客观题；
 * 凡必须「先论证存在性」或「先列剖分 / 等面积方程」才能定出半径 ⇒ 解答题一问。
 *
 * 全站结构化 paperRef（{year, no, score}）属另一项债务（58 个 builder 缺 examAnchor），
 * 本模块只先把「球」类闭环，不擅自改动 MathPanelData 契约。
 */

/** 客观题（单选 / 多选 / 填空）单题分值 */
export const BALL_OBJECTIVE_SCORE = 5;
/** 立体几何解答题（15 分）中一问的常见分值档 */
export const BALL_SOLUTION_SCORE = 6;

export interface BallPaperRef {
  /** 题位口径，直接作为右屏 examAnchor */
  anchor: string;
  /** 该题位卷面总分 */
  totalScore: number;
  /** 推导链三步各自的分值；之和必须等于 totalScore */
  stepScores: readonly [number, number, number];
}

/** 客观题题位：只写结果，三步 2 + 2 + 1 */
function objective(topic: string): BallPaperRef {
  return {
    anchor: `2026 新课标卷 · 立体几何客观题（${BALL_OBJECTIVE_SCORE} 分）｜${topic}`,
    totalScore: BALL_OBJECTIVE_SCORE,
    stepScores: [2, 2, 1],
  };
}

/** 解答题中一问：要写论证，三步 2 + 2 + 2 */
function solution(topic: string): BallPaperRef {
  return {
    anchor: `2026 新课标卷 · 立体几何解答题一问（${BALL_SOLUTION_SCORE} 分）｜${topic}`,
    totalScore: BALL_SOLUTION_SCORE,
    stepScores: [2, 2, 2],
  };
}

/**
 * 键名规则：`/solid-ball` 用 `${sphereType}:${shape}`，`/solid-ball-models` 用 modelType。
 * 两页的键集合互不重叠，可以放在一张表里。
 */
export const BALL_PAPER_REFS: Record<string, BallPaperRef> = {
  // ── /solid-ball 外接球 5 类 ──
  "circum:cuboid": objective("墙角与长方体 · 体对角线即直径"),
  "circum:regularPyramid": objective("正棱锥轴截面勾股法"),
  "circum:triangularPrism": objective("直棱柱双外心垂直平分线法"),
  "circum:cone": objective("轴截面降维法 · 圆锥外接球"),
  "circum:cylinder": objective("轴截面矩形对角线法"),

  // ── /solid-ball 内切球 5 类 ──
  "inscribed:cuboid": objective("正方体内切球 · 2r = a"),
  "inscribed:regularPyramid": solution("正四棱锥内切球 · 空间等体积剖分法"),
  "inscribed:triangularPrism": solution("直三棱柱内切球 · 存在性充要条件"),
  "inscribed:cone": objective("轴截面等面积法 · 圆锥内切球"),
  "inscribed:cylinder": objective("等高判定 h = 2r · 圆柱内切球"),

  // ── /solid-ball-models 5 个模型 ──
  corner: objective("墙角割补 · 三垂直棱补形"),
  cylinder: objective("柱体模型 · 直三棱柱外接球 · 柱体外心勾股轴线"),
  complement: solution("等面四面体对棱长方体补形"),
  verticalEdge: solution("柱体外心勾股轴线 · 球心在底面外心垂线上"),
  inSphere: solution("等体积剖分 · 内切球"),
};

/** 取题位；键名写错时立刻炸掉，避免静默落回某个默认值 */
export function getBallPaperRef(key: string): BallPaperRef {
  const ref = BALL_PAPER_REFS[key];
  if (!ref) {
    throw new Error(
      `[solidBallPaperRef] 未登记的题位键名 "${key}"，已登记：${Object.keys(BALL_PAPER_REFS).join(", ")}`,
    );
  }
  return ref;
}

/** 按题位表生成某一步的采分点文案（前缀与既有 `[高考采分点]` 口径保持一致） */
export function ballRubric(
  ref: BallPaperRef,
  stepIndex: 0 | 1 | 2,
  what: string,
): string {
  return `【高考采分点】${what} (+${ref.stepScores[stepIndex]}分)`;
}
