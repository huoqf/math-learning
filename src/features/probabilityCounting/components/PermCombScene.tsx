import { MATH_COLORS, withAlpha } from "../../../theme";
import {
  perm,
  comb,
  factorial,
  calculateGroupingAllocation,
} from "../../../math/probabilityCounting";
import type { SceneCommonProps } from "./types";
import { BALL_COLORS, formatComb, formatPerm } from "./types";

export function PermCombScene({
  params,
  subMode = 0,
  fontScale = (v) => v,
}: SceneCommonProps) {
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const groupTotal = Math.floor(params.groupTotal ?? 6);
  const groupCount = Math.floor(params.groupCount ?? 3);

  const P = perm(n, k);
  const C = comb(n, k);

  const balls = Array.from({ length: n }, (_, i) => ({
    id: i,
    label: String.fromCharCode(65 + i),
  }));

  // 1. 基础排列与组合对比
  if (subMode === 0) {
    return (
      <g transform="translate(40, 45)">
        {/* 顶部：原始元素池 (n 个球) */}
        <g transform="translate(20, 10)">
          <rect
            x={0}
            y={0}
            width={720}
            height={95}
            fill={MATH_COLORS.poolBg}
            stroke={MATH_COLORS.poolBorder}
            strokeWidth={1}
            rx={12}
          />
          <text
            x={18}
            y={28}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            原始元素池 (共 n = {n} 个不同元素):
          </text>

          {balls.map((ball, idx) => {
            const bx = 160 + idx * 54;
            const by = 54;
            return (
              <g key={`ball-${idx}`}>
                <circle
                  cx={bx}
                  cy={by}
                  r={18}
                  fill={BALL_COLORS[idx % BALL_COLORS.length]}
                  stroke={MATH_COLORS.white}
                  strokeWidth={2.5}
                />
                <text
                  x={bx}
                  y={by + 5}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(13)}
                  fontWeight="bold"
                >
                  {ball.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* 中部左侧：组合 C_n^k 选出结果 (无序集合) */}
        <g transform="translate(20, 120)">
          <rect
            x={0}
            y={0}
            width={345}
            height={315}
            fill={MATH_COLORS.combCardBg}
            stroke={MATH_COLORS.combCardBorder}
            strokeWidth={1.5}
            rx={14}
          />

          <text
            x={20}
            y={35}
            fill={MATH_COLORS.combHeader}
            fontSize={fontScale(14)}
            fontWeight="bold"
          >
            组合 {formatComb(n, k)} = {C} (无序选出)
          </text>

          {/* 选中的集合 */}
          <g transform="translate(20, 55)">
            <rect
              x={0}
              y={0}
              width={305}
              height={105}
              fill={MATH_COLORS.white}
              stroke={MATH_COLORS.combCardBorder}
              strokeDasharray="4 4"
              rx={8}
            />
            <text
              x={12}
              y={24}
              fill={MATH_COLORS.combHeader}
              fontSize={fontScale(11)}
            >
              示例选出子集 &#123;{" "}
              {balls
                .slice(0, k)
                .map((b) => b.label)
                .join(", ")}{" "}
              &#125;
            </text>
            {balls.slice(0, k).map((_, idx) => (
              <circle
                key={`c-sel-${idx}`}
                cx={32 + idx * 45}
                cy={65}
                r={16}
                fill={BALL_COLORS[idx % BALL_COLORS.length]}
              />
            ))}
          </g>

          {/* 剩下的补集 */}
          <g transform="translate(20, 180)">
            <rect
              x={0}
              y={0}
              width={305}
              height={115}
              fill={MATH_COLORS.white}
              stroke={MATH_COLORS.axis}
              rx={8}
            />
            <text
              x={12}
              y={24}
              fill={MATH_COLORS.textMuted}
              fontSize={fontScale(11)}
            >
              余下补集 (共 {n - k} 个) 自动成组 ({formatComb(n, k)} ={" "}
              {formatComb(n, n - k)})：
            </text>
            {balls.slice(k).map((_, idx) => (
              <circle
                key={`c-rem-${idx}`}
                cx={32 + idx * 45}
                cy={68}
                r={16}
                fill={BALL_COLORS[(k + idx) % BALL_COLORS.length]}
                opacity={0.65}
              />
            ))}
          </g>
        </g>

        {/* 中部右侧：排列 A_n^k 槽位选择 (有序队列) */}
        <g transform="translate(395, 120)">
          <rect
            x={0}
            y={0}
            width={345}
            height={315}
            fill={MATH_COLORS.permCardBg}
            stroke={MATH_COLORS.permCardBorder}
            strokeWidth={1.5}
            rx={14}
          />

          <text
            x={20}
            y={35}
            fill={MATH_COLORS.permHeader}
            fontSize={fontScale(14)}
            fontWeight="bold"
          >
            排列 {formatPerm(n, k)} = {P} (按序入座)
          </text>

          {/* 槽位选择图示 */}
          <g transform="translate(18, 65)">
            {Array.from({ length: Math.min(k, 5) }, (_, sIdx) => {
              const choicesLeft = n - sIdx;
              return (
                <g
                  key={`slot-${sIdx}`}
                  transform={`translate(${sIdx * 62}, 0)`}
                >
                  <rect
                    x={0}
                    y={0}
                    width={56}
                    height={110}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.permHeader}
                    strokeWidth={1.5}
                    rx={8}
                  />
                  <text
                    x={28}
                    y={22}
                    textAnchor="middle"
                    fill={MATH_COLORS.labelTextLight}
                    fontSize={fontScale(10)}
                  >
                    槽位 {sIdx + 1}
                  </text>
                  <circle
                    cx={28}
                    cy={52}
                    r={14}
                    fill={BALL_COLORS[sIdx % BALL_COLORS.length]}
                  />
                  <text
                    x={28}
                    y={92}
                    textAnchor="middle"
                    fill={MATH_COLORS.permHeader}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                  >
                    {choicesLeft} 种可能
                  </text>
                </g>
              );
            })}
          </g>

          <g transform="translate(20, 220)">
            <text
              x={0}
              y={12}
              fill={MATH_COLORS.permHeader}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              乘法分步连乘：
              {Array.from({ length: k }, (_, i) => n - i).join(" × ")} = {P}
            </text>
          </g>
        </g>

        {/* 下方直觉卡片 */}
        <g transform="translate(20, 455)">
          <rect
            x={0}
            y={0}
            width={720}
            height={68}
            fill={MATH_COLORS.tipBg}
            stroke={MATH_COLORS.tipBorder}
            strokeWidth={1}
            rx={10}
          />
          <text
            x={20}
            y={40}
            fill={MATH_COLORS.tipText}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            💡 核心区别直觉：排列 = 组合 × 内部全排列 ({k}!)。消去 {k}!
            种内部顺序即得组合数 {C}。
          </text>
        </g>
      </g>
    );
  }

  // 2. 均匀分组与消序模型 (subMode === 1)
  if (subMode === 1) {
    const groupInfo = calculateGroupingAllocation(groupTotal, groupCount);
    const groupItems = Array.from({ length: groupInfo.totalItems }, (_, i) => ({
      id: i,
      label: String.fromCharCode(65 + i),
    }));

    // 逐步选堆的组合数连乘链：严格跟随 groupTotal / groupCount 参数推导，杜绝写死 6/4/2
    const groupingChain = Array.from({ length: groupInfo.groupCount }, (_, i) =>
      formatComb(
        groupInfo.totalItems - i * groupInfo.itemsPerGroup,
        groupInfo.itemsPerGroup,
      ),
    ).join(" × ");

    return (
      <g transform="translate(40, 45)">
        <rect
          x={20}
          y={10}
          width={720}
          height={540}
          fill={MATH_COLORS.poolBg}
          stroke={MATH_COLORS.poolBorder}
          strokeWidth={1}
          rx={14}
        />

        <text
          x={45}
          y={45}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(15)}
          fontWeight="bold"
        >
          均匀分组消序模型：将 {groupInfo.totalItems} 个不同元素均分为{" "}
          {groupInfo.groupCount} 堆 (每堆 {groupInfo.itemsPerGroup} 个)
        </text>

        {/* 顶部原始元素 */}
        <g transform="translate(45, 68)">
          <text
            x={0}
            y={18}
            fill={MATH_COLORS.textMuted}
            fontSize={fontScale(12)}
          >
            元素库：
          </text>
          {groupItems.map((item, idx) => (
            <g
              key={`g-item-${idx}`}
              transform={`translate(${65 + idx * 46}, 12)`}
            >
              <circle
                cx={0}
                cy={0}
                r={14}
                fill={BALL_COLORS[idx % BALL_COLORS.length]}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(10)}
                fontWeight="bold"
              >
                {item.label}
              </text>
            </g>
          ))}
        </g>

        {/* 对比展示两栏：分步取堆 (虚假顺序) vs 真实无序堆 */}
        <g transform="translate(45, 115)">
          {/* 左栏：有顺序的分步选择 */}
          <rect
            x={0}
            y={0}
            width={320}
            height={250}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
            rx={10}
          />
          <text
            x={15}
            y={28}
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            ① 逐步选堆 (含人为产生的先后顺序)
          </text>

          <g transform="translate(15, 45)">
            {Array.from({ length: groupInfo.groupCount }, (_, gIdx) => (
              <g
                key={`step-g-${gIdx}`}
                transform={`translate(0, ${gIdx * 56})`}
              >
                <rect
                  x={0}
                  y={0}
                  width={290}
                  height={46}
                  fill={withAlpha(MATH_COLORS.tangentLine, 0.06)}
                  stroke={MATH_COLORS.tangentLine}
                  strokeDasharray="2 2"
                  rx={6}
                />
                <text
                  x={10}
                  y={28}
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(11)}
                >
                  第 {gIdx + 1} 次选堆：
                </text>
                {Array.from({ length: groupInfo.itemsPerGroup }, (_, iIdx) => (
                  <circle
                    key={`b-${gIdx}-${iIdx}`}
                    cx={120 + iIdx * 30}
                    cy={23}
                    r={12}
                    fill={
                      BALL_COLORS[
                        (gIdx * groupInfo.itemsPerGroup + iIdx) %
                          BALL_COLORS.length
                      ]
                    }
                  />
                ))}
              </g>
            ))}
          </g>

          {/* 右栏：无序真实堆并除以 k! */}
          <rect
            x={345}
            y={0}
            width={320}
            height={250}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.5}
            rx={10}
          />
          <text
            x={360}
            y={28}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            ② 真实无名堆 (除以 {groupInfo.groupCount}! 消序)
          </text>

          <g transform="translate(360, 50)">
            <text
              x={0}
              y={20}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(12)}
            >
              因为各堆没有名字标签，
            </text>
            <text
              x={0}
              y={44}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(12)}
            >
              {groupInfo.groupCount} 个堆之间存在 {groupInfo.groupCount}! ={" "}
              {groupInfo.divisionOrderFactor} 种全排列重复。
            </text>

            <rect
              x={0}
              y={70}
              width={290}
              height={85}
              fill={withAlpha(MATH_COLORS.paramTertiary, 0.1)}
              stroke={MATH_COLORS.paramTertiary}
              rx={8}
            />
            <text
              x={15}
              y={98}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              实际均分堆数计算：
            </text>
            <text
              x={15}
              y={130}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(13)}
              fontWeight="bold"
            >
              {groupInfo.directCombinationWays} ÷{" "}
              {groupInfo.divisionOrderFactor} = {groupInfo.groupedWays} 种
            </text>
          </g>
        </g>

        {/* 底部高考模型口诀 */}
        <g transform="translate(45, 385)">
          <rect
            x={0}
            y={0}
            width={665}
            height={135}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            rx={10}
          />
          <text
            x={20}
            y={32}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            高考黄金法则：无标签均分必消序，有标签分配乘阶乘
          </text>
          <text
            x={20}
            y={66}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
          >
            • 均分（无接收者）：N_均分 = ({groupingChain}) ÷{" "}
            {groupInfo.groupCount}! = {groupInfo.groupedWays} 种
          </text>
          <text
            x={20}
            y={100}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
          >
            • 定向分配（分给 {groupInfo.groupCount} 个不同对象）：N_分配 ={" "}
            {groupInfo.groupedWays} ×{" "}
            {formatPerm(groupInfo.groupCount, groupInfo.groupCount)} ={" "}
            {groupInfo.allocatedWays} 种
          </text>
        </g>
      </g>
    );
  }

  // 3. 捆绑法与插空法几何化 (subMode === 2)
  // 本模型固定 2 个受限元素 A、B（与右屏 builder 的 m = 2 口径完全一致），
  // 其余 freeCount = n - 2 个为无限制主体元素；全部图形与文案均由 n 推导，严禁写死。
  const nTotal = n;
  const bindCount = 2;
  const freeCount = Math.max(0, nTotal - bindCount);
  const bindWays = factorial(Math.max(0, nTotal - 1)) * factorial(bindCount);
  const insertWays = factorial(freeCount) * perm(freeCount + 1, bindCount);
  const freeLabels = Array.from({ length: freeCount }, (_, i) =>
    String.fromCharCode(67 + i),
  );

  // 中屏几何随 n 自适应：元素越多则间距越小，保证全部元素同屏可见且互不重叠
  const bindFreeSpacing = freeCount > 0 ? Math.min(60, 380 / freeCount) : 0;
  const insertSlotCount = 2 * freeCount + 1; // 空档与主体元素交替排布
  const insertUnit = Math.min(110, 600 / Math.max(1, insertSlotCount));
  const insertRadius = Math.max(9, Math.min(16, insertUnit * 0.34));
  const insertGapWidth = Math.max(18, Math.min(36, insertUnit * 0.7));

  // 退化保护：捆绑/插空均需同时存在受限元素 A、B，n < 2 时模型不成立
  if (nTotal < bindCount) {
    return (
      <g transform="translate(40, 45)">
        <rect
          x={20}
          y={10}
          width={720}
          height={540}
          fill={MATH_COLORS.poolBg}
          stroke={MATH_COLORS.poolBorder}
          strokeWidth={1}
          rx={14}
        />
        <text
          x={45}
          y={45}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(15)}
          fontWeight="bold"
        >
          捆绑法与插空法模型（高考排队模型）
        </text>
        <rect
          x={45}
          y={95}
          width={665}
          height={130}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          rx={10}
        />
        <text
          x={65}
          y={135}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          当前 n = {nTotal}，模型不成立
        </text>
        <text
          x={65}
          y={168}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(12)}
        >
          捆绑法（A 与 B 必须相邻）与插空法（A 与 B 互不相邻）都需同时存在 A、B
          两个受限元素。
        </text>
        <text
          x={65}
          y={196}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(12)}
        >
          请将左屏总数调到 n ≥ {bindCount}；n = {bindCount} 时相邻仅 1
          种排法，且 A、B 无法做到不相邻（插空为 0 种）。
        </text>
      </g>
    );
  }

  return (
    <g transform="translate(40, 45)">
      <rect
        x={20}
        y={10}
        width={720}
        height={540}
        fill={MATH_COLORS.poolBg}
        stroke={MATH_COLORS.poolBorder}
        strokeWidth={1}
        rx={14}
      />

      <text
        x={45}
        y={45}
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(15)}
        fontWeight="bold"
      >
        高考两大核心排队模型：捆绑法 (相邻) 与 插空法 (不相邻) —— 当前 n ={" "}
        {nTotal}
      </text>

      {/* 捆绑法区域 */}
      <g transform="translate(45, 70)">
        <rect
          x={0}
          y={0}
          width={665}
          height={205}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.combCardBorder}
          strokeWidth={1.5}
          rx={10}
        />
        <text
          x={20}
          y={28}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          模型一：捆绑法（要求 A 与 B 必须相邻，共 {nTotal} 个元素）
        </text>

        {/* 捆绑大胶囊 */}
        <g transform="translate(30, 48)">
          <rect
            x={0}
            y={0}
            width={160}
            height={68}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="4 4"
            rx={34}
          />
          <text
            x={80}
            y={22}
            textAnchor="middle"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            超元素 [AB] (内部 {formatPerm(bindCount, bindCount)})
          </text>
          <circle cx={48} cy={44} r={14} fill={BALL_COLORS[0]} />
          <circle cx={112} cy={44} r={14} fill={BALL_COLORS[1]} />
        </g>

        {/* 无限制主体元素：个数与间距严格由 n 推导 */}
        <g transform="translate(220, 80)">
          {freeLabels.map((label, idx) => (
            <g
              key={`free-el-${idx}`}
              transform={`translate(${30 + idx * bindFreeSpacing}, 13)`}
            >
              <circle
                cx={0}
                cy={0}
                r={14}
                fill={BALL_COLORS[(2 + idx) % BALL_COLORS.length]}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                {label}
              </text>
            </g>
          ))}
        </g>

        <text
          x={20}
          y={170}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(12)}
        >
          计算逻辑：将 [AB] 视作 1 个元素，与其余 {freeCount} 个元素共{" "}
          {freeCount + 1} 个大元素外排{" "}
          {formatPerm(freeCount + 1, freeCount + 1)} ={" "}
          {factorial(freeCount + 1)}，再乘内部全排{" "}
          {formatPerm(bindCount, bindCount)} = {factorial(bindCount)}：N_捆绑 ={" "}
          {factorial(freeCount + 1)} × {factorial(bindCount)} = {bindWays} 种
        </text>
      </g>

      {/* 插空法区域 */}
      <g transform="translate(45, 295)">
        <rect
          x={0}
          y={0}
          width={665}
          height={225}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.combCardBorder}
          strokeWidth={1.5}
          rx={10}
        />
        <text
          x={20}
          y={28}
          fill={MATH_COLORS.paramTertiary}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          模型二：插空法（要求 A 与 B 互不相邻，共 {nTotal} 个元素）
        </text>

        {/* 空档与主体元素交替排布：槽位数 = 主体数 + 1 = n - 1，全部由 n 推导 */}
        <g transform="translate(40, 60)">
          {Array.from({ length: insertSlotCount }, (_, slotIdx) => {
            const gapIndex = slotIdx / 2;
            const mainIndex = (slotIdx - 1) / 2;

            if (slotIdx % 2 === 0) {
              return (
                <g
                  key={`slot-gap-${gapIndex}`}
                  transform={`translate(${
                    slotIdx * insertUnit + (insertUnit - insertGapWidth) / 2
                  }, 0)`}
                >
                  <rect
                    x={0}
                    y={0}
                    width={insertGapWidth}
                    height={62}
                    fill={withAlpha(MATH_COLORS.paramTertiary, 0.15)}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeDasharray="2 2"
                    rx={6}
                  />
                  {insertGapWidth >= 24 && (
                    <text
                      x={insertGapWidth / 2}
                      y={36}
                      textAnchor="middle"
                      fill={MATH_COLORS.paramTertiary}
                      fontSize={fontScale(9)}
                      fontWeight="bold"
                    >
                      空
                    </text>
                  )}
                </g>
              );
            }

            return (
              <g
                key={`main-el-${mainIndex}`}
                transform={`translate(${slotIdx * insertUnit + insertUnit / 2}, 31)`}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={insertRadius}
                  fill={BALL_COLORS[(2 + mainIndex) % BALL_COLORS.length]}
                />
                {insertRadius >= 11 && (
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fill={MATH_COLORS.white}
                    fontSize={fontScale(9)}
                    fontWeight="bold"
                  >
                    {freeLabels[mainIndex]}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <text
          x={20}
          y={168}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(12)}
        >
          计算逻辑：先排无限制的 {freeCount} 个元素（
          {formatPerm(freeCount, freeCount)} = {factorial(freeCount)} 种），形成{" "}
          {freeCount + 1} 个空档；
        </text>
        <text
          x={20}
          y={196}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(12)}
        >
          再将 A、B 插入空档（{formatPerm(freeCount + 1, bindCount)} ={" "}
          {perm(freeCount + 1, bindCount)} 种）：N_插空 = {factorial(freeCount)}{" "}
          × {perm(freeCount + 1, bindCount)} = {insertWays} 种
        </text>
      </g>
    </g>
  );
}
