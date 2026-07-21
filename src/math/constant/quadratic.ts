/**
 * src/math/constant/quadratic.ts
 * 二次函数恒成立与存在性问题求解（纯函数，零外部依赖）
 */

import type {
  ConstantSingleSepResult,
  ConstantSingleDirectResult,
  ConstantDoubleResult,
} from "./types";

/** 辅助函数：计算 f(x) = x^2 - 2x + 2 */
export function evalF(x: number): number {
  return x * x - 2 * x + 2;
}

/** 辅助函数：计算 g(x, a) = x^2 - 2ax + 2 */
export function evalGParam(x: number, a: number): number {
  return x * x - 2 * a * x + 2;
}

/**
 * 求解单变量参变分离
 * f(x) = x^2 - 2x + 2，区间 [m, n]
 */
export function solveConstantSingleSep(
  a: number,
  m: number,
  n: number,
): ConstantSingleSepResult {
  // 退化判定
  if (m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      a,
      m,
      n,
      isAlwaysTrue: false,
      isExistTrue: false,
      violatedInterval: null,
    };
  }

  // 二次函数 f(x) = (x-1)^2 + 1，开口向上，对称轴为 1.0
  const symAxis = 1.0;
  let fMin: number;
  let xFMin: number;

  if (symAxis < m) {
    fMin = evalF(m);
    xFMin = m;
  } else if (symAxis > n) {
    fMin = evalF(n);
    xFMin = n;
  } else {
    fMin = 1.0; // 顶点最值
    xFMin = symAxis;
  }

  // 最大值一定在远离对称轴的端点取得
  const fm = evalF(m);
  const fn = evalF(n);
  const fMax = fm > fn ? fm : fn;
  const xFMax = fm > fn ? m : n;

  const isAlwaysTrue = fMin >= a;
  const isExistTrue = fMax >= a;

  // 计算违背区间：f(x) < a => x^2 - 2x + 2 - a < 0
  // 当 a <= 1.0 时，f(x) >= 1.0 >= a 恒成立，违背区间为空
  let violatedInterval: [number, number] | null = null;
  if (a > 1.0) {
    const delta = 4 * a - 4; // 4a - 4
    if (delta > 0) {
      const sqrtDelta = Math.sqrt(delta);
      const r1 = (2 - sqrtDelta) / 2; // 1 - sqrt(a-1)
      const r2 = (2 + sqrtDelta) / 2; // 1 + sqrt(a-1)

      // 与 [m, n] 求交集
      const start = Math.max(m, r1);
      const end = Math.min(n, r2);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  }

  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    fMin,
    xFMin,
    fMax,
    xFMax,
    a,
    m,
    n,
    isAlwaysTrue,
    isExistTrue,
    violatedInterval,
  };
}

/**
 * 求解单变量直接最值讨论
 * f(x) = x^2 - 2ax + 2，区间 [m, n]，判定 f(x) >= 0 恒成立
 */
export function solveConstantSingleDirect(
  a: number,
  m: number,
  n: number,
): ConstantSingleDirectResult {
  // 退化判定
  if (m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      a,
      m,
      n,
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      isAlwaysTrue: false,
      violatedInterval: null,
      discussionType: "inside",
    };
  }

  // 对称轴为 x = a
  let fMin: number;
  let xFMin: number;
  let discussionType: "left" | "inside" | "right";

  if (a < m) {
    fMin = evalGParam(m, a);
    xFMin = m;
    discussionType = "left";
  } else if (a > n) {
    fMin = evalGParam(n, a);
    xFMin = n;
    discussionType = "right";
  } else {
    fMin = 2 - a * a; // 顶点最值
    xFMin = a;
    discussionType = "inside";
  }

  const fm = evalGParam(m, a);
  const fn = evalGParam(n, a);
  const fMax = fm > fn ? fm : fn;
  const xFMax = fm > fn ? m : n;

  const isAlwaysTrue = fMin >= 0;

  // 违背区间 f(x) < 0 => x^2 - 2ax + 2 < 0
  // 判别式 delta = 4a^2 - 8 = 4(a^2 - 2)
  let violatedInterval: [number, number] | null = null;
  const delta = 4 * a * a - 8;
  if (delta > 0) {
    const sqrtDelta = Math.sqrt(delta);
    const r1 = (2 * a - sqrtDelta) / 2; // a - sqrt(a^2 - 2)
    const r2 = (2 * a + sqrtDelta) / 2; // a + sqrt(a^2 - 2)

    // 与 [m, n] 求交
    const start = Math.max(m, r1);
    const end = Math.min(n, r2);
    if (start < end) {
      violatedInterval = [start, end];
    }
  }

  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    a,
    m,
    n,
    fMin,
    xFMin,
    fMax,
    xFMax,
    isAlwaysTrue,
    violatedInterval,
    discussionType,
  };
}

/**
 * 求解双变量对决博弈
 * f(x) = (x - xf)^2 + yf, x in I1 = [mf, nf] (开口向上)
 * g(x) = -(x - xg)^2 + yg, x in I2 = [mg, ng] (开口向下)
 */
