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

  const quantities: MathQuantity[] = [];

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

    // 公垂线向量 n_公 = u × v = (-b*c, a*ex, a*b)
    const nSkewX = -b * c;
    const nSkewY = a * ex;
    const nSkewZ = a * b;
    const lenNSkew = Math.sqrt(
      nSkewX * nSkewX + nSkewY * nSkewY + nSkewZ * nSkewZ,
    );
    // 异面直线距离 d_公 = |DA · n_公| / |n_公| = (a * b * ex) / lenNSkew
    const distSkew = (a * b * ex) / lenNSkew;

    quantities.push(
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
        label: "公垂线向量 n_公",
        symbol: "\\vec{n}_{\\text{公}}",
        value: `(${nSkewX.toFixed(1)}, ${nSkewY.toFixed(1)}, ${nSkewZ.toFixed(1)})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "异面直线间距离",
        symbol: "d_{\\text{异面}}",
        value: Number(distSkew.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
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
        name: "异面直线间的距离（公垂线法）",
        latex: `d_{\\text{异面}} = \\frac{|\\vec{P_1 P_2} \\cdot \\vec{n}_{\\text{公}}|}{|\\vec{n}_{\\text{公}}|}`,
        level: "important",
        note: "n_公 = u × v 为两条异面直线的公垂线方向向量，P1, P2 分别为两直线上任意一点",
      },
      {
        name: "长方体建系顶点坐标",
        latex: `A(0,0,0),\\; B_1(a,0,c),\\; D(0,b,0),\\; E(0,0,z_E)`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "求异面直线所成角高考三步法：① 建立空间直角坐标系；② 确定两条直线的方向向量 u, v 的坐标；③ 代入余弦绝对值公式计算，范围必在 (0°, 90°] 内。",
        importance: "gaokao",
      },
      {
        text: "异面直线间距离（公垂线法）：两条异面直线的距离即公垂线段长度，等于连接两线上任意两点 P₁P₂ 在公垂向量 n_公 方向上的投影长度。",
        importance: "gaokao",
      },
    );

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
  } else if (mode === "distance") {
    // distance: 点 A(0,0,0) 到截面 BDE 的垂直距离与三棱锥 E-ABD 体积极值
    const n2X = b * ex;
    const n2Y = a * ex;
    const n2Z = a * b;
    const lenN2 = Math.sqrt(n2X * n2X + n2Y * n2Y + n2Z * n2Z);
    // vector AB = (a, 0, 0), dot(AB, n2) = a * b * ex
    const dist = (a * b * ex) / lenN2;

    // 截面积 S_BDE = 1/2 * |n|
    const sBde = 0.5 * lenN2;
    // 底面积 S_ABD = 1/2 * a * b
    const sAbd = 0.5 * a * b;

    // 棱锥 E-ABD 体积 V = 1/3 * S_ABD * ex = 1/6 * a * b * ex
    const vol = (1 / 6) * a * b * ex;
    // 棱锥 E-ABD 体积最大极值 (E 到达 A1, z_E = c)
    const volMax = (1 / 6) * a * b * c;

    quantities.push(
      {
        label: "截面法向量 n",
        symbol: "\\vec{n}",
        value: `(${n2X.toFixed(1)}, ${n2Y.toFixed(1)}, ${(a * b).toFixed(1)})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "截面三角形面积 S_BDE",
        symbol: "S_{\\Delta BDE}",
        value: Number(sBde.toFixed(3)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "底面三角形面积 S_ABD",
        symbol: "S_{\\Delta ABD}",
        value: Number(sAbd.toFixed(3)),
        color: MATH_COLORS.primary,
      },
      {
        label: "点到平面距离 d",
        symbol: "d_{A-\\text{面}}",
        value: Number(dist.toFixed(4)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "三棱锥 E-ABD 当前体积",
        symbol: "V_{E-ABD}",
        value: Number(vol.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "三棱锥体积最大极值",
        symbol: "V_{\\max}",
        value: Number(volMax.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "向量法求点到平面的距离公式",
        latex: `d = \\frac{|\\vec{AP} \\cdot \\vec{n}|}{|\\vec{n}|}`,
        level: "core",
        note: "P 为平面内任意一点，A 为平面外一点，n 为平面的法向量",
      },
      {
        name: "等体积法（等积法）互验公式",
        latex: `V_{E-ABD} = \\frac{1}{3} S_{\\Delta BDE} \\cdot d = \\frac{1}{3} S_{\\Delta ABD} \\cdot z_E`,
        level: "important",
        note: "当求法向量复杂时，可利用等体积法 d = (3V) / S_底 反解距离",
      },
      {
        name: "动点体积极值定理",
        latex: `V(z_E) = \\frac{1}{6} a b z_E \\le \\frac{1}{6} a b c = V_{\\max}`,
        level: "important",
        condition: "当 z_E = c (即动点 E 重合顶点 A₁) 时取最大值",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考压轴问法必杀技：求点到平面的距离优先建系取法向量代用公式 d = |AP · n| / |n|。也可通过等体积法 V = 1/3 S d 避开法向量求解。",
        importance: "gaokao",
      },
      {
        text: "体积极值考点：由于底面 S_ABD 保持不变，三棱锥 E-ABD 体积随高 z_E 线性递增，当动点 E 移动到侧棱顶端 A₁ (z_E = c) 时达到最大体积。",
        importance: "gaokao",
      },
    );

    if (Math.abs(ex - c) < 0.05) {
      warnings.push({
        text: `动点 E 已到达侧棱顶端 A₁ (z_E = c = ${c})，三棱锥 E-ABD 体积达到最大极值 V_max = ${volMax.toFixed(2)}！`,
        level: "warning",
      });
    } else if (ex < 0.3) {
      warnings.push({
        text: "动点 E 接近底面 (z_E → 0)，三棱锥趋于扁平退化，点 A 到截面的距离 d 趋近于 0！",
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

// ── know-solid-position: 线面与面面位置关系 ──

export function buildLinePlaneRelationPanel(
  params: Record<string, number>,
  config?: Record<string, any>,
): MathPanelData {
  const mode = config?.mode ?? "parallel";
  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 30;
  const intersectType = params.intersectType ?? 1;

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
            name: "面面平行向量法判定",
            latex: `\\vec{n_1} \\parallel \\vec{n_2} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
            level: "core",
            condition: "两平面的法向量平行 (成比例)",
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
            name: "面面垂直向量法判定",
            latex: `\\vec{n_1} \\cdot \\vec{n_2} = 0 \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
            level: "core",
            condition: "两平面的法向量数量积为 0 (相互垂直)",
          },
        ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: isParallelMode
          ? "高考证明面面平行常用“线面平行→面面平行”：找到平面α内的两条相交直线分别平行于β。"
          : "高考证明面面垂直黄金法则：先在平面β内找到一条直线l，证明l垂直于平面α（线面垂直→面面垂直）。",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];

    return { quantities, theorems, gaokaoPoints, warnings };
  }

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

// ── know-solid-section: 多面体截面 ──

export function buildSectionPanel(
  params: Record<string, number>,
  config?: Record<string, any>,
): MathPanelData {
  const cutHeight = params.cutHeight ?? 2;
  const tiltDeg = params.tiltDeg ?? 0;
  const vertexCount =
    (config?.vertexCount as number) ?? (tiltDeg === 0 ? 4 : 5);
  const area3D = (config?.area3D as number) ?? 6.0;
  const areaProj = (config?.areaProj as number) ?? 6.0;
  const cosTheta = (config?.cosTheta as number) ?? 1.0;
  const thetaDeg = (config?.thetaDeg as number) ?? Math.abs(tiltDeg);
  const normalStr = (config?.normalStr as string) ?? "(0.00, 0.00, 1.00)";

  let shapeName = "四边形";
  if (vertexCount === 3) shapeName = "三角形";
  else if (vertexCount === 4) shapeName = "四边形 (矩形/梯形/菱形)";
  else if (vertexCount === 5) shapeName = "五边形";
  else if (vertexCount === 6) shapeName = "六边形 (含正六边形)";
  else if (vertexCount === 0) shapeName = "未切割 (无相交)";

  const quantities: MathQuantity[] = [
    {
      label: "截面形状",
      value: shapeName,
      color: MATH_COLORS.primary,
    },
    {
      label: "截面顶点数",
      symbol: "N",
      value: vertexCount,
      color: MATH_COLORS.highlight,
    },
    {
      label: "截面 3D 真实面积",
      symbol: "S_{\\text{截}}",
      value: `${area3D.toFixed(3)}`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "底面 2D 投影面积",
      symbol: "S_{\\text{投影}}",
      value: `${areaProj.toFixed(3)}`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "截面与底面夹角",
      symbol: "\\theta",
      value: `${thetaDeg.toFixed(1)}° (cosθ=${cosTheta.toFixed(3)})`,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "平面法向量",
      symbol: "\\boldsymbol{n}",
      value: normalStr,
      color: MATH_COLORS.secondary,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "射影面积定理 (高考核心推导)",
      latex: `S_{\\text{投影}} = S_{\\text{截}} \\cdot \\cos \\theta \\;\\Rightarrow\\; S_{\\text{截}} = \\frac{S_{\text{投影}}}{\\cos \\theta}`,
      level: "core",
      note: `当前数值验证: ${areaProj.toFixed(2)} / ${cosTheta.toFixed(3)} ≈ ${area3D.toFixed(2)}`,
    },
    {
      name: "截面作图交线法则与面面平行",
      latex: `\\alpha \\parallel \\beta \\; \\text{且} \\; \\gamma \\cap \\alpha = a, \\gamma \\cap \\beta = b \\;\\Rightarrow\\; a \\parallel b`,
      level: "important",
      note: "平面截多面体，多边形顶点数 ≤ 多面体面数。在正方体/长方体中，相对面交线必平行",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考选填题热点：正方体/长方体截面边数 N ∈ {3, 4, 5, 6}，绝不可能出现七边形！正六边形截面过正方体中心且垂直于体对角线。",
      importance: "gaokao",
    },
    {
      text: "高考大题技巧：利用空间向量求出法向量 n 后，无需求截面各边长，直接求出底面投影面积与二面角 cosθ，用 S_截 = S_投 / cosθ 快速解算截面积！",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];

  if (cosTheta < 1e-3) {
    warnings.push({
      text: "截面垂直于底面 (cosθ = 0)，底面投影退化为一条线段 (S_投影 = 0)，射影面积公式 S_截 = S_投 / cosθ 不适用！",
      level: "warning",
    });
  }

  if (cutHeight <= 0.1 || cutHeight >= 3.9) {
    warnings.push({
      text: "切割平面贴近多面体边界顶底，截面临界退化为顶点、棱或底面！",
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
          latex: `R = \\frac{\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2}}{2}`,
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
        name: "球截面圆性质定理",
        latex: "R^2 = r_{截}^2 + d^2",
        level: "important",
        note: "球心到截面圆圆心的距离为 d，截面圆半径为 r_截，球半径为 R",
      },
      {
        name: "斜二测画法面积转换定理",
        latex: "S_{\\text{直观图}} = \\frac{\\sqrt{2}}{4} S_{\\text{原图形}}",
        level: "important",
        note: "斜二测画法规则：x' 轴与 y' 轴夹角为 45° 或 135°，平行于 x 轴长度不变，平行于 y 轴长度减半",
      },
    );
  }

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "斜二测画法（直观图）：① 横轴 x 长度不变，纵轴 y 长度折半；② 夹角为 45° 或 135°；③ 原平面图形面积与直观图面积满足 S_直观 = (√2 / 4) S_原。",
      importance: "gaokao",
    },
    {
      text: "旋转体由平面图形绕轴旋转 360° 形成。轴截面（矩形、等腰三角形、等腰梯形、大圆）是把 3D 旋转体问题降维至 2D 平面图形求解的核心钥匙。",
      importance: "core",
    },
    {
      text: "侧面展开图（化曲为直）：求解圆锥/圆柱侧面曲面上两点间最短距离（蚂蚁爬行路径）时，必须先将侧面沿母线展开，圆锥展开为扇形（圆心角 α = r/l · 360°）。",
      importance: "gaokao",
    },
    {
      text: "柱锥台公式统一思想：熟练掌握台体体积公式 V = ⅓h(S₁ + √(S₁S₂) + S₂)。理解 r₂=r₁（圆柱）与 r₂=0（圆锥）时的极限演解。",
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
    );

    theorems.push(
      {
        name: "平面翻折基本性质定理（变与不变）",
        latex: "\\text{折痕及同一半平面内的线段长度、夹角翻折前后保持不变}",
        level: "core",
        condition: "折痕 EC 上的点、底面 ABCE 内的几何元素保持不动",
      },
      {
        name: "动点 D' 坐标参数化公式",
        latex: `D' = (\\color{#D97706}{b} - \\color{#D97706}{b}\\cos\\color{#EF4444}{\\alpha},\\; \\color{#059669}{h},\\; \\color{#D97706}{b}\\sin\\color{#EF4444}{\\alpha})`,
        level: "important",
        note: "以折痕 EC 为参考轴建立空间直角坐标系求解 3D 坐标",
      },
      {
        name: "变动线段余弦定理公式",
        latex: `|D'A|^2 = \\color{#EF4444}{a}^2 + \\color{#059669}{h}^2 + \\color{#D97706}{b}^2 - 2\\color{#EF4444}{a}\\color{#D97706}{b}\\cos\\color{#EF4444}{\\alpha}`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考解法一：建系法】：以折痕或垂直于折痕的射线为坐标轴，将二面角 α 参数化带入动点坐标，用向量公式求异面直线角或线面角。",
        importance: "gaokao",
      },
      {
        text: "【高考解法二：几何法】：翻折二面角 α = 90° 时，翻折面 ⊥ 底面，垂线段 D'E ⊥ 底面 ABCE，可直接作为三棱锥/四棱锥的高求体积。",
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
        label: "三棱锥 A'-BCD 外接球半径 R",
        symbol: "R",
        value: Number(res.circumSphereRadius?.toFixed(3)),
        color: MATH_COLORS.highlight,
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
        name: "翻折外接球半径不变量定理（高考陷阱必考）",
        latex: `R = \\frac{L}{2} = \\frac{\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}}{2}`,
        level: "core",
        note: "斜边 BD 中点即为外接球球心，外接球半径 R 与二面角 α 无关，恒定不变！",
      },
      {
        name: "矩形对角线翻折体积公式",
        latex: `V_{A'-BCD}(\\alpha) = \\frac{1}{6} \\color{#EF4444}{a}\\color{#D97706}{b} \\cdot r \\sin\\color{#EF4444}{\\alpha} \\le \\frac{\\color{#EF4444}{a}^2 \\color{#D97706}{b}^2}{6 \\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}}`,
        level: "important",
        note: "当 α = 90° 时三棱锥体积达到最大极值",
      },
    );

    gaokaoPoints.push(
      {
        text: "【矩形对角线翻折大题核心】：翻折过程中 △A'BD 和 △CBD 均为 Rt△，外接球球心始终是斜边 BD 中点，因此外接球半径 R = BD/2 恒定不变！",
        importance: "gaokao",
      },
      {
        text: "【体极值考点】：高 h = r·sinα，在 α = 90° 时，A' 投影落在底面 BD 上，三棱锥 A'-BCD 体积达到最大值。",
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
        latex: `|BC'| = \\color{#EF4444}{a} \\sin \\left(\\frac{\\color{#EF4444}{\\alpha}}{2}\\right)`,
        level: "core",
        note: "翻折角 α 即为平面角 ∠BDC'",
      },
      {
        name: "α = 90° 墙角模型外接球定理",
        latex: `R = \\frac{\\sqrt{\\color{#059669}{h}^2 + \\frac{\\color{#EF4444}{a}^2}{2}}}{2}`,
        level: "important",
        condition: "当 α = 90° 时，DA, DB, DC' 两两垂直组成墙角模型",
      },
    );

    gaokaoPoints.push({
      text: "【等腰三角形折叠与墙角模型】：沿高 AD 折叠至 α = 90° 时，三条侧棱 DA ⊥ DB, DA ⊥ DC', DB ⊥ DC' 两两垂直，可直接补形为长方体求外接球。",
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
      text: `翻折二面角 α = ${alphaDeg}°，图形退化为 2D 平面图形！`,
      level: "warning",
    });
  } else if (alphaDeg === 90) {
    warnings.push({
      text: "翻折二面角 α = 90°，两半平面处于垂直临界状态！二面角 α 即为线面角或直角关系。",
      level: "info",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
