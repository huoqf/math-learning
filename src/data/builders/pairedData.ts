import type {
  MathPanelData,
  MathQuantity,
  WarningItem,
  ReasoningStep,
} from "../types";
import {
  calculateLinearRegression,
  calculateIndependenceTest,
  calculateOutlierComparison,
  fitAllRegressionModels,
  isRegressionTargetInDomain,
  REGRESSION_PRESETS,
  INDEPENDENCE_PRESETS,
  Point2D,
  RegressionModelType,
} from "@/math/pairedData";
import { MATH_COLORS } from "@/theme";
import {
  INDEPENDENCE_ANSWER_STEPS,
  REGRESSION_ANSWER_STEPS,
} from "../registries/pairedData";

export function buildPairedDataPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) ?? "regression";
  const customPoints = config?.points as Point2D[] | undefined;

  if (studyMode === "regression") {
    const scenarioKey = (config?.scenarioKey as string) ?? "ad_sales";
    const preset =
      REGRESSION_PRESETS.find((p) => p.id === scenarioKey) ??
      REGRESSION_PRESETS[
        Math.min(
          REGRESSION_PRESETS.length - 1,
          Math.max(0, Math.round(params.presetIndex ?? 0)),
        )
      ];
    const points = customPoints ?? preset.points;

    const res = calculateLinearRegression(points);
    const modelFits = fitAllRegressionModels(points);
    const selectedModel = ((config?.selectedModel as string) ??
      "linear") as RegressionModelType;
    const currentModelFit = modelFits.find((m) => m.type === selectedModel);

    const isLinearMode = selectedModel === "linear";
    const isOutlierScenario = scenarioKey === "outlier";
    const targetX = Number(params.targetX ?? preset.targetX ?? 10);
    const isTargetInDomain = isRegressionTargetInDomain(selectedModel, targetX);
    const targetUnit = preset.targetUnit ? ` ${preset.targetUnit}` : "";

    // 动态组装定理体系：纵向多行对齐，彻底消除超宽缩放
    const dynamicTheorems = isLinearMode
      ? [
          {
            name: "一元线性回归方程与最小二乘法",
            latex: `\\begin{aligned} \\hat{y} &= \\color{${MATH_COLORS.paramPrimary}}{\\hat{b}}x + \\color{${MATH_COLORS.paramSecondary}}{\\hat{a}} \\\\[6pt] \\hat{b} &= \\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum_{i=1}^{n}(x_i-\\bar{x})^2} \\\\[6pt] \\hat{a} &= \\bar{y} - \\hat{b}\\bar{x} \\end{aligned}`,
            note: "回归直线必过样本中心点 $(\\bar{x}, \\bar{y})$；最小二乘法使残差平方和 $\\text{SSE} = \\sum(y_i - \\hat{y}_i)^2$ 达到全局最小。",
            level: "core" as const,
          },
          {
            name: "样本相关系数 r 与决定系数 R² 的统计意义",
            latex: `\\begin{aligned} r &= \\frac{\\sum_{i=1}^n(x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum_{i=1}^n(x_i-\\bar{x})^2 \\sum_{i=1}^n(y_i-\\bar{y})^2}} \\\\[6pt] R^2 &= 1 - \\frac{\\sum_{i=1}^n (y_i - \\hat{y}_i)^2}{\\sum_{i=1}^n (y_i - \\bar{y})^2} \\\\[6pt] R^2 &= r^2 \\quad (\\text{一元线性回归恒等式}) \\end{aligned}`,
            note: "$r$ 与 $\\hat{b}$ 同号；$|r| \\ge 0.75$ 认为线性相关性很强；$R^2$ 越接近 $1$ 说明模型拟合优度越高、预报可靠性越强。**一元线性回归中 $R^2 = r^2$ 恒成立**：决定系数就是相关系数的平方，故 $R^2$ 不能为负、也不能超过 $1$；换成非线性模型后该恒等式不再成立，$R^2$ 与 $r$ 必须分开计算。",
            level: "important" as const,
          },
        ]
      : [
          {
            name: `非线性回归转换模型 (${currentModelFit?.name ?? "换元线性化"})`,
            latex: `\\begin{aligned} \\text{经验模型: } & y = f(x; \\theta) \\\\[4pt] \\text{换元变换: } & z = g(y), \\quad u = h(x) \\\\[4pt] \\text{线性形式: } & z = \\hat{a}_0 + \\hat{k}u \\end{aligned}`,
            note: `${currentModelFit ? `当前经验回归方程：$${currentModelFit.originalFormula}$；` : ""}${
              currentModelFit?.isBest
                ? "【当前模型拟合优度最高】在候选非线性模型中决定系数 $R^2$ 最大、残差平方和 $\\text{SSE}$ 最小。"
                : "先通过变量代换化为线性方程求解参数，最后务必逆代换回原物理变量得到预测方程。"
            }`,
            level: "core" as const,
          },
          {
            name: "经验模型比较与决定系数 R² 准则",
            latex: `R^2 = 1 - \\frac{\\text{SSE}}{\\text{SST}} = 1 - \\frac{\\sum_{i=1}^n (y_i - \\hat{y}_i)^2}{\\sum_{i=1}^n (y_i - \\bar{y})^2}`,
            note: "高考大题核心判定依据：决定系数 $R^2$ 越接近 $1$（残差平方和 $\\text{SSE}$ 越小），模型的拟合效果越好。",
            level: "important" as const,
          },
        ];

    // 动态组装高考考点：根据情境置顶特化
    const dynamicGaokaoPoints = isOutlierScenario
      ? [
          {
            text: "【高考考点·离群点检验】异常干扰点会产生巨大的“杠杆拉扯效应”，导致相关系数 $r$ 暴跌、斜率严重偏离，高考大题常考异常点识别与清洗后的重新拟合。",
            importance: "gaokao" as const,
          },
          {
            text: "【高考考点·残差分析法】残差 $e_i = y_i - \\hat{y}_i$，且 $\\sum e_i = 0$。残差点在 $e=0$ 上下带状区域越窄，说明拟合精度越高。",
            importance: "core" as const,
          },
          {
            text: "【高考考点·样本中心点】不论是否存在离群点，最小二乘回归直线必定严格过样本中心点 $(\\bar{x}, \\bar{y})$。",
            importance: "basic" as const,
          },
        ]
      : !isLinearMode
        ? [
            {
              text: "【高考考点·非线性线性化】熟练掌握四大换元模型：指数 $y=c_1 e^{c_2 x}$ (令 $z=\\ln y$)、对数 $y=c_1+c_2\\ln x$ (令 $u=\\ln x$)、幂函数 $y=c_1 x^{c_2}$ (令 $z=\\ln y, u=\\ln x$)、双曲线 $y=c_1+c_2/x$ (令 $u=1/x$)。",
              importance: "gaokao" as const,
            },
            {
              text: "【高考考点·模型优选决策】在高考大题中比较多种经验模型时，依据决定系数 $R^2$ 较大或残差平方和 $\\text{SSE}$ 较小确定最佳拟合模型。",
              importance: "core" as const,
            },
            {
              text: "【高考考点·方程代回还原】求解出线性转换方程后，务必逆代换回原物理自变量与因变量（如将 $z$ 还原为 $\\ln y$ 解出 $y$），严防漏步失分。",
              importance: "core" as const,
            },
          ]
        : [
            {
              text: "【高考考点1】必过样本中心点：已知 $(\\bar{x}, \\bar{y})$ 与 $\\hat{b}$，必有 $\\hat{a} = \\bar{y} - \\hat{b}\\bar{x}$（小题高频秒杀点）。",
              importance: "gaokao" as const,
            },
            {
              text: "【高考考点2】相关系数同号性：$r$ 与回归斜率 $\\hat{b}$ 的符号一致，正相关时 $r>0, \\hat{b}>0$；负相关时 $r<0, \\hat{b}<0$。",
              importance: "gaokao" as const,
            },
            {
              text: "【高考考点3】残差分析法：残差 $e_i = y_i - \\hat{y}_i$，且 $\\sum e_i = 0$。残差点在 $e=0$ 上下带状区域越窄，拟合越精确。",
              importance: "core" as const,
            },
            {
              text: "【高考考点4】决定系数与拟合优度：$R^2$ 越接近 $1$ 说明回归直线对观测数据的解释能力越强。",
              importance: "basic" as const,
            },
          ];

    // 高考解答题标准三步推演链（纵向分行教材对齐版：每行宽度 ≤ 240px，100% 满字号无缩小）
    let reasoningSteps: ReasoningStep[] = [];

    // 高考答题数值格式化规范：系数与指标精炼保留2位，相关系数与R²保留4位，消除无脑尾零
    const fmt2 = (n: number) => {
      const rounded = Math.round(n * 100) / 100;
      return rounded.toFixed(2);
    };
    const fmt4 = (n: number) => {
      const rounded = Math.round(n * 10000) / 10000;
      return rounded.toFixed(4);
    };

    const bFormatted = fmt2(res.b);
    const aFormatted = fmt2(res.a);
    const targetYDesc = preset?.yName
      ? preset.yName.replace(/\s*\(.*?\)/, "").trim()
      : "观测值";

    const makeStep = (step: {
      step: number;
      title: string;
      latexBlocks?: string[];
      latex?: string;
      detail?: string;
      rubric?: string;
    }): ReasoningStep => ({
      ...step,
      latex: step.latex ?? step.latexBlocks?.join(" \\\\ ") ?? "",
      latexBlocks: step.latexBlocks,
    });

    const outlierComp =
      res.isValid && isOutlierScenario && isLinearMode
        ? calculateOutlierComparison(points)
        : null;

    if (res.isValid) {
      if (isOutlierScenario) {
        // 离群点情境：展示“含异常点 vs 剔除异常点”的高考对比作答链
        const lastPt = points[points.length - 1];
        const cleaned = outlierComp?.cleaned ?? res;
        const cleanedPred = cleaned.b * targetX + cleaned.a;
        const cleanedB = fmt2(cleaned.b);
        const cleanedA = fmt2(cleaned.a);

        reasoningSteps = [
          makeStep({
            step: REGRESSION_ANSWER_STEPS[0].step,
            title: REGRESSION_ANSWER_STEPS[0].title,
            latexBlocks: [
              `\\begin{aligned} r &= \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum (x_i-\\bar{x})^2 \\sum (y_i-\\bar{y})^2}} \\\\[4pt] &= \\frac{${fmt2(res.lxy)}}{\\sqrt{${fmt2(res.lxx)} \\times ${fmt2(res.lyy)}}} \\approx ${fmt4(res.r)} \\end{aligned}`,
              `P_{${points.length}}(${lastPt.x}, ${lastPt.y}) \\text{ 显著偏离主样本带}`,
            ],
            detail: `受异常干扰点 $P_{${points.length}}(${lastPt.x}, ${lastPt.y})$ 的杠杆拉扯影响，全样本相关系数跌至 $|r| \\approx ${fmt4(Math.abs(res.r))} < 0.75$，线性相关性受损。新高考解答题中需先指出该离群数据并执行剔除。`,
            rubric:
              "【高考采分点】指出离群点坐标并说明其对相关系数的杠杆拉扯破坏得 2 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[1].step,
            title: REGRESSION_ANSWER_STEPS[1].title,
            latexBlocks: [
              `\\begin{aligned} \\hat{b} &= \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2} = \\frac{${fmt2(cleaned.lxy)}}{${fmt2(cleaned.lxx)}} \\approx ${cleanedB} \\\\[4pt] \\hat{a} &= \\bar{y} - \\hat{b}\\bar{x} \\approx ${cleanedA} \\end{aligned}`,
              `\\hat{y} = ${cleanedB}x ${cleaned.a >= 0 ? "+" : "-"} ${fmt2(Math.abs(cleaned.a))}`,
            ],
            detail: `剔除异常干扰点后，相关系数跃升至 $r_{\\text{clean}} \\approx ${fmt4(cleaned.r)}$，呈现极强线性相关关系。重新代入求和数据求得经验回归方程。`,
            rubric: "【高考采分点】清洗后正确代入求和数据求出回归方程得 3 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[2].step,
            title: REGRESSION_ANSWER_STEPS[2].title,
            latexBlocks: [
              `\\begin{aligned} \\hat{y}_0 &= ${cleanedB} \\times ${targetX} ${cleaned.a >= 0 ? "+" : "-"} ${fmt2(Math.abs(cleaned.a))} \\\\[4pt] &= ${fmt2(cleanedPred)}\\text{ (${targetUnit})} \\end{aligned}`,
              `\\begin{aligned} R^2_{\\text{clean}} &\\approx ${fmt4(cleaned.rSquare)} \\\\[4pt] (\\text{清洗前 } R^2 &\\approx ${fmt4(res.rSquare)}) \\end{aligned}`,
            ],
            detail: `决定系数从剔除前的 $${fmt4(res.rSquare)}$ 飞跃至 $${fmt4(cleaned.rSquare)}$，模型对观测数据的解释能力大幅提升。消除异常点后的预报值 $\\hat{y}_0 = ${fmt2(cleanedPred)}$${targetUnit} 具有高度置信价值。`,
            rubric:
              "【高考采分点】准确计算目标预报值并完成拟合优度对比分析得 2 分。",
          }),
        ];
      } else if (isLinearMode) {
        // 一元线性回归模式：多公式分块卡片化，行宽严格控制在 180px 内，100% 满字号
        const predictedY = res.b * targetX + res.a;

        reasoningSteps = [
          makeStep({
            step: REGRESSION_ANSWER_STEPS[0].step,
            title: REGRESSION_ANSWER_STEPS[0].title,
            latexBlocks: [
              `\\bar{x} = \\frac{${res.sumX.toFixed(1)}}{${res.n}} = ${fmt2(res.meanX)}, \\quad \\bar{y} = \\frac{${res.sumY.toFixed(1)}}{${res.n}} = ${fmt2(res.meanY)}`,
              `\\begin{aligned} r &= \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum (x_i-\\bar{x})^2 \\sum (y_i-\\bar{y})^2}} \\\\[4pt] &= \\frac{${fmt2(res.lxy)}}{\\sqrt{${fmt2(res.lxx)} \\times ${fmt2(res.lyy)}}} \\approx ${fmt4(res.r)} \\end{aligned}`,
            ],
            detail: `因为 $|r| \\approx ${fmt4(Math.abs(res.r))} ${Math.abs(res.r) >= 0.75 ? "\\ge 0.75$" : "< 0.75$"}，说明两变量具有${Math.abs(res.r) >= 0.75 ? "很强的" : "较弱的"}线性相关关系（${res.r >= 0 ? "正相关" : "负相关"}），可以用一元线性回归模型进行拟合。`,
            rubric:
              "【高考采分点】正确计算样本中心并代入求和项求得相关系数 r 判定线性相关性得 3 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[1].step,
            title: REGRESSION_ANSWER_STEPS[1].title,
            latexBlocks: [
              `\\begin{aligned} \\hat{b} &= \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2} \\\\[4pt] &= \\frac{${fmt2(res.lxy)}}{${fmt2(res.lxx)}} \\approx ${bFormatted} \\\\[6pt] \\hat{a} &= \\bar{y} - \\hat{b}\\bar{x} = ${fmt2(res.meanY)} - ${bFormatted} \\times ${fmt2(res.meanX)} \\\\[4pt] &\\approx ${aFormatted} \\end{aligned}`,
              `\\hat{y} = ${bFormatted}x ${res.a >= 0 ? "+" : "-"} ${fmt2(Math.abs(res.a))}`,
            ],
            detail:
              "高考答题规范：严禁直接跳步书写孤立数值！必须按「① 写出最小二乘求和公式 $\\to$ ② 代入离差乘积和与平方和 $\\to$ ③ 算出斜率截距并写出回归方程」三步完整演绎。",
            rubric:
              "【高考采分点】写出最小二乘斜率公式代入数据并规范求出回归方程得 4 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[2].step,
            title: REGRESSION_ANSWER_STEPS[2].title,
            latexBlocks: [
              `\\begin{aligned} \\hat{y}_0 &= ${bFormatted} \\times ${targetX} ${res.a >= 0 ? "+" : "-"} ${fmt2(Math.abs(res.a))} \\\\[4pt] &= ${fmt2(predictedY)}\\text{ (${targetUnit})} \\end{aligned}`,
              `\\begin{aligned} R^2 &= 1 - \\frac{\\sum (y_i-\\hat{y}_i)^2}{\\sum (y_i-\\bar{y})^2} \\\\[4pt] &= 1 - \\frac{${fmt2(res.sse)}}{${fmt2(res.sst)}} \\approx ${fmt4(res.rSquare)} \\end{aligned}`,
            ],
            detail: `决定系数 $R^2 \\approx ${fmt4(res.rSquare)}$ 越接近 $1$，说明所建回归方程对观测数据的解释能力越强。根据回归模型，预测目标自变量 $x = ${targetX}$ 时，${targetYDesc}约为 $${fmt2(predictedY)}$${targetUnit}。`,
            rubric:
              "【高考采分点】准确代入自变量目标值求出预报值并给出决定系数评价得 2 分。",
          }),
        ];
      } else if (!currentModelFit) {
        const modelNameMap: Record<RegressionModelType, string> = {
          linear: "一元线性模型",
          exponential: "指数模型（要求全体 $y_i > 0$）",
          logarithmic: "对数模型（要求全体 $x_i > 0$）",
          power: "幂函数模型（要求全体 $x_i > 0$ 且 $y_i > 0$）",
          inverse: "双曲线模型（要求全体 $x_i \\neq 0$）",
        };
        reasoningSteps = [
          makeStep({
            step: REGRESSION_ANSWER_STEPS[0].step,
            title: REGRESSION_ANSWER_STEPS[0].title,
            latexBlocks: [`\\text{定义域检验不通过}`],
            detail: `当前散点数据不满足${modelNameMap[selectedModel]}的换元定义域要求（对数变换需正数、倒数变换需非零），无法构建对应非线性模型。`,
            rubric:
              "【高考采分点】检验换元公式定义域并指出越界散点位置得 2 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[1].step,
            title: REGRESSION_ANSWER_STEPS[1].title,
            latexBlocks: [`\\text{无法执行线性化还原}`],
            detail:
              "请将散点拖回正域/非零域后再进行换元拟合，或切换至其它适用模型。",
            rubric:
              "【高考采分点】说明定义域受限原因，严禁强行对负数取对数或零作分母，得 4 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[2].step,
            title: REGRESSION_ANSWER_STEPS[2].title,
            latexBlocks: [`\\text{模型暂不可用}`],
            detail: "样本满足定义域前提后即可重新展示决定系数 $R^2$ 与预报值。",
            rubric: "【高考采分点】明确模型适用条件得 2 分。",
          }),
        ];
      } else {
        // 非线性回归转换模式：变量代换与逆变换还原标准解答链
        const currentPred = isTargetInDomain
          ? currentModelFit.predict(targetX)
          : NaN;

        reasoningSteps = [
          makeStep({
            step: REGRESSION_ANSWER_STEPS[0].step,
            title: REGRESSION_ANSWER_STEPS[0].title,
            latexBlocks: [
              `y = f(x; \\theta)`,
              `\\begin{aligned} \\text{换元: } & ${currentModelFit.variableSubstitution} \\\\[4pt] \\text{形式: } & ${currentModelFit.transformedFormula} \\end{aligned}`,
            ],
            detail: `针对非线性数据分布特征（${currentModelFit.name}），通过引入中间变量换元，将非线性回归问题化为关于新变量的一元线性回归模型。`,
            rubric: "【高考采分点】选定合理置换公式并建立线性形式得 2 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[1].step,
            title: REGRESSION_ANSWER_STEPS[1].title,
            latexBlocks: [
              `\\text{线性方程: } ${currentModelFit.transformedFormula}`,
              `\\text{还原方程: } ${currentModelFit.originalFormula}`,
            ],
            detail:
              "高考采分关键：在线性化求解出参数后，务必逆代换回原物理变量，还原出以原变量 $x, y$ 表达的经验回归方程。",
            rubric:
              "【高考采分点】求得转换方程参数并准确逆代换还原原方程得 4 分。",
          }),
          makeStep({
            step: REGRESSION_ANSWER_STEPS[2].step,
            title: REGRESSION_ANSWER_STEPS[2].title,
            latexBlocks: [
              isTargetInDomain
                ? `\\hat{y}_0 = ${fmt2(currentPred)}\\text{ (${targetUnit})}`
                : `x_0 = ${targetX} \\notin \\text{定义域（无意义）}`,
              `\\begin{aligned} R^2 &= 1 - \\frac{\\text{SSE}}{\\text{SST}} \\\\[4pt] &\\approx ${fmt4(currentModelFit.rSquare)} \\end{aligned}`,
            ],
            detail: isTargetInDomain
              ? `当前模型在原观测变量上的决定系数为 $R^2 \\approx ${fmt4(currentModelFit.rSquare)}$，残差平方和 $\\text{SSE} = ${fmt2(currentModelFit.sse)}$。预测目标自变量 $x = ${targetX}$ 时，${targetYDesc}约为 $${fmt2(currentPred)}$${targetUnit}。`
              : `当前目标预报点 $x_0 = ${targetX}$ 不在「${currentModelFit.name}」的数学定义域内（对数/幂函数须 $x_0 > 0$，双曲线须 $x_0 \\neq 0$），请向右/远离零点调节 $x_0$。`,
            rubric:
              "【高考采分点】准确代入计算预报值并结合 R² 评估模型拟合效果得 2 分。",
          }),
        ];
      }
    }

    const denomLxy = res.lxy;
    const isLxyPos = denomLxy >= 0;
    const cleanedRes = outlierComp?.cleaned;
    const rawPredictedY = res.b * targetX + res.a;
    const cleanedPredictedY = cleanedRes
      ? cleanedRes.b * targetX + cleanedRes.a
      : rawPredictedY;

    const quantities: MathQuantity[] = isLinearMode
      ? [
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
            label: "乘积和 ∑(xᵢ-x̄)(yᵢ-ȳ)",
            value: `${res.lxy.toFixed(2)}`,
            color: isLxyPos
              ? MATH_COLORS.paramPrimary
              : MATH_COLORS.paramTertiary,
          },
          {
            label: "离差和 ∑(xᵢ-x̄)²",
            value: `${res.lxx.toFixed(2)}`,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: cleanedRes ? "清洗后斜率 b̂_clean" : "回归斜率 b̂",
            value: cleanedRes
              ? `${cleanedRes.b.toFixed(4)} (原 ${res.b.toFixed(4)})`
              : `${res.b.toFixed(4)}`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: cleanedRes ? "清洗后截距 â_clean" : "回归截距 â",
            value: cleanedRes
              ? `${cleanedRes.a.toFixed(4)} (原 ${res.a.toFixed(4)})`
              : `${res.a.toFixed(4)}`,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: cleanedRes ? "相关系数 r (清洗前→后)" : "样本相关系数 r",
            value: cleanedRes
              ? `${res.r.toFixed(4)} → ${cleanedRes.r.toFixed(4)}`
              : `${res.r.toFixed(4)}`,
            color:
              res.r >= 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary,
          },
          {
            label: cleanedRes ? "决定系数 R² (清洗前→后)" : "决定系数 R²",
            value: cleanedRes
              ? `${res.rSquare.toFixed(4)} → ${cleanedRes.rSquare.toFixed(4)}`
              : `${res.rSquare.toFixed(4)}`,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "残差平方和 SSE",
            value: `${(cleanedRes ?? res).sse.toFixed(2)}`,
            color: MATH_COLORS.tangentLine,
          },
          {
            label: cleanedRes
              ? `清洗后预报值 ŷ₀ (x₀=${targetX})`
              : `预报值 ŷ₀ (x₀=${targetX})`,
            value: cleanedRes
              ? `${cleanedPredictedY.toFixed(2)}${targetUnit} (含异常点: ${rawPredictedY.toFixed(2)}${targetUnit})`
              : `${rawPredictedY.toFixed(2)}${targetUnit}`,
            color: MATH_COLORS.paramPrimary,
          },
        ]
      : !currentModelFit
        ? [
            {
              label: "样本容量 n",
              value: `${res.n}`,
              color: MATH_COLORS.paramPrimary,
            },
            {
              label: "所选模型状态",
              value: "定义域受限（不可拟合）",
              color: MATH_COLORS.degeneracy,
              highlight: "extreme",
            },
          ]
        : [
            {
              label: "样本容量 n",
              value: `${res.n}`,
              color: MATH_COLORS.paramPrimary,
            },
            {
              label: "拟合模型类型",
              value: currentModelFit.name,
              color: MATH_COLORS.paramSecondary,
            },
            {
              label: "换元线性方程",
              value: `$${currentModelFit.transformedFormula}$`,
              color: MATH_COLORS.paramPrimary,
            },
            {
              label: "还原经验方程",
              value: `$${currentModelFit.originalFormula}$`,
              color: MATH_COLORS.paramSecondary,
            },
            {
              label: "原空间决定系数 R²",
              value: `${currentModelFit.rSquare.toFixed(4)}`,
              color: MATH_COLORS.paramSecondary,
            },
            {
              label: "原空间残差和 SSE",
              value: `${currentModelFit.sse.toFixed(2)}`,
              color: MATH_COLORS.tangentLine,
            },
            {
              label: "最优模型判定",
              value: currentModelFit.isBest
                ? "★ 全候选模型中 R² 最高"
                : "候选模型比较中",
              color: currentModelFit.isBest
                ? MATH_COLORS.paramPrimary
                : MATH_COLORS.textMuted,
            },
            {
              label: `预报值 ŷ₀ (x₀=${targetX})`,
              value: isTargetInDomain
                ? `${currentModelFit.predict(targetX).toFixed(2)}${targetUnit}`
                : "超出模型定义域（无定义）",
              color: isTargetInDomain
                ? MATH_COLORS.paramPrimary
                : MATH_COLORS.degeneracy,
            },
          ];

    const domainWarnings: WarningItem[] = [];
    if (!isLinearMode && !currentModelFit) {
      domainWarnings.push({
        level: "danger",
        text: "【定义域违规】当前散点存在 $x_i \\le 0$ 或 $y_i \\le 0$（或 $x_i = 0$），无法进行对数/指数/倒数换元拟合，请把越界点拖回有效定义域。",
      });
    } else if (!isLinearMode && !isTargetInDomain) {
      domainWarnings.push({
        level: "warning",
        text: `【预报点定义域受限】预测值 $x_0 = ${targetX}$ 不在当前非线性模型定义域内（需满足 $x_0 > 0$ 或 $x_0 \\neq 0$）。`,
      });
    }

    return {
      quantities,
      theorems: dynamicTheorems,
      gaokaoPoints: dynamicGaokaoPoints,
      reasoningSteps,
      warnings: [
        ...domainWarnings,
        ...(res.isValid
          ? isLinearMode && Math.abs(res.r) < 0.3
            ? [
                {
                  text: "【相关性较弱】|r| < 0.3 说明线性相关程度低，直接使用线性模型预测误差较大，建议尝试非线性模型转换。",
                  level: "warning" as const,
                },
              ]
            : []
          : [
              {
                text: `【模型退化】${res.message ?? "数据无法计算回归方程"}`,
                level: "warning" as const,
              },
            ]),
      ],
      examAnchor:
        "选择性必修三核心 · 一元线性回归方程与非线性换元拟合（13-15分）",
      mnemonic:
        "回归必过中心点，先算斜率后算截；离差乘积除平方，相关决定看贴合。",
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
    //    步号与标题取自 `INDEPENDENCE_ANSWER_STEPS`（SSOT），与左屏 StepNavigator、
    //    中屏 IndependenceScene 分区高亮三方同源，改标题/调步序不会各改一半而错位。
    const denomProduct = res.row1 * res.row2 * res.col1 * res.col2;

    const reasoningSteps: ReasoningStep[] = [
      {
        step: INDEPENDENCE_ANSWER_STEPS[0].step,
        title: INDEPENDENCE_ANSWER_STEPS[0].title,
        latex: `H_0: X \\text{ 与 } Y \\text{ 相互独立}`,
        detail: `设零假设 $H_0$：${preset.labelA} 与 ${preset.labelB} 相互独立（即两变量无关联）。解答题第一步规范书写 $H_0$，为小概率反证法确立逻辑前提。`,
        rubric: "【高考采分点】规范写出零假设 H₀ 得 1 分。",
      },
      {
        step: INDEPENDENCE_ANSWER_STEPS[1].step,
        title: INDEPENDENCE_ANSWER_STEPS[1].title,
        latex: `\\chi^2 = \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)} \\\\ = \\frac{${res.n} \\times (${a} \\times ${d} - ${b} \\times ${c})^2}{${res.row1} \\times ${res.row2} \\times ${res.col1} \\times ${res.col2}} \\\\ = \\frac{${res.n} \\times (${res.adMinusBc})^2}{${denomProduct}} \\approx ${res.chiSquare.toFixed(3)}`,
        detail:
          "新高考评分细则：严禁直接跳步给出孤立数值！必须按「符号公式 $\\to$ 四格实际数据代入 $\\to$ 结果化简」三步规范书写，保证得分完整。",
        rubric: "【高考采分点】公式与数据代入正确并准确计算化简得 3 分。",
      },
      {
        step: INDEPENDENCE_ANSWER_STEPS[2].step,
        title: INDEPENDENCE_ANSWER_STEPS[2].title,
        latex: criticalComparisonLatex,
        detail: `${conclusionDetail}【阅卷避坑】独立性检验只能推断“两变量具有统计关联”，绝不可断言因果必然关系；未达临界值时严禁表述为“绝对证明两者无关”。`,
        rubric: "【高考采分点】临界值比对正确且小概率推断结论严谨得 2 分。",
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
