import { MATH_COLORS } from "../../../theme";
import { perm, comb } from "../../../math/probabilityCounting";
import type { SceneCommonProps } from "./types";
import { BALL_COLORS } from "./types";

export function PermCombScene({
  params,
  fontScale = (v) => v,
}: SceneCommonProps) {
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);

  const P = perm(n, k);
  const C = comb(n, k);

  const balls = Array.from({ length: n }, (_, i) => ({
    id: i,
    label: String.fromCharCode(65 + i),
  }));

  return (
    <g transform="translate(40, 20)">
      {/* 顶部：原始元素池 (n 个球) */}
      <g transform="translate(20, 15)">
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
      <g transform="translate(20, 130)">
        <rect
          x={0}
          y={0}
          width={345}
          height={285}
          fill={MATH_COLORS.combCardBg}
          stroke={MATH_COLORS.combCardBorder}
          strokeWidth={1.5}
          rx={14}
        />

        {/* 选中的集合 */}
        <g transform="translate(20, 75)">
          <rect
            x={0}
            y={0}
            width={305}
            height={80}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.combCardBorder}
            strokeDasharray="4 4"
            rx={8}
          />
          <text
            x={12}
            y={22}
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
              cy={48}
              r={15}
              fill={BALL_COLORS[idx]}
            />
          ))}
        </g>

        {/* 剩下的补集 */}
        <g transform="translate(20, 175)">
          <rect
            x={0}
            y={0}
            width={305}
            height={80}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.axis}
            rx={8}
          />
          <text
            x={12}
            y={22}
            fill={MATH_COLORS.textMuted}
            fontSize={fontScale(11)}
          >
            余下补集 (共 n-k = {n - k} 个) 自动成组：
          </text>
          {balls.slice(k).map((_, idx) => (
            <circle
              key={`c-rem-${idx}`}
              cx={32 + idx * 45}
              cy={48}
              r={15}
              fill={BALL_COLORS[k + idx]}
              opacity={0.65}
            />
          ))}
        </g>
      </g>

      {/* 中部右侧：排列 A_n^k 槽位选择 (有序队列) */}
      <g transform="translate(395, 130)">
        <rect
          x={0}
          y={0}
          width={345}
          height={285}
          fill={MATH_COLORS.permCardBg}
          stroke={MATH_COLORS.permCardBorder}
          strokeWidth={1.5}
          rx={14}
        />

        {/* 槽位选择图示 */}
        <g transform="translate(18, 75)">
          {Array.from({ length: Math.min(k, 5) }, (_, sIdx) => {
            const choicesLeft = n - sIdx;
            return (
              <g key={`slot-${sIdx}`} transform={`translate(${sIdx * 62}, 0)`}>
                <rect
                  x={0}
                  y={0}
                  width={56}
                  height={88}
                  fill={MATH_COLORS.white}
                  stroke={MATH_COLORS.permHeader}
                  strokeWidth={1.5}
                  rx={8}
                />
                <text
                  x={28}
                  y={18}
                  textAnchor="middle"
                  fill={MATH_COLORS.labelTextLight}
                  fontSize={fontScale(10)}
                >
                  槽位 {sIdx + 1}
                </text>
                <circle
                  cx={28}
                  cy={42}
                  r={13}
                  fill={BALL_COLORS[sIdx % BALL_COLORS.length]}
                />
                <text
                  x={28}
                  y={76}
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

        <g transform="translate(20, 202)">
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
      <g transform="translate(20, 432)">
        <rect
          x={0}
          y={0}
          width={720}
          height={58}
          fill={MATH_COLORS.tipBg}
          stroke={MATH_COLORS.tipBorder}
          strokeWidth={1}
          rx={10}
        />
        <text
          x={20}
          y={34}
          fill={MATH_COLORS.tipText}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          💡 核心区别直觉：排列 = 组合 × 内部全排列 (k!)。消去 {k}!
          种内部顺序即得组合数 {C}。
        </text>
      </g>
    </g>
  );
}
