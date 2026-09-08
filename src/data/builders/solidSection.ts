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
  const mode = (config?.mode as string) ?? "construction"; // "construction" | "extrema"
  const vertexCount = (config?.vertexCount as number) ?? 0;
  const area3D = (config?.area3D as number) ?? 0;
  const areaProj = (config?.areaProj as number) ?? 0;
  const cosTheta = (config?.cosTheta as number) ?? 1;
  const thetaDeg = (config?.thetaDeg as number) ?? 0;
  const shapeName = (config?.shapeName as string) ?? "截面多边形";
  const perimeter = (config?.perimeter as number) ?? 0;
  const normalStr = (config?.normalStr as string) ?? "(0.00, 0.00, 1.00)";
  const solidName = (config?.solidName as string) ?? "长方体 / 正方体";
  const externalPointsStr = (config?.externalPointsStr as string) ?? "无";
  const minArea = (config?.minArea as number) ?? 0;
  const maxArea = (config?.maxArea as number) ?? 0;
  const stepNum = (config?.stepNum as number) ?? 1;
  const stepTitle = (config?.stepTitle as string) ?? "";
  const rationale = (config?.rationale as string) ?? "";
  const methodName = (config?.methodName as string) ?? "交轨延长线法";

  // 1. 数学量列表（克制精准，突出几何核心量与代数不变量）
  const quantities: MathQuantity[] = [
    {
      label: "几何体模型",
      value: solidName,
    },
    {
      label: "截面拓扑形状",
      symbol: "n",
      value: `${shapeName} (${vertexCount} 边形)`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "截面面积",
      symbol: "S_{\\text{截}}",
      value: area3D.toFixed(2),
      color: MATH_COLORS.paramPrimary,
      highlight: "extreme",
    },
    {
      label: "底面射影面积",
      symbol: "S_{\\text{投}}",
      value: areaProj.toFixed(2),
      color: MATH_COLORS.secondary,
    },
    {
      label: "二面角余弦",
      symbol: "\\cos\\theta",
      value: `${cosTheta.toFixed(4)} (${thetaDeg.toFixed(1)}°)`,
      color: MATH_COLORS.primary,
    },
  ];

  if (mode === "construction") {
    quantities.unshift({
      label: "作图通法",
      value: methodName,
      color: MATH_COLORS.highlight,
    });
    quantities.unshift({
      label: "当前作图步骤",
      symbol: `\\text{Step } ${stepNum}`,
      value: stepTitle || `第 ${stepNum} 步`,
      color: MATH_COLORS.paramPrimary,
    });
    if (methodName === "交轨延长线法") {
      quantities.push({
        label: "底面交轨外点",
        symbol: "K_i",
        value: externalPointsStr,
        color: MATH_COLORS.paramTertiary,
      });
    }
  } else if (mode === "extrema") {
    quantities.push(
      {
        label: "截面积理论极小值",
        symbol: "S_{\\min}",
        value: minArea.toFixed(2),
        color: MATH_COLORS.paramTertiary,
        isInvariant: true,
        invariantNote: "动点 P 沿侧棱滑动区间极小值",
      },
      {
        label: "截面积理论极大值",
        symbol: "S_{\\max}",
        value: maxArea.toFixed(2),
        color: MATH_COLORS.highlight,
        isInvariant: true,
        invariantNote: "动点 P 沿侧棱滑动区间极大值",
      },
    );
  } else {
    quantities.push({
      label: "截面周长",
      symbol: "C",
      value: perimeter.toFixed(2),
    });
  }

  // 2. 核心定理（高中课标标准定理，随当前作图步骤动态置顶推演依据）
  const theorems: Theorem[] = [];

  if (mode === "construction" && rationale) {
    theorems.push({
      name: `${methodName} · 依据（${stepTitle || `Step ${stepNum}`}）`,
      latex:
        methodName === "直接连线法"
          ? "A, B \\in \\alpha \\implies AB \\subset \\alpha \\quad (\\text{基本事实 1})"
          : methodName === "面面平行线法"
            ? "\\alpha \\parallel \\beta, \\, \\gamma \\cap \\alpha = l_1, \\, \\gamma \\cap \\beta = l_2 \\implies l_1 \\parallel l_2"
            : stepNum === 1
              ? "A, B \\in \\alpha \\implies AB \\subset \\alpha \\quad (\\text{基本事实 1})"
              : stepNum === 2
                ? "P \\in \\alpha \\cap \\beta \\implies P \\in l \\quad (\\text{基本事实 3})"
                : stepNum === 3
                  ? "K_1, K_2 \\in \\alpha \\cap \\beta \\implies K_1K_2 = \\alpha \\cap \\beta"
                  : "\\text{各面截线顺次首尾相接，封闭成多边形}",
      condition: rationale,
      level: "core",
    });
  }

  theorems.push(
    {
      name: "平面的基本性质（基本事实 3）",
      latex:
        "P \\in \\alpha \\cap \\beta \\implies \\alpha \\cap \\beta = l, \\quad P \\in l",
      condition:
        "如果两个不重合的平面有一个公共点，那么它们有且只有一条过该点的公共交线。",
      level: "core",
    },
    {
      name: "面积射影定理",
      latex:
        "S_{\\text{截}} = \\frac{S_{\\text{投}}}{\\cos\\theta} \\quad (0 \\le \\theta < 90^\\circ)",
      condition:
        "平面多边形在另一平面上的正投影面积为 S_投，二面角为 θ，则原平面图形面积等于投影面积除以余弦值。",
      level: "core",
    },
    {
      name: "空间法向量与二面角余弦",
      latex:
        "\\cos\\theta = \\frac{|\\vec{n}_1 \\cdot \\vec{n}_2|}{|\\vec{n}_1||\\vec{n}_2|}",
      condition: "空间两平面的二面角大小等于其法向量夹角（或其补角）的绝对值。",
      level: "important",
    },
  );

  // 3. 高考考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【三点定截面作图通法】连结同面已知点求交线；异面已知点则延长与底棱求交轨外点 K，连结外点得出底面交线，封闭截面多边形。",
      importance: "gaokao",
    },
    {
      text: "【空间向量建系与二面角法向量求解】选择垂直三棱建立空间直角坐标系，写出题设已知点坐标与方向向量，联立垂直方程组求截面法向量。",
      importance: "core",
    },
    {
      text: "【面积射影法求立体截面积】利用 S_截 = S_投 / cosθ，将复杂空间截面面积转化为底面平面多边形面积计算，极大简化三角分割。",
      importance: "core",
    },
    {
      text: "【动点截面多边形变异与面积极值探究】随着侧棱动点 P(t) 滑动，截面边数经历退化突变，建立面积分段函数 S(t) 探究单调性与区间极值。",
      importance: "hard",
    },
  ];

  // 4. 退化警示
  const warnings: WarningItem[] = [
    {
      text: "【三已知点共线】无法唯一确定空间切面，基本事实 1 失效。",
      level: "danger",
    },
    {
      text: "【截面与投影面垂直 (cosθ ≈ 0)】当 cosθ → 0 时射影面积公式分母为 0 失效，退化为线段，需直接通过空间向量模长计算面积。",
      level: "warning",
    },
    {
      text: "【动点滑动越出棱线端点 (t ∉ [0, 1])】截面超出多面体物理实体范围，交点脱离几何体。",
      level: "info",
    },
  ];

  // 5. 破题三步推演（紧扣题设与高中实际解题动线）
  let reasoningSteps: {
    step: number;
    title: string;
    latex: string;
    detail: string;
    rubric?: string;
  }[] = [];

  if (mode === "construction") {
    reasoningSteps = [
      {
        step: 1,
        title: "作图破题 · 找面求交定位截线",
        latex: `P, Q \\in \\text{面}_1 \\implies PQ \\text{ 为截线}; \\quad PQ \\cap \\text{底棱延长线} = K_1`,
        detail:
          "审视题设已知点 P, Q, R：同在某一侧面的两点直接连结得截线；将截线与底面对应棱延长相交，求出底面的公共交轨外点 K₁、K₂，完成作图第一步。",
        rubric:
          "得分点 (4分)：正确指出同面截线，并利用基本事实 3 延长相交求得底面外点 K₁、K₂",
      },
      {
        step: 2,
        title: "代数建系 · 联立方程求法向量",
        latex: `\\begin{cases} \\vec{n} \\cdot \\vec{PQ} = 0 \\\\ \\vec{n} \\cdot \\vec{PR} = 0 \\end{cases} \\implies \\vec{n} = ${normalStr}, \\quad \\cos\\theta = ${cosTheta.toFixed(4)}`,
        detail:
          "以几何体底面三垂直边建立空间直角坐标系，写出已知点 P, Q, R 的精确坐标与向量 PQ, PR；设截面法向量为 n=(x,y,z)，由垂直条件联立方程组求得法向量，算出二面角余弦 cosθ。",
        rubric:
          "得分点 (4分)：准确建立空间直角坐标系，联立方程组求解法向量与二面角余弦",
      },
      {
        step: 3,
        title: "射影降维 · 面积公式精确求解",
        latex: `S_{\\text{截}} = \\frac{S_{\\text{投}}}{\\cos\\theta} = \\frac{${areaProj.toFixed(2)}}{${cosTheta.toFixed(4)}} = ${area3D.toFixed(2)}`,
        detail:
          "计算截面在底面的正投影多边形面积 S_投；代入面积射影定理 S_截 = S_投 / cosθ，化空间为平面，直接精确求得截面多边形的实际面积！",
        rubric:
          "得分点 (4分)：正确求解底面正投影面积并应用射影公式求出截面实际面积",
      },
    ];
  } else {
    reasoningSteps = [
      {
        step: 1,
        title: "动点建构 · 侧棱参数方程表征",
        latex: `P(t) = (1-t)A_0 + tA_1 \\quad (t \\in [0.05, 0.95])`,
        detail:
          "设动点 P 在侧棱上的位置比例为 t，固定定点 Q, R 坐标已知保持不变，由已知三点解出动切割平面方程。",
        rubric: "得分点 (2分)：建立动点位置关于参数 t 的空间坐标与参数方程表征",
      },
      {
        step: 2,
        title: "拓扑形变 · 边数突变与临界分析",
        latex: `\\text{当前形状: } ${shapeName}, \\quad \\text{顶点数: } n = ${vertexCount}`,
        detail:
          "动点 P(t) 沿侧棱从底向顶滑动时，截面与多面体各棱相交状态改变，截面边数在特定临界点发生突变（如三角形 ↔ 四边形 ↔ 六边形）。",
        rubric:
          "得分点 (3分)：准确分析截面边数与拓扑状态发生改变的临界分水岭点",
      },
      {
        step: 3,
        title: "函数极值 · 面积函数区间最值求解",
        latex: `S(t) = ${area3D.toFixed(2)}, \\quad S_{\\min} = ${minArea.toFixed(2)}, \\quad S_{\\max} = ${maxArea.toFixed(2)}`,
        detail:
          "结合几何投影关系或二次分段函数单调性，分析面积函数 S(t) 在区间 [0.05, 0.95] 上的极小值点与极大值点。",
        rubric:
          "得分点 (3~5分)：通过函数导数或几何最值原理准确求得截面面积的极值",
      },
    ];
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor: "新高考立体几何 · 多面体截面作图与面积射影专题",
    mnemonic: "同面直接连，异面延线交；射影求面积，投影除以余弦角。",
  };
}
