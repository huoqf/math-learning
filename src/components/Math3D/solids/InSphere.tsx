import { CircumSphere } from "./CircumSphere";
import type { Vec3 } from "@/math3d/vector3";

interface InSphereProps {
  center: Vec3;
  radius: number;
}

export const InSphere = ({ center, radius }: InSphereProps) => (
  <CircumSphere
    center={center}
    radius={radius}
    colorKey="inSphereShell"
    opacity={0.2}
  />
);
