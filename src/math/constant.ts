/**
 * src/math/constant.ts
 * 恒成立与存在性问题数学逻辑求解库（纯函数，零外部 DOM/React/Store 依赖）
 */

export interface MathState {
  isValid: boolean;
  isDegenerate: boolean;
  degenerateType?: "interval_collapse" | "none";
}

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
}

/** 单变量直接最值讨论法求解结果 */
export interface ConstantSingleDirectResult extends MathState {
  a: number; // 二次函数的对称轴
  m: number;
  n: number;
  fMin: number;
  xFMin: number;
  fMax: number;
  xFMax: number;
  isAlwaysTrue: boolean; // f(x) >= 0 恒成立
  violatedInterval: [number, number] | null; // f(x) < 0 的区间交集
  discussionType: "left" | "inside" | "right"; // 对称轴在区间的：左侧、内部、右侧
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

/** 超越函数模型 A 辅助函数：f(x) = ln(x) / x */
export function evalFTrans(x: number): number {
  return x > 0 ? Math.log(x) / x : NaN;
}

/** 超越函数模型 B 辅助函数：f(x, a) = e^x - ax */
export function evalGParamTrans(x: number, a: number): number {
  return Math.exp(x) - a * x;
}

/**
 * 求解 ln(x) - ax = 0 的实根，用于参变分离违背区间计算
 */
export function solveSepEquation(a: number): {
  r1: number | null;
  r2: number | null;
} {
  if (a <= 0) {
    let left = 0.00001,
      right = 1.0;
    for (let i = 0; i < 30; i++) {
      const mid = (left + right) / 2;
      const val = Math.log(mid) - a * mid;
      if (val > 0) right = mid;
      else left = mid;
    }
    return { r1: (left + right) / 2, r2: null };
  }

  if (a > 1 / Math.E) {
    return { r1: null, r2: null };
  }

  if (Math.abs(a - 1 / Math.E) < 1e-9) {
    return { r1: Math.E, r2: null };
  }

  let left1 = 1.0,
    right1 = Math.E;
  for (let i = 0; i < 30; i++) {
    const mid = (left1 + right1) / 2;
    const val = Math.log(mid) - a * mid;
    if (val > 0) right1 = mid;
    else left1 = mid;
  }
  const r1 = (left1 + right1) / 2;

  let left2 = Math.E,
    right2 = 100.0;
  for (let i = 0; i < 30; i++) {
    const mid = (left2 + right2) / 2;
    const val = Math.log(mid) - a * mid;
    if (val > 0) left2 = mid;
    else right2 = mid;
  }
  const r2 = (left2 + right2) / 2;

  return { r1, r2 };
}

/**
 * 求解 e^x - ax = 0 的实根，用于直接讨论违背区间计算
 */
export function solveDirectEquation(a: number): {
  r1: number | null;
  r2: number | null;
} {
  if (a <= 0) {
    let left = -15.0,
      right = 0.0;
    if (a < -5) left = -30.0;
    for (let i = 0; i < 30; i++) {
      const mid = (left + right) / 2;
      const val = Math.exp(mid) - a * mid;
      if (val > 0) right = mid;
      else left = mid;
    }
    return { r1: (left + right) / 2, r2: null };
  }

  const lna = Math.log(a);
  const fMin = Math.exp(lna) - a * lna;
  if (fMin >= 0) {
    return { r1: null, r2: null };
  }

  let left1 = -15.0,
    right1 = lna;
  for (let i = 0; i < 30; i++) {
    const mid = (left1 + right1) / 2;
    const val = Math.exp(mid) - a * mid;
    if (val > 0) left1 = mid;
    else right1 = mid;
  }
  const r1 = (left1 + right1) / 2;

  let left2 = lna,
    right2 = 15.0;
  for (let i = 0; i < 30; i++) {
    const mid = (left2 + right2) / 2;
    const val = Math.exp(mid) - a * mid;
    if (val > 0) right2 = mid;
    else left2 = mid;
  }
  const r2 = (left2 + right2) / 2;

  return { r1, r2 };
}

/**
 * 求解超越函数单变量参变分离
 * f(x) = ln(x) / x，区间 [m, n] (m > 0)
 */
export function solveConstantSingleSepTrans(
  a: number,
  m: number,
  n: number,
): ConstantSingleSepResult {
  if (m <= 0 || m >= n) {
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

  const e = Math.E;
  let fMin: number;
  let xFMin: number;
  let fMax: number;
  let xFMax: number;

  if (e < m) {
    fMax = evalFTrans(m);
    xFMax = m;
    fMin = evalFTrans(n);
    xFMin = n;
  } else if (e > n) {
    fMax = evalFTrans(n);
    xFMax = n;
    fMin = evalFTrans(m);
    xFMin = m;
  } else {
    fMax = 1 / Math.E;
    xFMax = e;
    const fm = evalFTrans(m);
    const fn = evalFTrans(n);
    fMin = fm < fn ? fm : fn;
    xFMin = fm < fn ? m : n;
  }

  const isAlwaysTrue = fMin >= a;
  const isExistTrue = fMax >= a;

  let violatedInterval: [number, number] | null = null;
  const { r1, r2 } = solveSepEquation(a);

  if (a <= 0) {
    if (r1 !== null) {
      const start = m;
      const end = Math.min(n, r1);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  } else {
    if (a > 1 / Math.E) {
      violatedInterval = [m, n];
    } else if (r1 !== null && r2 !== null) {
      const start1 = m;
      const end1 = Math.min(n, r1);
      const start2 = Math.max(m, r2);
      const end2 = n;

      const len1 = end1 - start1;
      const len2 = end2 - start2;
      if (len1 > 0 && len2 > 0) {
        violatedInterval = len1 > len2 ? [start1, end1] : [start2, end2];
      } else if (len1 > 0) {
        violatedInterval = [start1, end1];
      } else if (len2 > 0) {
        violatedInterval = [start2, end2];
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
 * 求解超越函数单变量直接最值讨论
 * f(x) = e^x - ax，区间 [m, n]，判定 f(x) >= 0 恒成立
 */
export function solveConstantSingleDirectTrans(
  a: number,
  m: number,
  n: number,
): ConstantSingleDirectResult {
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

  let fMin: number;
  let xFMin: number;
  let discussionType: "left" | "inside" | "right";

  if (a <= 0) {
    fMin = evalGParamTrans(m, a);
    xFMin = m;
    discussionType = "left";
  } else {
    const lna = Math.log(a);
    if (lna < m) {
      fMin = evalGParamTrans(m, a);
      xFMin = m;
      discussionType = "left";
    } else if (lna > n) {
      fMin = evalGParamTrans(n, a);
      xFMin = n;
      discussionType = "right";
    } else {
      fMin = a - a * lna;
      xFMin = lna;
      discussionType = "inside";
    }
  }

  const fm = evalGParamTrans(m, a);
  const fn = evalGParamTrans(n, a);
  const fMax = fm > fn ? fm : fn;
  const xFMax = fm > fn ? m : n;

  const isAlwaysTrue = fMin >= 0;

  let violatedInterval: [number, number] | null = null;
  const { r1, r2 } = solveDirectEquation(a);

  if (a <= 0) {
    if (r1 !== null) {
      const start = m;
      const end = Math.min(n, r1);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  } else {
    if (fMin < 0 && r1 !== null && r2 !== null) {
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
