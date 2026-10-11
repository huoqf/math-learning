import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calculatePrismFeatures,
  calculateRegularPyramidFeatures,
  calculateFrustumDerivation,
  calculateEqualVolumeMethod,
} from "@/math3d/polyhedronFeatures";

export function buildPolyhedronFeaturesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "prism"; // "prism" | "pyramid" | "frustum" | "equalVolume"

  const a = params.a ?? 3;
  const b = params.b ?? 4;
  const h = params.h ?? 4;
  const a1 = params.a1 ?? 2;
  const a2 = params.a2 ?? 4;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];

  if (mode === "prism") {
    const res = calculatePrismFeatures(4, a, h);

    quantities.push(
      {
        label: "底面边长 $a$",
        symbol: "a",
        value: res.a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "棱柱高 $h$",
        symbol: "h",
        value: res.h.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "底面面积 $S_{\\text{底}}$",
        symbol: "S_{\\text{底}}",
        value: res.baseArea.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面面积 $S_{\\text{侧}}$",
        symbol: "S_{\\text{侧}}",
        value: res.lateralArea.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "全面积 $S_{\\text{全}}$",
        symbol: "S_{\\text{全}}",
        value: res.totalArea.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "柱体体积 $V$",
        symbol: "V",
        value: res.volume.toFixed(2),
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "棱柱的结构特征与性质",
        latex: `\\begin{cases} \\text{两个底面是全等的多边形且互相平行} \\\\ \\text{侧棱互相平行且长度相等: } l = h \\\\ S_{\\text{侧}} = c_{\\text{底}} \\cdot h, \\quad V = S_{\\text{底}} \\cdot h \\end{cases}`,
        level: "core",
        condition:
          "有两个面互相平行，其余各面都是四边形，并且每相邻两个四边形的公共边都互相平行",
      },
      {
        name: "直棱柱与正棱柱定义",
        latex: `\\text{直棱柱: } \\text{侧棱 } \\perp \\text{ 底面}; \\quad \\text{正棱柱: } \\text{直棱柱且底面为正多边形}`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【柱体表面积与体积】直棱柱的侧面展开图是一个矩形，矩形的一边长等于底面周长 $c$，另一边长等于棱柱的高 $h$。全面积公式：$S_{全} = 2S_{底} + c \\cdot h$。",
      importance: "gaokao",
    });
  } else if (mode === "pyramid") {
    const res = calculateRegularPyramidFeatures(a, h);

    quantities.push(
      {
        label: "底面边长 $a$",
        symbol: "a",
        value: res.a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "棱锥高 $h (PO)$",
        symbol: "h",
        value: res.h.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "侧面斜高 $h' (PE)$",
        symbol: "h'",
        value: res.slantHeight.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "侧棱长 $l (PA)$",
        symbol: "l",
        value: res.sideEdgeLength.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "侧棱与底面所成角",
        symbol: "\\theta",
        value: `${res.edgeBottomAngleDeg.toFixed(1)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "侧面与底面二面角",
        symbol: "\\alpha",
        value: `${res.dihedralDeg.toFixed(1)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "锥体体积 $V$",
        symbol: "V",
        value: res.volume.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "正棱锥结构特征与核心直角三角形",
        latex: `\\begin{cases} \\text{Rt}\\triangle POE: & h^2 + r^2 = (h')^2 \\quad (r = \\text{内切半径, } h' = \\text{斜高}) \\\\[1ex] \\text{Rt}\\triangle POA: & h^2 + R^2 = l^2 \\quad (R = \\text{外接半径, } l = \\text{侧棱长}) \\end{cases}`,
        level: "core",
        condition: "底面是正多边形，并且顶点在底面的正投影是底面的中心",
      },
      {
        name: "正棱锥侧面积与体积公式",
        latex: `S_{\\text{侧}} = \\frac{1}{2} c_{\\text{底}} h', \\quad V = \\frac{1}{3} S_{\\text{底}} h`,
        level: "core",
        condition: "斜高 $h'$ 是侧面等腰三角形底边上的高",
      },
    );

    gaokaoPoints.push({
      text: "【高考解题秒杀工具 · 两个特征直角三角形】解决正棱锥问题必找两个核心直角三角形：① 由高、斜高和底面边心距构成的直角三角形（解二面角与侧面积）；② 由高、侧棱和底面外接圆半径构成的直角三角形（解线面角与外接球半径）。",
      importance: "gaokao",
    });
  } else if (mode === "frustum") {
    const res = calculateFrustumDerivation(a2, a1, h);

    quantities.push(
      {
        label: "上底边长 $a_1$ (面积 $S_1$)",
        symbol: "a_1, S_1",
        value: `${res.a1.toFixed(2)}, ${res.S1.toFixed(2)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "下底边长 $a_2$ (面积 $S_2$)",
        symbol: "a_2, S_2",
        value: `${res.a2.toFixed(2)}, ${res.S2.toFixed(2)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "棱台高 $h$",
        symbol: "h",
        value: res.h.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "上下底面相似比 $k$",
        symbol: "k = a_1/a_2",
        value: res.k.toFixed(3),
        color: MATH_COLORS.highlight,
      },
      {
        label: "补全大棱锥总高 $H$",
        symbol: "H",
        value: res.bigHeight.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "大棱锥体积 $V_{\\text{大}}$",
        symbol: "V_{\\text{大}}",
        value: res.bigVolume.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "切除小棱锥体积 $V_{\\text{小}}$",
        symbol: "V_{\\text{小}}",
        value: res.smallVolume.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "棱台体积 $V = V_{\\text{大}} - V_{\\text{小}}$",
        symbol: "V_{\\text{台}}",
        value: res.frustumVolume.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "台体体积通用公式推导（大锥减小锥）",
        latex: `V = V_{\\text{大}} - V_{\\text{小}} = \\frac{1}{3} S_2 H - \\frac{1}{3} S_1 (H - h) = \\frac{1}{3} h (S_1 + \\sqrt{S_1 S_2} + S_2)`,
        level: "core",
        condition:
          "用平行于棱锥底面的平面去截棱锥，底面和截面之间的部分叫做棱台",
      },
      {
        name: "台体体积与柱锥统一性",
        latex: `\\begin{cases} S_1 = S_2 \\implies V = \\frac{1}{3}h(3S) = Sh \\quad (\\text{退化为柱体}) \\\\ S_1 = 0 \\implies V = \\frac{1}{3}h(S_2) = \\frac{1}{3}Sh \\quad (\\text{退化为锥体}) \\end{cases}`,
        level: "important",
        condition: "台体体积公式是柱体与锥体体积的统一推广",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "利用相似截割建立高的比例关系",
        detail:
          "设原大棱锥高为 $H$，则切除的小棱锥高为 $H - h$。由截面与底面相似比，高之比等于边长相似比：",
        latex: `\\frac{H - h}{H} = \\frac{a_1}{a_2} = k \\implies H = \\frac{h}{1 - k}, \\quad H - h = \\frac{k h}{1 - k}`,
      },
      {
        step: 2,
        title: "大锥体积减小锥体积展开化简",
        detail: "将 $S_1 = k^2 S_2$ 代入体积差式中提取因式：",
        latex: `V = \\frac{1}{3} \\left( S_2 H - S_1(H - h) \\right) = \\frac{1}{3} h S_2 \\frac{1 - k^3}{1 - k} = \\frac{1}{3} h S_2 (1 + k + k^2)`,
      },
      {
        step: 3,
        title: "还原几何面积得出通用台体公式",
        detail:
          "因 $k S_2 = \\sqrt{S_1 S_2}$ 且 $k^2 S_2 = S_1$，代回即得标准公式：",
        latex: `V = \\frac{1}{3} h (S_1 + \\sqrt{S_1 S_2} + S_2)`,
      },
    );
  } else {
    // equalVolumeMethod
    const res = calculateEqualVolumeMethod(a, b, h);

    quantities.push(
      {
        label: "底面边长 $a = AB, b = AC$",
        symbol: "a, b",
        value: `${res.a.toFixed(1)}, ${res.b.toFixed(1)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "垂直侧棱 $PA = h$",
        symbol: "h",
        value: res.h.toFixed(1),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "底面 $\\triangle ABC$ 面积",
        symbol: "S_{\\triangle ABC}",
        value: res.areaABC.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面 $\\triangle PAC$ 面积",
        symbol: "S_{\\triangle PAC}",
        value: res.areaPAC.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "三棱锥体积 $V$",
        symbol: "V_{P-ABC}",
        value: res.volume.toFixed(2),
        color: MATH_COLORS.highlight,
      },
      {
        label: "点 $B$ 到侧面 $PAC$ 距离",
        symbol: "h_B = d(B, \\text{面 }PAC)",
        value: res.distBToPAC.toFixed(3),
        color: MATH_COLORS.paramTertiary,
      },
    );

    theorems.push(
      {
        name: "三棱锥等体积法（换底定理）",
        latex: `V_{P-ABC} = V_{B-PAC} \\iff \\frac{1}{3} S_{\\triangle ABC} \\cdot h_P = \\frac{1}{3} S_{\\triangle PAC} \\cdot h_B \\implies h_B = \\frac{S_{\\triangle ABC} \\cdot h_P}{S_{\\triangle PAC}}`,
        level: "core",
        condition:
          "三棱锥的四个顶点任意选一个作为顶点、其余三点构成的面作为底面，其体积恒定不变",
      },
      {
        name: "四面体分割体积比定理",
        latex: `\\frac{V_{P-A'B'C'}}{V_{P-ABC}} = \\frac{PA'}{PA} \\cdot \\frac{PB'}{PB} \\cdot \\frac{PC'}{PC}`,
        level: "important",
        condition: "棱上的分点割三棱锥时，体积比等于三侧棱截比之积",
      },
    );

    gaokaoPoints.push({
      text: "【高考解答题第一问免建系秒杀神器】求点到平面的距离时，等体积法无需建立空间坐标系求法向量：① 算出容易求高的三棱锥体积 $V$；② 算出待求平面的底面积 $S$；③ 直接由 $d = \\frac{3V}{S}$ 极速求出距离，满分采分点！",
      importance: "gaokao",
    });

    reasoningSteps.push(
      {
        step: 1,
        title: "正向计算三棱锥体积",
        detail:
          "以底面 $\\triangle ABC$ 为底、顶点为 $P$，此时高为侧棱 $PA = h$，直接算得体积：",
        latex: `V_{P-ABC} = \\frac{1}{3} S_{\\triangle ABC} \\cdot PA = \\frac{1}{3} \\cdot \\left(\\frac{1}{2} a b\\right) \\cdot h = \\frac{1}{6} a b h = ${res.volume.toFixed(2)}`,
      },
      {
        step: 2,
        title: "计算新底面面积并反解高线",
        detail:
          "转换顶点，以 $B$ 为顶点、底面为侧面 $\\triangle PAC$，由等体积公式反解点面距离：",
        latex: `h_B = \\frac{3 V_{P-ABC}}{S_{\\triangle PAC}} = \\frac{3 \\cdot ${res.volume.toFixed(2)}}{${res.areaPAC.toFixed(2)}} = ${res.distBToPAC.toFixed(2)}`,
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
  };
}
