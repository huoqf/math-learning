import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculatePiecewise, calculateComposite } from "@/math/composite";
import { paramMeta } from "@/data/registries/composite";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";
import {
  buildOuterInset,
  OUTER_INSET,
  type OuterType,
} from "@/features/composite/outerInset";

interface CompositeSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  subMode: "piecewise" | "composite";
  /** 外层映射类型：与 outerInset.ts 的 OuterType 同源（小图取景按此选择窗口） */
  outerType: OuterType;
}

export function CompositeScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  subMode,
  outerType,
}: CompositeSceneProps) {
  const x0 = params.x0 ?? 1.0;
  const xSample = params.xSample ?? 1.5;
  const innerB = params.innerB ?? -2.0;
  const innerC = params.innerC ?? 2.0;

  // 复合函数解算无条件在顶层完成：Hook 不可放在分支内（分段/复合两个分支共用本组件），
  // 且中屏「外层映射小图」必须拿到当前 u = g(x)、y = f(u) 才能标出传导链的这一环。
  // 该调用是纯函数、开销可忽略。
  const compositeRes = useMemo(
    () => calculateComposite({ xSample, innerB, innerC, outerType }),
    [xSample, innerB, innerC, outerType],
  );

  // 外层映射小图：独立坐标系（自己的 u / y 轴与比例尺），固定在画布左下角 ——
  // 左上角是主公式浮标、右下角是图例，而左下角在本页三种外层下都几乎没有曲线经过。
  // 取景规则不在此处、而在 outerInset.ts：纵向窗口给定后横向跨度按绘图区宽高比反推，
  // 使 scaleX === scaleY，f(u) 的陡升与开口在任何外层下都不会被拉扁失真。
  const outerInset = useMemo(() => {
    // 几何与比例尺全部由 outerInset.ts 解算（纯函数，见该文件顶部的取景规则）。
    const geo = buildOuterInset({
      outerType,
      designLeft: vp.designLeft,
      designTop: vp.designTop,
      designVisibleH: vp.designVisibleH,
    });
    const { scale } = geo;

    const { u, y } = compositeRes;
    const inRange =
      Number.isFinite(u) &&
      Number.isFinite(y) &&
      u >= scale.xMin &&
      u <= scale.xMax &&
      y >= scale.yMin &&
      y <= scale.yMax;

    return {
      ...geo,
      origin: mathToDesign(0, 0, scale),
      uAxisEnd: mathToDesign(scale.xMax, 0, scale),
      yAxisEnd: mathToDesign(0, scale.yMax, scale),
      inRange,
      markerU: mathToDesign(u, y, scale),
      markerOnUAxis: mathToDesign(u, 0, scale),
      markerOnYAxis: mathToDesign(0, y, scale),
    };
  }, [outerType, vp.designLeft, vp.designTop, vp.designVisibleH, compositeRes]);

  // 标注避让计算
  const placedLabels = useMemo(() => {
    const entries: LabelEntry[] = [];
    if (subMode === "piecewise") {
      const pt = mathToDesign(x0, 0, scale);
      entries.push({
        key: "x0",
        text: `x₀ = ${x0.toFixed(1)}`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12,
      });
    } else {
      const pt = mathToDesign(xSample, 0, scale);
      entries.push({
        key: "xSample",
        text: `x = ${xSample.toFixed(1)}`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12,
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [subMode, x0, xSample, scale, fontScale]);

  if (subMode === "piecewise") {
    const leftSlope = params.leftSlope ?? 1.0;
    const leftConst = params.leftConst ?? 0.0;
    const rightSlope = params.rightSlope ?? -0.5;
    const rightConst = params.rightConst ?? 1.5;

    const res = calculatePiecewise({
      x0,
      leftSlope,
      leftConst,
      rightSlope,
      rightConst,
    });

    const handleDragX0 = (mathPt: { x: number; y: number }) => {
      // 落值统一走 paramClamp SSOT：先取「参数声明域 ∩ 当前可见视口」求交，再按 paramMeta.step 吸附。
      // 严禁手写 Math.round(mathPt.x * 2) / 2 —— 步长写死 0.5 与左屏滑块的真实 step 无同源约束，
      // 注册表一旦调整，滑块与图形立刻脱节；且缺视口约束时动点可被拖出画布再也抓不回来。
      onParamChange(
        "x0",
        snapDragValue(
          mathPt.x,
          paramMeta.x0.step,
          paramDragRange(paramMeta.x0, scale, "x"),
        ),
      );
    };

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 分界线 x = x0 */}
        <Asymptote
          type="vertical"
          value={x0}
          scale={scale}
          color={MATH_COLORS.asymptote}
          label={`x₀ = ${x0.toFixed(1)}`}
          fontScale={fontScale}
        />

        {/* 左段函数曲线 (x <= x0) */}
        <FunctionGraph
          fn={(x) => (x <= x0 ? leftSlope * x + leftConst : NaN)}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />

        {/* 右段函数曲线 (x > x0) */}
        <FunctionGraph
          fn={(x) => (x > x0 ? rightSlope * x + rightConst : NaN)}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2.8}
        />

        {/* 左段在 x0 处的闭区间端点 (实心点) */}
        <MathPoint
          cx={x0}
          cy={res.leftValAtX0}
          scale={scale}
          variant="solid"
          color={MATH_COLORS.function}
          fontScale={fontScale}
        />

        {/* 右段在 x0 处的开区间端点 (若断开则为空心点) */}
        {!res.isContinuous && (
          <MathPoint
            cx={x0}
            cy={res.rightValAtX0}
            scale={scale}
            variant="hollow"
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />
        )}

        {/* 交互分界控制点 */}
        <InteractivePoint
          cx={x0}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handleDragX0}
          label={`x₀ = ${x0.toFixed(1)}`}
          labelKey="x0"
          placedLabels={placedLabels}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />
      </g>
    );
  } else {
    // 复合函数模式
    const res = compositeRes;

    const handleDragXSample = (mathPt: { x: number; y: number }) => {
      // 同上：步长 0.1 与视口约束必须来自 SSOT，不得在此写死 Math.round(mathPt.x * 10) / 10。
      onParamChange(
        "xSample",
        snapDragValue(
          mathPt.x,
          paramMeta.xSample.step,
          paramDragRange(paramMeta.xSample, scale, "x"),
        ),
      );
    };

    const ptDesignX = scale.originX + xSample * scale.scaleX;
    const ptDesignYInner = Number.isFinite(res.u)
      ? scale.originY - res.u * scale.scaleY
      : null;
    const ptDesignYComposite = Number.isFinite(res.y)
      ? scale.originY - res.y * scale.scaleY
      : null;

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 1. 内层函数 u = g(x) 辅助虚线 */}
        <FunctionGraph
          fn={res.evaluateInner}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={1.8}
          strokeDasharray="4 3"
        />

        {/* 2. 复合终态函数 y = f(g(x)) 实线曲线 */}
        <FunctionGraph
          fn={res.evaluateComposite}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />

        {/* 3. 采样点 x = xSample 垂直传导导引线 */}
        {res.isValid &&
          ptDesignYInner !== null &&
          ptDesignYComposite !== null && (
            <line
              x1={ptDesignX}
              y1={scale.originY}
              x2={ptDesignX}
              y2={Math.min(ptDesignYInner, ptDesignYComposite)}
              stroke={withAlpha(MATH_COLORS.paramTertiary, 0.6)}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

        {/* 4. 内层点 P₁(x, u) */}
        {Number.isFinite(res.u) && (
          <MathPoint
            cx={xSample}
            cy={res.u}
            scale={scale}
            variant="focus"
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />
        )}

        {/* 5. 复合终值点 P₂(x, y) */}
        {res.isValid && Number.isFinite(res.y) && (
          <MathPoint
            cx={xSample}
            cy={res.y}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.function}
            fontScale={fontScale}
          />
        )}

        {/* 6. 交互采样控制点 P(x, 0) */}
        <InteractivePoint
          cx={xSample}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handleDragXSample}
          label={`x = ${xSample.toFixed(1)}`}
          labelKey="xSample"
          placedLabels={placedLabels}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />

        {/* 7. 外层映射小图 f(u)：独立坐标系，补齐传导链中「u → y」这一环。
              此前画布上只有 u = g(x)（画在主图 y 轴上，纵轴语义含混）与 y = f(g(x)) 两条曲线，
              学生看不到外层 f 自身的单调性与转折点，「同增异减」只能死记结论。
              小图自带 u 轴，并在其上标出当前 u = g(x) 与对应终值 f(u)：拖动主图动点 P 时，
              可见 u 沿小图横轴移动、y 沿曲线攀升，两图合成完整的 x → u → y 传导。 */}
        <g className="pointer-events-none">
          <rect
            x={outerInset.left}
            y={outerInset.top}
            width={OUTER_INSET.w}
            height={OUTER_INSET.h}
            rx={8}
            fill={MATH_COLORS.white}
            fillOpacity={0.96}
            stroke={MATH_COLORS.axis}
            strokeWidth={1}
          />
          <text
            x={outerInset.left + OUTER_INSET.pad}
            y={outerInset.top + 16}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.labelText}
          >
            外层映射 f(u) 的图象
          </text>

          {/* 小图自身的 u 轴与 y 轴（与主坐标系无缩放关系的第二套轴） */}
          <line
            x1={outerInset.origin.x}
            y1={outerInset.origin.y}
            x2={outerInset.uAxisEnd.x}
            y2={outerInset.uAxisEnd.y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.2}
          />
          <line
            x1={outerInset.origin.x}
            y1={outerInset.origin.y}
            x2={outerInset.yAxisEnd.x}
            y2={outerInset.yAxisEnd.y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.2}
          />
          <text
            x={outerInset.uAxisEnd.x - 2}
            y={outerInset.uAxisEnd.y + 13}
            textAnchor="end"
            fontSize={fontScale(11)}
            fontStyle="italic"
            fill={MATH_COLORS.textMuted}
          >
            u
          </text>
          <text
            x={outerInset.yAxisEnd.x + 5}
            y={outerInset.yAxisEnd.y + 8}
            fontSize={fontScale(11)}
            fontStyle="italic"
            fill={MATH_COLORS.textMuted}
          >
            y
          </text>
          {/* 小图原点是「第二套坐标系」的原点，标 O′ 以区别于主图原点的 O */}
          <text
            x={outerInset.origin.x - 5}
            y={outerInset.origin.y + 12}
            textAnchor="end"
            fontSize={fontScale(10)}
            fontStyle="italic"
            fill={MATH_COLORS.textMuted}
          >
            O′
          </text>

          {/* 外层映射曲线 f(u) 本体 */}
          <FunctionGraph
            fn={res.evaluateOuter}
            scale={outerInset.scale}
            color={MATH_COLORS.functionSecondary}
            strokeWidth={2}
            domain={
              outerType === "log" ? [0.001, outerInset.scale.xMax] : undefined
            }
          />

          {/* 当前 u 的传导落点：u 轴上取 u，上升到曲线上得 y = f(u)，再水平投影到 y 轴。
              投影线取 paramTertiary —— 与主图传导路径同一色，两图读作同一条链。
              u 跑出取景范围时如实说明，绝不把点钳回边缘冒充（那会让读数变成假的）。 */}
          {outerInset.inRange ? (
            <>
              <line
                x1={outerInset.markerOnUAxis.x}
                y1={outerInset.markerOnUAxis.y}
                x2={outerInset.markerU.x}
                y2={outerInset.markerU.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.2}
                strokeDasharray="3 3"
              />
              <line
                x1={outerInset.markerOnYAxis.x}
                y1={outerInset.markerOnYAxis.y}
                x2={outerInset.markerU.x}
                y2={outerInset.markerU.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.2}
                strokeDasharray="3 3"
              />
              <MathPoint
                cx={res.u}
                cy={res.y}
                scale={outerInset.scale}
                variant="focus"
                color={MATH_COLORS.functionSecondary}
                fontScale={fontScale}
              />
              <text
                x={outerInset.markerOnUAxis.x + 4}
                y={outerInset.markerOnUAxis.y - 4}
                fontSize={fontScale(10)}
                fill={MATH_COLORS.labelText}
              >
                u = {res.u.toFixed(1)}
              </text>
              <text
                x={outerInset.markerOnYAxis.x + 4}
                y={outerInset.markerOnYAxis.y - 4}
                fontSize={fontScale(10)}
                fill={MATH_COLORS.labelText}
              >
                y = {res.y.toFixed(1)}
              </text>
            </>
          ) : (
            <text
              x={outerInset.left + OUTER_INSET.pad}
              y={outerInset.top + OUTER_INSET.h - OUTER_INSET.pad}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.textMuted}
            >
              {res.isValid ? "u 已超出本图取景范围" : "u ≤ 0，对数外层无定义"}
            </text>
          )}
        </g>
      </g>
    );
  }
}
