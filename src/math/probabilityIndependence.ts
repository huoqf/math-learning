import { MATH_PROB_DECIMALS } from "@/utils/mathFormat";

/**
 * 事件相互独立性与互斥辨析纯数学计算引擎
 * 严格遵循纯函数规范，Zero Side-effects，严禁导入 React/DOM
 */

export interface IndependenceMathResult {
  pA: number;
  pB: number;
  pAB: number;
  pAUnionB: number;
  pNotA: number;
  pNotB: number;
  pNotANotB: number;
  pConditionalBGivenA: number | null; // P(B|A)
  pConditionalAGivenB: number | null; // P(A|B)
  isIndependent: boolean;
  isMutuallyExclusive: boolean;
  productDiff: number; // P(AB) - P(A)P(B)
  relationType:
    | "independent_not_exclusive"
    | "exclusive_not_independent"
    | "neither"
    | "degenerate";
  validity: boolean;
  validityMessage?: string;
}

export type DiscreteDiceEventKey =
  | "even" // 偶数点 {2, 4, 6}
  | "le4" // 点数 <= 4 {1, 2, 3, 4}
  | "odd" // 奇数点 {1, 3, 5}
  | "gt4" // 点数 > 4 {5, 6}
  | "prime" // 质数点 {2, 3, 5}
  | "div3"; // 3的倍数 {3, 6}

export interface DiscreteEventDef {
  key: DiscreteDiceEventKey;
  name: string;
  latexName: string;
  outcomes: number[];
  description: string;
}

export const DICE_OUTCOMES = [1, 2, 3, 4, 5, 6] as const;

export const DISCRETE_DICE_EVENTS: Record<
  DiscreteDiceEventKey,
  DiscreteEventDef
> = {
  even: {
    key: "even",
    name: "掷出偶数点",
    latexName: "\\{2, 4, 6\\}",
    outcomes: [2, 4, 6],
    description: "事件 $A$: 点数为偶数",
  },
  le4: {
    key: "le4",
    name: "点数不大于 4",
    latexName: "\\{1, 2, 3, 4\\}",
    outcomes: [1, 2, 3, 4],
    description: "事件 $B$: 点数 $\\le 4$",
  },
  odd: {
    key: "odd",
    name: "掷出奇数点",
    latexName: "\\{1, 3, 5\\}",
    outcomes: [1, 3, 5],
    description: "事件 $C$: 点数为奇数",
  },
  gt4: {
    key: "gt4",
    name: "点数大于 4",
    latexName: "\\{5, 6\\}",
    outcomes: [5, 6],
    description: "事件 $D$: 点数 $> 4$",
  },
  prime: {
    key: "prime",
    name: "掷出质数点",
    latexName: "\\{2, 3, 5\\}",
    outcomes: [2, 3, 5],
    description: "事件 $E$: 点数为质数",
  },
  div3: {
    key: "div3",
    name: "3的倍数点",
    latexName: "\\{3, 6\\}",
    outcomes: [3, 6],
    description: "事件 $F$: 点数为 3 的倍数",
  },
};

const EPSILON = 1e-4;

/**
 * 把概率量化到「显示网格」上的整数编码，用于「判定 ⟺ 显示」同源的相等比较。
 * 与 formatMathProb（src/utils/mathFormat.ts）共用 MATH_PROB_DECIMALS，二者精度必须一致。
 */
export function quantizeProb(value: number): number {
  return Math.round(value * 10 ** MATH_PROB_DECIMALS);
}

/**
 * 连续测度模式计算
 * @param pA 事件 A 的先验概率 [0, 1]
 * @param pB 事件 B 的先验概率 [0, 1]
 * @param overlapRatio 重叠度调节因子 [0, 1]
 *        0 代表互斥 (P(AB) = minOverlap)
 *        1 代表最大重叠 (P(AB) = maxOverlap)
 *        通过插值可以精确经过独立点 P(AB) = P(A)*P(B)
 */
