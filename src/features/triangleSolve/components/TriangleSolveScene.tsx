import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { solveTriangleFromSAS, solveSSA } from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";

interface TriangleSolveSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: "sine" | "ssa" | "cosine" | "area";
}

export function TriangleSolveScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}: TriangleSolveSceneProps) {
  const angleA = params.angleA ?? 60;
  const b = params.b ?? 5;
  const c = params.c ?? 6;
  const a = params.a ?? 4.5;

  const sasResult = solveTriangleFromSAS(b, c, angleA);
  const ssaResult = solveSSA(a, b, angleA);

  if (studyMode === "ssa") {
    const { A: pointA, C: pointC, solutions } = ssaResult;

    const pA = mathToDesign(pointA.x, pointA.y, scale);
    const pC = mathToDesign(pointC.x, pointC.y, scale);

    // 计算射线 AB 方向 (角 A 度数)
    const radA = (angleA * Math.PI) / 180;
    const rayLen = Math.max(12, b * 1.5);
    const rayEndMath = {
      x: pointA.x + rayLen * Math.cos(radA),
      y: pointA.y + rayLen * Math.sin(radA),
    };
    const pRayEnd = mathToDesign(rayEndMath.x, rayEndMath.y, scale);

    // 垂线段 (0, h)
    const footDMath = {
      x: pointA.x + b * Math.cos(radA) * Math.cos(radA),
      y: pointA.y + b * Math.cos(radA) * Math.sin(radA),
    };
    const pFootD = mathToDesign(footDMath.x, footDMath.y, scale);

    const h = b * Math.sin(radA);

    // 圆弧绘制 (以 C 为圆心，半径为 a)
    const radiusInPixel = a * scale.scaleX;
    const hInPixel = h * scale.scaleX;

    return (
      <g className="triangle-solve-scene">
        {/* 坐标轴与网格 */}
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 射线 AB 方向基准虚线 */}
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pRayEnd.x}
          y2={pRayEnd.y}
          stroke={CANVAS_COLORS.labelTextLight}
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />

        {/* 基准边 AC (长为 b) */}
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pC.x}
          y2={pC.y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={3}
        />
        {/* 边 AC 标签 */}
        <text
          x={(pA.x + pC.x) / 2}
          y={pA.y + fontScale(18)}
          textAnchor="middle"
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(12)}
          fontWeight="bold"
        >
          b = {b.toFixed(1)}
        </text>

        {/* 垂线 h (b sinA) */}
        <line
          x1={pC.x}
          y1={pC.y}
          x2={pFootD.x}
          y2={pFootD.y}
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={2}
          strokeDasharray="3,3"
        />
        <text
          x={(pC.x + pFootD.x) / 2 + fontScale(10)}
          y={(pC.y + pFootD.y) / 2}
          fill={MATH_COLORS.tangentLine}
          fontSize={fontScale(11)}
        >
          h = {h.toFixed(2)}
        </text>

        {/* 以 C 为圆心，半径为 a 的探究圆弧 */}
        <circle
          cx={pC.x}
          cy={pC.y}
          r={radiusInPixel}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
          strokeDasharray="5,5"
        />

        {/* 临界切线圆 (半径 h) 辅助虚线 */}
        <circle
          cx={pC.x}
          cy={pC.y}
          r={hInPixel}
          fill="none"
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.5}
        />

        {/* 交点与解三角形渲染 */}
        {solutions.map((solB, idx) => {
          const pB = mathToDesign(solB.x, solB.y, scale);
          const isPrimary = idx === 0;
          return (
            <g key={idx}>
              {/* 形成的三角形边 BC */}
              <line
                x1={pC.x}
                y1={pC.y}
                x2={pB.x}
                y2={pB.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={isPrimary ? 3 : 2}
              />
              {/* 形成的三角形边 AB */}
              <line
                x1={pA.x}
                y1={pA.y}
                x2={pB.x}
                y2={pB.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={isPrimary ? 3 : 2}
              />

              {/* 顶点 B 标注 */}
              <circle
                cx={pB.x}
                cy={pB.y}
                r={fontScale(5)}
                fill={
                  isPrimary
                    ? MATH_COLORS.paramPrimary
                    : MATH_COLORS.sequenceHighlight
                }
              />
              <text
                x={pB.x}
                y={pB.y - fontScale(10)}
                textAnchor="middle"
                fill={MATH_COLORS.function}
                fontSize={fontScale(12)}
                fontWeight="bold"
              >
                {solutions.length === 2 ? `B${idx + 1}` : "B"}
              </text>
            </g>
          );
        })}

        {/* 固定顶点 A, C 标注 */}
        <text
          x={pA.x - fontScale(12)}
          y={pA.y + fontScale(14)}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          A ({angleA}°)
        </text>
        <text
          x={pC.x + fontScale(12)}
          y={pC.y + fontScale(14)}
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          C
        </text>
      </g>
    );
  }

  // 模式：sine | cosine | area
  const {
    points: { A, B, C },
    sides,
    anglesDeg,
    circumcircle,
    incircle,
    altitudeA,
  } = sasResult;

  const pA = mathToDesign(A.x, A.y, scale);
  const pB = mathToDesign(B.x, B.y, scale);
  const pC = mathToDesign(C.x, C.y, scale);

  // 外接圆中心与半径 px
  const pCircumCenter = mathToDesign(
    circumcircle.center.x,
    circumcircle.center.y,
    scale,
  );
  const circumRadiusPx = circumcircle.radius * scale.scaleX;

  // 内切圆中心与半径 px
  const pIncenter = mathToDesign(incircle.center.x, incircle.center.y, scale);
  const inradiusPx = incircle.radius * scale.scaleX;

  // 垂足 FootD
  const pFootD = mathToDesign(altitudeA.foot.x, altitudeA.foot.y, scale);

  return (
    <g className="triangle-solve-scene">
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 外接圆 (正弦定理与面积模式) */}
      {(studyMode === "sine" || studyMode === "area") &&
        circumRadiusPx < 800 && (
          <g>
            <circle
              cx={pCircumCenter.x}
              cy={pCircumCenter.y}
              r={circumRadiusPx}
              fill={withAlpha(MATH_COLORS.circle, 0.04)}
              stroke={MATH_COLORS.circle}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
            {/* 外心 O 标注 */}
            <circle
              cx={pCircumCenter.x}
              cy={pCircumCenter.y}
              r={fontScale(3.5)}
              fill={MATH_COLORS.circle}
            />
            <text
              x={pCircumCenter.x + fontScale(6)}
              y={pCircumCenter.y - fontScale(6)}
              fill={MATH_COLORS.circle}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              O (R={circumcircle.radius.toFixed(2)})
            </text>
            {/* 外接圆半径连线 OA */}
            <line
              x1={pCircumCenter.x}
              y1={pCircumCenter.y}
              x2={pA.x}
              y2={pA.y}
              stroke={MATH_COLORS.circle}
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          </g>
        )}

      {/* 内切圆 (面积模式) */}
      {studyMode === "area" && inradiusPx > 2 && (
        <g>
          <circle
            cx={pIncenter.x}
            cy={pIncenter.y}
            r={inradiusPx}
            fill={withAlpha(MATH_COLORS.complexNum, 0.08)}
            stroke={MATH_COLORS.complexNum}
            strokeWidth={1.5}
          />
          {/* 内心 I 标注 */}
          <circle
            cx={pIncenter.x}
            cy={pIncenter.y}
            r={fontScale(3.5)}
            fill={MATH_COLORS.complexNum}
          />
          <text
            x={pIncenter.x + fontScale(6)}
            y={pIncenter.y + fontScale(12)}
            fill={MATH_COLORS.complexNum}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            I (r={incircle.radius.toFixed(2)})
          </text>
        </g>
      )}

      {/* 投影定理 / 高线 AD (余弦 / 面积模式) */}
      {(studyMode === "cosine" || studyMode === "area") && (
        <g>
          <line
            x1={pA.x}
            y1={pA.y}
            x2={pFootD.x}
            y2={pFootD.y}
            stroke={MATH_COLORS.sequenceHighlight}
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />
          <text
            x={(pA.x + pFootD.x) / 2 - fontScale(12)}
            y={(pA.y + pFootD.y) / 2}
            fill={MATH_COLORS.sequenceHighlight}
            fontSize={fontScale(11)}
          >
            hₐ = {altitudeA.length.toFixed(2)}
          </text>
        </g>
      )}

      {/* 三角形内部填充 */}
      <polygon
        points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
        fill={withAlpha(MATH_COLORS.function, 0.06)}
      />

      {/* 三角形三条边 (三位一体色彩) */}
      {/* 边 a (BC): 对顶点 A */}
      <line
        x1={pB.x}
        y1={pB.y}
        x2={pC.x}
        y2={pC.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={3}
      />
      {/* 边 b (AC): 对顶点 B */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pC.x}
        y2={pC.y}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={3}
      />
      {/* 边 c (AB): 对顶点 C */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pB.x}
        y2={pB.y}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={3}
      />

      {/* 边长文本标注 */}
      <text
        x={(pB.x + pC.x) / 2}
        y={(pB.y + pC.y) / 2 + fontScale(16)}
        textAnchor="middle"
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(11)}
        fontWeight="bold"
      >
        a = {sides.a.toFixed(2)}
      </text>
      <text
        x={(pA.x + pC.x) / 2 + fontScale(14)}
        y={(pA.y + pC.y) / 2}
        textAnchor="start"
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(11)}
        fontWeight="bold"
      >
        b = {sides.b.toFixed(2)}
      </text>
      <text
        x={(pA.x + pB.x) / 2 - fontScale(14)}
        y={(pA.y + pB.y) / 2}
        textAnchor="end"
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(11)}
        fontWeight="bold"
      >
        c = {sides.c.toFixed(2)}
      </text>

      {/* 顶点 A 交互拖拽控制点 */}
      <InteractivePoint
        cx={pA.x}
        cy={pA.y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        onDrag={(mathPos) => {
          if (onParamChange) {
            const newAngle = Math.round(
              Math.max(15, Math.min(150, Math.abs(mathPos.y) * 15 + 30)),
            );
            onParamChange("angleA", newAngle);
          }
        }}
      />
      {/* 顶点 B */}
      <circle
        cx={pB.x}
        cy={pB.y}
        r={fontScale(5)}
        fill={MATH_COLORS.paramSecondary}
      />
      {/* 顶点 C */}
      <circle
        cx={pC.x}
        cy={pC.y}
        r={fontScale(5)}
        fill={MATH_COLORS.paramTertiary}
      />

      {/* 顶点名称与角度数值 */}
      <text
        x={pA.x}
        y={pA.y - fontScale(10)}
        textAnchor="middle"
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        A ({anglesDeg.A.toFixed(1)}°)
      </text>
      <text
        x={pB.x - fontScale(10)}
        y={pB.y + fontScale(14)}
        textAnchor="end"
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        B ({anglesDeg.B.toFixed(1)}°)
      </text>
      <text
        x={pC.x + fontScale(10)}
        y={pC.y + fontScale(14)}
        textAnchor="start"
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        C ({anglesDeg.C.toFixed(1)}°)
      </text>
    </g>
  );
}
