import { useMemo } from "react";
import { FunctionGraph, InteractivePoint, MathPoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { paramDomainRange, snapDragValue } from "@/utils/paramClamp";
import { MATH_COLORS, withAlpha } from "@/theme";
import { paramMeta } from "@/data/registries/trigModel";
import type { SceneScale } from "@/hooks";
import { cssToDesignLength, type ViewportInfo } from "@/utils/useViewport";
import { buildHarmonicModel, harmonicValue } from "@/math/trigModel";
import {
  AXIS_NAME_DY,
  AXIS_TICK_CLEARANCE_DY,
  SPAN_LABEL_DY,
  SPAN_LINE_DY,
  SPAN_TICK_BOTTOM_DY,
  SPAN_TICK_TOP_DY,
  topChromeBottomY,
} from "../viewport";

/** 观测时刻滑块（tRatio）的合法落域，拖拽反解后按它吸附 */
const RANGE_T_RATIO = paramDomainRange(paramMeta.tRatio);
const STEP_T_RATIO = paramMeta.tRatio.step ?? 0.05;

/** 三条水平特征线的文字：距特征线自身的高度、以及距画布右缘的横向内缩（CSS 像素） */
const FEATURE_LABEL_DY = 8;
const FEATURE_LABEL_INSET_X = 26;

type StudyMode = "harmonic" | "fromGraph" | "modeling";

interface TrigModelSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: StudyMode;
}

/** 生成 [lo, hi] 内的全部整数刻度（跳过原点，原点另由 O 标识承担） */
function integerTicks(lo: number, hi: number): number[] {
  const from = Math.ceil(lo);
  const to = Math.floor(hi);
  const out: number[] = [];
  for (let v = from; v <= to; v += 1) {
    if (v !== 0) out.push(v);
  }
  return out;
}

/**
 * 三角函数模型应用中屏作画。
 *
 * 坐标契约：横轴为自变量时间 $t$，纵轴为被刻画的量 $h$；
 * 一切几何位置都由 `mathToDesign(t, h, scale)` 换算，绝不手写像素。
 * 画布上的文字只写**符号与代号**（$t$、$h$、$k + A$、$T$ …），
 * 任何具体读数一律归右屏看板 —— 这正是「中屏看形、右屏读数」的分工。
 *
 * 顶部安全带（悬浮解析式窗）是**局部版式**：它由 CSS 像素定高、不随画布缩放，
 * 故纵轴顶端、纵轴整数刻度与一周期标尺都必须相对它的下沿来定位，
 * 不能写死 design 常数，否则窗口一变就会被压回曲线上。
 */
