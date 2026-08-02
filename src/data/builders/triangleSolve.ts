import type { MathPanelData } from "../types";
import { solveTriangleFromSAS, solveSSA } from "@/math/triangleSolve";
import { MATH_COLORS } from "@/theme";

export function buildTriangleSolvePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "sine";

  const angleA = params.angleA ?? 60;
  const b = params.b ?? 5;
  const c = params.c ?? 6;
  const a = params.a ?? 4.5;

  const sasResult = solveTriangleFromSAS(b, c, angleA);
  const ssaResult = solveSSA(a, b, angleA);

  if (studyMode === "ssa") {
    const { solutionCount, h, details } = ssaResult;
    const sol1 = details[0];

    const quantities = [
      {
        label: "已知对角 A",
        value: `${angleA.toFixed(1)}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "已知邻边 b",
        value: b.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "已知对边 a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "临界垂线高 h (b·sinA)",
        value: h.toFixed(2),
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "解的个数 (N_sol)",
        value: `${solutionCount} 个解`,
        color: solutionCount === 2 ? MATH_COLORS.sequenceHighlight : MATH_COLORS.inequality,
      },
    ];

    if (solutionCount > 0 && sol1) {
      quantities.push(
        {
          label: "解1: 边 c1",
          value: sol1.c.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "解1: 角 B1",
          value: `${((sol1.angleB * 180) / Math.PI).toFixed(1)}°`,
          color: MATH_COLORS.paramSecondary,
        }
      );
    }
    if (solutionCount === 2 && details[1]) {
      const sol2 = details[1];
      quantities.push(
        {
          label: "解2: 边 c2",
          value: sol2.c.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "解2: 角 B2",
          value: `${((sol2.angleB * 180) / Math.PI).toFixed(1)}°`,
          color: MATH_COLORS.paramSecondary,
        }
      );
    }

    return {
      quantities,
      theorems: [
        {
          name: "SSA 条件判定定理",
          latex:
            "A < 90^\\circ \\implies \\begin{cases} a < b\\sin A & \\text{0解} \\\\ a = b\\sin A & \\text{1解(直角)} \\\\ b\\sin A < a < b & \\text{2解(双解)} \\\\ a \\ge b & \\text{1解} \\end{cases}",
          condition: "已知两边及其中一边的对角 A, b, a",
          level: "core",
          mode: "block",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考必考：SSA 伪全等与双解判断。已知 a, b, A，若 a < b 且 a > b·sinA，则存在两个三角形（一个锐角三角形，一个钝角三角形），正弦定理求角时切记不可漏掉钝角解！",
          importance: "gaokao",
        },
      ],
      warnings:
        solutionCount === 0
          ? [
              {
                text: "无解警示：当前对边 a < h (b·sinA)，圆弧与射线无交点！",
                level: "danger",
              },
            ]
          : solutionCount === 2
          ? [
              {
                text: "双解警示：当前 h < a < b，圆弧存在两个交点 B1, B2，对应两个合法三角形！",
                level: "warning",
              },
            ]
          : [],
    };
  }

  // 正弦 / 余弦 / 面积 模式
  const { sides, anglesDeg, sineRatios, area, circumcircle, incircle } = sasResult;

  const quantities = [
    {
      label: "边长 a",
      value: sides.a.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "边长 b",
      value: sides.b.toFixed(2),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "边长 c",
      value: sides.c.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "内角 A",
      value: `${anglesDeg.A.toFixed(1)}°`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "内角 B",
      value: `${anglesDeg.B.toFixed(1)}°`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "内角 C",
      value: `${anglesDeg.C.toFixed(1)}°`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "正弦比 a/sinA",
      value: sineRatios.ratioA.toFixed(2),
      color: MATH_COLORS.function,
    },
    {
      label: "外接圆半径 R",
      value: circumcircle.radius.toFixed(2),
      color: MATH_COLORS.circle,
    },
    {
      label: "内切圆半径 r",
      value: incircle.radius.toFixed(2),
      color: MATH_COLORS.complexNum,
    },
    {
      label: "三角形面积 S",
      value: area.toFixed(2),
      color: MATH_COLORS.sequenceHighlight,
    },
  ];

  return {
    quantities,
    theorems: [
      {
        name: "正弦定理 (Sine Theorem)",
        latex: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R",
        condition: "任意 $\\triangle ABC$，R 为外接圆半径",
        level: "core",
      },
      {
        name: "余弦定理 (Cosine Theorem)",
        latex: "a^2 = b^2 + c^2 - 2bc \\cos A",
        condition: "变形：\\cos A = \\frac{b^2 + c^2 - a^2}{2bc}",
        level: "core",
      },
      {
        name: "面积与切接圆半径公式",
        latex: "S = \\frac{1}{2}bc\\sin A = \\frac{abc}{4R} = r \\cdot p",
        condition: "p = \\frac{a+b+c}{2} 为半周长",
        level: "important",
      },
    ],
    gaokaoPoints: [
      {
        text: "高考边角互化三大法则：① 边化角：a = 2R sinA, b = 2R sinB, c = 2R sinC；② 角化边：sinA = a/(2R), cosA = (b²+c²-a²)/(2bc)；③ 结合内角和 A+B+C = π 简化三角化简表达式。",
        importance: "gaokao",
      },
      {
        text: "投影定理（第一余弦定理）：a = b cosC + c cosB，在作垂线段划分底边时具有极高的几何直观与应用价值。",
        importance: "core",
      },
    ],
    warnings:
      anglesDeg.A >= 90
        ? [
            {
              text: "钝角/直角三角形注意：A 钝角时 cosA < 0，余弦定理中 -2bc cosA 项变加号，导致 a² > b² + c²。",
              level: "info",
            },
          ]
        : [],
  };
}
