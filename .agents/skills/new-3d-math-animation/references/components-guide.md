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
| **画布容器** | `ThreeDCanvas` | `@/components/Layout/ThreeDCanvas` | 根画布，Props: `cameraPosition`, `legend`, `overlay` (浮层槽位) |
| **相机控制** | `CameraRig` | `@/components/Math3D/CameraRig` | 轨道相机。Props: `enabled` (动点交互时设为 false 防冲突), `autoRotate` |
| **交互模式浮层** | `ModeSwitchOverlay3D` | `@/components/Math3D` | 3D 右上角【🔄 视角漫游】与【👆 动点交互】切换器。Props: `mode`, `onModeChange`, `pointCount` |
| **坐标网格** | `Scene3DGrid` | `@/components/Math3D/Scene3DGrid` | 空间网格与 X/Y/Z 轴。Props: `size`, `showLabels` |
| **3D 点** | `Point3D` | `@/components/Math3D/Point3D` | 空间点。固定点 $r=0.042$ 纯实心；动点 $r=0.075$ 带外光晕与全局射线追踪。Props: `draggable`, `constrain`, `onDrag`, `colorKey` |
| **3D 平面** | `Plane3D` | `@/components/Math3D/Plane3D` | 空间平面。Props: `origin`, `uAxis`, `vAxis`, `width`, `height`, `colorKey`, `opacity` |
| **3D 多边形面** | `Polygon3DFace` | `@/components/Math3D/Polygon3DFace` | 空间 3 或 4 顶点多边形面。Props: `points`, `colorKey`, `opacity` |
| **3D 向量** | `Vector3DArrow` | `@/components/Math3D/Vector3DArrow` | 带箭头向量。Props: `from`, `to`, `colorKey`, `radius` |
| **3D 角弧** | `AngleArc3D` | `@/components/Math3D/AngleArc3D` | 空间夹角弧线。Props: `vertex`, `dirA`, `dirB`, `radius`, `colorKey` |
| **线面角组件** | `LinePlaneAngle3D` | `@/components/Math3D` | 斜线/垂线段/投影线/法向量/角弧一体化组件 |
| **3D 点标签** | `PointLabel3D` | `@/components/Math3D/PointLabel3D` | 文本标签（默认数学斜体）。Props: `position`, `text`, `offset` |
| **3D 公式标签**| `FormulaLabel3D` | `@/components/Math3D/FormulaLabel3D` | KaTeX 空间公式。Props: `position`, `tex` |
| **上下标标签** | `CompoundLabel3D` | `@/components/Math3D/CompoundLabel3D` | 带下标标签（如 $A_1$，默认数学斜体）。Props: `position`, `base`, `subscript` |
| **3D 图例** | `Legend3D` | `@/components/Math3D/Legend3D` | 底端浮动图例。Props: `title`, `items` |
| **截面可视化** | `SectionPlane3D` | `@/components/Math3D` | 3D 截面多边形、底面投影与交轨辅助线 |
| **立体几何体** | `Cuboid` / `Cylinder` / `Cone` / `RegularPyramid` / `CircumSphere` / `InSphere` | `@/components/Math3D/solids` | 标准几何体 3D 实体模型 |
| **三视图面板** | `ThreeViewsPanel` | `@/components/Math3D` | 纯 SVG 正投影（主/左/俯）。Props: `views`, `extent` |

---

## 3. 3D 动点交互与空间几何最佳实践

### ① 动点 vs 固定点样式严格隔离
- **固定几何顶点 / 交点 / 垂足**：`draggable={false}`（默认），小巧细腻实心点（$r=0.042$），无外光晕、无抓取光标，深度测试默认开启；
- **控制动点**：`draggable={interactionMode === "drag"}`，大尺寸（$r=0.075$），带外光晕手柄环与全局指针追踪，悬浮变成 `grab`。

### ② 严格空间线段正交投影 (`projectPointOnSegment`)
严禁在倾斜侧棱上只修改单一 $Z$ 坐标导致脱轨！必须使用 `@/math3d/vector3` 的 `projectPointOnSegment`：
```tsx
import { projectPointOnSegment } from "@/math3d/vector3";

// 动点严格在线段 A -> B 上滑动，解算参数 t in [0.05, 0.95]
<Point3D
  position={pointPos}
  draggable={interactionMode === "drag"}
  constrain={(raw) => projectPointOnSegment(raw, A, B).point}
  onDrag={(next) => {
    const { t } = projectPointOnSegment(next, A, B);
    handleParamChange("lambda", Number(t.toFixed(2)));
  }}
  colorKey="paramPrimary"
/>
```

### ③ 旋转体标准母线与单一数据源 (`profile` 驱动)
- **单一数据源**：旋转体特征点 $O, O_1, A, A_1, S$、虚线母线框与尺寸线必须 100% 绑定 `profile` 数组顶点，严禁使用局部默认值导致滑块脱节；
- **动态生成同轴**：动态扫掠时动点 $A_1, A$ 必须随旋转母线挂载同轴转动；
- **透视切圆**：球体外轮廓必须采用基于相机距离 $d$ 的透视切圆解析解 $h_{\text{rim}} = R^2/d, r_{\text{rim}} = R\sqrt{1-R^2/d^2}$，消除放大脱节。


