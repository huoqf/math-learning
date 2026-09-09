import type { ParamConfig } from "@/components/UI";
import { MATH_COLORS } from "@/theme";
import { paramMeta } from "@/data/registries/probabilityBayes";

export type BayesMode = "conditional" | "total_prob" | "bayes" | "markov";
export type CondScenario = "free" | "independent" | "correlated" | "exclusive";
export type TotalScenario = "free" | "factory3" | "balanced" | "warner";
export type BayesScenario = "free" | "screening" | "factory";
export type MarkovScenario =
  "free" | "pass_ball" | "pass_ball_3" | "urn_ball" | "weather";

export interface BayesScenarioCtx {
  activeMode: BayesMode;
  condScenario: CondScenario;
  totalScenario: TotalScenario;
  bayesScenario: BayesScenario;
  markovScenario: MarkovScenario;
}

/* ── 悬浮 KaTeX 公式（三位一体色彩深度绑定与全数值闭环）── */
export function getModeFormulaLatex(
  activeMode: BayesMode,
  params: Record<string, number>,
  totalScenario: TotalScenario,
  bayesScenario: BayesScenario,
): string {
  if (activeMode === "conditional") {
    const pABVal = Math.min(
      params.pAB ?? 0.2,
      Math.min(params.pA ?? 0.5, params.pB ?? 0.4),
    ).toFixed(2);
    const pAVal = (params.pA ?? 0.5).toFixed(2);
    const pBGivenA =
      (params.pA ?? 0.5) > 0
        ? ((params.pAB ?? 0.2) / (params.pA ?? 0.5)).toFixed(3)
        : "\\text{无意义}"; // formula: LaTeX片段
    return `\\color{${MATH_COLORS.function}}{P(B|A)} = \\frac{\\color{${MATH_COLORS.paramTertiary}}{P(AB)}}{\\color{${MATH_COLORS.paramPrimary}}{P(A)}} = \\frac{${pABVal}}{${pAVal}} = ${pBGivenA}`;
  }
  if (activeMode === "total_prob") {
    if (totalScenario === "warner") {
      const pCard = params.pCard ?? 0.8;
      const pReportYes = params.pReportYes ?? 0.36;
      const denom = 2 * pCard - 1;
      const pReal =
        denom !== 0
          ? Math.max(0, Math.min(1, (pReportYes - (1 - pCard)) / denom))
          : 0;
      return `\\color{${MATH_COLORS.function}}{P(\\text{Yes})} = \\color{${MATH_COLORS.paramPrimary}}{${pCard.toFixed(2)}} p_{\\text{real}} + ${(1 - pCard).toFixed(2)}(1 - p_{\\text{real}}) \\implies \\color{${MATH_COLORS.function}}{p_{\\text{real}}} = ${(pReal * 100).toFixed(1)}\\%`;
    }
    const pA1 = params.pA1 ?? 0.4;
    const pA2 = params.pA2 ?? 0.35;
    const pA3 = Math.max(0, 1 - pA1 - pA2);
    const pB_A1 = params.pB_A1 ?? 0.6;
    const pB_A2 = params.pB_A2 ?? 0.3;
    const pB_A3 = params.pB_A3 ?? 0.8;
    const pB = pA1 * pB_A1 + pA2 * pB_A2 + pA3 * pB_A3;

    return `\\color{${MATH_COLORS.function}}{P(B)} = \\sum_{i=1}^3 P(A_i)P(B|A_i) = \\color{${MATH_COLORS.paramPrimary}}{${pA1.toFixed(2)}}\\times ${pB_A1.toFixed(2)} + \\color{${MATH_COLORS.paramSecondary}}{${pA2.toFixed(2)}}\\times ${pB_A2.toFixed(2)} + \\color{${MATH_COLORS.paramTertiary}}{${pA3.toFixed(2)}}\\times ${pB_A3.toFixed(2)} = ${(pB * 100).toFixed(2)}\\%`;
  }
  if (activeMode === "bayes") {
    const pD = params.pPriorD ?? 0.02;
    const pNotD = 1 - pD;
    const pSens = params.pSensitivity ?? 0.95;
    const pFalse = params.pFalsePositive ?? 0.05;

    const pTrueJoint = pD * pSens;
    const pFalseJoint = pNotD * pFalse;
    const pTotalPos = pTrueJoint + pFalseJoint;
    const pPosterior = pTotalPos > 0 ? (pTrueJoint / pTotalPos) * 100 : 0;

    const isFactory = bayesScenario === "factory";
    const targetSymbol = isFactory ? "\\text{Def}" : "D";

    return `\\color{${MATH_COLORS.derivative}}{P(${targetSymbol}|+)} = \\frac{${pD.toFixed(3)} \\times ${pSens.toFixed(2)}}{${pD.toFixed(3)} \\times ${pSens.toFixed(2)} + ${pNotD.toFixed(3)} \\times ${pFalse.toFixed(2)}} = ${pPosterior.toFixed(2)}\\%`;
  }
  // markov 模式
  const p11 = params.p11 ?? 0.0;
  const p21 = params.p21 ?? 0.5;
  const lambda = p11 - p21;
  const lambdaStr = lambda >= 0 ? lambda.toFixed(2) : `(${lambda.toFixed(2)})`;
  const betaStr = p21.toFixed(2);
  return `\\color{${MATH_COLORS.function}}{p_{n+1}} = p_{11} p_n + p_{21}(1-p_n) = ${lambdaStr} p_n + ${betaStr}`;
}

