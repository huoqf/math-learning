/**
 * src/utils/layout.ts
 * 场景排版几何纯函数（零 React / DOM 依赖）：Scene 与单测共用同一事实源，
 * 禁止在组件内重写宽度/高度算式、也不得把其入参再抄一份到测试里。
 *
 * ⚠️ 本模块的 estimateTextWidth 与 src/utils/labelOverlap.ts 的 estimateLabelTextWidth
 *    是**两套刻意独立、语义不同的模型**，已用不同命名区分，避免经 `export *`
 *    转出到 `@/utils` 时同名导出被静默遮蔽：
 *    · 本模块 —— 胶囊底框用：按**字体实测表**逼近真实宽度（不欠估，且尽量少浪费）；
 *    · labelOverlap —— 标签避让用：按 Unicode 区段**保守超估**（宁可估宽，避免标签重叠）。
 */

/**
 * 非 ASCII（汉字 / 全角标点 / 希腊字母…）每字按 1.0em 计。
 * 汉字实测恰为 1.000（全角等宽）；希腊字母实测约 0.6，此处取 1.0 属**有意的保守超估**。
 */
const FULL_WIDTH_EM = 1.0;

/**
 * ASCII 0x20–0x7E 的实测宽度表（单位 em = px ÷ 字号），索引 = 码位 − 0x20。
 *
 * 标定方式：对胶囊文本的实际渲染字体 **Segoe UI Bold**（胶囊 `<text fontWeight="bold">`，
 * `system-ui` 链在 Windows 落到该字体）以 400px 逐字符取 advance ÷ 400，
 * 再**向上取整到 0.05** ⇒ 对表内每个字符恒有「估算 ≥ 实测」，即结构性不欠估。
 *
 * 实测区间 **0.271em（`,`）～ 1.005em（`W`）**：跨度 3.7 倍，单一经验系数无法同时覆盖两端
 * （旧版单系数 0.55em 对 `W` 欠估 1.83×，对 `,` 超估 2.03×）。
 *
 * ⚠️ 换字体 / 换平台需重新标定本表。回归护栏见 `src/test/layoutMetrics.test.ts`：
 *    其中内置**未取整的原始实测值**（独立外部事实源，非本表拷贝），断言逐字符不欠估。
 */
const ASCII_EM_TABLE: readonly number[] = [
  0.3, 0.35, 0.5, 0.6, 0.6, 0.9, 0.85, 0.3, 0.4, 0.4, 0.5, 0.75, 0.3, 0.45, 0.3,
  0.45, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.3, 0.3, 0.75, 0.75,
  0.75, 0.45, 1.0, 0.75, 0.65, 0.65, 0.75, 0.55, 0.55, 0.75, 0.8, 0.35, 0.45,
  0.65, 0.55, 1.0, 0.8, 0.8, 0.65, 0.8, 0.7, 0.6, 0.6, 0.75, 0.7, 1.05, 0.7,
  0.65, 0.65, 0.4, 0.45, 0.4, 0.75, 0.45, 0.35, 0.55, 0.65, 0.5, 0.65, 0.55,
  0.4, 0.65, 0.65, 0.3, 0.3, 0.6, 0.3, 0.95, 0.65, 0.65, 0.65, 0.65, 0.4, 0.45,
  0.4, 0.65, 0.55, 0.8, 0.6, 0.55, 0.5, 0.4, 0.35, 0.4, 0.75,
];

/** 单字符占宽（em）：ASCII 查实测表，其余按全角保守计 */
function charEm(code: number): number {
  return code >= 0x20 && code <= 0x7e
    ? ASCII_EM_TABLE[code - 0x20]
    : FULL_WIDTH_EM;
}

/** 胶囊左右内边距 12px × 2 + 粗体与抗锯齿安全余量 6px */
const CAPSULE_PADDING_X = 30;
/** 胶囊最小高度（px） */
const CAPSULE_MIN_HEIGHT = 22;
/** 胶囊高度 = 字号 × 行高系数（含上下内边距） */
const CAPSULE_HEIGHT_RATIO = 2.2;

/**
 * 估算 SVG 单行文本的排版物理宽度（纯函数）
 *
 * 按字体实测表逐字符累加（见上方 `ASCII_EM_TABLE` 标定说明），
 * 结论对**任意**中英混排文案成立，不再受"文案里是否含宽体字母"约束。
 */
export function estimateTextWidth(text: string, fontPx: number): number {
  let emUnits = 0;
  for (let i = 0; i < text.length; i++) {
    emUnits += charEm(text.charCodeAt(i));
  }
  return emUnits * fontPx;
}

/**
 * 提示胶囊底框宽度（纯函数）：恒 ≥ 文本估算宽度 + 30px，且不窄于 minWidth
 */
export function calculateWarningCapsuleWidth(
  text: string,
  fontPx: number,
  minWidth = 110,
): number {
  const textWidth = estimateTextWidth(text, fontPx);
  return Math.max(minWidth, Math.ceil(textWidth + CAPSULE_PADDING_X));
}

/**
 * 提示胶囊底框高度（纯函数）：随字号自适应，不矮于 minHeight
 */
export function calculateWarningCapsuleHeight(
  fontPx: number,
  minHeight = CAPSULE_MIN_HEIGHT,
): number {
  return Math.max(minHeight, Math.round(fontPx * CAPSULE_HEIGHT_RATIO));
}
