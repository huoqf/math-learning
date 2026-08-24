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
        ? "对椭圆：内切圆与底边 $F_1F_2$ 的切点横坐标为 $x_T = e^2 x_P$；切点到对应长轴顶点的切线长恒为 $a - c$！"
        : "对双曲线：内切圆与实轴切点恒落在实轴顶点 $(\\pm a, 0)$，切线长恒为 $a$！",
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
        : "【离心率与渐近线】双曲线 $e > 1$。渐近线斜率 $k = \\pm \\frac{b}{a} = \\pm \\sqrt{e^2 - 1}$。$e$ 越大双曲线开口越开阔。等轴双曲线 $e = \\sqrt{2}$，渐近线互相垂直 ($y = \\pm x$)。",
      importance: "gaokao",
    },
    {
      text: isEllipse
        ? "【直角焦点三角形存在性】动点 $P$ 在短轴端点 $(0, \\pm b)$ 时顶角 $\\theta$ 取得最大值，且 $\\tan\\frac{\\theta_{\\max}}{2} = \\frac{c}{b}$。若曲线上存在使 $\\angle F_1PF_2 = 90^\\circ$ 的点，当且仅当 $e \\ge \\frac{\\sqrt{2}}{2}$。"
        : "【焦点三角形面积极值】双曲线焦点三角形顶角 $\\theta \\in (0, 180^\\circ)$，当 $\\theta = 90^\\circ$ 时，$S_{\\triangle PF_1F_2} = b^2$。",
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

  // 5. 记忆口诀 Mnemonic
  const mnemonic =
    "椭加双减记心间，特征直角三角形现；椭圆越扁离心大，双曲越张 e 无限；焦点面积小切切，椭正切来双余切！";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
