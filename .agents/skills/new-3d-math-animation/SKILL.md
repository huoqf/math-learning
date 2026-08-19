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
| [references/components-guide.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/components-guide.md) | **3D 核心组件清单**、`SPACE_3D_COLORS`、动点约束与透视切圆架构 | 编写中屏 3D 场景时查阅 |
| [references/geometry-standards.md](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/references/geometry-standards.md) | **3D 几何建模与高考标注规范**、旋转体母线定义、双垂直/截面标注 | 几何体建模与标注规范查阅 |
| [examples/Template3DAnimation.tsx](file:///d:/code/math/math-learning/.agents/skills/new-3d-math-animation/examples/Template3DAnimation.tsx) | **3D 页面标准完整骨架模板** | 新建 3D 页面时直接参考复制 |

---

## ⚡ 核心职责边界与三大数学范式隔离

| 数学范式 | 适用章节 | 合法 3D 元素与标注 | 严禁项（禁止跨范式污染） |
|---------|---------|-------------------|------------------------|
| **范式 A：综合几何（纯几何）** | 旋转体、线面面面平行垂直、多面体截面、翻折 | 实体几何体、截面、`PointLabel3D` / `CompoundLabel3D` | ❌ 严禁笛卡尔直角坐标轴、严禁向量箭头 |
| **范式 B：仿射基底（空间向量定理）** | 空间向量基本定理、基底分解、四点共面 | 向量箭头 `Vector3DArrow`、三步加法折线、淡雅水平参考网格 | ❌ 严禁笛卡尔直角坐标轴穿刺画面、严禁生造折线点标签 |
| **范式 C：解析建系（向量应用）** | 空间直角坐标系、法向量、求空间角与距离 | 空间直角坐标轴 `Scene3DGrid`、法向量、空间角弧 `AngleArc3D` | ❌ 严禁在无坐标系概念的纯几何中提前建系 |

---

## 🛠️ 开发与重构标准流程 (4 步走)

### Step 0：设计决策
1. **范式定位**：首先明确当前页面属于范式 A（纯几何）、范式 B（仿射基底）还是范式 C（解析建系），选择对应的画布基础设施。
2. **左屏标准**：严格遵守 `references/left-panel-spec.md` 中的**五步渲染层级**（探究模式 $\to$ 高考场景/模型 $\to$ 参数调节 $\to$ 教学提示 $\to$ 视图与视角）。
3. **几何与标注**：严格遵守 `references/geometry-standards.md` 与 `references/components-guide.md`（几何顶点用 `PointLabel3D`/`CompoundLabel3D`，公式用 `FormulaLabel3D(plain)`）。
4. **坐标约定**：右上手坐标系（X 横向、Y 纵深、Z 垂直向上）。

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
- [ ] **左屏规范**：是否符合 `references/left-panel-spec.md`（五步层级、2+1 SelectGrid、TipCard Token）
- [ ] **几何规范**：是否符合 `references/geometry-standards.md`（单一数据源、动点同轴、透视切圆、高考标准双垂直）
- [ ] **组件规范**：是否符合 `references/components-guide.md`（动点 vs 固定点隔离、正交投影防脱轨、三位一体 Token 绑定）
- [ ] **系统链路**：`routeEntries.ts` 是否配置 `guarded3D: true`，`knowledgeTree.ts` 是否正确注册
- [ ] **测试验证**：`npx vitest run src/math3d/` 全部通过，`npm run build` 打包 0 错误。

