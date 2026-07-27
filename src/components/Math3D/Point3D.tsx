import { useRef, useState } from "react";
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
  onDrag?: (next: Vec3) => void;
}

export const Point3D = ({
  position,
  colorKey = "highlight",
  radius = 0.12,
  draggable = false,
  constrain,
  onDrag,
}: Point3DProps) => {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { camera, gl, invalidate } = useThree();
  const planeRef = useRef(new THREE.Plane());
  const hit = useRef(new THREE.Vector3());

  const stopDragging = (pointerId?: number) => {
    setDragging(false);
    if (pointerId !== undefined) {
      try {
        gl.domElement.releasePointerCapture(pointerId);
      } catch {
        // 捕获已释放时忽略
      }
    }
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!draggable) return;
    e.stopPropagation();
    setDragging(true);

    try {
      gl.domElement.setPointerCapture(e.pointerId);
    } catch {
      // 忽略部分浏览器捕获异常
    }

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    planeRef.current.setFromNormalAndCoplanarPoint(
      camDir,
      new THREE.Vector3(...mathToThree(position)),
    );
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(planeRef.current, hit.current)) {
      let next = threeToMath(hit.current.x, hit.current.y, hit.current.z);
      if (constrain) next = constrain(next);
      onDrag?.(next);
      invalidate();
    }
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    stopDragging(e.pointerId);
  };

  const colorVal =
    (MATH3D_COLORS as any)[colorKey] ??
    (MATH_COLORS as any)[colorKey] ??
    "#DC2626";

  return (
    <mesh
      position={mathToThree(position)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={() => draggable && setHovered(true)}
      onPointerOut={() => {
        setHovered(false);
      }}
      renderOrder={500}
    >
      <sphereGeometry
        args={[hovered || dragging ? radius * 1.5 : radius, 24, 24]}
      />
      <meshStandardMaterial
        color={colorVal}
        depthTest={false}
        roughness={0.2}
      />
    </mesh>
  );
};
