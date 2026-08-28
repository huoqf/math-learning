import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  SceneLabelGroup,
  SceneLegend,
  type SceneLegendItem,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  solveSingleVarQuantifier,
  solveDualVarQuantifier,
} from "@/math/quantifiers";

interface QuantifiersSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeTab: "universal" | "existential" | "dual";
  dualScenario: "all_all" | "all_exist" | "exist_exist";
  onParamChange: (key: string, value: number) => void;
  fontScale: (v: number) => number;
}

export function QuantifiersScene({
  params,
  scale,
  vp,
  activeTab,
  dualScenario,
  onParamChange,
  fontScale,
}: QuantifiersSceneProps) {
  const k = params.k ?? 1.0;
  const h = params.h ?? 0.0;
  const v = params.v ?? 1.0;
  const intMin = params.intMin ?? -2.0;
  const intMax = params.intMax ?? 2.0;
  const threshold = params.threshold ?? 0.0;
  const probeX = params.probeX ?? 0.0;

  const k2 = params.k2 ?? -0.8;
  const h2 = params.h2 ?? 0.0;
  const v2 = params.v2 ?? -0.5;
  const int2Min = params.int2Min ?? -1.5;
  const int2Max = params.int2Max ?? 1.5;

  // 1. 数学逻辑计算
  const singleResult = useMemo(() => {
    return solveSingleVarQuantifier(
      activeTab === "dual" ? "universal" : activeTab,
      k,
      h,
      v,
      intMin,
      intMax,
      threshold,
      probeX,
    );
  }, [activeTab, k, h, v, intMin, intMax, threshold, probeX]);

  const dualResult = useMemo(() => {
    return solveDualVarQuantifier(
      dualScenario,
      k,
      h,
      v,
      intMin,
      intMax,
      k2,
      h2,
      v2,
      int2Min,
      int2Max,
    );
  }, [dualScenario, k, h, v, intMin, intMax, k2, h2, v2, int2Min, int2Max]);

  // 函数闭包
  const fnF = useMemo(
    () => (x: number) => k * (x - h) * (x - h) + v,
    [k, h, v],
  );
  const fnFInterval = useMemo(
    () => (x: number) => {
      if (x < singleResult.interval.min || x > singleResult.interval.max)
        return NaN;
      return k * (x - h) * (x - h) + v;
    },
    [k, h, v, singleResult.interval],
  );

  const fnG = useMemo(
    () => (x: number) => k2 * (x - h2) * (x - h2) + v2,
    [k2, h2, v2],
  );
  const fnGInterval = useMemo(
    () => (x: number) => {
      if (x < dualResult.intervalG.min || x > dualResult.intervalG.max)
        return NaN;
      return k2 * (x - h2) * (x - h2) + v2;
    },
    [k2, h2, v2, dualResult.intervalG],
  );

  // 2. 坐标投射
  const mLeft = mathToDesign(-6, threshold, scale);
  const mRight = mathToDesign(6, threshold, scale);

  const aPos = mathToDesign(singleResult.interval.min, 0, scale);
  const bPos = mathToDesign(singleResult.interval.max, 0, scale);

  const probePos = mathToDesign(probeX, singleResult.probeVal, scale);
  const probeFoot = mathToDesign(probeX, 0, scale);

  const minPos = mathToDesign(singleResult.xMinAt, singleResult.fMin, scale);

  // 3. 点标生成 (SceneLabelGroup 避让)
  const labels = useMemo<LabelItem[]>(() => {
    const list: LabelItem[] = [];

    if (activeTab !== "dual") {
      list.push({
        key: "probe",
        text: "P",
        x: probePos.x,
        y: probePos.y,
        color: singleResult.isProbeCounterExample
          ? MATH_COLORS.paramPrimary
          : MATH_COLORS.paramTertiary,
        preferredPlacement: "top-right",
      });

      list.push({
        key: "extrema",
        text: "E",
        x: minPos.x,
        y: minPos.y,
        color: MATH_COLORS.primary,
        preferredPlacement: "bottom",
      });
    } else {
      const fMinPos = mathToDesign(
        dualResult.intervalF.min,
        dualResult.fMin,
        scale,
      );
      const gMaxPos = mathToDesign(
        dualResult.intervalG.max,
        dualResult.gMax,
        scale,
      );

      list.push({
        key: "fMin",
        text: "f_min",
        x: fMinPos.x,
        y: fMinPos.y,
        color: MATH_COLORS.primary,
        preferredPlacement: "bottom",
      });
      list.push({
        key: "gMax",
        text: "g_max",
        x: gMaxPos.x,
        y: gMaxPos.y,
        color: MATH_COLORS.secondary,
        preferredPlacement: "top",
      });
    }

    return list;
  }, [activeTab, probePos, minPos, singleResult, dualResult, scale]);

  // 4. 图例项生成
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (activeTab === "universal") {
      return [
        {
          label: "函数 f(x) = k(x-h)² + v",
          type: "solid",
          color: MATH_COLORS.primary,
        },
        {
          label: "基准阈值线 y = m",
          type: "dashed",
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: singleResult.isOriginalTrue
            ? "全称成立（全域 ≥ m）"
            : "命题被证伪（存在反例）",
          type: "point",
          color: singleResult.isOriginalTrue
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramPrimary,
        },
      ];
    } else if (activeTab === "existential") {
      return [
        {
          label: "函数 f(x) = k(x-h)² + v",
          type: "solid",
          color: MATH_COLORS.primary,
        },
        {
          label: "基准阈值线 y = m",
          type: "dashed",
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: singleResult.isOriginalTrue
            ? "存在成立（有部分 ≤ m）"
            : "存在命题为假（全域 > m）",
          type: "point",
          color: singleResult.isOriginalTrue
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramPrimary,
        },
      ];
    } else {
      return [
        {
          label: "函数 f(x) (自变量 x₁)",
          type: "solid",
          color: MATH_COLORS.primary,
        },
        {
          label: "函数 g(x) (自变量 x₂)",
          type: "solid",
          color: MATH_COLORS.secondary,
        },
        {
          label: dualResult.isTrue
            ? "博弈条件满足 (真)"
            : "博弈条件不满足 (假)",
          type: "point",
          color: dualResult.isTrue
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramPrimary,
        },
      ];
    }
  }, [activeTab, singleResult, dualResult]);

  return (
    <g>
      {/* 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {activeTab !== "dual" ? (
        <>
          {/* 区间 [a, b] 在 X 轴上的高亮带 */}
          <line
            x1={aPos.x}
            y1={aPos.y}
            x2={bPos.x}
            y2={bPos.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle
            cx={aPos.x}
            cy={aPos.y}
            r={3}
            fill={MATH_COLORS.paramSecondary}
          />
          <circle
            cx={bPos.x}
            cy={bPos.y}
            r={3}
            fill={MATH_COLORS.paramSecondary}
          />

          {/* 反例区间阴影高亮 */}
          {singleResult.counterIntervals.map((ci, idx) => {
            const startD = mathToDesign(ci.min, 0, scale);
            const endD = mathToDesign(ci.max, 0, scale);
            const width = Math.abs(endD.x - startD.x);
            return (
              <rect
                key={idx}
                x={Math.min(startD.x, endD.x)}
                y={0}
                width={width}
                height={650}
                fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.3)}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* 基准阈值水平参考线 y = m */}
          <line
            x1={mLeft.x}
            y1={mLeft.y}
            x2={mRight.x}
            y2={mRight.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
            strokeDasharray="6 4"
          />

          {/* 全域函数曲线背景细线 */}
          <FunctionGraph
            fn={fnF}
            scale={scale}
            color={withAlpha(MATH_COLORS.primary, 0.4)}
            strokeWidth={1.6}
          />

          {/* 区间内有效函数段高亮加粗 */}
          <FunctionGraph
            fn={fnFInterval}
            scale={scale}
            color={
              singleResult.isOriginalTrue
                ? MATH_COLORS.primary
                : MATH_COLORS.paramPrimary
            }
            strokeWidth={3.6}
          />

          {/* 动点探针投影线 */}
          <line
            x1={probeFoot.x}
            y1={probeFoot.y}
            x2={probePos.x}
            y2={probePos.y}
            stroke={CANVAS_COLORS.axis}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />

          {/* 极值点标记 */}
          <MathPoint
            cx={singleResult.xMinAt}
            cy={singleResult.fMin}
            scale={scale}
            color={MATH_COLORS.primary}
            variant="focus"
          />

          {/* 动点探针 P(x0, f(x0)) */}
          <InteractivePoint
            cx={probeX}
            cy={singleResult.probeVal}
            scale={scale}
            vp={vp}
            color={
              singleResult.isProbeCounterExample
                ? MATH_COLORS.paramPrimary
                : MATH_COLORS.paramTertiary
            }
            fontScale={fontScale}
            onDrag={(pt) => {
              const clamped = Math.max(
                singleResult.interval.min,
                Math.min(singleResult.interval.max, pt.x),
              );
              onParamChange("probeX", Number(clamped.toFixed(2)));
            }}
          />
        </>
      ) : (
        <>
          {/* 双变量模式：全域背景曲线 */}
          <FunctionGraph
            fn={fnF}
            scale={scale}
            color={withAlpha(MATH_COLORS.primary, 0.35)}
            strokeWidth={1.6}
          />
          <FunctionGraph
            fn={fnFInterval}
            scale={scale}
            color={MATH_COLORS.primary}
            strokeWidth={3.6}
          />

          <FunctionGraph
            fn={fnG}
            scale={scale}
            color={withAlpha(MATH_COLORS.secondary, 0.35)}
            strokeWidth={1.6}
          />
          <FunctionGraph
            fn={fnGInterval}
            scale={scale}
            color={MATH_COLORS.secondary}
            strokeWidth={3.6}
          />

          {/* Y 轴值域投影带对比 */}
          {(() => {
            const fMinD = mathToDesign(0, dualResult.fMin, scale);
            const fMaxD = mathToDesign(0, dualResult.fMax, scale);
            const gMinD = mathToDesign(0, dualResult.gMin, scale);
            const gMaxD = mathToDesign(0, dualResult.gMax, scale);

            return (
              <>
                <line
                  x1={fMinD.x - 8}
                  y1={fMinD.y}
                  x2={fMaxD.x - 8}
                  y2={fMaxD.y}
                  stroke={MATH_COLORS.primary}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <line
                  x1={gMinD.x + 8}
                  y1={gMinD.y}
                  x2={gMaxD.x + 8}
                  y2={gMaxD.y}
                  stroke={MATH_COLORS.secondary}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              </>
            );
          })()}
        </>
      )}

      {/* 智能避让点标图层 */}
      <SceneLabelGroup items={labels} fontScale={fontScale} />

      {/* 右下角半透明毛玻璃图例 */}
      <SceneLegend items={legendItems} />
    </g>
  );
}
