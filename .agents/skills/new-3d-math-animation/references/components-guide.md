# 3D 核心组件与材质颜色全景指南

## 1. 3D 空间颜色与材质规范 (`SPACE_3D_COLORS` & `colorKey`)

在 3D 场景中，严禁在 Mesh 或 3D 组件中硬编码 Hex 颜色字符串：

- **3D 基础坐标与平面色 (`SPACE_3D_COLORS`)**：
  - 空间 X 轴：`SPACE_3D_COLORS.axis3D_X` (`#EF4444` - 红)
  - 空间 Y 轴：`SPACE_3D_COLORS.axis3D_Y` (`#10B981` - 绿)
  - 空间 Z 轴：`SPACE_3D_COLORS.axis3D_Z` (`#3B82F6` - 蓝)
  - 空间平面填充：`SPACE_3D_COLORS.planeFill` (`rgba(148, 163, 184, 0.15)`)
- **3D 组件 `colorKey` 语义映射**：
  - 几何主体 / 面内直线：`colorKey="primary"` (`#2563EB`)
  - 基准平面 / 参考几何：`colorKey="secondary"` (`#059669`)
  - 辅助平面 / 交面：`colorKey="tertiary"` (`#8B5CF6`)
  - 重点观察线 / 动点：`colorKey="highlight"` (`#EF4444`)
- **三位一体绑定**：主控参数使用 `colorKey="paramPrimary"` / `"paramSecondary"` / `"paramTertiary"`，与左屏滑块和看板 KaTeX 公式同步。

---

## 2. 3D 核心组件清单 (`@/components/Math3D/`)

| 类别 | 组件 | 导入路径 | 核心 Props 与说明 |
|------|------|----------|-------------------|
| **画布容器** | `ThreeDCanvas` | `@/components/Layout/ThreeDCanvas` | 根画布，Props: `cameraPosition`, `legend` |
| **相机控制** | `CameraRig` | `@/components/Math3D/CameraRig` | 轨道相机，配合 `use3DViewport` 控制视角 |
| **坐标网格** | `Scene3DGrid` | `@/components/Math3D/Scene3DGrid` | 空间网格与 X/Y/Z 轴。Props: `size`, `showLabels` |
| **3D 点** | `Point3D` | `@/components/Math3D/Point3D` | 空间点。Props: `draggable`, `constrain`, `onDrag`, `colorKey` |
| **3D 平面** | `Plane3D` | `@/components/Math3D/Plane3D` | 空间平面。Props: `origin`, `uAxis`, `vAxis`, `width`, `height`, `colorKey`, `opacity` |
| **3D 向量** | `Vector3DArrow` | `@/components/Math3D/Vector3DArrow` | 带箭头向量。Props: `from`, `to`, `colorKey`, `radius` |
| **3D 角弧** | `AngleArc3D` | `@/components/Math3D/AngleArc3D` | 空间夹角弧线。Props: `vertex`, `dirA`, `dirB`, `radius`, `colorKey` |
| **线面角组件** | `LinePlaneAngle3D` | `@/components/Math3D` | 斜线/垂线段/投影线/法向量/角弧一体化组件 |
| **3D 点标签** | `PointLabel3D` | `@/components/Math3D/PointLabel3D` | 文本标签。Props: `position`, `text`, `offset` |
| **3D 公式标签**| `FormulaLabel3D` | `@/components/Math3D/FormulaLabel3D` | KaTeX 空间公式。Props: `position`, `tex` |
| **上下标标签** | `CompoundLabel3D` | `@/components/Math3D/CompoundLabel3D` | 带下标标签（如 $A_1$）。Props: `position`, `base`, `subscript` |
| **3D 图例** | `Legend3D` | `@/components/Math3D/Legend3D` | 底端浮动图例。Props: `title`, `items` |
| **立体几何体** | `Cuboid` / `Cylinder` / `Cone` / `RegularPyramid` / `CircumSphere` / `InSphere` | `@/components/Math3D/solids` | 标准几何体 3D 实体模型 |
| **三视图面板** | `ThreeViewsPanel` | `@/components/Math3D` | 纯 SVG 正投影（主/左/俯）。Props: `views`, `extent` |
