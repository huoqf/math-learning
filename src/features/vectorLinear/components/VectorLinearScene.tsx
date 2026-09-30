import React from "react";
import {
  CoordinateGrid,
  VectorArrow,
  InteractivePoint,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  paramDomainRange,
  paramDragRange,
  snapDragValue,
} from "@/utils/paramClamp";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  paramMeta,
  VECTOR_PHYSICS_PRESETS,
  type VectorPhysicsContext,
} from "@/data/registries/vectorLinear";
import {
  computeVectorLinear,
  type VectorLinearParams,
} from "@/math/vectorLinear";

/**
 * 拖拽钳制区间（SSOT 见 utils/paramClamp）。
 *
 * 以前这些界限是写死在回调里的 `Math.max(-5, Math.min(5, …))`：
 * 与 paramMeta 只是"恰好同值"，一旦改滑块量程就会立刻脱节；
 * 而且 ±5 的纵坐标其实已经在可见 y（±4.64）之外，点会被拖出画布。
 * 现统一改成「声明域 ∩ 可见视口」，由 utils/paramClamp 求交。
 * 其中 xCoeff / yCoeff 是分解**系数**（与屏幕坐标不同轴），只守声明域。
 */
const RANGE_COEFF = paramDomainRange(paramMeta.xCoeff);
const RANGE_COEFF_Y = paramDomainRange(paramMeta.yCoeff);

/**
 * 单位圆标注的放置半径（数学单位）。
 *
 * 取 0.42 —— 落在单位圆**内部**的左上象限：该象限在本页恒为空
 * （a / e_a 朝右上、b / e_b 朝下、s 沿横轴），
 * 故文字既不会压住圆弧，也不会撞上坐标轴刻度与任何向量标签。
 */
const UNIT_CIRCLE_LABEL_R = 0.42;

// 计算垂直于向量方向的屏幕法向偏移量 (彻底避免共线向量标签相撞)
function getNormalOffset(
  dx: number,
  dy: number,
  distance: number,
): [number, number] {
  const len = Math.hypot(dx, dy);
  if (len < 1e-4) return [0, -distance];
  // 屏幕坐标系下数学向量 (dx, dy) 映射到屏幕矢量为 (dx, -dy)
  // 其垂直法向量为 (dy, dx)，乘以距离即可得到严格垂直于箭身的偏移
  const nx = dy / len;
  const ny = dx / len;
  return [nx * distance, ny * distance];
}

interface VectorLinearSceneProps {
  params: VectorLinearParams;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  onBatchParamsChange?: (updates: Record<string, number>) => void;
  fontScale: (size: number) => number;
  studyMode: "linearCombo" | "collinear" | "basis";
  lockCollinear?: boolean;
  /**
   * 是否叠加「单位向量化」图层（单位圆 + e_a / e_b）。
   * 由左屏「单位向量化」典型预设开启；仅在加减与数乘模式下生效
   * （模式二/三里的 a、b 分别叫 OA / OB 与 e₁ / e₂，再叠加 e_a / e_b 会造成命名冲突）。
   */
  showUnitVectors?: boolean;
  /**
   * 实际背景情景（必修二 6.4.2）：由左屏物理预设派生，非物理预设传 null / 不传。
   *
   * 只影响「加减与数乘」模式，作用有二：
   *   ① 把 a / b / s 的短标签换成物理量名（F₁ / F₂ / F / v 水 / 船速 …）；
   *   ② 三力平衡情景补画首尾相接的第三边（平衡力 F₃），并让位给它必然重合的合力箭头。
   * 数值一律仍由 computeVectorLinear 给出 —— 中屏不另起一套口径。
   */
  physicsContext?: VectorPhysicsContext | null;
}

