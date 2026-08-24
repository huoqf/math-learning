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

  // 1. 数学量组装
  const quantities: MathQuantity[] = [];

  if (studyMode === "commonChord") {
    // 【公共弦模式】：公共弦方程、弦长、弦心距置顶
    if (res.commonChord) {
      quantities.push({
        label: "公共弦 / 根轴方程",
        symbol: "C_1 - C_2 = 0",
        value: res.commonChord.line.latex,
        color: MATH_COLORS.paramTertiary,
      });

      if (res.relation === "intersect" && res.commonChord.length !== null) {
        quantities.push({
          label: "公共弦长 L (勾股求法)",
          symbol: "L_{chord}",
          value: `${res.commonChord.length.toFixed(3)}  (2\\sqrt{r_1^2 - d_1^2})`,
          color: MATH_COLORS.paramTertiary,
        });

        if (res.commonChord.distToO1 !== null) {
          quantities.push({
            label: "弦心距 d1 (O1 到弦)",
            symbol: "d_1",
            value: res.commonChord.distToO1.toFixed(3),
            color: MATH_COLORS.paramSecondary,
          });
        }

        if (res.intersections.length === 2) {
          quantities.push({
            label: "两交点坐标 A, B",
            symbol: "A, B",
            value: `A(${res.intersections[0].x.toFixed(2)}, ${res.intersections[0].y.toFixed(2)}), B(${res.intersections[1].x.toFixed(2)}, ${res.intersections[1].y.toFixed(2)})`,
            color: MATH_COLORS.primary,
          });
        }
      } else {
        quantities.push({
          label: "公共弦长",
          symbol: "L_{chord}",
          value: res.relationText,
          color: MATH_COLORS.paramPrimary,
        });
      }
    }

    quantities.push(
      {
        label: "圆心距 d (O1O2)",
        symbol: "d",
        value: res.d.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "位置关系",
        symbol: "Relation",
        value: res.relationText,
        color:
          res.relation === "intersect"
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramPrimary,
      },
    );
  } else if (studyMode === "commonTangent") {
    // 【公切线模式】：公切线条数、切线长置顶
    quantities.push(
      {
        label: "公切线条数",
        symbol: "N_{tangent}",
        value: `${res.tangentCount} 条`,
        color: MATH_COLORS.primary,
      },
      {
        label: "外公切线长 L外",
        symbol: "L_{outer}",
        value:
          res.outerTangentLength !== null
            ? res.outerTangentLength.toFixed(3)
            : "无外公切线",
        color: MATH_COLORS.primary,
      },
      {
        label: "内公切线长 L内",
        symbol: "L_{inner}",
        value:
          res.innerTangentLength !== null
            ? res.innerTangentLength.toFixed(3)
            : "无内公切线",
        color: "#8B5CF6",
      },
      {
        label: "圆心距 d",
        symbol: "d",
        value: res.d.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "半径和与差",
        symbol: "r_1+r_2, |r_1-r_2|",
        value: `${res.sumR.toFixed(2)}, ${res.diffR.toFixed(2)}`,
        color: MATH_COLORS.paramSecondary,
      },
    );
  } else {
    // 【位置关系主模式】：五种关系判定
    quantities.push(
      {
        label: "位置关系",
        symbol: "Relation",
        value: res.relationText,
        color:
          res.relation === "intersect"
            ? MATH_COLORS.paramTertiary
            : res.relation === "outer_tangent" ||
                res.relation === "inner_tangent"
              ? MATH_COLORS.paramSecondary
              : MATH_COLORS.paramPrimary,
      },
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
        label: "公切线条数",
        symbol: "N_{tangent}",
        value: `${res.tangentCount} 条`,
        color: MATH_COLORS.primary,
      },
    );
  }

  // 2. 定理与公式（严格根据 studyMode 置顶核心定理）
  const theorems: Theorem[] = [];

  if (studyMode === "commonChord") {
    theorems.push(
      {
        name: "公共弦 / 根轴方程定理 (作差法)",
        latex:
          "C_1(x,y) - C_2(x,y) = 0 \\implies 2(x_2-x_1)x + 2(y_2-y_1)y + (x_1^2+y_1^2-r_1^2 - x_2^2-y_2^2+r_2^2) = 0",
        note: "两圆标准方程相减消除二次项 x² 与 y²，所得一次方程即为公共弦（两圆相交时）或根轴（不相交时）方程，且必垂直于两圆心连线 O1O2。",
        level: "core",
      },
      {
        name: "垂径定理与公共弦长勾股公式",
        latex:
          "L_{\\text{chord}} = 2\\sqrt{r_1^2 - d_1^2} = 2\\sqrt{r_2^2 - d_2^2}",
        condition:
          "d_1 = \\text{dist}(O_1, AB), \\quad d_2 = \\text{dist}(O_2, AB)",
        note: "在直角三角形 O1 M A 中应用勾股定理，避免联立二次方程求根，提升解题速度。",
        level: "core",
      },
      {
        name: "圆与圆位置关系判定定理",
        latex:
          "\\begin{cases} d > r_1 + r_2 & \\text{外离} \\\\ d = r_1 + r_2 & \\text{外切} \\\\ |r_1 - r_2| < d < r_1 + r_2 & \\text{相交} \\\\ d = |r_1 - r_2| & \\text{内切} \\\\ 0 \\le d < |r_1 - r_2| & \\text{内含} \\end{cases}",
        level: "derived",
      },
    );
  } else if (studyMode === "commonTangent") {
    theorems.push(
      {
        name: "公切线长计算公式 (构造直角三角形)",
        latex:
          "L_{\\text{外公切}} = \\sqrt{d^2 - (r_1 - r_2)^2}, \\quad L_{\\text{内公切}} = \\sqrt{d^2 - (r_1 + r_2)^2}",
        condition:
          "外公切线要求 d \\ge |r_1 - r_2|；内公切线要求 d \\ge r_1 + r_2",
        note: "通过将切线平移到其中一个圆心，分别构造以 d 为斜边、|r1-r2| 或 (r1+r2) 为直角边的直角三角形求得。",
        level: "core",
      },
      {
        name: "圆与圆位置关系判定定理",
        latex:
          "\\begin{cases} d > r_1 + r_2 & \\text{外离 (4条公切线)} \\\\ d = r_1 + r_2 & \\text{外切 (3条公切线)} \\\\ |r_1 - r_2| < d < r_1 + r_2 & \\text{相交 (2条公切线)} \\\\ d = |r_1 - r_2| & \\text{内切 (1条公切线)} \\\\ 0 \\le d < |r_1 - r_2| & \\text{内含 (0条公切线)} \\end{cases}",
        level: "important",
      },
    );
  } else {
    theorems.push(
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
          "C_1(x,y) - C_2(x,y) = 0 \\implies 2(x_2-x_1)x + 2(y_2-y_1)y + (x_1^2+y_1^2-r_1^2 - x_2^2-y_2^2+r_2^2) = 0",
        note: "两圆方程相减消除二次项 x² 与 y²，所得一次方程即为公共弦（相交时）或根轴（不相交时）方程。",
        level: "derived",
      },
    );
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
