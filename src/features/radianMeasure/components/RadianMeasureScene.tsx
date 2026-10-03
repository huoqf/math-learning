import { CoordinateGrid } from "@/components/Math/CoordinateGrid";
import { InteractivePoint } from "@/components/Math/InteractivePoint";
import { MathPoint } from "@/components/Math/MathPoint";
import { mathToDesign } from "@/utils/coordinate";
import { snapDragValue } from "@/utils/paramClamp";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { TAU } from "@/math/radianMeasure";
import { paramMeta, resolveSceneRadius } from "@/data/registries/radianMeasure";
import {
  ANGLE_ARC_R_RATIO,
  ANGLE_LABEL_GAP_RATIO,
  R_LABEL_NORMAL_RATIO,
} from "../sceneGeometry";

/**
 * 「α 已走满一整圈」的判定容差 —— 取**半个吸附格距**。
 *
 * 为什么不能用 `TAU − 1e−4`：α 的两个入口（滑块、数字框）都会被 `ParamControl` 的
 * `snapToStep` 吸附到 `min + n·step` 的网格并 `toFixed(2)`。本页声明域
 * `min 0 / max 6.2832 / step 0.01` 组合下，可达上界只有 6.28（6.2832 被网格与两位小数双重截回 6.28），
 * 距 TAU 有 0.0032 —— 比 `1e−4` 大得多，导致整角分支（双半圆路径与同心圆角标记）**永不可达**，
 * 滑块拖到最右端时主弧反而以两条相距仅 0.0032·r 的端点去套 `A` 命令。
 * 取「半格距」后：网格上离 2π 最近的那一格必然被判为整角，且不会误伤相邻格。
 */
const FULL_TURN_TOLERANCE = (paramMeta.alphaRad.step ?? 0.01) / 2;

interface RadianMeasureSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: "definition" | "conversion" | "arcSector";
}

/**
 * 弧度制与扇形中屏作画。
 *
 * 坐标契约：圆心置于数学原点 O(0, 0)，半径 OA 沿 x 轴正方向。
 * 圆弧与扇形严格以数学圆心角 α ∈ [0, 2π] 为唯一真源：
 * 屏幕 y 轴向下翻转，数学逆时针对应 SVG sweep-flag = 0；
 * 通过 α > π 直接判定 largeArc 优弧标志，角平分线与小弧端点均由 α/2 精准定位，
 * 杜绝使用 atan2 反解屏幕角差带来的归一化陷阱与优角反向坍塌。
 *
 * 尺寸契约：一切标注尺寸（角标记弧半径、α 与 r 标签偏移）取**主圆 design 半径的比例**
 * （见 `sceneGeometry.ts`），既不经过视口倍率也不经过字号链路，故跨分辨率与图形严格等比。
 */
