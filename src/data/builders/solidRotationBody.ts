import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";

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
    const diagAxial = Math.sqrt(4 * r1 ** 2 + height ** 2);
    const shortestPath = Math.sqrt((2 * Math.PI * r1) ** 2 + height ** 2);
    const rCircum = Math.sqrt(r1 ** 2 + (height / 2) ** 2);

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
        latex:
          "S_{\\text{侧}}=2\\pi \\color{#EF4444}{r} \\color{#059669}{h},\\; S_{\\text{全}}=2\\pi \\color{#EF4444}{r}(\\color{#EF4444}{r}+\\color{#059669}{h})",
        level: "core",
      },
      {
        name: "圆柱体积公式",
        latex:
          "V=\\pi \\color{#EF4444}{r}^2 \\color{#059669}{h} = S_{\\text{底}} \\color{#059669}{h}",
        level: "core",
      },
      {
        name: "圆柱外接球模型",
        latex:
          "R_{\\text{外}}^2 = \\color{#EF4444}{r}^2 + \\left(\\frac{\\color{#059669}{h}}{2}\\right)^2",
        level: "important",
        note: "圆柱上下底面圆心连线中点即为外接球球心",
      },
      {
        name: "侧面展开图最短路径（化曲为直）",
        latex:
          "L_{\\min} = \\sqrt{(2\\pi \\color{#EF4444}{r})^2 + \\color{#059669}{h}^2}",
        level: "important",
        condition: "从底面一点绕侧面一周到达上底面对应点的最短距离",
      },
    );
  } else if (shape === "rightTriangle") {
    const l = Math.sqrt(r1 ** 2 + height ** 2);
    const angleDeg = (r1 / l) * 360;
    const angleRad = (angleDeg * Math.PI) / 180;
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
        name: "圆锥特征直角三角形与母线",
        latex:
          "\\color{#059669}{l} = \\sqrt{\\color{#EF4444}{r}^2 + \\color{#059669}{h}^2},\\; S_{\\text{侧}} = \\pi \\color{#EF4444}{r} \\color{#059669}{l}",
        level: "core",
        note: "高 h、底面半径 r、母线 l 构成特征直角三角形",
      },
      {
        name: "侧面展开图圆心角定理",
        latex:
          "\\alpha = \\frac{\\color{#EF4444}{r}}{\\color{#059669}{l}} \\cdot 360^\\circ = \\frac{2\\pi \\color{#EF4444}{r}}{\\color{#059669}{l}} \\text{ (rad)}",
        level: "core",
        condition: "高考侧面上蚂蚁爬行最短折线（化曲为直）核心公式",
      },
      {
        name: "圆锥体积公式",
        latex:
          "V = \\frac{1}{3}\\pi \\color{#EF4444}{r}^2 \\color{#059669}{h} = \\frac{1}{3} S_{\\text{底}} \\color{#059669}{h}",
        level: "core",
      },
      {
        name: "圆锥切接球定理",
        latex:
          "R_{\\text{外}} = \\frac{\\color{#059669}{l}^2}{2\\color{#059669}{h}},\\; r_{\\text{内}} = \\frac{\\color{#EF4444}{r}\\color{#059669}{h}}{\\color{#EF4444}{r} + \\color{#059669}{l}}",
        level: "important",
        note: "分别对应轴截面等腰三角形的外接圆与内切圆",
      },
    );
  } else if (shape === "rightTrapezoid") {
    const l = Math.sqrt((r1 - r2) ** 2 + height ** 2);
    const sSide = Math.PI * (r1 + r2) * l;
    const sTop = Math.PI * r2 ** 2;
    const sBottom = Math.PI * r1 ** 2;
    const sTotal = sSide + sTop + sBottom;
    const sAxial = (r1 + r2) * height;
    const v = (Math.PI * height * (r1 ** 2 + r1 * r2 + r2 ** 2)) / 3;
    const unfoldAngleDeg = r1 > r2 && l > 0 ? ((r1 - r2) / l) * 360 : 0;

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
        name: "圆台特征直角梯形与母线",
        latex:
          "\\color{#059669}{l} = \\sqrt{(\\color{#EF4444}{r_1}-\\color{#D97706}{r_2})^2+\\color{#059669}{h}^2},\\; S_{\\text{侧}}=\\pi(\\color{#EF4444}{r_1}+\\color{#D97706}{r_2})\\color{#059669}{l}",
        level: "core",
        note: "高 h、半径差 (r₁-r₂)、母线 l 构成特征直角三角形",
      },
      {
        name: "圆台体积公式",
        latex:
          "V=\\frac{1}{3}\\pi \\color{#059669}{h}(\\color{#EF4444}{r_1}^2+\\color{#EF4444}{r_1}\\color{#D97706}{r_2}+\\color{#D97706}{r_2}^2)",
        level: "core",
      },
      {
        name: "柱锥台体积统一公式",
        latex: "V=\\frac{1}{3}\\color{#059669}{h}(S_1+\\sqrt{S_1 S_2}+S_2)",
        level: "important",
        note: "r₂=r₁ (S₁=S₂) 时演化为圆柱 V=Sh；r₂=0 (S₁=0) 时演化为圆锥 V=⅓Sh",
      },
    );
  } else {
    // semicircle → sphere
    const R = r1;
    const absD = Math.min(R, Math.abs(cutDistance));
    const rCut = Math.sqrt(Math.max(0, R * R - absD * absD));
    const sGreatCircle = Math.PI * R ** 2;
    const sCut = Math.PI * rCut ** 2;
    const sTotal = 4 * Math.PI * R ** 2;
    const v = (4 / 3) * Math.PI * R ** 3;

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
        label: "截面小圆半径 r_截",
        symbol: "r_{\\text{截}}",
        value: rCut.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "截面小圆面积",
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
        name: "球截面圆勾股定理（垂径模型）",
        latex:
          "\\color{#EF4444}{R}^2 = r_{\\text{截}}^2 + \\color{#D97706}{d}^2 \\implies r_{\\text{截}} = \\sqrt{\\color{#EF4444}{R}^2 - \\color{#D97706}{d}^2}",
        level: "core",
        note: "球心到截面距离 d、截面小圆半径 r_截 与球半径 R 构成直角三角形",
      },
      {
        name: "球表面积与体积公式",
        latex:
          "S = 4\\pi \\color{#EF4444}{R}^2,\\; V = \\frac{4}{3}\\pi \\color{#EF4444}{R}^3",
        level: "core",
        note: "导数微元关系：dV/dR = 4πR² = S（球体由无数薄球壳微元积分累加）",
      },
      {
        name: "球面距离（大圆劣弧）定理",
        latex:
          "L = \\color{#EF4444}{R} \\cdot \\theta \\quad (\\theta \\in [0, \\pi])",
        level: "important",
        note: "球面上两点间的最短路径即经过这两点的大圆劣弧长度",
      },
    );
  }

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
      text: "球截面小圆模型（垂径定理）：高考立体几何小题高频考点。无论平面从何角度截球，截面均为圆。抓住球心 O、截面圆心 O'、截面圆周上一点 P 构成的 Rt△OO'P，满足 R² = r_截² + d²。",
      importance: "gaokao",
    },
    {
      text: "柱锥台公式统一思想：台体体积公式 V = ⅓h(S₁ + √(S₁S₂) + S₂)。当 r₂=r₁ 时平滑退化为圆柱 V=Sh；当 r₂=0 时平滑退化为圆锥 V=⅓Sh。",
      importance: "gaokao",
    },
    {
      text: "斜二测画法（直观图）：① 横轴 x 长度不变，纵轴 y 长度折半；② 坐标轴夹角为 45° 或 135°；③ 原平面图形面积与直观图面积满足 S_直观 = (√2 / 4) S_原。",
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

  if (r1 < 0.15 || height < 0.15) {
    warnings.push({
      text: "几何尺寸接近 0，旋转体退化为线段或点！",
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
