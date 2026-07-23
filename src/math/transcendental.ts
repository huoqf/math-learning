/**
 * 基准超越函数与切线放缩模型数学计算库
 * 纯函数实现，零 DOM / React / Store 依赖
 */

export type TranscendentalMode = "exp" | "log" | "chain" | "param";
export type ExpSubMode = "tangent_0" | "tangent_1" | "shift_1";
export type LogSubMode = "tangent_1" | "tangent_e" | "quadratic_bound";
export type ParamSubMode = "exp_ax_1" | "exp_ax";

export interface TangentLineResult {
  x0: number;
  y0: number;
  slope: number;
  intercept: number;
  latexEquation: string;
  isValid: boolean;
  degenerateReason?: string;
}

export interface TangentDiffSample {
  x: number;
  yFunc: number;
  yLine: number;
  diff: number; // yFunc - yLine or yLine - yFunc
}

/**
 * 求解指数函数 f(x) = e^x 在 x0 处的切线
 */
export function solveExpTangent(x0: number): TangentLineResult {
  if (!Number.isFinite(x0)) {
    return {
      x0: 0,
      y0: 1,
      slope: 1,
      intercept: 1,
      latexEquation: "y = x + 1",
      isValid: false,
      degenerateReason: "切点横坐标无效",
    };
  }

  const y0 = Math.exp(x0);
  const slope = y0; // d/dx (e^x) = e^x
  const intercept = y0 * (1 - x0); // y - y0 = slope * (x - x0) => y = slope * x + y0 - slope * x0

  const slopeStr = slope.toFixed(2);
  const interceptSign = intercept >= 0 ? "+" : "-";
  const interceptStr = Math.abs(intercept).toFixed(2);

  return {
    x0,
    y0,
    slope,
    intercept,
    latexEquation: `y = ${slopeStr}x ${interceptSign} ${interceptStr}`,
    isValid: true,
  };
}

/**
 * 求解对数函数 g(x) = ln(x) 在 x0 处的切线
 */
export function solveLogTangent(x0: number): TangentLineResult {
  if (!Number.isFinite(x0) || x0 <= 0) {
    return {
      x0: Math.max(0.1, x0),
      y0: NaN,
      slope: NaN,
      intercept: NaN,
      latexEquation: "y = x - 1",
      isValid: false,
      degenerateReason: "对数函数定义域必须为 x > 0",
    };
  }

  const y0 = Math.log(x0);
  const slope = 1 / x0;
  const intercept = y0 - 1; // y = (1/x0)x + ln(x0) - 1

  const slopeStr = slope.toFixed(2);
  const interceptSign = intercept >= 0 ? "+" : "-";
  const interceptStr = Math.abs(intercept).toFixed(2);

  return {
    x0,
    y0,
    slope,
    intercept,
    latexEquation: `y = ${slopeStr}x ${interceptSign} ${interceptStr}`,
    isValid: true,
  };
}

/**
 * 计算 e^x >= ax + 1 模型在参数 a 下的临界与交点关系
 */
export function solveParamExpAx1(a: number): {
  a: number;
  criticalA: number;
  status: "tangent" | "intersect" | "above";
  intersections: number;
  description: string;
} {
  const criticalA = 1.0;
  const eps = 1e-4;

  if (Math.abs(a - criticalA) < eps) {
    return {
      a,
      criticalA,
      status: "tangent",
      intersections: 1,
      description:
        "a = 1 时，y = x + 1 恰为 e^x 在 (0, 1) 处的基准切线，全定义域 e^x ≥ x + 1 成立。",
    };
  } else if (a > criticalA) {
    return {
      a,
      criticalA,
      status: "intersect",
      intersections: 2,
      description:
        "a > 1 时，直线斜率过大，与 e^x 曲线在 x < 0 区间产生第二个交点，部分区域 e^x < ax + 1，不恒成立。",
    };
  } else {
    return {
      a,
      criticalA,
      status: "above",
      intersections: 1,
      description:
        "a < 1 时，直线在 e^x 下方，e^x ≥ ax + 1 依然恒成立（放缩变宽松）。",
    };
  }
}

/**
 * 计算 e^x >= ax 过原点直线模型在参数 a 下的临界与交点关系
 */
export function solveParamExpAx(a: number): {
  a: number;
  criticalA: number;
  tangentX: number;
  status: "tangent" | "intersect" | "separated";
  intersections: number;
  description: string;
} {
  const criticalA = Math.E; // e ≈ 2.71828
  const eps = 1e-3;

  if (Math.abs(a - criticalA) < eps) {
    return {
      a,
      criticalA,
      tangentX: 1.0,
      status: "tangent",
      intersections: 1,
      description:
        "a = e 时，y = ex 恰为 e^x 在切点 (1, e) 处过原点的切线，e^x ≥ ex 恒成立。",
    };
  } else if (a > criticalA) {
    return {
      a,
      criticalA,
      tangentX: 1.0,
      status: "intersect",
      intersections: 2,
      description:
        "a > e 时，过原点的直线斜率过大，与 e^x 曲线交于两个点，e^x ≥ ax 不成立。",
    };
  } else {
    return {
      a,
      criticalA,
      tangentX: 1.0,
      status: "separated",
      intersections: 0,
      description: "a < e 时，直线位于 e^x 曲线下方无交点，e^x > ax 严格成立。",
    };
  }
}

/**
 * 采样放缩差值，用于渲染阴影与分析极值
 */
export function sampleTangentDiff(
  fn: (x: number) => number,
  lineFn: (x: number) => number,
  xMin: number,
  xMax: number,
  steps: number = 60,
): TangentDiffSample[] {
  const samples: TangentDiffSample[] = [];
  const step = (xMax - xMin) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * step;
    const yFunc = fn(x);
    const yLine = lineFn(x);

    if (Number.isFinite(yFunc) && Number.isFinite(yLine)) {
      samples.push({
        x,
        yFunc,
        yLine,
        diff: yFunc - yLine,
      });
    }
  }

  return samples;
}
