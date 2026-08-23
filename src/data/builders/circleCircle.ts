import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { calculateCircleCircle } from "@/math/circleCircle";
import { MATH_COLORS } from "@/theme";

export function buildCircleCirclePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "position";

  const x1 = params.x1 ?? -1.5;
  const y1 = params.y1 ?? 0.0;
  const r1 = params.r1 ?? 2.5;
  const x2 = params.x2 ?? 2.0;
  const y2 = params.y2 ?? 0.0;
  const r2 = params.r2 ?? 2.0;

  const res = calculateCircleCircle({ x1, y1, r1, x2, y2, r2 });

  // 1. 数学量
  const quantities: MathQuantity[] = [
    {
      label: "圆心距 d (O1O2)",
      symbol: "d",
      value: res.d.toFixed(2),
      color: MATH_COLORS.primary,
    },
    {
      label: "半径和 r1 + r2",
      symbol: "r_1 + r_2",
      value: res.sumR.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "半径差 |r1 - r2|",
      symbol: "|r_1 - r_2|",
      value: res.diffR.toFixed(2),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "位置关系",
      symbol: "Relation",
      value: res.relationText,
      color:
        res.relation === "intersect"
          ? MATH_COLORS.paramTertiary
          : res.relation === "outer_tangent" || res.relation === "inner_tangent"
            ? MATH_COLORS.paramSecondary
            : MATH_COLORS.paramPrimary,
    },
    {
      label: "公切线条数",
      symbol: "N_{tangent}",
      value: `${res.tangentCount} 条`,
      color: MATH_COLORS.primary,
    },
  ];

  if (studyMode === "commonChord" && res.commonChord) {
    quantities.push({
      label: "公共弦长 L",
      symbol: "L_{chord}",
      value:
        res.commonChord.length !== null
          ? res.commonChord.length.toFixed(3)
          : "无公共弦 (不相交)",
      color: MATH_COLORS.paramTertiary,
    });
  }

  // 2. 定理与公式
  const theorems: Theorem[] = [
    {
      name: "圆与圆位置关系判定定理 (几何法)",
      latex:
        "\\begin{cases} d > r_1 + r_2 & \\text{外离 (4条公切线)} \\\\ d = r_1 + r_2 & \\text{外切 (3条公切线)} \\\\ |r_1 - r_2| < d < r_1 + r_2 & \\text{相交 (2条公切线)} \\\\ d = |r_1 - r_2| & \\text{内切 (1条公切线)} \\\\ 0 \\le d < |r_1 - r_2| & \\text{内含 (0条公切线)} \\end{cases}",
      condition: "r_1 > 0, r_2 > 0, d = \\sqrt{(x_1-x_2)^2 + (y_1-y_2)^2}",
      level: "core",
    },
    {
      name: "公共弦 / 根轴方程定理",
      latex:
        "C_1(x,y) - C_2(x,y) = 0 \\implies 2(x_2-x_1)x + 2(y_2-y_1)y + (r_2^2-r_1^2 + x_1^2+y_1^2 - x_2^2-y_2^2) = 0",
      note: "两圆方程相减消除二次项 x² 与 y²，所得一次方程即为公共弦（相交时）或根轴（不相交时）方程。其垂直于两圆心连线 O1O2。",
      level: "derived",
    },
  ];

  if (studyMode === "commonTangent") {
    theorems.push({
      name: "公切线长计算公式",
      latex:
        "L_{\\text{外公切}} = \\sqrt{d^2 - (r_1 - r_2)^2}, \\quad L_{\\text{内公切}} = \\sqrt{d^2 - (r_1 + r_2)^2}",
      note: "利用平移构造直角三角形（勾股定理）：外公切线构造以 d 为斜边、|r1-r2| 为直角边的直角三角形；内公切线构造以 d 为斜边、(r1+r2) 为直角边的直角三角形。",
      level: "important",
    });
  }

  // 3. 高考考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【公共弦几何求法】两圆相交时，公共弦 AB 必垂直于两圆心连线 O1O2，且 O1O2 垂直平分线段 AB。求公共弦长优先在直角三角形 O1 M A 中计算：(L/2)² = r1² - d1²。",
      importance: "gaokao",
    },
    {
      text: "【公共弦方程设线速算】已知两圆方程相交，求公共弦所在直线方程无需联立解交点，直接作差 C1 - C2 = 0 即可在 10 秒内秒杀！",
      importance: "gaokao",
    },
    {
      text: "【圆系方程】经过两圆 C1 与 C2 交点的圆系方程为 C1 + λ C2 = 0 (λ ≠ -1)。当 λ = -1 时即退化为两圆公共弦直线方程。",
      importance: "core",
    },
  ];

  // 4. 退化警示
  const warnings: WarningItem[] = [];

  if (res.relation === "concentric") {
    warnings.push({
      text: "两圆圆心重合 (d=0)，此时不存在公共弦与公切线，两圆方程作差得到的不是直线（系数为 0）。",
      level: "danger",
    });
  } else if (
    res.relation === "inner_tangent" ||
    res.relation === "outer_tangent"
  ) {
    warnings.push({
      text: "两圆相切时公共弦退化为单一点（公切点），公切线垂直于连心线且通过该切点。",
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
  };
}
