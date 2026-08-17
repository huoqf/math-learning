import type { MathPanelData, WarningItem } from "../types";
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

    const mult = Math.max(1, Math.round(params.scaleMultiplier ?? 1));
    const rawA = params.freqA ?? preset.a;
    const rawB = params.freqB ?? preset.b;
    const rawC = params.freqC ?? preset.c;
    const rawD = params.freqD ?? preset.d;

    const a = rawA * mult;
    const b = rawB * mult;
    const c = rawC * mult;
    const d = rawD * mult;

    const res = calculateIndependenceTest(a, b, c, d);

    // 格式化当前四步答题结论与规范表述
    let conclusionDetail = "";
    if (res.p999) {
      conclusionDetail =
        "根据小概率值 α = 0.001 的独立性检验，推断 H₀ 不成立，即有 99.9% 以上的把握认为两个分类变量有关联。";
    } else if (res.p99) {
      conclusionDetail =
        "根据小概率值 α = 0.01 的独立性检验，推断 H₀ 不成立，即有 99% 以上的把握认为两个分类变量有关联。";
    } else if (res.p95) {
      conclusionDetail =
        "根据小概率值 α = 0.05 的独立性检验，推断 H₀ 不成立，即有 95% 以上的把握认为两个分类变量有关联。";
    } else if (res.p90) {
      conclusionDetail =
        "根据小概率值 α = 0.10 的独立性检验，推断 H₀ 不成立，即有 90% 以上的把握认为两个分类变量有关联。";
    } else {
      conclusionDetail =
        "根据小概率值 α = 0.05 的独立性检验，没有充分证据推翻 H₀，不能认为两个分类变量有关联。";
    }

    const warnings: WarningItem[] = [];
    if (!res.isValid) {
      warnings.push({
        text: `【退化预警】${res.confidenceText}`,
        level: "warning",
      });
    } else {
      if (res.n < 40) {
        warnings.push({
          text: `【样本量过小】当前样本总量 n = ${res.n} < 40，卡方近似误差较大。高考标准要求 n ≥ 40。`,
          level: "warning",
        });
      }
      if (!res.isExpectedEnough) {
        const minE = Math.min(
          res.expected.eA,
          res.expected.eB,
          res.expected.eC,
          res.expected.eD,
        );
        warnings.push({
          text: `【理论频数不足】存在理论期望频数 E_min = ${minE.toFixed(1)} < 5，宜采用 Yates 连续性修正 (χ²_yates = ${res.chiSquareYates.toFixed(3)})。`,
          level: "warning",
        });
      }
      if (Math.abs(res.adMinusBc) === 0) {
        warnings.push({
          text: "【完全独立状态】ad - bc = 0，两组条件频率完全相同，χ² = 0，完全符合独立假设。",
          level: "info",
        });
      }
    }

    return {
      quantities: [
        {
          label: "样本总量 n",
          value: `${res.n}${mult > 1 ? ` (${mult}×倍增)` : ""}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "行列边际合计",
          value: `行: ${res.row1}/${res.row2}, 列: ${res.col1}/${res.col2}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "交叉积差 |ad - bc|",
          value: `${Math.abs(res.adMinusBc)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "χ² 统计量观测值",
          value: `${res.chiSquare.toFixed(3)}`,
          color: res.p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary,
        },
        {
          label: "Yates 连续修正 χ²",
          value: `${res.chiSquareYates.toFixed(3)}`,
          color: MATH_COLORS.textMuted,
        },
        {
          label: "高考 95% 显著性 (3.841)",
          value: res.p95 ? "✓ 达到 (拒绝 H₀)" : "✗ 未达到",
          color: res.p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.textMuted,
        },
        {
          label: "高考 99% 显著性 (6.635)",
          value: res.p99 ? "✓ 达到 (拒绝 H₀)" : "✗ 未达到",
          color: res.p99 ? MATH_COLORS.paramPrimary : MATH_COLORS.textMuted,
        },
      ],
      theorems: [
        {
          name: "新高考四步标准答题规范",
          latex: `\\begin{aligned}
\\text{Step 1 (设假设)} &: H_0: X, Y \\text{ 相互独立} \\\\
\\text{Step 2 (算公式)} &: \\chi^2 = \\frac{n(ad-bc)^2}{(a+b)(c+d)(a+c)(b+d)} \\\\
&= ${res.chiSquare.toFixed(3)} \\\\
\\text{Step 3 (比临界)} &: \\chi^2 ${res.p95 ? `\\ge ${res.p99 ? (res.p999 ? "10.828" : "6.635") : "3.841"}` : "< 3.841"}
\\end{aligned}`,
          note: `【Step 4 规范作答结论】${conclusionDetail}（阅卷采分要点：必须注明小概率值 α 与置信度，严禁表述为因果概率）。`,
          level: "core",
        },
        {
          name: "2×2 列联表卡方公式本质 (理论偏离度)",
          latex: `\\begin{aligned}
\\chi^2 &= \\sum_{i,j} \\frac{(O_{ij} - E_{ij})^2}{E_{ij}} \\\\
&= \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)}
\\end{aligned}`,
          note: "其中 O_ij 为实际观测频数，E_ij = (行和×列和)/n 为独立假设下的理论期望频数。",
          level: "important",
        },
        {
          name: "新课标高考常用卡方临界值对照",
          latex: `\\begin{aligned}
P(\\chi^2 \\ge 2.706) &= 0.10 \\quad (90\\% \\text{ 把握}) \\\\
P(\\chi^2 \\ge 3.841) &= 0.05 \\quad (95\\% \\text{ 把握, 核心}) \\\\
P(\\chi^2 \\ge 6.635) &= 0.01 \\quad (99\\% \\text{ 把握, 高频}) \\\\
P(\\chi^2 \\ge 10.828) &= 0.001 \\quad (99.9\\% \\text{ 把握})
\\end{aligned}`,
          note: "当计算的 χ² 观测值大于等于对应临界值时，即拒绝零假设 H₀，认为两个分类变量有关联。",
          level: "core",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点·小概率反证法】在 H₀ 成立的前提下，χ² ≥ 3.841 是一个小概率事件（概率仅 0.05）。既然小概率事件在一次试验中发生，则有理由拒绝 H₀。",
          importance: "gaokao",
        },
        {
          text: "【高考避坑·相关性 ≠ 因果性】独立性检验只能得出“变量 X 与 Y 有统计关联”，绝不能推断出“X 是引起 Y 的原因”或“X 导致 Y 的概率是 95%”。",
          importance: "gaokao",
        },
        {
          text: "【高考规律·样本量效应】条件频率比例不变时，样本容量 n 扩大 k 倍，χ² 观测值将线性扩大 k 倍。样本量足够大时，微小比例差异也能获得统计显著性。",
          importance: "gaokao",
        },
      ],
      warnings,
    };
  }
}
