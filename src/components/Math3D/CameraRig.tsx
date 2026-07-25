import {
  OrbitControls,
  type OrbitControls as OrbitControlsType,
} from "@react-three/drei";
import { forwardRef } from "react";

export const CameraRig = forwardRef<
  OrbitControlsType,
  { autoRotate?: boolean }
>(({ autoRotate = false }, ref) => (
  <OrbitControls
    ref={ref}
    makeDefault
    enableDamping
    dampingFactor={0.12}
    autoRotate={autoRotate}
    autoRotateSpeed={0.6}
    minDistance={3}
    maxDistance={20}
  />
));

CameraRig.displayName = "CameraRig";
