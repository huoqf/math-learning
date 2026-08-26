/**
 * 函数图象变换纯数学计算库
 * 零 React/DOM/window 依赖，符合数学层纯净规则
 */

export type BaseFnType = "quadratic" | "sine" | "cubic" | "exp";
export type FoldMode = "none" | "global" | "input";

export interface TransformParams {
  h: number; // 左右平移 x - h (h > 0 右移, h < 0 左移)
  k: number; // 上下平移 + k (k > 0 上移, k < 0 下移)
  A: number; // 纵向伸缩/翻转 A * f(...) (|A| > 1 拉伸, A < 0 沿 x 轴翻转)
  omega: number; // 横向伸缩 f(omega * x) (omega > 1 压缩至 1/omega)
  foldMode: FoldMode; // 翻折模式: none | global(|f(x)|) | input(f(|x|))
}

export interface Point2D {
  x: number;
  y: number;
}

export interface KeyPointPair {
  name: string;
  original: Point2D;
  transformed: Point2D;
  description: string;
}

export interface TransformResult {
  fnType: BaseFnType;
  params: TransformParams;
  baseFn: (x: number) => number;
  transformedFn: (x: number) => number;
  // 特征点在原函数与变换后函数的对应轨迹
  keyPoints: KeyPointPair[];
  // 对称性与特征几何量
  symmetryInfo: {
    type: "axis" | "center" | "even" | "none";
    description: string;
    axisX?: number;
    center?: Point2D;
  };
  // 变换路线解析 (新高考经典考点: 先平移后伸缩 vs 先伸缩后平移)
  routes: {
    shiftFirst: string;
    scaleFirst: string;
  };
  // 标准消元后的纯正 LaTeX 解析式
  formattedLatex: string;
  description: string;
  isDegenerate: boolean;
  warningMessage?: string;
}

/**
 * 计算基准函数值 f(x)
 */
export function evalBaseFunction(fnType: BaseFnType, x: number): number {
  switch (fnType) {
    case "quadratic":
      return x * x;
    case "sine":
      return Math.sin(x);
    case "cubic":
      return x * x * x;
    case "exp":
      return Math.pow(2, x);
    default:
      return x;
  }
}

/**
 * 计算变换后函数值 y = T[f](x)
 */
export function evalTransformedFunction(
  fnType: BaseFnType,
  params: TransformParams,
  x: number,
): number {
  const { h, k, A, omega, foldMode } = params;

  // 自变量翻折 |x|: y = f(|x|)
  const effectiveX = foldMode === "input" ? Math.abs(x) : x;

  // 横向伸缩与平移 omega * (x - h)
  const innerArg = omega * (effectiveX - h);

  // 计算原函数值
  const rawY = evalBaseFunction(fnType, innerArg);

  // 纵向伸缩与平移
  let y = A * rawY + k;

  // 全局绝对值翻折 |y|: y = |f(x)|
  if (foldMode === "global") {
    y = Math.abs(y);
  }

  return y;
}

export interface FormatLatexOptions {
  colorPrimary?: string;
  colorSecondary?: string;
}

/**
 * 构建严格代数消元与色彩绑定的 LaTeX 解析式
 */
