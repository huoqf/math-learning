/**
 * src/math/inequalityProperties.ts
 * 等式与不等式的性质（必修一 2.1）—— 作差比较法与三条基本性质的纯函数内核
 *
 * 课标要求：会用**作差法**比较两个实数的大小，并掌握不等式的可加性、可乘性。
 * 三条结论全部由「差（或积）的符号」定义，因此本模块只输出符号判定，
 * 不做任何字符串格式化（SSOT：数学层零文案、零 React）。
 */

export type Relation = "gt" | "eq" | "lt" | "undefined";

export interface InequalityPropertiesResult {
  a: number;
  b: number;
  c: number;
  /** 作差比较的核心量 a − b */
  diff: number;
  /** a 与 b 的大小关系 */
  relation: Relation;
  /** 作差后的结果是否「大于零」：true 即 a > b */
  isABGreater: boolean;
  /** a + c 与 b + c */
  sumA: number;
  sumB: number;
  /** 平移后的大小关系（可加性：必然与 relation 相同） */
  sumRelation: Relation;
  /** a·c 与 b·c */
  prodA: number;
  prodB: number;
  /** 同乘 c 后的大小关系（c > 0 不变向；c < 0 变向；c = 0 化为相等） */
  prodRelation: Relation;
  /** 同乘是否发生了「变向」（仅当 c < 0 且 a ≠ b 时为 true） */
  isProdReversed: boolean;
}

const EPS = 1e-9;

function relate(x: number, y: number): Relation {
  const d = x - y;
  if (Math.abs(d) < EPS) return "eq";
  return d > 0 ? "gt" : "lt";
}

/**
 * 计算作差比较与两条运算性质在给定 a、b、c 下的符号关系。
 */
export function analyzeInequalityProperties(
  a: number,
  b: number,
  c: number,
): InequalityPropertiesResult {
  const diff = a - b;
  const relation = relate(a, b);

  const sumA = a + c;
  const sumB = b + c;
  const sumRelation = relate(sumA, sumB);

  const prodA = a * c;
  const prodB = b * c;
  const prodRelation = relate(prodA, prodB);

  return {
    a,
    b,
    c,
    diff,
    relation,
    isABGreater: relation === "gt",
    sumA,
    sumB,
    sumRelation,
    prodA,
    prodB,
    prodRelation,
    // 变向的判据：乘以负数后大小关系翻转（a = b 时两侧同乘仍相等，不算变向）
    isProdReversed: c < -EPS && relation !== "eq" && prodRelation !== relation,
  };
}

/** 大小关系的中文（教学）表述，供数据层文案复用，避免各处各写一套 */
export function relationText(r: Relation, left = "a", right = "b"): string {
  if (r === "gt") return `${left} > ${right}`;
  if (r === "lt") return `${left} < ${right}`;
  if (r === "eq") return `${left} = ${right}`;
  return "无法比较";
}
