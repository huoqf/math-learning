import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  Asymptote,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS, CANVAS_COLORS } from "@/theme";
import { calculateExpLog, calculatePowerFunction } from "@/math/function";

interface ExpLogSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  funcType: "exponential" | "logarithmic" | "power";
  showInverse?: boolean;
}

export function ExpLogScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  funcType,
  showInverse = false,
}: ExpLogSceneProps) {
  const x0 = params.x0 ?? 1.5;
  const a = params.baseA ?? 2.0;
  const powerAlpha = params.powerAlpha ?? 2.0;

  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };

  const powerRes = React.useMemo(
    () => calculatePowerFunction(powerAlpha, x0),
    [powerAlpha, x0],
  );

  const placedLabels = React.useMemo(() => {
    const entries: LabelEntry[] = [];
    const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;

    if (funcType === "exponential" && isValidBase) {
      const expLogRes = calculateExpLog(a, x0);
      if (Number.isFinite(expLogRes.expVal)) {
        const pt = mathToDesign(x0, expLogRes.expVal, scale);
        entries.push({
          key: "P",
          text: `P(${x0.toFixed(1)}, ${expLogRes.expVal.toFixed(1)})`,
          x: pt.x,
          y: pt.y,
          anchor: "middle",
          dy: -12,
        });

        if (showInverse) {
          const invPt = mathToDesign(expLogRes.expVal, x0, scale);
          entries.push({
            key: "P_inv",
            text: `P'(${expLogRes.expVal.toFixed(1)}, ${x0.toFixed(1)})`,
            x: invPt.x,
            y: invPt.y,
            anchor: "start",
            dy: -8,
          });
        }
      }
    } else if (funcType === "logarithmic" && isValidBase) {
      if (x0 > 0) {
        const logVal = Math.log(x0) / Math.log(a);
        if (Number.isFinite(logVal)) {
          const pt = mathToDesign(x0, logVal, scale);
          entries.push({
            key: "P",
            text: `P(${x0.toFixed(1)}, ${logVal.toFixed(1)})`,
            x: pt.x,
            y: pt.y,
            anchor: "middle",
            dy: -12,
          });

          if (showInverse) {
            const invPt = mathToDesign(logVal, x0, scale);
            entries.push({
              key: "P_inv",
              text: `P'(${logVal.toFixed(1)}, ${x0.toFixed(1)})`,
              x: invPt.x,
              y: invPt.y,
              anchor: "start",
              dy: -8,
            });
          }
        }
      }
    } else if (funcType === "power") {
      if (powerRes.isValidPoint) {
        const pt = mathToDesign(x0, powerRes.yVal, scale);
        entries.push({
          key: "P",
          text: `P(${x0.toFixed(1)}, ${powerRes.yVal.toFixed(1)})`,
          x: pt.x,
          y: pt.y,
          anchor: "middle",
          dy: -12,
        });
      }
    }
    return avoidLabels(entries, { fontScale });
  }, [funcType, x0, a, powerAlpha, powerRes, showInverse, scale, fontScale]);

  // 1. 幂函数模式 y = x^α
  if (funcType === "power") {
    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 渐近线展示 (α < 0 时展示两坐标轴渐近线) */}
        {powerAlpha < 0 && (
          <>
            <Asymptote
              type="vertical"
              value={0}
              scale={scale}
              label="x = 0"
              fontScale={fontScale}
            />
            <Asymptote
              type="horizontal"
              value={0}
              scale={scale}
              label="y = 0"
              fontScale={fontScale}
            />
          </>
        )}

        {/* 幂函数曲线 */}
        <FunctionGraph
          fn={(x) => {
            if (powerAlpha === 0) return Math.abs(x) < 1e-4 ? NaN : 1;
            if (powerAlpha < 0) {
              if (Math.abs(x) < 1e-3) return NaN;
              if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
              return Math.pow(x, powerAlpha);
            }
            // powerAlpha > 0
            if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
            return Math.pow(x, powerAlpha);
          }}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />

        {/* 通用必过定点 (1, 1) */}
        <circle
          cx={scale.originX + 1 * scale.scaleX}
          cy={scale.originY - 1 * scale.scaleY}
          r={5}
          fill={MATH_COLORS.paramPrimary}
        />
        <text
          x={scale.originX + 1 * scale.scaleX + 8}
          y={scale.originY - 1 * scale.scaleY - 6}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          (1, 1)
        </text>

        {/* α > 0 时的原点 (0,0) */}
        {powerAlpha > 0 && (
          <circle
            cx={scale.originX}
            cy={scale.originY}
            r={4}
            fill={MATH_COLORS.function}
          />
        )}

        {/* 交互控制与采样点 P */}
        {powerRes.isValidPoint && (
          <InteractivePoint
            cx={x0}
            cy={powerRes.yVal}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.function}
            label={`P(${x0.toFixed(1)}, ${powerRes.yVal.toFixed(1)})`}
            labelKey="P"
            placedLabels={placedLabels}
            fontScale={fontScale}
          />
        )}
      </g>
    );
  }

  // 2. 指数与对数模式
  const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 渐近线 */}
      {funcType === "exponential" && isValidBase && (
        <Asymptote
          type="horizontal"
          value={0}
          scale={scale}
          label="y = 0"
          fontScale={fontScale}
        />
      )}
      {funcType === "logarithmic" && isValidBase && (
        <Asymptote
          type="vertical"
          value={0}
          scale={scale}
          label="x = 0"
          fontScale={fontScale}
        />
      )}

      {/* 反函数对称轴 y = x */}
      {showInverse && (
        <FunctionGraph
          fn={(x) => x}
          scale={scale}
          color={MATH_COLORS.labelText}
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
      )}

      {/* 指数函数 y = a^x */}
      {funcType === "exponential" && isValidBase && (
        <FunctionGraph
          fn={(x) => Math.pow(a, x)}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      )}

      {/* 对数函数 y = log_a(x) */}
      {funcType === "logarithmic" && isValidBase && (
        <FunctionGraph
          fn={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      )}

      {/* 反函数对称辅助虚线 */}
      {showInverse && isValidBase && funcType === "exponential" && (
        <FunctionGraph
          fn={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)}
          scale={scale}
          color={MATH_COLORS.functionTransformed}
          strokeWidth={2.5}
          strokeDasharray="4 4"
        />
      )}
      {showInverse && isValidBase && funcType === "logarithmic" && (
        <FunctionGraph
          fn={(x) => Math.pow(a, x)}
          scale={scale}
          color={MATH_COLORS.functionTransformed}
          strokeWidth={2.5}
          strokeDasharray="4 4"
        />
      )}

      {/* 指数必过点 (0, 1) */}
      {isValidBase && funcType === "exponential" && (
        <g>
          <circle
            cx={scale.originX}
            cy={scale.originY - 1 * scale.scaleY}
            r={4.5}
            fill={MATH_COLORS.function}
          />
          <text
            x={scale.originX + 8}
            y={scale.originY - 1 * scale.scaleY}
            fill={MATH_COLORS.function}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            (0, 1)
          </text>
        </g>
      )}

      {/* 对数必过点 (1, 0) */}
      {isValidBase && funcType === "logarithmic" && (
        <g>
          <circle
            cx={scale.originX + 1 * scale.scaleX}
            cy={scale.originY}
            r={4.5}
            fill={MATH_COLORS.function}
          />
          <text
            x={scale.originX + 1 * scale.scaleX}
            y={scale.originY - 12}
            fill={MATH_COLORS.function}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            (1, 0)
          </text>
        </g>
      )}

      {/* 指数模式下的动态拖拽点 P(x0, a^x0) 与对称点 P' */}
      {isValidBase &&
        funcType === "exponential" &&
        (() => {
          const expLogRes = calculateExpLog(a, x0);
          if (!Number.isFinite(expLogRes.expVal)) return null;
          const invPt = mathToDesign(expLogRes.expVal, x0, scale);
          const pInvLabelObj = placedLabels.find((l) => l.key === "P_inv");

          return (
            <g>
              <InteractivePoint
                cx={x0}
                cy={expLogRes.expVal}
                scale={scale}
                vp={vp}
                onDrag={handleDragX0}
                color={MATH_COLORS.function}
                label={`P(${x0.toFixed(1)}, ${expLogRes.expVal.toFixed(1)})`}
                labelKey="P"
                placedLabels={placedLabels}
                fontScale={fontScale}
              />
              {showInverse && (
                <>
                  <circle
                    cx={invPt.x}
                    cy={invPt.y}
                    r={6}
                    fill={MATH_COLORS.functionTransformed}
                    stroke={CANVAS_COLORS.white}
                    strokeWidth={2}
                  />
                  <text
                    x={pInvLabelObj ? pInvLabelObj.x : invPt.x + 8}
                    y={pInvLabelObj ? pInvLabelObj.y : invPt.y - 8}
                    fill={MATH_COLORS.functionTransformed}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                  >
                    {`P'(${expLogRes.expVal.toFixed(1)}, ${x0.toFixed(1)})`}
                  </text>
                  <line
                    x1={scale.originX + x0 * scale.scaleX}
                    y1={scale.originY - expLogRes.expVal * scale.scaleY}
                    x2={invPt.x}
                    y2={invPt.y}
                    stroke={MATH_COLORS.labelText}
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                </>
              )}
            </g>
          );
        })()}

      {/* 对数模式下的动态拖拽点 P(x0, log_a x0) 与对称点 P' */}
      {isValidBase &&
        funcType === "logarithmic" &&
        x0 > 0 &&
        (() => {
          const logVal = Math.log(x0) / Math.log(a);
          if (!Number.isFinite(logVal)) return null;
          const invPt = mathToDesign(logVal, x0, scale);
          const pInvLabelObj = placedLabels.find((l) => l.key === "P_inv");

          return (
            <g>
              <InteractivePoint
                cx={x0}
                cy={logVal}
                scale={scale}
                vp={vp}
                onDrag={handleDragX0}
                color={MATH_COLORS.function}
                label={`P(${x0.toFixed(1)}, ${logVal.toFixed(1)})`}
                labelKey="P"
                placedLabels={placedLabels}
                fontScale={fontScale}
              />
              {showInverse && (
                <>
                  <circle
                    cx={invPt.x}
                    cy={invPt.y}
                    r={6}
                    fill={MATH_COLORS.functionTransformed}
                    stroke={CANVAS_COLORS.white}
                    strokeWidth={2}
                  />
                  <text
                    x={pInvLabelObj ? pInvLabelObj.x : invPt.x + 8}
                    y={pInvLabelObj ? pInvLabelObj.y : invPt.y - 8}
                    fill={MATH_COLORS.functionTransformed}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                  >
                    {`P'(${logVal.toFixed(1)}, ${x0.toFixed(1)})`}
                  </text>
                  <line
                    x1={scale.originX + x0 * scale.scaleX}
                    y1={scale.originY - logVal * scale.scaleY}
                    x2={invPt.x}
                    y2={invPt.y}
                    stroke={MATH_COLORS.labelText}
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                </>
              )}
            </g>
          );
        })()}
    </g>
  );
}
