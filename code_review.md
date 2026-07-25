# MathVision 项目代码审查报告

> 审查时间：2026-07-25  
> 范围：`src/` 全量，涵盖架构、代码质量、类型安全、规范合规四个维度

---

## 🏆 总体评估：架构优秀，局部有改进空间

整体架构设计清晰、分层合理，3D 组件体系完整服务于立体几何教学目标，**不存在无用代码**。需要改进的是若干**代码质量细节**和**两处类型定义冗余**。

---

## ✅ 架构优点（不需要改动）

### 1. 分层架构完全正确

```
src/
├── theme/           ← Design Token 单一来源（颜色、间距、动效）
├── math/            ← 纯函数数学层（零 React/DOM 依赖）✅
├── math3d/          ← 纯函数 3D 数学层 ✅
├── hooks/           ← 响应式适配层（useAnimationViewport / useSceneScale）
├── utils/           ← 坐标变换 / ResizeObserver 工具层
├── components/
│   ├── Layout/      ← ThreePanel / AnimationSvgCanvas 布局基础设施
│   ├── Math/        ← 2D SVG 教学组件库
│   ├── Math3D/      ← 3D R3F 教学组件库（为立体几何服务，必要）
│   └── UI/          ← ParamControl / MathPanel 声明式控件
├── data/
│   ├── registries/  ← paramMeta + defaultParams 声明式注册
│   └── builders/    ← buildMathQuantities 分支
└── features/        ← 19个教学页面（每页三分层：Animation + Scene + hooks）
```

### 2. 3D 组件体系完整有效

`src/components/Math3D/` 的所有组件均被 `src/features/solidGeometry/` 中的 5 个动画页面实际使用：

| 3D 组件 | 使用页面 |
|---------|---------|
| `Scene3DGrid`, `CameraRig` | 所有 3D 页面的场景基础 |
| `PointLabel3D`, `CompoundLabel3D`, `FormulaLabel3D` | 顶点/角度/公式标注 |
| `Cuboid`, `CircumSphere`, `InSphere`, `RegularPyramid` | 立体几何体 |
| `RotationSolid`, `RotationSweep`, `RotationOutline` | 旋转体实验室 |
| `SectionPlane3D` | 截面可视化 |
| `ThreeViewsPanel` | 三视图正投影 |
| `Plane3D`, `Vector3DArrow`, `AngleArc3D` | 线面关系 / 空间向量 |

`src/math3d/` 中的 `sectionIntersection.ts`, `silhouette.ts`, `orthographicProjection.ts` 等也都是 3D 教学必需的数学工具。

### 3. 声明式参数体系成熟

`paramMeta → registry → ParamControl → ParamConfig` 链路规范统一，与 AGENTS.md 铁律完全符合。

### 4. 性能优化到位

- `useLayoutEffect` + `ResizeObserver` 确保精准画布测量
- 所有 `useMemo` 依赖项列表完整
- 3D 页面通过 `Guarded3DPage` + 动态 `import()` 懒加载，按需引入 three.js

---

## 🔴 问题 1：两处 `SceneScale` 类型重复定义（架构隐患）

**严重性：中** | 影响文件：2 处

`src/utils/coordinate.ts` 和 `src/hooks/useSceneScale.ts` 各自独立定义了一个 `SceneScale` interface，字段不同：

```ts
// utils/coordinate.ts — 仅 5 字段（用于坐标转换函数）
export interface SceneScale {
  scaleX: number; scaleY: number; scale: number;
  originX: number; originY: number;
}

// hooks/useSceneScale.ts — 9 字段（用于 Scene 层）
export interface SceneScale {
  scaleX: number; scaleY: number; scale: number;
  originX: number; originY: number;
  xMin: number; xMax: number; yMin: number; yMax: number;
}
```

`CoordinateGrid.tsx` 从 `@/hooks/useSceneScale` 导入类型，但传入的 `scale` 满足两者；`mathToDesign()` 函数从 `@/utils/coordinate` 导入类型。由于 TypeScript 结构化类型，目前运行无误，但存在**概念混淆隐患**。

> [!IMPORTANT]  
> **建议修复**：删除 `utils/coordinate.ts` 中的 `SceneScale` 定义，改为从 `@/hooks/useSceneScale` re-export 该类型，`mathToDesign` 参数改用完整的 9 字段类型。

---

## 🟡 问题 2：`as any` 类型断言重复出现（代码质量）

**严重性：低** | 影响文件：16 个 Animation 文件

所有 Animation 页面的 `paramConfigs` 组装中出现大量 `as any`：

```ts
// 典型写法（重复 16 次）
importance: meta.importance as any,
marks: meta.marks as any,
onChange={(k) => setStudyMode(k as any)}
```

