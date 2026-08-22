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
          dirA={{ x: 0, y: 0, z: linePlaneData.zE }}
          dirB={{
            x: linePlaneData.C.x - linePlaneData.A.x,
            y: linePlaneData.C.y - linePlaneData.A.y,
            z: 0,
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
            dirA={{ x: -a, y: -b, z: 0 }}
            dirB={{ x: -a, y: -b, z: linePlaneData.zE }}
            radius={0.7}
            colorKey="highlight"
          />
          <FormulaLabel3D
            position={{ x: a - 0.35, y: b - 0.35, z: 0.15 }}
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
