---
name: new-3d-math-animation
description: >
  新建3D数学动画页面 / 创建3D数学动画组件 / 新建立体几何页面 / 新建空间向量页面 / 新建3D解析几何页面
  / 添加空间角动画 / 添加空间距离动画 / 添加点线面位置关系动画 / 添加球体外接球内切球动画 / 3D可视化
  / 三维空间动画 / 空间直角坐标系 / 3D几何体 / R3F动画 / 按3D规范新建
---

# 新 3D 数学动画页面开发技能

> **铁则**：本文件是 3D（ThreeDCanvas + React Three Fiber）实操路由指南。所有通用铁律、三屏原则、参数与看板规范以 `AGENTS.md` 为权威源。

---

## ⚠️ 前置条件（写代码前必须完成）

1. Read `AGENTS.md` — 颜色规范 (`MATH_COLORS`)、三屏分配铁律、左屏声明式控件规范
2. Read `src/features/solidGeometry/SpatialAngleAnimation.tsx` — 空间角/点线面 3D 动画编排参考
3. Read `src/features/solidGeometry/CircumInSphereAnimation.tsx` — 3D 实体与外接球/多模式切换参考

---

## 职责边界

| 文件 | 允许包含 | 禁止包含 |
|------|---------|---------|
| `XxxAnimation.tsx` | state、`use3DViewport`、`paramConfigs`、`ThreePanel` 三屏组装、`buildMathQuantities` | 2D `AnimationSvgCanvas`、`mathToDesign`、硬编码 HTML/CSS 样式图例 |
| 3D 渲染 Scene / Canvas | `<ThreeDCanvas>`、`<CameraRig>`、`Math3D` 系列组件 | `useState` 动态修改全局状态、DOM 节点计算、原生 Canvas/WebGL 裸代码 |
| `math3d/<topic>.ts` | 纯数学 3D 向量/线/面/几何体计算函数、带 JSDoc 单元测试 | React、DOM、Three.js 对象、Store |
| `threeViews/buildSolidViews.ts` | 按 SolidKind 分发到 `projectPolyhedron` 或解析视图函数 | React、DOM、Three.js |
| `registries/<topic>.ts` | `paramMeta`、`defaultParams` | 副作用、动态视图绑定 |

---

## 🎨 3D 空间颜色与材质规范 (`SPACE_3D_COLORS` & `colorKey`)

在 3D 场景中，严禁在 Mesh 或 3D 组件中硬编码 Hex 颜色字符串。必须遵循规范：

1. **3D 基础坐标与平面色 (`SPACE_3D_COLORS`)**：
   - 空间 X 轴：`SPACE_3D_COLORS.axis3D_X` (`#EF4444` - 红)
   - 空间 Y 轴：`SPACE_3D_COLORS.axis3D_Y` (`#10B981` - 绿)
   - 空间 Z 轴：`SPACE_3D_COLORS.axis3D_Z` (`#3B82F6` - 蓝)
   - 空间平面填充：`SPACE_3D_COLORS.planeFill` (`rgba(148, 163, 184, 0.15)`)
2. **3D 组件 `colorKey` 语义映射**：
   - 几何主体/面内直线：`colorKey="primary"` (`#2563EB`)
   - 基准平面/参考几何：`colorKey="secondary"` (`#059669`)
   - 辅助平面/交面：`colorKey="tertiary"` (`#8B5CF6`)
   - 重点观察线/动点：`colorKey="highlight"` (`#EF4444`)
3. **“公式-图形-滑块”三位一体绑定**：
   - 主控参数由 `colorKey="paramPrimary"` / `"paramSecondary"` / `"paramTertiary"` 控制，在 3D 几何图形、左屏 `ParamControl` 和右屏 `MathPanel` KaTeX 公式（`\color{#EF4444}{a}`）中保持统一色彩。

---

## 💡 3D 核心组件与基础设施全景表

3D 场景必须统一使用 `src/components/Math3D/` 提供的标准 R3F 组件，严禁直接构造原始 Three.js Mesh 或 HTML 悬浮框。

