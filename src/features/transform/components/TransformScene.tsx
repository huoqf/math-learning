import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  VectorArrow,
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import type { LabelItem } from "@/utils/labelOverlap";
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

  // 主控特征点（第 0 个特征点）的拖拽交互：直接绑定在函数图象的核心特征点上
  const primaryPt = res.keyPoints[0];

  const handleDragPrimaryPoint = (mathPt: { x: number; y: number }) => {
    const roundH = Math.round(mathPt.x * 2) / 2;
    let roundK = Math.round(mathPt.y * 2) / 2;

    // 对于指数函数，基准特征定点 y 值为 A + k，因此垂直平移量为 k = y - A
    if (fnType === "exp") {
      roundK = Math.round((mathPt.y - A) * 2) / 2;
    }

    onParamChange("h", roundH);
    onParamChange("k", roundK);
  };

  // 计算指数函数的渐近线 y 位置
  const asymptoteY = useMemo(() => {
    if (fnType !== "exp") return null;
    if (foldMode === "global") {
      return Math.abs(k);
    }
    return k;
  }, [fnType, foldMode, k]);

  // 学术级点标签定义与 8 向防重叠碰撞避让 (彻底去除多余悬空点 P)
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];

    // 原基准特征点与变换后特征点标签
    res.keyPoints.forEach((pt, idx) => {
      const ptOrig = mathToDesign(pt.original.x, pt.original.y, scale);
      const ptTrans = mathToDesign(pt.transformed.x, pt.transformed.y, scale);

      items.push({
        key: `orig_${idx}`,
        text: pt.name,
        x: ptOrig.x,
        y: ptOrig.y,
        color: MATH_COLORS.labelText,
        preferredPlacement: "bottom-left",
      });

      items.push({
        key: `trans_${idx}`,
        text: `${pt.name}'`,
        x: ptTrans.x,
        y: ptTrans.y,
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "top-right",
      });
    });

    return items;
  }, [scale, res.keyPoints]);

  return (
    <g>
      {/* 坐标轴网格: 纯净学术底色 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 指数函数的水平渐近线辅助线 y = asymptoteY */}
      {asymptoteY !== null && (
        <line
          x1={scale.originX - 6 * scale.scaleX}
          y1={scale.originY - asymptoteY * scale.scaleY}
          x2={scale.originX + 6 * scale.scaleX}
          y2={scale.originY - asymptoteY * scale.scaleY}
          stroke={withAlpha(MATH_COLORS.paramSecondary, 0.45)}
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
      )}

      {/* 原母函数基准曲线 (灰色粗虚线) */}
      <FunctionGraph
        fn={(x) => evalBaseFunction(fnType, x)}
        scale={scale}
        color={withAlpha(MATH_COLORS.function, 0.45)}
        strokeWidth={1.8}
        strokeDasharray="4 4"
      />

      {/* 翻折模式下：未翻折的原平移伸缩曲线 (浅色细虚线底衬，直观对比下翻上或右对称过程) */}
      {foldMode !== "none" && (
        <FunctionGraph
          fn={(x) =>
            evalTransformedFunction(
              fnType,
              { h, k, A, omega, foldMode: "none" },
              x,
            )
          }
          scale={scale}
          color={withAlpha(MATH_COLORS.paramPrimary, 0.25)}
          strokeWidth={1.2}
          strokeDasharray="2 2"
        />
      )}

      {/* 变换后目标函数最终曲线 (鲜亮粗实线) */}
      <FunctionGraph
        fn={(x) => evalTransformedFunction(fnType, transformParams, x)}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        strokeWidth={2.8}
      />

      {/* 对应特征点轨迹指示箭头与关键特征点 */}
      {res.keyPoints.map((pt, idx) => (
        <g key={idx}>
          {/* 从原特征点到变换特征点的平移/伸缩轨迹矢量箭头 */}
          <VectorArrow
            from={[pt.original.x, pt.original.y]}
            to={[pt.transformed.x, pt.transformed.y]}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramSecondary, 0.75)}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            fontScale={fontScale}
          />
          {/* 原基准特征点 (纯数学点 MathPoint, 半透明) */}
          <MathPoint
            cx={pt.original.x}
            cy={pt.original.y}
            scale={scale}
            color={withAlpha(MATH_COLORS.function, 0.6)}
            r={3.2}
            fontScale={fontScale}
          />
          {/* 变换后从属特征点 (idx > 0) */}
          {idx > 0 && (
            <MathPoint
              cx={pt.transformed.x}
              cy={pt.transformed.y}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              r={3.6}
              fontScale={fontScale}
            />
          )}
        </g>
      ))}

      {/* 变换后主特征点（自带可拖拽光晕手柄，直接绑定在图象核心特征点上，如顶点/拐点/定点） */}
      {primaryPt && (
        <InteractivePoint
          cx={primaryPt.transformed.x}
          cy={primaryPt.transformed.y}
          scale={scale}
          vp={vp}
          onDrag={handleDragPrimaryPoint}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />
      )}

      {/* 统一学术点标签图层 (智能避让与微描边) */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
}
