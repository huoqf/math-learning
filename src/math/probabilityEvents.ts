/**
 * 随机事件与概率的基本性质纯数学层 (Zero Side-effects)
 * 涵盖：
 * 1. 连续测度 Venn 模型：两事件包含、相交、互斥、对立及加法公式
 * 2. 离散点阵模型：掷两枚质地均匀骰子的 36 个等可能样本点划分与概率计算
 */

export type EventRelation =
  | "subset_A_in_B" // A ⊆ B
  | "subset_B_in_A" // B ⊆ A
  | "equal" // A = B
  | "mutually_exclusive" // 互斥 (A ∩ B = ∅ 且 A ∪ B ≠ Ω)
  | "opposite" // 对立 (A ∩ B = ∅ 且 A ∪ B = Ω)
  | "intersecting"; // 一般相交

export interface VennEventResult {
  pA: number;
  pB: number;
  pIntersection: number;
  pUnion: number;
  pNotA: number;
  pNotB: number;
  pOnlyA: number;
  pOnlyB: number;
  pNeither: number;
  pDiffBminusA: number; // 差事件 B - A 的测度: P(B - A) = P(B) - P(A ∩ B)
  relation: EventRelation;
  relationText: string;
  isMutuallyExclusive: boolean;
  isOpposite: boolean;
  warningMessage?: string;
}

/**
 * 计算连续 Venn 模型测度与关系
 * @param pA 事件 A 的概率 [0, 1]
 * @param pB 事件 B 的概率 [0, 1]
 * @param overlapRatio 重叠度因子 [0, 1]，0 代表完全分离互斥，1 代表最大化重叠包含
 */
export function calculateVennProbabilities(
  pA: number,
  pB: number,
  overlapRatio: number,
): VennEventResult {
  // 范围约束
  const clampedA = Math.max(0, Math.min(1, pA));
  const clampedB = Math.max(0, Math.min(1, pB));
  const clampedOverlap = Math.max(0, Math.min(1, overlapRatio));

  // 交集下界与上界
  const minIntersection = Math.max(0, clampedA + clampedB - 1);
  const maxIntersection = Math.min(clampedA, clampedB);

  // 根据 overlapRatio 插值
  const pIntersection =
    minIntersection + clampedOverlap * (maxIntersection - minIntersection);
  const pUnion = clampedA + clampedB - pIntersection;

  const pNotA = 1 - clampedA;
  const pNotB = 1 - clampedB;
  const pOnlyA = Math.max(0, clampedA - pIntersection);
  const pOnlyB = Math.max(0, clampedB - pIntersection);
  const pNeither = Math.max(0, 1 - pUnion);
  const pDiffBminusA = pOnlyB;

  // 关系判断 (考虑浮点容差 1e-4)
  const eps = 1e-4;
  let relation: EventRelation = "intersecting";
  let relationText = "一般相交事件";

  const isDisjoint = pIntersection < eps;
  const isFullUnion = Math.abs(pUnion - 1.0) < eps;

  if (isDisjoint && isFullUnion) {
    relation = "opposite";
    relationText = "对立事件";
  } else if (isDisjoint) {
    relation = "mutually_exclusive";
    relationText = "互斥事件";
  } else if (
    Math.abs(clampedA - clampedB) < eps &&
    Math.abs(pIntersection - clampedA) < eps
  ) {
    relation = "equal";
    relationText = "相等事件";
  } else if (Math.abs(pIntersection - clampedA) < eps) {
    relation = "subset_A_in_B";
    relationText = "包含关系 (A ⊆ B)";
  } else if (Math.abs(pIntersection - clampedB) < eps) {
    relation = "subset_B_in_A";
    relationText = "包含关系 (B ⊆ A)";
  }

  const isMutuallyExclusive = isDisjoint;
  const isOpposite = isDisjoint && isFullUnion;

  let warningMessage: string | undefined;
  if (clampedA + clampedB > 1.0 + eps && clampedOverlap < 0.05) {
    warningMessage = `两事件概率之和 P(A)+P(B)=${(clampedA + clampedB).toFixed(2)} > 1，交集必有 P(A∩B) ≥ ${(clampedA + clampedB - 1).toFixed(2)}，必然相交无法互斥！`;
  }

  return {
    pA: clampedA,
    pB: clampedB,
    pIntersection,
    pUnion,
    pNotA,
    pNotB,
    pOnlyA,
    pOnlyB,
    pNeither,
    pDiffBminusA,
    relation,
    relationText,
    isMutuallyExclusive,
    isOpposite,
    warningMessage,
  };
}

