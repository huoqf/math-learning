import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  MathPoint,
  Asymptote,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import {
  getParabolaArchimedesBase,
  getArchimedesTriangleInfo,
  getFocalChordAdvInfo,
  getOrthogonalChordsInfo,
} from "@/math/parabolaArchimedes";
import {
  avoidLabels,
  type LabelEntry,
  type PlacedLabel,
} from "@/utils/labelAvoider";

interface ParabolaArchimedesSceneProps {
  params: {
    p: number;
    yQ: number;
    thetaDeg: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  onInteractionStart?: () => void;
  fontScale?: (v: number) => number;
  mode: "archimedesTriangle" | "focalChordProperties" | "orthogonalChords";
}

/**
 * 辅助函数：根据直角顶点和两个方向生成像素级固定 9px 直角折线路径
 */
function getRightAnglePath(
  vertex: { x: number; y: number },
  dirA: { x: number; y: number },
  dirB: { x: number; y: number },
  size = 9,
): string {
  const lenA = Math.hypot(dirA.x, dirA.y) || 1;
  const lenB = Math.hypot(dirB.x, dirB.y) || 1;
  const uA = { x: (dirA.x / lenA) * size, y: (dirA.y / lenA) * size };
  const uB = { x: (dirB.x / lenB) * size, y: (dirB.y / lenB) * size };

  const p1 = { x: vertex.x + uA.x, y: vertex.y + uA.y };
  const p2 = { x: vertex.x + uA.x + uB.x, y: vertex.y + uA.y + uB.y };
  const p3 = { x: vertex.x + uB.x, y: vertex.y + uB.y };

  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
}

export const ParabolaArchimedesScene: React.FC<
  ParabolaArchimedesSceneProps
> = ({
  params,
  scale,
  vp,
  onParamChange,
  onInteractionStart,
  fontScale = (v) => v,
  mode,
}) => {
  const { p, yQ, thetaDeg } = params;
  const base = useMemo(() => getParabolaArchimedesBase(p), [p]);
  const isDegenerate = p <= 0;

  // 1. 抛物线 y^2 = 2px 采样曲线
  const curvePath = useMemo(() => {
    if (isDegenerate) return "";
    const pts: { x: number; y: number }[] = [];
    const steps = 140;
    const yMin = scale.yMin - 1;
    const yMax = scale.yMax + 1;

    for (let i = 0; i <= steps; i++) {
      const yVal = yMin + (i / steps) * (yMax - yMin);
      const xVal = (yVal * yVal) / (2 * base.p);
      if (xVal <= scale.xMax + 2) {
        pts.push(mathToDesign(xVal, yVal, scale));
      }
    }

    if (pts.length === 0) return "";
    return pts.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`,
      "",
    );
  }, [base.p, scale, isDegenerate]);

  // 2. 模式 1：阿基米德三角形与准线切线数据
  const archInfo = useMemo(
    () => getArchimedesTriangleInfo(base.p, yQ),
    [base.p, yQ],
  );

  // 3. 模式 2：焦点弦性质与相切圆数据
  const chordAdv = useMemo(
    () => getFocalChordAdvInfo(base.p, thetaDeg),
    [base.p, thetaDeg],
  );

  // 4. 模式 3：双垂直焦点弦数据
  const orthoInfo = useMemo(
    () => getOrthogonalChordsInfo(base.p, thetaDeg),
    [base.p, thetaDeg],
  );

  // 5. 拖拽处理器
  const handleQDrag = (mathPt: { x: number; y: number }) => {
    onInteractionStart?.();
    const clampedY = Math.max(scale.yMin, Math.min(scale.yMax, mathPt.y));
    onParamChange("yQ", Math.round(clampedY * 10) / 10);
  };

  const handleChordDrag = (mathPt: { x: number; y: number }) => {
    onInteractionStart?.();
    // 根据从焦点 F 到拖拽点的向量计算极角
    const dx = mathPt.x - base.focus.x;
    const dy = mathPt.y - base.focus.y;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    // 限制在 (20°, 160°) 焦点弦合理区间
    if (deg > 180) deg = 360 - deg;
    const clamped = Math.max(20, Math.min(160, deg));
    onParamChange("thetaDeg", Math.round(clamped));
  };

  const focusPt = mathToDesign(base.focus.x, base.focus.y, scale);

  // 6. 避让点标
  const labels = useMemo(() => {
    const raw: LabelEntry[] = [];

    // 焦点 F
    raw.push({
      key: "F",
      x: focusPt.x,
      y: focusPt.y,
      anchor: "start",
      dy: 14,
      text: "F",
    });

    // 原点 O
    const opt = mathToDesign(0, 0, scale);
    raw.push({
      key: "O",
      x: opt.x,
      y: opt.y,
      anchor: "end",
      dy: 14,
      text: "O",
    });

    if (mode === "archimedesTriangle") {
      const qd = mathToDesign(archInfo.Q.x, archInfo.Q.y, scale);
      const ad = mathToDesign(archInfo.A.x, archInfo.A.y, scale);
      const bd = mathToDesign(archInfo.B.x, archInfo.B.y, scale);
      const md = mathToDesign(archInfo.M.x, archInfo.M.y, scale);
      const p0d = mathToDesign(archInfo.P0.x, archInfo.P0.y, scale);

      raw.push(
        { key: "Q", x: qd.x, y: qd.y, anchor: "end", dy: -8, text: "Q" },
        { key: "A", x: ad.x, y: ad.y, anchor: "start", dy: -8, text: "A" },
        { key: "B", x: bd.x, y: bd.y, anchor: "start", dy: 14, text: "B" },
        { key: "M", x: md.x, y: md.y, anchor: "start", dy: -8, text: "M" },
        { key: "P0", x: p0d.x, y: p0d.y, anchor: "start", dy: 12, text: "P₀" },
      );
    } else if (mode === "focalChordProperties") {
      const ad = mathToDesign(chordAdv.A.x, chordAdv.A.y, scale);
      const bd = mathToDesign(chordAdv.B.x, chordAdv.B.y, scale);
      const md = mathToDesign(
        chordAdv.midpointM.x,
        chordAdv.midpointM.y,
        scale,
      );
      const kd = mathToDesign(
        chordAdv.directrixTangentCircle.tangentPointK.x,
        chordAdv.directrixTangentCircle.tangentPointK.y,
        scale,
      );

      raw.push(
        { key: "A", x: ad.x, y: ad.y, anchor: "start", dy: -8, text: "A" },
        { key: "B", x: bd.x, y: bd.y, anchor: "start", dy: 14, text: "B" },
        { key: "M", x: md.x, y: md.y, anchor: "start", dy: -8, text: "M" },
        { key: "K", x: kd.x, y: kd.y, anchor: "end", dy: -8, text: "K" },
      );
    } else {
      // orthogonalChords
      const ad = mathToDesign(
        orthoInfo.chordAB.A.x,
        orthoInfo.chordAB.A.y,
        scale,
      );
      const bd = mathToDesign(
        orthoInfo.chordAB.B.x,
        orthoInfo.chordAB.B.y,
        scale,
      );
      const cd = mathToDesign(
        orthoInfo.chordCD.A.x,
        orthoInfo.chordCD.A.y,
        scale,
      );
      const dd = mathToDesign(
        orthoInfo.chordCD.B.x,
        orthoInfo.chordCD.B.y,
        scale,
      );

      raw.push(
        { key: "A", x: ad.x, y: ad.y, anchor: "start", dy: -8, text: "A" },
        { key: "B", x: bd.x, y: bd.y, anchor: "start", dy: 14, text: "B" },
        { key: "C", x: cd.x, y: cd.y, anchor: "start", dy: -8, text: "C" },
        { key: "D", x: dd.x, y: dd.y, anchor: "end", dy: 14, text: "D" },
      );
    }

    return avoidLabels(raw);
  }, [base, archInfo, chordAdv, orthoInfo, mode, scale, focusPt]);

  return (
    <g>
      {/* 1. 坐标轴与网格 (解析几何规范 showGrid={false}) */}
      <CoordinateGrid scale={scale} showGrid={false} fontScale={fontScale} />

      {/* 2. 准线 l: x = -p/2 */}
      <Asymptote
        type="vertical"
        value={base.directrixX}
        scale={scale}
        color={MATH_COLORS.asymptote}
        label="准线 l: x = -p/2"
        fontScale={fontScale}
      />

      {/* 3. 抛物线主曲线 */}
      {!isDegenerate && curvePath && (
        <path
          d={curvePath}
          fill="none"
          stroke={MATH_COLORS.function}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}

      {/* 4. 模式 1：阿基米德三角形与正交切线 */}
      {mode === "archimedesTriangle" && !isDegenerate && (
        <g>
          {/* 阿基米德三角形 QAB 面域填充 */}
          <polygon
            points={`${mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).x},${
              mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).y
            } ${mathToDesign(archInfo.A.x, archInfo.A.y, scale).x},${
              mathToDesign(archInfo.A.x, archInfo.A.y, scale).y
            } ${mathToDesign(archInfo.B.x, archInfo.B.y, scale).x},${
              mathToDesign(archInfo.B.x, archInfo.B.y, scale).y
            }`}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.08)}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.5}
          />

          {/* 切线 QA 与 QB */}
          <line
            x1={mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).x}
            y1={mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).y}
            x2={mathToDesign(archInfo.A.x, archInfo.A.y, scale).x}
            y2={mathToDesign(archInfo.A.x, archInfo.A.y, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2.2}
          />
          <line
            x1={mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).x}
            y1={mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).y}
            x2={mathToDesign(archInfo.B.x, archInfo.B.y, scale).x}
            y2={mathToDesign(archInfo.B.x, archInfo.B.y, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2.2}
          />

          {/* 切点弦 AB (过焦点 F) */}
          <line
            x1={mathToDesign(archInfo.A.x, archInfo.A.y, scale).x}
            y1={mathToDesign(archInfo.A.x, archInfo.A.y, scale).y}
            x2={mathToDesign(archInfo.B.x, archInfo.B.y, scale).x}
            y2={mathToDesign(archInfo.B.x, archInfo.B.y, scale).y}
            stroke={MATH_COLORS.vectorPrimary}
            strokeWidth={2.5}
          />

          {/* 垂直连线 QF */}
          <line
            x1={mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).x}
            y1={mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).y}
            x2={focusPt.x}
            y2={focusPt.y}
            stroke={MATH_COLORS.focusPoint}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />

          {/* 中线 QM 与平分线 (水平线 y = yQ) */}
          <line
            x1={mathToDesign(archInfo.Q.x, archInfo.Q.y, scale).x}
            y1={mathToDesign(archInfo.Q.y, archInfo.Q.y, scale).y}
            x2={mathToDesign(archInfo.M.x, archInfo.M.y, scale).x}
            y2={mathToDesign(archInfo.M.x, archInfo.M.y, scale).y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* Q 处直角折线标尺 (QA ⊥ QB) */}
          {(() => {
            const qPt = mathToDesign(archInfo.Q.x, archInfo.Q.y, scale);
            const aPt = mathToDesign(archInfo.A.x, archInfo.A.y, scale);
            const bPt = mathToDesign(archInfo.B.x, archInfo.B.y, scale);
            const dirQA = { x: aPt.x - qPt.x, y: aPt.y - qPt.y };
            const dirQB = { x: bPt.x - qPt.x, y: bPt.y - qPt.y };
            return (
              <path
                d={getRightAnglePath(qPt, dirQA, dirQB, 9)}
                fill="none"
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.3}
              />
            );
          })()}

          {/* F 处直角折线标尺 (QF ⊥ AB) */}
          {(() => {
            const qPt = mathToDesign(archInfo.Q.x, archInfo.Q.y, scale);
            const aPt = mathToDesign(archInfo.A.x, archInfo.A.y, scale);
            const dirFQ = { x: qPt.x - focusPt.x, y: qPt.y - focusPt.y };
            const dirFA = { x: aPt.x - focusPt.x, y: aPt.y - focusPt.y };
            return (
              <path
                d={getRightAnglePath(focusPt, dirFQ, dirFA, 9)}
                fill="none"
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={1.2}
              />
            );
          })()}

          {/* 特征数学点 A, B, M, P0 */}
          <MathPoint
            cx={archInfo.A.x}
            cy={archInfo.A.y}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={archInfo.B.x}
            cy={archInfo.B.y}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={archInfo.M.x}
            cy={archInfo.M.y}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            r={3.4}
            fontScale={fontScale}
          />
          <MathPoint
            cx={archInfo.P0.x}
            cy={archInfo.P0.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            r={3.5}
            fontScale={fontScale}
          />

          {/* 准线上点 Q 交互可拖拽点 */}
          <InteractivePoint
            cx={archInfo.Q.x}
            cy={archInfo.Q.y}
            scale={scale}
            vp={vp}
            onDrag={handleQDrag}
            color={MATH_COLORS.paramSecondary}
            r={5.5}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 5. 模式 2：焦点弦性质与准线切圆 */}
      {mode === "focalChordProperties" && !isDegenerate && (
        <g>
          {/* 焦点弦 AB */}
          <line
            x1={mathToDesign(chordAdv.A.x, chordAdv.A.y, scale).x}
            y1={mathToDesign(chordAdv.A.x, chordAdv.A.y, scale).y}
            x2={mathToDesign(chordAdv.B.x, chordAdv.B.y, scale).x}
            y2={mathToDesign(chordAdv.B.x, chordAdv.B.y, scale).y}
            stroke={MATH_COLORS.vectorPrimary}
            strokeWidth={2.5}
          />

          {/* 以 AB 为直径的圆 (与准线相切) */}
          <circle
            cx={
              mathToDesign(
                chordAdv.directrixTangentCircle.center.x,
                chordAdv.directrixTangentCircle.center.y,
                scale,
              ).x
            }
            cy={
              mathToDesign(
                chordAdv.directrixTangentCircle.center.x,
                chordAdv.directrixTangentCircle.center.y,
                scale,
              ).y
            }
            r={chordAdv.directrixTangentCircle.radius * scale.scale}
            fill={withAlpha(MATH_COLORS.vectorPrimary, 0.05)}
            stroke={withAlpha(MATH_COLORS.vectorPrimary, 0.55)}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />

          {/* 中点 M 到准线切点 K 的公垂线段 MK */}
          <line
            x1={
              mathToDesign(
                chordAdv.directrixTangentCircle.center.x,
                chordAdv.directrixTangentCircle.center.y,
                scale,
              ).x
            }
            y1={
              mathToDesign(
                chordAdv.directrixTangentCircle.center.x,
                chordAdv.directrixTangentCircle.center.y,
                scale,
              ).y
            }
            x2={
              mathToDesign(
                chordAdv.directrixTangentCircle.tangentPointK.x,
                chordAdv.directrixTangentCircle.tangentPointK.y,
                scale,
              ).x
            }
            y2={
              mathToDesign(
                chordAdv.directrixTangentCircle.tangentPointK.x,
                chordAdv.directrixTangentCircle.tangentPointK.y,
                scale,
              ).y
            }
            stroke={MATH_COLORS.asymptote}
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />

          {/* K 处直角折线标尺 */}
          {(() => {
            const kPt = mathToDesign(
              chordAdv.directrixTangentCircle.tangentPointK.x,
              chordAdv.directrixTangentCircle.tangentPointK.y,
              scale,
            );
            const mPt = mathToDesign(
              chordAdv.directrixTangentCircle.center.x,
              chordAdv.directrixTangentCircle.center.y,
              scale,
            );
            const dirKToM = { x: mPt.x - kPt.x, y: mPt.y - kPt.y };
            const dirTangent = { x: 0, y: -1 };
            return (
              <path
                d={getRightAnglePath(kPt, dirKToM, dirTangent, 9)}
                fill="none"
                stroke={MATH_COLORS.asymptote}
                strokeWidth={1.2}
              />
            );
          })()}

          {/* 特征数学点 A, B, M, K */}
          <MathPoint
            cx={chordAdv.B.x}
            cy={chordAdv.B.y}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={chordAdv.midpointM.x}
            cy={chordAdv.midpointM.y}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            r={3.5}
            fontScale={fontScale}
          />
          <MathPoint
            cx={chordAdv.directrixTangentCircle.tangentPointK.x}
            cy={chordAdv.directrixTangentCircle.tangentPointK.y}
            scale={scale}
            color={MATH_COLORS.asymptote}
            r={3.5}
            fontScale={fontScale}
          />

          {/* 动点 A (可拖拽旋转割线) */}
          <InteractivePoint
            cx={chordAdv.A.x}
            cy={chordAdv.A.y}
            scale={scale}
            vp={vp}
            onDrag={handleChordDrag}
            color={MATH_COLORS.vectorPrimary}
            r={5.5}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 6. 模式 3：双垂直焦点弦 */}
      {mode === "orthogonalChords" && !isDegenerate && (
        <g>
          {/* 四边形 ACBD 面域填充 */}
          <polygon
            points={`${mathToDesign(orthoInfo.chordAB.A.x, orthoInfo.chordAB.A.y, scale).x},${
              mathToDesign(orthoInfo.chordAB.A.x, orthoInfo.chordAB.A.y, scale)
                .y
            } ${mathToDesign(orthoInfo.chordCD.A.x, orthoInfo.chordCD.A.y, scale).x},${
              mathToDesign(orthoInfo.chordCD.A.x, orthoInfo.chordCD.A.y, scale)
                .y
            } ${mathToDesign(orthoInfo.chordAB.B.x, orthoInfo.chordAB.B.y, scale).x},${
              mathToDesign(orthoInfo.chordAB.B.x, orthoInfo.chordAB.B.y, scale)
                .y
            } ${mathToDesign(orthoInfo.chordCD.B.x, orthoInfo.chordCD.B.y, scale).x},${
              mathToDesign(orthoInfo.chordCD.B.x, orthoInfo.chordCD.B.y, scale)
                .y
            }`}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.4}
          />

          {/* 弦 AB */}
          <line
            x1={
              mathToDesign(orthoInfo.chordAB.A.x, orthoInfo.chordAB.A.y, scale)
                .x
            }
            y1={
              mathToDesign(orthoInfo.chordAB.A.y, orthoInfo.chordAB.A.y, scale)
                .y
            }
            x2={
              mathToDesign(orthoInfo.chordAB.B.x, orthoInfo.chordAB.B.y, scale)
                .x
            }
            y2={
              mathToDesign(orthoInfo.chordAB.B.x, orthoInfo.chordAB.B.y, scale)
                .y
            }
            stroke={MATH_COLORS.vectorPrimary}
            strokeWidth={2.4}
          />

          {/* 垂直弦 CD */}
          <line
            x1={
              mathToDesign(orthoInfo.chordCD.A.x, orthoInfo.chordCD.A.y, scale)
                .x
            }
            y1={
              mathToDesign(orthoInfo.chordCD.A.y, orthoInfo.chordCD.A.y, scale)
                .y
            }
            x2={
              mathToDesign(orthoInfo.chordCD.B.x, orthoInfo.chordCD.B.y, scale)
                .x
            }
            y2={
              mathToDesign(orthoInfo.chordCD.B.x, orthoInfo.chordCD.B.y, scale)
                .y
            }
            stroke={MATH_COLORS.vectorSecondary}
            strokeWidth={2.4}
          />

          {/* 焦点 F 处两垂直弦直角折线标尺 */}
          {(() => {
            const aPt = mathToDesign(
              orthoInfo.chordAB.A.x,
              orthoInfo.chordAB.A.y,
              scale,
            );
            const cPt = mathToDesign(
              orthoInfo.chordCD.A.x,
              orthoInfo.chordCD.A.y,
              scale,
            );
            const dirFA = { x: aPt.x - focusPt.x, y: aPt.y - focusPt.y };
            const dirFC = { x: cPt.x - focusPt.x, y: cPt.y - focusPt.y };
            return (
              <path
                d={getRightAnglePath(focusPt, dirFA, dirFC, 10)}
                fill="none"
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={1.3}
              />
            );
          })()}

          {/* 特征数学点 B, C, D */}
          <MathPoint
            cx={orthoInfo.chordAB.B.x}
            cy={orthoInfo.chordAB.B.y}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={orthoInfo.chordCD.A.x}
            cy={orthoInfo.chordCD.A.y}
            scale={scale}
            color={MATH_COLORS.vectorSecondary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={orthoInfo.chordCD.B.x}
            cy={orthoInfo.chordCD.B.y}
            scale={scale}
            color={MATH_COLORS.vectorSecondary}
            r={3.8}
            fontScale={fontScale}
          />

          {/* 动点 A (可拖拽旋转双垂直系统) */}
          <InteractivePoint
            cx={orthoInfo.chordAB.A.x}
            cy={orthoInfo.chordAB.A.y}
            scale={scale}
            vp={vp}
            onDrag={handleChordDrag}
            color={MATH_COLORS.vectorPrimary}
            r={5.5}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 7. 焦点 F 核心数学点 */}
      <MathPoint
        cx={base.focus.x}
        cy={base.focus.y}
        scale={scale}
        color={MATH_COLORS.focusPoint}
        r={4.2}
        fontScale={fontScale}
      />

      {/* 8. 避让单字母点标 (带白描边防文字断线) */}
      {labels.map((l: PlacedLabel) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y + (l.finalDy ?? 0)}
          textAnchor={l.anchor}
          fill={MATH_COLORS.labelText}
          stroke={CANVAS_COLORS.white}
          strokeWidth={3}
          paintOrder="stroke fill"
          fontSize={fontScale(12)}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          className="select-none pointer-events-none"
        >
          {l.text}
        </text>
      ))}
    </g>
  );
};
