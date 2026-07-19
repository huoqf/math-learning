import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  VectorArrow,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
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

  // 4. 定位与比较
  const ptFMin = mathToDesign(res.xFMin, res.fMin, scale);
  const ptGMax = mathToDesign(res.xGMax, res.gMax, scale);

  // 5. 对垒博弈箭头的文本
  const arrowLabel = useMemo(() => {
    const symbolStr = res.isCurrentLogicTrue ? "≥" : "<";
    return `${res.battlePointF.y.toFixed(2)} ${symbolStr} ${res.battlePointG.y.toFixed(2)}`;
  }, [res]);

  // 计算同变量违背区间：交集 [1.5, 2.0] 内 f(x) < g(x) 的部分
  const sameVarViolatedInterval = useMemo<[number, number] | null>(() => {
    if (selectedLogic !== "same_var") return null;
    // 解 2x^2 - 2(xf + xg)x + (xf^2 + yf + xg^2 - yg) < 0
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

  // 计算对垒标注文字碰撞避让偏移
  const { battleLabelOffsetYF, battleLabelOffsetYG } = useMemo(() => {
    const ptF = mathToDesign(res.battlePointF.x, res.battlePointF.y, scale);
    const ptG = mathToDesign(res.battlePointG.x, res.battlePointG.y, scale);
    const dx = Math.abs(ptF.x - ptG.x);
    const dy = Math.abs(ptF.y - ptG.y);

    if (dx < 60 && dy < 18) {
      // 较低点 (SVG y 较大，即数学高度较低者) 往下偏，较高点 往上偏
      const fIsLower = ptF.y > ptG.y;
      return {
        battleLabelOffsetYF: fIsLower ? 12 : -10,
        battleLabelOffsetYG: fIsLower ? -10 : 12,
      };
    }
    return {
      battleLabelOffsetYF: -4,
      battleLabelOffsetYG: -4,
    };
  }, [res.battlePointF, res.battlePointG, scale]);

  // 6. 对垒两点各自的研究极值语义
  const battleLabels = useMemo(() => {
    let fText = "";
    let gText = "";
    switch (selectedLogic) {
      case "all_all":
        fText = "f_min";
        gText = "g_max";
        break;
      case "all_exist":
        fText = "f_min";
        gText = "g_min";
        break;
      case "exist_all":
        fText = "f_max";
        gText = "g_max";
        break;
      case "exist_exist":
        fText = "f_max";
        gText = "g_min";
        break;
      case "same_var":
        fText = "f";
        gText = "g";
        break;
    }
    return { fText, gText };
  }, [selectedLogic]);

  return (
    <g>
      {/* 坐标轴背景 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 区间 I1 的底纹遮罩与端点虚线 */}
      <rect
        x={mathToDesign(mf, 0, scale).x}
        y={mathToDesign(0, scale.yMax, scale).y}
        width={mathToDesign(nf, 0, scale).x - mathToDesign(mf, 0, scale).x}
        height={
          mathToDesign(0, scale.yMin, scale).y -
          mathToDesign(0, scale.yMax, scale).y
        }
        fill={withAlpha(MATH_COLORS.function, 0.03)}
        pointerEvents="none"
      />
      <line
        x1={mathToDesign(mf, 0, scale).x}
        y1={mathToDesign(0, scale.yMax, scale).y}
        x2={mathToDesign(mf, 0, scale).x}
        y2={mathToDesign(0, scale.yMin, scale).y}
        stroke={MATH_COLORS.asymptote}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <line
        x1={mathToDesign(nf, 0, scale).x}
        y1={mathToDesign(0, scale.yMax, scale).y}
        x2={mathToDesign(nf, 0, scale).x}
        y2={mathToDesign(0, scale.yMin, scale).y}
        stroke={MATH_COLORS.asymptote}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <text
        x={mathToDesign(mf + 0.1, 0, scale).x}
        y={mathToDesign(0, scale.yMin - 0.2, scale).y}
        fill={MATH_COLORS.function}
        fontSize={fontScale(9)}
        className="font-bold select-none"
      >
        I₁ = [0.5, 2.0]
      </text>

      {/* 2. 区间 I2 的底纹遮罩与端点虚线 */}
      <rect
        x={mathToDesign(mg, 0, scale).x}
        y={mathToDesign(0, scale.yMax, scale).y}
        width={mathToDesign(ng, 0, scale).x - mathToDesign(mg, 0, scale).x}
        height={
          mathToDesign(0, scale.yMin, scale).y -
          mathToDesign(0, scale.yMax, scale).y
        }
        fill={withAlpha(MATH_COLORS.functionSecondary, 0.03)}
        pointerEvents="none"
      />
      <line
        x1={mathToDesign(mg, 0, scale).x}
        y1={mathToDesign(0, scale.yMax, scale).y}
        x2={mathToDesign(mg, 0, scale).x}
        y2={mathToDesign(0, scale.yMin, scale).y}
        stroke={MATH_COLORS.asymptote}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <line
        x1={mathToDesign(ng, 0, scale).x}
        y1={mathToDesign(0, scale.yMax, scale).y}
        x2={mathToDesign(ng, 0, scale).x}
        y2={mathToDesign(0, scale.yMin, scale).y}
        stroke={MATH_COLORS.asymptote}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <text
        x={mathToDesign(ng - 0.9, 0, scale).x}
        y={mathToDesign(0, scale.yMin - 0.2, scale).y}
        fill={MATH_COLORS.functionSecondary}
        fontSize={fontScale(9)}
        className="font-bold select-none"
      >
        I₂ = [1.5, 3.0]
      </text>

      {/* 3. f(x) 抛物线绘制 */}
      {/* 区间外虚线 */}
      <FunctionGraph
        fn={(x) => (x < mf || x > nf ? evalFDouble(x) : NaN)}
        scale={scale}
        color={withAlpha(MATH_COLORS.function, 0.35)}
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

      {/* 4. g(x) 抛物线绘制 */}
      {/* 区间外虚线 */}
      <FunctionGraph
        fn={(x) => (x < mg || x > ng ? evalGDouble(x) : NaN)}
        scale={scale}
        color={withAlpha(MATH_COLORS.functionSecondary, 0.35)}
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

      {/* 同自变量作用域交集 [1.5, 2.0] 特殊边框标记 */}
      {selectedLogic === "same_var" && (
        <rect
          x={mathToDesign(1.5, 0, scale).x}
          y={mathToDesign(0, scale.yMax, scale).y}
          width={mathToDesign(2.0, 0, scale).x - mathToDesign(1.5, 0, scale).x}
          height={
            mathToDesign(0, scale.yMin, scale).y -
            mathToDesign(0, scale.yMax, scale).y
          }
          fill={withAlpha(MATH_COLORS.inequality, 0.05)}
          stroke={MATH_COLORS.inequality}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      )}

      {/* 同自变量违背区间高亮（f(x) < g(x)） */}
      {selectedLogic === "same_var" && sameVarViolatedInterval && (
        <g>
          {/* 使用 IntervalShadow 高亮同自变量违背区间 */}
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
          {/* 提示文字 */}
          <text
            x={
              mathToDesign(
                (sameVarViolatedInterval[0] + sameVarViolatedInterval[1]) / 2,
                0,
                scale,
              ).x
            }
            y={mathToDesign(0, scale.yMin + 0.3, scale).y}
            textAnchor="middle"
            fill={MATH_COLORS.degeneracy}
            fontSize={fontScale(10)}
            className="font-bold select-none"
          >
            违背区间 [{sameVarViolatedInterval[0].toFixed(2)},{" "}
            {sameVarViolatedInterval[1].toFixed(2)}]
          </text>
        </g>
      )}

      {/* 5. 绘制两曲线在研究区间内的最值水平虚线，以辅助视觉比照 */}
      {selectedLogic !== "same_var" && (
        <g>
          {/* f 最值线 */}
          <line
            x1={mathToDesign(scale.xMin, res.fMin, scale).x}
            y1={ptFMin.y}
            x2={mathToDesign(scale.xMax, res.fMin, scale).x}
            y2={ptFMin.y}
            stroke={withAlpha(MATH_COLORS.function, 0.35)}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          {/* g 最值线 */}
          <line
            x1={mathToDesign(scale.xMin, res.gMax, scale).x}
            y1={ptGMax.y}
            x2={mathToDesign(scale.xMax, res.gMax, scale).x}
            y2={ptGMax.y}
            stroke={withAlpha(MATH_COLORS.functionSecondary, 0.35)}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        </g>
      )}

      {/* 6. 双变量博弈对垒连接线 */}
      <VectorArrow
        from={[res.battlePointF.x, res.battlePointF.y]}
        to={[res.battlePointG.x, res.battlePointG.y]}
        scale={scale}
        color={
          res.isCurrentLogicTrue
            ? MATH_COLORS.inequality
            : MATH_COLORS.degeneracy
        }
        strokeWidth={2.5}
        label={arrowLabel}
        labelSize={10}
        fontScale={fontScale}
        labelOffset={[0, -10]}
      />

      {/* 7. 对垒点标注文字 (向外避让绘制，防止重叠) */}
      {/* f 侧对垒点标注 */}
      <text
        x={mathToDesign(res.battlePointF.x, res.battlePointF.y, scale).x - 6}
        y={
          mathToDesign(res.battlePointF.x, res.battlePointF.y, scale).y +
          battleLabelOffsetYF
        }
        textAnchor="end"
        fill={MATH_COLORS.function}
        fontSize={fontScale(9)}
        className="font-bold font-mono select-none"
      >
        {battleLabels.fText}({res.battlePointF.y.toFixed(2)})
      </text>

      {/* g 侧对垒点标注 */}
      <text
        x={mathToDesign(res.battlePointG.x, res.battlePointG.y, scale).x + 6}
        y={
          mathToDesign(res.battlePointG.x, res.battlePointG.y, scale).y +
          battleLabelOffsetYG
        }
        textAnchor="start"
        fill={MATH_COLORS.functionSecondary}
        fontSize={fontScale(9)}
        className="font-bold font-mono select-none"
      >
        {battleLabels.gText}({res.battlePointG.y.toFixed(2)})
      </text>

      {/* 8. f(x) 的顶点 (可拖拽，修改 xf 与 yf) */}
      <InteractivePoint
        cx={xf}
        cy={yf}
        scale={scale}
        vp={vp}
        onDrag={handleFVertexDrag}
        color={MATH_COLORS.paramPrimary}
        r={6}
        label={`f(x)顶点(${xf.toFixed(2)}, ${yf.toFixed(2)})`}
        fontScale={fontScale}
      />

      {/* 9. g(x) 的顶点 (可拖拽，修改 xg 与 yg) */}
      <InteractivePoint
        cx={xg}
        cy={yg}
        scale={scale}
        vp={vp}
        onDrag={handleGVertexDrag}
        color={MATH_COLORS.paramSecondary}
        r={6}
        label={`g(x)顶点(${xg.toFixed(2)}, ${yg.toFixed(2)})`}
        fontScale={fontScale}
      />
    </g>
  );
};
