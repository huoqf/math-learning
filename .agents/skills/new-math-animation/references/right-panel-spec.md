# 右屏看板规范：MathPanel 字段速查与课型精准分层

> **架构原则**：右屏是纯数据驱动的组件，所有内容由 `src/data/builders/<topic>.ts` 产出 `MathPanelData`，
> 由 `MathPanel` 组件自动渲染所有子区块。**严禁在 Animation.tsx 手写任何定理卡片或推演步骤 JSX。**

---

## 1. MathPanel 完整 Props 清单

```ts
interface MathPanelProps {
  // ① 几何特征量与代数解（必填，基础页面也必须有，可空数组）
  quantities: MathQuantity[];
  // ② 核心定理公式与命题前提（基础课必配，高考课精准特化）
  theorems?: Theorem[];
  // ③ 数学临界值、易错点与退化警示（置顶防踩坑）
  warnings?: WarningItem[];
  // ④ 高考破题三步推演链与评分细则（仅高考专题课配置）
  reasoningSteps?: ReasoningStep[];
  // ⑤ 高考要点、通法特征与秒杀心法
  gaokaoPoints?: GaokaoPoint[];
  // ⑥ 高考题型定位母题标头（如"新高考解答题 18 题 · 空间向量法"）
  examAnchor?: string;
  // ⑦ 记忆口诀（7字或14字节奏感强，学生可朗读）
  mnemonic?: string;
  // ⑧ 右屏标题（默认"高考破题与推演看板"）
  title?: string;
}
```

---

## 2. 各字段类型详解

### `MathQuantity` — 几何特征量与实时数值
```ts
interface MathQuantity {
  label: string;                                  // 中文名称（如"动点 P 实时坐标"）
  symbol?: string;                                // LaTeX 符号（如 "P(\\lambda)"）
  value: number | string;                         // 数值或坐标字符串（实时更新）
  unit?: string;                                  // 单位（如 "°"、"cm²"）
  color?: string;                                 // MATH_COLORS.* token（三位一体绑定）
  highlight?: 'positive' | 'negative' | 'zero' | 'extreme'; // 特殊高亮状态
  isInvariant?: boolean;                          // 是否为定值不变量（金色星标显示）
  invariantNote?: string;                         // 不变性原因说明（如"正方体面对角线距离恒为..."）
}
```

### `Theorem` — 核心定理公式
```ts
interface Theorem {
  name: string;                                         // 定理名（如"公垂线唯一定理"）
  latex: string;                                        // LaTeX 公式（纯 LaTeX，不加 $...$）
  condition?: string;                                   // 适用前提（如"当且仅当 P=H₁, Q=H₂"）
  prerequisites?: string[];                             // 前置定理（显示为蓝色小标签）
  note?: string;                                        // 补充说明（💡 图标显示）
  level?: 'core' | 'important' | 'derived' | 'supplementary'; // 分级（蓝/橙/灰/紫标签）
  mode?: 'inline' | 'block';                            // 公式渲染模式（默认 block）
}
```

### `WarningItem` — 易错警示
```ts
interface WarningItem {
  text: string;                                   // 警示文本（支持混合 LaTeX，用反引号包围代码符号）
  level: 'info' | 'warning' | 'danger';           // 蓝色信息 / 橙色警告 / 红色危险
}
```

### `ReasoningStep` — 高考破题推演步骤
```ts
interface ReasoningStep {
  step: number;                                   // 步骤编号（1, 2, 3...）
  title: string;                                  // 步骤标题（如"建立空间直角坐标系"）
  detail?: string;                                // 步骤说明文字（可含中文分析）
  latex?: string;                                 // LaTeX 公式（带入实时参数值）
  rubric?: string;                                // 高考采分点（如"采分点：建系与参数化（4分）"）
}
```

### `GaokaoPoint` — 高考要点
```ts
interface GaokaoPoint {
  text: string;                                   // 要点描述（中文，可含数学符号）
  importance: 'gaokao' | 'hard' | 'core' | 'basic' | 'extend'; // 等级色标
}
```

---

## 3. 课型精准分层——右屏应装配哪些字段？

| 字段 | 基础概念课 | 高考专题课 | 压轴综合课 |
|------|-----------|-----------|-----------|
| `quantities` | ✅ 必配（含实时数值） | ✅ 必配 | ✅ 必配 |
| `theorems` | ✅ 核心定理（2-3条，标 `level: 'core'`） | ✅ 特化定理（随模式切换） | ✅ 全量 |
| `warnings` | ⚠️ 仅退化临界点 | ✅ 易错采分点 | ✅ 分类讨论警示 |
| `gaokaoPoints` | 省略或1条简述 | ✅ 必配（通法三大法、秒杀特征） | ✅ 必配 |
| `examAnchor` | ❌ 省略 | ✅ 必配（题型定位母题标头） | ✅ 必配 |
| `reasoningSteps` | ❌ 省略 | ✅ 必配（带 `rubric` 采分点） | ✅ 必配 |
| `mnemonic` | ❌ 省略 | ✅ 7~14字口诀 | ✅ 必配 |

