import type { MathPanelData } from "../types";
import { solveConicLineIntersection } from "@/math/conicLine";
import type { ConicType, StudyMode } from "@/math/conicLine";

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

  // 1. 构建数值量列表
  const quantities: MathPanelData["quantities"] = [];

  // 位置关系状态
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
    label: "判别式 Δ",
    symbol: "\\Delta = B^2 - 4AC",
    value: `${result.delta.toFixed(2)} (${result.delta > 1e-5 ? "> 0" : Math.abs(result.delta) <= 1e-5 ? "= 0" : "< 0"})`,
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
      value: `(${result.midpoint.x.toFixed(2)}, ${result.midpoint.y.toFixed(2)})`,
    });
  }

  if (studyMode === "focus") {
    const thetaDeg = Math.round((theta * 180) / Math.PI);
    quantities.push({
      label: "焦点弦倾斜角",
      symbol: "\\theta",
      value: `${thetaDeg}° (${theta.toFixed(2)} rad)`,
    });
    if (conicType === "parabola") {
      const theoreticalLatus = 2 * p;
      quantities.push({
        label: "抛物线通径长 (2p)",
        symbol: "2p",
        value: `${theoreticalLatus.toFixed(2)}`,
      });
    } else {
      const theoreticalLatus = (2 * b * b) / a;
      quantities.push({
        label: "通径长 (2b²/a)",
        symbol: "\\frac{2b^2}{a}",
        value: `${theoreticalLatus.toFixed(2)}`,
      });
    }
  }

  if (result.triangleArea !== null && result.triangleArea > 0) {
    quantities.push({
      label: "原点三角形面积",
      symbol: "S_{\\triangle OAB}",
      value: result.triangleArea.toFixed(4),
    });
  }

  if (
    studyMode === "midpoint" &&
    result.pointDiffSlopeProduct !== null &&
    result.slopeOM !== null
  ) {
    const theoreticalVal =
      conicType === "ellipse"
        ? `-${(b * b) / (a * a)}`
        : conicType === "hyperbola"
          ? `${(b * b) / (a * a)}`
          : `${p / (midpointY || 1)}`;

    quantities.push({
      label: "点差法斜率积",
      symbol: "k_{AB} \\cdot k_{OM}",
      value: `${result.pointDiffSlopeProduct.toFixed(4)} (理论值: ${theoreticalVal})`,
    });
  }

  if (studyMode === "polePolar") {
    quantities.push({
      label: "极点坐标 P",
      symbol: "P(x_P, y_P)",
      value: `(${poleX.toFixed(2)}, ${poleY.toFixed(2)})`,
    });
  }

  // 2. 定理公式 (动态置顶核心定理)
  const theorems: MathPanelData["theorems"] = [
    {
      name: "通用弦长公式",
      latex: "|AB| = \\sqrt{1+k^2} \\sqrt{(x_1+x_2)^2 - 4x_1 x_2}",
      condition: "前提：方程二次项系数 A ≠ 0 且判别式 Δ > 0",
      note: "直线 y=kx+m 与曲线联立消 y 得一元二次方程后，结合韦达定理可直接计算弦长。",
      level: studyMode === "general" ? "core" : "important",
    },
    {
      name:
        conicType === "parabola"
          ? "抛物线焦点弦长定理"
          : "通径（最小焦点弦）定理",
      latex:
        conicType === "parabola"
          ? "|AB| = x_1 + x_2 + p = \\frac{2p}{\\sin^2 \\theta}"
          : conicType === "ellipse"
            ? "L_{通径} = \\frac{2b^2}{a}"
            : "L_{通径} = \\frac{2b^2}{a}",
      condition: "过焦点直线专用公式",
      note:
        conicType === "parabola"
          ? "由抛物线定义，焦点弦长等于两端点到准线距离之和。当 θ = π/2 时取最小值（通径 2p）。"
          : "过焦点垂直于长轴/实轴的弦称为通径，是焦半径和焦点弦在垂直方向的极值点。",
      level: studyMode === "focus" ? "core" : "important",
    },
    {
      name: "中点弦“点差法”公式",
      latex:
        conicType === "ellipse"
          ? "k_{AB} \\cdot k_{OM} = -\\frac{b^2}{a^2}"
          : conicType === "hyperbola"
            ? "k_{AB} \\cdot k_{OM} = \\frac{b^2}{a^2}"
            : "k_{AB} \\cdot y_0 = p",
      note: "利用曲线方程上两点 A, B 作差，可避开一元二次方程根的繁琐求解，直接求得弦中点 M 与弦斜率 k 的乘积。",
      level: studyMode === "midpoint" ? "core" : "important",
    },
    {
      name: "极点与极线（切点弦方程对偶定理）",
      latex:
        conicType === "ellipse"
          ? "\\frac{x_P x}{a^2} + \\frac{y_P y}{b^2} = 1"
          : conicType === "hyperbola"
            ? "\\frac{x_P x}{a^2} - \\frac{y_P y}{b^2} = 1"
            : "y_P y = p(x + x_P)",
      condition: "极点 P(x_P, y_P) 在二次曲线外部",
      note: "从曲线外一点 P(xP, yP) 引出的两条切线 PA, PB，其切点弦 AB 所在直线方程恰好是将二次方程中的 x² 替换为 xP x、y² 替换为 yP y！",
      level: studyMode === "polePolar" ? "core" : "important",
    },
  ];

  // 3. 高考考点
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【切点弦方程速写】由二次曲线外一点 P(xP, yP) 作两条切线，求切点弦 AB 方程无需联立解切点，直接套用极线公式一步写出！",
      importance: "gaokao",
    },
    {
      text: "【联立方程与判别式讨论】高考压轴题第(2)问的通法：设直线 -> 联立方程 -> 判别式 $\\Delta > 0$ -> 韦达定理 -> 目标表达式化简。",
      importance: "gaokao",
    },
    {
      text: "【中点弦与点差法】用“点差法”快速求出弦中点轨迹方程或垂直平分线，注意需带回判别式 $\\Delta > 0$ 进行检验（防越界）。",
      importance: "gaokao",
    },
    {
      text: "【弦长与三角形面积最值】结合基本不等式 $a+b \\ge 2\\sqrt{ab}$ 或导数单调性求 $S_{\\triangle OAB}$ 或 $|AB|$ 的最大值/最小值。",
      importance: "hard",
    },
  ];

  // 4. 警示事项
  const warnings: MathPanelData["warnings"] = [
    {
      text: "【二次项系数归零陷阱】双曲线中当直线斜率 $k = \\pm b/a$（平行于渐近线）或抛物线中 $k = 0$（平行于对称轴）时，联立后方程降阶为一元一次方程，仅有1个交点，但绝对不是相切！",
      level: "danger",
    },
    {
      text: "【斜率不存在（垂直线）漏解】若设直线为 $y = kx + m$，必须独立讨论斜率不存在 $x = x_0$ 的情况；更推荐设 $x = my + t$（除水平线外均适用）。",
      level: "warning",
    },
    {
      text: "【韦达定理代入前未验 Δ】在使用韦达定理计算弦长或几何量前，必须写出并保证 $\\Delta > 0$，否则解出的点可能为复数伪根。",
      level: "warning",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "设联立，验判别，韦达代入算弦长；中点弦，用点差，斜率积定莫忘验！",
  };
}
