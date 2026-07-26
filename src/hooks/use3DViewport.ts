import { useCallback, useRef, useState } from "react";

export type CameraPreset = "iso" | "front" | "top" | "side";

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
  const controlsRef = useRef<{
    object: { position: { set: (x: number, y: number, z: number) => void } };
    target: { set: (x: number, y: number, z: number) => void };
    update: () => void;
  } | null>(null);

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
