import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
  TangentLine,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import {
  calculatePowerFunction,
  STANDARD_POWER_FUNCTIONS,
} from "@/math/function";

export interface PowerSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  mode?: "single" | "compare";
  showTangent?: boolean;
  showCompareLine?: boolean;
}

export function PowerScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  mode = "single",
  showTangent = false,
  showCompareLine = false,
}: PowerSceneProps) {
  const x0 = params.x0 ?? 1.5;
  const powerAlpha = params.powerAlpha ?? 2.0;

  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };

  const powerRes = useMemo(
    () => calculatePowerFunction(powerAlpha, x0),
    [powerAlpha, x0],
  );

  // 计算 x = 2 处的函数值 (用于指大图高对比)
  const valAtX2 = useMemo(() => {
    if (powerAlpha === 0) return 1;
    return Math.pow(2, powerAlpha);
  }, [powerAlpha]);

  // 组装智能避让学术标签组（转为设计坐标）
  const sceneLabelItems: LabelItem[] = useMemo(() => {
    const items: LabelItem[] = [];

    // 1. 公共定点 (1, 1) 标注 (高中必考定点)
    const fixedPt = mathToDesign(1, 1, scale);
    items.push({
      key: "fixed-point",
      text: "(1, 1)",
      x: fixedPt.x,
      y: fixedPt.y,
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: "bottom-left",
    });

    // 2. 动探究点 P 标注 (学术代号)
    if (powerRes.isValidPoint && Number.isFinite(powerRes.yVal)) {
      const pPt = mathToDesign(x0, powerRes.yVal, scale);
      items.push({
        key: "probe-point",
        text: "P",
        x: pPt.x,
        y: pPt.y,
        color: MATH_COLORS.function,
        preferredPlacement: "top",
      });

      // x 轴垂足与 y 轴垂足标签 (体现数形结合与自变量-函数值对应)
      if (Math.abs(powerRes.yVal) > 0.35) {
        const xFootPt = mathToDesign(x0, 0, scale);
        items.push({
          key: "foot-x0",
          text: "x₀",
          x: xFootPt.x,
          y: xFootPt.y,
          color: MATH_COLORS.labelText,
          preferredPlacement: "bottom",
        });
      }

      if (Math.abs(x0) > 0.35) {
        const yFootPt = mathToDesign(0, powerRes.yVal, scale);
        items.push({
          key: "foot-y0",
          text: "y₀",
          x: yFootPt.x,
          y: yFootPt.y,
          color: MATH_COLORS.labelText,
          preferredPlacement: "left",
        });
      }
    }

    // 3. 原点 O (当 α > 0 时为必过原点，偏移避免压轴)
    if (powerAlpha > 0) {
      const oPt = mathToDesign(-0.25, -0.28, scale);
      items.push({
        key: "origin-point",
        text: "O",
        x: oPt.x,
        y: oPt.y,
        color: MATH_COLORS.labelText,
        preferredPlacement: "bottom-left",
      });
    }

    // 4. α = 0 时的 (0, 1) 去心点说明
    if (powerAlpha === 0) {
      const hollowPt = mathToDesign(0, 1, scale);
      items.push({
        key: "hollow-0-1",
        text: "(0, 1) 去心",
        x: hollowPt.x,
        y: hollowPt.y,
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "top-left",
      });
    }

    // 5. 比大小参考线 x = 2 处的标示与交点
    if (showCompareLine) {
      const cmpPt = mathToDesign(2, -0.4, scale);
      items.push({
        key: "compare-x2",
        text: "x = 2",
        x: cmpPt.x,
        y: cmpPt.y,
        color: MATH_COLORS.axis,
        preferredPlacement: "bottom",
      });

      if (Number.isFinite(valAtX2) && valAtX2 <= 4.2 && valAtX2 >= -4.2) {
        const intersectPt = mathToDesign(2, valAtX2, scale);
        items.push({
          key: "intersect-x2",
          text: `y = ${valAtX2.toFixed(1)}`,
          x: intersectPt.x,
          y: intersectPt.y,
          color: MATH_COLORS.accent,
          preferredPlacement: "right",
        });
      }
    }

    // 6. 对比模式下 5 大基准曲线右侧特征标示 (使用标准 Unicode 规范字符)
    if (mode === "compare") {
      STANDARD_POWER_FUNCTIONS.forEach((item) => {
        if (item.alpha === powerAlpha) return; // 主曲线已有专门样式
        let sampleX = 2.4;
        if (item.alpha === 3) sampleX = 1.5;
        if (item.alpha === 2) sampleX = 1.8;
        if (item.alpha === -1) sampleX = 2.6;
        if (item.alpha === 0.5) sampleX = 2.8;
        const sampleY =
          item.alpha === -1
            ? 1 / sampleX
            : item.alpha === 0.5
              ? Math.sqrt(sampleX)
              : Math.pow(sampleX, item.alpha);
        if (sampleY <= 4.0 && sampleY >= 0.2) {
          const pt = mathToDesign(sampleX, sampleY, scale);
          items.push({
            key: `curve-${item.key}`,
            text: item.labelUnicode,
            x: pt.x,
            y: pt.y,
            color: item.colorToken,
            preferredPlacement: "top-right",
          });
        }
      });
    }

    return items;
  }, [powerRes, x0, powerAlpha, showCompareLine, valAtX2, mode, scale]);

  const activeCurveColor = useMemo(() => {
    if (mode === "compare") {
      const matched = STANDARD_POWER_FUNCTIONS.find(
        (p) => Math.abs(p.alpha - powerAlpha) < 1e-4,
      );
      return matched?.colorToken ?? MATH_COLORS.function;
    }
    return MATH_COLORS.function;
  }, [mode, powerAlpha]);

  return (
    <g>
      {/* 1. 纯净坐标网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 2. 比大小参考线 x = 2 (新高考高频技巧) */}
      {showCompareLine && (
        <>
          <line
            x1={scale.originX + 2 * scale.scaleX}
            y1={scale.originY - 5 * scale.scaleY}
            x2={scale.originX + 2 * scale.scaleX}
            y2={scale.originY + 4 * scale.scaleY}
            stroke={MATH_COLORS.axis}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            opacity={0.65}
          />
          {Number.isFinite(valAtX2) && valAtX2 <= 4.5 && valAtX2 >= -4.5 && (
            <MathPoint
              cx={2}
              cy={valAtX2}
              scale={scale}
              color={MATH_COLORS.accent}
              fontScale={fontScale}
              variant="focus"
              r={3.8}
            />
          )}
        </>
      )}

      {/* 3. 渐近线 (α < 0 时展示 x = 0 与 y = 0) */}
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

      {/* 4. 曲线渲染层 */}
      {mode === "compare" ? (
        <>
          {/* 5 大基准曲线族：当前选中项为粗实线，其余为辅助虚线 */}
          {STANDARD_POWER_FUNCTIONS.map((item) => {
            const isCurrent = Math.abs(item.alpha - powerAlpha) < 1e-4;
            return (
              <FunctionGraph
                key={item.key}
                fn={(x) => {
                  if (item.alpha === -1) {
                    if (Math.abs(x) < 1e-3) return NaN;
                    return 1 / x;
                  }
                  if (item.alpha === 0.5) {
                    if (x < 0) return NaN;
                    return Math.sqrt(x);
                  }
                  return Math.pow(x, item.alpha);
                }}
                scale={scale}
                color={item.colorToken}
                strokeWidth={isCurrent ? 3.2 : 1.6}
                strokeDasharray={isCurrent ? undefined : "4 3"}
              />
            );
          })}

          {/* 若当前为非 5 大基准的自定义指数，则额外绘制自定义主曲线 */}
          {!STANDARD_POWER_FUNCTIONS.some(
            (p) => Math.abs(p.alpha - powerAlpha) < 1e-4,
          ) && (
            <FunctionGraph
              fn={(x) => {
                if (powerAlpha === 0) return Math.abs(x) < 1e-4 ? NaN : 1;
                if (powerAlpha < 0) {
                  if (Math.abs(x) < 1e-3) return NaN;
                  if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
                  return Math.pow(x, powerAlpha);
                }
                if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
                return Math.pow(x, powerAlpha);
              }}
              scale={scale}
              color={MATH_COLORS.function}
              strokeWidth={3.2}
            />
          )}
        </>
      ) : (
        /* 自由单函数模式：仅绘制单一主函数曲线 */
        <FunctionGraph
          fn={(x) => {
            if (powerAlpha === 0) return Math.abs(x) < 1e-4 ? NaN : 1;
            if (powerAlpha < 0) {
              if (Math.abs(x) < 1e-3) return NaN;
              if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
              return Math.pow(x, powerAlpha);
            }
            if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
            return Math.pow(x, powerAlpha);
          }}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={3}
        />
      )}

      {/* 6. 动点 P 向 x 轴与 y 轴的垂直投影辅助虚线与垂足 */}
      {powerRes.isValidPoint && Number.isFinite(powerRes.yVal) && (
        <g opacity={0.65}>
          {/* P 向 x 轴垂线 */}
          <line
            x1={scale.originX + x0 * scale.scaleX}
            y1={scale.originY - powerRes.yVal * scale.scaleY}
            x2={scale.originX + x0 * scale.scaleX}
            y2={scale.originY}
            stroke={MATH_COLORS.labelText}
            strokeDasharray="3 3"
            strokeWidth={1.2}
          />
          <MathPoint
            cx={x0}
            cy={0}
            scale={scale}
            color={MATH_COLORS.labelText}
            fontScale={fontScale}
            variant="foot"
            r={2.8}
          />

          {/* P 向 y 轴垂线 */}
          <line
            x1={scale.originX + x0 * scale.scaleX}
            y1={scale.originY - powerRes.yVal * scale.scaleY}
            x2={scale.originX}
            y2={scale.originY - powerRes.yVal * scale.scaleY}
            stroke={MATH_COLORS.labelText}
            strokeDasharray="3 3"
            strokeWidth={1.2}
          />
          <MathPoint
            cx={0}
            cy={powerRes.yVal}
            scale={scale}
            color={MATH_COLORS.labelText}
            fontScale={fontScale}
            variant="foot"
            r={2.8}
          />
        </g>
      )}

      {/* 7. 切线辅助线 (当开启 showTangent 且可导时) */}
      {showTangent && powerRes.isTangentDifferentiable && (
        <TangentLine
          fn={(x) => {
            if (powerAlpha === 0) return Math.abs(x) < 1e-4 ? NaN : 1;
            if (powerAlpha < 0) {
              if (Math.abs(x) < 1e-3) return NaN;
              if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
              return Math.pow(x, powerAlpha);
            }
            if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
            return Math.pow(x, powerAlpha);
          }}
          x0={x0}
          scale={scale}
          color={MATH_COLORS.tangentLine}
          strokeWidth={2}
        />
      )}

      {/* 8. 公共定点 (1, 1) */}
      <MathPoint
        cx={1}
        cy={1}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        variant="solid"
        r={4.5}
      />

      {/* 9. 原点 (0, 0) (α > 0 为实心点，α = 0 为去心空心点) */}
      {powerAlpha > 0 && (
        <MathPoint
          cx={0}
          cy={0}
          scale={scale}
          color={MATH_COLORS.function}
          fontScale={fontScale}
          variant="solid"
          r={3.8}
        />
      )}
      {powerAlpha === 0 && (
        <MathPoint
          cx={0}
          cy={1}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
          variant="hollow"
          r={4.2}
        />
      )}

      {/* 10. 动态拖拽探究点 P(x0, y0) */}
      {powerRes.isValidPoint && Number.isFinite(powerRes.yVal) && (
        <InteractivePoint
          cx={x0}
          cy={powerRes.yVal}
          scale={scale}
          vp={vp}
          onDrag={handleDragX0}
          color={activeCurveColor}
          labelKey="P"
          fontScale={fontScale}
        />
      )}

      {/* 11. 智能 8 向防重叠避让点标图层 */}
      <SceneLabelGroup items={sceneLabelItems} fontScale={fontScale} />
    </g>
  );
}
