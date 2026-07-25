import { OrbitControls } from "@react-three/drei";
import { forwardRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CameraRig = forwardRef<any, { autoRotate?: boolean }>(
  ({ autoRotate = false }, ref) => (
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
  ),
);

CameraRig.displayName = "CameraRig";
