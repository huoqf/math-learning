# AGENTS.md — Antigravity 工作区规则（自动加载，优先级最高）

> 本文件由 Antigravity IDE 自动加载，无需手动读取。铁律违反 = 本次任务无效。
> 详细规范见 `.trae/rules/project_rules.md`（仅供人类阅读）。

---

## 项目目标

1. 建立完整且清晰的高中数学知识结构
2. 用"数形结合"的动态交互动画帮助理解抽象的代数和几何概念
3. 通过极限逼近、参数滑动等交互展示函数的动态变化本质
4. 便于持续加入新章节和新函数图象页面

## 技术栈

- 前端框架：React 19
- 构建工具：Vite 6, `base: './'`
- 语言：TypeScript 5.5+ (strict mode)
- CSS 框架：TailwindCSS 4
- 状态管理：Zustand
- 路由：react-router-dom (**HashRouter only**)
- 数学公式：KaTeX（完全离线）
- 渲染引擎：SVG (教学图解与几何优先) / Canvas (高频海量粒子)

---

## 🚨 AI 速查违禁行为表（读此文件必先扫此表）

> 以下行为一旦出现，视为规范违反，必须回滚。

| ❌ 禁止行为 | ✅ 正确替代 | 关联铁律 |
|------------|-----------|---------|
| `fill="#..."` / `stroke="red"` 等硬编码颜色 | `MATH_COLORS.*` | 铁律1 |
| `fontSize={14}` 直接写死字号 | `fontScale(14)` 或 `canvasSize.font(14)` | 铁律1 |
| SVG 内 `className="text-[10px]"` 等硬编码字号 | `fontSize={fontScale(10)}` | 铁律1 |
| `requestAnimationFrame(cb)` 裸调用 | 数学页面禁止使用 | 铁律1 |
| 几何/向量箭头手写 `<line>` | `VectorArrow` | 铁律1 |
| 手写 `<circle>` 绘制纯数学点/交点/特征点 | `MathPoint`（纯数学点实心r=3.2/空心r=3.8）或 `InteractivePoint`（可拖拽控制点） | 铁律1/4 |
| `viewBox={...}` 与 `vp.transform` 同时使用 | 仅用 `AnimationSvgCanvas` | 铁律2 |
| 手写 `x * scaleX + offsetX` 坐标计算 | `mathToDesign(x, y, scale)` | 铁律1 |
| 新页面手写 `<input type="range">` | `paramMeta` → `ParamControl` | 铁律3 |
| `<foreignObject>` 内嵌 React 图表 | HTML 层 flex 分区，图表与 SVG 平级 | 铁律2 |
| `BrowserRouter` | `HashRouter` only | 铁律5 |
| `src/math/` 中 import React / DOM / window | 数学层纯函数，零副作用 | 铁律6 |
| 左屏手写 `<button>` 做选择控件 | `TabSwitcher` / `SelectGrid` | 铁律3 |
| `formula` 字段用 `$...$` 包裹 | 纯 LaTeX，`katex.render()` 直接接收 | 铁律1 |
| 用 `Vector3DArrow` 绘制棱/斜线/垂线等纯几何线段 | `Segment3D`（纯几何线段无箭头，仅法向量/基向量用 `Vector3DArrow`） | 铁律1/4 |
| 向 `PointLabel3D` 传入 Unicode 下标（如 `P₁`） | `CompoundLabel3D(base, subscript)`（彻底杜绝 ⌧ 豆腐块） | 铁律1/4 |
| 2D 画布手写 `<text>` 渲染散乱汉字/坐标/方程 | `SceneLabelGroup` 极简学术点标 + 中屏右下角 `SceneLegend` 毛玻璃图例 | 铁律1/4 |

---

## ⚡ 三屏内容分配铁律（设计前必读）

```
左屏（LeftPanel）         中屏（AnimationSvgCanvas / ThreeDCanvas）  右屏（MathPanel）
──────────────────        ────────────────────────────────────────   ──────────────────────
• paramMeta 数值参数      • 动画场景（SVG / R3F 3D 主体）            • MathQuantity（数学量）
• 模式切换（按钮组）      • CenterExtra 图表（可选）                  • Theorem（定理公式+前提+条件）
                          ❌ 禁止大段教学文字                        • GaokaoPoint（高考数学考点）
                          ❌ 禁止完整公式推导                         • WarningItem（退化警示）
                          ❌ 禁止高考考点总结                         ❌ 禁止动画控制控件
```

