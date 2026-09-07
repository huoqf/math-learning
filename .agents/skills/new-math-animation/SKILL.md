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

# 新 2D 数学动画页面开发技能 (SVG Canvas)

> **定位**：本文件是 2D (SVG Canvas) 页面新建与重构实操路由指南。底层铁律以 `AGENTS.md` 为唯一权威源。
> 💡 **3D 页面提示**：如需开发立体几何、空间向量、3D 解析几何等页面，请使用 `new-3d-math-animation` 技能。

---

## 📚 按需参考资源索引表

| 资源路径 | 作用与内容 | 适用场景 |
| :--- | :--- | :--- |
| [examples/Template2DAnimation.tsx](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/examples/Template2DAnimation.tsx) | **2D 页面标准完整编排模板**（三屏组装/双要素TipCard/毛玻璃图例） | **新建 2D 页面时直接参考复制** |
| [examples/Template2DScene.tsx](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/examples/Template2DScene.tsx) | **2D 中屏 SVG 标准场景模板**（坐标网格/函数曲线/动切线/智能点标） | 编写中屏 SVG 场景时参考 |
| [references/2d-components-guide.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/2d-components-guide.md) | **2D 核心数学组件速查手册**（Props表、避雷规范、三位一体色系映射） | 组装图形图元时查阅 |
| [resources/gaokao_function_models.json](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/resources/gaokao_function_models.json) | **高考高频函数模型字典**（定义域保护、解析解、增减区间参数） | 配置预设模型数据时快速查表 |
| [references/right-panel-spec.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/right-panel-spec.md) | **右屏看板 MathPanel 完整 Props 规范**（MathQuantity/Theorem/GaokaoPoint 等所有字段类型+课型分层表+Builder 标准结构） | **编写或审查右屏 builder 时必读** |
| [references/registration-guide.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/registration-guide.md) | **新页面注册四步闭环指南**（KnowledgeNode 必填字段、animId 对应联动、代码片段模板、自检清单） | **新建页面时必读，保证知识树与右屏正确注册** |

---

## ⚠️ 开发前置条件

1. Read `AGENTS.md` — 铁律、禁令、三屏内容分配原则。
2. 根据课型选择模板：
   - 基础概念/单模型页面：参考 [Template2DAnimation.tsx](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/examples/Template2DAnimation.tsx) 省略二级情景选择器；
   - 高考大题/多构型页面：完整保留二级情景并配置参数降维。

---

## 🛠️ 2D 页面新建与重构标准化工作流

### Step 0：文件结构与职责定界
```
src/features/<topic>/
├── <Topic>Animation.tsx         # [页面总控] 组装 ThreePanel, LeftPanel, ParamControl, TipCard, SceneLegend
├── components/
│   └── <Topic>Scene.tsx         # [中屏图形] CoordinateGrid, FunctionGraph, MathPoint, InteractivePoint
src/data/
├── registries/<topic>.ts        # [数据注册] defaultParams, paramMeta (三位一体色彩命名与 group 分组)
└── builders/<topic>.ts          # [右屏看板] buildMathQuantities 分支，导出特征量、定理、高考秒杀点
```

### Step 1：核心代码骨架装配与组件复用铁律
- **视口与比例**：使用 `useAnimationViewport({ preset: CANVAS_PRESETS.full })` 与 `useSceneScale`。
- **能用组件绝不手写**（查阅 [references/2d-components-guide.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/2d-components-guide.md)）：
  - ❌ 禁止手写 `<circle>` 绘制点，必须用 `MathPoint`（静态点）或 `InteractivePoint`（可拖拽控制点）；
  - ❌ 禁止手写 `<line>` + `<polygon>` 做箭头，必须用 `VectorArrow`；
  - ❌ 禁止手写 `<input type="range">`，必须用 `ParamControl`；
  - ❌ 禁止手写 `<button>` 按钮组，必须用 `TabSwitcher` / `SelectGrid`；
  - ❌ 禁止手写散乱 `<text>` 渲染点标/图例，必须用 `SceneLabelGroup`（8 向避让）与 `SceneLegend`（毛玻璃图例）；
  - ❌ 禁止手写右屏卡片，必须由 `MathPanel` + `src/data/builders/<topic>.ts` 驱动。
- **左屏控制台**：严格遵循 `TabSwitcher → SelectGrid(双列) → ParamControl → TipCard(双要素)` 动线。
- **右屏看板**：所有内容由 `src/data/builders/<topic>.ts` 导出 `MathPanelData`，查阅 [references/right-panel-spec.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/right-panel-spec.md)。
- **坐标转换**：拖拽使用 `InteractivePoint`（内部已逆解算，**严禁二次调用 `designToMath`**）。

### Step 2：工程注册与路由挂载

> 📖 完整四步流程（含代码片段和 KnowledgeNode 字段说明）见 [references/registration-guide.md](file:///d:/code/math/math-learning/.agents/skills/new-math-animation/references/registration-guide.md)。

1. **创建 `meta.ts`**：在 `src/features/<topic>/meta.ts` 导出 `node` 与 `loader`，`animationIds` 必须与 Step 4 中的 `case` 字符串完全一致。
2. **注册路由**：在 `src/data/routeEntries.ts` 的 `routeEntries` 中添加 `{ node, loader }`（3D 页面加 `guarded3D: true`）。
3. **注册知识树**：在 `src/data/knowledgeTree.ts` 中按章节顺序插入节点。
4. **统一看板接入**：在 `src/data/mathQuantities.ts` 的 `buildMathQuantities` 中追加 `case 'anim-<topic>'`，调用 builder 函数。

---

## 交付前自检

运行质检门禁并对照清单自检：
```bash
node .agents/skills/math-page-audit/scripts/audit_page.mjs src/features/<topic>
npx tsc -b
npm test
```
详细核查项查阅：[math-page-audit/references/audit-checklist.md](file:///d:/code/math/math-learning/.agents/skills/math-page-audit/references/audit-checklist.md)。
