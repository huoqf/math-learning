import type { MathPanelData } from "@/data/types";
import { MATH_COLORS } from "@/theme";
import { checkParamKBounding } from "@/math/tangentScaling";
import type {
  TangentScalingParams,
  ParamKSubModel,
} from "@/data/registries/tangentScaling";

export function buildParamKModel(
  params: TangentScalingParams,
  paramKSub: ParamKSubModel,
): MathPanelData {
  const k = params.k;
  const evalRes = checkParamKBounding(k, params.evalX, paramKSub);

  if (paramKSub === "exp_kx_origin") {
    return {
      examAnchor: "新高考解答题 18 题 · 指数单侧切线卡位求参",
      mnemonic: "指数切于 (1,e)，斜率上限定为 e",
      quantities: [
        {
          label: "动直线斜率",
          symbol: "k",
          value: k.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "临界相切斜率",
          symbol: "k_{\\max}",
          value: Math.E.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "卡位安全状态",
          symbol: "\\text{状态}",
          value: evalRes.statusText,
          color: evalRes.isSafe
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.highlight,
          highlight: evalRes.isSafe ? "positive" : "extreme",
        },
      ],
      theorems: [
        {
          name: "指数函数过原点切线临界定理",
          latex: "e^x \\ge kx \\; (\\forall x > 0) \\iff k \\le e",
          condition: "直线过坐标原点 $O(0,0)$",
          level: "core",
          note: "当 $k = e$ 时直线 $y=ex$ 与曲线 $e^x$ 切于 $(1, e)$。当 $k > e$ 时在 $x=1$ 附近必发生穿透！",
        },
      ],
      warnings: [
        {
          text: evalRes.isSafe
            ? "斜率 $k \\le e$，动直线 $y = kx$ 位于 $e^x$ 下方，恒成立满足！"
            : `警示：${evalRes.statusText}，已违背恒成立要求！`,
          level: evalRes.isSafe ? "info" : "danger",
        },
      ],
      gaokaoPoints: [
        {
          text: "【切线斜率法】设切点为 $(x_1, e^{x_1})$，由过原点得出 $e^{x_1}/x_1 = e^{x_1}$ 求解临界",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "设切点并写出切线方程",
          detail:
            "设切点为 $(x_1, e^{x_1})$，导数 $f'(x_1) = e^{x_1}$，切线方程为 $y - e^{x_1} = e^{x_1}(x - x_1)$。",
          rubric: "采分点：切线方程建立（3分）",
        },
        {
          step: 2,
          title: "代入原点求解临界切点与斜率",
          detail:
            "因切线过原点 $(0,0)$，代入得 $-e^{x_1} = -x_1 e^{x_1}$，解得 $x_1 = 1$，临界斜率 $k = e$。",
          latex: "x_1 = 1 \\implies k = e, \\quad \\text{切点 } (1, e)",
          rubric: "采分点：临界解算（4分）",
        },
        {
          step: 3,
          title: "结合几何切线位置得出参数范围",
          detail:
            "切线 $y=ex$ 恒位于指数曲线下方，动直线绕原点顺时针旋转（斜率减小）时始终不穿透曲线下方，故充要条件为 $k \\le e$。",
          rubric: "采分点：充分性与必要性结论（4分）",
        },
      ],
    };
  }

  if (paramKSub === "log_kx_origin") {
    return {
      examAnchor: "新高考解答题 18 题 · 对数单侧切线卡位求参",
      mnemonic: "对数切于 (e,1)，斜率下限定 1/e",
      quantities: [
        {
          label: "动直线斜率",
          symbol: "k",
          value: k.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "临界相切斜率",
          symbol: "k_{\\min}",
          value: (1 / Math.E).toFixed(3),
          color: MATH_COLORS.secondary,
        },
        {
          label: "卡位安全状态",
          symbol: "\\text{状态}",
          value: evalRes.statusText,
          color: evalRes.isSafe
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.highlight,
          highlight: evalRes.isSafe ? "positive" : "extreme",
        },
      ],
      theorems: [
        {
          name: "对数函数过原点切线临界定理",
          latex:
            "\\ln x \\le kx \\; (\\forall x > 0) \\iff k \\ge \\frac{1}{e}",
          condition: "直线过坐标原点 $O(0,0)$",
          level: "core",
          note: "当 $k = 1/e$ 时直线 $y = \\frac{1}{e}x$ 与曲线 $\\ln x$ 切于 $(e, 1)$。当 $k < 1/e$ 时必发生穿透！",
        },
      ],
      warnings: [
        {
          text: evalRes.isSafe
            ? "斜率 $k \\ge 1/e$，动直线 $y = kx$ 位于 $\\ln x$ 上方，恒成立满足！"
            : `警示：${evalRes.statusText}，已违背恒成立要求！`,
          level: evalRes.isSafe ? "info" : "danger",
        },
      ],
      gaokaoPoints: [
        {
          text: "【参变量分离】$\\ln x \\le kx$ 可变形为 $k \\ge \\frac{\\ln x}{x}$，转化为求 $g(x)=\\frac{\\ln x}{x}$ 的最大值 $1/e$",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "参变量分离或切线法",
          detail:
            "令 $g(x) = \\frac{\\ln x}{x}$，求导得 $g'(x) = \\frac{1 - \\ln x}{x^2}$，驻点为 $x = e$。",
          rubric: "采分点：求导与驻点（4分）",
        },
        {
          step: 2,
          title: "确立最值点与临界斜率",
          detail:
            "当 $x < e$ 时 $g'(x) > 0$，当 $x > e$ 时 $g'(x) < 0$，故 $g(x)$ 在 $x = e$ 处取得最大值 $g(e) = 1/e$。",
          latex: "g(x)_{\\max} = g(e) = \\frac{1}{e}",
          rubric: "采分点：最值论证（4分）",
        },
        {
          step: 3,
          title: "确立斜率范围",
          detail:
            "恒成立要求 $k \\ge g(x)_{\\max} = 1/e$，几何上对应过原点切线在 $(e,1)$ 相切。",
          rubric: "采分点：结论总结（3分）",
        },
      ],
    };
  }

  // 默认双侧卡位 exp_log_k
  return {
    examAnchor: "新高考解答题 18 题 · 双切线旋转卡位求参",
    mnemonic: "定点引线转一圈，临界切率定区间",
    quantities: [
      {
        label: "动直线斜率",
        symbol: "k",
        value: k.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "对数相切临界斜率",
        symbol: "k_{\\min}",
        value: (1 / Math.E).toFixed(3),
        color: MATH_COLORS.secondary,
      },
      {
        label: "指数相切临界斜率",
        symbol: "k_{\\max}",
        value: Math.E.toFixed(3),
        color: MATH_COLORS.primary,
      },
      {
        label: "卡位安全状态",
        symbol: "\\text{状态}",
        value: evalRes.statusText,
        color: evalRes.isSafe
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.highlight,
        highlight: evalRes.isSafe ? "positive" : "extreme",
      },
    ],
    theorems: [
      {
        name: "过原点动直线双切线临界存在性定理",
        latex:
          "\\frac{1}{e} \\le k \\le e \\iff e^x \\ge kx \\ge \\ln x \\quad (\\forall x > 0)",
        condition: "直线过坐标原点 $O(0,0)$",
        level: "core",
        note: "当 $k = e$ 时切于指数曲线 $(1,e)$；当 $k = 1/e$ 时切于对数曲线 $(e,1)$。该区间为唯一的无穿透安全区！",
      },
    ],
    warnings: [
      {
        text: evalRes.isSafe
          ? "当前斜率处于双切线卡位安全区间内，动直线位于 $e^x$ 与 $\\ln x$ 之间且无穿透！"
          : `警示：${evalRes.statusText}，已违背全区间恒成立要求！`,
        level: evalRes.isSafe ? "info" : "danger",
      },
    ],
    gaokaoPoints: [
      {
        text: "【动静结合】将恒成立问题转化为过定点的动直线与两曲线均不相交/相切的几何临界位置",
        importance: "gaokao",
      },
      {
        text: "【双侧交集】双向卡位本质为单侧指数放缩 $k \\le e$ 与单侧对数放缩 $k \\ge 1/e$ 的交集",
        importance: "core",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "求解过原点与指数曲线相切的临界斜率",
        detail:
          "设切点为 $(x_1, e^{x_1})$，切线斜率 $k_1 = e^{x_1}$。由切线过原点得 $e^{x_1}/x_1 = e^{x_1}$，解得 $x_1 = 1$，故 $k_1 = e$。",
        latex: "k_1 = e, \\quad \\text{切点 } (1, e)",
        rubric: "采分点：指数切线临界解算（4分）",
      },
      {
        step: 2,
        title: "求解过原点与对数曲线相切的临界斜率",
        detail:
          "设切点为 $(x_2, \\ln x_2)$，切线斜率 $k_2 = 1/x_2$。由过原点得 $\\frac{\\ln x_2}{x_2} = \\frac{1}{x_2}$，解得 $x_2 = e$，故 $k_2 = 1/e$。",
        latex: "k_2 = \\frac{1}{e}, \\quad \\text{切点 } (e, 1)",
        rubric: "采分点：对数切线临界解算（4分）",
      },
      {
        step: 3,
        title: "几何旋转放缩确定参数范围",
        detail:
          "要使直线 $y=kx$ 介于两曲线之间，斜率必须满足 $k_2 \\le k \\le k_1$，即 $1/e \\le k \\le e$。",
        rubric: "采分点：综合取交集与边界检验（3分）",
      },
    ],
  };
}
