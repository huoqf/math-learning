import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateConditionalProb } from "@/math/probabilityBayes";

interface ConditionalSceneProps {
  params: Record<string, number>;
  isZoomedToA: boolean;
  fontScale: (v: number) => number;
}

export function ConditionalScene({
  params,
  isZoomedToA,
  fontScale,
}: ConditionalSceneProps) {
  const conditionalData = useMemo(() => {
    const pA = params.pA ?? 0.5;
    const pB = params.pB ?? 0.4;
    const pAB = Math.min(params.pAB ?? 0.2, Math.min(pA, pB));
    return calculateConditionalProb(pA, pB, pAB);
  }, [params.pA, params.pB, params.pAB]);

  const rectOmega = { x: 70, y: 80, width: 700, height: 460 };
  const totalArea = rectOmega.width * rectOmega.height;

  const rawRA = Math.sqrt((totalArea * conditionalData.pA) / Math.PI);
  const rawRB = Math.sqrt((totalArea * conditionalData.pB) / Math.PI);

  const centerAX = isZoomedToA ? 420 : 360;
  const centerAY = 310;

  const maxOverlapDist = Math.abs(rawRA - rawRB);
  const minOverlapDist = rawRA + rawRB;
  const tOverlap =
    1 -
    (conditionalData.pA > 0 && conditionalData.pB > 0
      ? conditionalData.pAB / Math.min(conditionalData.pA, conditionalData.pB)
      : 0);
  const distAB =
    maxOverlapDist +
    (minOverlapDist - maxOverlapDist) * Math.max(0, Math.min(1, tOverlap));

  const rawCenterBX = centerAX + distAB;
  const centerBY = centerAY;

  const omegaRight = rectOmega.x + rectOmega.width;
  const omegaBottom = rectOmega.y + rectOmega.height;

  const maxRA = Math.min(
    centerAX - rectOmega.x,
    omegaRight - centerAX,
    centerAY - rectOmega.y,
    omegaBottom - centerAY,
  );
  const rA = Math.min(rawRA, maxRA);

  const maxCenterBX = omegaRight - rawRB - 4;
  const minCenterBX = centerAX + Math.abs(rawRA - rawRB) + 4;
  const centerBX = Math.max(minCenterBX, Math.min(maxCenterBX, rawCenterBX));

  const maxRB = Math.min(
    centerBX - rectOmega.x,
    omegaRight - centerBX,
    centerBY - rectOmega.y,
    omegaBottom - centerBY,
  );
  const rB = Math.min(rawRB, maxRB);

  return (
    <g>
      <rect
        x={rectOmega.x}
        y={rectOmega.y}
        width={rectOmega.width}
        height={rectOmega.height}
        rx={16}
        fill={isZoomedToA ? MATH_COLORS.gridSubtle : MATH_COLORS.white}
        stroke={isZoomedToA ? MATH_COLORS.axis : MATH_COLORS.textMuted}
        strokeWidth={2}
        strokeDasharray={isZoomedToA ? "6 6" : undefined}
        className="transition-all duration-500"
      />

      <text
        x={rectOmega.x + 20}
        y={rectOmega.y + 36}
        fontSize={fontScale(18)}
        fontWeight="bold"
        fill={isZoomedToA ? MATH_COLORS.textMuted : MATH_COLORS.labelTextLight}
      >
        全样本空间 Ω {isZoomedToA ? "(已被虚化)" : "(Area = 1.0)"}
      </text>

      {isZoomedToA && (
        <g>
          <rect
            x={centerAX - rA - 30}
            y={centerAY - rA - 30}
            width={(rA + 30) * 2}
            height={(rA + 30) * 2}
            rx={20}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            strokeDasharray="8 4"
          />
          <text
            x={centerAX - rA - 20}
            y={centerAY - rA - 42}
            fontSize={fontScale(16)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
          >
            ★ 样本空间已压缩为已知事件 A (新全集)
          </text>
        </g>
      )}

      <defs>
        <clipPath id="clip-circle-a">
          <circle cx={centerAX} cy={centerAY} r={rA} />
        </clipPath>
      </defs>

      <circle
        cx={centerAX}
        cy={centerAY}
        r={rA}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={3}
        className="transition-all duration-300"
      />

      <circle
        cx={centerBX}
        cy={centerBY}
        r={rB}
        fill={withAlpha(MATH_COLORS.paramSecondary, isZoomedToA ? 0.1 : 0.2)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2.5}
        strokeDasharray={isZoomedToA ? "4 4" : undefined}
        className="transition-all duration-300"
      />

      <g clipPath="url(#clip-circle-a)">
        <circle
          cx={centerBX}
          cy={centerBY}
          r={rB}
          fill={withAlpha(MATH_COLORS.functionTransformed, 0.65)}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={3}
        />
      </g>

      <text
        x={centerAX - (distAB > 20 ? rA * 0.4 : 0)}
        y={centerAY - rA - 12}
        fontSize={fontScale(16)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        事件 A [P(A) = {conditionalData.pA.toFixed(2)}]
      </text>

      <text
        x={centerBX + (distAB > 20 ? rB * 0.4 : 0)}
        y={centerBY + rB + 24}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        事件 B [P(B) = {conditionalData.pB.toFixed(2)}]
      </text>

      <text
        x={centerAX + distAB / 2}
        y={centerAY + 6}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
        className="drop-shadow-md"
      >
        A ∩ B
      </text>

      <g transform="translate(100, 560)">
        <rect
          x={0}
          y={0}
          width={640}
          height={60}
          rx={12}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.grid}
          strokeWidth={1.5}
          className="shadow-sm"
        />
        <text
          x={24}
          y={36}
          fontSize={fontScale(15)}
          fill={MATH_COLORS.labelTextLight}
        >
          <tspan fontWeight="bold">几何比值证明：</tspan>
          <tspan fill={MATH_COLORS.paramPrimary} fontWeight="bold">
            {" "}
            P(B|A){" "}
          </tspan>
          = Area(AB) / Area(A) = {conditionalData.pAB.toFixed(2)} /{" "}
          {conditionalData.pA.toFixed(2)} =
          <tspan fill={MATH_COLORS.function} fontWeight="bold">
            {" "}
            {conditionalData.isDegenerate
              ? "无意义"
              : conditionalData.pB_given_A.toFixed(4)}
          </tspan>
        </text>
      </g>
    </g>
  );
}
