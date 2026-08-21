import { SphereShell } from "./SphereShell";
import type { Vec3 } from "@/math3d/vector3";

interface InSphereProps {
  center: Vec3;
  radius: number;
  opacity?: number;
}

/** 内切球组件（薄封装标准 SphereShell，暖珊瑚红高透语义） */
export const InSphere = ({ center, radius, opacity = 0.18 }: InSphereProps) => (
  <SphereShell
    center={center}
    radius={radius}
    colorKey="inSphereShell"
    opacity={opacity}
    showGreatCircles
    depthTest={false}
  />
);
