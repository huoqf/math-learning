---
name: new-3d-math-animation
description: >
  新建3D数学动画页面 / 创建3D数学动画组件 / 新建立体几何页面 / 新建空间向量页面 / 新建3D解析几何页面
  / 添加空间角动画 / 添加空间距离动画 / 添加点线面位置关系动画 / 添加球体外接球内切球动画 / 3D可视化
  / 三维空间动画 / 空间直角坐标系 / 3D几何体 / R3F动画 / 按3D规范新建
---

# 新 3D 数学动画页面开发技能 (立体几何与空间向量)

> **权威准则**：本文件是 3D 实操路由指南。所有底层铁律以 `AGENTS.md` 为准。
> 💡 **资源按需加载**：详细组件、左屏规范、全章节模型图谱和骨架模板已模块化沉淀，开发与重构时请直接查阅对应子文件。

---

## 📚 按需参考资源索引 (按需查阅，禁止全文膨胀)

| 资源路径 | 作用与内容 | 适用场景 |
|---------|-----------|---------|
| [references/geometry-standards.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/geometry-standards.md) | **全章节模型图谱与高考标注规范**（空间角/距离/切接球/截面/动点） | **重构与新建前必查**（确定必标辅助线与图元） |
| [references/left-panel-spec.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/left-panel-spec.md) | **左屏五步渲染层级**、模式防截断、操作引导与图层分类规范 | 编写/重构左屏 UI 时必读 |
| [references/components-guide.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/components-guide.md) | **3D 核心组件清单**、`SPACE_3D_COLORS`、动点约束与透视切圆架构 | 编写中屏 3D 场景时查阅 |
| [examples/Template3DAnimation.tsx](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/examples/Template3DAnimation.tsx) | **3D 页面标准完整骨架模板** | 新建 3D 页面时直接参考复制 |

---

## ⚡ 核心职责边界与三大数学范式隔离

| 数学范式 | 适用章节 | 合法 3D 元素与标注 | 严禁项（禁止跨范式污染） |
|---------|---------|-------------------|------------------------|
| **范式 A：综合几何（纯几何）** | 旋转体、线面面面平行垂直、多面体截面、翻折、球体切接 | 实体几何体、截面、`Segment3D`、`PointLabel3D` / `CompoundLabel3D` | ❌ 严禁笛卡尔坐标轴、严禁向量箭头、严禁地面地砖网格 |
| **范式 B：仿射基底（空间向量定理）** | 空间向量基本定理、基底分解、四点共面 | 向量箭头 `Vector3DArrow`、三步加法折线 | ❌ 严禁笛卡尔直角坐标轴穿刺、严禁地面地砖网格 |
| **范式 C：解析建系（向量应用）** | 空间直角坐标系、法向量、求空间角与距离、动点存在性 | 空间直角坐标轴 `Scene3DGrid` (纯三轴)、法向量、空间角弧 `AngleArc3D` | ❌ 严禁无坐标系概念提前建系、严禁地面地砖网格 |

---

## 🛠️ 3D 页面优化重构与新建标准化工作流 (5 步闭环)

### 阶段 1：模型审题与图谱对照（设计期）
1. **范式定界**：明确属于范式 A（纯几何）、范式 B（仿射基底）还是范式 C（解析建系）。
2. **图谱对照**：查阅 [references/geometry-standards.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/geometry-standards.md)，列出当前模型必须呈现的**必标辅助线与特征图元清单**（如射影垂足、双垂直方框、二面角平面角、外接球心补形框、法向量等）。
3. **色彩规划**：按“公式-图形-滑块”三位一体绑定规划 `paramPrimary`（主参数）、`paramSecondary`（次参数）、`paramTertiary`（高度/角参数）。

### 阶段 2：数学层算法与单测先行（计算期）
1. 在 `src/math3d/<topic>.ts` 编写纯函数求解几何拓扑、射影垂足、法向量、二面角及动点轨迹。
2. 在 `src/math3d/__tests__/<topic>.test.ts` 补充完备单测，覆盖退化情况（如角度为 0 或 90°、截面过顶点退化等）。

### 阶段 3：中屏 3D 场景与标注实现（渲染期）
1. 几何顶点使用 `PointLabel3D` / `CompoundLabel3D`（纯 3D 矢量文字）。
2. 空间公式与向量使用 `FormulaLabel3D(plain)`。
3. 动点（$r=0.075$ 带脉冲光晕与射线拾取）与固定点（$r=0.042$ 开启 depthTest）严格隔离。
4. 画布右上角接入 `ModeSwitchOverlay3D` 支持视角漫游与动点交互互斥。

### 阶段 4：左屏控制台与右屏看板组装（系统链路）
1. **左屏**：遵循 `references/left-panel-spec.md` 的五步渲染层级，使用 `SelectGrid`（2+1 布局）与 `ParamControl`（带 KaTeX labelFormula）。
2. **右屏**：在 `src/data/mathQuantities.ts` 组装 `quantities`、`theorems`（含前提条件）、`gaokaoPoints` 和 `warnings`。
3. **注册**：在 `src/features/<topic>/meta.ts`、`src/data/routeEntries.ts`（必须配 `guarded3D: true`）和 `src/data/knowledgeTree.ts` 注册。

### 阶段 5：高考数学习惯门禁验收（验收期）
- [ ] **范式纯净度**：综合几何中无坐标轴/向量箭头；向量基底中无笛卡尔轴穿刺。
- [ ] **辅助线完整度**：对照 `geometry-standards.md`，双垂直、射影垂足、二面角平面角、补形框等辅助线是否全部标齐？
- [ ] **标注合规性**：几何顶点 100% 为纯矢量文字，无白底卡片；公式上色 100% 使用 Token。
- [ ] **图层从属联动闭环**：当关闭任一父级几何结构（截面、投影、辅助面/线、切接球等）时，其派生的专有从属图元（交点、垂足、特征中心、直角标尺、角弧等）必须 100% 同步隐藏，严禁孤立悬浮。
- [ ] **数形双向联动**：动点拖拽是否能平滑反算左屏滑块数值且不脱轨？
- [ ] **工程与测试**：`npx vitest run src/math3d/` 100% 通过，`npm run build` 0 报错。


