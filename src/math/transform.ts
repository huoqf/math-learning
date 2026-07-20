/**
 * 函数图象变换纯数学计算库
 * 零 React/DOM/window 依赖，符合数学层纯净规则
 */

export type BaseFnType = "quadratic" | "sine" | "cubic" | "exp";
export type FoldMode = "none" | "global" | "input";

export interface TransformParams {
  h: number; // 左右平移 x - h
  k: number; // 上下平移 + k
  A: number; // 纵向伸缩/翻转 A * f(...)
  omega: number; // 横向伸缩 f(omega * x)
  foldMode: FoldMode; // 翻折模式
}

export interface Point2D {
  x: number;
  y: number;
}

export interface TransformResult {
  fnType: BaseFnType;
  params: TransformParams;
  baseFn: (x: number) => number;
  transformedFn: (x: number) => number;
  // 特征点在原函数与变换后函数的对应轨迹
  keyPoints: {
    label: string;
    original: Point2D;
    transformed: Point2D;
  }[];
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

  // 自变量翻折 |x|
  const effectiveX = foldMode === "input" ? Math.abs(x) : x;

  // 横向伸缩与平移 omega * (x - h)
  const innerArg = omega * (effectiveX - h);

  // 计算原函数值
  const rawY = evalBaseFunction(fnType, innerArg);

  // 纵向伸缩与平移
  let y = A * rawY + k;

  // 全局绝对值翻折 |y|
  if (foldMode === "global") {
    y = Math.abs(y);
  }

  return y;
}

/**
 * 求解变换的几何特征与数据
 */
export function calculateTransform(
  fnType: BaseFnType,
  params: TransformParams,
): TransformResult {
  const { h, k, A, omega, foldMode } = params;

  const isDegenerate = A === 0 || omega === 0;
  let warningMessage: string | undefined;

  if (A === 0) {
    warningMessage = "纵向伸缩系数 A = 0，函数退化为常数直线 y = k！";
  } else if (omega === 0) {
    warningMessage =
      "频率/横向系数 ω = 0，自变量缩退为常数，失去函数图像变化！";
  }

  const baseFn = (x: number) => evalBaseFunction(fnType, x);
  const transformedFn = (x: number) =>
    evalTransformedFunction(fnType, params, x);

  // 选定典型基准特征点进行轨迹追踪
  const origKeyXList = fnType === "sine" ? [0, Math.PI / 2] : [0, 1];
  const keyPoints = origKeyXList.map((xOrig) => {
    const yOrig = baseFn(xOrig);
    // 反解在变换后函数中的对应点：xTransformed = xOrig / omega + h
    const xTransformed = omega !== 0 ? xOrig / omega + h : h;
    const yTransformed = transformedFn(xTransformed);
    return {
      label: `P(${xOrig.toFixed(1)}, ${yOrig.toFixed(1)})`,
      original: { x: xOrig, y: yOrig },
      transformed: { x: xTransformed, y: yTransformed },
    };
  });

  // 构造简明几何描述
  const hDesc =
    h > 0
      ? `向右平移 ${h.toFixed(1)}`
      : h < 0
        ? `向左平移 ${Math.abs(h).toFixed(1)}`
        : "未平移";
  const kDesc =
    k > 0
      ? `向上平移 ${k.toFixed(1)}`
      : k < 0
        ? `向下平移 ${Math.abs(k).toFixed(1)}`
        : "未平移";
  const aDesc = A !== 1 ? `纵向伸缩 ${A.toFixed(1)} 倍` : "";
  const wDesc = omega !== 1 ? `横向伸缩 ${omega.toFixed(1)} 倍` : "";
  const foldDesc =
    foldMode === "global"
      ? "保留 x 轴上方，下方翻折向上"
      : foldMode === "input"
        ? "保留 y 轴右侧，左侧按右侧对称"
        : "";

  const description = [hDesc, kDesc, aDesc, wDesc, foldDesc]
    .filter(Boolean)
    .join("；");

  return {
    fnType,
    params,
    baseFn,
    transformedFn,
    keyPoints,
    description,
    isDegenerate,
    warningMessage,
  };
}
