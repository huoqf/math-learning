import type { MathPanelData, ReasoningStep } from "../types";
import {
  solveDerivative,
  solveExternalTangents,
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
  const xA = params.xA ?? 1;
  const yA = params.yA ?? -3;
  const fnKey = ((config?.fnKey as string) || "cubic") as PresetFunctionKey;
  const mode = (config?.mode as string) || "secant_limit";
  const preset = PRESET_FUNCTIONS[fnKey] || PRESET_FUNCTIONS.cubic;
  const res = solveDerivative(preset.fn, x0);

  // ── 分支：过外部定点 A(xA, yA) 作切线 ──
  if (mode === "external_tangent") {
    const extTangents = solveExternalTangents(
      preset.fn,
      xA,
      yA,
      preset.x0Range[0],
      preset.x0Range[1],
    );
    const fyA = preset.fn(xA);
    const isOnCurve = Number.isFinite(fyA) && Math.abs(fyA - yA) < 0.08;

    const extQuantities: MathPanelData["quantities"] = [
      {
        label: "给定定点 A 坐标",
        symbol: "A(x_A, y_A)",
        value: `(${xA.toFixed(2)}, ${yA.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "过点可作切线条数",
        symbol: "N",
        value: `${extTangents.length} 条`,
        color:
          extTangents.length > 0
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.highlight,
        highlight: extTangents.length > 0 ? "positive" : "extreme",
      },
      ...extTangents.slice(0, 3).map((item, idx) => ({
        label: `第 ${idx + 1} 条切线切点`,
        symbol: `T_${idx + 1}(t_${idx + 1}, f(t_${idx + 1}))`,
        value: `t_${idx + 1} = ${item.t.toFixed(2)},\\; k = ${item.slope.toFixed(2)}`,
        color: MATH_COLORS.tangentLine,
      })),
    ];

    const extTheorems: MathPanelData["theorems"] = [
      {
        name: "“过点”求切线通用设点方程",
        latex: "y_A - f(t) = f'(t)(x_A - t)",
        level: "core",
        prerequisites: [
          "给定点 $A(x_A, y_A)$ 未必是切点，先设未知切点 $T(t, f(t))$",
          "方程关于 $t$ 的不同实根个数等于过点 $A$ 可作的切线条数",
        ],
      },
      {
        name: "“在点”与“过点”的充要辨析",
        latex:
          "\\text{在点 } P \\iff t = x_P; \\quad \\text{过点 } A \\iff A \\text{ 在切线上（即使 } A \\text{ 在曲线上也可能另有切线）}",
        level: "important",
        prerequisites: [
          "例如过三次曲线某点作切线，最多可得到 2 条或 3 条不同切线",
        ],
      },
    ];

    const extGaokao: MathPanelData["gaokaoPoints"] = [
      {
        text: "【新高考易错陷阱·“在点”vs“过点”】见到“过点 $A$ 的切线”，哪怕点 $A$ 恰好满足 $y_A = f(x_A)$，也不可直接取 $f'(x_A)$ 算一条完事，必须先设切点 $T(t, f(t))$ 列方程解出全部实根 $t$。",
        importance: "gaokao",
      },
      {
        text: "【切线条数与方程根转化】高考压轴小题常考查“过点 $A(x_A, y_A)$ 可作 3 条（或 0 条）切线”，等价于方程 $f(t) + f'(t)(x_A - t) = y_A$ 的实根个数问题。",
        importance: "gaokao",
      },
    ];

    const rootsLatex =
      extTangents.length > 0
        ? extTangents
            .map((item, idx) => `t_${idx + 1} \\approx ${item.t.toFixed(2)}`)
            .join(",\\quad ")
        : "\\text{无实数切点解}";

    const extSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 设切点区分“过点”与“在点”",
        detail: `所求切线“过点 $A(${xA.toFixed(2)}, ${yA.toFixed(2)})$”，切点未知，先设切点为 $T(t, f(t))$，核验函数在 $T$ 处导数为 $f'(t)$。`,
        latex: `T(t, f(t)), \\quad k_{\\text{切}} = f'(t)`,
        rubric: "【高考采分点】正确设出切点坐标 $T(t, f(t))$ 得 2 分",
      },
      {
        step: 2,
        title: "建模联立 · 列过点 A 的斜率方程",
        detail: `写出过 $T(t, f(t))$ 的切线方程 $y - f(t) = f'(t)(x - t)$，将已知点 $A(${xA.toFixed(2)}, ${yA.toFixed(2)})$ 代入构造关于 $t$ 的方程：`,
        latex: `${yA.toFixed(2)} - f(t) = f'(t)(${xA.toFixed(2)} - t)`,
        rubric: "【高考采分点】代入定点构造关于 $t$ 的方程得 2 分",
      },
      {
        step: 3,
        title: "求解反思 · 解出全部实根并写切线",
        detail:
          extTangents.length > 0
            ? `在区间 $[${preset.x0Range[0]}, ${preset.x0Range[1]}]$ 内解得共 ${extTangents.length} 个实根：$${rootsLatex}$，分别回代点斜式即得全部切线方程。`
            : `当前方程无实数解，说明定点 $A$ 位于曲线开口内侧，过 $A$ 点共可作 $0$ 条切线。`,
        latex: rootsLatex,
        rubric: "【高考采分点】不漏根、无增根写出全部切线方程得 2 分",
      },
    ];

    const extWarnings: MathPanelData["warnings"] = [];
    if (extTangents.length === 0) {
      extWarnings.push({
        text: `过当前点 $A(${xA.toFixed(2)}, ${yA.toFixed(2)})$ 方程无实根，无法作出该曲线的切线（0 条）。`,
        level: "warning",
      });
    } else if (isOnCurve) {
      extWarnings.push({
        text: `点 $A$ 恰在曲线上（同时可能还存在其它切点），目前共求得 ${extTangents.length} 条切线，请勿误判为只有 1 条！`,
        level: "info",
      });
    }

    return {
      quantities: extQuantities,
      theorems: extTheorems,
      gaokaoPoints: extGaokao,
      warnings: extWarnings,
      reasoningSteps: extSteps,
      mnemonic: "在点直接代，过点设参数；方程几个根，切线有几条。",
    };
  }

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
            symbol: "P(x_0, f(x_0))",
            value: Number.isFinite(res.fx)
              ? `(${x0.toFixed(2)}, ${res.fx.toFixed(2)})`
              : `(${x0.toFixed(2)}, 无定义)`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "割线动点 Q 坐标",
            symbol: "Q(x_0+\\Delta x, y_2)",
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
            symbol: "P(x_0, f(x_0))",
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
        "函数 $f(x)$ 在 $x_0$ 及其去心邻域内有定义",
        "差商极限存在且有限（可导性充分必要条件）",
      ],
    },
    {
      name: "割线斜率（平均变化率）",
      latex: `k_{\\text{割}} = \\frac{\\Delta y}{\\Delta x} = \\frac{f(\\color{${primaryColor}}{x_0} + \\color{${secondaryColor}}{\\Delta x}) - f(\\color{${primaryColor}}{x_0})}{\\color{${secondaryColor}}{\\Delta x}}`,
      level: mode === "secant_limit" ? "core" : "supplementary",
      prerequisites: [
        "$x_0$ 与 $x_0 + \\Delta x$ 均在定义域内",
        "割线步长 $\\Delta x \\neq 0$",
      ],
    },
    {
      name: "切线方程点斜式",
      latex: "y - f(x_0) = f'(x_0)(x - x_0)",
      note: res.isValid ? `当前切点代入：$${pointSlopeFormula}$` : undefined,
      level: mode === "tangent_eq" ? "core" : "important",
      prerequisites: [
        "切点 $P(x_0, f(x_0))$ 在曲线上",
        "导数 $f'(x_0)$ 存在（切线非铅垂）",
      ],
    },
    {
      name: "切线方程斜截式 / 一般式",
      latex: "y = f'(x_0)x + [f(x_0) - f'(x_0)x_0]",
      note: res.isValid
        ? `当前化简方程：$${slopeInterceptFormula}$`
        : undefined,
      level: mode === "tangent_eq" ? "important" : "supplementary",
      prerequisites: ["切线斜率 $k = f'(x_0)$ 存在"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【新高考通法·求切线 4 步规范】①确定切点坐标 $P(x_0, f(x_0))$；②求导函数 $f'(x)$；③计算切点斜率 $k = f'(x_0)$；④由点斜式写出切线方程 $y - f(x_0) = f'(x_0)(x - x_0)$。",
      importance: "gaokao",
    },
    {
      text: "【高考经典陷阱·“在点” vs “过点”】“在点 $P$ 处的切线”表明 $P$ 必为切点；“过点 $P$ 的切线”表明 $P$ 只是切线上一点，必须设切点 $T(t, f(t))$ 联立斜率方程求解切点横坐标 $t$。",
      importance: "gaokao",
    },
    {
      text: "【微积分核心思维·以直代曲】割线在 $\\Delta x \\to 0$ 时的极限位置即为切线。局部放大后曲线无限趋近于切线段，是高考导数不等式局部线性放缩（如 $e^x \\ge x + 1$, $\\ln x \\le x - 1$）的几何本源。",
      importance: "core",
    },
    {
      text: "【高考公切线母题模型】若切线 $l$ 同时与两曲线 $y = f(x)$, $y = g(x)$ 相切，需分别设切点 $A(x_1, f(x_1))$, $B(x_2, g(x_2))$，利用 $f'(x_1) = g'(x_2) = \\frac{g(x_2) - f(x_1)}{x_2 - x_1}$ 构造方程组消元求解。",
      importance: "gaokao",
    },
  ];

  const deltaY = Number.isFinite(fy2) ? fy2 - res.fx : NaN;

  const reasoningSteps: ReasoningStep[] = res.isValid
    ? [
        {
          step: 1,
          title: "审题定法 · 求切点坐标并核验可导",
          detail: `由切点横坐标 $x_0 = ${x0.toFixed(2)}$ 代入解析式求函数值 $f(x_0) = ${res.fx.toFixed(2)}$，得切点 $P(${x0.toFixed(2)}, ${res.fx.toFixed(2)})$；再核验曲线在 $P$ 处连续光滑、切线不垂直于 $x$ 轴，满足「在点处可导」前提。`,
          latex: `P(x_0, f(x_0)) = \\left(${x0.toFixed(2)},\\ ${res.fx.toFixed(2)}\\right)`,
          rubric: "【高考采分点】求出切点坐标并说明可导性前提得 2 分",
        },
        mode === "secant_limit"
          ? {
              step: 2,
              title: "建模联立 · 计算割线斜率（平均变化率）",
              detail: `在 $P$ 邻近取动点 $Q(x_0 + \\Delta x, f(x_0 + \\Delta x))$，本例步长 $\\Delta x = ${dx.toFixed(2)}$，对应 $Q(${x2.toFixed(2)}, ${Number.isFinite(fy2) ? fy2.toFixed(2) : "无定义"})$；割线 $PQ$ 的斜率即为区间上的平均变化率。`,
              latex: `k_{\\text{割}} = \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x} = \\frac{${Number.isFinite(deltaY) ? deltaY.toFixed(3) : "\\text{无定义}"}}{${dx.toFixed(2)}} = ${Number.isFinite(kSecant) ? kSecant.toFixed(3) : "\\text{无定义}"}`,
              rubric: "【高考采分点】列出差商计算式并算出割线斜率得 2 分",
            }
          : {
              step: 2,
              title: "建模联立 · 求导函数并代入求斜率",
              detail: `先求导函数 $f'(x)$，再把横坐标 $x = x_0$ 代入，得该点切线斜率 $k = f'(x_0) = ${Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "不存在"}$。`,
              latex: `f'(x_0) = ${Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "\\text{不存在}"}`,
              rubric: "【高考采分点】正确求导并代入切点得切线斜率得 2 分",
            },
        mode === "secant_limit"
          ? {
              step: 3,
              title: "求解反思 · 令 Δx→0 得瞬时切线斜率",
              detail: `令 $\\Delta x \\to 0$，割线 $PQ$ 的极限位置即为切线，割线斜率的极限即为瞬时导数 $f'(${x0.toFixed(2)}) = ${Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "不存在"}$；两者之差 $|k_{\\text{割}} - k_{\\text{切}}| = ${Number.isFinite(kSecant) ? Math.abs(kSecant - res.slope).toFixed(3) : "—"}$，随 $\\Delta x$ 减小而趋于 0。`,
              latex: `\\lim_{\\Delta x \\to 0} k_{\\text{割}} = f'(x_0) = ${Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "\\text{不存在}"}`,
              rubric:
                "【高考采分点】写出导数定义极限并由点斜式写出切线方程得 2 分",
            }
          : {
              step: 3,
              title: "求解反思 · 由点斜式写出切线方程",
              detail: `由点斜式 $y - f(x_0) = f'(x_0)(x - x_0)$，代入切点坐标与切线斜率，化简即得所求切线方程。`,
              latex: pointSlopeFormula,
              rubric: "【高考采分点】由点斜式代入切点与斜率写出切线方程得 2 分",
            },
      ]
    : [
        {
          step: 1,
          title: "审题定法 · 核验定义域与可导性",
          detail: `切点横坐标 $x_0 = ${x0.toFixed(2)}$ 处，${res.degenerateType === "undefined" ? "函数无定义，超出定义域" : "函数不可导（存在尖点或切线为铅垂线）"}，须先排除，不能直接套用求导公式。`,
          rubric: "【高考采分点】识别切点不在定义域或不可导得 2 分",
        },
        {
          step: 2,
          title: "求解反思 · 调整切点后重做",
          detail: `请调整切点横坐标，使其落入函数定义域且曲线光滑，再按「定切点 → 求导 → 代斜率 → 写方程」四步规范重做。`,
          rubric: "【高考采分点】说明错误原因并给出修正方向得 2 分",
        },
      ];

  const warnings: MathPanelData["warnings"] = [];
  if (!res.isValid) {
    warnings.push({
      text:
        res.degenerateType === "undefined"
          ? `函数在 $x_0 = ${x0.toFixed(2)}$ 处无定义，超出定义域，无法计算切线。`
          : `函数在 $x_0 = ${x0.toFixed(2)}$ 处不可导（存在尖点、不连续点或切线为铅垂线 $x = ${x0.toFixed(2)}$）。`,
      level: "danger",
    });
  } else if (mode === "secant_limit" && !Number.isFinite(fy2)) {
    warnings.push({
      text: `割线点 $x_0 + \\Delta x = ${x2.toFixed(2)}$ 超出函数定义域，割线无法闭合。`,
      level: "warning",
    });
  } else if (Math.abs(res.slope) < 1e-6) {
    warnings.push({
      text: `切线斜率 $f'(x_0) = 0$，切线为水平直线 $y = ${res.fx.toFixed(2)}$，此处对应导数为零的点（可能为极值点或单调台阶点）。`,
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic: "导数即斜率，切线看切点；在点直接代，过点设参数。",
  };
}
