/**
 * 函数概念与性质纯数学计算库
 * 零 React/DOM/window 依赖，符合数学层纯净规则
 */

export interface FunctionPoint {
  x: number;
  y: number;
}

export interface BisectionStepInfo {
  step: number;
  left: number;
  right: number;
  mid: number;
  fLeft: number;
  fRight: number;
  fMid: number;
}

export interface BisectionResult {
  hasZero: boolean;
  steps: BisectionStepInfo[];
  currentStep: BisectionStepInfo | null;
  approxRoot: number;
  errorBound: number;
  validity: boolean;
  warningMessage?: string;
}

export interface ExpLogResult {
  a: number;
  isValidBase: boolean;
  baseWarning?: string;
  expVal: number;
  logVal: number;
  pointExp: FunctionPoint;
  pointLog: FunctionPoint;
  // 对数特化数据
  isLogDefined: boolean;
  logTangentSlope?: number;
  logTangentSlopeStr: string;
  logFixedPointSlope?: number;
  logFixedPointSlopeStr: string;
  logSignState: "positive" | "negative" | "zero" | "undefined";
  logSignDescription: string;
  // 指数特化数据
  expTangentSlope?: number;
  expTangentSlopeStr: string;
  expFixedPointSlope?: number;
  expFixedPointSlopeStr: string;
}

/**
 * 奇偶性判定枚举
 */
export type ParityType = "even" | "odd" | "neither";

/**
 * 评估通用预设函数的奇偶性与对应值
 */
export function evalFunctionParity(
  fnType: "cubic" | "quadratic" | "abs" | "reciprocal",
  x: number,
): {
  fx: number;
  fNegX: number;
  parity: ParityType;
  parityDescription: string;
} {
  let fx = 0;
  let fNegX = 0;
  let parity: ParityType = "neither";
  let parityDescription = "";

  switch (fnType) {
    case "cubic":
      fx = x * x * x;
      fNegX = -x * -x * -x;
      parity = "odd";
      parityDescription =
        "f(-x) = -f(x)，属于奇函数，图象关于坐标原点中心对称。";
      break;
    case "quadratic":
      fx = x * x;
      fNegX = -x * -x;
      parity = "even";
      parityDescription = "f(-x) = f(x)，属于偶函数，图象关于 y 轴轴对称。";
      break;
    case "abs":
      fx = Math.abs(x);
      fNegX = Math.abs(-x);
      parity = "even";
      parityDescription = "f(-x) = f(x)，属于偶函数，图象关于 y 轴轴对称。";
      break;
    case "reciprocal":
      fx = x !== 0 ? 1 / x : NaN;
      fNegX = -x !== 0 ? 1 / -x : NaN;
      parity = "odd";
      parityDescription =
        "f(-x) = -f(x)，属于奇函数，图象关于坐标原点中心对称。";
      break;
  }

  return { fx, fNegX, parity, parityDescription };
}

/**
 * 计算割线斜率与单调性
 */
export function evalSecantSlope(
  fn: (x: number) => number,
  x1: number,
  x2: number,
): {
  fx1: number;
  fx2: number;
  deltaX: number;
  deltaY: number;
  slope: number;
  monotonicity: "increasing" | "decreasing" | "constant" | "invalid";
  description: string;
} {
  const fx1 = fn(x1);
  const fx2 = fn(x2);
  if (!Number.isFinite(fx1) || !Number.isFinite(fx2)) {
    return {
      fx1,
      fx2,
      deltaX: x2 - x1,
      deltaY: NaN,
      slope: NaN,
      monotonicity: "invalid",
      description: "自变量包含无定义点",
    };
  }
  const deltaX = x2 - x1;
  const deltaY = fx2 - fx1;
  if (Math.abs(deltaX) < 1e-6) {
    return {
      fx1,
      fx2,
      deltaX,
      deltaY: 0,
      slope: NaN,
      monotonicity: "invalid",
      description: "x₁ 与 x₂ 重合，割线变为切线",
    };
  }
  const slope = deltaY / deltaX;
  let monotonicity: "increasing" | "decreasing" | "constant" = "constant";
  let description = "常数函数，割线斜率 k = 0";
  if (slope > 1e-4) {
    monotonicity = "increasing";
    description = `割线斜率 k = ${slope.toFixed(2)} > 0，在 [${Math.min(x1, x2).toFixed(1)}, ${Math.max(x1, x2).toFixed(1)}] 区间单调递增`;
  } else if (slope < -1e-4) {
    monotonicity = "decreasing";
    description = `割线斜率 k = ${slope.toFixed(2)} < 0，在 [${Math.min(x1, x2).toFixed(1)}, ${Math.max(x1, x2).toFixed(1)}] 区间单调递减`;
  }
  return { fx1, fx2, deltaX, deltaY, slope, monotonicity, description };
}

