import type { MathPanelData } from "../types";
import {
  solveDerivative,
  PRESET_FUNCTIONS,
  buildPointSlopeLatex,
  buildSlopeInterceptLatex,
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
  const mode = (config?.mode as string) || "secant_limit";
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
    Number.isFinite(fy2) && Number.isFinite(res.fx) && Math.abs(dx) > 1e-9
      ? (fy2 - res.fx) / dx
      : NaN;

  // 使用动态 Token 色彩指令构建 LaTeX
  const primaryColor = MATH_COLORS.paramPrimary;
  const secondaryColor = MATH_COLORS.paramSecondary;
  const tangentColor = MATH_COLORS.tangentLine;

  const pointSlopeFormula = res.isValid
    ? buildPointSlopeLatex(x0, res.fx, res.slope, {
        x0Color: primaryColor,
        y0Color: primaryColor,
        slopeColor: tangentColor,
      })
    : "y - y_0 = f'(x_0)(x - x_0)";

  const slopeInterceptFormula = res.isValid
    ? buildSlopeInterceptLatex(res.slope, res.tangentIntercept, {
        slopeColor: tangentColor,
      })
    : "y = kx + b";

  const quantities: MathPanelData["quantities"] =
    mode === "secant_limit"
      ? [
          {
            label: "切点 P 坐标",
            symbol: "P(x₀, f(x₀))",
            value: Number.isFinite(res.fx)
              ? `(${x0.toFixed(2)}, ${res.fx.toFixed(2)})`
              : `(${x0.toFixed(2)}, 无定义)`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "割线动点 Q 坐标",
            symbol: "Q(x₀+Δx, y₂)",
            value: Number.isFinite(fy2)
              ? `(${x2.toFixed(2)}, ${fy2.toFixed(2)})`
              : `(${x2.toFixed(2)}, 无定义)`,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "割线步长 Δx",
            symbol: "\\Delta x",
            value: dx.toFixed(2),
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "割线斜率 (平均变化率)",
            symbol: "k_{\\text{割}}",
            value: Number.isFinite(kSecant) ? kSecant.toFixed(3) : "不存在",
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "切线斜率 (瞬时极限)",
            symbol: "f'(x_0)",
            value: Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "不存在",
            color: MATH_COLORS.tangentLine,
          },
        ]
      : [
          {
            label: "切点 P 坐标",
            symbol: "P(x₀, f(x₀))",
            value: Number.isFinite(res.fx)
              ? `(${x0.toFixed(2)}, ${res.fx.toFixed(2)})`
              : `(${x0.toFixed(2)}, 无定义)`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "切线斜率 k",
            symbol: "f'(x_0)",
            value: Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "不存在",
            color: MATH_COLORS.tangentLine,
          },
          {
            label: "切线倾斜角",
            symbol: "\\alpha",
            value: Number.isFinite(res.slope)
              ? `${(((Math.atan(res.slope) * 180) / Math.PI + 180) % 180).toFixed(1)}°`
              : "不存在",
            color: MATH_COLORS.tangentLine,
          },
          {
            label: "点斜式切线方程",
            symbol: "l",
            value: pointSlopeFormula,
            color: MATH_COLORS.labelText,
          },
        ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "导数的几何意义（极限定义）",
      latex: `f'(\\color{${primaryColor}}{x_0}) = \\lim_{\\color{${secondaryColor}}{\\Delta x} \\to 0} \\frac{f(\\color{${primaryColor}}{x_0} + \\color{${secondaryColor}}{\\Delta x}) - f(\\color{${primaryColor}}{x_0})}{\\color{${secondaryColor}}{\\Delta x}}`,
      level: mode === "secant_limit" ? "core" : "important",
      prerequisites: [
        "函数 f(x) 在 x₀ 及其去心邻域内有定义",
        "差商极限存在且有限（可导性充分必要条件）",
      ],
    },
    {
      name: "割线斜率（平均变化率）",
      latex: `k_{\\text{割}} = \\frac{\\Delta y}{\\Delta x} = \\frac{f(\\color{${primaryColor}}{x_0} + \\color{${secondaryColor}}{\\Delta x}) - f(\\color{${primaryColor}}{x_0})}{\\color{${secondaryColor}}{\\Delta x}}`,
      level: mode === "secant_limit" ? "core" : "supplementary",
      prerequisites: ["x₀ 与 x₀ + Δx 均在定义域内", "割线步长 Δx ≠ 0"],
    },
    {
      name: "切线方程点斜式",
      latex: pointSlopeFormula,
      level: mode === "tangent_eq" ? "core" : "important",
      prerequisites: [
        "切点 P(x₀, f(x₀)) 在曲线上",
        "导数 f'(x₀) 存在（切线非铅垂）",
      ],
    },
    {
      name: "切线方程斜截式 / 一般式",
      latex: slopeInterceptFormula,
      level: mode === "tangent_eq" ? "important" : "supplementary",
      prerequisites: ["切线斜率 k = f'(x₀) 存在"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【新高考通法·求切线 4 步规范】①确定切点坐标 P(x₀, f(x₀))；②求导函数 f'(x)；③计算切点斜率 k = f'(x₀)；④由点斜式写出切线方程 y - f(x₀) = f'(x₀)(x - x₀)。",
      importance: "gaokao",
    },
    {
      text: "【高考经典陷阱·“在点” vs “过点”】“在点 P 处的切线”表明 P 必为切点；“过点 P 的切线”表明 P 只是切线上一点，必须设切点 T(t, f(t)) 联立斜率方程求解切点横坐标 t。",
      importance: "gaokao",
    },
    {
      text: "【微积分核心思维·以直代曲】割线在 Δx → 0 时的极限位置即为切线。局部放大后曲线无限趋近于切线段，是高考导数不等式局部线性放缩（如 eˣ ≥ x + 1, ln x ≤ x - 1）的几何本源。",
      importance: "core",
    },
    {
      text: "【高考公切线母题模型】若切线 l 同时与两曲线 y = f(x), y = g(x) 相切，需分别设切点 A(x₁, f(x₁)), B(x₂, g(x₂))，利用 f'(x₁) = g'(x₂) = [g(x₂) - f(x₁)] / (x₂ - x₁) 构造方程组消元求解。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (!res.isValid) {
    warnings.push({
      text:
        res.degenerateType === "undefined"
          ? `函数在 x₀ = ${x0.toFixed(2)} 处无定义，超出定义域，无法计算切线。`
          : `函数在 x₀ = ${x0.toFixed(2)} 处不可导（存在尖点、不连续点或切线为铅垂线 x = ${x0.toFixed(2)}）。`,
      level: "danger",
    });
  } else if (mode === "secant_limit" && !Number.isFinite(fy2)) {
    warnings.push({
      text: `割线点 x₀ + Δx = ${x2.toFixed(2)} 超出函数定义域，割线无法闭合。`,
      level: "warning",
    });
  } else if (Math.abs(res.slope) < 1e-6) {
    warnings.push({
      text: `切线斜率 f'(x₀) = 0，切线为水平直线 y = ${res.fx.toFixed(2)}，此处对应驻点（可能为极值点或单调台阶点）。`,
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "导数即斜率，切线看切点；在点直接代，过点设参数。",
  };
}
