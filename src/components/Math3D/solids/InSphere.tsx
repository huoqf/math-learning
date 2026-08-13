import { SphereShell } from "./SphereShell";
import type { Vec3 } from "@/math3d/vector3";

interface InSphereProps {
  center: Vec3;
  radius: number;
  opacity?: number;
}

export const InSphere = ({ center, radius, opacity = 0.25 }: InSphereProps) => (
  <SphereShell
    center={center}
    radius={radius}
    colorKey="inSphereShell"
    opacity={opacity}
    showGreatCircles
    depthTest={false}
  />
);
