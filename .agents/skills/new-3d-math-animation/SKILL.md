---
name: new-3d-math-animation
description: >
  新建3D数学动画页面 / 创建3D数学动画组件 / 新建立体几何页面 / 新建空间向量页面 / 新建3D解析几何页面
  / 添加空间角动画 / 添加空间距离动画 / 添加点线面位置关系动画 / 添加球体外接球内切球动画 / 3D可视化
  / 三维空间动画 / 空间直角坐标系 / 3D几何体 / R3F动画 / 按3D规范新建
---

# 新 3D 数学动画页面开发技能 (立体几何与空间向量)

> **权威准则**：本文件是 3D 实操路由指南。所有底层铁律以 `AGENTS.md` 为准。
> 💡 **资源按需加载**：详细组件、左屏规范和骨架模板已模块化沉淀，需要时请直接查阅对应子文件。

---

## 📚 按需参考资源索引 (按需查阅，禁止全文膨胀)

| 资源路径 | 作用与内容 | 适用场景 |
|---------|-----------|---------|
| [references/left-panel-spec.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/left-panel-spec.md) | **左屏五步渲染层级**、2+1 SelectGrid 防截断、TipCard Token 映射表 | 编写/重构左屏 UI 时必读 |
| [references/components-guide.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/components-guide.md) | **3D 核心组件清单**、`SPACE_3D_COLORS` 与材质语义映射表 | 编写中屏 3D 场景时查阅 |
| [examples/Template3DAnimation.tsx](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/examples/Template3DAnimation.tsx) | **3D 页面标准完整骨架模板** | 新建 3D 页面时直接参考复制 |

---

## ⚡ 核心职责边界

| 文件层级 | 允许包含 | 严禁包含 |
|---------|---------|---------|
| `XxxAnimation.tsx` | state、`use3DViewport`、`paramConfigs`、`ThreePanel` 三屏组装、`buildMathQuantities` | 2D `AnimationSvgCanvas`、`mathToDesign`、硬编码 HTML 样式 |
| 3D Scene / Canvas | `<ThreeDCanvas>`、`<CameraRig>`、`Math3D` 系列标准组件 | `useState` 动态修改全局状态、DOM 计算、原生 Canvas 裸代码 |
| `math3d/<topic>.ts` | 纯数学 3D 向量/线面/几何体计算纯函数，配套单测 | React、DOM、Three.js 对象、Store |
| `registries/<topic>.ts` | `paramMeta`、`defaultParams` | 副作用、动态视图计算 |

---

## 🛠️ 开发与重构标准流程 (4 步走)

### Step 0：设计决策
1. **左屏标准**：严格遵守 `references/left-panel-spec.md` 中的**五步渲染层级**（探究模式 $\to$ 几何模型 $\to$ 参数调节 $\to$ 教学提示 $\to$ 视图与视角）。
2. **显示模式**：支持三视图时，在中屏通过 `ThreeViewsPanel`（纯 SVG 正投影）与 `ThreeDCanvas` 切换。
3. **坐标约定**：右上手坐标系（X 横向、Y 纵深、Z 垂直向上）。

### Step 1：编写代码
- 参考 [Template3DAnimation.tsx](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/examples/Template3DAnimation.tsx) 搭建三屏结构。
- 中屏使用 `ThreeDCanvas` + `CameraRig` + `Scene3DGrid` + `Legend3D`。
- 空间公式使用 `FormulaLabel3D`，点标签使用 `PointLabel3D` / `CompoundLabel3D`。

### Step 2：系统注册链路
1. **创建 meta.ts**：在 `src/features/<topic>/meta.ts` 导出 `node` 与动态 `loader`。
2. **注册路由**：在 `src/data/routeEntries.ts` 中添加 `{ node, loader, guarded3D: true }`（**必须加 `guarded3D: true`**）。
3. **注册知识树**：在 `src/data/knowledgeTree.ts` 中添加节点。
4. **数学求解纯函数**：在 `src/math3d/<topic>.ts` 编写算法并补充 `__tests__/` 单测。
5. **右屏看板组装**：在 `src/data/mathQuantities.ts` 添加分支返回 `MathPanelData`。
6. **参数元数据**：在 `src/data/registries/solidGeometry.ts` 中注册 `paramMeta`。

### Step 3：交付前自检
- [ ] **左屏五步层级**：是否严格按 探究模式 $\to$ 几何模型 $\to$ 参数调节 $\to$ 教学提示 $\to$ 视图视角 顺序渲染
- [ ] **防截断机制**：模式选择选项 $\ge 3$ 时，是否使用了 2+1 `SelectGrid`
- [ ] **教学提示 Token**：是否使用 `<TipCard variant="...">` 承载，公式是否用 `<KatexFormula mode="inline" />` 渲染
- [ ] **3D 语义色**：是否使用 `SPACE_3D_COLORS` 与 `colorKey`，杜绝硬编码 Hex 色值
- [ ] **路由 3D 守卫**：`routeEntries.ts` 是否配置了 `guarded3D: true`
- [ ] **测试验证**：`npx vitest run src/math3d/` 全部通过，`npm run build` 打包 0 错误
