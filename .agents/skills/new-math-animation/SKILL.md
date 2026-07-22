---
name: new-math-animation
description: >
  新建数学动画页面 / 创建新的数学动画组件 / 新增数学动画场景 / 添加新的数学专题页面
  / 改造现有页面 / 重构数学页面 / 修改动画组件 / 优化数学动画 / 调整页面布局
  / 修改现有动画 / 重新设计页面 / 更新数学组件 / 新建函数图像页面 / 新建几何动画
  / 仿照二次函数实验室 / 添加正弦函数 / 添加余弦函数 / 添加三角函数页面
  / 添加导数动画 / 添加不等式页面 / 建立坐标系 / 添加交互动画 / 数形结合动画
  / 按项目规范新建 / 新建高中数学页面 / 创建数学可视化 / 参数化动画
---

# 新数学动画页面开发技能

> **AI Agent 铁则**：在写第一行代码前，必须逐项过完本 Skill。所有「❌ 禁止」一旦出现即视为任务无效。

---

## 🚀 Step 0：设计决策（代码前必须对齐）

### 0A：布局 Preset 选择

> **ull 是高中数学的绝对主力 preset**，坐标系+函数曲线+几何元素+交互控制点均在同一统一视图。

| Preset | 设计尺寸 | 使用频率 | 选用条件 |
|--------|---------|---------|---------|
| CANVAS_PRESETS.full | 840×650 | ⭐⭐⭐ **首选** | 代数/几何/函数类（**绝大多数页面**） |
| CANVAS_PRESETS.square | 650×650 | ⭐⭐ 常用 | 单位圆、三角函数、复数、极坐标 |
| CANVAS_PRESETS.splitV | 840×325 | ⭐ 少用 | 仅限：f(x)+f'(x) 双坐标系对照 |
| CANVAS_PRESETS.splitH | 420×650 | ⭐ 少用 | 仅限：纵向双图对比（y轴量纲不同） |

**决策规则**：
- 能把两个视图合并到同一坐标系 → 必须用 full，禁止 split
- 需要圆形/旋转对称 → square
- splitV/splitH 仅限极少数场景（如 f(x)+f'(x) 双坐标系对照），使用前必须确认能否合并到同一坐标系
- ❌ 严禁手写 width={840} 固定像素，必须走 useAnimationViewport

### 0B：三屏职责分配（铁律）

```
左屏 LeftPanel                    中屏 AnimationSvgCanvas              右屏 MathPanel
────────────────────              ──────────────────────────           ──────────────────────
• paramMeta → ParamControl        • 坐标系、函数曲线、几何元素         • quantities（数学量）
• LeftPanelSection 模式切换       • 可拖拽点、切线渐近线阴影           • theorems（定理公式）
• 按钮组（支持 KaTeX）            • 公式悬浮展示（KatexFormula）      • gaokaoPoints（高考要点）
                                  ❌ 禁止大段教学文字                  • warnings（退化警示）
                                  ❌ 禁止完整公式推导                  • mnemonic（记忆口诀）
                                  ❌ 禁止高考考点总结                  ❌ 禁止动画控制控件
```

左屏禁止 `<select>` 原生下拉框，模式切换用按钮组。

### 0C：组件 Import 路径速查

Layout: ThreePanel, AnimationSvgCanvas, PageLayout → @/components/Layout
Math: CoordinateGrid, PolarGrid, FunctionGraph, InteractivePoint, VectorArrow, TangentLine, SecantLine, Asymptote, IntervalShadow, TrackPath → @/components/Math
UI: LeftPanel, LeftPanelSection, ParamControl, MathPanel, KatexFormula, TabSwitcher, SelectGrid → @/components/UI
Hooks: useAnimationViewport, useSceneScale, useRadioGroup → @/hooks
Theme: CANVAS_PRESETS, MATH_COLORS, ALGEBRA_COLORS, CALCULUS_COLORS, withAlpha → @/theme
Utils: buildPolyLatex, buildQuadraticLatex → @/utils/polyBuilder
Utils: mathToDesign, designToMath → @/utils/coordinate
Utils: avoidLabelOverlap → @/utils/labelOverlap
Data: buildMathQuantities → @/data/mathQuantities
Registry: defaultParams, paramMeta → @/data/registries/<topic>

---

## 🏗️ Step 1：文件结构（必须遵守）