**主屏文字约束**：SVG 内只允许出现数学量数值标注（如 `y = 2.0x`）和坐标轴标签，禁止教学解释段落。

**3D 页面双模式**：3D 页面可提供"3D 直观图 / 三视图"切换。三视图模式下中屏使用 `ThreeViewsPanel`（纯 SVG 正投影）替代 `ThreeDCanvas`，此时不加载 three.js。左屏提供切换按钮，与视角预设按钮并列。

## ⚡ 布局 preset 选择铁律

> **`full` 是高中数学的绝对主力 preset**。坐标系、函数曲线、几何元素、交互控制点都在同一个统一视图中，不需要分屏。

| preset | 设计尺寸 | 使用频率 | 选用条件 |
|--------|---------|---------|---------|
| `CANVAS_PRESETS.full` | 840×650 | ⭐⭐⭐ 首选 | 代数/几何/函数类主体（**绝大多数页面**） |
| `CANVAS_PRESETS.square` | 650×650 | ⭐⭐ 常用 | 单位圆、三角函数、复数（含 PolarGrid 场景） |
| `CANVAS_PRESETS.splitV` | 840×325 | ⭐ 少用 | 仅限：f(x)+f'(x) 双坐标系对照、函数变换前后对比 |
| `CANVAS_PRESETS.splitH` | 420×650 | ⭐ 少用 | 同上，纵向对比时用 |

**决策直觉**：
- 默认选 `full`，除非有明确理由不选它
- 需要圆形/旋转对称（单位圆、三角函数）→ `square`
- ⚠️ **使用 split 前必须确认**：能否把两个视图合并到同一坐标系？如果能合并 → 必须用 `full`，禁止 split。只有两个视图 y 轴量纲不同或概念需要隔离时，才允许 split

---

## ⚡ 其他铁律速查（违反则任务无效）

### 铁律 1：统一来源，禁止硬编码

| ❌ 禁止 | ✅ 正确替代 |
|--------|-----------|
| 硬编码颜色 `fill="#3B82F6"` | `import { MATH_COLORS } from '@/theme'` |
| 硬编码尺寸 `fontSize={14}` | `fontScale(14)` 或 `canvasSize.font(14)`（来自 `useAnimationViewport` 解构的 `canvasSize`） |
| SVG 内 `className="text-[10px]"` | `fontSize={fontScale(10)}`（fontScale 从 Animation 传入） |
| 几何/向量箭头手写 `<line>` | `VectorArrow` |
| 直接 `requestAnimationFrame(...)` | 数学页面禁止使用，仅在有时间演化需求时自行管理 RAF |
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
>
> **`fontScale` 与 `canvasSize.font` 的区别**：
> - `fontScale` 是 `(v: number) => number` 类型，Scene 和子组件统一使用
> - `canvasSize.font` 也是 `(v: number) => number` 类型，是 fontScale 的来源
> - ConstantAnimation 等传递 `canvasSize` 整个对象时，Scene 内用 `canvasSize.font` 调用

### 铁律 2：新页面布局标准路径

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
```

#### splitV / splitH 分屏布局模板（极少使用，需前置审查）

> ⚠️ **使用前必须确认**：两个视图能否合并到同一坐标系？如果能 → 禁止 split，必须用 `full`。仅当 y 轴量纲不同或概念需要隔离时才允许。

```tsx
// ✅ splitV 模板：上方 SVG + 下方对照图（仅限 f(x)+f'(x) 双坐标系等场景）
const { containerRef, canvasSize, vp } = useAnimationViewport({ preset: CANVAS_PRESETS.splitV })
const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] })

<ThreePanel
  left={<LeftPanel>...</LeftPanel>}
  center={
    <div className="w-full h-full flex flex-col bg-white">
      {/* 上半区：SVG 动画画布 */}
      <div className="flex-1 relative">
        <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
          <TopicScene params={params} scale={scale} vp={vp} />
        </AnimationSvgCanvas>
      </div>
      {/* 下半区：对照图（如导函数图像） */}
      <div className="h-[160px] border-t border-neutral-200 p-3 overflow-hidden">
        {/* 放置 FunctionGraph 对照图等 */}
      </div>
    </div>
  }
  right={<MathPanel ... />}
