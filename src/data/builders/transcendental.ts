import type { MathPanelData } from "../types";
import {
  solveExpTangent,
  solveLogTangent,
  solveParamExpAx1,
  solveParamExpAx,
  type TranscendentalMode,
} from "@/math/transcendental";
import { MATH_COLORS } from "@/theme";

export function buildTranscendentalPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = ((config?.mode as string) || "exp") as TranscendentalMode;
  const x0 = params.x0 ?? 0;
  const a = params.a ?? 1.0;

  const isShift = (config?.subMode as string) === "shift_1";
  const isQuad = (config?.subMode as string) === "quadratic_bound";
  const presetKey = (config?.preset as string) || "free";
  const isTangent1Exp =
    (config?.subMode as string) === "tangent_1" || presetKey === "tangent_1";
  const isTangentELog =
    (config?.subMode as string) === "tangent_e" || presetKey === "tangent_e";
  const pColor = MATH_COLORS.paramPrimary;

  const quantities: MathPanelData["quantities"] = [];
  const warnings: MathPanelData["warnings"] = [];

  if (mode === "exp") {
    const resExp = solveExpTangent(x0);
    const shiftY0 = Math.exp(x0 - 1);

    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: isShift ? "平移曲线值" : "切点纵坐标",
        symbol: isShift ? "e^{x₀-1}" : "e^{x₀}",
        value: isShift ? shiftY0.toFixed(3) : resExp.y0.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "切线斜率",
        symbol: "f'(x₀)",
        value: isShift ? shiftY0.toFixed(3) : resExp.slope.toFixed(3),
        color: MATH_COLORS.tangentLine,
      },
    );

    if (isShift) {
      quantities.push({
        label: "平移放缩差值",
        symbol: "e^{x₀-1} - x₀",
        value: (shiftY0 - x0).toFixed(3),
        color: MATH_COLORS.labelText,
      });
    } else if (isTangent1Exp) {
      const tangentLineY = Math.E * x0;
      quantities.push(
        {
          label: "次级切线上界",
          symbol: "ex₀",
          value: tangentLineY.toFixed(3),
          color: MATH_COLORS.tangentLine,
        },
        {
          label: "次级放缩差值",
          symbol: "e^{x₀} - ex₀",
          value: (resExp.y0 - tangentLineY).toFixed(3),
          color: MATH_COLORS.labelText,
        },
      );
    } else {
      quantities.push({
        label: "基准下界差值",
        symbol: "e^{x₀} - (x₀ + 1)",
        value: (resExp.y0 - (x0 + 1)).toFixed(3),
        color: MATH_COLORS.labelText,
      });
    }
  } else if (mode === "log") {
    const resLog = solveLogTangent(x0);
    if (!resLog.isValid) {
      warnings.push({
        text: "对数函数定义域必须满足 x₀ > 0，当前切点无效！",
        level: "danger",
      });
    }

    const quadBound = 0.5 * (x0 * x0 - 1);
    const tangentEBound = x0 / Math.E;

    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "对数函数值",
        symbol: "\\ln(x₀)",
        value: resLog.isValid ? resLog.y0.toFixed(3) : "无定义",
        color: MATH_COLORS.function,
      },
    );

    if (isQuad) {
      quantities.push(
        {
          label: "二次放缩上界",
          symbol: "\\frac{x₀^2 - 1}{2}",
          value: resLog.isValid ? quadBound.toFixed(3) : "无定义",
          color: MATH_COLORS.functionTransformed,
        },
        {
          label: "二次逼近差值",
          symbol: "\\frac{x₀^2-1}{2} - \\ln x₀",
          value: resLog.isValid ? (quadBound - resLog.y0).toFixed(3) : "无定义",
          color: MATH_COLORS.labelText,
        },
      );
    } else if (isTangentELog) {
      quantities.push(
        {
          label: "次级切线上界",
          symbol: "\\frac{x₀}{e}",
          value: resLog.isValid ? tangentEBound.toFixed(3) : "无定义",
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "次级放缩差值",
          symbol: "\\frac{x₀}{e} - \\ln x₀",
          value: resLog.isValid
            ? (tangentEBound - resLog.y0).toFixed(3)
            : "无定义",
          color: MATH_COLORS.labelText,
        },
      );
    } else {
      quantities.push(
        {
          label: "线性切线上界",
          symbol: "x₀ - 1",
          value: resLog.isValid ? (x0 - 1).toFixed(3) : "无定义",
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "线性放缩差值",
          symbol: "(x₀ - 1) - \\ln x₀",
          value: resLog.isValid ? (x0 - 1 - resLog.y0).toFixed(3) : "无定义",
          color: MATH_COLORS.labelText,
        },
      );
    }
  } else if (mode === "chain") {
    const validChainX = x0 > 0 ? x0 : 1.0;
    const expVal = Math.exp(validChainX - 1);
    const logVal = Math.log(validChainX) + 1;
    quantities.push(
      {
        label: "自变量位置",
        symbol: "x",
        value: validChainX.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "指数上界",
        symbol: "e^{x-1}",
        value: expVal.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "中轴基准切线",
        symbol: "y = x",
        value: validChainX.toFixed(3),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "对数下界",
        symbol: "\\ln x + 1",
        value: logVal.toFixed(3),
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: "夹逼包络跨度",
        symbol: "e^{x-1} - (\\ln x + 1)",
        value: (expVal - logVal).toFixed(3),
        color: MATH_COLORS.labelText,
      },
    );
  } else if (mode === "param") {
    const subMode = (config?.subMode as string) || "exp_ax_1";
    const resAx1 = solveParamExpAx1(a);
    const resAx = solveParamExpAx(a);
    const isOverOrigin = subMode === "exp_ax";
    const activeRes = isOverOrigin ? resAx : resAx1;

    quantities.push(
      {
        label: "待定参数 a",
        symbol: "a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: isOverOrigin ? "e^x ≥ ax 过原点临界" : "e^x ≥ ax + 1 切线临界",
        symbol: "a_{临界}",
        value: isOverOrigin ? Math.E.toFixed(2) : "1.00",
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "与 e^x 交点个数",
        symbol: "N",
        value: `${activeRes.intersections} 个`,
        color:
          activeRes.status === "tangent"
            ? MATH_COLORS.paramPrimary
            : MATH_COLORS.labelText,
      },
    );

    if (isOverOrigin) {
      if (a > Math.E + 0.01) {
        warnings.push({
          text: `当前参数 a = ${a.toFixed(2)} > e ≈ 2.72，直线与 e^x 出现 2 个交点，e^x ≥ ax 不恒成立！`,
          level: "warning",
        });
      }
    } else {
      if (a > 1.0) {
        warnings.push({
          text: `当前参数 a = ${a.toFixed(2)} > 1.00，直线与 e^x 出现 2 个交点，e^x ≥ ax + 1 不恒成立！`,
          level: "warning",
        });
      }
    }
  }

  // 2. 定理精选：100% 隔离当前模式定理，彻底阻断跨模式污染
  const currentModeTheorems: MathPanelData["theorems"] = [];

  if (mode === "exp") {
    if (isShift) {
      currentModeTheorems.push({
        name: "指数平移切线放缩不等式",
        latex: `e^{x-1} \\ge x \\quad (x \\in \\mathbb{R})`,
        level: "core",
        prerequisites: [
          "f(x) = e^{x-1} 为下凸函数",
          "在切点 (1, 1) 处公切线为 y = x",
          "等号当且仅当 x = 1 时成立",
        ],
      });
    } else if (isTangent1Exp) {
      currentModeTheorems.push({
        name: "指数次级切线放缩不等式 (基准二)",
        latex: `e^x \\ge ex \\quad (x \\in \\mathbb{R})`,
        level: "core",
        prerequisites: [
          "过原点的切线相切于点 (1, e)",
          "切线斜率为 f'(1) = e",
          "等号当且仅当 x = 1 时成立",
        ],
      });
    } else {
      currentModeTheorems.push({
        name: "指数基准切线放缩不等式 (基准一)",
        latex: `e^x \\ge x + 1 \\quad (x \\in \\mathbb{R})`,
        level: "core",
        prerequisites: [
          "f(x) = e^x 为下凸函数",
          "在切点 (0, 1) 处切线为 y = x + 1",
          "等号当且仅当 x = 0 时成立",
        ],
      });
    }
  } else if (mode === "log") {
    if (isQuad) {
      currentModeTheorems.push({
        name: "对数二次上界放缩不等式",
        latex: `\\ln x \\le \\frac{x^2 - 1}{2} \\le x - 1 \\quad (x > 0)`,
        level: "core",
        prerequisites: [
          "利用切线进一步构造二次抛物线上界",
          "在 x > 1 时比线性切线更贴合对数曲线",
          "等号当且仅当 x = 1 时成立",
        ],
      });
    } else if (isTangentELog) {
      currentModeTheorems.push({
        name: "对数次级切线放缩不等式 (基准二)",
        latex: `\\ln x \\le \\frac{x}{e} \\quad (x > 0)`,
        level: "core",
        prerequisites: [
          "过原点的切线相切于点 (e, 1)",
          "切线斜率为 g'(e) = 1/e",
          "等号当且仅当 x = e 时成立",
        ],
      });
    } else {
      currentModeTheorems.push({
        name: "对数基准切线放缩不等式 (基准一)",
        latex: `\\ln x \\le x - 1 \\quad (x > 0)`,
        level: "core",
        prerequisites: [
          "g(x) = \\ln x 为上凸函数",
          "在切点 (1, 0) 处切线为 y = x - 1",
          "等号当且仅当 x = 1 时成立",
        ],
      });
    }
  } else if (mode === "chain") {
    currentModeTheorems.push({
      name: "双基准对偶链式夹逼不等式",
      latex: `\\ln x + 1 \\le x \\le e^{x-1} \\quad (x > 0)`,
      level: "core",
      prerequisites: [
        "e^{x-1} 与 \\ln x + 1 互为反函数",
        "在公共切点 (1, 1) 处公切线为 y = x",
        "等号当且仅当 x = 1 时三者取等",
      ],
    });
  } else if (mode === "param") {
    const isOverOrigin =
      (config?.subMode as string) === "exp_ax" || presetKey === "exp_ax_crit";
    if (isOverOrigin) {
      currentModeTheorems.push({
        name: "过原点切线临界求参定理",
        latex: `e^x \\ge \\color{${pColor}}{a} x \\iff \\color{${pColor}}{a} \\le e`,
        level: "core",
        prerequisites: [
          "过原点切线相切于点 (1, e)，切线斜率 a = e",
          "当 a \\le e 时直线恒在曲线下方",
          "当 a > e 时割线交于两点破坏恒成立",
        ],
      });
    } else if (presetKey === "horizontal") {
      currentModeTheorems.push({
        name: "水平基准切线定理",
        latex: `e^x \\ge 1 \\iff x \\ge 0`,
        level: "core",
        prerequisites: [
          "斜率 a = 0 时切线退化为水平线 y = 1",
          "利用指数函数单调递增性判定成立区间",
        ],
      });
    } else {
      currentModeTheorems.push({
        name: "定点切线临界求参定理",
        latex: `e^x \\ge \\color{${pColor}}{a} x + 1 \\iff \\color{${pColor}}{a} \\le 1`,
        level: "core",
        prerequisites: [
          "定点模型在 (0, 1) 处相切临界 a = 1",
          "斜率超过临界值产生双交点破坏恒成立",
        ],
      });
    }
  }

  // 3. 高考要点特化定制：模式专属，杜绝跨模式杂烩
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [];

  if (mode === "exp") {
    gaokaoPoints.push(
      {
        text: "【新高考通法·指数切线双基准】基准一 e^x ≥ x+1（切点 (0,1)）与基准二 e^x ≥ ex（切点 (1,e)），是高考导数不等式放缩与求参的核心工具。",
        importance: "gaokao",
      },
      {
        text: '凹凸性几何保障：指数函数 f"(x) = e^x > 0 恒成立（下凸函数），任意切线恒位于曲线下方，当且仅当切点处取等。',
        importance: "core",
      },
      {
        text: "泰勒一阶展开渊源：切线放缩本质上是函数在基准点处的一阶泰勒多项式逼近，具有局部最优线性逼近性质。",
        importance: "gaokao",
      },
      {
        text: "平移变体技巧：通过换元 t = x-1，可得对偶式 e^{x-1} ≥ x，常用于对齐线性多项式系数。",
        importance: "hard",
      },
    );
  } else if (mode === "log") {
    gaokaoPoints.push(
      {
        text: "【新高考通法·对数切线双基准】基准一 ln x ≤ x-1（切点 (1,0)）与基准二 ln x ≤ x/e（切点 (e,1)），常用于大题中消去对数超越项。",
        importance: "gaokao",
      },
      {
        text: '凹凸性几何保障：对数函数 g"(x) = -1/x² < 0 恒成立（上凸函数），切线恒位于曲线上方，当且仅当切点处取等。',
        importance: "core",
      },
      {
        text: "二次放缩进阶：当线性切线精度不足时，构造二次抛物线上界 ln x ≤ (x²-1)/2 在 x>1 时可提供更紧致的逼近包络。",
        importance: "hard",
      },
      {
        text: "定义域严谨性采分点：解答题中使用对数放缩必须首先声明定义域 x > 0，严禁未设定义域直接放缩。",
        importance: "gaokao",
      },
    );
  } else if (mode === "chain") {
    gaokaoPoints.push(
      {
        text: "【新高考通法·指对跨界拆分通法】题目中同时出现指数 e^x 与对数 ln x 混合项时，优先引入中轴线 y = x 作为中间桥梁进行双向独立放缩。",
        importance: "gaokao",
      },
      {
        text: "反函数几何对称：e^{x-1} 与 ln x + 1 互为反函数，关于直线 y = x 对称并在公共切点 (1,1) 处公切，形成完美双向夹逼包络。",
        importance: "core",
      },
      {
        text: "双向不等式链：ln x + 1 ≤ x ≤ e^{x-1} (x > 0)，三者等号当且仅当 x = 1 时同时成立。",
        importance: "hard",
      },
    );
  } else {
    gaokaoPoints.push(
      {
        text: "【新高考通法·相切临界与端点效应】恒成立求参问题中，曲线与参变直线的“相切”往往是恒成立与产生交点的临界分水岭。",
        importance: "gaokao",
      },
      {
        text: "定点系与原点系临界：过 (0,1) 直线 y = ax+1 临界斜率为 a = 1；过原点直线 y = ax 临界斜率为 a = e。",
        importance: "gaokao",
      },
      {
        text: "充分必要两步闭环：先由相切求出必要条件临界参数 a，再利用辅助函数单调性或凹凸性证明该参数范围充分恒成立。",
        importance: "core",
      },
    );
  }

  // 4. B 类高考压轴推导链 (严格三步闭环)
  let examAnchor = "新高考解答题 17/18 题 · 指数切线放缩与恒成立";
  let reasoningSteps: MathPanelData["reasoningSteps"] = [];

  if (mode === "exp") {
    examAnchor = "新高考解答题 17/18 题 · 指数切线放缩与恒成立";
    reasoningSteps = [
      {
        step: 1,
        title: "求导确定切线方程与切点",
        detail: isShift
          ? "函数 $f(x)=e^{x-1}$ 导数 $f'(x)=e^{x-1}$，切点 $(1,1)$ 处切线斜率 $k=1$，点斜式切线方程为 $y=x$。"
          : presetKey === "tangent_1"
            ? "函数 $f(x)=e^x$ 导数 $f'(x)=e^x$，过原点的切线切点为 $(1,e)$，切线方程为 $y=ex$。"
            : "函数 $f(x)=e^x$ 导数 $f'(x)=e^x$，在切点 $(0,1)$ 处的切线斜率 $f'(0)=1$，切线方程为 $y=x+1$。",
        latex: isShift
          ? "f'(1) = 1 \\implies y - 1 = 1 \\cdot (x - 1) \\implies y = x"
          : presetKey === "tangent_1"
            ? "f'(1) = e \\implies y = ex"
            : "f'(0) = 1 \\implies y - 1 = 1 \\cdot (x - 0) \\implies y = x + 1",
        rubric: "采分点：求导与切线方程列式（3分）",
      },
      {
        step: 2,
        title: "构造差值辅助函数分析单调性",
        detail: isShift
          ? "令 $h(x) = e^{x-1} - x$，导数 $h'(x) = e^{x-1} - 1$。当 $x < 1$ 时 $h'(x) < 0$；当 $x > 1$ 时 $h'(x) > 0$。"
          : presetKey === "tangent_1"
            ? "令 $h(x) = e^x - ex$，导数 $h'(x) = e^x - e$。当 $x < 1$ 时 $h'(x) < 0$；当 $x > 1$ 时 $h'(x) > 0$。"
            : "令 $h(x) = e^x - (x+1)$，求导得 $h'(x) = e^x - 1$。当 $x < 0$ 时 $h'(x) < 0$，$h(x)$ 单调递减；当 $x > 0$ 时 $h'(x) > 0$，$h(x)$ 单调递增。",
        latex: isShift
          ? "h'(x) = e^{x-1} - 1 \\implies x=1 \\text{ 为唯一极值点}"
          : presetKey === "tangent_1"
            ? "h'(x) = e^x - e \\implies x=1 \\text{ 为唯一极值点}"
            : "h'(x) = e^x - 1 = 0 \\iff x = 0",
        rubric: "采分点：辅助函数求导与极值符号讨论（4分）",
      },
      {
        step: 3,
        title: "极小值即最小值证明不等式",
        detail: isShift
          ? "所以 $h(x) \\ge h(1) = 0$，即 $e^{x-1} \\ge x$ 在 $\\mathbb{R}$ 上恒成立，等号当且仅当 $x=1$ 成立。"
          : presetKey === "tangent_1"
            ? "所以 $h(x) \\ge h(1) = 0$，即 $e^x \\ge ex$ 在 $\\mathbb{R}$ 上恒成立，等号当且仅当 $x=1$ 成立。"
            : "所以 $h(x) \\ge h(0) = e^0 - 1 = 0$，即 $e^x \\ge x + 1$ 在 $\\mathbb{R}$ 上恒成立，等号当且仅当 $x=0$ 成立。",
        latex: isShift
          ? "e^{x-1} \\ge x \\quad (x=1 \\text{ 取等})"
          : presetKey === "tangent_1"
            ? "e^x \\ge ex \\quad (x=1 \\text{ 取等})"
            : "e^x \\ge x + 1 \\quad (x=0 \\text{ 取等})",
        rubric: "采分点：最值判定与取等充要条件闭环（5分）",
      },
    ];
  } else if (mode === "log") {
    examAnchor = "新高考解答题 17/18 题 · 对数切线放缩与二次上界";
    reasoningSteps = [
      {
        step: 1,
        title: "确定定义域并求切点切线",
        detail:
          "对数函数 $g(x)=\\ln x$ 定义域为 $(0, +\\infty)$，求导得 $g'(x)=\\frac{1}{x}$。在切点 $(1,0)$ 处切线方程为 $y=x-1$。",
        latex:
          "g'(1) = 1 \\implies y - 0 = 1 \\cdot (x - 1) \\implies y = x - 1",
        rubric: "采分点：定义域交代与切线方程推导（3分）",
      },
      {
        step: 2,
        title: "构造差值函数判定单调性",
        detail: isQuad
          ? "构造 $H(x) = \\frac{x^2-1}{2} - \\ln x$，求导得 $H'(x) = x - \\frac{1}{x} = \\frac{x^2-1}{x}$。在 $(0,1)$ 上减，在 $(1,+\\infty)$ 上增。"
          : "构造 $h(x) = x - 1 - \\ln x$，求导得 $h'(x) = 1 - \\frac{1}{x} = \\frac{x-1}{x}$。在 $(0,1)$ 上递减，在 $(1,+\\infty)$ 上递增。",
        latex: isQuad
          ? "H'(x) = \\frac{(x-1)(x+1)}{x} \\implies x=1 \\text{ 为极小值点}"
          : "h'(x) = \\frac{x-1}{x} = 0 \\iff x = 1",
        rubric: "采分点：构造函数求导与极值分析（4分）",
      },
      {
        step: 3,
        title: "全局最值与二次上界闭环",
        detail: isQuad
          ? "因此 $H(x) \\ge H(1) = 0$，即 $\\ln x \\le \\frac{x^2-1}{2}$；且当 $x>1$ 时 $\\frac{x^2-1}{2} \\le x-1$ 亦成立。"
          : "因此 $h(x) \\ge h(1) = 0$，即 $\\ln x \\le x - 1$ 在 $(0,+\\infty)$ 恒成立，等号当且仅当 $x=1$ 取得。",
        latex: isQuad
          ? "\\ln x \\le \\frac{x^2-1}{2} \\le x - 1 \\quad (x>1)"
          : "\\ln x \\le x - 1 \\quad (x=1 \\text{ 取等})",
        rubric: "采分点：最值判定与不等式结论（5分）",
      },
    ];
  } else if (mode === "chain") {
    examAnchor = "新高考解答题 18 题压轴 · 指对跨界双向夹逼";
    reasoningSteps = [
      {
        step: 1,
        title: "识别反函数对称轴与公切线",
        detail:
          "曲线 $y=e^{x-1}$ 与 $y=\\ln x+1$ 互为反函数，图形关于直线 $y=x$ 对称，且在公共切点 $(1,1)$ 处公切线为 $y=x$。",
        latex:
          "(e^{x-1})'|_{x=1} = 1, \\quad (\\ln x+1)'|_{x=1} = 1 \\implies \\text{公切线 } y = x",
        rubric: "采分点：反函数对称性与公切关系判定（3分）",
      },
      {
        step: 2,
        title: "分别应用基准切线拆解双侧",
        detail:
          "由指数切线放缩 $e^t \\ge t+1$，令 $t=x-1$ 得 $e^{x-1} \\ge x$；由对数切线放缩 $\\ln x \\le x-1$ 得 $\\ln x+1 \\le x$。",
        latex:
          "\\begin{cases} e^{x-1} \\ge x \\\\ \\ln x + 1 \\le x \\end{cases} \\quad (x > 0)",
        rubric: "采分点：双侧独立放缩与变量代换（5分）",
      },
      {
        step: 3,
        title: "连接中轴线实现链式夹逼",
        detail:
          "联立两式即得 $\\ln x + 1 \\le x \\le e^{x-1}$ 在 $x \\in (0,+\\infty)$ 上恒成立，三者在 $x=1$ 时同时取等。",
        latex: "\\ln x + 1 \\le x \\le e^{x-1} \\quad (x=1 \\text{ 取等})",
        rubric: "采分点：链式不等式综合结论（4分）",
      },
    ];
  } else {
    examAnchor = "新高考解答题 17/18 题 · 切线临界求参与恒成立";
    const isOverOrigin =
      (config?.subMode as string) === "exp_ax" || presetKey === "exp_ax_crit";
    reasoningSteps = [
      {
        step: 1,
        title: "分析边界/相切临界必要条件",
        detail: isOverOrigin
          ? "设过原点的直线 $y=ax$ 与 $y=e^x$ 切于点 $(x_0, e^{x_0})$。由切线方程 $y-e^{x_0}=e^{x_0}(x-x_0)$ 代入原点解得 $x_0=1$，$a_{\\text{临界}}=e$。"
          : "直线 $y=ax+1$ 过定点 $(0,1)$，而曲线 $y=e^x$ 在 $(0,1)$ 处的切线斜率恰为 $f'(0)=1$，因此临界斜率为 $a=1$。",
        latex: isOverOrigin
          ? "-e^{x_0} = -e^{x_0} x_0 \\iff x_0 = 1 \\implies a = e"
          : "f'(0) = 1 \\implies a_{\\text{临界}} = 1",
        rubric: "采分点：求出相切临界参数值（4分）",
      },
      {
        step: 2,
        title: "充分性验证与凹凸性保证",
        detail: isOverOrigin
          ? "当 $a \\le e$ 时，由 $e^x \\ge ex \\ge ax$ ($x>0$) 知不等式恒成立；当 $a > e$ 时割线穿过曲线必有两个交点，破坏恒成立。"
          : "当 $a \\le 1$ 时，$e^x \\ge x+1 \\ge ax+1$ 恒成立；当 $a > 1$ 时，由导数局部符号知在 $x<0$ 邻域内存在 $e^x < ax+1$。",
        latex: isOverOrigin
          ? "a \\le e \\implies e^x \\ge ax \\quad (x>0)"
          : "a \\le 1 \\implies e^x \\ge ax + 1 \\quad (x \\in \\mathbb{R})",
        rubric: "采分点：充分性与必要性分类说明（5分）",
      },
      {
        step: 3,
        title: "得出参数最终范围",
        detail: isOverOrigin
          ? "综上所述，使 $e^x \\ge ax$ 恒成立的参数 $a$ 取值范围为 $(-\\infty, e]$。"
          : "综上所述，使 $e^x \\ge ax+1$ 恒成立的参数 $a$ 取值范围为 $(-\\infty, 1]$。",
        latex: isOverOrigin ? "a \\in (-\\infty, e]" : "a \\in (-\\infty, 1]",
        rubric: "采分点：最终参数范围结论（3分）",
      },
    ];
  }

  return {
    quantities,
    theorems: currentModeTheorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic:
      "指数切线 x 加一，对数切线 x 减一；凹凸决定上与下，相切即是临界点。",
  };
}