src/features/<domain>/<topic>/
  <Topic>Animation.tsx  ← 薄编排层（状态管理、联动、零数学计算）
  components/
    <Topic>Scene.tsx    ← SVG/Canvas 渲染（零 Store/状态，仅渲染+分发 onDrag）
  index.ts

src/math/<topic>.ts               ← 纯计算库（零 React/DOM/window，返回 validity+degeneration）
src/data/registries/<topic>.ts    ← 参数注册表（paramMeta + defaultParams）

---

## 🔑 Step 2：核心布局骨架（严格按此写法）

### Animation 编排层

参考文件：src/features/quadratic/QuadraticAnimation.tsx

`
import { useState, useMemo } from 'react'
import { ThreePanel, AnimationSvgCanvas } from '@/components/Layout'
import { ParamControl, MathPanel, KatexFormula, LeftPanel, LeftPanelSection } from '@/components/UI'
import type { ParamConfig } from '@/components/UI'
import { useAnimationViewport, useSceneScale } from '@/hooks'
import { CANVAS_PRESETS, MATH_COLORS } from '@/theme'
import { TopicScene } from './components/TopicScene'
import { buildMathQuantities } from '@/data/mathQuantities'
import { defaultParams, paramMeta } from '@/data/registries/topic'

export function TopicAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }))

  // 步骤1：viewport + 自适应画布（固定搭配，缺一不可）
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,  // 根据 0A 选择正确 preset
  })

  // 步骤2：比例尺 — 数学范围 → 设计坐标空间映射
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],     // 按需调整
    yRange: [-4.5, 4.5],
  })

  // 步骤3：右屏数学量组装
  const mathData = useMemo(() =>
    buildMathQuantities('anim-topic', params), [params])

  // 步骤3.5：公式字符串拼接（对参数 a 应用 paramPrimary 颜色，与滑块/图形呼应）
  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1)
    return `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}x^2`
  }, [params.a])

  // 步骤4：左屏参数配置（声明式，禁止手写 <input>）
  // 多模式页：按 activeMode 过滤参数，仅展示当前模式需要的滑块
  const paramConfigs = useMemo(() => {
    const keysByMode = {
      modeA: ['x0', 'a'],       // 该模式需要的参数 key
      modeB: ['m', 'n', 'step'],
    }
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta)
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key]
        return {
          key, label: meta.label,
          labelFormula: meta.labelFormula,       // 参数标签 KaTeX（优先于 label）
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min, max: meta.max, step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula, // 参数描述 KaTeX（优先于 description）
          importance: meta.importance,
          marks: meta.marks,
        }
      })
  }, [params, activeMode])  // ⚠️ 依赖必须包含 activeMode

  const handleParamChange = (key, value) =>
    setParams(prev => ({ ...prev, [key]: value }))

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区（如有多个模式） */}
          <LeftPanelSection title="模式选择" subtitle="...">
            <TabSwitcher
              tabs={[
                { key: 'modeA', label: '基本性质' },
                { key: 'modeB', label: '反函数', formula: 'f^{-1}(x)' },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k)}
            />
          </LeftPanelSection>

          {/* 子选项选择（公式按钮网格） */}
          <LeftPanelSection title="参数选择" subtitle="...">
            <SelectGrid
              items={[
                { key: 'opt1', label: '选项1', formula: 'f(x)' },
                { key: 'opt2', label: '选项2', formula: 'g(x)' },
              ]}
              value={selected}
              onChange={(k) => setSelected(k)}
              columns={3}
            />
            {/* fullWidth: 某项独占一行（2+1 布局）；description: label/formula 下方小字说明 */}
            <SelectGrid
              items={[
                { key: 'a', label: 'a > 0', formula: 'a > 0' },
                { key: 'b', label: 'a < 0', formula: 'a < 0' },
                { key: 'c', label: 'a = 0', formula: 'a = 0', description: '退化情况', fullWidth: true },
              ]}
              value={subMode}
              onChange={(k) => setSubMode(k)}
            />
          </LeftPanelSection>

          {/* 参数调节区 */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块...">
            <ParamControl params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })} />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 可选：公式悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>
          {/* ✅ containerRef + vp.transform 是固定搭配 */}
          <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
            <TopicScene params={params} scale={scale} vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font} />  {/* ✅ 必须传 fontScale */}
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel quantities={mathData.quantities} theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints} warnings={mathData.warnings}
          mnemonic={mathData.mnemonic} title="xxx看板" />
      }
    />
  )
}
`

### Scene 渲染层

参考文件：src/features/quadratic/components/QuadraticScene.tsx

