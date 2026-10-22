import { formatMathNumber } from "@/utils/mathFormat";

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

  return {
    x0,
    y0,
    slope,
    intercept,
    equationLatex: formatLineEquationLatex(slope, intercept),
    isValid: true,
  };
}

/**
 * 格式化直线方程 y = kx + b（符合高中数学代数规范，无 1.00x 机器尾零，系数为 1 省略）
 */
function formatLineEquationLatex(slope: number, intercept: number): string {
  if (Math.abs(slope) < 1e-4) {
    return `y = ${formatMathNumber(intercept)}`;
  }
  const absSlope = Math.abs(slope);
  const slopeCoeff =
    Math.abs(absSlope - 1) < 1e-4 ? "" : formatMathNumber(absSlope);
  const sign = slope < 0 ? "-" : "";
  const xPart = `${sign}${slopeCoeff}x`;

  if (Math.abs(intercept) < 1e-4) {
    return `y = ${xPart}`;
  }
  const intSign = intercept > 0 ? "+" : "-";
  return `y = ${xPart} ${intSign} ${formatMathNumber(Math.abs(intercept))}`;
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

  const latex = formatLineEquationLatex(slope, intercept);

  return { slope, intercept, latex, isValid: true };
}

/* ==================================================================
 * 子模型曲线定义表（单源）
 *
 * 为什么集中在数学层：同一个「上界 e^(x-1) / 下界 ln x + 1」原先各有两份
 * ——中屏场景组件按子模型 if-else 现算一份、右屏 builder 再算一份；
 * 而视口自适应需要在中屏顶层（useSceneScale 调用处）拿到关键点，
 * 若在那里再写一遍就成了第三份。三处一旦漂移，会出现「画面画的是 e^(x-1)
 * 而右屏按 e^x 读数」的静默错误。故把曲线本体、定义域、基准切点、
 * 可拖拽区间统一定义在此，渲染层与数据层一律消费。
 * ================================================================== */

/** 视口取景与子模型判定所需的最小参数集（结构化兼容 registry 的 TangentScalingParams） */
export interface TangentScalingParamValues {
  x0: number;
  evalX: number;
  k: number;
  intervalA: number;
  intervalB: number;
}

/** 平面上的一个点（视口取景输入） */
export interface TangentScalingKeyPoint {
  x: number;
  y: number;
}

/** 基准切线放缩：曲线 + 定义域 + 基准切点 + 基准切线 + 可拖拽区间 */
export interface BaseCurveModel {
  /** 传给 calculateTangentLine 的函数类型 */
  funcType: "exp" | "log" | "exp_shift" | "log_shift";
  /** 曲线本体；定义域外返回 NaN，配合 clipFn 断开曲线而不产生飞线 */
  fn: (x: number) => number;
  /** 曲线绘制定义域 */
  mainXRange: [number, number];
  /** 基准切点 T₀：高考放缩基准切线在该点与曲线相切 */
  basePoint: TangentScalingKeyPoint;
  /** 基准切线 y = slope·x + intercept */
  baseTangent: { slope: number; intercept: number };
  /** 左屏滑块与中屏可拖拽切点的公共区间（单一来源，避免两处各写一份 min/max） */
  dragXRange: [number, number];
}

export const BASE_CURVE_MODELS: Record<BaseSubModel, BaseCurveModel> = {
  // e^x >= x + 1，切点 (0,1)
  exp_x_plus_1: {
    funcType: "exp",
    fn: (x) => Math.exp(x),
    mainXRange: [-4, 3.0],
    basePoint: { x: 0, y: 1 },
    baseTangent: { slope: 1, intercept: 1 },
    dragXRange: [-2.0, 2.0],
  },
  // e^(x-1) >= x，切点 (1,1)
  exp_shift_x: {
    funcType: "exp_shift",
    fn: (x) => Math.exp(x - 1),
    mainXRange: [-4, 3.5],
    basePoint: { x: 1, y: 1 },
    baseTangent: { slope: 1, intercept: 0 },
    dragXRange: [-1.5, 2.8],
  },
  // e^x >= ex，切点 (1,e)
  exp_ex: {
    funcType: "exp",
    fn: (x) => Math.exp(x),
    mainXRange: [-4, 3.0],
    basePoint: { x: 1, y: Math.E },
    baseTangent: { slope: Math.E, intercept: 0 },
    dragXRange: [-1.5, 2.8],
  },
  // ln x <= x - 1，切点 (1,0)
  log_x_minus_1: {
    funcType: "log",
    fn: (x) => (x > 0 ? Math.log(x) : NaN),
    mainXRange: [0.02, 5.0],
    basePoint: { x: 1, y: 0 },
    baseTangent: { slope: 1, intercept: -1 },
    dragXRange: [0.2, 4.0],
  },
  // ln(x+1) <= x，切点 (0,0)
  log_shift_0: {
    funcType: "log_shift",
    fn: (x) => (x > -1 ? Math.log(x + 1) : NaN),
    mainXRange: [-0.98, 5.0],
    basePoint: { x: 0, y: 0 },
    baseTangent: { slope: 1, intercept: 0 },
    dragXRange: [-0.8, 3.5],
  },
  // ln x <= x/e，切点 (e,1)
  log_x_div_e: {
    funcType: "log",
    fn: (x) => (x > 0 ? Math.log(x) : NaN),
    mainXRange: [0.02, 5.0],
    basePoint: { x: Math.E, y: 1 },
    baseTangent: { slope: 1 / Math.E, intercept: 0 },
    dragXRange: [0.5, 4.5],
  },
};

