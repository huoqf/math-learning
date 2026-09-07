/**
 * 导数切线放缩与双切线卡位数学计算库
 * 纯函数实现，零 DOM / React / Store 依赖
 */

export type TangentScalingMode = "base" | "sandwich" | "param_k" | "secant";

export type BaseSubModel =
  | "exp_x_plus_1" // e^x >= x + 1, 切点 (0,1)
  | "exp_shift_x" // e^(x-1) >= x, 切点 (1,1)
  | "exp_ex" // e^x >= ex, 切点 (1,e)
  | "log_x_minus_1" // ln x <= x - 1, 切点 (1,0)
  | "log_shift_0" // ln(x+1) <= x, 切点 (0,0)
  | "log_x_div_e"; // ln x <= x/e, 切点 (e, 1)

export type SandwichSubModel =
  | "common_tangent" // e^(x-1) >= x >= ln x + 1, 公切线 y = x
  | "parallel_bands" // e^x >= x+1 > x-1 >= ln x, 平行缓冲带差值 >= 2
  | "origin_sandwich"; // e^x - 1 >= x >= ln(x+1), 原点相切公切线 y = x

export type ParamKSubModel =
  | "exp_log_k" // e^x >= kx >= ln x (x>0), 临界区间 [1/e, e]
  | "exp_kx_origin" // e^x >= kx, 临界 k <= e
  | "log_kx_origin"; // ln x <= kx, 临界 k >= 1/e

export type SecantSubModel =
  | "exp_secant_tangent" // e^x 在 [a, b] 上切线在下、割线在上
  | "log_secant_tangent" // ln x 在 [a, b] 上割线在下、切线在上
  | "taylor_quadratic"; // x - 0.5x^2 <= ln(1+x) <= x

export interface TangentLineData {
  x0: number;
  y0: number;
  slope: number;
  intercept: number;
  equationLatex: string;
  isValid: boolean;
}

export interface DualTangentResult {
  isSafe: boolean; // 是否成功卡位
  upperFuncVal: number; // 上曲线在特定评估点的值
  lineVal: number; // 中间卡位线在评估点的值
  lowerFuncVal: number; // 下曲线在评估点的值
  upperMargin: number; // upper - line >= 0
  lowerMargin: number; // line - lower >= 0
  statusText: string; // 状态描述
}

/**
 * 求解给定函数在 x0 处的切线方程 (y = kx + b)
 */
export function calculateTangentLine(
  funcType: "exp" | "log" | "exp_shift" | "log_shift",
  x0: number,
): TangentLineData {
  if (!Number.isFinite(x0)) {
    return {
      x0: 0,
      y0: 0,
      slope: 1,
      intercept: 0,
      equationLatex: "y = x",
      isValid: false,
    };
  }

  let y0 = 0;
  let slope = 0;

  switch (funcType) {
    case "exp":
      y0 = Math.exp(x0);
      slope = y0;
      break;
    case "exp_shift": // e^(x-1)
      y0 = Math.exp(x0 - 1);
      slope = y0;
      break;
    case "log":
      if (x0 <= 0) {
        return {
          x0: 1,
          y0: 0,
          slope: 1,
          intercept: -1,
          equationLatex: "y = x - 1",
          isValid: false,
        };
      }
      y0 = Math.log(x0);
      slope = 1 / x0;
      break;
    case "log_shift": // ln(x+1)
      if (x0 <= -1) {
        return {
          x0: 0,
          y0: 0,
          slope: 1,
          intercept: 0,
          equationLatex: "y = x",
          isValid: false,
        };
      }
      y0 = Math.log(x0 + 1);
      slope = 1 / (x0 + 1);
      break;
  }

  const intercept = y0 - slope * x0;
  const slopeStr = Math.abs(slope - 1) < 1e-4 ? "" : slope.toFixed(2);
  const interceptStr =
    Math.abs(intercept) < 1e-4
      ? ""
      : intercept > 0
        ? ` + ${intercept.toFixed(2)}`
        : ` - ${Math.abs(intercept).toFixed(2)}`;

  const sign = slope < 0 ? "-" : "";
  const equationLatex =
    Math.abs(slope) < 1e-4
      ? `y = ${intercept.toFixed(2)}`
      : `y = ${sign}${slopeStr}x${interceptStr}`;

  return {
    x0,
    y0,
    slope,
    intercept,
    equationLatex: equationLatex
      .replace("+ -", "-")
      .replace("y = -x", "y = -1.00x"),
    isValid: true,
  };
}

