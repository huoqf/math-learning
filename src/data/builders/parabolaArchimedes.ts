import type { MathPanelData } from "../types";
import {
  getParabolaArchimedesBase,
  getArchimedesTriangleInfo,
  getFocalChordAdvInfo,
  getOrthogonalChordsInfo,
} from "@/math/parabolaArchimedes";
import { MATH_COLORS } from "@/theme";

export function buildParabolaArchimedesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const p = params.p ?? 2.0;
  const yQ = params.yQ ?? 1.5;
  const thetaDeg = params.thetaDeg ?? 60.0;

  const mode =
    (config?.mode as
      "archimedesTriangle" | "focalChordProperties" | "orthogonalChords") ??
    "archimedesTriangle";

  const base = getParabolaArchimedesBase(p);
  const safeP = base.p;

  // 1. 退化警告
  const warnings: MathPanelData["warnings"] = [];
  if (p <= 0) {
    warnings.push({
      text: "焦准距 p 必须大于 0，p ≤ 0 时抛物线退化为射线或重合直线！",
      level: "danger",
    });
  }

  // 2. 数学量指标
  const quantities: MathPanelData["quantities"] = [];

  // 通用母体量
  quantities.push(
    {
      label: "焦准距 p",
      symbol: "p",
      value: safeP.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "焦点 F 坐标",
      symbol: "F",
      value: `(${base.focus.x.toFixed(2)}, ${base.focus.y.toFixed(2)})`,
      color: MATH_COLORS.focusPoint,
    },
    {
      label: "准线方程",
      symbol: "l",
      value: `x = ${base.directrixX.toFixed(2)}`,
      color: MATH_COLORS.asymptote,
    },
  );

  if (mode === "archimedesTriangle") {
    const arch = getArchimedesTriangleInfo(safeP, yQ);

    quantities.push(
      {
        label: "准线外点 Q",
        symbol: "Q",
        value: `(${arch.Q.x.toFixed(2)}, ${arch.Q.y.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "切点 A",
        symbol: "A",
        value: `(${arch.A.x.toFixed(2)}, ${arch.A.y.toFixed(2)})`,
        color: MATH_COLORS.vectorPrimary,
      },
      {
        label: "切点 B",
        symbol: "B",
        value: `(${arch.B.x.toFixed(2)}, ${arch.B.y.toFixed(2)})`,
        color: MATH_COLORS.vectorPrimary,
      },
      {
        label: "正交垂直判定",
        symbol: "QA \\perp QB",
        value: arch.isPerpendicular ? "垂直 (k₁k₂=-1)" : "相交",
        highlight: "positive",
      },
      {
        label: "切点弦过焦点",
        symbol: "F \\in AB",
        value: arch.chordPassesFocus ? "必过焦点 F" : "否",
        highlight: "positive",
      },
      {
        label: "连线垂直定理",
        symbol: "QF \\perp AB",
        value: arch.isQFPerpAB ? "正交垂直 (90°)" : "否",
        highlight: "positive",
      },
      {
        label: "中线平分验证",
        symbol: "P_0 \\text{ 为 } QM \\text{ 中点}",
        value: arch.isP0MidpointOfQM ? "弧二等分中线" : "否",
        highlight: "positive",
      },
      {
        label: "阿基米德△面积",
        symbol: "S_{\\triangle QAB}",
        value: `${arch.areaQAB.toFixed(2)} (≥ p²=${arch.minArea.toFixed(1)})`,
        color: MATH_COLORS.vectorResult,
        highlight:
          Math.abs(arch.areaQAB - arch.minArea) < 0.05 ? "extreme" : undefined,
      },
      {
        label: "抛物线弓形面积",
        symbol: "S_{\\text{弓形}}",
        value: `${arch.areaParabolicSegment.toFixed(2)} (=\\frac{2}{3}S)`,
        color: MATH_COLORS.vectorSecondary,
      },
    );
  } else if (mode === "focalChordProperties") {
    const chord = getFocalChordAdvInfo(safeP, thetaDeg);

    quantities.push(
      {
        label: "焦点弦倾角 θ",
        symbol: "\\theta",
        value: `${thetaDeg.toFixed(1)}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "焦点弦长 |AB|",
        symbol: "|AB|",
        value: chord.lengthAB.toFixed(3),
        color: MATH_COLORS.vectorPrimary,
        highlight: Math.abs(thetaDeg - 90) < 0.5 ? "extreme" : undefined,
      },
      {
        label: "焦半径 |AF|, |BF|",
        symbol: "r_1, r_2",
        value: `${chord.lengthAF.toFixed(2)}, ${chord.lengthBF.toFixed(2)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "焦半径分割比 λ",
        symbol: "\\lambda=|AF|/|BF|",
        value: chord.focalRatio.toFixed(2),
      },
      {
        label: "倒数和 1/AF+1/BF",
        symbol: "\\sum 1/r",
        value: `${chord.harmonicSum.toFixed(3)} (= 2/p)`,
        highlight: "extreme",
      },
      {
        label: "以AB为直径圆切准线",
        symbol: "d(M, l) = R",
        value: chord.directrixTangentCircle.isTangent ? "相切恒成立" : "相交",
        highlight: "positive",
      },
      {
        label: "准线切点 K",
        symbol: "K",
        value: `(${chord.directrixTangentCircle.tangentPointK.x.toFixed(2)}, ${chord.directrixTangentCircle.tangentPointK.y.toFixed(2)})`,
        color: MATH_COLORS.asymptote,
      },
      {
        label: "AF直径圆切y轴",
        symbol: "d(O_A, y) = R_A",
        value: chord.vertexTangentCircleA.isTangentToYAxis
          ? "相切恒成立"
          : "相交",
        highlight: "positive",
      },
    );
  } else {
    // orthogonalChords
    const ortho = getOrthogonalChordsInfo(safeP, thetaDeg);

    quantities.push(
      {
        label: "第一弦倾角 θ",
        symbol: "\\theta_1",
        value: `${ortho.thetaDeg.toFixed(1)}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "第二弦倾角 θ+90°",
        symbol: "\\theta_2",
        value: `${(ortho.thetaDeg + 90).toFixed(1)}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "弦长 |AB|, |CD|",
        symbol: "|AB|, |CD|",
        value: `${ortho.chordAB.lengthAB.toFixed(2)}, ${ortho.chordCD.lengthAB.toFixed(2)}`,
        color: MATH_COLORS.vectorPrimary,
      },
      {
        label: "弦长倒数和 1/|AB|+1/|CD|",
        symbol: "\\sum 1/L",
        value: `${ortho.harmonicSumChords.toFixed(3)} (= 1/(2p))`,
        highlight: "extreme",
      },
      {
        label: "弦长之和 |AB|+|CD|",
        symbol: "\\sum L",
        value: `${ortho.sumLengths.toFixed(2)} (≥ 8p=${ortho.minSumLengths.toFixed(1)})`,
        color: MATH_COLORS.vectorResult,
        highlight:
          Math.abs(ortho.sumLengths - ortho.minSumLengths) < 0.1
            ? "extreme"
            : undefined,
      },
      {
        label: "四边形 ACBD 面积",
        symbol: "S_{ACBD}",
        value: `${ortho.quadrilateralArea.toFixed(2)} (≥ 8p²=${ortho.minArea.toFixed(1)})`,
        color: MATH_COLORS.paramPrimary,
        highlight:
          Math.abs(ortho.quadrilateralArea - ortho.minArea) < 0.2
            ? "extreme"
            : undefined,
      },
    );
  }

  // 3. 定理公式（随 mode 动态置顶 core）
  const theorems: MathPanelData["theorems"] = [
    {
      name: "阿基米德正交切线定理 (准线蒙日定理)",
      latex: "Q \\in l \\iff QA \\perp QB \\iff F \\in AB \\iff QF \\perp AB",
      note: "从准线上任意点 $Q$ 引抛物线切线：① 两切线互相垂直 $QA \\perp QB$；② 切点弦 $AB$ 必过焦点 $F$；③ 连线 $QF \\perp AB$；④ 弦中点 $M$ 满足 $y_M = y_Q$，抛物线弧恰好平分中线 $QM$。",
      prerequisites: [
        "点 $Q$ 在准线 $x = -\\frac{p}{2}$ 上",
        "抛物线方程 $y^2 = 2px$",
      ],
      level: mode === "archimedesTriangle" ? "core" : "important",
    },
    {
      name: "阿基米德面积比与极值定理",
      latex:
        "S_{\\triangle QAB} = \\frac{|y_1 - y_2|^3}{8p} = \\frac{p^2}{\\sin^3\\theta} \\ge p^2, \\quad S_{\\text{弓形}} = \\frac{2}{3} S_{\\triangle QAB}",
      note: "阿基米德三角形面积在通径端点切线处取得极小值 $p^2$（此时 $QA \\perp QB$ 且 $Q, A, O, B$ 构成等腰直角几何对称体）。抛物线弓形面积恒等于三角形面积的三分之二。",
      prerequisites: [
        "$\\theta$ 为焦点弦倾斜角",
        "$\\theta=90^\\circ$ 时取等号",
      ],
      level: mode === "archimedesTriangle" ? "core" : "derived",
    },
    {
      name: "焦点弦长与焦半径调和倒数和定理",
      latex:
        "|AB| = x_1 + x_2 + p = \\frac{2p}{\\sin^2\\theta}, \\quad \\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p}",
      note: "① 焦点弦在通径 $\\theta=90^\\circ$ 处取得最短长度 $2p$；② 焦半径倒数之和为恒定常数 $\\frac{2}{p}$，即焦半径成调和关系；③ 纵标乘积 $y_1 y_2 = -p^2$ 为定值。",
      prerequisites: [
        "直线 $AB$ 过焦点 $F$",
        "$\\theta \\in (0^\\circ, 180^\\circ)$",
      ],
      level: mode === "focalChordProperties" ? "core" : "important",
    },
    {
      name: "直径圆相切定理 (准线切圆与轴切圆)",
      latex:
        "d(M, l) = \\frac{|AB|}{2} = R, \\quad d(O_A, \\text{y-axis}) = \\frac{|AF|}{2} = R_A",
      note: "① 以焦点弦 $AB$ 为直径的圆必与准线相切于点 $K(-\\frac{p}{2}, y_M)$；② 以焦半径 $AF$（或 $BF$）为直径的圆必与 $y$ 轴（抛物线顶点切线）相切。",
      prerequisites: ["$M$ 为 $AB$ 中点", "准线 $l: x = -\\frac{p}{2}$"],
      level: mode === "focalChordProperties" ? "core" : "derived",
    },
    {
      name: "双垂直焦点弦倒数和与面积极值定理",
      latex:
        "\\frac{1}{|AB|} + \\frac{1}{|CD|} = \\frac{1}{2p}, \\quad |AB| + |CD| \\ge 8p, \\quad S_{ACBD} = \\frac{1}{2}|AB||CD| \\ge 8p^2",
      note: "过焦点互相垂直的两条弦 $AB \\perp CD$：弦长倒数和恒等于 $\\frac{1}{2p}$；在 $\\theta=45^\\circ$ 对称位置处，弦长和取得最小值 $8p$，四边形面积取得最小值 $8p^2$。",
      prerequisites: ["$AB \\perp CD$ 且均过焦点 $F$"],
      level: mode === "orthogonalChords" ? "core" : "important",
    },
  ];

  // 4. 高考考点
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "新高考多选秒杀链：准线上点 Q ⇔ QA⊥QB ⇔ 切点弦 AB 过焦点 ⇔ QF⊥AB ⇔ y1 y2 = -p²。真题题设出现任意一条，其余三条可直接秒杀使用。",
      importance: "hard",
    },
    {
      text: "阿基米德平分中线与面积比：中线 QM 平行对称轴，被抛物线弧中点 P0 二等分；抛物线弓形面积占三角形面积的三分之二，极小面积为 p²。",
      importance: "gaokao",
    },
    {
      text: "焦半径调和倒数和与双切圆：1/AF + 1/BF = 2/p；弦 AB 为直径的圆切准线，焦半径 AF 为直径的圆切 y 轴，属于几何性质与动圆轨迹交汇高频题型。",
      importance: "gaokao",
    },
    {
      text: "双垂直焦点弦定值：AB ⊥ CD 时倒数和定值为 1/(2p)，弦长和最小值为 8p，对角垂直四边形面积极小值为 8p²，常考于压轴小题最后选项判定。",
      importance: "hard",
    },
  ];

  // 5. 记忆口诀
  const mnemonic =
    "准线引切必垂直，切点弦长焦点穿；倒数之和二比 p，直径作圆切准线；双垂弦和八倍 p，平分中线弓三分。";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