---

## 4. 右屏与左屏/中屏的三位一体色彩约定

**所有出现在 `quantities` 中的数学量，其 `color` 必须与对应左屏滑块 `labelFormula` 和中屏图形颜色严格对应：**

```ts
// 右屏 quantities
{ label: '主控系数 a', symbol: 'a', color: MATH_COLORS.paramPrimary }

// 左屏 labelFormula
`\\text{主控系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`

// 中屏 Theorem latex（公式内着色）
`f(x) = \\color{${MATH_COLORS.paramPrimary}}{a}x^2`
```

---

## 5. Builder 文件标准结构

右屏数据必须独立到 `src/data/builders/<topic>.ts`，不允许内联在 Animation 组件中：

```ts
// src/data/builders/<topic>.ts
import type { MathPanelData, MathQuantity, Theorem, GaokaoPoint, WarningItem, ReasoningStep } from '../types';
import { MATH_COLORS } from '@/theme';

export function build<Topic>Panel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? 'default';
  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor = '';
  let mnemonic = '';

  // 按 mode 分支装配各字段 ...

  return { quantities, theorems, gaokaoPoints, warnings, reasoningSteps, examAnchor, mnemonic };
}
```

然后在 `src/data/mathQuantities.ts` 的 `buildMathQuantities()` 函数中注册对应的 `animId` 分支（详见 `registration-guide.md`）。

---

## 6. 渲染层级（MathPanel 内部顺序，不可调换）

```
1. MathPanelHeader     —— 高考题型标头（examAnchor）
2. MathWarningSection  —— 易错临界警示（warnings）
3. MathReasoningSection—— 破题推演链（reasoningSteps）
4. MathTheoremSection  —— 核心定理公式（theorems）
5. MathGaokaoSection   —— 高考要点（gaokaoPoints）
6. MathMnemonicSection —— 记忆口诀（mnemonic）
7. MathInvariantsSection—— 几何特征量（quantities）
```

❌ **严禁**在 Animation.tsx 或 Scene.tsx 中手写任何右屏卡片、定理框或推演步骤——这些全部由 MathPanel 子组件自动渲染。

---

## 7. 高中数学学科认知与破题推演准则 (理顺思路 · 助力掌握)

为让右屏切实帮助学生理顺高中数学解题思路，`reasoningSteps` 与各板块必须遵循高中数学教学认知规律：

### ① 解答题破题三步推演标准架构
- **Step 1：审题定法 · 特征提取与转化**
  - 代数/几何：设元、建系、设动点坐标或选空间向量基底；
  - 函数/导数：求定义域、求导函数 $f'(x)$、求驻点/零点；
  - 必须标注考纲得分点：`rubric: '采分点：规范建系/求导并设元（2-4分）'`。
- **Step 2：建模联立 · 代数关系与方程构建**
  - 代数/解析：韦达定理、点到直线距离公式、法向量方程组 $\vec{n} \cdot \vec{AB} = 0$；
  - 动态代入当前参数的**具体数值/表达式**，让学生直观感知式子如何一步步随参数展开。
- **Step 3：求解反思 · 最值/定值/分类讨论**
  - 解方程、求极值/单调区间、判断取等条件或二次项 $a=0$ 等退化临界；
  - 配合置顶的 `warnings` 形成闭环，强化审题思维。

### ② 高中数学课标标准 LaTeX 符号速查
| 概念 | 正确规范 LaTeX | ❌ 常见违规错误 |
|------|---------------|----------------|
| 向量符号 | `\vec{a}`, `\overrightarrow{AB}` | `\mathbf{a}`, `AB` 无箭头 |
| 向量点乘 | `\vec{a} \cdot \vec{b}` | `\vec{a} * \vec{b}`, `\vec{a} \times \vec{b}`（外积在高中不适用） |
| 模长与绝对值 | `|\vec{a}|`, `|x_1 - x_2|` | `norm(a)`, `abs(x)` |
| 垂直与平行 | `l \perp \alpha`, `l \parallel \alpha` | `l \bot \alpha`, `l // \alpha` |
| 正负无穷与区间 | `(-\infty, +\infty)`, `[a, b)` | `(-inf, inf)`, `[a, b[` |
| 空集与判别式 | `\varnothing`, `\Delta = b^2 - 4ac` | `\phi`, `D = b^2 - 4ac` |
| 组合数与排列数 | `C_n^m` 或 `\binom{n}{m}`, `A_n^m` | `nCr`, `nPr` |
| 参数色彩绑定 | `\color{${MATH_COLORS.paramPrimary}}{a}` | 硬编码 `#EF4444` 或无颜色 |