export interface TipConfig {
  variant: "info" | "primary" | "warning" | "danger";
  badge: string;
  condition: string;
  question: string;
}

/* ── 左屏教学提示与题设导引 ── */
export function getModeTipConfig(ctx: BayesScenarioCtx): TipConfig {
  const {
    activeMode,
    condScenario,
    totalScenario,
    bayesScenario,
    markovScenario,
  } = ctx;

  if (activeMode === "conditional") {
    if (condScenario === "independent") {
      return {
        variant: "primary",
        badge: "高考经典 · 相互独立事件与乘法公式",
        condition: "事件 A 与 B 相互独立，满足 P(AB) = P(A)P(B)。",
        question: "探究为何无论怎样改变 P(A)，条件概率 P(B|A) 恒等于 P(B)。",
      };
    }
    if (condScenario === "correlated") {
      return {
        variant: "primary",
        badge: "高考模型 · 包含与强正相关模型",
        condition: "事件 A 发生时 B 必然发生 (A ⊆ B)，交集 P(AB) = P(A)。",
        question: "探究子集包含关系下，条件概率 P(B|A) 恒为 100% 的几何意义。",
      };
    }
    if (condScenario === "exclusive") {
      return {
        variant: "danger",
        badge: "高考基础 · 互斥事件模型",
        condition: "事件 A 与 B 互斥 (AB = ∅)，两事件不可能同时发生。",
        question: "观察互斥状态下两圆无交集，条件概率 P(B|A) 恒为 0。",
      };
    }
    return {
      variant: "primary",
      badge: "自由探索 · 条件概率与样本空间压缩",
      condition: "全集 Ω 中已知先验概率 P(A)、P(B) 与联合交集概率 P(AB)。",
      question: "自由调节各参数，观察样本空间压缩至 A 后的条件概率变化。",
    };
  }
  if (activeMode === "total_prob") {
    if (totalScenario === "factory3") {
      return {
        variant: "info",
        badge: "高考经典 · 三车间次品全概率模型",
        condition: "三车间产量占比固定为 40% / 35% / 25% (∑P(Aᵢ)=1)。",
        question: "调节各车间次品率，探究总次品率 P(B) 如何被主产车间所主导。",
      };
    }
    if (totalScenario === "balanced") {
      return {
        variant: "info",
        badge: "高考模型 · 三等分均衡加权模型",
        condition: "三分支先验概率均等 (P(A₁)=P(A₂)=P(A₃)=1/3)。",
        question: "观察全概率加权平均如何退化为分支概率的简单算术平均数。",
      };
    }
    if (totalScenario === "warner") {
      return {
        variant: "info",
        badge: "高考前沿 · Warner 敏感问题调查模型",
        condition: "正面卡概率 P(C₁) 与调查回答 Yes 统计率 P(Yes)。",
        question:
          "利用全概率公式列一元线性方程，从群体回答率反解真实敏感比例。",
      };
    }
    return {
      variant: "info",
      badge: "自由探索 · 完备划分与全概率公式",
      condition: "样本空间由互斥事件组 A₁, A₂, A₃ 完备划分 (∑P(Aᵢ)=1)。",
      question: "自由划分先验权重与条件概率，观察全概率汇总加权演化。",
    };
  }
  if (activeMode === "bayes") {
    if (bayesScenario === "screening") {
      return {
        variant: "warning",
        badge: "高考压轴 · 罕见病筛查与基率效应",
        condition: "试剂真阳率 95%、假阳误报率 5% 固定（试剂固有技术指标）。",
        question:
          "滑动自然患病率 P(D)，观察后验患病率从 2% 飙升至 80% 的基率谬误。",
      };
    }
    if (bayesScenario === "factory") {
      return {
        variant: "warning",
        badge: "高考应用 · 工厂次品溯源与误判容忍度",
        condition: "流水线自然次品率 8%、检出率 98% 固定。",
        question: "滑动仪器误判率，探究质检仪器精度对阳性可信度的剧烈影响。",
      };
    }
    return {
      variant: "warning",
      badge: "自由探索 · 贝叶斯公式与由果溯因",
      condition: "已知先验概率 P(D)、灵敏度 P(+|D) 与误报率 P(+|~D)。",
      question: "自由输入任意诊断数据，探究全概分母与后验概率的形成过程。",
    };
  }
  // markov
  if (markovScenario === "pass_ball") {
    return {
      variant: "danger",
      badge: "高考压轴 · 甲乙传球马尔可夫链 (震荡收敛)",
      condition:
        "甲必传乙 (p₁₁=0)，乙等可能传甲或丙 (p₂₁=0.5)，球初在甲手 (p₁=1)。",
      question:
        "滑动步数 n，观察特征公比 λ = -0.5 下数列交替摆动逼近 1/3 的全过程。",
    };
  }
  if (markovScenario === "pass_ball_3") {
    return {
      variant: "danger",
      badge: "高考压轴 · 三人环传模型 (对称降维)",
      condition:
        "甲乙丙三人轮流传球，球在甲为 S₁，球在乙/丙为 S₂，公比 λ = -0.5。",
      question:
        "探究利用 P(乙)=P(丙) 对称性将 3 状态转移矩阵降维为一阶等比递推。",
    };
  }
  if (markovScenario === "urn_ball") {
    return {
      variant: "danger",
      badge: "高考经典 · 摸球置换转移模型 (单调收敛)",
      condition: "转移矩阵固定 (p₁₁=0.6, p₂₁=0.2)，特征公比 λ = 0.4 > 0。",
      question: "滑动步数 n，观察概率序列单调渐近收敛于稳态极限 1/3。",
    };
  }
  if (markovScenario === "weather") {
    return {
      variant: "danger",
      badge: "高考经典 · 晴雨天气转移模型 (单调收敛)",
      condition: "转移矩阵固定 (p₁₁=0.7, p₂₁=0.4)，特征公比 λ = 0.3 > 0。",
      question: "滑动步数 n，探究长期天气概率如何收敛于稳态极限 4/7。",
    };
  }
  return {
    variant: "danger",
    badge: "自由探索 · 马尔可夫链状态转移",
    condition: "自由设定 2-State 转移概率矩阵与初始状态概率 p₁。",
    question: "探究公比 λ 与稳态极限 p_∞ 的形成，以及递推数列的收敛特征。",
  };
}

