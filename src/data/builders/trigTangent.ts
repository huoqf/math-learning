import type { MathPanelData, MathQuantity, Theorem, GaokaoPoint, WarningItem } from "../types";
import { MATH_COLORS } from "@/theme";

export function buildTrigTangentPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>
): MathPanelData {
  const mode = (config?.mode as string) || "generalTransform";

  const theta = params.theta ?? Math.PI / 4;
  const A = params.A ?? 1.0;
  const omega = params.omega ?? 1.0;
  const phi = params.phi ?? 0.0;
  const C = params.C ?? 0.0;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (mode === "unitCircle") {
    const thetaDeg = ((theta * 180) / Math.PI).toFixed(1);
    const tanVal = Math.tan(theta);

    quantities.push(
      {
        label: "动角 θ (弧度/角度)",
        symbol: "\\theta",
        value: `${theta.toFixed(2)} rad (${thetaDeg}°)`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "正切线 AT 长度",
        symbol: "AT = \\tan\\theta",
        value: Number.isFinite(tanVal) ? tanVal.toFixed(3) : "无意义",
        color: MATH_COLORS.paramSecondary,
        highlight: Math.abs(tanVal) > 5 ? "extreme" : tanVal > 0 ? "positive" : tanVal < 0 ? "negative" : "zero",
      },
      {
        label: "正切点 T 坐标",
        symbol: "T(1, \\tan\\theta)",
        value: `(1, ${tanVal.toFixed(3)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "对应曲线点 Q",
        symbol: "Q(\\theta, \\tan\\theta)",
        value: `(${theta.toFixed(2)}, ${tanVal.toFixed(3)})`,
      }
    );

    theorems.push({
      name: "正切线的几何定义与生成",
      latex: "\\tan\\theta = \\frac{y}{x} = \\frac{\\text{线段 } AT}{1} = AT",
      condition: "单位圆 r=1，切线 x=1 与终边（或其反向延长线）交于 T(1, tan θ)",
      note: "当 θ → ±π/2 时，终边趋于垂直，正切线 AT 长度趋向于无穷大，即对应正切曲线趋向渐近线。",
      level: "core",
    });
  } else if (mode === "baseFunction") {
    quantities.push(
      {
        label: "解析式",
        symbol: "y = \\tan x",
        value: "f(x) = tan x",
        color: MATH_COLORS.function,
      },
      {
        label: "最小正周期",
        symbol: "T = \\pi",
        value: `π ≈ ${Math.PI.toFixed(4)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "定义域",
        symbol: "x \\neq k\\pi + \\frac{\\pi}{2}",
        value: "x ≠ kπ + π/2 (k ∈ Z)",
      },
      {
        label: "渐近线方程",
        symbol: "x = k\\pi + \\frac{\\pi}{2}",
        value: "..., -π/2, π/2, 3π/2, ...",
        color: MATH_COLORS.asymptote,
      },
      {
        label: "对称中心",
        symbol: "(\\frac{k\\pi}{2}, 0)",
        value: "..., (-π/2,0), (0,0), (π/2,0), ...",
        color: MATH_COLORS.paramPrimary,
      }
    );

    theorems.push({
      name: "正切函数 y=tan x 的基本性质",
      latex: "f(x + \\pi) = \\tan(x + \\pi) = \\tan x \\quad (x \\neq k\\pi + \\frac{\\pi}{2})",
      condition: "定义域为 {x | x ≠ kπ + π/2, k∈Z}，值域为 R",
      note: "奇函数（对称中心为 (kπ/2, 0)），无对称轴！最小正周期 T = π。",
      level: "core",
    });
  } else {
    // generalTransform
    const period = Math.abs(omega) > 1e-9 ? Math.PI / Math.abs(omega) : Infinity;
    const shift = Math.abs(omega) > 1e-9 ? -phi / omega : 0;

    quantities.push(
      {
        label: "一般型解析式",
        symbol: "y = A\\tan(\\omega x + \\varphi) + C",
        value: `y = ${A} tan(${omega}x ${phi >= 0 ? "+" : ""}${phi.toFixed(2)}) ${C >= 0 ? "+" : ""}${C}`,
        color: MATH_COLORS.function,
      },
      {
        label: "最小正周期 T",
        symbol: "T = \\frac{\\pi}{|\\omega|}",
        value: Number.isFinite(period) ? `${period.toFixed(3)} (约 ${(period / Math.PI).toFixed(2)}π)` : "不存在",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "相位平移量",
        symbol: "-\\frac{\\varphi}{\\omega}",
        value: `${shift.toFixed(3)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "渐近线方程",
        symbol: "x = \\frac{k\\pi + \\frac{\\pi}{2} - \\varphi}{\\omega}",
        value: `x = (kπ + π/2 - (${phi.toFixed(2)})) / ${omega}`,
        color: MATH_COLORS.asymptote,
      },
      {
        label: "对称中心坐标",
        symbol: "(\\frac{k\\pi}{2\\omega} - \\frac{\\varphi}{\\omega}, C)",
        value: `(kπ/(2·${omega}) ${shift >= 0 ? "+" : ""}${shift.toFixed(2)}, ${C})`,
        color: MATH_COLORS.paramTertiary,
      }
    );

    theorems.push({
      name: "正切函数 y = A tan(ωx + φ) + C 的性质公式",
      latex: "T = \\frac{\\pi}{|\\omega|}, \\quad \\text{渐近线: } \\omega x + \\varphi = k\\pi + \\frac{\\pi}{2}",
      condition: "A ≠ 0, ω ≠ 0",
      note: "单调递增区间由 kπ - π/2 < ωx + φ < kπ + π/2 解得。",
      level: "core",
    });
  }

  // 高考考点总结
  gaokaoPoints.push(
    {
      text: "考点1：正切函数渐近线方程求解 (令 ωx + φ = kπ + π/2)",
      importance: "gaokao",
    },
    {
      text: "考点2：单调性易错点：正切函数在每个开区间 (kπ-π/2, kπ+π/2) 内单调递增，不能跨区间说单调！",
      importance: "gaokao",
    },
    {
      text: "考点3：对称性判定：正切函数只有对称中心 (kπ/2, 0)，没有对称轴！",
      importance: "gaokao",
    },
    {
      text: "考点4：正切不等式解法 (tan x > a) 与正切线/图像交点法",
      importance: "hard",
    }
  );

  // 警示提示
  if (Math.abs(omega) < 1e-9) {
    warnings.push({
      text: "退化警示：周期因子 ω = 0，正切函数退化为常数 y = C，失去周期性与渐近线！",
      level: "danger",
    });
  }
  if (Math.abs(A) < 1e-9) {
    warnings.push({
      text: "退化警示：振幅因子 A = 0，正切函数退化为水平直线 y = C！",
      level: "warning",
    });
  }

  const mnemonic = "正切记忆口诀：渐近线找π/2加kπ，单调递增开区间；奇函数无对称轴，最小正周期为π/|ω|！";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
