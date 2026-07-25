import { RotationSolid } from "./RotationSolid";
import { frustumProfile } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";

interface FrustumProps {
  rBottom: number;
  rTop: number;
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

/** 直角梯形绕垂直腰旋转 → 圆台（语义化薄封装） */
export const Frustum = ({
  rBottom,
  rTop,
  height,
  colorKey = "primary",
  opacity = 0.28,
}: FrustumProps) => (
  <RotationSolid
    profile={frustumProfile(rBottom, rTop, height)}
    colorKey={colorKey}
    opacity={opacity}
  />
);