/**
 * 轴对称与双轴周期性计算
 */
export function evalSymmetryPeriod(
  axisA: number,
  axisB: number,
): {
  dist: number;
  period: number;
  formulaDescription: string;
} {
  const dist = Math.abs(axisB - axisA);
  const period = 2 * dist;
  const formulaDescription =
    dist > 1e-4
      ? `关于直线 x = ${axisA.toFixed(1)} 与 x = ${axisB.toFixed(1)} 均对称 ⇒ 最小正周期 T = 2|${axisA.toFixed(1)} - ${axisB.toFixed(1)}| = ${period.toFixed(1)}`
      : `两对称轴重合于 x = ${axisA.toFixed(1)}`;

  return { dist, period, formulaDescription };
}

export interface StandardPowerInfo {
  key: string;
  alpha: number;
  latex: string;
  name: string;
  labelUnicode: string;
  domain: string;
  parity: string;
  colorToken: string;
}

export interface PowerFunctionResult {
  alpha: number;
  x0: number;
  isValidPoint: boolean;
  yVal: number;
  domainDescription: string;
  parityDescription: string;
  monotonicityPositive: string;
  warningMessage?: string;
  hasAsymptote: boolean;
  // 导数与切线相关
  isTangentDifferentiable: boolean;
  derivativeVal?: number;
  tangentSlopeStr: string;
  tangentEquationLatex: string;
  tangentIntercept?: number;
  isAtFixedPoint: boolean;
}

/**
 * 指数与对数反函数计算
 */
