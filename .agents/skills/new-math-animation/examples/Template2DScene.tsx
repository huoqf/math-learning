import React, { useMemo, useCallback } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  TangentLine,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks";
import { MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { LabelItem } from "@/utils/labelOverlap";
import type { ViewportInfo } from "@/utils/useViewport";

interface Template2DSceneProps {
  params: {
    paramA: number;
    paramB: number;
    interactiveX: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (base: number) => number;
  onParamChange: (key: string, value: number) => void;
}

export const Template2DScene: React.FC<Template2DSceneProps> = ({
  params,
  scale,
  vp,
  fontScale,
  onParamChange,
}) => {
  const { paramA, interactiveX } = params;

  // 原函数定义
  const f = useCallback((x: number) => paramA * x * x, [paramA]);

  const currentY = f(interactiveX);

  // 动点拖拽回调 (InteractivePoint 吐出的已是数学坐标 { x, y }，严禁二次调用 designToMath)
  const handleDragPoint = useCallback(
    (mathPt: { x: number; y: number }) => {
      onParamChange("interactiveX", Number(mathPt.x.toFixed(2)));
    },
    [onParamChange],
  );

  // 学术点标签（需转换为 design 坐标交由 SceneLabelGroup 8 向避让排布，杜绝浮点数跳动）
  const labelItems: LabelItem[] = useMemo(() => {
    const ptP = mathToDesign(interactiveX, currentY, scale);
    return [
      {
        key: "label-P",
        text: "P",
        x: ptP.x,
        y: ptP.y,
        color: MATH_COLORS.focusPoint,
      },
    ];
  }, [interactiveX, currentY, scale]);

  return (
    <g>
      {/* 坐标轴与网格 (解析几何/函数建议默认 showGrid=false，保持白底高对比度) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 原函数曲线 */}
      <FunctionGraph
        fn={f}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* 动切线（TangentLine 内部已按 fn 进行数值求导） */}
      <TangentLine
        fn={f}
        x0={interactiveX}
        scale={scale}
        color={MATH_COLORS.tangentLine}
        strokeWidth={1.5}
      />

      {/* 可拖拽动点 (点标由 SceneLabelGroup 统一避让渲染，不传 label) */}
      <InteractivePoint
        cx={interactiveX}
        cy={currentY}
        scale={scale}
        vp={vp}
        snapTo={f}
        xRange={[-4, 4]}
        color={MATH_COLORS.focusPoint}
        onDrag={handleDragPoint}
      />

      {/* 极简学术点标避让图层 */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
