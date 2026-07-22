/**
 * src/math/constant/types.ts
 * 恒成立与存在性问题 — 共享类型定义
 */

export interface MathState {
  isValid: boolean;
  isDegenerate: boolean;
  degenerateType?: "interval_collapse" | "none";
}

export type TransModelKey =
  "ln_x_over_x" | "exp_minus_ax" | "a_ln_x_minus_x" | "exp_minus_a_x_plus_1";

/** 单变量参变分离法求解结果 */
export interface ConstantSingleSepResult extends MathState {
  fMin: number;
  xFMin: number;
  fMax: number;
  xFMax: number;
  a: number;
  m: number;
  n: number;
  isAlwaysTrue: boolean; // ∀x, f(x) >= a
  isExistTrue: boolean; // ∃x, f(x) >= a
  violatedInterval: [number, number] | null; // f(x) < a 的区间交集
  tangentSlope?: number; // 切线斜率/临界值
  implicitZero?: number | null; // 隐零点坐标 x0
}

/** 单变量直接最值讨论法求解结果 */
export interface ConstantSingleDirectResult extends MathState {
  a: number; // 参数 a
  m: number;
  n: number;
  fMin: number;
  xFMin: number;
  fMax: number;
  xFMax: number;
  isAlwaysTrue: boolean; // f(x) >= 0 恒成立
  violatedInterval: [number, number] | null; // f(x) < 0 的区间交集
  discussionType: "left" | "inside" | "right"; // 驻点/极值点在区间的：左侧、内部、右侧
  tangentSlope?: number;
  implicitZero?: number | null;
}

/** 双变量对决博弈求解结果 */
export interface ConstantDoubleResult extends MathState {
  fMin: number;
  xFMin: number;
  fMax: number;
  xFMax: number;
  gMin: number;
  xGMin: number;
  gMax: number;
  xGMax: number;

  // 5种逻辑判定结果
  isAllAllTrue: boolean; // ∀x1, ∀x2, f(x1) >= g(x2)  <=> f_min >= g_max
  isAllExistTrue: boolean; // ∀x1, ∃x2, f(x1) >= g(x2)  <=> f_min >= g_min
  isExistAllTrue: boolean; // ∃x1, ∀x2, f(x1) >= g(x2)  <=> f_max >= g_max
  isExistExistTrue: boolean; // ∃x1, ∃x2, f(x1) >= g(x2)<=> f_max >= g_min
  isSameVarTrue?: boolean; // ∀x in I1∩I2, f(x) >= g(x) <=> h_min >= 0

  // 同变量下的额外数值
  sameVarMinDiff?: number; // 同变量最小差值
  sameVarXMin?: number; // 同变量最危险位置

  // 当前选中逻辑下，起决定性博弈对决的两个点数学坐标
  battlePointF: { x: number; y: number };
  battlePointG: { x: number; y: number };
  isCurrentLogicTrue: boolean;
}
