import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  Asymptote,
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import {
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
  evalF,
  evalGParam,
  evalFTrans,
  evalGParamTrans,
} from "@/math/constant";
import { MATH_COLORS, withAlpha } from "@/theme";

interface SingleVarSceneProps {
  subMode: "sep" | "direct";
  logic: "always" | "exist";
  funModel: "quadratic" | "transcendent";
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale?: (v: number) => number;
  onParamChange: (key: string, value: number) => void;
}

export const SingleVarScene: React.FC<SingleVarSceneProps> = ({
  subMode,
  funModel,
  params,
  scale,
  vp,
  fontScale = (v) => v,
  onParamChange,
}) => {
  const a = params.a ?? 1.2;
  const a_axis = params.a_axis ?? 1.0;
  const m = params.m ?? 0.5;
  const n = params.n ?? 2.5;

  const isSep = subMode === "sep";

  // 计算结果
  const sepResult = useMemo(() => {
    return funModel === "transcendent"
      ? solveConstantSingleSepTrans(a, m, n)
      : solveConstantSingleSep(a, m, n);
  }, [a, m, n, funModel]);

  const directResult = useMemo(() => {
    return funModel === "transcendent"
      ? solveConstantSingleDirectTrans(a_axis, m, n)
      : solveConstantSingleDirect(a_axis, m, n);
  }, [a_axis, m, n, funModel]);

  // 1. 拖拽回调 (保留 0.05 步长)
  const handleMDrag = (mathPt: { x: number; y: number }) => {
    onParamChange("m", Math.round(mathPt.x * 20) / 20);
  };

  const handleNDrag = (mathPt: { x: number; y: number }) => {
    onParamChange("n", Math.round(mathPt.x * 20) / 20);
  };

  const handleADrag = (mathPt: { x: number; y: number }) => {
    onParamChange("a", Math.round(mathPt.y * 20) / 20);
  };

  const handleAAxisDrag = (mathPt: { x: number; y: number }) => {
    onParamChange("a_axis", Math.round(mathPt.x * 20) / 20);
  };

  // 2. 坐标投射
  const ptM = mathToDesign(m, 0, scale);
  const ptN = mathToDesign(n, 0, scale);
  const isCollapsed = m >= n;

  // 极值标注避让（Min/Max 标签）
  const placedExtremumLabels = useMemo(() => {
    if (isCollapsed) return [];
    const entries: LabelEntry[] = [];
    if (isSep) {
      const ptMin = mathToDesign(sepResult.xFMin, sepResult.fMin, scale);
      const ptMax = mathToDesign(sepResult.xFMax, sepResult.fMax, scale);
      entries.push(
        {
          key: "min",
          text: `Min(${sepResult.fMin.toFixed(2)})`,
          x: ptMin.x,
          y: ptMin.y,
          anchor: "middle",
          dy: -8,
        },
        {
          key: "max",
          text: `Max(${sepResult.fMax.toFixed(2)})`,
          x: ptMax.x,
          y: ptMax.y,
          anchor: "middle",
          dy: -8,
        },
      );
    } else {
      const ptMin = mathToDesign(directResult.xFMin, directResult.fMin, scale);
      entries.push({
        key: "min",
        text: `Min(${directResult.fMin.toFixed(2)})`,
        x: ptMin.x,
        y: ptMin.y,
        anchor: "middle",
        dy: -8,
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [isSep, isCollapsed, sepResult, directResult, scale, fontScale]);

  // 控制点标注避让（m, n, a, a_axis）
  const placedPointLabels = useMemo(() => {
    const entries: LabelEntry[] = [
      {
        key: "m",
        text: `m=${m.toFixed(2)}`,
        x: mathToDesign(m, 0, scale).x,
        y: mathToDesign(m, 0, scale).y,
        anchor: "middle",
        dy: -12,
      },
      {
        key: "n",
        text: `n=${n.toFixed(2)}`,
        x: mathToDesign(n, 0, scale).x,
        y: mathToDesign(n, 0, scale).y,
        anchor: "middle",
        dy: -12,
      },
    ];
    if (isSep && !isCollapsed) {
      entries.push({
        key: "a",
        text: `a=${a.toFixed(2)}`,
        x: mathToDesign((m + n) / 2, a, scale).x,
        y: mathToDesign((m + n) / 2, a, scale).y,
        anchor: "middle",
        dy: -12,
      });
    }
    if (!isSep && !isCollapsed) {
      const aX =
        funModel === "transcendent" && a_axis > 0 ? Math.log(a_axis) : a_axis;
      entries.push({
        key: "a_axis",
        text: `a=${a_axis.toFixed(2)}`,
        x: mathToDesign(aX, 0, scale).x,
        y: mathToDesign(aX, 0, scale).y,
        anchor: "middle",
        dy: -12,
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [m, n, a, a_axis, isSep, isCollapsed, funModel, scale, fontScale]);

  // 3. 水平线 y = a 的渲染 (仅在 sep 模式)
  const sepHorizontalLine = useMemo(() => {
    if (!isSep || isCollapsed) return null;

    return (
      <Asymptote
        type="horizontal"
        value={a}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        label={`y = a (${a.toFixed(2)})`}
        fontScale={fontScale}
      />
    );
  }, [isSep, a, scale, fontScale, isCollapsed]);

  // 4. 对称轴 / 极小值点 的渲染 (仅在 direct 模式)
  const directAxisLine = useMemo(() => {
    if (isSep || isCollapsed) return null;
    if (funModel === "transcendent") {
      if (a_axis <= 0) return null;
      const lna = Math.log(a_axis);
      return (
        <Asymptote
          type="vertical"
          value={lna}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          label={`极小值点 x = ln a (${lna.toFixed(2)})`}
          fontScale={fontScale}
        />
      );
    } else {
      return (
        <Asymptote
          type="vertical"
          value={a_axis}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          label={`对称轴 x = a (${a_axis.toFixed(2)})`}
          fontScale={fontScale}
        />
      );
    }
  }, [isSep, a_axis, scale, fontScale, isCollapsed, funModel]);

  // 5. 违背区间与高亮线
  const violatedVisuals = useMemo(() => {
    if (isCollapsed) return null;
    const violated = isSep
      ? sepResult.violatedInterval
      : directResult.violatedInterval;
    if (!violated) return null;

    const [vStart, vEnd] = violated;
    let curveFn: (x: number) => number;
    if (funModel === "transcendent") {
      curveFn = isSep ? evalFTrans : (x: number) => evalGParamTrans(x, a_axis);
    } else {
      curveFn = isSep ? evalF : (x: number) => evalGParam(x, a_axis);
    }

    return (
      <g>
        {/* 违背区间高亮阴影 */}
        <IntervalShadow
          fn={curveFn}
          x1={vStart}
          x2={vEnd}
          scale={scale}
          fillColor={withAlpha(MATH_COLORS.degeneracy, 0.12)}
          strokeColor={MATH_COLORS.degeneracy}
          strokeWidth={2}
        />
        {/* 违背区间的提示文字 */}
        <text
          x={mathToDesign((vStart + vEnd) / 2, 0, scale).x}
          y={mathToDesign(0, scale.yMin + 0.3, scale).y}
          textAnchor="middle"
          fill={MATH_COLORS.degeneracy}
          fontSize={fontScale(10)}
          className="font-bold select-none"
        >
          违背区间 [{vStart.toFixed(2)}, {vEnd.toFixed(2)}]
        </text>
      </g>
    );
  }, [
    isSep,
    sepResult,
    directResult,
    scale,
    a_axis,
    fontScale,
    isCollapsed,
    funModel,
  ]);

  return (
    <g>
      {/* 坐标轴背景 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 研究区间 [m, n] 的遮罩底纹 */}
      {!isCollapsed && (
        <rect
          x={ptM.x}
          y={mathToDesign(0, scale.yMax, scale).y}
          width={Math.max(0, ptN.x - ptM.x)}
          height={Math.max(
            0,
            mathToDesign(0, scale.yMin, scale).y -
              mathToDesign(0, scale.yMax, scale).y,
          )}
          fill={withAlpha(MATH_COLORS.function, 0.04)}
          pointerEvents="none"
        />
      )}

      {/* 抛物线绘制 */}
      {/* 1. 区间外绘制细线 */}
      <FunctionGraph
        fn={(x) => {
          if (isCollapsed) return NaN;
          if (funModel === "transcendent") {
            if (x <= 0) return NaN;
            // 参变分离超越曲线
            if (isSep) {
              return x < m || x > n ? evalFTrans(x) : NaN;
            } else {
              return x < m || x > n ? evalGParamTrans(x, a_axis) : NaN;
            }
          } else {
            return x < m || x > n
              ? isSep
                ? evalF(x)
                : evalGParam(x, a_axis)
              : NaN;
          }
        }}
        scale={scale}
        color={withAlpha(MATH_COLORS.function, 0.35)}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      {/* 2. 区间内绘制加粗实线 */}
      {!isCollapsed && (
        <FunctionGraph
          fn={(x) => {
            if (funModel === "transcendent") {
              if (x <= 0) return NaN;
              return x >= m && x <= n
                ? isSep
                  ? evalFTrans(x)
                  : evalGParamTrans(x, a_axis)
                : NaN;
            } else {
              return x >= m && x <= n
                ? isSep
                  ? evalF(x)
                  : evalGParam(x, a_axis)
                : NaN;
            }
          }}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />
      )}

      {/* 水平线与对称轴 */}
      {sepHorizontalLine}
      {directAxisLine}

      {/* 违背区间渲染 */}
      {violatedVisuals}

      {/* 区间端点垂直虚线与指示 */}
      {!isCollapsed && (
        <g>
          <line
            x1={ptM.x}
            y1={mathToDesign(m, scale.yMax, scale).y}
            x2={ptM.x}
            y2={mathToDesign(m, scale.yMin, scale).y}
            stroke={MATH_COLORS.asymptote}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          <line
            x1={ptN.x}
            y1={mathToDesign(n, scale.yMax, scale).y}
            x2={ptN.x}
            y2={mathToDesign(n, scale.yMin, scale).y}
            stroke={MATH_COLORS.asymptote}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        </g>
      )}

      {/* 可交互端点：左端点 m */}
      <InteractivePoint
        cx={m}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleMDrag}
        color={MATH_COLORS.asymptote}
        r={5}
        label={`m=${m.toFixed(2)}`}
        labelKey="m"
        placedLabels={placedPointLabels}
        fontScale={fontScale}
      />

      {/* 可交互端点：右端点 n */}
      <InteractivePoint
        cx={n}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleNDrag}
        color={MATH_COLORS.asymptote}
        r={5}
        label={`n=${n.toFixed(2)}`}
        labelKey="n"
        placedLabels={placedPointLabels}
        fontScale={fontScale}
      />

      {/* 探索控制点：水平线 dragging 点 (模式A) */}
      {isSep && !isCollapsed && (
        <InteractivePoint
          cx={(m + n) / 2}
          cy={a}
          scale={scale}
          vp={vp}
          onDrag={handleADrag}
          color={MATH_COLORS.paramPrimary}
          r={6.5}
          label={`a=${a.toFixed(2)} (拖动)`}
          labelKey="a"
          placedLabels={placedPointLabels}
          fontScale={fontScale}
        />
      )}

      {/* 探索控制点：对称轴/极小值点 dragging 点 (模式B) */}
      {!isSep && !isCollapsed && (
        <InteractivePoint
          cx={
            funModel === "transcendent" && a_axis > 0
              ? Math.log(a_axis)
              : a_axis
          }
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handleAAxisDrag}
          color={MATH_COLORS.paramPrimary}
          r={6.5}
          label={
            funModel === "transcendent"
              ? `极小值 ln a (${(a_axis > 0 ? Math.log(a_axis) : 0).toFixed(2)})`
              : `轴 a=${a_axis.toFixed(2)} (拖动)`
          }
          labelKey="a_axis"
          placedLabels={placedPointLabels}
          fontScale={fontScale}
        />
      )}

      {/* 渲染极值点标注 (带避让) */}
      {!isCollapsed && (
        <g>
          {isSep ? (
            <g>
              {/* 最小值点 */}
              <circle
                cx={mathToDesign(sepResult.xFMin, sepResult.fMin, scale).x}
                cy={mathToDesign(sepResult.xFMin, sepResult.fMin, scale).y}
                r={4}
                fill={MATH_COLORS.function}
              />
              {(() => {
                const placed = placedExtremumLabels.find(
                  (l) => l.key === "min",
                );
                return placed ? (
                  <text
                    x={placed.x}
                    y={placed.y}
                    dy={placed.finalDy}
                    textAnchor={placed.anchor}
                    fill={MATH_COLORS.function}
                    fontSize={fontScale(9)}
                    className="font-bold font-mono select-none"
                  >
                    Min({sepResult.fMin.toFixed(2)})
                  </text>
                ) : null;
              })()}

              {/* 最大值点 */}
              <circle
                cx={mathToDesign(sepResult.xFMax, sepResult.fMax, scale).x}
                cy={mathToDesign(sepResult.xFMax, sepResult.fMax, scale).y}
                r={4}
                fill={MATH_COLORS.derivative}
              />
              {(() => {
                const placed = placedExtremumLabels.find(
                  (l) => l.key === "max",
                );
                return placed ? (
                  <text
                    x={placed.x}
                    y={placed.y}
                    dy={placed.finalDy}
                    textAnchor={placed.anchor}
                    fill={MATH_COLORS.derivative}
                    fontSize={fontScale(9)}
                    className="font-bold font-mono select-none"
                  >
                    Max({sepResult.fMax.toFixed(2)})
                  </text>
                ) : null;
              })()}
            </g>
          ) : (
            <g>
              {/* 直接讨论模式最小值点 */}
              <circle
                cx={
                  mathToDesign(directResult.xFMin, directResult.fMin, scale).x
                }
                cy={
                  mathToDesign(directResult.xFMin, directResult.fMin, scale).y
                }
                r={4.5}
                fill={MATH_COLORS.function}
              />
              {(() => {
                const placed = placedExtremumLabels.find(
                  (l) => l.key === "min",
                );
                return placed ? (
                  <text
                    x={placed.x}
                    y={placed.y}
                    dy={placed.finalDy}
                    textAnchor={placed.anchor}
                    fill={MATH_COLORS.function}
                    fontSize={fontScale(9)}
                    className="font-bold font-mono select-none"
                  >
                    Min({directResult.fMin.toFixed(2)})
                  </text>
                ) : null;
              })()}
            </g>
          )}
        </g>
      )}
    </g>
  );
};
