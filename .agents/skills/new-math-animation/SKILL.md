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

# 新数学动画页面开发技能 (2D)

> **铁则**：本文件是 2D (SVG Canvas) 实操路由指南。所有铁律、禁令、checklist 以 `AGENTS.md` 为唯一权威源。
> 💡 **3D 页面提示**：如需开发立体几何、空间向量、3D 解析几何等 3D 动画页面，请使用 `new-3d-math-animation` 技能。

---

## ⚠️ 前置条件（写代码前必须完成）

1. Read `AGENTS.md` — 铁律、禁令、组件表、颜色规范、checklist 全部在此
2. Read 实体黄金样板与资源库：
   - 代数/函数模型黄金样板：`.agents/skills/new-math-animation/examples/algebra_function_model.md`
   - 高考高频函数模型字典：`.agents/skills/new-math-animation/resources/gaokao_function_models.json`
3. 经典参考代码：`src/features/funcZero/FuncZeroAnimation.tsx`（代数模型） / `src/features/quadratic/QuadraticAnimation.tsx`（参数二次型）

未完成以上读取，禁止开始编码。

---

## 职责边界（文件超长时优先检查此项）

| 文件 | 允许包含 | 禁止包含 |
|------|---------|---------|
| `Animation.tsx` | state、viewport、paramConfigs、三屏组装、useMemo 拼装数据 | SVG 渲染、坐标计算、数学函数体、大段公式拼接逻辑 |
| `Scene.tsx` | `<g>` 包裹的 SVG 图形、mathToDesign、fontScale 传递 | useState、setParams、业务逻辑判断、数据组装 |
| `math/<topic>.ts` | 纯函数、validity 状态、JSDoc | React、DOM、window、Store |
| `registries/<topic>.ts` | paramMeta、defaultParams | 动态计算、副作用 |

---

## Step 0：设计决策

- **Preset**：默认 `CANVAS_PRESETS.full`（840×650）。仅 y 轴量纲不同时允许 split。详见 AGENTS.md → 布局 preset 铁律。
- **三屏**：左屏=ParamControl+按钮组；中屏=纯 SVG 动画；右屏=MathPanel。详见 AGENTS.md → 三屏内容分配铁律。
- **文件结构**：`Animation.tsx`（编排）+ `components/Scene.tsx`（渲染）+ `math/<topic>.ts`（计算）+ `registries/<topic>.ts`（参数）

---

## Step 1：代码骨架

> 以下为结构示意，实际参数以 Read 到的源文件为准。

### 编排层（Animation）

参考：`src/features/quadratic/QuadraticAnimation.tsx`

核心 hook 链路：
```tsx
const [params, setParams] = useState(() => ({ ...defaultParams }))
const { containerRef, canvasSize, vp } = useAnimationViewport({ preset: CANVAS_PRESETS.full })
const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] })
const mathData = useMemo(() => buildMathQuantities('anim-xxx', params), [params])
```

三屏组装：
```tsx
<ThreePanel
  left={<LeftPanel>...ParamControl...TabSwitcher/SelectGrid...</LeftPanel>}
  center={
    <div className="w-full h-full relative flex flex-col bg-white">
      {/* 悬浮公式 / 标题 */}
      <div className="absolute top-4 left-4 z-10 ..."><KatexFormula ... /></div>
      {/* 右下角毛玻璃图例 */}
      <SceneLegend items={legendItems} />
      {/* SVG 动画画布 */}
      <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
        <XxxScene params={params} scale={scale} vp={vp} fontScale={canvasSize.font} />
      </AnimationSvgCanvas>
    </div>
  }
  right={<MathPanel {...mathData} title="xxx看板" />}
/>
```

### 渲染层（Scene）

参考：`src/features/quadratic/components/QuadraticScene.tsx`

核心结构：
```tsx
<g>
  <CoordinateGrid scale={scale} fontScale={fontScale} />
  <FunctionGraph fn={...} scale={scale} color={MATH_COLORS.xxx} />
  <InteractivePoint cx={...} cy={...} scale={scale} vp={vp} onDrag={...} fontScale={fontScale} />
  {/* 极简学术点标智能避让图层 */}
  <SceneLabelGroup items={labelItems} fontScale={fontScale} />
</g>
```

坐标转换：渲染用 `mathToDesign(x, y, scale)`，拖拽用 `InteractivePoint`（内部已封装 designToMath）。详见 AGENTS.md → 铁律 1 / 铁律 7。

### 📐 全屏公式与点标双轨渲染管线

KaTeX 输出 HTML，不能直接作为 SVG 子元素，禁止 `<foreignObject>`：

