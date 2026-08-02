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
  const tP = params.tP ?? 2.5;
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
        label: "纵坐标积 y1·y2",
        symbol: "y_1 y_2",
        value: chordInfo.prodY.toFixed(2),
      },
      {
        label: "倒数和 1/AF + 1/BF",
        symbol: "\\sum \\frac{1}{r}",
        value: chordInfo.harmonicSum.toFixed(4),
        highlight: "extreme",
      },
      {
        label: "直径圆与准线",
        symbol: "d=R",
        value: chordInfo.midCircle.isTangentToDirectrix ? "相切" : "相交",
        highlight: "positive",
      },
    );
  } else if (studyMode === "tangentOptical") {
    const P = getPointOnParabola(tP, safeP, direction);
    const opticalInfo = getTangentAndOpticalInfo(P, safeP, direction);
    const mongeInfo = getDirectrixMongeInfo(yQ, safeP, direction);

    quantities.push(
      {
        label: "切线斜率 k",
        symbol: "k",
        value: Number.isFinite(opticalInfo.tangentSlope)
          ? opticalInfo.tangentSlope.toFixed(3)
          : "∞",
      },
      {
        label: "准线上点 Q",
        symbol: "Q",
        value: `(${mongeInfo.Q.x.toFixed(2)}, ${mongeInfo.Q.y.toFixed(2)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "双切线垂直",
        symbol: "QA \\perp QB",
        value: mongeInfo.isPerpendicular ? "垂直 (90°)" : "相交",
        highlight: "positive",
      },
      {
        label: "切点弦归宿",
        symbol: "F \\in AB",
        value: mongeInfo.chordPassesFocus ? "必过焦点 F" : "否",
        highlight: "positive",
      },
    );
  }

  // 3. 定理公式
  const theorems: MathPanelData["theorems"] = [
    {
      name: "抛物线第一定义",
      latex: "|PF| = d(P, l)",
      note: "平面内与定点 $F$ (焦点) 和定直线 $l$ (准线) 距离相等的点的轨迹叫做抛物线。",
      prerequisites: ["$p > 0$", "定点 $F$ 不在定直线 $l$ 上"],
      level: "core",
    },
    {
      name: "焦半径与焦点弦公式",
      latex:
        "|PF| = x_0 + \\frac{p}{2},\\quad |AB| = x_1 + x_2 + p = \\frac{2p}{\\sin^2 \\theta}",
      note: "过焦点 $F$ 的弦长在 $\\theta = 90^\\circ$ (通径) 时最小为 $2p$；焦半径倒数和 $\\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p}$ 恒为常数。",
      prerequisites: [
        "$y^2 = 2px \\ (p > 0)$",
        "$\\theta \\in (0^\\circ, 180^\\circ)$",
      ],
      level: "important",
    },
    {
      name: "准线切线性质与蒙日定理",
      latex: "k_{QA} \\cdot k_{QB} = -1,\\quad F \\in AB",
      note: "① 以焦点弦 $AB$ 为直径的圆必与准线相切；② 从准线上任意点 $Q$ 引抛物线两切线 $QA$, $QB$ 必互相垂直，且切点弦 $AB$ 必过焦点 $F$。",
      prerequisites: ["点 $Q$ 在准线 $x = -p/2$ 上"],
      level: "derived",
    },
  ];

  // 4. 高考考点
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "曲折求直：利用第一定义将焦半径 $|PF|$ 转化为准线距离 $d(P,l)$ 求最值。",
      importance: "gaokao",
    },
    {
      text: "焦点弦设点化简：利用 $y_1 y_2 = -p^2$ 与倒数和 $\\frac{1}{|AF|}+\\frac{1}{|BF|}=\\frac{2}{p}$ 快速解题。",
      importance: "gaokao",
    },
    {
      text: "准线垂切线与切点弦焦点归宿证明题。",
      importance: "hard",
    },
  ];

  // 5. 记忆口诀
  const mnemonic =
    "准线距离即焦距，倒数之和定值为二比 p；准线上点引切线，互相垂直切点弦必过焦点。";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
