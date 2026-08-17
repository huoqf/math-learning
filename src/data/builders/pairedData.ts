import type { MathPanelData } from "../types";
import {
  calculateLinearRegression,
  calculateIndependenceTest,
  fitAllRegressionModels,
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
    const modelFits = fitAllRegressionModels(points);
    const selectedModel = (config?.selectedModel as string) ?? "linear";
    const currentModelFit =
      modelFits.find((m) => m.type === selectedModel) ?? modelFits[0];

    return {
      quantities: [
        {
          label: "样本容量 n",
          value: `${res.n}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "样本中心 (x̄, ȳ)",
          value: `(${res.meanX.toFixed(2)}, ${res.meanY.toFixed(2)})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "离均差乘积和 L_xy",
          value: `${res.lxy.toFixed(2)}`,
          color:
            res.lxy >= 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary,
        },
        {
          label: "x离差平方和 L_xx",
          value: `${res.lxx.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "回归斜率 b̂",
          value: `${res.b.toFixed(4)}`,
          color: MATH_COLORS.paramPrimary,
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
          value: `${(currentModelFit?.rSquare ?? res.rSquare).toFixed(4)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "残差平方和 SSE",
          value: `${(currentModelFit?.sse ?? res.sse).toFixed(2)}`,
          color: MATH_COLORS.tangentLine,
        },
      ],
      theorems: [
        {
          name: "一元线性回归方程与最小二乘法",
          latex: `\\hat{y} = \\color{#EF4444}{\\hat{b}}x + \\color{#D97706}{\\hat{a}} \\quad \\left( \\hat{b} = \\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum_{i=1}^{n}(x_i-\\bar{x})^2} = \\frac{L_{xy}}{L_{xx}}, \\; \\hat{a} = \\bar{y} - \\hat{b}\\bar{x} \\right)`,
          note: "回归直线必过样本中心点 (x̄, ȳ)；最小二乘法使残差平方和 SSE = ∑(y_i - ŷ_i)² 达到全局最小。",
          level: "core",
        },
        {
          name: "相关系数 r 与决定系数 R² 的统计意义",
          latex: `r = \\frac{L_{xy}}{\\sqrt{L_{xx} L_{yy}}}, \\quad R^2 = 1 - \\frac{\\text{SSE}}{\\text{SST}} = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2}`,
          note: "r 与 b̂ 同号；|r| 越近 1 线性相关性越强；R² 越近 1 说明模型对 y 变异的解释比例越高、拟合优度越好。",
          level: "important",
        },
        {
          name: "新高考非线性回归线性化转换",
          latex: currentModelFit
            ? `${currentModelFit.variableSubstitution} \\implies ${currentModelFit.transformedFormula}`
            : `y = c e^{kx} \\xrightarrow{z=\\ln y} z = kx + \\ln c`,
          note: currentModelFit?.isBest
            ? "【当前模型为最优拟合】在候选模型中决定系数 R² 最大、残差平方和最小。"
            : "通过变量代换将非线性关系转化为线性方程求解，最后代回原变量。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点1】必过样本中心点：已知 x̄, ȳ 与 b̂，必有 â = ȳ - b̂ x̄（小题高频秒杀考点）。",
          importance: "gaokao",
        },
        {
          text: "【高考考点2】相关系数同号性：r 与斜率 b̂ 的符号由 L_xy 唯一决定，正相关时 r>0, b̂>0；负相关时 r<0, b̂<0。",
          importance: "gaokao",
        },
        {
          text: "【高考考点3】残差分析法：残差 e_i = y_i - ŷ_i，且 ∑e_i = 0。残差点在 e=0 上下带状区域越窄，说明线性拟合越精确。",
          importance: "gaokao",
        },
        {
          text: "【高考考点4】模型选择策略：在高考大题中比较多种经验模型时，选择决定系数 R² 较大（或残差平方和 SSE 较小）的模型。",
          importance: "gaokao",
        },
      ],
      warnings: res.isValid
        ? Math.abs(res.r) < 0.3
          ? [
              {
                text: "【相关性较弱】|r| < 0.3 说明线性相关程度低，直接使用线性模型预测误差较大，建议尝试非线性模型转换。",
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
