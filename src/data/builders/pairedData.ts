import type { MathPanelData } from "../types";
import {
  calculateLinearRegression,
  calculateIndependenceTest,
  REGRESSION_PRESETS,
  INDEPENDENCE_PRESETS,
  Point2D,
} from "@/math/pairedData";
import { MATH_COLORS } from "@/theme";

export function buildPairedDataPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) ?? "regression";
  const customPoints = config?.points as Point2D[] | undefined;

  if (studyMode === "regression") {
    const presetIndex = Math.min(
      REGRESSION_PRESETS.length - 1,
      Math.max(0, Math.round(params.presetIndex ?? 0)),
    );
    const preset = REGRESSION_PRESETS[presetIndex];
    const points = customPoints ?? preset.points;

    const res = calculateLinearRegression(points);

    return {
      quantities: [
        {
          label: "样本容量 n",
          value: `${res.n}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "样本均值 (x̄, ȳ)",
          value: `(${res.meanX.toFixed(2)}, ${res.meanY.toFixed(2)})`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "回归斜率 b̂",
          value: `${res.b.toFixed(4)}`,
          color: MATH_COLORS.function,
        },
        {
          label: "回归截距 â",
          value: `${res.a.toFixed(4)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "样本相关系数 r",
          value: `${res.r.toFixed(4)}`,
          color:
            res.r >= 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary,
        },
        {
          label: "决定系数 R²",
          value: `${res.rSquare.toFixed(4)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "残差平方和 SSE",
          value: `${res.sse.toFixed(2)}`,
          color: MATH_COLORS.tangentLine,
        },
      ],
      theorems: [
        {
          name: "一元线性回归模型方程",
          latex: `\\hat{y} = \\hat{b}x + \\hat{a} \\quad \\text{其中 } \\hat{b} = \\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum_{i=1}^{n}(x_i-\\bar{x})^2}, \\; \\hat{a} = \\bar{y} - \\hat{b}\\bar{x}`,
          note: "回归直线必过样本中心点 (x̄, ȳ)。",
          level: "core",
        },
        {
          name: "样本相关系数 r 公式",
          latex: `r = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum (x_i-\\bar{x})^2 \\sum (y_i-\\bar{y})^2}}`,
          note: "|r| 越接近 1，相关性越强；r > 0 正相关，r < 0 负相关。",
          level: "important",
        },
        {
          name: "决定系数 R² 的统计意义",
          latex: `R^2 = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2} = 1 - \\frac{\\text{SSE}}{\\text{SST}}`,
          note: "R² 越接近 1，说明回归方程对样本数据的拟合效果越好。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】回归直线必过样本中心点 (x̄, ȳ)。已知 x̄, ȳ 与 b̂，必有 â = ȳ - b̂ x̄。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】样本相关系数 r 取值范围 [-1, 1]。|r| > 0.75 通常认为线性相关性很强。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】残差 e_i = y_i - ŷ_i。残差图中带状区域越窄，说明线性拟合精度越高。",
          importance: "gaokao",
        },
      ],
      warnings: res.isValid
        ? Math.abs(res.r) < 0.3
          ? [
              {
                text: "【相关性较弱】|r| < 0.3 说明线性相关程度低，直接用线性回归模型可能预测偏差较大。",
                level: "warning",
              },
            ]
          : []
        : [
            {
              text: `【模型退化】${res.message ?? "数据无法计算回归方程"}`,
              level: "warning",
            },
          ],
    };
  } else {
    // 2x2 独立性检验模式
    const presetIndex = Math.min(
      INDEPENDENCE_PRESETS.length - 1,
      Math.max(0, Math.round(params.presetIndex ?? 0)),
    );
    const preset = INDEPENDENCE_PRESETS[presetIndex];

    const a = params.freqA ?? preset.a;
    const b = params.freqB ?? preset.b;
    const c = params.freqC ?? preset.c;
    const d = params.freqD ?? preset.d;

    const res = calculateIndependenceTest(a, b, c, d);

    return {
      quantities: [
        {
          label: "样本容量 n",
          value: `${res.n}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "交叉积 |ad - bc|",
          value: `${Math.abs(res.adMinusBc)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "χ² 观测值 (K²)",
          value: `${res.chiSquare.toFixed(3)}`,
          color: res.p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary,
        },
        {
          label: "临界点 3.841 (95%)",
          value: res.p95 ? "已达到 (超95%把握)" : "未达到",
          color: res.p95 ? MATH_COLORS.paramTertiary : MATH_COLORS.textMuted,
        },
        {
          label: "临界点 6.635 (99%)",
          value: res.p99 ? "已达到 (超99%把握)" : "未达到",
          color: res.p99 ? MATH_COLORS.paramTertiary : MATH_COLORS.textMuted,
        },
      ],
      theorems: [
        {
          name: "2×2 列联表卡方检验统计量 χ²",
          latex: `\\chi^2 = \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)}`,
          note: "其中 n = a+b+c+d，用于检验两个分类变量是否相互独立。",
          level: "core",
        },
        {
          name: "高考常用卡方临界值对照表",
          latex: `P(\\chi^2 \\ge k_0): \\quad k_0=2.706 (90\\%), \\; 3.841 (95\\%), \\; 6.635 (99\\%), \\; 10.828 (99.9\\%)`,
          note: "若 χ² ≥ 3.841，则有 95% 以上的把握推翻 H₀（即认为两个变量有关联）。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】零假设 H₀：变量 A 与变量 B 独立（无关联）。小概率原理：当观测值 χ² ≥ k₀ 时，拒绝 H₀。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】熟记临界值 3.841 (对应 α=0.05，即 95% 把握) 和 6.635 (对应 α=0.01，即 99% 把握)。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】答题表述公式：“有 1 - α 的把握认为 A 与 B 有关”，不可误表述为“A 导致 B 的概率为 95%”。",
          importance: "gaokao",
        },
      ],
      warnings: !res.isValid
        ? [
            {
              text: `【退化预警】${res.confidenceText}`,
              level: "warning",
            },
          ]
        : res.n < 40
          ? [
              {
                text: "【样本容量过小】样本总数 n < 40 时，卡方近似检验可能误差较大（高考中要求 n ≥ 40 且各频数 ≥ 5）。",
                level: "warning",
              },
            ]
          : [],
    };
  }
}
