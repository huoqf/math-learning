import { useCallback, useRef, useState } from "react";

export type CameraPreset = "iso" | "front" | "top" | "side";

const PRESET_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  iso: [6, 5, 8],
  front: [0, 0, 10],
  top: [0, 10, 0.01],
  side: [10, 0, 0],
};

export function use3DViewport(initial: CameraPreset = "iso") {
  const [preset, setPreset] = useState<CameraPreset>(initial);
  const controlsRef = useRef<{
    object: { position: { set: (x: number, y: number, z: number) => void } };
    target: { set: (x: number, y: number, z: number) => void };
    update: () => void;
  } | null>(null);

  const setCameraPreset = useCallback((p: CameraPreset) => {
    setPreset(p);
    const controls = controlsRef.current;
    if (controls) {
      controls.object.position.set(...PRESET_POSITIONS[p]);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, []);

  return {
    preset,
    setCameraPreset,
    controlsRef,
    cameraPosition: PRESET_POSITIONS[preset],
  };
}
