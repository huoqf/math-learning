## 🚨 AI 速查违禁行为表（读此文件必先扫此表）

> 以下行为一旦出现，视为规范违反，必须回滚。

| ❌ 禁止行为 | ✅ 正确替代 | 关联铁律 |
|------------|-----------|---------|
| `fill="#..."` / `stroke="red"` 等硬编码颜色 | `MATH_COLORS.*` | 铁律1 |
| `fontSize={14}` 直接写死字号 | `font(14)`（来自 `canvasSize.font`） | 铁律1 |
| `requestAnimationFrame(cb)` 裸调用 | `useAnimationLifecycle` | 铁律1 |
| 手写 `<line>` 绘制坐标轴或几何向量 | `CoordinateGrid` / `VectorArrow` | 铁律5 |
| `viewBox={...}` 与 `vp.transform` 同时使用 | 仅用 `AnimationSvgCanvas` | 铁律1-8 |
| 手写 `x * scaleX + offsetX` 坐标计算 | `mathToDesign(x, y, scale)` | 铁律1-2 |
| 新页面手写 `<input type="range">` | `paramMeta` → `ParamControl` | 铁律6 |
| `<foreignObject>` 内嵌 React 图表 | HTML 层 flex 分区，图表与 SVG 平级 | 铁律1-10 |
| `BrowserRouter` | `HashRouter` only | 铁律5 |
| `src/math/` 中 import React / DOM / window | 数学层纯函数，零副作用 | 铁律2 |

---

# 项目规范 — 高中数学交互动画学习系统

> **Trae IDE 默认加载的项目规范文件。**
> 最后更新：2026-07-17

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

### 铁律 1：统一来源，禁止绕过
1. **颜色与样式** -> 必须从 `src/theme/` 的 `MATH_COLORS` 引用，禁止在 SVG 标签中直接写入 Hex 颜色代码。
2. **坐标转换** -> 一元或二元 2D 几何元素投射必须使用 `mathToDesign(x, y, scale)`。对于 3D 立体几何投射，必须使用统一的 `math3DToDesign(x, y, z, scale, camera)`，严禁组件开发者自行实现 3D 投影变换。
3. **坐标变换防抖与居中** -> 统一使用 `useAnimationViewport` 测量可视区，禁止直接手写 `viewBox`。
4. **极坐标与复数网格** -> 涉及极坐标方程和复数乘法旋转等圆形对称场景，必须使用 `PolarGrid` 公共网格组件，且配色必须统一使用 `MATH_COLORS.grid` 和 `MATH_COLORS.axis`。
5. **数学函数曲线渲染** -> 必须使用 `FunctionGraph` 组件，且必须包含不连续性（如 $y=\tan x$ 渐近线、分母为 0 处）的跳过逻辑，严禁在不连续点出现“拉丝”线。
6. **退化与奇异值防护** -> 当数学参数产生退化或无定义时，代码必须保证不崩溃、不报 NaN。中屏应兼容显示退化图形，在右侧面板的 `WarningItem` 动态弹出警示红字。若某参数包含导致退化的边界临界值（如 $a=0$），必须在对应的 `paramMeta` 中配置 `marks` 并指定 `variant: 'critical'`。
7. **字体缩放** -> 必须走 `font()` 缩放代偿函数。

### 铁律 2：数学计算层纯净性
`src/math/` 目录是纯函数数学物理计算层。
- 严禁引入任何 React, DOM, window 依赖。
- 严禁从 Zustand Store 中直接引入状态，所有计算所需参数均通过函数入参传入。
- 函数必须撰写清晰的 JSDoc，明确自变量、因变量含义及取值区间。
- 数学计算函数返回值中应包含 `isValid`、`isDegenerate` 及 `degenerateType` 字段，以供编排层和 UI 层识别渲染。

### 铁律 3：三屏职责边界
- **左屏 (LeftPanel)**：声明式参数调节。数值滑块必须走 `paramMeta`。
- **中屏 (Canvas)**：以自适应的 SVG 为主体。**禁止大段的教学文字、禁止推导证明**。SVG 画布中仅允许出现直观的几何图形和动态公式标注（如 $f(x)=2x^2+x-1$）。
- **右屏 (MathPanel)**：由数据驱动，聚合展示派生数学量看板、定理公式、高考要点和退化警告。对于复杂的定理和公式，如果 LaTeX 表达式较长，必须使用 `\begin{aligned} ... \end{aligned}` 进行多行对齐排版，禁止手写 HTML 标签混杂其中。

### 铁律 4：组件复用优先
实现动画场景时，必须优先使用公共组件，禁止重复手写等效逻辑。
- 布局：`ThreePanel`, `AnimationSvgCanvas`
- 坐标网格/极坐标：`CoordinateGrid`, `PolarGrid`
- 曲线绘制：`FunctionGraph`
- 视觉箭头：`VectorArrow`
- 看板面板：`MathPanel`

---

## 📋 新建数学页面执行前 Checklist

- [ ] **三屏隔离**：主屏无大段教学文字；左屏参数走 `paramMeta`；右屏由 MathPanel 渲染。长 LaTeX 公式已做 aligned 对齐。
- [ ] **布局预设与网格**：选择正确的 preset 和坐标系类型。2D 网格使用 CoordinateGrid，圆形对称使用 PolarGrid。
- [ ] **3D 几何变换**：3D 立体几何必须使用 `math3DToDesign` 统投影。
- [ ] **退化机制与奇异标记**：当参数产生退化时的崩溃防护及红字 `WarningItem` 提示已完成。临界退化参数已在 `paramMeta` 的 `marks` 中用 `'critical'` 标示。
- [ ] **曲线连续性**：检验绘制曲线时，不连续点是否在采样中被剔除。
- [ ] **纯计算层**：`src/math/` 下的计算纯函数无 React/DOM 依赖，返回了完备的 validity 状态。
- [ ] **代码质量**：通过 `tsc -b` 编译检查。