export function buildTransformLatex(
  fnType: BaseFnType,
  params: TransformParams,
  options?: FormatLatexOptions,
): string {
  const { h, k, A, omega, foldMode } = params;
  const colP = options?.colorPrimary;
  const colS = options?.colorSecondary;

  const wrapP = (val: string | number) =>
    colP ? `\\color{${colP}}{${val}}` : `${val}`;
  const wrapS = (val: string | number) =>
    colS ? `\\color{${colS}}{${val}}` : `${val}`;

  if (A === 0) {
    const kVal = k.toFixed(1);
    const kFormatted = kVal.endsWith(".0") ? Number(kVal).toFixed(0) : kVal;
    if (foldMode === "global") {
      return `y = |${wrapS(kFormatted)}| = ${Math.abs(k).toFixed(1)}`;
    }
    return `y = ${wrapS(kFormatted)}`;
  }

  // 1. 自变量与水平平移项
  const xSymbol = foldMode === "input" ? "|x|" : "x";
  let shiftTerm = xSymbol;
  if (Math.abs(h) > 1e-4) {
    const hAbs = Math.abs(h);
    const hStr = Number.isInteger(hAbs) ? hAbs.toString() : hAbs.toFixed(1);
    shiftTerm =
      h > 0 ? `${xSymbol} - ${wrapP(hStr)}` : `${xSymbol} + ${wrapP(hStr)}`;
  }

  // 2. 横向伸缩项
  let argStr = shiftTerm;
  if (Math.abs(omega - 1.0) > 1e-4) {
    const wStr = Number.isInteger(omega) ? omega.toString() : omega.toFixed(1);
    if (Math.abs(h) < 1e-4) {
      argStr = `${wrapS(wStr)}${shiftTerm}`;
    } else {
      argStr = `${wrapS(wStr)}(${shiftTerm})`;
    }
  }

  // 3. 基准函数骨架
  let baseStr = "";
  const isSimpleArg = argStr === "x" || argStr === "|x|";
  switch (fnType) {
    case "quadratic":
      baseStr = isSimpleArg ? `${argStr}^2` : `(${argStr})^2`;
      break;
    case "sine":
      baseStr = `\\sin(${argStr})`;
      break;
    case "cubic":
      baseStr = isSimpleArg ? `${argStr}^3` : `(${argStr})^3`;
      break;
    case "exp":
      baseStr = `2^{${argStr}}`;
      break;
  }

  // 4. 纵向伸缩系数 A
  let aPrefix = "";
  if (Math.abs(A - 1.0) < 1e-4) {
    aPrefix = "";
  } else if (Math.abs(A - -1.0) < 1e-4) {
    aPrefix = "-";
  } else {
    const aAbs = Math.abs(A);
    const aStr = Number.isInteger(aAbs) ? aAbs.toString() : aAbs.toFixed(1);
    const formattedA = A < 0 ? `-${wrapP(aStr)}` : wrapP(aStr);
    aPrefix = `${formattedA} \\cdot `;
  }

  // 5. 竖直平移项 + k
  let kSuffix = "";
  if (Math.abs(k) > 1e-4) {
    const kAbs = Math.abs(k);
    const kStr = Number.isInteger(kAbs) ? kAbs.toString() : kAbs.toFixed(1);
    kSuffix = k > 0 ? ` + ${wrapS(kStr)}` : ` - ${wrapS(kStr)}`;
  }

  const coreLatex = `${aPrefix}${baseStr}${kSuffix}`;

  if (foldMode === "global") {
    return `y = \\left| ${coreLatex} \\right|`;
  }
  return `y = ${coreLatex}`;
}

/**
 * 求解变换的几何特征与数据
 */
