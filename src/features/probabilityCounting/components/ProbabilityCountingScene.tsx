import { MATH_COLORS } from "../../../theme";
import type { SceneCommonProps } from "./types";
import { BinomialScene } from "./BinomialScene";
import { PermCombScene } from "./PermCombScene";
import { PrinciplesScene } from "./PrinciplesScene";

export function ProbabilityCountingScene({
  params,
  scale,
  vp,
  activeMode,
  subMode = 0,
  onParamChange,
  fontScale = (v) => v,
}: SceneCommonProps) {
  const commonProps = {
    params,
    scale,
    vp,
    activeMode,
    subMode,
    onParamChange,
    fontScale,
  };

  return (
    <g>
      {/* 极简网格背景 (840x650 标准设计视口) */}
      <defs>
        <pattern
          id="subtle-dot-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill={MATH_COLORS.axis} opacity="0.2" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={840} height={650} fill="url(#subtle-dot-grid)" />

      {/* 根据当前模式分发渲染 */}
      {activeMode === "binomial" && <BinomialScene {...commonProps} />}
      {activeMode === "perm_comb" && <PermCombScene {...commonProps} />}
      {activeMode === "principles" && <PrinciplesScene {...commonProps} />}
    </g>
  );
}
