import { RotationSolid } from "./RotationSolid";
import { cylinderProfile } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface CylinderProps {
  /** 底面中心位置（数学坐标系 Vec3） */
  position?: Vec3;
  /** 底面半径 */
  radius: number;
  /** 圆柱高 */
  height: number;
  /** 实体主体颜色 Token */
  colorKey?: keyof typeof MATH_COLORS;
  /** 轮廓线颜色 Token（默认 line 墨色） */
  outlineColorKey?: keyof typeof MATH_COLORS;
  /** 透明度 */
  opacity?: number;
  /** 是否显示透视轮廓线与端面圆 */
  showOutline?: boolean;
  /** 深度测试开关 */
  depthTest?: boolean;
}

/** 矩形绕一边旋转 → 圆柱（标准 3D 几何体组件） */
export const Cylinder = ({
  position,
  radius,
  height,
  colorKey = "primary",
  outlineColorKey,
  opacity = 0.28,
  showOutline = true,
  depthTest = true,
}: CylinderProps) => (
  <RotationSolid
    position={position}
    profile={cylinderProfile(radius, height)}
    colorKey={colorKey}
    outlineColorKey={outlineColorKey}
    opacity={opacity}
    showOutline={showOutline}
    depthTest={depthTest}
    hasTopCap={true}
    hasBottomCap={true}
  />
);
