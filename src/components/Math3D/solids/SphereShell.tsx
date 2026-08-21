import { Sphere } from "./Sphere";
import type { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface SphereShellProps {
  center: Vec3;
  radius: number;
  colorKey: keyof typeof MATH_COLORS;
  opacity?: number;
  showGreatCircles?: boolean;
  depthTest?: boolean;
}

/**
 * 球壳组件（薄封装标准 Sphere 组件，统一全库切接球外观）
 */
export const SphereShell = ({
  center,
  radius,
  colorKey,
  opacity = 0.14,
  showGreatCircles = true,
  depthTest = true,
}: SphereShellProps) => (
  <Sphere
    center={center}
    radius={radius}
    colorKey={colorKey}
    opacity={opacity}
    showOutline={showGreatCircles}
    depthTest={depthTest}
  />
);