/**
 * 掷两枚骰子样本空间模型 (离散型 36 个基本事件)
 */
export interface DiceSamplePoint {
  x: number; // 骰子 1 点数 1..6
  y: number; // 骰子 2 点数 1..6
  sum: number;
  diff: number; // |x - y|
  inA: boolean;
  inB: boolean;
  inIntersection: boolean;
  inUnion: boolean;
}

export type DiceEventPreset =
  | "sum_even" // 点数和为偶数
  | "sum_odd" // 点数和为奇数
  | "sum_ge_8" // 点数和 ≥ 8
  | "has_six" // 至少有一枚为 6
  | "same_points" // 两枚点数相同
  | "diff_le_1" // 点数之差的绝对值 ≤ 1
  | "both_odd" // 两枚均为奇数
  | "both_even"; // 两枚均为偶数

export interface DiscreteDiceResult {
  points: DiceSamplePoint[];
  countA: number;
  countB: number;
  countIntersection: number;
  countUnion: number;
  countTotal: number; // 36
  pA: number;
  pB: number;
  pIntersection: number;
  pUnion: number;
  isMutuallyExclusive: boolean;
  isOpposite: boolean;
}

export function filterDiceEvents(
  presetA: DiceEventPreset,
  presetB: DiceEventPreset,
): DiscreteDiceResult {
  const matchPreset = (
    preset: DiceEventPreset,
    x: number,
    y: number,
  ): boolean => {
    switch (preset) {
      case "sum_even":
        return (x + y) % 2 === 0;
      case "sum_odd":
        return (x + y) % 2 === 1;
      case "sum_ge_8":
        return x + y >= 8;
      case "has_six":
        return x === 6 || y === 6;
      case "same_points":
        return x === y;
      case "diff_le_1":
        return Math.abs(x - y) <= 1;
      case "both_odd":
        return x % 2 === 1 && y % 2 === 1;
      case "both_even":
        return x % 2 === 0 && y % 2 === 0;
      default:
        return false;
    }
  };

  const points: DiceSamplePoint[] = [];
  let countA = 0;
  let countB = 0;
  let countIntersection = 0;
  let countUnion = 0;

  for (let x = 1; x <= 6; x++) {
    for (let y = 1; y <= 6; y++) {
      const inA = matchPreset(presetA, x, y);
      const inB = matchPreset(presetB, x, y);
      const inIntersection = inA && inB;
      const inUnion = inA || inB;

      if (inA) countA++;
      if (inB) countB++;
      if (inIntersection) countIntersection++;
      if (inUnion) countUnion++;

      points.push({
        x,
        y,
        sum: x + y,
        diff: Math.abs(x - y),
        inA,
        inB,
        inIntersection,
        inUnion,
      });
    }
  }

  const countTotal = 36;
  const pA = countA / countTotal;
  const pB = countB / countTotal;
  const pIntersection = countIntersection / countTotal;
  const pUnion = countUnion / countTotal;

  return {
    points,
    countA,
    countB,
    countIntersection,
    countUnion,
    countTotal,
    pA,
    pB,
    pIntersection,
    pUnion,
    isMutuallyExclusive: countIntersection === 0,
    isOpposite: countIntersection === 0 && countUnion === countTotal,
  };
}
