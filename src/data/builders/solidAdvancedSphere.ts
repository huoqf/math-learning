import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calculatePerpPlanesSphere,
  calculateConcentricSpheres,
  calculateTruncatedConeSphere,
  calculateSphereExtrema,
} from "@/math3d/advancedSphereModels";

// ── anim-solid-advanced-sphere: 进阶切接球专题看板 ──

export function buildAdvancedSpherePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const modelType = (config?.modelType as string) ?? "perpPlanes";

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (modelType === "perpPlanes") {
    const r1 = params.r1 ?? 3;
    const r2 = params.r2 ?? 3.5;
    const c = params.c ?? 3;
    const res = calculatePerpPlanesSphere(r1, r2, c);
    const S_sphere = 4 * Math.PI * res.radius * res.radius;
    const V_sphere = (4 / 3) * Math.PI * res.radius ** 3;

    quantities.push(
      {
        label: "底面外接圆半径 r₁",
        symbol: "r_1",
        value: Number(r1.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "侧面外接圆半径 r₂",
        symbol: "r_2",
        value: Number(r2.toFixed(2)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "公共交线长 c (AC)",
        symbol: "c",
        value: Number(c.toFixed(2)),
        color: MATH_COLORS.accent,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(3)),
        color: MATH_COLORS.sphereShell,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{\\text{球}}",
        value: Number(S_sphere.toFixed(2)),
        color: MATH_COLORS.primary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{\\text{球}}",
        value: Number(V_sphere.toFixed(2)),
        color: MATH_COLORS.primary,
      },
    );

    theorems.push(
      {
        name: "面面垂直双外心交汇定理",
        latex: `R^2 = r_1^2 + r_2^2 - \\left(\\frac{c}{2}\\right)^2 = d_1^2 + d_2^2 + \\left(\\frac{c}{2}\\right)^2`,
        level: "core",
        note: "两面垂直时，过两面外心分别作平面的垂线，两垂线在空间必相交于外接球球心 O",
      },
      {
        name: "空间垂线直角矩形特征",
        latex: `O O_1 \\perp \\text{底面}, \\quad O O_2 \\perp \\text{侧面} \\implies H-O_1-O-O_2 \\text{ 构成空间矩形}`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【面面垂直外接球秒杀口诀】“一求两面外接圆半径 r₁, r₂，二求公共交线长 c，三代勾股差公式 R² = r₁² + r₂² - (c/2)²”。此模型是高考立体几何大题高频母题！",
      importance: "gaokao",
    });

    if (c >= 2 * Math.min(r1, r2)) {
      warnings.push({
        text: `当前交线长 c = ${c} 接近外接圆直径 2·min(r₁, r₂)，三角形在对应外接圆上达到极限临界！`,
        level: "warning",
      });
    }
  } else if (modelType === "concentric") {
    const a = params.a ?? 4;
    const res = calculateConcentricSpheres(a);

    quantities.push(
      {
        label: "正四面体棱长 a",
        symbol: "a",
        value: Number(a.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "内切球半径 r",
        symbol: "r_{\\text{内}}",
        value: Number(res.inRadius.toFixed(3)),
        color: MATH_COLORS.inSphereShell,
      },
      {
        label: "棱切球半径 r_棱",
        symbol: "r_{\\text{棱}}",
        value: Number(res.edgeRadius.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "外接球半径 R",
        symbol: "R_{\\text{外}}",
        value: Number(res.circumRadius.toFixed(3)),
        color: MATH_COLORS.sphereShell,
      },
      {
        label: "三球半径连比",
        symbol: "r : r_{\\text{棱}} : R",
        value: "1 : 1.732 : 3",
        color: MATH_COLORS.primary,
      },
    );

    theorems.push({
      name: "正四面体三球同心黄金比例定理",
      latex: `r_{\\text{内}} = \\frac{\\sqrt{6}}{12}a, \\quad r_{\\text{棱}} = \\frac{\\sqrt{2}}{4}a, \\quad R_{\\text{外}} = \\frac{\\sqrt{6}}{4}a`,
      level: "core",
      note: "内切球（切4个面重心）、棱切球（切6条棱中点）、外接球（过4个顶点）三球球心完全重合于中心 O",
    });

    gaokaoPoints.push({
      text: "【正四面体三球速记口诀】“内切比棱切比外接，一比根三比上三”。外接球半径是内切球半径的 3 倍，棱切球切于 6 条棱的中点。",
      importance: "gaokao",
    });
  } else if (modelType === "truncatedCone") {
    const r1 = params.r1 ?? 1.5;
    const r2 = params.r2 ?? 3;
    const h = params.h ?? 4.24;
    const res = calculateTruncatedConeSphere(r1, r2, h);

    quantities.push(
      {
        label: "上底半径 r₁",
        symbol: "r_1",
        value: Number(r1.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "下底半径 r₂",
        symbol: "r_2",
        value: Number(r2.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "圆台高度 h",
        symbol: "h",
        value: Number(h.toFixed(2)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "母线长 l",
        symbol: "l",
        value: Number(res.slantHeight.toFixed(3)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.circumRadius.toFixed(3)),
        color: MATH_COLORS.sphereShell,
      },
    );

    if (res.hasInSphere) {
      quantities.push({
        label: "内切球半径 r",
        symbol: "r_{\\text{内}}",
        value: Number(res.inRadius.toFixed(3)),
        color: MATH_COLORS.inSphereShell,
      });
    }

    theorems.push(
      {
        name: "圆台外接球轴截面解析式",
        latex: `R = \\sqrt{r_2^2 + d^2}, \\quad d = \\frac{h^2 + r_1^2 - r_2^2}{2h}`,
        level: "core",
        note: "d 为外接球球心到下底面的有向距离（d < 0 表示球心在圆台下方外部）",
      },
      {
        name: "圆台内切球充要条件",
        latex: `l = r_1 + r_2 \\iff h = 2\\sqrt{r_1 r_2}`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【圆台切接球降维通法】旋转体的切接球问题一律通过“轴截面”转化为平面等腰梯形的外接圆与内切圆问题。注意内切球存在的充要临界条件为 h = 2√(r₁r₂)。",
      importance: "gaokao",
    });

    if (res.hasInSphere) {
      warnings.push({
        text: `当前高度 h ≈ 2√(r₁r₂)，严格满足等腰梯形内切圆充要条件，内切球完美呈现！`,
        level: "info",
      });
    }
  } else if (modelType === "extrema") {
    const R = params.R ?? 3;
    const shapeType = params.shapeType ?? 0;
    const h = params.h ?? (shapeType === 0 ? 3.46 : 4);
    const res = calculateSphereExtrema(R, shapeType, h);

    quantities.push(
      {
        label: "外接球固定半径 R",
        symbol: "R",
        value: Number(R.toFixed(2)),
        color: MATH_COLORS.accent,
      },
      {
        label: "内接体高度 h",
        symbol: "h",
        value: Number(h.toFixed(2)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "内接底面半径 r",
        symbol: "r",
        value: Number(res.r.toFixed(3)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "当前内接体体积 V",
        symbol: "V_{\\text{内接}}",
        value: Number(res.volume.toFixed(2)),
        color: MATH_COLORS.primary,
      },
      {
        label: "体积充填率 η = V/V_球",
        symbol: "\\eta",
        value: `${(res.volumeRatio * 100).toFixed(1)}%`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "理论最大体积 V_max",
        symbol: "V_{\\max}",
        value: Number(res.maxVolume.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push({
      name:
        shapeType === 0
          ? "球内接圆柱最大体积极值定理"
          : "球内接圆锥最大体积极值定理",
      latex:
        shapeType === 0
          ? `h_{\\text{opt}} = \\frac{2\\sqrt{3}}{3}R, \\quad V_{\\max} = \\frac{4\\sqrt{3}}{9}\\pi R^3, \\quad \\eta_{\\max} = \\frac{1}{\\sqrt{3}} \\approx 57.7\\%`
          : `h_{\\text{opt}} = \\frac{4}{3}R, \\quad V_{\\max} = \\frac{32}{81}\\pi R^3, \\quad \\eta_{\\max} = \\frac{8}{27} \\approx 29.6\\%`,
      level: "core",
      note: "通过导数 V'(h) = 0 求驻点，严格证明立体几何体积极值",
    });

    gaokaoPoints.push({
      text: "【立几与导数交汇大题】球内接柱体与锥体的体积极值是高考微积分实际应用常考模型。圆柱最大体积对应高 h = 2√3/3 R；圆锥最大体积对应高 h = 4/3 R。",
      importance: "gaokao",
    });

    if (Math.abs(res.h - res.optimalH) < 0.1) {
      warnings.push({
        text: `当前高度 h 正处于理论极值点 (h ≈ ${res.optimalH.toFixed(2)})，内接体体积达到全局最大值 V_max = ${res.maxVolume.toFixed(2)}！`,
        level: "info",
      });
    }
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
