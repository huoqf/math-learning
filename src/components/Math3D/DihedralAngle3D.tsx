import { Vector3DArrow } from "./Vector3DArrow";
import { AngleArc3D } from "./AngleArc3D";
import { FormulaLabel3D } from "./FormulaLabel3D";
import type { Vec3 } from "@/math3d/vector3";

interface DihedralAngle3DProps {
  vertex: Vec3;
  dirA: Vec3;
  dirB: Vec3;
  n1?: Vec3;
  n2?: Vec3;
  edgeStart?: Vec3;
  edgeEnd?: Vec3;
  arcRadius?: number;
  showNormals?: boolean;
  label?: string;
}

export const DihedralAngle3D = ({
  vertex,
  dirA,
  dirB,
  n1,
  n2,
  edgeStart,
  edgeEnd,
  arcRadius = 0.8,
  showNormals = true,
  label = "\\theta",
}: DihedralAngle3DProps) => {
  return (
    <group>
      {/* 1. 二面角棱线 */}
      {edgeStart && edgeEnd && (
        <Vector3DArrow from={edgeStart} to={edgeEnd} colorKey="highlight" />
      )}

      {/* 2. 平面 1 与 2 的法向量 n1, n2 */}
      {showNormals && n1 && (
        <>
          <Vector3DArrow
            from={vertex}
            to={{
              x: vertex.x + n1.x,
              y: vertex.y + n1.y,
              z: vertex.z + n1.z,
            }}
            colorKey="secondary"
          />
          <FormulaLabel3D
            position={{
              x: vertex.x + n1.x + 0.2,
              y: vertex.y + n1.y + 0.2,
              z: vertex.z + n1.z + 0.2,
            }}
            tex="\vec{n_1}"
          />
        </>
      )}

      {showNormals && n2 && (
        <>
          <Vector3DArrow
            from={vertex}
            to={{
              x: vertex.x + n2.x,
              y: vertex.y + n2.y,
              z: vertex.z + n2.z,
            }}
            colorKey="primary"
          />
          <FormulaLabel3D
            position={{
              x: vertex.x + n2.x + 0.2,
              y: vertex.y + n2.y + 0.2,
              z: vertex.z + n2.z + 0.2,
            }}
            tex="\vec{n_2}"
          />
        </>
      )}

      {/* 3. 二面角弧线与标签 */}
      <AngleArc3D
        vertex={vertex}
        dirA={dirA}
        dirB={dirB}
        radius={arcRadius}
        colorKey="highlight"
      />

      {label && (
        <FormulaLabel3D
          position={{
            x: vertex.x + (dirA.x + dirB.x) * 0.4,
            y: vertex.y + (dirA.y + dirB.y) * 0.4,
            z: vertex.z + (dirA.z + dirB.z) * 0.4,
          }}
          tex={label}
        />
      )}
    </group>
  );
};