根因：`ParamConfig` 的 `importance` 字段类型、`ParamMeta` 的 `importance` 字段类型，以及 `SelectGrid` 的 `onChange` 类型没有完全对齐。

> [!TIP]  
> **建议修复**：在 `ParamControl.tsx` 的 `ParamConfig` 类型中，将 `importance` 改为与 `ParamMeta` 相同的 `ParamImportance` 类型；`SelectGrid` 的 `onChange` 改为泛型参数，避免 `onChange={(k) => setMode(k as any)}`。这能一次性消除所有 `as any`。

---

## 🟡 问题 3：部分 SVG Scene 硬编码颜色（规范违规）

**严重性：低-中** | 影响文件：5 个 Scene 文件

违反 AGENTS.md 铁律 1，以下文件使用了硬编码颜色值：

| 文件 | 违规示例 | 建议替换 |
|------|---------|---------|
| `PairedDataScene.tsx` | `fill="#111827"`, `stroke="#4B5563"` | `CANVAS_COLORS.background`, `MATH_COLORS.axis` |
| `DerivativeShiftScene.tsx` | `fill="#1e293b"`, `stroke="#e2e8f0"` | `colors.neutral[800]`, `CANVAS_COLORS.grid` |
| `SetScene.tsx` | `fill="#FFFFFF"` (3处) | `CANVAS_COLORS.background` 或 `'white'` |
| `ProbabilityDistributionScene.tsx` | `fill="#FFFFFF"`, `stroke="#FFFFFF"` | `'white'` 或 `CANVAS_COLORS.background` |
| `CompositeScene.tsx` | `fill="#FFFFFF"` | 同上 |

> [!NOTE]  
> `fill="#FFFFFF"` 类白色背景擦除用法虽然是硬编码，但语义固定，风险最低；`PairedDataScene.tsx` 的多处文本颜色硬编码应优先修复。

---

## 🟡 问题 4：两个依赖包未被使用

**严重性：低** | 可清理

| 包名 | package.json 中 | 实际 src/ 中 | 说明 |
|------|---------------|------------|------|
| `idb` | `dependencies` | 无任何 import | 可能是预留的 IndexedDB 离线存储，但当前无实现 |
| `zustand` | `dependencies` | 无任何 import | AGENTS.md 列为状态管理，但当前所有状态用 `useState` 实现 |

> [!NOTE]  
> 这两个包是**预留架构依赖**，不是错误。但如果短期没有使用计划，可移到注释或移除以减小包体积（目前 three.js 已是主要包体贡献者）。

---

## 🟢 问题 5：deprecated `Label3D` 仍被导出（次要）

`Math3D/index.ts` 导出了已标记 `@deprecated` 的 `Label3D`，但经搜索确认 `features/` 中**没有任何文件**直接 import `Label3D`（仅 `PointLabel3D`、`CompoundLabel3D`、`FormulaLabel3D` 被使用），`Label3D` 自身内部也引用了 `useLabelRegistry`。

> [!TIP]  
> 可在下一次 3D 页面迭代时移除 `Label3D.tsx` 和 index.ts 中的导出，无破坏性风险。

---

## 📋 改进优先级建议

| 优先级 | 问题 | 工作量 | 影响面 |
|--------|------|--------|--------|
| P1 | `SceneScale` 类型重复定义 | 小（改 2 个文件） | 架构一致性 |
| P2 | `as any` 系统性消除 | 中（改 `ParamConfig` 类型 + 部分 registries） | 类型安全 |
| P3 | `PairedDataScene` 硬编码颜色 | 小（最严重的 1 个文件） | 规范合规 |
| P4 | 其他 `fill="#FFFFFF"` 硬编码 | 小 | 规范合规 |
| P5 | 移除 `idb`/`zustand` 或添加实现 | 极小 | 包体积 |
| P6 | 移除 deprecated `Label3D` | 极小 | 代码整洁 |

---

## 💡 架构增强建议（非问题，供参考）

1. **`utils/index.ts` 缺少 `labelAvoider` 导出**：`labelAvoider.ts` 存在但未在 `utils/index.ts` 中导出，需要时须直接路径导入 `@/utils/labelAvoider`，建议统一加入 barrel export。

2. **`SvgTooltip` 未在 Math 组件库中导出**：`HtmlTooltip` 从 `@/components/Math/SvgTooltip` 直接路径导入（见 `ProbabilityNormalAnimation.tsx`），建议将其加入 `Math/index.ts` 导出。

3. **`xRange`/`yRange` 的 `useMemo` 稳定性**：部分页面直接传入字面量数组 `xRange={[-6, 6]}`，在 React 重渲染时会产生新引用，触发 `useSceneScale` 不必要重计算。建议使用 `useMemo` 或组件外常量固定这些数组。
