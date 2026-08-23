/**
 * 模式三：二面角 子场景（三垂线几何角与重心法向量）
 */
import {
  Polygon3DFace,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Segment3D,
  AngleArc3D,
  Vector3DArrow,
} from "@/components/Math3D";
import type {
  CuboidVertices,
  DihedralAngleResult,
} from "@/math3d/spatialAngle";
import type { Vec3 } from "@/math3d/vector3";

interface DihedralModeSceneProps {
  c: number;
  lambda: number;
  vertices: CuboidVertices;
  dihedralData: DihedralAngleResult;
  showAxes: boolean;
  showCoordinates: boolean;
  showAuxiliary: boolean;
  showRightAngles: boolean;
  showAngles: boolean;
  showNormals: boolean;
  interactionMode: "orbit" | "drag";
  onEPointDrag: (next: Vec3) => void;
}

export default function DihedralModeScene({
  c,
  lambda,
  vertices,
  dihedralData,
  showAxes,
  showCoordinates,
  showAuxiliary,
  showRightAngles,
  showAngles,
  showNormals,
  interactionMode,
  onEPointDrag,
}: DihedralModeSceneProps) {
  const { E, A, B, D } = vertices;

  return (
    <>
      {/* 动点 E 在 AA1 上 */}
      {showAxes && showCoordinates ? (
        <FormulaLabel3D
          position={E}
          tex={`E(0,0,${(lambda * c).toFixed(1)})`}
          offset={[-0.25, -0.2, 0.1]}
        />
      ) : (
        <PointLabel3D position={E} text="E" offset={[-0.2, -0.2, 0.1]} />
      )}
      <Point3D
        position={E}
        draggable={interactionMode === "drag"}
        constrain={(raw) => ({
          x: 0,
          y: 0,
          z: Math.min(c, Math.max(0.1 * c, raw.z)),
        })}
        onDrag={onEPointDrag}
        colorKey="highlight"
      />

      {/* 底面 ABD 与 截面 BDE */}
      <Polygon3DFace points={[A, B, D]} colorKey="secondary" opacity={0.15} />
      <Polygon3DFace
        points={[B, D, E]}
        colorKey="paramTertiary"
        opacity={0.28}
      />

      {/* 二面角的棱 BD (几何线段) */}
      <Segment3D from={B} to={D} colorKey="highlight" lineWidth={3} />

      {/* 几何辅助线：三垂线定理垂足 M 及垂线 AM ⊥ BD, EM ⊥ BD */}
      {showAuxiliary && (
        <>
          <Segment3D
            from={A}
            to={dihedralData.edgeFootM}
            dashed
            colorKey="secondary"
            lineWidth={2}
          />
          <Segment3D
            from={E}
            to={dihedralData.edgeFootM}
            dashed
            colorKey="paramTertiary"
            lineWidth={2}
          />
          <Point3D position={dihedralData.edgeFootM} colorKey="paramTertiary" />
          <PointLabel3D
            position={dihedralData.edgeFootM}
            text="M"
            offset={[0.1, 0.1, 0.05]}
          />
        </>
      )}

      {/* 垂直直角符号 */}
      {showRightAngles && showAuxiliary && (
        <>
          {/* 垂足 M 处 AM ⊥ BD 直角标记 (落在底面 △ABD 内，朝向点 B) */}
          <AngleArc3D
            vertex={dihedralData.edgeFootM}
            dirA={{
              x: A.x - dihedralData.edgeFootM.x,
              y: A.y - dihedralData.edgeFootM.y,
              z: A.z - dihedralData.edgeFootM.z,
            }}
            dirB={{
              x: B.x - dihedralData.edgeFootM.x,
              y: B.y - dihedralData.edgeFootM.y,
              z: B.z - dihedralData.edgeFootM.z,
            }}
            radius={0.25}
            colorKey="secondary"
            isRight
          />

          {/* 垂足 M 处 EM ⊥ BD 直角标记 (落在截面 △BDE 内，朝向点 D) */}
          <AngleArc3D
            vertex={dihedralData.edgeFootM}
            dirA={{
              x: E.x - dihedralData.edgeFootM.x,
              y: E.y - dihedralData.edgeFootM.y,
              z: E.z - dihedralData.edgeFootM.z,
            }}
            dirB={{
              x: D.x - dihedralData.edgeFootM.x,
              y: D.y - dihedralData.edgeFootM.y,
              z: D.z - dihedralData.edgeFootM.z,
            }}
            radius={0.28}
            colorKey="paramTertiary"
            isRight
          />
        </>
      )}

      {/* 空间特征角弧 θ (二面角平面角) */}
      {showAngles && showAuxiliary && (
        <>
          <AngleArc3D
            vertex={dihedralData.edgeFootM}
            dirA={{
              x: A.x - dihedralData.edgeFootM.x,
              y: A.y - dihedralData.edgeFootM.y,
              z: A.z - dihedralData.edgeFootM.z,
            }}
            dirB={{
              x: E.x - dihedralData.edgeFootM.x,
              y: E.y - dihedralData.edgeFootM.y,
              z: E.z - dihedralData.edgeFootM.z,
            }}
            radius={0.55}
            colorKey="highlight"
          />
          <FormulaLabel3D
            position={{
              x: dihedralData.edgeFootM.x - 0.15,
              y: dihedralData.edgeFootM.y - 0.15,
              z: 0.25,
            }}
            tex="\theta"
          />
        </>
      )}

      {/* 截面法向量 n_2 与底面法向量 n_1 (代数向量箭头) */}
      {showNormals && (
        <>
          {(() => {
            const G2 = dihedralData.centroidSection;
            const n2Target: Vec3 = {
              x: G2.x + dihedralData.n2.x * 1.6,
              y: G2.y + dihedralData.n2.y * 1.6,
              z: G2.z + dihedralData.n2.z * 1.6,
            };
            return (
              <>
                <Vector3DArrow from={G2} to={n2Target} colorKey="primary" />
                <FormulaLabel3D
                  position={n2Target}
                  tex="\\vec{n}_2"
                  offset={[0.1, 0.1, 0.1]}
                />
              </>
            );
          })()}

          {(() => {
            const G1 = dihedralData.centroidBase;
            const n1Target: Vec3 = { x: G1.x, y: G1.y, z: 1.6 };
            return (
              <>
                <Vector3DArrow from={G1} to={n1Target} colorKey="secondary" />
                <FormulaLabel3D
                  position={n1Target}
                  tex="\\vec{n}_1"
                  offset={[0.1, 0.1, 0.1]}
                />
              </>
            );
          })()}
        </>
      )}
    </>
  );
}