export function TrigModelScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}: TrigModelSceneProps) {
  const A = params.A ?? 2;
  const period = params.period ?? 2;
  const phi = params.phi ?? Math.PI / 2;
  const k = params.k ?? 0;
  const tRatio = Math.max(0, Math.min(1, params.tRatio ?? 0.75));

  const model = useMemo(
    () => buildHarmonicModel(A, period, phi, k),
    [A, period, phi, k],
  );

  const fn = useMemo(() => (t: number) => harmonicValue(model, t), [model]);

  // 观测点：横坐标为 t = tRatio × T，纵坐标恒由模型给出（必然落在曲线上）
  const tProbe = tRatio * model.period;
  const hProbe = harmonicValue(model, tProbe);

  // ── 顶部安全带：CSS 像素 → design 坐标 ──
  // 本页的定位量（安全带 76、标尺 10~32、特征线内缩 26）全部以 **CSS 像素** 表达，
  // 换算进 design 坐标必须走 `cssToDesignLength`（**除以** `vp.scale`）：
  // `AnimationSvgCanvas` 的 `<g transform="scale(vp.scale)">` 已把整棵子树放大过一次，
  // 再乘一次就成了 `v × vp.scale²` 的平方律（曾误写成 `v * vp.scale` ——
  // 基准窗口下与正确值几乎重合、完全隐形，窗口放大到 1.2 倍即虚胖 44%）。
  // 也不能走 fontScale：那是「字号」链路，内部 clamp(v * scale, 7, 16)，
  // 上述定位量全部超过上限、会被压成同一个值 ——
  // 一周期标尺的两条端刻度线就会退化成零长度（曾实际发生）。
  const px = (v: number) => cssToDesignLength(vp, v);
  const axisTopY = topChromeBottomY(vp);
  const yTickMinY = axisTopY + px(AXIS_TICK_CLEARANCE_DY);

  // ── 关键设计坐标 ──
  const pOrigin = mathToDesign(0, 0, scale);
  const pProbe = mathToDesign(tProbe, hProbe, scale);
  const pTau = mathToDesign(tProbe, 0, scale);
  const pHAxis = mathToDesign(0, hProbe, scale);
  const pBalance = mathToDesign(0, model.balance, scale);
  const pHeight = mathToDesign(0, model.maxValue, scale);
  const pDepth = mathToDesign(0, model.minValue, scale);
  const pCrest = mathToDesign(model.maxTime, model.maxValue, scale);
  const pCrestT = mathToDesign(model.maxTime, 0, scale);

  // 一周期标尺的右端点（t = T，左端即原点处）
  const pSpan1 = mathToDesign(model.period, 0, scale);

  // 纵轴整数刻度：整体让开顶部安全带与一周期标尺带（标尺端刻度与纵轴刻度同处一列，
  // 若不排除，二者会叠成一段莫明其妙的竖线）
  const yTicks = integerTicks(scale.yMin, scale.yMax).filter(
    (v) => mathToDesign(0, v, scale).y >= yTickMinY,
  );
  const xTicks = integerTicks(scale.xMin, scale.xMax);

  const axisColor = MATH_COLORS.axis;
  const lineEndX = mathToDesign(scale.xMax, 0, scale).x;
  const lineBottomY = mathToDesign(0, scale.yMin, scale).y;

  // 观测点拖拽：底层已按 xRange 截断到 [0, T]，此处只把横坐标换算回 tRatio 并按声明域吸附
  const handleProbeDrag = (mathPt: { x: number; y: number }) => {
    if (!onParamChange) return;
    const raw = model.period > 0 ? mathPt.x / model.period : 0;
    onParamChange("tRatio", snapDragValue(raw, STEP_T_RATIO, RANGE_T_RATIO));
  };

  return (
    <g className="trig-model-scene">
      {/* ── 坐标框：t 轴（h = 0）与 h 轴（t = 0，上端停在安全带下沿） ── */}
      <line
        x1={pOrigin.x}
        y1={pOrigin.y}
        x2={lineEndX}
        y2={pOrigin.y}
        stroke={axisColor}
        strokeWidth={1.5}
      />
      <line
        x1={pOrigin.x}
        y1={axisTopY}
        x2={pOrigin.x}
        y2={lineBottomY}
        stroke={axisColor}
        strokeWidth={1.5}
      />
      {/* 箭头 */}
      <polygon
        points={`${lineEndX},${pOrigin.y} ${lineEndX - 7},${pOrigin.y - 3.5} ${lineEndX - 7},${pOrigin.y + 3.5}`}
        fill={axisColor}
      />
      <polygon
        points={`${pOrigin.x},${axisTopY} ${pOrigin.x - 3.5},${axisTopY + 7} ${pOrigin.x + 3.5},${axisTopY + 7}`}
        fill={axisColor}
      />

      {/* 刻度线（只画整数刻度；标签每 2 个刻度一个，避免画布被数字淹没） */}
      {xTicks.map((v) => {
        const pt = mathToDesign(v, 0, scale);
        return (
          <line
            key={v}
            x1={pt.x}
            y1={pt.y - 3.5}
            x2={pt.x}
            y2={pt.y + 3.5}
            stroke={axisColor}
            strokeWidth={1.2}
          />
        );
      })}
      {yTicks.map((v) => {
        const pt = mathToDesign(0, v, scale);
        return (
          <line
            key={v}
            x1={pt.x - 3.5}
            y1={pt.y}
            x2={pt.x + 3.5}
            y2={pt.y}
            stroke={axisColor}
            strokeWidth={1.2}
          />
        );
      })}
      {xTicks
        .filter((v) => v % 2 === 0)
        .map((v) => {
          const pt = mathToDesign(v, 0, scale);
          return (
            <text
              key={v}
              x={pt.x}
              y={pt.y + px(15)}
              textAnchor="middle"
              fill={MATH_COLORS.labelTextLight}
              fontSize={fontScale(10.5)}
              className="select-none"
            >
              {String(v)}
            </text>
          );
        })}
      {yTicks
        .filter((v) => v % 2 === 0)
        .map((v) => {
          const pt = mathToDesign(0, v, scale);
          return (
            <text
              key={v}
              x={pt.x - px(7)}
              y={pt.y + px(3.5)}
              textAnchor="end"
              fill={MATH_COLORS.labelTextLight}
              fontSize={fontScale(10.5)}
              className="select-none"
            >
              {String(v)}
            </text>
          );
        })}

      {/* 轴名与原点（本页自变量是时间、因变量是位移，不可沿用 x / y） */}
      <text
        x={lineEndX - px(2)}
        y={pOrigin.y + px(15)}
        textAnchor="end"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(13)}
        fontStyle="italic"
        fontWeight="bold"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        t
      </text>
      <text
        x={pOrigin.x - px(12)}
        y={axisTopY + px(AXIS_NAME_DY)}
        textAnchor="middle"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(13)}
        fontStyle="italic"
        fontWeight="bold"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        h
      </text>
      <text
        x={pOrigin.x - px(7)}
        y={pOrigin.y + px(14)}
        textAnchor="end"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(12)}
        fontStyle="italic"
        fontWeight="bold"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        O
      </text>

      {/* ── 三条水平特征线：最大值线 k + A、平衡线 k、最小值线 k − A ── */}
      <line
        x1={pHeight.x}
        y1={pHeight.y}
        x2={lineEndX}
        y2={pHeight.y}
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.55)}
        strokeDasharray="5 4"
        strokeWidth={1.4}
      />
      <line
        x1={pBalance.x}
        y1={pBalance.y}
        x2={lineEndX}
        y2={pBalance.y}
        stroke={withAlpha(MATH_COLORS.functionSecondary, 0.75)}
        strokeDasharray="7 3"
        strokeWidth={1.6}
      />
      <line
        x1={pDepth.x}
        y1={pDepth.y}
        x2={lineEndX}
        y2={pDepth.y}
        stroke={withAlpha(MATH_COLORS.paramSecondary, 0.55)}
        strokeDasharray="5 4"
        strokeWidth={1.4}
      />

      {/*
        三条特征线的文字一律**右对齐贴画布右端**，与「首周期内的波峰 / 波谷」
        在横向上彻底分开（极值点横坐标上界是 3T/4 ≤ 9.75，文字左缘在 18 单位之后）；
        若像早前那样钉在纵轴右侧，`h = k − A` 会被波谷圆点压住、
        `fromGraph` 的「波峰」标注也会与 `h = k + A` 挤在同一高度。
      */}
      <text
        x={lineEndX - px(FEATURE_LABEL_INSET_X)}
        y={pHeight.y - px(FEATURE_LABEL_DY)}
        textAnchor="end"
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(11.5)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        h = k + A
      </text>
      <text
        x={lineEndX - px(FEATURE_LABEL_INSET_X)}
        y={pBalance.y - px(FEATURE_LABEL_DY)}
        textAnchor="end"
        fill={MATH_COLORS.functionSecondary}
        fontSize={fontScale(11.5)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        h = k
      </text>
      <text
        x={lineEndX - px(FEATURE_LABEL_INSET_X)}
        y={pDepth.y - px(FEATURE_LABEL_DY)}
        textAnchor="end"
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(11.5)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        h = k − A
      </text>

      {/* ── 主曲线 h = A sin(ω t + φ) + k（时间非负，故数学定义域取 t ≥ 0） ── */}
      <FunctionGraph
        fn={fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.6}
        domain={[0, Infinity]}
        samples={520}
      />

      {/* ── 一周期标尺：从 t = 0 量到 t = T，把「周期」变成一个可量的长度 ── */}
      <g>
        <line
          x1={pOrigin.x}
          y1={axisTopY + px(SPAN_TICK_TOP_DY)}
          x2={pOrigin.x}
          y2={axisTopY + px(SPAN_TICK_BOTTOM_DY)}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.6}
        />
        <line
          x1={pSpan1.x}
          y1={axisTopY + px(SPAN_TICK_TOP_DY)}
          x2={pSpan1.x}
          y2={axisTopY + px(SPAN_TICK_BOTTOM_DY)}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.6}
        />
        <line
          x1={pOrigin.x}
          y1={axisTopY + px(SPAN_LINE_DY)}
          x2={pSpan1.x}
          y2={axisTopY + px(SPAN_LINE_DY)}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.6}
        />
        <text
          x={(pOrigin.x + pSpan1.x) / 2}
          y={axisTopY + px(SPAN_LABEL_DY)}
          textAnchor="middle"
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(12)}
          fontStyle="italic"
          fontWeight="bold"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
          strokeLinejoin="round"
        >
          T
        </text>
      </g>

      {/* ── 模式特化：由图象求解析式时，把「读数顺序」画在图上 ── */}
      {studyMode === "fromGraph" && (
        <>
          {/* 波峰 → 纵轴：读 h_max；波峰 → 横轴：读 t_max */}
          <line
            x1={pCrestT.x}
            y1={pCrestT.y}
            x2={pCrest.x}
            y2={pCrest.y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
            strokeDasharray="4 3"
            strokeWidth={1.4}
          />
          <line
            x1={pHeight.x}
            y1={pHeight.y}
            x2={pCrest.x}
            y2={pCrest.y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
            strokeDasharray="4 3"
            strokeWidth={1.4}
          />
          <MathPoint
            cx={model.maxTime}
            cy={model.maxValue}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            variant="focus"
            fontScale={fontScale}
            label="波峰"
            labelPosition="top"
          />
        </>
      )}

      {/* ── 模式特化：简谐运动时标出一周期内的波峰与波谷 ── */}
      {studyMode === "harmonic" && (
        <>
          <MathPoint
            cx={model.maxTime}
            cy={model.maxValue}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            variant="focus"
            fontScale={fontScale}
          />
          <MathPoint
            cx={model.minTime}
            cy={model.minValue}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            variant="focus"
            fontScale={fontScale}
          />
        </>
      )}

      {/* ── 模式特化：实际情境中把「相对平衡值的偏移 h − k」加粗成一截竖线 ── */}
      {studyMode === "modeling" && Math.abs(hProbe - model.balance) > 1e-9 && (
        <line
          x1={pTau.x}
          y1={pBalance.y}
          x2={pTau.x}
          y2={pProbe.y}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      )}

      {/* ── 观测点 P 的坐标投影虚线（把「横坐标 t」与「位移 h」分开读） ── */}
      <line
        x1={pProbe.x}
        y1={pProbe.y}
        x2={pTau.x}
        y2={pTau.y}
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
        strokeDasharray="4 3"
        strokeWidth={1.3}
      />
      <line
        x1={pProbe.x}
        y1={pProbe.y}
        x2={pHAxis.x}
        y2={pHAxis.y}
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
        strokeDasharray="4 3"
        strokeWidth={1.3}
      />

      {/* ── 可拖拽观测点 P（横坐标即 t，纵坐标恒由曲线决定） ── */}
      <InteractivePoint
        cx={tProbe}
        cy={hProbe}
        scale={scale}
        vp={vp}
        axis="x"
        snapTo={fn}
        xRange={[0, model.period]}
        onDrag={handleProbeDrag}
        color={MATH_COLORS.focusPoint}
        fontScale={fontScale}
        label="P"
        r={7}
      />
    </g>
  );
}
