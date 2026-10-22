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
  | "difference_A_B" // A \ B
  | "none"; // 不进行运算阴影（用于纯逻辑包含展示）

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
    | "tangent_external"
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
  } else if (Math.abs(d - (rA + rB)) < 1e-6) {
    // 外切：交集是切点这一个元素，**非空**。旧实现落到 separate 分支，把 A ∩ B 错判成 ∅
    relation = "tangent_external";
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
    logicRelationLatex = "A \\not\\subseteq B \\text{ 且 } B \\not\\subseteq A";
    logicDescription =
      "p 是 q 的既不充分也不必要条件（A 与 B 有交集但不相互包含）";
  } else if (relation === "tangent_external") {
    logicType = "neither";
    logicRelationLatex =
      "A \\cap B = \\{M\\} \\ne \\varnothing, \\quad A \\not\\subseteq B, \\; B \\not\\subseteq A";
    logicDescription =
      "p 是 q 的既不充分也不必要条件（A 与 B 外切，交集中恰有一个切点 M，非空）";
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

/* ────────────────────────────────────────────────────────────────
 * 子集与真子集的层级判定
 * 「A ⊆ B」与「A ⊊ B」的唯一区别是等号能否成立：
 *   A ⊆ B  ⟺  A 中每个元素都在 B 中；
 *   A ⊊ B  ⟺  A ⊆ B 且 A ≠ B（即 B 中至少有一个元素不在 A 中）。
 * 空集是任何集合的子集，因此 A = ∅ 时 A ⊆ B 与 A ⊊ B（B 非空时）同时成立，
 * 这是学生最常漏掉的一层。外切时交集为单点而非空集，也必须与相离分开。
 * ──────────────────────────────────────────────────────────────── */

export type SubsetRelationKind =
  | "equal" // A = B：互相包含且等号成立，不构成真子集
  | "a_proper_subset_b" // A ⊊ B
  | "b_proper_subset_a" // B ⊊ A
  | "overlap" // 有交集但互不包含
  | "tangent_external" // 外切：交集为单点，互不包含
  | "disjoint"; // 相离：A ∩ B = ∅

export interface SubsetHierarchyResult {
  relationKind: SubsetRelationKind;
  /** 圆心距 d(O_A, O_B) */
  distance: number;
  /** A ⊆ B */
  aSubsetB: boolean;
  /** A ⊊ B（真子集，A ≠ B） */
  aProperSubsetB: boolean;
  /** B ⊆ A */
  bSubsetA: boolean;
  /** B ⊊ A */
  bProperSubsetA: boolean;
  /** 交集是否为空集（外切时为 false，交集中有一个切点） */
  isIntersectionEmpty: boolean;
  /** 等号是否成立（决定 ⊆ 与 ⊊ 的分野） */
  equalityHolds: boolean;
  relationLatex: string;
  description: string;
}

/**
 * 判定 A、B 两个集合的包含层级：⊆、⊊、相等、互不包含、交集为空。
 * 纯函数，零 DOM 依赖。
 */
export function analyzeSubsetHierarchy(
  cA: SetCircle,
  cB: SetCircle,
): SubsetHierarchyResult {
  const { relation, distance } = calculateSetMathState(cA, cB, { x: 0, y: 0 });

  let relationKind: SubsetRelationKind;
  switch (relation) {
    case "equal":
      relationKind = "equal";
      break;
    case "contained_A_in_B":
    case "empty_A":
      relationKind = "a_proper_subset_b";
      break;
    case "contained_B_in_A":
    case "empty_B":
      relationKind = "b_proper_subset_a";
      break;
    case "tangent_external":
      relationKind = "tangent_external";
      break;
    case "intersect":
      relationKind = "overlap";
      break;
    default:
      relationKind = "disjoint";
  }

  const equalityHolds = relationKind === "equal";
  const aSubsetB = equalityHolds || relationKind === "a_proper_subset_b";
  const bSubsetA = equalityHolds || relationKind === "b_proper_subset_a";

  // 真子集 = 子集 且 等号不成立。两集合同时为空时二者相等，不构成真包含
  const bothEmpty = Math.max(0, cA.r) === 0 && Math.max(0, cB.r) === 0;
  const aProperSubsetB = aSubsetB && !equalityHolds && !bothEmpty;
  const bProperSubsetA = bSubsetA && !equalityHolds && !bothEmpty;

  const isIntersectionEmpty =
    relationKind === "disjoint" ||
    Math.max(0, cA.r) === 0 ||
    Math.max(0, cB.r) === 0;

  let relationLatex: string;
  let description: string;
  switch (relationKind) {
    case "equal":
      relationLatex =
        "A \\subseteq B \\;\\land\\; B \\subseteq A \\;\\Longleftrightarrow\\; A = B";
      description =
        "两个方向都包含且等号成立：A = B，此时 A 不是 B 的真子集，B 也不是 A 的真子集";
      break;
    case "a_proper_subset_b":
      relationLatex =
        "A \\subseteq B \\;\\land\\; A \\ne B \\;\\Longleftrightarrow\\; A \\subsetneq B";
      description =
        "A 的元素全在 B 内且 B 还有剩余元素：A 是 B 的真子集，B 不是 A 的子集";
      break;
    case "b_proper_subset_a":
      relationLatex =
        "B \\subseteq A \\;\\land\\; B \\ne A \\;\\Longleftrightarrow\\; B \\subsetneq A";
      description =
        "B 的元素全在 A 内且 A 还有剩余元素：B 是 A 的真子集，A 不是 B 的子集";
      break;
    case "overlap":
      relationLatex =
        "A \\not\\subseteq B, \\quad B \\not\\subseteq A, \\quad A \\cap B \\ne \\varnothing";
      description =
        "互相都有「对方没有」的元素：两个方向都不构成子集，但交集非空";
      break;
    case "tangent_external":
      relationLatex =
        "A \\cap B = \\{M\\} \\ne \\varnothing, \\quad A \\not\\subseteq B, \\; B \\not\\subseteq A";
      description =
        "外切：交集恰含一个切点 M，交集非空，因此不能判成「交集为空」；同时互不包含";
      break;
    default:
      relationLatex =
        "A \\cap B = \\varnothing, \\quad A \\not\\subseteq B, \\; B \\not\\subseteq A";
      description = "相离：交集为空集，两个方向也都不构成子集";
  }

  return {
    relationKind,
    distance,
    aSubsetB,
    aProperSubsetB,
    bSubsetA,
    bProperSubsetA,
    isIntersectionEmpty,
    equalityHolds,
    relationLatex,
    description,
  };
}
