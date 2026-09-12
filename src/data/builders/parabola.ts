import type { MathPanelData, ReasoningStep } from "../types";
import {
  getParabolaBaseInfo,
  getPointOnParabola,
  getFocalRadiusInfo,
  getFocalChordInfo,
  getTangentAndOpticalInfo,
  getDirectrixMongeInfo,
  type ParabolaDirection,
} from "@/math/parabola";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";

export function buildParabolaPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const p = params.p ?? 2.0;
  const tP = params.tP ?? 2.0;
  const thetaDeg = params.thetaDeg ?? 60.0;
  const yQ = params.yQ ?? 2.0;

  const direction = (config?.direction as ParabolaDirection) ?? "right";
  const studyMode = (config?.studyMode as string) ?? "definition";

  const base = getParabolaBaseInfo(p, direction);
  const safeP = base.p;

  // 1. 退化警告
  const warnings: MathPanelData["warnings"] = [];
  if (p <= 0) {
    warnings.push({
      text: "焦参数 $p$ 必须大于 $0$，$p \\le 0$ 时无法构成高中抛物线标准方程！",
      level: "danger",
    });
  }

  if (studyMode === "focalChord" && (thetaDeg <= 0 || thetaDeg >= 180)) {
    warnings.push({
      text: "焦点弦与对称轴夹角 $\\theta$ 必须在 $(0^\\circ, 180^\\circ)$ 范围内，不能与对称轴重合！",
      level: "warning",
    });
  }

  // 2. 数学量组装
  const quantities: MathPanelData["quantities"] = [];

  // 通用基础量
  quantities.push(
    {
      label: "焦参数 p",
      symbol: "p",
      value: formatMathNumber(safeP),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "焦点 F",
      symbol: "F",
      value: `(${formatMathNumber(base.focus.x)}, ${formatMathNumber(base.focus.y)})`,
      color: MATH_COLORS.focusPoint,
    },
    {
      label: "准线方程",
      symbol: "l",
      value: base.directrixIsVertical
        ? `x = ${formatMathNumber(base.directrixConstant)}`
        : `y = ${formatMathNumber(base.directrixConstant)}`,
      color: MATH_COLORS.asymptote,
    },
  );

  const P = getPointOnParabola(tP, safeP, direction);
  const radiusInfo = getFocalRadiusInfo(P, safeP, direction);
  const chordInfo = getFocalChordInfo(thetaDeg, safeP, direction);
  const opticalInfo = getTangentAndOpticalInfo(P, safeP, direction);
  const mongeInfo = getDirectrixMongeInfo(yQ, safeP, direction);

  if (studyMode === "definition") {
    quantities.push(
      {
        label: "动点 P 坐标",
        symbol: "P",
        value: `(${formatMathNumber(P.x)}, ${formatMathNumber(P.y)})`,
        color: MATH_COLORS.vectorSecondary,
      },
      {
        label: "准线垂足 H",
        symbol: "H",
        value: `(${formatMathNumber(radiusInfo.H.x)}, ${formatMathNumber(radiusInfo.H.y)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "焦半径 |PF|",
        symbol: "|PF|",
        value: formatMathNumber(
          Math.round(radiusInfo.focalRadius * 1000) / 1000,
        ),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "准线距离 d(P, l)",
        symbol: "d(P,l)",
        value: formatMathNumber(
          Math.round(radiusInfo.directrixDistance * 1000) / 1000,
        ),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "第一定义验证",
        symbol: "|PF|=d",
        value: radiusInfo.isEqual ? "恒等" : "近似",
        highlight: "positive",
      },
    );
  } else if (studyMode === "focalChord") {
    quantities.push(
      {
        label: "夹角 θ",
        symbol: "\\theta",
        value: `${formatMathNumber(thetaDeg)}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "焦点弦长 |AB|",
        symbol: "|AB|",
        value: formatMathNumber(Math.round(chordInfo.lengthAB * 1000) / 1000),
        color: MATH_COLORS.vectorPrimary,
      },
      {
        label: "弦中点 M",
        symbol: "M",
        value: `(${formatMathNumber(Math.round(chordInfo.midCircle.center.x * 100) / 100)}, ${formatMathNumber(Math.round(chordInfo.midCircle.center.y * 100) / 100)})`,
      },
      {
        label: "准线切点 K",
        symbol: "K",
        value: `(${formatMathNumber(Math.round(chordInfo.midCircle.directrixTangentPoint.x * 100) / 100)}, ${formatMathNumber(Math.round(chordInfo.midCircle.directrixTangentPoint.y * 100) / 100)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "倒数和 1/AF + 1/BF",
        symbol: "\\sum \\frac{1}{r}",
        value: `${formatMathNumber(Math.round(chordInfo.harmonicSum * 1000) / 1000)} (= 2/p)`,
        highlight: "extreme",
      },
      {
        label: "中位线与半径",
        symbol: "d(M,l)=R",
        value: chordInfo.midCircle.isTangentToDirectrix ? "相切恒等" : "误差",
        highlight: "positive",
      },
    );
  } else if (studyMode === "tangentOptical") {
    quantities.push(
      {
        label: "P点切线斜率",
        symbol: "k_P",
        value: Number.isFinite(opticalInfo.tangentSlope)
          ? formatMathNumber(Math.round(opticalInfo.tangentSlope * 100) / 100)
          : "∞ (垂直)",
        color: MATH_COLORS.vectorResult,
      },
      {
        label: "准线上点 Q",
        symbol: "Q",
        value: `(${formatMathNumber(mongeInfo.Q.x)}, ${formatMathNumber(mongeInfo.Q.y)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "双切线夹角",
        symbol: "QA \\perp QB",
        value: mongeInfo.isPerpendicular ? "垂直 (90°)" : "相交",
        highlight: "positive",
      },
      {
        label: "切点弦与焦点",
        symbol: "F \\in AB",
        value: mongeInfo.chordPassesFocus ? "必过焦点 F" : "否",
        highlight: "positive",
      },
      {
        label: "连线垂直判定",
        symbol: "QF \\perp AB",
        value: mongeInfo.isQFPerpAB ? "垂直 (90°)" : "否",
        highlight: "positive",
      },
      {
        label: "阿基米德△面积",
        symbol: "S_{\\triangle QAB}",
        value: `${formatMathNumber(Math.round(mongeInfo.areaQAB * 100) / 100)} (\\ge p^2=${formatMathNumber(safeP * safeP)})`,
        color: MATH_COLORS.vectorPrimary,
      },
    );
  }

  // 3. 动态焦半径公式字符串
  let focalRadiusFormula = "|PF| = x_0 + \\frac{p}{2}";
  if (direction === "left") focalRadiusFormula = "|PF| = -x_0 + \\frac{p}{2}";
  else if (direction === "up") focalRadiusFormula = "|PF| = y_0 + \\frac{p}{2}";
  else if (direction === "down")
    focalRadiusFormula = "|PF| = -y_0 + \\frac{p}{2}";

  // 4. 定理公式（随 studyMode 严格匹配，杜绝不相干内容）
  const theorems: MathPanelData["theorems"] = [];
  if (studyMode === "definition") {
    theorems.push({
      name: "抛物线第一定义与焦半径",
      latex: `|PF| = d(P, l) = ${focalRadiusFormula}`,
      note: "平面内与定点 $F$ (焦点) 和定直线 $l$ (准线) 距离相等的点的轨迹叫做抛物线。抛物线上任意动点到焦点的焦半径等于该点到准线的垂线距离。",
      prerequisites: ["$p > 0$", "定点 $F$ 不在准线 $l$ 上"],
      level: "core",
    });
  } else if (studyMode === "focalChord") {
    theorems.push({
      name: "焦点弦性质与直径圆相切定理",
      latex:
        "|AB| = \\frac{2p}{\\sin^2 \\theta}, \\quad \\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p}, \\quad d(M, l) = \\frac{|AB|}{2}",
      note: "① 焦点弦在 $\\theta=90^\\circ$ (通径) 处取得极小值 $2p$；② 焦半径倒数和恒为常数 $\\frac{2}{p}$；③ 以焦点弦 $AB$ 为直径的圆必与准线相切于点 $K$，圆心为弦中点 $M$。",
      prerequisites: [
        "$AB$ 为过焦点 $F$ 的割线",
        "$\\theta \\in (0^\\circ, 180^\\circ)$",
      ],
      level: "core",
    });
  } else {
    theorems.push(
      {
        name: "抛物线几何切线与光学反射定理",
        latex:
          "|FT| = |PF| = x_0 + \\frac{p}{2} \\implies \\angle TPF = \\angle TPH",
        note: "切线与对称轴交于点 $T(-x_0, 0)$，$\\triangle PTF$ 为等腰三角形。从焦点 $F$ 发出的光线经抛物线切点 $P$ 反射后平行于对称轴；平行光线经反射后汇聚于焦点 $F$。",
        prerequisites: ["点 $P(x_0, y_0)$ 在抛物线上", "切线斜率存在"],
        level: "core",
      },
      {
        name: "阿基米德正交三角形定理 (准线蒙日性质)",
        latex:
          "QA \\perp QB, \\quad F \\in AB, \\quad QF \\perp AB, \\quad S_{\\triangle QAB} \\ge p^2",
        note: "从准线上任意点 $Q$ 引抛物线的两条切线 $QA, QB$：① 两切线互相垂直 $QA \\perp QB$；② 切点弦 $AB$ 必过焦点 $F$ 且 $QF \\perp AB$；③ $\\triangle QAB$ 面积在通径端点切线处取得极小值 $p^2$。",
        prerequisites: ["点 $Q$ 在准线 $l$ 上"],
        level: "important",
      },
    );
  }

  // 5. 高考解答题破题推演链 (Step 1 审题定法 -> Step 2 建模联立代入 -> Step 3 求解反思，拒绝跳步跳数值)
  const reasoningSteps: ReasoningStep[] = [];
  const pHalf = formatMathNumber(safeP / 2);
  const pStr = formatMathNumber(safeP);

  if (studyMode === "definition") {
    const xPStr = formatMathNumber(P.x);
    const yPStr = formatMathNumber(P.y);
    const xFStr = formatMathNumber(base.focus.x);
    const yFStr = formatMathNumber(base.focus.y);
    const focalRadiusVal = formatMathNumber(
      Math.round(radiusInfo.focalRadius * 1000) / 1000,
    );
    const directrixDistVal = formatMathNumber(
      Math.round(radiusInfo.directrixDistance * 1000) / 1000,
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 第一定义等价转化",
        detail: `已知抛物线焦参数 $p = ${pStr}$，焦点 $F(${xFStr}, ${yFStr})$，准线方程 $l: ${base.directrixIsVertical ? `x = -${pHalf}` : `y = -${pHalf}`}$。根据定义，抛物线上任意动点 $P(x_0, y_0)$ 到焦点的距离恒等于到准线的垂直距离。`,
        latex: `|PF| = d(P, l) = ${focalRadiusFormula}`,
        rubric:
          "采分点：规范写出焦点坐标与准线方程，明确第一定义几何等价转化（3分）",
      },
      {
        step: 2,
        title: "建模代入 · 当前动点两点间距离与垂线距离演绎",
        detail: `当前动点 $P(${xPStr}, ${yPStr})$，代入平面两点间距离公式展开计算焦半径 $|PF|$，同时求点 $P$ 到准线 $l$ 的垂足 $H(${formatMathNumber(radiusInfo.H.x)}, ${formatMathNumber(radiusInfo.H.y)})$ 与垂线段长度：`,
        latex: `|PF| = \\sqrt{(x_P - x_F)^2 + (y_P - y_F)^2} = \\sqrt{(${xPStr} - ${xFStr})^2 + (${yPStr} - ${yFStr})^2} = ${focalRadiusVal}, \\quad d(P, l) = |x_P - (-${pHalf})| = ${directrixDistVal}`,
        rubric:
          "采分点：列出两点间距离代数式并代入具体坐标，精确求得焦半径与准线距离（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 高考折线距离和最值应用 (化折为直)",
        detail:
          "对于求平面定点 $A(x_A, y_A)$ 与抛物线上动点 $P$ 构成的折线距离和 $|PA| + |PF|$ 的最值问题，利用第一定义将焦半径转化为垂线段：$|PA| + |PF| = |PA| + |PH| \\ge |AH_A|$，当且仅当 $A, P, H_A$ 三点共线时取等号，最小值为点 $A$ 到准线 $l$ 的距离。",
        latex: `(|PA| + |PF|)_{\\min} = d(A, l) = x_A + \\frac{p}{2} = x_A + ${pHalf}`,
        rubric:
          "采分点：应用第一定义化折为直，写出三点共线充要条件与最值结论（4分）",
      },
    );
  } else if (studyMode === "focalChord") {
    const sinVal = Math.sin((thetaDeg * Math.PI) / 180);
    const sin2Val = Math.round(sinVal * sinVal * 1000) / 1000;
    const sin2Str = formatMathNumber(sin2Val);
    const twoPStr = formatMathNumber(2 * safeP);
    const chordLen = formatMathNumber(
      Math.round(chordInfo.lengthAB * 1000) / 1000,
    );
    const radiusVal = formatMathNumber(
      Math.round(chordInfo.midCircle.radius * 1000) / 1000,
    );
    const harmonicVal = formatMathNumber(
      Math.round(chordInfo.harmonicSum * 1000) / 1000,
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 焦点弦参数设线与联立展开",
        detail: `设过焦点 $F$ 且与对称轴正向夹角为 $\\theta = ${formatMathNumber(thetaDeg)}^\\circ$ 的直线，交抛物线于两端点 $A(x_1, y_1), B(x_2, y_2)$。采用直线参数方程联立消元：`,
        latex: `\\begin{cases} x = x_F + r\\cos\\theta \\\\ y = y_F + r\\sin\\theta \\end{cases} \\implies r^2\\sin^2\\theta - 2pr\\cos\\theta - p^2 = 0`,
        rubric:
          "采分点：设直线参数方程并代入抛物线方程整理为一元二次方程（3分）",
      },
      {
        step: 2,
        title: "建模代入 · 韦达代数核代入计算弦长",
        detail: `方程两根 $r_1, r_2$ 分别对应向径 $|AF|, -|BF|$。由韦达定理 $r_1 + r_2 = \\frac{2p\\cos\\theta}{\\sin^2\\theta}, r_1 r_2 = -\\frac{p^2}{\\sin^2\\theta}$，代入弦长展开式演绎计算：`,
        latex: `|AB| = r_1 - r_2 = \\frac{\\sqrt{(2p\\cos\\theta)^2 - 4(\\sin^2\\theta)(-p^2)}}{\\sin^2\\theta} = \\frac{2p}{\\sin^2\\theta} = \\frac{${twoPStr}}{\\sin^2(${formatMathNumber(thetaDeg)}^\\circ)} = \\frac{${twoPStr}}{${sin2Str}} = ${chordLen}`,
        rubric:
          "采分点：根与系数关系代数消元，代入具体角度精确求出焦点弦长（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 直径圆相切证明与焦半径调和定值",
        detail: `以 $AB$ 为直径的圆半径为 $R = \\frac{|AB|}{2} = \\frac{${chordLen}}{2} = ${radiusVal}$。弦中点 $M$ 到准线的垂直距离为梯形中位线：$d(M, l) = \\frac{d(A,l)+d(B,l)}{2} = \\frac{|AF|+|BF|}{2} = \\frac{|AB|}{2} = R$。故直径圆恒与准线切于点 $K$；且焦半径倒数和恒为定值：`,
        latex: `d(M, l) = R = ${radiusVal} \\implies \\text{圆 } M \\text{ 恒与准线切于点 } K, \\quad \\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p} = \\frac{2}{${pStr}} = ${harmonicVal}`,
        rubric:
          "采分点：由梯形中位线严格证明直径圆与准线相切，推演倒数和定值闭环（5分）",
      },
    );
  } else {
    // tangentOptical
    const xPStr = formatMathNumber(P.x);
    const yPStr = formatMathNumber(P.y);
    const yQStr = formatMathNumber(yQ);
    const kPStr = Number.isFinite(opticalInfo.tangentSlope)
      ? formatMathNumber(Math.round(opticalInfo.tangentSlope * 100) / 100)
      : "\\infty";
    const areaVal = formatMathNumber(Math.round(mongeInfo.areaQAB * 100) / 100);

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 抛物线切线与光学反射等腰三角形推演",
        detail: `抛物线上动点 $P(${xPStr}, ${yPStr})$ 处的切线方程为 $y_0 y = p(x + x_0)$，切线斜率 $k_P = ${kPStr}$。令 $y = 0$ 得对称轴截距点 $T(-${xPStr}, 0)$。由焦截距公式展开：`,
        latex: `|FT| = x_0 + \\frac{p}{2} = ${xPStr} + ${pHalf}, \\quad |PF| = d(P, l) = x_0 + \\frac{p}{2} \\implies |FT| = |PF|`,
        rubric:
          "采分点：求出切线对称轴截距，严格证明 △PTF 为等腰三角形与反射平分线（4分）",
      },
      {
        step: 2,
        title: "建模代入 · 准线动点 Q 切点弦过焦点与正交性证明",
        detail: `准线上动点 $Q(-${pHalf}, ${yQStr})$，引两条切线切点为 $A(x_1, y_1), B(x_2, y_2)$。切点弦方程为 $y_Q y = p(x - p/2)$。令 $x = p/2$ 得 $y = 0$，故切点弦恒过焦点 $F(p/2, 0)$。联立解得 $y_1 y_2 = -p^2$：`,
        latex: `k_{QA} \\cdot k_{QB} = \\frac{p}{y_1} \\cdot \\frac{p}{y_2} = \\frac{p^2}{y_1 y_2} = \\frac{p^2}{-p^2} = -1 \\implies QA \\perp QB`,
        rubric:
          "采分点：写出切点弦方程并代入焦点验证，利用韦达定理完成斜率乘积消元（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 垂径几何垂直与阿基米德三角形面积极值",
        detail: `向量内积展开：$\\vec{QF} \\cdot \\vec{AB} = (x_F - x_Q)(x_B - x_A) + (y_F - y_Q)(y_B - y_A) = 0 \\implies QF \\perp AB$。三角形 $QAB$ 的面积公式为：`,
        latex: `S_{\\triangle QAB} = \\frac{1}{2} |QF| \\cdot |AB| = \\frac{p^2}{\\sin^3\\theta} \\ge p^2 = ${pStr}^2 = ${formatMathNumber(safeP * safeP)} \\quad (当前S = ${areaVal})`,
        rubric:
          "采分点：向量内积证明 QF 垂直于切点弦，给出阿基米德三角形面积取等条件（4分）",
      },
    );
  }

  // 6. 高考考点（随 studyMode 严格特化，杜绝跨模式干扰）
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [];
  if (studyMode === "definition") {
    gaokaoPoints.push(
      {
        text: "曲折求直转化：利用第一定义将折线和 $|PA| + |PF|$ 转化为点到准线垂线距离 $|PA| + d(P,l)$，化折为直求三点共线最值。",
        importance: "gaokao",
      },
      {
        text: "焦半径范围与极值：在 $y^2 = 2px$ 中，焦半径 $|PF| = x_0 + \\frac{p}{2} \\ge \\frac{p}{2}$，当且仅当动点 $P$ 位于抛物线顶点 $(0, 0)$ 时取得最小值 $\\frac{p}{2}$。",
        importance: "core",
      },
    );
  } else if (studyMode === "focalChord") {
    gaokaoPoints.push(
      {
        text: "焦点弦长极速公式：弦长 $|AB| = \\frac{2p}{\\sin^2\\theta}$，在 $\\theta = 90^\\circ$ (垂直通径) 时取得最小值 $2p$；倾角为 $45^\\circ$ 或 $135^\\circ$ 时弦长为 $4p$。",
        importance: "gaokao",
      },
      {
        text: "焦半径倒数和定值模型：$\\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p}$ 为定值，且以 $AB$ 为直径的圆与准线恒相切于中点投影点 $K$。",
        importance: "gaokao",
      },
    );
  } else {
    gaokaoPoints.push(
      {
        text: "阿基米德三角形四大等价链条：点 $Q$ 在准线上 $\\iff QA \\perp QB \\iff$ 切点弦 $AB$ 过焦点 $F \\iff QF \\perp AB$。",
        importance: "hard",
      },
      {
        text: "面积与极值秒杀结论：$S_{\\triangle QAB} = \\frac{p^2}{\\sin^3\\theta} \\ge p^2$，在通径端点切线处取得最小值 $p^2$，常用于高考客观压轴速解。",
        importance: "gaokao",
      },
    );
  }

  // 7. 记忆口诀与题型标头（动态匹配当前模式）
  let mnemonic = "";
  let examAnchor = "";

  if (studyMode === "definition") {
    examAnchor = "高考解析几何基础解答题 · 抛物线定义与焦半径最值转化";
    mnemonic = "到焦点即到准线，化折为直三点线，顶点取得半距极小。";
  } else if (studyMode === "focalChord") {
    examAnchor = "高考解析几何核心解答题 · 抛物线焦点弦与相切圆综合推演";
    mnemonic = "弦长二比正弦方，倒数之和定常数，中点作圆切准线。";
  } else {
    examAnchor = "高考解析几何压轴解答题 · 抛物线光学性质与阿基米德正交性";
    mnemonic = "准线引切必垂直，弦过焦点垂QF，截距焦距等腰成。";
  }

  return {
    examAnchor,
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}
