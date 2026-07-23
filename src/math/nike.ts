export interface CriticalPoint {
  x: number;
  y: number;
  type: "min" | "max";
  label: string;
}

export interface NikeResult {
  a: number;
  b: number;
  h: number;
  c: number;
  curveType: "nike" | "streamer" | "inverse_prop" | "proportional" | "constant";
  symmetryCenter: { x: number; y: number };
  verticalAsymptoteX: number;
  obliqueAsymptoteSlope: number;
  obliqueAsymptoteIntercept: number;
  criticalPoints: CriticalPoint[];
  amgmMinPoint: { x: number; y: number; val1: number; val2: number } | null;
  isValid: boolean;
  isDegenerate: boolean;
  degenerationType: "a_zero" | "b_zero" | "both_zero" | "none";
  monotonicityDescription: string;
  parityDescription: string;
}

/**
 * 对勾函数 / 广义双曲型函数求解器
 * 标准型：y = a*x + b/x (h=0, c=0)
 * 平移型：y = a*(x-h) + c + b/(x-h)
 */
export function solveNike(
  a: number,
  b: number,
  h: number = 0,
  c: number = 0,
): NikeResult {
  const isAZero = Math.abs(a) < 1e-9;
  const isBZero = Math.abs(b) < 1e-9;

  const symmetryCenter = { x: h, y: c };
  const verticalAsymptoteX = h;
  const obliqueAsymptoteSlope = a;
  const obliqueAsymptoteIntercept = c - a * h;

  if (isAZero && isBZero) {
    return {
      a,
      b,
      h,
      c,
      curveType: "constant",
      symmetryCenter,
      verticalAsymptoteX,
      obliqueAsymptoteSlope: 0,
      obliqueAsymptoteIntercept: c,
      criticalPoints: [],
      amgmMinPoint: null,
      isValid: false,
      isDegenerate: true,
      degenerationType: "both_zero",
      monotonicityDescription: "常数函数 y = c，全域单调递增/递减均不成立",
      parityDescription:
        h === 0
          ? c === 0
            ? "既是偶函数又是奇函数"
            : "偶函数"
          : "非奇非偶函数",
    };
  }

  if (isAZero) {
    return {
      a,
      b,
      h,
      c,
      curveType: "inverse_prop",
      symmetryCenter,
      verticalAsymptoteX,
      obliqueAsymptoteSlope: 0,
      obliqueAsymptoteIntercept: c,
      criticalPoints: [],
      amgmMinPoint: null,
      isValid: false,
      isDegenerate: true,
      degenerationType: "a_zero",
      monotonicityDescription:
        b > 0
          ? `在 (-∞, ${h}) 和 (${h}, +∞) 上分别单调递减`
          : `在 (-∞, ${h}) 和 (${h}, +∞) 上分别单调递增`,
      parityDescription:
        h === 0 && c === 0
          ? "奇函数（关于原点对称）"
          : `关于点 (${h}, ${c}) 中心对称`,
    };
  }

  if (isBZero) {
    return {
      a,
      b,
      h,
      c,
      curveType: "proportional",
      symmetryCenter,
      verticalAsymptoteX,
      obliqueAsymptoteSlope: a,
      obliqueAsymptoteIntercept: c - a * h,
      criticalPoints: [],
      amgmMinPoint: null,
      isValid: false,
      isDegenerate: true,
      degenerationType: "b_zero",
      monotonicityDescription: a > 0 ? "在 R 上单调递增" : "在 R 上单调递减",
      parityDescription:
        h === 0 && c === 0
          ? "奇函数（关于原点对称）"
          : `关于点 (${h}, ${c}) 中心对称`,
    };
  }

  // a ≠ 0 && b ≠ 0
  const ab = a * b;
  const isNike = ab > 0;
  const curveType = isNike ? "nike" : "streamer";

  const criticalPoints: CriticalPoint[] = [];
  let amgmMinPoint: {
    x: number;
    y: number;
    val1: number;
    val2: number;
  } | null = null;

  if (isNike) {
    const deltaX = Math.sqrt(b / a);
    const rightX = h + deltaX;
    const leftX = h - deltaX;
    const extValRight = c + 2 * Math.sqrt(ab) * (a > 0 ? 1 : -1);
    const extValLeft = c - 2 * Math.sqrt(ab) * (a > 0 ? 1 : -1);

    if (a > 0 && b > 0) {
      // a > 0, b > 0
      criticalPoints.push({
        x: rightX,
        y: extValRight,
        type: "min",
        label: `极小值点 (${rightX.toFixed(2)}, ${extValRight.toFixed(2)})`,
      });
      criticalPoints.push({
        x: leftX,
        y: extValLeft,
        type: "max",
        label: `极大值点 (${leftX.toFixed(2)}, ${extValLeft.toFixed(2)})`,
      });
      amgmMinPoint = {
        x: rightX,
        y: extValRight,
        val1: Math.sqrt(ab),
        val2: Math.sqrt(ab),
      };
    } else {
      // a < 0, b < 0
      criticalPoints.push({
        x: rightX,
        y: extValRight,
        type: "max",
        label: `极大值点 (${rightX.toFixed(2)}, ${extValRight.toFixed(2)})`,
      });
      criticalPoints.push({
        x: leftX,
        y: extValLeft,
        type: "min",
        label: `极小值点 (${leftX.toFixed(2)}, ${extValLeft.toFixed(2)})`,
      });
    }
  }

  let monotonicityDescription = "";
  if (isNike) {
    const rXStr = (h + Math.sqrt(b / a)).toFixed(2);
    const lXStr = (h - Math.sqrt(b / a)).toFixed(2);
    if (a > 0) {
      monotonicityDescription = `在 (-∞, ${lXStr}] 和 [${rXStr}, +∞) 单调递增；在 [${lXStr}, ${h}) 和 (${h}, ${rXStr}] 单调递减`;
    } else {
      monotonicityDescription = `在 (-∞, ${lXStr}] 和 [${rXStr}, +∞) 单调递减；在 [${lXStr}, ${h}) 和 (${h}, ${rXStr}] 单调递增`;
    }
  } else {
    // 飘带双曲线 (ab < 0)
    if (a > 0) {
      monotonicityDescription = `在 (-∞, ${h}) 和 (${h}, +∞) 上均为单调递增，全域无极值点`;
    } else {
      monotonicityDescription = `在 (-∞, ${h}) 和 (${h}, +∞) 上均为单调递减，全域无极值点`;
    }
  }

  const parityDescription =
    h === 0 && c === 0
      ? "奇函数（图像关于原点 (0,0) 成中心对称）"
      : `非奇非偶函数（图像关于中心点 (${h}, ${c}) 成中心对称）`;

  return {
    a,
    b,
    h,
    c,
    curveType,
    symmetryCenter,
    verticalAsymptoteX,
    obliqueAsymptoteSlope,
    obliqueAsymptoteIntercept,
    criticalPoints,
    amgmMinPoint,
    isValid: true,
    isDegenerate: false,
    degenerationType: "none",
    monotonicityDescription,
    parityDescription,
  };
}

/**
 * 计算点 x0 处的函数值、导数（斜率）及切线方程
 */
export function evalNikeAt(
  a: number,
  b: number,
  h: number = 0,
  c: number = 0,
  x0: number,
) {
  const dx = x0 - h;
  if (Math.abs(dx) < 1e-6) {
    return {
      isValid: false,
      y: NaN,
      derivative: NaN,
      intercept: NaN,
      tangentEquation: "切线不存在 (无意义点)",
    };
  }
  const y = a * dx + c + b / dx;
  const derivative = a - b / (dx * dx);
  const intercept = y - derivative * x0;
  const tangentEquation = `y = ${derivative.toFixed(2)}x ${intercept >= 0 ? "+" : "-"} ${Math.abs(intercept).toFixed(2)}`;

  return {
    isValid: true,
    y,
    derivative,
    intercept,
    tangentEquation,
  };
}