`
import type { SceneScale } from '@/hooks/useSceneScale'
import type { ViewportInfo } from '@/utils/useViewport'
import { CoordinateGrid, FunctionGraph, InteractivePoint } from '@/components/Math'
import { mathToDesign } from '@/utils/coordinate'
import { MATH_COLORS } from '@/theme'

interface SceneProps {
  params: Record<string, number>
  scale: SceneScale
  vp: ViewportInfo
  onParamChange: (key: string, value: number) => void
  fontScale?: (v: number) => number  // 来自 Animation 的 canvasSize.font
}

export function TopicScene({ params, scale, vp, onParamChange, fontScale = v => v }) {
  const handleDrag = (mathPt) => {
    // 拖拽回调：将数学坐标反向更新到 params
    onParamChange('x0', Math.round(mathPt.x * 100) / 100)
  }

  return (
    <g>
      {/* ✅ 坐标轴：必须传 fontScale */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ✅ 函数曲线（本曲线由核心参数 a 决定，使用 paramPrimary 保证与滑块、公式的三位一体绑定） */}
      <FunctionGraph
        fn={x => params.a * x * x + params.b * x + params.c}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
      />

      {/* ✅ 可拖拽控制点（双向联动）—— 内部已封装 clientToSvgPoint + designToMath，onDrag 直接返回数学坐标 */}
      <InteractivePoint
        cx={params.x0} cy={0}
        scale={scale} vp={vp}
        onDrag={handleDrag}
        label={`P(${params.x0}, 0)`}
        fontScale={fontScale}
      />
    </g>
  )
}
`

### 标注避让（铁律 7）

当 Scene 中有多个标注（顶点、交点、零点等）距离过近时，使用 `avoidLabelOverlap` 工具自动偏移。该工具检测碰撞方向，选择空间更大的轴推开（水平重叠→左右推，垂直重叠→上下推），多轮迭代直到无碰撞：

```tsx
import { avoidLabelOverlap } from '@/utils/labelOverlap'
import { mathToDesign } from '@/utils/coordinate'

// 在 useMemo 中计算偏移
const labelOffsets = useMemo(() => {
  const labels = points.map(p => {
    const pt = mathToDesign(p.x, p.y, scale)
    return { x: pt.x, y: pt.y - 12, width: 40, height: 14 }
  })
  return avoidLabelOverlap(labels)
}, [points, scale])

// 渲染时应用偏移
<text x={pt.x + labelOffsets[i].dx} y={pt.y + labelOffsets[i].dy}>...</text>
```

---

### 三层坐标体系

数学坐标 (mathX, mathY)
  ↕  mathToDesign / designToMath（由 scale 对象描述映射关系）
设计坐标 (designX, designY)
  ↕  vp.transform（CSS transform，由 AnimationSvgCanvas 统一应用到 <g> 上）
SVG 视口坐标 (svgX, svgY)

vp.transform 说明：useViewport 计算出的 CSS transform 字符串，将设计尺寸（如 840×650）
缩放+平移到实际 DOM 容器尺寸，子组件无需关心，AnimationSvgCanvas 已统一处理。

### 标准场景：InteractivePoint 已封装全部转换

**拖拽控制点无需手动坐标转换。** `InteractivePoint` 内部已封装完整链路：

```
clientX/Y → clientToSvgPoint（SVG视口坐标）
  → (svgPt - vp.tx) / vp.scale（设计坐标）
  → designToMath（数学坐标）
  → onDrag(mathPt)
```

调用方只需接收数学坐标，无需关心转换细节：

```tsx
<InteractivePoint
  cx={params.x0} cy={0}
  scale={scale} vp={vp}
  onDrag={(mathPt) => setParams(prev => ({ ...prev, x0: mathPt.x }))}
/>
```

### 渲染场景：mathToDesign（数学 → 设计坐标）

所有 Math 组件（CoordinateGrid、FunctionGraph、VectorArrow 等）内部统一使用 `mathToDesign` 将数学坐标映射到设计坐标，由 `vp.transform` 统一缩放：

```tsx
import { mathToDesign } from '@/utils/coordinate'
const { x, y } = mathToDesign(mathX, mathY, scale)
```

### 禁止用法

```
// ❌ 以下全部禁止
const x = mathX * scale.scaleX + scale.originX
const y = scale.originY - mathY * scale.scaleY
const scale = 0.8  // 硬编码 scale
viewBox="0 0 840 650"  // 与 vp.transform 同时使用
<foreignObject> 内嵌 React 图表  // HTML 层 flex 分区，图表与 SVG 平级
// ❌ 禁止手动做 clientX/Y → 数学坐标的转换，使用 InteractivePoint
```

