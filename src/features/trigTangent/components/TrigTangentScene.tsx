import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid } from "@/components/Math/CoordinateGrid";
import { Asymptote } from "@/components/Math/Asymptote";
import { InteractivePoint } from "@/components/Math/InteractivePoint";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  generateTangentSegments,
  getTangentAsymptotes,
  getTangentSymmetryCenters,
} from "../math/trigTangent";

interface TrigTangentSceneProps {
  params: {
    theta: number;
    A: number;
    omega: number;
    phi: number;
    C: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (size: number) => number;
  mode: "unitCircle" | "baseFunction" | "generalTransform";
  showMonotoneInterval?: boolean;
}

export const TrigTangentScene: React.FC<TrigTangentSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  mode,
  showMonotoneInterval = true,
}) => {
  const { theta, A, omega, phi, C } = params;

  // 1. 生成正切曲线分段路径
  const segments = useMemo(() => {
    if (mode === "unitCircle") {
      // 模式1仅生成基础正切 y = tan x
      return generateTangentSegments(
        scale.xMin,
        scale.xMax,
        1.0,
        1.0,
        0.0,
        0.0,
        scale.yMin,
        scale.yMax,
        80
      );
    } else if (mode === "baseFunction") {
      return generateTangentSegments(
        scale.xMin,
        scale.xMax,
        1.0,
        1.0,
        0.0,
        0.0,
        scale.yMin,
        scale.yMax,
        120
      );
    } else {
      // generalTransform
      return generateTangentSegments(
        scale.xMin,
        scale.xMax,
        A,
        omega,
        phi,
        C,
        scale.yMin,
        scale.yMax,
        140
      );
    }
  }, [mode, scale, A, omega, phi, C]);

  // 2. 渐近线数组
  const asymptotes = useMemo(() => {
    if (mode === "unitCircle" || mode === "baseFunction") {
      return getTangentAsymptotes(scale.xMin, scale.xMax, 1.0, 0.0);
    }
    return getTangentAsymptotes(scale.xMin, scale.xMax, omega, phi);
  }, [mode, scale, omega, phi]);

  // 3. 对称中心数组
  const symmetryCenters = useMemo(() => {
    if (mode === "unitCircle" || mode === "baseFunction") {
      return getTangentSymmetryCenters(scale.xMin, scale.xMax, 1.0, 0.0, 0.0);
    }
    return getTangentSymmetryCenters(scale.xMin, scale.xMax, omega, phi, C);
  }, [mode, scale, omega, phi, C]);

  // 模式1：单位圆与正切线几何元素
  const unitCircleCenter = { x: -3.5, y: 0 };
  const r = 1.2; // 单位圆在视图上的映射半径

  // 动角 theta 对应的点与正切线
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const tanT = Math.tan(theta);

  // 单位圆圆周上的点 P
  const pointP_math = {
    x: unitCircleCenter.x + r * cosT,
    y: unitCircleCenter.y + r * sinT,
  };

  // 切线 x = unitCircleCenter.x + r 上正切点 T
  const pointT_math = {
    x: unitCircleCenter.x + r,
    y: unitCircleCenter.y + r * tanT,
  };

  // 对应正切曲线上的点 Q
  const pointQ_math = {
    x: theta,
    y: tanT,
  };

  const centerDesign = mathToDesign(unitCircleCenter.x, unitCircleCenter.y, scale);
  const rDesign = Math.abs(mathToDesign(unitCircleCenter.x + r, 0, scale).x - centerDesign.x);
  const tDesign = mathToDesign(pointT_math.x, pointT_math.y, scale);
  const qDesign = mathToDesign(pointQ_math.x, pointQ_math.y, scale);
  const tangentLineTop = mathToDesign(unitCircleCenter.x + r, scale.yMax, scale);
  const tangentLineBottom = mathToDesign(unitCircleCenter.x + r, scale.yMin, scale);

  return (
    <g>
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 单调递增区间背景高亮 (针对 [-π/2, π/2] 等开区间) */}
      {showMonotoneInterval && mode !== "unitCircle" && (
        <g>
          {asymptotes.map((a, idx) => {
            if (idx >= asymptotes.length - 1) return null;
            const nextA = asymptotes[idx + 1];
            const leftPt = mathToDesign(a.x, 0, scale);
            const rightPt = mathToDesign(nextA.x, 0, scale);
            const topPt = mathToDesign(0, scale.yMax, scale);
            const bottomPt = mathToDesign(0, scale.yMin, scale);

            return (
              <g key={`interval-${a.k}`}>
                <rect
                  x={leftPt.x}
                  y={topPt.y}
                  width={Math.max(0, rightPt.x - leftPt.x)}
                  height={Math.abs(bottomPt.y - topPt.y)}
                  fill={idx % 2 === 0 ? withAlpha(MATH_COLORS.paramPrimary, 0.06) : "none"}
                  pointerEvents="none"
                />
                {idx % 2 === 0 && (
                  <text
                    x={(leftPt.x + rightPt.x) / 2}
                    y={topPt.y + fontScale(24)}
                    textAnchor="middle"
                    fill={MATH_COLORS.paramPrimary}
                    fontSize={fontScale(10)}
                    fontWeight="500"
                    opacity={0.8}
                  >
                    单调递增区间
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* 渐近线渲染 */}
      {asymptotes.map((asymp) => {
        let labelText = `x = ${(asymp.x / Math.PI).toFixed(2)}π`;
        if (Math.abs(asymp.x - Math.PI / 2) < 1e-3) labelText = "x = π/2";
        else if (Math.abs(asymp.x + Math.PI / 2) < 1e-3) labelText = "x = -π/2";
        else if (Math.abs(asymp.x - (3 * Math.PI) / 2) < 1e-3) labelText = "x = 3π/2";
        else if (Math.abs(asymp.x + (3 * Math.PI) / 2) < 1e-3) labelText = "x = -3π/2";

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

      {/* 正切函数曲线 */}
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

      {/* 对称中心渲染 */}
      {mode !== "unitCircle" &&
        symmetryCenters.map((center, cIdx) => {
          if (center.type !== "zero") return null; // 仅标注曲线与 y=C 的交点对称中心
          const pt = mathToDesign(center.x, center.y, scale);

          return (
            <g key={`sym-${cIdx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill="#FFFFFF"
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={2}
              />
              <text
                x={pt.x}
                y={pt.y + fontScale(16)}
                textAnchor="middle"
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(9)}
                fontFamily="sans-serif"
              >
                ({(center.x / Math.PI).toFixed(1)}π, {center.y})
              </text>
            </g>
          );
        })}

      {/* 模式 1 特有：单位圆与正切线交互动画 */}
      {mode === "unitCircle" && (
        <g>
          {/* 单位圆 */}
          <circle
            cx={centerDesign.x}
            cy={centerDesign.y}
            r={rDesign}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.03)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          {/* 圆心 */}
          <circle cx={centerDesign.x} cy={centerDesign.y} r={3} fill={MATH_COLORS.paramPrimary} />
          <text
            x={centerDesign.x - 10}
            y={centerDesign.y + 15}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(10)}
          >
            O'(-3.5, 0)
          </text>

          {/* 切线 x = unitCircleCenter.x + r */}
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
            x={tangentLineTop.x + 5}
            y={tangentLineTop.y + 20}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(10)}
          >
            切线 x = 1
          </text>

          {/* 终边射线 */}
          <line
            x1={centerDesign.x}
            y1={centerDesign.y}
            x2={tDesign.x}
            y2={tDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
          />

          {/* 正切线 AT (从 A(-2.5+r, 0) 到 T) */}
          {(() => {
            const aDesign = mathToDesign(unitCircleCenter.x + r, unitCircleCenter.y, scale);
            return (
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
                <text
                  x={tDesign.x + 8}
                  y={(aDesign.y + tDesign.y) / 2}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(11)}
                  fontWeight="600"
                >
                  AT = tan θ ({tanT.toFixed(2)})
                </text>
              </g>
            );
          })()}

          {/* 从正切点 T 向右拉出水平虚线连接到正切曲线点 Q */}
          <line
            x1={tDesign.x}
            y1={tDesign.y}
            x2={qDesign.x}
            y2={qDesign.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />

          {/* 从 x 轴 x = theta 向上拉出垂直虚线连接到 Q */}
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
                strokeDasharray="3 3"
              />
            );
          })()}

          {/* 动点 Q(θ, tan θ) */}
          <circle cx={qDesign.x} cy={qDesign.y} r={5} fill={MATH_COLORS.function} />
          <text
            x={qDesign.x + 8}
            y={qDesign.y - 8}
            fill={MATH_COLORS.function}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            Q(θ, tan θ)
          </text>

          {/* 交互拖拽点 P */}
          <InteractivePoint
            cx={pointP_math.x}
            cy={pointP_math.y}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramPrimary}
            label="P(θ)"
            fontScale={fontScale}
            onDrag={(newMath) => {
              const dx = newMath.x - unitCircleCenter.x;
              const dy = newMath.y - unitCircleCenter.y;
              let newAngle = Math.atan2(dy, dx);
              // 限制在 (-π/2 + 0.08, π/2 - 0.08)
              const maxAngle = Math.PI / 2 - 0.08;
              newAngle = Math.max(-maxAngle, Math.min(maxAngle, newAngle));
              onParamChange("theta", newAngle);
            }}
          />
        </g>
      )}

      {/* 模式 2 & 3 可拖拽特征点 */}
      {mode !== "unitCircle" && (
        <InteractivePoint
          cx={mode === "baseFunction" ? Math.PI / 4 : (Math.PI / 4 - phi) / (omega || 1)}
          cy={mode === "baseFunction" ? 1 : A * Math.tan(Math.PI / 4) + C}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramPrimary}
          label="特征点 (π/4)"
          fontScale={fontScale}
          onDrag={(newPt) => {
            if (mode === "baseFunction") return;
            // 反向解算振幅 A
            const newA = (newPt.y - C) / Math.tan(Math.PI / 4);
            if (Number.isFinite(newA)) {
              onParamChange("A", Math.round(newA * 10) / 10);
            }
          }}
        />
      )}
    </g>
  );
};
