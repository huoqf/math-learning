import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  VectorArrow,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  evalBaseFunction,
  evalTransformedFunction,
  calculateTransform,
  type BaseFnType,
  type FoldMode,
} from "@/math/transform";

interface TransformSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  fnType: BaseFnType;
  foldMode: FoldMode;
}

export function TransformScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  fnType,
  foldMode,
}: TransformSceneProps) {
  const h = params.h ?? 1.0;
  const k = params.k ?? 0.5;
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 1.0;

  const transformParams = { h, k, A, omega, foldMode };
  const res = calculateTransform(fnType, transformParams);

  // 拖拽控制点 (h, k) 改变平移参数
  const handleDragPoint = (mathPt: { x: number; y: number }) => {
    const roundH = Math.round(mathPt.x * 2) / 2;
    const roundK = Math.round(mathPt.y * 2) / 2;
    onParamChange("h", roundH);
    onParamChange("k", roundK);
  };

  return (
    <g>
      {/* 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 原函数基准曲线 (灰色虚线) */}
      <FunctionGraph
        fn={(x) => evalBaseFunction(fnType, x)}
        scale={scale}
        color={withAlpha(MATH_COLORS.function, 0.4)}
        strokeWidth={1.8}
        strokeDasharray="4 4"
      />

      {/* 变换后目标函数曲线 (高亮实线) */}
      <FunctionGraph
        fn={(x) => evalTransformedFunction(fnType, transformParams, x)}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        strokeWidth={2.8}
      />

      {/* 对应特征点轨迹指示箭头与联动控制点 */}
      {res.keyPoints.map((pt, idx) => (
        <g key={idx}>
          {/* 从原特征点到变换特征点的平移/伸缩轨迹矢量箭头 */}
          <VectorArrow
            from={[pt.original.x, pt.original.y]}
            to={[pt.transformed.x, pt.transformed.y]}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramSecondary, 0.7)}
            strokeWidth={1.5}
            strokeDasharray="2 2"
            fontScale={fontScale}
          />
          {/* 原特征点标记 (半透明) */}
          <circle
            cx={scale.originX + pt.original.x * scale.scaleX}
            cy={scale.originY - pt.original.y * scale.scaleY}
            r={4}
            fill={withAlpha(MATH_COLORS.function, 0.5)}
          />
        </g>
      ))}

      {/* 可拖拽平移控制点 P(h, k) */}
      <InteractivePoint
        cx={h}
        cy={k}
        scale={scale}
        vp={vp}
        onDrag={handleDragPoint}
        label={`P(h=${h.toFixed(1)}, k=${k.toFixed(1)})`}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
      />
    </g>
  );
}
