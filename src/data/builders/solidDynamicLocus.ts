import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  solvePerpLineLocus,
  solveConstDistCircle,
  solveConstAngleConic,
  type SolidDynamicLocusMode,
  type ConicSectionType,
} from "@/math3d/solidDynamicLocus";

const CONIC_LABEL: Record<ConicSectionType, string> = {
  circle: "圆",
  ellipse: "椭圆",
  parabola: "抛物线",
  hyperbola: "双曲线的一支",
};

export function buildSolidDynamicLocusPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as SolidDynamicLocusMode) || "perpLineLocus";
  const a = params.a ?? 3;
  const t = params.t ?? 0.25;
  const rFactor = params.rFactor ?? 1.25;
  const tiltDeg = params.tiltDeg ?? 35;

  if (mode === "perpLineLocus") {
    const res = solvePerpLineLocus(a, t);
    const aStr = formatMathNumber(res.a);
    const bhStr = formatMathNumber(res.distBH, 3);
    const periStr = formatMathNumber(res.perimeter, 3);
    const areaStr = formatMathNumber(res.area, 3);

    return {
      examAnchor: "必修二第 8 章 · 立体几何线面垂直定动点轨迹截面",
      mnemonic: "找准定直线作垂面，两对线面垂直定全等，垂足重心三等分！",
      quantities: [
        {
          label: "正方体棱长",
          symbol: "a",
          value: res.a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "截面正三角形边长",
          symbol: "l = \\sqrt{2}a",
          value: formatMathNumber(Math.SQRT2 * res.a, 3),
          color: MATH_COLORS.function,
        },
        {
          label: "垂线段 BH",
          symbol: "BH",
          value: bhStr,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "截面边界周长",
          symbol: "C_{\\triangle AB_1C}",
          value: periStr,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "截面正三角形面积",
          symbol: "S_{\\triangle AB_1C}",
          value: areaStr,
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "线面垂直定截面定理",
          latex:
            "BD_1 \\perp AB_1 \\text{ 且 } BD_1 \\perp AC \\implies BD_1 \\perp \\text{平面 } AB_1C",
          condition:
            "正方体侧棱与底面边两两垂直，确保 $AB_1 \\perp \\text{平面 } A_1BD_1$ 且 $AC \\perp \\text{平面 } BDD_1B_1$。",
          note: "因 $A_1B \\perp AB_1$ 且 $A_1D_1 \\perp AB_1$，故 $AB_1 \\perp \\text{平面 } A_1BD_1$ 从而 $BD_1 \\perp AB_1$；同理 $BD_1 \\perp AC$，由线面垂直判定定理知 $BD_1 \\perp \\text{平面 } AB_1C$。",
          level: "core",
          prerequisites: ["线面垂直判定与性质定理", "正方体体对角线垂直关系"],
        },
        {
          name: "垂足位置与等体积结论",
          latex:
            "V_{B-AB_1C} = \\frac{1}{3} S_{\\triangle AB_1C} \\cdot BH \\implies BH = \\frac{\\sqrt{3}}{3}a",
          condition:
            "三棱锥 $B-AB_1C$ 满足侧棱 $BA$、$BB_1$、$BC$ 两两垂直且长度相等。",
          note: "由三棱锥等体积法可得斜高 $BH$ 为体对角线 $BD_1$ 长的 $\\frac{1}{3}$，垂足 $H$ 恰好为正三角形 $AB_1C$ 的中心。",
          level: "important",
          prerequisites: ["三棱锥等体积变换"],
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法：判定与定直线垂直的平面",
          latex:
            "AP \\perp BD_1 \\iff P \\in \\text{过 } A \\text{ 且垂直于 } BD_1 \\text{ 的平面}",
          detail:
            "设过点 $A$ 与直线 $BD_1$ 垂直的平面为 $\\alpha$，先连接体面对角线 $AB_1$、$AC$，分别证得 $BD_1 \\perp AB_1$ 与 $BD_1 \\perp AC$。",
          rubric:
            "【高考采分点】能写出两组垂直关系并判定出唯一平面 AB1C（3分）",
        },
        {
          step: 2,
          title: "截线定轨：确定正方体表面交线",
          latex: `AB_1 = B_1C = AC = \\sqrt{2}a \\implies C_{\\text{截}} = 3\\sqrt{2} \\cdot ${aStr} = ${periStr}`,
          detail: `代入棱长 $a = ${aStr}$，得正三角形截面 $\\triangle AB_1C$ 边长为 $\\sqrt{2}a$，周长 $3\\sqrt{2}a = ${periStr}$。`,
          rubric:
            "【高考采分点】正确确定表面轨迹为正三角形三边并求出周长（3分）",
        },
        {
          step: 3,
          title: "求解垂距：等体积法求垂足深度",
          latex: `\\frac{1}{3}\\cdot \\frac{1}{2}a^2\\cdot a = \\frac{1}{3}\\cdot \\frac{\\sqrt{3}}{4}(\\sqrt{2}a)^2 \\cdot BH \\implies BH = ${bhStr}`,
          detail: `解得 $BH = \\frac{\\sqrt{3}}{3}a = ${bhStr}$，截面面积 $S_{\\triangle AB_1C} = \\frac{\\sqrt{3}}{2}a^2 = ${areaStr}$。`,
          rubric:
            "【高考采分点】通过等体积法准确算出垂线段 BH 与截面面积（4分）",
        },
      ],
      gaokaoPoints: [
        {
          text: "线面垂直型动点轨迹转化：过定点寻找两条与定直线垂直的相交直线，即刻锁定唯一垂面再与多面体各表面求交线，从而化为截面周长与面积计算。",
          importance: "gaokao",
        },
      ],
      warnings: [],
    };
  }

  if (mode === "constDistCircle") {
    const res = solveConstDistCircle(a, rFactor, t);
    const aStr = formatMathNumber(res.a);
    const rBigStr = formatMathNumber(res.R, 3);
    const rSmallStr = formatMathNumber(res.circleRadius, 3);
    const arcStr = formatMathNumber(res.arcLength, 3);

    return {
      examAnchor: "必修二第 8 章 · 空间球面截底面定距圆弧轨迹",
      mnemonic: "斜线定长作垂线，直角勾股变圆心，先求圆半再截正方形！",
      quantities: [
        {
          label: "正方体棱长",
          symbol: "a",
          value: res.a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "空间定长半径",
          symbol: "R = A_1P",
          value: rBigStr,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "底面圆弧半径",
          symbol: "r = \\sqrt{R^2 - a^2}",
          value: rSmallStr,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "有效轨迹弧长",
          symbol: "L_{\\text{弧}} = \\frac{\\pi}{2} r",
          value: arcStr,
          color: MATH_COLORS.function,
        },
      ],
      theorems: [
        {
          name: "勾股降维定圆弧定理",
          latex:
            "A_1A \\perp \\text{平面 } ABCD \\implies AP^2 = A_1P^2 - A_1A^2 = R^2 - a^2",
          condition:
            "侧棱 $A_1A$ 垂直于底面 $ABCD$（垂足为 $A$），且定长满足 $a < R < \\sqrt{2}a$。",
          note: "底面内任意动点 $P$ 恒有 $A_1A \\perp AP$，故 $AP$ 为定值 $\\sqrt{R^2 - a^2}$，轨迹是以 $A$ 为圆心的圆截底面正方形内部所得四分之一圆弧。",
          level: "core",
          prerequisites: ["线面垂直性质", "平面圆轨迹定义"],
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "作垂找心：利用侧棱垂直底面降维",
          latex:
            "A_1A \\perp \\text{底面 } ABCD \\implies \\angle A_1AP = 90^\\circ",
          detail:
            "由于 $A_1A \\perp \\text{底面 } ABCD$ 且 $P$ 在底面内，故 $A_1A \\perp AP$，将空间定距 $A_1P = R$ 降维为平面 $ABCD$ 内的定距问题。",
          rubric: "【高考采分点】指明垂足 A 与直角三角形 A1AP（3分）",
        },
        {
          step: 2,
          title: "勾股求解：计算底面圆弧半径",
          latex: `r = \\sqrt{R^2 - a^2} = \\sqrt{${rBigStr}^2 - ${aStr}^2} = ${rSmallStr}`,
          detail: `代入 $a = ${aStr}$、$R = ${rBigStr}$，求得圆心在 $A$、半径 $r = ${rSmallStr}$，且满足 $0 < r < a$。`,
          rubric:
            "【高考采分点】由勾股定理得出正确圆半径并说明 r < a 的边界条件（3分）",
        },
        {
          step: 3,
          title: "定界算弧：取正方形第一象限圆弧",
          latex: `L = \\frac{\\pi}{2} \\cdot r = \\frac{\\pi}{2} \\cdot ${rSmallStr} = ${arcStr}`,
          detail: `因底面为 $\\angle BAD = 90^\\circ$ 的正方形且 $r < a$，圆周仅保留圆心角为 $\\frac{\\pi}{2}$ 的四分之一弧段，弧长 $L = ${arcStr}$。`,
          rubric: "【高考采分点】准确判定圆心角为 90° 并求出弧长数值（4分）",
        },
      ],
      gaokaoPoints: [
        {
          text: "球面截多面体表面交线问题：由空间定点向目标平面作垂线定下垂足（交圆圆心），再比较圆半径与多边形边长大小以判断圆弧分段数与圆心角。",
          importance: "gaokao",
        },
      ],
      warnings: [],
    };
  }

  const res = solveConstAngleConic(a, tiltDeg, t);
  const conicLabel = CONIC_LABEL[res.conicType];
  const criticalDeg = 90 - res.halfAngleDeg;
  const eStr = formatMathNumber(res.eccentricity, 3);
  const tiltStr = formatMathNumber(res.tiltDeg, 0);

  return {
    examAnchor: "选择性必修一 · 立体几何定角圆锥截面曲线分类",
    mnemonic: "半顶角与截面倾角和为九十是抛物，小于椭圆大于双曲！",
    quantities: [
      {
        label: "正方体棱长",
        symbol: "a",
        value: res.a,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "圆锥半顶角",
        symbol: "\\theta",
        value: `${res.halfAngleDeg}^\\circ`,
        color: MATH_COLORS.function,
      },
      {
        label: "截面与底面二面角",
        symbol: "\\beta",
        value: `${tiltStr}^\\circ`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "截面曲线离心率",
        symbol: "e = \\frac{\\sin\\beta}{\\cos\\theta}",
        value: eStr,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "交线曲线类型",
        symbol: "\\text{类型}",
        value: conicLabel,
        color: MATH_COLORS.paramPrimary,
      },
    ],
    theorems: [
      {
        name: "圆锥截交线综合判定定理",
        latex:
          "e = \\frac{\\sin\\beta}{\\cos\\theta} \\quad (\\theta = 35^\\circ)",
        condition: `圆锥轴线 $A_1A$ 垂直底面，半顶角 $\\theta = ${res.halfAngleDeg}^\\circ$，临界角为 $90^\\circ - \\theta = ${criticalDeg}^\\circ$。`,
        note: `当 $\\beta = 0^\\circ$ 时为圆；$0^\\circ < \\beta < ${criticalDeg}^\\circ$ 时为椭圆；$\\beta = ${criticalDeg}^\\circ$ 时截平面平行母线为抛物线；$\\beta > ${criticalDeg}^\\circ$ 时正方体内下锥面被截出双曲线的一支（延伸对顶倒圆锥上支构成完整双曲线）。`,
        level: "important",
        prerequisites: ["线线夹角定圆锥面", "圆锥曲线几何定义"],
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "锁定锥面：由线线定角识别圆锥面",
        latex: "\\angle(A_1P, A_1A) = \\theta = 35^\\circ",
        detail:
          "因为棱 $A_1A \\perp \\text{底面 } ABCD$ 且动射线 $A_1P$ 与轴线 $A_1A$ 夹角恒为 $35^\\circ$，故空间点 $P$ 必位于以 $A_1$ 为顶点、$A_1A$ 为轴的圆锥面上。",
        rubric: "【高考采分点】准确识别动点先满足圆锥面几何轨迹（3分）",
      },
      {
        step: 2,
        title: "比较倾角：对比截面倾角与临界余角",
        latex: `\\beta = ${tiltStr}^\\circ \\text{ 与 } 90^\\circ - \\theta = ${criticalDeg}^\\circ,\\; e = \\frac{\\sin ${tiltStr}^\\circ}{\\cos 35^\\circ} = ${eStr}`,
        detail: `当前截平面与底面二面角 $\\beta = ${tiltStr}^\\circ$，代入截面离心率比值式 $e = \\frac{\\sin\\beta}{\\cos\\theta}$ 得 $e = ${eStr}$。`,
        rubric: "【高考采分点】清晰列出截平面倾角与半顶角余角的大小比较（3分）",
      },
      {
        step: 3,
        title: "定型收束：确定截交圆锥曲线类别",
        latex: `e = ${eStr} \\implies \\text{截交轨迹为${conicLabel}}`,
        detail: `结合综合截交关系（$\\beta = ${tiltStr}^\\circ$），当前截面与圆锥面的交线轨迹严格为${conicLabel}。`,
        rubric: "【高考采分点】依据比较结果或离心率得出准确圆锥曲线类型（4分）",
      },
    ],
    gaokaoPoints: [
      {
        text: "“空间定角 + 平面截交”轨迹小题：直接比较截平面与圆锥轴线夹角（$90^\\circ - \\beta$）同圆锥半顶角 $\\theta$ 的大小关系即可定型，无需繁琐建系！",
        importance: "gaokao",
      },
    ],
    warnings: [],
  };
}