---

## 🔠 Step 4：fontScale 传递链路（必须完整）

Animation 层
  const { canvasSize } = useAnimationViewport(...)
  传给 Scene：fontScale={canvasSize.font}

Scene 层
  接收 fontScale prop: (v: number) => number
  传给所有子组件：
    <CoordinateGrid fontScale={fontScale} />
    <InteractivePoint fontScale={fontScale} />
    <Asymptote fontScale={fontScale} />
    <VectorArrow fontScale={fontScale} />

SVG 内文本：fontSize={fontScale(10)} ✅   className="text-[10px]" ❌   fontSize={14} ❌

---

## 🎨 Step 5：颜色规范与“公式-图形-滑块”三位一体绑定

```typescript
import { MATH_COLORS, withAlpha } from '@/theme'

// 1. 函数与微积分
MATH_COLORS.function           // 原函数主曲线 f(x)
MATH_COLORS.functionSecondary   // 对比函数或复合内层曲线 g(x)
MATH_COLORS.functionTransformed // 变换后/目标曲线 f(ax+b)
MATH_COLORS.derivative         // 导数曲线 f'(x)
MATH_COLORS.tangentLine        // 切线
MATH_COLORS.secantLine         // 演示极限逼近的割线

// 2. 三角学与单位圆 (Trigonometry)
MATH_COLORS.sin                // 正弦线 / sin(x) 曲线 (鲜红)
MATH_COLORS.cos                // 余弦线 / cos(x) 曲线 (翠绿)
MATH_COLORS.tan                // 正切线 / tan(x) 曲线 (葡萄紫)

// 3. 解析几何与向量
MATH_COLORS.vectorPrimary      // 主向量 (深蓝)
MATH_COLORS.vectorSecondary    // 辅助向量 (深绿)
MATH_COLORS.vectorResult       // 结果/和向量 (亮红)
MATH_COLORS.directrix          // 准线 (黄)
MATH_COLORS.asymptote          // 双曲线/正切渐近线 (灰)
MATH_COLORS.focusPoint         // 焦点 (红)
MATH_COLORS.vertexPoint        // 顶点
MATH_COLORS.trace              // 动点轨迹残影 (紫)

// 4. “公式-图形-滑块”三位一体参数绑定 (核心)
MATH_COLORS.paramPrimary       // 核心主控参数一 (如 a, k) -> 对应 LaTeX: \color{#EF4444}{a}
MATH_COLORS.paramSecondary     // 次要关联参数二 (如 b) -> 对应 LaTeX: \color{#D97706}{b}
MATH_COLORS.paramTertiary      // 辅助或常数参数三 (如 c, θ) -> 对应 LaTeX: \color{#059669}{c}

// 5. 交互与退化状态
MATH_COLORS.interactiveHover   // 可拖拽点 Hover 发光色
MATH_COLORS.interactiveActive  // 拖拽激活色
MATH_COLORS.degeneracy         // 图形退化/无解警示色
MATH_COLORS.limitPoint         // 极限逼近的目标点

// 6. 3D 空间直角坐标系 (RGB 规范)
MATH_COLORS.axis3D_X           // 空间 X 轴 (红)
MATH_COLORS.axis3D_Y           // 空间 Y 轴 (绿)
MATH_COLORS.axis3D_Z           // 空间 Z 轴 (蓝)
```

❌ **严禁任何硬编码颜色**：如 `stroke="#3b82f6"`、`stroke="red"`。
❌ **禁止公式与滑块颜色脱节**：必须对公式中的参数变量加上对应的 `paramPrimary` / `Secondary` / `Tertiary` 颜色 Hex 标记，实现视觉强绑定。


---

## 📋 Step 6：注册步骤（新建页面必做）

