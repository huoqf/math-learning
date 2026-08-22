import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  solveSkewLines,
  solveLinePlaneAngle,
  solveDihedralAngle,
  solvePointToPlaneDistance,
} from "@/math3d/spatialAngle";

// ── know-solid-angle: 空间角（长方体截面二面角） ──

export function buildSpatialAnglePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "skewLines";
  const preset = (config?.preset as string) ?? "free";
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  const lambda = params.lambda ?? (params.ex ? params.ex / c : 0.6);
  const zE = Math.max(0.01, Math.min(c, lambda * c));

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (mode === "skewLines") {
    const skew = solveSkewLines(a, b, c, lambda);

    quantities.push(
      {
        label: "异面直线 1 (A₁B)",
        symbol: "\\vec{u}",
        value: `(${a}, 0, -${c})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "异面直线 2 (AC)",
        symbol: "\\vec{v}",
        value: `(${a}, ${b}, 0)`,
        color: MATH_COLORS.accent,
      },
      {
        label: "平移平行向量 (D₁C)",
        symbol: "\\vec{u}'",
        value: `(${a}, 0, -${c})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "公垂线向量 n_公",
        symbol: "\\vec{n}_{\\text{公}}",
        value: `(${(b * c).toFixed(1)}, ${(-a * c).toFixed(1)}, ${(a * b).toFixed(1)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "异面直线间距离",
        symbol: "d_{\\text{异面}}",
        value: Number(skew.distance.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "向量夹角余弦 cosθ",
        symbol: "\\cos\\theta",
        value: Number(skew.cosTheta.toFixed(4)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "异面直线所成的角",
        symbol: "\\theta",
        value: `${skew.angleDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
    );

    if (preset === "cube") {
      theorems.push({
        name: "正方体 60° 秒杀模型",
        latex: `\\text{正方体中 } AC = CD_1 = AD_1 = \\sqrt{2}a \\implies \\triangle ACD_1 \\text{ 为正三角形} \\implies \\theta = 60^\\circ`,
        level: "core",
        note: "在高考选择填空题中，正方体面对角线异面角可直接秒杀 60°，无需建系计算",
      });
    }

    theorems.push(
      {
        name: "异面直线所成角坐标公式",
        latex: `\\cos \\theta = \\frac{|\\vec{u} \\cdot \\vec{v}|}{|\\vec{u}||\\vec{v}|} = \\frac{|x_1 x_2 + y_1 y_2 + z_1 z_2|}{\\sqrt{x_1^2+y_1^2+z_1^2}\\sqrt{x_2^2+y_2^2+z_2^2}} = \\frac{a^2}{\\sqrt{a^2+c^2}\\sqrt{a^2+b^2}}`,
        level: "core",
        condition:
          "\\theta \\in (0^\\circ, 90^\\circ]，异面直线所成角必须取锐角或直角，公式中必须加绝对值",
      },
      {
        name: "平移法与向量法等价原理",
        latex: `D_1C \\parallel A_1B \\implies \\text{异面直线 } A_1B, AC \\text{ 所成的角等于相交角 } \\angle ACD_1`,
        level: "important",
        note: "在 △ACD1 中，利用余弦定理求 ∠ACD1 与向量法结果完全一致",
      },
      {
        name: "异面直线间的距离（向量射影法）",
        latex: `d_{\\text{异面}} = \\frac{|\\vec{A_1A} \\cdot \\vec{n}_{\\text{公}}|}{|\\vec{n}_{\\text{公}}|}, \\quad \\vec{n}_{\\text{公}} = \\vec{u} \\times \\vec{v} = (bc, -ac, ab)`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考满分规范三步法：① 建立空间直角坐标系 A-xyz；② 确定两条直线的方向向量 u, v 坐标；③ 代入余弦绝对值公式，切记结果必须在 (0°, 90°] 内。",
        importance: "gaokao",
      },
      {
        text: "平移法与向量法对照：在侧面 CDD₁C₁ 中作 D₁C // A₁B，异面角即化为平面相交角 ∠ACD₁，实现几何直观与向量代数的双向验算。",
        importance: "gaokao",
      },
    );
  } else if (mode === "linePlane") {
    const lp = solveLinePlaneAngle(a, b, c, lambda);

    quantities.push(
      {
        label: "斜线起点 C",
        symbol: "C",
        value: `(${a}, ${b}, 0)`,
        color: MATH_COLORS.primary,
      },
      {
        label: "动点 E (AA₁上)",
        symbol: "E",
        value: `(0, 0, ${zE.toFixed(2)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "空间斜线向量 u (CE)",
        symbol: "\\vec{u}",
        value: `(-${a}, -${b}, ${zE.toFixed(2)})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "底面射影向量 (CA)",
        symbol: "\\vec{CA}",
        value: `(-${a}, -${b}, 0)`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "底面法向量 n_0",
        symbol: "\\vec{n_0}",
        value: "(0, 0, 1)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "线面角正弦 sinθ",
        symbol: "\\sin\\theta",
        value: Number(lp.sinTheta.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "线面角余弦 cosθ",
        symbol: "\\cos\\theta",
        value: Number(lp.cosTheta.toFixed(4)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "直线与底面所成的角",
        symbol: "\\theta",
        value: `${lp.angleDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
    );

    if (preset === "bodyDiag") {
      theorems.push({
        name: "正方体体对角线线面角模型",
        latex: `\\text{正方体体对角线与底面角 } \\tan\\theta = \\frac{a}{\\sqrt{2}a} = \\frac{1}{\\sqrt{2}} \\implies \\sin\\theta = \\frac{\\sqrt{3}}{3} \\approx 0.5774 \\; (\\theta \\approx 35.26^\\circ)`,
        level: "core",
        note: "高考极高频母题：正方体体对角线与三个坐标面所成角均相等，且满足 sin²α + sin²β + sin²γ = 1",
      });
    }

    theorems.push(
      {
        name: "直线与平面所成角坐标公式",
        latex: `\\sin \\theta = |\\cos \\langle \\vec{u}, \\vec{n} \\rangle| = \\frac{|\\vec{u} \\cdot \\vec{n}|}{|\\vec{u}||\\vec{n}|} = \\frac{z_E}{\\sqrt{a^2+b^2+z_E^2}}`,
        level: "core",
        condition:
          "\\theta \\in [0^\\circ, 90^\\circ]，正弦值等于方向向量与法向量夹角余弦的绝对值",
      },
      {
        name: "空间射影直角三角形定理",
        latex: `EA \\perp \\text{面 } ABCD \\implies CA \\text{ 为 } CE \\text{ 在底面上的射影}, \\; \\triangle EAC \\text{ 为直角三角形}`,
        level: "important",
        note: "在直角三角形 △EAC 中，sinθ = EA / EC = z_E / √(a² + b² + z_E²)",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考黄金考点：线面角公式求出的是正弦值 sinθ，而非余弦值 cosθ！若题干要求求余弦值，须用 cosθ = √(1 - sin²θ) 换算。",
        importance: "gaokao",
      },
      {
        text: "空间几何直观：斜线 EC、垂线 EA、射影 CA 构成倾斜直角三角形 △EAC，线面角即为 ∠ECA。",
        importance: "gaokao",
      },
    );

    if (lambda < 0.15) {
      warnings.push({
        text: "动点 E 接近原点 A (λ → 0)，斜线 EC 接近落入底面，线面角趋近于 0°！",
        level: "warning",
      });
    }
  } else if (mode === "distance") {
    const distRes = solvePointToPlaneDistance(a, b, c, lambda);

    quantities.push(
      {
        label: "截面法向量 n",
        symbol: "\\vec{n}",
        value: `(${(b * zE).toFixed(1)}, ${(a * zE).toFixed(1)}, ${(a * b).toFixed(1)})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "截面三角形面积 S_BDE",
        symbol: "S_{\\Delta BDE}",
        value: Number(distRes.areaBDE.toFixed(3)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "底面三角形面积 S_ABD",
        symbol: "S_{\\Delta ABD}",
        value: Number(distRes.areaABD.toFixed(3)),
        color: MATH_COLORS.primary,
      },
      {
        label: "点 A 到截面 BDE 的距离 d",
        symbol: "d_{A-\\text{面}}",
        value: Number(distRes.distance.toFixed(4)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "三棱锥 E-ABD 当前体积",
        symbol: "V_{E-ABD}",
        value: Number(distRes.volume.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "三棱锥体积最大极值",
        symbol: "V_{\\max}",
        value: Number(distRes.maxVolume.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    if (preset === "cubeThird") {
      theorems.push({
        name: "正方体点面距三分体对角线模型",
        latex: `\\text{正方体顶点 } A \\text{ 到截面 } A_1BD \\text{ 的距离 } d = \\frac{\\sqrt{3}}{3}a = \\frac{1}{3}|AC_1|`,
        level: "core",
        note: "在正方体中，体对角线 AC₁ 垂直于截面 A₁BD 且被其三等分，点面距恒为 (√3/3)a",
      });
    }

    theorems.push(
      {
        name: "向量射影法求点到平面的距离公式",
        latex: `d = \\frac{|\\vec{AP} \\cdot \\vec{n}|}{|\\vec{n}|}`,
        level: "core",
        note: "P 为平面内任意已知点（如 B 点），A 为待求点，n 为平面的法向量",
      },
      {
        name: "等体积法（等积法）互验公式",
        latex: `V_{E-ABD} = \\frac{1}{3} S_{\\Delta BDE} \\cdot d = \\frac{1}{3} S_{\\Delta ABD} \\cdot z_E \\implies d = \\frac{S_{\\Delta ABD} \\cdot z_E}{S_{\\Delta BDE}}`,
        level: "important",
        note: "当法向量求解复杂时，利用等体积法反解高线距离，是高考极高频的满分简捷法",
      },
      {
        name: "动点体积极值定理",
        latex: `V(\\lambda) = \\frac{1}{6} a b (\\lambda c) \\le \\frac{1}{6} a b c = V_{\\max}`,
        level: "important",
        condition: "当 λ = 1.0 (即动点 E 到达侧棱顶端 A₁) 时取最大体积",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考大题二选一解法：① 向量法：设法向量代公式 d = |AB · n| / |n|；② 几何法：转换顶点利用等体积法 V_{A-BDE} = V_{E-ABD} 反求垂线高 d。",
        importance: "gaokao",
      },
      {
        text: "体积极值考点：由于底面 △ABD 面积恒定 (1/2 ab)，棱锥体积随分点比例 λ 线性递增，极值点在棱端点 A₁ 处取得。",
        importance: "gaokao",
      },
    );

    if (Math.abs(lambda - 1.0) < 0.05) {
      warnings.push({
        text: `动点 E 已到达侧棱顶端 A₁ (λ = 1.0)，三棱锥 E-ABD 体积达到最大极值 V_max = ${distRes.maxVolume.toFixed(2)}！`,
        level: "warning",
      });
    } else if (lambda < 0.15) {
      warnings.push({
        text: "动点 E 接近底面 (λ → 0)，三棱锥趋于扁平退化，点 A 到截面的距离 d 趋近于 0！",
        level: "warning",
      });
    }
  } else {
    // dihedral
    const dih = solveDihedralAngle(a, b, c, lambda);

    quantities.push(
      {
        label: "底面法向量 n_1",
        symbol: "\\vec{n_1}",
        value: "(0, 0, 1)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "截面法向量 n_2",
        symbol: "\\vec{n_2}",
        value: `(${dih.n2Raw.x.toFixed(1)}, ${dih.n2Raw.y.toFixed(1)}, ${dih.n2Raw.z.toFixed(1)})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "二面角平面角余弦 cosθ",
        symbol: "\\cos\\theta",
        value: Number(dih.cosTheta.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "二面角 B-DE-A 大小",
        symbol: "\\theta",
        value: `${dih.dihedralDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "三垂线定理垂足 M",
        symbol: "M",
        value: `(${dih.edgeFootM.x.toFixed(2)}, ${dih.edgeFootM.y.toFixed(2)}, 0)`,
        color: MATH_COLORS.paramTertiary,
      },
    );

    if (preset === "cubeSection") {
      theorems.push({
        name: "正方体截面二面角基角模型",
        latex: `\\text{正方体截面 } A_1BD \\text{ 与底面二面角 } \\cos\\theta = \\frac{\\sqrt{3}}{3} \\approx 0.5774 \\; (\\theta \\approx 54.74^\\circ)`,
        level: "core",
        note: "在正方体中，tanθ = AA₁ / AM = a / (√2/2 a) = √2，由此推得 cosθ = 1/√(1 + tan²θ) = √3/3",
      });
    }

    theorems.push(
      {
        name: "二面角向量法与钝锐判断定理",
        latex: `\\cos\\langle\\vec{n_1},\\vec{n_2}\\rangle = \\frac{\\vec{n_1} \\cdot \\vec{n_2}}{|\\vec{n_1}||\\vec{n_2}|}, \\quad \\cos\\theta_{\\text{二面角}} = \\pm\\cos\\langle\\vec{n_1},\\vec{n_2}\\rangle \\;(\\text{由图判定正负})`,
        level: "core",
        condition:
          "\\theta \\in [0^\\circ, 180^\\circ]，法向量夹角与二面角相等或互补，高考大题须依据空间图形判断正负号！",
      },
      {
        name: "三垂线定理作二面角平面角（几何法）",
        latex: `AM \\perp BD \\;\\text{于}\\; M, \\; EA \\perp \\text{底面} \\implies EM \\perp BD, \\; \\angle AME \\text{ 即为二面角平面角}`,
        level: "important",
        note: "在直角三角形 △EAM 中，tan∠AME = EA / AM = z_E / AM",
      },
      {
        name: "截面法向量求解方程组（标准高考格式）",
        latex: `\\begin{cases} \\vec{n_2} \\cdot \\vec{BD} = 0 \\\\ \\vec{n_2} \\cdot \\vec{BE} = 0 \\end{cases} \\;\\Rightarrow\\; \\begin{cases} -a x + b y = 0 \\\\ -a x + z_E z = 0 \\end{cases} \\;\\xrightarrow{\\text{令 } x=b z_E}\\; \\vec{n_2} = (b z_E, a z_E, a b)`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考立体几何第(2)问满分步骤闭环：① 建立空间直角坐标系 O-xyz；② 设法向量 n=(x,y,z) 联立两方程赋非零特解；③ 代入向量点乘模长公式；④ 依据空间几何直观明确说明“由图可知该二面角为锐角/钝角”。",
        importance: "gaokao",
      },
      {
        text: "法向量进进出出判定律：若两个法向量同时指向二面角内侧（或同时指向外侧），则法向量夹角与二面角互补 (θ + <n1,n2> = 180°)；若一进一出，则相等 (θ = <n1,n2>)。",
        importance: "gaokao",
      },
    );

    if (dih.dihedralDeg < 1 || dih.dihedralDeg > 179) {
      warnings.push({
        text: "二面角接近 0° 或 180°，截面退化为共面！",
        level: "warning",
      });
    }
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
