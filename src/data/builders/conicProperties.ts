import type {
  MathPanelData,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  calculateConicProperties,
  type ConicType,
} from "@/features/conicProperties/math/conicProperties";
import { MATH_COLORS } from "@/theme";

export function buildConicPropertiesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const conicType = (config?.conicType as ConicType) || "ellipse";
  const studyMode = (config?.studyMode as string) || "basicProperties";

  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const t = params.t ?? Math.PI / 4;

  const calc = calculateConicProperties(conicType, a, b, t);
  const { c, e, directrices, latusRectum, focusTriangle } = calc;

  const isEllipse = conicType === "ellipse";

  // 1. 数学量 Quantities (带有 \cmd 或 _^ 的字段会自动被 Katex 渲染)
  const quantities = [
    {
      label: isEllipse ? "半长轴 a" : "半实轴 a",
      value: a.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: isEllipse ? "半短轴 b" : "半虚轴 b",
      value: b.toFixed(2),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "半焦距 c",
      value: c.toFixed(2),
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "离心率 e = c/a",
      value: e.toFixed(3),
      color: MATH_COLORS.primary,
    },
    {
      label: "准线方程 x",
      value: `\\pm ${directrices.rightX.toFixed(2)}`,
      color: MATH_COLORS.primary,
    },
    {
      label: "通径长 L = 2b^2/a",
      value: latusRectum.length.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
  ];

  if (!isEllipse && calc.asymptotes) {
    quantities.push({
      label: "渐近线斜率 k = \\pm b/a",
      value: `\\pm ${calc.asymptotes.slope.toFixed(2)}`,
      color: MATH_COLORS.paramSecondary,
    });
  }

  if (studyMode === "focusTriangle") {
    quantities.push(
      {
        label: "焦半径 r_1",
        value: focusTriangle.r1.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "焦半径 r_2",
        value: focusTriangle.r2.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "顶角 θ",
        value: `${focusTriangle.angleDeg.toFixed(1)}°`,
        color: MATH_COLORS.primary,
      },
      {
        label: "焦点三角形面积 S",
        value: focusTriangle.areaGeom.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "内切圆半径 r_{in}",
        value: focusTriangle.incircle.inradius.toFixed(3),
        color: MATH_COLORS.paramTertiary,
      },
    );
  }

  // 2. 定理与公式 Theorems
  const theorems: Theorem[] = [
    {
      name: isEllipse ? "椭圆几何基本关系" : "双曲线几何基本关系",
      latex: isEllipse
        ? `a^2 = b^2 + c^2 \\quad (a > b > 0)`
        : `c^2 = a^2 + b^2 \\quad (a, b > 0)`,
      prerequisites: ["平面直角坐标系", "焦点在 $x$ 轴上"],
    },
    {
      name: "焦点三角形面积与内切圆定理",
      latex: isEllipse
        ? `S_{\\triangle PF_1F_2} = b^2 \\tan\\frac{\\theta}{2}, \\quad r_{\\text{in}} = \\frac{S}{a+c} = \\frac{b^2\\tan\\frac{\\theta}{2}}{a+c}`
        : `S_{\\triangle PF_1F_2} = \\frac{b^2}{\\tan\\frac{\\theta}{2}}`,
      condition: `$\\theta = \\angle F_1PF_2$ 为焦点三角形顶角`,
      note: isEllipse
        ? "对椭圆：内切圆与底边 $F_1F_2$ 的切点横坐标为 $x_T = e x_P$；动点 $P$ 向内切圆引的两条切线长恒为定值 $a - c$！"
        : "对双曲线：内切圆与实轴切点恒落在实轴顶点 $(\\pm a, 0)$，内心横坐标恒为定值 $\\pm a$！",
    },
  ];

  // 3. 高考考点 GaokaoPoints (公式全部采用规范 $...$ 包裹)
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【新高考通法·焦点三角形秒杀 4 步法】① 由第一定义列出 $r_1 \\pm r_2 = 2a$；② 在 $\\triangle PF_1F_2$ 中应用余弦定理 $(2c)^2 = r_1^2 + r_2^2 - 2r_1r_2\\cos\\theta$；③ 联立化简求得 $r_1r_2$ 乘积；④ 代入面积公式 $S = \\frac{1}{2}r_1r_2\\sin\\theta = b^2\\tan\\frac{\\theta}{2}$（双曲线为 $\\frac{b^2}{\\tan(\\theta/2)}$）。",
      importance: "gaokao",
    },
    {
      text: isEllipse
        ? "【离心率与扁平度】椭圆 $0 < e < 1$。$e$ 越接近 1，椭圆越扁（$b \\to 0, c \\to a$）；$e$ 越接近 0，椭圆越圆（$b \\to a, c \\to 0$）。"
        : "【离心率与渐近线】双曲线 $e > 1$。渐近线斜率 $k = \\pm \\frac{b}{a} = \\pm \\sqrt{e^2 - 1}$，渐近线夹角 $\\alpha$ 满足 $\\cos\\frac{\\alpha}{2} = \\frac{1}{e}$。等轴双曲线 $e = \\sqrt{2}$，两渐近线互相垂直。",
      importance: "gaokao",
    },
    {
      text: isEllipse
        ? "【直角焦点三角形存在性】动点 $P$ 在短轴端点 $(0, \\pm b)$ 时顶角 $\\theta$ 取得最大值，且 $\\tan\\frac{\\theta_{\\max}}{2} = \\frac{c}{b}$。若曲线上存在使 $\\angle F_1PF_2 = 90^\\circ$ 的点，当且仅当 $e \\ge \\frac{\\sqrt{2}}{2}$。"
        : "【焦点三角形面积极值】双曲线焦点三角形顶角 $\\theta \\in (0, 180^\\circ)$，当 $\\theta = 90^\\circ$ 时，$S_{\\triangle PF_1F_2} = b^2$；动点 $P$ 趋向实轴顶点时 $\\theta \\to 180^\\circ$。",
      importance: "gaokao",
    },
    {
      text: "【通径核心性质】过焦点垂直于主轴的弦长为通径 $L = \\frac{2b^2}{a}$。通径是过焦点所有相交弦中长度最短者（垂直最短弦）。",
      importance: "core",
    },
  ];

  // 4. 退化警示 Warnings
  const warnings: WarningItem[] = [];

  if (isEllipse && b >= a - 0.1) {
    warnings.push({
      text: "当 $b \\to a$ 时，$c \\to 0$，离心率 $e \\to 0$，椭圆退化为圆 ($x^2 + y^2 = a^2$)。",
      level: "warning",
    });
  }

  if (!isEllipse && Math.abs(a - b) < 0.1) {
    warnings.push({
      text: "当 $a = b$ 时为等轴双曲线，渐近线方程为 $y = \\pm x$ (互相垂直)，离心率 $e = \\sqrt{2}$。",
      level: "info",
    });
  }

  if (isEllipse && e >= 0.707) {
    const angleMaxDeg = ((focusTriangle.maxAngleRad * 180) / Math.PI).toFixed(
      1,
    );
    warnings.push({
      text: `当前 $e = ${e.toFixed(3)} \\ge \\frac{\\sqrt{2}}{2} \\approx 0.707$，短轴顶点处顶角 $\\theta_{\\max} = ${angleMaxDeg}^\\circ \\ge 90^\\circ$，存在直角焦点三角形！`,
      level: "danger",
    });
  }

  // 5. 高考破题三步推演链 reasoningSteps
  const reasoningSteps = [];
  if (studyMode === "basicProperties") {
    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 主轴关系与焦距确定",
        detail: isEllipse
          ? `由椭圆标准方程 $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ ($a > b > 0$)，焦点位于 $x$ 轴。主轴等量关系为 $a^2 = b^2 + c^2$。`
          : `由双曲线标准方程 $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$ ($a, b > 0$)，焦点位于 $x$ 轴。等量关系为 $c^2 = a^2 + b^2$。`,
        latex: isEllipse
          ? `c = \\sqrt{a^2 - b^2} = \\sqrt{${a.toFixed(2)}^2 - ${b.toFixed(2)}^2} = ${c.toFixed(2)}`
          : `c = \\sqrt{a^2 + b^2} = \\sqrt{${a.toFixed(2)}^2 + ${b.toFixed(2)}^2} = ${c.toFixed(2)}`,
        rubric: "采分点：规范写出 $a, b, c$ 平方关系并代入求值（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 顶点、焦点与离心率解算",
        detail: `代入当前参数 $a = ${a.toFixed(2)}, b = ${b.toFixed(2)}, c = ${c.toFixed(2)}$，求得焦点与离心率：`,
        latex: `F_1(-${c.toFixed(2)}, 0),\\; F_2(${c.toFixed(2)}, 0),\\quad e = \\frac{c}{a} = \\frac{${c.toFixed(2)}}{${a.toFixed(2)}} = ${e.toFixed(3)}`,
        rubric: "采分点：准确写出焦点坐标与离心率（2分）",
      },
      {
        step: 3,
        title: "求解反思 · 准线与特征线（通径/渐近线）",
        detail: isEllipse
          ? `椭圆准线方程为 $x = \\pm \\frac{a^2}{c}$，通径长为 $L = \\frac{2b^2}{a}$。`
          : `双曲线渐近线方程为 $y = \\pm \\frac{b}{a}x$，通径长为 $L = \\frac{2b^2}{a}$。`,
        latex: isEllipse
          ? `x = \\pm \\frac{${(a * a).toFixed(2)}}{${c.toFixed(2)}} = \\pm ${directrices.rightX.toFixed(2)},\\quad L = \\frac{2 \\times ${b.toFixed(2)}^2}{${a.toFixed(2)}} = ${latusRectum.length.toFixed(2)}`
          : `y = \\pm \\frac{${b.toFixed(2)}}{${a.toFixed(2)}}x = \\pm ${(b / a).toFixed(2)}x,\\quad L = \\frac{2 \\times ${b.toFixed(2)}^2}{${a.toFixed(2)}} = ${latusRectum.length.toFixed(2)}`,
        rubric: "采分点：规范列出特征线与通径公式（2分）",
      },
    );
  } else if (studyMode === "eccentricity") {
    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 离心率定义与形态特征",
        detail: isEllipse
          ? `椭圆离心率 $e = \\frac{c}{a} \\in (0, 1)$。由 $b^2 = a^2(1 - e^2)$ 可知，$e$ 直接决定椭圆的扁平程度。`
          : `双曲线离心率 $e = \\frac{c}{a} \\in (1, +\\infty)$。由 $b^2 = a^2(e^2 - 1)$ 可知，$e$ 直接决定双曲线的开口开阔度。`,
        latex: isEllipse
          ? `b = a\\sqrt{1 - e^2} = ${a.toFixed(2)} \\times \\sqrt{1 - ${e.toFixed(3)}^2} = ${b.toFixed(2)}`
          : `b = a\\sqrt{e^2 - 1} = ${a.toFixed(2)} \\times \\sqrt{${e.toFixed(3)}^2 - 1} = ${b.toFixed(2)}`,
        rubric: "采分点：由离心率转化出半轴比值关系（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 渐近线夹角与通径联动",
        detail: isEllipse
          ? `通径长度随离心率关系式为 $L = 2a(1 - e^2)$。当 $e \\to 0$ 时 $L \\to 2a$；当 $e \\to 1$ 时 $L \\to 0$。`
          : `双曲线渐近线斜率 $k = \\pm \\frac{b}{a} = \\pm \\sqrt{e^2 - 1}$，渐近线半张角满足 $\\cos\\frac{\\alpha}{2} = \\frac{1}{e}$。`,
        latex: isEllipse
          ? `L = 2 \\times ${a.toFixed(2)} \\times (1 - ${e.toFixed(3)}^2) = ${latusRectum.length.toFixed(2)}`
          : `\\cos\\frac{\\alpha}{2} = \\frac{1}{${e.toFixed(3)}} = ${(1 / e).toFixed(3)} \\implies \\alpha \\approx ${(2 * Math.acos(Math.min(1, 1 / e)) * (180 / Math.PI)).toFixed(1)}^\\circ`,
        rubric: "采分点：联立离心率与几何特征参量公式（2分）",
      },
      {
        step: 3,
        title: "求解反思 · 典型构型与高考秒杀",
        detail: isEllipse
          ? `当 $e = \\frac{\\sqrt{2}}{2} \\approx 0.707$ 时，$c = b$，短轴端点张角恰为 $90^\\circ$（直角焦点三角形临界）。`
          : `当 $a = b$ 即 $e = \\sqrt{2} \\approx 1.414$ 时，两渐近线互相垂直（等轴双曲线）；当 $e = 2$ 时渐近线夹角为 $120^\\circ$。`,
        latex: isEllipse
          ? `e \\ge \\frac{\\sqrt{2}}{2} \\iff \\text{椭圆上存在直角焦点三角形}`
          : `e = \\sqrt{2} \\iff y = \\pm x \\iff \\text{渐近线互相垂直}`,
        rubric: "采分点：得出高考特征极值与充要条件结论（2分）",
      },
    );
  } else {
    // focusTriangle
    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 第一定义与焦半径关系",
        detail: isEllipse
          ? `设动点 $P(x_P, y_P)$ 在椭圆上，由第一定义 $r_1 + r_2 = 2a = 2 \\times ${a.toFixed(2)} = ${(2 * a).toFixed(2)}$。`
          : `设动点 $P(x_P, y_P)$ 在双曲线右支上，由第一定义 $r_1 - r_2 = 2a = 2 \\times ${a.toFixed(2)} = ${(2 * a).toFixed(2)}$。`,
        latex: isEllipse
          ? `r_1 = ${focusTriangle.r1.toFixed(2)},\\; r_2 = ${focusTriangle.r2.toFixed(2)},\\; r_1 + r_2 = ${(focusTriangle.r1 + focusTriangle.r2).toFixed(2)} = 2a`
          : `r_1 = ${focusTriangle.r1.toFixed(2)},\\; r_2 = ${focusTriangle.r2.toFixed(2)},\\; r_1 - r_2 = ${(focusTriangle.r1 - focusTriangle.r2).toFixed(2)} = 2a`,
        rubric: "采分点：利用圆锥曲线第一定义建立焦半径等式（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 余弦定理联立与积化代换",
        detail: `在 $\\triangle PF_1F_2$ 中底边为 $2c = ${(2 * c).toFixed(2)}$，顶角为 $\\theta = ${focusTriangle.angleDeg.toFixed(1)}^\\circ$。由余弦定理：`,
        latex: isEllipse
          ? `(2c)^2 = (r_1+r_2)^2 - 2r_1r_2(1+\\cos\\theta) \\implies r_1r_2 = \\frac{b^2}{\\cos^2(\\theta/2)}`
          : `(2c)^2 = (r_1-r_2)^2 + 2r_1r_2(1-\\cos\\theta) \\implies r_1r_2 = \\frac{b^2}{\\sin^2(\\theta/2)}`,
        rubric: "采分点：列出余弦定理并完成完全平方差消元（2分）",
      },
      {
        step: 3,
        title: "求解反思 · 面积公式化简与内切圆性质",
        detail: isEllipse
          ? `代入 $S = \\frac{1}{2}r_1r_2\\sin\\theta = b^2\\tan\\frac{\\theta}{2}$；底边切点横坐标 $x_T = ex_P = ${(e * calc.pointP.x).toFixed(2)}$，动点切线长 $l_P = a - c = ${(a - c).toFixed(2)}$。`
          : `代入 $S = \\frac{1}{2}r_1r_2\\sin\\theta = \\frac{b^2}{\\tan(\\theta/2)}$；内切圆切点恒为实轴顶点 $A_2(${a.toFixed(2)}, 0)$。`,
        latex: isEllipse
          ? `S_{\\triangle PF_1F_2} = ${b.toFixed(2)}^2 \\times \\tan(${((focusTriangle.angleDeg / 2) * (Math.PI / 180)).toFixed(2)}) = ${focusTriangle.areaGeom.toFixed(2)}`
          : `S_{\\triangle PF_1F_2} = \\frac{${b.toFixed(2)}^2}{\\tan(${((focusTriangle.angleDeg / 2) * (Math.PI / 180)).toFixed(2)})} = ${focusTriangle.areaGeom.toFixed(2)}`,
        rubric: "采分点：准确代入半角正切公式求出面积与内切圆特征量（2分）",
      },
    );
  }

  // 6. 记忆口诀 Mnemonic
  const mnemonic =
    "椭加双减记心间，特征直角三角形现；椭圆越扁离心大，双曲越张 e 无限；焦点面积小切切，椭正切来双余切！";

  const examAnchor = isEllipse
    ? "高考解析几何压轴 · 椭圆几何性质与焦点三角形综合探究"
    : "高考解析几何压轴 · 双曲线性质、渐近线与离心率综合探究";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic,
  };
}
