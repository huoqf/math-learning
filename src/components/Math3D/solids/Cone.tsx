import { RotationSolid } from "./RotationSolid";
import { coneProfile } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";

interface ConeProps {
  radius: number;
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

/** 直角三角形绕直角边旋转 → 圆锥（语义化薄封装） */
export const Cone = ({
  radius,
  height,
  colorKey = "primary",
  opacity = 0.28,
}: ConeProps) => (
  <RotationSolid
    profile={coneProfile(radius, height)}
    colorKey={colorKey}
    opacity={opacity}
  />
);
