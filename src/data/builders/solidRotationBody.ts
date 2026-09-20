import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import { calculateCylinderSphere } from "@/math3d/circumInSphere";
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

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

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
        label: "侧面展开测地线最短长",
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
        label: "侧面展开测地线最短长",
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
      rubric: "[高考采分点] 作轴截面平面图并标清基本度量特征 (+4分)",
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
      rubric: "[高考采分点] 正确列出侧面积/截面积与体积计算公式 (+5分)",
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
      rubric: "[高考采分点] 精确解出最终结果并说明几何临界与展开性质 (+4分)",
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

  return { quantities, theorems, gaokaoPoints, warnings, reasoningSteps };
}
