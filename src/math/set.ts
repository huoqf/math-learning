/**
 * 集合与常用逻辑纯数学计算库
 * 零 React/DOM/window 依赖，符合数学层纯净规则
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface SetCircle {
  x: number;
  y: number;
  r: number;
}

export type VennOpType =
  | "intersection" // A ∩ B
  | "union" // A ∪ B
  | "complement_A" // ∁U A
  | "complement_B" // ∁U B
  | "difference_A_B"; // A \ B

export type LogicConditionType =
  | "sufficient_not_necessary" // 充分不必要条件 (A ⊂ B)
  | "necessary_not_sufficient" // 必要不充分条件 (B ⊂ A)
  | "sufficient_and_necessary" // 充要条件 (A = B)
  | "neither"; // 既不充分也不必要条件

export interface SetMathState {
  distance: number;
  isPointInA: boolean;
  isPointInB: boolean;
  relation:
    | "separate"
    | "intersect"
    | "contained_A_in_B"
    | "contained_B_in_A"
    | "equal"
    | "empty_A"
    | "empty_B";
  logicType: LogicConditionType;
  logicRelationLatex: string;
  logicDescription: string;
  validity: boolean;
  warningMessage?: string;
}

/**
 * 判断点是否在指定的圆内（含边界）
 */
export function isPointInCircle(pt: Point2D, circle: SetCircle): boolean {
  if (circle.r <= 0) return false;
  const dx = pt.x - circle.x;
  const dy = pt.y - circle.y;
  return dx * dx + dy * dy <= circle.r * circle.r + 1e-9;
}

/**
 * 计算两圆圆心距
 */
export function getCircleDistance(cA: SetCircle, cB: SetCircle): number {
  const dx = cA.x - cB.x;
  const dy = cA.y - cB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 判断集合 A 与 B 的位置关系及逻辑充要判定
 */
export function calculateSetMathState(
  cA: SetCircle,
  cB: SetCircle,
  testPoint: Point2D,
): SetMathState {
  const d = getCircleDistance(cA, cB);
  const rA = Math.max(0, cA.r);
  const rB = Math.max(0, cB.r);

  const isPointInA = isPointInCircle(testPoint, cA);
  const isPointInB = isPointInCircle(testPoint, cB);

  let warningMessage: string | undefined;

  if (rA === 0 && rB === 0) {
    warningMessage = "集合 A 与集合 B 均为空集 (∅)。";
  } else if (rA === 0) {
    warningMessage = "集合 A 为空集 (∅)。空集是任何集合的子集。";
  } else if (rB === 0) {
    warningMessage = "集合 B 为空集 (∅)。";
  }

  let relation: SetMathState["relation"] = "separate";

  if (rA === 0 && rB === 0) {
    relation = "equal";
  } else if (rA === 0) {
    relation = "empty_A";
  } else if (rB === 0) {
    relation = "empty_B";
  } else if (
    Math.abs(cA.x - cB.x) < 1e-4 &&
    Math.abs(cA.y - cB.y) < 1e-4 &&
    Math.abs(rA - rB) < 1e-4
  ) {
    relation = "equal";
  } else if (d + rA <= rB + 1e-4) {
    relation = "contained_A_in_B";
  } else if (d + rB <= rA + 1e-4) {
    relation = "contained_B_in_A";
  } else if (d < rA + rB && d > Math.abs(rA - rB)) {
    relation = "intersect";
  } else {
    relation = "separate";
  }

  // 逻辑条件判定: 条件 p: x ∈ A, 条件 q: x ∈ B
  let logicType: LogicConditionType = "neither";
  let logicRelationLatex = "A \\not\\subseteq B \\land B \\not\\subseteq A";
  let logicDescription = "p 既不是 q 的充分条件，也不是 q 的必要条件";

  if (relation === "equal") {
    logicType = "sufficient_and_necessary";
    logicRelationLatex = "A = B \\iff p \\iff q";
    logicDescription = "p 是 q 的充要条件（A 与 B 集合完全相等）";
  } else if (relation === "contained_A_in_B" || relation === "empty_A") {
    logicType = "sufficient_not_necessary";
    logicRelationLatex = "A \\subsetneq B \\implies p \\implies q";
    logicDescription = "p 是 q 的充分不必要条件（A 为 B 的真子集）";
  } else if (relation === "contained_B_in_A" || relation === "empty_B") {
    logicType = "necessary_not_sufficient";
    logicRelationLatex = "B \\subsetneq A \\implies q \\implies p";
    logicDescription = "p 是 q 的必要不充分条件（B 为 A 的真子集）";
  } else if (relation === "intersect") {
    logicType = "neither";
    logicRelationLatex = "A \\cap B \\neq \\varnothing \\text{ 且有部分相异}";
    logicDescription =
      "p 是 q 的既不充分也不必要条件（A 与 B 有交集但不相互包含）";
  } else {
    logicType = "neither";
    logicRelationLatex = "A \\cap B = \\varnothing";
    logicDescription = "p 是 q 的既不充分也不必要条件（A 与 B 互不相交）";
  }

  return {
    distance: d,
    isPointInA,
    isPointInB,
    relation,
    logicType,
    logicRelationLatex,
    logicDescription,
    validity: true,
    warningMessage,
  };
}
