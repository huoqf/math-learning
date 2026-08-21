/**
 * 立体几何体组件
 *
 * 提供常见几何体的 3D 渲染，所有几何体支持透明度、颜色主题自定义。
 * 几何体坐标遵循数学约定（z 轴向上），内部通过 mathToThree 转换。
 *
 * ⚠️ 新增实体组件规范：
 * 半透明实体（transparent=true）的 meshStandardMaterial 必须显式设置
 * depthWrite={false}，否则会将自身深度写入缓冲区，导致内切球等
 * 位于实体内部的半透明对象因深度测试失败而不可见（Bug 8 教训）。
 * 现有组件均已遵守：Cuboid、RegularPyramid、TriangularPrism、RotationSolid。
 */

// ============================================================================
// 多面体 (Polyhedra)
// ============================================================================
export { Cuboid } from "./Cuboid";
export { RegularPyramid } from "./RegularPyramid";
export { TriangularPrism } from "./TriangularPrism";
export { RegularPrism } from "./RegularPrism";

// ============================================================================
// 旋转体 (Solids of Revolution)
// ============================================================================
export { RotationSolid } from "./RotationSolid";
export { RotationSweep } from "./RotationSweep";
export { Cone } from "./Cone";
export { Cylinder } from "./Cylinder";
export { Frustum } from "./Frustum";

// ============================================================================
// 旋转体内部组件 (Rotation Sub-components)
// ============================================================================
export { RotationOutline } from "./RotationOutline";
export { DepthPrepassMesh } from "./DepthPrepassMesh";

// ============================================================================
// 球体 (Spheres)
// ============================================================================
export { Sphere } from "./Sphere";
export type { SphereProps } from "./Sphere";
export { SphereShell } from "./SphereShell";
export { CircumSphere } from "./CircumSphere";
export { InSphere } from "./InSphere";
export { SphereBySphereType } from "./SphereBySphereType";
export { PolyhedronSphereScene } from "./PolyhedronSphereScene";
export { AdvancedSphereScene } from "./AdvancedSphereScene";
export type {
  AdvancedSphereModelType,
  AdvancedSphereSceneProps,
} from "./AdvancedSphereScene";
export { CircumInSphereScene } from "./CircumInSphereScene";
export type { CircumInSphereSceneProps } from "./CircumInSphereScene";
export { SphereCutSection } from "./SphereCutSection";
