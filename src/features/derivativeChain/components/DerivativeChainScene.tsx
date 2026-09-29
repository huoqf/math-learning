/**
 * 简单复合函数求导中屏 SVG 场景
 * 呈现：原外层基函数 f(u)（参照底图）、复合函数 y = f(ax+b)、切点 P 与动切线
 */
import React, { useMemo, useCallback } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { getChainPalette } from "@/features/derivativeChain/scenePalette";
import { dashArrayOf } from "@/components/Math/scenePalette";
import {
  calculateDerivativeChain,
  evaluateOuterFunc,
  type OuterFunctionType,
} from "@/math/derivativeChain";
import { formatMathNumber } from "@/utils/mathFormat";
import { DERIVATIVE_CHAIN_PARAM_META } from "@/data/registries/derivativeChain";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";

interface DerivativeChainSceneProps {
  outerType: OuterFunctionType;
  a: number;
  b: number;
  x0: number;
  scale: SceneScale;
  fontScale?: (v: number) => number;
  onChangeX0: (newX0: number) => void;
}

export const DerivativeChainScene: React.FC<DerivativeChainSceneProps> = ({
  outerType,
  a,
  b,
  x0,
  scale,
  fontScale = (v) => v,
  onChangeX0,
}) => {
  const P = getChainPalette();

  const res = useMemo(
    () => calculateDerivativeChain(outerType, a, b, x0),
    [outerType, a, b, x0],
  );

  // 原外层函数求值器
  const outerEvaluator = useCallback(
    (x: number) => {
      const r = evaluateOuterFunc(outerType, x);
      return r.valid ? r.val : NaN;
    },
    [outerType],
  );

  // 复合函数求值器
  const combinedEvaluator = useCallback(
    (x: number) => {
      const u = a * x + b;
      const r = evaluateOuterFunc(outerType, u);
      return r.valid ? r.val : NaN;
    },
    [outerType, a, b],
  );

  // 切线几何线段（横跨整个可见定义域，而不是硬编码 ±6）
  const tangentLine = useMemo(() => {
    if (!res.isValid) return null;
    const k = res.slope;
    const px = res.x0;
    const py = res.y0;
    const p1 = mathToDesign(scale.xMin, py + k * (scale.xMin - px), scale);
    const p2 = mathToDesign(scale.xMax, py + k * (scale.xMax - px), scale);
    return { p1, p2 };
  }, [res.isValid, res.slope, res.x0, res.y0, scale]);

  /**
   * 动点拖拽统一落点：先按注册表步长取整，再钳制到「声明域 ∩ 可见视口」。
   * 旧实现直接写 `xRange={[-3, 3]}`，与注册表 x0 ∈ [-3, 3] 看似一致，
   * 但视口收窄（如 ln 模式）时声明域并不会跟着收，仍会拖出画布。
   */
  const handleDragX0 = useCallback(
    (rawX: number) => {
      onChangeX0(
        snapDragValue(
          rawX,
          DERIVATIVE_CHAIN_PARAM_META.x0.step,
          paramDragRange(DERIVATIVE_CHAIN_PARAM_META.x0, scale, "x"),
        ),
      );
    },
    [onChangeX0, scale],
  );

  const pDesign = useMemo(() => {
    return res.isValid ? mathToDesign(res.x0, res.y0, scale) : { x: 0, y: 0 };
  }, [res.isValid, res.x0, res.y0, scale]);

  const labels = useMemo((): LabelItem[] => {
    if (!res.isValid) return [];
    return [
      {
        key: "tangent-point",
        text: `P(${formatMathNumber(res.x0)}, ${formatMathNumber(res.y0)})`,
        x: pDesign.x,
        y: pDesign.y,
        color: P.pointP.color,
      },
    ];
  }, [res.isValid, res.x0, res.y0, pDesign.x, pDesign.y, P.pointP.color]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 原外层基函数参照曲线 f(x) (虚线) */}
      <g opacity={0.35}>
        <FunctionGraph
          fn={outerEvaluator}
          scale={scale}
          color={P.outerFn.color}
          strokeWidth={P.outerFn.width}
          strokeDasharray={dashArrayOf(P.outerFn)}
        />
      </g>

      {/* 复合函数曲线 y = f(ax+b) */}
      <FunctionGraph
        fn={combinedEvaluator}
        scale={scale}
        color={P.combinedFn.color}
        strokeWidth={P.combinedFn.width}
      />

      {/* 动切线 */}
      {tangentLine && (
        <line
          x1={tangentLine.p1.x}
          y1={tangentLine.p1.y}
          x2={tangentLine.p2.x}
          y2={tangentLine.p2.y}
          stroke={P.tangent.color}
          strokeWidth={P.tangent.width}
          strokeDasharray={dashArrayOf(P.tangent)}
        />
      )}

      {/* 交互切点 P */}
      {res.isValid && (
        <InteractivePoint
          cx={res.x0}
          cy={res.y0}
          scale={scale}
          color={P.pointP.color}
          onDrag={(pt) => handleDragX0(pt.x)}
          axis="x"
          xRange={paramDragRange(DERIVATIVE_CHAIN_PARAM_META.x0, scale, "x")}
          edgeClampProjection
        />
      )}

      <SceneLabelGroup items={labels} fontScale={fontScale} />
    </g>
  );
};
