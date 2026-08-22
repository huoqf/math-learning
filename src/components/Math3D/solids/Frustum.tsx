import { RotationSolid } from "./RotationSolid";
import { frustumProfile } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface FrustumProps {
  /** 下底面中心位置（数学坐标系 Vec3） */
  position?: Vec3;
  /** 下底面半径 */
  rBottom: number;
  /** 上底面半径 */
  rTop: number;
  /** 圆台高 */
  height: number;
  /** 实体主体颜色 Token */
  colorKey?: keyof typeof MATH_COLORS;
  /** 轮廓线颜色 Token（默认 line 墨色） */
  outlineColorKey?: keyof typeof MATH_COLORS;
  /** 透明度 */
  opacity?: number;
  /** 是否显示透视轮廓线与顶底圆 */
  showOutline?: boolean;
  /** 深度测试开关 */
  depthTest?: boolean;
}

/** 直角梯形绕垂直腰旋转 → 圆台（标准 3D 几何体组件） */
export const Frustum = ({
  position,
  rBottom,
  rTop,
  height,
  colorKey = "primary",
  outlineColorKey,
  opacity = 0.28,
  showOutline = true,
  depthTest = true,
}: FrustumProps) => (
  <RotationSolid
    position={position}
    profile={frustumProfile(rBottom, rTop, height)}
    colorKey={colorKey}
    outlineColorKey={outlineColorKey}
    opacity={opacity}
    showOutline={showOutline}
    depthTest={depthTest}
    hasTopCap={true}
    hasBottomCap={true}
  />
);
