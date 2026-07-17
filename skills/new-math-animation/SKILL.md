---
name: new-math-animation
description: 新建数学动画页面 / 创建新的数学动画组件 / 新增数学动画场景 / 添加新的数学专题页面
---

# 新数学动画页面开发技能

> 在写第一行代码前，AI Agent 必须逐项过完本 Skill。所有「❌ 禁止」一旦出现即视为任务无效。

---

## Step 0：设计决策（代码前确认）

### 0A：布局 preset 选择

> **分屏是首选**：高中数学非常强调“数形结合”。将函数曲线/坐标网格与几何演变并列，能极大加深理解。

| preset | 设计尺寸 | 选用条件 |
|--------|---------|---------|
| `CANVAS_PRESETS.splitV` | 840×325 | **水平排列/数形结合**（如：上方函数曲线 + 下方单位圆）；或多图表对照 |
| `CANVAS_PRESETS.splitH` | 420×650 | **左右分栏对照**（如：左边场景几何图形 + 右边精细坐标系） |
| `CANVAS_PRESETS.full` | 840×650 | 无需多栏对照的纯几何/空间场景演示（立体几何判定、奔驰定理平面展示等） |
| `CANVAS_PRESETS.square` | 650×650 | 圆形/旋转对称（单位圆、极坐标、复数模长旋转） |

> ❌ 严禁手写 `width={840}` 等固定像素；必须走 `useAnimationViewport`。

### 0B：三屏内容分配（铁律）

```
左屏（LeftPanel）         中屏（AnimationSvgCanvas）         右屏（MathPanel）
─────────────────         ─────────────────────────         ─────────────────────
paramMeta → 数值参数      自适应坐标系与函数曲线图像        MathQuantity 数学量展示
                          几何要素（向量/点/切线）          Theorem 定理公式与条件
                          ❌ 禁止大段教学说明文字           GaokaoPoint 高考考点
                          ❌ 禁止完整定理证明               WarningItem 退化警示红字
```

### 0C：奇异退化与曲线连续性防护 (Math Priority)

1. **退化防崩与临界标记**：确认在参数如 $a=0$, $\omega=0$ 或分母为 0 时的数值防护。例如当 $a=0$ 时：
   - 顶点坐标 $(h, k)$ 在代码中置为 `null`。
   - 对称轴 $x = -b/(2a)$ 不在 SVG 中绘制，并在右屏 `WarningItem` 弹出警示消息。
   - 临界退化参数必须在 `paramMeta` 配置中的 `marks` 内声明 `variant: 'critical'`。
2. **计算层状态返回**：`src/math/` 下的计算纯函数必须返回包含 `{ isValid: boolean, isDegenerate: boolean, degenerateType?: string }` 状态的对象，以解耦 UI 与数学判定。
3. **采样点断开**：在 `FunctionGraph` 采样中，若函数值 $y$ 为 NaN 或 $\pm\infty$，必须立即中断当前 path 的绘制，等再次遇到有效点时使用 `M` 开始新的一段。

### 0D：多维及对称场景设计 (3D & Polar)

1. **3D 投影**：涉及空间几何（如线面角、法向量），统一调用 `math3DToDesign(x, y, z, scale, rotation)`。禁止组件内部私自编写 3D 转换矩阵。
2. **极坐标系与复平面**：涉及圆对称或旋转（如极坐标方程、复数模长辐角），必须使用 `PolarGrid` 组件绘制网格，统一极坐标底色渲染。

---

## Step 1：文件结构（必须遵守）

```
src/features/<domain>/<topic>/
├── <Topic>Animation.tsx          ← 薄编排层（Zustand/useState 状态管理，零数学公式计算）
├── components/
│   └── <Topic>Scene.tsx         ← SVG/Canvas 渲染（零状态/Store 依赖，纯几何/曲线渲染组件）
└── index.ts
```

- 计算库文件：`src/math/<topic>.ts` (纯计算库，零 React/DOM/window 依赖，严格输出 validity 标记)。
- 注册表定义：`src/data/registries/<topic>.ts` (参数及 `marks: [{ value: 0, variant: 'critical' }]` 定义)。

---

## Step 2：骨架代码模板

### 1. `src/math/<topic>.ts`
```typescript
/**
 * 纯数学模型计算库 — 禁止依赖 React/DOM 状态
 */
export interface <Topic>Result {
  value: number
  isValid: boolean
  isDegenerate: boolean
  degenerateType: 'none' | string
}

export function compute<Topic>(param: number): <Topic>Result {
  if (param === 0) {
    return { value: 0, isValid: false, isDegenerate: true, degenerateType: 'zero-param' }
  }
  return { value: 1 / param, isValid: true, isDegenerate: false, degenerateType: 'none' }
}
```