export function calculateExpLog(a: number, x0: number): ExpLogResult {
  const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;
  let baseWarning: string | undefined;

  if (a <= 0) {
    baseWarning = "底数 a 必须大于 0！指数与对数函数底数不能为负数或零。";
  } else if (Math.abs(a - 1) <= 1e-4) {
    baseWarning = "底数 a = 1 退化为常数函数 y = 1，无法构成对数与反函数！";
  }

  const expVal = isValidBase ? Math.pow(a, x0) : NaN;
  const isLogDefined = isValidBase && x0 > 0;
  const logVal = isLogDefined ? Math.log(x0) / Math.log(a) : NaN;

  // 导数与切线斜率计算
  let logTangentSlope: number | undefined;
  let logTangentSlopeStr = "无定义";
  let logFixedPointSlope: number | undefined;
  let logFixedPointSlopeStr = "无定义";

  let expTangentSlope: number | undefined;
  let expTangentSlopeStr = "无定义";
  let expFixedPointSlope: number | undefined;
  let expFixedPointSlopeStr = "无定义";

  if (isValidBase) {
    const lnA = Math.log(a);
    // 对数导数 (log_a x)' = 1 / (x * ln a)
    if (isLogDefined) {
      logTangentSlope = 1 / (x0 * lnA);
      logTangentSlopeStr = logTangentSlope.toFixed(2);
    }
    logFixedPointSlope = 1 / lnA;
    logFixedPointSlopeStr = logFixedPointSlope.toFixed(2);

    // 指数导数 (a^x)' = a^x * ln a
    if (Number.isFinite(expVal)) {
      expTangentSlope = expVal * lnA;
      expTangentSlopeStr = expTangentSlope.toFixed(2);
    }
    expFixedPointSlope = lnA;
    expFixedPointSlopeStr = expFixedPointSlope.toFixed(2);
  }

  // 对数符号状态与同大为正异大为负
  let logSignState: ExpLogResult["logSignState"] = "undefined";
  let logSignDescription = "真数 x ≤ 0 无定义";

  if (isLogDefined) {
    if (Math.abs(x0 - 1) < 1e-4) {
      logSignState = "zero";
      logSignDescription = "x = 1 为对数零点，log_a(1) = 0";
    } else if ((a > 1 && x0 > 1) || (a < 1 && x0 < 1)) {
      logSignState = "positive";
      logSignDescription =
        a > 1
          ? "同大于 1 (a > 1, x > 1) ⇒ log_a(x) > 0"
          : "同小于 1 (0 < a < 1, 0 < x < 1) ⇒ log_a(x) > 0";
    } else {
      logSignState = "negative";
      logSignDescription =
        a > 1
          ? "异侧 (a > 1, 0 < x < 1) ⇒ log_a(x) < 0"
          : "异侧 (0 < a < 1, x > 1) ⇒ log_a(x) < 0";
    }
  }

  return {
    a,
    isValidBase,
    baseWarning,
    expVal,
    logVal,
    pointExp: { x: x0, y: expVal },
    pointLog: { x: isLogDefined ? x0 : NaN, y: logVal },
    isLogDefined,
    logTangentSlope,
    logTangentSlopeStr,
    logFixedPointSlope,
    logFixedPointSlopeStr,
    logSignState,
    logSignDescription,
    expTangentSlope,
    expTangentSlopeStr,
    expFixedPointSlope,
    expFixedPointSlopeStr,
  };
}

/**
 * 课标 5 大基准幂函数元数据
 */
export const STANDARD_POWER_FUNCTIONS: StandardPowerInfo[] = [
  {
    key: "power-1",
    alpha: 1,
    latex: "y = x",
    name: "正比例 (α = 1)",
    labelUnicode: "y = x",
    domain: "x \\in \\mathbb{R}",
    parity: "奇函数",
    colorToken: "#3B82F6",
  },
  {
    key: "power-2",
    alpha: 2,
    latex: "y = x^2",
    name: "二次抛物线 (α = 2)",
    labelUnicode: "y = x²",
    domain: "x \\in \\mathbb{R}",
    parity: "偶函数",
    colorToken: "#10B981",
  },
  {
    key: "power-3",
    alpha: 3,
    latex: "y = x^3",
    name: "三次曲线 (α = 3)",
    labelUnicode: "y = x³",
    domain: "x \\in \\mathbb{R}",
    parity: "奇函数",
    colorToken: "#8B5CF6",
  },
  {
    key: "power-half",
    alpha: 0.5,
    latex: "y = \\sqrt{x}",
    name: "平方根 (α = 1/2)",
    labelUnicode: "y = √x",
    domain: "[0, +\\infty)",
    parity: "非奇非偶",
    colorToken: "#F59E0B",
  },
  {
    key: "power-neg1",
    alpha: -1,
    latex: "y = \\frac{1}{x}",
    name: "反比例 (α = -1)",
    labelUnicode: "y = 1/x",
    domain: "\\{x \\in \\mathbb{R} \\mid x \\neq 0\\}",
    parity: "奇函数",
    colorToken: "#EC4899",
  },
];

/**
 * 幂函数 y = x^α 纯数学计算
 */
