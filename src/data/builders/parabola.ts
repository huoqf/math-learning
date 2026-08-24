import type { MathPanelData } from "../types";
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
      text: "焦参数 p 必须大于 0，p ≤ 0 时无法构成抛物线图形！",
      level: "danger",
    });
  }

  if (studyMode === "focalChord" && (thetaDeg <= 0 || thetaDeg >= 180)) {
    warnings.push({
      text: "焦点弦倾斜角 θ 必须在 (0°, 180°) 范围内，不能与对称轴平行！",
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
      value: safeP.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "焦点 F",
      symbol: "F",
      value: `(${base.focus.x.toFixed(2)}, ${base.focus.y.toFixed(2)})`,
      color: MATH_COLORS.focusPoint,
    },
    {
      label: "准线方程",
      symbol: "l",
      value: base.directrixIsVertical
        ? `x = ${base.directrixConstant.toFixed(2)}`
        : `y = ${base.directrixConstant.toFixed(2)}`,
      color: MATH_COLORS.asymptote,
    },
  );

  if (studyMode === "definition") {
    const P = getPointOnParabola(tP, safeP, direction);
    const radiusInfo = getFocalRadiusInfo(P, safeP, direction);

    quantities.push(
      {
        label: "动点 P 坐标",
        symbol: "P",
        value: `(${P.x.toFixed(2)}, ${P.y.toFixed(2)})`,
        color: MATH_COLORS.vectorSecondary,
      },
      {
        label: "准线垂足 H",
        symbol: "H",
        value: `(${radiusInfo.H.x.toFixed(2)}, ${radiusInfo.H.y.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "焦半径 |PF|",
        symbol: "|PF|",
        value: radiusInfo.focalRadius.toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "准线距离 d(P, l)",
        symbol: "d(P,l)",
        value: radiusInfo.directrixDistance.toFixed(3),
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
    const chordInfo = getFocalChordInfo(thetaDeg, safeP, direction);

    quantities.push(
      {
        label: "倾斜角 θ",
        symbol: "\\theta",
        value: `${thetaDeg.toFixed(1)}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "焦点弦长 |AB|",
        symbol: "|AB|",
        value: chordInfo.lengthAB.toFixed(3),
        color: MATH_COLORS.vectorPrimary,
      },
      {
        label: "弦中点 M",
        symbol: "M",
        value: `(${chordInfo.midCircle.center.x.toFixed(2)}, ${chordInfo.midCircle.center.y.toFixed(2)})`,
      },
      {
        label: "准线切点 K",
        symbol: "K",
        value: `(${chordInfo.midCircle.directrixTangentPoint.x.toFixed(2)}, ${chordInfo.midCircle.directrixTangentPoint.y.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "倒数和 1/AF + 1/BF",
        symbol: "\\sum \\frac{1}{r}",
        value: `${chordInfo.harmonicSum.toFixed(3)} (= 2/p)`,
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
    const P = getPointOnParabola(tP, safeP, direction);
    const opticalInfo = getTangentAndOpticalInfo(P, safeP, direction);
    const mongeInfo = getDirectrixMongeInfo(yQ, safeP, direction);

    quantities.push(
      {
        label: "P点切线斜率",
        symbol: "k_P",
        value: Number.isFinite(opticalInfo.tangentSlope)
          ? opticalInfo.tangentSlope.toFixed(2)
          : "∞ (垂直)",
        color: MATH_COLORS.vectorResult,
      },
      {
        label: "准线上点 Q",
        symbol: "Q",
        value: `(${mongeInfo.Q.x.toFixed(2)}, ${mongeInfo.Q.y.toFixed(2)})`,
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
        value: `${mongeInfo.areaQAB.toFixed(2)} (≥ p²=${(safeP * safeP).toFixed(1)})`,
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

  // 4. 定理公式（随 studyMode 动态置顶 core）
  const theorems: MathPanelData["theorems"] = [
    {
      name: "抛物线第一定义与焦半径",
      latex: `|PF| = d(P, l) = ${focalRadiusFormula}`,
      note: "平面内与定点 $F$ (焦点) 和定直线 $l$ (准线) 距离相等的点的轨迹叫做抛物线。焦半径等于动点到准线的垂直距离。",
      prerequisites: ["$p > 0$", "定点 $F$ 不在准线 $l$ 上"],
      level: studyMode === "definition" ? "core" : "important",
    },
    {
      name: "焦点弦性质与直径圆相切定理",
      latex:
        "|AB| = \\frac{2p}{\\sin^2 \\theta}, \\quad \\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p}, \\quad d(M, l) = \\frac{|AB|}{2}",
      note: "① 焦点弦在 $\\theta=90^\\circ$ (通径) 处取得最小值 $2p$；② 焦半径倒数和恒为常数 $\\frac{2}{p}$；③ 以焦点弦 $AB$ 为直径的圆必与准线相切于点 $K$，圆心为中点 $M$。",
      prerequisites: [
        "$AB$ 为过焦点 $F$ 的直线",
        "$\\theta \\in (0^\\circ, 180^\\circ)$",
      ],
      level: studyMode === "focalChord" ? "core" : "important",
    },
    {
      name: "抛物线阿基米德三角形定理 (准线蒙日定理)",
      latex:
        "QA \\perp QB, \\quad F \\in AB, \\quad QF \\perp AB, \\quad S_{\\triangle QAB} = \\frac{p^2}{\\sin^3\\theta} \\ge p^2",
      note: "从准线上任意点 $Q$ 引抛物线的两条切线 $QA, QB$：① 两切线互相垂直 $QA \\perp QB$；② 切点弦 $AB$ 必过焦点 $F$ 且 $QF \\perp AB$；③ $\\triangle QAB$ 面积在通径切线处取得最小值 $p^2$。",
      prerequisites: ["点 $Q$ 在准线 $l$ 上"],
      level: studyMode === "tangentOptical" ? "core" : "derived",
    },
  ];

  // 5. 高考考点
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "曲折求直转化：利用第一定义将折线和 $|PA| + |PF|$ 转化为点到准线垂线距离 $|PA| + d(P,l)$，化折为直求三点共线最值。",
      importance: "gaokao",
    },
    {
      text: "焦点弦极速结论：弦长 $|AB| = \\frac{2p}{\\sin^2\\theta}$，倒数和 $\\frac{1}{|AF|}+\\frac{1}{|BF|}=\\frac{2}{p}$，以 $AB$ 为直径的圆与准线相切于中点投影点 $K$。",
      importance: "gaokao",
    },
    {
      text: "阿基米德三角形四大等价链条：Q 在准线上 ⇔ QA ⊥ QB ⇔ 切点弦 AB 过焦点 F ⇔ QF ⊥ AB，面积 $S_{\\triangle QAB} \\ge p^2$ 秒杀压轴小题。",
      importance: "hard",
    },
  ];

  // 6. 记忆口诀
  const mnemonic =
    "到焦点即到准线，倒数之和定值为二比 p；准线上点引双切，互相垂直弦过焦且 QF 垂弦。";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