/** 双切线卡位：上下界曲线 + 定义域 + 特征切点 */
export interface SandwichCurveModel {
  /** 上界函数 */
  upperFn: (x: number) => number;
  /** 下界函数 */
  lowerFn: (x: number) => number;
  /** 上下界各自的绘制定义域 */
  upperXRange: [number, number];
  lowerXRange: [number, number];
  /** 中间公切线 y = x（平行双切构型无中介线，改用两条平行切线） */
  middleLineFn?: (x: number) => number;
  /** 平行缓冲带的两条平行切线 */
  upperLineFn?: (x: number) => number;
  lowerLineFn?: (x: number) => number;
  /** 特征切点：公切点 1 个；平行双切为两个切点 */
  featurePoints: TangentScalingKeyPoint[];
  /** 观察探针允许的横坐标区间（左屏滑块与中屏拖拽共用的单一来源） */
  probeXRange: [number, number];
}

export const SANDWICH_CURVE_MODELS: Record<
  SandwichSubModel,
  SandwichCurveModel
> = {
  // e^(x-1) >= x >= ln x + 1，公切线 y = x 切于 (1,1)
  common_tangent: {
    upperFn: (x) => Math.exp(x - 1),
    lowerFn: (x) => (x > 0 ? Math.log(x) + 1 : NaN),
    upperXRange: [-4, 3.5],
    lowerXRange: [0.02, 5.0],
    middleLineFn: (x) => x,
    featurePoints: [{ x: 1, y: 1 }],
    probeXRange: [0.2, 3.5],
  },
  // e^x >= x+1 与 x-1 >= ln x 的两条平行切线 y = x+1 / y = x-1
  parallel_bands: {
    upperFn: (x) => Math.exp(x),
    lowerFn: (x) => (x > 0 ? Math.log(x) : NaN),
    upperXRange: [-4, 3.0],
    lowerXRange: [0.02, 5.0],
    upperLineFn: (x) => x + 1,
    lowerLineFn: (x) => x - 1,
    featurePoints: [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ],
    probeXRange: [0.2, 3.5],
  },
  // e^x - 1 >= x >= ln(x+1)，公切线 y = x 切于原点
  origin_sandwich: {
    upperFn: (x) => Math.exp(x) - 1,
    lowerFn: (x) => (x > -1 ? Math.log(x + 1) : NaN),
    upperXRange: [-4, 3.0],
    lowerXRange: [-0.98, 5.0],
    middleLineFn: (x) => x,
    featurePoints: [{ x: 0, y: 0 }],
    probeXRange: [-0.7, 3.5],
  },
};

/** 割切双向放缩：主曲线 + 定义域 + 中点切线类型 */
export interface SecantCurveModel {
  /** 主曲线 */
  mainFn: (x: number) => number;
  /** 曲线绘制定义域 */
  mainXRange: [number, number];
  /** 割线与切线的绘制定义域（可越出曲线定义域，允许线体延伸出画布） */
  lineXRange: [number, number];
  /** 主曲线是否对数型（决定配色，以及「切线在上 / 割线在上」的方向） */
  isLog: boolean;
  /** 中点切线类型；二阶多项式卡位没有中点切线 */
  tangentFuncType: "exp" | "log" | null;
  /** 二阶多项式卡位的上下界（仅 taylor_quadratic 使用） */
  upperFn?: (x: number) => number;
  lowerFn?: (x: number) => number;
  /** 下界的多项式仅在 x >= 0 有效，需单独截断 */
  lowerXRange?: [number, number];
}

