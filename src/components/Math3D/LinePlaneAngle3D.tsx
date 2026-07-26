import { Vector3DArrow } from "./Vector3DArrow";
import { AngleArc3D } from "./AngleArc3D";
import { FormulaLabel3D } from "./FormulaLabel3D";
import { PointLabel3D } from "./PointLabel3D";
import type { Vec3 } from "@/math3d/vector3";

interface LinePlaneAngle3DProps {
  lineStart: Vec3;
  lineEnd: Vec3;
  footPoint: Vec3;
  planeNormal?: Vec3;
  arcRadius?: number;
  showNormal?: boolean;
  showFootLabel?: boolean;
}

export const LinePlaneAngle3D = ({
  lineStart,
  lineEnd,
  footPoint,
  planeNormal,
  arcRadius = 0.8,
  showNormal = true,
  showFootLabel = true,
}: LinePlaneAngle3DProps) => {
  return (
    <group>
      {/* 1. 斜线段 */}
      <Vector3DArrow from={lineStart} to={lineEnd} colorKey="primary" />

      {/* 2. 垂线段与投影线段 */}
      <Vector3DArrow from={lineEnd} to={footPoint} colorKey="paramTertiary" />
      <Vector3DArrow from={lineStart} to={footPoint} colorKey="secondary" />

      {/* 3. 垂足标签 */}
      {showFootLabel && <PointLabel3D position={footPoint} text="P'" />}

      {/* 4. 平面法向量 */}
      {showNormal && planeNormal && (
        <>
          <Vector3DArrow
            from={footPoint}
            to={{
              x: footPoint.x + planeNormal.x,
              y: footPoint.y + planeNormal.y,
              z: footPoint.z + planeNormal.z,
            }}
            colorKey="secondary"
          />
          <FormulaLabel3D
            position={{
              x: footPoint.x + planeNormal.x + 0.2,
              y: footPoint.y + planeNormal.y + 0.2,
              z: footPoint.z + planeNormal.z + 0.2,
            }}
            tex="\vec{n}"
          />
        </>
      )}

      {/* 5. 线面角弧 */}
      <AngleArc3D
        vertex={lineStart}
        dirA={{
          x: footPoint.x - lineStart.x,
          y: footPoint.y - lineStart.y,
          z: footPoint.z - lineStart.z,
        }}
        dirB={{
          x: lineEnd.x - lineStart.x,
          y: lineEnd.y - lineStart.y,
          z: lineEnd.z - lineStart.z,
        }}
        radius={arcRadius}
        colorKey="highlight"
      />
    </group>
  );
};
