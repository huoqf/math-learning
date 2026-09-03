import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid } from "@/components/Math/CoordinateGrid";
import { Asymptote } from "@/components/Math/Asymptote";
import { InteractivePoint } from "@/components/Math/InteractivePoint";
import { VectorArrow } from "@/components/Math/VectorArrow";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import {
  generateTangentSegments,
  getTangentAsymptotes,
  getTangentSymmetryCenters,
  calculateUnitCircleTangent,
  checkIntervalAsymptoteFree,
} from "../math/trigTangent";

interface TrigTangentSceneProps {
  params: {
    theta: number;
    A: number;
    omega: number;
    phi: number;
    C: number;
    targetIntervalEnd?: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (size: number) => number;
  mode: "unitCircle" | "baseFunction" | "generalTransform" | "gaokaoProblem";
  showMonotoneInterval?: boolean;
}

const UNIT_CIRCLE_CENTER = { x: -3.8, y: 0 };
const UNIT_RADIUS = 1.0;

export const TrigTangentScene: React.FC<TrigTangentSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  mode,
  showMonotoneInterval = true,
}) => {
  const { theta, A, omega, phi, C, targetIntervalEnd = Math.PI / 3 } = params;

  const effectiveA =
    mode === "unitCircle" || mode === "baseFunction"
      ? 1.0
      : mode === "gaokaoProblem"
        ? 1.0
        : A;
  const effectiveOmega =
    mode === "unitCircle" || mode === "baseFunction" ? 1.0 : omega;
  const effectivePhi =
    mode === "unitCircle" || mode === "baseFunction" || mode === "gaokaoProblem"
      ? 0.0
      : phi;
  const effectiveC =
    mode === "unitCircle" || mode === "baseFunction" || mode === "gaokaoProblem"
      ? 0.0
      : C;

  // 模式1：单位圆与正切线几何计算（严格数学 1:1 对齐）
  const unitCircleCenter = UNIT_CIRCLE_CENTER;
  const r = UNIT_RADIUS;
  const tangentData = useMemo(() => {
    return calculateUnitCircleTangent(theta, UNIT_CIRCLE_CENTER, UNIT_RADIUS);
  }, [theta]);

  const centerDesign = mathToDesign(
    unitCircleCenter.x,
    unitCircleCenter.y,
    scale,
  );
  const rDesign = Math.abs(
    mathToDesign(unitCircleCenter.x + r, 0, scale).x - centerDesign.x,
  );
  const tangentLineTop = mathToDesign(
    unitCircleCenter.x + r,
    scale.yMax - 0.5,
    scale,
  );
  const tangentLineBottom = mathToDesign(
    unitCircleCenter.x + r,
    scale.yMin + 0.5,
    scale,
  );
  const aDesign = mathToDesign(
    unitCircleCenter.x + r,
    unitCircleCenter.y,
    scale,
  );
  const pDesign = mathToDesign(tangentData.pX, tangentData.pY, scale);
  const tDesign = mathToDesign(tangentData.tX, tangentData.tY, scale);
  const qDesign = mathToDesign(theta, Math.tan(theta), scale);

  // 1. 生成正切曲线分段路径 (在 unitCircle 模式下，左侧曲线严格截断，避免穿入单位圆区)
  const segments = useMemo(() => {
    const minX = mode === "unitCircle" ? -Math.PI / 2 : scale.xMin;
    const maxX = scale.xMax;
    return generateTangentSegments(
      minX,
      maxX,
      effectiveA,
      effectiveOmega,
      effectivePhi,
      effectiveC,
      scale.yMin,
      scale.yMax,
      120,
    );
  }, [mode, scale, effectiveA, effectiveOmega, effectivePhi, effectiveC]);

  // 2. 渐近线数组 (unitCircle 模式下只展示右侧关联渐近线)
  const asymptotes = useMemo(() => {
    const minX = mode === "unitCircle" ? -Math.PI / 2 - 0.1 : scale.xMin;
    return getTangentAsymptotes(minX, scale.xMax, effectiveOmega, effectivePhi);
  }, [mode, scale, effectiveOmega, effectivePhi]);

  // 3. 对称中心数组
  const symmetryCenters = useMemo(() => {
    return getTangentSymmetryCenters(
      scale.xMin,
      scale.xMax,
      effectiveOmega,
      effectivePhi,
      effectiveC,
    );
  }, [scale, effectiveOmega, effectivePhi, effectiveC]);

  // 高考模式：检测给定区间 [0, targetIntervalEnd] 是否包含渐近线
  const gaokaoCheck = useMemo(() => {
    if (mode !== "gaokaoProblem") return null;
    return checkIntervalAsymptoteFree(0, targetIntervalEnd, effectiveOmega, 0);
  }, [mode, targetIntervalEnd, effectiveOmega]);

  return (
    <g>
      {/* 坐标轴与网格 (非 unitCircle 模式使用全景网格；unitCircle 模式下主网格保留在 x >= -2 区间) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 单调递增区间背景高亮 (针对各无渐近线开区间) */}
      {showMonotoneInterval &&
        mode !== "unitCircle" &&
        mode !== "gaokaoProblem" && (
          <g>
            {asymptotes.map((a, idx) => {
              if (idx >= asymptotes.length - 1) return null;
              const nextA = asymptotes[idx + 1];
              const leftPt = mathToDesign(a.x, 0, scale);
              const rightPt = mathToDesign(nextA.x, 0, scale);
              const topPt = mathToDesign(0, scale.yMax, scale);
              const bottomPt = mathToDesign(0, scale.yMin, scale);
              const isMainBranch = a.x < 0 && nextA.x > 0;

              return (
                <g key={`interval-${a.k}`}>
                  <rect
                    x={leftPt.x}
                    y={topPt.y}
                    width={Math.max(0, rightPt.x - leftPt.x)}
                    height={Math.abs(bottomPt.y - topPt.y)}
                    fill={
                      isMainBranch
                        ? withAlpha(MATH_COLORS.paramPrimary, 0.08)
                        : withAlpha(MATH_COLORS.function, 0.03)
                    }
                    pointerEvents="none"
                  />
                  {isMainBranch && (
                    <g>
                      {/* 沉降到底部的单调开区间胶囊标签，绝不与顶部的渐近线和周期标尺撞车 */}
                      <rect
                        x={(leftPt.x + rightPt.x) / 2 - fontScale(60)}
                        y={bottomPt.y - fontScale(26)}
                        width={fontScale(120)}
                        height={fontScale(18)}
                        rx={fontScale(9)}
                        fill={CANVAS_COLORS.white}
                        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.3)}
                        strokeWidth={1}
                      />
                      <text
                        x={(leftPt.x + rightPt.x) / 2}
                        y={bottomPt.y - fontScale(14)}
                        textAnchor="middle"
                        fill={MATH_COLORS.paramPrimary}
                        fontSize={fontScale(9.5)}
                        fontWeight="600"
                      >
                        主单调开区间 (-T/2, T/2)
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

      {/* 高考模式特有：目标区间 [0, xEnd] 与渐近线冲突检测遮罩 */}
      {mode === "gaokaoProblem" && gaokaoCheck && (
        <g>
          {(() => {
            const startPt = mathToDesign(0, 0, scale);
            const endPt = mathToDesign(targetIntervalEnd, 0, scale);
            const topPt = mathToDesign(0, scale.yMax, scale);
            const bottomPt = mathToDesign(0, scale.yMin, scale);
            const isSafe = !gaokaoCheck.hasAsymptote;
            const zoneColor = isSafe
              ? MATH_COLORS.paramTertiary
              : MATH_COLORS.paramPrimary;
            const midX = (startPt.x + endPt.x) / 2;

            return (
              <g>
                <rect
                  x={startPt.x}
                  y={topPt.y}
                  width={Math.max(0, endPt.x - startPt.x)}
                  height={Math.abs(bottomPt.y - topPt.y)}
                  fill={withAlpha(zoneColor, 0.15)}
                  stroke={zoneColor}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                {/* 带背景的高考区间状态卡片 */}
                <rect
                  x={midX - fontScale(80)}
                  y={topPt.y + fontScale(16)}
                  width={fontScale(160)}
                  height={fontScale(22)}
                  rx={fontScale(6)}
                  fill={CANVAS_COLORS.white}
                  stroke={zoneColor}
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={topPt.y + fontScale(30)}
                  textAnchor="middle"
                  fill={zoneColor}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  {isSafe
                    ? "✓ 目标区间 [0, xMax] 单调连续"
                    : "✕ 发生碰撞！区间包含渐近线"}
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* 渐近线渲染及周期标尺 */}
      {asymptotes.map((asymp) => {
        let labelText = `x = ${(asymp.x / Math.PI).toFixed(2)}π`;
        if (Math.abs(asymp.x - Math.PI / 2) < 1e-3) labelText = "x = π/2";
        else if (Math.abs(asymp.x + Math.PI / 2) < 1e-3) labelText = "x = -π/2";
        else if (Math.abs(asymp.x - (3 * Math.PI) / 2) < 1e-3)
          labelText = "x = 3π/2";
        else if (Math.abs(asymp.x + (3 * Math.PI) / 2) < 1e-3)
          labelText = "x = -3π/2";

        return (
          <Asymptote
            key={`asymp-${asymp.k}`}
            type="vertical"
            value={asymp.x}
            scale={scale}
            color={MATH_COLORS.asymptote}
            label={labelText}
            fontScale={fontScale}
          />
        );
      })}

      {/* 相邻渐近线之间绘制周期标尺 T = π / |ω| */}
      {mode !== "unitCircle" && asymptotes.length >= 2 && (
        <g>
          {(() => {
            const a1 = asymptotes.find((a) => a.x < 0 && a.x > -4);
            const a2 = asymptotes.find((a) => a.x > 0 && a.x < 4);
            if (!a1 || !a2) return null;

            const yLevel = scale.yMax - 0.7;
            const periodVal = (Math.PI / Math.abs(effectiveOmega)).toFixed(2);

            return (
              <g>
                <VectorArrow
                  from={[a1.x + 0.1, yLevel]}
                  to={[a2.x - 0.1, yLevel]}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  label={`Δx = T = ${periodVal}`}
                  labelOffset={[0, -10]}
                  fontScale={fontScale}
                />
                <VectorArrow
                  from={[a2.x - 0.1, yLevel]}
                  to={[a1.x + 0.1, yLevel]}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  fontScale={fontScale}
                />
              </g>
            );
          })()}
        </g>
      )}

      {/* 正切函数曲线 (仅在有效区间绘制) */}
      {segments.map((seg, sIdx) => {
        if (seg.length < 2) return null;
        let d = "";
        seg.forEach((pt, pIdx) => {
          const des = mathToDesign(pt.x, pt.y, scale);
          if (pIdx === 0) d += `M ${des.x.toFixed(1)} ${des.y.toFixed(1)}`;
          else d += ` L ${des.x.toFixed(1)} ${des.y.toFixed(1)}`;
        });

        return (
          <path
            key={`seg-${sIdx}`}
            d={d}
            fill="none"
            stroke={MATH_COLORS.function}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* 对称中心渲染（带防穿透底色与智能坐标轴避让） */}
      {mode !== "unitCircle" &&
        symmetryCenters.map((center, cIdx) => {
          if (center.type !== "zero") return null;
          const pt = mathToDesign(center.x, center.y, scale);
          const isNearXAxis = Math.abs(center.y) < 0.3;
          const labelY = isNearXAxis
            ? pt.y - fontScale(12)
            : pt.y + fontScale(16);

          return (
            <g key={`sym-${cIdx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={CANVAS_COLORS.white}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={2}
              />
              <rect
                x={pt.x - fontScale(26)}
                y={labelY - fontScale(9)}
                width={fontScale(52)}
                height={fontScale(13)}
                rx={fontScale(3)}
                fill={CANVAS_COLORS.white}
                opacity={0.88}
              />
              <text
                x={pt.x}
                y={labelY}
                textAnchor="middle"
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(8.5)}
                fontWeight="500"
              >
                ({(center.x / Math.PI).toFixed(1)}π, {center.y.toFixed(1)})
              </text>
            </g>
          );
        })}

      {/* 模式 1：单位圆与正切线独立几何区（左区独立背景与坐标轴，与右区图象 1:1 对齐） */}
      {mode === "unitCircle" && (
        <g>
          {/* 左区背景安全底色，隔离主坐标系 */}
          {(() => {
            const leftZoneTopLeft = mathToDesign(-5.8, scale.yMax, scale);
            const leftZoneBottomRight = mathToDesign(-1.8, scale.yMin, scale);
            return (
              <rect
                x={leftZoneTopLeft.x}
                y={leftZoneTopLeft.y}
                width={leftZoneBottomRight.x - leftZoneTopLeft.x}
                height={leftZoneBottomRight.y - leftZoneTopLeft.y}
                fill={CANVAS_COLORS.white}
                opacity={0.94}
              />
            );
          })()}

          {/* 单位圆区域标题 */}
          <text
            x={centerDesign.x}
            y={mathToDesign(0, scale.yMax - 0.4, scale).y}
            textAnchor="middle"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            单位圆与正切线区
          </text>

          {/* 单位圆独立水平横轴 u (u 从 -1.6 到 1.6) */}
          {(() => {
            const uStart = mathToDesign(unitCircleCenter.x - 1.6, 0, scale);
            const uEnd = mathToDesign(unitCircleCenter.x + 1.8, 0, scale);
            return (
              <g>
                <line
                  x1={uStart.x}
                  y1={uStart.y}
                  x2={uEnd.x}
                  y2={uEnd.y}
                  stroke={MATH_COLORS.axis}
                  strokeWidth={1.5}
                />
                <text
                  x={uEnd.x + fontScale(4)}
                  y={uEnd.y + fontScale(4)}
                  fill={MATH_COLORS.axis}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  u
                </text>
              </g>
            );
          })()}

          {/* 单位圆独立垂直纵轴 v (v 从 -3.2 到 3.2) */}
          {(() => {
            const vTop = mathToDesign(unitCircleCenter.x, 3.2, scale);
            const vBottom = mathToDesign(unitCircleCenter.x, -3.2, scale);
            return (
              <g>
                <line
                  x1={centerDesign.x}
                  y1={vBottom.y}
                  x2={centerDesign.x}
                  y2={vTop.y}
                  stroke={MATH_COLORS.axis}
                  strokeWidth={1.5}
                />
                <text
                  x={centerDesign.x - fontScale(10)}
                  y={vTop.y - fontScale(4)}
                  fill={MATH_COLORS.axis}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  v
                </text>
              </g>
            );
          })()}

          {/* 单位圆 (半径 r = 1.0) */}
          <circle
            cx={centerDesign.x}
            cy={centerDesign.y}
            r={rDesign}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.05)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
          />

          {/* 动角 θ 弧线 */}
          {(() => {
            const arcR = rDesign * 0.35;
            const endAngle = -theta;
            const isLargeArc = Math.abs(theta) > Math.PI;
            const sweep = theta >= 0 ? 0 : 1;
            const arcEndX = centerDesign.x + arcR * Math.cos(endAngle);
            const arcEndY = centerDesign.y + arcR * Math.sin(endAngle);
            const arcStartX = centerDesign.x + arcR;
            const arcStartY = centerDesign.y;

            return (
              <g>
                <path
                  d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 ${isLargeArc ? 1 : 0} ${sweep} ${arcEndX} ${arcEndY}`}
                  fill="none"
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.5}
                />
                <text
                  x={centerDesign.x + arcR * 1.4 * Math.cos(-theta / 2)}
                  y={centerDesign.y + arcR * 1.4 * Math.sin(-theta / 2)}
                  fill={MATH_COLORS.paramPrimary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  θ
                </text>
              </g>
            );
          })()}

          {/* 圆心 O */}
          <circle
            cx={centerDesign.x}
            cy={centerDesign.y}
            r={3}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={centerDesign.x - fontScale(12)}
            y={centerDesign.y + fontScale(15)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(10)}
          >
            O
          </text>

          {/* 切线 u = 1 (即 x = unitCircleCenter.x + 1) */}
          <line
            x1={tangentLineTop.x}
            y1={tangentLineTop.y}
            x2={tangentLineBottom.x}
            y2={tangentLineBottom.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <text
            x={tangentLineTop.x - fontScale(2)}
            y={tangentLineTop.y - fontScale(6)}
            textAnchor="middle"
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            切线 u = 1
          </text>

          {/* 终边射线 (从圆心过 P) */}
          <line
            x1={centerDesign.x}
            y1={centerDesign.y}
            x2={pDesign.x}
            y2={pDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
          />

          {/* 当终边在第二/三象限时，绘制反向延长虚线至切线 T */}
          {tangentData.isBackward && tangentData.isValid && (
            <line
              x1={centerDesign.x}
              y1={centerDesign.y}
              x2={tDesign.x}
              y2={tDesign.y}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

          {/* 正切线 AT (始点 A(1,0)，终点 T(1, tan θ)) */}
          {tangentData.isValid && Number.isFinite(tangentData.tanValue) && (
            <g>
              <line
                x1={aDesign.x}
                y1={aDesign.y}
                x2={tDesign.x}
                y2={tDesign.y}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              {Math.abs(tangentData.tanValue) > 0.15 && (
                <g>
                  <rect
                    x={tDesign.x + fontScale(6)}
                    y={(aDesign.y + tDesign.y) / 2 - fontScale(9)}
                    width={fontScale(110)}
                    height={fontScale(16)}
                    rx={fontScale(4)}
                    fill={CANVAS_COLORS.white}
                    opacity={0.9}
                  />
                  <text
                    x={tDesign.x + fontScale(10)}
                    y={(aDesign.y + tDesign.y) / 2 + fontScale(3)}
                    fill={MATH_COLORS.paramSecondary}
                    fontSize={fontScale(10.5)}
                    fontWeight="bold"
                  >
                    AT = tan θ ({tangentData.tanValue.toFixed(2)})
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 切点 A(1, 0) */}
          <circle
            cx={aDesign.x}
            cy={aDesign.y}
            r={3.5}
            fill={MATH_COLORS.paramSecondary}
          />
          <text
            x={aDesign.x + fontScale(6)}
            y={aDesign.y + fontScale(14)}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            A(1, 0)
          </text>

          {/* 从切点 T 向右【严格水平】投影到正切曲线动点 Q */}
          {tangentData.isValid &&
            Number.isFinite(tangentData.tanValue) &&
            Math.abs(theta) < scale.xMax && (
              <line
                x1={tDesign.x}
                y1={tDesign.y}
                x2={qDesign.x}
                y2={qDesign.y}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
            )}

          {/* 从 x 轴 x = theta 【严格竖直】投影到 Q */}
          {(() => {
            const thetaAxisPt = mathToDesign(theta, 0, scale);
            return (
              <line
                x1={thetaAxisPt.x}
                y1={thetaAxisPt.y}
                x2={qDesign.x}
                y2={qDesign.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
            );
          })()}

          {/* 曲线上的对应动点 Q(θ, tan θ) */}
          {Math.abs(Math.cos(theta)) > 0.05 && (
            <g>
              <circle
                cx={qDesign.x}
                cy={qDesign.y}
                r={5.5}
                fill={MATH_COLORS.function}
              />
              <rect
                x={qDesign.x + fontScale(6)}
                y={qDesign.y - fontScale(18)}
                width={fontScale(75)}
                height={fontScale(15)}
                rx={fontScale(3)}
                fill={CANVAS_COLORS.white}
                opacity={0.9}
                stroke={withAlpha(MATH_COLORS.function, 0.3)}
                strokeWidth={0.8}
              />
              <text
                x={qDesign.x + fontScale(10)}
                y={qDesign.y - fontScale(6)}
                fill={MATH_COLORS.function}
                fontSize={fontScale(9.5)}
                fontWeight="bold"
              >
                Q(θ, tan θ)
              </text>
            </g>
          )}

          {/* 交互圆周控制点 P(θ) */}
          <InteractivePoint
            cx={tangentData.pX}
            cy={tangentData.pY}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramPrimary}
            label="P(θ)"
            fontScale={fontScale}
            onDrag={(newMath) => {
              const dx = newMath.x - unitCircleCenter.x;
              const dy = newMath.y - unitCircleCenter.y;
              let newAngle = Math.atan2(dy, dx);
              // 防止落在渐近线 ±π/2
              if (Math.abs(newAngle - Math.PI / 2) < 0.05)
                newAngle = Math.PI / 2 - 0.06;
              if (Math.abs(newAngle + Math.PI / 2) < 0.05)
                newAngle = -Math.PI / 2 + 0.06;
              onParamChange("theta", newAngle);
            }}
          />
        </g>
      )}

      {/* 模式 2 基础正切曲线动点探究 */}
      {mode === "baseFunction" && (
        <InteractivePoint
          cx={Math.max(
            -Math.PI / 2 + 0.08,
            Math.min(Math.PI / 2 - 0.08, theta),
          )}
          cy={Math.tan(
            Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, theta)),
          )}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramPrimary}
          label="P(x₀, tan x₀)"
          fontScale={fontScale}
          onDrag={(newPt) => {
            const clampedX = Math.max(
              -Math.PI / 2 + 0.08,
              Math.min(Math.PI / 2 - 0.08, newPt.x),
            );
            onParamChange("theta", clampedX);
          }}
        />
      )}

      {/* 模式 3 特征点拖拽 */}
      {mode === "generalTransform" && (
        <InteractivePoint
          cx={(Math.PI / 4 - effectivePhi) / (effectiveOmega || 1)}
          cy={effectiveA * Math.tan(Math.PI / 4) + effectiveC}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramPrimary}
          label="特征点 A"
          fontScale={fontScale}
          onDrag={(newPt) => {
            const newA = (newPt.y - effectiveC) / Math.tan(Math.PI / 4);
            if (Number.isFinite(newA)) {
              onParamChange("A", Math.round(newA * 10) / 10);
            }
          }}
        />
      )}

      {/* 高考模式：区间右端点拖拽点 */}
      {mode === "gaokaoProblem" && (
        <InteractivePoint
          cx={targetIntervalEnd}
          cy={0}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramPrimary}
          label="x_end"
          fontScale={fontScale}
          onDrag={(newPt) => {
            const clamped = Math.max(0.2, Math.min(2.5, newPt.x));
            onParamChange("targetIntervalEnd", Math.round(clamped * 100) / 100);
          }}
        />
      )}
    </g>
  );
};