1. 路由：src/App.tsx 的 NAV_ITEMS 数组添加导航项，Routes 添加 Route
2. mathQuantities：src/data/mathQuantities.ts 的 buildMathQuantities 添加新 animId 分支
3. registry：src/data/registries/<topic>.ts 定义 defaultParams 和 paramMeta
4. 组件导出：如创建新公共组件，在 src/components/*/index.ts 中导出

### Registry 文件模板

`
import type { ParamMeta } from '../types'

export const defaultParams = { a: 1.0 } as const

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: 'a', label: '系数 a',
    labelFormula: 'a',  // 含数学符号时提供 KaTeX 版本
    min: -2.0, max: 2.0, step: 0.1,
    defaultValue: 1.0, importance: 'core',
    description: '控制 y = ax² 的开口',
    // descriptionFormula 格式：$...$ 包裹数学部分，中文自动换行
    // 支持 3 种格式：$...$ 混合（推荐）、\text{...} 旧格式、纯 LaTeX
    descriptionFormula: '控制 $y = ax^2$ 的开口',
    marks: [{ value: 0, variant: 'critical', label: '退化', labelFormula: 'a = 0' }]
  },
}
`

---

## 🚨 Step 7：禁止行为速查

❌ fill="#3B82F6" → ✅ MATH_COLORS.*
❌ fontSize={14} → ✅ fontScale(14)
❌ className="text-[10px]" SVG内 → ✅ fontSize={fontScale(10)}
❌ x * scaleX + offsetX 手写坐标换算 → ✅ mathToDesign(x, y, scale)
❌ <input type="range"> 手写滑块 → ✅ paramMeta → ParamControl
❌ <line> 手写坐标轴 → ✅ CoordinateGrid
❌ <line> 手写几何向量 → ✅ VectorArrow
❌ viewBox={...} 与 vp.transform 同时用 → ✅ 仅用 AnimationSvgCanvas
❌ BrowserRouter → ✅ HashRouter only
❌ requestAnimationFrame(cb) 裸调用 → ✅ 数学页面禁止使用，仅在有时间演化需求时自行管理 RAF
❌ src/math/ import React/DOM/window → ✅ 纯函数，零副作用
❌ 公式与滑块参数使用不一致的颜色或硬编码颜色 → ✅ 使用 paramPrimary/Secondary/Tertiary 并在 KaTeX 中用 \color 上色实现三位一体绑定
❌ 左屏手写 <button> 做选择控件 → ✅ TabSwitcher（Tab 切换）或 SelectGrid（公式按钮网格）
❌ formula 字段用 $...$ 包裹 → ✅ 纯 LaTeX，katex.render() 直接接收

---

## ✅ 交付前 Checklist

新建页面：
- [ ] Preset 选择正确（默认 full，圆形用 square，split 需前置审查）
- [ ] 三屏隔离：中屏无教学文字，参数走 ParamControl，右屏职责分明
- [ ] viewport 链路：useAnimationViewport → vp.transform → AnimationSvgCanvas → Scene
- [ ] fontScale 链路：canvasSize.font → Scene → CoordinateGrid/InteractivePoint/Asymptote/VectorArrow
- [ ] 坐标变换：渲染用 mathToDesign，拖拽用 InteractivePoint（内部已封装 designToMath），无手写坐标换算
- [ ] 颜色规范：无硬编码颜色，且通过 paramPrimary/Secondary/Tertiary 保证公式-图形-滑块色彩三位一体绑定
- [ ] 三维规范：3D 场景下严格遵循 XYZ 三轴红-绿-蓝 (axis3D_X/Y/Z) 标准轴色设定
- [ ] 组件复用：切线/渐近线/阴影等用专用组件，不手写等效 SVG
- [ ] 数形双向联动：InteractivePoint + onDrag 反向更新 state
- [ ] 退化防范：marks.variant: 'critical' + MathPanel WarningItem
- [ ] 曲线连续性：FunctionGraph 对 NaN/±Infinity 断开处理
- [ ] 左屏参数过滤：多模式页的 `paramConfigs` 按 `activeMode` 过滤，依赖数组包含 `activeMode`
- [ ] 左屏公式渲染：paramMeta 中含数学符号的 label/description/marks[].label 提供对应 Formula 字段（推荐 `$...$` 格式）
- [ ] 左屏选择控件：模式切换用 TabSwitcher，公式选择用 SelectGrid，禁止手写 button
- [ ] formula 格式：纯 LaTeX，无 $ 包裹
- [ ] 路由注册：NAV_ITEMS + Routes
- [ ] mathQuantities 分支：buildMathQuantities 添加 animId

改造现有页面：
- [ ] 无重复组件：在原文件编辑，未创建新文件替代
- [ ] 左屏未手写控件：通过 paramMeta 调整
- [ ] 右屏未绕过统一入口：在 buildMathQuantities 对应分支修改
- [ ] 组件复用：新增视觉元素使用既有专用组件

参考模板：src/features/quadratic/QuadraticAnimation.tsx + src/features/quadratic/components/QuadraticScene.tsx
