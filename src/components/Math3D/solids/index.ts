/**
 * 立体几何体组件
 *
 * 提供常见几何体的 3D 渲染，所有几何体支持透明度、颜色主题自定义。
 * 几何体坐标遵循数学约定（z 轴向上），内部通过 mathToThree 转换。
 */

// ============================================================================
// 多面体 (Polyhedra)
// ============================================================================
export { Cuboid } from "./Cuboid";
export { RegularPyramid } from "./RegularPyramid";
export { TriangularPrism } from "./TriangularPrism";

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
export { SphereShell } from "./SphereShell";
export { CircumSphere } from "./CircumSphere";
export { InSphere } from "./InSphere";