/>
```

```tsx
// ✅ splitH 模板：左侧 SVG + 右侧对照图（纵向对比时用）
const { containerRef, canvasSize, vp } = useAnimationViewport({ preset: CANVAS_PRESETS.splitH })
const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] })

<ThreePanel
  left={<LeftPanel>...</LeftPanel>}
  center={
    <div className="w-full h-full flex flex-row bg-white">
      {/* 左半区：SVG 动画画布 */}
      <div className="flex-1 relative">
        <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
          <TopicScene params={params} scale={scale} vp={vp} />
        </AnimationSvgCanvas>
      </div>
      {/* 右半区：对照图 */}
      <div className="w-[40%] border-l border-neutral-200 p-3 overflow-hidden">
        {/* 放置辅助图表等 */}
      </div>
    </div>
  }
  right={<MathPanel ... />}
/>
```

### 铁律 3：左屏控制台必须使用声明式体系

```tsx
// ✅ 正确
paramMeta → 由 registry 驱动 ParamControl（数值参数，对于退化临界参数如 a=0 须配置 marks 并标明 variant: 'critical'）
// ❌ 禁止
手写 <input type="range" />   // 散乱控件
<select> / 原生下拉框         // 不支持 KaTeX，用按钮组替代
新建 SidebarExtra 放简单开关  // 仅复杂自定义才用
```

**左屏选择类控件**：模式切换、子选项选择（如不等式关系、函数类型）统一用按钮组，支持 KaTeX 公式渲染，禁止用 `<select>`。

选择控件组件：
- `TabSwitcher`：轻量 Tab 切换（顶部模式选择），props: `tabs`/`value`/`onChange`
- `SelectGrid`：公式按钮网格（参数/运算符/模型选择），props: `items`/`value`/`onChange`/`variant`/`color`/`columns`
  - `fullWidth`: 某项独占一行（2+1 布局）
  - `description`: label/formula 下方小字说明
- ❌ 禁止手写 `<button>` + className 做选择控件

---

### 📐 左屏动线与参数组织指南（因学科制宜，严禁教条化）

> 💡 **核心原则**：交互设计必须服务于**降低学生认知负荷**与**凸显核心数学本质**，严禁死板套用格式。

#### 1. 代数 / 函数 / 数列 / 概率统计专题（模型驱动动线）
* **标准操作动线**：
  `探究维度/模式 (TabSwitcher) → 函数/代数模型选择 (SelectGrid) → 参数调节 (ParamControl) → 启发导引 (TipCard 底部)`
* **设计要点**：
  - 严禁盲目强加“2×2 预设网格”，避免模式、预设与函数模型层层嵌套、打架混乱；
  - 参数随所选模型动态自适应（如切换到指数混合函数时，自动隐藏无关的高次项参数）。

#### 2. 解析几何 / 立体几何专题（几何约束与参数降维动线）
* **标准操作动线**：
  `探究模式 (SelectGrid) → 典型几何构型预设 (SelectGrid) → 参数调节 (ParamControl) → 图层/视角控制`
* **预设的本质与初衷（参数降维）**：
  - **自由探究（`free`）**：全量展开所有空间/平面几何自由参数；
  - **典型几何构型**（如正方体、正棱柱、焦点三角形、特殊离心率）：锁定对称/等长约束，**隐藏从属边长或已锁定的参数**，仅展示 1~2 个基准主滑块，防止学生误调导致名不副实；
  - **数形双向联动**：当学生在中屏直接拖拽动点时，系统**自动切回【自由探究】（`free`）**并展开全量参数。

#### 3. 参数对象化聚合与纯净性规范（全学科通用）
* **对象化分组**：同一几何对象（如定点 $P_0(x_0, y_0)$、向量分量 $(v_x, v_y)$、复数实虚部）或同一逻辑层级的参数，配置相同的 `group` 属性，实现主次分层，严禁散落平铺；
* **左屏纯净职责**：严禁在左屏堆砌高考考点总结或冗长定理推导（100% 归位右屏 `MathPanel`），严禁放置“鼠标旋转视角”等无信息量操作废话。

### 铁律 4：组件复用，禁止重复手写

| 场景 | 必须使用 | import | fontScale |
|------|---------|--------|-----------|
| 三栏页面 | `ThreePanel` | `@/components/Layout` | — |
| SVG 画布容器 | `AnimationSvgCanvas` | `@/components/Layout` | — |
| 坐标轴/网格 | `CoordinateGrid` / `PolarGrid` | `@/components/Math` | ✅ 支持 `fontScale` prop |
| 连续数学函数曲线 | `FunctionGraph` | `@/components/Math` | — |
| 可拖拽控制点 | `InteractivePoint` | `@/components/Math` | ✅ 支持 `fontScale` prop，带外光晕手柄 |
| 纯数学点/交点/垂足/去心点 | `MathPoint` | `@/components/Math` | ✅ 支持 `fontScale` prop，实心r=3.2/空心r=3.8 |
| 函数曲线在切点处的切线 | `TangentLine` | `@/components/Math` | — |
| 演示极限逼近的割线 | `SecantLine` | `@/components/Math` | — |
| 双曲线/正切/指对数渐近线 | `Asymptote` | `@/components/Math` | ✅ 支持 `fontScale` prop |
| 解集/定积分区间阴影 | `IntervalShadow` | `@/components/Math` | — |
| 视觉标注箭头 | `VectorArrow` | `@/components/Math` | ✅ 支持 `fontScale` prop |
| 2D 智能避让点标图层 | `SceneLabelGroup` | `@/components/Math` | ✅ 支持 `fontScale`，8 向防重叠碰撞分流与微描边 |
| 2D 右下角图例卡片 | `SceneLegend` | `@/components/Math` | 毛玻璃卡片，支持实线/虚线/特征点/面积/KaTeX |
| 三视图正投影 | `ThreeViewsPanel` | `@/components/Math3D` | — |
| 3D 坐标网格 | `Scene3DGrid` | `@/components/Math3D` | 3D 空间网格与坐标轴。Props: `size` |
| 3D 相机控制 | `CameraRig` | `@/components/Math3D` | 轨道相机，配合 `use3DViewport`。支持 `enabled` 动点交互互斥 |
| 3D 交互模式浮层 | `ModeSwitchOverlay3D` | `@/components/Math3D` | 3D 画布右上角【🔄 视角漫游】与【👆 动点交互】切换浮层 |
| 3D 空间点 | `Point3D` | `@/components/Math3D` | 空间点。固定点 $r=0.042$ 纯实心；动点 $r=0.075$ 脉冲光晕与全局射线追踪。Props: `draggable`, `constrain`, `onDrag` |
| 3D 空间线段 | `Segment3D` | `@/components/Math3D` | 3D 空间几何线段/棱/垂线/辅助线（纯几何线段无箭头）。Props: `from`, `to`, `colorKey`, `lineWidth`, `dashed` |
| 3D 平面 | `Plane3D` | `@/components/Math3D` | 空间平面。Props: `origin`, `uAxis`, `vAxis` |
| 3D 向量 | `Vector3DArrow` | `@/components/Math3D` | 带箭头 3D 向量（仅法向量/基向量使用）。Props: `from`, `to` |
| 3D 角弧 | `AngleArc3D` | `@/components/Math3D` | 空间夹角弧线。Props: `vertex`, `dirA`, `dirB` |
| 3D 点标签 | `PointLabel3D` | `@/components/Math3D` | 顶点文本标注。Props: `position`, `text` |
| 3D 公式标签 | `FormulaLabel3D` | `@/components/Math3D` | KaTeX 公式标注。Props: `position`, `tex` |
| 3D 下标标签 | `CompoundLabel3D` | `@/components/Math3D` | 带下标标注。Props: `position`, `base`, `subscript` |
| 3D 顶点标签组 | `VertexLabelGroup3D` | `@/components/Math3D` | 多面体顶点标签批量生成器。Props: `vertices`, `items` |
| 3D 直角三角形 | `RightTriangle3D` | `@/components/Math3D` | 空间直角三角形（含直角标志与边长公式）。Props: `rightVertex`, `vertexA`, `vertexB` |
| 3D 仿射基底组 | `AffineBasis3D` | `@/components/Math3D` | 空间仿射基底/向量组复合组件。Props: `origin`, `vecA`, `vecB`, `vecC` |
| 3D 图例 | `Legend3D` | `@/components/Math3D` | 底端浮动图例 |
| 3D 截面 | `SectionPlane3D` | `@/components/Math3D` | 截面可视化 |
| 左屏容器 | `LeftPanel` / `LeftPanelSection` | `@/components/UI` | — |
| 实时数学量面板 | `MathPanel` | `@/components/UI` | — |
| 左屏 Tab 切换 | `TabSwitcher` | `@/components/UI` | — |
| 左屏选择网格 | `SelectGrid` | `@/components/UI` | — |
| 通用按钮 | `Button` | `@/components/UI` | ⚠️ 当前零引用，选择控件请用 TabSwitcher/SelectGrid |

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

### 铁律 4C：“公式-图形-滑块”三位一体色彩绑定铁律

为确保学生在“数形结合”学习中的视觉直觉，对于由同一数学参数（如 $a, b, c$ 或 $k, b$）控制的**左屏滑块描述**、**中屏 SVG 几何图形**以及**看板/悬浮 LaTeX 公式**，必须强制实行色彩一致性绑定：
1. **参数色彩映射**：统一使用专用的参数语义色：
   - 核心主控参数一（如 $a$, $k$）：`MATH_COLORS.paramPrimary` (`#EF4444` - 鲜红)
   - 次要关联参数二（如 $b$）：`MATH_COLORS.paramSecondary` (`#D97706` - 暖橙)
   - 辅助或常数参数三（如 $c$, $\theta$）：`MATH_COLORS.paramTertiary` (`#059669` - 翠绿)
