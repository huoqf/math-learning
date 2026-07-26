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
      theorems.push({
        name: "长方体/补体模型外接球公式",
        latex: `R = \\frac{\\sqrt{a^2 + b^2 + c^2}}{2}`,
        level: "core",
        note: "体对角线长等于外接球直径 (2R = d)",
      });
      gaokaoPoints.push({
        text: "高考经典墙角补体法：凡具有三条两两垂直棱的立体图形（如直三棱柱、墙角三棱锥），均可补形为长方体求外接球半径 R = √(a²+b²+c²)/2。",
        importance: "gaokao",
      });
    } else if (shape === "regularPyramid") {
      // 正四棱锥 (底边长 a, 高 c)
      const rBase = a / Math.sqrt(2);
      radius = regularPyramidCircumRadius(rBase, c);
      quantities.push(
        {
          label: "底面边长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
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
      theorems.push({
        name: "正棱锥外接球公式 (截面法)",
        latex: `R = \\frac{r_{底}^2 + h^2}{2h} = \\frac{\\frac{a^2}{2} + h^2}{2h}`,
        level: "core",
        condition: "外接球球心位于过底面外心且垂直于底面的中心轴线上",
      });
      gaokaoPoints.push({
        text: "正棱锥外接球球心求法：球心在中心高线上，利用勾股定理 R² = r² + (h - R)² 解出 R = (r² + h²)/(2h)。",
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
      theorems.push({
        name: "圆锥外接球公式 (轴截面法)",
        latex: `R = \\frac{r^2 + h^2}{2h} = \\frac{l^2}{2h}`,
        level: "core",
        note: "在轴截面等腰三角形中，外接圆半径即为圆锥外接球半径",
      });
      gaokaoPoints.push({
        text: "旋转体切接问题降维法：过旋转轴作轴截面，圆锥外接球转化为轴截面三角形的外接圆半径 R = l² / (2h)。",
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
        note: "轴截面矩形的对角线长的一半即为外接球半径",
      });
      gaokaoPoints.push({
        text: "圆柱外接球球心在轴线中点，轴截面为矩形，矩形外接圆半径 R = √(r² + (h/2)²)。",
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
      radius = rBaseIn;
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
      radius = a;
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
