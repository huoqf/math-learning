/**
 * 3D 数学教学组件库
 *
 * 提供立体几何与空间向量教学所需的全部 3D 可视化组件。
 * 所有组件遵循统一的数学坐标系约定（z 轴向上），通过 coordinateConvention.ts 在渲染边界转换。
 *
 * @example
 * ```tsx
 * import { Scene3DGrid, PointLabel3D, Plane3D, CameraRig } from '@/components/Math3D'
 * import { Cuboid, CircumSphere } from '@/components/Math3D/solids'
 *
 * <Scene3DGrid size={5} />
 * <PointLabel3D position={{ x: 1, y: 0, z: 0 }} text="A" />
 * <Cuboid a={3} b={2} c={2} />
 * ```
 */

// ============================================================================
// 场景基础设施 (Scene Infrastructure)
// ============================================================================
export { Scene3DGrid } from "./Scene3DGrid";
export { CameraRig } from "./CameraRig";

// ============================================================================
// 标签系统 (Label System)
// ============================================================================
export { PointLabel3D } from "./PointLabel3D";
export { CompoundLabel3D } from "./CompoundLabel3D";
export { FormulaLabel3D } from "./FormulaLabel3D";
export { Legend3D } from "./Legend3D";
export type { LegendItem } from "./Legend3D";

// ============================================================================
// 交互元素 (Interactive Elements)
// ============================================================================
export { Point3D } from "./Point3D";

// ============================================================================
// 几何图元与角标示 (Geometric Primitives & Angle Elements)
// ============================================================================
export { Vector3DArrow } from "./Vector3DArrow";
export { Plane3D } from "./Plane3D";
export { AngleArc3D } from "./AngleArc3D";
export { LinePlaneAngle3D } from "./LinePlaneAngle3D";

// ============================================================================
// 截面可视化 (Cross-Section Visualization)
// ============================================================================
export { SectionPlane3D } from "./SectionPlane3D";

// ============================================================================
// 三视图 (Three-View Orthographic Drawing)
// ============================================================================
export { ThreeViewsPanel } from "./ThreeViewsPanel";
