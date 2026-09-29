/**
 * 基本初等函数求导公式中屏 SVG 场景
 * 呈现：原函数曲线、导函数曲线、切点 P、割点 Q、割线、切线、逼近虚线与智能标注
 */
import React, { useMemo, useCallback } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { withAlpha } from "@/theme";
import { getFormulasPalette } from "@/features/derivativeFormulas/scenePalette";
import { dashArrayOf } from "@/components/Math/scenePalette";
import {
  calculateDerivativeFormula,
  type BasicFuncType,
} from "@/math/derivativeFormulas";
import { formatMathNumber } from "@/utils/mathFormat";
import { derivativeFormulasParamMeta } from "@/data/registries/derivativeFormulas";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";

interface DerivativeFormulasSceneProps {
  funcType: BasicFuncType;
  x0: number;
  deltaX: number;
  paramA: number;
  scale: SceneScale;
  fontScale?: (v: number) => number;
  onChangeX0: (newX0: number) => void;
  showDerivativeGraph?: boolean;
}

export const DerivativeFormulasScene: React.FC<
  DerivativeFormulasSceneProps
> = ({
  funcType,
  x0,
  deltaX,
  paramA,
  scale,
  fontScale = (v) => v,
  onChangeX0,
  showDerivativeGraph = true,
}) => {
  // 本页调色板：图例与画布的唯一颜色来源（见 scenePalette.ts）
  const P = getFormulasPalette();

  const res = useMemo(
    () => calculateDerivativeFormula(funcType, x0, deltaX, paramA),
    [funcType, x0, deltaX, paramA],
  );

  // 原函数计算器
  const funcEvaluator = useCallback(
    (x: number) => {
      const r = calculateDerivativeFormula(funcType, x, 0.1, paramA);
      return r.isValid ? r.fx0 : NaN;
    },
    [funcType, paramA],
  );

  // 导函数计算器
  const derivEvaluator = useCallback(
    (x: number) => {
      const r = calculateDerivativeFormula(funcType, x, 0.1, paramA);
      return r.isValid ? r.fpx0 : NaN;
    },
    [funcType, paramA],
  );

  /**
   * 动点拖拽统一落点：先按注册表步长取整，再钳制到「声明域 ∩ 可见视口」。
   * 各调用点不自写 Math.max/Math.min，也不写 `meta.step ?? 0.1` 这类隐式兜底
   * （否则同一参数在滑块、拖拽、看板三处会拿到不同粒度）。
   */
  const handleDragX0 = useCallback(
    (rawX: number) => {
      onChangeX0(
        snapDragValue(
          rawX,
          derivativeFormulasParamMeta.x0.step,
          paramDragRange(derivativeFormulasParamMeta.x0, scale, "x"),
        ),
      );
    },
    [onChangeX0, scale],
  );

  // 切线几何线段：横跨整个可见定义域（而不是硬编码 ±6，否则短视口下会拖出画布）
  const tangentLineEndpoints = useMemo(() => {
    if (!res.isValid) return null;
    const k = res.fpx0;
    const px = res.x0;
    const py = res.fx0;
    const p1 = mathToDesign(scale.xMin, py + k * (scale.xMin - px), scale);
    const p2 = mathToDesign(scale.xMax, py + k * (scale.xMax - px), scale);
    return { p1, p2 };
  }, [res.isValid, res.fpx0, res.x0, res.fx0, scale]);

  // 割线几何线段（过 P 和 Q，同样横跨可见定义域）
  const secantLineEndpoints = useMemo(() => {
    if (!res.isValid) return null;
    const k = res.secantSlope;
    const px = res.x0;
    const py = res.fx0;
    const p1 = mathToDesign(scale.xMin, py + k * (scale.xMin - px), scale);
    const p2 = mathToDesign(scale.xMax, py + k * (scale.xMax - px), scale);
    return { p1, p2 };
  }, [res.isValid, res.secantSlope, res.x0, res.fx0, scale]);

  // 投影点
  const pDesign = mathToDesign(res.x0, res.fx0, scale);
  const qDesign = mathToDesign(res.x0 + res.deltaX, res.fx0PlusDelta, scale);

  const labels = useMemo((): LabelItem[] => {
    if (!res.isValid) return [];
    return [
      {
        key: "point-p",
        text: `P(${formatMathNumber(res.x0)}, ${formatMathNumber(res.fx0)})`,
        x: pDesign.x,
        y: pDesign.y,
        color: P.pointP.color,
      },
      {
        key: "point-q",
        text: `Q(${formatMathNumber(res.x0 + res.deltaX)}, ${formatMathNumber(res.fx0PlusDelta)})`,
        x: qDesign.x,
        y: qDesign.y,
        color: P.pointQ.color,
      },
    ];
  }, [
    res.isValid,
    res.x0,
    res.fx0,
    res.deltaX,
    res.fx0PlusDelta,
    pDesign.x,
    pDesign.y,
    qDesign.x,
    qDesign.y,
    P.pointP.color,
    P.pointQ.color,
  ]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 原函数曲线 y = f(x) */}
      <FunctionGraph
        fn={funcEvaluator}
        scale={scale}
        color={P.fn.color}
        strokeWidth={P.fn.width}
      />

      {/* 导函数曲线 y = f'(x) */}
      {showDerivativeGraph && (
        <FunctionGraph
          fn={derivEvaluator}
          scale={scale}
          color={P.derivFn.color}
          strokeWidth={P.derivFn.width}
          strokeDasharray={dashArrayOf(P.derivFn)}
        />
      )}

      {/* 割线 PQ (平均变化率) */}
      {secantLineEndpoints && (
        <line
          x1={secantLineEndpoints.p1.x}
          y1={secantLineEndpoints.p1.y}
          x2={secantLineEndpoints.p2.x}
          y2={secantLineEndpoints.p2.y}
          stroke={P.secant.color}
          strokeWidth={P.secant.width}
          strokeDasharray={dashArrayOf(P.secant)}
          opacity={0.85}
        />
      )}

      {/* 切线 PT (瞬时导数) */}
      {tangentLineEndpoints && (
        <line
          x1={tangentLineEndpoints.p1.x}
          y1={tangentLineEndpoints.p1.y}
          x2={tangentLineEndpoints.p2.x}
          y2={tangentLineEndpoints.p2.y}
          stroke={P.tangent.color}
          strokeWidth={P.tangent.width}
        />
      )}

      {/* Δx 与 Δy 变化三角形辅助线 */}
      {res.isValid && (
        <path
          d={`M ${pDesign.x} ${pDesign.y} L ${qDesign.x} ${pDesign.y} L ${qDesign.x} ${qDesign.y}`}
          fill={withAlpha(P.deltaTriangle.color, 0.1)}
          stroke={withAlpha(P.deltaTriangle.color, 0.5)}
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />
      )}

      {/* 割点 Q (静态点) */}
      {res.isValid && (
        <MathPoint
          cx={res.x0 + res.deltaX}
          cy={res.fx0PlusDelta}
          scale={scale}
          color={P.pointQ.color}
          r={5}
        />
      )}

      {/* 核心切点 P (可拖拽自变量控制点) */}
      {res.isValid && (
        <InteractivePoint
          cx={res.x0}
          cy={res.fx0}
          scale={scale}
          color={P.pointP.color}
          r={7}
          axis="x"
          onChangeX={handleDragX0}
          edgeClampProjection
        />
      )}

      {/* 智能文字标注 */}
      <SceneLabelGroup items={labels} fontScale={fontScale} />
    </g>
  );
};
