import { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "@/math3d/vector3";
import { mathToThree } from "@/math3d/coordinateConvention";

/** 3D 三角形填充面，用于四点共面模式展示 △ABC 截面或四面体面 */
export function TriangleMesh({
  A,
  B,
  C,
  color,
  opacity = 0.3,
  renderOrder = 0,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  depthWrite = true,
}: {
  A: Vec3;
  B: Vec3;
  C: Vec3;
  color: string;
  opacity?: number;
  renderOrder?: number;
  polygonOffset?: boolean;
  polygonOffsetFactor?: number;
  depthWrite?: boolean;
}) {
  const geometry = useMemo(() => {
    const pA = mathToThree(A);
    const pB = mathToThree(B);
    const pC = mathToThree(C);
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      ...pA,
      ...pB,
      ...pC,
      ...pA,
      ...pC,
      ...pB, // 正反双面
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, [A, B, C]);

  return (
    <mesh geometry={geometry} renderOrder={renderOrder}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={depthWrite}
        polygonOffset={polygonOffset}
        polygonOffsetFactor={polygonOffsetFactor}
        polygonOffsetUnits={polygonOffsetFactor}
      />
    </mesh>
  );
}
