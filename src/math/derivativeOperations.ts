/**
 * 导数四则运算法则领域模型（纯数学层）
 * 遵循系统公理 1：纯函数、零副作用、无 DOM/React 依赖
 */

import { formatMathNumber } from "@/utils/mathFormat";

export type OperationType =
  | "add" // 和法则 [f + g]' = f' + g'
  | "subtract" // 差法则 [f - g]' = f' - g'
  | "multiply" // 积法则 [fg]' = f'g + fg'
  | "divide"; // 商法则 [f/g]' = (f'g - fg') / g^2

export interface DerivativeOperationResult {
  opType: OperationType;
  x0: number;
  // f 与 g 在 x0 处的函数值与导数值
  fx: number;
  fpx: number;
  gx: number;
  gpx: number;
  // 运算后的函数值与导数值
  combinedY: number;
  combinedSlope: number;
  // 积法则面积分解项 (u Δv, v Δu, Δu Δv)
  rectU: number;
  rectV: number;
  deltaU: number;
  deltaV: number;
  areaMain1: number; // u * Δv
  areaMain2: number; // v * Δu
  areaHigher: number; // Δu * Δv (高阶微元)
  // 公式文本
  fExpr: string;
  gExpr: string;
  combinedExpr: string;
  ruleLatex: string;
  stepCalculationLatex: string;
  isValid: boolean;
  warning?: string;
}

export function calculateDerivativeOperation(
  opType: OperationType,
  x0: number,
  deltaX: number = 0.2,
  modelPair: "poly_trig" | "poly_exp" | "trig_poly" = "poly_trig",
): DerivativeOperationResult {
  // 定义 f(x) 与 g(x)
  let fx = 0;
  let fpx = 0;
  let gx = 0;
  let gpx = 0;
  let fExpr = "";
  let gExpr = "";

  let fxPlus = 0;
  let gxPlus = 0;

  const dx = Math.abs(deltaX) < 1e-4 ? 1e-4 : deltaX;

  switch (modelPair) {
    case "poly_exp": {
      // f(x) = x^2, g(x) = e^x
      fx = x0 * x0;
      fpx = 2 * x0;
      gx = Math.exp(x0);
      gpx = Math.exp(x0);
      fxPlus = (x0 + dx) * (x0 + dx);
      gxPlus = Math.exp(x0 + dx);
      fExpr = "f(x) = x^2";
      gExpr = "g(x) = e^x";
      break;
    }
    case "trig_poly": {
      // f(x) = sin x, g(x) = x
      fx = Math.sin(x0);
      fpx = Math.cos(x0);
      gx = x0;
      gpx = 1;
      fxPlus = Math.sin(x0 + dx);
      gxPlus = x0 + dx;
      fExpr = "f(x) = \\sin x";
      gExpr = "g(x) = x";
      break;
    }
    case "poly_trig":
    default: {
      // f(x) = x, g(x) = sin x
      fx = x0;
      fpx = 1;
      gx = Math.sin(x0);
      gpx = Math.cos(x0);
      fxPlus = x0 + dx;
      gxPlus = Math.sin(x0 + dx);
      fExpr = "f(x) = x";
      gExpr = "g(x) = \\sin x";
      break;
    }
  }

  let combinedY = 0;
  let combinedSlope = 0;
  let combinedExpr = "";
  let ruleLatex = "";
  let stepCalculationLatex = "";
  let isValid = true;
  let warning: string | undefined;

  switch (opType) {
    case "add": {
      combinedY = fx + gx;
      combinedSlope = fpx + gpx;
      combinedExpr = "H(x) = f(x) + g(x)";
      ruleLatex = "[f(x) + g(x)]' = f'(x) + g'(x)";
      stepCalculationLatex = `H'(${formatMathNumber(x0)}) = ${formatMathNumber(fpx)} + ${formatMathNumber(gpx)} = ${formatMathNumber(combinedSlope)}`;
      break;
    }
    case "subtract": {
      combinedY = fx - gx;
      combinedSlope = fpx - gpx;
      combinedExpr = "H(x) = f(x) - g(x)";
      ruleLatex = "[f(x) - g(x)]' = f'(x) - g'(x)";
      stepCalculationLatex = `H'(${formatMathNumber(x0)}) = ${formatMathNumber(fpx)} - (${formatMathNumber(gpx)}) = ${formatMathNumber(combinedSlope)}`;
      break;
    }
    case "multiply": {
      combinedY = fx * gx;
      combinedSlope = fpx * gx + fx * gpx;
      combinedExpr = "H(x) = f(x) \\cdot g(x)";
      ruleLatex = "[f(x)g(x)]' = f'(x)g(x) + f(x)g'(x)";
      stepCalculationLatex = `H'(${formatMathNumber(x0)}) = (${formatMathNumber(fpx)})(${formatMathNumber(gx)}) + (${formatMathNumber(fx)})(${formatMathNumber(gpx)}) = ${formatMathNumber(combinedSlope)}`;
      break;
    }
    case "divide": {
      if (Math.abs(gx) < 1e-4) {
        isValid = false;
        warning = "分母 g(x) = 0，商函数无定义";
        combinedY = NaN;
        combinedSlope = NaN;
        // 不生成含 NaN 的算式串：交给视图层渲染"无定义"，避免 $y - NaN = NaN(x - 0)$ 这类字面量外泄
        stepCalculationLatex =
          "\\text{分母 } g(x_0) = 0 \\text{，商函数在该点无定义}";
      } else {
        combinedY = fx / gx;
        combinedSlope = (fpx * gx - fx * gpx) / (gx * gx);
        stepCalculationLatex = `H'(${formatMathNumber(x0)}) = \\frac{(${formatMathNumber(fpx)})(${formatMathNumber(gx)}) - (${formatMathNumber(fx)})(${formatMathNumber(gpx)})}{(${formatMathNumber(gx)})^2} = ${formatMathNumber(combinedSlope)}`;
      }
      combinedExpr = "H(x) = \\frac{f(x)}{g(x)}";
      ruleLatex =
        "\\left[\\frac{f(x)}{g(x)}\\right]' = \\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2}";
      break;
    }
  }

  // 积法则几何面积分解
  const rectU = fx;
  const rectV = gx;
  const deltaU = fxPlus - fx;
  const deltaV = gxPlus - gx;
  const areaMain1 = rectU * deltaV;
  const areaMain2 = rectV * deltaU;
  const areaHigher = deltaU * deltaV;

  return {
    opType,
    x0,
    fx,
    fpx,
    gx,
    gpx,
    combinedY,
    combinedSlope,
    rectU,
    rectV,
    deltaU,
    deltaV,
    areaMain1,
    areaMain2,
    areaHigher,
    fExpr,
    gExpr,
    combinedExpr,
    ruleLatex,
    stepCalculationLatex,
    isValid,
    warning,
  };
}
