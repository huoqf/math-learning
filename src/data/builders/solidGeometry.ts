import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  cuboidCircumRadius,
  regularPyramidCircumRadius,
  coneCircumRadius,
  sphereVolume,
  sphereSurfaceArea,
} from "@/math3d/solidGeometry";
import {
  calculateCornerModel,
  calculateCylinderModel,
  calculateComplementModel,
  calculateVerticalEdgeModel,
  calculateInSphereModel,
} from "@/math3d/polyhedronSphere";
import {
  calculatePerpPlanesSphere,
  calculateConcentricSpheres,
  calculateTruncatedConeSphere,
  calculateSphereExtrema,
} from "@/math3d/advancedSphereModels";
import {
  judgeLinePlane,
  getLineDirection,
  calcLinePlaneAngle,
} from "@/math3d/lineRelation";
import {
  calculateRightTrapezoidFolding,
  calculateRectangleDiagonalFolding,
  calculateTriangleAltitudeFolding,
  calculateRhombusFolding,
} from "@/math3d/folding";
import {
  calculateSinglePointAngle,
  calculateDoublePointDistance,
  calculatePyramidVolumeExtrema,
  calculateSurfacePath,
} from "@/math3d/parametricPoint";
import {
  calculateParallelJudgeState,
  calculateParallelIntersectionLines,
  calculatePerpJudgeFamily,
  calculatePerpPropState,
  calculatePyramidPerpModel,
} from "@/math3d/surfaceRelation";
import {
  solveSkewLines,
  solveLinePlaneAngle,
  solveDihedralAngle,
  solvePointToPlaneDistance,
} from "@/math3d/spatialAngle";
import type { Vec3 } from "@/math3d/vector3";
import type { Plane } from "@/math3d/plane";

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
        latex: `|\\cos \\theta| = \\frac{|\\vec{n_1} \\cdot \\vec{n_2}|}{|\\vec{n_1}||\\vec{n_2}|}, \\quad \\text{由图可知二面角为锐角} \\implies \\cos\\theta = +\\frac{\\vec{n_1}\\cdot\\vec{n_2}}{|\\vec{n_1}||\\vec{n_2}|}`,
        level: "core",
        condition:
          "\\theta \\in [0^\\circ, 180^\\circ]，法向量夹角可能与二面角相等或互补，高考大题必须写明“由图可知”！",
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

// ── know-solid-position: 线面与面面位置关系 ──

