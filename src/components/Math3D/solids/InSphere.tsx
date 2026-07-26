import { SphereShell } from "./SphereShell";
import type { Vec3 } from "@/math3d/vector3";

interface InSphereProps {
  center: Vec3;
  radius: number;
}

export const InSphere = ({ center, radius }: InSphereProps) => (
  <SphereShell
    center={center}
    radius={radius}
    colorKey="inSphereShell"
    opacity={0.22}
    showGreatCircles
    depthTest={false}
  />
);
