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
      latex: `k_{\\text{割}} = \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}`,
      level: "important",
      prerequisites: ["x₀ 与 x₀ + Δx 在函数定义域内"],
    },
    {
      name: "导数的几何意义",
      latex:
        "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}",
      level: "core",
      prerequisites: ["f(x) 在 x₀ 的某邻域内有定义", "极限存在"],
    },
    {
      name: "切线方程",
      latex: res.isValid
        ? `y - ${res.fx.toFixed(2)} = ${res.slope.toFixed(2)}(x - ${x0.toFixed(2)})`
        : "y - f(x_0) = f'(x_0)(x - x_0)",
      level: "important",
      prerequisites: ["f'(x₀) 存在"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "几何意义：函数 y=f(x) 在 x₀ 处的导数 f'(x₀) 就是曲线在该点切线的斜率 k。",
      importance: "gaokao",
    },
    {
      text: "割线斜率的极限：割线斜率随着 Δx 趋于 0 的极限即为切线斜率，体现了\u201C以直代曲\u201D的微积分核心思想。",
      importance: "core",
    },
    {
      text: "高考易错点：注意\u201C在点 P 处的切线\u201D与\u201C过点 P 的切线\u201D的区别，前者 P 必为切点，后者 P 不一定是切点。",
      importance: "gaokao",
    },
    {
      text: "压轴模型：高考常利用 xlnx, (lnx)/x, xex 等高频模型的导数来研究函数的单调性与极值。",
      importance: "core",
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
