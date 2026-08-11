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
  });

  const quantities: MathQuantity[] = [
    {
      label: "圆心 C 坐标",
      symbol: "C(a,b)",
      value: `(${calcRes.center.x.toFixed(1)}, ${calcRes.center.y.toFixed(1)})`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "圆半径 r",
      symbol: "r",
      value: calcRes.radius.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "圆心到直线距离 d",
      symbol: "d",
      value: calcRes.distance.toFixed(2),
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "位置关系判定",
      symbol: "d vs r",
      value: calcRes.relationLabel,
      color:
        calcRes.relation === "intersect"
          ? MATH_COLORS.paramTertiary
          : calcRes.relation === "tangent"
            ? MATH_COLORS.paramSecondary
            : MATH_COLORS.paramPrimary,
    },
    {
      label: "方程判别式 Δ",
      symbol: "Δ",
      value: calcRes.algebraic.delta.toFixed(2),
      color:
        calcRes.algebraic.delta > 0
          ? MATH_COLORS.paramTertiary
          : calcRes.algebraic.delta === 0
            ? MATH_COLORS.paramSecondary
            : MATH_COLORS.paramPrimary,
    },
  ];

  if (studyMode === "chord" || studyMode === "relation") {
    quantities.push(
      {
        label: "几何弦长 L",
        symbol: "L_geom",
        value:
          calcRes.relation !== "disjoint"
            ? calcRes.chordLengthGeom.toFixed(2)
            : "无 (相离)",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "代数弦长 L",
        symbol: "L_alg",
        value:
          calcRes.relation !== "disjoint"
            ? calcRes.chordLengthAlg.toFixed(2)
            : "无 (相离)",
        color: MATH_COLORS.paramTertiary,
      },
    );
  }

  if (studyMode === "tangent" && calcRes.tangentLength !== undefined) {
    quantities.push({
      label: "切线长 PT",
      symbol: "PT",
      value: calcRes.tangentLength.toFixed(2),
      color: "#8B5CF6",
    });
  }

  const theorems: Theorem[] = [
    {
      name: "垂径定理 (几何弦长核心)",
      latex:
        "r^2 = d^2 + \\left(\\frac{L}{2}\\right)^2 \\implies L = 2\\sqrt{r^2 - d^2}",
      level: "core",
      prerequisites: ["直线与圆相交", "CH ⊥ AB"],
    },
    {
      name: "代数弦长公式 (韦达定理)",
      latex:
        "L = \\sqrt{1+k^2}|x_1 - x_2| = \\frac{\\sqrt{1+k^2}\\sqrt{\\Delta}}{1+k^2}",
      level: "important",
      prerequisites: ["直线斜率 k 存在", "Δ ≥ 0"],
    },
    {
      name: "切线长定理与切点弦方程",
      latex: "(p_x - a)(x - a) + (p_y - b)(y - b) = r^2",
      level: "important",
      prerequisites: ["点 P(px, py) 为圆外一点"],
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考首选几何法 2√(r²-d²) 求弦长，避免消元后繁杂计算；在求弦长最值或斜率 k 为未知数时结合代数法。",
      importance: "gaokao",
    },
    {
      text: "设直线方程为 y = kx + m 时，若斜率不存在（垂直 x 轴 x = x₀），需单独验证，否则扣分。",
      importance: "gaokao",
    },
    {
      text: "圆心与弦中点连线垂直于弦 (k_CH · k_AB = -1)，常考轨迹问题与弦中点约束。",
      importance: "core",
    },
  ];

  const warnings: WarningItem[] = [];
  if (calcRes.relation === "disjoint") {
    warnings.push({
      text: `当前圆心距离 d = ${calcRes.distance.toFixed(2)} > r = ${calcRes.radius}，直线与圆无交点，弦长及切点无实数解！`,
      level: "warning",
    });
  }
  warnings.push({
    text: "设定 y = kx + m 时漏讨论 x = c 垂直 x 轴直线是高考解答题高频失分点！",
    level: "danger",
  });

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "弦长优先几何勾股，联立代数韦达相看；斜率分类防漏解，垂径直角记心间。",
  };
}