export function calculatePowerFunction(
  alpha: number,
  x0: number,
): PowerFunctionResult {
  let isValidPoint = true;
  let warningMessage: string | undefined;
  let yVal = NaN;

  // 1. 计算 yVal 并判定定义域合法性
  if (alpha === 0) {
    if (Math.abs(x0) < 1e-6) {
      isValidPoint = false;
      warningMessage = "0⁰ 在数学上无意义！";
    } else {
      yVal = 1;
    }
  } else if (alpha < 0) {
    if (Math.abs(x0) < 1e-6) {
      isValidPoint = false;
      warningMessage = `指数 α = ${alpha} < 0 时，x = 0 为分母无定义点（垂直渐近线）！`;
    } else if (x0 < 0) {
      // 检查指数是否允许负数自变量
      if (Number.isInteger(alpha)) {
        yVal = Math.pow(x0, alpha);
      } else {
        isValidPoint = false;
        warningMessage = `非整数负指数 α = ${alpha} 时，x < 0 在实数域无定义！`;
      }
    } else {
      yVal = Math.pow(x0, alpha);
    }
  } else {
    // alpha > 0
    if (x0 < 0) {
      if (Number.isInteger(alpha)) {
        yVal = Math.pow(x0, alpha);
      } else if (alpha === 0.5) {
        isValidPoint = false;
        warningMessage = "√x 的自变量 x 必须非负 (x ≥ 0)！";
      } else {
        // 非整数正指数
        isValidPoint = false;
        warningMessage = `分数/非整数指数 α = ${alpha} 时，负数 x < 0 在实数域无定义！`;
      }
    } else {
      yVal = Math.pow(x0, alpha);
    }
  }

  // 2. 判定定义域与奇偶性
  let domainDescription = "x ∈ ℝ";
  let parityDescription = "非奇非偶函数";

  if (alpha === 2) {
    domainDescription = "x ∈ ℝ";
    parityDescription = "偶函数 (f(-x) = f(x)，图象关于 y 轴对称)";
  } else if (alpha === 3 || alpha === 1 || alpha === -1) {
    domainDescription = alpha === -1 ? "{x ∈ ℝ | x ≠ 0}" : "x ∈ ℝ";
    parityDescription = "奇函数 (f(-x) = -f(x)，图象关于原点对称)";
  } else if (alpha === 0.5) {
    domainDescription = "[0, +∞)";
    parityDescription = "非奇非偶函数 (定义域不对称)";
  } else if (alpha < 0) {
    domainDescription = Number.isInteger(alpha) ? "{x ∈ ℝ | x ≠ 0}" : "(0, +∞)";
    parityDescription = Number.isInteger(alpha)
      ? alpha % 2 === 0
        ? "偶函数"
        : "奇函数"
      : "非奇非偶函数";
  } else if (alpha === 0) {
    domainDescription = "{x ∈ ℝ | x ≠ 0}";
    parityDescription = "偶函数 (在 x ≠ 0 时为常数 1)";
  }

  // 3. 判定在 (0, +∞) 上的单调性
  let monotonicityPositive = "常数函数 y = 1 (α = 0)";
  if (alpha > 0) {
    monotonicityPositive = `单调递增 (α = ${alpha} > 0)`;
  } else if (alpha < 0) {
    monotonicityPositive = `单调递减 (α = ${alpha} < 0)`;
  }

  // 4. 导数与切线斜率计算 y' = α * x^(α - 1)
  let isTangentDifferentiable = false;
  let derivativeVal: number | undefined;
  let tangentSlopeStr = "不可导";
  let tangentEquationLatex = "切线不存在";
  let tangentIntercept: number | undefined;

  if (isValidPoint && Number.isFinite(yVal)) {
    if (alpha === 0) {
      isTangentDifferentiable = true;
      derivativeVal = 0;
      tangentSlopeStr = "0";
      tangentEquationLatex = "y = 1";
      tangentIntercept = 1;
    } else if (x0 > 0) {
      isTangentDifferentiable = true;
      derivativeVal = alpha * Math.pow(x0, alpha - 1);
      tangentSlopeStr = derivativeVal.toFixed(2);
      tangentIntercept = yVal - derivativeVal * x0;
      const bStr =
        Math.abs(tangentIntercept) < 1e-4
          ? ""
          : tangentIntercept > 0
            ? ` + ${tangentIntercept.toFixed(2)}`
            : ` - ${Math.abs(tangentIntercept).toFixed(2)}`;
      tangentEquationLatex = `y = ${derivativeVal.toFixed(2)}x${bStr}`;
    } else if (Math.abs(x0) < 1e-6) {
      if (alpha === 1) {
        isTangentDifferentiable = true;
        derivativeVal = 1;
        tangentSlopeStr = "1";
        tangentEquationLatex = "y = x";
        tangentIntercept = 0;
      } else if (alpha > 1) {
        isTangentDifferentiable = true;
        derivativeVal = 0;
        tangentSlopeStr = "0";
        tangentEquationLatex = "y = 0";
        tangentIntercept = 0;
      } else if (alpha > 0 && alpha < 1) {
        isTangentDifferentiable = false;
        tangentSlopeStr = "切线垂直于 x 轴 (斜率趋向 +∞)";
        tangentEquationLatex = "x = 0";
      }
    } else if (x0 < 0 && Number.isInteger(alpha)) {
      isTangentDifferentiable = true;
      derivativeVal = alpha * Math.pow(x0, alpha - 1);
      tangentSlopeStr = derivativeVal.toFixed(2);
      tangentIntercept = yVal - derivativeVal * x0;
      const bStr =
        Math.abs(tangentIntercept) < 1e-4
          ? ""
          : tangentIntercept > 0
            ? ` + ${tangentIntercept.toFixed(2)}`
            : ` - ${Math.abs(tangentIntercept).toFixed(2)}`;
      tangentEquationLatex = `y = ${derivativeVal.toFixed(2)}x${bStr}`;
    }
  }

  const isAtFixedPoint = Math.abs(x0 - 1.0) < 0.05;

  return {
    alpha,
    x0,
    isValidPoint,
    yVal,
    domainDescription,
    parityDescription,
    monotonicityPositive,
    warningMessage,
    hasAsymptote: alpha < 0,
    isTangentDifferentiable,
    derivativeVal,
    tangentSlopeStr,
    tangentEquationLatex,
    tangentIntercept,
    isAtFixedPoint,
  };
}

