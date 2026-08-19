import { OrbitControls } from "@react-three/drei";
import { forwardRef, type ElementRef } from "react";

export const CameraRig = forwardRef<
  ElementRef<typeof OrbitControls>,
  { autoRotate?: boolean; enabled?: boolean }
>(({ autoRotate = false, enabled = true }, ref) => (
  <OrbitControls
    ref={ref}
    makeDefault
    enabled={enabled}
    enableDamping
    dampingFactor={0.12}
    autoRotate={autoRotate}
    autoRotateSpeed={0.6}
    minDistance={3}
    maxDistance={20}
  />
));

CameraRig.displayName = "CameraRig";