| 类别 | 组件 | 导入路径 | 说明与核心 Props |
|------|------|----------|-------------------|
| **画布容器** | `ThreeDCanvas` | `@/components/Layout/ThreeDCanvas` | 3D 根画布，包含视角相机与光源。Props: `cameraPosition`, `legend` |
| **相机控制** | `CameraRig` | `@/components/Math3D/CameraRig` | 轨道相机控制器，配合 `use3DViewport` 实现预设视角切换 |
| **坐标网格** | `Scene3DGrid` | `@/components/Math3D/Scene3DGrid` | 3D 空间网格与 X/Y/Z 坐标轴及 x/y/z 标签。Props: `size` (默认 5) |
| **3D 点** | `Point3D` | `@/components/Math3D/Point3D` | 空间点。支持拖拽 `draggable`, `constrain={(raw) => Vec3}`, `onDrag` |
| **3D 平面** | `Plane3D` | `@/components/Math3D/Plane3D` | 空间平面半透明渲染。Props: `origin`, `uAxis`, `vAxis`, `width`, `height`, `colorKey`, `opacity` |
| **3D 向量** | `Vector3DArrow` | `@/components/Math3D/Vector3DArrow` | 带箭头的 3D 向量。Props: `from`, `to`, `colorKey`, `radius` |
| **3D 角弧** | `AngleArc3D` | `@/components/Math3D/AngleArc3D` | 空间两条线/向量夹角弧线。Props: `vertex`, `dirA`, `dirB`, `radius`, `colorKey` |
| **线面角组件** | `LinePlaneAngle3D` | `@/components/Math3D` | 斜线、垂线段、投影线段、底面法向量与线面角弧一体化组件。Props: `lineStart`, `lineEnd`, `footPoint`, `showFootLabel` |
| **3D 点标签** | `PointLabel3D` | `@/components/Math3D/PointLabel3D` | 3D 点文本标签（如 "A", "B", "O"）。Props: `position`, `text`, `offset` |
| **3D 公式标签**| `FormulaLabel3D` | `@/components/Math3D/FormulaLabel3D` | 3D 空间 KaTeX 公式（如 `R=2.5`）。Props: `position`, `tex` |
| **上下标标签** | `CompoundLabel3D` | `@/components/Math3D/CompoundLabel3D` | 带有下标的点标签（如 $A_1$, $B_1$）。Props: `position`, `base`, `subscript` |
| **3D 图例** | `Legend3D` | `@/components/Math3D/Legend3D` | 传入 `ThreeDCanvas` 的 `legend` prop，用于底端浮动图例展示 |
| **立体几何体** | `Cuboid` / `Cylinder` / `Cone` / `RegularPyramid` / `CircumSphere` / `InSphere` | `@/components/Math3D/solids` | 长方体、圆柱、圆锥、正棱锥、外接球、内切球等 3D 实体 |
| **三视图渲染** | `ThreeViewsPanel` | `@/components/Math3D` | 2x2 SVG 正投影版面（正/侧/俯）。Props: `views`, `extent` |

---

## Step 0：3D 设计决策与坐标约定

1. **三屏布局**：
   - **左屏** (`LeftPanel`)：模式选择（`TabSwitcher` / `SelectGrid`）、`ParamControl` 参数滑块、视角切换按钮 (`TabSwitcher`)。
   - **中屏** (`ThreeDCanvas`)：R3F 3D 场景主体 + `Legend3D` 图例，禁止放长段教学文字。
   - **右屏** (`MathPanel`)：`buildMathQuantities('anim-solid-xxx', params, config)` 组装的空间指标、判定定理、高考考点。
2. **显示模式切换**：3D 页面可提供 "3D 直观图 / 三视图" 切换。三视图模式下中屏使用 `ThreeViewsPanel` 替代 `ThreeDCanvas`，左屏提供切换按钮。数学层对应 `orthographicProjection.ts`（凸多面体消隐投影）和 `curvedSolidViews.ts`（旋转体解析视图），统一出口为 `buildSolidViews(kind, params)`。
3. **3D 坐标系约定** (`src/math3d/coordinateConvention.ts`)：
   - 使用右上手坐标系，X 为横向、Y 为纵深、Z 为垂直向上。
   - 点与向量表示为 `{ x: number, y: number, z: number }` (`Vec3` 类型)。

---

## Step 1：3D 页面代码骨架

参考：`src/features/solidGeometry/SpatialAngleAnimation.tsx` 与 `LinePlaneRelationAnimation.tsx`

```tsx
import { useState, useMemo } from 'react'
import { ThreePanel } from '@/components/Layout/ThreePanel'
import { ThreeDCanvas } from '@/components/Layout/ThreeDCanvas'
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
} from '@/components/UI'
import type { ParamConfig } from '@/components/UI'
import { Scene3DGrid } from '@/components/Math3D/Scene3DGrid'
import { Point3D } from '@/components/Math3D/Point3D'
import { Plane3D } from '@/components/Math3D/Plane3D'
import { Vector3DArrow } from '@/components/Math3D/Vector3DArrow'
import { PointLabel3D, FormulaLabel3D } from '@/components/Math3D'
import { Legend3D } from '@/components/Math3D/Legend3D'
import { CameraRig } from '@/components/Math3D/CameraRig'
import { Cuboid } from '@/components/Math3D/solids/Cuboid'
import { use3DViewport } from '@/hooks/use3DViewport'
import { buildMathQuantities } from '@/data/mathQuantities'
import { spatialAngleMeta } from '@/data/registries/solidGeometry'

export default function Xxx3DAnimation() {
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
  })

  // 1. 初始化 3D 相机与视角 Preset
  const { preset, cameraPosition, setCameraPreset, controlsRef } = use3DViewport('iso')

  // 2. 组装右屏看板数据
  const mathData = useMemo(
    () => buildMathQuantities('anim-solid-xxx', params),
    [params],
  )

  // 3. 参数配置列表
  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      spatialAngleMeta.map((meta) => ({
        key: meta.key,
        label: meta.label,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
      })),
    [params],
  )

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2 })
  }

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="参数调节" subtitle="调节尺寸与控制点">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="3D 视角切换">
            <TabSwitcher
              tabs={[
                { key: 'iso', label: '轴测' },
                { key: 'front', label: '主视' },
                { key: 'top', label: '俯视' },
                { key: 'side', label: '左视' },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as any)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              title="图例"
              items={[
                { colorKey: 'primary', swatch: 'area', label: '几何体' },
                { colorKey: 'secondary', swatch: 'line', label: '基准面' },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {/* 3D 实体与几何元素 */}
          <Cuboid a={params.a} b={params.b} c={params.c} colorKey="primary" opacity={0.2} />

          {/* 可拖拽 3D 交互点 */}
          <Point3D
            position={{ x: params.a, y: 0, z: params.c }}
            draggable
            constrain={(raw) => ({
              x: Math.max(0, raw.x),
              y: 0,
              z: Math.max(0, raw.z),
            })}
            onDrag={(next) => setParams((p) => ({ ...p, a: next.x, c: next.z }))}
            colorKey="highlight"
          />

          <PointLabel3D position={{ x: 0, y: 0, z: 0 }} text="A" />
          <FormulaLabel3D position={{ x: 1, y: 1, z: 1 }} tex="V=a \cdot b \cdot c" />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="3D 指标看板"
        />
      }
    />
  )
}
```

