import { SphereShell } from "./SphereShell";
import type { Vec3 } from "@/math3d/vector3";
import type { MATH_COLORS } from "@/theme/math/colors";

interface CircumSphereProps {
  center: Vec3;
  radius: number;
  colorKey?: keyof typeof MATH_COLORS;
  showGreatCircles?: boolean;
  opacity?: number;
}

/** 外接球组件（薄封装标准 SphereShell，天蓝高透语义） */
export const CircumSphere = ({
  center,
  radius,
  colorKey = "sphereShell",
  showGreatCircles = true,
  opacity = 0.08,
}: CircumSphereProps) => (
  <SphereShell
    center={center}
    radius={radius}
    colorKey={colorKey}
    opacity={opacity}
    showGreatCircles={showGreatCircles}
  />
);
