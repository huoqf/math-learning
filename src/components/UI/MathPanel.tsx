import React from "react";
import { MathPanelHeader } from "./mathPanel/MathPanelHeader";
import {
  MathWarningSection,
  type WarningItem,
} from "./mathPanel/MathWarningSection";
import {
  MathReasoningSection,
  type ReasoningStep,
} from "./mathPanel/MathReasoningSection";
import {
  MathTheoremSection,
  type Theorem,
} from "./mathPanel/MathTheoremSection";
import {
  MathGaokaoSection,
  type GaokaoPoint,
} from "./mathPanel/MathGaokaoSection";
import { MathMnemonicSection } from "./mathPanel/MathMnemonicSection";
import {
  MathInvariantsSection,
  type MathQuantity,
} from "./mathPanel/MathInvariantsSection";

export type { MathQuantity, ReasoningStep, Theorem, GaokaoPoint, WarningItem };

export interface MathPanelProps {
  quantities: MathQuantity[];
  theorems?: Theorem[];
  gaokaoPoints?: GaokaoPoint[];
  warnings?: WarningItem[];
  reasoningSteps?: ReasoningStep[];
  examAnchor?: string;
  mnemonic?: string;
  title?: string;
}

/**
 * 高中数学与新高考教学研析看板 (MathPanel)
 *
 * 架构按高中数学学科认知体系设计：
 * 1. MathPanelHeader: 高考题型定位与大招母题标头
 * 2. MathWarningSection: 数学定义域退化、临界值与分类讨论警示
 * 3. MathReasoningSection: 高考解答题破题三步推演链与评分细则
 * 4. MathTheoremSection: 核心定理公式、适用前提与命题模型
 * 5. MathGaokaoSection: 高考要点、通法特征与秒杀心法
 * 6. MathMnemonicSection: 记忆口诀与秒杀心法
 * 7. MathInvariantsSection: 几何特征量与代数定值不变量
 */
export const MathPanel: React.FC<MathPanelProps> = ({
  quantities,
  theorems = [],
  gaokaoPoints = [],
  warnings = [],
  reasoningSteps = [],
  examAnchor,
  mnemonic,
  title = "高考破题与推演看板",
}) => {
  const isEmpty =
    quantities.length === 0 &&
    theorems.length === 0 &&
    gaokaoPoints.length === 0 &&
    warnings.length === 0 &&
    reasoningSteps.length === 0 &&
    !mnemonic;

  return (
    <div className="w-full max-w-full min-h-full flex flex-col gap-4 p-4 text-neutral-800 text-sm bg-neutral-50/50 overflow-x-hidden">
      {/* 1. 标题与高考真题定位 */}
      <MathPanelHeader title={title} examAnchor={examAnchor} />

      {/* 2. 数学临界与易错警示（置顶防踩坑） */}
      <MathWarningSection warnings={warnings} />

      {/* 3. 高考破题推导步骤链（核心推演，定理代入实时代数求解） */}
      <MathReasoningSection steps={reasoningSteps} />

      {/* 4. 核心定理与命题模型（显式适用前提条件） */}
      <MathTheoremSection theorems={theorems} />

      {/* 5. 高考要点与题型通法 */}
      <MathGaokaoSection points={gaokaoPoints} />

      {/* 6. 记忆口诀与秒杀心法 */}
      <MathMnemonicSection mnemonic={mnemonic} />

      {/* 7. 几何特征量与代数不变量（定值/定点不变量附录区） */}
      <MathInvariantsSection quantities={quantities} />

      {/* 空状态提示 */}
      {isEmpty && (
        <div className="text-center text-neutral-400 py-8">
          <p className="text-sm">暂无数学解析数据</p>
        </div>
      )}
    </div>
  );
};
