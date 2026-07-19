## 🚨 AI 速查违禁行为表（读此文件必先扫此表）

> **注意：本文件仅供人类阅读参考。AI Agent 的权威规范文件是项目根目录的 `AGENTS.md`（自动加载）。**
> 
> 以下行为一旦出现，视为规范违反，必须回滚。

| ❌ 禁止行为 | ✅ 正确替代 | 关联铁律 |
|------------|-----------|---------|
| `fill="#..."` / `stroke="red"` 等硬编码颜色 | `MATH_COLORS.*` | 铁律1 |
| `fontSize={14}` 直接写死字号 | `fontScale(14)` 或 `canvasSize.font(14)` | 铁律1 |
| SVG 内 `className="text-[10px]"` 等硬编码字号 | `fontSize={fontScale(10)}` | 铁律1 |
| `requestAnimationFrame(cb)` 裸调用 | `useAnimationLifecycle` | 铁律1 |
| 手写 `<line>` 绘制坐标轴或几何向量 | `CoordinateGrid` / `VectorArrow` | 铁律1 |
| `viewBox={...}` 与 `vp.transform` 同时使用 | 仅用 `AnimationSvgCanvas` | 铁律2 |
| 手写 `x * scaleX + offsetX` 坐标计算 | `mathToDesign(x, y, scale)` | 铁律1 |
| 新页面手写 `<input type="range">` | `paramMeta` → `ParamControl` | 铁律3 |
| `<foreignObject>` 内嵌 React 图表 | HTML 层 flex 分区，图表与 SVG 平级 | 铁律2 |
| `BrowserRouter` | `HashRouter` only | 铁律5 |
| `src/math/` 中 import React / DOM / window | 数学层纯函数，零副作用 | 铁律6 |

---

# 项目规范 — 高中数学交互动画学习系统

> **Trae IDE 默认加载的项目规范文件。**
> 最后更新：2026-07-18

---

## 1. 项目目标

1. 建立完整且清晰的高中数学知识结构
2. 用“数形结合”的动态交互动画帮助理解抽象的代数和几何概念
3. 通过极限逼近、参数滑动等交互展示函数的动态变化本质
4. 便于持续加入新章节和新函数图象页面

---

## 2. 技术栈

- 前端框架：React 19
- 构建工具：Vite 6, `base: './'`
- 语言：TypeScript 5.5+ (strict mode)
- CSS 框架：TailwindCSS 4
- 状态管理：Zustand
- 路由：react-router-dom (**HashRouter only**)
- 数学公式：KaTeX（完全离线）
- 渲染引擎：SVG (教学图解与几何优先) / Canvas (高频海量粒子)

---

## 3. 全局铁律（不得违反）

### 铁律 1：统一来源，禁止硬编码

| ❌ 禁止 | ✅ 正确替代 |
|--------|-----------|
| 硬编码颜色 `fill="#3B82F6"` | `import { MATH_COLORS } from '@/theme'` |
| 硬编码尺寸 `fontSize={14}` | `fontScale(14)` 或 `canvasSize.font(14)`（来自 `useAnimationViewport` 解构的 `canvasSize`） |
| SVG 内 `className="text-[10px]"` | `fontSize={fontScale(10)}`（fontScale 从 Animation 传入） |
| 几何/向量箭头手写 `<line>` | `VectorArrow` |
| 直接 `requestAnimationFrame(...)` | 仅在有时间演化需要时使用 `useAnimationLifecycle`，常规数学页面禁止使用 |
| 手写拖拽控制点或 `clientX/Y` 换算 | 使用 `InteractivePoint` 配合 `designToMath` 进行逆向坐标解算 |
| 使用 `+`/`-` 拼接含参公式字符串 | 使用 `buildPolyLatex` / `buildQuadraticLatex` 等多项式工具动态拼装 |
| 写死 `scale = 0.8` | `useSceneScale({ vp, xRange, yRange })` |
| 任何魔法数字坐标 | `mathToDesign()` 投射；3D 场景用 `math3DToDesign()` 投射 |
| 涉及极坐标与复数旋转手写背景 | 复用 `PolarGrid` 组件 |

> **`fontScale` 传递链路（新页面必须遵守）**：
> ```
> Animation: canvasSize.font ──→ Scene: fontScale ──→ CoordinateGrid / InteractivePoint / Asymptote / VectorArrow
> ```
> - Animation 层：解构 `const { containerRef, canvasSize, vp } = useAnimationViewport(...)` 后，传 `fontScale={canvasSize.font}` 给 Scene
> - Scene 层：接收 `fontScale` prop，传给所有子组件（CoordinateGrid、InteractivePoint、Asymptote 等）
> - 子组件内部：用 `fontSize={fontScale(10)}` 替代任何硬编码字号

### 铁律 2：新页面布局标准路径

```tsx
// ✅ 唯一标准写法（新页面必须）
const { containerRef, canvasSize, vp } = useAnimationViewport({ preset: CANVAS_PRESETS.full })
const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] })
<AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
  ...
</AnimationSvgCanvas>
```

### 铁律 3：左屏控制台必须使用声明式体系

```tsx
// ✅ 正确
paramMeta → 由 registry 驱动 ParamControl（数值参数，对于退化临界参数如 a=0 须配置 marks 并标明 variant: 'critical'）
// ❌ 禁止
手写 <input type="range" />   // 散乱控件
新建 SidebarExtra 放简单开关  // 仅复杂自定义才用
```

### 铁律 4：组件复用，禁止重复手写