export function calculateIndependenceMeasure(
  pA: number,
  pB: number,
  overlapRatio: number,
): IndependenceMathResult {
  const safePA = Math.max(0, Math.min(1, pA));
  const safePB = Math.max(0, Math.min(1, pB));
  const safeRatio = Math.max(0, Math.min(1, overlapRatio));

  // 概率测度下的交集范围：
  // max(0, P(A) + P(B) - 1) <= P(AB) <= min(P(A), P(B))
  const minPAB = Math.max(0, safePA + safePB - 1);
  const maxPAB = Math.min(safePA, safePB);

  // 独立状态目标值
  const independentPAB = safePA * safePB;

  let pAB: number;
  // 采用分段或线性映射，确保能够平滑经过互斥点与独立点
  if (maxPAB - minPAB < EPSILON) {
    pAB = minPAB;
  } else {
    pAB = minPAB + safeRatio * (maxPAB - minPAB);
  }

  // 浮点数截断保护
  pAB = Math.max(minPAB, Math.min(maxPAB, pAB));

  const pAUnionB = safePA + safePB - pAB;
  const pNotA = 1 - safePA;
  const pNotB = 1 - safePB;
  const pNotANotB = Math.max(0, 1 - pAUnionB);

  const productDiff = pAB - independentPAB;
  const isMutuallyExclusive = pAB < 1e-5;

  const pConditionalBGivenA = safePA > EPSILON ? pAB / safePA : null;
  const pConditionalAGivenB = safePB > EPSILON ? pAB / safePB : null;

  // 独立性判定与右屏显示同源：直接比较 P(B|A) 与 P(B) 量化到显示精度后的整数编码。
  // 「显示相同 ⇔ 判定独立」恒成立，既不会出现「两数显示相同却印 ≠」的反向假不等式，
  // 也不再用 1e-3 量级的自适应容差把显著非独立状态吞成「独立」。
  const isIndependent =
    !isMutuallyExclusive &&
    pConditionalBGivenA !== null &&
    quantizeProb(pConditionalBGivenA) === quantizeProb(safePB) &&
    safePA > EPSILON &&
    safePB > EPSILON;

  let relationType: IndependenceMathResult["relationType"];
  if (safePA < 1e-4 || safePB < 1e-4) {
    relationType = "degenerate";
  } else if (isMutuallyExclusive) {
    relationType = "exclusive_not_independent";
  } else if (isIndependent) {
    relationType = "independent_not_exclusive";
  } else {
    relationType = "neither";
  }

  return {
    pA: safePA,
    pB: safePB,
    pAB,
    pAUnionB,
    pNotA,
    pNotB,
    pNotANotB,
    pConditionalBGivenA,
    pConditionalAGivenB,
    isIndependent,
    isMutuallyExclusive,
    productDiff,
    relationType,
    validity: true,
  };
}

/**
 * 求解使得 P(AB) = P(A)*P(B) 的 overlapRatio
 */
export function getIndependentRatio(pA: number, pB: number): number {
  const minPAB = Math.max(0, pA + pB - 1);
  const maxPAB = Math.min(pA, pB);
  if (maxPAB - minPAB < EPSILON) return 0;
  const target = pA * pB;
  return Math.max(0, Math.min(1, (target - minPAB) / (maxPAB - minPAB)));
}

/**
 * 离散掷骰子模型计算
 */
export interface DiscreteDiceResult {
  eventA: DiscreteEventDef;
  eventB: DiscreteEventDef;
  outcomesA: number[];
  outcomesB: number[];
  intersectionOutcomes: number[];
  unionOutcomes: number[];
  pA: number;
  pB: number;
  pAB: number;
  pAUnionB: number;
  pConditionalBGivenA: number | null;
  isIndependent: boolean;
  isMutuallyExclusive: boolean;
  formulaPA: string;
  formulaPB: string;
  formulaPAB: string;
  formulaPProd: string;
  formulaPBGivenA: string;
}

export function calculateDiscreteDiceEvents(
  keyA: DiscreteDiceEventKey,
  keyB: DiscreteDiceEventKey,
): DiscreteDiceResult {
  const eventA = DISCRETE_DICE_EVENTS[keyA];
  const eventB = DISCRETE_DICE_EVENTS[keyB];

  const outcomesA = [...eventA.outcomes];
  const outcomesB = [...eventB.outcomes];

  const setB = new Set(outcomesB);
  const intersectionOutcomes = outcomesA.filter((x) => setB.has(x));
  const unionSet = new Set([...outcomesA, ...outcomesB]);
  const unionOutcomes = Array.from(unionSet).sort((a, b) => a - b);

  const total = 6;
  const pA = outcomesA.length / total;
  const pB = outcomesB.length / total;
  const pAB = intersectionOutcomes.length / total;
  const pAUnionB = unionOutcomes.length / total;

  const isMutuallyExclusive = intersectionOutcomes.length === 0;
  const isIndependent = Math.abs(pAB - pA * pB) < EPSILON;
  const pConditionalBGivenA =
    outcomesA.length > 0
      ? intersectionOutcomes.length / outcomesA.length
      : null;

  return {
    eventA,
    eventB,
    outcomesA,
    outcomesB,
    intersectionOutcomes,
    unionOutcomes,
    pA,
    pB,
    pAB,
    pAUnionB,
    pConditionalBGivenA,
    isIndependent,
    isMutuallyExclusive,
    formulaPA: `\\frac{${outcomesA.length}}{6}`,
    formulaPB: `\\frac{${outcomesB.length}}{6}`,
    formulaPAB: `\\frac{${intersectionOutcomes.length}}{6}`,
    formulaPProd: `\\frac{${outcomesA.length}}{6} \\times \\frac{${outcomesB.length}}{6} = \\frac{${outcomesA.length * outcomesB.length}}{36}`,
    formulaPBGivenA:
      outcomesA.length > 0
        ? `\\frac{${intersectionOutcomes.length}}{${outcomesA.length}}`
        : "\\text{无定义}",
  };
}
