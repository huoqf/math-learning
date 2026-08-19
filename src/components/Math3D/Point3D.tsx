import { useEffect, useRef, useState } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { MATH3D_COLORS, MATH_COLORS } from "@/theme/math/colors";
import { mathToThree, threeToMath } from "@/math3d/coordinateConvention";
import type { Vec3 } from "@/math3d/vector3";

interface Point3DProps {
  position: Vec3;
  colorKey?: keyof typeof MATH3D_COLORS | keyof typeof MATH_COLORS;
  radius?: number;
  draggable?: boolean;
  constrain?: (raw: Vec3) => Vec3;
  onDragStart?: () => void;
  onDrag?: (next: Vec3) => void;
  onDragEnd?: () => void;
}

export const Point3D = ({
  position,
  colorKey,
  radius,
  draggable = false,
  constrain,
  onDragStart,
  onDrag,
  onDragEnd,
}: Point3DProps) => {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { camera, gl, invalidate } = useThree();
  const planeRef = useRef(new THREE.Plane());
  const raycasterRef = useRef(new THREE.Raycaster());
  const hit = useRef(new THREE.Vector3());

  // 不可交互固定点采用小巧细腻几何点 (0.042)，可交互动点采用清晰手柄尺寸 (0.075)
  const defaultRadius = draggable ? 0.075 : 0.042;
  const finalRadius = radius ?? defaultRadius;

  // 使用 ref 保持最新回调引用，避免闭包过时
  const onDragRef = useRef(onDrag);
  onDragRef.current = onDrag;
  const constrainRef = useRef(constrain);
  constrainRef.current = constrain;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  // 全局指针移动与抬起监听（仅在可交互且处于拖拽中时激活）
  useEffect(() => {
    if (!dragging || !draggable) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      if (
        raycasterRef.current.ray.intersectPlane(planeRef.current, hit.current)
      ) {
        let next = threeToMath(hit.current.x, hit.current.y, hit.current.z);
        if (constrainRef.current) next = constrainRef.current(next);
        onDragRef.current?.(next);
        invalidate();
      }
    };

    const handleWindowPointerUp = () => {
      setDragging(false);
      document.body.style.cursor = "";
      onDragEndRef.current?.();
      invalidate();
    };

    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [dragging, draggable, camera, gl, invalidate]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!draggable) return;
    e.stopPropagation();
    setDragging(true);
    onDragStart?.();

    // 构建过当前点且正对相机的视线拖拽平面
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    planeRef.current.setFromNormalAndCoplanarPoint(
      camDir,
      new THREE.Vector3(...mathToThree(position)),
    );
  };

  // 颜色默认值：可交互点默认为 highlight 鲜明色，不可交互固定点默认为稳重的 label 墨色/深色
  const resolvedColorKey = colorKey ?? (draggable ? "highlight" : "label");
  const colorVal: string =
    (MATH3D_COLORS as Record<string, string>)[resolvedColorKey] ??
    (MATH_COLORS as Record<string, string>)[resolvedColorKey] ??
    (draggable ? "#EF4444" : "#1E293B");

  const pos3 = mathToThree(position);

  // ================= 1. 不可交互点：纯净、实心、无外光晕的几何顶点 =================
  if (!draggable) {
    return (
      <group position={pos3}>
        <mesh renderOrder={100}>
          <sphereGeometry args={[finalRadius, 24, 24]} />
          <meshStandardMaterial
            color={colorVal}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      </group>
    );
  }

  // ================= 2. 可交互动点：带外光晕手柄、大碰撞盒与抓取光标反馈 =================
  return (
    <group position={pos3}>
      {/* 核心实体动点 */}
      <mesh renderOrder={500}>
        <sphereGeometry
          args={[
            hovered || dragging ? finalRadius * 1.25 : finalRadius,
            24,
            24,
          ]}
        />
        <meshStandardMaterial
          color={colorVal}
          depthTest={false}
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>

      {/* 可拖拽动点专属外光晕与脉冲手柄环 */}
      <mesh renderOrder={490}>
        <sphereGeometry
          args={[
            hovered || dragging ? finalRadius * 1.9 : finalRadius * 1.5,
            16,
            16,
          ]}
        />
        <meshBasicMaterial
          color={colorVal}
          transparent
          opacity={dragging ? 0.5 : hovered ? 0.38 : 0.22}
          depthTest={false}
          wireframe={!hovered && !dragging}
        />
      </mesh>

      {/* 隐式大碰撞体 (Invisible Hit Sphere): 保证鼠标轻松抓取 */}
      <mesh
        onPointerDown={onPointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          gl.domElement.style.cursor = "grab";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          if (!dragging) gl.domElement.style.cursor = "";
        }}
        renderOrder={1000}
      >
        <sphereGeometry args={[Math.max(0.26, finalRadius * 3.5), 12, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
};
