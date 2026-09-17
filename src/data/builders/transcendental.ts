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
        label: "放缩包络跨度",
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
        label: isOverOrigin
          ? "$e^x ≥ ax$ 过原点临界"
          : "$e^x ≥ ax + 1$ 切线临界",
        symbol: "a_{临界}",
        value: isOverOrigin ? Math.E.toFixed(2) : "1.00",
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "与 $e^x$ 交点个数",
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
          "构造差函数 $F(x)=e^{x-1}-x$ 并求导判号，得 $F(x) \\ge 0$ 恒成立",
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
          "构造差函数 $F(x)=e^x-(x+1)$ 并求导判号，得 $F(x) \\ge 0$ 恒成立",
          "在切点 (0, 1) 处切线为 y = x + 1",
          "等号当且仅当 x = 0 时成立",
        ],
      });
    }
  } else if (mode === "log") {
    if (isQuad) {
      currentModeTheorems.push({
        name: "对数二次上界放缩不等式",
        latex: `\\ln x \\le \\frac{x^2 - 1}{2} \\quad (x > 0)`,
        level: "core",
        prerequisites: [
          "由切点 (1,0) 处的切线进一步构造二次抛物线上界",
          "二次曲线 $y = (x^2 - 1)/2$ 与 $y = ln x$ 在 $x = 1$ 处相切",
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
          "构造差函数 $G(x)=\\ln x-(x-1)$ 并求导判号，得 $G(x) \\le 0$ 恒成立",
          "在切点 (1, 0) 处切线为 y = x - 1",
          "等号当且仅当 x = 1 时成立",
        ],
      });
    }
  } else if (mode === "chain") {
    currentModeTheorems.push({
      name: "双基准对偶链式放缩不等式",
      latex: `\\ln x + 1 \\le x \\le e^{x-1} \\quad (x > 0)`,
      level: "core",
      prerequisites: [
        "$e^{x-1}$ 与 $\\ln x + 1$ 互为反函数",
        "在公共切点 (1, 1) 处公切线为 y = x",
        "等号当且仅当 x = 1 时三者取等",
      ],
    });
  } else if (mode === "param") {
    const isOverOrigin =
      (config?.subMode as string) === "exp_ax" || presetKey === "exp_ax_crit";
    if (isOverOrigin) {
      currentModeTheorems.push({
        name: "过原点切线临界求参定理 (x > 0)",
        latex: `e^x \\ge \\color{${pColor}}{a} x \\iff \\color{${pColor}}{a} \\le e \\quad (x > 0)`,
        level: "core",
        prerequisites: [
          "过原点切线相切于点 (1, e)，切线斜率 a = e",
          "当 $a \\le e$ 且 $x > 0$ 时动直线恒在曲线下方",
          "当 a > e 时在 $x > 0$ 区域割线交于两点破坏恒成立",
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
        name: "定点切线临界求参定理 (x ≥ 0)",
        latex: `e^x \\ge \\color{${pColor}}{a} x + 1 \\iff \\color{${pColor}}{a} \\le 1 \\quad (x \\ge 0)`,
        level: "core",
        prerequisites: [
          "定点模型在 (0, 1) 处相切临界 a = 1",
          "非负区间 $x \\ge 0$ 上 $a \\le 1$ 充要恒成立；全域 $\\mathbb{R}$ 上仅 $a=1$ 成立",
        ],
      });
    }
  }

  // 3. 高考要点特化定制：模式专属，杜绝跨模式杂烩
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [];

  if (mode === "exp") {
    gaokaoPoints.push(
      {
        text: "【新高考通法·指数切线双基准】基准一 $e^x ≥ x+1$（切点 $(0,1)$）与基准二 $e^x ≥ ex$（切点 $(1,e)$），是高考导数不等式放缩与求参的核心工具。",
        importance: "gaokao",
      },
      {
        text: "切线位置保障：指数函数图象上任意一点处的切线恒位于曲线下方，当且仅当切点处取等（构造函数 $g(x)=e^x-(x+1)$ 求导得 $g(x)\\ge 0$ 可证）。",
        importance: "core",
      },
      {
        text: "局部线性逼近：切线放缩本质上是函数在基准点处的最佳局部线性逼近（只看一阶变化率），不涉及高阶展开。",
        importance: "core",
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
        text: "切线位置保障：对数函数图象上任意一点处的切线恒位于曲线上方，当且仅当切点处取等（构造函数 $h(x)=(x-1)-\\ln x$ 求导得 $h(x)\\ge 0$ 可证）。",
        importance: "core",
      },
      {
        text: "二次放缩进阶：当线性切线精度不足时，构造二次抛物线上界 ln x ≤ (x²-1)/2 在 x>1 时可提供更贴近的逼近包络。",
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
        text: "【新高考通法·指对跨界拆分通法】题目中同时出现指数 $e^x$ 与对数 $ln x$ 混合项时，优先引入中轴线 $y = x$ 作为中间桥梁进行双向独立放缩。",
        importance: "gaokao",
      },
      {
        text: "反函数几何对称：e^{x-1} 与 ln x + 1 互为反函数，关于直线 y = x 对称并在公共切点 (1,1) 处公切，形成完美双向放缩包络。",
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
        text: "充分必要两步闭环：先由相切求出必要条件临界参数 a，再利用辅助函数的单调性或图象位置关系证明该参数范围充分恒成立。",
        importance: "core",
      },
    );
  }

  // 4. B 类高考压轴推导链 (严格三步闭环：审题定法 -> 建模展开 -> 求解反思)
  let examAnchor = "新高考解答题 17/18 题 · 指数切线放缩与恒成立";
  let reasoningSteps: MathPanelData["reasoningSteps"] = [];

  if (mode === "exp") {
    examAnchor = "新高考解答题 17/18 题 · 指数切线放缩与恒成立";
    if (isShift) {
      reasoningSteps = [
        {
          step: 1,
          title: "求导确定切线方程与切点",
          detail:
            "函数 $f(x)=e^{x-1}$ 导数 $f'(x)=e^{x-1}$。代入切点横坐标 $x_0=1$ 得切线斜率 $k=f'(1)=e^{1-1}=1$。由点斜式切线方程代入切点 $(1,1)$ 展开得 $y=x$。",
          latex:
            "f'(1) = e^0 = 1 \\implies y - 1 = 1 \\cdot (x - 1) \\implies y = x",
          rubric: "采分点：求导与点斜式切线方程列式（3分）",
        },
        {
          step: 2,
          title: "构造差值辅助函数分析单调性",
          detail:
            "令 $h(x) = e^{x-1} - x$，求导得 $h'(x) = e^{x-1} - 1$。令 $h'(x) = 0 \\iff e^{x-1} = 1 \\iff x = 1$。当 $x < 1$ 时 $h'(x) < 0$，$h(x)$ 单调递减；当 $x > 1$ 时 $h'(x) > 0$，$h(x)$ 单调递增。",
          latex:
            "h'(x) = e^{x-1} - 1 = 0 \\iff x = 1 \\implies x = 1 \\text{ 为唯一极小值点}",
          rubric: "采分点：辅助函数求导与极值符号讨论（4分）",
        },
        {
          step: 3,
          title: "极小值即最小值证明不等式",
          detail:
            "由于 $x=1$ 为唯一极小值点，故在 $\\mathbb{R}$ 上 $h(x) \\ge h(1) = e^{1-1} - 1 = 0$。即 $e^{x-1} \\ge x$ 在 $\\mathbb{R}$ 上恒成立，等号当且仅当 $x=1$ 成立。",
          latex:
            "h(x) \\ge h(1) = 0 \\implies e^{x-1} \\ge x \\quad (x = 1 \\text{ 取等})",
          rubric: "采分点：最值判定与取等充要条件闭环（5分）",
        },
      ];
    } else if (isTangent1Exp) {
      reasoningSteps = [
        {
          step: 1,
          title: "设切点并求过原点切线方程",
          detail:
            "设切点为 $(x_0, e^{x_0})$，函数 $f(x)=e^x$ 导数 $f'(x_0)=e^{x_0}$。点斜式切线方程为 $y - e^{x_0} = e^{x_0}(x - x_0)$。将原点 $(0,0)$ 代入得 $-e^{x_0} = -x_0 e^{x_0} \\implies x_0 = 1$。切点为 $(1,e)$，切线方程为 $y - e = e(x - 1) \\implies y = ex$。",
          latex: "-e^{x_0} = -x_0 e^{x_0} \\implies x_0 = 1 \\implies y = ex",
          rubric: "采分点：切点解算与切线方程确立（4分）",
        },
        {
          step: 2,
          title: "构造差值辅助函数求导讨论",
          detail:
            "构造差值函数 $h(x) = e^x - ex$，求导得 $h'(x) = e^x - e$。令 $h'(x) = 0 \\iff e^x = e \\iff x = 1$。当 $x < 1$ 时 $h'(x) < 0$，$h(x)$ 单调递减；当 $x > 1$ 时 $h'(x) > 0$，$h(x)$ 单调递增。",
          latex:
            "h'(x) = e^x - e = 0 \\iff x = 1 \\implies x = 1 \\text{ 为唯一极值点}",
          rubric: "采分点：差函数导数与单调性分析（4分）",
        },
        {
          step: 3,
          title: "极小值代入闭环证明基准二",
          detail:
            "由单调性知 $x=1$ 为全局最小值点，故 $h(x) \\ge h(1) = e^1 - e \\cdot 1 = 0$。即 $e^x \\ge ex$ 在 $\\mathbb{R}$ 上恒成立，等号当且仅当 $x=1$ 成立。",
          latex:
            "h(x) \\ge h(1) = 0 \\implies e^x \\ge ex \\quad (x = 1 \\text{ 取等})",
          rubric: "采分点：代入验算与等号条件确认（4分）",
        },
      ];
    } else if (presetKey === "free") {
      reasoningSteps = [
        {
          step: 1,
          title: "建立动切点点斜式切线方程",
          detail:
            "动切点 $P(x_0, e^{x_0})$ 处导数 $f'(x_0)=e^{x_0}$。点斜式方程为 $y - e^{x_0} = e^{x_0}(x - x_0) \\implies y = e^{x_0}x + e^{x_0}(1 - x_0)$。",
          latex:
            "y - e^{x_0} = e^{x_0}(x - x_0) \\implies y = e^{x_0}x + e^{x_0}(1 - x_0)",
          rubric: "采分点：参变切线建立（3分）",
        },
        {
          step: 2,
          title: "构造通径差函数并求导分析",
          detail:
            "令 $F(x) = e^x - [e^{x_0}(x - x_0) + e^{x_0}]$，求导得 $F'(x) = e^x - e^{x_0}$。当 $x < x_0$ 时 $F'(x) < 0$；当 $x > x_0$ 时 $F'(x) > 0$。$x = x_0$ 为唯一驻点与极小值点。",
          latex: "F'(x) = e^x - e^{x_0} = 0 \\iff x = x_0",
          rubric: "采分点：通式差函数求导（4分）",
        },
        {
          step: 3,
          title: "证明任意切线均为全局线性下界",
          detail:
            "由极小值即最小值知 $F(x) \\ge F(x_0) = e^{x_0} - e^{x_0} = 0$。故任意点处的切线恒位于指数曲线下方，切线下界结论成立。",
          latex:
            "e^x \\ge e^{x_0}(x - x_0) + e^{x_0} \\quad (x = x_0 \\text{ 取等})",
          rubric: "采分点：切线下界结论与取等条件（5分）",
        },
      ];
    } else {
      // 默认基准一 tangent_0
      reasoningSteps = [
        {
          step: 1,
          title: "求导确定切点与点斜式切线",
          detail:
            "函数 $f(x)=e^x$ 导数 $f'(x)=e^x$。在切点 $(0,1)$ 处切线斜率 $f'(0)=e^0=1$。点斜式切线方程为 $y - 1 = 1 \\cdot (x - 0) \\implies y = x + 1$。",
          latex:
            "f'(0) = e^0 = 1 \\implies y - 1 = 1 \\cdot (x - 0) \\implies y = x + 1",
          rubric: "采分点：求导与切线方程列式（3分）",
        },
        {
          step: 2,
          title: "构造差值辅助函数分析单调性",
          detail:
            "令 $h(x) = e^x - (x+1)$，求导得 $h'(x) = e^x - 1$。令 $h'(x) = 0 \\iff e^x = 1 \\iff x = 0$。当 $x < 0$ 时 $h'(x) < 0$，$h(x)$ 单调递减；当 $x > 0$ 时 $h'(x) > 0$，$h(x)$ 单调递增。",
          latex: "h'(x) = e^x - 1 = 0 \\iff x = 0",
          rubric: "采分点：辅助函数求导与极值符号讨论（4分）",
        },
        {
          step: 3,
          title: "极小值即最小值证明基准一",
          detail:
            "所以 $h(x) \\ge h(0) = e^0 - (0 + 1) = 0$，即 $e^x \\ge x + 1$ 在 $\\mathbb{R}$ 上恒成立，等号当且仅当 $x=0$ 成立。",
          latex:
            "h(x) \\ge h(0) = 0 \\implies e^x \\ge x + 1 \\quad (x = 0 \\text{ 取等})",
          rubric: "采分点：最值判定与取等充要条件闭环（5分）",
        },
      ];
    }
  } else if (mode === "log") {
    examAnchor = "新高考解答题 17/18 题 · 对数切线放缩与二次上界";
    if (isQuad) {
      reasoningSteps = [
        {
          step: 1,
          title: "在切点处构造相切二次抛物线",
          detail:
            "在切点 $(1,0)$ 处构造二次函数 $Q(x) = \\frac{x^2-1}{2}$，其在 $x=1$ 处的函数值 $Q(1)=0$ 且切线斜率 $Q'(1)=1$，与对数曲线 $g(x)=\\ln x$ 在 $(1,0)$ 处同切相切。",
          latex: "Q(1) = \\frac{1-1}{2} = 0 = \\ln 1, \\quad Q'(1) = 1 = g'(1)",
          rubric: "采分点：相切二次多项式构造（3分）",
        },
        {
          step: 2,
          title: "构造差值函数因式分解判定单调性",
          detail:
            "构造 $H(x) = \\frac{x^2-1}{2} - \\ln x$ ($x > 0$)，求导得 $H'(x) = x - \\frac{1}{x} = \\frac{x^2-1}{x} = \\frac{(x-1)(x+1)}{x}$。由于 $x > 0$，因式 $x+1 > 0$。当 $0 < x < 1$ 时 $H'(x) < 0$；当 $x > 1$ 时 $H'(x) > 0$。",
          latex: "H'(x) = \\frac{(x-1)(x+1)}{x} = 0 \\iff x = 1",
          rubric: "采分点：构造函数因式求导与符号分析（5分）",
        },
        {
          step: 3,
          title: "得出二次精细上界与逼近精度结论",
          detail:
            "由于 $x=1$ 为唯一极小值点，故 $H(x) \\ge H(1) = \\frac{1-1}{2} - \\ln 1 = 0$，即 $\\ln x \\le \\frac{x^2-1}{2}$ 在 $(0,+\\infty)$ 恒成立，等号当且仅当 $x=1$ 取得；且在 $x>1$ 时该二次上界比一次切线更贴合。",
          latex:
            "H(x) \\ge H(1) = 0 \\implies \\ln x \\le \\frac{x^2-1}{2} \\quad (x = 1 \\text{ 取等})",
          rubric: "采分点：最值闭环与精度反思（4分）",
        },
      ];
    } else if (isTangentELog) {
      reasoningSteps = [
        {
          step: 1,
          title: "求解过原点的对数曲线切线方程",
          detail:
            "设过原点的切线切点为 $(x_0, \\ln x_0)$ ($x_0 > 0$)，导数 $g'(x_0) = \\frac{1}{x_0}$。点斜式切线方程为 $y - \\ln x_0 = \\frac{1}{x_0}(x - x_0)$。代入原点 $(0,0)$ 得 $-\\ln x_0 = -1 \\implies x_0 = e$。切点为 $(e,1)$，切线方程为 $y - 1 = \\frac{1}{e}(x - e) \\implies y = \\frac{x}{e}$。",
          latex: "-\\ln x_0 = -1 \\implies x_0 = e \\implies y = \\frac{x}{e}",
          rubric: "采分点：代入原点解算临界切点（4分）",
        },
        {
          step: 2,
          title: "构造差值函数分析单调性与极值",
          detail:
            "构造差值函数 $\\varphi(x) = \\frac{x}{e} - \\ln x$ ($x > 0$)，求导得 $\\varphi'(x) = \\frac{1}{e} - \\frac{1}{x} = \\frac{x - e}{ex}$。令 $\\varphi'(x) = 0 \\iff x = e$。当 $0 < x < e$ 时 $\\varphi'(x) < 0$；当 $x > e$ 时 $\\varphi'(x) > 0$。",
          latex: "\\varphi'(x) = \\frac{x - e}{ex} = 0 \\iff x = e",
          rubric: "采分点：差值函数单调性论证（4分）",
        },
        {
          step: 3,
          title: "代入极值证明次级基准不等式",
          detail:
            "因 $x=e$ 为唯一极小值点，故在 $(0,+\\infty)$ 上 $\\varphi(x) \\ge \\varphi(e) = \\frac{e}{e} - \\ln e = 1 - 1 = 0$。即 $\\ln x \\le \\frac{x}{e}$ 恒成立，等号当且仅当 $x=e$ 成立。",
          latex:
            "\\varphi(x) \\ge \\varphi(e) = 0 \\implies \\ln x \\le \\frac{x}{e} \\quad (x = e \\text{ 取等})",
          rubric: "采分点：最值代入与取等条件闭环（4分）",
        },
      ];
    } else if (presetKey === "free") {
      reasoningSteps = [
        {
          step: 1,
          title: "建立对数曲线动切线方程",
          detail:
            "动切点 $P(x_0, \\ln x_0)$ ($x_0 > 0$) 处切线点斜式为 $y - \\ln x_0 = \\frac{1}{x_0}(x - x_0) \\implies y = \\frac{1}{x_0}x + \\ln x_0 - 1$。",
          latex:
            "y - \\ln x_0 = \\frac{1}{x_0}(x - x_0) \\implies y = \\frac{1}{x_0}x + \\ln x_0 - 1",
          rubric: "采分点：对数动切线方程（3分）",
        },
        {
          step: 2,
          title: "构造差函数求导讨论极值点",
          detail:
            "令 $F(x) = \\left[\\frac{1}{x_0}x + \\ln x_0 - 1\\right] - \\ln x$ ($x > 0$)，求导得 $F'(x) = \\frac{1}{x_0} - \\frac{1}{x} = \\frac{x - x_0}{x_0 x}$。当 $0 < x < x_0$ 时 $F'(x) < 0$；当 $x > x_0$ 时 $F'(x) > 0$。",
          latex: "F'(x) = \\frac{x - x_0}{x_0 x} = 0 \\iff x = x_0",
          rubric: "采分点：差函数导数与单调性分析（4分）",
        },
        {
          step: 3,
          title: "证明任意切线均为全局线性上界",
          detail:
            "由 $F(x) \\ge F(x_0) = 0$ 知对数函数任意点处的切线均位于曲线上方，等号当且仅当 $x=x_0$ 取得，切线上界结论成立。",
          latex:
            "\\ln x \\le \\frac{1}{x_0}x + \\ln x_0 - 1 \\quad (x = x_0 \\text{ 取等})",
          rubric: "采分点：切线上界结论与取等条件（5分）",
        },
      ];
    } else {
      // 默认对数基准一 tangent_1
      reasoningSteps = [
        {
          step: 1,
          title: "确定定义域并求基准切线方程",
          detail:
            "对数函数 $g(x)=\\ln x$ 定义域为 $(0, +\\infty)$，求导得 $g'(x)=\\frac{1}{x}$。在切点 $(1,0)$ 处切线斜率 $g'(1)=\\frac{1}{1}=1$。点斜式展开：$y - 0 = 1 \\cdot (x - 1) \\implies y = x - 1$。",
          latex:
            "g'(1) = 1 \\implies y - 0 = 1 \\cdot (x - 1) \\implies y = x - 1",
          rubric: "采分点：定义域交代与切线方程推导（3分）",
        },
        {
          step: 2,
          title: "构造差值函数判定单调性",
          detail:
            "构造差值函数 $h(x) = x - 1 - \\ln x$ ($x > 0$)，求导得 $h'(x) = 1 - \\frac{1}{x} = \\frac{x-1}{x}$。当 $0 < x < 1$ 时 $h'(x) < 0$；当 $x > 1$ 时 $h'(x) > 0$。",
          latex: "h'(x) = \\frac{x-1}{x} = 0 \\iff x = 1",
          rubric: "采分点：构造函数求导与极值分析（4分）",
        },
        {
          step: 3,
          title: "全局最值代入闭环证明基准一",
          detail:
            "由于 $x=1$ 为唯一极小值点，故在 $(0,+\\infty)$ 上 $h(x) \\ge h(1) = 1 - 1 - \\ln 1 = 0$。即 $\\ln x \\le x - 1$ 恒成立，等号当且仅当 $x=1$ 取得。",
          latex:
            "h(x) \\ge h(1) = 0 \\implies \\ln x \\le x - 1 \\quad (x = 1 \\text{ 取等})",
          rubric: "采分点：最值判定与不等式结论（5分）",
        },
      ];
    }
  } else if (mode === "chain") {
    examAnchor = "新高考解答题 18 题压轴 · 指对跨界双向放缩";
    if (presetKey === "pos_2") {
      reasoningSteps = [
        {
          step: 1,
          title: "计算右侧观察点三函数取值",
          detail:
            "代入考察点 $x=2$，上界指数曲线值为 $y_1 = e^{2-1} = e \\approx 2.718$；中轴切线值为 $y_2 = 2$；下界对数曲线值为 $y_3 = \\ln 2 + 1 \\approx 1.693$。",
          latex:
            "x = 2 \\implies e^{2-1} = e \\approx 2.718, \\quad \\ln 2 + 1 \\approx 1.693",
          rubric: "采分点：各特征值准确计算（3分）",
        },
        {
          step: 2,
          title: "计算双侧放缩差值并比较精度",
          detail:
            "上界指数差值为 $\\Delta_1 = e^{x-1} - x = e - 2 \\approx 0.718$；下界对数差值为 $\\Delta_2 = x - (\\ln x + 1) = 1 - \\ln 2 \\approx 0.307$。计算表明 $\\Delta_2 < \\Delta_1$。",
          latex:
            "\\Delta_1 = e - 2 \\approx 0.718, \\quad \\Delta_2 = 1 - \\ln 2 \\approx 0.307 \\implies \\Delta_2 < \\Delta_1",
          rubric: "采分点：代数差值列式与大小比较（5分）",
        },
        {
          step: 3,
          title: "高考大题单侧放缩选型反思",
          detail:
            "在区间 $x > 1$ 上，对数下界曲线比指数上界更紧密贴合中轴线 $y=x$。在证明高次代数混合不等式时，优先选用紧度更高的单侧以避免放缩过宽导致失败。",
          latex: "x - (\\ln x + 1) < e^{x-1} - x \\quad (x > 1)",
          rubric: "采分点：放缩紧度分析与答题建议（4分）",
        },
      ];
    } else if (presetKey === "pos_half") {
      reasoningSteps = [
        {
          step: 1,
          title: "计算左侧趋零点三函数取值",
          detail:
            "代入考察点 $x=0.5$，上界指数曲线值为 $y_1 = e^{0.5-1} = e^{-0.5} \\approx 0.607$；中轴线值为 $y_2 = 0.5$；下界对数曲线值为 $y_3 = \\ln 0.5 + 1 = 1 - \\ln 2 \\approx 0.307$。",
          latex:
            "x = 0.5 \\implies e^{-0.5} \\approx 0.607, \\quad \\ln 0.5 + 1 \\approx 0.307",
          rubric: "采分点：趋近零点特征值列式（3分）",
        },
        {
          step: 2,
          title: "分析双侧卡位跨度与包络裕度",
          detail:
            "指数差值 $\\Delta_1 = e^{-0.5} - 0.5 \\approx 0.107$；对数差值 $\\Delta_2 = 0.5 - (1 - \\ln 2) \\approx 0.193$。双侧差值均控制在极小范围内，包络跨度仅约为 $0.300$。",
          latex:
            "\\text{包络跨度 } \\Delta = e^{-0.5} - (\\ln 0.5 + 1) \\approx 0.300",
          rubric: "采分点：双向包络误差分析（5分）",
        },
        {
          step: 3,
          title: "应用介值定理实现零点快速卡位",
          detail:
            "在 $(0,1)$ 区间内，利用对偶双向放缩将复杂超越项夹在一次代数式之间，结合零点存在性定理可快速锁定极值点或隐零点的狭窄区间。",
          latex: "\\ln x + 1 \\le x \\le e^{x-1} \\quad (x \\in (0,1))",
          rubric: "采分点：零点存在性综合应用结论（4分）",
        },
      ];
    } else if (presetKey === "free") {
      reasoningSteps = [
        {
          step: 1,
          title: "计算当前自变量位置的三函数值",
          detail:
            "当前自变量 $x$ 处，指数曲线值为 $e^{x-1}$，中轴线值为 $x$，对数曲线值为 $\\ln x + 1$ ($x > 0$)。",
          latex:
            "y_{\\text{上}} = e^{x-1}, \\quad y_{\\text{中}} = x, \\quad y_{\\text{下}} = \\ln x + 1",
          rubric: "采分点：当前点函数值列式（3分）",
        },
        {
          step: 2,
          title: "验证双向放缩链成立性",
          detail:
            "由基准放缩 $e^{x-1} \\ge x$ 与 $x \\ge \\ln x + 1$ 得链式不等式 $\\ln x + 1 \\le x \\le e^{x-1}$。计算当前包络跨度 $\\Delta = e^{x-1} - (\\ln x + 1) \\ge 0$。",
          latex: "\\Delta(x) = e^{x-1} - (\\ln x + 1) \\ge 0 \\quad (x > 0)",
          rubric: "采分点：链式不等式验证（4分）",
        },
        {
          step: 3,
          title: "三线合一公共切点最值闭环",
          detail:
            "包络跨度 $\\Delta(x)$ 在 $x=1$ 处取得唯一全局最小值 $\\Delta(1) = e^0 - (\\ln 1 + 1) = 1 - 1 = 0$。三曲线在 $(1,1)$ 公切合一。",
          latex: "\\Delta(x) \\ge \\Delta(1) = 0 \\quad (x = 1 \\text{ 取等})",
          rubric: "采分点：公切合一最值结论（5分）",
        },
      ];
    } else {
      // 默认 tangent_1
      reasoningSteps = [
        {
          step: 1,
          title: "识别反函数对称轴与公切线",
          detail:
            "曲线 $y=e^{x-1}$ 与 $y=\\ln x+1$ 互为反函数，图形关于直线 $y=x$ 对称。求导得 $(e^{x-1})'|_{x=1} = e^0 = 1$，$(\\ln x+1)'|_{x=1} = \\frac{1}{1} = 1$。公共切点为 $(1,1)$，公切线为 $y=x$。",
          latex:
            "(e^{x-1})'|_{x=1} = 1, \\quad (\\ln x+1)'|_{x=1} = 1 \\implies \\text{公切线 } y = x",
          rubric: "采分点：反函数对称性与公切关系判定（3分）",
        },
        {
          step: 2,
          title: "分别应用基准切线拆解双侧",
          detail:
            "由指数切线放缩 $e^t \\ge t+1$，令 $t=x-1$ 得 $e^{x-1} \\ge x$；由对数切线放缩 $\\ln x \\le x-1$ 两边加 1 得 $\\ln x+1 \\le x$ ($x > 0$)。",
          latex:
            "\\begin{cases} e^{x-1} \\ge x \\\\ \\ln x + 1 \\le x \\end{cases} \\quad (x > 0)",
          rubric: "采分点：双侧独立放缩与变量代换（5分）",
        },
        {
          step: 3,
          title: "连接中轴线实现链式放缩",
          detail:
            "联立两式即得 $\\ln x + 1 \\le x \\le e^{x-1}$ 在 $x \\in (0,+\\infty)$ 上恒成立，三者在公共切点 $x=1$ 处同时取等号。",
          latex: "\\ln x + 1 \\le x \\le e^{x-1} \\quad (x = 1 \\text{ 取等})",
          rubric: "采分点：链式不等式综合结论（4分）",
        },
      ];
    }
  } else {
    examAnchor = "新高考解答题 17/18 题 · 切线临界求参与恒成立";
    const isOverOrigin =
      (config?.subMode as string) === "exp_ax" || presetKey === "exp_ax_crit";

    if (presetKey === "horizontal") {
      reasoningSteps = [
        {
          step: 1,
          title: "确立水平割线方程与切点交点",
          detail:
            "斜率参数 $a=0$ 时，直线方程退化为水平基准线 $y = 0 \\cdot x + 1 = 1$。曲线与直线交于定点 $(0,1)$，所求不等式为 $e^x \\ge 1$。",
          latex: "a = 0 \\implies y = 1 \\implies e^x \\ge 1",
          rubric: "采分点：特殊参数模型列式（3分）",
        },
        {
          step: 2,
          title: "利用指数单调性直接求解解集",
          detail:
            "由于底数 $e > 1$，指数函数 $f(x)=e^x$ 在 $\\mathbb{R}$ 上单调递增，且 $e^0 = 1$。由 $e^x \\ge e^0$ 依单调性直接解得 $x \\ge 0$。",
          latex: "e^x \\ge e^0 \\iff x \\ge 0",
          rubric: "采分点：指数函数单调性求解（5分）",
        },
        {
          step: 3,
          title: "数形结合验证交点与位置特征",
          detail:
            "当 $x < 0$ 时，曲线位于水平线下方（$e^x < 1$）；当 $x \\ge 0$ 时，曲线位于水平线上方（$e^x \\ge 1$）。故 $e^x \\ge 1$ 在 $\\mathbb{R}$ 上的解集为 $[0, +\\infty)$。",
          latex: "x \\in [0, +\\infty) \\quad (x = 0 \\text{ 取等})",
          rubric: "采分点：区间结论与图形位置闭环（4分）",
        },
      ];
    } else if (isOverOrigin) {
      reasoningSteps = [
        {
          step: 1,
          title: "分析边界相切临界必要条件",
          detail:
            "设过原点的直线 $y=ax$ 与 $y=e^x$ 切于点 $(x_0, e^{x_0})$。由切线方程 $y-e^{x_0}=e^{x_0}(x-x_0)$ 代入原点解得 $-e^{x_0} = -x_0 e^{x_0} \\implies x_0=1$，$a_{\\text{临界}}=e$。",
          latex:
            "-e^{x_0} = -x_0 e^{x_0} \\iff x_0 = 1 \\implies a_{\\text{临界}} = e",
          rubric: "采分点：求出相切临界参数值（4分）",
        },
        {
          step: 2,
          title: "分离参数法单调性与充分性证明",
          detail:
            "对任意 $x > 0$，$e^x \\ge ax \\iff a \\le \\frac{e^x}{x}$。令 $g(x) = \\frac{e^x}{x}$ ($x > 0$)，求导得 $g'(x) = \\frac{e^x(x-1)}{x^2}$。当 $0 < x < 1$ 时 $g'(x) < 0$；当 $x > 1$ 时 $g'(x) > 0$。$x=1$ 为极小值点。",
          latex: "g'(x) = \\frac{e^x(x-1)}{x^2} = 0 \\iff x = 1",
          rubric: "采分点：分离参数求导单调性分析（5分）",
        },
        {
          step: 3,
          title: "最值代入得出参数最终范围",
          detail:
            "函数 $g(x)$ 在 $x=1$ 处取得最小值 $g(1) = \\frac{e^1}{1} = e$。故充要条件为 $a \\le g(x)_{\\min} = e$。对任意 $x > 0$ 使 $e^x \\ge ax$ 恒成立的参数 $a$ 取值范围为 $(-\\infty, e]$；当 $a > e$ 时在 $x > 0$ 必产生 2 个交点破坏恒成立。",
          latex:
            "a \\le g(1) = e \\implies a \\in (-\\infty, e] \\quad (x > 0)",
          rubric: "采分点：最终参数范围结论（3分）",
        },
      ];
    } else if (presetKey === "free") {
      reasoningSteps = [
        {
          step: 1,
          title: "建立当前斜率参变直线方程",
          detail:
            "当前直线斜率参数为 $a$，直线方程为 $y = ax + 1$。与曲线 $y = e^x$ 恒交于定点 $(0,1)$。",
          latex: "y = ax + 1 \\quad (\\text{过定点 } (0,1))",
          rubric: "采分点：参变方程建立（3分）",
        },
        {
          step: 2,
          title: "临界切线斜率与交点演化判定",
          detail:
            "曲线在 $(0,1)$ 处切线斜率为 $f'(0) = 1$。当 $a = 1$ 时直线为切线；当 $a > 1$ 时直线割穿曲线，在 $x > 0$ 产生第二个交点；当 $a < 1$ 时在 $x \\ge 0$ 上直线恒位于曲线下方。",
          latex: "f'(0) = 1 \\implies a_{\\text{临界}} = 1",
          rubric: "采分点：临界斜率比较（4分）",
        },
        {
          step: 3,
          title: "区间恒成立与全域成立充要区分",
          detail:
            "在非负区间 $x \\ge 0$ 上，使 $e^x \\ge ax + 1$ 恒成立的充要条件为 $a \\le 1$；若在全实数域 $\\mathbb{R}$ 上，当 $a < 1$ 时在负半轴必穿插，故全域成立充要条件仅为 $a = 1$。",
          latex:
            "a \\le 1 \\iff e^x \\ge ax + 1 \\; (x \\ge 0); \\quad a = 1 \\iff e^x \\ge ax + 1 \\; (x \\in \\mathbb{R})",
          rubric: "采分点：分类充要条件闭环（5分）",
        },
      ];
    } else {
      // 默认定点相切 exp_ax_1_crit
      reasoningSteps = [
        {
          step: 1,
          title: "分析边界相切临界必要条件",
          detail:
            "直线 $y=ax+1$ 恒过定点 $(0,1)$。而曲线 $y=e^x$ 在 $(0,1)$ 处的切线斜率恰为 $f'(0)=e^0=1$，切线方程为 $y = x + 1$，因此相切临界斜率为 $a_{\\text{临界}}=1$。",
          latex: "f'(0) = e^0 = 1 \\implies a_{\\text{临界}} = 1",
          rubric: "采分点：求出相切临界参数值（4分）",
        },
        {
          step: 2,
          title: "充分性验证与图象位置保证",
          detail:
            "在 $x \\ge 0$ 上，当 $a \\le 1$ 时由 $(1-a)x \\ge 0$ 得 $e^x \\ge x+1 \\ge ax+1$ 恒成立；在全域 $\\mathbb{R}$ 上若 $a < 1$ 则在负半轴产生局部穿插破坏恒成立，故全域成立充要条件为 $a = 1$。",
          latex: "a \\le 1 \\iff e^x \\ge ax + 1 \\quad (x \\ge 0)",
          rubric: "采分点：充分性与必要性分类说明（5分）",
        },
        {
          step: 3,
          title: "得出参数最终范围与结论",
          detail:
            "综上所述，对任意 $x \\ge 0$ 使 $e^x \\ge ax+1$ 恒成立的参数 $a$ 取值范围为 $(-\\infty, 1]$；若要求在全实数域 $\\mathbb{R}$ 上恒成立，则参数为唯一解 $a = 1$。",
          latex:
            "a \\in (-\\infty, 1] \\quad (x \\ge 0); \\quad a = 1 \\quad (x \\in \\mathbb{R})",
          rubric: "采分点：最终参数范围结论（3分）",
        },
      ];
    }
  }

  return {
    quantities,
    theorems: currentModeTheorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic:
      "指数切线 x 加一，对数切线 x 减一；图象位置定上与下，相切即是临界点。",
  };
}
