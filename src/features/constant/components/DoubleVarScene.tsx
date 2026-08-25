import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { solveConstantDouble } from "@/math/constant";
import { MATH_COLORS, withAlpha } from "@/theme";

interface DoubleVarSceneProps {
  selectedLogic:
    "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var";
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale?: (v: number) => number;
  onParamChange: (key: string, value: number) => void;
}

export const DoubleVarScene: React.FC<DoubleVarSceneProps> = ({
  selectedLogic,
  params,
  scale,
  vp,
  fontScale = (v) => v,
  onParamChange,
}) => {
  const yf = params.yf ?? 2.5;
  const xf = params.xf ?? 1.25;
  const yg = params.yg ?? 1.5;
  const xg = params.xg ?? 2.25;

  const mf = 0.5,
    nf = 2.0;
  const mg = 1.5,
    ng = 3.0;

  // 1. 求解计算层
  const res = useMemo(() => {
    return solveConstantDouble(yf, xf, mf, nf, yg, xg, mg, ng, selectedLogic);
  }, [yf, xf, yg, xg, selectedLogic]);

  // 2. 拖拽回调：改变抛物线顶点，实现 x 和 y 双向绑定
  const handleFVertexDrag = (mathPt: { x: number; y: number }) => {
    onParamChange(
      "xf",
      Math.max(0.5, Math.min(2.0, Math.round(mathPt.x * 20) / 20)),
    );
    onParamChange(
      "yf",
      Math.max(1.0, Math.min(4.0, Math.round(mathPt.y * 20) / 20)),
    );
  };

  const handleGVertexDrag = (mathPt: { x: number; y: number }) => {
    onParamChange(
      "xg",
      Math.max(1.5, Math.min(3.0, Math.round(mathPt.x * 20) / 20)),
    );
    onParamChange(
      "yg",
      Math.max(0.0, Math.min(3.0, Math.round(mathPt.y * 20) / 20)),
    );
  };

  // 3. 构建 f(x) 和 g(x) 表达式
  const evalFDouble = (x: number) => (x - xf) * (x - xf) + yf;
  const evalGDouble = (x: number) => -(x - xg) * (x - xg) + yg;

  // 4. 对垒两点各自的研究极值语义（使用规范高中数学符号，杜绝 f_min 下划线）
  const battleMeta = useMemo(() => {
    switch (selectedLogic) {
      case "all_all":
        return {
          fSymbol: "f_{min}",
          gSymbol: "g_{max}",
          fName: "f最小",
          gName: "g最大",
        };
      case "all_exist":
        return {
          fSymbol: "f_{min}",
          gSymbol: "g_{min}",
          fName: "f最小",
          gName: "g最小",
        };
      case "exist_all":
        return {
          fSymbol: "f_{max}",
          gSymbol: "g_{max}",
          fName: "f最大",
          gName: "g最大",
        };
      case "exist_exist":
        return {
          fSymbol: "f_{max}",
          gSymbol: "g_{min}",
          fName: "f最大",
          gName: "g最小",
        };
      case "same_var":
        return {
          fSymbol: "f(x_{min})",
          gSymbol: "g(x_{min})",
          fName: "f",
          gName: "g",
        };
    }
  }, [selectedLogic]);

  // 计算同变量违背区间：交集 [1.5, 2.0] 内 f(x) < g(x) 的部分
  const sameVarViolatedInterval = useMemo<[number, number] | null>(() => {
    if (selectedLogic !== "same_var") return null;
    const A = 2;
    const B = -2 * (xf + xg);
    const C = xf * xf + yf + xg * xg - yg;
    const delta = B * B - 4 * A * C;
    if (delta <= 0) return null;

    const sqrtDelta = Math.sqrt(delta);
    const r1 = (-B - sqrtDelta) / (2 * A);
    const r2 = (-B + sqrtDelta) / (2 * A);

    const vStart = Math.max(1.5, r1);
    const vEnd = Math.min(2.0, r2);
    return vStart < vEnd ? [vStart, vEnd] : null;
  }, [xf, yf, xg, yg, selectedLogic]);

  // 5. 标注避让：顶点控制点（仅使用学术字母 P₁ / P₂，严禁在点旁堆砌长坐标）
  const placedLabels = useMemo(() => {
    const ptFV = mathToDesign(xf, yf, scale);
    const ptGV = mathToDesign(xg, yg, scale);
    const entries: LabelEntry[] = [
      {
        key: "f_vertex",
        text: "P₁",
        x: ptFV.x,
        y: ptFV.y,
        anchor: "middle",
        dy: -12,
        priority: 1,
      },
      {
        key: "g_vertex",
        text: "P₂",
        x: ptGV.x,
        y: ptGV.y,
        anchor: "middle",
        dy: 14,
      },
    ];
    return avoidLabels(entries, { fontScale });
  }, [xf, yf, xg, yg, scale, fontScale]);

  // 设计坐标预计算
  const ptDecisionF = mathToDesign(
    res.battlePointF.x,
    res.battlePointF.y,
    scale,
  );
  const ptDecisionG = mathToDesign(
    res.battlePointG.x,
    res.battlePointG.y,
    scale,
  );
  const ptYAxisF = mathToDesign(0, res.battlePointF.y, scale);
  const ptYAxisG = mathToDesign(0, res.battlePointG.y, scale);

  // 顶点在 X 轴上的垂足设计坐标
  const ptAxisXF = mathToDesign(xf, 0, scale);
  const ptAxisXG = mathToDesign(xg, 0, scale);
  const ptFV = mathToDesign(xf, yf, scale);
  const ptGV = mathToDesign(xg, yg, scale);

  // 高度差计算（Δy = yF - yG）
  const deltaY = res.battlePointF.y - res.battlePointG.y;
  const isSatisfied = res.isCurrentLogicTrue;

  // 区间端点设计坐标
  const ptFStart = mathToDesign(mf, evalFDouble(mf), scale);
  const ptFEnd = mathToDesign(nf, evalFDouble(nf), scale);
  const ptGStart = mathToDesign(mg, evalGDouble(mg), scale);
  const ptGEnd = mathToDesign(ng, evalGDouble(ng), scale);
  const ptAxisFStart = mathToDesign(mf, 0, scale);
  const ptAxisFEnd = mathToDesign(nf, 0, scale);
  const ptAxisGStart = mathToDesign(mg, 0, scale);
  const ptAxisGEnd = mathToDesign(ng, 0, scale);

  // Y 轴值域柱设计坐标（x 固定在 y 轴两侧）
  const ptFValMin = mathToDesign(0, res.fMin, scale);
  const ptFValMax = mathToDesign(0, res.fMax, scale);
  const ptGValMin = mathToDesign(0, res.gMin, scale);
  const ptGValMax = mathToDesign(0, res.gMax, scale);

  return (
    <g>
      {/* 坐标轴背景（纯净高中数学坐标系） */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 顶点向 X 轴引出的对称轴垂线与垂足标记 */}
      <line
        x1={ptFV.x}
        y1={ptFV.y}
        x2={ptAxisXF.x}
        y2={ptAxisXF.y}
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.45)}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <circle
        cx={ptAxisXF.x}
        cy={ptAxisXF.y}
        r={2}
        fill={MATH_COLORS.paramPrimary}
      />
      <line
        x1={ptGV.x}
        y1={ptGV.y}
        x2={ptAxisXG.x}
        y2={ptAxisXG.y}
        stroke={withAlpha(MATH_COLORS.paramSecondary, 0.45)}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <circle
        cx={ptAxisXG.x}
        cy={ptAxisXG.y}
        r={2}
        fill={MATH_COLORS.paramSecondary}
      />

      {/* 2. 定义域区间垂足引线（符合高中作图：端点向 X 轴引垂线） */}
      {/* f(x) 定义域端点向 x 轴引垂线 */}
      <line
        x1={ptFStart.x}
        y1={ptFStart.y}
        x2={ptAxisFStart.x}
        y2={ptAxisFStart.y}
        stroke={withAlpha(MATH_COLORS.function, 0.35)}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={ptFEnd.x}
        y1={ptFEnd.y}
        x2={ptAxisFEnd.x}
        y2={ptAxisFEnd.y}
        stroke={withAlpha(MATH_COLORS.function, 0.35)}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* g(x) 定义域端点向 x 轴引垂线 */}
      <line
        x1={ptGStart.x}
        y1={ptGStart.y}
        x2={ptAxisGStart.x}
        y2={ptAxisGStart.y}
        stroke={withAlpha(MATH_COLORS.functionSecondary, 0.35)}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={ptGEnd.x}
        y1={ptGEnd.y}
        x2={ptAxisGEnd.x}
        y2={ptAxisGEnd.y}
        stroke={withAlpha(MATH_COLORS.functionSecondary, 0.35)}
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* X 轴下方的定义域区间线段标注 */}
      {/* I1 区间标尺 */}
      <line
        x1={ptAxisFStart.x}
        y1={ptAxisFStart.y + 12}
        x2={ptAxisFEnd.x}
        y2={ptAxisFEnd.y + 12}
        stroke={MATH_COLORS.function}
        strokeWidth={2}
      />
      <circle
        cx={ptAxisFStart.x}
        cy={ptAxisFStart.y + 12}
        r={2}
        fill={MATH_COLORS.function}
      />
      <circle
        cx={ptAxisFEnd.x}
        cy={ptAxisFEnd.y + 12}
        r={2}
        fill={MATH_COLORS.function}
      />
      <text
        x={(ptAxisFStart.x + ptAxisFEnd.x) / 2}
        y={ptAxisFStart.y + 24}
        textAnchor="middle"
        fill={MATH_COLORS.function}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        className="select-none"
      >
        I₁ = [0.5, 2.0]
      </text>

      {/* I2 区间标尺 */}
      <line
        x1={ptAxisGStart.x}
        y1={ptAxisGStart.y + 12}
        x2={ptAxisGEnd.x}
        y2={ptAxisGEnd.y + 12}
        stroke={MATH_COLORS.functionSecondary}
        strokeWidth={2}
      />
      <circle
        cx={ptAxisGStart.x}
        cy={ptAxisGStart.y + 12}
        r={2}
        fill={MATH_COLORS.functionSecondary}
      />
      <circle
        cx={ptAxisGEnd.x}
        cy={ptAxisGEnd.y + 12}
        r={2}
        fill={MATH_COLORS.functionSecondary}
      />
      <text
        x={(ptAxisGStart.x + ptAxisGEnd.x) / 2}
        y={ptAxisGStart.y + 24}
        textAnchor="middle"
        fill={MATH_COLORS.functionSecondary}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        className="select-none"
      >
        I₂ = [1.5, 3.0]
      </text>

      {/* 3. f(x) 抛物线绘制 */}
      {/* 区间外细虚线 */}
      <FunctionGraph
        fn={(x) => (x < mf || x > nf ? evalFDouble(x) : NaN)}
        scale={scale}
        color={withAlpha(MATH_COLORS.function, 0.3)}
        strokeWidth={1.2}
        strokeDasharray="3 3"
      />
      {/* 区间内加粗实线 */}
      <FunctionGraph
        fn={(x) => (x >= mf && x <= nf ? evalFDouble(x) : NaN)}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.8}
      />
      {/* f(x) 曲线标签 */}
      <text
        x={mathToDesign(0.6, evalFDouble(0.6), scale).x - 6}
        y={mathToDesign(0.6, evalFDouble(0.6), scale).y - 6}
        fill={MATH_COLORS.function}
        fontSize={fontScale(11)}
        fontWeight="bold"
        className="select-none"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={3}
      >
        y = f(x)
      </text>

      {/* 4. g(x) 抛物线绘制 */}
      {/* 区间外细虚线 */}
      <FunctionGraph
        fn={(x) => (x < mg || x > ng ? evalGDouble(x) : NaN)}
        scale={scale}
        color={withAlpha(MATH_COLORS.functionSecondary, 0.3)}
        strokeWidth={1.2}
        strokeDasharray="3 3"
      />
      {/* 区间内加粗实线 */}
      <FunctionGraph
        fn={(x) => (x >= mg && x <= ng ? evalGDouble(x) : NaN)}
        scale={scale}
        color={MATH_COLORS.functionSecondary}
        strokeWidth={2.8}
      />
      {/* g(x) 曲线标签 */}
      <text
        x={mathToDesign(2.85, evalGDouble(2.85), scale).x + 6}
        y={mathToDesign(2.85, evalGDouble(2.85), scale).y - 6}
        fill={MATH_COLORS.functionSecondary}
        fontSize={fontScale(11)}
        fontWeight="bold"
        className="select-none"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={3}
      >
        y = g(x)
      </text>

      {/* 5. Y 轴上的值域区间投影柱（高中最值与值域核心表达范式） */}
      {/* f(x) 在 Y 轴左侧的值域条 */}
      <line
        x1={ptYAxisF.x - 6}
        y1={ptFValMin.y}
        x2={ptYAxisF.x - 6}
        y2={ptFValMax.y}
        stroke={MATH_COLORS.function}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {/* g(x) 在 Y 轴右侧的值域条 */}
      <line
        x1={ptYAxisG.x + 6}
        y1={ptGValMin.y}
        x2={ptYAxisG.x + 6}
        y2={ptGValMax.y}
        stroke={MATH_COLORS.functionSecondary}
        strokeWidth={3.5}
        strokeLinecap="round"
      />

      {/* 6. 双变量模式：决策点向 Y 轴引水平辅助虚线与高度差标尺 */}
      {selectedLogic !== "same_var" && (
        <g>
          {/* f 决策点向 Y 轴的水平投影虚线 */}
          <line
            x1={ptDecisionF.x}
            y1={ptDecisionF.y}
            x2={ptYAxisF.x - 6}
            y2={ptYAxisF.y}
            stroke={withAlpha(MATH_COLORS.function, 0.6)}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
          {/* g 决策点向 Y 轴的水平投影虚线 */}
          <line
            x1={ptDecisionG.x}
            y1={ptDecisionG.y}
            x2={ptYAxisG.x + 6}
            y2={ptYAxisG.y}
            stroke={withAlpha(MATH_COLORS.functionSecondary, 0.6)}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />

          {/* Y 轴上的决策投影点标 */}
          <circle
            cx={ptYAxisF.x - 6}
            cy={ptYAxisF.y}
            r={3.2}
            fill={MATH_COLORS.function}
          />
          <circle
            cx={ptYAxisG.x + 6}
            cy={ptYAxisG.y}
            r={3.2}
            fill={MATH_COLORS.functionSecondary}
          />

          {/* Y 轴决策高度文本标注 */}
          <text
            x={ptYAxisF.x - 12}
            y={ptYAxisF.y + 4}
            textAnchor="end"
            fill={MATH_COLORS.function}
            fontSize={fontScale(9.5)}
            fontWeight="bold"
            className="select-none"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={2.5}
          >
            {battleMeta.fName} {res.battlePointF.y.toFixed(2)}
          </text>
          <text
            x={ptYAxisG.x + 12}
            y={ptYAxisG.y + 4}
            textAnchor="start"
            fill={MATH_COLORS.functionSecondary}
            fontSize={fontScale(9.5)}
            fontWeight="bold"
            className="select-none"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={2.5}
          >
            {battleMeta.gName} {res.battlePointG.y.toFixed(2)}
          </text>

          {/* Y 轴两侧高度差比较标尺（高中正统高低判定） */}
          <g>
            {/* 标尺竖线 */}
            <line
              x1={ptYAxisF.x - 22}
              y1={ptYAxisF.y}
              x2={ptYAxisF.x - 22}
              y2={ptYAxisG.y}
              stroke={
                isSatisfied ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
              }
              strokeWidth={2}
            />
            {/* 上下端点刻度短横线 */}
            <line
              x1={ptYAxisF.x - 26}
              y1={ptYAxisF.y}
              x2={ptYAxisF.x - 18}
              y2={ptYAxisF.y}
              stroke={
                isSatisfied ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
              }
              strokeWidth={2}
            />
            <line
              x1={ptYAxisF.x - 26}
              y1={ptYAxisG.y}
              x2={ptYAxisF.x - 18}
              y2={ptYAxisG.y}
              stroke={
                isSatisfied ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
              }
              strokeWidth={2}
            />
            {/* 高度差结论文本 */}
            <text
              x={ptYAxisF.x - 28}
              y={(ptYAxisF.y + ptYAxisG.y) / 2 + 4}
              textAnchor="end"
              fill={
                isSatisfied ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
              }
              fontSize={fontScale(10)}
              fontWeight="bold"
              className="select-none"
              paintOrder="stroke"
              stroke="white"
              strokeWidth={3}
            >
              Δy = {deltaY.toFixed(2)}{" "}
              {isSatisfied ? "≥ 0 (成立)" : "< 0 (违背)"}
            </text>
          </g>
        </g>
      )}

      {/* 7. 同自变量模式（same_var）：同 X 处的垂直差函数线段 */}
      {selectedLogic === "same_var" && (
        <g>
          {/* 公共交集 [1.5, 2.0] 特殊边框 */}
          <rect
            x={mathToDesign(1.5, 0, scale).x}
            y={mathToDesign(0, scale.yMax, scale).y}
            width={
              mathToDesign(2.0, 0, scale).x - mathToDesign(1.5, 0, scale).x
            }
            height={
              mathToDesign(0, scale.yMin, scale).y -
              mathToDesign(0, scale.yMax, scale).y
            }
            fill={withAlpha(
              res.isSameVarTrue
                ? MATH_COLORS.inequality
                : MATH_COLORS.degeneracy,
              0.04,
            )}
            stroke={
              res.isSameVarTrue
                ? MATH_COLORS.inequality
                : MATH_COLORS.degeneracy
            }
            strokeWidth={1.5}
            strokeDasharray="4 4"
            pointerEvents="none"
          />

          {/* 最危险点垂直差值高度线（同一 x=xmin 处的高度差） */}
          <line
            x1={ptDecisionF.x}
            y1={ptDecisionF.y}
            x2={ptDecisionG.x}
            y2={ptDecisionG.y}
            stroke={
              res.isSameVarTrue
                ? MATH_COLORS.inequality
                : MATH_COLORS.degeneracy
            }
            strokeWidth={2.5}
          />
          {/* 上下端点 */}
          <circle
            cx={ptDecisionF.x}
            cy={ptDecisionF.y}
            r={3.2}
            fill={MATH_COLORS.function}
          />
          <circle
            cx={ptDecisionG.x}
            cy={ptDecisionG.y}
            r={3.2}
            fill={MATH_COLORS.functionSecondary}
          />

          {/* 差函数最值标注 */}
          <text
            x={ptDecisionF.x + 8}
            y={(ptDecisionF.y + ptDecisionG.y) / 2 + 4}
            textAnchor="start"
            fill={
              res.isSameVarTrue
                ? MATH_COLORS.inequality
                : MATH_COLORS.degeneracy
            }
            fontSize={fontScale(10)}
            fontWeight="bold"
            className="select-none"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            h(x)_{"{min}"} = {(res.sameVarMinDiff ?? 0).toFixed(2)}{" "}
            {res.isSameVarTrue ? "≥ 0" : "< 0"}
          </text>

          {/* 违背区间阴影（若有） */}
          {sameVarViolatedInterval && (
            <g>
              <IntervalShadow
                fn={evalFDouble}
                x1={sameVarViolatedInterval[0]}
                x2={sameVarViolatedInterval[1]}
                scale={scale}
                fillColor={withAlpha(MATH_COLORS.degeneracy, 0.12)}
                strokeColor={MATH_COLORS.degeneracy}
                strokeWidth={1.5}
              />
              <IntervalShadow
                fn={evalGDouble}
                x1={sameVarViolatedInterval[0]}
                x2={sameVarViolatedInterval[1]}
                scale={scale}
                fillColor={withAlpha(MATH_COLORS.degeneracy, 0.05)}
                strokeColor={MATH_COLORS.degeneracy}
                strokeWidth={1.5}
              />
              <text
                x={
                  mathToDesign(
                    (sameVarViolatedInterval[0] + sameVarViolatedInterval[1]) /
                      2,
                    0,
                    scale,
                  ).x
                }
                y={mathToDesign(0, scale.yMin + 0.3, scale).y}
                textAnchor="middle"
                fill={MATH_COLORS.degeneracy}
                fontSize={fontScale(10)}
                className="font-bold select-none"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
              >
                违背区间 [{sameVarViolatedInterval[0].toFixed(2)},{" "}
                {sameVarViolatedInterval[1].toFixed(2)}]
              </text>
            </g>
          )}
        </g>
      )}

      {/* 8. 博弈决策特征点（MathPoint 高亮指示参与比较的关键点） */}
      <MathPoint
        cx={res.battlePointF.x}
        cy={res.battlePointF.y}
        scale={scale}
        variant="focus"
        color={MATH_COLORS.function}
        r={3.8}
      />
      <MathPoint
        cx={res.battlePointG.x}
        cy={res.battlePointG.y}
        scale={scale}
        variant="focus"
        color={MATH_COLORS.functionSecondary}
        r={3.8}
      />

      {/* 9. f(x) 可拖拽顶点控制点 */}
      <InteractivePoint
        cx={xf}
        cy={yf}
        scale={scale}
        vp={vp}
        onDrag={handleFVertexDrag}
        color={MATH_COLORS.paramPrimary}
        r={6}
        label="P₁"
        labelKey="f_vertex"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />

      {/* 10. g(x) 可拖拽顶点控制点 */}
      <InteractivePoint
        cx={xg}
        cy={yg}
        scale={scale}
        vp={vp}
        onDrag={handleGVertexDrag}
        color={MATH_COLORS.paramSecondary}
        r={6}
        label="P₂"
        labelKey="g_vertex"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />
    </g>
  );
};