export function solveConstantDouble(
  yf: number,
  xf: number,
  mf: number,
  nf: number,
  yg: number,
  xg: number,
  mg: number,
  ng: number,
  selectedLogic:
    "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var",
): ConstantDoubleResult {
  // 退化检测
  const isD = mf >= nf || mg >= ng;
  if (isD) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      gMin: 0,
      xGMin: 0,
      gMax: 0,
      xGMax: 0,
      isAllAllTrue: false,
      isAllExistTrue: false,
      isExistAllTrue: false,
      isExistExistTrue: false,
      battlePointF: { x: 0, y: 0 },
      battlePointG: { x: 0, y: 0 },
      isCurrentLogicTrue: false,
    };
  }

  // 1. 计算 f(x) = (x - xf)^2 + yf 的最值
  const evalFDouble = (x: number) => (x - xf) * (x - xf) + yf;
  let fMin: number;
  let xFMin: number;
  if (xf < mf) {
    fMin = evalFDouble(mf);
    xFMin = mf;
  } else if (xf > nf) {
    fMin = evalFDouble(nf);
    xFMin = nf;
  } else {
    fMin = yf;
    xFMin = xf;
  }

  const fValM = evalFDouble(mf);
  const fValN = evalFDouble(nf);
  const fMax = fValM > fValN ? fValM : fValN;
  const xFMax = fValM > fValN ? mf : nf;

  // 2. 计算 g(x) = -(x - xg)^2 + yg 的最值
  const evalGDouble = (x: number) => -(x - xg) * (x - xg) + yg;
  let gMax: number;
  let xGMax: number;
  if (xg < mg) {
    gMax = evalGDouble(mg);
    xGMax = mg;
  } else if (xg > ng) {
    gMax = evalGDouble(ng);
    xGMax = ng;
  } else {
    gMax = yg;
    xGMax = xg;
  }

  const gValM = evalGDouble(mg);
  const gValN = evalGDouble(ng);
  const gMin = gValM < gValN ? gValM : gValN;
  const xGMin = gValM < gValN ? mg : ng;

  // 3. 计算 4 种逻辑的成立状态
  const isAllAllTrue = fMin >= gMax;
  const isAllExistTrue = fMin >= gMin;
  const isExistAllTrue = fMax >= gMax;
  const isExistExistTrue = fMax >= gMin;

  // 4. 同变量计算：交集为 [mJoint, nJoint]
  const mJoint = Math.max(mf, mg);
  const nJoint = Math.min(nf, ng);
  let isSameVarTrue = false;
  let sameVarMinDiff = 0;
  let sameVarXMin = 0;

  if (mJoint < nJoint) {
    // h(x) = f(x) - g(x) = 2x^2 - 2(xf + xg)x + (xf^2 + yf + xg^2 - yg)
    // 其对称轴为 (xf + xg) / 2
    const symH = (xf + xg) / 2;
    const evalH = (x: number) => evalFDouble(x) - evalGDouble(x);

    if (symH < mJoint) {
      sameVarMinDiff = evalH(mJoint);
      sameVarXMin = mJoint;
    } else if (symH > nJoint) {
      sameVarMinDiff = evalH(nJoint);
      sameVarXMin = nJoint;
    } else {
      sameVarMinDiff = evalH(symH);
      sameVarXMin = symH;
    }
    isSameVarTrue = sameVarMinDiff >= 0;
  }

  // 5. 根据当前选择的逻辑，分配博弈对决的对比点
  let battlePointF = { x: xFMin, y: fMin };
  let battlePointG = { x: xGMax, y: gMax };
  let isCurrentLogicTrue = isAllAllTrue;

  switch (selectedLogic) {
    case "all_all":
      battlePointF = { x: xFMin, y: fMin };
      battlePointG = { x: xGMax, y: gMax };
      isCurrentLogicTrue = isAllAllTrue;
      break;
    case "all_exist":
      battlePointF = { x: xFMin, y: fMin };
      battlePointG = { x: xGMin, y: gMin };
      isCurrentLogicTrue = isAllExistTrue;
      break;
    case "exist_all":
      battlePointF = { x: xFMax, y: fMax };
      battlePointG = { x: xGMax, y: gMax };
      isCurrentLogicTrue = isExistAllTrue;
      break;
    case "exist_exist":
      battlePointF = { x: xFMax, y: fMax };
      battlePointG = { x: xGMin, y: gMin };
      isCurrentLogicTrue = isExistExistTrue;
      break;
    case "same_var":
      battlePointF = { x: sameVarXMin, y: evalFDouble(sameVarXMin) };
      battlePointG = { x: sameVarXMin, y: evalGDouble(sameVarXMin) };
      isCurrentLogicTrue = isSameVarTrue;
      break;
  }

  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    fMin,
    xFMin,
    fMax,
    xFMax,
    gMin,
    xGMin,
    gMax,
    xGMax,
    isAllAllTrue,
    isAllExistTrue,
    isExistAllTrue,
    isExistExistTrue,
    isSameVarTrue,
    sameVarMinDiff,
    sameVarXMin,
    battlePointF,
    battlePointG,
    isCurrentLogicTrue,
  };
}
