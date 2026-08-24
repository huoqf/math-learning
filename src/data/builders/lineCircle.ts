import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { calculateLineCircle } from "@/math/lineCircle";
import { MATH_COLORS } from "@/theme";

export function buildLineCirclePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "relation";
  const calcRes = calculateLineCircle({
    a: params.a ?? 0,
    b: params.b ?? 0,
    r: params.r ?? 3,
    k: params.k ?? 0.75,
    m: params.m ?? -1,
    px: params.px ?? 5,
    py: params.py ?? 4,
    mx: params.mx ?? 1,
    my: params.my ?? 1,
  });

  const quantities: MathQuantity[] = [];

  if (studyMode === "chord") {
    // 弦长模式：弦长与弦心距置顶
    quantities.push(
      {
        label: "几何弦长 L (勾股法)",
        symbol: "L_{\\text{geom}}",
        value:
          calcRes.relation !== "disjoint"
            ? calcRes.chordLengthGeom.toFixed(2)
            : "无 (相离)",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "弦心距 d",
        symbol: "d",
        value: calcRes.distance.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "圆半径 r",
        symbol: "r",
        value: calcRes.radius.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "代数弦长 L (韦达法)",
        symbol: "L_{\\text{alg}}",
        value:
          calcRes.relation !== "disjoint"
            ? calcRes.chordLengthAlg.toFixed(2)
            : "无 (相离)",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "判别式 Δ",
        symbol: "\\Delta",
        value: calcRes.algebraic.delta.toFixed(2),
        color:
          calcRes.algebraic.delta > 0
            ? MATH_COLORS.paramTertiary
            : calcRes.algebraic.delta === 0
              ? MATH_COLORS.paramSecondary
              : MATH_COLORS.paramPrimary,
      },
    );
    if (
      calcRes.maxChordLength !== undefined &&
      calcRes.minChordLength !== undefined
    ) {
      const isInside = calcRes.isInsideCircle ?? true;
      quantities.push(
        {
          label: "过定点 M 最长弦 (直径)",
          symbol: "L_{\\max}",
          value: isInside
            ? calcRes.maxChordLength.toFixed(2)
            : `2r = ${calcRes.maxChordLength.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "过定点 M 最短弦 (垂弦)",
          symbol: "L_{\\min}",
          value: isInside
            ? calcRes.minChordLength.toFixed(2)
            : "无 (点 M 位于圆外)",
          color: MATH_COLORS.paramSecondary,
        },
      );
    }
  } else if (studyMode === "tangent") {
    // 切线模式：切线长与切点置顶
    quantities.push(
      {
        label: "切线长 PT",
        symbol: "PT",
        value:
          calcRes.tangentLength !== undefined
            ? calcRes.tangentLength.toFixed(2)
            : "无 (点在圆内)",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "点 P 到圆心距离",
        symbol: "|PC|",
        value:
          calcRes.distPC !== undefined ? calcRes.distPC.toFixed(2) : "0.00",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "圆半径 r",
        symbol: "r",
        value: calcRes.radius.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "切点个数",
        symbol: "N_T",
        value:
          (calcRes.tangentPoints?.length ?? 0) > 0
            ? `${calcRes.tangentPoints?.length} 个`
            : "0 个",
        color: MATH_COLORS.paramSecondary,
      },
    );
  } else if (studyMode === "midpoint") {
    // 垂径定理与弦中点模式
    quantities.push(
      {
        label: "弦中点 / 垂足 H",
        symbol: "H(x_0, y_0)",
        value: `(${calcRes.midpoint.x.toFixed(2)}, ${calcRes.midpoint.y.toFixed(2)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "垂线 CH 斜率",
        symbol: "k_{CH}",
        value: calcRes.kCH !== null ? calcRes.kCH.toFixed(2) : "不存在 (垂直)",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "直线 AB 斜率",
        symbol: "k_{AB}",
        value: (params.k ?? 0.75).toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "斜率乘积 k_CH · k_AB",
        symbol: "k_{CH}k_{AB}",
        value:
          calcRes.kCH !== null && params.k !== 0
            ? (calcRes.kCH * (params.k ?? 0.75)).toFixed(2)
            : "-1.00 (垂直)",
        color: MATH_COLORS.paramPrimary,
      },
    );
  } else {
    // 位置关系判定模式
    quantities.push(
      {
        label: "位置关系判定",
        symbol: "d \\text{ vs } r",
        value: calcRes.relationLabel,
        color:
          calcRes.relation === "intersect"
            ? MATH_COLORS.paramTertiary
            : calcRes.relation === "tangent"
              ? MATH_COLORS.paramSecondary
              : MATH_COLORS.paramPrimary,
      },
      {
        label: "圆心到直线距离 d",
        symbol: "d",
        value: calcRes.distance.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "圆半径 r",
        symbol: "r",
        value: calcRes.radius.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "代数判别式 Δ",
        symbol: "\\Delta",
        value: calcRes.algebraic.delta.toFixed(2),
        color:
          calcRes.algebraic.delta > 0
            ? MATH_COLORS.paramTertiary
            : calcRes.algebraic.delta === 0
              ? MATH_COLORS.paramSecondary
              : MATH_COLORS.paramPrimary,
      },
      {
        label: "圆心 C 坐标",
        symbol: "C(a,b)",
        value: `(${calcRes.center.x.toFixed(1)}, ${calcRes.center.y.toFixed(1)})`,
        color: MATH_COLORS.paramPrimary,
      },
    );
  }

  const theorems: Theorem[] = [
    {
      name: "垂径定理 (几何弦长核心)",
      latex:
        "r^2 = d^2 + \\left(\\frac{L}{2}\\right)^2 \\iff L = 2\\sqrt{r^2 - d^2}",
      level:
        studyMode === "chord" || studyMode === "midpoint"
          ? "core"
          : "important",
      prerequisites: ["直线与圆相交或相切", "CH ⊥ AB 于中点 H"],
    },
    {
      name: "过圆内定点弦长极值定理",
      latex: "2\\sqrt{r^2 - |CM|^2} \\le L \\le 2r",
      level: studyMode === "chord" ? "core" : "important",
      prerequisites: ["点 M(x_0, y_0) 在圆内", "最长弦为直径，最短弦垂直于 CM"],
    },
    {
      name: "代数弦长公式 (韦达定理)",
      latex:
        "L = \\sqrt{1+k^2}|x_1 - x_2| = \\frac{\\sqrt{1+k^2}\\sqrt{\\Delta}}{1+k^2}",
      level: "important",
      prerequisites: ["直线斜率 k 存在", "Δ ≥ 0"],
    },
    {
      name: "切线长定理与切点弦方程 (极点极线)",
      latex: "(p_x - a)(x - a) + (p_y - b)(y - b) = r^2",
      level: studyMode === "tangent" ? "core" : "important",
      prerequisites: [
        "点 P(px, py) 为圆外一点",
        "PT_1 = PT_2 = \\sqrt{|PC|^2 - r^2}",
      ],
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【高考首选几何法】求相交弦长优先利用弦心距 L = 2√(r²-d²)，避免消元韦达定理的繁重代数计算。",
      importance: "gaokao",
    },
    {
      text: "【定点弦长最值模型】过圆内定点 M 的所有弦中：过圆心直径最长（2r），垂直于 CM 弦最短（2√(r²-|CM|²)）。",
      importance: "gaokao",
    },
    {
      text: "【分类讨论防漏解】设直线为 y = kx + m 时，若直线垂直于 x 轴（斜率不存在），必须单独检验，否则扣分！",
      importance: "gaokao",
    },
    {
      text: "【切点弦恒过定点】过直线外动点 P 引圆的两条切线，切点弦方程本质为极点极线，常考切点弦恒过定点。",
      importance: "core",
    },
  ];

  const warnings: WarningItem[] = [];
  if (calcRes.relation === "disjoint") {
    warnings.push({
      text: `当前圆心距离 d = ${calcRes.distance.toFixed(2)} > r = ${calcRes.radius}，直线与圆相离无交点，弦长及切点无实数解！`,
      level: "warning",
    });
  }
  if (
    studyMode === "tangent" &&
    calcRes.distPC !== undefined &&
    calcRes.distPC <= calcRes.radius
  ) {
    warnings.push({
      text: `点 P 处于圆内或圆上 (|PC| ≤ r)，无法引出两条切线与切点弦！`,
      level: "danger",
    });
  }
  warnings.push({
    text: "设定 y = kx + m 时漏讨论 x = c（垂直 x 轴斜率不存在）是高考解答题高频失分点！",
    level: "danger",
  });

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "弦长优先几何勾股，联立代数韦达相看；定点弦长直径最长，垂径直角记心间。",
  };
}
