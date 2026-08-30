import { useMemo } from "react";
import {
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Segment3D,
  AngleArc3D,
  Scene3DGrid,
} from "@/components/Math3D";
import type { Vec3 } from "@/math3d/vector3";
import type { VectorCoordOperationResult } from "@/math3d/vectorOperations";

interface CoordDotProductModeSceneProps {
  vecA: Vec3;
  vecB: Vec3;
  res: VectorCoordOperationResult;
  showSum: boolean;
  showDiff: boolean;
  showProjection: boolean;
  showAngle: boolean;
  showAxes: boolean;
  interactionMode: "orbit" | "drag";
  onDragA: (next: Vec3) => void;
  onDragB: (next: Vec3) => void;
}

export function CoordDotProductModeScene({
  vecA,
  vecB,
  res,
  showSum,
  showDiff,
  showProjection,
  showAngle,
  showAxes,
  interactionMode,
  onDragA,
  onDragB,
}: CoordDotProductModeSceneProps) {
  const origin: Vec3 = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  const { sum, projBOnA, normA, normB, angleDeg } = res;

  return (
    <>
      {/* 空间直角坐标系 */}
      {showAxes && <Scene3DGrid size={6} />}

      {/* 原点 O 标注 */}
      <PointLabel3D position={origin} text="O" offset={[-0.15, -0.15, -0.1]} />

      {/* 向量 a (Primary) */}
      <Vector3DArrow from={origin} to={vecA} colorKey="primary" />
      <Point3D
        position={vecA}
        draggable={interactionMode === "drag"}
        onDrag={onDragA}
        colorKey="primary"
      />
      <FormulaLabel3D
        position={vecA}
        tex="\\vec{a}"
        offset={[0.15, 0.1, 0.15]}
      />

      {/* 向量 b (Secondary) */}
      <Vector3DArrow from={origin} to={vecB} colorKey="secondary" />
      <Point3D
        position={vecB}
        draggable={interactionMode === "drag"}
        onDrag={onDragB}
        colorKey="secondary"
      />
      <FormulaLabel3D
        position={vecB}
        tex="\\vec{b}"
        offset={[0.15, 0.1, 0.15]}
      />

      {/* 和向量 a + b 与平行四边形补全 */}
      {showSum && (
        <>
          <Vector3DArrow from={origin} to={sum} colorKey="highlight" />
          <FormulaLabel3D
            position={sum}
            tex="\\vec{a}+\\vec{b}"
            offset={[0.15, 0.1, 0.15]}
          />
          {/* 平行四边形虚线边 */}
          <Segment3D
            from={vecA}
            to={sum}
            dashed
            colorKey="secondary"
            lineWidth={1.8}
          />
          <Segment3D
            from={vecB}
            to={sum}
            dashed
            colorKey="primary"
            lineWidth={1.8}
          />
        </>
      )}

      {/* 差向量 a - b (从 b 指向 a) */}
      {showDiff && (
        <>
          <Vector3DArrow from={vecB} to={vecA} colorKey="paramSecondary" />
          <FormulaLabel3D
            position={{
              x: (vecA.x + vecB.x) / 2,
              y: (vecA.y + vecB.y) / 2,
              z: (vecA.z + vecB.z) / 2 + 0.15,
            }}
            tex="\\vec{a}-\\vec{b}"
          />
        </>
      )}

      {/* 正交投影与直角符号 */}
      {showProjection && normA > 1e-4 && (
        <>
          {/* 投影向量 b_a */}
          <Vector3DArrow from={origin} to={projBOnA} colorKey="paramTertiary" />
          <FormulaLabel3D
            position={projBOnA}
            tex="\\vec{b}_{\\vec{a}}"
            offset={[0.1, -0.15, -0.1]}
          />
          {/* 垂足虚线 (B -> projBOnA) */}
          <Segment3D
            from={vecB}
            to={projBOnA}
            dashed
            colorKey="paramTertiary"
            lineWidth={2}
          />
          <Point3D position={projBOnA} colorKey="paramTertiary" />
          <PointLabel3D
            position={projBOnA}
            text="H"
            offset={[0.1, 0.1, 0.05]}
          />
          {/* 直角符号 (在垂足 H 处) */}
          <AngleArc3D
            vertex={projBOnA}
            dirA={{
              x: vecB.x - projBOnA.x,
              y: vecB.y - projBOnA.y,
              z: vecB.z - projBOnA.z,
            }}
            dirB={{
              x: origin.x - projBOnA.x,
              y: origin.y - projBOnA.y,
              z: origin.z - projBOnA.z,
            }}
            radius={0.3}
            isRight
            colorKey="paramTertiary"
          />
        </>
      )}

      {/* 空间夹角弧线 θ */}
      {showAngle && normA > 1e-4 && normB > 1e-4 && angleDeg > 1 && (
        <>
          <AngleArc3D
            vertex={origin}
            dirA={vecA}
            dirB={vecB}
            radius={0.7}
            colorKey="highlight"
          />
          <FormulaLabel3D
            position={{
              x: (vecA.x / normA + vecB.x / normB) * 0.45,
              y: (vecA.y / normA + vecB.y / normB) * 0.45,
              z: (vecA.z / normA + vecB.z / normB) * 0.45 + 0.1,
            }}
            tex="\\theta"
          />
        </>
      )}
    </>
  );
}
