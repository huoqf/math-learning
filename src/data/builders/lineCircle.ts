import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { calculateLineCircle } from "@/math/lineCircle";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber, formatSignedTerm } from "@/utils/mathFormat";

/**
 * 格式化一般式方程 Ax + By + C = 0
 */
function formatGeneralEquationLatex(A: number, B: number, C: number): string {
  const parts: string[] = [];
  const termA = formatSignedTerm(A, "x", true);
  if (termA) parts.push(termA);
  const termB = formatSignedTerm(B, "y", parts.length === 0);
  if (termB) parts.push(termB);
  const termC = formatSignedTerm(C, "", parts.length === 0);
  if (termC) parts.push(termC);
  return `${parts.length > 0 ? parts.join(" ") : "0"} = 0`;
}

/**
 * 格式化标准圆方程 (x - a)^2 + (y - b)^2 = r^2
 */
function formatCircleEquationLatex(a: number, b: number, r: number): string {
  const xTerm =
    Math.abs(a) < 1e-4
      ? "x^2"
      : a > 0
        ? `(x - ${formatMathNumber(a)})^2`
        : `(x + ${formatMathNumber(Math.abs(a))})^2`;
  const yTerm =
    Math.abs(b) < 1e-4
      ? "y^2"
      : b > 0
        ? `(y - ${formatMathNumber(b)})^2`
        : `(y + ${formatMathNumber(Math.abs(b))})^2`;
  return `${xTerm} + ${yTerm} = ${formatMathNumber(r * r)}`;
}

