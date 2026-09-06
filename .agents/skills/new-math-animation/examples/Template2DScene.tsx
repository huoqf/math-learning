import React, { useMemo, useCallback } from 'react';
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  TangentLine,
  SceneLabelGroup,
  type LabelItem,
} from '@/components/Math';
import { MATH_COLORS } from '@/theme';
import type { SceneScale, ViewportTransform } from '@/types';

interface Template2DSceneProps {
  params: {
    paramA: number;
    paramB: number;
    interactiveX: number;
  };
  scale: SceneScale;
  vp: ViewportTransform;
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

  // 原函数与切线函数定义
  const f = useCallback((x: number) => paramA * x * x, [paramA]);
  const fPrime = useCallback((x: number) => 2 * paramA * x, [paramA]);

  const currentY = f(interactiveX);

  // 动点拖拽回调 (InteractivePoint 吐出的已是数学坐标，严禁二次调用 designToMath)
  const handleDragPoint = useCallback(
    (mathX: number) => {
      onParamChange('interactiveX', mathX);
    },
    [onParamChange]
  );

  // 学术点标签（由 SceneLabelGroup 智能 8 向避让排布，杜绝浮点数跳动）
  const labelItems: LabelItem[] = useMemo(
    () => [
      {
        id: 'label-P',
        text: 'P',
        mathX: interactiveX,
        mathY: currentY,
        color: MATH_COLORS.focusPoint,
        priority: 10,
      },
      {
        id: 'label-origin',
        text: 'O',
        mathX: 0,
        mathY: 0,
        color: MATH_COLORS.axis,
        priority: 1,
      },
    ],
    [interactiveX, currentY]
  );

  return (
    <g>
      {/* 坐标轴与网格 (解析几何/函数建议默认 showGrid=false 保持白底高对比度) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 原函数曲线 */}
      <FunctionGraph
        fn={f}
        scale={scale}
        color={MATH_COLORS.primary}
        strokeWidth={2.5}
      />

      {/* 动切线 */}
      <TangentLine
        fn={f}
        dfn={fPrime}
        x0={interactiveX}
        scale={scale}
        color={MATH_COLORS.tangent}
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* 可拖拽动点 (不传 label，文本交由 SceneLabelGroup 统一调度) */}
      <InteractivePoint
        cx={interactiveX}
        cy={currentY}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.focusPoint}
        onDrag={handleDragPoint}
      />

      {/* 极简学术点标避让图层 */}
      <SceneLabelGroup
        items={labelItems}
        scale={scale}
        fontScale={fontScale}
      />
    </g>
  );
};
