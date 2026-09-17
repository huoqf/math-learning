/**
 * src/features/derivative-endpoint-taylor/scenePalette.ts
 * 端点效应 / 洛必达逼近 / 泰勒拟合 —— 中屏调色板（图例与画布的唯一颜色 / 线型来源）
 *
 * 本页原先有三处「图例与画布对不上」：
 *  1. 洛必达模式图例声明「导数之比 y = N'(x)/D'(x)」，但画布从未绘制这条曲线，
 *     而画布上的抛物线 x² 恰好用了与 derivative 同值的橙，学生必然把 x² 认成导数之比；
 *  2. 泰勒模式的「展开基准原点 O(0,0)」在 exp / cos 基底下标到了 (0, 1)，
 *     与坐标网格自带的 O 形成两个 O；
 *  3. 端点模式「端点 P₀」与「切线控制点 T」同为 #EF4444，图例两行同色无法对色。
 * 现由本文件统一裁定：颜色来自库内令牌既有语义，图例由 palette 生成，画布从 palette 取用。
 */

import { MATH_COLORS } from "@/theme";
import { buildLegendItems } from "@/components/Math/scenePalette";
import type {
  PaletteContext,
  ScenePalette,
} from "@/components/Math/scenePalette";

export type EndpointMode = "endpoint" | "lhopital" | "taylor";

/* ------------------------------------------------------------------ *
 * 模式一：端点效应与必要条件探究
 * ------------------------------------------------------------------ */
const ENDPOINT: ScenePalette = {
  fn: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.8,
    label: (c) =>
      c.endpointType === "exp"
        ? "原函数 $f(x) = e^x - ax - 1$"
        : c.endpointType === "ln"
          ? "原函数 $f(x) = \\ln(x+1) - ax$"
          : "原函数 $f(x) = x\\ln x - a(x-1)$",
  },
  tangent: {
    color: MATH_COLORS.paramSecondary,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "端点切线 $y = f'(x_0)(x-x_0)$",
  },
  p0: {
    color: MATH_COLORS.focusPoint,
    kind: "point",
    label: "端点 $P_0$",
  },
  p0Invalid: {
    color: MATH_COLORS.vectorResult,
    kind: "point",
    note: "必要条件失效时端点 P₀ 转为警示朱红，与「失效区」同色同族（同一次判定的两种表达）",
  },
  ctrlT: {
    color: MATH_COLORS.paramSecondary,
    kind: "point",
    label: "切线控制点 $T$",
    note: "T 是端点切线上的可拖拽控制点（拖动改变 a），故与切线同色同族；原先误用参数红，与端点 P₀ 撞色",
  },
  invalidZone: {
    color: MATH_COLORS.vectorResult,
    kind: "area",
    label: "必要条件失效区 (导数反向穿透)",
  },
};

/* ------------------------------------------------------------------ *
 * 模式二：洛必达法则 0/0 未定式逼近
 * ------------------------------------------------------------------ */
const LHOPITAL: ScenePalette = {
  ratio: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.8,
    label: "原式函数 $y = \\dfrac{N(x)}{D(x)} = \\dfrac{e^x - 1 - x}{x^2}$",
  },
  numerator: {
    color: MATH_COLORS.functionSecondary,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "分子曲线 $N(x) = e^x - 1 - x$",
  },
  denominator: {
    color: MATH_COLORS.functionTransformed,
    kind: "line",
    dash: "dash",
    width: 1.8,
    label: "分母曲线 $D(x) = x^2$",
    note: "原先误用与 derivative 同值的橙，导致分母抛物线被认成导数之比；改用「变换后函数」粉红与导数之比彻底分开",
  },
  dRatio: {
    color: MATH_COLORS.derivative,
    kind: "line",
    dash: "dash",
    width: 2.2,
    label: "导数之比 $y = \\dfrac{N'(x)}{D'(x)} = \\dfrac{e^x - 1}{2x}$",
    note: "本曲线原先只在图例里声明、画布未绘制，现按图例补齐（本模式的核心对比对象）",
  },
  limitLine: {
    color: MATH_COLORS.tangentLine,
    kind: "line",
    dash: "dash",
    width: 1.5,
    label: "极限值 $y = \\dfrac{1}{2}$",
  },
  limitPt: {
    color: MATH_COLORS.tangentLine,
    kind: "hollow-point",
    label: "极限点 $L\\left(0, \\dfrac{1}{2}\\right)$",
  },
  currP: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    label: "逼近动点 $P$",
  },
};

/* ------------------------------------------------------------------ *
 * 模式三：麦克劳林展开与测试动点
 * ------------------------------------------------------------------ */
const TAYLOR: ScenePalette = {
  base: {
    color: MATH_COLORS.function,
    kind: "line",
    dash: "solid",
    width: 2.8,
    label: (c) =>
      c.taylorBase === "exp"
        ? "超越基底函数 $f(x) = e^x$"
        : c.taylorBase === "ln"
          ? "超越基底函数 $f(x) = \\ln(1+x)$"
          : c.taylorBase === "sin"
            ? "超越基底函数 $f(x) = \\sin x$"
            : "超越基底函数 $f(x) = \\cos x$",
  },
  poly: {
    color: MATH_COLORS.functionSecondary,
    kind: "line",
    dash: "dash",
    width: 2.2,
    label: (c) => `${c.taylorOrder} 阶拟合曲线 $P_{${c.taylorOrder}}(x)$`,
    note: "拟合曲线是基底函数的对比对象，故用「对比函数」紫；原先误用参数红，与测试动点撞色",
  },
  residual: {
    color: MATH_COLORS.vectorResult,
    kind: "line",
    dash: "dot",
    width: 2,
    label: "截断绝对残差 $|R_n(x)| = |f(x) - P_n(x)|$",
  },
  basePt: {
    color: MATH_COLORS.paramTertiary,
    kind: "point",
    label: (c) =>
      c.taylorBase === "exp" || c.taylorBase === "cos"
        ? "展开基准点 $(0, 1)$"
        : "展开基准点 = 原点 $O(0,0)$",
    note: "基准点在 x = 0 处。ln / sin 基底下 f(0) = 0，该点即坐标原点，画布不再另画一个 O",
  },
  testP: {
    color: MATH_COLORS.paramPrimary,
    kind: "point",
    label: "测试动点 $P(x, P_n(x))$",
  },
  fxPt: {
    color: MATH_COLORS.function,
    kind: "point",
    note: "原函数上的对应点 (x, f(x)) 与基底曲线同色同族，不单列",
  },
};

const PALETTES: Record<EndpointMode, ScenePalette> = {
  endpoint: ENDPOINT,
  lhopital: LHOPITAL,
  taylor: TAYLOR,
};

/** 取当前模式的调色板 */
export function getEndpointPalette(activeMode: string): ScenePalette {
  return PALETTES[activeMode as EndpointMode] ?? ENDPOINT;
}

/** 图例（由 palette 生成，颜色与线型与画布天然同源） */
export function getEndpointLegendItems(
  activeMode: EndpointMode,
  ctx: PaletteContext,
) {
  return buildLegendItems(getEndpointPalette(activeMode), ctx);
}
