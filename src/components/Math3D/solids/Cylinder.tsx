import { RotationSolid } from "./RotationSolid";
import { cylinderProfile } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";

interface CylinderProps {
  radius: number;
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

/** 矩形绕一边旋转 → 圆柱（语义化薄封装） */
export const Cylinder = ({
  radius,
  height,
  colorKey = "primary",
  opacity = 0.28,
}: CylinderProps) => (
  <RotationSolid
    profile={cylinderProfile(radius, height)}
    colorKey={colorKey}
    opacity={opacity}
  />
);