2. **公式内上色**：在 KaTeX 公式渲染时，使用 `\color{${MATH_COLORS.paramPrimary}}` 动态 Token 指令将特定参数变量渲染为对应的参数色彩（**严禁硬编码字面量 Hex**）。
   - 例如二次函数：`\\color{${MATH_COLORS.paramPrimary}}{a}x^2 + \\color{${MATH_COLORS.paramSecondary}}{b}x + \\color{${MATH_COLORS.paramTertiary}}{c}`
3. **滑块与控制台**：在左屏 `ParamControl` 标签或提示文本中对该参数应用统一的色彩指示。
4. **场景几何图象**：中屏 SVG/3D 中由特定参数直接决定的特征图形（例如二次函数的对称轴、旋转体的母线与底面半径）应尽量使用或呼应其所绑定的色彩。
5. **3D 几何特征点与单一数据源**：3D 旋转体特征点 $O, O_1, A, A_1, S$ 与虚线母线框必须 100% 直连 `profile` 顶点数据源；球体外轮廓线必须使用透视切圆解析解（$h_{\text{rim}}=R^2/d, r_{\text{rim}}=R\sqrt{1-R^2/d^2}$），杜绝近景放大脱节。

### 铁律 4D：3D 数学三大范式隔离与标注分工铁律

