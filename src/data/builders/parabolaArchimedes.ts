import type { MathPanelData, ReasoningStep } from "../types";
import {
  getParabolaArchimedesBase,
  getArchimedesTriangleInfo,
  getFocalChordAdvInfo,
  getOrthogonalChordsInfo,
} from "@/math/parabolaArchimedes";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";

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

  // 3. 定理公式（严格按 mode 隔离，彻底杜绝无关构型干扰）
  const theorems: MathPanelData["theorems"] = [];
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [];
  let mnemonic = "";

  if (mode === "archimedesTriangle") {
    theorems.push(
      {
        name: "阿基米德正交切线定理 (准线蒙日定理)",
        latex: "Q \\in l \\iff QA \\perp QB \\iff F \\in AB \\iff QF \\perp AB",
        note: "从准线上任意点 $Q$ 引抛物线切线：① 两切线互相垂直 $QA \\perp QB$；② 切点弦 $AB$ 必过焦点 $F$；③ 连线 $QF \\perp AB$；④ 弦中点 $M$ 满足 $y_M = y_Q$，抛物线弧恰好平分中线 $QM$。",
        prerequisites: [
          "点 $Q$ 在准线 $x = -\\frac{p}{2}$ 上",
          "抛物线方程 $y^2 = 2px$",
        ],
        level: "core",
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
        level: "core",
      },
    );

    gaokaoPoints.push(
      {
        text: "新高考多选秒杀链：准线上点 Q ⇔ QA⊥QB ⇔ 切点弦 AB 过焦点 ⇔ QF⊥AB ⇔ y1 y2 = -p²。真题题设出现任意一条，其余三条可直接秒杀使用。",
        importance: "hard",
      },
      {
        text: "阿基米德平分中线与面积比：中线 QM 平行对称轴，被抛物线弧中点 P0 二等分；抛物线弓形面积占三角形面积的三分之二，极小面积为 p²。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "准线引切必垂直，切点弦长焦点穿；平分中线拱弧分，弓形占满三分二。";
  } else if (mode === "focalChordProperties") {
    theorems.push(
      {
        name: "焦点弦长与焦半径调和倒数和定理",
        latex:
          "|AB| = x_1 + x_2 + p = \\frac{2p}{\\sin^2\\theta}, \\quad \\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p}",
        note: "① 焦点弦在通径 $\\theta=90^\\circ$ 处取得最短长度 $2p$；② 焦半径倒数之和为恒定常数 $\\frac{2}{p}$，即焦半径成调和关系；③ 纵标乘积 $y_1 y_2 = -p^2$ 为定值。",
        prerequisites: [
          "直线 $AB$ 过焦点 $F$",
          "$\\theta \\in (0^\\circ, 180^\\circ)$",
        ],
        level: "core",
      },
      {
        name: "直径圆相切定理 (准线切圆与轴切圆)",
        latex:
          "d(M, l) = \\frac{|AB|}{2} = R, \\quad d(O_A, \\text{y-axis}) = \\frac{|AF|}{2} = R_A",
        note: "① 以焦点弦 $AB$ 为直径的圆必与准线相切于点 $K(-\\frac{p}{2}, y_M)$；② 以焦半径 $AF$（或 $BF$）为直径的圆必与 $y$ 轴（抛物线顶点切线）相切。",
        prerequisites: ["$M$ 为 $AB$ 中点", "准线 $l: x = -\\frac{p}{2}$"],
        level: "core",
      },
    );

    gaokaoPoints.push(
      {
        text: "焦半径调和倒数和：1/AF + 1/BF = 2/p 为常数定值，广泛用于证明弦长倒数和定值与不等式放缩。",
        importance: "gaokao",
      },
      {
        text: "双切圆几何特征：以弦 AB 为直径的圆切准线于点 K，以焦半径 AF 为直径的圆切 y 轴，属于几何性质与动圆轨迹交汇高频考点。",
        importance: "hard",
      },
    );

    mnemonic =
      "焦点割线通径短，倒数之和二比 p；弦为直径切准线，焦半为径切纵轴。";
  } else {
    // orthogonalChords
    theorems.push(
      {
        name: "双垂直焦点弦倒数和与面积极值定理",
        latex:
          "\\frac{1}{|AB|} + \\frac{1}{|CD|} = \\frac{1}{2p}, \\quad |AB| + |CD| \\ge 8p, \\quad S_{ACBD} = \\frac{1}{2}|AB||CD| \\ge 8p^2",
        note: "过焦点互相垂直的两条弦 $AB \\perp CD$：弦长倒数和恒等于 $\\frac{1}{2p}$；在 $\\theta=45^\\circ$ 对称位置处，弦长和取得最小值 $8p$，四边形面积取得最小值 $8p^2$。",
        prerequisites: ["$AB \\perp CD$ 且均过焦点 $F$"],
        level: "core",
      },
      {
        name: "正交弦长二倍角三角模型",
        latex:
          "|AB| + |CD| = \\frac{8p}{\\sin^2(2\\theta)}, \\quad S_{ACBD} = \\frac{8p^2}{\\sin^2(2\\theta)}",
        note: "通过正交弦倾角 $\\theta$ 与 $\\theta+90^\\circ$ 的三角消元，弦长之和与四边形面积完全转化为以 $\\sin^2(2\\theta)$ 为分母的函数，直观揭示 $\\theta=45^\\circ$ 时的对称极小值。",
        prerequisites: ["$\\theta \\in [15^\\circ, 75^\\circ]$"],
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "双垂直焦点弦定值：AB ⊥ CD 时倒数和定值为 1/(2p)，利用 sin²θ + cos²θ = 1 实现快速消元证明。",
        importance: "gaokao",
      },
      {
        text: "正交四边形面积极值：对角垂直四边形面积 S = 1/2 |AB||CD|，在 θ = 45° 取得全局极小值 8p²，常考于客观题压轴选项。",
        importance: "hard",
      },
    );

    mnemonic =
      "正交双弦焦点交，倒数之和一半 p；倾角四五和最浅，八倍 p 方面积绝。";
  }

  // 4. 高考解答题破题推演链 (Step 1 审题定法 -> Step 2 建模联立代入 -> Step 3 求解反思)
  const reasoningSteps: ReasoningStep[] = [];

  if (mode === "archimedesTriangle") {
    const yQStr = formatMathNumber(yQ);
    const pSqStr = formatMathNumber(safeP * safeP);
    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 准线引切联立",
        detail: `已知准线上外点 $Q\\left(-\\frac{p}{2}, y_Q\\right) = \\left(-${formatMathNumber(safeP / 2)}, ${yQStr}\\right)$。设切点为 $A(x_1, y_1), B(x_2, y_2)$，由切线方程 $y_0 y = p(x + x_0)$ 代入点 $Q$ 坐标消元。`,
        latex: `y_0 y_Q = p\\left(-\\frac{p}{2} + \\frac{y_0^2}{2p}\\right) \\iff y_0^2 - 2y_Q y_0 - p^2 = 0 \\quad (\\Delta = 4y_Q^2 + 4p^2 > 0)`,
        rubric:
          "【高考采分点】写出切线方程并代入准线点坐标，整理为一元二次方程得 2 分。",
      },
      {
        step: 2,
        title: "建模联立 · 正交垂直与切点弦焦点判定",
        detail: `由韦达定理，切点纵坐标满足 $y_1 + y_2 = 2y_Q = ${formatMathNumber(2 * yQ)}$，$y_1 y_2 = -p^2 = -${pSqStr}$。切线斜率 $k = \\frac{p}{y_0}$，两切线斜率乘积必为 $-1$；切点弦方程代入焦点恒等成立。`,
        latex: `k_1 k_2 = \\frac{p^2}{y_1 y_2} = \\frac{p^2}{-p^2} = -1 \\implies QA \\perp QB, \\quad F\\left(\\frac{p}{2}, 0\\right) \\in AB`,
        rubric:
          "【高考采分点】证明斜率乘积为 $-1$ 并确证切点弦必过焦点得 4 分。",
      },
      {
        step: 3,
        title: "求解反思 · 水平中线底高求解与极小面积",
        detail: `弦中点 $M$ 纵标 $y_M = \\frac{y_1 + y_2}{2} = y_Q$，底边 $QM$ 平行于对称轴。面积在通径端点切线 $y_Q = 0$ 处取到全局最小值 $p^2$。`,
        latex: `S_{\\triangle QAB} = \\frac{1}{2} |QM| \\cdot |y_1 - y_2| = \\frac{|y_1 - y_2|^3}{8p} \\ge p^2 = ${pSqStr}, \\quad S_{\\text{弓形}} = \\frac{2}{3} S_{\\triangle QAB}`,
        rubric:
          "【高考采分点】利用水平底高法推导面积公式，求出最值及等号条件得 4 分。",
      },
    );
  } else if (mode === "focalChordProperties") {
    const thetaStr = formatMathNumber(thetaDeg);
    const harmConstStr = formatMathNumber(2 / safeP);
    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 焦点割线设元与联立消元",
        detail: `割线倾角为 $\\theta = ${thetaStr}^\\circ$，设方程为横截式 $x = my + \\frac{p}{2}$（其中 $m = \\cot\\theta$），可完全规避斜率不存在分类讨论。联立抛物线 $y^2 = 2px$。`,
        latex: `y^2 - 2pmy - p^2 = 0 \\implies y_1 + y_2 = 2pm, \\quad y_1 y_2 = -p^2 = -${formatMathNumber(safeP * safeP)}`,
        rubric:
          "【高考采分点】设横截式方程避免分类讨论，联立消元写出韦达定理得 3 分。",
      },
      {
        step: 2,
        title: "建模联立 · 焦半径代换与弦长封闭解",
        detail: `根据抛物线第一定义，焦半径转化为到准线距离 $|AF| = x_1 + \\frac{p}{2}$，$|BF| = x_2 + \\frac{p}{2}$。代入韦达定理化简弦长。`,
        latex: `|AB| = x_1 + x_2 + p = m(y_1 + y_2) + 2p = 2p(m^2 + 1) = \\frac{2p}{\\sin^2\\theta}`,
        rubric:
          "【高考采分点】由抛物线定义转化焦半径并代入韦达定理化简弦长得 4 分。",
      },
      {
        step: 3,
        title: "求解反思 · 焦半径调和倒数和与准线相切",
        detail: `焦半径倒数之和通分化简为恒等定值 $\\frac{2}{p} = ${harmConstStr}$；以 $AB$ 为直径的圆圆心 $M$ 到准线距离等于梯形中位线，恰为半径 $R$。`,
        latex: `\\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{x_1 + x_2 + p}{\\left(x_1 + \\frac{p}{2}\\right)\\left(x_2 + \\frac{p}{2}\\right)} = \\frac{2}{p}, \\quad d(M, l) = \\frac{x_1 + x_2 + p}{2} = R`,
        rubric:
          "【高考采分点】通分计算焦半径倒数和并利用梯形中位线证明准线相切得 3 分。",
      },
    );
  } else {
    // orthogonalChords
    const harmChordsConst = formatMathNumber(1 / (2 * safeP));
    const minSumStr = formatMathNumber(8 * safeP);
    const minAreaStr = formatMathNumber(8 * safeP * safeP);
    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 正交倾角设定与弦长表示",
        detail: `设割线 $AB$ 倾角为 $\\theta$，垂直弦 $CD$ 倾角为 $\\theta + 90^\\circ$。由焦点弦长公式分别表示出两互相垂直弦长。`,
        latex: `|AB| = \\frac{2p}{\\sin^2\\theta}, \\quad |CD| = \\frac{2p}{\\sin^2(\\theta + 90^\\circ)} = \\frac{2p}{\\cos^2\\theta}`,
        rubric:
          "【高考采分点】设出垂直弦倾角并利用焦点弦长三角表达式建立模型得 3 分。",
      },
      {
        step: 2,
        title: "建模联立 · 平方和恒等与二倍角正弦极值",
        detail: `两弦倒数之和利用同角三角函数平方和恒等式化简得定值 $\\frac{1}{2p} = ${harmChordsConst}$；弦长之和利用二倍角公式求最值。`,
        latex: `\\frac{1}{|AB|} + \\frac{1}{|CD|} = \\frac{\\sin^2\\theta + \\cos^2\\theta}{2p} = \\frac{1}{2p}, \\quad |AB| + |CD| = \\frac{8p}{\\sin^2(2\\theta)} \\ge 8p = ${minSumStr}`,
        rubric:
          "【高考采分点】求得倒数和定值并利用二倍角公式确定极值等号条件得 4 分。",
      },
      {
        step: 3,
        title: "求解反思 · 垂直四边形面积公式与极小值",
        detail: `对角线互相垂直的四边形面积 $S_{ACBD} = \\frac{1}{2}|AB||CD|$。在 $\\theta = 45^\\circ$ 对称位置处取得全局极小值。`,
        latex: `S_{ACBD} = \\frac{1}{2} \\cdot \\frac{2p}{\\sin^2\\theta} \\cdot \\frac{2p}{\\cos^2\\theta} = \\frac{8p^2}{\\sin^2(2\\theta)} \\ge 8p^2 = ${minAreaStr}`,
        rubric:
          "【高考采分点】代入垂直对角线面积公式，得出最小面积及取等条件得 3 分。",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor: "新高考解析几何解答题第 (2) 问与多选题压轴常考母题",
    mnemonic,
  };
}