/* ── 参数双向数学联动与情景约束锁定 ── */
export function applyModeParamLinkage(
  ctx: BayesScenarioCtx,
  key: string,
  value: number,
  next: Record<string, number>,
): void {
  const { activeMode, condScenario } = ctx;

  // 1. 条件概率模式
  if (activeMode === "conditional") {
    const pA = key === "pA" ? value : (next.pA ?? 0.5);
    const pB = key === "pB" ? value : (next.pB ?? 0.4);
    let pAB = key === "pAB" ? value : (next.pAB ?? 0.2);

    if (condScenario === "independent") {
      // 独立情景：自动计算 P(AB) = P(A)P(B)
      pAB = Number((pA * pB).toFixed(2));
    } else if (condScenario === "correlated") {
      // 包含情景：P(AB) = P(A)，且确保 P(B) >= P(A)
      pAB = pA;
      if (pB < pA) next.pB = pA;
    } else if (condScenario === "exclusive") {
      // 互斥情景：P(AB) = 0，且确保 P(A) + P(B) <= 1
      pAB = 0;
      if (pA + pB > 1) next.pB = Number((1 - pA).toFixed(2));
    } else {
      // 自由探索：动态钳制数学上下界
      const maxAB = Math.min(pA, pB);
      const minAB = Math.max(0, Number((pA + pB - 1).toFixed(2)));
      pAB = Math.max(minAB, Math.min(maxAB, pAB));
    }

    next.pA = pA;
    next.pB = next.pB ?? pB;
    next.pAB = Number(pAB.toFixed(2));
  }

  // 2. 全概模式：联动保护 P(A1) + P(A2) <= 0.95
  if (activeMode === "total_prob") {
    const pA1 = key === "pA1" ? value : (next.pA1 ?? 0.4);
    let pA2 = key === "pA2" ? value : (next.pA2 ?? 0.35);

    if (pA1 + pA2 > 0.95) {
      pA2 = Math.max(0.05, Number((0.95 - pA1).toFixed(2)));
    }

    next.pA1 = pA1;
    next.pA2 = pA2;
  }

  // 3. 马尔可夫链模式：联动保护 currStep <= maxN
  if (activeMode === "markov") {
    if (key === "maxN") {
      if ((next.currStep ?? 1) > value) {
        next.currStep = value;
      }
    }
  }
}

