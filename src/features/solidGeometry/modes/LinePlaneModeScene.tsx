/**
 * 模式二：直线与平面所成的角 子场景（几何斜线与射影）
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
  LinePlaneAngleResult,
} from "@/math3d/spatialAngle";
import type { Vec3 } from "@/math3d/vector3";

interface LinePlaneModeSceneProps {
  a: number;
  b: number;
  c: number;
  lambda: number;
  vertices: CuboidVertices;
  linePlaneData: LinePlaneAngleResult;
  showAxes: boolean;
  showCoordinates: boolean;
  showAuxiliary: boolean;
  showRightAngles: boolean;
  showAngles: boolean;
  showNormals: boolean;
  interactionMode: "orbit" | "drag";
  onEPointDrag: (next: Vec3) => void;
}

export default function LinePlaneModeScene({
  a,
  b,
  c,
  lambda,
  vertices,
  linePlaneData,
  showAxes,
  showCoordinates,
  showAuxiliary,
  showRightAngles,
  showAngles,
  showNormals,
  interactionMode,
  onEPointDrag,
}: LinePlaneModeSceneProps) {
  const { E } = vertices;

  return (
    <>
      {/* 底面 ABCD 半透明填充 */}
      <Polygon3DFace
        points={[vertices.A, vertices.B, vertices.C, vertices.D]}
        colorKey="secondary"
        opacity={0.18}
      />

      {/* 动点 E 在侧棱 AA1 上 */}
      {showAxes && showCoordinates ? (
        <FormulaLabel3D
          position={E}
          tex={`E(0,0,${Number((lambda * c).toFixed(2))})`}
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

      {/* 空间斜线 EC (几何线段，无箭头) */}
      <Segment3D
        from={linePlaneData.E}
        to={linePlaneData.C}
        colorKey="primary"
        lineWidth={3}
      />

      {/* 几何辅助线：垂线段 EA 与底面射影 AC */}
      {showAuxiliary && (
        <>
          <Segment3D
            from={linePlaneData.E}
            to={linePlaneData.A}
            dashed
            colorKey="accent"
            lineWidth={2.5}
          />
          <Segment3D
            from={linePlaneData.A}
            to={linePlaneData.C}
            dashed
            colorKey="secondary"
            lineWidth={2}
          />
        </>
      )}

      {/* 垂直直角符号 */}
      {showRightAngles && showAuxiliary && (
        <AngleArc3D
          vertex={linePlaneData.A}
          dirA={{
            x: linePlaneData.E.x - linePlaneData.A.x,
            y: linePlaneData.E.y - linePlaneData.A.y,
            z: linePlaneData.E.z - linePlaneData.A.z,
          }}
          dirB={{
            x: linePlaneData.C.x - linePlaneData.A.x,
            y: linePlaneData.C.y - linePlaneData.A.y,
            z: linePlaneData.C.z - linePlaneData.A.z,
          }}
          radius={0.3}
          colorKey="accent"
          isRight
        />
      )}

      {/* 空间角弧 θ */}
      {showAngles && showAuxiliary && (
        <>
          <AngleArc3D
            vertex={linePlaneData.C}
            dirA={{
              x: linePlaneData.A.x - linePlaneData.C.x,
              y: linePlaneData.A.y - linePlaneData.C.y,
              z: linePlaneData.A.z - linePlaneData.C.z,
            }}
            dirB={{
              x: linePlaneData.E.x - linePlaneData.C.x,
              y: linePlaneData.E.y - linePlaneData.C.y,
              z: linePlaneData.E.z - linePlaneData.C.z,
            }}
            radius={0.7}
            colorKey="highlight"
          />
          <FormulaLabel3D
            position={{
              x: a - Math.min(0.45, Math.max(0.2, a * 0.18)),
              y: b - Math.min(0.35, Math.max(0.15, b * 0.18)),
              z: Math.min(0.3, Math.max(0.1, c * 0.12)),
            }}
            tex="\theta"
          />
        </>
      )}

      {/* 底面法向量 n_0 (唯一代数向量箭头) */}
      {showNormals && (
        <>
          <Vector3DArrow
            from={{ x: a / 2, y: b / 2, z: 0 }}
            to={{ x: a / 2, y: b / 2, z: 1.8 }}
            colorKey="secondary"
          />
          <FormulaLabel3D
            position={{ x: a / 2, y: b / 2, z: 1.8 }}
            tex="\\vec{n}_0"
            offset={[0.1, 0.1, 0.1]}
          />
        </>
      )}
    </>
  );
}