/**
 * 检验在给定斜率 k 与观察点 x 处的卡位状态（支持双侧与单侧）
 */
export function checkParamKBounding(
  k: number,
  evalX: number,
  subModel: ParamKSubModel = "exp_log_k",
): DualTangentResult {
  const clampedX = Math.max(0.01, evalX);
  const upper = Math.exp(clampedX);
  const line = k * clampedX;
  const lower = Math.log(clampedX);

  const kMin = 1 / Math.E; // 1/e ≈ 0.3678794
  const kMax = Math.E; // e ≈ 2.7182818

  const upperMargin = upper - line;
  const lowerMargin = line - lower;

  let isSafeGlobal = false;
  let statusText = "";

  if (subModel === "exp_kx_origin") {
    // 单侧卡位：e^x >= kx 恒成立 <=> k <= e
    isSafeGlobal = k <= kMax + 1e-5;
    if (isSafeGlobal) {
      statusText = "单侧卡位成功 (k ≤ e)";
    } else {
      statusText = "穿透指数曲线 e^x (k > e 导致局部 kx > e^x)";
    }
  } else if (subModel === "log_kx_origin") {
    // 单侧卡位：ln x <= kx 恒成立 <=> k >= 1/e
    isSafeGlobal = k >= kMin - 1e-5;
    if (isSafeGlobal) {
      statusText = "单侧卡位成功 (k ≥ 1/e)";
    } else {
      statusText = "穿透对数曲线 ln x (k < 1/e 导致局部 kx < ln x)";
    }
  } else {
    // 双侧卡位：1/e <= k <= e
    isSafeGlobal = k >= kMin - 1e-5 && k <= kMax + 1e-5;
    if (isSafeGlobal) {
      statusText = "双侧卡位成功 (1/e ≤ k ≤ e)";
    } else if (k > kMax + 1e-5) {
      statusText = "穿透上方曲线 e^x (k > e 导致局部 kx > e^x)";
    } else {
      statusText = "穿透下方曲线 ln x (k < 1/e 导致局部 kx < ln x)";
    }
  }

  return {
    isSafe: isSafeGlobal,
    upperFuncVal: upper,
    lineVal: line,
    lowerFuncVal: lower,
    upperMargin,
    lowerMargin,
    statusText,
  };
}

/**
 * 割线参数计算: 给定区间 [a, b] 求解割线 y = mx + c
 */
export function calculateSecantLine(
  func: (x: number) => number,
  a: number,
  b: number,
): { slope: number; intercept: number; latex: string; isValid: boolean } {
  if (Math.abs(b - a) < 1e-4) {
    return { slope: 0, intercept: 0, latex: "x = a", isValid: false };
  }
  const fa = func(a);
  const fb = func(b);
  const slope = (fb - fa) / (b - a);
  const intercept = fa - slope * a;

  const sign = intercept >= 0 ? "+" : "-";
  const latex = `y = ${slope.toFixed(2)}x ${sign} ${Math.abs(intercept).toFixed(2)}`;

  return { slope, intercept, latex, isValid: true };
}

/**
 * 公切线或平行切线间距计算
 */
export function calculateParallelBandGap(
  slope: number,
  intercept1: number,
  intercept2: number,
): { verticalGap: number; normalDistance: number } {
  const verticalGap = Math.abs(intercept1 - intercept2);
  const normalDistance = verticalGap / Math.sqrt(1 + slope * slope);
  return { verticalGap, normalDistance };
}
