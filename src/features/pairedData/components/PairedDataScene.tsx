import React, { useMemo } from "react";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  Point2D,
  calculateLinearRegression,
  calculateIndependenceTest,
} from "@/math/pairedData";

interface PairedDataSceneProps {
  studyMode: "regression" | "independence";
  points: Point2D[];
  onPointsChange: (newPoints: Point2D[]) => void;
  freqA: number;
  freqB: number;
  freqC: number;
  freqD: number;
  presetXName: string;
  presetYName: string;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  xStep?: number;
  yStep?: number;
}

export const PairedDataScene: React.FC<PairedDataSceneProps> = ({
  studyMode,
  points,
  onPointsChange,
  freqA,
  freqB,
  freqC,
  freqD,
  presetXName,
  presetYName,
  scale,
  vp,
  fontScale,
  xStep = 1,
  yStep = 1,
}) => {
  // 1. 回归模型计算
  const regResult = useMemo(() => {
    return calculateLinearRegression(points);
  }, [points]);

  // 2. 独立性检验计算
  const indResult = useMemo(() => {
    return calculateIndependenceTest(freqA, freqB, freqC, freqD);
  }, [freqA, freqB, freqC, freqD]);

  // 处理拖拽散点
  const handlePointDrag = (
    id: string,
    newMathPos: { x: number; y: number },
  ) => {
    const updated = points.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          x: Number(newMathPos.x.toFixed(2)),
          y: Number(newMathPos.y.toFixed(2)),
        };
      }
      return p;
    });
    onPointsChange(updated);
  };

  // 如果是回归分析模式
  if (studyMode === "regression") {
    // 回归直线上的两端点坐标
    const xMin = -10;
    const xMax = 40;
    const lineStart = mathToDesign(
      xMin,
      regResult.b * xMin + regResult.a,
      scale,
    );
    const lineEnd = mathToDesign(xMax, regResult.b * xMax + regResult.a, scale);

    // 样本中心点 (meanX, meanY) 的设计坐标
    const centerPos = mathToDesign(regResult.meanX, regResult.meanY, scale);
    const centerAxisX = mathToDesign(regResult.meanX, 0, scale);
    const centerAxisY = mathToDesign(0, regResult.meanY, scale);

    return (
      <g className="paired-data-scene-regression">
        {/* 坐标轴与网格 */}
        <CoordinateGrid
          scale={scale}
          fontScale={fontScale}
          xStep={xStep}
          yStep={yStep}
        />

        {/* 1. 绘制残差垂线 (散点 -> 回归直线上对应点) */}
        {regResult.isValid &&
          points.map((p) => {
            const yHat = regResult.b * p.x + regResult.a;
            const ptDesign = mathToDesign(p.x, p.y, scale);
            const hatDesign = mathToDesign(p.x, yHat, scale);
            return (
              <g key={`res-${p.id}`}>
                <line
                  x1={ptDesign.x}
                  y1={ptDesign.y}
                  x2={hatDesign.x}
                  y2={hatDesign.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
              </g>
            );
          })}

        {/* 2. 绘制回归直线 */}
        {regResult.isValid && (
          <line
            x1={lineStart.x}
            y1={lineStart.y}
            x2={lineEnd.x}
            y2={lineEnd.y}
            stroke={MATH_COLORS.function}
            strokeWidth={2.5}
          />
        )}

        {/* 3. 标记样本中心点 (meanX, meanY) */}
        {regResult.isValid && (
          <g className="center-point-group">
            {/* 投影到 X 轴虚线 */}
            <line
              x1={centerPos.x}
              y1={centerPos.y}
              x2={centerAxisX.x}
              y2={centerAxisX.y}
              stroke={MATH_COLORS.paramPrimary}
              strokeDasharray="4 4"
              strokeWidth={1.2}
            />
            {/* 投影到 Y 轴虚线 */}
            <line
              x1={centerPos.x}
              y1={centerPos.y}
              x2={centerAxisY.x}
              y2={centerAxisY.y}
              stroke={MATH_COLORS.paramPrimary}
              strokeDasharray="4 4"
              strokeWidth={1.2}
            />
            {/* 样本中心点外圈脉冲亮环 */}
            <circle
              cx={centerPos.x}
              cy={centerPos.y}
              r={9}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.2)}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.5}
            />
            <circle
              cx={centerPos.x}
              cy={centerPos.y}
              r={4}
              fill={MATH_COLORS.paramPrimary}
            />
            {/* 中心点文本标签 */}
            <text
              x={centerPos.x + 12}
              y={centerPos.y - 12}
              fill={MATH_COLORS.paramPrimary}
              fontSize={fontScale(13)}
              fontWeight="bold"
            >
              样本中心点 ({regResult.meanX.toFixed(1)},{" "}
              {regResult.meanY.toFixed(1)})
            </text>
          </g>
        )}

        {/* 4. 可拖拽散点 */}
        {points.map((p, idx) => (
          <InteractivePoint
            key={p.id}
            cx={p.x}
            cy={p.y}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramSecondary}
            r={7}
            label={`P${idx + 1}(${p.x}, ${p.y})`}
            fontScale={fontScale}
            onDrag={(newPos) => handlePointDrag(p.id, newPos)}
          />
        ))}

        {/* 回归方程图例与提示 */}
        <g transform="translate(40, 40)">
          <rect
            x={0}
            y={0}
            width={260}
            height={56}
            rx={6}
            fill="#FFFFFF"
            fillOpacity={0.9}
            stroke={CANVAS_COLORS.axis}
            strokeWidth={1}
          />
          <line
            x1={15}
            y1={20}
            x2={45}
            y2={20}
            stroke={MATH_COLORS.function}
            strokeWidth={2.5}
          />
          <text
            x={55}
            y={24}
            fill={MATH_COLORS.function}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            回归: ŷ={regResult.b.toFixed(2)}x{regResult.a >= 0 ? "+" : ""}
            {regResult.a.toFixed(2)}
          </text>
          <line
            x1={15}
            y1={38}
            x2={45}
            y2={38}
            stroke={MATH_COLORS.tangentLine}
            strokeDasharray="3 3"
            strokeWidth={1.5}
          />
          <text
            x={55}
            y={42}
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(11)}
          >
            残差垂线 (可拖拽散点观察变化)
          </text>
        </g>

        {/* 轴名称标注 */}
        <text
          x={780}
          y={630}
          fontSize={fontScale(12)}
          fill={CANVAS_COLORS.labelText}
          fontWeight="bold"
        >
          {presetXName}
        </text>
        <text
          x={30}
          y={30}
          fontSize={fontScale(12)}
          fill={CANVAS_COLORS.labelText}
          fontWeight="bold"
        >
          {presetYName}
        </text>
      </g>
    );
  }

  // 独立性检验可视化场景
  const row1Total = freqA + freqB;
  const row2Total = freqC + freqD;

  const ratioA_B = row1Total > 0 ? freqA / row1Total : 0;
  const ratioA_NotB = row1Total > 0 ? freqB / row1Total : 0;
  const ratioNotA_B = row2Total > 0 ? freqC / row2Total : 0;
  const ratioNotA_NotB = row2Total > 0 ? freqD / row2Total : 0;

  // 绘制卡方数轴区域
  const axisY = 480;
  const axisStartX = 100;
  const axisEndX = 740;
  const axisWidth = axisEndX - axisStartX;
  const maxChi = 15; // 坐标轴最大刻度卡方值

  const getChiX = (val: number) => {
    const clamped = Math.min(maxChi, Math.max(0, val));
    return axisStartX + (clamped / maxChi) * axisWidth;
  };

  const currChiX = getChiX(indResult.chiSquare);

  // 下移偏移量，为顶部公式留出空间
  const offsetDown = 50;

  return (
    <g
      className="paired-data-scene-independence"
      transform={`translate(0, ${offsetDown})`}
    >
      {/* 背景卡片 */}
      <rect
        x={20}
        y={20}
        width={800}
        height={580}
        rx={12}
        fill="#FAFAFA"
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {/* 标题 */}
      <text
        x={400}
        y={50}
        textAnchor="middle"
        fontSize={fontScale(18)}
        fontWeight="bold"
        fill="#111827"
      >
        2 × 2 列联表条件频率分布与卡方检验
      </text>

      {/* 1. 上半部分：2x2 列联表条件频率对比图 (堆叠百分比柱状图) */}
      <g transform="translate(140, 90)">
        <text
          x={0}
          y={-10}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【分类条件频率对比】
        </text>

        {/* 柱状图 1: 组 A (如：新药组/男生) */}
        <g transform="translate(60, 20)">
          <text
            x={60}
            y={-10}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill="#374151"
          >
            类 A 样本 (共 {row1Total} 人)
          </text>
          {/* B 部分 */}
          <rect
            x={0}
            y={0}
            width={120}
            height={200 * ratioA_B}
            fill={MATH_COLORS.paramPrimary}
            rx={4}
            opacity={0.85}
          />
          {ratioA_B > 0.08 && (
            <text
              x={60}
              y={100 * ratioA_B + 5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              B ({freqA}人, {(ratioA_B * 100).toFixed(1)}%)
            </text>
          )}
          {/* 非 B 部分 */}
          <rect
            x={0}
            y={200 * ratioA_B}
            width={120}
            height={200 * ratioA_NotB}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            rx={4}
          />
          {ratioA_NotB > 0.08 && (
            <text
              x={60}
              y={200 * ratioA_B + 100 * ratioA_NotB + 5}
              textAnchor="middle"
              fill="#1F2937"
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              非B ({freqB}人, {(ratioA_NotB * 100).toFixed(1)}%)
            </text>
          )}
        </g>

        {/* 柱状图 2: 组 非 A (如：对照组/女生) */}
        <g transform="translate(320, 20)">
          <text
            x={60}
            y={-10}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill="#374151"
          >
            类 非A 样本 (共 {row2Total} 人)
          </text>
          {/* B 部分 */}
          <rect
            x={0}
            y={0}
            width={120}
            height={200 * ratioNotA_B}
            fill={MATH_COLORS.paramSecondary}
            rx={4}
            opacity={0.85}
          />
          {ratioNotA_B > 0.08 && (
            <text
              x={60}
              y={100 * ratioNotA_B + 5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              B ({freqC}人, {(ratioNotA_B * 100).toFixed(1)}%)
            </text>
          )}
          {/* 非 B 部分 */}
          <rect
            x={0}
            y={200 * ratioNotA_B}
            width={120}
            height={200 * ratioNotA_NotB}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
            rx={4}
          />
          {ratioNotA_NotB > 0.08 && (
            <text
              x={60}
              y={200 * ratioNotA_B + 100 * ratioNotA_NotB + 5}
              textAnchor="middle"
              fill="#1F2937"
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              非B ({freqD}人, {(ratioNotA_NotB * 100).toFixed(1)}%)
            </text>
          )}
        </g>
      </g>

      {/* 2. 下半部分：卡方检验数轴标尺与决策区域 */}
      <g transform="translate(0, 0)">
        <text
          x={axisStartX}
          y={axisY - 45}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill="#111827"
        >
          【χ² 卡方检验统计量数轴与高考临界值标尺】
        </text>

        {/* 拒绝域背景区间阴影 (>= 3.841) */}
        <rect
          x={getChiX(3.841)}
          y={axisY - 20}
          width={axisEndX - getChiX(3.841)}
          height={40}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.15)}
          rx={4}
        />
        <text
          x={axisEndX - 10}
          y={axisY - 25}
          textAnchor="end"
          fill={MATH_COLORS.paramTertiary}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          拒绝 H₀ 区域 (95% 把握以上关联)
        </text>

        {/* 主数轴线 */}
        <line
          x1={axisStartX}
          y1={axisY}
          x2={axisEndX}
          y2={axisY}
          stroke="#4B5563"
          strokeWidth={3}
        />

        {/* 关键卡方临界值刻度标尺 */}
        {[
          { val: 0, label: "0" },
          { val: 2.706, label: "2.706 (90%)" },
          { val: 3.841, label: "3.841 (95%)" },
          { val: 6.635, label: "6.635 (99%)" },
          { val: 10.828, label: "10.828 (99.9%)" },
        ].map((tick) => {
          const tx = getChiX(tick.val);
          return (
            <g key={`tick-${tick.val}`}>
              <line
                x1={tx}
                y1={axisY - 8}
                x2={tx}
                y2={axisY + 8}
                stroke="#1F2937"
                strokeWidth={2}
              />
              <text
                x={tx}
                y={axisY + 24}
                textAnchor="middle"
                fontSize={fontScale(11)}
                fontWeight={
                  tick.val === 3.841 || tick.val === 6.635 ? "bold" : "normal"
                }
                fill={
                  tick.val === 3.841 || tick.val === 6.635
                    ? MATH_COLORS.paramPrimary
                    : "#4B5563"
                }
              >
                {tick.label}
              </text>
            </g>
          );
        })}

        {/* 动态计算出的当前 χ² 观测值指针 */}
        <g transform={`translate(${currChiX}, ${axisY})`}>
          <polygon
            points="0,-12 -8,-24 8,-24"
            fill={MATH_COLORS.paramPrimary}
          />
          <line
            x1={0}
            y1={-24}
            x2={0}
            y2={-45}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="2 2"
          />
          <rect
            x={-60}
            y={-70}
            width={120}
            height={24}
            rx={12}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={0}
            y={-54}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            χ² = {indResult.chiSquare.toFixed(3)}
          </text>
        </g>
      </g>
    </g>
  );
};
