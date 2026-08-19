import { useCallback, useRef, useState, type ElementRef } from "react";
import type { OrbitControls } from "@react-three/drei";

export type CameraPreset = "iso" | "front" | "top" | "side";
export type OrbitControlsHandle = ElementRef<typeof OrbitControls>;

const PRESET_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  iso: [6, 5, 8],
  front: [0, 1.5, 10],
  top: [0, 10, 0.001],
  side: [10, 1.5, 0],
};

export function use3DViewport(
  initial: CameraPreset = "iso",
  defaultTarget: [number, number, number] = [0, 1.5, 0],
) {
  const [preset, setPreset] = useState<CameraPreset>(initial);
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  const setCameraPreset = useCallback(
    (p: CameraPreset, target = defaultTarget) => {
      setPreset(p);
      const controls = controlsRef.current;
      if (controls) {
        controls.object.position.set(...PRESET_POSITIONS[p]);
        controls.target.set(...target);
        controls.update();
      }
    },
    [defaultTarget],
  );

  return {
    preset,
    setCameraPreset,
    controlsRef,
    cameraPosition: PRESET_POSITIONS[preset],
  };
}
