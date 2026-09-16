import type { MathPanelData, WarningItem, ReasoningStep } from "../types";
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

    const isLinearMode = selectedModel === "linear";
    const isOutlierScenario = (config?.scenarioKey as string) === "outlier";

    // 动态组装定理体系：根据当前情境与模式特化置顶
    const dynamicTheorems = isLinearMode
      ? [
          {
            name: "一元线性回归方程与最小二乘法",
            latex: `\\begin{aligned} \\hat{y} &= \\color{${MATH_COLORS.paramPrimary}}{\\hat{b}}x + \\color{${MATH_COLORS.paramSecondary}}{\\hat{a}} \\\\[4pt] \\hat{b} &= \\frac{L_{xy}}{L_{xx}} = \\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum_{i=1}^{n}(x_i-\\bar{x})^2} \\\\[4pt] \\hat{a} &= \\bar{y} - \\hat{b}\\bar{x} \\end{aligned}`,
            note: "回归直线必过样本中心点 $(x̄, ȳ)$；最小二乘法使残差平方和 $SSE = ∑(y_i - ŷ_i)²$ 达到全局最小。",
            level: "core" as const,
          },
          {
            name: "相关系数 r 与决定系数 R² 的统计意义",
            latex: `\\begin{aligned} r &= \\frac{L_{xy}}{\\sqrt{L_{xx} L_{yy}}} \\\\[4pt] R^2 &= 1 - \\frac{\\text{SSE}}{\\text{SST}} = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2} \\end{aligned}`,
            note: "r 与 b̂ 同号；|r| 越近 1 线性相关性越强；R² 越近 1 说明模型对 y 变异的解释比例越高、拟合优度越好。",
            level: "important" as const,
          },
        ]
      : [
          {
            name: `非线性回归转换模型 (${currentModelFit?.name ?? "换元线性化"})`,
            latex: `\\begin{aligned} \\text{原模型: } & y = f(x; \\theta) \\\\[4pt] \\text{换元法: } & z = g(y), \\quad u = h(x) \\\\[4pt] \\text{线性型: } & z = \\hat{a} + \\hat{b}u \\end{aligned}`,
            note: `${currentModelFit ? `当前回归方程：$${currentModelFit.originalFormula}$；` : ""}${
              currentModelFit?.isBest
                ? "【当前模型拟合优度最高】在候选非线性模型中决定系数 R² 最大、残差平方和 SSE 最小。"
                : "通过变量代换将非线性关系化为线性方程求解，最后必须代回原变量得到预测方程。"
            }`,
            level: "core" as const,
          },
          {
            name: "经验模型比较与决定系数 R² 准则",
            latex: `R^2 = 1 - \\frac{\\text{SSE}}{\\text{SST}} = 1 - \\frac{\\sum_{i=1}^n (y_i - \\hat{y}_i)^2}{\\sum_{i=1}^n (y_i - \\bar{y})^2}`,
            note: "高考大题核心判定：决定系数 R² 越接近 1（残差平方和 SSE 越小），模型的拟合效果越好。",
            level: "important" as const,
          },
        ];

    // 动态组装高考考点：根据情境置顶特化
    const dynamicGaokaoPoints = isOutlierScenario
      ? [
          {
            text: "【高考考点·离群点检验】异常干扰点（如第5点）会产生巨大的“杠杆拉扯效应”，导致相关系数 r 暴跌、斜率显著偏离，实际解题时应进行残差检验与数据清洗。",
            importance: "gaokao" as const,
          },
          {
            text: "【高考考点·残差分析法】残差 $e_i = y_i - ŷ_i$，且 $∑e_i = 0$。残差点在 $e=0$ 上下带状区域越窄，说明拟合越精确。",
            importance: "core" as const,
          },
          {
            text: "【高考考点·样本中心点】不论是否存在离群点，最小二乘回归直线必定严格过样本中心点 (x̄, ȳ)。",
            importance: "basic" as const,
          },
        ]
      : !isLinearMode
        ? [
            {
              text: `【高考考点·非线性线性化】熟练掌握四大换元模型：指数 $y=ce^{kx}$ (令 $z=ln y$)、对数 $y=a+bln x$ (令 $u=ln x$)、幂函数 $y=cx^k$ (令 $z=ln y, u=ln x$)、双曲线 $y=a+b/x$ (令 $u=1/x$)。`,
              importance: "gaokao" as const,
            },
            {
              text: "【高考考点·模型优选决策】在高考大题中比较多种经验模型时，依据决定系数 R² 较大或残差平方和 SSE 较小确定最佳模型。",
              importance: "core" as const,
            },
            {
              text: "【高考考点·方程代回还原】求解出线性转换方程的系数后，务必逆代换回原物理/实际变量 (如将 z 还原为 ln y 代解 y)。",
              importance: "core" as const,
            },
          ]
        : [
            {
              text: "【高考考点1】必过样本中心点：已知 x̄, ȳ 与 b̂，必有 â = ȳ - b̂ x̄（小题高频秒杀考点）。",
              importance: "gaokao" as const,
            },
            {
              text: "【高考考点2】相关系数同号性：$r$ 与斜率 $b̂$ 的符号由 $L_xy$ 唯一决定，正相关时 $r>0, b̂>0$；负相关时 $r<0, b̂<0$。",
              importance: "gaokao" as const,
            },
            {
              text: "【高考考点3】残差分析法：残差 $e_i = y_i - ŷ_i$，且 $∑e_i = 0$。残差点在 $e=0$ 上下带状区域越窄，拟合越精确。",
              importance: "core" as const,
            },
            {
              text: "【高考考点4】决定系数与拟合优度：R² 越接近 1 说明回归直线对观测数据的解释能力越强。",
              importance: "basic" as const,
            },
          ];

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
          label: "离均差乘积和 $L_xy$",
          value: `${res.lxy.toFixed(2)}`,
          color:
            res.lxy >= 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary,
        },
        {
          label: "$x$离差平方和 $L_xx$",
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
      theorems: dynamicTheorems,
      gaokaoPoints: dynamicGaokaoPoints,
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

    const activeTab = (config?.activeTab as string) ?? "standard";
    const indPresetKey =
      (config?.indPresetKey as string) ?? String(presetIndex);

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
    let criticalComparisonLatex = "";

    if (res.p999) {
      criticalComparisonLatex = `\\chi^2 \\approx ${res.chiSquare.toFixed(3)} \\ge 10.828 = x_{0.001}`;
      conclusionDetail =
        "根据小概率值 $\\alpha = 0.001$ 的独立性检验，推断 $H_0$ 不成立，即有 $99.9\\%$ 以上的把握认为两个分类变量有关联，此推断犯错误的概率不超过 $0.001$。";
    } else if (res.p99) {
      criticalComparisonLatex = `\\chi^2 \\approx ${res.chiSquare.toFixed(3)} \\ge 6.635 = x_{0.01}`;
      conclusionDetail =
        "根据小概率值 $\\alpha = 0.01$ 的独立性检验，推断 $H_0$ 不成立，即有 $99\\%$ 以上的把握认为两个分类变量有关联，此推断犯错误的概率不超过 $0.01$。";
    } else if (res.p95) {
      criticalComparisonLatex = `\\chi^2 \\approx ${res.chiSquare.toFixed(3)} \\ge 3.841 = x_{0.05}`;
      conclusionDetail =
        "根据小概率值 $\\alpha = 0.05$ 的独立性检验，推断 $H_0$ 不成立，即有 $95\\%$ 以上的把握认为两个分类变量有关联，此推断犯错误的概率不超过 $0.05$。";
    } else if (res.p90) {
      criticalComparisonLatex = `\\chi^2 \\approx ${res.chiSquare.toFixed(3)} \\ge 2.706 = x_{0.10}`;
      conclusionDetail =
        "根据小概率值 $\\alpha = 0.10$ 的独立性检验，推断 $H_0$ 不成立，即有 $90\\%$ 以上的把握认为两个分类变量有关联。但未达到高考常用的 $95\\%$ 显著性标准。";
    } else {
      criticalComparisonLatex = `\\chi^2 \\approx ${res.chiSquare.toFixed(3)} < 3.841 = x_{0.05}`;
      conclusionDetail =
        "根据小概率值 $\\alpha = 0.05$ 的独立性检验，没有充分证据推翻 $H_0$，不能认为两个分类变量有关联。";
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
          text: `【样本量偏小】当前样本总量 $n = ${res.n} < 40$。新课标大样本独立性检验推荐样本容量 $n \\ge 40$。`,
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
          text: `【理论频数偏小】存在理论期望频数 $E_{\\min} = ${minE.toFixed(1)} < 5$，小样本下频数连续性近似存在一定偏离。`,
          level: "warning",
        });
      }
    }

    // 1. 高考解答题标准三步推演链（审题定法 → 建模展开 → 求解反思）
    const denomProduct = res.row1 * res.row2 * res.col1 * res.col2;

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 明确设立零假设与对立假设",
        latex: `H_0: X \\text{ 与 } Y \\text{ 相互独立}`,
        detail: `设零假设 $H_0$：${preset.labelA} 与 ${preset.labelB} 相互独立（即两变量无关联）。解答题第一步规范书写 $H_0$，为小概率反证法确立逻辑前提。`,
        rubric: "规范写出零假设 H₀ 记 1 分",
      },
      {
        step: 2,
        title: "建模展开 · 列联表数据代入卡方公式求解",
        latex: `\\chi^2 = \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)} \\\\ = \\frac{${res.n} \\times (${a} \\times ${d} - ${b} \\times ${c})^2}{${res.row1} \\times ${res.row2} \\times ${res.col1} \\times ${res.col2}} \\\\ = \\frac{${res.n} \\times (${res.adMinusBc})^2}{${denomProduct}} \\approx ${res.chiSquare.toFixed(3)}`,
        detail:
          "新高考评分细则：严禁直接跳步给出孤立数值！必须按「符号公式 $\\to$ 四格实际数据代入 $\\to$ 结果化简」三步规范书写，保证得分完整。",
        rubric: "公式与数据代入正确记 2 分，准确计算化简记 1 分",
      },
      {
        step: 3,
        title: "求解反思 · 对比分位数临界值合规推断",
        latex: criticalComparisonLatex,
        detail: `${conclusionDetail}【阅卷避坑】独立性检验只能推断“两变量具有统计关联”，绝不可断言因果必然关系；未达临界值时严禁表述为“绝对证明两者无关”。`,
        rubric: "临界值比对正确记 1 分，小概率结论严谨记 1 分",
      },
    ];

    // 2. 核心定理与公式模型（纯净课标数学公式，100% 满尺寸无长句缩放）
    const isScaleScenario = activeTab === "scale" && mult > 1;
    const isIndependentScenario =
      indPresetKey === "4" || Math.abs(res.adMinusBc) === 0;

    const dynamicTheorems = isScaleScenario
      ? [
          {
            name: "2×2 列联表卡方检验统计量公式",
            latex: `\\chi^2 = \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)}`,
            condition:
              "大样本容量 $n \\ge 40$ 且各理论期望频数 $E_{ij} \\ge 5$",
            note: "其中 $n = a+b+c+d$ 为总样本量，对角乘积之差反映两变量关联偏离度。",
            level: "core" as const,
          },
          {
            name: `样本容量线性倍增定理 (${mult}× 放大)`,
            latex: `\\chi^2_{k \\cdot n} = k \\cdot \\chi^2_{\\text{基准}}`,
            condition: "各格频数等比例放大 $k$ 倍（即条件频率分布保持不变）",
            note: `【统计功效】样本容量扩大 $k$ 倍，$\\chi^2$ 严格等比放大 $k$ 倍（基准 ${(res.chiSquare / mult).toFixed(3)} $\\to$ 当前 ${res.chiSquare.toFixed(3)}）。大样本量下极微弱的比例落差也能达到显著性。`,
            level: "important" as const,
          },
        ]
      : isIndependentScenario
        ? [
            {
              name: "2×2 列联表卡方检验统计量公式",
              latex: `\\chi^2 = \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)}`,
              condition:
                "大样本容量 $n \\ge 40$ 且各理论期望频数 $E_{ij} \\ge 5$",
              note: "其中 $n = a+b+c+d$ 为总样本量。",
              level: "core" as const,
            },
            {
              name: "零假设独立充要条件定理",
              latex: `ad - bc = 0 \\iff \\chi^2 = 0`,
              condition: "两分类变量在样本中完全不相关时",
              note: "对角乘积之差 $ad - bc = 0$ 是两组条件频率 $\\frac{a}{a+b} = \\frac{c}{c+d}$ 完全相等的充要条件，此时 $\\chi^2$ 恒为 0，完全无法拒绝零假设。",
              level: "important" as const,
            },
          ]
        : [
            {
              name: "2×2 列联表卡方检验统计量公式",
              latex: `\\chi^2 = \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)}`,
              condition:
                "大样本容量 $n \\ge 40$ 且各理论期望频数 $E_{ij} \\ge 5$",
              note: "新课标高考解答题必背公式，其中 $n = a+b+c+d$ 为样本总量。",
              level: "core" as const,
            },
            {
              name: "新课标高考常用卡方临界值表",
              latex: `x_{0.05} = 3.841, \\quad x_{0.01} = 6.635, \\quad x_{0.001} = 10.828`,
              condition: "在零假设 $H_0$ 成立的前提下，用于判断是否拒绝 $H_0$",
              note: "新高考核心临界点：$\\alpha=0.05$ 对应 $3.841$（$95\\%$ 把握）；$\\alpha=0.01$ 对应 $6.635$（$99\\%$ 把握）。若 $\\chi^2 \\ge x_\\alpha$ 则拒绝 $H_0$。",
              level: "core" as const,
            },
          ];

    // 3. 高考要点与阅卷防坑指南（精炼直击考法）
    const dynamicGaokaoPoints = isScaleScenario
      ? [
          {
            text: "【高考高阶·样本量倍增效应】在条件频率比例不变的前提下，样本总量扩大 k 倍，χ² 观测值将严格扩大 k 倍。必须注意控制大样本统计假阳性。",
            importance: "gaokao" as const,
          },
          {
            text: "【高考避坑·相关性 ≠ 因果性】独立性检验只能得出“两变量有统计关联”，绝不能推断出“X 是引起 Y 的原因”或“X 导致 Y 的概率是 95%”。",
            importance: "gaokao" as const,
          },
        ]
      : isIndependentScenario
        ? [
            {
              text: "【高考考点·独立性与零假设】当 ad - bc = 0 时，两分类变量在样本中完全独立，χ² = 0 < 3.841，此时必须规范作答“没有充分证据推翻零假设”。",
              importance: "gaokao" as const,
            },
            {
              text: "【高考避坑·零假设不能表述为必然】接受 H₀ 仅代表当前数据无证据拒绝独立，绝不能表述为“在总体中已经 100% 证明两者完全无关”。",
              importance: "gaokao" as const,
            },
          ]
        : [
            {
              text: "【高考考点·小概率反证法】在 H₀ 成立前提下，χ² ≥ 3.841 属于小概率事件（P ≤ 0.05）。小概率事件在一次试验中发生，故有充分理由拒绝 H₀。",
              importance: "gaokao" as const,
            },
            {
              text: "【高考避坑·相关性 ≠ 因果性】独立性检验只能得出“变量 X 与 Y 有统计关联”，绝不能断言因果关系；“95% 把握”指推断犯错误的概率不超过 0.05。",
              importance: "gaokao" as const,
            },
          ];

    return {
      quantities: [
        {
          label: "样本总量",
          symbol: "n",
          value: `${res.n}${mult > 1 ? ` (${mult}×)` : ""}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "对角乘积差",
          symbol: "|ad - bc|",
          value: `${Math.abs(res.adMinusBc)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "卡方检验值",
          symbol: "\\chi^2",
          value: res.chiSquare.toFixed(3),
          color: res.p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary,
        },
        {
          label: "95% 临界比对",
          symbol: "x_{0.05}",
          value: res.p95 ? "3.841 (显著)" : "3.841 (未达)",
          color: res.p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.textMuted,
        },
      ],
      theorems: dynamicTheorems,
      gaokaoPoints: dynamicGaokaoPoints,
      reasoningSteps,
      warnings,
      examAnchor: "人教A版选必三 · 统计推断解答题高频",
      mnemonic:
        "先设独立零假设，四格对角算卡方；临界三八四一跨，有关结论犯错低。",
    };
  }
}
