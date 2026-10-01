import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  formatMathNumber,
  formatMathRationalOrNumber,
} from "@/utils/mathFormat";
import {
  solveStandardCircle,
  solveGeneralCircle,
  solveThreePointsCircle,
  type CircleStudyMode,
} from "@/math/circleEquation";

export function buildCircleEquationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.studyMode as CircleStudyMode) ?? "standard";

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];

  const cPrimary = MATH_COLORS.paramPrimary;
  const cSecondary = MATH_COLORS.paramSecondary;
  const cTertiary = MATH_COLORS.paramTertiary;

  if (mode === "standard") {
    const a = params.a ?? 0;
    const b = params.b ?? 0;
    const r = params.r ?? 3;
    const px = params.px ?? 4;
    const py = params.py ?? 3;

    const res = solveStandardCircle(a, b, r, px, py);

    quantities.push(
      {
        label: "圆心坐标 C(a, b)",
        symbol: `C(${formatMathNumber(a)}, ${formatMathNumber(b)})`,
        value: `(${formatMathNumber(a)}, ${formatMathNumber(b)})`,
        color: cPrimary,
      },
      {
        label: "圆半径 r 与平方 r²",
        symbol: `r = ${formatMathNumber(r)}, \\quad r^2 = ${formatMathNumber(r * r)}`,
        value: `${formatMathNumber(r)}`,
        color: cTertiary,
      },
      {
        label: "点 P 到圆心距离 |PC|",
        symbol: `|PC| = \\sqrt{(x_P-a)^2 + (y_P-b)^2}`,
        value: `${formatMathNumber(res.distPC)} (${res.positionRelationLabel})`,
        color: cSecondary,
      },
      {
        label: "圆的标准方程",
        symbol: "(x-a)^2 + (y-b)^2 = r^2",
        value: res.standardEquationLatex,
        color: cPrimary,
      },
      {
        label: "展开后的一般方程",
        symbol: "x^2 + y^2 + Dx + Ey + F = 0",
        value: res.generalEquationLatex,
        color: cTertiary,
      },
    );

    theorems.push(
      {
        name: "圆的标准方程",
        latex: "(x - a)^2 + (y - b)^2 = r^2 \\quad (r > 0)",
        note: `圆心为 $C(${formatMathNumber(a)}, ${formatMathNumber(b)})$，半径为 $r = ${formatMathNumber(r)}$。当圆心位于原点时，方程简化为 $x^2 + y^2 = r^2$。`,
        prerequisites: ["半径 $r > 0$"],
        level: "core",
      },
      {
        name: "点与圆的位置关系代数判定",
        latex: "d = |PC| = \\sqrt{(x_0 - a)^2 + (y_0 - b)^2} \\gtreqqless r",
        note: "① $d < r \\iff$ 点在圆内；② $d = r \\iff$ 点在圆上；③ $d > r \\iff$ 点在圆外。",
        prerequisites: ["点 $P(x_0, y_0)$", "圆心 $C(a, b)$ 与半径 $r$"],
        level: "core",
      },
    );

    gaokaoPoints.push(
      {
        text: "标准方程几何直观：直接读出圆心坐标 $(a, b)$ 与半径 $r$；处理切线、弦长问题优先化为标准方程利用勾股定理。",
        importance: "core",
      },
      {
        text: "点圆位置代数化：代入 $(x_0-a)^2+(y_0-b)^2 - r^2$，其正负号对应点在圆外、圆上或圆内。",
        importance: "core",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 几何定义与设元列式",
        detail: `圆是平面内到定点（圆心 $C(${formatMathNumber(a)}, ${formatMathNumber(b)})$）的距离等于定长（半径 $r = ${formatMathNumber(r)}$）的点的集合。设圆上任意一点为 $M(x, y)$，由两点间距离公式：`,
        latex: `|MC| = \\sqrt{(x - a)^2 + (y - b)^2} = r \\implies \\sqrt{(x - (${formatMathNumber(a)}))^2 + (y - (${formatMathNumber(b)}))^2} = ${formatMathNumber(r)}`,
        rubric: "采分点：写出几何距离关系式并代入圆心半径参数（3分）",
      },
      {
        step: 2,
        title: "建模代入 · 两边平方化简求标准方程",
        detail: `两边平方化去根号，即得圆的标准方程；展开整理可得一般方程系数 $D = -2a, E = -2b, F = a^2+b^2-r^2$：`,
        latex: `${res.standardEquationLatex} \\iff ${res.generalEquationLatex}`,
        rubric: "采分点：两边平方化简得到标准方程与展开式（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 动点 P 与圆的位置关系代数判别",
        detail: `计算探究点 $P(${formatMathNumber(px)}, ${formatMathNumber(py)})$ 到圆心 $C$ 的距离并与半径 $r$ 比较：`,
        latex: `|PC| = \\sqrt{(${formatMathNumber(px)} - (${formatMathNumber(a)}))^2 + (${formatMathNumber(py)} - (${formatMathNumber(b)}))^2} = ${formatMathNumber(res.distPC)} ${res.positionRelation === "outside" ? ">" : res.positionRelation === "inside" ? "<" : "="} r = ${formatMathNumber(r)} \\implies \\text{${res.positionRelationLabel}}`,
        rubric: "采分点：准确计算两点距离并给出位置关系代数判定（2分）",
      },
    );
  } else if (mode === "general") {
    const D = params.D ?? -4;
    const E = params.E ?? 6;
    const F = params.F ?? -3;

    const res = solveGeneralCircle(D, E, F);

    // general 模式的系数与配方结果按「分数优先」显示：教材题里 D、E、F 与圆心、半径
    // 的真值本来就是分数（原式同乘系数即得），走 formatMathNumber 会被压成 0.67 这类
    // 机器小数，等于把「分数通分 + 配方」这个考点换成近似值。
    // 整数仍输出十进制字符串，故既有整数参数预设的显示完全不变。
    const fq = formatMathRationalOrNumber;

    quantities.push(
      {
        label: "一般方程系数",
        symbol: `D = ${fq(D)}, \\quad E = ${fq(E)}, \\quad F = ${fq(F)}`,
        value: `D=${fq(D)}, E=${fq(E)}, F=${fq(F)}`,
        color: cPrimary,
      },
      {
        label: "圆心判别式 Δ_c",
        symbol: `\\Delta_c = D^2 + E^2 - 4F`,
        value: `${fq(res.deltaC)}`,
        color: res.deltaC > 0 ? cSecondary : MATH_COLORS.degeneracy,
      },
      {
        label: "配方求得圆心",
        symbol: `C\\left(-\\frac{D}{2}, -\\frac{E}{2}\\right)`,
        value: `(${fq(res.center.x)}, ${fq(res.center.y)})`,
        color: cPrimary,
      },
      {
        label: "配方求得半径 r",
        symbol: `r = \\frac{\\sqrt{D^2+E^2-4F}}{2}`,
        value: res.deltaC > 0 ? `${fq(res.radius)}` : "无实数半径",
        color: cTertiary,
      },
      {
        label: "配方后标准方程",
        symbol: "(x-a)^2 + (y-b)^2 = r^2",
        value: res.standardEquationLatex,
        color: cPrimary,
      },
    );

    if (res.validity === "degenerate_point") {
      warnings.push({
        text: `退化单点警示：判别式 $\\Delta_c = D^2 + E^2 - 4F = 0$，方程退化为实数点 $(${fq(res.center.x)}, ${fq(res.center.y)})$，不表示圆。`,
        level: "danger",
      });
    } else if (res.validity === "no_graph") {
      warnings.push({
        text: `无实数图形警示：判别式 $\\Delta_c = D^2 + E^2 - 4F = ${fq(res.deltaC)} < 0$，平方和等于负数，无实数轨迹。`,
        level: "danger",
      });
    }

    theorems.push({
      name: "圆的一般方程与配方法",
      latex:
        "x^2 + y^2 + Dx + Ey + F = 0 \\iff \\left(x + \\frac{D}{2}\\right)^2 + \\left(y + \\frac{E}{2}\\right)^2 = \\frac{D^2 + E^2 - 4F}{4}",
      note: `配方特征：① $D^2+E^2-4F > 0$ 表示圆，圆心 $(-\\frac{D}{2}, -\\frac{E}{2})$，半径 $r = \\frac{\\sqrt{D^2+E^2-4F}}{2}$；② 等于 0 表示单点；③ 小于 0 无实数轨迹。`,
      prerequisites: ["$x^2$ 与 $y^2$ 系数相同且不为 0", "不含 $xy$ 交叉项"],
      level: "core",
    });

    gaokaoPoints.push(
      {
        text: "一般方程充要条件：二元二次方程 $Ax^2+Bxy+Cy^2+Dx+Ey+F=0$ 表示圆的充要条件是 $A=C \\ne 0, B=0$，且 $D^2+E^2-4AF > 0$。",
        importance: "core",
      },
      {
        text: "配方法规范步骤：一次项系数除以 2 凑完全平方式，两边同加常数项 $\\frac{D^2+E^2}{4}$，移项求得半径平方。",
        importance: "core",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 分组配方与凑完全平方",
        detail: `将方程中含 $x$ 与含 $y$ 的项分别分组，常数项移到等号右边：`,
        latex: `(x^2 + Dx) + (y^2 + Ey) = -F \\implies (x^2 + (${fq(D)})x) + (y^2 + (${fq(E)})y) = -(${fq(F)})`,
        rubric: "采分点：正确分组并移项（2分）",
      },
      {
        step: 2,
        title: "建模代入 · 两边同加半系数平方",
        detail: `在等号两边同时加上 $\\left(\\frac{D}{2}\\right)^2 = ${fq((D / 2) ** 2)}$ 和 $\\left(\\frac{E}{2}\\right)^2 = ${fq((E / 2) ** 2)}$：`,
        // 右端直接落成最终常数值 Δ_c/4（= r²）：分数预设下 Δ_c = 16/9 时写 \frac{4}{9}，
        // 而不是嵌套的 \frac{\frac{16}{9}}{4}——配方这一步的采分点就是算出这个常数。
        latex: `\\left(x + \\frac{D}{2}\\right)^2 + \\left(y + \\frac{E}{2}\\right)^2 = \\frac{D^2 + E^2 - 4F}{4} = ${fq(res.deltaC / 4)}`,
        rubric: "采分点：两边完成配方求得右端常数值（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 判别式分类与几何性质得出",
        detail: `由判别式 $\\Delta_c = D^2 + E^2 - 4F = ${fq(res.deltaC)}$ 的符号判定方程所表示的图形：`,
        latex:
          res.deltaC > 0
            ? `\\Delta_c > 0 \\implies \\text{圆心 } C(${fq(res.center.x)}, ${fq(res.center.y)}), \\quad r = \\frac{\\sqrt{${fq(res.deltaC)}}}{2} = ${fq(res.radius)}`
            : res.deltaC === 0
              ? `\\Delta_c = 0 \\implies \\text{退化为单点 } (${fq(res.center.x)}, ${fq(res.center.y)})`
              : `\\Delta_c < 0 \\implies \\text{无实数解，不表示任何几何图形}`,
        rubric: "采分点：由判别式准确给出圆心、半径或退化结论（3分）",
      },
    );
  } else {
    // threePoints
    const pA = { x: params.x1 ?? 2, y: params.y1 ?? 1 };
    const pB = { x: params.x2 ?? -2, y: params.y2 ?? 3 };
    const pC = { x: params.x3 ?? 0, y: params.y3 ?? -3 };

    const res = solveThreePointsCircle(pA, pB, pC);

    quantities.push(
      {
        label: "已知三点坐标",
        symbol: `A(${formatMathNumber(pA.x)}, ${formatMathNumber(pA.y)}), B(${formatMathNumber(pB.x)}, ${formatMathNumber(pB.y)}), C(${formatMathNumber(pC.x)}, ${formatMathNumber(pC.y)})`,
        value: `A, B, C 三点`,
        color: cPrimary,
      },
      {
        label: "求解状态",
        symbol: res.isCollinear ? "\\text{三点共线}" : "\\text{确定唯一外接圆}",
        value: res.isCollinear ? "三点共线(无法成圆)" : "成功求解外接圆",
        color: res.isCollinear ? MATH_COLORS.degeneracy : cSecondary,
      },
      {
        label: "待定系数 D, E, F",
        symbol:
          res.D !== undefined && res.E !== undefined && res.F !== undefined
            ? `D = ${formatMathNumber(res.D)}, E = ${formatMathNumber(res.E)}, F = ${formatMathNumber(res.F)}`
            : "\\text{无解}",
        value:
          res.D !== undefined && res.E !== undefined && res.F !== undefined
            ? `D=${formatMathNumber(res.D)}, E=${formatMathNumber(res.E)}, F=${formatMathNumber(res.F)}`
            : "无解",
        color: cTertiary,
      },
      {
        label: "求得外接圆圆心",
        symbol: res.center
          ? `O'(${formatMathNumber(res.center.x)}, ${formatMathNumber(res.center.y)})`
          : "\\text{不存在}",
        value: res.center
          ? `(${formatMathNumber(res.center.x)}, ${formatMathNumber(res.center.y)})`
          : "不存在",
        color: cPrimary,
      },
      {
        label: "外接圆半径 R",
        symbol:
          res.radius !== undefined
            ? `R = ${formatMathNumber(res.radius)}`
            : "\\text{不存在}",
        value:
          res.radius !== undefined
            ? `${formatMathNumber(res.radius)}`
            : "不存在",
        color: cTertiary,
      },
    );

    if (res.isCollinear) {
      warnings.push({
        text: "三点共线警示：点 $A, B, C$ 位于同一直线上，三角形退化，无法构成外接圆！",
        level: "danger",
      });
    }

    theorems.push(
      {
        name: "待定系数法求圆的方程",
        latex:
          "x^2 + y^2 + Dx + Ey + F = 0 \\quad (\\text{代入三点坐标列线性方程组})",
        note: "不在同一直线上的三点确定一个圆。代入三点坐标得到关于 $D, E, F$ 的三元一次方程组，解方程组即得一般方程。",
        prerequisites: ["三点不共线（三点围成非退化三角形）"],
        level: "core",
      },
      {
        name: "三角形外心几何性质",
        latex: "O'A = O'B = O'C = R \\iff O' \\text{ 为三边垂直平分线交点}",
        note: "外接圆圆心（外心）是三角形三边垂直平分线的交点，到三个顶点的距离均等于外接圆半径 $R$。",
        prerequisites: ["$A, B, C$ 不共线"],
        level: "core",
      },
    );

    gaokaoPoints.push(
      {
        text: "待定系数法题型通法：① 设方程（已知圆心/半径设标准式，已知曲线上三点设一般式）；② 代入条件列方程组；③ 解方程组并检验判别式 $D^2+E^2-4F > 0$。",
        importance: "core",
      },
      {
        text: "几何法巧解：若三点构成直角三角形，斜边中点即为圆心，斜边长一半即为半径，可直接口算秒杀。",
        importance: "core",
      },
    );

    if (!res.isCollinear && res.D !== undefined) {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 设一般方程并代入三点",
          detail: `设圆的一般方程为 $x^2 + y^2 + Dx + Ey + F = 0$。将三点 $A, B, C$ 坐标分别代入方程：`,
          latex: `\\begin{cases} ${formatMathNumber(pA.x)}D + ${formatMathNumber(pA.y)}E + F = -(${formatMathNumber(pA.x * pA.x + pA.y * pA.y)}) \\\\ ${formatMathNumber(pB.x)}D + ${formatMathNumber(pB.y)}E + F = -(${formatMathNumber(pB.x * pB.x + pB.y * pB.y)}) \\\\ ${formatMathNumber(pC.x)}D + ${formatMathNumber(pC.y)}E + F = -(${formatMathNumber(pC.x * pC.x + pC.y * pC.y)}) \\end{cases}`,
          rubric: "采分点：设一般方程并准确代入三点列出三元一次方程组（3分）",
        },
        {
          step: 2,
          title: "建模代入 · 解三元一次方程组求系数",
          detail: `两两作差消去常数项 $F$，解得未知系数 $D, E, F$：`,
          latex: `D = ${formatMathNumber(res.D)}, \\quad E = ${formatMathNumber(res.E!)}, \\quad F = ${formatMathNumber(res.F!)}`,
          rubric: "采分点：消元准确求解线性方程组（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 写出方程并验证外接圆几何量",
          detail: `将系数代入得圆的一般方程与配方后的标准方程，验证外心与半径：`,
          latex: `${res.generalEquationLatex} \\iff ${res.standardEquationLatex} \\implies R = ${formatMathNumber(res.radius!)}`,
          rubric: "采分点：写出方程并指明外心与半径（2分）",
        },
      );
    }
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
  };
}