export function buildLineCirclePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "relation";
  const a = params.a ?? 0;
  const b = params.b ?? 0;
  const r = params.r ?? 3;
  const k = params.k ?? 0.75;
  const m = params.m ?? -1;
  const px = params.px ?? 5;
  const py = params.py ?? 4;
  const mx = params.mx ?? 1;
  const my = params.my ?? 1;

  const calcRes = calculateLineCircle({
    a,
    b,
    r,
    k,
    m,
    px,
    py,
    mx,
    my,
  });

  const cPrimary = MATH_COLORS.paramPrimary;
  const cSecondary = MATH_COLORS.paramSecondary;
  const cTertiary = MATH_COLORS.paramTertiary;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor = "高考解析几何核心基石 · 直线与圆的位置关系及相交弦长";

  // 通用几何量符号串与格式化
  const aVal = formatMathNumber(a);
  const bVal = formatMathNumber(b);
  const rVal = formatMathNumber(r);
  const kVal = formatMathNumber(k);
  const mVal = formatMathNumber(m);
  const dVal = formatMathNumber(calcRes.distance);
  const circleEqLatex = formatCircleEquationLatex(a, b, r);
  const lineGenLatex = formatGeneralEquationLatex(k, -1, m);

  // ─────────────────────────────────────────────────────────────
  // 1. 各探究模式量化看板数据与三步推演链
  // ─────────────────────────────────────────────────────────────
  if (studyMode === "chord") {
    examAnchor = "高考压轴必考考点 · 垂径定理弦心距勾股法与韦达代数弦长";

    const isDisjoint = calcRes.relation === "disjoint";
    const halfLVal = formatMathNumber(calcRes.chordLengthGeom / 2);
    const lGeomVal = formatMathNumber(calcRes.chordLengthGeom);
    const deltaVal = formatMathNumber(calcRes.algebraic.delta);
    const r2MinusD2 = formatMathNumber(
      Math.max(0, r * r - calcRes.distance * calcRes.distance),
    );
    const k2Plus1 = formatMathNumber(1 + k * k);

    quantities.push(
      {
        label: "几何弦长 L (勾股法)",
        symbol: "L = 2\\sqrt{r^2 - d^2}",
        value: !isDisjoint
          ? `2\\sqrt{${rVal}^2 - ${dVal}^2} = ${lGeomVal}`
          : "无 (d > r 相离)",
        color: cTertiary,
      },
      {
        label: "弦心距 d (点到线距离)",
        symbol: "d = \\frac{|ka - b + m|}{\\sqrt{k^2 + 1}}",
        value: `\\frac{|${kVal}(${aVal}) - (${bVal}) + (${mVal})|}{\\sqrt{${kVal}^2 + 1}} = ${dVal}`,
        color: cTertiary,
      },
      {
        label: "圆半径 r",
        symbol: "r",
        value: rVal,
        color: cPrimary,
      },
      {
        label: "代数弦长 L (韦达法)",
        symbol: "L = \\frac{\\sqrt{\\Delta}}{\\sqrt{1+k^2}}",
        value: !isDisjoint
          ? `\\frac{\\sqrt{${deltaVal}}}{\\sqrt{${k2Plus1}}} = ${lGeomVal}`
          : "无 (\\Delta < 0)",
        color: cTertiary,
      },
      {
        label: "联立判别式 Δ",
        symbol: "\\Delta = B^2 - 4AC",
        value: deltaVal,
        color:
          calcRes.algebraic.delta > 0
            ? cTertiary
            : calcRes.algebraic.delta === 0
              ? cSecondary
              : cPrimary,
      },
    );

    if (
      calcRes.maxChordLength !== undefined &&
      calcRes.minChordLength !== undefined
    ) {
      const isInside = calcRes.isInsideCircle ?? true;
      const distMCVal = formatMathNumber(calcRes.distMC ?? 0);
      const minChordVal = formatMathNumber(calcRes.minChordLength);
      const maxChordVal = formatMathNumber(calcRes.maxChordLength);

      quantities.push(
        {
          label: "过定点 M 最长弦 (直径)",
          symbol: "L_{\\max} = 2r",
          value: `2 \\times ${rVal} = ${maxChordVal}`,
          color: cPrimary,
        },
        {
          label: "过定点 M 最短弦 (垂弦)",
          symbol: "L_{\\min} = 2\\sqrt{r^2 - |CM|^2}",
          value: isInside
            ? `2\\sqrt{${rVal}^2 - ${distMCVal}^2} = ${minChordVal}`
            : "无 (点 M 在圆外)",
          color: cSecondary,
        },
      );
    }

    if (isDisjoint) {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 提取圆心半径与一般式方程",
          detail: `圆的标准方程为 $${circleEqLatex}$，提取圆心 $C(${aVal}, ${bVal})$，半径 $r = ${rVal}$；直线化为一般式 $${lineGenLatex}$。`,
          latex: `C(a, b) = C(${aVal}, ${bVal}), \\quad r = ${rVal}, \\quad l: ${lineGenLatex}`,
          rubric: "采分点：标定圆心坐标与直线标准方程（2分）",
        },
        {
          step: 2,
          title: "建模计算 · 点到直线距离公式展开",
          detail: `代入点到直线距离公式计算弦心距 $d$，并与圆半径 $r$ 进行比较：`,
          latex: `${calcRes.deductions.distanceDeduction} > r = ${rVal}`,
          rubric: "采分点：写出距离公式并完整代入计算（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 相离无相交弦长",
          detail: `因为 $d = ${dVal} > r = ${rVal}$，对应联立方程判别式 $\\Delta = ${deltaVal} < 0$，直线与圆相离无公共交点，弦长无实数解。`,
          latex: `d > r \\iff \\Delta < 0 \\implies \\text{直线与圆相离，相交弦长不存在}`,
          rubric: "采分点：得出相离结论并指出无实根（3分）",
        },
      );
    } else {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 弦心距公式展开与交点存在性",
          detail: `由点到直线距离公式计算圆心 $C(${aVal}, ${bVal})$ 到直线 $l: ${lineGenLatex}$ 的弦心距 $d$：`,
          latex: `${calcRes.deductions.distanceDeduction} \\le r = ${rVal}`,
          rubric: "采分点：写出点到直线距离公式并代入求解弦心距（2分）",
        },
        {
          step: 2,
          title: "建模展开 · 构造 Rt△CHA 与垂径勾股定理",
          detail: `过圆心 $C$ 作 $CH \\perp AB$ 于垂足 $H$。由垂径定理知 $H$ 为弦 $AB$ 的中点，在 $\\text{Rt}\\triangle CHA$ 中应用勾股定理列出方程：`,
          latex: `r^2 = d^2 + \\left(\\frac{L}{2}\\right)^2 \\implies \\left(\\frac{L}{2}\\right)^2 = r^2 - d^2 = ${rVal}^2 - (${dVal})^2 = ${r2MinusD2}`,
          rubric: "采分点：构造直角三角形并列出垂径勾股展开式（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 几何相交弦长与代数韦达对照",
          detail: `两边开平方求解得半弦长 $\\frac{L}{2} = \\sqrt{${r2MinusD2}} = ${halfLVal}$，相交弦长为 $L = 2\\sqrt{r^2 - d^2}$。代数法联立二次方程判别式 $\\Delta = ${deltaVal}$，二者完全一致：`,
          latex: `${calcRes.deductions.pythagorasDeduction} \\quad \\left(\\text{代数法: } ${calcRes.deductions.vietaChordDeduction}\\right)`,
          rubric: "采分点：准确计算弦长最终数值并给出结论（3分）",
        },
      );
    }
  } else if (studyMode === "tangent") {
    examAnchor = "高考热点专题 · 圆外一点引切线长定理与极点极线切点弦";

    const pxVal = formatMathNumber(px);
    const pyVal = formatMathNumber(py);
    const distPCVal = formatMathNumber(calcRes.distPC ?? 0);
    const distPCSq = formatMathNumber(
      Math.pow(px - a, 2) + Math.pow(py - b, 2),
    );
    const tanLenVal = formatMathNumber(calcRes.tangentLength ?? 0);
    const rSqVal = formatMathNumber(r * r);

    quantities.push(
      {
        label: "切线长 PT (切线定理)",
        symbol: "PT = \\sqrt{|PC|^2 - r^2}",
        value:
          calcRes.tangentLength !== undefined
            ? `\\sqrt{${distPCVal}^2 - ${rVal}^2} = ${tanLenVal}`
            : "无 (点在圆内)",
        color: cTertiary,
      },
      {
        label: "点 P 到圆心距离 |PC|",
        symbol: "|PC| = \\sqrt{(x_0-a)^2+(y_0-b)^2}",
        value: `\\sqrt{(${pxVal}-${aVal})^2 + (${pyVal}-${bVal})^2} = ${distPCVal}`,
        color: cPrimary,
      },
      {
        label: "圆半径 r",
        symbol: "r",
        value: rVal,
        color: cPrimary,
      },
      {
        label: "切点个数",
        symbol: "N_T",
        value:
          (calcRes.tangentPoints?.length ?? 0) > 0
            ? `${calcRes.tangentPoints?.length} 个`
            : "0 个",
        color: cSecondary,
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 两点间距离公式与点圆关系",
        detail: `已知圆方程为 $${circleEqLatex}$，圆心 $C(${aVal}, ${bVal})$，半径 $r = ${rVal}$。由两点间距离公式求外点 $P(${pxVal}, ${pyVal})$ 到圆心距离：`,
        latex: `|PC| = \\sqrt{(x_P - a)^2 + (y_P - b)^2} = \\sqrt{(${pxVal} - (${aVal}))^2 + (${pyVal} - (${bVal}))^2} = \\sqrt{${distPCSq}} = ${distPCVal} > r = ${rVal}`,
        rubric: "采分点：写出两点距离公式并代入判定点在圆外（2分）",
      },
      {
        step: 2,
        title: "建模展开 · 切线直角三角形与切线长公式",
        detail: `设从点 $P$ 引出的切点为 $T_1, T_2$。由切线性质知半径与切线垂直 $CT \\perp PT$。在 $\\text{Rt}\\triangle PTC$ 中应用勾股定理：`,
        latex:
          calcRes.deductions.tangentDeduction ??
          `PT = \\sqrt{|PC|^2 - r^2} = ${tanLenVal}`,
        rubric: "采分点：写出切线长公式并代入求解（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 切点弦方程（极点极线公式）",
        detail: `以 $PC$ 为直径的圆与已知圆相交，两交点 $T_1, T_2$ 所在直线方程符合极点极线标准公式 $(x_0 - a)(x - a) + (y_0 - b)(y - b) = r^2$：`,
        latex: `(x_P - a)(x - a) + (y_P - b)(y - b) = r^2 \\implies (${pxVal} - (${aVal}))(x - (${aVal})) + (${pyVal} - (${bVal}))(y - (${bVal})) = ${rSqVal}`,
        rubric: "采分点：列出极点极线公式并代入求出切点弦方程（3分）",
      },
    );
  } else if (studyMode === "midpoint") {
    examAnchor = "高考题型攻关 · 垂径定理中点性质与点差法斜率垂直积";

    const midX = formatMathNumber(calcRes.midpoint.x);
    const midY = formatMathNumber(calcRes.midpoint.y);
    const kAB = formatMathNumber(k);
    const kCH = calcRes.kCH !== null ? formatMathNumber(calcRes.kCH) : "不存在";
    const kProd =
      calcRes.kCH !== null && k !== 0
        ? formatMathNumber(calcRes.kCH * k)
        : "-1";

    quantities.push(
      {
        label: "弦中点 / 垂足 H",
        symbol: "H(x_0, y_0)",
        value: `(${midX}, ${midY})`,
        color: cTertiary,
      },
      {
        label: "垂线 CH 斜率",
        symbol: "k_{CH} = \\frac{y_0 - b}{x_0 - a}",
        value: `\\frac{${midY} - (${bVal})}{${midX} - (${aVal})} = ${kCH}`,
        color: cTertiary,
      },
      {
        label: "割线 AB 斜率",
        symbol: "k_{AB} = -\\frac{1}{k_{CH}}",
        value: kAB,
        color: cSecondary,
      },
      {
        label: "斜率乘积 k_CH · k_AB",
        symbol: "k_{CH} \\cdot k_{AB}",
        value: `${kCH} \\times ${kAB} = ${kProd}`,
        color: cPrimary,
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 垂径定理中点垂直性",
        detail: `在圆 $${circleEqLatex}$ 中，动弦 $AB$ 的中点为 $H(${midX}, ${midY})$，圆心为 $C(${aVal}, ${bVal})$。由垂径定理知连心线垂直平分动弦：`,
        latex: `H \\text{ 为弦 } AB \\text{ 中点} \\iff CH \\perp AB`,
        rubric: "采分点：由垂径定理明确垂直平分充要关系（2分）",
      },
      {
        step: 2,
        title: "建模展开 · 斜率垂直乘积与负倒数方程",
        detail: `计算连心线 $CH$ 的斜率，再由两直线垂直充要条件 $k_{CH} \\cdot k_{AB} = -1$ 求解割线斜率：`,
        latex: calcRes.deductions.midpointSlopeDeduction,
        rubric: "采分点：写出斜率公式并代入求解割线斜率（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 点差法原理与动中点轨迹方程",
        detail: `设端点 $A(x_1, y_1), B(x_2, y_2)$ 代入圆方程两式相减消常数项，利用平方差公式因式分解：`,
        latex: `(x_1 - x_2)(x_1 + x_2 - 2a) + (y_1 - y_2)(y_1 + y_2 - 2b) = 0 \\implies k_{AB} = \\frac{y_1 - y_2}{x_1 - x_2} = -\\frac{x_0 - a}{y_0 - b}`,
        rubric: "采分点：阐明点差法两式相减代数推导过程（3分）",
      },
    );
  } else {
    // 位置关系判定模式 (relation)
    examAnchor = "高考基础诊断 · 几何法(d与r)与代数法(判别式Δ)双轨判定";

    const deltaVal = formatMathNumber(calcRes.algebraic.delta);

    quantities.push(
      {
        label: "位置关系判定",
        symbol: "d \\text{ vs } r",
        value: calcRes.relationLabel,
        color:
          calcRes.relation === "intersect"
            ? cTertiary
            : calcRes.relation === "tangent"
              ? cSecondary
              : cPrimary,
      },
      {
        label: "弦心距 d (几何法)",
        symbol: "d = \\frac{|ka - b + m|}{\\sqrt{k^2 + 1}}",
        value: `\\frac{|${kVal}(${aVal}) - (${bVal}) + (${mVal})|}{\\sqrt{${kVal}^2 + 1}} = ${dVal}`,
        color: cTertiary,
      },
      {
        label: "圆半径 r",
        symbol: "r",
        value: rVal,
        color: cPrimary,
      },
      {
        label: "代数判别式 Δ",
        symbol: "\\Delta = B^2 - 4AC",
        value: deltaVal,
        color:
          calcRes.algebraic.delta > 0
            ? cTertiary
            : calcRes.algebraic.delta === 0
              ? cSecondary
              : cPrimary,
      },
      {
        label: "圆心 C 坐标",
        symbol: "C(a,b)",
        value: `(${aVal}, ${bVal})`,
        color: cPrimary,
      },
    );

    const relSymbol =
      calcRes.relation === "intersect"
        ? "<"
        : calcRes.relation === "tangent"
          ? "="
          : ">";
    const deltaSymbol =
      calcRes.relation === "intersect"
        ? "> 0"
        : calcRes.relation === "tangent"
          ? "= 0"
          : "< 0";
    const conclusionText =
      calcRes.relation === "intersect"
        ? "相交 (2个不同公共点)"
        : calcRes.relation === "tangent"
          ? "相切 (恰有1个公共切点)"
          : "相离 (无公共交点)";

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 提取圆心半径与一般式方程",
        detail: `圆的标准方程为 $${circleEqLatex}$，提取圆心 $C(a, b) = C(${aVal}, ${bVal})$，半径 $r = ${rVal}$；直线化为一般式 $Ax + By + C = 0 \\implies ${lineGenLatex}$。`,
        latex: `C(a, b) = C(${aVal}, ${bVal}), \\quad r = ${rVal}, \\quad l: ${lineGenLatex}`,
        rubric: "采分点：准确提取圆心坐标、半径及直线一般式系数（2分）",
      },
      {
        step: 2,
        title: "建模计算 · 几何法距离 d 与代数法联立 Δ",
        detail: `几何法代入点到直线距离公式计算 $d$；代数法联立方程 $(1+k^2)x^2 + 2[k(m-b)-a]x + [a^2+(m-b)^2-r^2] = 0$ 计算判别式 $\\Delta$：`,
        latex: `${calcRes.deductions.distanceDeduction}, \\quad \\Delta = B^2 - 4AC = ${deltaVal}`,
        rubric: "采分点：写出距离公式与判别式公式并完整代入展开（3分）",
      },
      {
        step: 3,
        title: "求解判定 · 数形结合双轨判定结论",
        detail: `比较距离与半径：$d = ${dVal} ${relSymbol} r = ${rVal}$，对应代数判别式 $\\Delta = ${deltaVal} ${deltaSymbol}$，得出充要几何结论：`,
        latex: `d ${relSymbol} r \\iff \\Delta ${deltaSymbol} \\implies \\text{直线与圆}${conclusionText}`,
        rubric: "采分点：给出几何与代数双向判定的准确推导结论（3分）",
      },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 高中数学核心定理 (Theorems)
  // ─────────────────────────────────────────────────────────────
  theorems.push(
    {
      name: "垂径定理 (几何相交弦长核心)",
      latex:
        "r^2 = d^2 + \\left(\\frac{L}{2}\\right)^2 \\iff L = 2\\sqrt{r^2 - d^2}",
      level:
        studyMode === "chord" || studyMode === "midpoint"
          ? "core"
          : "important",
      prerequisites: [
        "直线与圆相交或相切 ($d \\le r$)",
        "连心线 $CH \\perp AB$ 于弦中点 $H$",
      ],
    },
    {
      name: "过圆内定点弦长极值定理",
      latex: "2\\sqrt{r^2 - |CM|^2} \\le L \\le 2r",
      level: studyMode === "chord" ? "core" : "important",
      prerequisites: [
        "定点 $M(x_0, y_0)$ 在圆内部 ($|CM| < r$)",
        "过圆心直径最长 ($L_{\\max} = 2r$)",
        "垂直于连心线 $CM$ 弦最短 ($L_{\\min} = 2\\sqrt{r^2 - |CM|^2}$)",
      ],
    },
    {
      name: "代数弦长公式 (韦达定理展开)",
      latex:
        "L = \\sqrt{1+k^2}|x_1 - x_2| = \\sqrt{1+k^2}\\sqrt{(x_1+x_2)^2 - 4x_1x_2} = \\frac{\\sqrt{\\Delta}}{\\sqrt{1+k^2}}",
      level: "important",
      prerequisites: [
        "直线斜率 $k$ 存在 (非铅垂线)",
        "联立消元二次方程判别式 $\\Delta \\ge 0$",
      ],
    },
    {
      name: "切线长定理与切点弦方程 (极点极线)",
      latex: "(p_x - a)(x - a) + (p_y - b)(y - b) = r^2",
      level: studyMode === "tangent" ? "core" : "important",
      prerequisites: [
        "点 $P(p_x, p_y)$ 为圆外一点 ($|PC| > r$)",
        "切线长相等：$PT_1 = PT_2 = \\sqrt{|PC|^2 - r^2}$",
      ],
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 3. 高考压轴考点提炼 (Gaokao Points)
  // ─────────────────────────────────────────────────────────────
  gaokaoPoints.push(
    {
      text: "【高考首选几何法】求直线与圆相交弦长优先利用勾股垂径定理 $L = 2\\sqrt{r^2-d^2}$，运算量仅为联立韦达消元法的五分之一，可极大避免繁重的二次展开与笔误。",
      importance: "gaokao",
    },
    {
      text: "【定点动弦最值模型】过圆内定点 $M$ 的所有割线弦中：过圆心直径最长（$2r$），垂直于连心线 $CM$ 的弦最短（$2\\sqrt{r^2-|CM|^2}$）。两最值状态正交垂直。",
      importance: "gaokao",
    },
    {
      text: "【分类讨论防漏解】设直线方程为 $y = kx + m$ 或点斜式时，若直线可能垂直于 $x$ 轴（斜率不存在），解答题中必须单独设 $x = x_0$ 检验，否则按高考评分标准扣 2-3 分！",
      importance: "gaokao",
    },
    {
      text: "【切点弦恒过定点】若圆外动点 $P$ 在某定直线上运动，其对应的切点弦必恒过定点（极点极线互偶性），是新高考圆锥曲线压轴解答题的高频考法。",
      importance: "core",
    },
  );

  // ─────────────────────────────────────────────────────────────
  // 4. 边界与退化警示 (Warnings)
  // ─────────────────────────────────────────────────────────────
  if (calcRes.relation === "disjoint") {
    warnings.push({
      text: `当前圆心距离 $d = ${dVal} > r = ${rVal}$，直线与圆相离无公共交点，弦长及切点无实数解！`,
      level: "warning",
    });
  }
  if (
    studyMode === "tangent" &&
    calcRes.distPC !== undefined &&
    calcRes.distPC <= calcRes.radius
  ) {
    warnings.push({
      text: `点 $P$ 处于圆内或圆上 ($|PC| \\le r$)，无法引出两条相交切线与切点弦！`,
      level: "danger",
    });
  }
  warnings.push({
    text: "设直线为 $y = kx + m$ 时漏讨论 $x = c$（垂直 $x$ 轴斜率不存在）是新高考解答题高频失分陷阱！",
    level: "danger",
  });

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic:
      "弦长优先几何勾股，联立代数韦达相看；定点弦长直径最长，垂径直角记心间。",
  };
}