export const VectorLinearScene: React.FC<VectorLinearSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  onBatchParamsChange,
  fontScale,
  studyMode,
  lockCollinear = false,
  showUnitVectors = false,
  physicsContext = null,
}) => {
  const mathRes = computeVectorLinear({
    ...params,
    lockCollinear,
  });

  const {
    a,
    b,
    lambdaA,
    muB,
    sumVec,
    unitA,
    unitB,
    isUnitADefined,
    isUnitBDefined,
    pointC,
    targetVecV,
    isBasisValid,
    basisComponent1,
    basisComponent2,
    coeffSum,
  } = mathRes;

  /** 物理情景命名（非物理情景为 null，一切标签回落为数学记号） */
  const labels =
    studyMode === "linearCombo" && physicsContext
      ? VECTOR_PHYSICS_PRESETS[physicsContext].naming
      : null;

  /**
   * 三力平衡情景：第三力 F₃ = −(F₁ + F₂) 与合力箭头方向相反、长度相等，
   * 两条箭头画在一起必然完全重合并抢标签，因此该情景**让位**：
   * 合力箭头不画，改为把「平移后的 F₂」与「F₃」接成闭合三角形。
   */
  const closeTriangle = labels?.third ?? null;

  const firstLabel = labels ? labels.first.canvas : "a";
  const secondLabel = labels ? labels.second.canvas : "b";

  const originDesign = mathToDesign(0, 0, scale);
  const posADesign = mathToDesign(a.x, a.y, scale);
  const posBDesign = mathToDesign(b.x, b.y, scale);

  const lambdaADesign = mathToDesign(lambdaA.x, lambdaA.y, scale);
  const muBDesign = mathToDesign(muB.x, muB.y, scale);
  const sumDesign = mathToDesign(sumVec.x, sumVec.y, scale);

  const basisComp1Design = mathToDesign(
    basisComponent1.x,
    basisComponent1.y,
    scale,
  );
  const basisComp2Design = mathToDesign(
    basisComponent2.x,
    basisComponent2.y,
    scale,
  );
  const targetVDesign = mathToDesign(targetVecV.x, targetVecV.y, scale);

  // 合法拖拽区间 =「参数声明域 ∩ 中屏可见视口」
  const rangeXa = paramDragRange(paramMeta.xa, scale, "x");
  const rangeYa = paramDragRange(paramMeta.ya, scale, "y");
  const rangeXb = paramDragRange(paramMeta.xb, scale, "x");
  const rangeYb = paramDragRange(paramMeta.yb, scale, "y");
  const rangeXv = paramDragRange(paramMeta.xv, scale, "x");
  const rangeYv = paramDragRange(paramMeta.yv, scale, "y");

  // 拖拽 A 点 (数学坐标)
  const handleDragPointA = (pt: { x: number; y: number }) => {
    const roundX = snapDragValue(pt.x, 0.5, rangeXa);
    const roundY = snapDragValue(pt.y, 0.5, rangeYa);
    if (onBatchParamsChange) {
      onBatchParamsChange({ xa: roundX, ya: roundY });
    } else {
      onParamChange("xa", roundX);
      onParamChange("ya", roundY);
    }
  };

  // 拖拽 B 点 (数学坐标)
  const handleDragPointB = (pt: { x: number; y: number }) => {
    const roundX = snapDragValue(pt.x, 0.5, rangeXb);
    const roundY = snapDragValue(pt.y, 0.5, rangeYb);
    if (onBatchParamsChange) {
      onBatchParamsChange({ xb: roundX, yb: roundY });
    } else {
      onParamChange("xb", roundX);
      onParamChange("yb", roundY);
    }
  };

  // 拖拽 C 点 (数学坐标，原子更新反求系数 x, y 并强联动左屏)
  const handleDragPointC = (pt: { x: number; y: number }) => {
    if (lockCollinear) {
      // 锁定 x + y = 1: 解算 C 在向量 AB 方向的投影比例 t
      const abX = b.x - a.x;
      const abY = b.y - a.y;
      const lenSq = abX * abX + abY * abY;
      if (lenSq > 1e-6) {
        const acX = pt.x - a.x;
        const acY = pt.y - a.y;
        const t = Math.max(-1, Math.min(2, (acX * abX + acY * abY) / lenSq));
        const roundY = snapDragValue(t, 0.05, RANGE_COEFF_Y);
        // 共线约束 x + y = 1：x 由 y 反解，再统一钳制到系数声明域（SSOT）
        const roundX = snapDragValue(1 - roundY, 0.05, RANGE_COEFF);
        if (onBatchParamsChange) {
          onBatchParamsChange({ xCoeff: roundX, yCoeff: roundY });
        } else {
          onParamChange("xCoeff", roundX);
          onParamChange("yCoeff", roundY);
        }
      }
    } else {
      // 自由模式: C = x*A + y*B (解二元一次方程组)
      const det = a.x * b.y - a.y * b.x;
      if (Math.abs(det) > 1e-4) {
        const rawX = (pt.x * b.y - pt.y * b.x) / det;
        const rawY = (a.x * pt.y - a.y * pt.x) / det;
        const clampX = snapDragValue(rawX, 0.05, RANGE_COEFF);
        const clampY = snapDragValue(rawY, 0.05, RANGE_COEFF_Y);
        if (onBatchParamsChange) {
          onBatchParamsChange({ xCoeff: clampX, yCoeff: clampY });
        } else {
          onParamChange("xCoeff", clampX);
          onParamChange("yCoeff", clampY);
        }
      }
    }
  };

  // 模式三拖拽目标向量 V (数学坐标)
  const handleDragPointV = (pt: { x: number; y: number }) => {
    const roundX = snapDragValue(pt.x, 0.5, rangeXv);
    const roundY = snapDragValue(pt.y, 0.5, rangeYv);
    if (onBatchParamsChange) {
      onBatchParamsChange({ xv: roundX, yv: roundY });
    } else {
      onParamChange("xv", roundX);
      onParamChange("yv", roundY);
    }
  };

  /**
   * 合成向量的箭头标签。
   *
   * 物理情景用情景名（合力 F / 实际速度 v）；数学情景只有 λ = μ = 1 时才写 a + b，
   * 否则化简为 s —— 文字必须与箭头实际的几何意义一致。
   */
  const isPureAddition =
    Math.abs((params.lambda ?? 1) - 1) < 1e-4 &&
    Math.abs((params.mu ?? 1) - 1) < 1e-4;
  const sumLabel = labels
    ? labels.resultant.canvas
    : isPureAddition
      ? "a + b"
      : "s";

  /** 三力平衡情景：平移后的第二力（闭合三角形第二条边）标签，「(平移)」明示它是等价的平移像 */
  const translatedSecondLabel = closeTriangle
    ? `${labels?.second.canvas ?? "b"}(平移)`
    : "";

  return (
    <g>
      {/* 1. 坐标轴网格 (内置标准原点 O，无需重复渲染) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ===================== 模式一：加减与数乘 ===================== */}
      {studyMode === "linearCombo" && (
        <>
          {/* ————「单位向量化」叠加图层（由左屏预设开启）————
              非零向量各自除以自己的模长：方向不变、长度归一为 1，
              终点必然落在单位圆上 —— 这就是「单位化只改长度、不改方向」的直接证据。
              半径用 ellipse 的 rx / ry 分别承接 x / y 比例尺，
              即使将来视口改成非等比也不会把单位圆画歪。 */}
          {showUnitVectors && (
            <>
              <ellipse
                cx={originDesign.x}
                cy={originDesign.y}
                rx={scale.scaleX}
                ry={scale.scaleY}
                fill="none"
                stroke={withAlpha(MATH_COLORS.line, 0.55)}
                strokeWidth={1.5}
                strokeDasharray="5,4"
              />
              <text
                x={originDesign.x - scale.scaleX * UNIT_CIRCLE_LABEL_R}
                y={originDesign.y - scale.scaleY * UNIT_CIRCLE_LABEL_R}
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(11)}
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
              >
                单位圆
              </text>

              {/* 单位向量 e_a：与 a 同向、长度 1（零向量时不存在，不渲染） */}
              {isUnitADefined && (
                <VectorArrow
                  from={[0, 0]}
                  to={[unitA.x, unitA.y]}
                  scale={scale}
                  color={withAlpha(MATH_COLORS.paramPrimary, 0.9)}
                  strokeWidth={2.5}
                  fontScale={fontScale}
                  label="e_a"
                  labelOffset={getNormalOffset(unitA.x, unitA.y, 16)}
                />
              )}

              {/* 单位向量 e_b：与 b 同向、长度 1 */}
              {isUnitBDefined && (
                <VectorArrow
                  from={[0, 0]}
                  to={[unitB.x, unitB.y]}
                  scale={scale}
                  color={withAlpha(MATH_COLORS.paramSecondary, 0.9)}
                  strokeWidth={2.5}
                  fontScale={fontScale}
                  label="e_b"
                  labelOffset={getNormalOffset(unitB.x, unitB.y, 16)}
                />
              )}
            </>
          )}

          {/* ———— 平行四边形辅助边（数学情景） / 闭合三角形第二条边（三力平衡）————
              数学情景：两条无标签虚线，交待「对角线 = 和向量」的几何来源；
              三力平衡：lambdaA → sum 这一段正是「把 F₂ 平移到 F₁ 的终点」，
              升级为带标签的虚线箭头 —— 它就是闭合三角形的第二条边。
              平移得到故用虚线，与 O 点处真实作用的实线 F₂ 区分开，
              否则同一个力会在画布上出现两个实线箭头，学生会误以为物体受了四个力。 */}
          {closeTriangle ? (
            <VectorArrow
              from={[lambdaA.x, lambdaA.y]}
              to={[sumVec.x, sumVec.y]}
              scale={scale}
              color={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
              strokeWidth={2.5}
              strokeDasharray="6,4"
              fontScale={fontScale}
              label={translatedSecondLabel}
              labelOffset={getNormalOffset(
                sumVec.x - lambdaA.x,
                sumVec.y - lambdaA.y,
                -14,
              )}
            />
          ) : (
            <>
              {/* 平行四边形虚线边 1: lambdaA 到 sumVec */}
              <line
                x1={lambdaADesign.x}
                y1={lambdaADesign.y}
                x2={sumDesign.x}
                y2={sumDesign.y}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.6)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* 平行四边形虚线边 2: muB 到 sumVec */}
              <line
                x1={muBDesign.x}
                y1={muBDesign.y}
                x2={sumDesign.x}
                y2={sumDesign.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
            </>
          )}

          {/* 数乘向量 λa (沿法向正向偏移，与 a 严格错开两侧) */}
          {Math.abs((params.lambda ?? 1) - 1) > 1e-4 && (
            <VectorArrow
              from={[0, 0]}
              to={[lambdaA.x, lambdaA.y]}
              scale={scale}
              color={withAlpha(MATH_COLORS.paramPrimary, 0.75)}
              strokeWidth={2}
              strokeDasharray="5,3"
              fontScale={fontScale}
              label="λa"
              labelOffset={getNormalOffset(a.x, a.y, 15)}
            />
          )}

          {/* 数乘向量 μb (沿法向正向偏移，与 b 严格错开两侧) */}
          {Math.abs((params.mu ?? 1) - 1) > 1e-4 && (
            <VectorArrow
              from={[0, 0]}
              to={[muB.x, muB.y]}
              scale={scale}
              color={withAlpha(MATH_COLORS.paramSecondary, 0.75)}
              strokeWidth={2}
              strokeDasharray="5,3"
              fontScale={fontScale}
              label="μb"
              labelOffset={getNormalOffset(b.x, b.y, 15)}
            />
          )}

          {/* 差向量 d = a - b (三角形减法法则：从减向量终点 B 指向被减向量终点 A)
              物理情景不画：两力之差在静力学里没有对应物理量，
              画出来只会与合力抢视线、干扰「首尾相接」的主叙事。 */}
          {!labels && (
            <VectorArrow
              from={[b.x, b.y]}
              to={[a.x, a.y]}
              scale={scale}
              color={MATH_COLORS.accent}
              strokeWidth={2.5}
              fontScale={fontScale}
              label="a - b"
              labelPositionRatio={0.75}
              labelOffset={getNormalOffset(a.x - b.x, a.y - b.y, 14)}
            />
          )}

          {/* 合成向量 s (平行四边形对角线/三角形法则主和向量，标签置于 0.8 处避开差向量交点)
              三力平衡时 F₃ 与它必然等长反向、完全重合，故让位给下面的 F₃ 箭头。 */}
          {!closeTriangle && (
            <VectorArrow
              from={[0, 0]}
              to={[sumVec.x, sumVec.y]}
              scale={scale}
              color={MATH_COLORS.paramTertiary}
              strokeWidth={3.5}
              fontScale={fontScale}
              label={sumLabel}
              labelPositionRatio={0.8}
              labelOffset={getNormalOffset(sumVec.x, sumVec.y, 16)}
            />
          )}

          {/* 平衡力 F₃ = −(F₁ + F₂)：由合力终点指回 O，三力首尾相接恰好闭合。
              取 paramTertiary（三号参数色）呼应「第三个力」，与 F₁ / F₂ 色相三足鼎立。 */}
          {closeTriangle && (
            <VectorArrow
              from={[sumVec.x, sumVec.y]}
              to={[0, 0]}
              scale={scale}
              color={MATH_COLORS.paramTertiary}
              strokeWidth={3.5}
              fontScale={fontScale}
              label={closeTriangle.canvas}
              labelOffset={getNormalOffset(-sumVec.x, -sumVec.y, 16)}
            />
          )}

          {/* 第一向量 a (沿法向反向偏移) —— 物理情景下即第一力 F₁ / 水流速度 */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label={firstLabel}
            labelPositionRatio={0.55}
            labelOffset={getNormalOffset(a.x, a.y, -15)}
          />

          {/* 第二向量 b (沿法向反向偏移) —— 物理情景下即第二力 F₂ / 静水船速 */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label={secondLabel}
            labelPositionRatio={0.55}
            labelOffset={getNormalOffset(b.x, b.y, -15)}
          />

          {/* 几何顶点交互控制点 A 和 B */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            xRange={rangeXa}
            yRange={rangeYa}
            onDrag={handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            xRange={rangeXb}
            yRange={rangeYb}
            onDrag={handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />
        </>
      )}

      {/* ===================== 模式二：共线与三点共线 ===================== */}
      {studyMode === "collinear" && (
        <>
          {/* 直线 AB 全长延长基准线 */}
          {Math.hypot(a.x - b.x, a.y - b.y) > 1e-4 && (
            <line
              x1={posADesign.x - (posBDesign.x - posADesign.x) * 4}
              y1={posADesign.y - (posBDesign.y - posADesign.y) * 4}
              x2={posBDesign.x + (posBDesign.x - posADesign.x) * 4}
              y2={posBDesign.y + (posBDesign.y - posADesign.y) * 4}
              stroke={
                Math.abs(coeffSum - 1) < 1e-4
                  ? withAlpha(MATH_COLORS.paramTertiary, 0.6)
                  : withAlpha(MATH_COLORS.line, 0.35)
              }
              strokeWidth={Math.abs(coeffSum - 1) < 1e-4 ? 2.5 : 1.5}
              strokeDasharray={
                Math.abs(coeffSum - 1) < 1e-4 ? undefined : "6,4"
              }
            />
          )}

          {/* 线段 AB (双向连接虚线) */}
          <line
            x1={posADesign.x}
            y1={posADesign.y}
            x2={posBDesign.x}
            y2={posBDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="4,3"
          />

          {/* 当偏离直线 AB 时，绘制从点 C 到直线 AB 的偏离垂线 */}
          {Math.abs(coeffSum - 1) >= 1e-4 &&
            (() => {
              const abX = b.x - a.x;
              const abY = b.y - a.y;
              const lenSq = abX * abX + abY * abY;
              if (lenSq > 1e-6) {
                const acX = pointC.x - a.x;
                const acY = pointC.y - a.y;
                const t = (acX * abX + acY * abY) / lenSq;
                const projX = a.x + t * abX;
                const projY = a.y + t * abY;
                const projDesign = mathToDesign(projX, projY, scale);
                const cDesign = mathToDesign(pointC.x, pointC.y, scale);
                return (
                  <g>
                    {/* 偏离垂线 */}
                    <line
                      x1={cDesign.x}
                      y1={cDesign.y}
                      x2={projDesign.x}
                      y2={projDesign.y}
                      stroke={MATH_COLORS.highlight}
                      strokeWidth={1.5}
                      strokeDasharray="3,3"
                    />
                    {/* 垂足点 H */}
                    <circle
                      cx={projDesign.x}
                      cy={projDesign.y}
                      r={3}
                      fill={MATH_COLORS.highlight}
                    />
                  </g>
                );
              }
              return null;
            })()}

          {/* 向量 OA */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            fontScale={fontScale}
            label="OA"
            labelOffset={getNormalOffset(a.x, a.y, -14)}
          />

          {/* 向量 OB */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            fontScale={fontScale}
            label="OB"
            labelOffset={getNormalOffset(b.x, b.y, 14)}
          />

          {/* 向量 OC = x*OA + y*OB */}
          <VectorArrow
            from={[0, 0]}
            to={[pointC.x, pointC.y]}
            scale={scale}
            color={
              Math.abs(coeffSum - 1) < 1e-4
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.accent
            }
            strokeWidth={3.5}
            fontScale={fontScale}
            label={
              Math.abs(coeffSum - 1) < 1e-4
                ? "OC (x+y=1)"
                : `OC (x+y=${coeffSum.toFixed(2)}≠1)`
            }
            labelOffset={getNormalOffset(pointC.x, pointC.y, 16)}
          />

          {/* 几何顶点与动点控制点 A, B, C */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            xRange={rangeXa}
            yRange={rangeYa}
            onDrag={handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            xRange={rangeXb}
            yRange={rangeYb}
            onDrag={handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />
          {/* C 的平面位置由分解系数 (x, y) 合成，与屏幕坐标不同轴：
              故不传 xRange/yRange，钳制在 handleDragPointC 内按系数声明域完成。
              ⚠ 系数声明域 [−1, 2] × 基底 (±5, ±4.5) 的像可达视口纵域的 3 倍
              （实测越界比例 65.6%，见 src/test/geometryHandleViewport.test.ts），
              故必须开启边缘投影手柄，否则 C 一旦被拖出画布即不可见、不可抓、拖不回来。 */}
          <InteractivePoint
            cx={pointC.x}
            cy={pointC.y}
            scale={scale}
            vp={vp}
            edgeClampProjection
            onDrag={handleDragPointC}
            color={
              Math.abs(coeffSum - 1) < 1e-4
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.accent
            }
            fontScale={fontScale}
            label={
              Math.abs(coeffSum - 1) < 1e-4
                ? Math.abs((params.xCoeff ?? 0.4) - 0.5) < 0.03
                  ? "C (中点)"
                  : "C (共线)"
                : "C (偏离)"
            }
          />
        </>
      )}

      {/* ===================== 模式三：平面向量基本定理 decomposition ===================== */}
      {studyMode === "basis" && (
        <>
          {/* 基底 e1 与 e2 方向斜坐标轴延长线 (贯穿画布) */}
          {isBasisValid && (
            <>
              {/* e1 轴 */}
              <line
                x1={originDesign.x - (posADesign.x - originDesign.x) * 5}
                y1={originDesign.y - (posADesign.y - originDesign.y) * 5}
                x2={originDesign.x + (posADesign.x - originDesign.x) * 5}
                y2={originDesign.y + (posADesign.y - originDesign.y) * 5}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.2)}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              {/* e2 轴 */}
              <line
                x1={originDesign.x - (posBDesign.x - originDesign.x) * 5}
                y1={originDesign.y - (posBDesign.y - originDesign.y) * 5}
                x2={originDesign.x + (posBDesign.x - originDesign.x) * 5}
                y2={originDesign.y + (posBDesign.y - originDesign.y) * 5}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.2)}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            </>
          )}

          {isBasisValid ? (
            <>
              {/* 分解平行四边形投影辅助虚线 1: λ1*e1 (M点) 到 V */}
              <line
                x1={basisComp1Design.x}
                y1={basisComp1Design.y}
                x2={targetVDesign.x}
                y2={targetVDesign.y}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.7)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* 分解平行四边形投影辅助虚线 2: λ2*e2 (N点) 到 V */}
              <line
                x1={basisComp2Design.x}
                y1={basisComp2Design.y}
                x2={targetVDesign.x}
                y2={targetVDesign.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* 分解基底分量 1: λ1*e1 (严格沿法向正侧偏移，绝不与 e1 相撞) */}
              <VectorArrow
                from={[0, 0]}
                to={[basisComponent1.x, basisComponent1.y]}
                scale={scale}
                color={withAlpha(MATH_COLORS.paramPrimary, 0.85)}
                strokeWidth={2.5}
                strokeDasharray="5,3"
                fontScale={fontScale}
                label="λ₁e₁"
                labelOffset={getNormalOffset(a.x, a.y, 16)}
              />

              {/* 分解基底分量 2: λ2*e2 (严格沿法向正侧偏移，绝不与 e2 相撞) */}
              <VectorArrow
                from={[0, 0]}
                to={[basisComponent2.x, basisComponent2.y]}
                scale={scale}
                color={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
                strokeWidth={2.5}
                strokeDasharray="5,3"
                fontScale={fontScale}
                label="λ₂e₂"
                labelOffset={getNormalOffset(b.x, b.y, 16)}
              />
            </>
          ) : (
            /* 基底退化共线警示线 */
            <text
              x={originDesign.x}
              y={originDesign.y - fontScale(24)}
              fill={MATH_COLORS.highlight}
              fontSize={fontScale(14)}
              fontWeight="bold"
              textAnchor="middle"
            >
              ⚠️ 基底 e₁ 与 e₂ 共线，无法构成有效基底！
            </text>
          )}

          {/* 目标向量 v */}
          <VectorArrow
            from={[0, 0]}
            to={[targetVecV.x, targetVecV.y]}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3.5}
            fontScale={fontScale}
            label="v"
            labelOffset={getNormalOffset(targetVecV.x, targetVecV.y, 16)}
          />

          {/* 基底向量 e1 (严格沿法向反侧偏移，与 λ1*e1 分居直线两侧) */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label="e₁"
            labelOffset={getNormalOffset(a.x, a.y, -16)}
          />

          {/* 基底向量 e2 (严格沿法向反侧偏移，与 λ2*e2 分居直线两侧) */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label="e₂"
            labelOffset={getNormalOffset(b.x, b.y, -16)}
          />

          {/* 交互控制点 E1, E2 及 目标 V */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            xRange={rangeXa}
            yRange={rangeYa}
            onDrag={handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="E₁"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            xRange={rangeXb}
            yRange={rangeYb}
            onDrag={handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="E₂"
          />
          <InteractivePoint
            cx={targetVecV.x}
            cy={targetVecV.y}
            scale={scale}
            vp={vp}
            xRange={rangeXv}
            yRange={rangeYv}
            onDrag={handleDragPointV}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
            label="V"
          />
        </>
      )}
    </g>
  );
};
