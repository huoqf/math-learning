import type {
  MathPanelData,
  ReasoningStep,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { solveConicLineIntersection } from "@/math/conicLine";
import type { ConicType, StudyMode } from "@/math/conicLine";
import { formatMathNumber, formatSignedTerm } from "@/utils/mathFormat";

export function buildConicLineMathQuantities(
  params: Record<string, number>,
  config?: { conicType?: ConicType; studyMode?: StudyMode },
): MathPanelData {
  const conicTypes: ConicType[] = ["ellipse", "hyperbola", "parabola"];
  const studyModes: StudyMode[] = ["general", "focus", "midpoint", "polePolar"];

  const conicType =
    config?.conicType ??
    conicTypes[Math.floor(params.conicTypeIdx ?? 0)] ??
    "ellipse";
  const studyMode =
    config?.studyMode ??
    studyModes[Math.floor(params.studyModeIdx ?? 0)] ??
    "general";

  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const p = params.p ?? 2;
  const k = params.k ?? 0.5;
  const m = params.m ?? 0.5;
  const theta = params.theta ?? Math.PI / 4;
  const midpointX = params.midpointX ?? 1;
  const midpointY = params.midpointY ?? 1;
  const poleX = params.poleX ?? 4;
  const poleY = params.poleY ?? 3;

  const result = solveConicLineIntersection({
    conicType,
    studyMode,
    a,
    b,
    p,
    k,
    m,
    theta,
    midpointX,
    midpointY,
    poleX,
    poleY,
  });

  const aVal = formatMathNumber(a);
  const bVal = formatMathNumber(b);
  const pVal = formatMathNumber(p);
  const kVal = formatMathNumber(result.slopeAB);
  const mVal = formatMathNumber(m);
  const deltaVal = formatMathNumber(result.delta);
  const quadAVal = formatMathNumber(result.quadCoeff);
  const quadB =
    conicType === "ellipse"
      ? 2 * a * a * k * m
      : conicType === "hyperbola"
        ? -2 * a * a * k * m
        : -(2 * p) / (k || 1);
  const quadC =
    conicType === "ellipse"
      ? a * a * (m * m - b * b)
      : conicType === "hyperbola"
        ? -a * a * (m * m + b * b)
        : (2 * p * m) / (k || 1);
  const quadBVal = formatMathNumber(quadB);
  const quadCVal = formatMathNumber(quadC);

  // ─────────────────────────────────────────────────────────────
  // 1. 数值量看板数据（模式纯净过滤，剔除非当前模式的无关指标）
  // ─────────────────────────────────────────────────────────────
  const quantities: MathPanelData["quantities"] = [];

  const statusLabels: Record<string, string> = {
    secant: "相交 (2个交点)",
    tangent: "相切 (1个切点)",
    disjoint: "相离 (无交点)",
    degenerated_parallel: "特例退化：平行于渐近线/对称轴 (1个交点)",
  };

  quantities.push({
    label: "位置关系",
    value: statusLabels[result.status] ?? "未知",
  });

  quantities.push({
    label: "联立判别式 Δ",
    symbol: "\\Delta = B^2 - 4AC",
    value: `${deltaVal} (${result.delta > 1e-5 ? "> 0" : Math.abs(result.delta) <= 1e-5 ? "= 0" : "< 0"})`,
  });

  if (result.chordLength !== null && result.status === "secant") {
    quantities.push({
      label: "相交弦长",
      symbol: "|AB|",
      value: result.chordLength.toFixed(4),
    });
  }

  if (result.midpoint) {
    quantities.push({
      label: result.status === "tangent" ? "切点 T" : "弦中点 M",
      symbol: result.status === "tangent" ? "T" : "M",
      value: `(${formatMathNumber(result.midpoint.x)}, ${formatMathNumber(result.midpoint.y)})`,
    });
  }

  // 模式专属指标隔离注入
  if (studyMode === "general") {
    if (result.triangleArea !== null && result.triangleArea > 0) {
      quantities.push({
        label: "原点三角形面积",
        symbol: "S_{\\triangle OAB}",
        value: result.triangleArea.toFixed(4),
      });
    }
  } else if (studyMode === "focus") {
    const thetaDeg = Math.round((theta * 180) / Math.PI);
    quantities.push({
      label: "焦点弦倾斜角",
      symbol: "\\theta",
      value: `${thetaDeg}° (${formatMathNumber(theta)} rad)`,
    });

    if (conicType === "parabola") {
      quantities.push({
        label: "抛物线通径长 (2p)",
        symbol: "2p",
        value: formatMathNumber(2 * p),
      });
      quantities.push({
        label: "抛物线准线方程",
        symbol: "l_{准}",
        value: `x = -${formatMathNumber(p / 2)}`,
      });
    } else {
      quantities.push({
        label: "通径长 (2b²/a)",
        symbol: "\\frac{2b^2}{a}",
        value: formatMathNumber((2 * b * b) / a),
      });
    }

    if (result.focalRadii) {
      const [r1, r2] = result.focalRadii;
      quantities.push(
        {
          label: "焦半径 |FA| 与 |FB|",
          symbol: "r_1, r_2",
          value: `r_1=${formatMathNumber(r1)}, r_2=${formatMathNumber(r2)}`,
        },
        {
          label: "焦半径倒数和 (定值验证)",
          symbol: "\\frac{1}{|FA|} + \\frac{1}{|FB|}",
          value: result.harmonicSum
            ? `${formatMathNumber(result.harmonicSum)} (理论定值: ${formatMathNumber(result.theoreticalHarmonicSum ?? 0)})`
            : "未构成两端点",
        },
      );
    }
  } else if (studyMode === "midpoint") {
    const theoreticalVal =
      conicType === "ellipse"
        ? `-${formatMathNumber((b * b) / (a * a))}`
        : conicType === "hyperbola"
          ? `${formatMathNumber((b * b) / (a * a))}`
          : `${formatMathNumber(p / (midpointY || 1))}`;

    quantities.push({
      label: "点差法斜率积",
      symbol:
        conicType === "parabola" ? "k_{AB} \\cdot y_0" : "k_{AB} \\cdot k_{OM}",
      value:
        result.pointDiffSlopeProduct !== null
          ? `${result.pointDiffSlopeProduct.toFixed(4)} (理论值: ${theoreticalVal})`
          : `理论值: ${theoreticalVal}`,
    });
  } else if (studyMode === "polePolar") {
    quantities.push({
      label: "外部极点坐标 P",
      symbol: "P(x_P, y_P)",
      value: `(${formatMathNumber(poleX)}, ${formatMathNumber(poleY)})`,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 高考三步推演链（严格遵循高中答题三部曲：符号通式 -> 代入解析式 -> 化简结果）
  // ─────────────────────────────────────────────────────────────
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor = "高考解析几何核心通法 · 直线与圆锥曲线联立体系";

  if (studyMode === "general") {
    examAnchor = "高考大题第(2)问标杆 · 联立方程、判别式与韦达弦长三步走";

    const step1Symbol =
      conicType === "ellipse"
        ? "(b^2 + a^2 k^2)x^2 + 2a^2 km x + a^2(m^2 - b^2) = 0"
        : conicType === "hyperbola"
          ? "(b^2 - a^2 k^2)x^2 - 2a^2 km x - a^2(m^2 + b^2) = 0"
          : "y^2 - \\frac{2p}{k}y + \\frac{2pm}{k} = 0";

    const step1Result =
      conicType === "parabola"
        ? `y^2 ${formatSignedTerm(quadB, "y")} ${formatSignedTerm(quadC, "")} = 0`
        : `${quadAVal}x^2 ${formatSignedTerm(quadB, "x")} ${formatSignedTerm(quadC, "")} = 0`;

    let step1Detail = "";
    if (conicType === "ellipse") {
      step1Detail = `将直线方程 $y = ${kVal}x ${m >= 0 ? "+ " + formatMathNumber(m) : "- " + formatMathNumber(-m)}$ 代入椭圆方程 $\\frac{x^2}{${aVal}^2} + \\frac{y^2}{${bVal}^2} = 1$，展开消元得二次方程通式 $(b^2 + a^2 k^2)x^2 + 2a^2 km x + a^2(m^2 - b^2) = 0$。代入参数计算各项系数：$A = ${bVal}^2 + ${aVal}^2 \\cdot (${kVal})^2 = ${quadAVal}$，$B = 2(${aVal}^2)(${kVal})(${mVal}) = ${quadBVal}$，$C = ${aVal}^2((${mVal})^2 - ${bVal}^2) = ${quadCVal}$，整理得标准一元二次方程：`;
    } else if (conicType === "hyperbola") {
      step1Detail = `将直线方程 $y = ${kVal}x ${m >= 0 ? "+ " + formatMathNumber(m) : "- " + formatMathNumber(-m)}$ 代入双曲线方程 $\\frac{x^2}{${aVal}^2} - \\frac{y^2}{${bVal}^2} = 1$，展开消元得二次方程通式 $(b^2 - a^2 k^2)x^2 - 2a^2 km x - a^2(m^2 + b^2) = 0$。代入参数计算各项系数：$A = ${bVal}^2 - ${aVal}^2 \\cdot (${kVal})^2 = ${quadAVal}$，$B = -2(${aVal}^2)(${kVal})(${mVal}) = ${quadBVal}$，$C = -${aVal}^2((${mVal})^2 + ${bVal}^2) = ${quadCVal}$，整理得标准一元二次方程：`;
    } else {
      step1Detail = `将直线方程 $x = \\frac{1}{${kVal}}y - \\frac{${mVal}}{${kVal}}$ 代入抛物线方程 $y^2 = 2px = 2(${pVal})x$，消去 $x$ 整理得一元二次方程标准形式：`;
    }

    reasoningSteps.push(
      {
        step: 1,
        title: "审题建模 · 联立消元建立二次方程",
        detail: step1Detail,
        latex: `${step1Symbol} \\\\ \\implies ${step1Result}`,
        rubric: "联立方程消元并代入参数整理得标准一元二次方程（3分）",
      },
      {
        step: 2,
        title: "建模展开 · 判别式检验与韦达代换",
        detail:
          result.delta > 1e-5
            ? `代入系数计算根的判别式：$\\Delta = B^2 - 4AC = (${quadBVal})^2 - 4(${quadAVal})(${quadCVal}) = ${deltaVal} > 0$。割线与曲线交于两点。由韦达定理得两根之和 $x_1 + x_2 = -\\frac{B}{A} = ${formatMathNumber(result.xSum ?? 0)}$，两根之积 $x_1 x_2 = \\frac{C}{A} = ${formatMathNumber(result.xProd ?? 0)}$。`
            : Math.abs(result.delta) <= 1e-5
              ? `代入系数计算判别式：$\\Delta = B^2 - 4AC = (${quadBVal})^2 - 4(${quadAVal})(${quadCVal}) = 0$。方程有唯一实数重根，直线与曲线相切。`
              : `代入系数计算判别式：$\\Delta = B^2 - 4AC = (${quadBVal})^2 - 4(${quadAVal})(${quadCVal}) = ${deltaVal} < 0$。方程无实数根，直线与曲线相离。`,
        latex:
          result.xSum !== null && result.xProd !== null
            ? `\\Delta = ${deltaVal} > 0 \\\\ x_1 + x_2 = -\\frac{${quadBVal}}{${quadAVal}} = ${formatMathNumber(result.xSum)}`
            : `\\Delta = (${quadBVal})^2 - 4(${quadAVal})(${quadCVal}) = ${deltaVal}`,
        rubric: "准确计算判别式并写出韦达定理代换式（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 割线弦长公式代入求解",
        detail:
          result.status === "secant" && result.chordLength !== null
            ? `代入解析几何标准弦长公式 $|AB| = \\sqrt{1+k^2} \\cdot \\frac{\\sqrt{\\Delta}}{|A|} = \\sqrt{1 + (${kVal})^2} \\cdot \\frac{\\sqrt{${deltaVal}}}{|${quadAVal}|}$，求解得割线长：`
            : "判别式 $\\Delta \\le 0$，直线与曲线无两相异公共交点，割线弦长不存在。",
        latex:
          result.chordLength !== null
            ? `|AB| = \\sqrt{1 + k^2}\\frac{\\sqrt{\\Delta}}{|A|} = ${formatMathNumber(result.chordLength)}`
            : "\\text{割线弦长不存在}",
        rubric: "准确代入弦长公式并化简求得精确数值（4分）",
      },
    );
  } else if (studyMode === "focus") {
    examAnchor = "高考焦点弦模型 · 通径极值与焦半径倒数和定值证明";

    if (conicType === "parabola") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 确定焦点坐标与割线方程",
          detail: `抛物线 $y^2 = 2px$ 焦点为 $F(\\frac{p}{2}, 0) = (${formatMathNumber(p / 2)}, 0)$，准线为 $x = -\\frac{p}{2}$：`,
          latex: result.isVertical
            ? `x = \\frac{p}{2} = ${formatMathNumber(p / 2)}`
            : `y = ${kVal}\\left(x - ${formatMathNumber(p / 2)}\\right)`,
          rubric: "标定焦点坐标并写出点斜式割线方程（2分）",
        },
        {
          step: 2,
          title: "建模展开 · 焦半径定义与弦长公式推导",
          detail: `由抛物线定义，端点到焦点距离等于到准线距离，$|AB| = x_1 + x_2 + p$。代入倾斜角 $\\theta = ${formatMathNumber(theta)}^\\circ$：`,
          latex: `|AB| = \\frac{2p}{\\sin^2\\theta} = ${formatMathNumber(result.chordLength ?? 2 * p)}`,
          rubric: "利用定义转化焦半径并求解弦长（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 焦半径倒数和恒等定值",
          detail: `两端点焦半径倒数和与直线的倾斜角 $\\theta$ 无关，恒为定值 $\\frac{2}{p}$：`,
          latex: `\\frac{1}{|FA|} + \\frac{1}{|FB|} = \\frac{2}{p} = ${formatMathNumber(2 / p)}`,
          rubric: "得出焦半径倒数和恒等式（3分）",
        },
      );
    } else {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 确定焦点坐标与割线方程",
          detail: `圆锥曲线右焦点为 $F_1(c, 0) = (${formatMathNumber(result.focusF1.x)}, 0)$：`,
          latex: result.isVertical
            ? `x = c = ${formatMathNumber(result.focusF1.x)}`
            : `y = ${kVal}(x - ${formatMathNumber(result.focusF1.x)})`,
          rubric: "准确计算焦点坐标并写出割线方程（2分）",
        },
        {
          step: 2,
          title: "建模展开 · 通径极小值公式推导",
          detail: `垂直于对称轴的长割线为通径，对应焦点弦长的极小值。代入参数 $a = ${aVal}, b = ${bVal}$：`,
          latex: `L_{\\text{通径}} = \\frac{2b^2}{a} = ${formatMathNumber((2 * b * b) / a)}`,
          rubric: "推导通径公式并计算极小值（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 焦半径倒数和定值性质",
          detail: `焦点割线两端点的焦半径倒数和恒等于定值 $\\frac{2a}{b^2}$，代入已知参数：`,
          latex: `\\frac{1}{|F_1 A|} + \\frac{1}{|F_1 B|} = \\frac{2a}{b^2} = ${formatMathNumber((2 * a) / (b * b))}`,
          rubric: "得出定值并反思高考设问考法（3分）",
        },
      );
    }
  } else if (studyMode === "midpoint") {
    examAnchor = "高考高频通法 · 中点弦“点差法”与充要检验三部曲";
    const x0Val = formatMathNumber(midpointX);
    const y0Val = formatMathNumber(midpointY);

    if (conicType === "ellipse") {
      const ratioVal = formatMathNumber(
        (midpointX * midpointX) / (a * a) + (midpointY * midpointY) / (b * b),
      );
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 设端点坐标并代入椭圆方程",
          detail: `设弦端点为 $A(x_1, y_1), B(x_2, y_2)$，中点 $M(x_0, y_0) = (${x0Val}, ${y0Val})$，代入椭圆方程：`,
          latex: `\\frac{x_1^2}{${aVal}^2} + \\frac{y_1^2}{${bVal}^2} = 1 \\\\ \\frac{x_2^2}{${aVal}^2} + \\frac{y_2^2}{${bVal}^2} = 1`,
          rubric: "设点代入建立两端点方程（2分）",
        },
        {
          step: 2,
          title: "建模展开 · 点差法两式作差求动弦斜率",
          detail: `两式相减并因式分解，由斜率定义 $k_{AB} = \\frac{y_1-y_2}{x_1-x_2}$ 及中点坐标关系，代入 $M(${x0Val}, ${y0Val})$ 与参数：`,
          latex: `k_{AB} = -\\frac{b^2 x_0}{a^2 y_0} = ${kVal}`,
          rubric: "作差因式分解导出斜率与中点坐标关系（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 存在性检验（防越界伪根）",
          detail: result.isMidpointValid
            ? `中点位于椭圆内部（$\\frac{x_0^2}{a^2}+\\frac{y_0^2}{b^2} < 1$），判别式 $\\Delta > 0$，实中点弦真实存在：`
            : `【高考防坑警示】中点位于椭圆外部，点差法所求直线与椭圆相离（$\\Delta < 0$），无实数中点弦！`,
          latex: `\\frac{x_0^2}{a^2} + \\frac{y_0^2}{b^2} = ${ratioVal} ${result.isMidpointValid ? "< 1" : "\\ge 1"}`,
          rubric: "代回完成存在性充要条件检验（3分）",
        },
      );
    } else if (conicType === "hyperbola") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 设端点坐标并代入双曲线方程",
          detail: `设弦端点为 $A(x_1, y_1), B(x_2, y_2)$，中点 $M(x_0, y_0) = (${x0Val}, ${y0Val})$，代入双曲线方程：`,
          latex: `\\frac{x_1^2}{${aVal}^2} - \\frac{y_1^2}{${bVal}^2} = 1 \\\\ \\frac{x_2^2}{${aVal}^2} - \\frac{y_2^2}{${bVal}^2} = 1`,
          rubric: "设点代入建立方程（2分）",
        },
        {
          step: 2,
          title: "建模展开 · 点差法求动弦斜率与定值积",
          detail: `两式相减消去常数项，利用斜率积公式 $k_{AB} \\cdot k_{OM} = \\frac{b^2}{a^2}$，代入参数计算斜率：`,
          latex: `k_{AB} = \\frac{b^2 x_0}{a^2 y_0} = ${kVal}`,
          rubric: "推导双曲线点差法斜率公式（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 代回判别式检验存在性",
          detail: result.isMidpointValid
            ? `中点使联立方程判别式 $\\Delta > 0$，动割线与双曲线相交于两点：`
            : `【考场警示】中点导致联立方程 $\\Delta \\le 0$，无实数中点弦：`,
          latex: `\\Delta = (${quadBVal})^2 - 4(${quadAVal})(${quadCVal}) = ${deltaVal} ${result.isMidpointValid ? "> 0" : "\\le 0"}`,
          rubric: "代回检验避免增根伪解（3分）",
        },
      );
    } else {
      // 抛物线点差法
      const diffVal = formatMathNumber(
        midpointY * midpointY - 2 * p * midpointX,
      );
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 设端点坐标并代入抛物线方程",
          detail: `设端点为 $A(x_1, y_1), B(x_2, y_2)$，中点 $M(x_0, y_0) = (${x0Val}, ${y0Val})$，代入抛物线方程：`,
          latex: `y_1^2 = 2px_1 \\\\ y_2^2 = 2px_2`,
          rubric: "设点代入建立抛物线端点方程（2分）",
        },
        {
          step: 2,
          title: "建模展开 · 两式作差求动弦斜率",
          detail: `两式相减因式分解 $(y_1 - y_2)(y_1 + y_2) = 2p(x_1 - x_2)$，整理得 $k_{AB} \\cdot y_0 = p$：`,
          latex: `k_{AB} = \\frac{p}{y_0} = \\frac{${pVal}}{${y0Val}} = ${kVal}`,
          rubric: "利用作差因式分解求得斜率（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 存在性检验（防越界伪根）",
          detail: result.isMidpointValid
            ? `抛物线内部充要条件 $y_0^2 < 2px_0$，判别式 $\\Delta > 0$，实弦存在：`
            : `【高考防坑警示】点 $M$ 位于抛物线外部，点差法所求直线与抛物线相离，无实弦！`,
          latex: `y_0^2 - 2px_0 = (${y0Val})^2 - 2(${pVal})(${x0Val}) = ${diffVal} ${result.isMidpointValid ? "< 0" : "\\ge 0"}`,
          rubric: "严格检验中点在抛物线内部充要条件（3分）",
        },
      );
    }
  } else {
    // 极点极线切点弦
    examAnchor = "高考自招拔高 · 极点极线与切点弦对偶定理";
    const xPVal = formatMathNumber(poleX);
    const yPVal = formatMathNumber(poleY);

    const polarEq =
      conicType === "ellipse"
        ? `\\frac{${xPVal}x}{${aVal}^2} + \\frac{${yPVal}y}{${bVal}^2} = 1`
        : conicType === "hyperbola"
          ? `\\frac{${xPVal}x}{${aVal}^2} - \\frac{${yPVal}y}{${bVal}^2} = 1`
          : `${yPVal}y = ${pVal}(x + ${xPVal})`;

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 极点与切点弦对偶方程",
        detail: `由圆锥曲线切点弦对偶性质，极点 $P(x_P, y_P) = (${xPVal}, ${yPVal})$ 的切点弦（极线）方程为：代入极点坐标可得：`,
        latex: polarEq,
        rubric: "写出极点极线对偶方程并代入极点坐标（3分）",
      },
      {
        step: 2,
        title: "建模展开 · 化为直线斜截式标准方程",
        detail: `将切点弦方程化简整理为斜截式标准方程 $y = kx + m$：`,
        latex: `L: y = ${kVal}x ${m >= 0 ? "+" : ""} ${formatMathNumber(m)}`,
        rubric: "准确化简极线方程求得斜率与截距（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 几何性质与切线垂直定值",
        detail:
          conicType === "parabola"
            ? "极点在准线 $x = -\\frac{p}{2}$ 上时，向抛物线引出的两条切线互相垂直，且切点弦必过焦点 $F$。"
            : "极点与切点弦满足对偶关系：极点 $P$ 在定直线上运动时，切点弦必绕定点旋转。",
        latex:
          conicType === "parabola"
            ? `x_P = -\\frac{p}{2} \\implies k_1 k_2 = -1`
            : "\\text{极点在定直线} \\iff \\text{切点弦绕定点旋转}",
        rubric: "总结几何定值与高考大题定点规律（3分）",
      },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 定理公式（100% 模式严格隔离，彻底清除不相干定理）
  // ─────────────────────────────────────────────────────────────
  const theorems: Theorem[] = [];

  if (studyMode === "general") {
    theorems.push({
      name: "通用弦长公式与判别式定理",
      latex:
        "|AB| = \\sqrt{1+k^2} \\cdot \\sqrt{(x_1+x_2)^2 - 4x_1 x_2} = \\sqrt{1+k^2} \\cdot \\frac{\\sqrt{\\Delta}}{|A|}",
      condition: "方程二次项系数 $A \\neq 0$ 且判别式 $\\Delta > 0$",
      note: "直线与曲线联立消元后，判别式 $\\Delta$ 决定交点个数，韦达定理直接代入求弦长，避开繁琐的解交点过程。",
      level: "core",
    });
  } else if (studyMode === "focus") {
    if (conicType === "parabola") {
      theorems.push({
        name: "抛物线焦点弦长与焦半径倒数和定理",
        latex:
          "|AB| = x_1 + x_2 + p = \\frac{2p}{\\sin^2\\theta}, \\quad \\frac{1}{|FA|} + \\frac{1}{|FB|} = \\frac{2}{p}",
        condition:
          "割线过焦点 $F(\\frac{p}{2}, 0)$ 且倾角 $\\theta \\in (0, \\pi)$",
        note: "由抛物线定义，端点到焦点距离转化为到准线距离；通径 $\\theta = \\pi/2$ 时弦长取极小值 $2p$；两端点焦半径倒数和恒为常数 $\\frac{2}{p}$。",
        level: "core",
      });
    } else {
      theorems.push({
        name: "通径极值与焦半径倒数和定理",
        latex:
          "L_{通径} = \\frac{2b^2}{a}, \\quad \\frac{1}{|F_1 A|} + \\frac{1}{|F_1 B|} = \\frac{2a}{b^2}",
        condition: "过焦点垂直于对称轴（$\\theta = \\pi/2$）",
        note: "通径是过焦点最短的焦点弦；弦两端点到焦点的焦半径倒数和在过焦点割线中恒为定值 $\\frac{2a}{b^2}$。",
        level: "core",
      });
    }
  } else if (studyMode === "midpoint") {
    theorems.push({
      name: "中点弦“点差法”公式与充要检验定理",
      latex:
        conicType === "ellipse"
          ? "k_{AB} \\cdot k_{OM} = -\\frac{b^2}{a^2}"
          : conicType === "hyperbola"
            ? "k_{AB} \\cdot k_{OM} = \\frac{b^2}{a^2}"
            : "k_{AB} \\cdot y_0 = p",
      condition: "中点 $M(x_0, y_0)$ 必须位于曲线内部（$\\Delta > 0$）",
      note: "利用端点代入方程两式作差，可快速求出动弦斜率与中点坐标的乘积。高考答题务必回代判别式检验是否存在实交点！",
      level: "core",
    });
  } else if (studyMode === "polePolar") {
    theorems.push({
      name: "极点与极线（切点弦方程对偶定理）",
      latex:
        conicType === "ellipse"
          ? "\\frac{x_P x}{a^2} + \\frac{y_P y}{b^2} = 1"
          : conicType === "hyperbola"
            ? "\\frac{x_P x}{a^2} - \\frac{y_P y}{b^2} = 1"
            : "y_P y = p(x + x_P)",
      condition: "极点 $P(x_P, y_P)$ 在曲线外部，切点弦 $AB$ 联立二次曲线",
      note: "自曲线外一点引两条切线，其切点弦方程可由原方程平方项对偶替换直接写出。",
      level: "core",
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 高考考点（100% 模式严格隔离，杜绝跨模式杂质污染）
  // ─────────────────────────────────────────────────────────────
  const gaokaoPoints: GaokaoPoint[] = [];

  if (studyMode === "general") {
    gaokaoPoints.push(
      {
        text: "【联立方程与判别式讨论】高考压轴题第(2)问的通法：设直线 $\\to$ 联立方程 $\\to$ 判别式 $\\Delta > 0$ $\\to$ 韦达定理 $\\to$ 目标表达式化简。",
        importance: "gaokao",
      },
      {
        text: "【弦长与三角形面积最值】结合基本不等式或导数单调性求割线弦长 $|AB|$ 或原点三角形面积 $S_{\\triangle OAB}$ 的极值。",
        importance: "hard",
      },
    );
  } else if (studyMode === "focus") {
    gaokaoPoints.push(
      {
        text: "【焦半径第一定义转化】抛物线焦点弦长通法：利用定义将焦半径转化为到准线的水平距离 $x + \\frac{p}{2}$，将弦长转化为横坐标之和 $x_1 + x_2 + p$。",
        importance: "gaokao",
      },
      {
        text: "【通径极值与焦半径倒数和定值】垂直于对称轴的焦点弦长（通径）为极小值；焦半径倒数和 $\\frac{1}{r_1} + \\frac{1}{r_2}$ 为定值，为新高考高频定值考点。",
        importance: "gaokao",
      },
    );
  } else if (studyMode === "midpoint") {
    gaokaoPoints.push(
      {
        text: "【点差法速求中点弦】两式作差直接得出弦斜率 $k$ 与中点坐标的乘积关系，避开解一元二次方程，大幅缩减考场运算量。",
        importance: "gaokao",
      },
      {
        text: "【点差法防越界检验 $\\Delta > 0$（核心采分点）】点差法所得直线斜率仅为必要条件，必须带回原曲线方程检验 $\\Delta > 0$（即中点必须在曲线内部），漏验必扣分！",
        importance: "gaokao",
      },
    );
  } else if (studyMode === "polePolar") {
    gaokaoPoints.push(
      {
        text: "【切点弦方程一步速写】由二次曲线外一点 $P(x_P, y_P)$ 作两条切线，切点弦 $AB$ 方程无需联立解切点，直接套用极线公式一步写出！",
        importance: "gaokao",
      },
      {
        text: "【动极点与切点弦定点规律】极点在定直线上运动时，其切点弦必过定点；动直线绕定点旋转时，极点轨迹为定直线（极点极线对偶性）。",
        importance: "hard",
      },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5. 警示事项（100% 模式严格隔离）
  // ─────────────────────────────────────────────────────────────
  const warnings: WarningItem[] = [];

  if (studyMode === "general") {
    if (conicType === "hyperbola") {
      warnings.push({
        text: "【二次项系数归零陷阱】双曲线中当直线斜率 $k = \\pm b/a$（平行于渐近线）时，联立后方程二次项归零降阶为一元一次方程，仅有1个交点，但绝对不是相切！",
        level: "danger",
      });
    } else if (conicType === "parabola") {
      warnings.push({
        text: "【平行对称轴降阶陷阱】抛物线中当直线斜率 $k = 0$（平行于对称轴）时，方程降阶为一元一次方程，仅有1个交点，绝非相切！",
        level: "danger",
      });
    }
    warnings.push(
      {
        text: "【斜率不存在（垂直线）漏解】若设直线为 $y = kx + m$，必须独立讨论斜率不存在 $x = x_0$ 的情况；更推荐设 $x = my + t$（除水平线外均适用）。",
        level: "warning",
      },
      {
        text: "【韦达定理代入前未验 Δ】在使用韦达定理计算弦长或几何量前，必须写出并保证 $\\Delta > 0$，否则解出的点可能为复数伪根。",
        level: "warning",
      },
    );
  } else if (studyMode === "focus") {
    warnings.push(
      {
        text: "【通径斜率不存在讨论】当焦点弦垂直于对称轴（通径）时，直线斜率不存在，此时必须作为独立分支写出方程 $x = c$ 或 $x = \\frac{p}{2}$，不可遗漏！",
        level: "warning",
      },
      {
        text: "【焦半径公式符号正负】双曲线中交点在同支或异支时焦半径公式符号不同，需严格分清左右支区别讨论。",
        level: "warning",
      },
    );
  } else if (studyMode === "midpoint") {
    if (!result.isMidpointValid) {
      warnings.push({
        text: `【点差法越界警示】当前中点 $M(${formatMathNumber(midpointX)}, ${formatMathNumber(midpointY)})$ 位于曲线外部，点差法求出的直线与曲线相离（$\\Delta = ${deltaVal} < 0$），不存在以此为中点的实数弦！高考务必检验 $\\Delta > 0$！`,
        level: "danger",
      });
    }
    warnings.push({
      text: "【点差法仅为必要条件】点差法所得斜率必须代回判别式检验 $\\Delta > 0$。椭圆中点必须在椭圆内部，双曲线中点需在特定区域，抛物线中点需满足 $y_0^2 < 2px_0$。",
      level: "warning",
    });
  } else if (studyMode === "polePolar") {
    warnings.push({
      text: "【极点位置与切线存在性】极点必须在二次曲线外部才能引出真实的两条切线与切点弦；若极点在曲线内部，极线与曲线相离，切点不成立。",
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic:
      "设联立，验判别，韦达代入算弦长；中点弦，用点差，斜率积定莫忘验！",
  };
}
