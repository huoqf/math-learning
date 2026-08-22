/**
 * 模式一：异面直线所成的角 子场景（纯几何线段，无箭头误导）
 */
import {
  Segment3D,
  AngleArc3D,
  FormulaLabel3D,
  CompoundLabel3D,
  Vector3DArrow,
} from "@/components/Math3D";
import type { CuboidVertices, SkewLinesResult } from "@/math3d/spatialAngle";

interface SkewLinesModeSceneProps {
  a: number;
  b: number;
  c: number;
  vertices: CuboidVertices;
  skewData: SkewLinesResult;
  showAuxiliary: boolean;
  showRightAngles: boolean;
  showAngles: boolean;
  showNormals: boolean;
}

export default function SkewLinesModeScene({
  a,
  b,
  c,
  vertices,
  skewData,
  showAuxiliary,
  showRightAngles,
  showAngles,
  showNormals,
}: SkewLinesModeSceneProps) {
  const { A, B, C, A1, D1 } = vertices;

  return (
    <>
      {/* 异面直线 1: A1B (几何线段，无箭头) */}
      <Segment3D from={A1} to={B} colorKey="primary" lineWidth={3} />

      {/* 异面直线 2: AC (几何线段，无箭头) */}
      <Segment3D from={A} to={C} colorKey="accent" lineWidth={3} />

      {/* 平移法辅助线与公垂线段 */}
      {showAuxiliary && (
        <>
          {/* 长方体侧面上 D1C // A1B (辅助线段) */}
          <Segment3D
            from={D1}
            to={C}
            dashed
            colorKey="secondary"
            lineWidth={2.5}
          />

          {/* 公垂线段 P1P2 (几何线段，无箭头) */}
          <Segment3D
            from={skewData.P1}
            to={skewData.P2}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />
          <CompoundLabel3D
            position={skewData.P1}
            base="P"
            subscript="1"
            offset={[-0.15, 0.1, 0.1]}
          />
          <CompoundLabel3D
            position={skewData.P2}
            base="P"
            subscript="2"
            offset={[0.15, -0.1, 0.1]}
          />
        </>
      )}

      {/* 垂直直角符号 */}
      {showRightAngles && showAuxiliary && (
        <>
          {/* P1 处直角标记 */}
          <AngleArc3D
            vertex={skewData.P1}
            dirA={{
              x: skewData.u.x,
              y: skewData.u.y,
              z: skewData.u.z,
            }}
            dirB={{
              x: skewData.P2.x - skewData.P1.x,
              y: skewData.P2.y - skewData.P1.y,
              z: skewData.P2.z - skewData.P1.z,
            }}
            radius={0.18}
            colorKey="paramPrimary"
            isRight
          />
          {/* P2 处直角标记 */}
          <AngleArc3D
            vertex={skewData.P2}
            dirA={{
              x: skewData.v.x,
              y: skewData.v.y,
              z: skewData.v.z,
            }}
            dirB={{
              x: skewData.P1.x - skewData.P2.x,
              y: skewData.P1.y - skewData.P2.y,
              z: skewData.P1.z - skewData.P2.z,
            }}
            radius={0.18}
            colorKey="paramPrimary"
            isRight
          />
        </>
      )}

      {/* 空间特征角弧 θ */}
      {showAngles && showAuxiliary && (
        <>
          <AngleArc3D
            vertex={C}
            dirA={{ x: -a, y: -b, z: 0 }}
            dirB={{ x: -a, y: 0, z: c }}
            radius={0.7}
            colorKey="highlight"
          />
          <FormulaLabel3D
            position={{ x: a - 0.3, y: b - 0.3, z: 0.15 }}
            tex="\theta"
          />
        </>
      )}

      {/* 空间向量法：方向向量 u⃗ (A₁B) 与 v⃗ (AC) */}
      {showNormals && (
        <>
          <Vector3DArrow from={A1} to={B} colorKey="primary" />
          <FormulaLabel3D
            position={{
              x: (A1.x + B.x) / 2 + 0.1,
              y: 0,
              z: (A1.z + B.z) / 2 + 0.15,
            }}
            tex="\\vec{u}"
          />
          <Vector3DArrow from={A} to={C} colorKey="accent" />
          <FormulaLabel3D
            position={{
              x: (A.x + C.x) / 2 - 0.1,
              y: (A.y + C.y) / 2 + 0.15,
              z: 0.15,
            }}
            tex="\\vec{v}"
          />
        </>
      )}
    </>
  );
}
