import { useCallback, useRef, useState, type ElementRef } from "react";
import type { OrbitControls } from "@react-three/drei";

export type CameraPreset = "iso" | "front" | "top" | "side";
export type OrbitControlsHandle = ElementRef<typeof OrbitControls>;

/** 四档预设机位（three 坐标）。导出以便取景回归测试用同一份数据做断言。 */
export const PRESET_POSITIONS: Record<CameraPreset, [number, number, number]> =
  {
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
  /**
   * 视角切换令牌：每次点击视角按钮都自增，**即使点的是当前已选中的那一档**。
   *
   * 为什么需要：`setPreset(同一值)` 会被 React 判定为无变化而不触发重渲染，
   * 于是挂在渲染周期上的适配逻辑（`<CameraFit>`）不会重跑，机位就停在
   * "按钮刚设的、未经场景适配的距离"上 —— 大尺度场景会因此重新出框。
   * 消费者（`CameraFit` 等）只需把本字段列为依赖即可。
   */
  const [viewToken, setViewToken] = useState(0);
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  const setCameraPreset = useCallback(
    (p: CameraPreset, target = defaultTarget) => {
      setPreset(p);
      setViewToken((t) => t + 1);
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
    viewToken,
    setCameraPreset,
    controlsRef,
    cameraPosition: PRESET_POSITIONS[preset],
  };
}
