/**
 * src/features/sequence/components/RecurrenceScene.tsx
 * 递推数列与构造法求通项场景分发器
 * 按 recurrenceModelType 分发到各子场景组件，各子模式渲染实现见
 * Recurrence{LinearPan,Accumulation,Multiplication,NonHomogeneous,Reciprocal,SecondOrder}Scene
 */
import React from "react";
import type { SceneScale, ViewportInfo } from "@/hooks";
import type { AccumulationFnType } from "@/math/sequence";
import { RecurrenceLinearPanScene } from "./RecurrenceLinearPanScene";
import { RecurrenceAccumulationScene } from "./RecurrenceAccumulationScene";
import { RecurrenceMultiplicationScene } from "./RecurrenceMultiplicationScene";
import { RecurrenceNonHomogeneousScene } from "./RecurrenceNonHomogeneousScene";
import { RecurrenceReciprocalScene } from "./RecurrenceReciprocalScene";
import { RecurrenceSecondOrderScene } from "./RecurrenceSecondOrderScene";

export interface RecurrenceSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  recurrenceModelType:
    | "linear-pan"
    | "accumulation"
    | "multiplication"
    | "non-homogeneous"
    | "reciprocal"
    | "second-order";
  accumFnType?: AccumulationFnType;
  multType?: "n_over_n1" | "n1_over_n" | "pow_two";
  highlightN: number;
  onSelectN?: (n: number) => void;
  xStep?: number;
  yStep?: number;
}

export const RecurrenceScene: React.FC<RecurrenceSceneProps> = (props) => {
  const { recurrenceModelType } = props;
  const common = {
    params: props.params,
    scale: props.scale,
    vp: props.vp,
    fontScale: props.fontScale,
    highlightN: props.highlightN,
    onSelectN: props.onSelectN,
    xStep: props.xStep,
    yStep: props.yStep,
  };

  switch (recurrenceModelType) {
    case "linear-pan":
      return <RecurrenceLinearPanScene {...common} />;
    case "accumulation":
      return (
        <RecurrenceAccumulationScene
          {...common}
          accumFnType={props.accumFnType}
        />
      );
    case "multiplication":
      return (
        <RecurrenceMultiplicationScene {...common} multType={props.multType} />
      );
    case "non-homogeneous":
      return <RecurrenceNonHomogeneousScene {...common} />;
    case "reciprocal":
      return <RecurrenceReciprocalScene {...common} />;
    case "second-order":
      return <RecurrenceSecondOrderScene {...common} />;
    default:
      return null;
  }
};