---

## Step 2：注册步骤（新建 3D 页面必做）

> **推荐快捷脚手架**：运行 `node scripts/gen-node.mjs` 自动生成 `meta.ts` + `Animation.tsx` + `index.ts` 骨架并插桩路由。

若手动注册，需完成以下链路：
1. **创建 meta.ts**：在 `src/features/<topic>/meta.ts` 中导出 `node`（`KnowledgeNode`，包含 `route`）和 `loader`（`() => import(...)`）。
2. **注册路由与 3D Guard** (`src/data/routeEntries.ts`)：
   - 在 `legacyEntries` 中添加 `{ node, loader, guarded3D: true }` 条目。
   - **注意**：3D 页面必须设置 `guarded3D: true` 属性！
3. **注册知识树**：在 `src/data/knowledgeTree.ts` 中添加节点（id/title/chapter/module/importance/animationIds/prerequisites）。
4. **3D 数学算法** (`src/math3d/<topic>.ts`)：
   - 将 3D 向量、线面角、二面角、截面推导等纯函数写入 `src/math3d/`，并编写配套单测 `src/math3d/__tests__/`。
5. **右屏看板分支** (`src/data/mathQuantities.ts` / `src/data/builders/solidGeometry.ts`)：
   - 在 `buildMathQuantities` 中添加 `'anim-solid-xxx'` 分支，组装 `MathPanelData`。
6. **参数 Registry** (`src/data/registries/solidGeometry.ts`)：
   - 定义该 3D 场景的 `defaultParams` 和 `paramMeta`。

---

## 常见陷阱与 3D 禁令

- ❌ **左屏按钮违规**：左屏选择控件与视角切换必须统一使用 `<TabSwitcher>` 或 `<SelectGrid>`，**严禁手写 `<button>` 按钮组**。
- ❌ **禁止在 3D 画布中使用 2D SVG 组件**：禁止混用 `AnimationSvgCanvas`、`FunctionGraph` 或 `mathToDesign`。
- ❌ **禁止手写 Canvas / Raw Three.js 代码**：必须使用 `ThreeDCanvas` 和 `@/components/Math3D/` 封装好的组件。
- ❌ **禁止使用 `<foreignObject>`**：3D 空间标注统一使用 `PointLabel3D` / `FormulaLabel3D` / `CompoundLabel3D`。
- ❌ **拖拽坐标未加限制**：拖动 `Point3D` 时，必须提供 `constrain` 回调防止点越界。
- ⚠️ **三视图模式是 SVG 投影，非 2D 动画**：`ThreeViewsPanel` 属于 3D 正投影输出，不要引入 2D `AnimationSvgCanvas` 管线。

---

## 交付前自检

- [ ] 中屏是否使用了 `ThreeDCanvas` + `CameraRig` + `Scene3DGrid`
- [ ] 左屏是否使用 `<TabSwitcher>` 提供了视角切换 (`iso`, `front`, `top`, `side`)
- [ ] 3D 颜色是否符合 `SPACE_3D_COLORS` 与 `colorKey` 语义映射
- [ ] 右屏 `MathPanel` 数据是否通过 `buildMathQuantities('anim-solid-xxx', params, config)` 组装
- [ ] `routeEntries.ts` 中注册 3D 路由时是否设置了 `guarded3D: true`
- [ ] `src/math3d/` 中的纯数学运算函数是否有单元测试且通过 `npx vitest run src/math3d/`

---

*参考范例：`src/features/solidGeometry/SpatialAngleAnimation.tsx` + `LinePlaneRelationAnimation.tsx`*
*规则权威源：`AGENTS.md`*
