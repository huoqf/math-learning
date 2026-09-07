import type { MathPanelData } from "@/data/types";
import { MATH_COLORS } from "@/theme";
import {
  calculateTangentLine,
  checkParamKBounding,
} from "@/math/tangentScaling";
import type {
  TangentScalingParams,
  TangentScalingMode,
  BaseSubModel,
  SandwichSubModel,
  ParamKSubModel,
  SecantSubModel,
} from "@/data/registries/tangentScaling";

export interface TangentScalingOptions {
  mode?: TangentScalingMode;
  baseSubModel?: BaseSubModel;
  sandwichSubModel?: SandwichSubModel;
  paramKSubModel?: ParamKSubModel;
  secantSubModel?: SecantSubModel;
}

export function buildTangentScalingPanel(
  params: TangentScalingParams,
  options?: TangentScalingOptions,
): MathPanelData {
  const mode = options?.mode ?? "base";
  const baseSub = options?.baseSubModel ?? "exp_x_plus_1";
  const sandwichSub = options?.sandwichSubModel ?? "common_tangent";
  const paramKSub = options?.paramKSubModel ?? "exp_log_k";
  const secantSub = options?.secantSubModel ?? "exp_secant_tangent";

  // 1. 基准切线放缩模式
  if (mode === "base") {
    let funcType: "exp" | "log" | "exp_shift" | "log_shift" = "exp";
    let modelFormula = "e^x \\ge x + 1";
    let anchorPoint = "x_0 = 0";
    let isConvex = true; // 是否下凸

    if (baseSub === "exp_shift_x") {
      funcType = "exp_shift";
      modelFormula = "e^{x-1} \\ge x";
      anchorPoint = "x_0 = 1";
    } else if (baseSub === "exp_ex") {
      funcType = "exp";
      modelFormula = "e^x \\ge ex";
      anchorPoint = "x_0 = 1";
    } else if (baseSub === "log_x_minus_1") {
      funcType = "log";
      modelFormula = "\\ln x \\le x - 1";
      anchorPoint = "x_0 = 1";
      isConvex = false;
    } else if (baseSub === "log_x_div_e") {
      funcType = "log";
      modelFormula = "\\ln x \\le \\frac{x}{e}";
      anchorPoint = "x_0 = e";
      isConvex = false;
    } else if (baseSub === "log_shift_0") {
      funcType = "log_shift";
      modelFormula = "\\ln(x+1) \\le x";
      anchorPoint = "x_0 = 0";
      isConvex = false;
    }

    const tangent = calculateTangentLine(funcType, params.x0);
    const diff = tangent.y0 - (tangent.slope * params.x0 + tangent.intercept);

    return {
      examAnchor: "新高考解答题 17/18 题 · 基准切线放缩法",
      mnemonic: isConvex ? "下凸指数切线在下方支撑" : "上凸对数切线在上方包络",
      quantities: [
        {
          label: "切点横坐标",
          symbol: "x_0",
          value: params.x0.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "切点导数值",
          symbol: "f'(x_0)",
          value: Number.isFinite(tangent.slope)
            ? tangent.slope.toFixed(3)
            : "—",
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "当前动切线方程",
          symbol: "y",
          value: tangent.equationLatex,
          color: MATH_COLORS.primary,
        },
        {
          label: "切点处切线差",
          symbol: "f(x_0) - y_0",
          value: Math.abs(diff).toFixed(4),
          color: MATH_COLORS.accent,
          isInvariant: true,
          invariantNote: "相切点处差值精确为 0，其余点恒满足单向放缩",
        },
      ],
      theorems: [
        {
          name: isConvex
            ? "下凸函数一阶切线下界不等式"
            : "上凸函数一阶切线上界不等式",
          latex: isConvex
            ? "f(x) \\ge f'(x_0)(x - x_0) + f(x_0) \\quad (f''(x) > 0)"
            : "f(x) \\le f'(x_0)(x - x_0) + f(x_0) \\quad (f''(x) < 0)",
          condition: isConvex ? "二阶导恒正（下凸）" : "二阶导恒负（上凸）",
          level: "core",
          note: `当前对应高考经典公式：$${modelFormula}$，当且仅当 $${anchorPoint}$ 时等号成立。`,
        },
      ],
      warnings: [
        {
          text: `放缩等号仅在 $${anchorPoint}$ 处取得，若与其他式子联立，需严格验证各部分取等条件是否可同时达到！`,
          level: "warning",
        },
      ],
      gaokaoPoints: [
        {
          text: "【化简降维】新高考压轴题中若出现指对混合多项式，首选基准切线放缩将超越函数降维为一次函数",
          importance: "gaokao",
        },
        {
          text: `【同构变形】$${modelFormula}$ 是高考同构变形（形如 $e^t$ 与 $\\ln t$）的核心换元桥梁`,
          importance: "core",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "构造切线差函数并求导",
          detail:
            "令辅助函数 $h(x) = f(x) - [f'(x_0)(x - x_0) + f(x_0)]$，求导得 $h'(x) = f'(x) - f'(x_0)$。",
          rubric: "采分点：构造辅助函数与求导（3分）",
        },
        {
          step: 2,
          title: "利用导数单调性确立极值",
          detail: isConvex
            ? "由 $f''(x) > 0$ 知 $f'(x)$ 单调递增，故 $x < x_0$ 时 $h'(x) < 0$，$x > x_0$ 时 $h'(x) > 0$，$h(x)$ 取得极小值。"
            : "由 $f''(x) < 0$ 知 $f'(x)$ 单调递减，故 $x < x_0$ 时 $h'(x) > 0$，$x > x_0$ 时 $h'(x) < 0$，$h(x)$ 取得极大值。",
          rubric: "采分点：单调区间论证与极值符号（4分）",
        },
        {
          step: 3,
          title: "得出放缩不等式结论",
          detail: `代入得极值 $h(x_0) = 0$，从而 $${modelFormula}$ 恒成立，等号当且仅当 $${anchorPoint}$ 时成立。`,
          rubric: "采分点：综合结论与等号条件（4分）",
        },
      ],
    };
  }

  // 2. 双切线公切与平行卡位模式
  if (mode === "sandwich") {
    const x = params.evalX;
    const isParallel = sandwichSub === "parallel_bands";
    const isOrigin = sandwichSub === "origin_sandwich";

    let upperVal = Math.exp(x - 1);
    let lowerVal = Math.log(x) + 1;
    let midVal = x;

    if (isParallel) {
      upperVal = Math.exp(x);
      lowerVal = Math.log(x);
      midVal = x;
    } else if (isOrigin) {
      upperVal = Math.exp(x) - 1;
      lowerVal = Math.log(x + 1);
      midVal = x;
    }

    if (isParallel) {
      return {
        examAnchor: "新高考解答题 18 题 · 平行切线缓冲带与最值秒杀",
        mnemonic: "平行双切若夹紧，上下差值定乾坤",
        quantities: [
          {
            label: "观察点横坐标",
            symbol: "x",
            value: x.toFixed(2),
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "指数函数值",
            symbol: "e^x",
            value: upperVal.toFixed(3),
            color: MATH_COLORS.primary,
          },
          {
            label: "对数函数值",
            symbol: "\\ln x",
            value: Number.isFinite(lowerVal) ? lowerVal.toFixed(3) : "—",
            color: MATH_COLORS.secondary,
          },
          {
            label: "函数垂直差",
            symbol: "\\Delta y",
            value: (upperVal - lowerVal).toFixed(3),
            color: MATH_COLORS.accent,
            highlight: "positive",
          },
        ],
        theorems: [
          {
            name: "高考经典平行切线缓冲带不等式",
            latex:
              "e^x - \\ln x \\ge (x + 1) - (x - 1) = 2 \\quad (\\forall x > 0)",
            condition: "x > 0",
            level: "core",
            note: "$e^x$ 在 $(0,1)$ 处的切线为 $y=x+1$；$\\ln x$ 在 $(1,0)$ 处的切线为 $y=x-1$。两切线平行且纵向缓冲差恒等于 2！",
          },
        ],
        warnings: [
          {
            text: "由于 $e^x$ 在 $x=0$ 处取等，$\\ln x$ 在 $x=1$ 处取等，两者无法同时取等，因此严格不等式 $e^x - \\ln x > 2$ 恒成立！",
            level: "info",
          },
        ],
        gaokaoPoints: [
          {
            text: "【秒杀经典】高考证明 $e^x - \\ln x > 2$ 时，直接利用平行双切线相减放缩，无需二阶求导即可获满分",
            importance: "gaokao",
          },
        ],
        reasoningSteps: [
          {
            step: 1,
            title: "分别列出两曲线的平行切线",
            detail:
              "由基准放缩：对于 $x > 0$，恒有 $e^x \\ge x + 1$ ($x=0$ 取等) 且 $\\ln x \\le x - 1$ ($x=1$ 取等)。",
            latex: "e^x \\ge x + 1, \\quad \\ln x \\le x - 1",
            rubric: "采分点：分别写出切线放缩式（4分）",
          },
          {
            step: 2,
            title: "两式同向相减求差",
            detail: "两式相减得：$e^x - \\ln x \\ge (x + 1) - (x - 1) = 2$。",
            latex: "e^x - \\ln x \\ge (x + 1) - (x - 1) = 2",
            rubric: "采分点：同向放缩做差（4分）",
          },
          {
            step: 3,
            title: "等号不同步判定严格大于",
            detail:
              "因 $x=0$ 与 $x=1$ 不能同时满足，等号不可取，故对一切 $x > 0$ 恒有 $e^x - \\ln x > 2$。",
            rubric: "采分点：等号不同步论证严格不等（3分）",
          },
        ],
      };
    }

    return {
      examAnchor: "新高考解答题 18 题压轴 · 公切线中轴卡位",
      mnemonic: "中间公切若卡牢，上下夹逼无需导",
      quantities: [
        {
          label: "观察点横坐标",
          symbol: "x",
          value: x.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "上界函数值",
          symbol: isOrigin ? "e^x - 1" : "e^{x-1}",
          value: upperVal.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "中介公切线值",
          symbol: "y",
          value: midVal.toFixed(3),
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "下界函数值",
          symbol: isOrigin ? "\\ln(x+1)" : "\\ln x + 1",
          value: Number.isFinite(lowerVal) ? lowerVal.toFixed(3) : "—",
          color: MATH_COLORS.secondary,
        },
      ],
      theorems: [
        {
          name: "公切线中介夹逼卡位原理",
          latex: isOrigin
            ? "e^x - 1 \\ge x \\ge \\ln(x + 1) \\quad (x > -1)"
            : "e^{x-1} \\ge x \\ge \\ln x + 1 \\quad (x > 0)",
          condition: isOrigin
            ? "x > -1, \\; x = 0\\text{ 时取等}"
            : "x > 0, \\; x = 1\\text{ 时取等}",
          level: "core",
          note: "两曲线在公切点处切线重合为 $y = x$，直接构造天然中介，避开复杂的差函数高阶求导！",
        },
      ],
      warnings: [
        {
          text: "公切线卡位必须保证两曲线在相切点同斜率同函数值，且两侧曲线均不穿透该公切线！",
          level: "danger",
        },
      ],
      gaokaoPoints: [
        {
          text: "【拆分思想】面对证明 $f(x) \\ge g(x)$，通过引入一次中介直线拆解为两个独立的基准不等式证明",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "确立公切线方程",
          detail: isOrigin
            ? "考察 $f(x)=e^x-1$ 与 $g(x)=\\ln(x+1)$，在 $x=0$ 处 $f(0)=g(0)=0$，$f'(0)=g'(0)=1$，故公切线为 $y = x$。"
            : "考察 $f(x)=e^{x-1}$ 与 $g(x)=\\ln x + 1$，在 $x=1$ 处 $f(1)=g(1)=1$，$f'(1)=g'(1)=1$，故公切线为 $y = x$。",
          rubric: "采分点：公切线方程求解（3分）",
        },
        {
          step: 2,
          title: "双向分别证明不等式",
          detail: isOrigin
            ? "由基准放缩 $e^t \\ge t+1$ 知 $e^x-1 \\ge x$；由 $\\ln(1+t) \\le t$ 知 $\\ln(x+1) \\le x$。"
            : "由 $e^t \\ge t+1$ 令 $t=x-1$ 得 $e^{x-1} \\ge x$；由 $\\ln x \\le x-1$ 加 1 得 $\\ln x + 1 \\le x$。",
          rubric: "采分点：双向子命题论证（5分）",
        },
        {
          step: 3,
          title: "三式合并完成卡位",
          detail:
            "两边夹逼综合，传递得出不等式成立，等号在公共切点处同步取得。",
          rubric: "采分点：等号同步条件与结论（3分）",
        },
      ],
    };
  }

  // 3. 过定点旋转动直线卡位求参
  if (mode === "param_k") {
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
            condition: "直线过坐标原点 O(0,0)",
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
            title: "结合凸性得出参数范围",
            detail:
              "由于 $e^x$ 为下凸函数，动直线绕原点顺时针旋转（斜率减小）时始终位于曲线下方，故 $k \\le e$。",
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
            condition: "直线过坐标原点 O(0,0)",
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
          condition: "直线过坐标原点 O(0,0)",
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
          title: "几何旋转夹逼确定参数范围",
          detail:
            "要使直线 $y=kx$ 介于两曲线之间，斜率必须满足 $k_2 \\le k \\le k_1$，即 $1/e \\le k \\le e$。",
          rubric: "采分点：综合取交集与边界检验（3分）",
        },
      ],
    };
  }

  // 4. 割切双向夹逼模式 (secant)
  if (secantSub === "taylor_quadratic") {
    const x = params.evalX;
    const lower = x - 0.5 * x * x;
    const main = x > -0.99 ? Math.log(1 + x) : 0;
    const upper = x;

    return {
      examAnchor: "新高考解答题 18 题 · 二阶泰勒多项式精细卡位",
      mnemonic: "一阶切线给上限，二阶多项卡下界",
      quantities: [
        {
          label: "观察点横坐标",
          symbol: "x",
          value: x.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "二阶下界多项式值",
          symbol: "P_2(x)",
          value: lower.toFixed(4),
          color: MATH_COLORS.accent,
        },
        {
          label: "精确函数值",
          symbol: "\\ln(1+x)",
          value: main.toFixed(4),
          color: MATH_COLORS.primary,
        },
        {
          label: "一阶切线上界值",
          symbol: "P_1(x)",
          value: upper.toFixed(4),
          color: MATH_COLORS.paramTertiary,
        },
      ],
      theorems: [
        {
          name: "对数二阶泰勒展开卡位不等式",
          latex: "x - \\frac{1}{2}x^2 \\le \\ln(1+x) \\le x \\quad (x \\ge 0)",
          condition: "x \\ge 0, \\; x = 0\\text{ 时取等}",
          level: "core",
          note: "在高考数列与导数压轴题中，一阶放缩 $\\ln(1+x) \\le x$ 往往过松，需二阶项精细定界！",
        },
      ],
      warnings: [
        {
          text: "二阶下界仅在 $x \\ge 0$ 时成立；若 $x \\in (-1, 0)$，不等号方向将改变，切勿盲目套用！",
          level: "warning",
        },
      ],
      gaokaoPoints: [
        {
          text: "【数列求和卡位】常用于证明形如 $\\sum \\ln(1 + 1/n^2)$ 的收敛范围与精确上下界估计",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "构造下界差函数",
          detail:
            "令 $h(x) = \\ln(1+x) - (x - 0.5x^2)$，求导得 $h'(x) = \\frac{1}{1+x} - (1-x) = \\frac{x^2}{1+x}$。",
          latex: "h'(x) = \\frac{1}{1+x} - (1-x) = \\frac{x^2}{1+x}",
          rubric: "采分点：求导与通分化简（4分）",
        },
        {
          step: 2,
          title: "符号判定与单调性",
          detail:
            "当 $x \\ge 0$ 时，$\\frac{x^2}{1+x} \\ge 0$，故 $h(x)$ 在 $[0, +\\infty)$ 上单调递增。",
          rubric: "采分点：导数符号与单调性（4分）",
        },
        {
          step: 3,
          title: "代入初值确立下界",
          detail:
            "因 $h(0) = 0$，由单调递增得 $h(x) \\ge h(0) = 0$，结合一阶放缩即证结论。",
          rubric: "采分点：初值比较与结论（3分）",
        },
      ],
    };
  }

  if (secantSub === "log_secant_tangent") {
    const a = params.intervalA;
    const b = params.intervalB;
    const midX = (a + b) / 2;
    const fa = Math.log(a);
    const fb = Math.log(b);
    const secSlope = (fb - fa) / (b - a);

    return {
      examAnchor: "新高考解答题 18 题 · 对数上凸函数弦切夹逼",
      mnemonic: "上凸对数弦在下，区间切线恒在上",
      quantities: [
        {
          label: "区间左端点",
          symbol: "a",
          value: a.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "区间右端点",
          symbol: "b",
          value: b.toFixed(2),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "割线斜率",
          symbol: "m_{AB}",
          value: secSlope.toFixed(3),
          color: MATH_COLORS.accent,
        },
        {
          label: "中点切线斜率",
          symbol: "f'(x_m)",
          value: (1 / midX).toFixed(3),
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "对数凹函数（上凸）有限区间割切包围定理",
          latex:
            "\\frac{\\ln b - \\ln a}{b - a}(x - a) + \\ln a \\le \\ln x \\le \\frac{1}{x_0}(x - x_0) + \\ln x_0",
          condition: "x \\in [a, b], \\; x_0 \\in [a, b]",
          level: "core",
          note: "因 $(\\ln x)'' = -1/x^2 < 0$，对数曲线在区间内严格位于割线（弦）的上方、切线的下方！",
        },
      ],
      warnings: [
        {
          text: "注意与指数凸函数相反：对数函数的弦线在下方提供下界，切线在上方提供上界！",
          level: "info",
        },
      ],
      gaokaoPoints: [
        {
          text: "【琴生与弦切】新高考 2021 压轴题考点：利用上凸弦切不等式证明 $\\ln((a+b)/2) > (\\ln a + \\ln b)/2$",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "构造端点割线方程",
          detail:
            "连接曲线两端点 $A(a, \\ln a)$ 与 $B(b, \\ln b)$，写出割线方程 $L_{AB}(x)$。",
          rubric: "采分点：割线解析式（3分）",
        },
        {
          step: 2,
          title: "利用二阶导数凹凸性确立夹逼",
          detail:
            "因二阶导恒负，对数函数为严格上凸函数，区间内内点弦线恒低于曲线，切线恒高于曲线。",
          rubric: "采分点：凹凸性反向论证（5分）",
        },
        {
          step: 3,
          title: "总结割切双向夹逼范围",
          detail:
            "从而建立对数函数的双向紧致线性包围，用于极值点偏移或数列积分估计。",
          rubric: "采分点：双向定界结论（3分）",
        },
      ],
    };
  }

  // 默认指数凸函数割切夹逼 exp_secant_tangent
  const a = params.intervalA;
  const b = params.intervalB;
  const midX = (a + b) / 2;
  const fa = Math.exp(a);
  const fb = Math.exp(b);
  const secSlope = (fb - fa) / (b - a);

  return {
    examAnchor: "新高考解答题 18 题拔高 · 指数下凸函数割切双向定界",
    mnemonic: "下凸指数切在下，两端割线给上界",
    quantities: [
      {
        label: "区间左端点",
        symbol: "a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "区间右端点",
        symbol: "b",
        value: b.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "割线斜率",
        symbol: "m_{AB}",
        value: secSlope.toFixed(3),
        color: MATH_COLORS.accent,
      },
      {
        label: "中点切线斜率",
        symbol: "f'(x_m)",
        value: Math.exp(midX).toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
    ],
    theorems: [
      {
        name: "指数下凸函数有限区间割切包围定理",
        latex:
          "e^{x_0}(x - x_0) + e^{x_0} \\le e^x \\le \\frac{e^b - e^a}{b - a}(x - a) + e^a",
        condition: "x \\in [a, b], \\; x_0 \\in [a, b]",
        level: "core",
        note: "下凸函数在任意闭区间内部，曲线被下方的切线与上方的弦线（割线）严格包围！",
      },
    ],
    warnings: [
      {
        text: "割线只在区间 $[a,b]$ 内部提供上界，一旦超出端点范围，指数曲线将反超割线！",
        level: "warning",
      },
    ],
    gaokaoPoints: [
      {
        text: "【数列放缩衔接】导数压轴题与数列求和证明结合时，常利用割切夹逼进行定积分面积包围估计",
        importance: "hard",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "构造端点割线方程",
        detail:
          "连接曲线两端点 $A(a, e^a)$ 与 $B(b, e^b)$，写出割线方程 $L_{AB}(x)$。",
        rubric: "采分点：割线解析式（3分）",
      },
      {
        step: 2,
        title: "利用二阶导数凹凸性确立夹逼",
        detail:
          "下凸函数的割线内点恒高于曲线，切线内点恒低于曲线，从而建立双向紧约束。",
        rubric: "采分点：凹凸性几何性质论证（5分）",
      },
      {
        step: 3,
        title: "总结割切双向夹逼结论",
        detail:
          "切线提供下界支撑，割线提供上界封顶，区间内曲线被紧紧锁定于两直线之间。",
        rubric: "采分点：双向定界结论（3分）",
      },
    ],
  };
}