/**
 * 二分逼近法求解零点
 */
export function solveBisection(
  fn: (x: number) => number,
  m: number,
  n: number,
  maxSteps: number,
): BisectionResult {
  if (m >= n) {
    return {
      hasZero: false,
      steps: [],
      currentStep: null,
      approxRoot: NaN,
      errorBound: NaN,
      validity: false,
      warningMessage: "区间端点无效：要求左端点 m < 右端点 n！",
    };
  }

  const fM = fn(m);
  const fN = fn(n);

  if (fM * fN > 0) {
    return {
      hasZero: false,
      steps: [],
      currentStep: null,
      approxRoot: NaN,
      errorBound: n - m,
      validity: true,
      warningMessage: `f(${m.toFixed(1)}) 与 f(${n.toFixed(1)}) 同号 (${fM > 0 ? "+" : "-"})，不满足零点存在性定理前提 f(a)·f(b) < 0！`,
    };
  }

  let left = m;
  let right = n;
  const steps: BisectionStepInfo[] = [];

  for (let k = 1; k <= maxSteps; k++) {
    const mid = (left + right) / 2;
    const fLeft = fn(left);
    const fRight = fn(right);
    const fMid = fn(mid);

    steps.push({
      step: k,
      left,
      right,
      mid,
      fLeft,
      fRight,
      fMid,
    });

    if (Math.abs(fMid) < 1e-9) {
      break;
    }

    if (fLeft * fMid < 0) {
      right = mid;
    } else {
      left = mid;
    }
  }

  const currentStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const approxRoot = currentStep ? currentStep.mid : (m + n) / 2;
  const errorBound = currentStep
    ? (currentStep.right - currentStep.left) / 2
    : (n - m) / 2;

  return {
    hasZero: true,
    steps,
    currentStep,
    approxRoot,
    errorBound,
    validity: true,
  };
}
