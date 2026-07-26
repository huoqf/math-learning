import { PointLabel3D } from "./PointLabel3D";
import { FormulaLabel3D } from "./FormulaLabel3D";
import { Vector3DArrow } from "./Vector3DArrow";

interface CoordAxes3DProps {
  size?: number;
  showOrigin?: boolean;
  showAxisLabels?: boolean;
  showUnitVectors?: boolean;
}

export const CoordAxes3D = ({
  size = 5,
  showOrigin = true,
  showAxisLabels = true,
  showUnitVectors = false,
}: CoordAxes3DProps) => {
  return (
    <group>
      {/* 1. 坐标原点标注 */}
      {showOrigin && (
        <PointLabel3D
          position={{ x: 0, y: 0, z: 0 }}
          text="O(0,0,0)"
          offset={[-0.3, -0.3, 0]}
        />
      )}

      {/* 2. 坐标轴末端标签 */}
      {showAxisLabels && (
        <>
          <FormulaLabel3D position={{ x: size + 0.4, y: 0, z: 0 }} tex="x" />
          <FormulaLabel3D position={{ x: 0, y: size + 0.4, z: 0 }} tex="y" />
          <FormulaLabel3D position={{ x: 0, y: 0, z: size + 0.4 }} tex="z" />
        </>
      )}

      {/* 3. 单位基向量 i, j, k */}
      {showUnitVectors && (
        <>
          <Vector3DArrow
            from={{ x: 0, y: 0, z: 0 }}
            to={{ x: 1, y: 0, z: 0 }}
            colorKey="axis3D_X"
            headLength={0.15}
          />
          <FormulaLabel3D position={{ x: 1.1, y: 0.2, z: 0 }} tex="\vec{i}" />

          <Vector3DArrow
            from={{ x: 0, y: 0, z: 0 }}
            to={{ x: 0, y: 1, z: 0 }}
            colorKey="axis3D_Y"
            headLength={0.15}
          />
          <FormulaLabel3D position={{ x: 0.2, y: 1.1, z: 0 }} tex="\vec{j}" />

          <Vector3DArrow
            from={{ x: 0, y: 0, z: 0 }}
            to={{ x: 0, y: 0, z: 1 }}
            colorKey="axis3D_Z"
            headLength={0.15}
          />
          <FormulaLabel3D position={{ x: 0, y: 0.2, z: 1.1 }} tex="\vec{k}" />
        </>
      )}
    </group>
  );
};