export function buildLinePlaneRelationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "parallel";
  const subTheorem = (config?.subTheorem as string) ?? "judge"; // "judge" | "prop"
  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 30;
  const intersectType = params.intersectType ?? 1;
  const inPlaneType = params.inPlaneType ?? 1;
  const lambdaE = params.lambdaE ?? 0.5;
  const lambdaF = params.lambdaF ?? 0.5;

  // 1. 高考四棱锥经典母题模式
  if (mode === "gaokaoPyramid") {
    const isParallel = Math.abs(lambdaE - lambdaF) < 1e-3;
    const quantities: MathQuantity[] = [
      {
        label: "动点 E 比例 PE/PB",
        symbol: "\\lambda_E",
        value: lambdaE.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 F 比例 PF/PC",
        symbol: "\\lambda_F",
        value: lambdaF.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "EF 与底面位置关系",
        value: isParallel ? "EF ∥ 平面 ABCD" : "EF 截底面 (相交)",
        color: isParallel ? MATH_COLORS.highlight : MATH_COLORS.textMuted,
      },
      {
        label: "EF 与侧面 PAD 位置关系",
        value: isParallel ? "EF ∥ 平面 PAD" : "相交",
        color: isParallel ? MATH_COLORS.highlight : MATH_COLORS.textMuted,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "四棱锥动点线面平行判定法",
        latex: `\\begin{cases} \\frac{PE}{PB} = \\frac{PF}{PC} \\;\\Rightarrow\\; EF \\parallel BC \\\\ BC \\parallel AD \\;\\Rightarrow\\; EF \\parallel AD \\\\ EF \\not\\subset \\text{面}PAD, \\; AD \\subset \\text{面}PAD \\end{cases} \\;\\Rightarrow\\; EF \\parallel \\text{面}PAD`,
        level: "core",
        condition: "三角形相似中位线与平行公理(传递性)转化",
      },
      {
        name: "四棱锥侧面与底面垂直性质",
        latex: `PA \\perp \\text{面}ABCD, \\; PA \\subset \\text{面}PAD \\;\\Rightarrow\\; \\text{面}PAD \\perp \\text{面}ABCD`,
        level: "core",
        condition: "一条直线垂直于底面，则包含该直线的侧面必垂直于底面",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【高考真题高频模型】四棱锥中证明“动直线 ∥ 平面”，第一步利用比例相似/中位线证线线平行，第二步说明一条在面外、一条在面内，第三步下结论。三步书写缺一不可！",
        importance: "gaokao",
      },
      {
        text: "【向量建系得分点】以 A 为原点，AB, AD, AP 为 x, y, z 轴建立空间直角坐标系，求出面 PAD 法向量 n=(0,1,0)，计算向量 EF·n = 0 即可向量法获满分。",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!isParallel) {
      warnings.push({
        text: `当前 λ_E (${lambdaE}) ≠ λ_F (${lambdaF})，EF 与底面边 BC 不平行，无法构成线面平行！调节滑块使 λ_E = λ_F。`,
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "动点探平行，比例先对齐；中位平行线，三步定线面。",
    };
  }

  // 2. 面面平行与面面垂直模式
  if (mode === "surfaceParallel" || mode === "surfacePerp") {
    const isParallelMode = mode === "surfaceParallel";
    const quantities: MathQuantity[] = [
      {
        label: "平面 α 法向量 n₁",
        symbol: "\\vec{n_1}",
        value: "(0, 0, 1)",
        color: MATH_COLORS.primary,
      },
      {
        label: "平面 β 法向量 n₂",
        symbol: "\\vec{n_2}",
        value: isParallelMode ? "(0, 0, 1)" : "(1, 0, 0)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "两平面位置关系",
        value: isParallelMode ? "面面平行 (α ∥ β)" : "面面垂直 (α ⊥ β)",
        color: MATH_COLORS.highlight,
      },
    ];

    const theorems: Theorem[] = isParallelMode
      ? [
          {
            name: "面面平行判定定理 (几何法)",
            latex: `\\begin{cases} a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\\\ a \\parallel \\beta, \\; b \\parallel \\beta \\end{cases} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
            level: "core",
            condition: "一个平面内有两条相交直线分别平行于另一个平面",
          },
          {
            name: "面面平行性质定理 (交线平行)",
            latex: `\\begin{cases} \\alpha \\parallel \\beta \\\\ \\gamma \\cap \\alpha = a \\\\ \\gamma \\cap \\beta = b \\end{cases} \\;\\Rightarrow\\; a \\parallel b`,
            level: "core",
            condition: "第三个平面与两个平行平面相交，交线平行",
          },
          {
            name: "面面平行向量法判定",
            latex: `\\vec{n_1} \\parallel \\vec{n_2} \\;\\Leftrightarrow\\; \\frac{A_1}{A_2} = \\frac{B_1}{B_2} = \\frac{C_1}{C_2} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
            level: "core",
            condition: "两平面的法向量成比例 (共线)",
          },
        ]
      : [
          {
            name: "面面垂直判定定理 (几何法)",
            latex: `l \\perp \\alpha, \\; l \\subset \\beta \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
            level: "core",
            condition: "一个平面经过另一个平面的一条垂线",
          },
          {
            name: "面面垂直性质定理 (高考极易扣分点)",
            latex: `\\begin{cases} \\alpha \\perp \\beta \\\\ \\alpha \\cap \\beta = l \\\\ a \\subset \\alpha \\\\ a \\perp l \\end{cases} \\;\\Rightarrow\\; a \\perp \\beta`,
            level: "core",
            condition: "两面垂直，在其中一个面内作交线的垂线必垂直于另一个面",
          },
          {
            name: "面面垂直向量法判定",
            latex: `\\vec{n_1} \\cdot \\vec{n_2} = 0 \\;\\Leftrightarrow\\; A_1A_2 + B_1B_2 + C_1C_2 = 0 \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
            level: "core",
            condition: "两平面的法向量数量积为 0 (相互垂直)",
          },
        ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: isParallelMode
          ? "【面面平行证明转化链】线线平行 ➔ 线面平行 ➔ 面面平行。注意必须在面内找到两条【相交】直线分别平行。"
          : "【面面垂直满分答题注意】使用面面垂直性质定理时，必须写明4大条件：① 面面垂直；② 交线是谁；③ 直线在该面内；④ 直线垂直于交线。漏写任一条件扣1分！",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!isParallelMode && thetaDeg !== 90) {
      warnings.push({
        text: `🚨【高考面面垂直易错反例】当前面内直线 a 与交线夹角为 θ = ${thetaDeg}° (≠ 90°)。面面垂直性质定理的核心前提是【面内直线垂直于交线】！若不垂直于交线，无法推出 a ⊥ α。`,
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: isParallelMode
        ? "相交两线平行面，面面平行定无疑；第三平面截交线，两线平行又复返。"
        : "过垂线之面必垂直；面面垂直找交线，面内垂交垂直面。",
    };
  }

  // 3. 空间向量法模式
  if (mode === "vector") {
    const lineDir = getLineDirection(thetaDeg, phiDeg);
    const planeNormal: Vec3 = { x: 0, y: 0, z: 1 };
    const angleInfo = calcLinePlaneAngle(lineDir, planeNormal);

    const isParallel = Math.abs(angleInfo.sinTheta) < 1e-3;

    const quantities: MathQuantity[] = [
      {
        label: "方向向量 l",
        symbol: "\\vec{l}",
        value: `(${lineDir.x.toFixed(2)}, ${lineDir.y.toFixed(2)}, ${lineDir.z.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平面法向量 n",
        symbol: "\\vec{n}",
        value: "(0.00, 0.00, 1.00)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "数量积 l·n",
        symbol: "\\vec{l} \\cdot \\vec{n}",
        value: lineDir.z.toFixed(3),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "线面角正弦 sinθ",
        symbol: "\\sin\\theta",
        value: Number(angleInfo.sinTheta.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "向量法线面角公式",
        latex: `\\sin\\theta = |\\cos\\langle\\vec{l}, \\vec{n}\\rangle| = \\frac{|\\vec{l} \\cdot \\vec{n}|}{|\\vec{l}| \\cdot |\\vec{n}|}`,
        level: "core",
        condition:
          "直线方向向量 l 与平面法向量 n 的夹角余弦绝对值即为线面角正弦",
      },
      {
        name: "向量法判定平行与垂直",
        latex: `\\begin{cases} \\vec{l} \\cdot \\vec{n} = 0 \\;(l \\not\\subset \\alpha) \\;\\Rightarrow\\; l \\parallel \\alpha \\\\ \\vec{l} = k\\vec{n} \\;\\Rightarrow\\; l \\perp \\alpha \\end{cases}`,
        level: "core",
        condition: "垂直判共线，平行判点积为零",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【高考二轮解答题第(2)问满分解法】先建立空间直角坐标系，写出各点坐标；设出法向量 n=(x,y,z)，由 n·v1=0 和 n·v2=0 求出特解；最后代入 sinθ = |l·n| / (|l||n|) 求解。",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (isParallel && (zHeight === 0 || inPlaneType === 0)) {
      warnings.push({
        text: "当前 l·n = 0 且直线位于平面内 (h=0)，此时直线在面内 (l ⊂ α)，不属于线面平行。",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "向量法求线面角，法向量点乘方向；余弦绝对取正弦，几何二问稳拿分。",
    };
  }

  // 4. 线面平行与线面垂直主线
  const plane: Plane = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  };

  const effectiveZ = inPlaneType === 0 ? 0 : zHeight;
  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const pointOnLine: Vec3 = { x: 0, y: 0, z: effectiveZ };
  const relation = judgeLinePlane(lineDir, plane, pointOnLine);
  const angleInfo = calcLinePlaneAngle(lineDir, plane.normal);

  const relationText =
    inPlaneType === 0
      ? "线在面内 (l ⊂ α) 【反例】"
      : relation === "parallel"
        ? "线面平行 (l ∥ α)"
        : relation === "perpendicular"
          ? "线面垂直 (l ⊥ α)"
          : relation === "inPlane"
            ? "线在面内 (l ⊂ α)"
            : "线面相交 (l ∩ α = P)";

  const quantities: MathQuantity[] = [
    {
      label: "线面角正弦 sinθ",
      symbol: "\\sin\\theta",
      value: Number(angleInfo.sinTheta.toFixed(3)),
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "空间位置关系",
      value: relationText,
      color:
        relation === "perpendicular" ||
        (relation === "parallel" && inPlaneType !== 0)
          ? MATH_COLORS.highlight
          : inPlaneType === 0
            ? MATH_COLORS.highlight
            : MATH_COLORS.primary,
    },
    {
      label: "直线方向向量 l",
      symbol: "\\vec{l}",
      value: `(${lineDir.x.toFixed(2)}, ${lineDir.y.toFixed(2)}, ${lineDir.z.toFixed(2)})`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "法向量与方向向量数量积",
      symbol: "\\vec{l} \\cdot \\vec{n}",
      value: lineDir.z.toFixed(3),
      color: MATH_COLORS.secondary,
    },
  ];

  const isParallelMode = mode === "parallel";
  const isPerpMode = mode === "perpendicular";

  const theorems: Theorem[] = isParallelMode
    ? subTheorem === "prop"
      ? [
          {
            name: "线面平行性质定理 (几何法)",
            latex: `\\begin{cases} l \\parallel \\alpha \\\\ l \\subset \\beta \\\\ \\alpha \\cap \\beta = m \\end{cases} \\;\\Rightarrow\\; l \\parallel m`,
            level: "core",
            condition:
              "一条直线平行于平面，过该直线的平面与该平面相交，则直线平行于交线",
          },
          {
            name: "性质定理的高考转化模型",
            latex: `\\text{线面平行 } \\xrightarrow{\\text{过线作辅助平面}} \\text{ 获得交线 } \\xrightarrow{} \\text{ 线线平行}`,
            level: "core",
            condition: "高考解答题求空间线段平行或点坐标的核心桥梁",
          },
        ]
      : [
          {
            name: "线面平行判定定理 (几何法)",
            latex: `\\begin{cases} l \\not\\subset \\alpha \\\\ m \\subset \\alpha \\\\ l \\parallel m \\end{cases} \\;\\Rightarrow\\; l \\parallel \\alpha`,
            level: "core",
            condition: "平面外一条直线与平面内一条直线平行",
          },
          {
            name: "线面平行向量法判定",
            latex: `\\vec{l} \\cdot \\vec{n} = 0 \\; (l \\not\\subset \\alpha) \\;\\Rightarrow\\; l \\parallel \\alpha`,
            level: "core",
            condition: "直线的方向向量与平面的法向量数量积为 0 (互相垂直)",
          },
        ]
    : isPerpMode && subTheorem === "prop"
      ? [
          {
            name: "线面垂直性质定理 1 (定义性质)",
            latex: `l \\perp \\alpha, \\; m \\subset \\alpha \\;\\Rightarrow\\; l \\perp m`,
            level: "core",
            condition: "一条直线垂直于平面，则垂直于平面内所有直线 (任意性)",
          },
          {
            name: "线面垂直性质定理 2 (平行传递)",
            latex: `a \\perp \\alpha, \\; b \\perp \\alpha \\;\\Rightarrow\\; a \\parallel b`,
            level: "core",
            condition: "垂直于同一个平面的两条直线互相平行",
          },
        ]
      : [
          {
            name: "线面垂直判定定理 (几何法)",
            latex: `\\begin{cases} l \\perp a, \\; l \\perp b \\\\ a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\end{cases} \\;\\Rightarrow\\; l \\perp \\alpha`,
            level: "core",
            condition: "直线与平面内两条相交直线都垂直 (相交是关键充要前提)",
          },
          {
            name: "线面垂直向量法判定",
            latex: `\\vec{l} \\parallel \\vec{n} \\; (\\vec{l} = k\\vec{n}) \\;\\Rightarrow\\; l \\perp \\alpha`,
            level: "core",
            condition: "直线的方向向量与平面的法向量共线 (成比例)",
          },
        ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: isParallelMode
        ? "【高考答题规范4步法】① 写出已知线线平行 (l ∥ m)；② 声明 l ⊄ α；③ 声明 m ⊂ α；④ 由判定定理得 l ∥ α。缺步骤 ② 或 ③ 扣 1-2 分！"
        : "【高考线面垂直关键得分点】证明 l ⊥ α 时，必须找到面内两条相交直线 a, b 并写明 a ∩ b = P。很多考生漏写相交导致失分！",
      importance: "gaokao",
    },
    {
      text: "【数形结合二轮通法】几何法通常用于第(1)问判定证明；第(2)问建立空间直角坐标系，利用法向量 n 计算线面角 sinθ = |cos<l, n>| = |l·n| / (|l||n|)。",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];

  // 模式反例与退化警示
  if (isPerpMode && intersectType === 0) {
    warnings.push({
      text: "🚨【高考相交陷阱反例】当前面内两条直线 a ∥ b。即使直线 l 分别垂直于 a 和 b，l 仍可在垂直于该方向的平面内自由晃动倾斜，无法导出 l ⊥ α！线面垂直判定必须强调【相交直线】。",
      level: "danger",
    });
  }

  if (isParallelMode && inPlaneType === 0) {
    warnings.push({
      text: "🚨【高考面外陷阱反例】当前直线位于平面内 (l ⊂ α)。虽然 l ∥ m，但此时 l ⊂ α 而不是 l ∥ α！线面平行判定必须严格满足【平面外一条直线 (l ⊄ α)】。",
      level: "danger",
    });
  }

  if (zHeight === 0 && thetaDeg === 0 && inPlaneType !== 0) {
    warnings.push({
      text: "当前 h = 0 且 θ = 0°，直线贴合在平面内 (l ⊂ α)。线面平行的严格前提条件是直线在平面外 (l ⊄ α)。",
      level: "warning",
    });
  }

  const mnemonic = isParallelMode
    ? "线线平行变线面，面外线内不可漏；过线作面得交线，线面又转线线行。"
    : "相交两线定垂直，面内任意皆垂直；同垂直于一平面，两线平行永不偏。";

  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}

// ── know-solid-surface-relation: 面面平行与垂直判定及性质定理 ──

export function buildSurfaceRelationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "parallelJudge";
  const subType = (config?.subType as string) ?? "standard"; // "standard" | "counterExample" | "intersectProp" | "dualPerp"
  const zHeight = params.zHeight ?? 2.2;
  const tiltDeg = params.tiltDeg ?? 0;
  const azimuthDeg = params.azimuthDeg ?? 30;
  const planeRotDeg = params.planeRotDeg ?? 45;
  const lineThetaDeg = params.lineThetaDeg ?? 90;
  const posO = params.posO ?? 0.5;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  let mnemonic = "";

  if (mode === "parallelJudge") {
    const isIntersect = subType !== "counterExample";
    const judgeState = calculateParallelJudgeState(
      isIntersect,
      tiltDeg,
      zHeight,
    );

    quantities.push(
      {
        label: "平面 α 法向量 n₁",
        symbol: "\\vec{n_1}",
        value: `(${judgeState.alphaNormal.x.toFixed(2)}, ${judgeState.alphaNormal.y.toFixed(2)}, ${judgeState.alphaNormal.z.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平面 β 法向量 n₂",
        symbol: "\\vec{n_2}",
        value: "(0.00, 0.00, 1.00)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "面内两线位置关系",
        value: isIntersect
          ? "两条直线 a, b 相交于点 P"
          : "两条直线 a, b 互相平行",
        color: isIntersect ? MATH_COLORS.highlight : MATH_COLORS.paramSecondary,
      },
      {
        label: "两平面判定结论",
        value: judgeState.isAlphaParallelToBeta
          ? "面面平行 (α ∥ β)"
          : "两面相交 (反例成立)",
        color: judgeState.isAlphaParallelToBeta
          ? MATH_COLORS.highlight
          : MATH_COLORS.textMuted,
      },
    );

    theorems.push(
      {
        name: "面面平行判定定理 (几何法)",
        latex: `\\begin{cases} a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\\\ a \\parallel \\beta, \\; b \\parallel \\beta \\end{cases} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
        level: "core",
        condition: "一个平面内的两条【相交】直线分别平行于另一个平面",
      },
      {
        name: "面面平行向量法判定 (法向量共线)",
        latex: `\\vec{n_1} \\parallel \\vec{n_2} \\;\\Leftrightarrow\\; \\vec{n_1} = k\\vec{n_2} \\; (k \\neq 0) \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
        level: "core",
        condition: "两个平面的法向量互相平行 (成比例)",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考命题必考反例】若一个平面内的两条【平行】直线分别平行于另一个平面，则两平面可能平行，也可能相交（如三棱柱的两个侧面与底面，交线平行于底面）。证明时遗漏 a ∩ b = P 扣 2 分！",
        importance: "gaokao",
      },
      {
        text: "【转化思维链】证明面面平行标准链：线线平行 (中位线/平行四边形) ➔ 线面平行 (面外面内声明) ➔ 面面平行 (两条相交线)。",
        importance: "gaokao",
      },
    );

    if (!judgeState.isAlphaParallelToBeta) {
      warnings.push({
        text: `🚨【反例警示】当前 a ∥ b (两条平行线)，当平面 α 绕直线 a 倾斜 θ = ${tiltDeg}° 时，α 与 β 产生交线，面面平行不再成立！`,
        level: "danger",
      });
    }

    mnemonic =
      "相交两线定平行，平行两线出相交；转化层层步步严，法向成比算得快。";
  } else if (mode === "parallelProp") {
    const lines = calculateParallelIntersectionLines(zHeight, 45, azimuthDeg);

    quantities.push(
      {
        label: "平行平面间距 d",
        symbol: "d(\\alpha, \\beta)",
        value: zHeight.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "交线 a 方向向量 (面β)",
        symbol: "\\vec{u_a}",
        value: `(${lines.lineDir.x.toFixed(2)}, ${lines.lineDir.y.toFixed(2)}, 0.00)`,
        color: MATH_COLORS.primary,
      },
      {
        label: "交线 b 方向向量 (面α)",
        symbol: "\\vec{u_b}",
        value: `(${lines.lineDir.x.toFixed(2)}, ${lines.lineDir.y.toFixed(2)}, 0.00)`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "交线位置关系",
        value: "a ∥ b (截线恒平行)",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "面面平行性质定理 1 (截线平行)",
        latex: `\\begin{cases} \\alpha \\parallel \\beta \\\\ \\gamma \\cap \\alpha = a \\\\ \\gamma \\cap \\beta = b \\end{cases} \\;\\Rightarrow\\; a \\parallel b`,
        level: "core",
        condition: "两个平行平面同时与第三个平面相交，它们的交线平行",
      },
      {
        name: "面面平行性质定理 2 (垂线共性)",
        latex: `\\alpha \\parallel \\beta, \\; l \\perp \\alpha \\;\\Rightarrow\\; l \\perp \\beta`,
        level: "core",
        condition: "一条直线垂直于两个平行平面中的一个，必垂直于另一个",
      },
      {
        name: "平行平面间的距离公式",
        latex: `d(\\alpha, \\beta) = \\frac{|\\vec{AB} \\cdot \\vec{n}|}{|\\vec{n}|} = \\frac{|D_1 - D_2|}{\\sqrt{A^2 + B^2 + C^2}}`,
        level: "important",
        note: "A, B 分别为两平面上任意一点，n 为平面的法向量",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考截面作图神器】在正方体/多面体截面大题中，若截面穿过两个平行面，则在两个面上的截线必相互平行。利用此性质可直接连线定出截面多边形顶点！",
        importance: "gaokao",
      },
      {
        text: "【面面平行距离解题】公垂线段在两平面间任意平移长度不变；求两平行面距离可转化为求其中一个面内任一点到另一面的点面距离。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "平行双面截第三，交线平行立可推；垂线一穿两面过，距离处处皆均等。";
  } else if (mode === "perpJudge") {
    const fam = calculatePerpJudgeFamily(planeRotDeg);

    quantities.push(
      {
        label: "平面 α 法向量 n₁",
        symbol: "\\vec{n_1}",
        value: "(0.00, 0.00, 1.00)",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平面 β 法向量 n₂",
        symbol: "\\vec{n_2}",
        value: `(${fam.betaNormal.x.toFixed(2)}, ${fam.betaNormal.y.toFixed(2)}, 0.00)`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "法向量数量积 n₁ · n₂",
        symbol: "\\vec{n_1} \\cdot \\vec{n_2}",
        value: "0.00",
        color: MATH_COLORS.highlight,
      },
      {
        label: "二面角平面角",
        symbol: "\\theta_{\\text{二面角}}",
        value: "90.00°",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "面面垂直判定定理 (线面垂直推面面垂直)",
        latex: `l \\perp \\alpha, \\; l \\subset \\beta \\;\\Rightarrow\\; \\beta \\perp \\alpha`,
        level: "core",
        condition: "一个平面经过另一个平面的一条垂线，则这两个平面互相垂直",
      },
      {
        name: "面面垂直向量法判定 (法向量内积为0)",
        latex: `\\vec{n_1} \\perp \\vec{n_2} \\;\\Leftrightarrow\\; \\vec{n_1} \\cdot \\vec{n_2} = 0 \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
        level: "core",
        condition: "两平面的法向量互相垂直",
      },
    );

    gaokaoPoints.push(
      {
        text: "【证明面面垂直首选通法】立体几何第(1)问证明面面垂直，95% 的题型都是先证“线面垂直”：在其中一个面内找到一条直线垂直于另一个平面，直接使用判定定理下结论！",
        importance: "gaokao",
      },
      {
        text: "【垂面族直观理解】只要固定底面垂线 l，绕着 l 旋转的任意一个半透明平面 β，与底面构成的二面角始终为 90°。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "线面垂直生垂面，过垂线面任旋转；法向相乘积为零，二面直角定理显。";
  } else if (mode === "perpProp") {
    const isDualPerp = subType === "dualPerp";
    const propState = calculatePerpPropState(lineThetaDeg);

    quantities.push(
      {
        label: "直线 a 与交线夹角 θ",
        symbol: "\\theta = \\angle(a, l)",
        value: `${lineThetaDeg.toFixed(1)}°`,
        color: propState.isPerpToAlpha
          ? MATH_COLORS.highlight
          : MATH_COLORS.paramSecondary,
      },
      {
        label: "直线 a 与底面线面角",
        symbol: "\\angle(a, \\alpha)",
        value: `${propState.linePlaneAngleDeg.toFixed(1)}°`,
        color: propState.isPerpToAlpha
          ? MATH_COLORS.highlight
          : MATH_COLORS.textMuted,
      },
      {
        label: "线面垂直判定结论",
        value: propState.isPerpToAlpha
          ? "a ⊥ 平面 α (成立)"
          : "a ⊥ α 不成立 (斜交)",
        color: propState.isPerpToAlpha
          ? MATH_COLORS.highlight
          : MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "面面垂直性质定理 1 (高考必背)",
        latex: `\\begin{cases} \\alpha \\perp \\beta \\\\ \\alpha \\cap \\beta = l \\\\ a \\subset \\alpha \\\\ a \\perp l \\end{cases} \\;\\Rightarrow\\; a \\perp \\beta`,
        level: "core",
        condition:
          "两平面垂直，在其中一个面内【垂直于交线】的直线必垂直于另一个平面",
      },
      {
        name: "面面垂直性质定理 2 (双垂直交线定理)",
        latex: `\\begin{cases} \\alpha \\perp \\gamma \\\\ \\beta \\perp \\gamma \\\\ \\alpha \\cap \\beta = l \\end{cases} \\;\\Rightarrow\\; l \\perp \\gamma`,
        level: "important",
        condition: "两个相交平面都垂直于第三个平面，它们的交线垂直于第三个平面",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考失分重灾区·4步得分律】使用面面垂直性质定理作高线时，必须严格写全4步：① 面面垂直；② 交线 l；③ 直线 a 在面内；④ a ⊥ l。四步缺一不可！",
        importance: "gaokao",
      },
      {
        text: "【求高求点面距通法】题目给出“侧面 ⊥ 底面”时，第一反应是在侧面内过顶点向底边交线作垂线，此垂线即为几何体的高！",
        importance: "gaokao",
      },
    );

    if (!propState.isPerpToAlpha && !isDualPerp) {
      warnings.push({
        text: `🚨【高考极高频扣分反例】当前直线 a 与交线夹角 θ = ${lineThetaDeg}° (≠ 90°)。只有当 a 垂直于交线时，a 才能垂直于底面 α！`,
        level: "danger",
      });
    }

    mnemonic =
      "面面垂直找交线，面内垂交垂直面；若非交线垂直线，断难推出线垂直。";
  } else {
    // 高考综合模型 (gaokaoModel)
    const pyr = calculatePyramidPerpModel(
      params.pyramidA ?? 3.6,
      params.pyramidB ?? 2.8,
      params.pyramidH ?? 3.2,
      posO,
    );

    quantities.push(
      {
        label: "四棱锥高 PO",
        symbol: "h = |PO|",
        value: pyr.height.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "垂足 O 分点比例",
        symbol: "\\lambda_O = AO/AD",
        value: posO.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "侧面 PAD 与底面位置",
        value: "平面 PAD ⊥ 平面 ABCD",
        color: MATH_COLORS.highlight,
      },
      {
        label: "高线 PO 与底面位置",
        value: "PO ⊥ 底面 ABCD",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "四棱锥侧面垂直底面作高法则",
        latex: `\\begin{cases} \\text{面}PAD \\perp \\text{面}ABCD \\\\ \\text{面}PAD \\cap \\text{面}ABCD = AD \\\\ PO \\subset \\text{面}PAD, \\; PO \\perp AD \\end{cases} \\;\\Rightarrow\\; PO \\perp \\text{面}ABCD`,
        level: "core",
        condition: "四棱锥高 PO 的严密证明格式",
      },
      {
        name: "空间直角坐标系建系规范",
        latex: `O(0,0,0) \\text{ 为原点},\\; \\vec{OD}\\text{ 为 } y \\text{ 轴},\\; \\vec{OP}\\text{ 为 } z \\text{ 轴},\\; \\text{作 } Ox \\perp AD \\text{ 为 } x \\text{ 轴}`,
        level: "core",
        condition: "利用垂直性质定理确立互相垂直的三条射线建系",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考大题两问全流程】第(1)问：利用面面垂直性质定理证明 PO ⊥ 底面 ABCD；第(2)问：以垂足 O 为原点建立空间直角坐标系，求各点坐标及面 PBC 的法向量，用向量法求二面角或线面角余弦值。",
        importance: "gaokao",
      },
      {
        text: "【正方体面面平行对角面】正方体 ABCD-A₁B₁C₁D₁ 中，面 A₁C₁D ∥ 面 AB₁C，两平面将体对角线 BD₁ 三等分，是高考截面与距离的高频背景。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "四棱锥中垂面立，垂足作高是正理；以垂为原建坐标，向量求角步步明。";
  }

  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}

// ── know-solid-section: 多面体截面作图与截面积计算 ──

export function buildSectionPanel(
  _params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "continuous"; // "continuous" | "construction" | "extrema"
  const vertexCount = (config?.vertexCount as number) ?? 0;
  const area3D = (config?.area3D as number) ?? 0;
  const areaProj = (config?.areaProj as number) ?? 0;
  const cosTheta = (config?.cosTheta as number) ?? 1;
  const solidName = (config?.solidName as string) ?? "长方体 / 正方体";
  const thetaDeg = (config?.thetaDeg as number) ?? 0;
  const shapeName = (config?.shapeName as string) ?? `${vertexCount} 边形`;
  const perimeter = (config?.perimeter as number) ?? 0;
  const normalStr = (config?.normalStr as string) ?? "(0, 0, 1)";
  const rationale = (config?.rationale as string) ?? "";
  const stepTitle = (config?.stepTitle as string) ?? "";
  const minArea = (config?.minArea as number) ?? 0;
  const maxArea = (config?.maxArea as number) ?? 0;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  // 1. 核心数学量（与左屏几何体、模式、参数完全同步）
  quantities.push(
    {
      label: "几何体模型",
      symbol: "\\text{模型}",
      value: solidName,
      color: MATH_COLORS.primary,
    },
    {
      label: "截面几何形状",
      symbol: "\\text{形状}",
      value: shapeName,
      color: vertexCount >= 3 ? MATH_COLORS.highlight : MATH_COLORS.textMuted,
    },
    {
      label: "截面顶点个数",
      symbol: "n",
      value: vertexCount,
      color: MATH_COLORS.primary,
    },
    {
      label: "截面 3D 实际面积",
      symbol: "S_{\\text{截}}",
      value: vertexCount >= 3 ? Number(area3D.toFixed(3)) : 0,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "底面 2D 射影面积",
      symbol: "S_{\\text{投}}",
      value: vertexCount >= 3 ? Number(areaProj.toFixed(3)) : 0,
      color: MATH_COLORS.secondary,
    },
    {
      label: "截面与底面二面角余弦",
      symbol: "\\cos\\theta",
      value: Number(cosTheta.toFixed(4)),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "二面角大小",
      symbol: "\\theta",
      value: `${thetaDeg.toFixed(2)}°`,
      color: MATH_COLORS.accent,
    },
    {
      label: "截面周长",
      symbol: "L_{\\text{截}}",
      value: vertexCount >= 3 ? Number(perimeter.toFixed(3)) : 0,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "切割平面法向量",
      symbol: "\\vec{n}",
      value: normalStr,
      color: MATH_COLORS.primary,
    },
  );

  if (mode === "extrema" && maxArea > 0) {
    quantities.push(
      {
        label: "动点探究最小面积",
        symbol: "S_{\\min}",
        value: Number(minArea.toFixed(3)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "动点探究最大面积",
        symbol: "S_{\\max}",
        value: Number(maxArea.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
    );
  }

  // 2. 定理体系
  theorems.push(
    {
      name: "截面射影面积定理",
      latex: `S_{\\text{截}} = \\frac{S_{\\text{投}}}{\\cos \\theta} \\quad (\\theta \\text{ 为截面与射影参考平面的二面角})`,
      level: "core",
      condition:
        "截面不能垂直于射影参考面 (cos θ > 0)。若垂直底面则投影退化为线段",
    },
    {
      name: "截面作图三大公理与性质依据",
      latex: `\\begin{cases} \\text{公理 1 (同面连线): } A, B \\in \\alpha \\implies AB \\subset \\alpha \\\\ \\text{公理 3 (交轨法): } \\alpha \\cap \\beta = l \\\\ \\text{面面平行性质: } \\alpha \\parallel \\beta \\implies l_1 \\parallel l_2 \\end{cases}`,
      level: "core",
      note: "同面直接连线；异面延线相交于底面/侧面交轨；平行面截线必平行",
    },
  );

  if (mode === "construction" && rationale) {
    theorems.push({
      name: stepTitle || "当前作图步骤依据",
      latex: `\\text{依据公理与几何性质推演}`,
      note: rationale,
      level: "important",
    });
  }

  // 3. 高考考点
  gaokaoPoints.push(
    {
      text: "【新高考经典题型——截面形状判定】正方体/长方体中的截面多边形边数满足 3 ≤ n ≤ 6，不可能出现七边形（因为正方体仅有 6 个表面，每个面内最多产生 1 条截线段）。",
      importance: "gaokao",
    },
    {
      text: "【射影面积秒杀法】求倾斜不规则截面面积时，先求该截面在底面的投影多边形面积 S_投，再求截面法向量与底面夹角余弦 cosθ，利用 S_截 = S_投 / cosθ 快速求解，避免复杂的空间三角形拆分。",
      importance: "gaokao",
    },
    {
      text: "【交轨法作图标准步骤】① 连结同一表面内的已知点；② 延长相交直线交底面/侧面棱直线于外点 K；③ 连结外点与同面第三点确定新交点；④ 结合平行面交线平行的性质补齐封闭多边形。",
      importance: "gaokao",
    },
  );

  // 4. 警示与边界
  if (vertexCount < 3) {
    warnings.push({
      text: "当前切割平面与多面体表面无交点或仅有一条切线，截面退化！请调节中心高度或倾斜角使平面穿过几何体内部。",
      level: "warning",
    });
  } else if (cosTheta < 1e-4) {
    warnings.push({
      text: "当前截面垂直于底面 (cos θ ≈ 0)，截面在底面的投影退化为一条线段 (S_投 = 0)，射影面积公式不适用，请采用空间向量叉积法或几何分块法计算截面积。",
      level: "danger",
    });
  } else if (shapeName.includes("正六边形")) {
    warnings.push({
      text: "🌟【高考特值考点】当前截面为正方体的经典正六边形截面！各边长相等，面积达到同向切面的局部极大值。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "同面直接连，异面延线交；射影求面积，投影除以余弦角。",
  };
}

// ── know-solid-ball: 外接球与内切球 ──

export function buildCircumSpherePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  if (!config) {
    console.warn(
      "[buildCircumSpherePanel] config 未传入，右屏公式默认为长方体外接球",
    );
  }
  const sphereType = (config?.sphereType as string) ?? "circum";
  const shape = (config?.shape as string) ?? "cuboid";
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;

  let radius = 0;
  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (sphereType === "circum") {
    // ── 外接球模式 ──
    if (shape === "cuboid") {
      radius = cuboidCircumRadius(a, b, c);
      quantities.push(
        {
          label: "体对角线长 d",
          symbol: "d",
          value: (2 * radius).toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push(
        {
          name: "长方体/墙角模型外接球公式",
          latex: `R = \\frac{\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2}}{2}`,
          level: "core",
          note: "体对角线长等于外接球直径 ($d = 2R = \\sqrt{a^2+b^2+c^2}$)",
        },
        {
          name: "球心位置几何表达",
          latex: `O = \\frac{1}{2} (A + C_1)`,
          level: "important",
          note: "外接球球心即为长方体体对角线的中点",
        },
      );
      gaokaoPoints.push(
        {
          text: "【新高考通法·多面体外接球 4 步法】①判断三维几何体类型（墙角模型 / 柱体模型 / 正棱锥模型）；②确定底面外接圆半径 r_底；③应用黄金定理 R² = r_底² + d² 求解球半径；④计算球表面积 S = 4πR² 或体积 V = 4/3 πR³。",
          importance: "gaokao",
        },
        {
          text: "高考经典补体法（墙角模型）：凡具有三条两两垂直棱的三棱锥（如 P-ABC 满足 PA ⊥ PB ⊥ PC），均可补形为长方体求外接球半径 R = √(a²+b²+c²) / 2。",
          importance: "gaokao",
        },
      );
    } else if (shape === "regularPyramid") {
      // 正四棱锥 (底边长 a, 高 c)
      const rBase = a / Math.sqrt(2);
      radius = regularPyramidCircumRadius(rBase, c);
      quantities.push(
        {
          label: "底面外接圆半径 r",
          symbol: "r_{底}",
          value: rBase.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push(
        {
          name: "正棱锥外接球公式 (截面勾股法)",
          latex: `R = \\frac{r_{底}^2 + h^2}{2h} = \\frac{\\frac{a^2}{2} + h^2}{2h}`,
          level: "core",
          condition: "外接球球心位于过底面外心且垂直于底面的中心轴线上",
        },
        {
          name: "中心高线勾股方程",
          latex: `R^2 = r_{底}^2 + (h - R)^2`,
          level: "important",
        },
      );
      gaokaoPoints.push({
        text: "正棱锥外接球球心求法：球心在中心高线上，在包含高的轴截面直角三角形中利用勾股定理 $R^2 = r^2 + (h-R)^2$ 即可解出 $R = \\frac{r^2+h^2}{2h}$。",
        importance: "gaokao",
      });
    } else if (shape === "triangularPrism") {
      // 直三棱柱 (底面直角边 a, b, 高 c)
      const rBase = Math.sqrt(a * a + b * b) / 2;
      radius = Math.sqrt(rBase * rBase + (c / 2) ** 2);
      quantities.push(
        {
          label: "直角边 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "直角边 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "底面外接圆半径",
          symbol: "r_{底}",
          value: rBase.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "柱体高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push({
        name: "直棱柱外接球通用公式",
        latex: `R = \\sqrt{r_{底}^2 + \\left(\\frac{h}{2}\\right)^2}`,
        level: "core",
        note: "r_底 为底面多边形外接圆半径，h 为直棱柱高",
      });
      gaokaoPoints.push({
        text: "直棱柱外接球黄金法则：R² = r_底² + (h/2)²。若底面为直角三角形，斜边中点即为底面外心，r_底 = 斜边/2。",
        importance: "gaokao",
      });
    } else if (shape === "cone") {
      // 圆锥 (底半径 a, 高 c)
      radius = coneCircumRadius(a, c);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "圆锥高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "母线长 l",
          symbol: "l",
          value: Math.sqrt(a * a + c * c).toFixed(3),
          color: MATH_COLORS.secondary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push(
        {
          name: "圆锥外接球公式 (轴截面法)",
          latex: `R = \\frac{r^2 + h^2}{2h} = \\frac{l^2}{2h}`,
          level: "core",
          note: "轴截面为底长 $2r$、腰长 $l$ 的等腰三角形，其外接圆半径即为圆锥外接球半径",
        },
        {
          name: "圆锥母线与半径高勾股关系",
          latex: `l = \\sqrt{r^2 + h^2}`,
          level: "important",
        },
      );
      gaokaoPoints.push({
        text: "旋转体切接问题降维法：过旋转轴作轴截面，圆锥外接球问题降维转化为轴截面三角形的外接圆问题，$R = \\frac{l^2}{2h}$。",
        importance: "gaokao",
      });
    } else {
      // 圆柱 (底半径 a, 高 c)
      radius = Math.sqrt(a * a + (c / 2) ** 2);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "圆柱高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push({
        name: "圆柱外接球公式",
        latex: `R = \\sqrt{r^2 + \\left(\\frac{h}{2}\\right)^2}`,
        level: "core",
        note: "圆柱轴截面为宽 $2r$、高 $h$ 的矩形，矩形对角线长的一半即为外接球半径",
      });
      gaokaoPoints.push({
        text: "圆柱外接球球心位于旋转轴的中点，轴截面矩形对角线半径 $R = \\sqrt{r^2 + (h/2)^2}$。",
        importance: "gaokao",
      });
    }

    const V = sphereVolume(radius);
    const S = sphereSurfaceArea(radius);
    quantities.push(
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: V.toFixed(3),
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: S.toFixed(3),
        color: MATH_COLORS.accent,
      },
    );
  } else {
    // ── 内切球模式 ──
    if (shape === "cuboid") {
      radius = Math.min(a, b, c) / 2;
      const isCube = a === b && b === c;
      quantities.push(
        {
          label: "长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "宽 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "高 c",
          symbol: "c",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "最大可容纳球半径",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push({
        name: "正方体内切球公式",
        latex: `r_{in} = \\frac{a}{2} \\quad (a = b = c \\text{ 时成立})`,
        level: "core",
        note: "一般长方体 (a ≠ b 或 b ≠ c) 不存在同时切 6 个面的内切球",
      });
      if (!isCube) {
        warnings.push({
          text: "当前长方体长宽高不相等 (a ≠ b ≠ c)，不存在同时与 6 个面相切的内切球！图中展示为最大内部相切球。",
          level: "warning",
        });
      }
    } else if (shape === "regularPyramid") {
      // 正四棱锥 (底边长 a, 高 c)
      const hs = Math.sqrt(c * c + (a / 2) ** 2); // 斜高
      const vSolid = (1 / 3) * a * a * c;
      const sTotal = a * a + 2 * a * hs;
      radius = (3 * vSolid) / sTotal;
      quantities.push(
        {
          label: "底面边长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "棱锥体积 V",
          symbol: "V_{棱锥}",
          value: vSolid.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "全面积 S",
          symbol: "S_{全}",
          value: sTotal.toFixed(3),
          color: MATH_COLORS.secondary,
        },
        {
          label: "内切球半径 r",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push({
        name: "等体积法求内切球公式",
        latex: `r_{in} = \\frac{3V_{几何体}}{S_{全面积}} = \\frac{a h}{a + 2\\sqrt{h^2 + \\frac{a^2}{4}}}`,
        level: "core",
        condition: "将多面体拆分为以各面为底、球心为顶点的锥体分割",
      });
      gaokaoPoints.push({
        text: "高考通用内切球神器：等体积法 r_{in} = 3V / S_{全}！适用于任意存在内切球的凸多面体和旋转体。",
        importance: "gaokao",
      });
    } else if (shape === "triangularPrism") {
      // 直三棱柱 (底面直角边 a, b, 高 c)
      const rBaseIn = (a + b - Math.sqrt(a * a + b * b)) / 2;
      radius = Math.min(rBaseIn, c / 2);
      quantities.push(
        {
          label: "直角边 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "直角边 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "底面内切圆半径",
          symbol: "r_{底}",
          value: rBaseIn.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "切球半径",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push({
        name: "直三棱柱内切球存在条件",
        latex: `h = 2 r_{底in} = a + b - \\sqrt{a^2+b^2}`,
        level: "core",
        note: "只有当柱体高度等于底面内切圆直径时才存在内切球",
      });
      if (Math.abs(c - 2 * rBaseIn) > 0.1) {
        warnings.push({
          text: `当前高 h=${c} 不等于底面内切圆直径 2r=${(2 * rBaseIn).toFixed(2)}，三棱柱无法同时切上下底面与侧面！`,
          level: "warning",
        });
      }
    } else if (shape === "cone") {
      // 圆锥 (底半径 a, 高 c)
      const l = Math.sqrt(a * a + c * c);
      radius = (a * c) / (a + l);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "母线长 l",
          symbol: "l",
          value: l.toFixed(3),
          color: MATH_COLORS.secondary,
        },
        {
          label: "内切球半径 r",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push({
        name: "圆锥内切球公式 (轴截面法)",
        latex: `r_{in} = \\frac{r \\cdot h}{r + l} = \\frac{r \\cdot h}{r + \\sqrt{r^2+h^2}}`,
        level: "core",
        note: "在轴截面等腰三角形中，内切圆半径即为圆锥内切球半径",
      });
      gaokaoPoints.push({
        text: "圆锥内切球降维求解：轴截面为等腰三角形（底 2r，高 h，腰 l），内切圆半径 r_{in} = rh / (r+l)。",
        importance: "gaokao",
      });
    } else {
      // 圆柱 (底半径 a, 高 c)
      radius = Math.min(a, c / 2);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "切球半径",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );
      theorems.push({
        name: "圆柱内切球存在条件",
        latex: `h = 2r`,
        level: "core",
        note: "当且仅当圆柱的高等于底面直径 (h = 2r) 时，才存在与上下底面和侧面均相切的内切球",
      });
      if (Math.abs(c - 2 * a) > 0.1) {
        warnings.push({
          text: `当前圆柱高 h=${c} 不等于底面直径 2r=${2 * a}，圆柱无法同时与上下底面和侧面相切！`,
          level: "warning",
        });
      }
    }

    const V = sphereVolume(radius);
    const S = sphereSurfaceArea(radius);
    quantities.push(
      {
        label: "内切球体积 V",
        symbol: "V_{球}",
        value: V.toFixed(3),
        color: MATH_COLORS.secondary,
      },
      {
        label: "内切球表面积 S",
        symbol: "S_{球}",
        value: S.toFixed(3),
        color: MATH_COLORS.accent,
      },
    );
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}

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

// ── know-solid-ball-models: 多面体外接球三大模型（墙角/柱体/补形） ──

export function buildPolyhedronSpherePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const modelType = (config?.modelType as string) ?? "corner";
  const a = params.a ?? 3;
  const b = params.b ?? 4;
  const c = params.c ?? 5;
  const h = params.h ?? 4;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (modelType === "corner") {
    // 墙角模型
    const res = calculateCornerModel(a, b, c);
    quantities.push(
      {
        label: "墙角侧棱长 PA, PB, PC",
        symbol: "a, b, c",
        value: `${a}, ${b}, ${c}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "长方体体对角线 d",
        symbol: "d",
        value: Number((2 * res.radius).toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "外接球球心坐标 O",
        symbol: "O",
        value: `(${res.center.x.toFixed(2)}, ${res.center.y.toFixed(2)}, ${res.center.z.toFixed(2)})`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "墙角模型结论（三棱锥侧棱两两垂直）",
        latex:
          "2R = \\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2} \\implies R = \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2}",
        level: "important",
        note: "从同顶点出发的三条侧棱两两垂直时，可补全为以 a, b, c 为长宽高的高考标准长方体，长方体外接球与三棱锥外接球重合",
      },
      {
        name: "墙角模型表面积与体积速记",
        latex:
          "S_{\\text{球}} = \\pi(\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2), \\quad V_{\\text{球}} = \\frac{\\pi}{6}(\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2)^{\\frac{3}{2}}",
        level: "important",
        note: "在高考选择填空题中可直接套用公式极速秒杀",
      },
    );

    gaokaoPoints.push(
      {
        text: "【墙角模型特征】：顶点 P 处三条侧棱 PA ⊥ PB, PB ⊥ PC, PC ⊥ PA。核心解法：补形长方体。长方体体对角线长等于球直径 2R。",
        importance: "gaokao",
      },
      {
        text: "【秒杀杀招】：见垂直补长方体，长宽高即为垂直棱长 a, b, c。外接球半径 R = ½ √(a² + b² + c²)。",
        importance: "hard",
      },
    );
  } else if (modelType === "cylinder") {
    // 柱体模型
    const res = calculateCylinderModel(a, b, h);
    quantities.push(
      {
        label: "底面直角边 a, b 与斜边 c_base",
        symbol: "a, b, c_{\\text{base}}",
        value: `${a}, ${b}, ${Math.sqrt(a * a + b * b).toFixed(2)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "底面外接圆半径 r_base",
        symbol: "r_{\\text{底}}",
        value: Number(res.rBase.toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "柱体高度 h (球心距 h/2)",
        symbol: "h, \\frac{h}{2}",
        value: `${h}, ${(h / 2).toFixed(2)}`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "柱体模型（套柱勾股定理）",
        latex:
          "R^2 = r_{\\text{底}}^2 + \\left(\\frac{\\color{#059669}{h}}{2}\\right)^2 \\implies R = \\sqrt{r_{\\text{底}}^2 + \\frac{\\color{#059669}{h}^2}{4}} = \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{h}^2}",
        level: "important",
        note: "直棱柱/侧棱垂直底面多面体，球心投影在底面外接圆圆心，球心到底面距离为 h/2，勾股直角三角形 O-O₁-A 成立",
      },
      {
        name: "底面外接圆半径 r_底 定理",
        latex:
          "r_{\\text{底}} = \\frac{\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}}{2}",
        level: "important",
        note: "底面为直角三角形时，斜边中点即为外接圆心，r_底 = 斜边 / 2",
      },
    );

    gaokaoPoints.push(
      {
        text: "【柱体模型特征】：直棱柱或一条侧棱垂直于底面。核心解法：套柱勾股法。求出底面外接圆半径 r_底 与柱高 h，用勾股关系求 R。",
        importance: "gaokao",
      },
      {
        text: "【新高考通法】：寻找轴中心线线段 O₁O₂（连接上下底外接圆心），中点即为球心 O，高 half 为 h/2。",
        importance: "hard",
      },
    );
  } else if (modelType === "complement") {
    // 补形模型 (对棱相等四面体)
    const res = calculateComplementModel(a, b, c);
    quantities.push(
      {
        label: "四面体对棱长对 (a, b, c)",
        symbol: "a, b, c",
        value: `${a}, ${b}, ${c}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "补形长方体三边 (x, y, z)",
        symbol: "x, y, z",
        value: res.isValid
          ? `(${res.boxDimensions.x.toFixed(2)}, ${res.boxDimensions.y.toFixed(2)}, ${res.boxDimensions.z.toFixed(2)})`
          : "无法构成实长方体",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "对棱相等四面体补形定理（汉堡模型）",
        latex:
          "R = \\frac{1}{2}\\sqrt{x^2 + y^2 + z^2} = \\frac{1}{2}\\sqrt{\\frac{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2}{2}}",
        level: "important",
        note: "若四面体对棱两两相等为 a, b, c，可将其 4 个顶点嵌入长宽高为 x, y, z 的长方体对角线上，长方体外接球与四面体外接球完全重合",
      },
      {
        name: "长方体边长与对棱关系组",
        latex:
          "\\begin{cases} x^2 + y^2 = \\color{#EF4444}{a}^2 \\\\ y^2 + z^2 = \\color{#D97706}{b}^2 \\\\ z^2 + x^2 = \\color{#059669}{c}^2 \\end{cases} \\implies x^2 + y^2 + z^2 = \\frac{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2}{2}",
        level: "important",
        note: "通过联立方程组可直接解出长方体长宽高 x, y, z",
      },
    );

    gaokaoPoints.push(
      {
        text: "【补形模型特征】：四面体 6 条棱中，对棱两两相等。核心解法：割补法还原长方体，四面体 4 个顶点即为长方体交错顶点。",
        importance: "gaokao",
      },
      {
        text: "【解题公式】：外接球半径 R = ½ √((a² + b² + c²)/2) = ¼ √(2(a² + b² + c²))。",
        importance: "hard",
      },
    );

    if (!res.isValid) {
      warnings.push({
        text: "当前对棱长 (a, b, c) 不满足三角形三边平方和条件 (如 a²+b² ≤ c²)，无法构成实数补形长方体！请调整参数使任意两边平方和大于第三边平方和。",
        level: "danger",
      });
    }
  } else if (modelType === "verticalEdge") {
    // 侧棱垂直底面模型 (汉堡模型 / 垂直底面侧棱三棱锥)
    const res = calculateVerticalEdgeModel(a, b, h);
    quantities.push(
      {
        label: "底面直角边 a, b",
        symbol: "a, b",
        value: `${a}, ${b}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "底面外接圆半径 r_底",
        symbol: "r_{\\text{底}}",
        value: Number(res.rBase.toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "垂直侧棱长 h (高差距 h/2)",
        symbol: "h, \\frac{h}{2}",
        value: `${h}, ${(h / 2).toFixed(2)}`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "外接球半径 R (汉堡模型)",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "侧棱垂直底面模型（汉堡套柱半径公式）",
        latex:
          "R = \\sqrt{r_{\\text{底}}^2 + \\left(\\frac{\\color{#059669}{h}}{2}\\right)^2} = \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{h}^2}",
        level: "important",
        note: "当侧棱 PA ⊥ 底面 ABC 时，球心 O 垂直投影到底面为底面外接圆心 O₁，球心到底面距离等于侧棱高 h 的一半",
      },
      {
        name: "底面外接圆半径 r_底 定理",
        latex:
          "r_{\\text{底}} = \\frac{\\sqrt{\\color{#EF4444}{a}^2+\\color{#D97706}{b}^2}}{2}",
        level: "important",
        note: "直角三角形底面斜边中点即为外接圆心 O₁",
      },
    );

    gaokaoPoints.push(
      {
        text: "【汉堡模型/侧棱垂直底面】：一条侧棱 PA ⊥ 底面 ABC，球心 O 到底面距离必为 h/2。关键先求底面外接圆半径 r_底，再套用勾股公式 R² = r_底² + (h/2)²。",
        importance: "gaokao",
      },
      {
        text: "【高考解题秒杀】：若底面为直角三角形，r_底 = 斜边/2，则 R = ½ √(a² + b² + h²)。",
        importance: "hard",
      },
    );
  } else if (modelType === "inSphere") {
    // 内切球模型 (等体积法)
    const res = calculateInSphereModel(a, b, c);
    quantities.push(
      {
        label: "三棱锥三条直角棱 a, b, c",
        symbol: "a, b, c",
        value: `${a}, ${b}, ${c}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "三棱锥总体积 V",
        symbol: "V_{\\text{总}}",
        value: Number(res.totalVolume.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "三棱锥总表面积 S_总",
        symbol: "S_{\\text{总}}",
        value: Number(res.totalArea.toFixed(4)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "内切球半径 r_in (等体积法)",
        symbol: "r_{\\text{in}}",
        value: Number(res.inRadius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "多面体内切球半径公式（等体积法剖分）",
        latex:
          "\\begin{aligned} V_{\\text{总}} &= \\frac{1}{3} S_{\\text{总}} r_{\\text{in}} \\\\ &= \\frac{1}{3}(S_1 + S_2 + S_3 + S_4) r_{\\text{in}} \\\\ \\implies r_{\\text{in}} &= \\frac{3 V_{\\text{总}}}{S_{\\text{总}}} \\end{aligned}",
        level: "important",
        note: "以内切球球心 O_in 为共同顶点，向 4 个面画半径垂线段 r_in，将多面体剖分为 4 个以各面为底面的小三棱锥",
      },
      {
        name: "直角三棱锥各面面积计算",
        latex:
          "\\begin{aligned} S_{\\text{总}} &= S_{\\text{直角面}} + S_{\\text{斜面}} \\\\ &= \\frac{1}{2}(\\color{#EF4444}{a}\\color{#D97706}{b} + \\color{#EF4444}{a}\\color{#059669}{c} + \\color{#D97706}{b}\\color{#059669}{c}) \\\\ &\\quad + \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2\\color{#D97706}{b}^2 + \\color{#EF4444}{a}^2\\color{#059669}{c}^2 + \\color{#D97706}{b}^2\\color{#059669}{c}^2} \\end{aligned}",
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【内切球高考通法——等体积法】：任何有内切球的多面体，其内切球半径 r_in 均满足 r_in = 3V / S_总。求出几何体总体积 V 与总表面积 S_总 即可求出 r_in。",
      importance: "gaokao",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}

// ── know-solid-folding: 平面图形折叠与翻折二面角 ──

export function buildSolidFoldingPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const model = (config?.model as string) ?? "trapezoid";
  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const h = params.h ?? 3;
  const alphaDeg = params.alphaDeg ?? 90;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (model === "trapezoid") {
    const res = calculateRightTrapezoidFolding(a, b, h, alphaDeg);
    const D_prime = res.points["D'"];

    quantities.push(
      {
        label: "翻折二面角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 D' 空间坐标",
        symbol: "D'",
        value: `(${D_prime.x.toFixed(2)}, ${D_prime.y.toFixed(2)}, ${D_prime.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "变动线段 D'A 长度",
        symbol: "|D'A|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "翻折四棱锥 D'-ABCE 体积",
        symbol: "V_{D'-ABCE}",
        value: Number(res.pyramidVolume.toFixed(3)),
        color: MATH_COLORS.accent,
      },
      {
        label: "面面法向量夹角",
        symbol: "\\langle\\vec{n}_1, \\vec{n}_2\\rangle",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "二面角的平面角定义定理",
        latex: "\\angle D'EA \\text{ 为二面角 } D'-EC-A \\text{ 的平面角}",
        level: "core",
        condition: "折痕为 EC，在两半平面内分别作 ED' ⊥ EC, EA ⊥ EC",
      },
      {
        name: "动点 D' 空间坐标参数化公式",
        latex: `D' = (\\color{#D97706}{b} + (\\color{#EF4444}{a}-\\color{#D97706}{b})\\cos\\color{#EF4444}{\\alpha},\\; 0,\\; (\\color{#EF4444}{a}-\\color{#D97706}{b})\\sin\\color{#EF4444}{\\alpha})`,
        level: "important",
        note: "以 A 为原点，AD 为 x 轴，AB 为 y 轴建立空间直角坐标系",
      },
      {
        name: "变动线段 D'A 长度公式",
        latex: `|D'A|^2 = (\\color{#D97706}{b} + (\\color{#EF4444}{a}-\\color{#D97706}{b})\\cos\\color{#EF4444}{\\alpha})^2 + ((\\color{#EF4444}{a}-\\color{#D97706}{b})\\sin\\color{#EF4444}{\\alpha})^2`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考折叠第(1)问几何证明】：翻折前后 EC ⊥ BC 且 EC ⊥ ED'，故 EC ⊥ 平面 D'EA 恒成立。若 α = 90°，则平面 CDE ⊥ 底面 ABCE。",
        importance: "gaokao",
      },
      {
        text: "【高考折叠第(2)问向量建系】：以 A 为原点，射线 AB 为 y 轴，AD 为 x 轴，过 A 作底面垂线为 z 轴，带入动点 D' 坐标求线面角/二面角。",
        importance: "gaokao",
      },
    );
  } else if (model === "rectangleDiagonal") {
    const res = calculateRectangleDiagonalFolding(a, b, alphaDeg);
    const A_prime = res.points["A'"];

    quantities.push(
      {
        label: "翻折二面角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 A' 空间坐标",
        symbol: "A'",
        value: `(${A_prime.x.toFixed(2)}, ${A_prime.y.toFixed(2)}, ${A_prime.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "变动线段 A'C 长度",
        symbol: "|A'C|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "异面直线 A'D 与 BC 夹角",
        symbol: "\\theta(A'D, BC)",
        value: `${res.skewLinesAngleDeg?.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "三棱锥 A'-BCD 外接球半径 R",
        symbol: "R",
        value: Number(res.circumSphereRadius?.toFixed(3)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "三棱锥 A'-BCD 体积 V",
        symbol: "V_{A'-BCD}",
        value: Number(res.pyramidVolume.toFixed(3)),
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "外接球半径不变量定理（新高考必考）",
        latex: `R = \\frac{BD}{2} = \\frac{\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}}{2}`,
        level: "core",
        note: "△A'BD 和 △CBD 均为 Rt△ 且共斜边 BD，球心始终为 BD 中点，半径恒定不变！",
      },
      {
        name: "异面直线 A'D ⊥ BC 临界角公式",
        latex: `\\cos\\color{#EF4444}{\\alpha_\\perp} = \\frac{\\color{#D97706}{b}^2}{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}`,
        level: "important",
        note: res.criticalPerpAlphaDeg
          ? `当 α = ${res.criticalPerpAlphaDeg}° 时，异面直线 A'D 与 BC 严格垂直`
          : "根据空间向量数量积点乘为零求出",
      },
      {
        name: "三棱锥体积最大值定理",
        latex: `V_{\\max} = \\frac{\\color{#EF4444}{a}^2 \\color{#D97706}{b}^2}{6\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}} \\quad (\\color{#EF4444}{\\alpha} = 90^\\circ \\text{ 时取得})`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "【矩形对角线翻折外接球破题口诀】：共斜边双直角，斜边中点定球心；不论二面角如何翻折，外接球半径 R 恒等于斜边的一半！",
        importance: "gaokao",
      },
      {
        text: "【异面直线垂直探究】：通过向量点乘 \\vec{DA'} · \\vec{BC} = 0，可精确解出异面垂直时的二面角 \\alpha_\\perp。",
        importance: "gaokao",
      },
    );
  } else if (model === "triangleAltitude") {
    const res = calculateTriangleAltitudeFolding(a, h, alphaDeg);
    const C_prime = res.points["C'"];

    quantities.push(
      {
        label: "翻折二面角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 C' 空间坐标",
        symbol: "C'",
        value: `(${C_prime.x.toFixed(2)}, ${C_prime.y.toFixed(2)}, ${C_prime.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "变动底边 BC' 长度",
        symbol: "|BC'|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "三棱锥 A-BC'D 体积 V",
        symbol: "V_{A-BC'D}",
        value: Number(res.pyramidVolume.toFixed(3)),
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "等腰三角形高折叠变动底边公式",
        latex: `|BC'| = \\color{#EF4444}{a} \\cos \\left(\\frac{\\color{#EF4444}{\\alpha}}{2}\\right)`,
        level: "core",
        note: "折痕 AD ⊥ DB 且 AD ⊥ DC'，∠BDC' = π − α（B 与 C' 分在折痕两侧），由余弦定理 |BC'|² = 2(a/2)²(1+cosα) = a²cos²(α/2)",
      },
      {
        name: "α = 90° 墙角模型外接球定理",
        latex: `R = \\frac{\\sqrt{\\color{#059669}{h}^2 + 2 \\cdot (\\color{#EF4444}{a}/2)^2}}{2} = \\frac{\\sqrt{\\color{#059669}{h}^2 + \\frac{\\color{#EF4444}{a}^2}{2}}}{2}`,
        level: "important",
        condition: "当 α = 90° 时，DA, DB, DC' 两两垂直组成墙角模型",
      },
    );

    gaokaoPoints.push({
      text: "【等腰三角形折叠与墙角模型】：沿高 AD 折叠至 α = 90° 时，三条侧棱 DA ⊥ DB, DA ⊥ DC', DB ⊥ DC' 两两垂直，可直接补形为长方体求外接球与体积。",
      importance: "gaokao",
    });
  } else {
    // rhombus
    const res = calculateRhombusFolding(a, alphaDeg);
    const A_prime = res.points["A'"];

    quantities.push(
      {
        label: "菱形边长 a",
        symbol: "a",
        value: a,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "翻折二面角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 A' 空间坐标",
        symbol: "A'",
        value: `(${A_prime.x.toFixed(2)}, ${A_prime.y.toFixed(2)}, ${A_prime.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "对角顶点距离 |A'C|",
        symbol: "|A'C|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "异面直线 A'C 与 BD 夹角",
        symbol: "\\theta",
        value: "90.00° (恒垂直)",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "菱形折叠异面直线恒垂直定理",
        latex: `BD \\perp A'O, BD \\perp CO \\Rightarrow BD \\perp \\text{面 } A'OC \\Rightarrow BD \\perp A'C`,
        level: "core",
        note: "无论翻折二面角 α 如何改变，异面直线 A'C 与折痕 BD 永远垂直",
      },
      {
        name: "对角顶点距离余弦定理",
        latex: `|A'C|^2 = \\frac{3}{2} \\color{#EF4444}{a}^2 (1 - \\cos\\color{#EF4444}{\\alpha})`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【菱形折叠重要结论】：由于对角线 BD 垂直于中线 A'O 和 CO，故 BD 垂直于平面 A'OC，因此异面直线 BD ⊥ A'C 在任意翻折角度下恒成立！",
      importance: "gaokao",
    });
  }

  if (alphaDeg === 0 || alphaDeg === 180) {
    warnings.push({
      text: `翻折二面角 α = ${alphaDeg}°，图形退化为平面图形！`,
      level: "warning",
    });
  } else if (alphaDeg === 90) {
    warnings.push({
      text: "翻折二面角 α = 90°，两半平面垂直！高线达到最大值，四面体体积取得极大值。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "折前折后辨不变，面内几何度量同；二面求角两垂线，向量建系通法全。",
  };
}

// ── know-solid-parametric: 空间向量与动点存在性、最值问题 ──

export function buildParametricPointPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.activeMode as string) ?? "singlePointAngle";
  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const c = params.c ?? 3;
  const lambda = params.lambda ?? 0.5;
  const mu = params.mu ?? 0.5;
  const targetThetaDeg = params.targetThetaDeg ?? 45;
  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (mode === "singlePointAngle") {
    const res = calculateSinglePointAngle(a, b, c, lambda, targetThetaDeg);

    quantities.push(
      {
        label: "动点参数 λ",
        symbol: "\\lambda = \\frac{BP}{BB_1}",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 P 空间坐标",
        symbol: "P",
        value: `(${a}, 0, ${(lambda * c).toFixed(2)})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "截面 PAC 法向量 n",
        symbol: "\\vec{n}(\\lambda)",
        value: `(${res.nPAC.x.toFixed(1)}, ${res.nPAC.y.toFixed(1)}, ${res.nPAC.z.toFixed(1)})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "点 D 到平面 PAC 距离 d",
        symbol: "d(\\lambda)",
        value: Number(res.distDToPAC.toFixed(3)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "二面角 P-AC-B 大小",
        symbol: "\\theta(\\lambda)",
        value: `${res.dihedralDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: `目标二面角 ${targetThetaDeg}° 求解`,
        symbol: "\\lambda_{\\text{目标}}",
        value: res.isTargetDihedralExist
          ? `${res.lambdaTargetDihedral} (存在)`
          : `${res.rawLambdaTarget.toFixed(2)} (超界不存在)`,
        color: res.isTargetDihedralExist
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.highlight,
      },
      {
        label: "DP ⊥ AC₁ 存在性求解",
        symbol: "\\lambda_{\\text{直角}}",
        value: res.isPerpExist ? `${res.lambdaPerpDP_AC1}` : "无解 (不存在)",
        color: res.isPerpExist
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "空间动点向量坐标化定理",
        latex: `\\vec{OP}(\\lambda) = (1-\\lambda)\\vec{OB} + \\lambda \\vec{OB_1} = (a, 0, \\lambda c)`,
        level: "core",
        condition: "λ ∈ [0, 1] 决定动点在线段/棱上的相对位置",
      },
      {
        name: "二面角与点面距离动参表达式",
        latex: `d(\\lambda) = \\frac{a b c \\lambda}{\\sqrt{\\lambda^2 c^2(a^2+b^2) + a^2 b^2}}, \\quad \\cos \\theta(\\lambda) = \\frac{a b}{\\sqrt{\\lambda^2 c^2(a^2+b^2) + a^2 b^2}}`,
        level: "core",
      },
      {
        name: "目标二面角反解方程与区间检验",
        latex: `\\cos \\theta(\\lambda) = \\cos \\theta_0 \\;\\Rightarrow\\; \\lambda = \\frac{a b \\tan \\theta_0}{c \\sqrt{a^2+b^2}}`,
        level: "important",
        note: `当前目标角度 θ₀ = ${targetThetaDeg}°，求得 λ = ${res.rawLambdaTarget.toFixed(2)} (${res.isTargetDihedralExist ? "在棱 BB₁ 上存在" : "超出 [0,1] 不存在"})`,
      },
      {
        name: "动点存在性探究（向量垂直充要条件）",
        latex: `\\vec{DP} \\cdot \\vec{AC_1} = 0 \\;\\Leftrightarrow\\; a^2 - b^2 + \\lambda c^2 = 0 \\;\\Rightarrow\\; \\lambda = \\frac{b^2 - a^2}{c^2}`,
        level: "important",
        note: "当且仅当方程解出的 λ ∈ [0, 1] 时，棱 BB₁ 上存在点 P 满足垂直条件",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考探究存在性核心解题套路】① 设动点比例参数 λ ∈ [0, 1] 表达点 P 坐标；② 根据几何条件（线面角/二面角/垂直/平行）列出关于 λ 的向量方程；③ 解方程并检验解是否落于 [0, 1] 闭区间。有解则存在，无解则不存在。",
        importance: "gaokao",
      },
      {
        text: "【单调性与最值】二面角余弦 cosθ(λ) 随 λ 增加单调递减（角度 θ 增大）。当 λ=0 时 cosθ=1（θ=0°，退化）；当 λ=1 时达到该棱上的二面角最大值。",
        importance: "gaokao",
      },
    );

    if (lambda === 0) {
      warnings.push({
        text: "λ = 0 时动点 P 退化落于顶点 B 处，截面 PAC 退化为底面边 AC (直线)！",
        level: "warning",
      });
    }
  } else if (mode === "doublePointDistance") {
    const res = calculateDoublePointDistance(a, b, c, lambda, mu);

    quantities.push(
      {
        label: "动点 P 比例 λ",
        symbol: "\\lambda",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 Q 比例 μ",
        symbol: "\\mu",
        value: Number(mu.toFixed(2)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "动线段 PQ 长度",
        symbol: "|PQ|",
        value: Number(res.distPQ.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "异面公垂线段最小距离",
        symbol: "|PQ|_{\\min}",
        value: Number(res.minDistSkew.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "向量 AP · DQ 数量积",
        symbol: "\\vec{AP} \\cdot \\vec{DQ}",
        value: Number(res.dotAP_DQ.toFixed(2)),
        color: MATH_COLORS.secondary,
      },
    );

    theorems.push(
      {
        name: "双动点距离二次型最值定理",
        latex: `|PQ|^2(\\lambda, \\mu) = a^2(1-\\mu)^2 + b^2 \\mu^2 + \\lambda^2 c^2 = (a^2+b^2)\\left(\\mu - \\frac{a^2}{a^2+b^2}\\right)^2 + \\frac{a^2b^2}{a^2+b^2} + \\lambda^2 c^2`,
        level: "core",
        note: "通过配方法分离变量：当 λ=0 且 μ=a²/(a²+b²) 时取得严格最小值",
      },
      {
        name: "异面直线公垂线段最小距离",
        latex: `d_{\\min} = \\frac{a b}{\\sqrt{a^2 + b^2}}`,
        level: "important",
        condition: "公垂线段同时垂直于异面直线 AC 与 BB₁",
      },
    );

    gaokaoPoints.push({
      text: "【高考双动点最值解法】对于双参数 (λ, μ) 最值问题，利用配方法化简二次多元函数，独立求解各个独立项的极小值，即可得出最值与取最值时的空间位置。",
      importance: "gaokao",
    });

    if (Math.abs(mu - res.optimalMu) < 0.02 && lambda === 0) {
      warnings.push({
        text: `当前双动点 P, Q 处于异面直线公垂线段两端点位置，|PQ| 达到全局极小值 d_min = ${res.minDistSkew.toFixed(2)}！`,
        level: "info",
      });
    }
  } else if (mode === "pyramidVolumeExtrema") {
    const res = calculatePyramidVolumeExtrema(a, b, c, lambda);

    quantities.push(
      {
        label: "动点 P 比例 λ",
        symbol: "\\lambda",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 P 空间高度 h",
        symbol: "h(\\lambda) = \\lambda c",
        value: Number(res.heightH.toFixed(2)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "固定底面 △ACD 面积",
        symbol: "S_{\\Delta ACD}",
        value: Number(res.baseAreaACD.toFixed(2)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "三棱锥 P-ACD 动态体积",
        symbol: "V_{P-ACD}(\\lambda)",
        value: Number(res.volumePACD.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "三棱锥体积最大极值",
        symbol: "V_{\\max}",
        value: Number(res.maxVolumePACD.toFixed(3)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "动点三棱锥体积极值定理（动高模型）",
        latex: `V(\\lambda) = \\frac{1}{3} S_{\\Delta ACD} \\cdot h(\\lambda) = \\frac{1}{6} a b (\\lambda c) \\le \\frac{1}{6} a b c = V_{\\max}`,
        level: "core",
        condition: "当 λ = 1.0 (动点 P 到达顶点 B₁) 时取最大体积",
      },
      {
        name: "等底同高体积转换原理",
        latex: `V_{P-ACD} = V_{D-PAC} = \\frac{1}{3} S_{\\Delta PAC} \\cdot d_{D-\\text{面}}`,
        level: "important",
        note: "等体积法是高考解答题中求空间点到截面距离的核心转化桥梁",
      },
    );

    gaokaoPoints.push({
      text: "【高考体积极值考法】立体几何体积极值题型中，通常有一面面积为定值（如此处的底面 △ACD），动点在棱上移动使得高线线性变化，极值点必在边界端点处取得。",
      importance: "gaokao",
    });

    if (lambda === 0) {
      warnings.push({
        text: "λ = 0 时动点 P 位于底面内，三棱锥高度退化为 0，体积退化为 0！",
        level: "warning",
      });
    } else if (lambda === 1) {
      warnings.push({
        text: `λ = 1.0 时动点 P 到达顶端 B₁，三棱锥高度达到最大值 c = ${c}，体积达到全局最大极值 V_max = ${res.maxVolumePACD.toFixed(2)}！`,
        level: "info",
      });
    }
  } else {
    // surfaceShortestPath
    const res = calculateSurfacePath(a, b, c, lambda);

    quantities.push(
      {
        label: "动点 P 比例 λ",
        symbol: "\\lambda",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "当前折线段 A-P-C₁ 长度",
        symbol: "|AP| + |PC_1|",
        value: Number(res.currentPathLength.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "侧面展开路径 1 最短长",
        symbol: "L_{\\text{侧}}",
        value: Number(res.path1Length.toFixed(3)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "最佳折点 λ₁",
        symbol: "\\lambda_1 = \\frac{a}{a+b}",
        value: Number(res.optimalLambda1.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "底面展开路径 2 最短长",
        symbol: "L_{\\text{底}}",
        value: Number(res.path2Length.toFixed(3)),
        color: MATH_COLORS.primary,
      },
      {
        label: "全局表面最短距离",
        symbol: "L_{\\min}",
        value: Number(res.globalMinLength.toFixed(3)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "多面体表面动点最短路径定理 (平面展开法)",
        latex: `L_{\\text{侧}} = \\sqrt{(a+b)^2 + c^2}, \\quad L_{\\text{底}} = \\sqrt{a^2 + (b+c)^2}`,
        level: "core",
        note: "两点之间直线段最短。将 3D 几何面沿折痕展开为 2D 矩形，直线连接起点与终点",
      },
      {
        name: "相似三角形反解侧棱交点",
        latex: `\\lambda_1 = \\frac{a}{a+b} \\;\\Rightarrow\\; z_{P_1} = \\frac{a c}{a + b}`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【立体几何表面最短路径通法】“化曲为平，展成平面”。分类讨论所有可能的展开途径，利用勾股定理求出各展开平面上的直线段长度，取其中的最小值。",
      importance: "gaokao",
    });

    if (Math.abs(lambda - res.optimalLambda1) < 0.02) {
      warnings.push({
        text: `动折点 P 此时正处于侧面展开直线的交点处 (λ = ${res.optimalLambda1.toFixed(2)})，折线路径取得侧面最短距离 L = ${res.path1Length.toFixed(2)}！`,
        level: "info",
      });
    }
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}

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
