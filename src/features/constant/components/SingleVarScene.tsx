import React, { useMemo, useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  Asymptote,
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
  MathPoint,
  TangentLine,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import {
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
  evalSepTransFn,
  evalSepTransDeriv,
  evalDirectTransFn,
  evalDirectTransDeriv,
  evalF,
  evalGParam,
  type TransModelKey,
} from "@/math/constant";
import { MATH_COLORS, withAlpha } from "@/theme";

interface SingleVarSceneProps {
  subMode: "sep" | "direct";
  logic: "always" | "exist";
  funModel: "quadratic" | "transcendent";
  transModel?: TransModelKey;
  showDerivative?: boolean;
  showTangent?: boolean;
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale?: (v: number) => number;
  onParamChange: (key: string, value: number) => void;
}

export const SingleVarScene: React.FC<SingleVarSceneProps> = ({
  subMode,
  logic,
  funModel,
  transModel = "ln_x_over_x",
  showDerivative = false,
  showTangent = false,
  params,
  scale,
  vp,
  fontScale = (v) => v,
  onParamChange,
}) => {
  const a = params.a ?? 1.2;
  const a_axis = params.a_axis ?? 1.0;
  const m = params.m ?? 0.5;
  const n = params.n ?? 2.5;

  const isSep = subMode === "sep";
  const isTrans = funModel === "transcendent";

  // 量词分流：右屏（builders/constantSingle.ts §sep）与 math 层均按「∀ ⇒ f_min / ∃ ⇒ f_max」
  // 分流判定，左屏亦提供 ∀/∃ 切换。中屏此前完全忽略 logic，导致 ∃ 模式下把 {f(x) < a}
  // 涂成「违背区间」而与右屏「满足条件」直接对撞。
  // 注意：直接讨论法分支的 builder 目前只有「f(x) ≥ 0 恒成立」单一口径（未接量词），
  // 故此处仅在参变分离法下响应 ∃，避免与右屏产生新的口径分叉。
  const existMode = isSep && logic === "exist";

  // 计算原函数值（超越模型一律走 math 层唯一事实源，禁止在此另行硬编码）
  const evalPrimaryFn = useCallback(
    (x: number): number => {
      if (isTrans) {
        return isSep
          ? evalSepTransFn(transModel, x)
          : evalDirectTransFn(transModel, x, a_axis);
      }
      return isSep ? evalF(x) : evalGParam(x, a_axis);
    },
    [isTrans, transModel, isSep, a_axis],
  );

  // 计算导函数值
  const evalDerivativeFn = (x: number): number => {
    if (isTrans) {
      return isSep
        ? evalSepTransDeriv(transModel, x)
        : evalDirectTransDeriv(transModel, x, a_axis);
    }
    return isSep ? 2 * x - 2 : 2 * x - 2 * a_axis;
  };

  // 计算结果（transModel 贯穿传入：画布与看板必定同解同一个函数）
  const sepResult = useMemo(() => {
    return isTrans
      ? solveConstantSingleSepTrans(a, m, n, transModel)
      : solveConstantSingleSep(a, m, n);
  }, [a, m, n, isTrans, transModel]);

  const directResult = useMemo(() => {
    return isTrans
      ? solveConstantSingleDirectTrans(a_axis, m, n, transModel)
      : solveConstantSingleDirect(a_axis, m, n);
  }, [a_axis, m, n, isTrans, transModel]);

  // 1. 拖拽回调
  const handleMDrag = (mathPt: { x: number; y: number }) => {
    onParamChange("m", Math.round(mathPt.x * 20) / 20);
  };

  const handleNDrag = (mathPt: { x: number; y: number }) => {
    onParamChange("n", Math.round(mathPt.x * 20) / 20);
  };

  const handleADrag = (mathPt: { x: number; y: number }) => {
    onParamChange("a", Math.round(mathPt.y * 20) / 20);
  };

  const handleAAxisDrag = (mathPt: { x: number; y: number }) => {
    onParamChange("a_axis", Math.round(mathPt.x * 20) / 20);
  };

  // 2. 坐标投射
  const ptM = mathToDesign(m, 0, scale);
  const ptN = mathToDesign(n, 0, scale);
  const isCollapsed = m >= n;

  // 极值标注避让
  const placedExtremumLabels = useMemo(() => {
    if (isCollapsed) return [];
    const entries: LabelEntry[] = [];
    if (isSep) {
      const ptMin = mathToDesign(sepResult.xFMin, sepResult.fMin, scale);
      const ptMax = mathToDesign(sepResult.xFMax, sepResult.fMax, scale);
      entries.push(
        {
          key: "min",
          text: `极小值 (${sepResult.xFMin.toFixed(2)}, ${sepResult.fMin.toFixed(2)})`,
          x: ptMin.x,
          y: ptMin.y,
          anchor: "middle",
          dy: -8,
        },
        {
          key: "max",
          text: `极大值 (${sepResult.xFMax.toFixed(2)}, ${sepResult.fMax.toFixed(2)})`,
          x: ptMax.x,
          y: ptMax.y,
          anchor: "middle",
          dy: -8,
        },
      );
    } else {
      const ptMin = mathToDesign(directResult.xFMin, directResult.fMin, scale);
      entries.push({
        key: "min",
        text: `极小值 (${directResult.xFMin.toFixed(2)}, ${directResult.fMin.toFixed(2)})`,
        x: ptMin.x,
        y: ptMin.y,
        anchor: "middle",
        dy: -8,
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [isSep, isCollapsed, sepResult, directResult, scale, fontScale]);

  // 控制点标注避让（m, n, a, a_axis）
  const placedPointLabels = useMemo(() => {
    const entries: LabelEntry[] = [
      {
        key: "m",
        text: "m",
        x: mathToDesign(m, 0, scale).x,
        y: mathToDesign(m, 0, scale).y,
        anchor: "middle",
        dy: -12,
      },
      {
        key: "n",
        text: "n",
        x: mathToDesign(n, 0, scale).x,
        y: mathToDesign(n, 0, scale).y,
        anchor: "middle",
        dy: -12,
      },
    ];
    if (isSep && !isCollapsed) {
      entries.push({
        key: "a",
        text: "a",
        x: mathToDesign((m + n) / 2, a, scale).x,
        y: mathToDesign((m + n) / 2, a, scale).y,
        anchor: "middle",
        dy: -12,
      });
    }
    if (!isSep && !isCollapsed) {
      const aX = isTrans && a_axis > 0 ? Math.log(a_axis) : a_axis;
      entries.push({
        key: "a_axis",
        text: isTrans ? "ln a" : "a",
        x: mathToDesign(aX, 0, scale).x,
        y: mathToDesign(aX, 0, scale).y,
        anchor: "middle",
        dy: -12,
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [m, n, a, a_axis, isSep, isCollapsed, isTrans, scale, fontScale]);

  // 3. 水平线 y = a (仅在 sep 模式)：标签带当前数值，拖拽 a 时实时跟随
  const sepHorizontalLine = useMemo(() => {
    if (!isSep || isCollapsed) return null;

    return (
      <Asymptote
        type="horizontal"
        value={a}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        label={`y = ${a.toFixed(1)}`}
        fontScale={fontScale}
      />
    );
  }, [isSep, a, scale, fontScale, isCollapsed]);

  // 4. 对称轴 / 极小值点
  const directAxisLine = useMemo(() => {
    if (isSep || isCollapsed) return null;
    if (isTrans) {
      if (a_axis <= 0) return null;
      const lna = Math.log(a_axis);
      return (
        <Asymptote
          type="vertical"
          value={lna}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          label="x = ln a (极小值点)"
          fontScale={fontScale}
        />
      );
    } else {
      return (
        <Asymptote
          type="vertical"
          value={a_axis}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          label="x = a (对称轴)"
          fontScale={fontScale}
        />
      );
    }
  }, [isSep, a_axis, scale, fontScale, isCollapsed, isTrans]);

  // 5. 参照线下方区域（量词分流）
  // ∀（恒成立）：曲线跌破参照线的那一段就是必须被消灭的「违背区间」——沿用警示色。
  // ∃（存在性）：判据只看峰值 f_max 是否够高，曲线低于参照线的部分不参与判定，
  //   故降级为中性弱化色并改写文案，严禁再出现「违背区间」字样（否则与右屏「满足条件」矛盾）。
  // 说明：math 层 maxViolationInterval 对多处违背仅返回最长的一段，
  //   因此这里不能靠「取补集」高亮 {f(x) ≥ a} 成立域（双穿越时补集会吞掉真实违背段）。
  const violatedVisuals = useMemo(() => {
    if (isCollapsed) return null;
    const violated = isSep
      ? sepResult.violatedInterval
      : directResult.violatedInterval;
    if (!violated) return null;

    const [vStart, vEnd] = violated;
    const refLabel = isSep ? `f(x) < ${a.toFixed(1)}` : "f(x) < 0";
    const zoneColor = existMode
      ? MATH_COLORS.textMuted
      : MATH_COLORS.degeneracy;

    return (
      <g>
        <IntervalShadow
          fn={evalPrimaryFn}
          x1={vStart}
          x2={vEnd}
          scale={scale}
          baseline={isSep ? { kind: "horizontal", y: a } : { kind: "axis" }}
          fillColor={withAlpha(zoneColor, 0.12)}
          strokeColor={zoneColor}
          strokeWidth={2}
        />
        <text
          x={mathToDesign((vStart + vEnd) / 2, 0, scale).x}
          y={mathToDesign(0, scale.yMin + 0.3, scale).y}
          textAnchor="middle"
          fill={zoneColor}
          fontSize={fontScale(10)}
          className="font-bold select-none"
        >
          {existMode
            ? `${refLabel}（不参与 ∃ 判定）`
            : `违背区间 (${refLabel})`}
        </text>
      </g>
    );
  }, [
    isSep,
    a,
    sepResult,
    directResult,
    scale,
    fontScale,
    isCollapsed,
    evalPrimaryFn,
    existMode,
  ]);

  // 6. ∃ 判据可视化：存在性只看「区间最大值够不够高」，与右屏「存在性状态 (f(x) ≥ a)」同源。
  // 把 f_max 的水平投影画成虚线段并与水平线 y = a 并列对照，达成 / 未达成用双色区分。
  const existCriterionVisuals = useMemo(() => {
    if (!existMode || isCollapsed || sepResult.isDegenerate) return null;

    const hold = sepResult.fMax >= a;
    const color = hold ? MATH_COLORS.setIntersection : MATH_COLORS.degeneracy;
    const yAtMax = mathToDesign(0, sepResult.fMax, scale).y;

    return (
      <g>
        <line
          x1={ptM.x}
          y1={yAtMax}
          x2={ptN.x}
          y2={yAtMax}
          stroke={color}
          strokeWidth={1.4}
          strokeDasharray="5 3"
        />
        <text
          x={ptN.x}
          y={yAtMax - 6}
          textAnchor="end"
          fill={color}
          fontSize={fontScale(10)}
          fontWeight="bold"
          className="select-none"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
        >
          {`f(x)max = ${sepResult.fMax.toFixed(2)} ${hold ? "≥" : "<"} a ${
            hold ? "⟹ 存在性成立" : "⟹ 存在性不成立"
          }`}
        </text>
      </g>
    );
  }, [existMode, isCollapsed, sepResult, a, scale, fontScale, ptM.x, ptN.x]);

  // 6.1 临界反馈的判据点：∀ 取最小值点，∃ 取最大值点
  const critX = existMode ? sepResult.xFMax : sepResult.xFMin;
  const critY = existMode ? sepResult.fMax : sepResult.fMin;

  return (
    <g>
      {/* 坐标轴背景 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 研究区间 [m, n] 底纹 */}
      {!isCollapsed && (
        <rect
          x={ptM.x}
          y={mathToDesign(0, scale.yMax, scale).y}
          width={Math.max(0, ptN.x - ptM.x)}
          height={Math.max(
            0,
            mathToDesign(0, scale.yMin, scale).y -
              mathToDesign(0, scale.yMax, scale).y,
          )}
          fill={withAlpha(MATH_COLORS.function, 0.04)}
          pointerEvents="none"
        />
      )}

      {/* 区间外虚线 */}
      <FunctionGraph
        fn={(x) => {
          if (isCollapsed) return NaN;
          return x < m || x > n ? evalPrimaryFn(x) : NaN;
        }}
        scale={scale}
        color={withAlpha(MATH_COLORS.function, 0.35)}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      {/* 区间内加粗实线 */}
      {!isCollapsed && (
        <FunctionGraph
          fn={(x) => (x >= m && x <= n ? evalPrimaryFn(x) : NaN)}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />
      )}

      {/* 导函数 f'(x) 轨迹（受控于 showDerivative） */}
      {showDerivative && !isCollapsed && (
        <g>
          <FunctionGraph
            fn={(x) => (x >= m && x <= n ? evalDerivativeFn(x) : NaN)}
            scale={scale}
            color={MATH_COLORS.derivative}
            strokeWidth={1.8}
            strokeDasharray="4 2"
          />
        </g>
      )}

      {/* 切线放缩辅助线（受控于 showTangent） */}
      {showTangent && (
        <g>
          {isTrans &&
            (transModel === "a_ln_x_minus_x" ||
              transModel === "exp_minus_a_x_plus_1") && (
              <TangentLine
                fn={evalPrimaryFn}
                x0={transModel === "a_ln_x_minus_x" ? 1.0 : 0.0}
                scale={scale}
                color={MATH_COLORS.tangentLine}
                strokeWidth={1.5}
              />
            )}
        </g>
      )}

      {/* 水平线与对称轴 */}
      {sepHorizontalLine}
      {directAxisLine}

      {/* 参照线下方区域 + ∃ 判据线 */}
      {violatedVisuals}
      {existCriterionVisuals}

      {/* 区间端点垂直虚线 */}
      {!isCollapsed && (
        <g>
          <line
            x1={ptM.x}
            y1={mathToDesign(m, scale.yMax, scale).y}
            x2={ptM.x}
            y2={mathToDesign(m, scale.yMin, scale).y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
          <line
            x1={ptN.x}
            y1={mathToDesign(n, scale.yMax, scale).y}
            x2={ptN.x}
            y2={mathToDesign(n, scale.yMin, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
        </g>
      )}

      {/* 可交互端点 m */}
      <InteractivePoint
        cx={m}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleMDrag}
        color={MATH_COLORS.paramSecondary}
        r={5.5}
        label="m"
        labelKey="m"
        placedLabels={placedPointLabels}
        fontScale={fontScale}
      />

      {/* 可交互端点 n */}
      <InteractivePoint
        cx={n}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleNDrag}
        color={MATH_COLORS.paramTertiary}
        r={5.5}
        label="n"
        labelKey="n"
        placedLabels={placedPointLabels}
        fontScale={fontScale}
      />

      {/* 水平线 dragging 点 */}
      {isSep && !isCollapsed && (
        <InteractivePoint
          cx={(m + n) / 2}
          cy={a}
          scale={scale}
          vp={vp}
          onDrag={handleADrag}
          color={MATH_COLORS.paramPrimary}
          r={6.5}
          label="a"
          labelKey="a"
          placedLabels={placedPointLabels}
          fontScale={fontScale}
        />
      )}

      {/* 对称轴/导数为零的点 dragging 点 */}
      {!isSep && !isCollapsed && (
        <InteractivePoint
          cx={isTrans && a_axis > 0 ? Math.log(a_axis) : a_axis}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handleAAxisDrag}
          color={MATH_COLORS.paramPrimary}
          r={6.5}
          label={isTrans ? "ln a" : "a"}
          labelKey="a_axis"
          placedLabels={placedPointLabels}
          fontScale={fontScale}
        />
      )}

      {/* 极值点学术化标注 */}
      {!isCollapsed && (
        <g>
          {isSep ? (
            <g>
              {/* 临界相切反馈：a 恰好压在临界最值上时，参照线与曲线在该点相切，
                  在切点处给非零几何载体（空心环）与正反馈文案。
                  判据点随量词切换：∀ 看最小值点，∃ 看最大值点（与右屏判据同源）。 */}
              {!sepResult.isDegenerate && Math.abs(a - critY) < 0.05 && (
                <g>
                  <circle
                    cx={mathToDesign(critX, critY, scale).x}
                    cy={mathToDesign(critX, critY, scale).y}
                    r={9}
                    fill="none"
                    stroke={MATH_COLORS.degeneracy}
                    strokeWidth={2}
                    strokeDasharray="3 2"
                  />
                  <text
                    x={mathToDesign(critX, critY, scale).x}
                    y={mathToDesign(critX, critY, scale).y + 24}
                    textAnchor="middle"
                    fill={MATH_COLORS.degeneracy}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                    className="select-none"
                    paintOrder="stroke"
                    stroke={MATH_COLORS.white}
                    strokeWidth={3}
                  >
                    {existMode
                      ? `临界：y = ${a.toFixed(1)} 恰过最大值点 (存在性分水岭)`
                      : `临界：y = ${a.toFixed(1)} 恰与曲线相切`}
                  </text>
                </g>
              )}
              <MathPoint
                cx={sepResult.xFMin}
                cy={sepResult.fMin}
                scale={scale}
                color={MATH_COLORS.function}
                variant="focus"
                label="极小值"
                labelKey="min"
                placedLabels={placedExtremumLabels}
                fontScale={fontScale}
              />
              <MathPoint
                cx={sepResult.xFMax}
                cy={sepResult.fMax}
                scale={scale}
                color={MATH_COLORS.derivative}
                variant="focus"
                label="极大值"
                labelKey="max"
                placedLabels={placedExtremumLabels}
                fontScale={fontScale}
              />
            </g>
          ) : (
            <g>
              <MathPoint
                cx={directResult.xFMin}
                cy={directResult.fMin}
                scale={scale}
                color={MATH_COLORS.function}
                variant="focus"
                label="极小值"
                labelKey="min"
                placedLabels={placedExtremumLabels}
                fontScale={fontScale}
              />
            </g>
          )}
        </g>
      )}
    </g>
  );
};
