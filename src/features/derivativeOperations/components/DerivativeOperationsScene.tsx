/**
 * 导数四则运算法则中屏 SVG 场景
 * 呈现：基函数曲线 f(x)、g(x)、运算结果曲线 H(x)、切线、动点与积法则面积微元展开
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
import { withAlpha } from "@/theme";
import {
  getOperationsPalette,
  OPS_CARD_COLORS as C,
} from "@/features/derivativeOperations/scenePalette";
import { dashArrayOf } from "@/components/Math/scenePalette";
import {
  calculateDerivativeOperation,
  type OperationType,
} from "@/math/derivativeOperations";
import { formatMathNumber } from "@/utils/mathFormat";
import { derivativeOperationsParamMeta } from "@/data/registries/derivativeOperations";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";

interface DerivativeOperationsSceneProps {
  opType: OperationType;
  x0: number;
  deltaX: number;
  scale: SceneScale;
  fontScale?: (v: number) => number;
  onChangeX0: (newX0: number) => void;
}

export const DerivativeOperationsScene: React.FC<
  DerivativeOperationsSceneProps
> = ({ opType, x0, deltaX, scale, fontScale = (v) => v, onChangeX0 }) => {
  // 本页调色板：图例与画布的唯一颜色来源（见 scenePalette.ts）
  const P = getOperationsPalette();

  const res = useMemo(
    () => calculateDerivativeOperation(opType, x0, deltaX, "poly_trig"),
    [opType, x0, deltaX],
  );

  const fEvaluator = useCallback((x: number) => x, []);
  const gEvaluator = useCallback((x: number) => Math.sin(x), []);
  const hEvaluator = useCallback(
    (x: number) => {
      const r = calculateDerivativeOperation(opType, x, 0.1, "poly_trig");
      return r.isValid ? r.combinedY : NaN;
    },
    [opType],
  );

  /** 动点拖拽统一落点（先按注册表步长取整，再钳制到「声明域 ∩ 可见视口」） */
  const handleDragX0 = useCallback(
    (rawX: number) => {
      onChangeX0(
        snapDragValue(
          rawX,
          derivativeOperationsParamMeta.x0.step,
          paramDragRange(derivativeOperationsParamMeta.x0, scale, "x"),
        ),
      );
    },
    [onChangeX0, scale],
  );

  // 切线几何线段（横跨整个可见定义域）
  const tangentLineEndpoints = useMemo(() => {
    if (!res.isValid) return null;
    const k = res.combinedSlope;
    const px = res.x0;
    const py = res.combinedY;
    const p1 = mathToDesign(scale.xMin, py + k * (scale.xMin - px), scale);
    const p2 = mathToDesign(scale.xMax, py + k * (scale.xMax - px), scale);
    return { p1, p2 };
  }, [res.isValid, res.combinedSlope, res.x0, res.combinedY, scale]);

  const pDesign = useMemo(() => {
    return res.isValid
      ? mathToDesign(res.x0, res.combinedY, scale)
      : { x: 0, y: 0 };
  }, [res.isValid, res.x0, res.combinedY, scale]);

  const labels = useMemo((): LabelItem[] => {
    if (!res.isValid) return [];
    return [
      {
        key: "point-h",
        text: `H(${formatMathNumber(res.x0)}, ${formatMathNumber(res.combinedY)})`,
        x: pDesign.x,
        y: pDesign.y,
        color: P.pointH.color,
      },
    ];
  }, [
    res.isValid,
    res.x0,
    res.combinedY,
    pDesign.x,
    pDesign.y,
    P.pointH.color,
  ]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 基函数一 f(x) = x */}
      <g opacity={0.7}>
        <FunctionGraph
          fn={fEvaluator}
          scale={scale}
          color={P.f.color}
          strokeWidth={P.f.width}
          strokeDasharray={dashArrayOf(P.f)}
        />
      </g>

      {/* 基函数二 g(x) = sin x */}
      <g opacity={0.7}>
        <FunctionGraph
          fn={gEvaluator}
          scale={scale}
          color={P.g.color}
          strokeWidth={P.g.width}
          strokeDasharray={dashArrayOf(P.g)}
        />
      </g>

      {/* 复合运算曲线 H(x) */}
      <FunctionGraph
        fn={hEvaluator}
        scale={scale}
        color={P.h.color}
        strokeWidth={P.h.width}
      />

      {/* 运算切线 */}
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

      {/* 核心动点 */}
      {res.isValid && (
        <InteractivePoint
          cx={res.x0}
          cy={res.combinedY}
          scale={scale}
          color={P.pointH.color}
          r={7}
          axis="x"
          xRange={paramDragRange(derivativeOperationsParamMeta.x0, scale, "x")}
          onChangeX={handleDragX0}
          edgeClampProjection
        />
      )}

      {/* 智能文字标注 */}
      <SceneLabelGroup items={labels} fontScale={fontScale} />

      {/* 积法则微元几何面积示意卡片 (置于左上方空白区) */}
      {opType === "multiply" && res.isValid && (
        <g transform="translate(20, 20)">
          <rect
            x={0}
            y={0}
            width={180}
            height={130}
            rx={8}
            fill={withAlpha(C.panel, 0.92)}
            stroke={C.panelEdge}
            strokeWidth={1}
          />
          <text
            x={10}
            y={20}
            fill={C.title}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            矩形面积增量几何分解 Δ(uv)
          </text>

          {/* 矩形分解示意图 */}
          <g transform="translate(15, 30)">
            {/* 主部 u * v */}
            <rect
              x={0}
              y={0}
              width={70}
              height={50}
              fill={withAlpha(C.main, 0.2)}
              stroke={C.main}
              strokeWidth={1}
            />
            <text x={22} y={28} fill={C.mainLabel} fontSize={fontScale(10)}>
              u · v
            </text>

            {/* 增量 u * Δv */}
            <rect
              x={70}
              y={0}
              width={35}
              height={50}
              fill={withAlpha(C.incUdV, 0.3)}
              stroke={C.incUdV}
              strokeWidth={1}
            />
            <text x={74} y={28} fill={C.incUdV} fontSize={fontScale(9)}>
              u · Δv
            </text>

            {/* 增量 v * Δu */}
            <rect
              x={0}
              y={50}
              width={70}
              height={25}
              fill={withAlpha(C.incVDu, 0.3)}
              stroke={C.incVDu}
              strokeWidth={1}
            />
            <text x={18} y={66} fill={C.incVDu} fontSize={fontScale(9)}>
              v · Δu
            </text>

            {/* 高阶增量小项 Δu * Δv */}
            <rect
              x={70}
              y={50}
              width={35}
              height={25}
              fill={withAlpha(C.higher, 0.4)}
              stroke={C.higherEdge}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <text x={73} y={66} fill={C.higherEdge} fontSize={fontScale(8)}>
              Δu·Δv
            </text>
          </g>
          <text x={10} y={120} fill={C.footnote} fontSize={fontScale(9.5)}>
            两主项构成导数核心：u'v + uv'
          </text>
        </g>
      )}
    </g>
  );
};
