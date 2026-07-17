# AGENTS.md — Antigravity 工作区规则（自动加载，优先级最高）

> 本文件由 Antigravity IDE 自动加载，无需手动读取。铁律违反 = 本次任务无效。
> 详细规范见 `.trae/rules/project_rules.md`。

---

## ⚡ 三屏内容分配铁律（设计前必读）

```
左屏（LeftPanel）         中屏（AnimationSvgCanvas）        右屏（MathPanel）
──────────────────        ──────────────────────────        ──────────────────────
• paramMeta 数值参数      • 动画场景（SVG 主体）            • MathQuantity（数学量）
• controlMeta 模式开关    • CenterExtra 图表（可选）         • Theorem（定理公式+条件）
• SidebarExtra（复杂）    ❌ 禁止大段教学文字              • GaokaoPoint（高考数学考点）
                          ❌ 禁止完整公式推导               • WarningItem（退化警示）
                          ❌ 禁止高考考点总结               ❌ 禁止动画控制控件
```

**主屏文字约束**：SVG 内只允许出现数学量数值标注（如 `y = 2.0x`）和坐标轴标签，禁止教学解释段落。

## ⚡ 布局 preset 选择铁律（分屏是主流，按动画方向选）

> 动画配合图表/函数对照能帮助学生更好理解“数形结合”过程，**`splitV`/`splitH` 是大多数页面的首选**。

| preset | 设计尺寸 | 选用条件 |
|--------|---------|---------|
| `CANVAS_PRESETS.splitV` | 840×325 | **数形结合**场景（如：上方函数曲线图像 + 下方单位圆运动）或**多图表并列** |
| `CANVAS_PRESETS.splitH` | 420×650 | **纵向变化**场景（如：纵向单变量演变） |
| `CANVAS_PRESETS.full` | 840×650 | 无需配套图表的纯场景（立体几何判定、奔驰定理平面展示等） |
| `CANVAS_PRESETS.square` | 650×650 | 圆形/旋转对称（单位圆、极坐标、复数模长旋转） |

**决策直觉**：需要对照图像或水平排列 → `splitV`；纵向对称 → `splitH`；无对照图表 → `full`；圆形/对称轴心 → `square`

---

## ⚡ 其他铁律速查（违反则任务无效）

### 铁律 1：统一来源，禁止硬编码

| ❌ 禁止 | ✅ 正确替代 |
|--------|-----------|
| 硬编码颜色 `fill="#3B82F6"` | `import { MATH_COLORS } from '@/theme'` |
| 硬编码尺寸 `fontSize={14}` | `font(14)`（`font` 来自 `canvasSize.font`，`canvasSize` 从 `useAnimationViewport` 解构得到） |
| 几何/向量箭头手写 `<line>` | `VectorArrow` |
| 直接 `requestAnimationFrame(...)` | `useAnimationLifecycle` |
| 写死 `scale = 0.8` | `useSceneScale({ vp, xRange, yRange })` |
| 任何魔法数字坐标 | `mathToDesign()` 投射；3D 场景用 `math3DToDesign()` 投射 |
| 涉及极坐标与复数旋转手写背景 | 复用 `PolarGrid` 组件 |

> **`font()` 使用示例**：`const { containerRef, canvasSize, vp } = useAnimationViewport(...)` 后，通过 `canvasSize.font(14)` 获取缩放后的字号。

### 铁律 2：新页面布局唯一路径

```tsx
// ✅ 唯一标准写法（新页面必须）
const { containerRef, canvasSize, vp } = useAnimationViewport({ preset: CANVAS_PRESETS.full })
const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] })
<AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
  ...
</AnimationSvgCanvas>
```

```tsx
// ❌ 禁止
viewBox={`0 0 ${width} ${height}`}           // 固定 viewBox
physicsToCanvas(...)                          // 仅用于维护旧组件
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

| 场景 | 必须使用 | import |
|------|---------|--------|
| 三栏页面 | `ThreePanel` | `@/components/Layout` |
| SVG 画布容器 | `AnimationSvgCanvas` | `@/components/Layout` |
| 坐标轴/网格 | `CoordinateGrid` / `PolarGrid` | `@/components/Math` |
| 连续数学函数曲线 | `FunctionGraph` | `@/components/Math` |
| 视觉标注箭头 | `VectorArrow` | `@/components/Math` |
| 左屏容器 | `LeftPanel` / `LeftPanelSection` | `@/components/UI` |
| 实时数学量面板 | `MathPanel` | `@/components/UI` |

### 铁律 4B：颜色语义层级隔离（混用即违规）

| 语义层级 | 来源 | 适用场景 | ❌ 禁止 |
|---------|------|---------|--------|
| 数学量/函数 | `MATH_COLORS.*` | 原函数/导数/和向量等 | 用 `colors.primary` 表示导数 |
| Canvas 基础设施 | `CANVAS_COLORS.*` | 网格线/坐标轴/参考线 | 用 `colors.neutral[200]` 直接 |
| 透明度变体 | `withAlpha(token, 0.3)` | 任意半透明色 | 手拼 `rgba(...)` |

```ts
// ✅ 正确 import
import { MATH_COLORS, withAlpha } from '@/theme'
```

### 铁律 5：HashRouter Only

禁止引入 `BrowserRouter`，路由跳转仅用 `to="/xxx"`（HashRouter 内部路径）。

### 铁律 6：数学层纯净

`src/math/` 内禁止出现 DOM、React、window、Store 依赖。所有函数必须是纯函数，带有 JSDoc。

### 铁律 7：数学量数据组装约定

右屏 `MathPanel` 的数据由 `buildMathQuantities(animId, params)` 统一组装，内部按 `animId` 分支（当前为单一入口模式）。新页面需在该函数中添加对应 `animId` 分支，返回 `MathPanelData` 结构。

---

## 📋 新建页面前必须确认的 7 件事

1. **选择 preset**：`full` / `splitV` / `splitH` / `square`（根据是否有图像对照、是否圆形对称决定）
2. **分层结构**：`XxxAnimation.tsx`（编排）+ `math/xxx.ts`（计算）+ `components/XxxScene.tsx`（渲染）
3. **颜色来源**：数学量/函数 → `MATH_COLORS`；坐标轴网格 → `CANVAS_COLORS`；透明度变体 → `withAlpha()`
4. **坐标系统**：`mathToDesign()` 转换，`useSceneScale` 比例尺，禁止手写 `x * scale + offset`；SVG 字体必须 `font(N)` 包裹
5. **退化防范**：必须有 $a = 0$ 或分母为 0 等退化状态下的图形兼容和红字 `WarningItem` 提示
6. **曲线连续性**：绘制曲线时，必须对不连续点（例如 $\tan x$ 的渐近线）在采样时进行断开处理
7. **组件复用检查**：新增场景前必须查阅已有组件，有现成组件时禁止手写等效实现

---

*最后更新：2026-07-17 | 由 Antigravity 生成*
