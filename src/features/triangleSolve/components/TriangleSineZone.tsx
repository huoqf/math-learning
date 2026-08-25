import { MathPoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { TriangleSolveResult } from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";

interface TriangleSineZoneProps {
  scale: SceneScale;
  fontScale: (v: number) => number;
  sasResult: TriangleSolveResult;
}

/** 正弦定理与外接圆专属图层:叠加于共享主三角形之上 */
export function TriangleSineZone({
  scale,
  fontScale,
  sasResult,
}: TriangleSineZoneProps) {
  const { A, B, C } = sasResult.points;

  const pA = mathToDesign(A.x, A.y, scale);
  const pB = mathToDesign(B.x, B.y, scale);
  const pC = mathToDesign(C.x, C.y, scale);

  // 外接圆中心与半径 px
  const pCircumCenter = mathToDesign(
    sasResult.circumcircle.center.x,
    sasResult.circumcircle.center.y,
    scale,
  );
  const circumRadiusPx = sasResult.circumcircle.radius * scale.scaleX;

  return (
    <g className="sine-mode-scene">
      {circumRadiusPx < 800 && (
        <g>
          {/* 外接圆 */}
          <circle
            cx={pCircumCenter.x}
            cy={pCircumCenter.y}
            r={circumRadiusPx}
            fill={withAlpha(MATH_COLORS.circle, 0.04)}
            stroke={MATH_COLORS.circle}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
          {/* 外心 O */}
          <MathPoint
            x={pCircumCenter.x}
            y={pCircumCenter.y}
            color={MATH_COLORS.circle}
          />
          <text
            x={pCircumCenter.x + fontScale(8)}
            y={pCircumCenter.y - fontScale(6)}
            fill={MATH_COLORS.circle}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            O
          </text>
          {/* 外接圆半径 OA 虚线与标注 R */}
          <line
            x1={pCircumCenter.x}
            y1={pCircumCenter.y}
            x2={pA.x}
            y2={pA.y}
            stroke={MATH_COLORS.circle}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <text
            x={(pCircumCenter.x + pA.x) / 2 - fontScale(8)}
            y={(pCircumCenter.y + pA.y) / 2}
            fill={MATH_COLORS.circle}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            R
          </text>

          {/* 直径推导 Rt△C'BC 辅助线 */}
          <g className="sine-diameter-proof">
            {(() => {
              const pDiamCPrime = mathToDesign(
                sasResult.diameterPointA.x,
                sasResult.diameterPointA.y,
                scale,
              );
              const dirX = pDiamCPrime.x - pCircumCenter.x;
              const dirY = pDiamCPrime.y - pCircumCenter.y;
              const len = Math.hypot(dirX, dirY) || 1;
              const offX = (dirX / len) * fontScale(16);
              const offY = (dirY / len) * fontScale(16);

              return (
                <>
                  {/* 直径 C-C' (长为 2R) */}
                  <line
                    x1={pC.x}
                    y1={pC.y}
                    x2={pDiamCPrime.x}
                    y2={pDiamCPrime.y}
                    stroke={MATH_COLORS.tangentLine}
                    strokeWidth={2}
                    strokeDasharray="4,4"
                  />
                  {/* 直径标注 2R */}
                  <text
                    x={(pC.x + pDiamCPrime.x) / 2 + fontScale(10)}
                    y={(pC.y + pDiamCPrime.y) / 2}
                    fill={MATH_COLORS.tangentLine}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                    fontStyle="italic"
                    paintOrder="stroke"
                    stroke="white"
                    strokeWidth={fontScale(3.5)}
                    strokeLinejoin="round"
                  >
                    2R
                  </text>

                  {/* 直角三角形另一边 C'-B */}
                  <line
                    x1={pDiamCPrime.x}
                    y1={pDiamCPrime.y}
                    x2={pB.x}
                    y2={pB.y}
                    stroke={MATH_COLORS.tangentLine}
                    strokeWidth={1.5}
                    strokeDasharray="3,3"
                  />
                  {/* 对径点 C' */}
                  <circle
                    cx={pDiamCPrime.x}
                    cy={pDiamCPrime.y}
                    r={fontScale(4)}
                    fill={MATH_COLORS.tangentLine}
                  />
                  <text
                    x={pDiamCPrime.x + offX}
                    y={pDiamCPrime.y + offY}
                    textAnchor={offX >= 0 ? "start" : "end"}
                    fill={MATH_COLORS.tangentLine}
                    fontSize={fontScale(13)}
                    fontWeight="bold"
                    fontStyle="italic"
                    paintOrder="stroke"
                    stroke="white"
                    strokeWidth={fontScale(4)}
                    strokeLinejoin="round"
                  >
                    C'
                  </text>
                  <text
                    x={pDiamCPrime.x + offX}
                    y={pDiamCPrime.y + offY + fontScale(14)}
                    textAnchor={offX >= 0 ? "start" : "end"}
                    fill={MATH_COLORS.paramPrimary}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                    paintOrder="stroke"
                    stroke="white"
                    strokeWidth={fontScale(4)}
                    strokeLinejoin="round"
                  >
                    ∠C' = ∠A
                  </text>
                </>
              );
            })()}
          </g>
        </g>
      )}
    </g>
  );
}
