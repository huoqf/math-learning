import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";

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
      label: "截面与底面所成角余弦",
      symbol: "\\cos\\theta",
      value: Number(cosTheta.toFixed(4)),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "截面与底面所成角",
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
      latex: `S_{\\text{截}} = \\frac{S_{\\text{投}}}{\\cos \\theta} \\quad (\\theta \\in [0^\\circ, 90^\\circ) \\text{ 为截面与底面所成角})`,
      level: "core",
      condition:
        "截面不能垂直于射影参考面 (\\cos \\theta > 0)。若垂直底面则投影退化为线段",
    },
    {
      name: "截面作图三大基本事实与性质依据",
      latex: `\\begin{cases} \\text{基本事实 1 (同面连线): } A, B \\in \\alpha \\implies AB \\subset \\alpha \\\\ \\text{基本事实 3 (交轨法): } \\alpha \\cap \\beta = l \\\\ \\text{面面平行性质: } \\alpha \\parallel \\beta \\implies l_1 \\parallel l_2 \\end{cases}`,
      level: "core",
      note: "同面直接连线；异面延线相交于底面交轨点（外点连线）；平行面截线必平行",
    },
  );

  if (mode === "construction" && rationale) {
    theorems.push({
      name: stepTitle || "当前作图步骤依据",
      latex: `\\text{依据立体几何基本事实与性质推演}`,
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
