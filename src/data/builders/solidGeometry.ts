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
  sphereVolume,
  sphereSurfaceArea,
} from "@/math3d/solidGeometry";
import {
  judgeLinePlane,
  getLineDirection,
  calcLinePlaneAngle,
} from "@/math3d/lineRelation";
import type { Vec3 } from "@/math3d/vector3";
import type { Plane } from "@/math3d/plane";

// ── know-solid-angle: 空间角（长方体截面二面角） ──

export function buildSpatialAnglePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "skewLines";
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  const ex = params.ex ?? 1.2;

  const quantities: MathQuantity[] = [
    {
      label: "长方体长 a",
      symbol: "a",
      value: a,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "长方体宽 b",
      symbol: "b",
      value: b,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "长方体高 c",
      symbol: "c",
      value: c,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "动点 E 高度",
      symbol: "z_E",
      value: ex,
      color: MATH_COLORS.highlight,
    },
  ];

  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (mode === "skewLines") {
    // 异面直线 DE (D(0,b,0), E(0,0,ex)) 与 AB1 (A(0,0,0), B1(a,0,c))
    // u = DE = (0, -b, ex), v = AB1 = (a, 0, c)
    const dot = ex * c;
    const lenU = Math.sqrt(b * b + ex * ex);
    const lenV = Math.sqrt(a * a + c * c);
    const cosVal = Math.min(1, Math.max(0, Math.abs(dot) / (lenU * lenV)));
    const angleRad = Math.acos(cosVal);
    const angleDeg = (angleRad * 180) / Math.PI;

    quantities.push(
      {
        label: "起点坐标 D",
        symbol: "D",
        value: `(0, ${b}, 0)`,
        color: MATH_COLORS.primary,
      },
      {
        label: "动点坐标 E",
        symbol: "E",
        value: `(0, 0, ${ex})`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "方向向量 u (DE)",
        symbol: "\\vec{u}",
        value: `(0, -${b}, ${ex})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "方向向量 v (AB₁)",
        symbol: "\\vec{v}",
        value: `(${a}, 0, ${c})`,
        color: MATH_COLORS.accent,
      },
      {
        label: "向量夹角余弦 cosθ",
        symbol: "\\cos\\theta",
        value: Number(cosVal.toFixed(4)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "异面直线所成的角",
        symbol: "\\theta",
        value: `${angleDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "异面直线所成角坐标公式",
        latex: `\\cos \\theta = \\frac{|\\vec{u} \\cdot \\vec{v}|}{|\\vec{u}||\\vec{v}|} = \\frac{|x_1 x_2 + y_1 y_2 + z_1 z_2|}{\\sqrt{x_1^2+y_1^2+z_1^2}\\sqrt{x_2^2+y_2^2+z_2^2}}`,
        level: "core",
        condition: "θ ∈ (0°, 90°]，异面直线角不能为钝角",
      },
      {
        name: "长方体建系顶点坐标",
        latex: `A(0,0,0),\\; B_1(a,0,c),\\; D(0,b,0),\\; E(0,0,z_E)`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "求异面直线所成角高考三步法：① 建立空间直角坐标系；② 确定两条直线的方向向量 u, v 的坐标；③ 代入余弦绝对值公式计算，范围必在 (0°, 90°] 内。",
      importance: "gaokao",
    });

    if (Math.abs(dot) < 0.001) {
      warnings.push({
        text: "方向向量内积 u · v = 0，异面直线 DE ⊥ AB₁，所成角达到最大极值 90°！",
        level: "warning",
      });
    }
  } else if (mode === "linePlane") {
    // 直线 BE (B(a,0,0), E(0,0,ex)) 与底面 ABCD (n0 = (0,0,1)) 的线面角
    const lenU = Math.sqrt(a * a + ex * ex);

    // 计算直线 BE 与底面 ABCD (n0 = (0,0,1)) 的线面角
    const sinThetaBase = ex / lenU;
    const angleBaseDeg = (Math.asin(sinThetaBase) * 180) / Math.PI;

    quantities.push(
      {
        label: "顶点坐标 B",
        symbol: "B",
        value: `(${a}, 0, 0)`,
        color: MATH_COLORS.primary,
      },
      {
        label: "方向向量 u (BE)",
        symbol: "\\vec{u}",
        value: `(-${a}, 0, ${ex})`,
        color: MATH_COLORS.primary,
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
        value: Number(sinThetaBase.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "直线与底面所成的角",
        symbol: "\\theta",
        value: `${angleBaseDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "直线与平面所成角坐标公式",
        latex: `\\sin \\theta = |\\cos \\langle \\vec{u}, \\vec{n} \\rangle| = \\frac{|\\vec{u} \\cdot \\vec{n}|}{|\\vec{u}||\\vec{n}|}`,
        level: "core",
        condition: "θ ∈ [0°, 90°]，正弦值等于方向向量与法向量夹角余弦的绝对值",
      },
      {
        name: "底面与斜线向量坐标",
        latex: `\\vec{u} = \\vec{BE} = (-a, 0, z_E),\\; \\vec{n_0} = (0,0,1)`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "高考大题核心考点：线面角使用的是正弦 sinθ！向量公式求出的是与法向量夹角的余弦，切记做 sinθ = |cos<u,n>| 的转换，不要直接写成 cosθ。",
      importance: "gaokao",
    });

    if (ex < 0.3) {
      warnings.push({
        text: "动点 E 接近底面 (z_E → 0)，直线 BE 接近落在底面内，线面角趋近于 0°！",
        level: "warning",
      });
    }
  } else {
    // dihedral: 二面角 (底面 ABCD 与 截面 BDE)
    // n1 = (0,0,1), n2 = (b*ex, a*ex, a*b)
    const n2X = b * ex;
    const n2Y = a * ex;
    const n2Z = a * b;
    const lenN1 = 1;
    const lenN2 = Math.sqrt(n2X * n2X + n2Y * n2Y + n2Z * n2Z);
    const cosVal = n2Z / (lenN1 * lenN2);
    const dihedralRad = Math.acos(cosVal);
    const dihedralDeg = (dihedralRad * 180) / Math.PI;

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
        value: `(${n2X.toFixed(1)}, ${n2Y.toFixed(1)}, ${(a * b).toFixed(1)})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "二面角余弦 cosθ",
        symbol: "\\cos\\theta",
        value: Number(cosVal.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "二面角 B-DE-A 大小",
        symbol: "\\theta",
        value: `${dihedralDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "二面角向量坐标公式",
        latex: `\\cos \\theta = \\pm \\frac{\\vec{n_1} \\cdot \\vec{n_2}}{|\\vec{n_1}||\\vec{n_2}|}`,
        level: "core",
        note: "通过计算两个平面的法向量 n₁, n₂ 夹角确定二面角（锐角用正值，钝角用负值）",
      },
      {
        name: "截面法向量求解方程组",
        latex: `\\begin{cases} \\vec{n_2} \\cdot \\vec{BD} = 0 \\\\ \\vec{n_2} \\cdot \\vec{BE} = 0 \\end{cases} \\;\\Rightarrow\\; \\vec{n_2} = (b z_E, a z_E, a b)`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "高考立体几何第(2)问满分步骤：① 设法向量 n=(x,y,z)；② 列出 n·v1=0 和 n·v2=0 方程组取特解；③ 计算 cos<n1,n2>；④ 根据图形几何直观明确说明“由图可知该二面角为锐角/钝角”。",
      importance: "gaokao",
    });

    if (dihedralDeg < 1 || dihedralDeg > 179) {
      warnings.push({
        text: "二面角接近 0° 或 180°，截面退化为共面！",
        level: "warning",
      });
    }
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}

// ── know-solid-position: 线面位置关系 ──

export function buildLinePlaneRelationPanel(
  params: Record<string, number>,
  config?: Record<string, any>,
): MathPanelData {
  const mode = config?.mode ?? "parallel";
  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 30;
  const intersectType = params.intersectType ?? 1;

  const plane: Plane = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  };

  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const pointOnLine: Vec3 = { x: 0, y: 0, z: zHeight };
  const relation = judgeLinePlane(lineDir, plane, pointOnLine);
  const angleInfo = calcLinePlaneAngle(lineDir, plane.normal);

  const relationText =
    relation === "parallel"
      ? "线面平行 (l ∥ α)"
      : relation === "perpendicular"
        ? "线面垂直 (l ⊥ α)"
        : relation === "inPlane"
          ? "线在面内 (l ⊂ α)"
          : "线面相交 (l ∩ α = P)";

  const quantities: MathQuantity[] = [
    {
      label: "直线高度 h",
      symbol: "h",
      value: Number(zHeight.toFixed(2)),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "线面倾角 θ",
      symbol: "\\theta",
      value: `${thetaDeg.toFixed(1)}°`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "线面角正弦 sinθ",
      symbol: "\\sin\\theta",
      value: Number(angleInfo.sinTheta.toFixed(3)),
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "位置关系",
      value: relationText,
      color:
        relation === "perpendicular" || relation === "parallel"
          ? MATH_COLORS.highlight
          : MATH_COLORS.primary,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "线面平行判定定理 (几何法)",
      latex: `\\begin{cases} l \\not\\subset \\alpha \\\\ m \\subset \\alpha \\\\ l \\parallel m \\end{cases} \\;\\Rightarrow\\; l \\parallel \\alpha`,
      level: "core",
      condition: "平面外一条直线与平面内一条直线平行",
    },
    {
      name: "线面垂直判定定理 (几何法)",
      latex: `\\begin{cases} l \\perp a, \\; l \\perp b \\\\ a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\end{cases} \\;\\Rightarrow\\; l \\perp \\alpha`,
      level: "core",
      condition: "直线与平面内两条相交直线都垂直 (相交是必要条件)",
    },
    {
      name: "空间向量法判定定理",
      latex: `\\vec{l} \\cdot \\vec{n} = 0 \\;(l \\not\\subset \\alpha) \\Rightarrow l \\parallel \\alpha, \\quad \\vec{l} \\parallel \\vec{n} \\Rightarrow l \\perp \\alpha`,
      level: "core",
      condition: "利用直线方向向量 l 与平面法向量 n 判断",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "立体几何大题第一问常考几何法判定平行/垂直；第二问建系用向量法求线面角 sinθ = |cos<l, n>|。",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];

  if (mode === "perpendicular" && intersectType === 0) {
    warnings.push({
      text: "当前演示：平面内两条直线 a ∥ b。此时即使直线 l 分别垂直于 a 和 b，l 依然可以左右倾斜（斜交），无法导出 l ⊥ α！线面垂直判定必须强调两直线【相交】。",
      level: "danger",
    });
  }

  if (zHeight === 0 && thetaDeg === 0) {
    warnings.push({
      text: "当前 h = 0 且 θ = 0°，直线完全贴合在平面内 (l ⊂ α)。线面平行的严格前提条件是直线在平面外 (l ⊄ α)。",
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}

// ── know-solid-ball: 外接球与内切球 ──

export function buildCircumSpherePanel(
  params: Record<string, number>,
): MathPanelData {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;

  const R = cuboidCircumRadius(a, b, c);
  const V = sphereVolume(R);
  const S = sphereSurfaceArea(R);

  const quantities: MathQuantity[] = [
    {
      label: "长方体棱长",
      symbol: "a",
      value: a,
      color: "#2563EB",
    },
    {
      label: "长方体棱宽",
      symbol: "b",
      value: b,
      color: "#059669",
    },
    {
      label: "长方体棱高",
      symbol: "c",
      value: c,
      color: "#D97706",
    },
    {
      label: "外接球半径",
      symbol: "R",
      value: R.toFixed(4),
      color: "#DC2626",
    },
    {
      label: "外接球体积",
      symbol: "V",
      value: V.toFixed(4),
      color: "#8B5CF6",
    },
    {
      label: "外接球表面积",
      symbol: "S",
      value: S.toFixed(4),
      color: "#EC4899",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "长方体外接球半径",
      latex: `R = \\frac{\\sqrt{a^2 + b^2 + c^2}}{2}`,
      level: "core",
      note: "长方体体对角线的一半即为外接球半径",
    },
    {
      name: "球体积公式",
      latex: `V = \\frac{4}{3}\\pi R^3`,
      level: "important",
    },
    {
      name: "球表面积公式",
      latex: `S = 4\\pi R^2`,
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "外接球问题的核心是找到球心位置（到各顶点距离相等的点），长方体的外接球球心即为体对角线中点。",
      importance: "gaokao",
    },
    {
      text: "正棱锥外接球半径公式 R = (r²+h²)/(2h)，其中 r 为底面外接圆半径，h 为高。",
      importance: "hard",
    },
  ];

  return { quantities, theorems, gaokaoPoints, warnings: [] };
}

// ── know-solid-rotation-body: 旋转体的结构特征 ──

export function buildRotationBodyPanel(
  params: Record<string, number>,
): MathPanelData {
  const shape =
    ((params as Record<string, unknown>).shape as string) ?? "rectangle";
  const r1 = params.r1 ?? 1.5;
  const r2 = params.r2 ?? 0.8;
  const height = params.height ?? 3;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];

  if (shape === "rectangle") {
    const sSide = 2 * Math.PI * r1 * height;
    const sBase = Math.PI * r1 ** 2;
    const sTotal = sSide + 2 * sBase;
    const sAxial = 2 * r1 * height;
    const v = Math.PI * r1 ** 2 * height;

    quantities.push(
      {
        label: "轴截面积",
        symbol: "S_{轴}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "全面积",
        symbol: "S_{全}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.complexNum,
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
        name: "圆柱侧面积与全面积",
        latex: "S_{侧}=2\\pi r h,\\; S_{全}=2\\pi r(r+h)",
        level: "core",
      },
      {
        name: "圆柱体积公式",
        latex: "V=\\pi r^2 h = S_{底} h",
        level: "core",
      },
      {
        name: "轴截面特征",
        latex: "S_{轴}=2rh,\\; d=\\sqrt{4r^2+h^2}",
        level: "important",
        note: "轴截面为矩形，长 2r，高 h",
      },
    );
  } else if (shape === "rightTriangle") {
    const l = Math.sqrt(r1 ** 2 + height ** 2);
    const angleDeg = (r1 / l) * 360;
    const sSide = Math.PI * r1 * l;
    const sBase = Math.PI * r1 ** 2;
    const sTotal = sSide + sBase;
    const sAxial = r1 * height;
    const v = (Math.PI * r1 ** 2 * height) / 3;

    quantities.push(
      {
        label: "母线长",
        symbol: "l",
        value: l.toFixed(2),
        color: MATH_COLORS.complexNum,
      },
      {
        label: "展开角",
        symbol: "\\alpha",
        value: `${angleDeg.toFixed(1)}°`,
        color: MATH_COLORS.sequenceCobweb,
      },
      {
        label: "轴截面积",
        symbol: "S_{轴}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "全面积",
        symbol: "S_{全}",
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
        name: "圆锥母线与侧面积",
        latex: "l=\\sqrt{r^2+h^2},\\; S_{侧}=\\pi r l",
        level: "core",
      },
      {
        name: "圆锥全面积与体积",
        latex: "S_{全}=\\pi r(l+r),\\; V=\\dfrac{1}{3}\\pi r^2 h",
        level: "core",
      },
      {
        name: "侧面展开图圆心角",
        latex: "\\alpha = \\dfrac{r}{l} \\cdot 360^\\circ",
        level: "important",
        condition: "高考侧面上蚂蚁爬行最速折线（化曲为直）核心公式",
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

    quantities.push(
      {
        label: "母线长",
        symbol: "l",
        value: l.toFixed(2),
        color: MATH_COLORS.complexNum,
      },
      {
        label: "轴截面积",
        symbol: "S_{轴}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "全面积",
        symbol: "S_{全}",
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
        name: "圆台母线与侧面积",
        latex: "l=\\sqrt{(r_1-r_2)^2+h^2},\\; S_{侧}=\\pi(r_1+r_2)l",
        level: "core",
      },
      {
        name: "圆台体积公式",
        latex: "V=\\dfrac{1}{3}\\pi h(r_1^2+r_1r_2+r_2^2)",
        level: "core",
      },
      {
        name: "柱锥台体积统一公式",
        latex: "V=\\dfrac{1}{3}h(S_1+\\sqrt{S_1 S_2}+S_2)",
        level: "important",
        note: "r₂=r₁ (S₁=S₂) 时演化为圆柱 V=Sh；r₂=0 (S₁=0) 时演化为圆锥 V=⅓Sh",
      },
    );
  } else {
    // semicircle → sphere
    const sGreatCircle = Math.PI * r1 ** 2;
    const sTotal = 4 * Math.PI * r1 ** 2;
    const v = (4 / 3) * Math.PI * r1 ** 3;

    quantities.push(
      {
        label: "截面大圆面积",
        symbol: "S_{大圆}",
        value: sGreatCircle.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "球表面积",
        symbol: "S",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "球体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight,
      },
    );
    theorems.push(
      {
        name: "球表面积与体积",
        latex: "S=4\\pi R^2,\\; V=\\dfrac{4}{3}\\pi R^3",
        level: "core",
      },
      {
        name: "球的截面圆性质定理",
        latex: "r_{截} = \\sqrt{R^2 - d^2}",
        level: "important",
        note: "d 为球心到截面距离，截面积 S_截 = π(R²-d²)",
      },
    );
  }

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "旋转体由平面图形绕轴旋转 360° 形成。轴截面（矩形、等腰三角形、等腰梯形、大圆）是把 3D 旋转体问题降维至 2D 平面图形求解的核心钥匙。",
      importance: "core",
    },
    {
      text: "侧面展开图（化曲为直）：求解圆锥/圆柱侧面曲面上两点间最短距离（蚂蚁爬行路径）时，必须先将侧面沿母线展开，圆锥展开为扇形（圆心角 α = r/l · 360°）。",
      importance: "gaokao",
    },
    {
      text: "柱锥台公式统一思想：熟练掌握台体体积公式 V = ⅓h(S₁ + √(S₁S₂) + S₂)。理解 r₂=r₁（圆柱）与 r₂=0（圆锥）时的极限演变。",
      importance: "gaokao",
    },
    {
      text: "切接问题与轴截面：旋转体与球的内切/外接模型是高考大题热点，通常通过轴截面中圆内接/切多边形几何关系直接求出球心与半径。",
      importance: "hard",
    },
  ];

  const warnings: WarningItem[] = [];
  if (shape === "rightTrapezoid") {
    if (Math.abs(r1 - r2) < 0.05) {
      warnings.push({
        text: "上、下底半径接近相等 (r₂ ≈ r₁)，圆台演变/退化为圆柱！",
        level: "warning",
      });
    } else if (r2 < 0.15) {
      warnings.push({
        text: "上底半径接近 0 (r₂ ≈ 0)，圆台演变/退化为圆锥！",
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
