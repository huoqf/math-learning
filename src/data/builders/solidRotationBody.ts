import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import { calculateCylinderSphere } from "@/math3d/circumInSphere";
import { buildRotationUnfoldData } from "@/math3d/rotationUnfold";
import {
  coneGeneratrix,
  frustumGeneratrix,
  cylinderAxialDiagonal,
  cylinderLateralShortestPath,
  sphereSectionRadius,
} from "@/math3d/solidGeometry";

// ── know-solid-rotation-body: 旋转体的结构特征 ──

export function buildRotationBodyPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const shape =
    ((params as Record<string, unknown>).shape as string) ??
    (config?.shape as string) ??
    "rectangle";
  const r1 = params.r1 ?? 1.5;
  const r2 = params.r2 ?? 0.8;
  const height = params.height ?? 3;
  const cutDistance = params.cutDistance ?? 0.8;
  const mode = (config?.mode as string | undefined) ?? "generation";
  const sweepAngleDeg = params.sweepAngleDeg ?? 360;
  const unfoldProgress = params.unfoldProgress ?? 1;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (mode === "unfoldPath" && shape !== "semicircle") {
    const unfoldType =
      shape === "rectangle"
        ? "cylinder"
        : shape === "rightTriangle"
          ? "cone"
          : "frustum";
    const unfold = buildRotationUnfoldData({
      type: unfoldType,
      r1,
      r2,
      height,
      unfoldProgress,
    });
    const lStr = formatMathNumber(unfold.generatorLength, 3);
    const alphaStr = formatMathNumber(unfold.unfoldAngleDeg, 1);
    const minStr = formatMathNumber(unfold.minPathLength, 4);
    const r1Str = formatMathNumber(r1);
    const r2Str = formatMathNumber(r2);
    const hStr = formatMathNumber(height);
    const pPct = formatMathNumber(unfoldProgress * 100, 0);

    quantities.push(
      {
        label: "侧面展开度 $p$",
        symbol: "p",
        value: `${pPct}%`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "母线长 $l$",
        symbol: "l",
        value: lStr,
        color: MATH_COLORS.complexNum,
      },
      {
        label: "展开扇面圆心角 $\\alpha$",
        symbol: "\\alpha",
        value:
          unfoldType === "cylinder"
            ? "360° (矩形宽 $2\\pi r$)"
            : `${alphaStr}°`,
        color: MATH_COLORS.sequenceCobweb,
      },
      {
        label: "表面最短路径 $L_{\\min}$",
        symbol: "L_{\\min}",
        value: Number(unfold.minPathLength.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push({
      name: "化曲为直最短路径原理",
      latex: `L_{\\min} = |AB|_{\\text{展开平面内有效最短线}}`,
      level: "core",
      condition: "沿旋转体一条母线剪开铺平后，侧面弧长与母线长均保持等距不变",
    });

    if (unfoldType === "cylinder") {
      theorems.push({
        name: "圆柱侧面展开最短路径公式",
        latex: `L_{\\min} = \\sqrt{(2\\pi \\color{${MATH_COLORS.paramPrimary}}{r})^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2}`,
        level: "core",
        condition: "底面圆周点 $A$ 绕侧面一周到达上底同母线点 $A_1$",
      });
    } else if (unfoldType === "cone") {
      theorems.push({
        name: "圆锥侧面展开最短路径（含扇角临界）",
        latex: `L_{\\min} = \\begin{cases} 2\\color{${MATH_COLORS.paramTertiary}}{l}\\sin\\dfrac{\\alpha}{2}, & \\alpha \\le 180^\\circ \\\\[1ex] 2\\color{${MATH_COLORS.paramTertiary}}{l}, & \\alpha > 180^\\circ \\end{cases}`,
        level: "core",
        condition:
          "展开扇形圆心角 $\\alpha = \\frac{r}{l} \\times 360^\\circ$；若 $\\alpha > 180^\\circ$，路径折过锥顶退化为两倍母线长",
      });
    } else {
      theorems.push({
        name: "圆台补台成锥余弦定理最短路",
        latex: `L_{\\min} = \\sqrt{R_1^2 + R_2^2 - 2 R_1 R_2 \\cos\\theta_{\\text{eff}}}, \\quad \\theta_{\\text{eff}} = \\min(\\alpha, 2\\pi - \\alpha)`,
        level: "core",
        condition:
          "令大扇径 $R_1 = \\frac{r_1}{r_1 - r_2}l$、内径 $R_2 = \\frac{r_2}{r_1 - r_2}l$；若连线被上底内圆遮挡，表面贴合路径改由切线段加顶边圆弧接续",
      });
    }

    if (unfold.pathRegime === "cone_apex_degenerate") {
      warnings.push({
        text: `当前圆锥展开圆心角 $\\alpha = ${alphaStr}^\\circ > 180^\\circ$，展开扇形超过半圆，底面两剪缝点直接弦线会穿出纸面，最短路径折经锥顶取 $L_{\\min} = 2l = ${minStr}$。`,
        level: "warning",
      });
    } else if (unfold.pathRegime === "frustum_tangent_arc") {
      warnings.push({
        text: `当前圆台参数下，理想余弦弦长（${formatMathNumber(unfold.chordLawOfCosinesLength, 4)}）会侵入上底空心圆内侧；受限于扇环表面，真实表面最短路径先沿外点到内圆的切线行进，再贴合顶边圆弧到达终点 $B$，实长 $L_{\\min} = ${minStr}$。`,
        level: "info",
      });
    } else if (shape === "rightTrapezoid" && Math.abs(r1 - r2) < 0.05) {
      warnings.push({
        text: "上、下底半径接近相等（$r_2 \\approx r_1$），圆台展开扇环演化为矩形，最短路径收敛于圆柱螺旋对角线公式。",
        level: "warning",
      });
    }

    gaokaoPoints.push(
      {
        text: "新高考选填与大题经典考点：求曲面两点间最短距离时，务必写出「展开圆心角 $\\alpha$」与「等距母线半径 $R_1, R_2$」，先检验展开角是否超过 $180^\\circ$ 或被内孔遮挡，再用余弦定理或勾股定理求解。",
        importance: "gaokao",
      },
      {
        text: "防错提示：圆锥展开角 $\\alpha = \\frac{r}{l}\\times 360^\\circ$ 是展开扇形的圆心角，切忌与底面圆周角混为一谈；当 $\\alpha > 180^\\circ$ 时，过扇面内部的最短路径会折经锥顶或沿边界接续。",
        importance: "core",
      },
    );

    const reasoningSteps: ReasoningStep[] =
      unfoldType === "cylinder"
        ? [
            {
              step: 1,
              title: "沿母线剪开侧面建立矩形展开图",
              detail:
                "圆柱侧面沿过 $A, A_1$ 的母线剪开并铺平为矩形，底边宽等于底面圆周长 $2\\pi r$，高等于母线长 $h$：",
              latex: `\\begin{aligned} W &= 2\\pi r = 2\\pi \\times ${r1Str}, \\quad H = h = ${hStr} \\end{aligned}`,
              rubric: "【高考采分点】正确确定展开矩形边长 (+4分)",
            },
            {
              step: 2,
              title: "由两点之间线段最短建立勾股模型",
              detail:
                "展开图中从左下顶点 $A$ 绕行一周等价于沿矩形对角线直达右上顶点 $A_1$，代入勾股定理：",
              latex: `\\begin{aligned} L_{\\min} &= \\sqrt{(2\\pi r)^2 + h^2} \\\\[1ex] &= \\sqrt{(${formatMathNumber(2 * Math.PI * r1, 3)})^2 + ${hStr}^2} = ${minStr} \\end{aligned}`,
              rubric: "【高考采分点】代入勾股解析式求精确值 (+5分)",
            },
            {
              step: 3,
              title: "还原 3D 表面螺旋轨线校验等距性",
              detail:
                "随着侧面卷回闭合（展开度 $p: 1 \\to 0$），矩形对角线等距映射为圆柱面上的最短曲线，弧长恒等于 $L_{\\min}$：",
              latex: `\\left. L_{\\min} \\right|_{p \\in [0, 1]} = ${minStr}`,
              rubric: "【高考采分点】检验曲平展开等距性质 (+3分)",
            },
          ]
        : unfoldType === "cone"
          ? [
              {
                step: 1,
                title: "计算圆锥母线长与扇形圆心角",
                detail:
                  "由底面圆周长等于展开扇形弧长 $l\\alpha = 2\\pi r$，先求母线长 $l$ 与扇形张角 $\\alpha$：",
                latex: `\\begin{aligned} l &= \\sqrt{r^2 + h^2} = ${lStr} \\\\[1ex] \\alpha &= \\frac{r}{l} \\times 360^\\circ = ${alphaStr}^\\circ \\end{aligned}`,
                rubric: "【高考采分点】求解母线长与扇形圆心角 (+4分)",
              },
              {
                step: 2,
                title: "检验扇角临界范围并列余弦/弦长式",
                detail:
                  unfold.pathRegime === "cone_apex_degenerate"
                    ? "因 $\\alpha > 180^\\circ$，展开扇形超过半圆弧，过锥顶折线满足表面约束，故取两倍母线长："
                    : "因 $\\alpha \\le 180^\\circ$，展开扇形不超过半圆弧，在等腰 $\\triangle OAA'$ 中由余弦定理得弦长：",
                latex:
                  unfold.pathRegime === "cone_apex_degenerate"
                    ? `L_{\\min} = 2 l = 2 \\times ${lStr} = ${minStr}`
                    : `\\begin{aligned} L_{\\min} &= \\sqrt{l^2 + l^2 - 2 l^2 \\cos\\alpha} \\\\[1ex] &= 2(${lStr})\\sin\\frac{${alphaStr}^\\circ}{2} = ${minStr} \\end{aligned}`,
                rubric: "【高考采分点】临界判定与三角/余弦求值 (+5分)",
              },
              {
                step: 3,
                title: "核对极值与动态展开一致性",
                detail:
                  "拖动展开度滑块 $p$ 可见平面弦线在闭合态自动弯曲贴合锥面，全程保持长度不变量：",
                latex: `\\left. L_{\\min} \\right|_{p \\in [0, 1]} = ${minStr}`,
                rubric: "【高考采分点】数形验证表面最短路径 (+3分)",
              },
            ]
          : [
              {
                step: 1,
                title: "补台成锥求展开扇环内外径与圆心角",
                detail:
                  "延长圆台两母线交于虚拟锥顶，利用相似三角形求大圆半径 $R_1$、小圆半径 $R_2$ 与圆心角 $\\alpha$：",
                latex: `\\begin{aligned} l &= \\sqrt{(r_1 - r_2)^2 + h^2} = ${lStr} \\\\[1ex] R_1 &= ${formatMathNumber(unfold.outerRadius2D, 3)}, \\quad R_2 = ${formatMathNumber(unfold.innerRadius2D, 3)} \\\\[1ex] \\alpha &= \\frac{|r_1 - r_2|}{l} \\times 360^\\circ = ${alphaStr}^\\circ \\end{aligned}`,
                rubric: "【高考采分点】补台成锥求扇环内外半径与张角 (+4分)",
              },
              {
                step: 2,
                title: "取有效弦角列余弦定理并校验内孔遮挡",
                detail:
                  unfold.pathRegime === "frustum_tangent_arc"
                    ? `取有效弦角 $\\theta_{\\text{eff}} = \\min(\\alpha, 360^\\circ-\\alpha)$ 时连线切入内孔 $R_2$，实际贴面路径为切线段加顶边圆弧：`
                    : `因连线完全落于扇环内部，取有效弦角 $\\theta_{\\text{eff}} = ${formatMathNumber((unfold.effectiveChordAngleRad * 180) / Math.PI, 1)}^\\circ$ 代入余弦定理：`,
                latex:
                  unfold.pathRegime === "frustum_tangent_arc"
                    ? `\\begin{aligned} L_{\\text{弦}} &= \\sqrt{R_1^2 + R_2^2 - 2 R_1 R_2 \\cos\\theta_{\\text{eff}}} = ${formatMathNumber(unfold.chordLawOfCosinesLength, 4)} \\\\[1ex] L_{\\text{贴面}} &= \\sqrt{R_1^2 - R_2^2} + R_2(\\alpha - \\arccos\\frac{R_2}{R_1}) = ${minStr} \\end{aligned}`
                    : `\\begin{aligned} L_{\\min} &= \\sqrt{R_1^2 + R_2^2 - 2 R_1 R_2 \\cos\\theta_{\\text{eff}}} \\\\[1ex] &= \\sqrt{(${formatMathNumber(unfold.outerRadius2D, 2)})^2 + (${formatMathNumber(unfold.innerRadius2D, 2)})^2 - 2 R_1 R_2 \\cos\\theta_{\\text{eff}}} = ${minStr} \\end{aligned}`,
                rubric: "【高考采分点】余弦定理建模与约束修正 (+5分)",
              },
              {
                step: 3,
                title:
                  "检验上下底退化极限（$\\Delta r \\to 0$ / $r_2 \\to 0$）",
                detail: `当下底半径 $r_1 = ${r1Str}$、上底半径 $r_2 = ${r2Str}$ 趋近相等时，圆台无缝演化为圆柱；若 $r_2 \\to 0$ 则演化为圆锥：`,
                latex: `r_2 \\to r_1 \\implies L_{\\min} \\to \\sqrt{(2\\pi r_1)^2 + h^2}`,
                rubric: "【高考采分点】总结柱锥台统一演化结论 (+3分)",
              },
            ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      examAnchor: "新高考选填高频压轴 · 旋转体侧面展开图化曲为直求最短距离",
      mnemonic:
        "曲表求距先剪开，扇环补锥算角来；莫越缺口莫穿孔，勾股余弦秒破题。",
    };
  }

  if (mode === "generation") {
    quantities.push({
      label: "生成扫掠角",
      symbol: "\\theta",
      value: `${sweepAngleDeg.toFixed(0)}°`,
      color: MATH_COLORS.accent,
    });
  }

  if (shape === "rectangle") {
    const sSide = 2 * Math.PI * r1 * height;
    const sBase = Math.PI * r1 ** 2;
    const sTotal = sSide + 2 * sBase;
    const sAxial = 2 * r1 * height;
    const v = Math.PI * r1 ** 2 * height;
    const diagAxial = cylinderAxialDiagonal(r1, height);
    const shortestPath = cylinderLateralShortestPath(r1, height);
    const rCircum = calculateCylinderSphere(r1, height, "circum").radius;

    quantities.push(
      {
        label: "底面半径 r",
        symbol: "r",
        value: r1.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "圆柱高 h",
        symbol: "h",
        value: height.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "轴截面积",
        symbol: "S_{\\text{轴}}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "轴截面对角线",
        symbol: "d_{\\text{轴}}",
        value: diagAxial.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "侧面积",
        symbol: "S_{\\text{侧}}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "全面积",
        symbol: "S_{\\text{全}}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.complexNum,
      },
      {
        label: "体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight,
      },
      {
        label: "外接球半径 R_外",
        symbol: "R_{\\text{外}}",
        value: rCircum.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面展开表面最短路径长",
        symbol: "L_{\\min}",
        value: shortestPath.toFixed(2),
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "圆柱侧面积与全面积",
        latex: `S_{\\text{侧}}=2\\pi \\color{${MATH_COLORS.paramPrimary}}{r} \\color{${MATH_COLORS.paramTertiary}}{h},\\; S_{\\text{全}}=2\\pi \\color{${MATH_COLORS.paramPrimary}}{r}(\\color{${MATH_COLORS.paramPrimary}}{r}+\\color{${MATH_COLORS.paramTertiary}}{h})`,
        level: "core",
      },
      {
        name: "圆柱体积公式",
        latex: `V=\\pi \\color{${MATH_COLORS.paramPrimary}}{r}^2 \\color{${MATH_COLORS.paramTertiary}}{h} = S_{\\text{底}} \\color{${MATH_COLORS.paramTertiary}}{h}`,
        level: "core",
      },
      {
        name: "圆柱外接球模型",
        latex: `R_{\\text{外}}^2 = \\color{${MATH_COLORS.paramPrimary}}{r}^2 + \\left(\\frac{\\color{${MATH_COLORS.paramTertiary}}{h}}{2}\\right)^2`,
        level: "important",
        note: "圆柱上下底面圆心连线中点即为外接球球心",
      },
      {
        name: "侧面展开图最短路径（化曲为直）",
        latex: `L_{\\min} = \\sqrt{(2\\pi \\color{${MATH_COLORS.paramPrimary}}{r})^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2}`,
        level: "important",
        condition: "从底面一点绕侧面一周到达上底面对应点的最短距离",
      },
    );
  } else if (shape === "rightTriangle") {
    const l = coneGeneratrix(r1, height);
    const angleDeg = (r1 / l) * 360;
    const angleRad = (angleDeg * Math.PI) / 180;
    // 轴截面顶角 2θ（高考高频考点）
    const halfApexAngleDeg = (Math.asin(r1 / l) * 180) / Math.PI;
    const apexAngleDeg = 2 * halfApexAngleDeg;
    const sSide = Math.PI * r1 * l;
    const sBase = Math.PI * r1 ** 2;
    const sTotal = sSide + sBase;
    const sAxial = r1 * height;
    const v = (Math.PI * r1 ** 2 * height) / 3;
    const rCircum = (l * l) / (2 * height); // 外接球半径
    const rIn = (r1 * height) / (r1 + l); // 内切球半径
    const shortestPath =
      angleRad <= Math.PI ? 2 * l * Math.sin(angleRad / 2) : 2 * l;

    quantities.push(
      {
        label: "底面半径 r",
        symbol: "r",
        value: r1.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "圆锥高 h",
        symbol: "h",
        value: height.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "母线长 l",
        symbol: "l",
        value: l.toFixed(2),
        color: MATH_COLORS.complexNum,
      },
      {
        label: "侧面展开圆心角 α",
        symbol: "\\alpha",
        value: `${angleDeg.toFixed(1)}°`,
        color: MATH_COLORS.sequenceCobweb,
      },
      {
        label: "轴截面顶角 2θ",
        symbol: "2\\theta",
        value: `${apexAngleDeg.toFixed(1)}°`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "轴截面积",
        symbol: "S_{\\text{轴}}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面积",
        symbol: "S_{\\text{侧}}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "全面积",
        symbol: "S_{\\text{全}}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight,
      },
      {
        label: "外接球半径 R_外",
        symbol: "R_{\\text{外}}",
        value: rCircum.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "内切球半径 r_内",
        symbol: "r_{\\text{内}}",
        value: rIn.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "侧面展开表面最短路径长",
        symbol: "L_{\\min}",
        value: shortestPath.toFixed(2),
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "圆锥特征直角三角形与表面积",
        latex: `\\color{${MATH_COLORS.paramSecondary}}{l} = \\sqrt{\\color{${MATH_COLORS.paramPrimary}}{r}^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2},\\; S_{\\text{侧}} = \\pi \\color{${MATH_COLORS.paramPrimary}}{r} \\color{${MATH_COLORS.paramSecondary}}{l},\\; S_{\\text{全}} = \\pi \\color{${MATH_COLORS.paramPrimary}}{r}(\\color{${MATH_COLORS.paramPrimary}}{r} + \\color{${MATH_COLORS.paramSecondary}}{l})`,
        level: "core",
        note: "高 h、底面半径 r、母线 l 构成特征直角三角形",
      },
      {
        name: "侧面展开圆心角与轴截面顶角关系",
        latex: `\\alpha = \\frac{\\color{${MATH_COLORS.paramPrimary}}{r}}{\\color{${MATH_COLORS.paramSecondary}}{l}} \\cdot 360^\\circ = 2\\pi \\sin\\theta,\\quad \\sin\\theta = \\frac{\\color{${MATH_COLORS.paramPrimary}}{r}}{\\color{${MATH_COLORS.paramSecondary}}{l}}`,
        level: "core",
        condition:
          "高考核心：当展开图为半圆(α=180°)时，sinθ=1/2，顶角2θ=60°(等边三角形)",
      },
      {
        name: "圆锥体积公式",
        latex: `V = \\frac{1}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{r}^2 \\color{${MATH_COLORS.paramTertiary}}{h} = \\frac{1}{3} S_{\\text{底}} \\color{${MATH_COLORS.paramTertiary}}{h}`,
        level: "core",
      },
      {
        name: "圆锥切接球定理",
        latex: `R_{\\text{外}} = \\frac{\\color{${MATH_COLORS.paramSecondary}}{l}^2}{2\\color{${MATH_COLORS.paramTertiary}}{h}},\\; r_{\\text{内}} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{r}\\color{${MATH_COLORS.paramTertiary}}{h}}{\\color{${MATH_COLORS.paramPrimary}}{r} + \\color{${MATH_COLORS.paramSecondary}}{l}}`,
        level: "important",
        note: "分别对应轴截面等腰三角形的外接圆与内切圆",
      },
    );
    // 展开圆心角超过 180° 时，扇形不再是凸图形：连接两条母线的直线段会穿出扇形（离开锥面），
    // 此时绕侧一周的最短路不再是弦长 2l·sin(α/2)，而退化为经过顶点的两段母线 2l。
    // 该分支 math 层与 builder 取值的口径一致（rotationProfiles.ts:190-191 / 本文件 :144-145）。
    if (angleDeg > 180) {
      warnings.push({
        text: `当前展开圆心角 α = ${angleDeg.toFixed(1)}° > 180°，展开扇形不再是凸图形，连接两条母线的直线段会穿出扇形（即离开锥面），故绕侧一周的最短路退化为经过顶点的两段母线：L_min = 2l = ${(2 * l).toFixed(2)}（而非弦长 ${(2 * l * Math.sin((angleDeg * Math.PI) / 360)).toFixed(2)}）。`,
        level: "warning",
      });
    }
  } else if (shape === "rightTrapezoid") {
    const l = frustumGeneratrix(r1, r2, height);
    const sSide = Math.PI * (r1 + r2) * l;
    const sTop = Math.PI * r2 ** 2;
    const sBottom = Math.PI * r1 ** 2;
    const sTotal = sSide + sTop + sBottom;
    const sAxial = (r1 + r2) * height;
    const v = (Math.PI * height * (r1 ** 2 + r1 * r2 + r2 ** 2)) / 3;
    const deltaR = Math.abs(r1 - r2);
    const unfoldAngleDeg = deltaR > 1e-4 && l > 0 ? (deltaR / l) * 360 : 0;

    quantities.push(
      {
        label: "下底半径 r₁",
        symbol: "r_1",
        value: r1.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "上底半径 r₂",
        symbol: "r_2",
        value: r2.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "圆台高 h",
        symbol: "h",
        value: height.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "母线长 l",
        symbol: "l",
        value: l.toFixed(2),
        color: MATH_COLORS.complexNum,
      },
      {
        label: "展开扇环圆心角 α",
        symbol: "\\alpha",
        value: `${unfoldAngleDeg.toFixed(1)}°`,
        color: MATH_COLORS.sequenceCobweb,
      },
      {
        label: "轴截面积",
        symbol: "S_{\\text{轴}}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面积",
        symbol: "S_{\\text{侧}}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "全面积",
        symbol: "S_{\\text{全}}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "圆台特征直角梯形与表面积",
        latex: `\\color{${MATH_COLORS.paramTertiary}}{l} = \\sqrt{(\\color{${MATH_COLORS.paramPrimary}}{r_1}-\\color{${MATH_COLORS.paramSecondary}}{r_2})^2+\\color{${MATH_COLORS.paramTertiary}}{h}^2},\\; S_{\\text{侧}}=\\pi(\\color{${MATH_COLORS.paramPrimary}}{r_1}+\\color{${MATH_COLORS.paramSecondary}}{r_2})\\color{${MATH_COLORS.paramTertiary}}{l},\\; S_{\\text{全}}=S_{\\text{侧}}+\\pi \\color{${MATH_COLORS.paramPrimary}}{r_1}^2+\\pi \\color{${MATH_COLORS.paramSecondary}}{r_2}^2`,
        level: "core",
        note: "高 h、半径差 |r₁-r₂|、母线 l 构成特征直角三角形",
      },
      {
        name: "圆台体积公式",
        latex: `V=\\frac{1}{3}\\pi \\color{${MATH_COLORS.paramTertiary}}{h}(\\color{${MATH_COLORS.paramPrimary}}{r_1}^2+\\color{${MATH_COLORS.paramPrimary}}{r_1}\\color{${MATH_COLORS.paramSecondary}}{r_2}+\\color{${MATH_COLORS.paramSecondary}}{r_2}^2)`,
        level: "core",
      },
      {
        name: "柱锥台体积统一公式",
        latex: `V=\\frac{1}{3}\\color{${MATH_COLORS.paramTertiary}}{h}(S_1+\\sqrt{S_1 S_2}+S_2)`,
        level: "important",
        note: "r₂=r₁ (S₁=S₂) 时演化为圆柱 V=Sh；r₂=0 (S₂=0) 时演化为圆锥 V=⅓Sh",
      },
    );
  } else {
    // semicircle → sphere
    const R = r1;
    const absD = Math.abs(cutDistance);
    const isIntersect = absD < R - 1e-4;
    const isTangent = Math.abs(absD - R) <= 1e-4;
    const rCut = sphereSectionRadius(R, absD);
    const sGreatCircle = Math.PI * R ** 2;
    const sCut = Math.PI * rCut ** 2;
    const sTotal = 4 * Math.PI * R ** 2;
    const v = (4 / 3) * Math.PI * R ** 3;
    const relationStr =
      absD < 1e-4
        ? "大圆截面 (d=0)"
        : isIntersect
          ? "相交 (截面为小圆)"
          : isTangent
            ? "相切 (截面退化为点)"
            : "相离 (截面无公共点)";

    quantities.push(
      {
        label: "球半径 R",
        symbol: "R",
        value: R.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "球心距 d",
        symbol: "d",
        value: absD.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "截面圆半径 r_截",
        symbol: "r_{\\text{截}}",
        value: rCut.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "位置关系",
        symbol: "\\text{位置}",
        value: relationStr,
        color: MATH_COLORS.primary,
      },
      {
        label: "截面面积",
        symbol: "S_{\\text{截}}",
        value: sCut.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "大圆截面面积",
        symbol: "S_{\\text{大圆}}",
        value: sGreatCircle.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "球表面积",
        symbol: "S_{\\text{球}}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "球体积",
        symbol: "V_{\\text{球}}",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "球截面性质定理（小圆半径公式）",
        latex: `\\color{${MATH_COLORS.paramPrimary}}{R}^2 = r_{\\text{截}}^2 + \\color{${MATH_COLORS.paramSecondary}}{d}^2 \\implies r_{\\text{截}} = \\sqrt{\\color{${MATH_COLORS.paramPrimary}}{R}^2 - \\color{${MATH_COLORS.paramSecondary}}{d}^2}`,
        level: "core",
        note: "球心到截面距离 d、截面小圆半径 r_截 与球半径 R 构成直角三角形",
      },
      {
        name: "平面与球的位置关系判定",
        latex: `d < \\color{${MATH_COLORS.paramPrimary}}{R} \\Leftrightarrow \\text{相交(圆)},\\; d = \\color{${MATH_COLORS.paramPrimary}}{R} \\Leftrightarrow \\text{相切(点)},\\; d > \\color{${MATH_COLORS.paramPrimary}}{R} \\Leftrightarrow \\text{相离(无公共点)}`,
        level: "core",
        condition: "高考判定平面截球图形性质的基础准则",
      },
      {
        name: "球表面积与体积公式",
        latex: `S = 4\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^2,\\; V = \\frac{4}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^3`,
        level: "core",
        note: "球体积与表面积公式均直接给出使用（推导不属高中课标要求）",
      },
      {
        name: "球面距离（大圆劣弧）定理",
        latex: `L = \\color{${MATH_COLORS.paramPrimary}}{R} \\cdot \\theta \\quad (\\theta \\in [0, \\pi])`,
        level: "important",
        note: "球面上两点间的最短路径即经过这两点的大圆劣弧长度",
      },
    );
  }

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 轴截面降维与基本度量提取",
      detail:
        "立体几何旋转体问题关键在于提取“轴截面”平面图形。根据旋转母线与旋转轴特征，列出底面半径、高与母线长的几何关系：",
      latex:
        shape === "semicircle"
          ? `R = ${r1.toFixed(2)}, \\quad d = ${Math.abs(cutDistance).toFixed(2)}`
          : shape === "rightTrapezoid"
            ? `r_1 = ${r1.toFixed(2)}, \\; r_2 = ${r2.toFixed(2)}, \\; h = ${height.toFixed(2)} \\implies l = \\sqrt{(r_1-r_2)^2 + h^2}`
            : shape === "rectangle"
              ? `r = ${r1.toFixed(2)}, \\quad h = ${height.toFixed(2)}, \\quad \\text{母线} \\parallel \\text{轴} \\implies l = h`
              : `r = ${r1.toFixed(2)}, \\quad h = ${height.toFixed(2)} \\implies l = \\sqrt{r^2 + h^2}`,
      rubric: "【高考采分点】作轴截面平面图并标清基本度量特征 (+4分)",
    },
    {
      step: 2,
      title: "建模联立 · 代入表面积与体积解析通式",
      detail:
        "利用旋转体面积与体积公式建立数学模型。底面积、侧面积展开图与体积满足标准代数多项式：",
      latex:
        shape === "semicircle"
          ? Math.abs(cutDistance) < r1
            ? `r_{\\text{截}} = \\sqrt{R^2 - d^2}, \\quad S_{\\text{截}} = \\pi r_{\\text{截}}^2, \\quad V = \\frac{4}{3}\\pi R^3`
            : `d \\ge R \\implies \\text{截面无小圆 (相切或相离)}, \\quad V = \\frac{4}{3}\\pi R^3`
          : shape === "rightTrapezoid"
            ? `S_{\\text{侧}} = \\pi(r_1+r_2)l, \\quad V = \\frac{1}{3}\\pi h (r_1^2 + r_1 r_2 + r_2^2)`
            : shape === "rectangle"
              ? `S_{\\text{侧}} = 2\\pi r h, \\quad S_{\\text{全}} = 2\\pi r(r+h), \\quad V = \\pi r^2 h`
              : `S_{\\text{侧}} = \\pi r l, \\quad V = \\frac{1}{3}\\pi r^2 h`,
      rubric: "【高考采分点】正确列出侧面积/截面积与体积计算公式 (+5分)",
    },
    {
      step: 3,
      title: "求解反思 · 展开图圆心角与退化临界检验",
      detail:
        "侧面沿母线展开后化曲为平，或球截面考察相切相离边界。检验几何极值与充分必要条件：",
      latex:
        shape === "semicircle"
          ? `d < R \\iff \\text{截面为圆}, \\quad d = R \\iff \\text{相切}, \\quad d > R \\iff \\text{相离}`
          : shape === "rightTrapezoid"
            ? `\\alpha = \\frac{|r_1 - r_2|}{l} \\times 360^\\circ, \\quad r_1 = r_2 \\iff \\text{演化为圆柱}`
            : shape === "rectangle"
              ? `\\text{侧面展开为矩形：两边分别为} \\; 2\\pi r \\; \\text{(底面周长)} \\; \\text{与} \\; h, \\quad L_{\\min} = \\sqrt{(2\\pi r)^2 + h^2}`
              : `\\alpha = \\frac{r}{l} \\times 360^\\circ = (\\sin\\theta) \\times 360^\\circ`,
      rubric: "【高考采分点】精确解出最终结果并说明几何临界与展开性质 (+4分)",
    },
  ];

  gaokaoPoints.push(
    {
      text: "降维核心（轴截面法）：旋转体由平面图形绕轴旋转生成。轴截面（矩形、等腰三角形、等腰梯形、大圆）是把 3D 空间几何问题降维至 2D 平面特征几何图形快速求参数的核心方法。",
      importance: "gaokao",
    },
    {
      text: "化曲为直（侧面展开图）：求解圆锥/圆柱侧面曲面上两点间最短距离（蚂蚁爬行路径、绳索缠绕问题）时，必须先将侧面沿母线展开为平面图形（圆锥展开为扇形，圆心角 α = (r/l) · 360°），利用两点之间线段最短求解。",
      importance: "gaokao",
    },
    {
      text: "球截面小圆模型（截面勾股定理 / 轴截面直角三角形）：高考立体几何小题高频考点。无论平面从何角度截球，截面均为圆。抓住球心 O、截面圆心 O'、截面圆周上一点 P 构成的 Rt△OO'P，满足 R² = r_截² + d²。",
      importance: "gaokao",
    },
    {
      text: "柱锥台公式统一思想：台体体积公式 V = ⅓h(S₁ + √(S₁S₂) + S₂)。当 r₂=r₁ 时平滑退化为圆柱 V=Sh；当 r₂=0 时平滑退化为圆锥 V=⅓Sh。",
      importance: "gaokao",
    },
    {
      text: "斜二测画法（直观图）：① 横轴 x 长度不变，纵轴 y 长度折半；② 坐标轴夹角为 45° 或 135°；③ 原平面图形面积与直观图面积满足 $S_{\\text{直观}} = (\\sqrt{2} / 4) S_{\\text{原}}$。",
      importance: "core",
    },
  );

  if (shape === "rightTrapezoid") {
    if (Math.abs(r1 - r2) < 0.05) {
      warnings.push({
        text: "上、下底半径接近相等 (r₂ ≈ r₁)，圆台演变/退化为圆柱 (V = Sh)！",
        level: "warning",
      });
    } else if (r2 < 0.15) {
      warnings.push({
        text: "上底半径接近 0 (r₂ ≈ 0)，圆台演变/退化为圆锥 (V = ⅓Sh)！",
        level: "warning",
      });
    }
  }

  if (shape === "semicircle") {
    if (Math.abs(cutDistance) >= r1 - 1e-3) {
      warnings.push({
        text: "球心距 d 达到或超过球半径 R，截面平面与球相切退化为单点或相离！",
        level: "warning",
      });
    }
  }

  if (r1 < 0.15 || height < 0.15) {
    warnings.push({
      text: "几何尺寸接近 0，旋转体退化为线段或点！",
      level: "warning",
    });
  }

  if (mode === "generation" && sweepAngleDeg < 359.5) {
    warnings.push({
      text: `当前仅旋转扫掠 ${sweepAngleDeg.toFixed(0)}°（生成态演示）；看板展示的侧面积、表面积与体积为旋转 360° 完整闭合旋转体的理论值。`,
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings, reasoningSteps };
}
