import type { MathPanelData, MathQuantity, Theorem, GaokaoPoint, WarningItem } from "../types";
import type { TriangleExtremaState } from "@/math/triangleExtrema";

export function buildTriangleExtremaPanel(
  _params: Record<string, number>,
  config?: Record<string, unknown>
): MathPanelData {
  const studyMode = (config?.studyMode as string) ?? "angle-transform";
  const calcState = config?.calcState as TriangleExtremaState | undefined;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (calcState && calcState.isValid) {
    const { extrema } = calcState;

    // 基础数量
    quantities.push(
      {
        label: "当前周长 P",
        value: extrema.perimeter.toFixed(2),
        color: "primary",
      },
      {
        label: "最大周长 P_max",
        value: extrema.maxPerimeter.toFixed(2),
        color: "success",
      },
      {
        label: "当前面积 S",
        value: extrema.area.toFixed(2),
        color: "warning",
      },
      {
        label: "最大面积 S_max",
        value: extrema.maxArea.toFixed(2),
        color: "danger",
      },
      {
        label: "数量积 AB·AC",
        value: extrema.dotProduct.toFixed(2),
        color: "info",
      }
    );
  }

  // 定理与考点组装
  if (studyMode === "angle-transform") {
    theorems.push({
      name: "正弦定理角化边与三角函数求最值",
      latex: "b = \\frac{a \\sin B}{\\sin A}, \\quad c = \\frac{a \\sin(A+B)}{\\sin A}",
      condition: "已知角 A 和对边 a，内角 B 为自变量 (0 < B < 180° - A)",
      note: "将三角形周长/两边和转化为单一自变量 B 的正弦函数求最值，当 B=(180°-A)/2 (即 b=c) 时取得最大值。",
    });
  } else if (studyMode === "side-ineq") {
    theorems.push({
      name: "余弦定理与均值不等式最值定理",
      latex: "a^2 = b^2 + c^2 - 2bc \\cos A \\ge (2-2\\cos A)bc = 4bc \\sin^2 \\frac{A}{2}",
      condition: "已知对角 A 和对边 a",
      note: "由均值不等式 b²+c² ≥ 2bc 得两边乘积最大值 bc ≤ a²/(4 sin²(A/2))，当且仅当 b=c 时取等号。",
    });
  } else if (studyMode === "apollonius") {
    theorems.push({
      name: "阿波罗尼斯圆（定比边动点轨迹定理）",
      latex: "\\frac{AB}{AC} = k \\quad (k \\ne 1) \\implies (x - x_0)^2 + y^2 = R_A^2",
      condition: "底边 BC 固定，顶点 A 到两端点距离之比为常数 k",
      note: "顶点 A 的几何轨迹是以 (x_0, 0) 为圆心、R_A 为半径的圆，最大高度等于半径 R_A，对应最大面积。",
    });
  } else if (studyMode === "polarization") {
    theorems.push({
      name: "向量极化恒等式在解三角形中的应用",
      latex: "\\vec{AB} \\cdot \\vec{AC} = |\\vec{AM}|^2 - |\\vec{BM}|^2 = m_a^2 - \\left(\\frac{a}{2}\\right)^2",
      condition: "M 为底边 BC 的中点，m_a 为中线长 |AM|",
      note: "将两边向量的数量积转化为中线长平方与底边一半平方之差。中线长固定时数量积恒为定值。",
    });
  }

  // 高考考点
  gaokaoPoints.push(
    {
      text: "高考必考：正弦定理角化边、均值不等式与阿氏圆最值模型，高考第17题高频解答题型。",
      importance: "gaokao",
    },
    {
      text: "易错警示：不等式取等号条件与几何退化，检验等号成立时对应内角是否在 (0, 180°) 区间内。",
      importance: "hard",
    }
  );

  // 退化警示
  if (calcState && !calcState.isValid) {
    warnings.push({
      text: calcState.warning ?? "退化警示：无法构成有效三角形，内角和超出限制或两边和小于第三边。",
      level: "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "边化角用余弦均值，角化边用正弦辅助；阿氏圆寻最值高度，中线极化减半底方。",
  };
}
