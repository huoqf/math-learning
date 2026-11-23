/**
 * src/math/nestedFuncZeros.ts
 * 必修一函数压轴：嵌套函数零点与复合方程 f(f(x)) = a 根的个数（Zero Side-effects）
 *
 * 注意：属必修一函数章，严禁使用选必二导数及极值词根！
 */

export type NestedFuncMode =
  "quadraticNested" | "piecewiseNested" | "paramBound";

export interface OuterRootBranch {
  tValue: number;
  innerRoots: number[];
}

export interface NestedZeroSolveResult {
  a: number;
  b: number;
  c: number;
  outerRoots: number[];
  branches: OuterRootBranch[];
  allRoots: number[];
  totalCount: number;
  /** 分界临界值说明 */
  criticalHeights: number[];
}

/** 绝对值二次型 f(x) = |x^2 - b*x| + c */
export function evalQuadraticAbs(x: number, b: number, c: number): number {
  return Math.abs(x * x - b * x) + c;
}

/** 经典高考分段翻折型 f(x): x<=0 时 -(x+1)^2+2 (顶点(-1,2),过(0,1)); x>0 时 |ln x| */
export function evalPiecewiseNested(x: number, cShift = 0): number {
  if (x <= 0) {
    return -((x + 1) * (x + 1)) + 2 + cShift;
  }
  return Math.abs(Math.log(Math.max(1e-6, x))) + cShift;
}

/** 解析求解 |x^2 - bx| + c = y 的全部互异实根 */
export function solveQuadraticAbsRoots(
  y: number,
  b: number,
  c: number,
): number[] {
  const diff = y - c;
  if (diff < -1e-9) return [];
  const target = Math.max(0, diff);
  const candidates: number[] = [];

  // 1) x^2 - bx = target
  const disc1 = b * b + 4 * target;
  if (disc1 > 1e-9) {
    const s = Math.sqrt(disc1);
    candidates.push((b - s) / 2, (b + s) / 2);
  } else if (Math.abs(disc1) <= 1e-9) {
    candidates.push(b / 2);
  }

  // 2) x^2 - bx = -target (仅当 target > 0 时不与上方重复)
  if (target > 1e-9) {
    const disc2 = b * b - 4 * target;
    if (disc2 > 1e-9) {
      const s = Math.sqrt(disc2);
      candidates.push((b - s) / 2, (b + s) / 2);
    } else if (Math.abs(disc2) <= 1e-9) {
      candidates.push(b / 2);
    }
  }

  candidates.sort((p, q) => p - q);
  const unique: number[] = [];
  for (const r of candidates) {
    if (unique.length === 0 || Math.abs(r - unique[unique.length - 1]) > 1e-5) {
      unique.push(r);
    }
  }
  return unique;
}

/** 解析求解分段型 f(x) = y 的全部互异实根 */
export function solvePiecewiseNestedRoots(y: number, cShift = 0): number[] {
  const roots: number[] = [];
  const adj = y - cShift;

  // x <= 0: -(x+1)^2 + 2 = adj => (x+1)^2 = 2 - adj
  const rhsLeft = 2 - adj;
  if (rhsLeft > 1e-9) {
    const s = Math.sqrt(rhsLeft);
    const r1 = -1 - s;
    const r2 = -1 + s;
    if (r1 <= 1e-7) roots.push(r1);
    if (r2 <= 1e-7 && Math.abs(r2 - r1) > 1e-5) roots.push(r2);
  } else if (Math.abs(rhsLeft) <= 1e-9) {
    roots.push(-1);
  }

  // x > 0: |ln x| = adj
  if (adj > 1e-9) {
    roots.push(Math.exp(-adj), Math.exp(adj));
  } else if (Math.abs(adj) <= 1e-9) {
    roots.push(1);
  }

  roots.sort((p, q) => p - q);
  const unique: number[] = [];
  for (const r of roots) {
    if (unique.length === 0 || Math.abs(r - unique[unique.length - 1]) > 1e-5) {
      unique.push(r);
    }
  }
  return unique;
}

/** 求解复合方程 f(f(x)) = a 的完整根结构 */
export function solveNestedEquation(
  mode: NestedFuncMode,
  a: number,
  b: number,
  c: number,
): NestedZeroSolveResult {
  const isPiecewise = mode === "piecewiseNested";
  const outerRoots = isPiecewise
    ? solvePiecewiseNestedRoots(a, c)
    : solveQuadraticAbsRoots(a, b, c);

  const branches: OuterRootBranch[] = outerRoots.map((tVal) => ({
    tValue: tVal,
    innerRoots: isPiecewise
      ? solvePiecewiseNestedRoots(tVal, c)
      : solveQuadraticAbsRoots(tVal, b, c),
  }));

  const rawAll = branches.flatMap((br) => br.innerRoots).sort((p, q) => p - q);
  const allRoots: number[] = [];
  for (const r of rawAll) {
    if (
      allRoots.length === 0 ||
      Math.abs(r - allRoots[allRoots.length - 1]) > 1e-5
    ) {
      allRoots.push(r);
    }
  }

  const criticalHeights = isPiecewise
    ? [c, 1 + c, 2 + c]
    : [c, (b * b) / 4 + c];

  return {
    a,
    b,
    c,
    outerRoots,
    branches,
    allRoots,
    totalCount: allRoots.length,
    criticalHeights,
  };
}
