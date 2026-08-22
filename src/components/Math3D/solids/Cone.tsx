import { RotationSolid } from "./RotationSolid";
import { coneProfile } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface ConeProps {
  /** 底面中心位置（数学坐标系 Vec3） */
  position?: Vec3;
  /** 底面半径 */
  radius: number;
  /** 圆锥高 */
  height: number;
  /** 实体主体颜色 Token */
  colorKey?: keyof typeof MATH_COLORS;
  /** 轮廓线颜色 Token（默认 line 墨色） */
  outlineColorKey?: keyof typeof MATH_COLORS;
  /** 透明度 */
  opacity?: number;
  /** 是否显示透视轮廓线与底面圆 */
  showOutline?: boolean;
  /** 深度测试开关 */
  depthTest?: boolean;
}

/** 直角三角形绕直角边旋转 → 圆锥（标准 3D 几何体组件） */
export const Cone = ({
  position,
  radius,
  height,
  colorKey = "primary",
  outlineColorKey,
  opacity = 0.28,
  showOutline = true,
  depthTest = true,
}: ConeProps) => (
  <RotationSolid
    position={position}
    profile={coneProfile(radius, height)}
    colorKey={colorKey}
    outlineColorKey={outlineColorKey}
    opacity={opacity}
    showOutline={showOutline}
    depthTest={depthTest}
    hasTopCap={false}
    hasBottomCap={true}
  />
);