1. **范式隔离（严禁跨范式污染）**：
   - **纯几何范式（必修二）**：线面面面平行垂直、旋转体、截面、球体切接。**纯空间几何骨架，严禁出现笛卡尔坐标轴、向量箭头与干扰性地面地砖网格**。
   - **仿射基底范式（空间向量定理）**：一般斜基底 $\vec{a},\vec{b},\vec{c}$ 与平行六面体分解。**纯仿射空间向量箭头，严禁出现笛卡尔直角坐标轴穿刺与地面地砖网格**，加法折线严禁自造生硬点标。
   - **解析建系范式（向量应用与空间角/距）**：仅在建立直角坐标系时使用 `Scene3DGrid`（纯 $x,y,z$ 三轴系统，`showGrid: false` 杜绝地砖），呈现法向量与空间角弧。
2. **3D 标注组件严格分工**：
   - 几何顶点（$A, B, C \dots$）：100% 使用 `PointLabel3D`（单字母）或 `CompoundLabel3D`（如 $A_1, P_1$），纯 3D 矢量文字，**严禁向 PointLabel3D 传入 Unicode 下标，严禁使用带背景卡片的 FormulaLabel3D**。
   - 空间几何线段（棱、面对角线、斜线、垂线段、公垂线）：100% 使用 `Segment3D`，**严禁误用带箭头的 Vector3DArrow**。
   - 空间代数向量（$\vec{a}, \vec{OP}$、法向量 $\vec{n}$）：使用 `Vector3DArrow` 与 `FormulaLabel3D`（默认纯净无底框 plain 模式）。
3. **高考场景预设单模式闭环**：
   - 左屏预设仅调整参数，**严禁在预设回调中篡改 activeMode**。

