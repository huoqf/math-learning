import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { calculateCircleCircle } from "@/math/circleCircle";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";

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
      const lineLabel =
        res.commonChord.lineType === "chord"
          ? "公共弦所在直线方程"
          : res.commonChord.lineType === "tangent"
            ? "公切线方程 (退化)"
            : "两圆根轴方程 (无公共弦)";

      quantities.push({
        label: lineLabel,
        symbol: "C_1 - C_2 = 0",
        value: res.commonChord.line.latex,
        color: MATH_COLORS.paramTertiary,
      });

      if (res.relation === "intersect" && res.commonChord.length !== null) {
        quantities.push({
          label: "公共弦长 |AB| (垂径勾股法)",
          symbol: "|AB|",
          value: `${formatMathNumber(res.commonChord.length)} = 2\\sqrt{r_1^2 - d_1^2}`,
          color: MATH_COLORS.paramTertiary,
        });

        if (res.commonChord.distToO1 !== null) {
          quantities.push({
            label: "弦心距 d1 (O1 到弦 AB 距离)",
            symbol: "d_1",
            value: formatMathNumber(res.commonChord.distToO1),
            color: MATH_COLORS.paramSecondary,
          });
        }

        if (res.intersections.length === 2) {
          quantities.push({
            label: "交点坐标 A, B",
            symbol: "A, B",
            value: `A(${formatMathNumber(res.intersections[0].x)}, ${formatMathNumber(res.intersections[0].y)}), B(${formatMathNumber(res.intersections[1].x)}, ${formatMathNumber(res.intersections[1].y)})`,
            color: MATH_COLORS.primary,
          });
        }
      } else {
        quantities.push({
          label: "公共弦状态",
          symbol: "L_{chord}",
          value:
            res.relation === "outer_tangent" || res.relation === "inner_tangent"
              ? "两圆相切，公共弦退化为单一点 (切点)"
              : "两圆无公共点，不存在公共弦",
          color: MATH_COLORS.paramPrimary,
        });
      }
    }

    quantities.push(
      {
        label: "圆心距 d (O1O2)",
        symbol: "d",
        value: formatMathNumber(res.d),
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
            ? formatMathNumber(res.outerTangentLength)
            : "无外公切线",
        color: MATH_COLORS.primary,
      },
      {
        label: "内公切线长 L内",
        symbol: "L_{inner}",
        value:
          res.innerTangentLength !== null
            ? formatMathNumber(res.innerTangentLength)
            : "无内公切线",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "圆心距 d",
        symbol: "d",
        value: formatMathNumber(res.d),
        color: MATH_COLORS.primary,
      },
      {
        label: "半径和与差",
        symbol: "r_1+r_2, |r_1-r_2|",
        value: `${formatMathNumber(res.sumR)}, ${formatMathNumber(res.diffR)}`,
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
        value: formatMathNumber(res.d),
        color: MATH_COLORS.primary,
      },
      {
        label: "半径和 r1 + r2",
        symbol: "r_1 + r_2",
        value: formatMathNumber(res.sumR),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "半径差 |r1 - r2|",
        symbol: "|r_1 - r_2|",
        value: formatMathNumber(res.diffR),
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
        name: "两圆公共弦所在直线方程定理 (作差法)",
        latex:
          "C_1 - C_2 = 0 \\implies 2(x_2-x_1)x + 2(y_2-y_1)y + (x_1^2+y_1^2-r_1^2 - x_2^2-y_2^2+r_2^2) = 0",
        condition:
          "两圆必须相交 (|r_1 - r_2| < d < r_1 + r_2) 时方为公共弦方程",
        note: "两圆标准方程展开相减消除二次项 $x^2$ 与 $y^2$，所得一次方程即为公共弦（两圆相交时）所在直线方程，且该直线与连心线 $O_1O_2$ 垂直。",
        level: "core",
      },
      {
        name: "垂径定理与公共弦长勾股公式 (通性通法)",
        latex: "|AB| = 2\\sqrt{r_1^2 - d_1^2} = 2\\sqrt{r_2^2 - d_2^2}",
        condition:
          "d_1 = \\frac{|A x_1 + B y_1 + C|}{\\sqrt{A^2 + B^2}} \\text{ 为圆心 } O_1 \\text{ 到公共弦的弦心距}",
        note: "在直角三角形 $O_1 M A$ 中应用勾股定理，无需联立一元二次方程解交点坐标，大幅简化计算。",
        level: "core",
      },
      {
        name: "圆与圆位置关系判定定理 (几何法)",
        latex:
          "\\begin{cases} d > r_1 + r_2 & \\text{外离} \\\\ d = r_1 + r_2 & \\text{外切} \\\\ |r_1 - r_2| < d < r_1 + r_2 & \\text{相交} \\\\ d = |r_1 - r_2| & \\text{内切} \\\\ 0 \\le d < |r_1 - r_2| & \\text{内含} \\end{cases}",
        level: "derived",
      },
    );
  } else if (studyMode === "commonTangent") {
    theorems.push(
      {
        name: "公切线长计算公式 (平移构造直角三角形)",
        latex:
          "L_{\\text{外公切}} = \\sqrt{d^2 - (r_1 - r_2)^2}, \\quad L_{\\text{内公切}} = \\sqrt{d^2 - (r_1 + r_2)^2}",
        condition:
          "外公切线要求 $d \\ge |r_1 - r_2|$；内公切线要求 $d \\ge r_1 + r_2$",
        note: "平移公切线至圆心，分别构造以 $d$ 为斜边、半径差 $|r_1 - r_2|$ 或半径和 $(r_1 + r_2)$ 为直角边的直角三角形求得。",
        level: "core",
      },
      {
        name: "位置关系与公切线条数对应规律",
        latex:
          "\\begin{array}{c|c|c} \\text{位置关系} & \\text{圆心距 } d \\text{ 条件} & \\text{公切线条数} \\\\ \\hline \\text{外离} & d > r_1 + r_2 & 4 \\text{ (2外2内)} \\\\ \\text{外切} & d = r_1 + r_2 & 3 \\text{ (2外1内)} \\\\ \\text{相交} & |r_1-r_2| < d < r_1+r_2 & 2 \\text{ (2外0内)} \\\\ \\text{内切} & d = |r_1-r_2| & 1 \\text{ (1外0内)} \\\\ \\text{内含} & 0 \\le d < |r_1-r_2| & 0 \\end{array}",
        level: "important",
      },
    );
  } else {
    theorems.push(
      {
        name: "圆与圆位置关系判定定理 (几何法 vs 代数法)",
        latex:
          "\\begin{cases} d > r_1 + r_2 & \\text{外离 (4条切线)} \\\\ d = r_1 + r_2 & \\text{外切 (3条切线)} \\\\ |r_1 - r_2| < d < r_1 + r_2 & \\text{相交 (2条切线)} \\\\ d = |r_1 - r_2| & \\text{内切 (1条切线)} \\\\ 0 \\le d < |r_1 - r_2| & \\text{内含 (0条切线)} \\end{cases}",
        condition: "$r_1 > 0, r_2 > 0, d = \\sqrt{(x_1-x_2)^2 + (y_1-y_2)^2}$",
        note: "几何法可细分 5 种位置关系；联立方程代数法判别式 $\\Delta$ 仅能给出公共点个数（2个/1个/0个），无法细分外切与内切、外离与内含。",
        level: "core",
      },
      {
        name: "公共弦 / 根轴方程定理",
        latex:
          "C_1(x,y) - C_2(x,y) = 0 \\implies 2(x_2-x_1)x + 2(y_2-y_1)y + (x_1^2+y_1^2-r_1^2 - x_2^2-y_2^2+r_2^2) = 0",
        note: "两圆方程相减消除二次项 $x^2$ 与 $y^2$。相交时为公共弦方程；相切时为公切线；相离时为等幂根轴方程。",
        level: "derived",
      },
    );
  }

  // 3. 高考三步破题推导链 (当相交时构建垂径勾股推导链)
  const reasoningSteps: ReasoningStep[] = [];
  const chord = res.commonChord;
  if (
    res.relation === "intersect" &&
    chord !== null &&
    chord.length !== null &&
    chord.distToO1 !== null
  ) {
    const d1Val: number = chord.distToO1;
    const lenVal: number = chord.length;
    reasoningSteps.push(
      {
        step: 1,
        title: "第一步：两圆方程作差消元，求公共弦所在直线方程",
        latex: `C_1 - C_2 = 0 \\implies ${chord.line.latex}`,
        detail:
          "两圆方程相减抵消二次项 $x^2, y^2$，所得一次方程即为两圆相交公共弦 $AB$ 所在直线方程。",
        rubric: "求得公共弦方程",
      },
      {
        step: 2,
        title: "第二步：计算圆心 O1 到公共弦的弦心距 d1",
        latex: `d_1 = \\frac{|A x_1 + B y_1 + C|}{\\sqrt{A^2 + B^2}} = ${formatMathNumber(d1Val)}`,
        detail: `代入圆心 $O_1(${formatMathNumber(x1)}, ${formatMathNumber(y1)})$ 坐标，求得弦心距 $d_1 = ${formatMathNumber(d1Val)}$。`,
        rubric: "计算弦心距",
      },
      {
        step: 3,
        title: "第三步：在 Rt△O1 M A 中应用垂径勾股定理求解弦长",
        latex: `|AB| = 2\\sqrt{r_1^2 - d_1^2} = 2\\sqrt{${formatMathNumber(r1)}^2 - (${formatMathNumber(d1Val)})^2} = ${formatMathNumber(lenVal)}`,
        detail: `利用垂径定理与勾股定理求出相交公共弦长 $|AB| = ${formatMathNumber(lenVal)}$，避免联立一元二次方程，提升解题速度。`,
        rubric: "求得公共弦长",
      },
    );
  }

  // 4. 高考考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【公共弦几何求法】两圆相交时，公共弦 $AB$ 必垂直于圆心连线 $O_1O_2$，且 $O_1O_2$ 垂直平分线段 $AB$。求公共弦长必须首选垂径勾股法：$(|AB|/2)^2 = r_1^2 - d_1^2$。",
      importance: "gaokao",
    },
    {
      text: "【作差速算充要性】两圆方程作差 $C_1 - C_2 = 0$ 仅在两圆相交时方为公共弦方程；若相切则为公切线方程；若外离或内含，该直线为等幂根轴，不能误称公共弦。",
      importance: "gaokao",
    },
    {
      text: "【圆系方程拓展】经过两圆 $C_1 = 0$ 与 $C_2 = 0$ 交点的圆系方程为 $C_1 + \\lambda C_2 = 0\\ (\\lambda \\ne -1)$。当 $\\lambda = -1$ 时二次项完全抵消，退化为两圆公共弦所在直线方程。",
      importance: "core",
    },
  ];

  // 5. 退化警示
  const warnings: WarningItem[] = [];

  if (res.relation === "concentric") {
    warnings.push({
      text: "两圆圆心重合 ($d=0$)，两圆方程作差 $x, y$ 一次项系数均为 0，不能构成有效直线方程，不存在公共弦与公切线。",
      level: "danger",
    });
  } else if (
    res.relation === "inner_tangent" ||
    res.relation === "outer_tangent"
  ) {
    warnings.push({
      text: "两圆相切时公共弦退化为单一切点 $T$，方程 $C_1 - C_2 = 0$ 在几何上恰好为过切点 $T$ 且垂直于连心线 $O_1O_2$ 的公切线方程。",
      level: "warning",
    });
  } else if (res.relation === "disjoint" || res.relation === "contain") {
    warnings.push({
      text: "两圆无公共点，不存在公共弦。作差得到的直线为两圆的根轴（其上任意点到两圆切线长相等）。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
    gaokaoPoints,
    warnings,
  };
}