| 渲染场景 | 规范技术方案 | 严禁行为 |
|---------|-------------|---------|
| UI 容器 (左屏/右屏/左上角) | `<KatexFormula formula="..." mode="inline" />` | ❌ 严禁裸写带大括号 `{}` 的 LaTeX 源码 |
| 2D 中屏几何点标/曲线名称 | `<SceneLabelGroup items={...} />` (纯代数/Unicode 字符) | ❌ 严禁向 SVG `<text>` 传入带反斜杠的 LaTeX 源码 (如 `\sqrt{x}`) |
| 2D 中屏全量解析式/特征点 | `<SceneLegend items={...} />` (右下角毛玻璃卡片内置 KaTeX) | ❌ 严禁在画布中央堆砌随拖拽跳动的浮点数字符串 |
| 3D 空间几何顶点/向量公式 | 顶点 `PointLabel3D` / 下标 `CompoundLabel3D` / 向量 `FormulaLabel3D(plain)` | ❌ 严禁向 PointLabel3D 传 Unicode 下标；严禁顶点带白底卡片 |

---

## Step 2：注册步骤（新建页面必做）

1. **创建 meta.ts**：在 `src/features/<topic>/meta.ts` 中导出 `node`（KnowledgeNode，含 `route`）和 `loader`（`() => import(...)`）。参考 `src/features/set/meta.ts`
2. **注册路由**：在 `src/data/routeEntries.ts` 的 `legacyEntries` 中添加 `{ node, loader }` 条目。App.tsx 从 routeEntries 自动生成路由，无需手动编辑 App.tsx
3. **注册知识树**：在 `src/data/knowledgeTree.ts` 中添加节点（id/title/chapter/module/importance/animationIds/prerequisites）
4. **mathQuantities**：`src/data/mathQuantities.ts` → buildMathQuantities 添加 animId 分支
5. **registry**：`src/data/registries/<topic>.ts` → defaultParams + paramMeta
6. **组件导出**：新公共组件在 `src/components/*/index.ts` 导出

> **快捷方式**：`node scripts/gen-node.mjs` 可自动生成 meta.ts + Animation.tsx + index.ts 骨架并插入 knowledgeTree/routeEntries。

---

## 常见陷阱与全局设计规范

- **左屏层级动线与分科原则** → 
  - **代数/函数/数列专题**：`探究模式 (TabSwitcher) → 模型选择 (SelectGrid) → 参数调节 (ParamControl) → 启发导引 (TipCard)`，动线纯净，严禁无脑堆砌 2×2 预设；
  - **解析几何/立体几何专题**：当自由参数过多时，利用【典型构型预设】锁定约束并隐藏从属参数（参数降维），画布拖拽时自动切回【自由探究】（`free`）。
- **全屏数学表达式 KaTeX 规范** → 严禁在普通文本/description 中直接裸写 `e^{x-1}` 或 `\ln x` 等带花括号 `{}` 源码；TipCard 等区域必须使用 `<KatexFormula formula="..." mode="inline" />` 渲染；`SelectGrid` 中公式必须置于 `formula` 字段。
- **多模式参数定义域动态保护（铁律）** → `paramConfigs` 必须根据 `activeMode` 动态计算各参数的 `min / max / marks`（如对数函数必须强制保护 $x_0 \in [0.1, 3.5]$，严禁沿用指数负数范围造成定义域穿透）。
- **左屏参数精炼与对象化分组** → 同一几何对象（如 $x_0, y_0$、向量分量、复数实虚部）必须配置相同的 `group` 聚合呈现，底模参数置底。
- **解析几何纯净坐标系** → `CoordinateGrid` 默认 `showGrid={false}`（纯白底色 + 清晰 $xOy$ 轴，杜绝满屏虚线方格干扰）。
- **中屏点标纯学术化与智能避让** → 画布内点标统一使用 `<SceneLabelGroup />` 渲染极简符号（$P, P_0, Q, M, I, E$），自动应用 8 向碰撞检测与防遮挡描边；全量函数方程、切线/割线解析式、点坐标与面积释义一律放置在中屏右下角 `<SceneLegend />`，严禁在画布内手写散乱长文本。
- **多子模型 Warning 判定解耦** → 包含不同相切/退化临界时（如定点相切 $a=1$ 与过原点相切 $a=e$），Warning 判定必须按 `subMode` 独立分支计算。
- **右屏数据不要绕过统一入口** → 必须走 `buildMathQuantities(animId, params)`。

---

## 交付前自检

对照 `AGENTS.md` → 新建页面前必须确认的 11 件事 + Checklist，逐项验证。发现违规必须修复后才能交付。

---

*参考模板：`src/features/quadratic/QuadraticAnimation.tsx` + `src/features/quadratic/components/QuadraticScene.tsx`*
*规则权威源：`AGENTS.md`*
