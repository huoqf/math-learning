import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS } from "@/theme";
import { calculateExpLog } from "@/math/function";

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
        }
      }
    }
    return avoidLabels(entries, { fontScale });
  }, [funcType, x0, a, scale, fontScale]);

  // 幂函数模式 y = x^α
  if (funcType === "power") {
    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />
        <FunctionGraph
          fn={(x) => {
            if (powerAlpha === 0.5 && x < 0) return NaN;
            if (powerAlpha === -1 && Math.abs(x) < 1e-3) return NaN;
            return Math.pow(x, powerAlpha);
          }}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
        <circle
          cx={scale.originX + 1 * scale.scaleX}
          cy={scale.originY - 1 * scale.scaleY}
          r={5}
          fill={MATH_COLORS.paramPrimary}
        />
        <text
          x={scale.originX + 1.2 * scale.scaleX}
          y={scale.originY - 1.2 * scale.scaleY}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(12)}
          fontWeight="bold"
        >
          (1, 1)
        </text>
      </g>
    );
  }

  // 指数函数 / 对数函数模式
  const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 反函数对称轴 y = x（仅 showInverse 时显示） */}
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

      {/* 反函数对称：同时显示指数和对数 */}
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

      {/* 定点标注 */}
      {isValidBase && funcType === "exponential" && (
        <g>
          <circle
            cx={scale.originX + 0 * scale.scaleX}
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
      {isValidBase && funcType === "logarithmic" && (
        <g>
          <circle
            cx={scale.originX + 1 * scale.scaleX}
            cy={scale.originY - 0 * scale.scaleY}
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

      {/* 拖拽采样点 P */}
      {isValidBase &&
        funcType === "exponential" &&
        (() => {
          const expLogRes = calculateExpLog(a, x0);
          if (!Number.isFinite(expLogRes.expVal)) return null;
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
                    cx={scale.originX + expLogRes.expVal * scale.scaleX}
                    cy={scale.originY - x0 * scale.scaleY}
                    r={6}
                    fill={MATH_COLORS.functionTransformed}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <text
                    x={scale.originX + expLogRes.expVal * scale.scaleX + 8}
                    y={scale.originY - x0 * scale.scaleY - 8}
                    fill={MATH_COLORS.functionTransformed}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                  >
                    {`P'(${expLogRes.expVal.toFixed(1)}, ${x0.toFixed(1)})`}
                  </text>
                  <line
                    x1={scale.originX + x0 * scale.scaleX}
                    y1={scale.originY - expLogRes.expVal * scale.scaleY}
                    x2={scale.originX + expLogRes.expVal * scale.scaleX}
                    y2={scale.originY - x0 * scale.scaleY}
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

      {/* 拖拽采样点 P（对数模式） */}
      {isValidBase &&
        funcType === "logarithmic" &&
        x0 > 0 &&
        (() => {
          const logVal = Math.log(x0) / Math.log(a);
          if (!Number.isFinite(logVal)) return null;
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
                    cx={scale.originX + logVal * scale.scaleX}
                    cy={scale.originY - x0 * scale.scaleY}
                    r={6}
                    fill={MATH_COLORS.functionTransformed}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <text
                    x={scale.originX + logVal * scale.scaleX + 8}
                    y={scale.originY - x0 * scale.scaleY - 8}
                    fill={MATH_COLORS.functionTransformed}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                  >
                    {`P'(${logVal.toFixed(1)}, ${x0.toFixed(1)})`}
                  </text>
                  <line
                    x1={scale.originX + x0 * scale.scaleX}
                    y1={scale.originY - logVal * scale.scaleY}
                    x2={scale.originX + logVal * scale.scaleX}
                    y2={scale.originY - x0 * scale.scaleY}
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
