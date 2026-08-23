/**
 * 模式四：点到平面的距离 子场景（纯几何棱线与高线 + 空间法向量）
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
  DistanceVolumeResult,
} from "@/math3d/spatialAngle";
import type { Vec3 } from "@/math3d/vector3";

interface DistanceModeSceneProps {
  c: number;
  lambda: number;
  vertices: CuboidVertices;
  distanceData: DistanceVolumeResult;
  showAxes: boolean;
  showCoordinates: boolean;
  showAuxiliary: boolean;
  showRightAngles: boolean;
  showNormals: boolean;
  interactionMode: "orbit" | "drag";
  onEPointDrag: (next: Vec3) => void;
}

export default function DistanceModeScene({
  c,
  lambda,
  vertices,
  distanceData,
  showAxes,
  showCoordinates,
  showAuxiliary,
  showRightAngles,
  showNormals,
  interactionMode,
  onEPointDrag,
}: DistanceModeSceneProps) {
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

      {/* 三棱锥 E-ABD 棱线 (几何线段，绝无箭头) */}
      <Segment3D from={E} to={B} colorKey="accent" lineWidth={2} />
      <Segment3D from={E} to={D} colorKey="accent" lineWidth={2} />
      <Segment3D from={B} to={D} colorKey="accent" lineWidth={2} />

      {/* 几何辅助线：双高线 EA 与 AH */}
      {showAuxiliary && (
        <>
          {/* 竖直高线 h1 = EA (底面 ABD 对应的高) */}
          <Segment3D
            from={A}
            to={E}
            dashed
            colorKey="paramPrimary"
            lineWidth={2.5}
          />

          {/* 原点 A 到截面 BDE 的垂线段 AH (截面 BDE 对应的高 d) */}
          <Segment3D
            from={A}
            to={distanceData.footH}
            colorKey="highlight"
            lineWidth={3}
          />
          <Point3D position={distanceData.footH} colorKey="highlight" />
          <PointLabel3D
            position={distanceData.footH}
            text="H"
            offset={[0.1, 0.1, 0.1]}
          />
          <FormulaLabel3D
            position={{
              x: (A.x + distanceData.footH.x) / 2 + 0.1,
              y: (A.y + distanceData.footH.y) / 2 + 0.1,
              z: (A.z + distanceData.footH.z) / 2 + 0.1,
            }}
            tex="d"
          />
        </>
      )}

      {/* 垂直双直角符号 (AH ⊥ HE 与 AH ⊥ HB，凸显线面垂直严格定义) */}
      {showRightAngles && showAuxiliary && (
        <>
          <AngleArc3D
            vertex={distanceData.footH}
            dirA={{
              x: A.x - distanceData.footH.x,
              y: A.y - distanceData.footH.y,
              z: A.z - distanceData.footH.z,
            }}
            dirB={{
              x: E.x - distanceData.footH.x,
              y: E.y - distanceData.footH.y,
              z: E.z - distanceData.footH.z,
            }}
            radius={0.22}
            colorKey="highlight"
            isRight
          />
          <AngleArc3D
            vertex={distanceData.footH}
            dirA={{
              x: A.x - distanceData.footH.x,
              y: A.y - distanceData.footH.y,
              z: A.z - distanceData.footH.z,
            }}
            dirB={{
              x: B.x - distanceData.footH.x,
              y: B.y - distanceData.footH.y,
              z: B.z - distanceData.footH.z,
            }}
            radius={0.28}
            colorKey="secondary"
            isRight
          />
        </>
      )}

      {/* 截面法向量 n (空间代数向量，展示向量投影法求距离 d = |BA·n| / |n|) */}
      {showNormals && (
        <>
          {(() => {
            const G2 = distanceData.centroidSection;
            const nTarget: Vec3 = {
              x: G2.x + distanceData.nUnit.x * 1.6,
              y: G2.y + distanceData.nUnit.y * 1.6,
              z: G2.z + distanceData.nUnit.z * 1.6,
            };
            return (
              <>
                <Vector3DArrow from={G2} to={nTarget} colorKey="primary" />
                <FormulaLabel3D
                  position={nTarget}
                  tex="\\vec{n}"
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