export const SECANT_CURVE_MODELS: Record<SecantSubModel, SecantCurveModel> = {
  exp_secant_tangent: {
    mainFn: (x) => Math.exp(x),
    mainXRange: [-4.0, 3.0],
    lineXRange: [-4.0, 5.0],
    isLog: false,
    tangentFuncType: "exp",
  },
  log_secant_tangent: {
    mainFn: (x) => (x > 0 ? Math.log(x) : NaN),
    mainXRange: [0.02, 5.0],
    lineXRange: [0.02, 5.0],
    isLog: true,
    tangentFuncType: "log",
  },
  taylor_quadratic: {
    mainFn: (x) => (x > -1 ? Math.log(1 + x) : NaN),
    mainXRange: [-0.98, 5.0],
    lineXRange: [-2.5, 5.0],
    isLog: false,
    tangentFuncType: null,
    upperFn: (x) => x,
    lowerFn: (x) => x - 0.5 * x * x,
    // x - x²/2 <= ln(1+x) 仅在 x >= 0 成立：下界必须截断在 [0, 5]，
    // 否则 x < 0 段会画出「下界跑到函数上方」的错误图形
    lowerXRange: [0, 5.0],
  },
};

/**
 * 采集中屏必须落在画布内的教学关键点（切点、临界点、探针读数点）。
 *
 * 只收「点标 / 可拖拽手柄」所在的位置，**不含**函数曲线与切线的端点——
 * 那些本来就应当被画布自然截断（指数曲线冲出上边界是正常表现），
 * 若把它们喂进取景函数，视口会被 33 这样的函数值拽到失去教学比例。
 */
export function collectTangentScalingKeyPoints(
  params: TangentScalingParamValues,
  mode: TangentScalingMode,
  subs: {
    baseSubModel: BaseSubModel;
    sandwichSubModel: SandwichSubModel;
    paramKSubModel: ParamKSubModel;
    secantSubModel: SecantSubModel;
  },
): TangentScalingKeyPoint[] {
  if (mode === "base") {
    const model = BASE_CURVE_MODELS[subs.baseSubModel];
    const tangent = calculateTangentLine(model.funcType, params.x0);
    // 动切点 P₀ 与基准切点 T₀ 同屏对照，是本模式唯一的观察对象
    return [
      { x: tangent.x0, y: tangent.y0 },
      { x: model.basePoint.x, y: model.basePoint.y },
    ];
  }

  if (mode === "sandwich") {
    const model = SANDWICH_CURVE_MODELS[subs.sandwichSubModel];
    const x = params.evalX;
    // 特征切点 + 观察点处的上下交点（P₁ / P₂），垂直间距 Δy 本身就是教学内容
    return [
      ...model.featurePoints,
      { x, y: model.upperFn(x) },
      { x, y: model.lowerFn(x) },
    ];
  }

  if (mode === "param_k") {
    const sub = subs.paramKSubModel;
    const showExp = sub !== "log_kx_origin";
    const showLog = sub !== "exp_kx_origin";
    const points: TangentScalingKeyPoint[] = [{ x: 0, y: 0 }];
    // 临界切点 A(1,e) / B(e,1)
    if (showExp) points.push({ x: 1, y: Math.E });
    if (showLog) points.push({ x: Math.E, y: 1 });
    // 检验探针：动直线上的交点与目标曲线上的读数点
    const x = params.evalX;
    const bounded = checkParamKBounding(params.k, x, sub);
    points.push({ x, y: params.k * x });
    if (showExp) points.push({ x, y: bounded.upperFuncVal });
    if (showLog) points.push({ x, y: bounded.lowerFuncVal });
    return points;
  }

  // mode === "secant"
  const model = SECANT_CURVE_MODELS[subs.secantSubModel];
  if (model.tangentFuncType === null) {
    // 二阶多项式卡位：展开原点 + 观察点处三层交点
    const x = params.evalX;
    return [
      { x: 0, y: 0 },
      { x, y: model.upperFn!(x) },
      { x, y: model.lowerFn!(x) },
      { x, y: model.mainFn(x) },
    ];
  }
  const a = params.intervalA;
  const b = params.intervalB;
  const midX = (a + b) / 2;
  // 割线两端点 A / B 与中点切点 M
  return [
    { x: a, y: model.mainFn(a) },
    { x: b, y: model.mainFn(b) },
    { x: midX, y: model.mainFn(midX) },
  ];
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