### 2. `<Topic>Animation.tsx`
```tsx
import { useState, useMemo } from 'react'
import { ThreePanel, AnimationSvgCanvas } from '@/components/Layout'
import { ParamControl, MathPanel } from '@/components/UI'
import type { ParamConfig } from '@/components/UI'
import { useAnimationViewport, useSceneScale } from '@/hooks'
import { CANVAS_PRESETS } from '@/theme'
import { <Topic>Scene } from './components/<Topic>Scene'
import { defaultParams, paramMeta } from '@/data/registries/<topic>'
import { build<Topic>Quantities } from '@/data/mathQuantities'

export function <Topic>Animation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
  }))

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  })

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  })

  const mathData = useMemo(() => {
    return build<Topic>Quantities('anim-<topic>', params)
  }, [params])

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
      key,
      label: meta.label,
      value: params[key] ?? meta.defaultValue ?? 0,
      min: meta.min,
      max: meta.max,
      step: meta.step ?? 0.1,
      description: meta.description,
    }))
  }, [params])

  return (
    <ThreePanel
      left={
        <ParamControl
          params={paramConfigs}
          onParamChange={(k, v) => setParams(prev => ({ ...prev, [k]: v }))}
          onReset={() => setParams({ a: defaultParams.a })}
        />
      }
      center={
        <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
          <<Topic>Scene params={params} scale={scale} />
        </AnimationSvgCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
        />
      }
    />
  )
}
```

### 3. `components/<Topic>Scene.tsx`
```tsx
import { CoordinateGrid, FunctionGraph } from '@/components/Math'
import type { SceneScale } from '@/hooks/useSceneScale'
import { MATH_COLORS } from '@/theme'

interface <Topic>SceneProps {
  params: { a: number }
  scale: SceneScale
}

export function <Topic>Scene({ params, scale }: <Topic>SceneProps) {
  const { a } = params
  return (
    <g>
      <CoordinateGrid scale={scale} />
      <FunctionGraph
        scale={scale}
        fn={(x) => a * x}
        color={MATH_COLORS.function}
      />
    </g>
  )
}
```

### 4. `src/data/registries/<topic>.ts`（含退化临界 marks）
```typescript
import type { ParamMeta } from '../types'

export const defaultParams = {
  a: 1.0,
} as const

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: 'a',
    label: '参数 a',
    min: -2.0,
    max: 2.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: 'core',
    description: '控制曲线形态，为 0 时退化',
    marks: [
      { value: 0, variant: 'critical', label: '退化为直线' }
    ]
  }
}
```

> ⚠️ 退化临界参数（如 `a=0`）必须在 `marks` 中配置 `variant: 'critical'`，`ParamControl` 会在滑块上显示醒目标记。

---

## Step 3：数学量色彩使用规范

| 语义层级 | 来源 | 适用 | import |
|---------|------|------|--------|
| **数学量/主曲线** | `MATH_COLORS.function` | 原函数图像曲线、主几何线段 | `@/theme` |
| **对比线/导数** | `MATH_COLORS.derivative` | 导数、切线、对比辅助曲线 | `@/theme` |
| **结果/交点** | `MATH_COLORS.vectorResult` / `focusPoint` | 曲线交点、零点、向量合成结果 | `@/theme` |
| **辅助线/对称轴** | `MATH_COLORS.asymptote` | 渐近线、对称轴、坐标系投影辅助线 | `@/theme` |
| **坐标网格** | `MATH_COLORS.axis` / `grid` | 坐标主轴、背景格线 | `@/theme` |

- ❌ 严禁在 SVG 或组件内手写 Hex 颜色代码（如 `stroke="#3b82f6"`）。
- ❌ 严禁在 Canvas 场景内使用带有 UI 语义色彩的 token（如直接引用 `colors.primary.500` 作为函数主曲线色彩，应使用 `MATH_COLORS.function`）。

---

## 执行前 Checklist（全部 ✅ 才能交付）

- [ ] **退化机制与临界标记**：当参数致使图形退化时，已完成防护逻辑，MathPanel 有红字 `WarningItem` 警示。同时退化临界参数（如 $a=0$）已在 `paramMeta` 中配置标记并指定 `variant: 'critical'`。
- [ ] **多维投影与网格**：3D 空间立体几何调用了 `math3DToDesign`；极坐标与旋转对称复数场景使用了 `PolarGrid` 组件。
- [ ] **公式对齐**：右屏 MathPanel 中的超长公式或定理均使用 KaTeX 的 `aligned` 环境进行了多行对齐排版。
- [ ] **连续性防线**：`FunctionGraph` 能够优雅跳过函数的奇异不连续点（防拉丝）。
- [ ] **三屏隔离**：中屏 SVG 内无多余教学推导段落；参数调控统一走 ParamControl 声明式；右屏卡片职责分明。
- [ ] **色彩隔离**：全代码无 Hex 硬编码颜色，无 UI 配色与数学量配色混用。
- [ ] **静态检查**：运行 `tsc -b` 无报错，纯计算层无 React/DOM 依赖，返回了完备的 validity 状态。

