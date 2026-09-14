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

import { formatMathNumber } from "@/utils/mathFormat";

/**
 * 格式化直线方程 y = kx + b（符合高中数学代数规范，无 1.00x 机器尾零，系数为 1 省略）
 */
function formatLineEquation(slope: number, intercept: number): string {
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

  return {
    x0,
    y0,
    slope,
    intercept,
    latexEquation: formatLineEquation(slope, intercept),
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

  return {
    x0,
    y0,
    slope,
    intercept,
    latexEquation: formatLineEquation(slope, intercept),
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
        "a = 1 时，y = x + 1 恰为 e^x 在 (0, 1) 处的基准切线，全实数域 e^x ≥ x + 1 恒成立。",
    };
  } else if (a > criticalA) {
    return {
      a,
      criticalA,
      status: "intersect",
      intersections: 2,
      description:
        "a > 1 时，直线斜率过大，在 x > 0 区域割穿曲线产生 2 个交点，e^x ≥ ax + 1 不恒成立。",
    };
  } else {
    // a < 1 时，在 x >= 0 上 e^x >= ax + 1 恒成立；在 R 上当 0 < a < 1 时负半轴产生第 2 个交点
    const intersections = a > 0 ? 2 : 1;
    return {
      a,
      criticalA,
      status: "above",
      intersections,
      description:
        "a < 1 时，在非负区间 x ≥ 0 上 e^x ≥ ax + 1 恒成立；在全域 R 上仅 a = 1 时成立（a < 1 在负半轴存在局部穿插）。",
    };
  }
}

/**
 * 计算 e^x >= ax 过原点直线模型在参数 a 下的临界与交点关系（考察区间 x > 0）
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
        "a = e 时，y = ex 恰为 e^x 在切点 (1, e) 处过原点的切线，对一切 x > 0 恒有 e^x ≥ ex 成立。",
    };
  } else if (a > criticalA) {
    return {
      a,
      criticalA,
      tangentX: 1.0,
      status: "intersect",
      intersections: 2,
      description:
        "a > e 时，过原点的直线割穿曲线，在 x > 0 上产生 2 个交点，e^x ≥ ax 不成立。",
    };
  } else {
    return {
      a,
      criticalA,
      tangentX: 1.0,
      status: "separated",
      intersections: 0,
      description:
        "a < e 时，在正半轴 x > 0 上动直线位于曲线下方无交点，e^x > ax 严格恒成立。",
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
