import type { ParamConfig } from "@/components/UI";
import { MATH_COLORS } from "@/theme";
import { paramMeta } from "@/data/registries/probabilityBayes";

export type BayesMode = "conditional" | "total_prob" | "bayes";
export type CondScenario = "free" | "independent" | "correlated" | "exclusive";
export type TotalScenario = "free" | "factory3" | "balanced" | "warner";
export type BayesScenario = "free" | "screening" | "factory";

export interface BayesScenarioCtx {
  activeMode: BayesMode;
  condScenario: CondScenario;
  totalScenario: TotalScenario;
  bayesScenario: BayesScenario;
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
        : "\\text{无意义}";
    return `\\color{${MATH_COLORS.function}}{P(B|A)} = \\frac{\\color{${MATH_COLORS.paramTertiary}}{P(AB)}}{\\color{${MATH_COLORS.paramPrimary}}{P(A)}} = \\frac{${pABVal}}{${pAVal}} = ${pBGivenA}`;
  }
  if (activeMode === "total_prob") {
    if (totalScenario === "warner") {
      const pCard = params.pCard ?? 0.8;
      const pReportYes = params.pReportYes ?? 0.36;
      const denom = 2 * pCard - 1;
      const isDegen = Math.abs(denom) < 1e-4;
      if (isDegen) {
        return `\\color{${MATH_COLORS.function}}{P(\\text{Yes})} = 0.50 p_{\\text{real}} + 0.50(1 - p_{\\text{real}}) = 0.50 \\implies p_{\\text{real}} \\text{ 无法反解(信息完全抵消)}`;
      }
      const rawReal = (pReportYes - (1 - pCard)) / denom;
      const pReal = Math.max(0, Math.min(1, rawReal));
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
  // bayes 模式
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

export interface TipConfig {
  variant: "info" | "primary" | "warning" | "danger";
  badge: string;
  background: string;
  condition: string;
  question: string;
}

/* ── 左屏教学提示与题设导引（三要素闭环：背景+条件+设问） ── */
export function getModeTipConfig(ctx: BayesScenarioCtx): TipConfig {
  const { activeMode, condScenario, totalScenario, bayesScenario } = ctx;

  if (activeMode === "conditional") {
    if (condScenario === "independent") {
      return {
        variant: "primary",
        badge: "高考经典 · 相互独立事件与乘法公式",
        background:
          "考查两阶段随机试验中先后事件的相互影响程度（如先后两次抛掷质地均匀的硬币）。",
        condition:
          "事件 $A$ 与 $B$ 满足独立性乘法公式 $P(AB) = P(A)P(B)$，已知条件事件概率 $P(A) > 0$。",
        question:
          "证明为何无论怎样改变条件概率分母 $P(A)$，后验条件概率 $P(B|A)$ 恒等于无条件先验概率 $P(B)$，并写出独立性的等价充要判据。",
      };
    }
    if (condScenario === "correlated") {
      return {
        variant: "primary",
        badge: "高考模型 · 包含与充分条件模型",
        background:
          "极限关联构型：当事件 $A$ 发生时事件 $B$ 必然随之发生（即事件 $A$ 是事件 $B$ 的充分条件，如“抽到红桃”必然属于“抽到红牌”）。",
        condition:
          "事件 $A$ 为事件 $B$ 的真子集 ($A \\subseteq B$)，两事件交集概率 $P(AB) = P(A)$。",
        question:
          "证明在子集包含关系下，后验条件概率 $P(B|A) = 1.00$ 恒成立的几何意义与代数充要条件。",
      };
    }
    if (condScenario === "exclusive") {
      return {
        variant: "danger",
        badge: "高考基础 · 互斥事件概念辨析",
        background:
          "易错概念辨析：两事件不可能在同一次试验中同时发生（如掷骰子单次掷出点数 1 与点数 2）。",
        condition:
          "事件 $A$ 与 $B$ 互斥 ($AB = \\emptyset$)，两事件联合同时发生的概率 $P(AB) = 0$。",
        question:
          "求在已知事件 $A$ 发生的前提下事件 $B$ 发生的条件概率 $P(B|A)$，并深刻辨析“互斥”与“相互独立”的本质差异。",
      };
    }
    return {
      variant: "primary",
      badge: "自由探索 · 条件概率与样本空间压缩",
      background:
        "探究样本空间从全局视窗全集 $\\Omega$ 压缩至已知条件事件 $A$ 时，目标事件 $B$ 发生概率的重新归一化过程。",
      condition:
        "全集 $\\Omega$ 中给定条件事件概率 $P(A)$、目标事件先验概率 $P(B)$ 以及交集概率 $P(AB)$。",
      question:
        "调节联合概率 $P(AB)$，利用定义式 $P(B|A) = \\frac{P(AB)}{P(A)}$ 求解后验条件概率，分析两事件相关性对概率数值的缩放规律。",
    };
  }
  if (activeMode === "total_prob") {
    if (totalScenario === "factory3") {
      return {
        variant: "info",
        badge: "高考经典 · 三车间次品全概率模型",
        background:
          "高考经典工业质量检测题：某流水线产品由三个车间按固定产能配比共同生产，质检员抽检产品确定整批产品的总合格水平。",
        condition:
          "三个车间产量占比固定为 $P(A_1) = 40\\%$、$P(A_2) = 35\\%$、$P(A_3) = 25\\%$，满足完备划分和为 100%（$\\sum_{i=1}^3 P(A_i) = 1.00$）。",
        question:
          "调节各分车间自身的次品率，运用全概率公式 $P(B) = \\sum_{i=1}^3 P(A_i)P(B|A_i)$ 求解抽取产品为次品的总概率 $P(B)$，并分析主产车间对总次品率的主导权重。",
      };
    }
    if (totalScenario === "balanced") {
      return {
        variant: "info",
        badge: "高考模型 · 三等分均衡加权模型",
        background:
          "等可能完备情境：各原因分支先验等可能发生（如等概率抽取三个不同的盒子）。",
        condition:
          "三个原因分支先验概率均等，即 $P(A_1) = P(A_2) = P(A_3) = \\frac{1}{3}$。",
        question:
          "证明当各分支先验概率等可能时，全概率加权和公式如何简化退化为各分支条件概率的简单算术平均数 $\\frac{1}{3} \\sum_{i=1}^3 P(B|A_i)$。",
      };
    }
    if (totalScenario === "warner") {
      return {
        variant: "info",
        badge: "高考创新 · Warner 敏感问题随机化调查模型",
        background:
          "新高考创新应用大题原型：在涉及隐私、敏感话题（如作弊、逃税）的社会统计中，通过随机抽卡使调查员无法获知受访者抽到哪张卡，消除戒备心理从而获得真实回答率。",
        condition:
          "受访者抽取正面卡片 $C_1$（“我是”）概率为 $P(C_1)$，抽取反面卡片 $C_2$（“我不是”）概率为 $P(C_2)$，调查回答 Yes 的统计率为 $P(\\text{Yes})$。",
        question:
          "利用全概率公式建立含真实特征比例 $p_{\\text{real}}$ 的一元一次方程，列式求解真实比例 $p_{\\text{real}}$，并分析当抽卡概率 $P(C_1) = 0.50$ 时为何模型发生信息抵消退化。",
      };
    }
    return {
      variant: "info",
      badge: "自由探索 · 完备划分与全概率公式",
      background:
        "“化整为零，分道汇合”：把复杂目标事件 $B$ 分解到一组互斥且无遗漏的完备事件组 $A_1, A_2, A_3$ 上分别计算，再汇总相加。",
      condition:
        "样本空间由两两互斥的事件组完备划分，满足 $\\sum_{i=1}^3 P(A_i) = 1.00$ 且 $P(A_i) > 0$。",
      question:
        "自主划分各分支先验权重与条件概率，计算各分支联合贡献 $P(A_i B) = P(A_i)P(B|A_i)$，求得目标事件 $B$ 的全概率 $P(B)$。",
    };
  }
  // bayes
  if (bayesScenario === "screening") {
    return {
      variant: "warning",
      badge: "高考应用 · 罕见病筛查与基率效应",
      background:
        "新高考信息给予大题原型：在重大罕见疾病人群筛查中，为何准确率高达 95% 的检测试剂，在检测呈阳性后真实患病率依然很低（破除直觉陷阱）。",
      condition:
        "试剂真阳性率 $P(+|D) = 95\\%$、无病假阳性误报率 $P(+|\\bar{D}) = 5\\%$ 固定（试剂固有技术指标）。",
      question:
        "调节自然人群先验患病率 $P(D)$，利用全概率公式算分母、联合概率算分子，求解阳性后验确诊患病率 $P(D|+)$，解释为何庞大健康人群基数会导致假阳性误报大幅稀释真实确诊率。",
    };
  }
  if (bayesScenario === "factory") {
    return {
      variant: "warning",
      badge: "高考应用 · 工厂次品溯源与误判容忍度",
      background:
        "新高考工业质检逆向溯源题：生产线上高灵敏度检测仪器报警报出次品时，反向推断该零件确实为次品的后验可信度。",
      condition:
        "流水线自然次品率固定为 $P(\\text{Def}) = 8\\%$，仪器对次品的检出率为 $P(+|\\text{Def}) = 98\\%$。",
      question:
        "调节仪器对合格品的误判率 $P(+|\\bar{\\text{Def}})$，求质检报警零件真实为次品的后验概率 $P(\\text{Def}|+)$，给出满足工业质检容忍度的仪器误判率上限。",
    };
  }
  return {
    variant: "warning",
    badge: "自由探索 · 贝叶斯公式与由果溯因",
    background:
      "由果溯因的逆概率推理：在已知检验结果呈现阳性 (+) 已经发生的前提下，逆向推断是由真正患病原因导致的后验概率。",
    condition:
      "已知原因先验概率 $P(D)$、原因检出灵敏度 $P(+|D)$ 与对立事件误报率 $P(+|\\bar{D})$。",
    question:
      "自由输入诊断数据，求解全概率分母 $P(+)$ 与贝叶斯后验概率 $P(D|+)$，探究先验基率对后验判断的决定性影响。",
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
      pAB = Number((pA * pB).toFixed(2));
    } else if (condScenario === "correlated") {
      pAB = pA;
      if (pB < pA) next.pB = pA;
    } else if (condScenario === "exclusive") {
      pAB = 0;
      if (pA + pB > 1) next.pB = Number((1 - pA).toFixed(2));
    } else {
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
}

/* ── 看板标题 ── */
export function getModePanelTitle(activeMode: BayesMode): string {
  if (activeMode === "conditional") return "条件概率指标看板";
  if (activeMode === "total_prob") return "全概率公式指标看板";
  return "贝叶斯诊断指标看板";
}

/* ── 左屏声明式参数配置（情景参数降维 + 自由探索分组）── */
export function buildParamConfigs(
  ctx: BayesScenarioCtx,
  params: Record<string, number>,
): ParamConfig[] {
  const { activeMode, condScenario, totalScenario, bayesScenario } = ctx;

  let activeKeys: string[] = [];
  let groupMap: Record<string, string> = {};

  if (activeMode === "conditional") {
    if (condScenario === "free") {
      activeKeys = ["pA", "pB", "pAB"];
    } else {
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
      activeKeys = ["pB_A1", "pB_A2", "pB_A3"];
    }
  } else if (activeMode === "bayes") {
    if (bayesScenario === "free") {
      activeKeys = ["pPriorD", "pSensitivity", "pFalsePositive"];
    } else if (bayesScenario === "screening") {
      activeKeys = ["pPriorD"];
    } else {
      activeKeys = ["pFalsePositive"];
    }
  }

  const isFactory = bayesScenario === "factory";

  const pA = params.pA ?? 0.5;
  const pB = params.pB ?? 0.4;
  const maxAB = Math.min(pA, pB);
  const minAB = Math.max(0, Number((pA + pB - 1).toFixed(2)));

  const pA1 = params.pA1 ?? 0.4;
  const maxA2 = Math.max(0.05, Number((0.95 - pA1).toFixed(2)));
  const pA2 = Math.min(params.pA2 ?? 0.35, maxA2);
  const pA3 = Math.max(0.05, Number((1 - pA1 - pA2).toFixed(2)));

  return activeKeys
    .filter((key) => key in paramMeta)
    .map((key) => {
      const meta = paramMeta[key];
      let label = meta.label;
      let labelFormula = meta.labelFormula;
      let description: string | undefined = undefined;
      let min = meta.min;
      let max = meta.max;

      if (activeMode === "conditional" && key === "pAB") {
        min = minAB;
        max = maxAB;
      }

      if (
        activeMode === "conditional" &&
        condScenario === "correlated" &&
        key === "pB"
      ) {
        min = pA;
        description = `包含约束：P(B) ≥ P(A) = ${pA.toFixed(2)}`;
      }

      if (
        activeMode === "conditional" &&
        condScenario === "exclusive" &&
        key === "pB"
      ) {
        max = Math.max(0.05, Number((1 - pA).toFixed(2)));
        description = `互斥约束：P(A)+P(B) ≤ 1，即 P(B) ≤ ${(1 - pA).toFixed(2)}`;
      }

      if (activeMode === "total_prob" && key === "pA2") {
        max = maxA2;
        description = `自动剩余 P(A₃) = ${pA3.toFixed(2)}`;
      }

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
