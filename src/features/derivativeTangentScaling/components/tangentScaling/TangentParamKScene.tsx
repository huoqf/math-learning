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
import { checkParamKBounding } from "@/math/tangentScaling";
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
  onParamChange,
}: TangentParamKSceneProps) {
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

    // 1. 动直线斜率旋转手柄 Q_k(2.2, 2.2k)
    const slopeRefX = 2.2;
    const ptSlope = mathToDesign(slopeRefX, params.k * slopeRefX, scale);
    items.push({
      key: "pt-slope-k",
      x: ptSlope.x,
      y: ptSlope.y,
      text: "Q_k",
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
  }, [paramKData, params.k, params.evalX, scale]);

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

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 指数曲线 e^x (单侧/双侧) */}
      {paramKData.showExp && (
        <>
          <FunctionGraph
            fn={clipFn(paramKData.expFn, [-4, 2.5])}
            scale={scale}
            color={MATH_COLORS.primary}
            strokeWidth={2.5}
          />
          {/* 临界上切线 y = ex */}
          <FunctionGraph
            fn={clipFn(paramKData.expCritLineFn, [0, 3.0])}
            scale={scale}
            color={withAlpha(MATH_COLORS.primary, 0.4)}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
          {/* 临界切点 A(1,e) */}
          <MathPoint
            cx={1}
            cy={Math.E}
            scale={scale}
            color={MATH_COLORS.primary}
            fontScale={fontScale}
          />
        </>
      )}

      {/* 对数曲线 ln x (单侧/双侧) */}
      {paramKData.showLog && (
        <>
          <FunctionGraph
            fn={clipFn(paramKData.logFn, [0.02, 5.0])}
            scale={scale}
            color={MATH_COLORS.secondary}
            strokeWidth={2.5}
          />
          {/* 临界下切线 y = (1/e)x */}
          <FunctionGraph
            fn={clipFn(paramKData.logCritLineFn, [0, 5.0])}
            scale={scale}
            color={withAlpha(MATH_COLORS.secondary, 0.4)}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
          {/* 临界切点 B(e,1) */}
          <MathPoint
            cx={Math.E}
            cy={1}
            scale={scale}
            color={MATH_COLORS.secondary}
            fontScale={fontScale}
          />
        </>
      )}

      {/* 旋转动直线 y = kx */}
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

      {/* 旋转中心原点 O(0,0) */}
      <MathPoint
        cx={0}
        cy={0}
        scale={scale}
        color={MATH_COLORS.line}
        fontScale={fontScale}
      />

      {/* 动直线斜率旋转手柄 Q_k (专职调节斜率 k，鲜红色与左屏 k 滑块 100% 绑定) */}
      <InteractivePoint
        cx={2.2}
        cy={2.2 * params.k}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        onDrag={({ x, y }) => {
          const effX = Math.max(0.5, x);
          const newK = Math.max(0.1, Math.min(3.5, y / effX));
          onParamChange("k", Math.round(newK * 100) / 100);
        }}
      />

      {/* 检验点 evalX 垂直连线与横向探针交互手柄 */}
      {isDual ? (
        <g>
          {/* 双侧贯通垂直指示虚线 (ln x 到 e^x) */}
          <line
            x1={pExp.x}
            y1={pExp.y}
            x2={pLog.x}
            y2={pLog.y}
            stroke={MATH_COLORS.accent}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          {/* 上交点 e^x */}
          <MathPoint
            cx={ex}
            cy={yExp}
            scale={scale}
            color={MATH_COLORS.primary}
            fontScale={fontScale}
          />
          {/* 下交点 ln x */}
          <MathPoint
            cx={ex}
            cy={yLog}
            scale={scale}
            color={MATH_COLORS.secondary}
            fontScale={fontScale}
          />
          {/* 动直线上的检验探针手柄 P */}
          <InteractivePoint
            axis="x"
            xRange={[0.2, 3.0]}
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
          {/* 动直线上的检验探针手柄 P */}
          <InteractivePoint
            axis="x"
            xRange={[0.2, 3.0]}
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

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
}
