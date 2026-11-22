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
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor: string | undefined = undefined;

  if (modelType === "perpPlanes") {
    const r1 = params.r1 ?? 3;
    const r2 = params.r2 ?? 3.5;
    const c = params.c ?? 3;
    const res = calculatePerpPlanesSphere(r1, r2, c);
    const OH = res.centerDistance;
    const R2 = res.radius * res.radius;

    quantities.push(
      {
        label: "底面外心距 d₁ (OO₂)",
        symbol: "d_1",
        value: Number(res.d1.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "侧面外心距 d₂ (OO₁)",
        symbol: "d_2",
        value: Number(res.d2.toFixed(2)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "球心交线距 OH",
        symbol: "|OH|",
        value: Number(OH.toFixed(2)),
        color: MATH_COLORS.accent,
      },
      {
        label: "半径平方 R² (勾股差)",
        symbol: "R^2",
        value: Number(R2.toFixed(2)),
        color: MATH_COLORS.sphereShell,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(3)),
        color: MATH_COLORS.sphereShell,
      },
      {
        label: "表面积精确解 S",
        symbol: "S_{\\text{球}}",
        value: `${(4 * R2).toFixed(1)}\\pi`,
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

    examAnchor = "新高考立体几何解答题大招母题";
    reasoningSteps.push(
      {
        step: 1,
        title: "空间垂线构造双外心空间矩形",
        detail:
          "过底面外心 O₁ 作底面垂线，过侧面外心 O₂ 作侧面垂线。由两面互相垂直，两垂线在空间必相交于外接球球心 O，构成空间矩形 H-O₁-O-O₂。",
        latex: `O O_1 \\perp \\text{底面}, \\quad O O_2 \\perp \\text{侧面} \\implies |O O_1| = d_2, \\quad |O O_2| = d_1`,
        rubric: "【高考采分点】需写明两垂线共面且垂直于交线得空间矩形 (+2分)",
      },
      {
        step: 2,
        title: "勾股定理代入已知求弦心距",
        detail: `代入当前参数 r₁ = ${res.r1.toFixed(1)}, r₂ = ${res.r2.toFixed(1)}, c = ${res.c.toFixed(2)} (交线半长 c/2 = ${res.halfC.toFixed(2)})，分别在两截面圆中解直角三角形求弦心距：`,
        latex: `d_1 = \\sqrt{r_1^2 - (c/2)^2} = \\sqrt{${res.r1.toFixed(1)}^2 - ${res.halfC.toFixed(2)}^2} \\approx ${res.d1.toFixed(2)}, \\quad d_2 = \\sqrt{r_2^2 - (c/2)^2} \\approx ${res.d2.toFixed(2)}`,
        rubric: "【高考采分点】正确利用截面圆弦心距勾股定理 (+2分)",
      },
      {
        step: 3,
        title: "勾股差定理求解外接球半径与面积",
        detail:
          "外接球球心 O 到任意顶点的距离即为半径 R。利用空间矩形对角线与勾股差公式直接解出：",
        latex: `R^2 = d_1^2 + d_2^2 + \\left(\\frac{c}{2}\\right)^2 = r_1^2 + r_2^2 - \\left(\\frac{c}{2}\\right)^2 = ${res.r1.toFixed(1)}^2 + ${res.r2.toFixed(1)}^2 - ${res.halfC.toFixed(2)}^2 = ${R2.toFixed(2)} \\implies R \\approx ${res.radius.toFixed(3)}`,
        rubric: "【高考采分点】正确写出外接球半径方程并求解 (+2分)",
      },
    );

    gaokaoPoints.push({
      text: "【面面垂直外接球秒杀口诀】“一求两面外接圆半径 r₁, r₂，二求公共交线长 c，三代勾股差公式 R² = r₁² + r₂² - (c/2)²”。此模型是高考立体几何大题高频母题！",
      importance: "gaokao",
    });

    if (res.isClamped) {
      warnings.push({
        text: `当前输入交线长 c = ${c} 超过两外接圆容许上限，已被几何约束收敛为安全值 ${res.c.toFixed(2)}，以保证截面圆弦心距有效。`,
        level: "warning",
      });
    }
  } else if (modelType === "concentric") {
    const a = params.a ?? 4;
    const res = calculateConcentricSpheres(a);
    examAnchor = "高考客观题压轴秒杀模型";

    quantities.push(
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
        label: "外内比定值 R/r",
        symbol: "R : r",
        value: "3 : 1",
        color: MATH_COLORS.accent,
        isInvariant: true,
        invariantNote: "正四面体外接球与内切球半径之比恒为 3:1",
      },
      {
        label: "三球连比定值",
        symbol: "r : r_{\\text{棱}} : R",
        value: "1 : \\sqrt{3} : 3",
        color: MATH_COLORS.primary,
        isInvariant: true,
        invariantNote: "正四面体三球同心黄金比例，无论棱长 a 为何值恒成立",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "空间对称中心三球同心判定",
        detail:
          "正四面体具备高度空间对称性，各面重心、各棱中垂线与顶点高线完全交于一点，即为三球公共球心 O。",
        latex: `O_{\\text{内}} = O_{\\text{棱}} = O_{\\text{外}} = O`,
        rubric: "【高考采分点】判定正四面体空间对称中心为公共球心 (+4分)",
      },
      {
        step: 2,
        title: "代入棱长 a 计算三球特征半径与固定倍数",
        detail: `代入当前棱长 a = ${a}，直接套用黄金比例解析式求得三球半径。外接球半径是内切球半径的 3 倍，棱切球切于 6 条棱的中点：`,
        latex: `r_{\\text{内}} = \\frac{\\sqrt{6}}{12}a \\approx ${res.inRadius.toFixed(3)}, \\quad r_{\\text{棱}} = \\frac{\\sqrt{2}}{4}a \\approx ${res.edgeRadius.toFixed(3)}, \\quad R_{\\text{外}} = \\frac{\\sqrt{6}}{4}a \\approx ${res.circumRadius.toFixed(3)} \\implies \\frac{R_{\\text{外}}}{r_{\\text{内}}} = 3`,
        rubric:
          "【高考采分点】准确计算三球特征半径数值并说明内外球固定倍数 (+5分)",
      },
    );

    theorems.push({
      name: "正四面体三球同心黄金比例定理",
      latex: `r_{\\text{内}} = \\frac{\\sqrt{6}}{12}a, \\quad r_{\\text{棱}} = \\frac{\\sqrt{2}}{4}a, \\quad R_{\\text{外}} = \\frac{\\sqrt{6}}{4}a`,
      level: "core",
      note: "内切球（切4个面重心）、棱切球（切6条棱中点）、外接球（过4个顶点）三球球心完全重合于中心 O",
      // 「棱切球」（与 6 条棱均相切）在 2019 人教A版正文未列，属常用拓展模型，
      // 按项目条目级拓展标注契约显式声明，避免被超纲术语门禁误判为未声明超纲。
      isExtension: true,
      extensionBadge: "拓展 · 超出课标",
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
        label: "母线长 l",
        symbol: "l",
        value: Number(res.slantHeight.toFixed(3)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "球心偏心距 d",
        symbol: "d",
        value: Number(res.centerOffsetBottom.toFixed(2)),
        color: MATH_COLORS.accent,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.circumRadius.toFixed(3)),
        color: MATH_COLORS.sphereShell,
      },
    );

    if (res.isClamped) {
      warnings.push({
        text: `圆台几何参数已自动调整为安全边界（下底半径已约束大于上底），确保几何结构有效。`,
        level: "info",
      });
    }

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
      text: "【圆台切接球降维通法】通过圆台轴截面转化为等腰梯形切接圆问题，内切球存在充要条件为母线等于上下底半径和 $l = r_1 + r_2$，此时高 $h = 2\\sqrt{r_1 r_2}$。（本页口径：$r_1$ 为上底半径、$r_2$ 为下底半径，与「旋转体」页 $r_1$ 为下底、$r_2$ 为上底相反，套公式时注意对应）",
      importance: "gaokao",
    });

    if (res.hasInSphere) {
      warnings.push({
        text: `当前高度 h ≈ 2√(r₁r₂)，在数值容差 |h − 2√(r₁r₂)| < 0.1 内可视为满足等腰梯形内切圆充要条件（该判据为近似判定，非严格相等），内切球按此呈现。`,
        level: "info",
      });
    }

    const r1Str = formatMathNumber(res.r1);
    const r2Str = formatMathNumber(res.r2);
    const hStr = formatMathNumber(res.height);
    const dStr = formatMathNumber(res.centerOffsetBottom, 3);
    const rCircStr = formatMathNumber(res.circumRadius, 3);
    const idealHStr = formatMathNumber(res.idealHForInSphere, 3);

    reasoningSteps.push(
      {
        step: 1,
        title: "轴截面降维并设外接球心距下底距离 $d$",
        detail:
          "沿圆台对称轴作轴截面得等腰梯形，设外接球心 $O$ 到下底面圆心的有向高度差为 $d$，由上下底圆周到球心距离相等列勾股方程：",
        latex: `R^2 = r_2^2 + d^2 = r_1^2 + (h - d)^2`,
        rubric: "【高考采分点】正确利用轴截面勾股关系列出等式 (+4分)",
      },
      {
        step: 2,
        title: "代数消去 $d^2$ 求解偏心距 $d$ 与外接球半径 $R$",
        detail: "展开平方项消去 $d^2$ 后解出 $d$，再代回勾股式求得 $R$：",
        latex: `\\begin{aligned} d &= \\frac{h^2 + r_1^2 - r_2^2}{2h} = \\frac{${hStr}^2 + ${r1Str}^2 - ${r2Str}^2}{2\\times ${hStr}} = ${dStr} \\\\[1ex] R &= \\sqrt{r_2^2 + d^2} = \\sqrt{${r2Str}^2 + (${dStr})^2} = ${rCircStr} \\end{aligned}`,
        rubric: "【高考采分点】精准求解球心距与外接球半径 (+4分)",
      },
      {
        step: 3,
        title: "检验轴截面等腰梯形内切圆充要条件",
        detail:
          "当轴截面腰长等于上下底半径和（即母线长 $l = r_1 + r_2$，等价于高 $h = 2\\sqrt{r_1 r_2}$）时存在内切球：",
        latex: `h_{\\text{理想}} = 2\\sqrt{r_1 r_2} = 2\\sqrt{${r1Str}\\times ${r2Str}} = ${idealHStr}, \\quad \\text{当前 } h = ${hStr}`,
        rubric: "【高考采分点】判定内切球存在性并给出内切半径 (+4分)",
      },
    );
  } else if (modelType === "extrema") {
    const R = params.R ?? 3;
    const shapeType = params.shapeType ?? 0;
    const h = params.h ?? (shapeType === 0 ? 3.46 : 4);
    const res = calculateSphereExtrema(R, shapeType, h);

    quantities.push(
      {
        label: "内接底面半径 r",
        symbol: "r",
        value: Number(res.r.toFixed(3)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "当前内接体积 V",
        symbol: "V_{\\text{内接}}",
        value: Number(res.volume.toFixed(2)),
        color: MATH_COLORS.primary,
      },
      {
        label: "理论最大体积 $V_{\\max}$",
        symbol: "V_{\\max}",
        value: Number(res.maxVolume.toFixed(2)),
        color: MATH_COLORS.accent,
      },
      {
        label: "极值高 $h_{\\text{opt}}$",
        symbol: "h_{\\text{opt}}",
        value: Number(res.optimalH.toFixed(2)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "体积充填率 η",
        symbol: "\\eta",
        value: `${(res.volumeRatio * 100).toFixed(1)}%`,
        color: MATH_COLORS.paramSecondary,
      },
    );

    theorems.push({
      name:
        shapeType === 0
          ? "球内接圆柱最大体积极值定理"
          : "球内接圆锥最大体积极值定理",
      latex:
        shapeType === 0
          ? "h_{\\text{opt}} = \\frac{2\\sqrt{3}}{3}R, \\quad V_{\\max} = \\frac{4\\sqrt{3}}{9}\\pi R^3, \\quad \\eta_{\\max} = \\frac{\\sqrt{3}}{3}"
          : "h_{\\text{opt}} = \\frac{4}{3}R, \\quad V_{\\max} = \\frac{32}{81}\\pi R^3, \\quad \\eta_{\\max} = \\frac{8}{27}",
      level: "core",
      note:
        shapeType === 0
          ? "通过导数 V'(h) = 0 求极值点，严格证明立体几何体积极值（圆柱最大体积容积率约为 57.7%）"
          : "通过导数 V'(h) = 0 求极值点，严格证明立体几何体积极值（圆锥最大体积容积率约为 29.6%）",
    });

    gaokaoPoints.push({
      text: "【立几与导数交汇大题】球内接柱体与锥体的体积极值是立体几何与导数交汇的常考模型。圆柱最大体积对应高 h = 2√3/3 R；圆锥最大体积对应高 h = 4/3 R。",
      importance: "gaokao",
    });

    if (Math.abs(res.h - res.optimalH) < 0.1) {
      warnings.push({
        text: `当前高度 h 正处于理论极值点 (h ≈ ${res.optimalH.toFixed(2)})，内接体体积达到全局最大值 V_max = ${res.maxVolume.toFixed(2)}！`,
        level: "info",
      });
    }

    const rCapStr = formatMathNumber(res.R);
    const hValStr = formatMathNumber(res.h);
    const rBaseStr = formatMathNumber(res.r, 3);
    const volStr = formatMathNumber(res.volume, 3);
    const optHStr = formatMathNumber(res.optimalH, 3);
    const maxVolStr = formatMathNumber(res.maxVolume, 3);

    reasoningSteps.push(
      {
        step: 1,
        title: "利用球轴截面勾股关系将底半径 $r$ 化为高 $h$ 的函数",
        detail:
          shapeType === 0
            ? "由内接圆柱轴截面勾股定理 $r^2 + (h/2)^2 = R^2$，得底面半径平方表达式："
            : "在球内接圆锥轴截面内，利用垂径勾股或射影关系得 $r^2 = h(2R - h)$：",
        latex:
          shapeType === 0
            ? `r^2 = R^2 - \\frac{h^2}{4} = ${rCapStr}^2 - \\frac{${hValStr}^2}{4} = (${rBaseStr})^2`
            : `r^2 = h(2R - h) = ${hValStr}(2\\times ${rCapStr} - ${hValStr}) = (${rBaseStr})^2`,
        rubric: "【高考采分点】建立单变量半径关系消除多余未知数 (+4分)",
      },
      {
        step: 2,
        title: "构建体积单变量函数 $V(h)$ 并计算当前体积",
        detail:
          shapeType === 0
            ? "代入圆柱体积公式 $V(h) = \\pi r^2 h$ 建立关于高 $h \\in (0, 2R)$ 的三次函数："
            : "代入圆锥体积公式 $V(h) = \\frac{1}{3}\\pi r^2 h$ 建立关于高 $h \\in (0, 2R)$ 的三次函数：",
        latex:
          shapeType === 0
            ? `V(h) = \\pi\\left(R^2 h - \\frac{h^3}{4}\\right), \\quad V(${hValStr}) = ${volStr}`
            : `V(h) = \\frac{\\pi}{3}(2R h^2 - h^3), \\quad V(${hValStr}) = ${volStr}`,
        rubric: "【高考采分点】正确列出三次体积函数表达式 (+4分)",
      },
      {
        step: 3,
        title: "求导 $V'(h) = 0$ 解出全局极大值点与最大体积",
        detail: "令一阶导数为零判断单调区间，求得理论极值高与最大容积：",
        latex:
          shapeType === 0
            ? `V'(h) = \\pi\\left(R^2 - \\frac{3}{4}h^2\\right) = 0 \\implies h_{\\text{opt}} = \\frac{2\\sqrt{3}}{3}R = ${optHStr}, \\; V_{\\max} = ${maxVolStr}`
            : `V'(h) = \\frac{\\pi}{3}(4Rh - 3h^2) = 0 \\implies h_{\\text{opt}} = \\frac{4}{3}R = ${optHStr}, \\; V_{\\max} = ${maxVolStr}`,
        rubric: "【高考采分点】导数求极值确定最优高与最大体积 (+4分)",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
  };
}