export function calculateTransform(
  fnType: BaseFnType,
  params: TransformParams,
  options?: FormatLatexOptions,
): TransformResult {
  const { h, k, A, omega, foldMode } = params;

  const isDegenerate = A === 0 || omega === 0;
  let warningMessage: string | undefined;

  if (A === 0) {
    warningMessage =
      "纵向伸缩系数 A = 0，函数退化为常数直线 y = k，失去原函数形态！";
  } else if (omega === 0) {
    warningMessage =
      "横向伸缩系数 ω = 0，自变量缩退为常数，函数失去波动与变化！";
  }

  const baseFn = (x: number) => evalBaseFunction(fnType, x);
  const transformedFn = (x: number) =>
    evalTransformedFunction(fnType, params, x);

  // 选定基准函数的典型特征点
  let origKeyPoints: { name: string; x: number }[] = [];
  switch (fnType) {
    case "quadratic":
      origKeyPoints = [
        { name: "O", x: 0 },
        { name: "P_1", x: 1 },
        { name: "P_2", x: -1 },
      ];
      break;
    case "sine":
      origKeyPoints = [
        { name: "O", x: 0 },
        { name: "M", x: Math.PI / 2 },
        { name: "N", x: Math.PI },
      ];
      break;
    case "cubic":
      origKeyPoints = [
        { name: "O", x: 0 },
        { name: "P_1", x: 1 },
      ];
      break;
    case "exp":
      origKeyPoints = [
        { name: "P_0", x: 0 },
        { name: "P_1", x: 1 },
      ];
      break;
  }

  const keyPoints: KeyPointPair[] = origKeyPoints.map((item) => {
    const xOrig = item.x;
    const yOrig = baseFn(xOrig);
    // 反解在变换后函数中的对应点：xTransformed = xOrig / omega + h
    const xTransformed = omega !== 0 ? xOrig / omega + h : h;
    const yTransformed = transformedFn(xTransformed);
    return {
      name: item.name,
      original: { x: xOrig, y: yOrig },
      transformed: { x: xTransformed, y: yTransformed },
      description: `(${xOrig.toFixed(2)}, ${yOrig.toFixed(2)}) → (${xTransformed.toFixed(2)}, ${yTransformed.toFixed(2)})`,
    };
  });

  // 对称性分析
  let symmetryInfo: TransformResult["symmetryInfo"] = {
    type: "none",
    description: "无对称性",
  };

  if (foldMode === "input") {
    symmetryInfo = {
      type: "even",
      description: "恒为偶函数，图象关于 y 轴 (x = 0) 轴对称",
      axisX: 0,
    };
  } else if (fnType === "quadratic" && foldMode === "none") {
    symmetryInfo = {
      type: "axis",
      description: `对称轴方程 x = ${h.toFixed(1)}`,
      axisX: h,
    };
  } else if (fnType === "cubic" && foldMode === "none") {
    symmetryInfo = {
      type: "center",
      description: `对称中心 (${h.toFixed(1)}, ${k.toFixed(1)})`,
      center: { x: h, y: k },
    };
  } else if (fnType === "sine" && foldMode === "none") {
    symmetryInfo = {
      type: "center",
      description: `对称中心 (${h.toFixed(1)}, ${k.toFixed(1)})`,
      center: { x: h, y: k },
    };
  }

  // 两种平移伸缩顺序解析
  const phiEquivalent = -omega * h;
  const phiSign = phiEquivalent >= 0 ? "+" : "-";
  const phiAbs = Math.abs(phiEquivalent).toFixed(2);
  const shiftSign = h >= 0 ? "右移" : "左移";
  const shiftAbs = Math.abs(h).toFixed(2);

  const routes = {
    // 路线 1: 先平移后伸缩: f(x) -> f(x - h) -> f(omega(x - h))
    shiftFirst: `f(x) \\xrightarrow{${shiftSign} \\, ${shiftAbs}} f(x ${h >= 0 ? "-" : "+"} ${shiftAbs}) \\xrightarrow{x \\to ${omega.toFixed(1)}x} f(${omega.toFixed(1)}(x ${h >= 0 ? "-" : "+"} ${shiftAbs}))`,
    // 路线 2: 先伸缩后平移: f(x) -> f(omega x) -> f(omega(x - h)) = f(omega x + phi)
    scaleFirst: `f(x) \\xrightarrow{x \\to ${omega.toFixed(1)}x} f(${omega.toFixed(1)}x) \\xrightarrow{${shiftSign} \\, ${shiftAbs}} f(${omega.toFixed(1)}x ${phiSign} ${phiAbs})`,
  };

  const formattedLatex = buildTransformLatex(fnType, params, options);

  // 构造简明几何演化描述
  const hDesc =
    h > 0
      ? `右移 ${h.toFixed(1)}`
      : h < 0
        ? `左移 ${Math.abs(h).toFixed(1)}`
        : "";
  const kDesc =
    k > 0
      ? `上移 ${k.toFixed(1)}`
      : k < 0
        ? `下移 ${Math.abs(k).toFixed(1)}`
        : "";
  const aDesc =
    A === 1
      ? ""
      : A === -1
        ? "x轴翻转"
        : A < 0
          ? `x轴翻转且纵伸 ${Math.abs(A).toFixed(1)}倍`
          : `纵伸 ${A.toFixed(1)}倍`;
  const wDesc =
    omega === 1
      ? ""
      : omega > 1
        ? `横缩至 ${(1 / omega).toFixed(2)}倍`
        : `横伸至 ${(1 / omega).toFixed(2)}倍`;
  const foldDesc =
    foldMode === "global"
      ? "整体绝对值翻折"
      : foldMode === "input"
        ? "自变量绝对值翻折"
        : "";

  const description =
    [hDesc, kDesc, aDesc, wDesc, foldDesc].filter(Boolean).join("，") ||
    "基准未变换";

  return {
    fnType,
    params,
    baseFn,
    transformedFn,
    keyPoints,
    symmetryInfo,
    routes,
    formattedLatex,
    description,
    isDegenerate,
    warningMessage,
  };
}