/* ── 看板标题 ── */
export function getModePanelTitle(activeMode: BayesMode): string {
  if (activeMode === "conditional") return "条件概率指标看板";
  if (activeMode === "total_prob") return "全概率公式指标看板";
  if (activeMode === "bayes") return "贝叶斯诊断指标看板";
  return "马尔可夫链状态转移递推看板";
}

/* ── 左屏声明式参数配置（情景参数降维 + 自由探索分组）── */
export function buildParamConfigs(
  ctx: BayesScenarioCtx,
  params: Record<string, number>,
): ParamConfig[] {
  const {
    activeMode,
    condScenario,
    totalScenario,
    bayesScenario,
    markovScenario,
  } = ctx;

  // 依据当前情景决定暴露哪些参数（参数降维矩阵）
  let activeKeys: string[] = [];
  let groupMap: Record<string, string> = {};

  if (activeMode === "conditional") {
    if (condScenario === "free") {
      activeKeys = ["pA", "pB", "pAB"];
    } else {
      // 典型情景下隐藏 P(AB)（由情景约束自动锁定）
      activeKeys = ["pA", "pB"];
    }
  } else if (activeMode === "total_prob") {
    if (totalScenario === "warner") {
      activeKeys = ["pCard", "pReportYes"];
    } else if (totalScenario === "free") {
      activeKeys = ["pA1", "pA2", "pB_A1", "pB_A2", "pB_A3"];
      groupMap = {
        pA1: "完备划分先验概率",
        pA2: "完备划分先验概率",
        pB_A1: "各分支条件概率",
        pB_A2: "各分支条件概率",
        pB_A3: "各分支条件概率",
      };
    } else {
      // 三车间/均衡情景下锁定并隐藏先验划分，仅暴露各分支条件概率
      activeKeys = ["pB_A1", "pB_A2", "pB_A3"];
    }
  } else if (activeMode === "bayes") {
    if (bayesScenario === "free") {
      activeKeys = ["pPriorD", "pSensitivity", "pFalsePositive"];
    } else if (bayesScenario === "screening") {
      // 罕见病筛查：试剂指标固定，仅开放核心主控滑块：先验患病率
      activeKeys = ["pPriorD"];
    } else {
      // 工厂次品：次品率先验固定，仅开放核心主控滑块：仪器误判率
      activeKeys = ["pFalsePositive"];
    }
  } else {
    // markov
    if (markovScenario === "free") {
      activeKeys = ["p11", "p21", "p1", "currStep", "maxN"];
      groupMap = {
        p11: "转移矩阵核心参数",
        p21: "转移矩阵核心参数",
        p1: "初始状态与演化步数",
        currStep: "初始状态与演化步数",
        maxN: "初始状态与演化步数",
      };
    } else if (
      markovScenario === "pass_ball" ||
      markovScenario === "pass_ball_3"
    ) {
      // 甲乙传球/三人传球：转移矩阵固定，仅开放步数探索
      activeKeys = ["currStep", "maxN"];
    } else {
      // 摸球/天气：仅开放初态与步数
      activeKeys = ["p1", "currStep", "maxN"];
    }
  }

  const isFactory = bayesScenario === "factory";

  // 动态关联边界
  const pA = params.pA ?? 0.5;
  const pB = params.pB ?? 0.4;
  const maxAB = Math.min(pA, pB);
  const minAB = Math.max(0, Number((pA + pB - 1).toFixed(2)));

  const pA1 = params.pA1 ?? 0.4;
  const maxA2 = Math.max(0.05, Number((0.95 - pA1).toFixed(2)));
  const pA2 = Math.min(params.pA2 ?? 0.35, maxA2);
  const pA3 = Math.max(0.05, Number((1 - pA1 - pA2).toFixed(2)));

  const maxN = params.maxN ?? 10;

  return activeKeys
    .filter((key) => key in paramMeta)
    .map((key) => {
      const meta = paramMeta[key];
      let label = meta.label;
      let labelFormula = meta.labelFormula;
      let description: string | undefined = undefined;
      let min = meta.min;
      let max = meta.max;

      // 条件概率动态上下限
      if (activeMode === "conditional" && key === "pAB") {
        min = minAB;
        max = maxAB;
      }

      // 全概动态剩余提示与动态上限
      if (activeMode === "total_prob" && key === "pA2") {
        max = maxA2;
        description = `自动剩余 P(A₃) = ${pA3.toFixed(2)}`;
      }

      // 贝叶斯场景动态定制（三位一体色彩标签）
      if (activeMode === "bayes" && isFactory) {
        if (key === "pPriorD") {
          label = "次品先验率";
          labelFormula = `\\text{次品先验 } \\color{${MATH_COLORS.paramPrimary}}{P(\\text{Def})}`;
        } else if (key === "pSensitivity") {
          label = "次品检出率";
          labelFormula = `\\text{次品检出 } \\color{${MATH_COLORS.paramSecondary}}{P(+|\\text{Def})}`;
        } else if (key === "pFalsePositive") {
          label = "合格误判率";
          labelFormula = `\\text{合格误判 } \\color{${MATH_COLORS.paramTertiary}}{P(+|\\bar{\\text{Def}})}`;
        }
      }

      // 马尔可夫链步数动态上限
      if (activeMode === "markov" && key === "currStep") {
        max = maxN;
      }

      return {
        key,
        label,
        labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min,
        max,
        step: meta.step ?? 0.01,
        group: groupMap[key],
        description,
        importance: meta.importance,
        marks: meta.marks,
      };
    });
}