| 场景 | 必须使用 | import | fontScale |
|------|---------|--------|-----------|
| 三栏页面 | `ThreePanel` | `@/components/Layout` | — |
| SVG 画布容器 | `AnimationSvgCanvas` | `@/components/Layout` | — |
| 坐标轴/网格 | `CoordinateGrid` / `PolarGrid` | `@/components/Math` | ✅ 支持 `fontScale` prop |
| 连续数学函数曲线 | `FunctionGraph` | `@/components/Math` | — |
| 可拖拽控制点 | `InteractivePoint` | `@/components/Math` | ✅ 支持 `fontScale` prop |
| 函数曲线在切点处的切线 | `TangentLine` | `@/components/Math` | — |
| 演示极限逼近的割线 | `SecantLine` | `@/components/Math` | — |
| 双曲线/正切/指对数渐近线 | `Asymptote` | `@/components/Math` | ✅ 支持 `fontScale` prop |
| 解集/定积分区间阴影 | `IntervalShadow` | `@/components/Math` | — |
| 视觉标注箭头 | `VectorArrow` | `@/components/Math` | ✅ 支持 `fontScale` prop |
| 左屏容器 | `LeftPanel` / `LeftPanelSection` | `@/components/UI` | — |
| 实时数学量面板 | `MathPanel` | `@/components/UI` | — |

### 铁律 4B：颜色语义层级隔离（混用即违规）

| 语义层级 | 来源 | 适用场景 | ❌ 禁止 |
|---------|------|---------|--------|
| 数学量/函数 | `MATH_COLORS.*` | 原函数/导数/和向量等 | 用 `colors.primary` 表示导数 |
| Canvas 基础设施 | `CANVAS_COLORS.*` | 网格线/坐标轴/参考线 | 用 `colors.neutral[200]` 直接 |
| 透明度变体 | `withAlpha(token, 0.3)` | 任意半透明色 | 手拼 `rgba(...)` |

### 铁律 4C：“公式-图形-滑块”三位一体色彩绑定铁律

为确保学生在“数形结合”学习中的视觉直觉，对于由同一数学参数（如 $a, b, c$ 或 $k, b$）控制的**左屏滑块描述**、**中屏 SVG 几何图形**以及**看板/悬浮 LaTeX 公式**，必须强制实行色彩一致性绑定：
1. **参数色彩映射**：统一使用专用的参数语义色：
   - 核心主控参数一（如 $a$, $k$）：`MATH_COLORS.paramPrimary` (`#EF4444` - 鲜红)
   - 次要关联参数二（如 $b$）：`MATH_COLORS.paramSecondary` (`#D97706` - 暖橙)
   - 辅助或常数参数三（如 $c$, $\theta$）：`MATH_COLORS.paramTertiary` (`#059669` - 翠绿)
2. **公式内上色**：在 KaTeX 公式渲染时，使用 `\color{Hex}` 指令将特定参数变量渲染为对应的参数色彩。
   - 例如二次函数：`\color{#EF4444}{a}x^2 + \color{#D97706}{b}x + \color{#059669}{c}`
3. **滑块与控制台**：在左屏 `ParamControl` 标签或提示文本中对该参数应用统一的色彩指示。
4. **场景几何图象**：中屏 SVG 中由特定参数直接决定的特征图形（例如二次函数的对称轴、焦点）应尽量使用或呼应其所绑定的色彩。

### 铁律 5：HashRouter Only

禁止引入 `BrowserRouter`，路由跳转仅用 `to="/xxx"`（HashRouter 内部路径）。

### 铁律 6：数学层纯净

`src/math/` 内禁止出现 DOM、React、window、Store 依赖。所有数学模型求解函数必须是纯函数，带 validity 状态且支持 JSDoc 测试。

### 铁律 7：数形双向联动与避让

1.  **反向求参**：允许拖动图形点反向改变滑块参数。在 drag 回调中解算出数学坐标，四舍五入保留合适精度并更新父 state。
2.  **标注避让**：当顶点、交点、零点等标注处于极小间距时，必须编写轻量级碰撞检测算法，使其自动偏移避让，严禁文字标签相互重叠。

### 铁律 8：数学量数据组装约定

右屏 `MathPanel` 的数据由 `buildMathQuantities(animId, params, config)` 统一组装，内部按 `animId` 分支（当前为单一入口模式）。新页面需在该函数中添加对应 `animId` 分支，返回 `MathPanelData` 结构。

---

## 📋 新建数学页面执行前 Checklist

- [ ] **三屏隔离**：主屏无大段教学文字；左屏参数走 `paramMeta`；右屏由 MathPanel 渲染。长 LaTeX 公式已做 aligned 对齐。
- [ ] **布局预设与网格**：选择正确的 preset 和坐标系类型。2D 网格使用 CoordinateGrid，圆形对称使用 PolarGrid。
- [ ] **3D 几何变换与规范**：3D 立体几何必须使用 `math3DToDesign` 统投影。严格遵循 XYZ 三轴红-绿-蓝 (axis3D_X/Y/Z) 标准轴色设定。
- [ ] **颜色与三位一体绑定**：无任何 Hex 硬编码颜色。通过 paramPrimary/Secondary/Tertiary 保证“公式-图形-滑块”色彩三位一体绑定。
- [ ] **退化机制与奇异标记**：当参数产生退化时的崩溃防护及红字 `WarningItem` 提示已完成。临界退化参数已在 `paramMeta` 的 `marks` 中用 `'critical'` 标示。
- [ ] **曲线连续性**：检验绘制曲线时，不连续点是否在采样中被剔除。
- [ ] **纯计算层**：`src/math/` 下的计算纯函数无 React/DOM 依赖，返回了完备的 validity 状态。
- [ ] **代码质量**：通过 `tsc -b` 编译检查。

