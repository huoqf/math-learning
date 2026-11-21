import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  MathPoint,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  checkParamKBounding,
  PARAM_K_SLOPE_RANGE,
  PARAM_K_PROBE_X_RANGE,
} from "@/math/tangentScaling";
import type { ParamKSubModel } from "@/data/registries/tangentScaling";
import { clipFn } from "./clipFn";
import type { TangentSceneBaseProps } from "./types";

interface TangentParamKSceneProps extends TangentSceneBaseProps {
  paramKSubModel: ParamKSubModel;
}

/** 模式 3：过定点动直线旋转卡位求参（含数据解算 + 避让点标 + 渲染） */
export function TangentParamKScene({
  params,
  paramKSubModel,
  scale,
  vp,
  fontScale,
  activeStep = 0,
  onParamChange,
}: TangentParamKSceneProps) {
  const regionOpacity = (r: number) =>
    !activeStep ? 1 : activeStep === r ? 1 : 0.3;
  const paramKData = useMemo(() => {
    const k = params.k;
    const evalRes = checkParamKBounding(k, params.evalX, paramKSubModel);
    const expFn = (x: number) => Math.exp(x);
    const logFn = (x: number) => (x > 0.02 ? Math.log(x) : -10);
    const lineFn = (x: number) => k * x;

    // 临界切线
    const expCritLineFn = (x: number) => Math.E * x;
    const logCritLineFn = (x: number) => (1 / Math.E) * x;

    const showExp = paramKSubModel !== "log_kx_origin";
    const showLog = paramKSubModel !== "exp_kx_origin";

    return {
      expFn,
      logFn,
      lineFn,
      expCritLineFn,
      logCritLineFn,
      evalRes,
      showExp,
      showLog,
    };
  }, [params.k, params.evalX, paramKSubModel]);

  // 斜率手柄锚定：固定目标纵坐标（可见域上部约 45%，且不超过 y=2.8），
  // 由 k 反推横坐标。原实现写死 (2.2, 2.2k)，k>2.7 时纵坐标超出可见域上限 6，
  // 手柄消失导致无法继续拖拽调 k
  const kHandleY = Math.min(scale.yMax * 0.45, 2.8);
  const kHandleX = Math.min(
    Math.max(kHandleY / Math.max(params.k, 0.1), 0.5),
    Math.max(scale.xMax - 0.8, 0.5),
  );

  // 智能避让点标收集
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    if (paramKData.showExp) {
      const ptA = mathToDesign(1, Math.E, scale);
      items.push({
        key: "pt-crit-exp",
        x: ptA.x,
        y: ptA.y,
        text: "A",
        color: MATH_COLORS.primary,
        preferredPlacement: "left",
      });
    }
    if (paramKData.showLog) {
      const ptB = mathToDesign(Math.E, 1, scale);
      items.push({
        key: "pt-crit-log",
        x: ptB.x,
        y: ptB.y,
        text: "B",
        color: MATH_COLORS.secondary,
        preferredPlacement: "bottom-right",
      });
    }

    // 1. 动直线斜率旋转手柄 Q：标签锚定在手柄实际坐标 (kHandleX, kHandleY)，
    // 与下方 InteractivePoint 完全同源。原实现按旧公式写死 (2.2, 2.2k)，
    // k 较大时标签纵坐标飞出可见域（yMax=6），与留在画布内的手柄脱节
    const ptSlope = mathToDesign(kHandleX, kHandleY, scale);
    items.push({
      key: "pt-slope-k",
      x: ptSlope.x,
      y: ptSlope.y,
      text: "Q",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: "top-left",
    });

    // 2. 动直线上的检验动点 P
    const ptK = mathToDesign(params.evalX, params.k * params.evalX, scale);
    items.push({
      key: "pt-eval-k",
      x: ptK.x,
      y: ptK.y,
      text: "P",
      color: MATH_COLORS.paramSecondary,
      preferredPlacement: "bottom-right",
    });

    return items;
  }, [paramKData, params.k, params.evalX, scale, kHandleX, kHandleY]);

  const ex = params.evalX;
  const yLine = params.k * ex;
  const yExp = Math.exp(ex);
  const yLog = ex > 0.02 ? Math.log(ex) : -10;
  const pLine = mathToDesign(ex, yLine, scale);
  const isDual = paramKSubModel === "exp_log_k";

  const targetY = paramKSubModel === "log_kx_origin" ? yLog : yExp;
  const pTarget = mathToDesign(ex, targetY, scale);
  const pExp = mathToDesign(ex, yExp, scale);
  const pLog = mathToDesign(ex, yLog, scale);

  const clampFrame = (x: number, y: number, w: number, h: number) => {
    const pad = 10;
    const minX = vp.designLeft + pad;
    const maxX = vp.designLeft + vp.designVisibleW - w - pad;
    const minY = vp.designTop + pad;
    const maxY = vp.designTop + vp.designVisibleH - h - pad;
    const cx = Math.max(minX, Math.min(x, Math.max(minX, maxX)));
    const cy = Math.max(minY, Math.min(y, Math.max(minY, maxY)));
    return { x: cx, y: cy, width: w, height: h };
  };

  const stepFrame = (() => {
    if (!activeStep) return null;
    if (activeStep === 1) {
      const ptA = mathToDesign(1, Math.E, scale);
      return paramKData.showExp
        ? clampFrame(ptA.x - 130, ptA.y - 90, 260, 180)
        : clampFrame(
            vp.designLeft + 30,
            vp.designTop + 30,
            vp.designVisibleW - 60,
            vp.designVisibleH - 60,
          );
    }
    if (activeStep === 2) {
      const ptFocus = paramKData.showLog
        ? mathToDesign(Math.E, 1, scale)
        : mathToDesign(1, Math.E, scale);
      return clampFrame(ptFocus.x - 135, ptFocus.y - 95, 270, 190);
    }
    return clampFrame(
      Math.min(pLine.x, pTarget.x) - 90,
      Math.min(pLine.y, pTarget.y, pExp.y, pLog.y) - 50,
      240,
      Math.max(150, Math.abs(pExp.y - pLog.y) + 100),
    );
  })();

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 第 1 步：指数曲线与临界相切位置 */}
      <g data-step-region={1} opacity={regionOpacity(1)}>
        {paramKData.showExp && (
          <>
            <FunctionGraph
              fn={clipFn(paramKData.expFn, [-4, 2.5])}
              scale={scale}
              color={MATH_COLORS.primary}
              strokeWidth={2.5}
            />
            <FunctionGraph
              fn={clipFn(paramKData.expCritLineFn, [0, 3.0])}
              scale={scale}
              color={withAlpha(MATH_COLORS.primary, 0.4)}
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <MathPoint
              cx={1}
              cy={Math.E}
              scale={scale}
              color={MATH_COLORS.primary}
              fontScale={fontScale}
            />
          </>
        )}
        <MathPoint
          cx={0}
          cy={0}
          scale={scale}
          color={MATH_COLORS.line}
          fontScale={fontScale}
        />
      </g>

      {/* 第 2 步：对数曲线与过原点临界斜率 */}
      <g data-step-region={2} opacity={regionOpacity(2)}>
        {paramKData.showLog && (
          <>
            <FunctionGraph
              fn={clipFn(paramKData.logFn, [0.02, 5.0])}
              scale={scale}
              color={MATH_COLORS.secondary}
              strokeWidth={2.5}
            />
            <FunctionGraph
              fn={clipFn(paramKData.logCritLineFn, [0, 5.0])}
              scale={scale}
              color={withAlpha(MATH_COLORS.secondary, 0.4)}
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <MathPoint
              cx={Math.E}
              cy={1}
              scale={scale}
              color={MATH_COLORS.secondary}
              fontScale={fontScale}
            />
          </>
        )}
      </g>

      {/* 第 3 步：旋转动直线 y = kx 与检验点垂直位置范围 */}
      <g data-step-region={3} opacity={regionOpacity(3)}>
        <FunctionGraph
          fn={clipFn(paramKData.lineFn, [0, 4.5])}
          scale={scale}
          color={
            paramKData.evalRes.isSafe
              ? MATH_COLORS.paramTertiary
              : MATH_COLORS.highlight
          }
          strokeWidth={2.2}
        />

        <InteractivePoint
          cx={kHandleX}
          cy={kHandleY}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
          onDrag={({ x, y }) => {
            const effX = Math.max(0.5, x);
            const newK = Math.max(
              PARAM_K_SLOPE_RANGE[0],
              Math.min(PARAM_K_SLOPE_RANGE[1], y / effX),
            );
            onParamChange("k", Math.round(newK * 100) / 100);
          }}
        />

        {isDual ? (
          <g>
            <line
              x1={pExp.x}
              y1={pExp.y}
              x2={pLog.x}
              y2={pLog.y}
              stroke={MATH_COLORS.accent}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <MathPoint
              cx={ex}
              cy={yExp}
              scale={scale}
              color={MATH_COLORS.primary}
              fontScale={fontScale}
            />
            <MathPoint
              cx={ex}
              cy={yLog}
              scale={scale}
              color={MATH_COLORS.secondary}
              fontScale={fontScale}
            />
            <InteractivePoint
              axis="x"
              xRange={PARAM_K_PROBE_X_RANGE}
              cx={ex}
              cy={yLine}
              scale={scale}
              vp={vp}
              color={MATH_COLORS.paramSecondary}
              fontScale={fontScale}
              onChangeX={(x) => onParamChange("evalX", x)}
            />
          </g>
        ) : (
          <g>
            <line
              x1={pLine.x}
              y1={pLine.y}
              x2={pTarget.x}
              y2={pTarget.y}
              stroke={MATH_COLORS.accent}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <MathPoint
              cx={ex}
              cy={targetY}
              scale={scale}
              color={
                paramKSubModel === "log_kx_origin"
                  ? MATH_COLORS.secondary
                  : MATH_COLORS.primary
              }
              fontScale={fontScale}
            />
            <InteractivePoint
              axis="x"
              xRange={PARAM_K_PROBE_X_RANGE}
              cx={ex}
              cy={yLine}
              scale={scale}
              vp={vp}
              color={MATH_COLORS.paramSecondary}
              fontScale={fontScale}
              onChangeX={(x) => onParamChange("evalX", x)}
            />
          </g>
        )}
      </g>

      {stepFrame && (
        <rect
          x={stepFrame.x}
          y={stepFrame.y}
          width={stepFrame.width}
          height={stepFrame.height}
          rx={8}
          fill="none"
          stroke={MATH_COLORS.answerStepFrame}
          strokeWidth={2}
          strokeDasharray="7 4"
          className="pointer-events-none"
        />
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
}
