import React from "react";
import { Plane3D } from "@/components/Math3D/Plane3D";
import { Vector3DArrow } from "@/components/Math3D/Vector3DArrow";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { PointLabel3D } from "@/components/Math3D/PointLabel3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { AngleArc3D } from "@/components/Math3D/AngleArc3D";
import { calculatePerpPropState } from "@/math3d/surfaceRelation";

interface SurfacePerpPropSceneProps {
  lineThetaDeg: number;
  subType: "standard" | "counterExample" | "dualPerp";
}

export const SurfacePerpPropScene: React.FC<SurfacePerpPropSceneProps> = ({
  lineThetaDeg,
  subType,
}) => {
  const isDualPerp = subType === "dualPerp";
  const state = calculatePerpPropState(lineThetaDeg);

  if (isDualPerp) {
    // 双垂直交线定理场景：alpha 垂直于 gamma，beta 垂直于 gamma，交线 l 垂直于 gamma
    return (
      <>
        {/* 基底底面 gamma (z=0) */}
        <Plane3D
          origin={{ x: 0, y: 0, z: 0 }}
          uAxis={{ x: 1, y: 0, z: 0 }}
          vAxis={{ x: 0, y: 1, z: 0 }}
          width={5.6}
          height={5.6}
          colorKey="secondary"
          opacity={0.25}
        />
        <FormulaLabel3D position={{ x: 2.5, y: 2.5, z: 0.1 }} tex="\gamma" />

        {/* 立面 alpha (xz 平面, y=0) 垂直于 gamma */}
        <Plane3D
          origin={{ x: 0, y: 0, z: 1.5 }}
          uAxis={{ x: 1, y: 0, z: 0 }}
          vAxis={{ x: 0, y: 0, z: 1 }}
          width={5.2}
          height={3}
          colorKey="paramTertiary"
          opacity={0.28}
        />
        <FormulaLabel3D position={{ x: 2.4, y: 0.1, z: 2.8 }} tex="\alpha" />

        {/* 立面 beta (yz 平面, x=0) 垂直于 gamma */}
        <Plane3D
          origin={{ x: 0, y: 0, z: 1.5 }}
          uAxis={{ x: 0, y: 1, z: 0 }}
          vAxis={{ x: 0, y: 0, z: 1 }}
          width={5.2}
          height={3}
          colorKey="paramSecondary"
          opacity={0.25}
        />
        <FormulaLabel3D position={{ x: 0.1, y: 2.4, z: 2.8 }} tex="\beta" />

        {/* 两面交线 l (z 轴) 必垂直于 gamma */}
        <Vector3DArrow
          from={{ x: 0, y: 0, z: 0 }}
          to={{ x: 0, y: 0, z: 3.2 }}
          colorKey="paramPrimary"
        />
        <FormulaLabel3D position={{ x: 0.2, y: 0.2, z: 3.3 }} tex="l" />
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
      </>
    );
  }

  // 性质定理 1：面内垂直于交线推出线面垂直
  return (
    <>
      {/* 底面 alpha (z=0) */}
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

      {/* 垂直立面 beta (x=0, yz平面) */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 1.5 }}
        uAxis={{ x: 0, y: 1, z: 0 }}
        vAxis={{ x: 0, y: 0, z: 1 }}
        width={5.6}
        height={3}
        colorKey="paramTertiary"
        opacity={0.28}
      />
      <FormulaLabel3D position={{ x: 0.1, y: 2.5, z: 2.8 }} tex="\beta" />

      {/* 两面交线 l (y 轴) */}
      <Vector3DArrow
        from={state.lineLStart}
        to={state.lineLEnd}
        colorKey="secondary"
      />
      <FormulaLabel3D position={{ x: 0.2, y: 2.8, z: 0.1 }} tex="l" />

      {/* 面内直线 a */}
      <Vector3DArrow
        from={state.lineAStart}
        to={state.lineAEnd}
        colorKey="paramPrimary"
      />
      <FormulaLabel3D
        position={{
          x: 0.1,
          y: state.lineAEnd.y + 0.2,
          z: state.lineAEnd.z + 0.2,
        }}
        tex="a"
      />
      <PointLabel3D
        position={{ x: 0, y: 0, z: 0 }}
        text="P"
        offset={[-0.2, -0.2, 0]}
      />
      <Point3D
        position={{ x: 0, y: 0, z: 0 }}
        colorKey="secondary"
        radius={0.05}
      />

      {/* 直线 a 与交线 l 的夹角弧 */}
      <AngleArc3D
        vertex={{ x: 0, y: 0, z: 0 }}
        dirA={{ x: 0, y: 1, z: 0 }}
        dirB={{ x: 0, y: state.aDir.y, z: state.aDir.z }}
        radius={0.7}
        colorKey={state.isPerpToAlpha ? "highlight" : "paramSecondary"}
      />
    </>
  );
};
