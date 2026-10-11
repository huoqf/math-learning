import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { mathToThree } from "@/math3d/coordinateConvention";
import {
  boundingSphereOf,
  boundsAreFinite,
  expandBounds,
  requiredCameraDistance,
  DEFAULT_CAMERA_FOV_DEG,
  DEFAULT_FIT_MARGIN,
  type Bounds3D,
} from "@/math3d/sceneBounds";

/** OrbitControls 中本组件真正会读写的字段（避免耦合 drei 的完整类型）。 */
interface FitControls {
  target: { x: number; y: number; z: number };
  maxDistance?: number;
  update?: () => void;
}

/**
 * 判断拿到的 `controls` 是否真的可写。
 * `controls` 是 r3f state 上**可空**的字段（未挂 `<OrbitControls makeDefault>` 时为
 * `undefined`），测试替身或上下文缺失时也可能给不出可用对象。
 * 这里必须先判定再使用 —— 否则一次 `controls.target.x = …` 抛错就会连累
 * 整棵 3D 元素树被错误边界吞掉，而本组件只是取景优化，不该有这种杀伤力。
 */
const isUsableControls = (value: unknown): value is FitControls => {
  if (!value || typeof value !== "object") return false;
  const target = (value as { target?: unknown }).target;
  if (!target || typeof target !== "object") return false;
  return (["x", "y", "z"] as const).every(
    (axis) => typeof (target as Record<string, unknown>)[axis] === "number",
  );
};

export interface CameraFitProps {
  /** 场景内容包围盒（**数学坐标**，需覆盖该模式下所有会被绘制的图元） */
  bounds: Bounds3D;
  /**
   * 重新适配的触发令牌：传 `use3DViewport().viewToken`。
   * 有了它，连点同一个视角按钮（React 状态值不变、不触发重渲染的场合）
   * 也会重新按当前场景尺度适配机位，不会留下"按钮把相机拉近到出框"的尾巴。
   */
  token?: number;
  /** 包围盒外扩量（数学单位），给顶点标签 / 箭头尖端留位置，默认 0.35 */
  padding?: number;
  /** 取景余量系数，默认 1.12（四周各留约 12% 空白） */
  margin?: number;
  /** 视场角，必须与 `ThreeDCanvas` 的 `fov` 一致，默认 45 */
  fov?: number;
}
/**
 * 相机场景适配（必须渲染在 `<ThreeDCanvas>` 内部）
 *
 * ## 它解决什么
 * 三维页面是固定机位。子页面尺度一旦超出机位舒适区（台体 k→1 时补全大棱锥顶点
 * 可达 `H = h/(1-k)`），关键装置会被裁出画布；而契约测试只能断言"数值有限"，
 * 抓不到取景问题。本组件按内容**包围球**把相机拉到"恰好装得下"的距离。
 *
 * ## 三条刻意的设计约束
 * 1. **只后退，不前进**：当前距离已足够时不做任何事。因此重复执行是幂等的，
 *    也不会在滑块拖动（包围盒连续变化）时与学生的鼠标缩放打架。
 * 2. **只改距离与注视中心，不改视线方向**：始终沿"相机 → 场景中心"的现方向后退，
 *    学生转过的视角不会被强行掰回预设方向。
 * 3. **不传 `bounds` 之外的任何东西**：包围盒由纯数学层（`sceneBounds` +
 *    各页面几何函数）算出，组件本身不猜几何，避免"两处各写一套尺寸"。
 *
 * 不渲染可见元素（返回 `null`），也不改变未使用它的既有页面行为。
 */
export const CameraFit = ({
  bounds,
  token = 0,
  padding = 0.35,
  margin = DEFAULT_FIT_MARGIN,
  fov = DEFAULT_CAMERA_FOV_DEG,
}: CameraFitProps) => {
  const camera = useThree((s) => s.camera);
  const rawControls = useThree((s) => (s as { controls?: unknown }).controls);
  const controls = isUsableControls(rawControls) ? rawControls : undefined;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const sphere = useMemo(
    () => boundingSphereOf(expandBounds(bounds, padding)),
    [bounds, padding],
  );

  // 数学坐标 → three 坐标（渲染边界处转换，业务层不出现裸 three 坐标）
  const [cx, cy, cz] = mathToThree(sphere.center);
  const radius = sphere.radius;
  const width = size?.width ?? 0;
  const height = size?.height ?? 0;

  useLayoutEffect(() => {
    if (!camera || !boundsAreFinite(expandBounds(bounds, padding))) return;
    if (!(radius > 0) || !Number.isFinite(radius)) return;

    // 相机 fov 优先取真实相机（测试替身可能不提供 fov，故需类型与数值双重兜底）
    const cameraFov = (camera as { fov?: unknown }).fov;
    const fovDeg =
      typeof cameraFov === "number" && cameraFov > 0 ? cameraFov : fov;

    // 所需距离的计算与 `requiredCameraDistance` 共用同一实现（测试也调它做断言）
    const requiredDistance = requiredCameraDistance(radius, {
      fovDeg,
      aspect: height > 0 ? width / height : 1,
      margin,
    });
    if (requiredDistance <= 0) return;

    // 沿"相机 → 场景中心"的现有方向后退（保留学生的观察方向）
    let dx = camera.position.x - cx;
    let dy = camera.position.y - cy;
    let dz = camera.position.z - cz;
    let distance = Math.hypot(dx, dy, dz);
    if (!Number.isFinite(distance) || distance < 1e-6) {
      // 相机恰好落在场景中心：退回等轴测方向
      dx = 0.6;
      dy = 0.5;
      dz = 0.8;
      distance = Math.hypot(dx, dy, dz);
    }

    if (controls) {
      controls.target.x = cx;
      controls.target.y = cy;
      controls.target.z = cz;
      // OrbitControls.update() 会把距离钳到 [minDistance, maxDistance]，
      // 因此必须同步抬升 maxDistance，否则拉远的动作会被它压回去。
      const baseMax =
        typeof controls.maxDistance === "number" ? controls.maxDistance : 20;
      controls.maxDistance = Math.max(baseMax, requiredDistance * 1.6);
    }

    if (distance < requiredDistance) {
      // 用逐属性赋值而非 Vector3.set()：测试替身只提供 {x,y,z} 普通对象
      camera.position.x = cx + (dx / distance) * requiredDistance;
      camera.position.y = cy + (dy / distance) * requiredDistance;
      camera.position.z = cz + (dz / distance) * requiredDistance;
    }

    if (controls?.update) controls.update();
    if (typeof camera.updateProjectionMatrix === "function") {
      camera.updateProjectionMatrix();
    }
    invalidate?.();
  }, [
    camera,
    controls,
    invalidate,
    bounds,
    padding,
    margin,
    fov,
    token,
    cx,
    cy,
    cz,
    radius,
    width,
    height,
  ]);

  return null;
};
