import type { MathPanelData } from "../types";
import {
  solveDerivative,
  PRESET_FUNCTIONS,
  type PresetFunctionKey,
} from "@/math/derivative";
import { MATH_COLORS } from "@/theme";

export function buildDerivativePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const x0 = params.x0 ?? 1;
  const dx = params.dx ?? 1;
  const fnKey = ((config?.fnKey as string) || "cubic") as PresetFunctionKey;
  const preset = PRESET_FUNCTIONS[fnKey] || PRESET_FUNCTIONS.cubic;
  const res = solveDerivative(preset.fn, x0);

  const x2 = x0 + dx;
  let fy2 = NaN;
  try {
    fy2 = preset.fn(x2);
  } catch {
    fy2 = NaN;
  }
  const kSecant =
    Number.isFinite(fy2) && Number.isFinite(res.fx) ? (fy2 - res.fx) / dx : NaN;

  const quantities: MathPanelData["quantities"] = [
    {
      label: "切点横坐标",
      symbol: "x₀",
      value: x0.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "函数值",
      symbol: "f(x₀)",
      value: Number.isFinite(res.fx) ? res.fx.toFixed(3) : "无定义",
      color: MATH_COLORS.labelText,
    },
    {
      label: "割线步长",
      symbol: "Δx",
      value: dx.toFixed(2),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "割线斜率",
      symbol: "k_割",
      value: Number.isFinite(kSecant) ? kSecant.toFixed(3) : "不存在",
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "切线斜率 (导数)",
      symbol: "f'(x₀)",
      value: Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "不存在",
      color: MATH_COLORS.tangentLine,
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "割线斜率 (平均变化率)",
      latex: `k_{\\text{割}} = \\frac{f(\\color{#EF4444}{x_0} + \\color{#D97706}{\\Delta x}) - f(\\color{#EF4444}{x_0})}{\\color{#D97706}{\\Delta x}}`,
      level: "important",
      prerequisites: ["x₀ 与 x₀ + Δx 在函数定义域内"],
    },
    {
      name: "导数的几何意义",
      latex:
        "f'(\\color{#EF4444}{x_0}) = \\lim_{\\color{#D97706}{\\Delta x} \\to 0} \\frac{f(\\color{#EF4444}{x_0} + \\color{#D97706}{\\Delta x}) - f(\\color{#EF4444}{x_0})}{\\color{#D97706}{\\Delta x}}",
      level: "core",
      prerequisites: ["f(x) 在 x₀ 的某邻域内有定义", "极限存在"],
    },
    {
      name: "切线方程标准式",
      latex: res.isValid
        ? `y - ${res.fx.toFixed(2)} = \\color{#2563EB}{${res.slope.toFixed(2)}}(x - \\color{#EF4444}{${x0.toFixed(2)}})`
        : "y - f(\\color{#EF4444}{x_0}) = f'(\\color{#EF4444}{x_0})(x - \\color{#EF4444}{x_0})",
      level: "important",
      prerequisites: ["f'(x₀) 存在"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【新高考通法·求切线方程 4 步法】①确定切点坐标 (x₀, f(x₀))；②求导函数 f'(x)；③计算切线斜率 k = f'(x₀)；④写出点斜式方程 y - f(x₀) = k(x - x₀)。",
      importance: "gaokao",
    },
    {
      text: "几何意义：函数 y=f(x) 在 x₀ 处的导数 f'(x₀) 就是曲线在该点切线的斜率 k。",
      importance: "gaokao",
    },
    {
      text: "割线斜率的极限：割线斜率随着 Δx 趋于 0 的极限即为切线斜率，体现了“以直代曲”的微积分核心思想。",
      importance: "core",
    },
    {
      text: "高考避坑陷阱：注意“在点 P 处的切线”（P 必为切点）与“过点 P 的切线”（P 不一定是切点，需设切点 Q(t, f(t)) 求解）的区别。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (!res.isValid) {
    warnings.push({
      text:
        res.degenerateType === "undefined"
          ? `函数在 x₀ = ${x0} 处无定义，无法求导。`
          : `函数在 x₀ = ${x0} 处不可导（可能存在尖点、间断点或切线垂直）。`,
      level: "danger",
    });
  } else if (!Number.isFinite(fy2)) {
    warnings.push({
      text: `割线终点 x₀ + Δx = ${x2.toFixed(2)} 超出函数定义域，割线无法绘制。`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "导数即斜率，切线看斜率；割线逼近切，极限是关键。",
  };
}
