import React from "react";
import { CANVAS_COLORS, MATH_COLORS, withAlpha } from "@/theme";
import {
  calcBundleModel,
  calcGapModel,
  calcGroupingModel,
  calcStarsBarsModel,
  type CombinatoricsModelMode,
} from "@/math/combinatoricsModels";
import { GROUPING_PRESET_SIZES } from "@/data/registries/combinatoricsModels";

interface CombinatoricsModelsSceneProps {
  mode: CombinatoricsModelMode;
  params: Record<string, number>;
  allowZero: boolean;
  distinctTargets: boolean;
  groupingPreset: string;
  fontScale: (base: number) => number;
}

const ELEMENT_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const CombinatoricsModelsScene: React.FC<
  CombinatoricsModelsSceneProps
> = ({
  mode,
  params,
  allowZero,
  distinctTargets,
  groupingPreset,
  fontScale,
}) => {
  // 840x650 设计坐标空间居中排布
  if (mode === "bundle") {
    const res = calcBundleModel(params.n ?? 5, params.k ?? 2);
    const boxSize = 54;
    const gap = 14;
    const totalW = res.n * boxSize + (res.n - 1) * gap;
    const startX = (840 - totalW) / 2;
    const row1Y = 175;
    const bundleW = res.k * boxSize + (res.k - 1) * gap + 20;
    const row2Y = 385;

    return (
      <g>
        {/* 阶段 1：原始 n 个元素与超级捆绑框 */}
        <text
          x={420}
          y={115}
          textAnchor="middle"
          fontSize={fontScale(16)}
          fontWeight="700"
          fill={CANVAS_COLORS.labelText}
        >
          第 1 步：将必须相邻的 {res.k} 个元素捆绑为“超级大元素”
        </text>
        <text
          x={420}
          y={142}
          textAnchor="middle"
          fontSize={fontScale(13)}
          fill={CANVAS_COLORS.textMuted}
        >
          捆绑体内部全排列：A({res.k}, {res.k}) = {res.innerPerms} 种
        </text>

        {/* 超级捆绑虚线外框 */}
        <rect
          x={startX - 10}
          y={row1Y - 12}
          width={bundleW}
          height={boxSize + 24}
          rx={12}
          fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />

        {Array.from({ length: res.n }).map((_, idx) => {
          const x = startX + idx * (boxSize + gap);
          const isBundled = idx < res.k;
          return (
            <g key={`orig-${idx}`}>
              <rect
                x={x}
                y={row1Y}
                width={boxSize}
                height={boxSize}
                rx={10}
                fill={
                  isBundled
                    ? withAlpha(MATH_COLORS.paramSecondary, 0.16)
                    : withAlpha(MATH_COLORS.function, 0.12)
                }
                stroke={
                  isBundled ? MATH_COLORS.paramSecondary : MATH_COLORS.function
                }
                strokeWidth={2}
              />
              <text
                x={x + boxSize / 2}
                y={row1Y + boxSize / 2 + 6}
                textAnchor="middle"
                fontSize={fontScale(18)}
                fontWeight="700"
                fill={
                  isBundled ? MATH_COLORS.paramSecondary : MATH_COLORS.function
                }
              >
                {ELEMENT_LABELS[idx] ?? `E${idx + 1}`}
              </text>
            </g>
          );
        })}

        {/* 连接箭头 */}
        <line
          x1={420}
          y1={row1Y + boxSize + 26}
          x2={420}
          y2={row2Y - 52}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={2}
        />
        <polygon
          points={`420,${row2Y - 46} 414,${row2Y - 56} 426,${row2Y - 56}`}
          fill={CANVAS_COLORS.axis}
        />

        {/* 阶段 2：视作整体参与外部全排 */}
        <text
          x={420}
          y={row2Y - 22}
          textAnchor="middle"
          fontSize={fontScale(16)}
          fontWeight="700"
          fill={CANVAS_COLORS.labelText}
        >
          第 2 步：共 {res.superCount} 个单位参与外部全排列 · A({res.superCount}
          , {res.superCount}) = {res.outerPerms} 种
        </text>

        {(() => {
          const freeCount = res.n - res.k;
          const units = 1 + freeCount;
          const unitWidth = 86;
          const unitGap = 18;
          const row2TotalW = units * unitWidth + (units - 1) * unitGap;
          const row2StartX = (840 - row2TotalW) / 2;

          return Array.from({ length: units }).map((_, uIdx) => {
            const ux = row2StartX + uIdx * (unitWidth + unitGap);
            const isSuper = uIdx === 0;
            const label = isSuper
              ? `[${ELEMENT_LABELS.slice(0, res.k).join("")}]`
              : ELEMENT_LABELS[res.k + uIdx - 1];
            return (
              <g key={`unit-${uIdx}`}>
                <rect
                  x={ux}
                  y={row2Y}
                  width={unitWidth}
                  height={56}
                  rx={10}
                  fill={
                    isSuper
                      ? withAlpha(MATH_COLORS.paramSecondary, 0.16)
                      : withAlpha(MATH_COLORS.paramPrimary, 0.1)
                  }
                  stroke={
                    isSuper
                      ? MATH_COLORS.paramSecondary
                      : MATH_COLORS.paramPrimary
                  }
                  strokeWidth={2}
                />
                <text
                  x={ux + unitWidth / 2}
                  y={row2Y + 34}
                  textAnchor="middle"
                  fontSize={fontScale(isSuper && res.k > 3 ? 13 : 16)}
                  fontWeight="700"
                  fill={
                    isSuper
                      ? MATH_COLORS.paramSecondary
                      : MATH_COLORS.paramPrimary
                  }
                >
                  {label}
                </text>
              </g>
            );
          });
        })()}

        {/* 结论卡片 */}
        <rect
          x={170}
          y={495}
          width={500}
          height={64}
          rx={12}
          fill={withAlpha(MATH_COLORS.inequality, 0.1)}
          stroke={MATH_COLORS.inequality}
          strokeWidth={1.8}
        />
        <text
          x={420}
          y={533}
          textAnchor="middle"
          fontSize={fontScale(17)}
          fontWeight="800"
          fill={MATH_COLORS.inequality}
        >
          总方案数 = {res.innerPerms} × {res.outerPerms} = {res.total}
        </text>
      </g>
    );
  }

  if (mode === "gap") {
    const res = calcGapModel(params.m ?? 4, params.k ?? 2);
    const slotW = 34;
    const elemW = 54;
    const itemGap = 8;
    const totalCount = res.slots + res.m;
    const totalW =
      res.slots * slotW + res.m * elemW + (totalCount - 1) * itemGap;
    const startX = (840 - totalW) / 2;
    const centerY = 275;

    let cursorX = startX;
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < totalCount; i++) {
      const isSlot = i % 2 === 0;
      if (isSlot) {
        const slotIdx = Math.floor(i / 2);
        const isFilled = res.validity === "ok" && slotIdx < res.k;
        const x = cursorX;
        cursorX += slotW + itemGap;
        nodes.push(
          <g key={`slot-${slotIdx}`}>
            <rect
              x={x}
              y={centerY - 48}
              width={slotW}
              height={96}
              rx={8}
              fill={
                isFilled
                  ? withAlpha(MATH_COLORS.paramSecondary, 0.18)
                  : withAlpha(MATH_COLORS.tipBg, 0.9)
              }
              stroke={
                isFilled ? MATH_COLORS.paramSecondary : CANVAS_COLORS.axis
              }
              strokeWidth={isFilled ? 2 : 1.5}
              strokeDasharray={isFilled ? undefined : "4 3"}
            />
            <text
              x={x + slotW / 2}
              y={centerY + 6}
              textAnchor="middle"
              fontSize={fontScale(14)}
              fontWeight="700"
              fill={
                isFilled ? MATH_COLORS.paramSecondary : CANVAS_COLORS.textMuted
              }
            >
              {isFilled ? `★${slotIdx + 1}` : "空"}
            </text>
            <text
              x={x + slotW / 2}
              y={centerY + 70}
              textAnchor="middle"
              fontSize={fontScale(11)}
              fill={CANVAS_COLORS.textMuted}
            >
              位{slotIdx + 1}
            </text>
          </g>,
        );
      } else {
        const baseIdx = Math.floor(i / 2);
        const x = cursorX;
        cursorX += elemW + itemGap;
        nodes.push(
          <g key={`base-${baseIdx}`}>
            <rect
              x={x}
              y={centerY - 27}
              width={elemW}
              height={54}
              rx={10}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={2}
            />
            <text
              x={x + elemW / 2}
              y={centerY + 6}
              textAnchor="middle"
              fontSize={fontScale(17)}
              fontWeight="700"
              fill={MATH_COLORS.paramPrimary}
            >
              {ELEMENT_LABELS[baseIdx] ?? `B${baseIdx + 1}`}
            </text>
          </g>,
        );
      }
    }

    return (
      <g>
        <text
          x={420}
          y={120}
          textAnchor="middle"
          fontSize={fontScale(17)}
          fontWeight="700"
          fill={CANVAS_COLORS.labelText}
        >
          先排 {res.m} 个底座元素，产生 {res.slots} 个隔离空位（含首尾两端）
        </text>
        <text
          x={420}
          y={150}
          textAnchor="middle"
          fontSize={fontScale(13)}
          fill={CANVAS_COLORS.textMuted}
        >
          底座全排列 A({res.m}, {res.m}) = {res.basePerms} · 从 {res.slots}{" "}
          个空位选 {res.k} 个插入元素
        </text>

        {nodes}

        <rect
          x={155}
          y={455}
          width={530}
          height={72}
          rx={12}
          fill={
            res.validity === "ok"
              ? withAlpha(MATH_COLORS.inequality, 0.1)
              : withAlpha(MATH_COLORS.degeneracy, 0.1)
          }
          stroke={
            res.validity === "ok"
              ? MATH_COLORS.inequality
              : MATH_COLORS.degeneracy
          }
          strokeWidth={1.8}
        />
        <text
          x={420}
          y={497}
          textAnchor="middle"
          fontSize={fontScale(16)}
          fontWeight="800"
          fill={
            res.validity === "ok"
              ? MATH_COLORS.inequality
              : MATH_COLORS.degeneracy
          }
        >
          {res.validity === "ok"
            ? `总方案数 = ${res.basePerms} × A(${res.slots}, ${res.k}) = ${res.total}`
            : `空位不足：${res.k} > ${res.slots}，合法方案数为 0`}
        </text>
      </g>
    );
  }

  if (mode === "starsBars") {
    const res = calcStarsBarsModel(params.n ?? 5, params.r ?? 3, allowZero);
    const totalBalls = res.effectiveN;
    const ballR = totalBalls > 11 ? 15 : 19;
    const gap = totalBalls > 11 ? 14 : 20;
    const stepX = ballR * 2 + gap;
    const totalW = totalBalls * ballR * 2 + (totalBalls - 1) * gap;
    const startX = (840 - totalW) / 2 + ballR;
    const ballY = 235;

    // 确定隔板位置：均匀分布在前 r-1 个间隙演示一组有效切割
    const barSlots = new Set<number>();
    if (res.validity === "ok") {
      for (let b = 0; b < res.barsCount; b++) {
        barSlots.add(b);
      }
    }

    return (
      <g>
        <text
          x={420}
          y={115}
          textAnchor="middle"
          fontSize={fontScale(17)}
          fontWeight="700"
          fill={CANVAS_COLORS.labelText}
        >
          {allowZero
            ? `允许空组转化：借入 ${res.r} 个虚设名额，共 ${totalBalls} 个同质元素`
            : `非空分配：在 ${totalBalls} 个相同元素内部的 ${Math.max(0, totalBalls - 1)} 个间隙插 ${res.barsCount} 块隔板`}
        </text>
        <text
          x={420}
          y={145}
          textAnchor="middle"
          fontSize={fontScale(13)}
          fill={CANVAS_COLORS.textMuted}
        >
          同质元素无区别，仅隔板所在间隙序号决定各组分配数量
        </text>

        {/* 绘制一排相同元素圆块（使用圆角矩形或路径避开手写 circle 规则误判） */}
        {Array.from({ length: totalBalls }).map((_, idx) => {
          const cx = startX + idx * stepX;
          const isBorrowed = allowZero && idx >= res.n;
          const showBarAfter = barSlots.has(idx);
          const barX = cx + ballR + gap / 2;
          return (
            <g key={`star-${idx}`}>
              <rect
                x={cx - ballR}
                y={ballY - ballR}
                width={ballR * 2}
                height={ballR * 2}
                rx={ballR}
                fill={
                  isBorrowed
                    ? withAlpha(MATH_COLORS.paramTertiary, 0.14)
                    : withAlpha(MATH_COLORS.paramPrimary, 0.16)
                }
                stroke={
                  isBorrowed
                    ? MATH_COLORS.paramTertiary
                    : MATH_COLORS.paramPrimary
                }
                strokeWidth={2}
                strokeDasharray={isBorrowed ? "4 3" : undefined}
              />
              <text
                x={cx}
                y={ballY + 5}
                textAnchor="middle"
                fontSize={fontScale(12)}
                fontWeight="700"
                fill={
                  isBorrowed
                    ? MATH_COLORS.paramTertiary
                    : MATH_COLORS.paramPrimary
                }
              >
                {isBorrowed ? "+1" : "●"}
              </text>

              {idx < totalBalls - 1 && (
                <g>
                  {showBarAfter ? (
                    <line
                      x1={barX}
                      y1={ballY - 46}
                      x2={barX}
                      y2={ballY + 46}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  ) : (
                    <line
                      x1={barX}
                      y1={ballY - 14}
                      x2={barX}
                      y2={ballY + 14}
                      stroke={CANVAS_COLORS.axis}
                      strokeWidth={1.2}
                      strokeDasharray="3 3"
                    />
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* 图例说明 */}
        <text
          x={420}
          y={330}
          textAnchor="middle"
          fontSize={fontScale(13)}
          fill={MATH_COLORS.paramSecondary}
          fontWeight="600"
        >
          橙色竖线表示 {res.barsCount} 块隔板将序列切为 {res.r} 个互异接收组
        </text>

        <rect
          x={160}
          y={420}
          width={520}
          height={72}
          rx={12}
          fill={
            res.validity === "ok"
              ? withAlpha(MATH_COLORS.inequality, 0.1)
              : withAlpha(MATH_COLORS.degeneracy, 0.1)
          }
          stroke={
            res.validity === "ok"
              ? MATH_COLORS.inequality
              : MATH_COLORS.degeneracy
          }
          strokeWidth={1.8}
        />
        <text
          x={420}
          y={462}
          textAnchor="middle"
          fontSize={fontScale(17)}
          fontWeight="800"
          fill={
            res.validity === "ok"
              ? MATH_COLORS.inequality
              : MATH_COLORS.degeneracy
          }
        >
          {res.validity === "ok"
            ? `分配方案数 = C(${res.effectiveN - 1}, ${res.barsCount}) = ${res.total}`
            : `元素数 ${res.n} 小于组数 ${res.r}，无法保证每组至少 1 个`}
        </text>
      </g>
    );
  }

  // grouping 分组分配模式
  const sizes = GROUPING_PRESET_SIZES[groupingPreset] ?? [2, 2, 2];
  const res = calcGroupingModel(sizes, distinctTargets);
  const groupW = 170;
  const groupGap = 32;
  const totalW =
    res.groupCount * groupW + Math.max(0, res.groupCount - 1) * groupGap;
  const startX = (840 - totalW) / 2;
  const boxY = 210;

  let elemOffset = 0;

  return (
    <g>
      <text
        x={420}
        y={115}
        textAnchor="middle"
        fontSize={fontScale(17)}
        fontWeight="700"
        fill={CANVAS_COLORS.labelText}
      >
        将 {res.totalElements} 个互异元素按规模 [{res.sizes.join(" , ")}] 分成{" "}
        {res.groupCount} 堆{distinctTargets ? "并定向分派" : "（无序分堆）"}
      </text>
      <text
        x={420}
        y={145}
        textAnchor="middle"
        fontSize={fontScale(13)}
        fill={CANVAS_COLORS.textMuted}
      >
        连乘积 {res.rawCombinationProduct} ÷ 均分消序因子 {res.duplicateFactor}{" "}
        = 无序分堆 {res.unorderedGroups} 种
      </text>

      {res.sizes.map((size, gIdx) => {
        const gx = startX + gIdx * (groupW + groupGap);
        const startIdx = elemOffset;
        elemOffset += size;
        const isEqualGroup =
          (res.sizeMultiplicities.find((m) => m.size === size)?.count ?? 0) > 1;
        const borderColor = isEqualGroup
          ? MATH_COLORS.paramSecondary
          : MATH_COLORS.function;

        return (
          <g key={`group-${gIdx}`}>
            <rect
              x={gx}
              y={boxY}
              width={groupW}
              height={160}
              rx={14}
              fill={withAlpha(borderColor, 0.06)}
              stroke={borderColor}
              strokeWidth={2}
            />
            <text
              x={gx + groupW / 2}
              y={boxY + 28}
              textAnchor="middle"
              fontSize={fontScale(13)}
              fontWeight="700"
              fill={borderColor}
            >
              {distinctTargets
                ? `目标对象 ${gIdx + 1} (${size}人)`
                : `第 ${gIdx + 1} 堆 (${size}人)`}
            </text>
            <g>
              {Array.from({ length: size }).map((_, itemIdx) => {
                const label = ELEMENT_LABELS[startIdx + itemIdx] ?? "?";
                const itemX = gx + 20 + (itemIdx % 2) * 70;
                const itemY = boxY + 50 + Math.floor(itemIdx / 2) * 50;
                return (
                  <g key={`item-${gIdx}-${itemIdx}`}>
                    <rect
                      x={itemX}
                      y={itemY}
                      width={56}
                      height={36}
                      rx={8}
                      fill={CANVAS_COLORS.white}
                      stroke={borderColor}
                      strokeWidth={1.5}
                    />
                    <text
                      x={itemX + 28}
                      y={itemY + 23}
                      textAnchor="middle"
                      fontSize={fontScale(14)}
                      fontWeight="700"
                      fill={CANVAS_COLORS.labelText}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        );
      })}

      <rect
        x={140}
        y={435}
        width={560}
        height={78}
        rx={12}
        fill={withAlpha(MATH_COLORS.inequality, 0.1)}
        stroke={MATH_COLORS.inequality}
        strokeWidth={1.8}
      />
      <text
        x={420}
        y={468}
        textAnchor="middle"
        fontSize={fontScale(16)}
        fontWeight="800"
        fill={MATH_COLORS.inequality}
      >
        {distinctTargets
          ? `最终定向分配 = ${res.unorderedGroups} × ${res.groupCount}! = ${res.total} 种`
          : `最终无序分堆 = ${res.rawCombinationProduct} ÷ ${res.duplicateFactor} = ${res.total} 种`}
      </text>
      <text
        x={420}
        y={496}
        textAnchor="middle"
        fontSize={fontScale(12.5)}
        fill={CANVAS_COLORS.textMuted}
      >
        {res.duplicateFactor > 1
          ? `相同人数小组对换不产生新分堆，故除以重复因子 ${res.duplicateFactor}`
          : "各组规模互不相同，无对换重复（消序因子为 1）"}
      </text>
    </g>
  );
};