### 铁律 5：HashRouter Only

禁止引入 `BrowserRouter`，路由跳转仅用 `to="/xxx"`（HashRouter 内部路径）。

### 铁律 6：数学层纯净

`src/math/` 内禁止出现 DOM、React、window、Store 依赖。所有数学模型求解函数必须是纯函数，带 validity 状态且支持 JSDoc 测试。

### 铁律 7：数形双向联动与避让

1.  **反向求参**：允许拖动图形点反向改变滑块参数。在 drag 回调中解算出数学坐标，四舍五入保留合适精度并更新父 state。
2.  **标注避让**：当顶点、交点、零点等标注处于极小间距时，使用 `avoidLabelOverlap`（`@/utils/labelOverlap`）自动偏移避让，严禁文字标签相互重叠。

### 铁律 8：数学量数据组装约定

右屏 `MathPanel` 的数据由 `buildMathQuantities(animId, params, config)` 统一组装，内部按 `animId` 分支（当前为单一入口模式）。新页面需在该函数中添加对应 `animId` 分支，返回 `MathPanelData` 结构。

```tsx
// ✅ 右屏标准写法
import { buildMathQuantities } from '@/data/mathQuantities'

// animId 命名约定：'anim-<topic>'，例：'anim-quadratic', 'anim-derivative-tangent'
const mathData = useMemo(() => buildMathQuantities('anim-<topic>', params), [params])

// 如果需要传递额外配置（如函数预设 key、子模式等），通过第三个参数传入：
// const mathData = useMemo(() => buildMathQuantities('anim-<topic>', params, { fnKey: 'cubic' }), [params])

<MathPanel
  quantities={mathData.quantities}
  theorems={mathData.theorems}
  gaokaoPoints={mathData.gaokaoPoints}
  warnings={mathData.warnings}
  mnemonic={mathData.mnemonic}
  title="xxx看板"
/>
```

```tsx
// ✅ 左屏标准写法（paramMeta → ParamControl 数据流）
import { ParamControl, LeftPanel, LeftPanelSection } from '@/components/UI'
import type { ParamConfig } from '@/components/UI'
import { defaultParams, paramMeta } from '@/data/registries/<topic>'

// 1. 初始化参数状态
const [params, setParams] = useState<Record<string, number>>(() => ({
  ...defaultParams,
}))

// 2. 按模式过滤的声明式参数配置（多模式页必须；单模式页可省略 keysByMode 直接遍历）
const paramConfigs = useMemo<ParamConfig[]>(() => {
  const keysByMode: Record<string, string[]> = {
    modeA: ['x0', 'a'],       // 仅展示该模式需要的参数
    modeB: ['m', 'n', 'step'],
  }
  const keys = keysByMode[activeMode] ?? Object.keys(paramMeta)
  return keys
    .filter((key) => key in paramMeta)
    .map((key) => {
      const meta = paramMeta[key]
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,       // 参数标签 KaTeX（优先于 label 纯文本）
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula, // 参数描述 KaTeX（优先于 description）
        importance: meta.importance as any,
        marks: meta.marks,  // 退化临界值标记
      }
    })
}, [params, activeMode])  // ⚠️ 依赖必须包含 activeMode

// 3. 渲染（左屏：模式选择 + 参数调节）
<LeftPanel>
  {/* 模式选择区（如有） */}
  <LeftPanelSection title="模式选择" subtitle="...">
    {/* 按钮组 */}
  </LeftPanelSection>

  {/* 参数调节区 */}
  <LeftPanelSection title="参数调节" subtitle="拖动滑块...">
    <ParamControl
      params={paramConfigs}
      onParamChange={handleParamChange}
      onReset={handleReset}
    />
  </LeftPanelSection>
</LeftPanel>
```

---

## 📋 改造现有页面的约束清单

> 改造 ≠ 新建。改造时必须遵守以下约束，禁止借改造之名创建重复组件。