export function RadianMeasureScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}: RadianMeasureSceneProps) {
  const alpha = Math.max(0, Math.min(TAU, params.alphaRad ?? Math.PI / 3));
  // 半径经单一真源解析：定义模式恒为 1，其余模式跟随滑块（与悬浮公式、右屏看板同源）
  const r = resolveSceneRadius(studyMode, params.radius ?? 1.5);
  const pO = mathToDesign(0, 0, scale);
  const pA = mathToDesign(r, 0, scale);
  const pP = mathToDesign(r * Math.cos(alpha), r * Math.sin(alpha), scale);

  // 设计坐标下的圆半径（两点距离，天然与 scaleX / scaleY 之差无关）
  const radiusPx = Math.hypot(pA.x - pO.x, pA.y - pO.y);

  // ── 标注几何量：一律取主圆 design 半径的比例，跨分辨率下与图形严格等比 ──
  // 不走 `v * vp.scale`（屏幕尺寸会成 v × vp.scale²，见 sceneGeometry.ts 文件头），
  // 也不走 fontScale（字号链路的 clamp 会把定位量压成同一个值）
  const angleArcR = radiusPx * ANGLE_ARC_R_RATIO;
  const labelDist = angleArcR + radiusPx * ANGLE_LABEL_GAP_RATIO;
  const rLabelNormalOffset = radiusPx * R_LABEL_NORMAL_RATIO;

  // 严格按逆时针数学定义绘制圆弧与扇形（屏幕 y 轴向下翻转，逆时针对应 SVG sweep = 0）
  // 杜绝使用 atan2 反解屏幕角差：当 α > π（优角）时 atan2 会归一化到 (-π, π]，导致 sweep 逆转为劣弧
  const isFull = alpha >= TAU - FULL_TURN_TOLERANCE;
  const largeArc = alpha > Math.PI ? 1 : 0;

  const arcPath = isFull
    ? `M ${pO.x - radiusPx} ${pO.y} A ${radiusPx} ${radiusPx} 0 1 0 ${pO.x + radiusPx} ${pO.y} A ${radiusPx} ${radiusPx} 0 1 0 ${pO.x - radiusPx} ${pO.y}`
    : `M ${pA.x} ${pA.y} A ${radiusPx} ${radiusPx} 0 ${largeArc} 0 ${pP.x} ${pP.y}`;

  const sectorPath = isFull
    ? `M ${pO.x - radiusPx} ${pO.y} A ${radiusPx} ${radiusPx} 0 1 0 ${pO.x + radiusPx} ${pO.y} A ${radiusPx} ${radiusPx} 0 1 0 ${pO.x - radiusPx} ${pO.y} Z`
    : `M ${pO.x} ${pO.y} L ${pA.x} ${pA.y} A ${radiusPx} ${radiusPx} 0 ${largeArc} 0 ${pP.x} ${pP.y} Z`;

  // 1 弧度对应的单位弧（definition 模式参照系，1 rad < π，sweep = 0）
  const pUnit = mathToDesign(r * Math.cos(1), r * Math.sin(1), scale);
  const unitArcPath = `M ${pA.x} ${pA.y} A ${radiusPx} ${radiusPx} 0 0 0 ${pUnit.x} ${pUnit.y}`;

  const showSector = studyMode === "arcSector";

  // 圆心角 α 的标记弧端点：自 O 沿 α 方向取 angleArcR（屏幕 y 轴向下，故取负正弦）
  const angleEnd = {
    x: pO.x + angleArcR * Math.cos(alpha),
    y: pO.y - angleArcR * Math.sin(alpha),
  };
  const alphaLabelPos = {
    x: pO.x + labelDist * Math.cos(alpha / 2),
    y: pO.y - labelDist * Math.sin(alpha / 2),
  };

  // 弧中点（用于弧长标签定位）
  const midAngle = alpha / 2;
  const pArcMid = mathToDesign(
    r * 1.14 * Math.cos(midAngle),
    r * 1.14 * Math.sin(midAngle),
    scale,
  );
  // 半径中点（用于 r 标签定位）
  const pRadiusMid = mathToDesign(
    (r / 2) * Math.cos(alpha),
    (r / 2) * Math.sin(alpha),
    scale,
  );
  // 半径 r 标签：先落 OP 中点，再沿 OP 法向推开 rLabelNormalOffset（消灭 α 过中点的方向翻转跳动）
  const rLabelPos = {
    x: pRadiusMid.x + rLabelNormalOffset * Math.sin(alpha),
    y: pRadiusMid.y + rLabelNormalOffset * Math.cos(alpha),
  };

  // 扇形面积 S 标签：置于扇形内部角平分线 0.62r 处（绝不在弧上向下硬偏移，杜绝脱出扇形或与 l 碰撞）
  const pSectorLabel = mathToDesign(
    r * 0.62 * Math.cos(midAngle),
    r * 0.62 * Math.sin(midAngle),
    scale,
  );

  return (
    <g className="radian-measure-scene">
      {/* 页面自绘原点 O，必须关闭网格的原点标签，防止同一处重叠绘制两个 O 产生重影 */}
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        showOriginLabel={false}
      />

      {/* 扇形填充（仅弧长扇形模式） */}
      {showSector && alpha > 1e-6 && (
        <path
          d={sectorPath}
          fill={withAlpha(MATH_COLORS.sequenceHighlight, 0.18)}
          stroke="none"
        />
      )}

      {/* 参考圆 */}
      <circle
        cx={pO.x}
        cy={pO.y}
        r={radiusPx}
        fill="none"
        stroke={withAlpha(MATH_COLORS.axis, 0.45)}
        strokeWidth={1.5}
      />

      {/* 1 弧度单位弧（definition 模式的对照基准：弧长恰等于半径） */}
      {studyMode === "definition" && (
        <path
          d={unitArcPath}
          fill="none"
          stroke={MATH_COLORS.function}
          strokeWidth={3}
          strokeDasharray="6 4"
        />
      )}

      {/* 圆心角所对圆弧（高亮） */}
      {alpha > 1e-6 && (
        <path
          d={arcPath}
          fill="none"
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}

      {/* 两条半径 OA、OP */}
      <line
        x1={pO.x}
        y1={pO.y}
        x2={pA.x}
        y2={pA.y}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2.5}
      />
      <line
        x1={pO.x}
        y1={pO.y}
        x2={pP.x}
        y2={pP.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
      />

      {/* 可拖拽动点 P：拖拽反解圆心角（数学坐标 atan2，负角折算到一周内） */}
      <InteractivePoint
        cx={r * Math.cos(alpha)}
        cy={r * Math.sin(alpha)}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        label="P"
        r={7}
        onDrag={(mathPos) => {
          if (!onParamChange) return;
          let a = Math.atan2(mathPos.y, mathPos.x);
          if (a < 0) a += TAU;
          const clamped = snapDragValue(a, 0.01, [0, TAU]);
          onParamChange("alphaRad", clamped);
        }}
      />

      {/* 定点 O 与 A */}
      <MathPoint
        cx={0}
        cy={0}
        scale={scale}
        fontScale={fontScale}
        color={MATH_COLORS.axis}
      />
      <MathPoint
        cx={r}
        cy={0}
        scale={scale}
        fontScale={fontScale}
        color={MATH_COLORS.paramSecondary}
      />

      {/* 学术符号标签（数值一律归右屏看板） */}
      <text
        x={pO.x - fontScale(14)}
        y={pO.y + fontScale(18)}
        fill={MATH_COLORS.axis}
        fontSize={fontScale(13)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        O
      </text>
      <text
        x={pA.x + fontScale(10)}
        y={pA.y + fontScale(18)}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(13)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        A
      </text>
      <text
        x={pArcMid.x}
        y={pArcMid.y}
        textAnchor="middle"
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        l
      </text>
      <text
        x={rLabelPos.x}
        y={rLabelPos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
        strokeLinejoin="round"
      >
        r
      </text>
      {showSector && alpha > 0.25 && (
        <text
          x={pSectorLabel.x}
          y={pSectorLabel.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={MATH_COLORS.sequenceHighlight}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fontStyle="italic"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
          strokeLinejoin="round"
        >
          S
        </text>
      )}

      {/* definition 模式下标注「1 弧度」参照弧 */}
      {studyMode === "definition" && (
        <text
          x={(pA.x + pUnit.x) / 2 + fontScale(2)}
          y={(pA.y + pUnit.y) / 2 - fontScale(10)}
          textAnchor="middle"
          fill={MATH_COLORS.function}
          fontSize={fontScale(12)}
          fontWeight="bold"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
          strokeLinejoin="round"
        >
          1 rad
        </text>
      )}

      {/* 圆心角 α 的圆弧标记（以 O 为圆心的小半径弧，逆时针扫过；整角时渲染完整小同心圆） */}
      {alpha > 0.05 &&
        (isFull ? (
          <circle
            cx={pO.x}
            cy={pO.y}
            r={angleArcR}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.6}
          />
        ) : (
          <path
            d={`M ${(pO.x + angleArcR).toFixed(2)} ${pO.y.toFixed(2)} A ${angleArcR} ${angleArcR} 0 ${largeArc} 0 ${angleEnd.x.toFixed(2)} ${angleEnd.y.toFixed(2)}`}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.6}
          />
        ))}

      {/* 角 α 标签（置于角平分方向，只写符号，数值归右屏看板） */}
      {alpha > 0.15 && (
        <text
          x={alphaLabelPos.x}
          y={alphaLabelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fontStyle="italic"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
          strokeLinejoin="round"
        >
          α
        </text>
      )}
    </g>
  );
}
