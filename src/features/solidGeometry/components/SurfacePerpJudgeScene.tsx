import React from "react";
import { Plane3D } from "@/components/Math3D/Plane3D";
import { Vector3DArrow } from "@/components/Math3D/Vector3DArrow";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { PointLabel3D } from "@/components/Math3D/PointLabel3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { AngleArc3D } from "@/components/Math3D/AngleArc3D";
import { calculatePerpJudgeFamily } from "@/math3d/surfaceRelation";

interface SurfacePerpJudgeSceneProps {
  planeRotDeg: number;
}

export const SurfacePerpJudgeScene: React.FC<SurfacePerpJudgeSceneProps> = ({
  planeRotDeg,
}) => {
  const fam = calculatePerpJudgeFamily(planeRotDeg);

  return (
    <>
      {/* 底面 alpha */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 0 }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={5.6}
        height={5.6}
        colorKey="secondary"
        opacity={0.25}
      />
      <FormulaLabel3D position={{ x: 2.5, y: 2.5, z: 0.1 }} tex="\alpha" />

      {/* 经过垂线 l 的旋转平面 beta */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 1.2 }}
        uAxis={fam.uAxis}
        vAxis={fam.vAxis}
        width={5.2}
        height={3.2}
        colorKey="paramTertiary"
        opacity={0.28}
      />
      <FormulaLabel3D
        position={{
          x: fam.uAxis.x * 2.4,
          y: fam.uAxis.y * 2.4,
          z: 2.6,
        }}
        tex="\beta"
      />

      {/* 空间垂线 l (l 垂直于 alpha) */}
      <Vector3DArrow
        from={fam.lineLStart}
        to={fam.lineLEnd}
        colorKey="paramPrimary"
      />
      <FormulaLabel3D position={{ x: 0.2, y: 0.2, z: 3.1 }} tex="l" />
      <PointLabel3D
        position={{ x: 0, y: 0, z: 0 }}
        text="O"
        offset={[-0.2, -0.2, 0]}
      />
      <Point3D
        position={{ x: 0, y: 0, z: 0 }}
        colorKey="secondary"
        radius={0.05}
      />

      {/* 底面 alpha 法向量 n1 */}
      <Vector3DArrow
        from={{ x: -1.8, y: -1.8, z: 0 }}
        to={{ x: -1.8, y: -1.8, z: 1.5 }}
        colorKey="secondary"
      />
      <FormulaLabel3D position={{ x: -1.6, y: -1.8, z: 1.6 }} tex="\vec{n_1}" />

      {/* 旋转平面 beta 法向量 n2 */}
      <Vector3DArrow
        from={{ x: 0, y: 0, z: 1.2 }}
        to={{
          x: fam.betaNormal.x * 1.5,
          y: fam.betaNormal.y * 1.5,
          z: 1.2,
        }}
        colorKey="paramSecondary"
      />
      <FormulaLabel3D
        position={{
          x: fam.betaNormal.x * 1.6,
          y: fam.betaNormal.y * 1.6,
          z: 1.3,
        }}
        tex="\vec{n_2}"
      />

      {/* 二面角直角角弧 */}
      <AngleArc3D
        vertex={{ x: 0, y: 0, z: 0 }}
        dirA={{ x: fam.uAxis.x, y: fam.uAxis.y, z: 0 }}
        dirB={{ x: 0, y: 0, z: 1 }}
        radius={0.6}
        colorKey="highlight"
      />
    </>
  );
};