| 约束 | 说明 |
|------|------|
| **禁止新建等效组件** | 改造现有页面时，必须在原文件上编辑，不得创建新文件替代。例外：按 meta.ts 架构将多模式页面拆分为独立路由页面（如 `/function-exponential` + `/function-logarithmic`）属于有意重构，不受此限 |
| **禁止新建等效 Scene** | 如需修改渲染逻辑，直接修改 `<Topic>Scene.tsx`，不要新建 `XxxScene2.tsx` |
| **复用已有组件** | 如需添加切线/渐近线/阴影等，使用 `TangentLine`/`Asymptote`/`IntervalShadow`，禁止手写 |
| **左屏只改 paramMeta** | 如需调整参数范围/步长/退化标记，修改 `registries/<topic>.ts` 中的 `paramMeta`，不要手写控件 |
| **右屏只改 buildMathQuantities** | 如需调整看板数据，在 `mathQuantities.ts` 对应 `animId` 分支中修改，不要绕过统一入口 |
| **动画 preset 不随意切换** | 改 preset 会改变整个布局结构，需评估对左屏/右屏的影响 |

---

## 📋 新建页面前必须确认的 11 件事

1. **选择 preset**：默认 `full`；圆形/三角函数用 `square`；split 仅限双坐标系对照（需前置审查）
2. **分层结构**：`XxxAnimation.tsx`（编排）+ `math/xxx.ts`（计算）+ `components/XxxScene.tsx`（渲染）
3. **交互手势**：关键控制点使用 `InteractivePoint` 配合 `onDrag`，达成双向参数联动
4. **公式着色与三位一体绑定**：在 KaTeX 拼接、滑块 Label/提示和中屏特征几何图形中，强制使用对应的参数语义色 `paramPrimary`/`Secondary`/`Tertiary` 实现“公式-图形-滑块”三位一体绑定。
5. **退化防范与前提**：必须有 $a = 0$ 等退化状态下的图形兼容和红字 `WarningItem` 提示；右侧定理公式注明"适用前提条件"
6. **曲线连续性**：绘制曲线时，必须对不连续点（例如 $\tan x$ 的渐近线）在采样时进行断开处理
7. **字号缩放链路**：Animation 必须传 `fontScale={canvasSize.font}` 给 Scene；Scene 必须传 `fontScale` 给 CoordinateGrid/InteractivePoint/Asymptote/VectorArrow；SVG 内禁止 `className="text-[Npx]"` 硬编码字号
8. **左屏参数过滤**：多模式页的 `paramConfigs` 必须按 `activeMode` 过滤参数，依赖数组必须包含 `activeMode`
9. **左屏公式渲染**：`paramMeta` 中含数学符号的 `label`/`description`/`marks[].label` 应提供对应的 `labelFormula`/`descriptionFormula`/`marks[].labelFormula`，`ParamControl` 会自动用 KaTeX 渲染
10. **左屏选择控件**：模式切换用 `TabSwitcher`，公式选择用 `SelectGrid`，禁止手写 `<button>` 做选择控件
11. **formula 格式**：`formula` 字段必须是纯 LaTeX，禁止 `$...$` 包裹（`katex.render()` 直接接收，多余的 `$` 会渲染为字面美元符号）

---

## 📋 新建页面后必须完成的注册步骤

> **快捷方式**：运行 `node scripts/gen-node.mjs` 脚手架脚本可自动生成 meta.ts + Animation.tsx + index.ts 骨架，并自动插入 knowledgeTree.ts 和 routeEntries.ts。

1. **创建 meta.ts**：在 `src/features/<topic>/meta.ts` 中导出 `node`（KnowledgeNode，含 `route` 字段）和 `loader`（`() => import(...)` 动态加载）。参考 `src/features/set/meta.ts`
2. **注册路由**：在 `src/data/routeEntries.ts` 的 `legacyEntries` 数组中添加 `{ node, loader }` 条目。App.tsx 会从 routeEntries 自动生成所有 `<Route>`，无需手动编辑 App.tsx
3. **注册知识树**：在 `src/data/knowledgeTree.ts` 中添加对应节点（id、title、chapter、module、importance、animationIds、prerequisites）。routeEntries 中每个有 route 的节点都必须在 knowledgeTree 中有对应条目（`knowledgeTree.test.ts` 会校验）
4. **注册 mathQuantities 分支**：在 `src/data/mathQuantities.ts` 的 `buildMathQuantities` 函数中添加新 `animId` 的 if 分支
5. **注册 registry**：在 `src/data/registries/<topic>.ts` 中定义 `defaultParams` 和 `paramMeta`
6. **组件导出**：如创建了新的公共组件，需在对应 `src/components/*/index.ts` 中导出

---

*最后更新：2026-07-18 | 由 Antigravity 生成*
